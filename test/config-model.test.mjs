import test from "node:test";
import assert from "node:assert/strict";

import {
  applyConfigPatch,
  formatThemeValue,
  getConfigValue,
  missingThemeSelections,
  parseThemeValue,
  setConfigValue,
  suggestTheme,
} from "../public/config-model.js";

test("parses quoted light/dark theme values", () => {
  assert.deepEqual(parseThemeValue('"light:Adwaita Light,dark:Floraverse"'), {
    mode: "system",
    light: "Adwaita Light",
    dark: "Floraverse",
    single: "",
  });
});

test("formats a system theme without unnecessary quotes", () => {
  assert.equal(formatThemeValue({ mode: "system", light: "Adwaita", dark: "Floraverse" }), "light:Adwaita,dark:Floraverse");
});

test("updates the final scalar value and preserves comments", () => {
  const original = "# personal config\nfont-size = 12\nfont-size = 13\n";
  const updated = setConfigValue(original, "font-size", "15");
  assert.equal(updated, "# personal config\nfont-size = 12\nfont-size = 15\n");
});

test("updates only the primary font and preserves fallbacks", () => {
  const original = "font-family = Menlo\nfont-family = Monaco\n";
  const updated = applyConfigPatch(original, { "font-family": "PT Mono" });
  assert.equal(updated, "font-family = PT Mono\nfont-family = Monaco\n");
  assert.equal(getConfigValue(updated, "font-family", "first"), "PT Mono");
});

test("removes optional scalar settings when reset", () => {
  const original = "font-size = 15\nbackground-blur = true\n";
  assert.equal(setConfigValue(original, "background-blur", ""), "font-size = 15\n");
});

test("suggests the renamed Adwaita theme", () => {
  const themes = ["Adwaita", "Adwaita Dark", "Ayu Light", "Floraverse"];
  assert.equal(suggestTheme("Adwaita Light", themes), "Adwaita");
  assert.deepEqual(missingThemeSelections("light:Adwaita Light,dark:Floraverse", themes), [
    { slot: "light", name: "Adwaita Light", suggestion: "Adwaita" },
  ]);
});
