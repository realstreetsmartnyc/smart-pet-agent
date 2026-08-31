// apps/desktop/src/lib.rs
use tauri::{Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};
use std::sync::Arc;
use tokio::sync::Mutex;

mod agent_bridge;

fn main() {
    // System tray with pet presence
    let tray_menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("Show Pet".to_string(), "show"))
        .add_item(SystemTrayMenuItem::new("Hide Pet".to_string(), "hide"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(SystemTrayMenuItem::new("Quit".to_string(), "quit"));

    let system_tray = SystemTray::new()
        .with_menu(tray_menu)
        .with_tooltip("Smart-Pet-Agent");

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        window.hide().unwrap();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|app| {
            // Initialize agent runtime in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                agent_bridge::start_agent(app_handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Smart-Pet-Agent");
}
