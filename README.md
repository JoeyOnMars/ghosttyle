# Ghosttyle

**Shape Ghostty your way.**

<p align="left">
  <a href="README.md"><img src="https://img.shields.io/badge/Language-English-007acc?style=for-the-badge" alt="English"></a>
  <a href="README_zh.md"><img src="https://img.shields.io/badge/语言-简体中文-de342f?style=for-the-badge" alt="简体中文"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License"></a>
</p>

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
- **Custom port & auto-fallback**:
  Ghosttyle defaults to port `4173`. If occupied, it automatically advances to the next available port (`4174`, `4175`...). You can also specify a port manually:
  ```bash
  npm start -- --port=5173
  # or directly with node / environment variable:
  node server.mjs --open --port=5173
  PORT=5173 npm start
  ```
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

## License

This project is licensed under the [MIT License](LICENSE).

