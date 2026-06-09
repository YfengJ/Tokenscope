pub mod commands;
pub mod db;
pub mod models;
pub mod pricing;
pub mod scanner;

use std::sync::Mutex;

use db::Database;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")));
            std::fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("tokenscope.sqlite3");
            let db = Database::open(&db_path)?;
            app.manage(AppState { db: Mutex::new(db) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_dashboard_summary,
            commands::list_usage_events,
            commands::list_model_stats,
            commands::list_source_status,
            commands::scan_codex,
            commands::scan_claude,
            commands::preview_csv,
            commands::import_csv,
            commands::toggle_demo_data,
            commands::get_settings,
            commands::update_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running TokenScope");
}
