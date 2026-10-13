// AI Comic Studio — Tauri 入口
// 业务逻辑全部在前端（src/），Rust 端仅作桌面壳。

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
