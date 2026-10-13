// AI Comic Studio — Tauri 入口
// 业务逻辑全部在前端（src/），Rust 端仅作桌面壳。

fn main() {
    tauri::Builder::default()
        // 单实例锁：重复打开时只聚焦已有窗口，避免叠出多个窗口
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
