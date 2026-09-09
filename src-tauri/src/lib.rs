use std::sync::Mutex;

use tauri::Manager;

mod commands;
mod crypto;
mod db;
mod error;
mod models;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_dir = app.path().app_data_dir()?;
            let conn = db::open(app_dir.join("vault.db"))?;

            app.manage(AppState {
                db: Mutex::new(conn),
                vault_key: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault::vault_status,
            commands::vault::setup_master_password,
            commands::vault::unlock,
            commands::vault::lock,
            commands::vault::change_master_password,
            commands::vault::enable_quick_unlock,
            commands::vault::disable_quick_unlock,
            commands::vault::try_quick_unlock,
            commands::items::list_items,
            commands::items::get_item,
            commands::items::create_item,
            commands::items::update_item,
            commands::items::delete_item,
            commands::items::item_counts,
            commands::generator::generate_password,
            commands::settings::get_settings,
            commands::settings::set_auto_lock_minutes,
            commands::system::get_os_username,
            commands::backup::export_backup,
            commands::backup::import_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
