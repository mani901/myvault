use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ItemPayload {
    Password {
        title: String,
        username: String,
        password: String,
        url: String,
        notes: String,
    },
    Bookmark {
        title: String,
        url: String,
        tags: Vec<String>,
    },
    ApiKey {
        title: String,
        service_name: String,
        key_value: String,
        secret: Option<String>,
        environment: String,
    },
    Note {
        title: String,
        body: String,
    },
    Other {
        title: String,
        fields: Vec<(String, String)>,
        notes: Option<String>,
    },
}

impl ItemPayload {
    pub fn kind(&self) -> &'static str {
        match self {
            ItemPayload::Password { .. } => "password",
            ItemPayload::Bookmark { .. } => "bookmark",
            ItemPayload::ApiKey { .. } => "api_key",
            ItemPayload::Note { .. } => "note",
            ItemPayload::Other { .. } => "other",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemDto {
    pub id: String,
    pub favorite: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub payload: ItemPayload,
}

#[derive(Debug, Clone, Serialize)]
pub struct VaultStatus {
    pub initialized: bool,
    pub unlocked: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PasswordGenOptions {
    pub length: usize,
    pub uppercase: bool,
    pub lowercase: bool,
    pub digits: bool,
    pub symbols: bool,
    pub exclude_ambiguous: bool,
}
