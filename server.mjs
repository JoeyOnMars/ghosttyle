import { createServer as createHttpServer } from "node:http";
import { access, copyFile, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { homedir, platform, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_PORT = 4173;

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
]);

function parseArgs(argv) {
  const result = {
    configPath: process.env.GHOSTTY_CONFIG_PATH || "",
    open: false,
    port: Number(process.env.PORT || DEFAULT_PORT),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--open") result.open = true;
    else if (argument.startsWith("--port=")) result.port = Number(argument.slice(7));
    else if (argument === "--port") result.port = Number(argv[++index]);
    else if (argument.startsWith("--config=")) result.configPath = argument.slice(9);
    else if (argument === "--config") result.configPath = argv[++index] || "";
  }

  if (!Number.isInteger(result.port) || result.port < 0 || result.port > 65535) {
    throw new Error(`Invalid port: ${result.port}`);
  }
  return result;
}

async function isExecutable(candidate) {
  if (!candidate) return false;
  try {
    await access(candidate, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function findGhosttyBinary() {
  const pathCandidates = (process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean)
    .map((directory) => path.join(directory, "ghostty"));
  const candidates = [
    process.env.GHOSTTY_BIN,
    ...pathCandidates,
    "/Applications/Ghostty.app/Contents/MacOS/ghostty",
    "/opt/homebrew/bin/ghostty",
    "/usr/local/bin/ghostty",
    "/usr/bin/ghostty",
  ];

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    if (await isExecutable(candidate)) return candidate;
  }
  return "";
}

async function fileExists(candidate) {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

export async function detectConfigPath(explicitPath = "") {
  if (explicitPath) return path.resolve(explicitPath.replace(/^~(?=\/)/, homedir()));

  const home = homedir();
  const xdgRoot = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  const candidates = platform() === "darwin"
    ? [
        path.join(home, "Library", "Application Support", "com.mitchellh.ghostty", "config.ghostty"),
        path.join(home, "Library", "Application Support", "com.mitchellh.ghostty", "config"),
        path.join(xdgRoot, "ghostty", "config.ghostty"),
        path.join(xdgRoot, "ghostty", "config"),
      ]
    : [
        path.join(xdgRoot, "ghostty", "config.ghostty"),
        path.join(xdgRoot, "ghostty", "config"),
      ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }
  return candidates[0];
}

function cleanGhosttyOutput(output = "") {
  return output
    .split(/\r?\n/)
    .filter((line) => line.trim() && line.trim() !== "error: SentryInitFailed")
    .join("\n")
    .trim();
}

async function runGhostty(binary, args, options = {}) {
  if (!binary) {
    return { ok: false, output: "Ghostty executable was not found.", code: 127 };
  }

  try {
    const { stdout = "", stderr = "" } = await execFileAsync(binary, args, {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      timeout: options.timeout ?? 20_000,
    });
    return {
      ok: true,
      output: cleanGhosttyOutput([stdout, stderr].filter(Boolean).join("\n")),
      code: 0,
    };
  } catch (error) {
    const output = cleanGhosttyOutput([error.stdout, error.stderr].filter(Boolean).join("\n"));
    return {
      ok: false,
      output: output || error.message,
      code: typeof error.code === "number" ? error.code : 1,
    };
  }
}

function normalizeColor(value, fallback) {
  const candidate = String(value || "").trim();
  if (/^#?[0-9a-f]{6}$/i.test(candidate)) {
    return candidate.startsWith("#") ? candidate : `#${candidate}`;
  }
  if (/^#?[0-9a-f]{3}$/i.test(candidate)) {
    const short = candidate.replace("#", "");
    return `#${[...short].map((character) => character.repeat(2)).join("")}`;
  }
  return fallback;
}

function colorMode(background) {
  const hex = normalizeColor(background, "#15171c").slice(1);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance > 0.48 ? "light" : "dark";
}

async function parseThemeFile(themePath) {
  let content = "";
  try {
    content = await readFile(themePath, "utf8");
  } catch {
    return {
      background: "#15171c",
      foreground: "#f4f7fb",
      cursor: "#86d7ff",
      palette: ["#86d7ff", "#9cf6d8", "#ffcc85", "#ff8f99"],
      mode: "dark",
    };
  }

  const values = new Map();
  const palette = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([a-z0-9-]+)\s*=\s*(.*?)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (key === "palette") {
      const paletteMatch = rawValue.match(/^(\d+)\s*=\s*(.+)$/);
      if (paletteMatch) palette.set(Number(paletteMatch[1]), normalizeColor(paletteMatch[2], "#8a94a6"));
    } else {
      values.set(key, rawValue.replace(/^(["'])(.*)\1$/, "$2"));
    }
  }

  const background = normalizeColor(values.get("background"), "#15171c");
  const foreground = normalizeColor(values.get("foreground"), "#f4f7fb");
  return {
    background,
    foreground,
    cursor: normalizeColor(values.get("cursor-color"), palette.get(4) || foreground),
    palette: [1, 2, 3, 4, 5, 6].map((index) => palette.get(index)).filter(Boolean).slice(0, 5),
    mode: colorMode(background),
  };
}

export async function loadThemes(binary) {
  const result = await runGhostty(binary, ["+list-themes", "--plain", "--path"]);
  if (!result.ok) return [];

  const entries = result.output.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^(.*) \(([^()]*)\) (\/.*)$/);
    if (!match) return [];
    return [{ name: match[1], source: match[2], path: match[3] }];
  });

  return Promise.all(entries.map(async (entry) => ({
    ...entry,
    ...(await parseThemeFile(entry.path)),
  })));
}

export async function loadFonts(binary) {
  const result = await runGhostty(binary, ["+list-fonts"]);
  if (!result.ok) return [];
  return [...new Set(result.output
    .split(/\r?\n/)
    .filter((line) => line && !/^\s/.test(line))
    .map((line) => line.trim())
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export async function validateConfig(binary, content, referencePath = "") {
  if (!binary) return { valid: false, output: "Ghostty was not found, so the configuration cannot be validated." };
  let temporaryDirectory = "";
  let target = "";

  if (referencePath) {
    const referenceDirectory = path.dirname(referencePath);
    try {
      if ((await stat(referenceDirectory)).isDirectory()) {
        target = path.join(referenceDirectory, `.${path.basename(referencePath)}.validate-${process.pid}-${randomBytes(6).toString("hex")}`);
      }
    } catch {
      // A new config may not have a parent directory yet; fall back to the OS temp directory.
    }
  }
  if (!target) {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), "ghosttyle-"));
    target = path.join(temporaryDirectory, "config.ghostty");
  }

  try {
    await writeFile(target, content, { encoding: "utf8", mode: 0o600 });
    const result = await runGhostty(binary, ["+validate-config", `--config-file=${target}`]);
    return {
      valid: result.ok,
      output: result.output || (result.ok ? "Configuration is valid." : "Ghostty rejected this configuration."),
    };
  } finally {
    await rm(target, { force: true });
    if (temporaryDirectory) await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

function appleScriptFailure(output) {
  const text = String(output || "");
  if (/(-1743|not authorized|不允许|无权|拒绝)/i.test(text)) {
    return { code: "permission_denied", message: "macOS Automation permission was denied." };
  }
  if (/1001|没有运行|not running/i.test(text)) {
    return { code: "not_running", message: "Ghostty is not running." };
  }
  if (/1002|没有可加载配置的窗口|no windows/i.test(text)) {
    return { code: "no_windows", message: "Ghostty has no terminal window available for reload_config." };
  }
  if (/macos-applescript|AppleScript support is disabled/i.test(text)) {
    return { code: "applescript_disabled", message: "Ghostty AppleScript support is disabled." };
  }
  return { code: "failed", message: "Ghostty could not reload the configuration." };
}

export async function reloadGhostty(options = {}) {
  const platformName = options.platformName ?? platform();
  if (platformName !== "darwin") {
    return {
      ok: false,
      supported: false,
      code: "unsupported",
      message: "Automatic Ghostty reload is supported only on macOS.",
      details: "",
    };
  }

  const script = [
    'if application "Ghostty" is not running then error "Ghostty is not running." number 1001',
    'tell application "Ghostty"',
    '  if (count of windows) is 0 then error "Ghostty has no terminal window." number 1002',
    '  set targetTerminal to focused terminal of selected tab of front window',
    '  set didReload to perform action "reload_config" on targetTerminal',
    '  return didReload',
    'end tell',
  ].join("\n");
  const execute = options.execute ?? ((file, args) => execFileAsync(file, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 12_000,
  }));

  try {
    const { stdout = "", stderr = "" } = await execute("/usr/bin/osascript", ["-e", script]);
    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    if (!/^true$/i.test(output)) {
      const failure = appleScriptFailure(output);
      return {
        ok: false,
        supported: true,
        ...failure,
        details: output,
      };
    }
    return {
      ok: true,
      supported: true,
      code: "reloaded",
      message: "Ghostty reloaded the configuration.",
      details: "",
    };
  } catch (error) {
    const output = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").trim();
    const failure = appleScriptFailure(output);
    return {
      ok: false,
      supported: true,
      ...failure,
      details: output,
    };
  }
}

function backupSuffix(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "-",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
  return parts.join("");
}

export async function saveConfig(configPath, content) {
  const directory = path.dirname(configPath);
  await mkdir(directory, { recursive: true });

  const exists = await fileExists(configPath);
  let backupPath = "";
  let mode = 0o644;
  if (exists) {
    const metadata = await stat(configPath);
    mode = metadata.mode & 0o777;
    backupPath = `${configPath}.backup-${backupSuffix()}`;
    await copyFile(configPath, backupPath);
  }

  const temporaryPath = path.join(directory, `.${path.basename(configPath)}.tmp-${process.pid}-${Date.now()}`);
  try {
    await writeFile(temporaryPath, content.endsWith("\n") ? content : `${content}\n`, {
      encoding: "utf8",
      mode,
    });
    await rename(temporaryPath, configPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }

  return { backupPath };
}

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Configuration content exceeds the 1 MB limit.");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function setSecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Cache-Control", "no-store");
}

async function serveStatic(requestPath, response) {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const target = path.resolve(PUBLIC_DIR, relativePath);
  if (target !== PUBLIC_DIR && !target.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    jsonResponse(response, 403, { error: "Access to this path is forbidden." });
    return;
  }

  try {
    const data = await readFile(target);
    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES.get(path.extname(target)) || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(data);
  } catch (error) {
    jsonResponse(response, error.code === "ENOENT" ? 404 : 500, {
      error: error.code === "ENOENT" ? "Page not found." : "Unable to read the page.",
    });
  }
}

export async function createGhosttyServer(options = {}) {
  const binary = options.binary ?? await findGhosttyBinary();
  const configPath = await detectConfigPath(options.configPath || "");
  const reloadAction = options.reloadAction ?? (() => reloadGhostty());
  const shutdownAction = typeof options.shutdownAction === "function" ? options.shutdownAction : null;
  const sessionToken = randomBytes(24).toString("hex");
  let shutdownRequested = false;
  let themesPromise;
  let fontsPromise;

  const getThemes = () => {
    themesPromise ??= loadThemes(binary).catch(() => []);
    return themesPromise;
  };
  const getFonts = () => {
    fontsPromise ??= loadFonts(binary).catch(() => []);
    return fontsPromise;
  };

  const server = createHttpServer(async (request, response) => {
    setSecurityHeaders(response);
    const url = new URL(request.url || "/", "http://127.0.0.1");

    try {
      if (url.pathname === "/api/state" && request.method === "GET") {
        const exists = await fileExists(configPath);
        const content = exists ? await readFile(configPath, "utf8") : "";
        const [versionResult, themes, fonts, validation] = await Promise.all([
          runGhostty(binary, ["+version"]),
          getThemes(),
          getFonts(),
          validateConfig(binary, content, configPath),
        ]);
        const version = versionResult.output.match(/Ghostty\s+([^\s]+)/)?.[1] || "unknown";
        jsonResponse(response, 200, {
          token: sessionToken,
          ghostty: { binary, found: Boolean(binary), version },
          config: { path: configPath, exists, content },
          themes,
          fonts,
          validation,
          automation: {
            reloadSupported: platform() === "darwin",
            method: platform() === "darwin" ? "applescript" : "manual",
            shutdownSupported: Boolean(shutdownAction),
          },
        });
        return;
      }

      if (url.pathname === "/api/shutdown" && request.method === "POST") {
        if (request.headers["x-ghostty-ui-token"] !== sessionToken) {
          jsonResponse(response, 403, { error: "Invalid session token. Refresh the page and try again." });
          return;
        }
        if (!shutdownAction) {
          jsonResponse(response, 409, { error: "This Ghosttyle server cannot be stopped from the web interface." });
          return;
        }
        if (!shutdownRequested) {
          shutdownRequested = true;
          response.once("finish", () => {
            const timer = setTimeout(() => {
              Promise.resolve(shutdownAction()).catch((error) => {
                console.error(`Ghosttyle shutdown failed: ${error.message || error}`);
              });
            }, 60);
            timer.unref?.();
          });
        }
        jsonResponse(response, 200, { ok: true, shutdownRequested: true });
        return;
      }

      if (url.pathname === "/api/reload" && request.method === "POST") {
        if (request.headers["x-ghostty-ui-token"] !== sessionToken) {
          jsonResponse(response, 403, { error: "Invalid session token. Refresh the page and try again." });
          return;
        }
        jsonResponse(response, 200, { reload: await reloadAction() });
        return;
      }

      if ((url.pathname === "/api/validate" || url.pathname === "/api/save") && request.method === "POST") {
        if (request.headers["x-ghostty-ui-token"] !== sessionToken) {
          jsonResponse(response, 403, { error: "Invalid session token. Refresh the page and try again." });
          return;
        }
        const body = await readJsonBody(request);
        if (typeof body.content !== "string") {
          jsonResponse(response, 400, { error: "Configuration content is missing." });
          return;
        }
        const validation = await validateConfig(binary, body.content, configPath);
        if (url.pathname === "/api/validate" || !validation.valid) {
          jsonResponse(response, validation.valid ? 200 : 422, { validation });
          return;
        }
        const saved = await saveConfig(configPath, body.content);
        const reload = body.reload === true ? await reloadAction() : null;
        jsonResponse(response, 200, { validation, ...saved, path: configPath, reload });
        return;
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        jsonResponse(response, 405, { error: "Unsupported request method." });
        return;
      }
      await serveStatic(decodeURIComponent(url.pathname), response);
    } catch (error) {
      jsonResponse(response, 500, { error: error.message || "The local server encountered an unknown error." });
    }
  });

  return { server, binary, configPath };
}

async function openBrowser(url) {
  const command = platform() === "darwin" ? "open" : platform() === "win32" ? "cmd" : "xdg-open";
  const args = platform() === "win32" ? ["/c", "start", "", url] : [url];
  try {
    await execFileAsync(command, args, { timeout: 5_000 });
  } catch {
    // The URL is also printed, so browser launch failure is non-fatal.
  }
}

export function listenWithFallback(server, initialPort, host = "127.0.0.1", maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let currentPort = initialPort;
    let attempts = 0;

    function tryListen() {
      const onError = (error) => {
        server.removeListener("listening", onListening);
        if (error.code === "EADDRINUSE" && currentPort > 0 && attempts < maxAttempts && currentPort < 65535) {
          attempts += 1;
          const previousPort = currentPort;
          currentPort += 1;
          console.warn(`Ghosttyle: port ${previousPort} is in use, trying ${currentPort}…`);
          tryListen();
        } else {
          reject(error);
        }
      };

      const onListening = () => {
        server.removeListener("error", onError);
        const address = server.address();
        const port = typeof address === "object" && address ? address.port : currentPort;
        resolve(port);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(currentPort, host);
    }

    tryListen();
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let server;
  const shutdownAction = () => new Promise((resolve) => {
    console.log("Ghosttyle: stopping local server…");
    server.close((error) => {
      if (error) {
        console.error(`Ghosttyle: unable to stop cleanly: ${error.message || error}`);
        process.exitCode = 1;
      } else {
        console.log("Ghosttyle: stopped.");
      }
      resolve();
    });
    server.closeIdleConnections?.();
    const forceClose = setTimeout(() => server.closeAllConnections?.(), 750);
    forceClose.unref?.();
  });
  const created = await createGhosttyServer({ configPath: args.configPath, shutdownAction });
  ({ server } = created);
  const { binary, configPath } = created;

  const port = await listenWithFallback(server, args.port, "127.0.0.1");
  const url = `http://127.0.0.1:${port}`;
  console.log(`Ghosttyle: ${url}`);
  console.log(`Ghostty: ${binary || "not found"}`);
  console.log(`Config: ${configPath}`);
  console.log("Press Ctrl+C to stop the local server.");
  if (args.open) await openBrowser(url);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
