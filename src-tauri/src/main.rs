#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{error::Error, str::FromStr};

use reqwest::Method;

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

fn send(method: String, url: String) -> Result<ResponsePayload, Box<dyn Error>> {
    let client = reqwest::blocking::Client::new();
    let req = client
        .request(Method::from_str(method.as_str())?, url)
        .build()?;
    let res = client.execute(req)?;
    let status = &res.status().to_string();
    let text = res.text()?.clone();
    Ok(ResponsePayload {
        text: text,
        status: status.clone(),
    })
}

#[tauri::command]
fn send_request(method: String, url: String) -> Result<ResponsePayload, String> {
    match send(method, url) {
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
