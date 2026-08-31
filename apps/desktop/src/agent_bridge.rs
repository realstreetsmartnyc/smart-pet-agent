// apps/desktop/src/agent_bridge.rs
// Bridge between Tauri frontend and the agent runtime

use tauri::{AppHandle, Manager};
use std::sync::Arc;
use tokio::sync::Mutex;

static AGENT_RUNNING: tokio::sync::OnceCell<()> = tokio::sync::OnceCell::const_new();

pub async fn start_agent(_app_handle: AppHandle) {
    // Spawn the agent runtime as a child process or embed directly
    // For now, we'll communicate with the CLI agent via IPC
    let _ = AGENT_RUNNING.get_or_init(|| async {
        println!("[Smart-Pet-Agent] Agent runtime starting...");
    }).await;
}

// Tauri command: send input to agent
#[tauri::command]
pub async fn agent_speak(input: String) -> Result<String, String> {
    // Forward to agent runtime
    Ok(format!("Agent received: {}", input))
}

// Tauri command: get agent state
#[tauri::command]
pub async fn agent_state() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "mood": "neutral",
        "energy": 100,
        "animation": "idle"
    }))
}

// Tauri command: get available animations
#[tauri::command]
pub async fn agent_animations() -> Result<Vec<String>, String> {
    Ok(vec![
        "idle", "walk", "fly", "smile", "talk", "sleep",
        "dance", "wink", "think", "wave", "sad", "angry",
        "point", "alert", "celebrate"
    ].into_iter().map(String::from).collect())
}

// Tauri command: play animation
#[tauri::command]
pub async fn agent_play_animation(name: String) -> Result<(), String> {
    println!("[Animation] Playing: {}", name);
    Ok(())
}

// Tauri command: capture screen
#[tauri::command]
pub async fn peripheral_capture_screen() -> Result<String, String> {
    // Use tauri-plugin-fs or shell to capture
    Ok("/tmp/screenshot.png".to_string())
}

// Tauri command: get system info
#[tauri::command]
pub async fn system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "cpu": 0,
        "ram": 0,
        "network": true,
        "platform": std::env::consts::OS,
    }))
}
