#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{error::Error, str::FromStr, time::SystemTime};

use aws_sigv4::http_request::{sign, SignableRequest, SigningParams, SigningSettings};
use http::{self, HeaderName, HeaderValue};
use sha2::{Digest, Sha256};

#[derive(serde::Deserialize, Clone)]
struct RequestHeader {
    key: String,
    value: String,
}

#[derive(serde::Serialize)]
struct ResponsePayload {
    text: String,
    status: String,
}

// dummy greet command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn send_sigv4(
    method: String,
    url: String,
    headers: Vec<RequestHeader>,
    access_key: String,
    secret_key: String,
    region: String,
    service: String,
) -> Result<ResponsePayload, Box<dyn Error>> {
    let mut request = http::Request::builder()
        .method(method.as_str())
        .uri(url)
        .body("")?;

    // Attach sigv4 signature headers
    let signing_settings = SigningSettings::default();
    let signing_params = SigningParams::builder()
        .access_key(access_key.as_str())
        .secret_key(secret_key.as_str())
        .region(region.as_str())
        .service_name(service.as_str())
        .time(SystemTime::now())
        .settings(signing_settings)
        .build()
        .unwrap();
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

    // Add user-specified headers
    for header in headers.clone() {
        let k = HeaderName::from_str(&header.key)?;
        let v = HeaderValue::from_str(header.value.as_str())?;
        request.headers_mut().append(k, v);
    }

    let client = reqwest::blocking::Client::new();
    let req = reqwest::blocking::Request::try_from(request)?;
    let res = client.execute(req)?;
    let status = &res.status().to_string();
    let text = res.text()?.clone();
    Ok(ResponsePayload {
        text: text,
        status: status.clone(),
    })
}

#[tauri::command]
fn send_request(
    method: String,
    url: String,
    headers: Vec<RequestHeader>,
    access_key: String,
    secret_key: String,
    region: String,
    service: String,
) -> Result<ResponsePayload, String> {
    match send_sigv4(
        method, url, headers, access_key, secret_key, region, service,
    ) {
        Ok(text) => Ok(text),
        Err(err) => Err(err.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, send_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
