#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{
    collections::HashMap,
    error::Error,
    fs::File,
    io::{Read, Write},
    str::FromStr,
    time::{Instant, SystemTime},
};

use aws_sigv4::http_request::{sign, SignableRequest, SigningParams, SigningSettings};
use http::{self, HeaderMap, HeaderName, HeaderValue};
use sha2::{Digest, Sha256};

#[derive(serde::Deserialize, Clone)]
struct RequestHeader {
    key: String,
    value: String,
}

#[derive(serde::Serialize)]
struct ResponsePayload {
    status: String,
    #[serde(rename = "headers")]
    headers: HashMap<String, Vec<String>>,
    #[serde(rename = "sizeBytes")]
    size_bytes: usize,
    #[serde(rename = "timeMs")]
    time_ms: usize,
    text: String,
}

fn convert_headers(headers: &HeaderMap<HeaderValue>) -> HashMap<String, Vec<String>> {
    let mut header_hashmap = HashMap::new();
    for (k, v) in headers {
        let k = k.as_str().to_owned();
        let v = String::from_utf8_lossy(v.as_bytes()).into_owned();
        header_hashmap.entry(k).or_insert_with(Vec::new).push(v)
    }
    header_hashmap
}

async fn send_sigv4(
    method: String,
    url: String,
    headers: Vec<RequestHeader>,
    body: String,
    access_key: String,
    secret_key: String,
    session_token: String,
    region: String,
    service: String,
) -> Result<ResponsePayload, Box<dyn Error>> {
    let mut request = http::Request::builder()
        .method(method.as_str())
        .uri(url)
        .body(body)?;

    // Add user-specified headers
    for header in headers.clone() {
        let k = HeaderName::from_str(&header.key)?;
        let v = HeaderValue::from_str(header.value.as_str())?;
        request.headers_mut().append(k, v);
    }

    // Attach sigv4 signature headers
    let signing_settings = SigningSettings::default();
    let signing_params = if session_token.len() > 0 {
        SigningParams::builder()
            .access_key(access_key.as_str())
            .secret_key(secret_key.as_str())
            .security_token(session_token.as_str())
            .region(region.as_str())
            .service_name(service.as_str())
            .time(SystemTime::now())
            .settings(signing_settings)
            .build()
            .unwrap()
    } else {
        SigningParams::builder()
            .access_key(access_key.as_str())
            .secret_key(secret_key.as_str())
            .region(region.as_str())
            .service_name(service.as_str())
            .time(SystemTime::now())
            .settings(signing_settings)
            .build()
            .unwrap()
    };
    let signable_request = SignableRequest::from(&request);
    let (signing_instructions, _signature) = sign(signable_request, &signing_params)?.into_parts();
    signing_instructions.apply_to_request(&mut request);

    // Generate payload hash header for S3
    // https://docs.aws.amazon.com/AmazonS3/latest/API/RESTCommonRequestHeaders.html
    let mut hasher = Sha256::new();
    hasher.update(request.body());
    let hash = hasher.finalize();
    let hash_str = hash
        .to_vec()
        .iter()
        .map(|b| format!("{:02x}", b).to_string())
        .collect::<Vec<String>>()
        .join("");
    request
        .headers_mut()
        .append("x-amz-content-sha256", HeaderValue::from_str(&hash_str)?);

    let client = reqwest::Client::new();
    let req = reqwest::Request::try_from(request)?;

    let start_time = Instant::now();
    let res = client.execute(req).await?;
    let end_time = Instant::now();

    let status = &res.status().to_string();
    let headers = &res.headers().clone();
    let time_ms = (end_time - start_time).as_millis() as usize;
    let text = res.text().await?.clone();
    let size_bytes = text.as_bytes().len();

    Ok(ResponsePayload {
        status: status.clone(),
        headers: convert_headers(headers),
        time_ms: time_ms,
        size_bytes: size_bytes,
        text: text,
    })
}

#[tauri::command]
async fn send_sigv4_cmd(
    method: String,
    url: String,
    headers: Vec<RequestHeader>,
    body: String,
    access_key: String,
    secret_key: String,
    session_token: String,
    region: String,
    service: String,
) -> Result<ResponsePayload, String> {
    match send_sigv4(
        method,
        url,
        headers,
        body,
        access_key,
        secret_key,
        session_token,
        region,
        service,
    )
    .await
    {
        Ok(res) => Ok(res),
        Err(err) => Err(err.to_string()),
    }
}

fn open_file(file_path: String) -> Result<String, Box<dyn Error>> {
    let mut file = File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

#[tauri::command]
fn open_file_cmd(file_path: String) -> Result<String, String> {
    match open_file(file_path) {
        Ok(res) => Ok(res),
        Err(err) => Err(err.to_string()),
    }
}

fn save_file(file_path: String, blob: String) -> Result<(), Box<dyn Error>> {
    let mut file = File::create(file_path)?;
    file.write_all(blob.as_bytes())?;
    Ok(())
}

#[tauri::command]
fn save_file_cmd(file_path: String, blob: String) -> Result<(), String> {
    match save_file(file_path, blob) {
        Ok(res) => Ok(res),
        Err(err) => Err(err.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            send_sigv4_cmd,
            open_file_cmd,
            save_file_cmd
        ])
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
