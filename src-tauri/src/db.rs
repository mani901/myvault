use std::collections::HashMap;
use std::path::PathBuf;

use rusqlite::{params, Connection, OptionalExtension};
use rusqlite_migration::{Migrations, M};

use crate::error::AppError;

pub struct MetaRow {
    pub kdf_salt: Vec<u8>,
    pub kdf_mem_kib: u32,
    pub kdf_iterations: u32,
    pub kdf_parallelism: u32,
    pub wrapped_dek: Vec<u8>,
    pub wrapped_dek_nonce: Vec<u8>,
    pub auto_lock_minutes: i64,
    pub quick_unlock_enabled: bool,
}

pub struct ItemRow {
    pub id: String,
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub favorite: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

pub fn open(db_path: PathBuf) -> Result<Connection, AppError> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::Io(e.to_string()))?;
    }
    let mut conn = Connection::open(db_path)?;
    run_migrations(&mut conn)?;
    Ok(conn)
}

pub fn run_migrations(conn: &mut Connection) -> Result<(), AppError> {
    let migrations = Migrations::new(vec![M::up(include_str!("../migrations/0001_init.sql"))]);
    migrations
        .to_latest(conn)
        .map_err(|e| AppError::Database(e.to_string()))
}

pub fn get_meta(conn: &Connection) -> Result<Option<MetaRow>, AppError> {
    conn.query_row(
        "SELECT kdf_salt, kdf_mem_kib, kdf_iterations, kdf_parallelism, wrapped_dek, \
         wrapped_dek_nonce, auto_lock_minutes, quick_unlock_enabled FROM meta WHERE id = 1",
        [],
        |row| {
            Ok(MetaRow {
                kdf_salt: row.get(0)?,
                kdf_mem_kib: row.get(1)?,
                kdf_iterations: row.get(2)?,
                kdf_parallelism: row.get(3)?,
                wrapped_dek: row.get(4)?,
                wrapped_dek_nonce: row.get(5)?,
                auto_lock_minutes: row.get(6)?,
                quick_unlock_enabled: row.get::<_, i64>(7)? != 0,
            })
        },
    )
    .optional()
    .map_err(AppError::from)
}

pub fn insert_meta(conn: &Connection, row: &MetaRow) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO meta (id, kdf_salt, kdf_mem_kib, kdf_iterations, kdf_parallelism, \
         wrapped_dek, wrapped_dek_nonce, schema_version, auto_lock_minutes, quick_unlock_enabled) \
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)",
        params![
            row.kdf_salt,
            row.kdf_mem_kib,
            row.kdf_iterations,
            row.kdf_parallelism,
            row.wrapped_dek,
            row.wrapped_dek_nonce,
            row.auto_lock_minutes,
            row.quick_unlock_enabled as i64,
        ],
    )?;
    Ok(())
}

pub fn update_wrapped_dek(
    conn: &Connection,
    salt: &[u8],
    mem_kib: u32,
    iterations: u32,
    parallelism: u32,
    wrapped_dek: &[u8],
    nonce: &[u8],
) -> Result<(), AppError> {
    conn.execute(
        "UPDATE meta SET kdf_salt = ?1, kdf_mem_kib = ?2, kdf_iterations = ?3, \
         kdf_parallelism = ?4, wrapped_dek = ?5, wrapped_dek_nonce = ?6 WHERE id = 1",
        params![salt, mem_kib, iterations, parallelism, wrapped_dek, nonce],
    )?;
    Ok(())
}

pub fn set_quick_unlock_enabled(conn: &Connection, enabled: bool) -> Result<(), AppError> {
    conn.execute(
        "UPDATE meta SET quick_unlock_enabled = ?1 WHERE id = 1",
        params![enabled as i64],
    )?;
    Ok(())
}

fn map_item_row(row: &rusqlite::Row) -> rusqlite::Result<ItemRow> {
    Ok(ItemRow {
        id: row.get(0)?,
        ciphertext: row.get(1)?,
        nonce: row.get(2)?,
        favorite: row.get::<_, i64>(3)? != 0,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

pub fn list_item_rows(conn: &Connection, kind: Option<&str>) -> Result<Vec<ItemRow>, AppError> {
    let rows = if let Some(k) = kind {
        let mut stmt = conn.prepare(
            "SELECT id, ciphertext, nonce, favorite, created_at, updated_at FROM items \
             WHERE kind = ?1 ORDER BY updated_at DESC",
        )?;
        let rows = stmt
            .query_map(params![k], map_item_row)?
            .collect::<Result<Vec<_>, _>>()?;
        rows
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, ciphertext, nonce, favorite, created_at, updated_at FROM items \
             ORDER BY updated_at DESC",
        )?;
        let rows = stmt
            .query_map([], map_item_row)?
            .collect::<Result<Vec<_>, _>>()?;
        rows
    };
    Ok(rows)
}

pub fn get_item_row(conn: &Connection, id: &str) -> Result<Option<ItemRow>, AppError> {
    conn.query_row(
        "SELECT id, ciphertext, nonce, favorite, created_at, updated_at FROM items WHERE id = ?1",
        params![id],
        map_item_row,
    )
    .optional()
    .map_err(AppError::from)
}

pub fn insert_item_row(
    conn: &Connection,
    id: &str,
    kind: &str,
    ciphertext: &[u8],
    nonce: &[u8],
    now: i64,
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO items (id, kind, ciphertext, nonce, favorite, created_at, updated_at) \
         VALUES (?1, ?2, ?3, ?4, 0, ?5, ?5)",
        params![id, kind, ciphertext, nonce, now],
    )?;
    Ok(())
}

pub fn update_item_row(
    conn: &Connection,
    id: &str,
    kind: &str,
    ciphertext: &[u8],
    nonce: &[u8],
    now: i64,
) -> Result<(), AppError> {
    let changed = conn.execute(
        "UPDATE items SET kind = ?2, ciphertext = ?3, nonce = ?4, updated_at = ?5 WHERE id = ?1",
        params![id, kind, ciphertext, nonce, now],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub fn delete_item_row(conn: &Connection, id: &str) -> Result<(), AppError> {
    let changed = conn.execute("DELETE FROM items WHERE id = ?1", params![id])?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub fn item_counts(conn: &Connection) -> Result<HashMap<String, i64>, AppError> {
    let mut stmt = conn.prepare("SELECT kind, COUNT(*) FROM items GROUP BY kind")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    })?;
    let mut out = HashMap::new();
    for r in rows {
        let (k, c) = r?;
        out.insert(k, c);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_are_idempotent() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        run_migrations(&mut conn).unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM items", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn meta_round_trip() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        assert!(get_meta(&conn).unwrap().is_none());

        insert_meta(
            &conn,
            &MetaRow {
                kdf_salt: vec![1, 2, 3],
                kdf_mem_kib: 1024,
                kdf_iterations: 1,
                kdf_parallelism: 1,
                wrapped_dek: vec![4, 5, 6],
                wrapped_dek_nonce: vec![7, 8, 9],
                auto_lock_minutes: 5,
                quick_unlock_enabled: false,
            },
        )
        .unwrap();

        let meta = get_meta(&conn).unwrap().unwrap();
        assert_eq!(meta.kdf_salt, vec![1, 2, 3]);
        assert!(!meta.quick_unlock_enabled);

        set_quick_unlock_enabled(&conn, true).unwrap();
        assert!(get_meta(&conn).unwrap().unwrap().quick_unlock_enabled);
    }

    #[test]
    fn item_crud_row_level() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        insert_item_row(&conn, "id1", "password", b"cipher", b"nonce", 100).unwrap();
        let row = get_item_row(&conn, "id1").unwrap().unwrap();
        assert_eq!(row.ciphertext, b"cipher");

        update_item_row(&conn, "id1", "password", b"cipher2", b"nonce2", 200).unwrap();
        let row2 = get_item_row(&conn, "id1").unwrap().unwrap();
        assert_eq!(row2.updated_at, 200);

        delete_item_row(&conn, "id1").unwrap();
        assert!(get_item_row(&conn, "id1").unwrap().is_none());
    }
}
