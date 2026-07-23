import {
  FIELD_DEFINITIONS,
  formatThemeValue,
  getConfigValue,
  missingThemeSelections,
  parseThemeValue,
  setConfigValue,
} from "./config-model.js";
import { translate } from "./i18n.js";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const elements = {
  backToTop: $("#back-to-top"),
  closePageButton: $("#close-page-button"),
  configPath: $("#config-path"),
  dirtyDot: $("#dirty-dot"),
  dirtyLabel: $("#dirty-label"),
  dismissNotice: $("#dismiss-notice"),
  editorFile: $("#editor-file"),
  editorStats: $("#editor-stats"),
  fontCount: $("#font-count"),
  fontOptions: $("#font-options"),
  galleryResult: $("#gallery-result"),
  ghosttyDot: $("#ghostty-dot"),
  ghosttyVersion: $("#ghostty-version"),
  lightTheme: $("#light-theme-select"),
  darkTheme: $("#dark-theme-select"),
  singleTheme: $("#single-theme-select"),
  shutdownButton: $("#shutdown-button"),
  shutdownHint: $("#shutdown-hint"),
  shutdownMessage: $("#shutdown-message"),
  shutdownScreen: $("#shutdown-screen"),
  shutdownTitle: $("#shutdown-title"),
  systemThemeFields: $("#system-theme-fields"),
  systemThemeHint: $("#system-theme-hint"),
  singleThemeFields: $("#single-theme-fields"),
  notice: $("#notice"),
  noticeIcon: $("#notice-icon"),
  noticeMessage: $("#notice-message"),
  noticeTitle: $("#notice-title"),
  previewName: $("#preview-name"),
  previewPalette: $("#preview-palette"),
  previewThemeLabel: $("#preview-theme-label"),
  rawConfig: $("#raw-config"),
  reloadButton: $("#reload-button"),
  repairActions: $("#repair-actions"),
  saveButton: $("#save-button"),
  saveOnlyButton: $("#save-only-button"),
  terminalPreview: $("#terminal-preview"),
  themeCount: $("#theme-count"),
  themeGallery: $("#theme-gallery"),
  themeSearch: $("#theme-search"),
  toast: $("#toast"),
  validateButton: $("#validate-button"),
};

const state = {
  automation: { reloadSupported: false, shutdownSupported: false, method: "manual" },
  busy: false,
  configPath: "",
  content: "",
  fonts: [],
  ghostty: null,
  loaded: false,
  savedContent: "",
  showSuccess: false,
  themeFilter: "all",
  themeSearch: "",
  themeSelection: { mode: "single", light: "", dark: "", single: "" },
  themes: [],
  token: "",
  validation: { valid: false, output: "Not validated yet." },
  previewSlot: "light",
  reloadResult: null,
};

let rawSyncTimer;
let toastTimer;
let shutdownInProgress = false;
const uiThemeStorageKey = "ghosttyle-ui-theme";
const uiThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const uiLanguageStorageKey = "ghosttyle-ui-language";
let currentLanguage = document.documentElement.dataset.uiLanguage === "en" ? "en" : "zh";

const textBindings = [
  [".ui-theme-control > span", "top.interface"],
  ['[data-ui-theme-mode="system"]', "top.system"],
  ['[data-ui-theme-mode="light"]', "top.light"],
  ['[data-ui-theme-mode="dark"]', "top.dark"],
  ["#shutdown-label", "top.exit"],
  ["#ghostty-version", "top.connecting"],
  ['.nav-item[data-panel="themes"] span:last-child', "nav.themes"],
  ['.nav-item[data-panel="common"] span:last-child', "nav.common"],
  ['.nav-item[data-panel="raw"] span:last-child', "nav.raw"],
  [".sidebar-label", "sidebar.current"],
  ["#config-path", "sidebar.reading"],
  [".sidebar-note p", "sidebar.note"],
  ["#notice-title", "notice.initial"],
  ["#shutdown-title", "shutdown.title"],
  ["#shutdown-message", "shutdown.message"],
  ["#close-page-button", "shutdown.close"],
  ["#shutdown-hint", "shutdown.hint"],
  ['[data-panel-content="themes"] .section-heading h2', "themes.heading"],
  ['[data-panel-content="themes"] .section-heading > div > p:last-child', "themes.description"],
  ['[data-theme-mode="system"]', "themes.followSystem"],
  ['[data-theme-mode="single"]', "themes.single"],
  ['[data-theme-slot-button="light"] .theme-slot-name', "themes.lightTheme"],
  ['[data-theme-slot-button="dark"] .theme-slot-name', "themes.darkTheme"],
  [".theme-slot-state", "themes.activeTarget"],
  ['label:has(#single-theme-select) > span', "themes.currentTheme"],
  ["#preview-name", "themes.preview"],
  ['#theme-filter [data-filter="all"]', "themes.all"],
  ['#theme-filter [data-filter="light"]', "themes.light"],
  ['#theme-filter [data-filter="dark"]', "themes.dark"],
  ['[data-panel-content="common"] .section-heading h2', "common.heading"],
  ['[data-panel-content="common"] .section-heading > div > p:last-child', "common.description"],
  ['label:has(#font-family) > span', "font.family"],
  ['label:has(#font-size) > span', "font.size"],
  ['label:has(#font-thicken) > span', "font.thicken"],
  ['.settings-card:has(#font-family) h3', "font.heading"],
  ['.settings-card:has(#font-family) .settings-card-heading p', "font.description"],
  ['.settings-card:has(#background-opacity) h3', "background.heading"],
  ['.settings-card:has(#background-opacity) .settings-card-heading p', "background.description"],
  ['label:has(#background-opacity) > span', "background.opacity"],
  ['label:has(#background-blur) > span', "background.blur"],
  ['.settings-card:has(#cursor-style) h3', "cursor.heading"],
  ['.settings-card:has(#cursor-style) .settings-card-heading p', "cursor.description"],
  ['label:has(#cursor-style) > span', "cursor.shape"],
  ['label:has(#cursor-style-blink) > span', "cursor.blink"],
  ['label:has(#mouse-hide-while-typing) > span', "cursor.hideMouse"],
  ['.settings-card:has(#window-padding-x) h3', "window.heading"],
  ['.settings-card:has(#window-padding-x) .settings-card-heading p', "window.description"],
  ['label:has(#window-padding-x) > span', "window.paddingX"],
  ['label:has(#window-padding-y) > span', "window.paddingY"],
  ['label:has(#macos-titlebar-style) > span', "window.titlebar"],
  ['label:has(#confirm-close-surface) > span', "window.closeConfirm"],
  ['label:has(#copy-on-select) > span', "window.copyOnSelect"],
  ['[data-panel-content="raw"] .section-heading h2', "raw.heading"],
  ['[data-panel-content="raw"] .section-heading > div > p:last-child', "raw.description"],
  ["#reload-button", "raw.reload"],
  ["#dirty-label", "actions.synced"],
  ["#validate-button", "actions.validate"],
  ["#save-only-button", "actions.saveOnly"],
  ["#save-button", "actions.saveLoad"],
];

const optionBindings = [
  ["#font-thicken", "", "common.default"], ["#font-thicken", "true", "common.on"], ["#font-thicken", "false", "common.off"],
  ["#background-blur", "", "common.default"], ["#background-blur", "false", "common.off"], ["#background-blur", "true", "background.standardBlur"],
  ["#background-blur", "20", "background.intensity20"], ["#background-blur", "40", "background.intensity40"],
  ["#background-blur", "macos-glass-regular", "background.glass"], ["#background-blur", "macos-glass-clear", "background.clearGlass"],
  ["#cursor-style", "", "common.default"], ["#cursor-style", "block", "cursor.block"], ["#cursor-style", "bar", "cursor.bar"],
  ["#cursor-style", "underline", "cursor.underline"], ["#cursor-style", "block_hollow", "cursor.hollow"],
  ["#cursor-style-blink", "", "cursor.program"], ["#cursor-style-blink", "true", "cursor.alwaysBlink"], ["#cursor-style-blink", "false", "cursor.noBlink"],
  ["#mouse-hide-while-typing", "", "common.default"], ["#mouse-hide-while-typing", "true", "common.on"], ["#mouse-hide-while-typing", "false", "common.off"],
  ["#macos-titlebar-style", "", "common.default"], ["#macos-titlebar-style", "native", "window.native"],
  ["#macos-titlebar-style", "transparent", "window.transparent"], ["#macos-titlebar-style", "tabs", "window.tabs"], ["#macos-titlebar-style", "hidden", "window.hidden"],
  ["#confirm-close-surface", "", "common.default"], ["#confirm-close-surface", "true", "window.closeNeeded"],
  ["#confirm-close-surface", "always", "window.closeAlways"], ["#confirm-close-surface", "false", "window.closeNever"],
  ["#copy-on-select", "", "common.default"], ["#copy-on-select", "true", "common.on"], ["#copy-on-select", "false", "common.off"],
];

function t(key, parameters = {}) {
  return translate(currentLanguage, key, parameters);
}

function applyUiThemePreference(preference, options = {}) {
  const normalized = ["system", "light", "dark"].includes(preference) ? preference : "system";
  const resolved = normalized === "system" ? (uiThemeMedia.matches ? "dark" : "light") : normalized;
  document.documentElement.dataset.uiThemePreference = normalized;
  document.documentElement.dataset.uiTheme = resolved;
  $$('[data-ui-theme-mode]').forEach((button) => {
    button.classList.toggle("is-active", button.dataset.uiThemeMode === normalized);
    button.setAttribute("aria-pressed", String(button.dataset.uiThemeMode === normalized));
  });
  if (options.persist !== false) {
    try {
      localStorage.setItem(uiThemeStorageKey, normalized);
    } catch {
      // The selected mode still applies for this page if storage is unavailable.
    }
  }
}

const attributeBindings = [
  [".language-control", "aria-label", "top.languageAria"],
  [".ui-theme-control", "aria-label", "top.interfaceAria"],
  ['[data-ui-theme-mode="system"]', "title", "top.systemTitle"],
  ['[data-ui-theme-mode="light"]', "title", "top.lightTitle"],
  ['[data-ui-theme-mode="dark"]', "title", "top.darkTitle"],
  ["#shutdown-button", "title", "top.exitTitle"],
  ["#shutdown-button", "aria-label", "top.exitTitle"],
  ["#back-to-top", "title", "actions.backToTop"],
  ["#back-to-top", "aria-label", "actions.backToTop"],
  [".nav-list", "aria-label", "nav.aria"],
  ["#dismiss-notice", "aria-label", "notice.dismiss"],
  ["#theme-mode", "aria-label", "themes.modeAria"],
  ["#light-theme-select", "aria-label", "themes.lightTheme"],
  ["#dark-theme-select", "aria-label", "themes.darkTheme"],
  ["#theme-search", "placeholder", "themes.search"],
  ["#font-family", "placeholder", "font.default"],
  ["#window-padding-x", "placeholder", "window.paddingPlaceholder"],
  ["#window-padding-y", "placeholder", "window.paddingPlaceholder"],
  ["#raw-config", "aria-label", "raw.aria"],
];

function translateStaticUi() {
  for (const [selector, key] of textBindings) {
    $$(selector).forEach((element) => { element.textContent = t(key); });
  }
  for (const [selector, attribute, key] of attributeBindings) {
    $$(selector).forEach((element) => element.setAttribute(attribute, t(key)));
  }
  for (const [selector, value, key] of optionBindings) {
    const select = $(selector);
    const option = select ? [...select.options].find((candidate) => candidate.value === value && !candidate.dataset.currentValue) : null;
    if (option) option.textContent = t(key);
  }
  $$('option[data-current-value="true"]').forEach((option) => {
    option.textContent = t("select.currentValue", { value: option.value });
  });
}

function applyLanguage(language, options = {}) {
  currentLanguage = language === "en" ? "en" : "zh";
  document.documentElement.dataset.uiLanguage = currentLanguage;
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  $$('[data-ui-language]').forEach((button) => {
    const active = button.dataset.uiLanguage === currentLanguage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (options.persist !== false) {
    try {
      localStorage.setItem(uiLanguageStorageKey, currentLanguage);
    } catch {
      // Keep the language active for this page if storage is unavailable.
    }
  }
  translateStaticUi();
  if (!state.loaded) return;
  populateThemeControls();
  hydrateCommonFields();
  renderThemeGallery();
  updatePreview();
  updateDirtyState();
  updateEditorStats();
  updateAppMetadata({ config: { path: state.configPath }, themes: state.themes, fonts: state.fonts, ghostty: state.ghostty, automation: state.automation });
  renderNotice();
}

function normalizeText(text) {
  return String(text || "").replace(/\r\n/g, "\n");
}

function isDirty() {
  return normalizeText(state.content) !== normalizeText(state.savedContent);
}

function setBusy(busy) {
  state.busy = busy;
  elements.saveButton.disabled = busy;
  elements.saveOnlyButton.disabled = busy || !isDirty();
  elements.validateButton.disabled = busy;
  elements.reloadButton.disabled = busy;
  updateShutdownButton();
  updateDirtyState();
}

function updateShutdownButton() {
  if (!elements.shutdownButton) return;
  elements.shutdownButton.disabled = state.busy || shutdownInProgress || !state.automation.shutdownSupported;
}

function updateDirtyState() {
  const dirty = isDirty();
  elements.dirtyDot.classList.toggle("is-dirty", dirty);
  elements.dirtyLabel.textContent = t(dirty ? "actions.dirty" : "actions.synced");
  elements.saveButton.textContent = state.automation.reloadSupported
    ? t(dirty ? "actions.saveLoad" : "actions.loadGhostty")
    : t("actions.saveBackup");
  elements.saveButton.disabled = state.busy || (!state.automation.reloadSupported && !dirty);
  elements.saveOnlyButton.disabled = state.busy || !dirty;
}

function updateEditorStats() {
  const lineCount = state.content ? state.content.split(/\r?\n/).length : 0;
  const byteCount = new Blob([state.content]).size;
  elements.editorStats.textContent = t("status.editorStats", { lines: lineCount, bytes: byteCount });
}

function showToast(message, type = "success") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", type === "error");
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 4_200);
}

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.validation) {
    throw new Error(payload.error || t("error.request", { status: response.status }));
  }
  return payload;
}

async function post(path, content = undefined, extra = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ghostty-UI-Token": state.token,
    },
    body: JSON.stringify({ ...(content === undefined ? {} : { content }), ...extra }),
  });
  return readResponse(response);
}

function renderShutdownScreen(stage) {
  const complete = stage === "complete";
  elements.shutdownScreen.classList.remove("is-hidden");
  document.body.classList.add("is-shutting-down");
  elements.shutdownTitle.textContent = t(complete ? "shutdown.title" : "shutdown.workingTitle");
  elements.shutdownMessage.textContent = t(complete ? "shutdown.message" : "shutdown.workingMessage");
  elements.closePageButton.classList.toggle("is-hidden", !complete);
  elements.shutdownHint.classList.toggle("is-hidden", !complete);
  document.title = t(complete ? "shutdown.title" : "shutdown.workingTitle");
}

function attemptClosePage() {
  try {
    window.close();
  } catch {
    // Browsers may refuse to close a tab that was not opened by script.
  }
}

function updateBackToTop() {
  const visible = window.scrollY > 420;
  elements.backToTop.classList.toggle("is-visible", visible);
  elements.backToTop.setAttribute("aria-hidden", String(!visible));
  elements.backToTop.tabIndex = visible ? 0 : -1;
}

function scrollBackToTop() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
}

async function shutdownGhosttyle() {
  const confirmationKey = isDirty() ? "confirm.shutdownDirty" : "confirm.shutdown";
  if (!window.confirm(t(confirmationKey))) return;

  shutdownInProgress = true;
  updateShutdownButton();
  $("#shutdown-label").textContent = t("top.exiting");
  renderShutdownScreen("working");

  const request = fetch("/api/shutdown", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Ghostty-UI-Token": state.token,
    },
    body: "{}",
    keepalive: true,
  }).then(readResponse);

  // Run before the first await so browsers that permit script-closing still
  // treat it as part of the user's click gesture.
  attemptClosePage();

  try {
    const result = await request;
    if (!result.ok) throw new Error(t("shutdown.failed"));
    renderShutdownScreen("complete");
    setTimeout(attemptClosePage, 180);
  } catch (error) {
    shutdownInProgress = false;
    elements.shutdownScreen.classList.add("is-hidden");
    document.body.classList.remove("is-shutting-down");
    document.title = "Ghosttyle";
    $("#shutdown-label").textContent = t("top.exit");
    updateShutdownButton();
    showToast(error.message || t("shutdown.failed"), "error");
  }
}

function selectThemeObject(name) {
  return state.themes.find((theme) => theme.name === name);
}

function preferredTheme(mode) {
  const exactName = mode === "light" ? "Builtin Light" : "Builtin Dark";
  return selectThemeObject(exactName)?.name || state.themes.find((theme) => theme.mode === mode)?.name || state.themes[0]?.name || "";
}

function addOption(select, value, label, options = {}) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.disabled = Boolean(options.disabled);
  if (options.currentValue) option.dataset.currentValue = "true";
  select.append(option);
}

function populateThemeSelect(select, selected, preferredMode = "all") {
  select.replaceChildren();
  addOption(select, "", t("select.defaultTheme"));

  if (selected && !selectThemeObject(selected)) {
    addOption(select, selected, t("select.missing", { name: selected }));
  }

  const sorted = [...state.themes].sort((left, right) => {
    const leftPreferred = preferredMode === "all" || left.mode === preferredMode ? 0 : 1;
    const rightPreferred = preferredMode === "all" || right.mode === preferredMode ? 0 : 1;
    return leftPreferred - rightPreferred || left.name.localeCompare(right.name);
  });

  for (const theme of sorted) {
    const suffix = theme.mode === preferredMode || preferredMode === "all"
      ? ""
      : ` · ${t(theme.mode === "light" ? "select.modeSuffixLight" : "select.modeSuffixDark")}`;
    addOption(select, theme.name, `${theme.name}${suffix}`);
  }
  select.value = selected || "";
}

function populateThemeControls() {
  populateThemeSelect(elements.lightTheme, state.themeSelection.light, "light");
  populateThemeSelect(elements.darkTheme, state.themeSelection.dark, "dark");
  populateThemeSelect(elements.singleTheme, state.themeSelection.single, "all");

  $$("[data-theme-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.themeMode === state.themeSelection.mode);
  });
  const systemMode = state.themeSelection.mode === "system";
  elements.systemThemeFields.classList.toggle("is-hidden", !systemMode);
  elements.singleThemeFields.classList.toggle("is-hidden", systemMode);
  updateThemeTargetUi(systemMode);
}

function updateThemeTargetUi(systemMode = state.themeSelection.mode === "system") {
  elements.lightTheme.closest(".field")?.classList.toggle("is-previewing", systemMode && state.previewSlot === "light");
  elements.darkTheme.closest(".field")?.classList.toggle("is-previewing", systemMode && state.previewSlot === "dark");
  $$('[data-theme-slot-button]').forEach((button) => {
    const active = systemMode && button.dataset.themeSlotButton === state.previewSlot;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (elements.systemThemeHint) {
    elements.systemThemeHint.textContent = t(state.previewSlot === "dark"
      ? "themes.assignmentHintDark"
      : "themes.assignmentHintLight");
  }
}

function setPreviewSlot(slot) {
  if (slot !== "light" && slot !== "dark") return;
  const changed = state.previewSlot !== slot;
  state.previewSlot = slot;
  updateThemeTargetUi();
  updatePreview();
  if (changed && state.loaded) renderThemeGallery();
}

function currentThemeName() {
  if (state.themeSelection.mode === "single") return state.themeSelection.single;
  return state.themeSelection[state.previewSlot];
}

function updatePreview() {
  const requestedName = currentThemeName();
  const missing = missingThemeSelections(formatThemeValue(state.themeSelection), state.themes.map((theme) => theme.name));
  const missingCurrent = missing.find((item) => item.slot === (state.themeSelection.mode === "single" ? "single" : state.previewSlot));
  const previewTheme = selectThemeObject(requestedName)
    || selectThemeObject(missingCurrent?.suggestion)
    || state.themes.find((theme) => theme.mode === state.previewSlot)
    || state.themes[0];

  if (!previewTheme) return;
  const colors = previewTheme.palette.length
    ? previewTheme.palette
    : [previewTheme.foreground, previewTheme.cursor, "#8bc5ff", "#ffd479", "#e898ff"];
  elements.terminalPreview.style.background = previewTheme.background;
  elements.terminalPreview.style.color = previewTheme.foreground;
  elements.terminalPreview.style.setProperty("--term-cursor", previewTheme.cursor);
  elements.terminalPreview.style.setProperty("--term-green", colors[1] || previewTheme.cursor);
  elements.terminalPreview.style.setProperty("--term-blue", colors[3] || colors[0] || previewTheme.foreground);
  elements.terminalPreview.style.setProperty("--term-yellow", colors[2] || previewTheme.foreground);
  elements.terminalPreview.style.setProperty("--term-accent", colors[4] || colors[0] || previewTheme.cursor);
  elements.previewName.textContent = previewTheme.name;
  elements.previewThemeLabel.textContent = missingCurrent
    ? `${requestedName} → ${previewTheme.name}`
    : requestedName || t("theme.defaultPreview", { name: previewTheme.name });
  elements.previewPalette.replaceChildren();
  for (const color of colors) {
    const swatch = document.createElement("i");
    swatch.style.background = color;
    elements.previewPalette.append(swatch);
  }
}

function renderThemeGallery() {
  const query = state.themeSearch.trim().toLocaleLowerCase();
  const selectedName = state.themeSelection.mode === "system"
    ? state.themeSelection[state.previewSlot]
    : state.themeSelection.single;
  const filtered = state.themes.filter((theme) => {
    const matchesMode = state.themeFilter === "all" || theme.mode === state.themeFilter;
    const matchesSearch = !query || theme.name.toLocaleLowerCase().includes(query);
    return matchesMode && matchesSearch;
  });

  elements.galleryResult.textContent = `${filtered.length} / ${state.themes.length}`;
  elements.themeGallery.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-gallery";
    empty.textContent = t("theme.noMatches");
    elements.themeGallery.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const theme of filtered) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "theme-card";
    card.classList.toggle("is-selected", selectedName === theme.name);
    card.dataset.themeName = theme.name;
    card.style.setProperty("--card-bg", theme.background);
    card.style.setProperty("--card-fg", theme.foreground);
    card.style.setProperty("--card-accent", theme.cursor);

    const head = document.createElement("div");
    head.className = "theme-card-head";
    const name = document.createElement("strong");
    name.textContent = theme.name;
    const badge = document.createElement("small");
    badge.textContent = t(theme.source === "resources" ? "theme.builtIn" : "theme.user");
    head.append(name, badge);

    const code = document.createElement("div");
    code.className = "theme-code";
    code.append(document.createTextNode("➜ ~/ghostty\n"));
    const accent = document.createElement("span");
    accent.textContent = "✓ config valid";
    code.append(accent);

    const palette = document.createElement("div");
    palette.className = "theme-palette";
    const colors = theme.palette.length ? theme.palette : [theme.foreground, theme.cursor];
    for (const color of colors) {
      const swatch = document.createElement("i");
      swatch.style.background = color;
      palette.append(swatch);
    }
    const applyLabel = document.createElement("span");
    applyLabel.className = "theme-card-apply";
    if (state.themeSelection.mode === "system") {
      const lightTarget = state.previewSlot === "light";
      applyLabel.textContent = t(lightTarget ? "theme.useLight" : "theme.useDark");
      card.setAttribute("aria-label", t(lightTarget ? "theme.applyLight" : "theme.applyDark", { name: theme.name }));
    } else {
      applyLabel.textContent = t("theme.useSingle");
      card.setAttribute("aria-label", t("theme.applySingle", { name: theme.name }));
    }

    card.append(head, code, palette, applyLabel);
    card.addEventListener("click", () => chooseTheme(theme.name));
    fragment.append(card);
  }
  elements.themeGallery.append(fragment);
}

function syncRawEditor() {
  if (elements.rawConfig.value !== state.content) elements.rawConfig.value = state.content;
  updateDirtyState();
  updateEditorStats();
}

function syncThemeToContent() {
  const themeValue = formatThemeValue(state.themeSelection);
  state.content = setConfigValue(state.content, "theme", themeValue);
  syncRawEditor();
  populateThemeControls();
  renderThemeGallery();
  updatePreview();
  state.showSuccess = false;
  state.reloadResult = null;
  renderNotice();
}

function chooseTheme(name) {
  if (state.themeSelection.mode === "system") {
    state.themeSelection[state.previewSlot] = name;
  } else {
    state.themeSelection.single = name;
  }
  syncThemeToContent();
}

function setThemeMode(mode) {
  if (mode === state.themeSelection.mode) return;
  if (mode === "system") {
    const singleTheme = selectThemeObject(state.themeSelection.single);
    state.themeSelection.light = state.themeSelection.light
      || (singleTheme?.mode === "light" ? singleTheme.name : "")
      || preferredTheme("light");
    state.themeSelection.dark = state.themeSelection.dark
      || (singleTheme?.mode === "dark" ? singleTheme.name : "")
      || preferredTheme("dark");
    state.previewSlot = "light";
  } else {
    state.themeSelection.single = state.themeSelection.single
      || state.themeSelection[state.previewSlot]
      || state.themeSelection.dark
      || state.themeSelection.light;
  }
  state.themeSelection.mode = mode;
  syncThemeToContent();
}

function ensureSelectValue(select, value) {
  if (value && ![...select.options].some((option) => option.value === value)) {
    addOption(select, value, t("select.currentValue", { value }), { currentValue: true });
  }
  select.value = value || "";
}

function hydrateCommonFields() {
  for (const definition of FIELD_DEFINITIONS) {
    const control = $(`[data-config-key="${definition.key}"]`);
    if (!control) continue;
    const value = getConfigValue(state.content, definition.key, definition.strategy || "last");
    if (control.tagName === "SELECT") ensureSelectValue(control, value);
    else control.value = value;
  }
}

function hydrateFromContent(options = {}) {
  const themeValue = getConfigValue(state.content, "theme");
  state.themeSelection = parseThemeValue(themeValue);
  if (state.themeSelection.mode === "system" && !["light", "dark"].includes(state.previewSlot)) {
    state.previewSlot = "light";
  }
  populateThemeControls();
  hydrateCommonFields();
  renderThemeGallery();
  updatePreview();
  renderNotice();
  if (!options.skipRaw) syncRawEditor();
  else {
    updateDirtyState();
    updateEditorStats();
  }
}

function clearNoticeClasses() {
  elements.notice.classList.remove("is-success", "is-error", "is-hidden");
}

function localizedReloadMessage(result) {
  const keyByCode = {
    reloaded: "reload.reloaded",
    unsupported: "reload.unsupported",
    permission_denied: "reload.permissionDenied",
    not_running: "reload.notRunning",
    no_windows: "reload.noWindows",
    applescript_disabled: "reload.disabled",
    failed: "reload.failed",
  };
  return result?.code && keyByCode[result.code]
    ? t(keyByCode[result.code])
    : result?.message || t("reload.failed");
}

function renderNotice() {
  const themeValue = getConfigValue(state.content, "theme");
  const missing = missingThemeSelections(themeValue, state.themes.map((theme) => theme.name));
  elements.repairActions.replaceChildren();

  if (missing.length) {
    clearNoticeClasses();
    elements.noticeIcon.textContent = "!";
    elements.noticeTitle.textContent = t("notice.missingTitle");
    elements.noticeMessage.textContent = missing.map((item) => (
      item.suggestion
        ? t("notice.missingSuggestion", { name: item.name, suggestion: item.suggestion })
        : t("notice.missing", { name: item.name })
    )).join("\n");
    for (const item of missing.filter((entry) => entry.suggestion)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "repair-button";
      button.textContent = t("notice.replace", { name: item.suggestion });
      button.addEventListener("click", () => {
        state.themeSelection[item.slot] = item.suggestion;
        syncThemeToContent();
        showToast(t("notice.replaced", { name: item.suggestion }));
      });
      elements.repairActions.append(button);
    }
    return;
  }

  if (!state.validation.valid) {
    clearNoticeClasses();
    elements.notice.classList.add("is-error");
    elements.noticeIcon.textContent = "×";
    elements.noticeTitle.textContent = t("notice.validationFailed");
    elements.noticeMessage.textContent = state.validation.output || t("notice.checkRaw");
    return;
  }

  if (state.reloadResult && !state.reloadResult.ok) {
    clearNoticeClasses();
    elements.notice.classList.add("is-error");
    elements.noticeIcon.textContent = "×";
    elements.noticeTitle.textContent = t("notice.savedReloadFailed");
    elements.noticeMessage.textContent = localizedReloadMessage(state.reloadResult) || t("notice.automationHelp");
    if (state.reloadResult.supported !== false) {
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "repair-button";
      retryButton.textContent = t("notice.retryReload");
      retryButton.addEventListener("click", reloadGhosttyNow);
      elements.repairActions.append(retryButton);
    }
    return;
  }

  if (state.showSuccess) {
    clearNoticeClasses();
    elements.notice.classList.add("is-success");
    elements.noticeIcon.textContent = "✓";
    elements.noticeTitle.textContent = t(state.reloadResult?.ok ? "notice.reloadSuccess" : "notice.configValid");
    elements.noticeMessage.textContent = state.reloadResult?.ok
      ? localizedReloadMessage(state.reloadResult)
      : state.validation.output || t("notice.configAccepted");
    return;
  }

  elements.notice.classList.add("is-hidden");
}

function updateCommonSetting(control) {
  const key = control.dataset.configKey;
  const strategy = control.dataset.strategy || "last";
  state.content = setConfigValue(state.content, key, control.value, {
    strategy,
    removeAll: key !== "font-family",
  });
  state.showSuccess = false;
  state.reloadResult = null;
  syncRawEditor();
}

function updateAppMetadata(payload) {
  state.automation = payload.automation || { reloadSupported: false, shutdownSupported: false, method: "manual" };
  state.ghostty = payload.ghostty;
  state.configPath = payload.config.path;
  elements.configPath.textContent = payload.config.path;
  elements.configPath.title = payload.config.path;
  elements.editorFile.textContent = payload.config.path.split("/").at(-1) || "config.ghostty";
  elements.themeCount.textContent = t("sidebar.themeCount", { count: payload.themes.length });
  elements.fontCount.textContent = t("sidebar.fontCount", { count: payload.fonts.length });
  elements.ghosttyDot.classList.toggle("is-ok", payload.ghostty.found);
  elements.ghosttyDot.classList.toggle("is-error", !payload.ghostty.found);
  elements.ghosttyVersion.textContent = payload.ghostty.found
    ? `Ghostty ${payload.ghostty.version}`
    : t("status.ghosttyMissing");
  updateShutdownButton();
}

function populateFonts() {
  elements.fontOptions.replaceChildren();
  for (const font of state.fonts) {
    const option = document.createElement("option");
    option.value = font;
    elements.fontOptions.append(option);
  }
}

async function loadState(options = {}) {
  setBusy(true);
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    const payload = await readResponse(response);
    state.token = payload.token;
    state.themes = payload.themes;
    state.fonts = payload.fonts;
    state.content = payload.config.content;
    state.savedContent = payload.config.content;
    state.validation = payload.validation;
    state.showSuccess = false;
    state.reloadResult = null;
    state.loaded = true;
    updateAppMetadata(payload);
    populateFonts();
    hydrateFromContent();
    if (options.notify) showToast(t("toast.diskReloaded"));
  } catch (error) {
    elements.ghosttyDot.classList.add("is-error");
    elements.ghosttyVersion.textContent = t("status.connectionFailed");
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function validateCurrentConfig() {
  setBusy(true);
  try {
    const payload = await post("/api/validate", state.content);
    state.validation = payload.validation;
    state.showSuccess = payload.validation.valid;
    renderNotice();
    showToast(t(payload.validation.valid ? "toast.validationPassed" : "toast.validationFailed"), payload.validation.valid ? "success" : "error");
    return payload.validation.valid;
  } catch (error) {
    showToast(error.message, "error");
    return false;
  } finally {
    setBusy(false);
  }
}

async function reloadGhosttyNow() {
  if (!state.automation.reloadSupported) {
    showToast(t("toast.reloadUnsupported"), "error");
    return false;
  }
  setBusy(true);
  try {
    const payload = await post("/api/reload");
    state.reloadResult = payload.reload;
    state.showSuccess = Boolean(payload.reload?.ok);
    renderNotice();
    showToast(
      payload.reload ? localizedReloadMessage(payload.reload) : t("toast.reloadFinished"),
      payload.reload?.ok ? "success" : "error",
    );
    return Boolean(payload.reload?.ok);
  } catch (error) {
    showToast(error.message, "error");
    return false;
  } finally {
    setBusy(false);
  }
}

async function saveCurrentConfig(options = {}) {
  const shouldReload = options.reload === true && state.automation.reloadSupported;
  if (shouldReload && !isDirty()) return reloadGhosttyNow();
  setBusy(true);
  try {
    const payload = await post("/api/save", state.content, { reload: shouldReload });
    state.validation = payload.validation;
    if (!payload.validation.valid) {
      state.showSuccess = false;
      state.reloadResult = null;
      renderNotice();
      showToast(t("toast.saveBlocked"), "error");
      return;
    }
    state.content = state.content.endsWith("\n") ? state.content : `${state.content}\n`;
    state.savedContent = state.content;
    state.reloadResult = payload.reload;
    state.showSuccess = payload.reload ? payload.reload.ok : true;
    syncRawEditor();
    renderNotice();
    const backupMessage = payload.backupPath ? t("toast.backup", { path: payload.backupPath }) : "";
    if (payload.reload?.ok) {
      showToast(t("toast.savedReloaded", { backup: backupMessage }));
    } else if (payload.reload) {
      showToast(t("toast.savedReloadFailed", { backup: backupMessage, message: localizedReloadMessage(payload.reload) }), "error");
    } else {
      showToast(t("toast.saved", { backup: backupMessage }));
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function bindEvents() {
  applyUiThemePreference(document.documentElement.dataset.uiThemePreference || "system", { persist: false });
  applyLanguage(document.documentElement.dataset.uiLanguage || "zh", { persist: false });
  $$('[data-ui-theme-mode]').forEach((button) => {
    button.addEventListener("click", () => applyUiThemePreference(button.dataset.uiThemeMode));
  });
  $$('[data-ui-language]').forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.uiLanguage));
  });
  uiThemeMedia.addEventListener("change", () => {
    if (document.documentElement.dataset.uiThemePreference === "system") {
      applyUiThemePreference("system", { persist: false });
    }
  });

  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item === button));
      $$("[data-panel-content]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panelContent === button.dataset.panel));
    });
  });

  $$("[data-theme-mode]").forEach((button) => button.addEventListener("click", () => setThemeMode(button.dataset.themeMode)));
  $$('[data-theme-slot-button]').forEach((button) => {
    button.addEventListener("click", () => setPreviewSlot(button.dataset.themeSlotButton));
  });
  elements.lightTheme.addEventListener("change", () => {
    state.previewSlot = "light";
    state.themeSelection.light = elements.lightTheme.value;
    syncThemeToContent();
  });
  elements.darkTheme.addEventListener("change", () => {
    state.previewSlot = "dark";
    state.themeSelection.dark = elements.darkTheme.value;
    syncThemeToContent();
  });
  elements.lightTheme.addEventListener("pointerdown", () => setPreviewSlot("light"));
  elements.darkTheme.addEventListener("pointerdown", () => setPreviewSlot("dark"));
  elements.lightTheme.addEventListener("focus", () => setPreviewSlot("light"));
  elements.darkTheme.addEventListener("focus", () => setPreviewSlot("dark"));
  elements.singleTheme.addEventListener("change", () => {
    state.themeSelection.single = elements.singleTheme.value;
    syncThemeToContent();
  });

  elements.themeSearch.addEventListener("input", () => {
    state.themeSearch = elements.themeSearch.value;
    renderThemeGallery();
  });
  $$("#theme-filter [data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.themeFilter = button.dataset.filter;
    $$("#theme-filter [data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderThemeGallery();
  }));

  $$('[data-config-key]').forEach((control) => {
    control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => updateCommonSetting(control));
  });

  elements.rawConfig.addEventListener("input", () => {
    state.content = elements.rawConfig.value;
    state.showSuccess = false;
    state.reloadResult = null;
    updateDirtyState();
    updateEditorStats();
    clearTimeout(rawSyncTimer);
    rawSyncTimer = setTimeout(() => hydrateFromContent({ skipRaw: true }), 350);
  });

  elements.validateButton.addEventListener("click", validateCurrentConfig);
  elements.saveOnlyButton.addEventListener("click", () => saveCurrentConfig({ reload: false }));
  elements.saveButton.addEventListener("click", () => saveCurrentConfig({ reload: state.automation.reloadSupported }));
  elements.shutdownButton.addEventListener("click", shutdownGhosttyle);
  elements.closePageButton.addEventListener("click", attemptClosePage);
  elements.backToTop.addEventListener("click", scrollBackToTop);
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
  elements.reloadButton.addEventListener("click", async () => {
    if (isDirty() && !window.confirm(t("confirm.discard"))) return;
    await loadState({ notify: true });
  });
  elements.dismissNotice.addEventListener("click", () => elements.notice.classList.add("is-hidden"));

  window.addEventListener("beforeunload", (event) => {
    if (shutdownInProgress || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

bindEvents();
loadState();
