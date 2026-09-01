// Smart Pet Agent Desktop App — Tauri Shell
// apps/desktop/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    smart_pet_desktop::tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Smart Pet Agent");
}
