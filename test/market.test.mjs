import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { CURATED_THEMES, CURATED_FONTS, installTheme, getUserThemesDirectory } from "../market.mjs";
import { parseConfig } from "../public/config-model.js";

test("curated themes have valid structure and parseable ghostty configuration", () => {
  assert.ok(CURATED_THEMES.length >= 5);
  for (const theme of CURATED_THEMES) {
    assert.ok(theme.id, `Theme missing id: ${JSON.stringify(theme)}`);
    assert.ok(theme.name, `Theme missing name: ${theme.id}`);
    assert.match(theme.background, /^#[0-9a-fA-F]{6}$/);
    assert.match(theme.foreground, /^#[0-9a-fA-F]{6}$/);
    assert.ok(Array.isArray(theme.palette) && theme.palette.length >= 8);
    assert.ok(theme.content, `Theme missing content: ${theme.id}`);

    const parsed = parseConfig(theme.content);
    assert.ok(parsed.entries.has("background"), `Theme ${theme.id} content missing background`);
    assert.ok(parsed.entries.has("foreground"), `Theme ${theme.id} content missing foreground`);
  }
});

test("curated fonts have valid download metadata and filenames", () => {
  assert.ok(CURATED_FONTS.length >= 5);
  for (const font of CURATED_FONTS) {
    assert.ok(font.id, `Font missing id`);
    assert.ok(font.name, `Font missing name`);
    assert.ok(font.filename.endsWith(".ttf") || font.filename.endsWith(".otf"), `Invalid font filename: ${font.filename}`);
    assert.ok(font.downloadUrl.startsWith("https://"), `Invalid font downloadUrl: ${font.downloadUrl}`);
    assert.ok(font.homepage.startsWith("https://"), `Invalid font homepage: ${font.homepage}`);
  }
});

test("installTheme safely writes theme file into specified directory", async (context) => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "ghosttyle-theme-test-"));
  context.after(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  const testTheme = CURATED_THEMES[0];
  const result = await installTheme(testTheme, { themesDirectory: temporaryDirectory });
  assert.equal(result.ok, true);
  assert.equal(result.name, testTheme.name);

  const writtenContent = await readFile(result.path, "utf8");
  assert.equal(writtenContent, testTheme.content);
});

test("getUserThemesDirectory resolves adjacent themes directory when configPath provided", async () => {
  const resolved = await getUserThemesDirectory("/custom/path/ghostty/config.ghostty");
  assert.equal(resolved, "/custom/path/ghostty/themes");
});
