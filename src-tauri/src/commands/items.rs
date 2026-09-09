use std::collections::HashMap;

use tauri::State;
use uuid::Uuid;

use crate::crypto;
use crate::db;
use crate::error::AppError;
use crate::models::{ItemDto, ItemPayload};
use crate::state::AppState;

fn require_key(state: &AppState) -> Result<[u8; crypto::KEY_LEN], AppError> {
    let guard = state.vault_key.lock().unwrap();
    let key = guard.as_ref().ok_or(AppError::Locked)?;
    Ok(*key.0)
}

fn decrypt_row(key: &[u8], nonce: &[u8], ciphertext: &[u8]) -> Result<ItemPayload, AppError> {
    let plaintext = crypto::aead_decrypt(key, nonce, ciphertext)?;
    Ok(serde_json::from_slice(&plaintext)?)
}

fn encrypt_payload(key: &[u8], payload: &ItemPayload) -> Result<(Vec<u8>, Vec<u8>), AppError> {
    let plaintext = serde_json::to_vec(payload)?;
    let (ciphertext, nonce) = crypto::aead_encrypt(key, &plaintext)?;
    Ok((ciphertext, nonce.to_vec()))
}

fn now_millis() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

fn payload_matches(payload: &ItemPayload, needle: &str) -> bool {
    let haystack = match payload {
        ItemPayload::Password {
            title,
            username,
            url,
            ..
        } => format!("{title} {username} {url}"),
        ItemPayload::Bookmark { title, url, tags } => {
            format!("{title} {url} {}", tags.join(" "))
        }
        ItemPayload::ApiKey {
            title,
            service_name,
            environment,
            ..
        } => format!("{title} {service_name} {environment}"),
        ItemPayload::Note { title, .. } => title.clone(),
        ItemPayload::Other { title, .. } => title.clone(),
    };
    haystack.to_lowercase().contains(needle)
}

pub fn list_items_inner(
    kind: Option<&str>,
    query: Option<&str>,
    state: &AppState,
) -> Result<Vec<ItemDto>, AppError> {
    let key = require_key(state)?;
    let conn = state.db.lock().unwrap();
    let rows = db::list_item_rows(&conn, kind)?;
    drop(conn);

    let needle = query.map(|q| q.to_lowercase());
    let mut out = Vec::new();
    for row in rows {
        let payload = decrypt_row(&key, &row.nonce, &row.ciphertext)?;
        if let Some(ref n) = needle {
            if !n.is_empty() && !payload_matches(&payload, n) {
                continue;
            }
        }
        out.push(ItemDto {
            id: row.id,
            favorite: row.favorite,
            created_at: row.created_at,
            updated_at: row.updated_at,
            payload,
        });
    }
    Ok(out)
}

pub fn get_item_inner(id: &str, state: &AppState) -> Result<ItemDto, AppError> {
    let key = require_key(state)?;
    let conn = state.db.lock().unwrap();
    let row = db::get_item_row(&conn, id)?.ok_or(AppError::NotFound)?;
    drop(conn);
    let payload = decrypt_row(&key, &row.nonce, &row.ciphertext)?;
    Ok(ItemDto {
        id: row.id,
        favorite: row.favorite,
        created_at: row.created_at,
        updated_at: row.updated_at,
        payload,
    })
}

pub fn create_item_inner(payload: ItemPayload, state: &AppState) -> Result<ItemDto, AppError> {
    let key = require_key(state)?;
    let (ciphertext, nonce) = encrypt_payload(&key, &payload)?;
    let id = Uuid::new_v4().to_string();
    let now = now_millis();
    let conn = state.db.lock().unwrap();
    db::insert_item_row(&conn, &id, payload.kind(), &ciphertext, &nonce, now)?;
    Ok(ItemDto {
        id,
        favorite: false,
        created_at: now,
        updated_at: now,
        payload,
    })
}

pub fn update_item_inner(
    id: &str,
    payload: ItemPayload,
    state: &AppState,
) -> Result<ItemDto, AppError> {
    let key = require_key(state)?;
    let (ciphertext, nonce) = encrypt_payload(&key, &payload)?;
    let now = now_millis();
    let conn = state.db.lock().unwrap();
    let existing = db::get_item_row(&conn, id)?.ok_or(AppError::NotFound)?;
    db::update_item_row(&conn, id, payload.kind(), &ciphertext, &nonce, now)?;
    Ok(ItemDto {
        id: id.to_string(),
        favorite: existing.favorite,
        created_at: existing.created_at,
        updated_at: now,
        payload,
    })
}

pub fn delete_item_inner(id: &str, state: &AppState) -> Result<(), AppError> {
    // Deletion doesn't need the key itself, but requiring unlock stops a
    // locked (key-less) renderer session from mutating vault contents.
    require_key(state)?;
    let conn = state.db.lock().unwrap();
    db::delete_item_row(&conn, id)
}

pub fn item_counts_inner(state: &AppState) -> Result<HashMap<String, i64>, AppError> {
    require_key(state)?;
    let conn = state.db.lock().unwrap();
    db::item_counts(&conn)
}

#[tauri::command]
pub fn list_items(
    kind: Option<String>,
    query: Option<String>,
    state: State<AppState>,
) -> Result<Vec<ItemDto>, AppError> {
    list_items_inner(kind.as_deref(), query.as_deref(), state.inner())
}

#[tauri::command]
pub fn get_item(id: String, state: State<AppState>) -> Result<ItemDto, AppError> {
    get_item_inner(&id, state.inner())
}

#[tauri::command]
pub fn create_item(payload: ItemPayload, state: State<AppState>) -> Result<ItemDto, AppError> {
    create_item_inner(payload, state.inner())
}

#[tauri::command]
pub fn update_item(
    id: String,
    payload: ItemPayload,
    state: State<AppState>,
) -> Result<ItemDto, AppError> {
    update_item_inner(&id, payload, state.inner())
}

#[tauri::command]
pub fn delete_item(id: String, state: State<AppState>) -> Result<(), AppError> {
    delete_item_inner(&id, state.inner())
}

#[tauri::command]
pub fn item_counts(state: State<AppState>) -> Result<HashMap<String, i64>, AppError> {
    item_counts_inner(state.inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::commands::vault::{lock_inner, setup_master_password_inner};
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn test_state() -> AppState {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::db::run_migrations(&mut conn).unwrap();
        let state = AppState {
            db: Mutex::new(conn),
            vault_key: Mutex::new(None),
        };
        setup_master_password_inner("test-password", &state).unwrap();
        state
    }

    fn sample_password_payload(title: &str) -> ItemPayload {
        ItemPayload::Password {
            title: title.to_string(),
            username: "alice".into(),
            password: "s3cr3t".into(),
            url: "https://example.com".into(),
            notes: String::new(),
        }
    }

    #[test]
    fn create_then_get_round_trip() {
        let state = test_state();
        let created = create_item_inner(sample_password_payload("GitHub"), &state).unwrap();
        let fetched = get_item_inner(&created.id, &state).unwrap();
        match fetched.payload {
            ItemPayload::Password { title, .. } => assert_eq!(title, "GitHub"),
            _ => panic!("wrong kind"),
        }
    }

    #[test]
    fn list_items_requires_unlock() {
        let state = test_state();
        lock_inner(&state).unwrap();
        let err = list_items_inner(None, None, &state).unwrap_err();
        assert!(matches!(err, AppError::Locked));
    }

    #[test]
    fn search_filters_by_title() {
        let state = test_state();
        create_item_inner(sample_password_payload("GitHub"), &state).unwrap();
        create_item_inner(sample_password_payload("AWS Console"), &state).unwrap();

        let results = list_items_inner(None, Some("github"), &state).unwrap();
        assert_eq!(results.len(), 1);
    }

    #[test]
    fn update_and_delete() {
        let state = test_state();
        let created = create_item_inner(sample_password_payload("Old"), &state).unwrap();
        let updated =
            update_item_inner(&created.id, sample_password_payload("New"), &state).unwrap();
        match updated.payload {
            ItemPayload::Password { title, .. } => assert_eq!(title, "New"),
            _ => panic!("wrong kind"),
        }

        delete_item_inner(&created.id, &state).unwrap();
        assert!(matches!(
            get_item_inner(&created.id, &state).unwrap_err(),
            AppError::NotFound
        ));
    }

    #[test]
    fn item_counts_group_by_kind() {
        let state = test_state();
        create_item_inner(sample_password_payload("A"), &state).unwrap();
        create_item_inner(sample_password_payload("B"), &state).unwrap();
        create_item_inner(
            ItemPayload::Note {
                title: "Note".into(),
                body: "body".into(),
            },
            &state,
        )
        .unwrap();

        let counts = item_counts_inner(&state).unwrap();
        assert_eq!(counts.get("password"), Some(&2));
        assert_eq!(counts.get("note"), Some(&1));
    }
}
