import test from "node:test";
import assert from "node:assert/strict";

import { translate, translations } from "../public/i18n.js";

test("Chinese and English translation dictionaries have matching keys", () => {
  assert.deepEqual(Object.keys(translations.zh).sort(), Object.keys(translations.en).sort());
});

test("translation parameters are interpolated", () => {
  assert.equal(translate("zh", "sidebar.themeCount", { count: 463 }), "463 个主题");
  assert.equal(translate("en", "sidebar.themeCount", { count: 463 }), "463 themes");
});
