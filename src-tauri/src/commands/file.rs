use std::{fs, path::Path};

#[tauri::command]
pub async fn open_lottie(path: String) -> Result<String, String> {
    let file_path = Path::new(&path);
    let extension = file_path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    if extension != "json" {
        return Err("v0.1 supports opening .json Lottie files. .lottie import is planned.".into());
    }

    fs::read_to_string(file_path).map_err(|error| format!("Failed to read file: {error}"))
}

#[tauri::command]
pub async fn save_lottie(path: String, json: String, format: String) -> Result<(), String> {
    if format != "json" {
        return Err("v0.1 supports saving .json Lottie files. .lottie export is planned.".into());
    }

    let parsed: serde_json::Value =
        serde_json::from_str(&json).map_err(|error| format!("Invalid Lottie JSON: {error}"))?;
    let pretty =
        serde_json::to_string_pretty(&parsed).map_err(|error| format!("Serialize failed: {error}"))?;

    fs::write(Path::new(&path), pretty).map_err(|error| format!("Failed to save file: {error}"))
}
