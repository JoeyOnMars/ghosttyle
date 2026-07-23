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

On macOS, double-click:

```text
Ghosttyle.command
```

Or run:

```bash
npm start
```

Ghosttyle opens at `http://127.0.0.1:4173`. Keep the terminal window open while using the UI; press `Ctrl+C` to stop the server.

You can also use the **Exit** button in the top-right corner to stop the local npm/Node process. When Ghosttyle was opened by double-clicking `Ghosttyle.command` in Apple Terminal, a clean exit also closes that launcher tab or window; startup and runtime errors leave it open for diagnosis. Set `GHOSTTYLE_KEEP_TERMINAL=1` when launching if you prefer to keep it open. Ghosttyle tries to close its browser tab; if the browser blocks automatic closing, the final page asks you to close the tab manually.

To edit a non-default config file:

```bash
node server.mjs --open --config=/absolute/path/to/config.ghostty
```

The first “Save & Reload” may trigger a macOS Automation permission prompt. Allow the terminal running Ghosttyle to control Ghostty. If permission was denied previously, enable it under **System Settings → Privacy & Security → Automation**.

Some Ghostty options, including `background-opacity`, still require a full Ghostty restart.

## Development

```bash
npm run check
```

The check runs syntax validation, unit tests, i18n key parity tests, config-model tests, and a local API integration test.

---

## 中文说明

Ghosttyle 是一个非官方、支持中英文的 Ghostty 本地可视化配置器。它直接读取本机 Ghostty 的主题与字体，通过 Ghostty 官方校验器检查配置，并可在 macOS 上使用 Ghostty 1.3 原生 AppleScript API 重新加载配置。

主要功能：

- 中文 / English 一键切换并记忆选择。
- 网页界面支持跟随系统、浅色和深色模式。
- 浅色 Ghostty 主题和深色 Ghostty 主题分别实时预览。
- 可搜索的本机主题画廊。
- 字体、背景、光标和窗口常用设置。
- 保留注释、快捷键和高级选项的原始配置编辑器。
- 保存前由 Ghostty 自身执行配置校验。
- 原子写入和时间戳备份。
- 通过“保存并加载”直接执行 Ghostty 的 `reload_config`。
- 服务只监听 `127.0.0.1`，不会将配置上传到网络。
- 不需要安装第三方 npm 依赖。

在 Finder 中双击 `Ghosttyle.command`，或运行：

```bash
npm start
```

也可以点击网页右上角的“退出”按钮停止本地 npm/Node 进程。通过 Apple Terminal 双击 `Ghosttyle.command` 启动时，正常退出还会自动关闭这个启动器自己的标签页或窗口；如果启动或运行报错，窗口会保留以便排查。如需始终保留窗口，可在启动时设置 `GHOSTTYLE_KEEP_TERMINAL=1`。Ghosttyle 会尝试自动关闭浏览器标签页；如果浏览器阻止自动关闭，退出完成页会提示你手动关闭。

首次使用“保存并加载”时，macOS 可能询问是否允许终端控制 Ghostty，请选择“允许”。`background-opacity` 等少数配置仍需完全重启 Ghostty 才能生效。
