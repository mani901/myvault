use rand::rngs::OsRng;
use rand::Rng;

use crate::error::AppError;
use crate::models::PasswordGenOptions;

const LOWER: &str = "abcdefghijklmnopqrstuvwxyz";
const UPPER: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS: &str = "0123456789";
const SYMBOLS: &str = "!@#$%^&*()-_=+[]{};:,.<>?";
const AMBIGUOUS: &str = "lI1O0";

pub fn generate_password_inner(options: &PasswordGenOptions) -> Result<String, AppError> {
    let mut charset = String::new();
    if options.lowercase {
        charset.push_str(LOWER);
    }
    if options.uppercase {
        charset.push_str(UPPER);
    }
    if options.digits {
        charset.push_str(DIGITS);
    }
    if options.symbols {
        charset.push_str(SYMBOLS);
    }
    if charset.is_empty() {
        return Err(AppError::InvalidInput(
            "select at least one character class".into(),
        ));
    }

    let chars: Vec<char> = if options.exclude_ambiguous {
        charset
            .chars()
            .filter(|c| !AMBIGUOUS.contains(*c))
            .collect()
    } else {
        charset.chars().collect()
    };
    if chars.is_empty() {
        return Err(AppError::InvalidInput(
            "no characters available after exclusions".into(),
        ));
    }

    let length = options.length.clamp(4, 128);
    let mut rng = OsRng;
    let password: String = (0..length)
        .map(|_| chars[rng.gen_range(0..chars.len())])
        .collect();
    Ok(password)
}

#[tauri::command]
pub fn generate_password(options: PasswordGenOptions) -> Result<String, AppError> {
    generate_password_inner(&options)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn options(overrides: impl FnOnce(&mut PasswordGenOptions)) -> PasswordGenOptions {
        let mut opts = PasswordGenOptions {
            length: 16,
            uppercase: true,
            lowercase: true,
            digits: true,
            symbols: true,
            exclude_ambiguous: false,
        };
        overrides(&mut opts);
        opts
    }

    #[test]
    fn generates_requested_length() {
        let pw = generate_password_inner(&options(|_| {})).unwrap();
        assert_eq!(pw.chars().count(), 16);
    }

    #[test]
    fn no_character_classes_is_rejected() {
        let opts = options(|o| {
            o.uppercase = false;
            o.lowercase = false;
            o.digits = false;
            o.symbols = false;
        });
        assert!(generate_password_inner(&opts).is_err());
    }

    #[test]
    fn excludes_ambiguous_characters_when_requested() {
        let opts = options(|o| {
            o.exclude_ambiguous = true;
            o.length = 200;
            o.symbols = false;
        });
        let pw = generate_password_inner(&opts).unwrap();
        assert!(!pw.chars().any(|c| AMBIGUOUS.contains(c)));
    }

    #[test]
    fn length_is_clamped_to_reasonable_bounds() {
        let pw = generate_password_inner(&options(|o| o.length = 2)).unwrap();
        assert_eq!(pw.chars().count(), 4);
    }
}
