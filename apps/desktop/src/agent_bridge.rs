// apps/desktop/src/agent_bridge.rs
// Bridge between Tauri frontend and the agent runtime — v1 DEFERRED prototype
// v1 ships Electron only (see docs/RELEASE_CHECKLIST.md). Tauri shell remains a visual prototype until it bridges the same core runtime.

use tauri::{AppHandle, Manager};
use std::sync::Arc;
use tokio::sync::Mutex;

static AGENT_RUNNING: tokio::sync::OnceCell<()> = tokio::sync::OnceCell::const_new();

pub async fn start_agent(app_handle: AppHandle) {
    let _ = AGENT_RUNNING.get_or_init(|| async {
        println!("[Smart-Pet-Agent] Agent runtime starting...");
    }).await;
    let ah = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        ah.emit_all("agent-status", serde_json::json!({"status":"ready","provider":"nous"})).ok();
    });
}

// Tauri command: send input to agent
#[tauri::command]
pub async fn agent_speak(input: String) -> Result<String, String> {
    // Forward to agent runtime
    Err("Tauri runtime deferred for v1 — use Electron shell".to_string())
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
    Err("Tauri screen capture deferred for v1".to_string())
}

// Tauri command: get system info
#[tauri::command]
pub async fn system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "cpu": 0,
        "ram": 0, // deferred: real SystemInfo via PeripheralManager on Electron v1
        "network": true,
        "platform": std::env::consts::OS,
    }))
}
