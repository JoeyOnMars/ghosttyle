# Ghosttyle

**让 Ghostty 配置变得得心应手。**

<p align="left">
  <a href="README.md"><img src="https://img.shields.io/badge/Language-English-007acc?style=for-the-badge" alt="English"></a>
  <a href="README_zh.md"><img src="https://img.shields.io/badge/语言-简体中文-de342f?style=for-the-badge" alt="简体中文"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License"></a>
</p>

Ghosttyle 是一个非官方、支持中英文双语的 [Ghostty](https://ghostty.org) 本地可视化配置工作台。它完全运行在你的本机，自动读取已安装 Ghostty 中的主题与字体，在保存配置前通过 Ghostty 官方校验器进行安全检查，并可在 macOS 上通过 Ghostty 1.3 原生 AppleScript API 即时重载正在运行的终端。

> Ghosttyle 是一个独立的社区开源项目，与 Ghostty 官方项目无隶属或背书关系。

---

## 核心特性

- **中英双语无缝切换**：中文 / English 一键切换，并自动记忆你的语言偏好。
- **外观主题模式**：网页界面支持跟随系统、强制浅色或深色模式。
- **实时效果预览**：浅色与深色 Ghostty 主题分别提供逼真的实时代码高亮预览。
- **本机主题画廊**：自动从 `ghostty +list-themes` 读取并生成带搜索筛选的主题库。
- **直观可视化控件**：字体族、字号、背景透明度/模糊、光标样式与窗口装饰等常用配置一键调整。
- **原始配置编辑器（Raw Editor）**：安全双向同步，完整保留你原配置文件中的自定义注释、快捷键映射与高级选项。
- **原生校验防护**：保存前调用 `ghostty +validate-config --config-file=...` 深度语法校验，杜绝非法配置导致终端崩溃。
- **原子写入与时间戳备份**：每次保存均会自动在同目录下生成带时间戳的 `.backup` 备份文件。
- **原生即时刷新**：点击“保存并加载”通过 Ghostty 1.3 原生 AppleScript `reload_config` 动作直接刷新终端，无需手动重启。
- **纯本地安全无依赖**：零第三方 npm 依赖，服务仅监听 `127.0.0.1` 本地回环地址，带基于 Session Token 的防 CSRF 保护机制，绝不上报远程网络。

---

## 快速上手

### 1. 启动

#### 方式 A：绿色免安装包（推荐，无需预装 Node.js）
从 [GitHub Releases](https://github.com/JoeyOnMars/ghosttyle/releases/latest) 下载与你的 Mac 架构相匹配的便携 ZIP：
- `macos-arm64`：适用于 Apple Silicon（M1/M2/M3/M4 系列芯片）Mac。
- `macos-x64`：适用于 Intel 架构 Mac。

解压后，在 Finder 中直接双击：
```text
Ghosttyle.command
```
*(已内置官方 Node.js 运行时，独立隔离执行，不会修改也不会污染系统全局环境。)*

#### 方式 B：从源码运行
克隆本仓库到本地，双击 `Ghosttyle.command`，或在终端执行：
```bash
npm start
```

---

### 2. 浏览器可视化配置

启动后会自动在默认浏览器中打开 `http://127.0.0.1:14173`：
- 在界面中直观浏览主题画廊、微调字体与显示参数，实时预览终端效果。
- 点击**“保存并加载”**，配置将通过严格校验并安全写入，同时通过 AppleScript 触发 Ghostty 立即无缝生效。

---

### 3. 优雅退出

配置完毕后，只需点击网页右上角的**“退出（Exit）”**按钮：
- Ghosttyle 会停止本地服务，并**自动关闭启动时弹出的终端窗口**，无需手动清理残留控制台。
- 若你是在自己的命令行终端手动启动的，也可以随时在终端按 `Ctrl + C` 退出。

---

## 高级技巧与注意事项

### 自定义端口与冲突自动避让
Ghosttyle 默认监听 `14173` 端口。如果该端口已被占用，它会**自动顺延探测下一个可用端口**（如 `14174`、`14175`...）并拉起浏览器，杜绝冲突报错。你也可以手动指定端口：
```bash
npm start -- --port=5173
# 或者直接通过 node 或环境变量指定：
node server.mjs --open --port=5173
PORT=5173 npm start
```

### 指定自定义配置文件路径
如需编辑非默认路径的 Ghostty 配置文件：
```bash
node server.mjs --open --config=/absolute/path/to/config.ghostty
```

### 退出时保留启动终端窗口
默认情况下，通过双击 `Ghosttyle.command` 启动并在网页点击退出时，会自动关闭该终端窗口。如需保留终端窗口以检查启动或运行日志，可在启动前设置环境变量：
```bash
export GHOSTTYLE_KEEP_TERMINAL=1
```

### macOS 自动化权限说明
首次使用“保存并加载”时，macOS 系统可能会弹出权限提示，询问是否允许终端控制 Ghostty。请选择**“允许”**。  
*如果此前曾误选拒绝，可随时在 **系统设置 → 隐私与安全性 → 自动化** 中重新开启勾选。*

### 部分底层配置需重启终端
`background-opacity`（背景透明度）等少数 Ghostty 底层图形渲染配置，因 Ghostty 原生机制限制，仍需完全退出并重新启动 Ghostty 终端才能生效。

---

## 本地开发与校验

运行本地完整测试（涵盖语法检查、全量单元测试、多语言键值对齐校验及 macOS API 集成测试）：
```bash
npm run check
```

构建包含官方 Node.js 运行时的双架构便携 ZIP 包：
```bash
./scripts/build-portable-zips.sh
```

---

## 开源协议

本项目基于 [MIT License](LICENSE) 开源协议。
