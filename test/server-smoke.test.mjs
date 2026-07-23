import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createGhosttyServer, findGhosttyBinary, reloadGhostty } from "../server.mjs";

test("macOS reload bridge performs Ghostty reload_config action", async () => {
  let invocation;
  const result = await reloadGhostty({
    platformName: "darwin",
    execute: async (file, args) => {
      invocation = { file, args };
      return { stdout: "true\n", stderr: "" };
    },
  });

  assert.equal(result.ok, true);
  assert.equal(invocation.file, "/usr/bin/osascript");
  assert.match(invocation.args[1], /perform action "reload_config"/);
  assert.match(invocation.args[1], /focused terminal of selected tab of front window/);
});

test("macOS reload bridge explains denied Automation permission", async () => {
  const denied = new Error("AppleEvent denied (-1743)");
  denied.stderr = "Not authorized to send Apple events to Ghostty. (-1743)";
  const result = await reloadGhostty({
    platformName: "darwin",
    execute: async () => { throw denied; },
  });

  assert.equal(result.ok, false);
  assert.equal(result.supported, true);
  assert.equal(result.code, "permission_denied");
});

test("local shutdown API requires the session token and invokes its handler", async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), "ghosttyle-shutdown-test-"));
  const configPath = path.join(directory, "config.ghostty");
  await writeFile(configPath, "font-size = 14\n", "utf8");
  let shutdownCalls = 0;
  let resolveShutdown;
  const shutdownTriggered = new Promise((resolve) => { resolveShutdown = resolve; });
  const { server } = await createGhosttyServer({
    binary: "/usr/bin/true",
    configPath,
    shutdownAction: () => {
      shutdownCalls += 1;
      resolveShutdown();
    },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { force: true, recursive: true });
  });

  const state = await (await fetch(`${baseUrl}/api/state`)).json();
  assert.equal(state.automation.shutdownSupported, true);

  const denied = await fetch(`${baseUrl}/api/shutdown`, { method: "POST" });
  assert.equal(denied.status, 403);
  assert.equal(shutdownCalls, 0);

  const accepted = await fetch(`${baseUrl}/api/shutdown`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ghostty-UI-Token": state.token },
    body: "{}",
  });
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).shutdownRequested, true);
  await shutdownTriggered;
  assert.equal(shutdownCalls, 1);
});

test("local API reads, validates, backs up, and saves config", async (context) => {
  const binary = await findGhosttyBinary();
  if (!binary) {
    context.skip("Ghostty is not installed on this machine");
    return;
  }

  const directory = await mkdtemp(path.join(tmpdir(), "ghosttyle-test-"));
  const configPath = path.join(directory, "config.ghostty");
  await writeFile(path.join(directory, "shared.ghostty"), "font-size = 13\n", "utf8");
  await writeFile(configPath, "theme = Adwaita\nconfig-file = shared.ghostty\n", "utf8");
  let reloadCalls = 0;
  const reloadAction = async () => {
    reloadCalls += 1;
    return { ok: true, supported: true, code: "reloaded", message: "Ghostty reloaded the configuration.", details: "" };
  };
  const { server } = await createGhosttyServer({ binary, configPath, reloadAction });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  context.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { force: true, recursive: true });
  });

  const stateResponse = await fetch(`${baseUrl}/api/state`);
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.ghostty.found, true);
  assert.equal(state.config.content, "theme = Adwaita\nconfig-file = shared.ghostty\n");
  assert.equal(state.validation.valid, true);
  assert.equal(state.automation.reloadSupported, true);
  assert.ok(state.themes.some((theme) => theme.name === "Adwaita"));
  assert.ok(state.fonts.length > 0);

  const invalidResponse = await fetch(`${baseUrl}/api/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ghostty-UI-Token": state.token },
    body: JSON.stringify({ content: "theme = Definitely Missing\n" }),
  });
  assert.equal(invalidResponse.status, 422);
  const invalid = await invalidResponse.json();
  assert.equal(invalid.validation.valid, false);

  const savedContent = "theme = Adwaita\nfont-size = 15\n";
  const saveResponse = await fetch(`${baseUrl}/api/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ghostty-UI-Token": state.token },
    body: JSON.stringify({ content: savedContent, reload: true }),
  });
  assert.equal(saveResponse.status, 200);
  const saved = await saveResponse.json();
  assert.ok(saved.backupPath);
  assert.equal(saved.reload.ok, true);
  assert.equal(reloadCalls, 1);
  assert.ok((await stat(saved.backupPath)).isFile());
  assert.equal(await readFile(configPath, "utf8"), savedContent);

  const reloadResponse = await fetch(`${baseUrl}/api/reload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ghostty-UI-Token": state.token },
    body: "{}",
  });
  assert.equal(reloadResponse.status, 200);
  const reloaded = await reloadResponse.json();
  assert.equal(reloaded.reload.ok, true);
  assert.equal(reloadCalls, 2);
});
