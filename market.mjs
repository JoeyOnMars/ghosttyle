import { homedir, platform } from "node:os";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export function getUserThemesDirectory() {
  const home = homedir();
  return path.join(home, ".config", "ghostty", "themes");
}

export function getUserFontsDirectory() {
  const home = homedir();
  if (platform() === "darwin") {
    return path.join(home, "Library", "Fonts");
  }
  return path.join(home, ".local", "share", "fonts");
}

export const CURATED_THEMES = [
  {
    id: "kanagawa-wave",
    name: "Kanagawa Wave",
    author: "rebelot",
    description: "受葛饰北斋浮世绘《神奈川冲浪里》启发的典雅日式和风配色，柔和不刺眼。",
    descriptionEn: "Elegant Japanese wave aesthetic inspired by Katsushika Hokusai, easy on the eyes.",
    category: "popular",
    mode: "dark",
    background: "#1f1f28",
    foreground: "#dcd7ba",
    cursor: "#c8c093",
    palette: [
      "#090618", "#c34043", "#76946a", "#c0a36e", "#7e9cd8", "#957fb8", "#6a9589", "#c8c093",
      "#727169", "#e82424", "#98bb6c", "#e6c384", "#7fb4ca", "#938aa9", "#7aa89f", "#dcd7ba"
    ],
    content: `palette = 0=#090618
palette = 1=#c34043
palette = 2=#76946a
palette = 3=#c0a36e
palette = 4=#7e9cd8
palette = 5=#957fb8
palette = 6=#6a9589
palette = 7=#c8c093
palette = 8=#727169
palette = 9=#e82424
palette = 10=#98bb6c
palette = 11=#e6c384
palette = 12=#7fb4ca
palette = 13=#938aa9
palette = 14=#7aa89f
palette = 15=#dcd7ba
background = #1f1f28
foreground = #dcd7ba
cursor-color = #c8c093
selection-background = #2d4f67
selection-foreground = #c8c093
`
  },
  {
    id: "vesper",
    name: "Vesper",
    author: "raunofreiberg",
    description: "极致克制的高级暗黑极简主义，暖灰与深邃碳黑的黄金搭配。",
    descriptionEn: "Sublime high-contrast dark minimalism with warm grays and carbon black.",
    category: "minimal",
    mode: "dark",
    background: "#101010",
    foreground: "#ffffff",
    cursor: "#ffc799",
    palette: [
      "#1b1b1b", "#fe4450", "#7cc888", "#ffc799", "#65b2ff", "#e072fa", "#6fe2e6", "#a0a0a0",
      "#505050", "#ff6b76", "#9ee2a8", "#ffd7b5", "#89c5ff", "#e892fb", "#8ff0f4", "#ffffff"
    ],
    content: `palette = 0=#1b1b1b
palette = 1=#fe4450
palette = 2=#7cc888
palette = 3=#ffc799
palette = 4=#65b2ff
palette = 5=#e072fa
palette = 6=#6fe2e6
palette = 7=#a0a0a0
palette = 8=#505050
palette = 9=#ff6b76
palette = 10=#9ee2a8
palette = 11=#ffd7b5
palette = 12=#89c5ff
palette = 13=#e892fb
palette = 14=#8ff0f4
palette = 15=#ffffff
background = #101010
foreground = #ffffff
cursor-color = #ffc799
selection-background = #282828
selection-foreground = #ffffff
`
  },
  {
    id: "poimandres",
    name: "Poimandres",
    author: "drcmda",
    description: "冷调深青灰与魔幻极光粉绿碰撞，灵感来自 Hermes Trismegistus 的灵修暗调。",
    descriptionEn: "Deep blue-gray palette inspired by Hermes Trismegistus with neon mint accents.",
    category: "cyberpunk",
    mode: "dark",
    background: "#1b1e28",
    foreground: "#a6accd",
    cursor: "#5de4c7",
    palette: [
      "#171922", "#d0679d", "#5de4c7", "#fffac2", "#89ddff", "#f087bd", "#add7ff", "#e4f0fb",
      "#303340", "#d0679d", "#5de4c7", "#fffac2", "#89ddff", "#f087bd", "#add7ff", "#ffffff"
    ],
    content: `palette = 0=#171922
palette = 1=#d0679d
palette = 2=#5de4c7
palette = 3=#fffac2
palette = 4=#89ddff
palette = 5=#f087bd
palette = 6=#add7ff
palette = 7=#e4f0fb
palette = 8=#303340
palette = 9=#d0679d
palette = 10=#5de4c7
palette = 11=#fffac2
palette = 12=#89ddff
palette = 13=#f087bd
palette = 14=#add7ff
palette = 15=#ffffff
background = #1b1e28
foreground = #a6accd
cursor-color = #5de4c7
selection-background = #2a3141
selection-foreground = #e4f0fb
`
  },
  {
    id: "cyberpunk-neon",
    name: "Cyberpunk Neon",
    author: "ghoststyle",
    description: "高饱和夜之城赛博霓虹，亮紫与电光青绿的强冲击力视觉风格。",
    descriptionEn: "High-saturation Night City cyberpunk neon with electric teal and vibrant violet.",
    category: "cyberpunk",
    mode: "dark",
    background: "#0d0f18",
    foreground: "#00f5a0",
    cursor: "#ff007f",
    palette: [
      "#121524", "#ff0055", "#00f5a0", "#ffe600", "#00d8ff", "#bd00ff", "#00ffcc", "#e0e6ed",
      "#2a2f4c", "#ff3377", "#33ffb8", "#ffeb33", "#33e0ff", "#ca33ff", "#33ffd6", "#ffffff"
    ],
    content: `palette = 0=#121524
palette = 1=#ff0055
palette = 2=#00f5a0
palette = 3=#ffe600
palette = 4=#00d8ff
palette = 5=#bd00ff
palette = 6=#00ffcc
palette = 7=#e0e6ed
palette = 8=#2a2f4c
palette = 9=#ff3377
palette = 10=#33ffb8
palette = 11=#ffeb33
palette = 12=#33e0ff
palette = 13=#ca33ff
palette = 14=#33ffd6
palette = 15=#ffffff
background = #0d0f18
foreground = #00f5a0
cursor-color = #ff007f
selection-background = #2b1d3d
selection-foreground = #00f5a0
`
  },
  {
    id: "synthwave-84",
    name: "Synthwave 84",
    author: "robbowen",
    description: "经典 80 年代复古合成波公路落日，霓虹粉与青蓝怀旧色调。",
    descriptionEn: "Iconic 80s retro synthwave sunset nostalgia with glowing neon magenta and cyan.",
    category: "retro",
    mode: "dark",
    background: "#262335",
    foreground: "#f92aad",
    cursor: "#f92aad",
    palette: [
      "#262335", "#fe4450", "#72f1b8", "#fede5d", "#03edf9", "#ff7edb", "#03edf9", "#ffffff",
      "#495495", "#fe4450", "#72f1b8", "#fede5d", "#03edf9", "#ff7edb", "#03edf9", "#ffffff"
    ],
    content: `palette = 0=#262335
palette = 1=#fe4450
palette = 2=#72f1b8
palette = 3=#fede5d
palette = 4=#03edf9
palette = 5=#ff7edb
palette = 6=#03edf9
palette = 7=#ffffff
palette = 8=#495495
palette = 9=#fe4450
palette = 10=#72f1b8
palette = 11=#fede5d
palette = 12=#03edf9
palette = 13=#ff7edb
palette = 14=#03edf9
palette = 15=#ffffff
background = #262335
foreground = #ffffff
cursor-color = #f92aad
selection-background = #443760
selection-foreground = #ffffff
`
  },
  {
    id: "catppuccin-frappe-oled",
    name: "Catppuccin Frappe OLED",
    author: "catppuccin",
    description: "OLED 纯黑纯净底色的 Catppuccin 变体，高对比且极致省电。",
    descriptionEn: "Catppuccin variant with true pitch-black OLED background for extreme contrast.",
    category: "oled",
    mode: "dark",
    background: "#000000",
    foreground: "#c6d0f5",
    cursor: "#f2d5cf",
    palette: [
      "#51576d", "#e78284", "#a6d189", "#e5c890", "#8caaee", "#f4b8e4", "#81c8be", "#b5bfe2",
      "#626880", "#ea999c", "#85c1dc", "#ef9f76", "#babbf1", "#ca9ee6", "#99d1db", "#c6d0f5"
    ],
    content: `palette = 0=#51576d
palette = 1=#e78284
palette = 2=#a6d189
palette = 3=#e5c890
palette = 4=#8caaee
palette = 5=#f4b8e4
palette = 6=#81c8be
palette = 7=#b5bfe2
palette = 8=#626880
palette = 9=#ea999c
palette = 10=#85c1dc
palette = 11=#ef9f76
palette = 12=#babbf1
palette = 13=#ca9ee6
palette = 14=#99d1db
palette = 15=#c6d0f5
background = #000000
foreground = #c6d0f5
cursor-color = #f2d5cf
selection-background = #303446
selection-foreground = #c6d0f5
`
  },
  {
    id: "snow-aurora-light",
    name: "Snow Aurora Light",
    author: "ghoststyle",
    description: "纯净雪瓷白与青翠北极光的清爽白昼主题，高透光高辨识度。",
    descriptionEn: "Clean porcelain snow white with vibrant emerald aurora, high readability day theme.",
    category: "light",
    mode: "light",
    background: "#f8fafc",
    foreground: "#0f172a",
    cursor: "#059669",
    palette: [
      "#f1f5f9", "#e11d48", "#059669", "#d97706", "#2563eb", "#9333ea", "#0891b2", "#334155",
      "#94a3b8", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#06b6d4", "#0f172a"
    ],
    content: `palette = 0=#f1f5f9
palette = 1=#e11d48
palette = 2=#059669
palette = 3=#d97706
palette = 4=#2563eb
palette = 5=#9333ea
palette = 6=#0891b2
palette = 7=#334155
palette = 8=#94a3b8
palette = 9=#f43f5e
palette = 10=#10b981
palette = 11=#f59e0b
palette = 12=#3b82f6
palette = 13=#a855f7
palette = 14=#06b6d4
palette = 15=#0f172a
background = #f8fafc
foreground = #0f172a
cursor-color = #059669
selection-background = #e2e8f0
selection-foreground = #0f172a
`
  }
];

export const CURATED_FONTS = [
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    publisher: "JetBrains",
    description: "专为代码阅读优化的等宽字体，椭圆字形，高字怀，支持丰富连字与代码微符号。",
    descriptionEn: "Typeface for developers with increased letter height and oval shapes for coding comfort.",
    tags: ["Ligatures", "Popular", "High Legibility"],
    previewText: "const hash = await crypto.subtle.digest('SHA-256', buf); // => !== >= <=",
    homepage: "https://www.jetbrains.com/lp/mono/",
    downloadUrl: "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf",
    filename: "JetBrainsMono-Regular.ttf",
    fontFamilyMatch: "JetBrains Mono"
  },
  {
    id: "fira-code",
    name: "Fira Code",
    publisher: "Nikita Prokopov",
    description: "代码连字特性的鼻祖，将常见的编程符号组合（如 !==, =>, ->）合成为优美单字形。",
    descriptionEn: "The pioneer of programming ligatures, turning common multi-character combos into neat symbols.",
    tags: ["Ligatures", "Classic", "Dev Favorite"],
    previewText: "fn calculate_hash<T: Hash>(item: &T) -> u64 { item.hash() }",
    homepage: "https://github.com/tonsky/FiraCode",
    downloadUrl: "https://raw.githubusercontent.com/tonsky/FiraCode/master/distr/ttf/FiraCode-Regular.ttf",
    filename: "FiraCode-Regular.ttf",
    fontFamilyMatch: "Fira Code"
  },
  {
    id: "cascadia-code",
    name: "Cascadia Code",
    publisher: "Microsoft",
    description: "微软专为 Windows Terminal 与 VS Code 打造的现代等宽字体，字形柔和饱满。",
    descriptionEn: "Modern monospaced font designed by Microsoft for terminal windows and modern editors.",
    tags: ["Ligatures", "Microsoft", "Clean"],
    previewText: "git commit -m 'feat: modernize terminal visuals' # [===] => 100%",
    homepage: "https://github.com/microsoft/cascadia-code",
    downloadUrl: "https://raw.githubusercontent.com/microsoft/cascadia-code/main/assets/CascadiaCode.ttf",
    filename: "CascadiaCode-Regular.ttf",
    fontFamilyMatch: "Cascadia Code"
  },
  {
    id: "hack",
    name: "Hack",
    publisher: "Source Foundry",
    description: "老牌硬核开源等宽字体，专攻屏幕微小字号下的抗锯齿与极致清晰度。",
    descriptionEn: "Designed for work with source code, highly optimized for small font sizes on screens.",
    tags: ["Clean", "High Contrast", "Solid"],
    previewText: "SELECT * FROM users WHERE status = 'ACTIVE' ORDER BY created_at DESC;",
    homepage: "https://source-foundry.github.io/Hack/",
    downloadUrl: "https://raw.githubusercontent.com/source-foundry/Hack/master/build/ttf/Hack-Regular.ttf",
    filename: "Hack-Regular.ttf",
    fontFamilyMatch: "Hack"
  },
  {
    id: "geist-mono",
    name: "Geist Mono",
    publisher: "Vercel",
    description: "Vercel 打造的极致现代极简等宽几何字体，专为工程、设计与开发者仪表盘优化。",
    descriptionEn: "Modern geometric monospaced font by Vercel, tailored for developer interfaces.",
    tags: ["Vercel", "Modern", "Minimalist"],
    previewText: "export default async function Page({ params }: { params: Props })",
    homepage: "https://vercel.com/font",
    downloadUrl: "https://raw.githubusercontent.com/vercel/geist-font/main/packages/geist-mono/dist/GeistMono-Regular.otf",
    filename: "GeistMono-Regular.otf",
    fontFamilyMatch: "Geist Mono"
  }
];

export async function installTheme(themeData) {
  const themeName = (themeData.name || "").trim().replace(/[/\\]/g, "");
  if (!themeName) {
    throw new Error("Invalid theme name.");
  }

  const userThemeDir = getUserThemesDirectory();
  await mkdir(userThemeDir, { recursive: true });
  const themePath = path.join(userThemeDir, themeName);

  const content = themeData.content || `palette = 0=${themeData.background}\nbackground = ${themeData.background}\nforeground = ${themeData.foreground}\ncursor-color = ${themeData.cursor}\n`;
  await writeFile(themePath, content, "utf8");

  return { ok: true, name: themeName, path: themePath };
}

export async function installFont(fontId) {
  const font = CURATED_FONTS.find((item) => item.id === fontId);
  if (!font) {
    throw new Error(`Font with id "${fontId}" not found in curated repository.`);
  }

  const userFontsDir = getUserFontsDirectory();
  await mkdir(userFontsDir, { recursive: true });
  const targetPath = path.join(userFontsDir, font.filename);

  // Download font from remote or fallback
  const response = await fetch(font.downloadUrl, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`Failed to download font: HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(targetPath, Buffer.from(arrayBuffer));

  return { ok: true, name: font.name, path: targetPath };
}
