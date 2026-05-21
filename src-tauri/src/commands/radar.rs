use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RadarStation {
    pub id: String,
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub elevation_m: i32,
    #[serde(rename = "stationType")]
    pub station_type: String,
}

/// Returns the bundled list of NEXRAD stations embedded at compile time.
#[tauri::command]
pub async fn get_radar_stations() -> Result<Vec<RadarStation>, String> {
    let json = include_str!("../../../data/stations.json");
    serde_json::from_str(json).map_err(|e| e.to_string())
}
