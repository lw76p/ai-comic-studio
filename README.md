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
   git clone https://github.com/lw76p/ai-comic-studio.git
   cd ai-comic-studio
   ```
3. 安装依赖
   ```bash
   npm install
   ```
4. 生成应用图标（首次需要）
   - 先生成占位图（紫底 PNG，保存到仓库根 `app-icon.png`）：
   ```bash
   node tools/gen-icon.js
   ```
   - 再用 Tauri 生成各平台图标集（写入 `src-tauri/icons/`）：
   ```bash
   npx tauri icon app-icon.png
   ```
   > 也可自备一张 512×512 的 PNG 直接命名 `app-icon.png` 替换，跳过第一步。
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

## 自动构建与发布（GitHub Actions）

仓库已内置 `.github/workflows/release.yml`：推送 `v*` 标签即自动为 Windows / macOS / Linux 构建安装包并发布到 GitHub Releases（草稿态）。

```bash
git tag v0.1.0
git push origin v0.1.0
```

构建完成后到仓库 **Releases** 页面把草稿发布即可，把安装包链接发给用户。GitHub 免费账户即可使用，无需自建构建机。

### 发版流程（每次发新版本）

1. 改版本号：`package.json` 与 `src-tauri/tauri.conf.json` 里的 `version` 保持一致（如 `0.1.0` → `0.1.1`）。
2. 提交并推送：
   ```bash
   git add -A && git commit -m "release: v0.1.1"
   git push origin main
   ```
3. 打标签并推送（标签名必须以 `v` 开头，才匹配工作流的 `v*` 规则）：
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```
4. 到仓库 **Actions** 等构建完成（约 5 分钟），再到 **Releases** 找到草稿，点 **Publish release** 对外发布。

> 注意：标签必须在工作流文件已推送到 `main` 之后再打，否则不会触发构建。

## 技术栈

- Tauri v2（桌面壳）
- 原生 HTML / CSS / JS（零前端构建）
- SheetJS（Excel 解析，已本地打包于 `src/vendor/`，离线可用、无外网依赖）
- Canvas（拼图）
- 你配置的任意 OpenAI 兼容 LLM / 生图 API

## 许可证

[MIT](./LICENSE)
