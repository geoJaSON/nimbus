use serde::Serialize;

#[derive(Serialize)]
pub struct Location {
    pub lat: f64,
    pub lon: f64,
    pub source: String,
}

/// Returns the user's approximate location.
/// On desktop Tauri doesn't expose the Geolocation API directly — the frontend
/// uses navigator.geolocation. This command is a fallback that returns a
/// hardcoded default (Houston) when called from Rust contexts.
#[tauri::command]
pub async fn get_location() -> Result<Location, String> {
    Ok(Location {
        lat: 29.76,
        lon: -95.37,
        source: "default".to_string(),
    })
}
