mod commands;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_local_ip
        ])
        .run(tauri::generate_context!())
        .expect("error running app");
}