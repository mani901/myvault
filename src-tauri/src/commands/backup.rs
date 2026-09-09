use std::path::Path;
use std::time::Duration;

use rusqlite::backup::Backup;
use rusqlite::Connection;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

/// Copies the live, still-encrypted vault database to `destination` using
/// SQLite's Online Backup API, which snapshots consistently even while the
/// app holds the source connection open (unlike a raw file copy).
pub fn export_backup_inner(destination: &str, state: &AppState) -> Result<(), AppError> {
    let conn = state.db.lock().unwrap();
    let mut dest_conn = Connection::open(destination)?;
    let backup = Backup::new(&conn, &mut dest_conn)?;
    backup.run_to_completion(5, Duration::from_millis(50), None)?;
    Ok(())
}

/// Restores the vault database from `source`, replacing all current data.
/// The in-memory DEK is cleared afterward since it may no longer match the
/// restored file's wrapped key — the frontend must re-unlock.
pub fn import_backup_inner(source: &str, state: &AppState) -> Result<(), AppError> {
    let source_path = Path::new(source);
    if !source_path.exists() {
        return Err(AppError::InvalidInput("backup file not found".into()));
    }

    let source_conn = Connection::open(source_path)?;
    validate_backup(&source_conn)?;

    let mut conn = state.db.lock().unwrap();
    {
        let backup = Backup::new(&source_conn, &mut conn)?;
        backup.run_to_completion(5, Duration::from_millis(50), None)?;
    }
    drop(conn);

    *state.vault_key.lock().unwrap() = None;
    Ok(())
}

fn validate_backup(conn: &Connection) -> Result<(), AppError> {
    let has_meta: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'meta'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|count| count > 0)
        .unwrap_or(false);

    if !has_meta {
        return Err(AppError::InvalidInput(
            "not a valid MyVault backup file".into(),
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn export_backup(destination: String, state: State<AppState>) -> Result<(), AppError> {
    export_backup_inner(&destination, state.inner())
}

#[tauri::command]
pub fn import_backup(source: String, state: State<AppState>) -> Result<(), AppError> {
    import_backup_inner(&source, state.inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::items::{create_item_inner, list_items_inner};
    use crate::commands::vault::{setup_master_password_inner, unlock_inner};
    use crate::models::ItemPayload;
    use std::sync::Mutex;

    fn test_state() -> AppState {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::db::run_migrations(&mut conn).unwrap();
        AppState {
            db: Mutex::new(conn),
            vault_key: Mutex::new(None),
        }
    }

    fn temp_backup_path(label: &str) -> String {
        std::env::temp_dir()
            .join(format!("myvault-test-{label}-{}.db", uuid::Uuid::new_v4()))
            .to_string_lossy()
            .into_owned()
    }

    #[test]
    fn export_then_import_round_trip() {
        let state = test_state();
        setup_master_password_inner("pw", &state).unwrap();
        create_item_inner(
            ItemPayload::Note {
                title: "Hello".into(),
                body: "World".into(),
            },
            &state,
        )
        .unwrap();

        let backup_path = temp_backup_path("export");
        export_backup_inner(&backup_path, &state).unwrap();

        let fresh_state = test_state();
        import_backup_inner(&backup_path, &fresh_state).unwrap();

        // The restored vault's key differs from whatever was in memory
        // before, so the caller must re-unlock.
        assert!(fresh_state.vault_key.lock().unwrap().is_none());
        unlock_inner("pw", &fresh_state).unwrap();

        let items = list_items_inner(None, None, &fresh_state).unwrap();
        assert_eq!(items.len(), 1);

        std::fs::remove_file(&backup_path).ok();
    }

    #[test]
    fn import_rejects_invalid_file() {
        let state = test_state();
        setup_master_password_inner("pw", &state).unwrap();

        let bogus_path = temp_backup_path("bogus");
        Connection::open(&bogus_path).unwrap(); // valid sqlite file, no `meta` table

        let err = import_backup_inner(&bogus_path, &state).unwrap_err();
        assert!(matches!(err, AppError::InvalidInput(_)));

        std::fs::remove_file(&bogus_path).ok();
    }

    #[test]
    fn import_rejects_missing_file() {
        let state = test_state();
        setup_master_password_inner("pw", &state).unwrap();

        let missing_path = temp_backup_path("missing");
        let err = import_backup_inner(&missing_path, &state).unwrap_err();
        assert!(matches!(err, AppError::InvalidInput(_)));
    }
}
