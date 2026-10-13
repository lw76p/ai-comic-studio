# AI Comic Studio

免费开源的 AI 漫画创作桌面应用。导入主题 → AI 扩写分镜 → 逐格生图 → 一键拼长图。

- 🆓 **完全免费、MIT 开源**
- 🖥️ **桌面端（Tauri）**：Windows / macOS / Linux，下载双击即用
- 🔑 **API 自选**：LLM 与生图接口由你自己配置（DeepSeek / SiliconFlow / 通义 / 即梦 / 本地 SD 等均可）
- 🔒 **数据自管**：程序不收集任何信息，配置仅存你本机

> 本软件只提供程序与下载，安装部署与 API 接入均由用户自行处理。

## 功能（阶段 1 MVP）

- **漫画批量创作**：导入 Excel 主题表，自动生成
  - 一题一图（单张完整画面）
  - 多格拼长条（2~20 格竖排长图，含对白气泡）
  - 多张独立图（每张独立配文）
- **画风方案管理**：内置默认画风，支持自定义画风 / 分镜 / 对白提示词
- **配置中心**：LLM 与生图 API 独立配置
- **进度可视、成品预览、一键下载、转存赛道**

## 快速开始（开发模式）

1. 准备环境
   - 安装 [Rust](https://www.rust-lang.org/)（含 cargo）
   - 安装 [Node.js 18+](https://nodejs.org/)
   - Windows 需 [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)（通常已自带）
   - macOS：`xcode-select --install`
2. 克隆仓库
   ```bash
   git clone https://github.com/<你的用户名>/ai-comic-studio.git
   cd ai-comic-studio
   ```
3. 安装依赖
   ```bash
   npm install
   ```
4. 生成应用图标（首次需要；也可自备一张 PNG 替换 `app-icon.png`）
   ```bash
   npx tauri icon app-icon.png
   ```
5. 启动开发版
   ```bash
   npm run tauri dev
   ```

## 配置 API

首次打开后进入「配置」页：

- **LLM（分镜扩写）**：填写 Base URL、API Key、模型名（如 `deepseek-chat`）。Base 通常以 `/v1` 结尾。
- **生图**：填写 Base URL、API Key、模型名、接口路径（OpenAI 兼容默认 `/v1/images/generations`；SiliconFlow 等请按官方文档填写）。
- **画风方案**：可保持默认，或自定义画风 / 分镜 / 对白提示词。

> 所有配置仅保存在你本机（localStorage），不会上传。

## 构建分发（给别人用）

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`（exe / dmg / AppImage），直接发给用户安装即可。

## 技术栈

- Tauri v2（桌面壳）
- 原生 HTML / CSS / JS（零前端构建）
- SheetJS（Excel 解析，CDN 引入）
- Canvas（拼图）
- 你配置的任意 OpenAI 兼容 LLM / 生图 API

## 许可证

[MIT](./LICENSE)
