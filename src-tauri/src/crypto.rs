use aes_gcm::aead::{Aead, Nonce as AeadNonce};
use aes_gcm::{Aes256Gcm, KeyInit};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::rngs::OsRng;
use rand::RngCore;
use zeroize::Zeroizing;

use crate::error::AppError;

type CipherNonce = AeadNonce<Aes256Gcm>;

pub const SALT_LEN: usize = 16;
pub const NONCE_LEN: usize = 12;
pub const KEY_LEN: usize = 32;

pub const KDF_MEM_KIB: u32 = 64 * 1024; // 64 MiB
pub const KDF_ITERATIONS: u32 = 3;
pub const KDF_PARALLELISM: u32 = 4;

/// Fills an array of N bytes from the OS CSPRNG. Used for salts, nonces,
/// and the DEK itself — never `Math.random`-equivalents.
pub fn random_bytes<const N: usize>() -> [u8; N] {
    let mut buf = [0u8; N];
    OsRng.fill_bytes(&mut buf);
    buf
}

/// Derives a Key-Encryption-Key from the master password via Argon2id.
pub fn derive_kek(
    password: &str,
    salt: &[u8],
    mem_kib: u32,
    iterations: u32,
    parallelism: u32,
) -> Result<Zeroizing<[u8; KEY_LEN]>, AppError> {
    let params = Params::new(mem_kib, iterations, parallelism, Some(KEY_LEN))
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut out = Zeroizing::new([0u8; KEY_LEN]);
    argon2
        .hash_password_into(password.as_bytes(), salt, out.as_mut())
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    Ok(out)
}

/// AES-256-GCM encrypt with a fresh random nonce. Returns (ciphertext, nonce).
pub fn aead_encrypt(key: &[u8], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; NONCE_LEN]), AppError> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| AppError::Crypto(e.to_string()))?;
    let nonce_bytes = random_bytes::<NONCE_LEN>();
    let nonce = CipherNonce::try_from(nonce_bytes.as_slice())
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    Ok((ciphertext, nonce_bytes))
}

/// AES-256-GCM decrypt. Fails (AEAD tag mismatch) on wrong key or corrupted
/// data — callers that use this as a password verifier (unlock) should map
/// the error to `AppError::WrongPassword` themselves.
pub fn aead_decrypt(key: &[u8], nonce: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, AppError> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| AppError::Crypto(e.to_string()))?;
    let nonce = CipherNonce::try_from(nonce).map_err(|e| AppError::Crypto(e.to_string()))?;
    cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| AppError::Crypto("decryption failed".into()))
}

pub fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn from_hex(s: &str) -> Result<Vec<u8>, AppError> {
    if s.len() % 2 != 0 {
        return Err(AppError::Crypto("invalid hex length".into()));
    }
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(|e| AppError::Crypto(e.to_string())))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_round_trip() {
        let key = random_bytes::<KEY_LEN>();
        let plaintext = b"hello vault";
        let (ciphertext, nonce) = aead_encrypt(&key, plaintext).unwrap();
        let decrypted = aead_decrypt(&key, &nonce, &ciphertext).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn decrypt_with_wrong_key_fails() {
        let key = random_bytes::<KEY_LEN>();
        let other_key = random_bytes::<KEY_LEN>();
        let (ciphertext, nonce) = aead_encrypt(&key, b"secret").unwrap();
        assert!(aead_decrypt(&other_key, &nonce, &ciphertext).is_err());
    }

    #[test]
    fn kdf_is_deterministic_for_same_salt() {
        let salt = random_bytes::<SALT_LEN>();
        let k1 = derive_kek("password", &salt, 8 * 1024, 1, 1).unwrap();
        let k2 = derive_kek("password", &salt, 8 * 1024, 1, 1).unwrap();
        assert_eq!(k1.as_ref(), k2.as_ref());
    }

    #[test]
    fn kdf_differs_for_different_passwords() {
        let salt = random_bytes::<SALT_LEN>();
        let k1 = derive_kek("password-a", &salt, 8 * 1024, 1, 1).unwrap();
        let k2 = derive_kek("password-b", &salt, 8 * 1024, 1, 1).unwrap();
        assert_ne!(k1.as_ref(), k2.as_ref());
    }

    #[test]
    fn hex_round_trip() {
        let bytes = random_bytes::<32>();
        let hex = to_hex(&bytes);
        let decoded = from_hex(&hex).unwrap();
        assert_eq!(decoded, bytes.to_vec());
    }
}
