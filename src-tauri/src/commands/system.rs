/// Reads the OS account name purely for display personalization (e.g. "Hello,
/// <name>"). Never stored, never used for anything security-relevant.
#[tauri::command]
pub fn get_os_username() -> Option<String> {
    std::env::var("USERNAME")
        .or_else(|_| std::env::var("USER"))
        .ok()
}
