# Ghosttyle

**Shape Ghostty your way.**

Ghosttyle is an unofficial, bilingual visual configuration studio for [Ghostty](https://ghostty.org). It runs entirely on your machine, discovers themes and fonts from the installed Ghostty application, validates changes with Ghostty itself, and can reload the running terminal through Ghostty's native AppleScript API on macOS.

> Ghosttyle is an independent community project and is not affiliated with or endorsed by the Ghostty project.

## Features

- Chinese and English interface with a persistent language switch.
- Web appearance modes: follow system, light, and dark.
- Live previews for separate light and dark Ghostty themes.
- Searchable theme gallery generated from `ghostty +list-themes`.
- Visual controls for fonts, background, cursor, and window settings.
- Raw config editor that preserves comments, keybindings, and advanced options.
- Validation through `ghostty +validate-config --config-file=...` before saving.
- Atomic writes with timestamped backups.
- “Save & Reload” through Ghostty 1.3's native AppleScript `reload_config` action.
- Localhost-only server with a per-session token for write operations.
- No third-party runtime dependencies.

## Quick start

### 1. Launch

**Option A: Portable ZIP (Recommended, no Node.js required)**  
Download the ZIP matching your Mac from [GitHub Releases](https://github.com/JoeyOnMars/ghosttyle/releases/latest), extract it, and double-click:
```text
Ghosttyle.command
```
- `macos-arm64` for Apple Silicon Macs.
- `macos-x64` for Intel Macs.  
*(Includes its own official Node.js runtime. Does not install or modify anything in your global system.)*

**Option B: From Source**  
Clone this repository and double-click `Ghosttyle.command`, or run:
```bash
npm start
```

### 2. Configure in your browser
Ghosttyle opens automatically at `http://127.0.0.1:4173`:
- Pick themes from your installed Ghostty palette, customize fonts, cursor, and window settings with live preview.
- Click **“Save & Reload”** to validate changes and instantly refresh your running Ghostty terminal via macOS AppleScript.

### 3. Exit gracefully
When you're done, simply click the **Exit** button in the top-right corner of the web page:
- Ghosttyle stops the local process and **automatically closes the launcher terminal tab/window**.
- If you ran it manually from your own shell, you can also press `Ctrl+C` to exit.

### Advanced & Tips
- **Edit a custom config path**:
  ```bash
  node server.mjs --open --config=/absolute/path/to/config.ghostty
  ```
- **Keep launcher terminal open**: Launch with `GHOSTTYLE_KEEP_TERMINAL=1` if you want to inspect startup/runtime logs after exit.
- **macOS Automation permission**: The first “Save & Reload” may trigger a permission prompt allowing the terminal to control Ghostty. Allow it under **System Settings → Privacy & Security → Automation**.
- **Restart requirement**: A few Ghostty options, including `background-opacity`, still require a full Ghostty restart to take effect.

## Development

```bash
npm run check
```

Build clean portable ZIP files with bundled official Node.js runtimes:

```bash
./scripts/build-portable-zips.sh
```

The check runs syntax validation, unit tests, i18n key parity tests, config-model tests, and a local API integration test.

---

## 中文说明

Ghosttyle 是一个非官方、支持中英文的 Ghostty 本地可视化配置器。它直接读取本机 Ghostty 的主题与字体，通过 Ghostty 官方校验器检查配置，并可在 macOS 上使用 Ghostty 1.3 原生 AppleScript API 重新加载配置。

### 主要功能

- 中文 / English 一键切换并记忆选择。
- 网页界面支持跟随系统、浅色和深色模式。
- 浅色 Ghostty 主题和深色 Ghostty 主题分别实时预览。
- 可搜索的本机主题画廊（读取自 `ghostty +list-themes`）。
- 字体、背景、光标和窗口常用设置。
- 保留注释、快捷键和高级选项的原始配置编辑器。
- 保存前由 Ghostty 自身执行配置校验。
- 原子写入和时间戳备份。
- 通过“保存并加载”直接执行 Ghostty 的 `reload_config`。
- 服务只监听 `127.0.0.1`，不会将配置上传到网络。
- 不需要安装第三方 npm 依赖。

### 快速上手

#### 1. 启动
- **绿色免安装包（推荐，无需预装 Node.js）**：  
  从 [GitHub Releases](https://github.com/JoeyOnMars/ghosttyle/releases/latest) 下载与你的 Mac 匹配的便携 ZIP（Apple Silicon 选 `macos-arm64`，Intel 选 `macos-x64`）。解压后直接双击 `Ghosttyle.command` 即可。  
  *(已内置官方 Node.js 运行时，不修改且不污染系统全局环境。)*
- **源码运行**：  
  克隆仓库后双击 `Ghosttyle.command`，或在终端运行：
  ```bash
  npm start
  ```

#### 2. 浏览器可视化配置
启动后会自动在默认浏览器打开 `http://127.0.0.1:4173`：
- 在网页界面中直观浏览主题画廊、微调字体与显示样式，实时查看终端视觉效果。
- 点击**“保存并加载”**，配置会自动通过语法校验写入，并利用 macOS AppleScript 驱动 Ghostty 立即生效。

#### 3. 优雅退出
配置完成后，直接点击网页右上角的**“退出”**按钮：
- Ghosttyle 会停止本地服务，并**自动关闭启动时弹出的终端窗口**，体验干净利落。
- 在个人终端手动启动的用户，也可随时按 `Ctrl + C` 退出。

#### 高级技巧与注意事项
- **指定配置文件**：
  ```bash
  node server.mjs --open --config=/absolute/path/to/config.ghostty
  ```
- **保留启动窗口**：如需在退出后保留终端窗口查看运行日志，可在启动前设置环境变量 `GHOSTTYLE_KEEP_TERMINAL=1`。
- **macOS 自动化权限**：首次使用“保存并加载”时，系统可能询问是否允许终端控制 Ghostty，请勾选“允许”（若误点拒绝，可在 **系统设置 → 隐私与安全性 → 自动化** 中重新开启）。
- **部分配置需重启**：`background-opacity`（背景透明度）等少数 Ghostty 底层参数仍需完全重启 Ghostty 才能生效。
