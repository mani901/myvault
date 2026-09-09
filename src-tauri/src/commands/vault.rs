use tauri::State;
use zeroize::Zeroizing;

use crate::crypto;
use crate::db::{self, MetaRow};
use crate::error::AppError;
use crate::models::VaultStatus;
use crate::state::{AppState, VaultKey};

const KEYCHAIN_SERVICE: &str = "com.myvault.app.quickunlock";
const KEYCHAIN_ACCOUNT: &str = "vault";

pub fn vault_status_inner(state: &AppState) -> Result<VaultStatus, AppError> {
    let conn = state.db.lock().unwrap();
    let initialized = db::get_meta(&conn)?.is_some();
    drop(conn);
    let unlocked = state.vault_key.lock().unwrap().is_some();
    Ok(VaultStatus {
        initialized,
        unlocked,
    })
}

pub fn setup_master_password_inner(password: &str, state: &AppState) -> Result<(), AppError> {
    let conn = state.db.lock().unwrap();
    if db::get_meta(&conn)?.is_some() {
        return Err(AppError::AlreadyInitialized);
    }

    let dek = crypto::random_bytes::<{ crypto::KEY_LEN }>();
    let salt = crypto::random_bytes::<{ crypto::SALT_LEN }>();
    let kek = crypto::derive_kek(
        password,
        &salt,
        crypto::KDF_MEM_KIB,
        crypto::KDF_ITERATIONS,
        crypto::KDF_PARALLELISM,
    )?;
    let (wrapped_dek, nonce) = crypto::aead_encrypt(kek.as_ref(), &dek)?;

    db::insert_meta(
        &conn,
        &MetaRow {
            kdf_salt: salt.to_vec(),
            kdf_mem_kib: crypto::KDF_MEM_KIB,
            kdf_iterations: crypto::KDF_ITERATIONS,
            kdf_parallelism: crypto::KDF_PARALLELISM,
            wrapped_dek,
            wrapped_dek_nonce: nonce.to_vec(),
            auto_lock_minutes: 5,
            quick_unlock_enabled: false,
        },
    )?;
    drop(conn);

    *state.vault_key.lock().unwrap() = Some(VaultKey(Zeroizing::new(dek)));
    Ok(())
}

pub fn unlock_inner(password: &str, state: &AppState) -> Result<(), AppError> {
    let conn = state.db.lock().unwrap();
    let meta = db::get_meta(&conn)?.ok_or(AppError::NotInitialized)?;
    drop(conn);

    let kek = crypto::derive_kek(
        password,
        &meta.kdf_salt,
        meta.kdf_mem_kib,
        meta.kdf_iterations,
        meta.kdf_parallelism,
    )?;
    let dek_vec = crypto::aead_decrypt(kek.as_ref(), &meta.wrapped_dek_nonce, &meta.wrapped_dek)
        .map_err(|_| AppError::WrongPassword)?;
    let dek: [u8; crypto::KEY_LEN] = dek_vec
        .try_into()
        .map_err(|_| AppError::Crypto("invalid key length".into()))?;

    *state.vault_key.lock().unwrap() = Some(VaultKey(Zeroizing::new(dek)));
    Ok(())
}

pub fn lock_inner(state: &AppState) -> Result<(), AppError> {
    *state.vault_key.lock().unwrap() = None;
    Ok(())
}

pub fn change_master_password_inner(
    old_password: &str,
    new_password: &str,
    state: &AppState,
) -> Result<(), AppError> {
    let conn = state.db.lock().unwrap();
    let meta = db::get_meta(&conn)?.ok_or(AppError::NotInitialized)?;

    let old_kek = crypto::derive_kek(
        old_password,
        &meta.kdf_salt,
        meta.kdf_mem_kib,
        meta.kdf_iterations,
        meta.kdf_parallelism,
    )?;
    let dek_vec =
        crypto::aead_decrypt(old_kek.as_ref(), &meta.wrapped_dek_nonce, &meta.wrapped_dek)
            .map_err(|_| AppError::WrongPassword)?;

    let new_salt = crypto::random_bytes::<{ crypto::SALT_LEN }>();
    let new_kek = crypto::derive_kek(
        new_password,
        &new_salt,
        crypto::KDF_MEM_KIB,
        crypto::KDF_ITERATIONS,
        crypto::KDF_PARALLELISM,
    )?;
    let (wrapped_dek, nonce) = crypto::aead_encrypt(new_kek.as_ref(), &dek_vec)?;

    db::update_wrapped_dek(
        &conn,
        &new_salt,
        crypto::KDF_MEM_KIB,
        crypto::KDF_ITERATIONS,
        crypto::KDF_PARALLELISM,
        &wrapped_dek,
        &nonce,
    )?;
    drop(conn);

    let dek: [u8; crypto::KEY_LEN] = dek_vec
        .try_into()
        .map_err(|_| AppError::Crypto("invalid key length".into()))?;
    *state.vault_key.lock().unwrap() = Some(VaultKey(Zeroizing::new(dek)));
    Ok(())
}

pub fn enable_quick_unlock_inner(state: &AppState) -> Result<(), AppError> {
    let key_bytes: Zeroizing<Vec<u8>> = {
        let guard = state.vault_key.lock().unwrap();
        Zeroizing::new(guard.as_ref().ok_or(AppError::Locked)?.0.as_ref().to_vec())
    };

    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|e| AppError::Keychain(e.to_string()))?;
    entry
        .set_password(&crypto::to_hex(&key_bytes))
        .map_err(|e| AppError::Keychain(e.to_string()))?;

    let conn = state.db.lock().unwrap();
    db::set_quick_unlock_enabled(&conn, true)
}

pub fn disable_quick_unlock_inner(state: &AppState) -> Result<(), AppError> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|e| AppError::Keychain(e.to_string()))?;
    match entry.delete_credential() {
        Ok(()) => {}
        Err(keyring::Error::NoEntry) => {}
        Err(e) => return Err(AppError::Keychain(e.to_string())),
    }

    let conn = state.db.lock().unwrap();
    db::set_quick_unlock_enabled(&conn, false)
}

/// Attempts an automatic unlock via the OS keychain. Never hard-fails: any
/// problem (keychain unavailable, no entry, corrupted data) just returns
/// `Ok(false)` so the frontend falls back to the master password prompt.
pub fn try_quick_unlock_inner(state: &AppState) -> Result<bool, AppError> {
    let conn = state.db.lock().unwrap();
    let meta = match db::get_meta(&conn)? {
        Some(m) => m,
        None => return Ok(false),
    };
    drop(conn);

    if !meta.quick_unlock_enabled {
        return Ok(false);
    }

    let Ok(entry) = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT) else {
        return Ok(false);
    };
    let Ok(hex) = entry.get_password() else {
        return Ok(false);
    };
    let Ok(bytes) = crypto::from_hex(&hex) else {
        return Ok(false);
    };
    let Ok(key) = <[u8; crypto::KEY_LEN]>::try_from(bytes) else {
        return Ok(false);
    };

    *state.vault_key.lock().unwrap() = Some(VaultKey(Zeroizing::new(key)));
    Ok(true)
}

#[tauri::command]
pub fn vault_status(state: State<AppState>) -> Result<VaultStatus, AppError> {
    vault_status_inner(state.inner())
}

#[tauri::command]
pub fn setup_master_password(password: String, state: State<AppState>) -> Result<(), AppError> {
    setup_master_password_inner(&password, state.inner())
}

#[tauri::command]
pub fn unlock(password: String, state: State<AppState>) -> Result<(), AppError> {
    unlock_inner(&password, state.inner())
}

#[tauri::command]
pub fn lock(state: State<AppState>) -> Result<(), AppError> {
    lock_inner(state.inner())
}

#[tauri::command]
pub fn change_master_password(
    old_password: String,
    new_password: String,
    state: State<AppState>,
) -> Result<(), AppError> {
    change_master_password_inner(&old_password, &new_password, state.inner())
}

#[tauri::command]
pub fn enable_quick_unlock(state: State<AppState>) -> Result<(), AppError> {
    enable_quick_unlock_inner(state.inner())
}

#[tauri::command]
pub fn disable_quick_unlock(state: State<AppState>) -> Result<(), AppError> {
    disable_quick_unlock_inner(state.inner())
}

#[tauri::command]
pub fn try_quick_unlock(state: State<AppState>) -> Result<bool, AppError> {
    try_quick_unlock_inner(state.inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn test_state() -> AppState {
        let mut conn = Connection::open_in_memory().unwrap();
        crate::db::run_migrations(&mut conn).unwrap();
        AppState {
            db: Mutex::new(conn),
            vault_key: Mutex::new(None),
        }
    }

    #[test]
    fn setup_then_lock_then_unlock_round_trip() {
        let state = test_state();
        setup_master_password_inner("correct horse battery staple", &state).unwrap();
        assert!(state.vault_key.lock().unwrap().is_some());

        lock_inner(&state).unwrap();
        assert!(state.vault_key.lock().unwrap().is_none());

        unlock_inner("correct horse battery staple", &state).unwrap();
        assert!(state.vault_key.lock().unwrap().is_some());
    }

    #[test]
    fn unlock_with_wrong_password_fails_and_stays_locked() {
        let state = test_state();
        setup_master_password_inner("right-password", &state).unwrap();
        lock_inner(&state).unwrap();

        let err = unlock_inner("wrong-password", &state).unwrap_err();
        assert!(matches!(err, AppError::WrongPassword));
        assert!(state.vault_key.lock().unwrap().is_none());
    }

    #[test]
    fn setup_twice_is_rejected() {
        let state = test_state();
        setup_master_password_inner("pw", &state).unwrap();
        let err = setup_master_password_inner("pw2", &state).unwrap_err();
        assert!(matches!(err, AppError::AlreadyInitialized));
    }

    #[test]
    fn change_master_password_then_unlock_with_new_password() {
        let state = test_state();
        setup_master_password_inner("old-pw", &state).unwrap();
        change_master_password_inner("old-pw", "new-pw", &state).unwrap();
        lock_inner(&state).unwrap();

        assert!(unlock_inner("old-pw", &state).is_err());
        unlock_inner("new-pw", &state).unwrap();
    }

    #[test]
    fn vault_status_reflects_init_and_lock_state() {
        let state = test_state();
        let status = vault_status_inner(&state).unwrap();
        assert!(!status.initialized);
        assert!(!status.unlocked);

        setup_master_password_inner("pw", &state).unwrap();
        let status = vault_status_inner(&state).unwrap();
        assert!(status.initialized);
        assert!(status.unlocked);

        lock_inner(&state).unwrap();
        let status = vault_status_inner(&state).unwrap();
        assert!(status.initialized);
        assert!(!status.unlocked);
    }
}
