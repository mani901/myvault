CREATE TABLE meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  kdf_salt BLOB NOT NULL,
  kdf_mem_kib INTEGER NOT NULL,
  kdf_iterations INTEGER NOT NULL,
  kdf_parallelism INTEGER NOT NULL,
  wrapped_dek BLOB NOT NULL,
  wrapped_dek_nonce BLOB NOT NULL,
  schema_version INTEGER NOT NULL,
  auto_lock_minutes INTEGER NOT NULL DEFAULT 5,
  quick_unlock_enabled INTEGER NOT NULL DEFAULT 0
);

-- `kind` stays plaintext only for cheap category filtering/counts; it
-- reveals nothing sensitive, unlike the ciphertext payload.
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  ciphertext BLOB NOT NULL,
  nonce BLOB NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_items_kind ON items(kind);
