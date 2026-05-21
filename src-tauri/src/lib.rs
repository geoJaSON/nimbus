mod commands;

use commands::{location, radar};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            location::get_location,
            radar::get_radar_stations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running nimbus");
}
