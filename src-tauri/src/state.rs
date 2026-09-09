use std::sync::Mutex;

use rusqlite::Connection;
use zeroize::Zeroizing;

/// The 32-byte Data Encryption Key, held only while the vault is unlocked.
/// Wrapped in `Zeroizing` so it's wiped from memory the moment it's dropped
/// (on lock, or when the app state itself is torn down).
pub struct VaultKey(pub Zeroizing<[u8; 32]>);

pub struct AppState {
    pub db: Mutex<Connection>,
    pub vault_key: Mutex<Option<VaultKey>>,
}
