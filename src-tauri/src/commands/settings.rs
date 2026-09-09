use serde::Serialize;
use tauri::State;

use crate::db;
use crate::error::AppError;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct SettingsDto {
    pub auto_lock_minutes: i64,
    pub quick_unlock_enabled: bool,
}

pub fn get_settings_inner(state: &AppState) -> Result<SettingsDto, AppError> {
    let conn = state.db.lock().unwrap();
    let meta = db::get_meta(&conn)?.ok_or(AppError::NotInitialized)?;
    Ok(SettingsDto {
        auto_lock_minutes: meta.auto_lock_minutes,
        quick_unlock_enabled: meta.quick_unlock_enabled,
    })
}

pub fn set_auto_lock_minutes_inner(minutes: i64, state: &AppState) -> Result<(), AppError> {
    let minutes = minutes.clamp(1, 120);
    let conn = state.db.lock().unwrap();
    db::set_auto_lock_minutes(&conn, minutes)
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<SettingsDto, AppError> {
    get_settings_inner(state.inner())
}

#[tauri::command]
pub fn set_auto_lock_minutes(minutes: i64, state: State<AppState>) -> Result<(), AppError> {
    set_auto_lock_minutes_inner(minutes, state.inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vault::setup_master_password_inner;
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn test_state() -> AppState {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::db::run_migrations(&mut conn).unwrap();
        let state = AppState {
            db: Mutex::new(conn),
            vault_key: Mutex::new(None),
        };
        setup_master_password_inner("pw", &state).unwrap();
        state
    }

    #[test]
    fn default_settings_after_setup() {
        let state = test_state();
        let settings = get_settings_inner(&state).unwrap();
        assert_eq!(settings.auto_lock_minutes, 5);
        assert!(!settings.quick_unlock_enabled);
    }

    #[test]
    fn set_auto_lock_minutes_persists_and_clamps() {
        let state = test_state();
        set_auto_lock_minutes_inner(15, &state).unwrap();
        assert_eq!(get_settings_inner(&state).unwrap().auto_lock_minutes, 15);

        set_auto_lock_minutes_inner(9999, &state).unwrap();
        assert_eq!(get_settings_inner(&state).unwrap().auto_lock_minutes, 120);
    }
}
