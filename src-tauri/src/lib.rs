mod commands;
mod lottie;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::file::open_lottie,
            commands::file::save_lottie
        ])
        .run(tauri::generate_context!())
        .expect("error while running LottieDa");
}
