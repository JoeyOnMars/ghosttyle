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
  exploreTabThemes: $("#explore-tab-themes"),
  exploreTabFonts: $("#explore-tab-fonts"),
  exploreThemesGrid: $("#explore-themes-grid"),
  exploreFontsGrid: $("#explore-fonts-grid"),
  exploreThemeCount: $("#explore-theme-count"),
  exploreFontCount: $("#explore-font-count"),
  backgroundOpacity: $("#background-opacity"),
  commonOpacityVal: $("#common-opacity-val"),
  themeOpacitySlider: $("#theme-opacity-slider"),
  stageBlurSelect: $("#stage-blur-select"),
  previewOpacityVal: $("#preview-opacity-val"),
  fontFamily: $("#font-family"),
  fontFamilyInput: $("#font-family-input"),
  toggleFontInput: $("#toggle-font-input"),
  cursorStyle: $("#cursor-style"),
  cursorGraphicPicker: $("#cursor-graphic-picker"),
  shellIntegrationFeatures: $("#shell-integration-features"),
  fontCount: $("#font-count"),
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
  terminalCursor: $("#terminal-cursor"),
  previewPalette: $("#preview-palette"),
  previewThemeLabel: $("#preview-theme-label"),
  rawConfig: $("#raw-config"),
  reloadButton: $("#reload-button"),
  repairActions: $("#repair-actions"),
  saveButton: $("#save-button"),
  terminalPreview: $("#terminal-preview"),
  themeCount: $("#theme-count"),
  themeGallery: $("#theme-gallery"),
  themeSearch: $("#theme-search"),
  toast: $("#toast"),
  validateButton: $("#validate-button"),
  navHistoryLabel: $("#nav-history-label"),
  historyCount: $("#history-count"),
  refreshHistoryButton: $("#refresh-history-button"),
  historyBadgeCount: $("#history-badge-count"),
  historyList: $("#history-list"),
  historyPreviewTitle: $("#history-preview-title"),
  historyPreviewMeta: $("#history-preview-meta"),
  historyCodeView: $("#history-code-view"),
  restoreHistoryButton: $("#restore-history-button"),
  historyRenameButton: $("#history-rename-button"),
  historyViewSwitch: $("#history-view-switch"),
  historyViewVisualBtn: $("#history-view-visual-btn"),
  historyViewCodeBtn: $("#history-view-code-btn"),
  historyVisualView: $("#history-visual-view"),
  historyChipsRow: $("#history-chips-row"),
  historyTerminalCard: $("#history-terminal-card"),
  historyCardTermTitle: $("#history-card-term-title"),
  historyTerminalBody: $("#history-terminal-body"),
  historyPreviewThemeVal: $("#history-preview-theme-val"),
  historyPreviewFontVal: $("#history-preview-font-val"),
  historyPreviewCursorVal: $("#history-preview-cursor-val"),
  historyTerminalCursor: $("#history-terminal-cursor"),
  historyPaletteStrip: $("#history-palette-strip"),
  previewSlotSwitch: $("#preview-slot-switch"),
  liveSyncToggle: $("#live-sync-toggle"),
  liveSyncText: $("#live-sync-text"),
  revertBaselineButton: $("#revert-baseline-button"),
  actionbar: $("#actionbar"),
  studioStageCard: $(".studio-stage-sticky-card"),
  mainWorkspace: $(".studio-workspace"),
};

function getPreferredSystemSlot() {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

const state = {
  automation: { reloadSupported: false, shutdownSupported: false },
  busy: false,
  content: "",
  dirty: false,
  fonts: [],
  ghostty: { found: false, version: "", build: "" },
  history: [],
  selectedHistoryId: "",
  historyLoaded: false,
  loaded: false,
  savedContent: "",
  baselineContent: "",
  liveSyncEnabled: localStorage.getItem("ghosttyle-live-sync") !== "false",
  liveSyncing: false,
  showSuccess: false,
  themeFilter: "all",
  themeSearch: "",
  themeSelection: { mode: "single", light: "", dark: "", single: "" },
  themes: [],
  token: "",
  validation: { valid: false, output: "Not validated yet." },
  previewSlot: getPreferredSystemSlot(),
  reloadResult: null,
  historyView: "visual",
  market: { themes: [], fonts: [], activeTab: "themes", loaded: false, loading: false },
};

let rawSyncTimer;
let liveSyncTimer;
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
  ['.nav-item[data-panel="explore"] span:last-child', "nav.explore"],
  ['.nav-item[data-panel="raw"] span:last-child', "nav.raw"],
  ["#explore-heading", "explore.heading"],
  ["#explore-description", "explore.description"],
  ['[data-explore-tab="themes"]', "explore.tabThemes"],
  ['[data-explore-tab="fonts"]', "explore.tabFonts"],
  ["#explore-themes-subtitle", "explore.themesSubtitle"],
  ["#explore-fonts-subtitle", "explore.fontsSubtitle"],
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
  ["#theme-mode-tip-text", "themes.dualModeTip"],
  ["#gallery-eyebrow", "themes.galleryEyebrow"],
  ["#gallery-heading", "themes.galleryHeading"],
  ["#gallery-description", "themes.galleryDescription"],
  ["#theme-opacity-label", "themes.windowOpacity"],
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
  ['#font-family-label', "font.family"],
  ['label:has(#font-size) > span', "font.size"],
  ['label:has(#font-thicken) > span', "font.thicken"],
  ['.settings-card:has(#font-family) h3', "font.heading"],
  ['.settings-card:has(#font-family) .settings-card-heading p', "font.description"],
  ['.settings-card:has(#background-opacity) h3', "background.heading"],
  ['.settings-card:has(#background-opacity) .settings-card-heading p', "background.description"],
  ['#common-opacity-label', "background.opacity"],
  ['label:has(#background-blur) > span', "background.blur"],
  ['.settings-card:has(#cursor-style) h3', "cursor.heading"],
  ['.settings-card:has(#cursor-style) .settings-card-heading p', "cursor.description"],
  ['label:has(#cursor-style) > span', "cursor.shape"],
  ['label:has(#cursor-style-blink) > span', "cursor.blink"],
  ['label:has(#shell-integration-features) > span', "cursor.shellIntegration"],
  ['#cursor-shell-callout-text', "cursor.shellTip"],
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
  ["#nav-history-label", "nav.history"],
  ["#history-heading", "history.heading"],
  ["#history-description", "history.description"],
  ["#refresh-history-button", "history.refresh"],
  ["#history-list-title", "history.listTitle"],
  ["#restore-history-button", "history.restore"],
  ["#dirty-label", "actions.synced"],
  ["#validate-button", "actions.validate"],
  ["#save-button", "actions.saveLoad"],
  ["#live-sync-text", "liveSync.title"],
  ["#revert-baseline-button", "liveSync.revert"],
  ["#history-eyebrow", "history.eyebrow"],
  ["#history-view-visual-btn", "history.viewVisual"],
  ["#history-view-code-btn", "history.viewCode"],
  ["#toggle-font-input", "font.manualInput"],
  [".opacity-scale-hints span:first-child", "themes.scaleOpaque"],
  [".opacity-scale-hints span:last-child", "themes.scaleTransparent"],
  ['[data-theme-slot-button="light"].slot-switch-btn', "themes.previewLightBtn"],
  ['[data-theme-slot-button="dark"].slot-switch-btn', "themes.previewDarkBtn"],
  ["#history-preview-title", "history.selectSnapshot"],
  ["#history-code-view", "history.selectPrompt"],
  ["#theme-blur-label", "themes.blurLabel"],
  ["#cursor-pill-default-text", "cursor.pillDefault"],
  ["#cursor-pill-block-text", "cursor.pillBlock"],
  ["#cursor-pill-bar-text", "cursor.pillBar"],
  ["#cursor-pill-underline-text", "cursor.pillUnderline"],
  ["#cursor-pill-hollow-text", "cursor.pillHollow"],
  ["#font-size-desc", "font.descSize"],
  ["#font-thicken-desc", "font.descThicken"],
  ["#background-blur-desc", "background.descBlur"],
  ["#cursor-shape-desc", "cursor.descShape"],
  ["#cursor-blink-desc", "cursor.descBlink"],
  ["#cursor-shell-desc", "cursor.descShell"],
  ["#cursor-hide-mouse-desc", "cursor.descHideMouse"],
  ["#window-padding-x-desc", "window.descPaddingX"],
  ["#window-padding-y-desc", "window.descPaddingY"],
  ["#window-titlebar-desc", "window.descTitlebar"],
  ["#window-close-confirm-desc", "window.descCloseConfirm"],
  ["#window-copy-on-select-desc", "window.descCopyOnSelect"],
];

const optionBindings = [
  ["#font-family", "", "font.defaultOption"],
  ["#font-thicken", "", "common.default"], ["#font-thicken", "true", "common.on"], ["#font-thicken", "false", "common.off"],
  ["#background-blur", "", "common.default"], ["#background-blur", "false", "common.off"],
  ["#background-blur", "20", "background.intensity20"], ["#background-blur", "40", "background.intensity40"],
  ["#background-blur", "macos-glass-regular", "background.glass"], ["#background-blur", "macos-glass-clear", "background.clearGlass"],
  ["#stage-blur-select", "", "common.default"], ["#stage-blur-select", "false", "common.off"],
  ["#stage-blur-select", "20", "background.intensity20"], ["#stage-blur-select", "40", "background.intensity40"],
  ["#stage-blur-select", "macos-glass-regular", "background.glass"], ["#stage-blur-select", "macos-glass-clear", "background.clearGlass"],
  ["#cursor-style", "", "common.default"], ["#cursor-style", "block", "cursor.block"], ["#cursor-style", "bar", "cursor.bar"],
  ["#cursor-style", "underline", "cursor.underline"], ["#cursor-style", "block_hollow", "cursor.hollow"],
  ["#cursor-style-blink", "", "cursor.program"], ["#cursor-style-blink", "true", "cursor.alwaysBlink"], ["#cursor-style-blink", "false", "cursor.noBlink"],
  ["#shell-integration-features", "", "cursor.shellDefault"], ["#shell-integration-features", "no-cursor", "cursor.shellNoCursor"],
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
  ["#font-family-input", "placeholder", "font.default"],
  ["#window-padding-x", "placeholder", "window.paddingPlaceholder"],
  ["#window-padding-y", "placeholder", "window.paddingPlaceholder"],
  ["#raw-config", "aria-label", "raw.aria"],
  ["#preview-slot-switch", "aria-label", "themes.slotSwitchAria"],
  ['[data-theme-slot-button="light"].slot-switch-btn', "title", "themes.previewLightTitle"],
  ['[data-theme-slot-button="dark"].slot-switch-btn', "title", "themes.previewDarkTitle"],
  ["#theme-opacity-slider", "aria-label", "themes.windowOpacity"],
  ["#background-opacity", "aria-label", "themes.windowOpacity"],
  ["#history-rename-button", "title", "history.renameTitle"],
  ["#history-view-switch", "aria-label", "history.viewSwitchAria"],
  ["#explore-mode", "aria-label", "explore.modeAria"],
  ["#live-sync-wrapper", "title", "liveSync.wrapperTitle"],
  ["#revert-baseline-button", "title", "liveSync.revertTitle"],
  ["#cursor-graphic-picker", "aria-label", "cursor.pickerAria"],
  ['.cursor-pill[data-value=""]', "title", "common.default"],
  ['.cursor-pill[data-value="block"]', "title", "cursor.block"],
  ['.cursor-pill[data-value="bar"]', "title", "cursor.bar"],
  ['.cursor-pill[data-value="underline"]', "title", "cursor.underline"],
  ['.cursor-pill[data-value="block_hollow"]', "title", "cursor.hollow"],
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
  populateFonts();
  hydrateCommonFields();
  renderThemeGallery();
  updateThemeTargetUi();
  if (state.market.loaded) {
    renderMarketThemes();
    renderMarketFonts();
  }
  if (state.history?.length) {
    renderHistoryList();
    const selected = state.history.find((item) => item.id === state.selectedHistoryId) || state.history[0];
    if (selected) previewHistoryItem(selected);
  }
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
  elements.saveButton.disabled = busy || !isDirty();
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
  elements.saveButton.textContent = t(dirty ? "actions.saveLoad" : "actions.savedReady");
  elements.saveButton.disabled = state.busy || !dirty;
  if (elements.revertBaselineButton) {
    const hasBaselineDiff = Boolean(state.baselineContent && normalizeText(state.content) !== normalizeText(state.baselineContent));
    elements.revertBaselineButton.classList.toggle("is-hidden", !hasBaselineDiff || state.busy);
  }
}

async function performLiveSync() {
  if (!state.automation.reloadSupported || !state.liveSyncEnabled || !state.loaded) return;
  if (!isDirty()) return;

  state.liveSyncing = true;
  try {
    const res = await fetch("/api/live-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ghostty-ui-token": state.token,
      },
      body: JSON.stringify({ content: state.content }),
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload.reload?.ok) {
        const slotHint = state.themeSelection.mode === "system"
          ? (state.previewSlot === "dark" ? ` (${t("themes.targetSlotDark")})` : ` (${t("themes.targetSlotLight")})`)
          : "";
        elements.dirtyLabel.textContent = `⚡️ ${t("liveSync.synced")}${slotHint}`;
      }
    }
  } catch (err) {
    console.warn("Live sync failed:", err);
  } finally {
    state.liveSyncing = false;
  }
}

function triggerLiveSync(immediate = false) {
  clearTimeout(liveSyncTimer);
  if (!state.automation.reloadSupported || !state.liveSyncEnabled || !state.loaded) return;
  if (immediate) {
    performLiveSync();
  } else {
    liveSyncTimer = setTimeout(performLiveSync, 180);
  }
}

async function revertToBaseline() {
  if (!state.baselineContent) return;
  setBusy(true);
  try {
    state.content = state.baselineContent;
    state.savedContent = state.baselineContent;
    syncRawEditor();
    hydrateFromContent();
    if (state.automation.reloadSupported && state.liveSyncEnabled) {
      await fetch("/api/live-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ghostty-ui-token": state.token,
        },
        body: JSON.stringify({ content: state.baselineContent }),
      });
    }
    showToast(t("liveSync.revertedToast"), "success");
  } catch (err) {
    showToast(t("explore.revertFailed", { err: err.message }), "error");
  } finally {
    setBusy(false);
  }
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
  elements.previewSlotSwitch?.classList.toggle("is-hidden", !systemMode);
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
    if (systemMode) {
      elements.systemThemeHint.textContent = t(state.previewSlot === "dark"
        ? "themes.assignmentHintDark"
        : "themes.assignmentHintLight");
    } else {
      elements.systemThemeHint.textContent = t("themes.assignmentHintSingle");
    }
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

function getTransparencyFromConfig(content) {
  const match = String(content || "").match(/^\s*background-opacity\s*=\s*([0-9.]+)/m);
  if (!match) return 0;
  const opacity = parseFloat(match[1]);
  if (Number.isNaN(opacity) || opacity >= 1) return 0;
  const transparency = Math.max(0, Math.min(1, 1 - opacity));
  return Math.round(transparency * 100) / 100;
}

function formatTransparencyBadge(transparency) {
  const pct = Math.round(transparency * 100);
  if (pct <= 0) return t("themes.opacityZero");
  if (pct <= 20) return `${pct}% (${t("themes.opacitySlight")})`;
  if (pct <= 40) return `${pct}% (${t("themes.opacityGlass")})`;
  if (pct <= 70) return `${pct}% (${t("themes.opacityMedium")})`;
  if (pct < 100) return `${pct}% (${t("themes.opacityHigh")})`;
  return `100% (${t("themes.opacityFull")})`;
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

  const currentTransparency = getTransparencyFromConfig(state.content);
  const badgeText = formatTransparencyBadge(currentTransparency);
  if (elements.themeOpacitySlider && document.activeElement !== elements.themeOpacitySlider) {
    elements.themeOpacitySlider.value = String(currentTransparency);
  }
  if (elements.backgroundOpacity && document.activeElement !== elements.backgroundOpacity) {
    elements.backgroundOpacity.value = String(currentTransparency);
  }
  if (elements.previewOpacityVal) {
    elements.previewOpacityVal.textContent = badgeText;
  }
  if (elements.commonOpacityVal) {
    elements.commonOpacityVal.textContent = badgeText;
  }
  const currentBlur = getConfigValue(state.content, "background-blur");
  const normalizedBlur = currentBlur === "true" ? "20" : (currentBlur || "");
  if (elements.stageBlurSelect && document.activeElement !== elements.stageBlurSelect) {
    elements.stageBlurSelect.value = normalizedBlur;
  }
  const bgBlur = $("#background-blur");
  if (bgBlur && document.activeElement !== bgBlur) {
    bgBlur.value = normalizedBlur;
  }

  const hasBlur = Boolean(normalizedBlur && normalizedBlur !== "false");
  // 核心逻辑：若开启了有效毛玻璃但当前未设置透明度（<=0），自适应呈现 25% 经典苹果磨砂通透度
  const effectiveTransparency = (currentTransparency <= 0 && hasBlur) ? 0.25 : currentTransparency;

  if (effectiveTransparency > 0) {
    const solidPct = Math.round((1 - effectiveTransparency) * 100);
    if (solidPct <= 0) {
      elements.terminalPreview.style.background = "transparent";
    } else {
      // 优化底色透光曲线，使得毛玻璃在浅色和深色主题下均保持通透高光感
      elements.terminalPreview.style.background = `color-mix(in srgb, ${previewTheme.background} ${solidPct}%, transparent)`;
    }
    
    if (!hasBlur) {
      elements.terminalPreview.style.backdropFilter = "none";
      elements.terminalPreview.style.webkitBackdropFilter = "none";
    } else if (normalizedBlur === "40") {
      elements.terminalPreview.style.backdropFilter = "blur(18px) saturate(175%) contrast(1.15)";
      elements.terminalPreview.style.webkitBackdropFilter = "blur(18px) saturate(175%) contrast(1.15)";
    } else if (normalizedBlur === "macos-glass-regular") {
      elements.terminalPreview.style.backdropFilter = "blur(12px) saturate(190%) contrast(1.1) brightness(1.04)";
      elements.terminalPreview.style.webkitBackdropFilter = "blur(12px) saturate(190%) contrast(1.1) brightness(1.04)";
    } else if (normalizedBlur === "macos-glass-clear") {
      elements.terminalPreview.style.backdropFilter = "blur(5px) saturate(140%) brightness(1.02)";
      elements.terminalPreview.style.webkitBackdropFilter = "blur(5px) saturate(140%) brightness(1.02)";
    } else {
      elements.terminalPreview.style.backdropFilter = "blur(9px) saturate(160%) contrast(1.05)";
      elements.terminalPreview.style.webkitBackdropFilter = "blur(9px) saturate(160%) contrast(1.05)";
    }
  } else {
    elements.terminalPreview.style.background = previewTheme.background;
    elements.terminalPreview.style.backdropFilter = "none";
    elements.terminalPreview.style.webkitBackdropFilter = "none";
  }

  elements.terminalPreview.style.color = previewTheme.foreground;
  elements.terminalPreview.style.setProperty("--term-cursor", previewTheme.cursor);
  elements.terminalPreview.style.setProperty("--term-green", colors[1] || previewTheme.cursor);
  elements.terminalPreview.style.setProperty("--term-blue", colors[3] || colors[0] || previewTheme.foreground);
  elements.terminalPreview.style.setProperty("--term-yellow", colors[2] || previewTheme.foreground);
  elements.terminalPreview.style.setProperty("--term-accent", colors[4] || colors[0] || previewTheme.cursor);

  const cursorStyle = getConfigValue(state.content, "cursor-style") || "block";
  const cursorBlink = getConfigValue(state.content, "cursor-style-blink");
  if (elements.terminalCursor) {
    elements.terminalCursor.className = `cursor is-${cursorStyle}${cursorBlink === "false" ? " no-blink" : ""}`;
  }

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
    let isSelected = false;
    let lightTarget = state.previewSlot === "light";
    if (state.themeSelection.mode === "system") {
      const targetSlot = theme.mode === "light" ? "light" : (theme.mode === "dark" ? "dark" : state.previewSlot);
      lightTarget = targetSlot === "light";
      isSelected = state.themeSelection[targetSlot] === theme.name;
    } else {
      isSelected = state.themeSelection.single === theme.name;
    }
    card.classList.toggle("is-selected", isSelected);
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
      if (isSelected) {
        applyLabel.textContent = t(lightTarget ? "theme.currentLight" : "theme.currentDark");
      } else {
        applyLabel.textContent = t(lightTarget ? "theme.useLight" : "theme.useDark");
      }
      card.setAttribute("aria-label", t(lightTarget ? "theme.applyLight" : "theme.applyDark", { name: theme.name }));
    } else {
      applyLabel.textContent = isSelected ? t("theme.currentSingle") : t("theme.useSingle");
      card.setAttribute("aria-label", t("theme.applySingle", { name: theme.name }));
    }

    card.append(head, code, palette, applyLabel);
    card.addEventListener("click", () => chooseTheme(theme.name));
    fragment.append(card);
  }
  elements.themeGallery.append(fragment);
}

async function loadMarketData(force = false) {
  if (state.market.loading || (state.market.loaded && !force)) return;
  state.market.loading = true;
  try {
    const response = await fetch("/api/market");
    if (!response.ok) throw new Error(t("error.request", { status: response.status }));
    const data = await response.json();
    state.market.themes = data.themes || [];
    state.market.fonts = data.fonts || [];
    state.market.loaded = true;
    renderMarketThemes();
    renderMarketFonts();
  } catch (error) {
    console.error("Failed to load market data:", error);
  } finally {
    state.market.loading = false;
  }
}

function renderMarketThemes() {
  if (!elements.exploreThemesGrid) return;
  elements.exploreThemesGrid.replaceChildren();
  if (elements.exploreThemeCount) {
    elements.exploreThemeCount.textContent = t("explore.themeCount", { count: state.market.themes.length });
  }

  const fragment = document.createDocumentFragment();
  for (const theme of state.market.themes) {
    const card = document.createElement("article");
    card.className = "explore-card theme-market-card";
    card.style.setProperty("--card-bg", theme.background);
    card.style.setProperty("--card-fg", theme.foreground);
    card.style.setProperty("--card-accent", theme.cursor);

    const head = document.createElement("div");
    head.className = "explore-card-head";
    const titleBlock = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = theme.name;
    const author = document.createElement("span");
    author.className = "explore-author";
    author.textContent = `@${theme.author}`;
    titleBlock.append(name, author);

    const badge = document.createElement("small");
    badge.className = "explore-badge";
    badge.textContent = theme.category.toUpperCase();
    head.append(titleBlock, badge);

    const desc = document.createElement("p");
    desc.className = "explore-desc";
    desc.textContent = currentLanguage === "en" ? theme.descriptionEn : theme.description;

    const palette = document.createElement("div");
    palette.className = "theme-palette";
    const colors = theme.palette.length ? theme.palette : [theme.foreground, theme.cursor];
    for (const color of colors) {
      const swatch = document.createElement("i");
      swatch.style.background = color;
      palette.append(swatch);
    }

    const footer = document.createElement("div");
    footer.className = "explore-card-footer";

    const isInstalled = theme.installed || state.themes.some((t) => t.name.toLowerCase() === theme.name.toLowerCase());
    if (isInstalled) {
      const status = document.createElement("span");
      status.className = "installed-badge";
      status.textContent = t("explore.installed");

      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "explore-action-button primary";
      applyBtn.textContent = t("explore.applyNow");
      applyBtn.addEventListener("click", () => {
        chooseTheme(theme.name);
        $('[data-panel="themes"]')?.click();
        showToast(t("notice.replaced", { name: theme.name }));
      });
      footer.append(status, applyBtn);
    } else {
      const installBtn = document.createElement("button");
      installBtn.type = "button";
      installBtn.className = "explore-action-button";
      installBtn.textContent = t("explore.install");
      installBtn.addEventListener("click", async () => {
        installBtn.disabled = true;
        installBtn.textContent = t("explore.installing");
        try {
          const res = await fetch("/api/market/install-theme", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-ghostty-ui-token": state.token,
            },
            body: JSON.stringify(theme),
          });
          if (!res.ok) throw new Error(t("error.request", { status: res.status }));
          const payload = await res.json();
          state.themes = payload.themes || state.themes;
          theme.installed = true;
          populateThemeControls();
          renderThemeGallery();
          renderMarketThemes();
          if (elements.themeCount) {
            elements.themeCount.textContent = t("sidebar.themeCount", { count: state.themes.length });
          }
          showToast(t("explore.installSuccess", { name: theme.name }));
        } catch (err) {
          installBtn.disabled = false;
          installBtn.textContent = t("explore.install");
          showToast(t("explore.installFailed", { error: err.message }), "error");
        }
      });
      footer.append(installBtn);
    }

    card.append(head, desc, palette, footer);
    fragment.append(card);
  }
  elements.exploreThemesGrid.append(fragment);
}

function renderMarketFonts() {
  if (!elements.exploreFontsGrid) return;
  elements.exploreFontsGrid.replaceChildren();
  if (elements.exploreFontCount) {
    elements.exploreFontCount.textContent = t("explore.fontCount", { count: state.market.fonts.length });
  }

  const fragment = document.createDocumentFragment();
  for (const font of state.market.fonts) {
    const card = document.createElement("article");
    card.className = "explore-card font-market-card";

    const head = document.createElement("div");
    head.className = "explore-card-head";
    const titleBlock = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = font.name;
    const author = document.createElement("span");
    author.className = "explore-author";
    author.textContent = font.publisher;
    titleBlock.append(name, author);

    const tagsBlock = document.createElement("div");
    tagsBlock.className = "font-tags";
    for (const tag of font.tags) {
      const tagBadge = document.createElement("span");
      tagBadge.className = "font-tag";
      tagBadge.textContent = tag;
      tagsBlock.append(tagBadge);
    }
    head.append(titleBlock, tagsBlock);

    const desc = document.createElement("p");
    desc.className = "explore-desc";
    desc.textContent = currentLanguage === "en" ? font.descriptionEn : font.description;

    const preview = document.createElement("div");
    preview.className = "font-sample-preview";
    preview.style.fontFamily = `"${font.fontFamilyMatch || font.name}", monospace`;
    preview.textContent = font.previewText;

    const footer = document.createElement("div");
    footer.className = "explore-card-footer";

    const isInstalled = font.installed || state.fonts.some((f) => f.toLowerCase() === font.name.toLowerCase() || (font.fontFamilyMatch && f.toLowerCase() === font.fontFamilyMatch.toLowerCase()));
    if (isInstalled) {
      const status = document.createElement("span");
      status.className = "installed-badge";
      status.textContent = t("explore.installed");

      const setBtn = document.createElement("button");
      setBtn.type = "button";
      setBtn.className = "explore-action-button primary";
      setBtn.textContent = t("explore.setAsFont");
      setBtn.addEventListener("click", () => {
        if (elements.fontFamily) {
          const fontName = font.fontFamilyMatch || font.name;
          ensureSelectValue(elements.fontFamily, fontName);
          if (elements.fontFamilyInput) elements.fontFamilyInput.value = fontName;
          updateCommonSetting(elements.fontFamily);
          $('[data-panel="common"]')?.click();
          showToast(t("explore.fontApplied", { font: font.name }));
        }
      });
      footer.append(status, setBtn);
    } else {
      const installBtn = document.createElement("button");
      installBtn.type = "button";
      installBtn.className = "explore-action-button";
      installBtn.textContent = t("explore.install");
      installBtn.addEventListener("click", async () => {
        installBtn.disabled = true;
        installBtn.textContent = t("explore.installing");
        try {
          const res = await fetch("/api/market/install-font", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-ghostty-ui-token": state.token,
            },
            body: JSON.stringify({ fontId: font.id }),
          });
          if (!res.ok) throw new Error(t("error.request", { status: res.status }));
          const payload = await res.json();
          state.fonts = payload.fonts || state.fonts;
          font.installed = true;
          populateFonts();
          renderMarketFonts();
          if (elements.fontCount) {
            elements.fontCount.textContent = t("sidebar.fontCount", { count: state.fonts.length });
          }
          showToast(t("explore.installFontSuccess", { name: font.name }));
        } catch (err) {
          installBtn.disabled = false;
          installBtn.textContent = t("explore.install");
          showToast(t("explore.installFailed", { error: err.message }), "error");
        }
      });
      footer.append(installBtn);
    }

    card.append(head, desc, preview, footer);
    fragment.append(card);
  }
  elements.exploreFontsGrid.append(fragment);
}

function formatHistoryDate(isoString) {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}

async function loadHistoryData() {
  try {
    const res = await fetch("/api/history", { cache: "no-store" });
    if (!res.ok) return;
    const payload = await res.json();
    state.history = payload.items || [];
    if (elements.historyCount) {
      elements.historyCount.textContent = t("sidebar.historyCount", { count: state.history.length });
    }
    if (elements.historyBadgeCount) {
      elements.historyBadgeCount.textContent = t("history.badgeCount", { count: state.history.length });
    }
    renderHistoryList();
  } catch (error) {
    console.error("Failed to load configuration history:", error);
  }
}

function renderHistoryList() {
  if (!elements.historyList) return;
  elements.historyList.replaceChildren();

  if (state.history.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty-message";
    empty.textContent = t("history.empty");
    elements.historyList.append(empty);
    if (elements.historyPreviewTitle) elements.historyPreviewTitle.textContent = t("history.empty");
    if (elements.historyPreviewMeta) elements.historyPreviewMeta.textContent = "";
    if (elements.historyCodeView) elements.historyCodeView.textContent = "";
    if (elements.restoreHistoryButton) {
      elements.restoreHistoryButton.disabled = true;
      elements.restoreHistoryButton.classList.add("is-hidden");
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of state.history) {
    const el = document.createElement("div");
    el.className = `history-item${state.selectedHistoryId === item.id ? " is-selected" : ""}`;
    el.dataset.id = item.id;

    const title = document.createElement("div");
    title.className = "history-item-title";
    title.textContent = item.label ? `🏷 ${item.label}` : formatHistoryDate(item.createdAt);

    const meta = document.createElement("div");
    meta.className = "history-item-meta";

    const time = document.createElement("span");
    time.textContent = item.label ? `📅 ${formatHistoryDate(item.createdAt)}` : `ID: ${item.id}`;

    const size = document.createElement("span");
    size.textContent = `${(item.size / 1024).toFixed(1)} KB`;

    meta.append(time, size);
    el.append(title, meta);

    el.addEventListener("click", () => {
      previewHistoryItem(item);
    });

    fragment.append(el);
  }
  elements.historyList.append(fragment);

  if (!state.selectedHistoryId && state.history.length > 0) {
    previewHistoryItem(state.history[0]);
  }
}

function setHistoryView(view) {
  state.historyView = view;
  if (elements.historyViewVisualBtn) {
    elements.historyViewVisualBtn.classList.toggle("is-active", view === "visual");
  }
  if (elements.historyViewCodeBtn) {
    elements.historyViewCodeBtn.classList.toggle("is-active", view === "code");
  }
  if (elements.historyVisualView) {
    elements.historyVisualView.classList.toggle("is-hidden", view !== "visual");
  }
  if (elements.historyCodeView) {
    elements.historyCodeView.classList.toggle("is-hidden", view !== "code");
  }
}

function renderHistoryVisualPreview(content, item) {
  if (!elements.historyTerminalCard) return;

  const themeValue = getConfigValue(content, "theme");
  const parsedTheme = parseThemeValue(themeValue);
  let themeName = "";
  if (parsedTheme.mode === "system") {
    themeName = (getPreferredSystemSlot() === "dark" ? parsedTheme.dark : parsedTheme.light)
      || parsedTheme.dark
      || parsedTheme.light;
  } else {
    themeName = parsedTheme.single;
  }
  const themeObj = selectThemeObject(themeName) || state.themes[0];

  const defaultVal = t("common.default");
  const fontFamily = getConfigValue(content, "font-family") || defaultVal;
  const fontSize = getConfigValue(content, "font-size") || defaultVal;
  const cursorStyle = getConfigValue(content, "cursor-style") || "block";
  const cursorBlink = getConfigValue(content, "cursor-style-blink") === "true";
  const transparency = getTransparencyFromConfig(content);

  if (elements.historyChipsRow) {
    elements.historyChipsRow.replaceChildren();
    const chipsData = [
      { text: t("history.chipTheme", { val: themeName || defaultVal }), accent: true },
      { text: t("history.chipFont", { val: `${fontFamily} · ${fontSize}` }) },
      { text: t("history.chipCursor", { val: cursorStyle }) },
      { text: t("history.chipOpacity", { val: formatTransparencyBadge(transparency) }) },
    ];
    for (const chip of chipsData) {
      const span = document.createElement("span");
      span.className = `history-chip${chip.accent ? " history-chip-accent" : ""}`;
      span.textContent = chip.text;
      elements.historyChipsRow.append(span);
    }
  }

  if (elements.historyCardTermTitle) {
    const cardTitle = item.label
      ? `🏷 ${item.label} · ${themeName || "Ghostty"}`
      : `${formatHistoryDate(item.createdAt)} · ${themeName || "Ghostty"}`;
    elements.historyCardTermTitle.textContent = cardTitle;
  }
  if (elements.historyPreviewThemeVal) {
    elements.historyPreviewThemeVal.textContent = themeName || "Default";
  }
  if (elements.historyPreviewFontVal) {
    elements.historyPreviewFontVal.textContent = `${fontFamily} (${fontSize})`;
  }
  if (elements.historyPreviewCursorVal) {
    elements.historyPreviewCursorVal.textContent = `${cursorStyle}${cursorBlink ? ` (${t("cursor.blink")})` : ""}`;
  }

  if (themeObj) {
    const colors = themeObj.palette.length ? themeObj.palette : [themeObj.foreground, themeObj.cursor, "#8bc5ff", "#ffd479", "#e898ff"];
    if (transparency > 0) {
      const solidPct = Math.round((1 - transparency) * 100);
      elements.historyTerminalCard.style.background = `color-mix(in srgb, ${themeObj.background} ${solidPct}%, transparent)`;
      elements.historyTerminalCard.style.backdropFilter = "blur(16px)";
    } else {
      elements.historyTerminalCard.style.background = themeObj.background;
      elements.historyTerminalCard.style.backdropFilter = "none";
    }
    elements.historyTerminalCard.style.color = themeObj.foreground;
    elements.historyTerminalCard.style.setProperty("--term-cursor", themeObj.cursor);
    elements.historyTerminalCard.style.setProperty("--term-green", colors[1] || themeObj.cursor);
    elements.historyTerminalCard.style.setProperty("--term-blue", colors[3] || colors[0] || themeObj.foreground);
    elements.historyTerminalCard.style.setProperty("--term-yellow", colors[2] || themeObj.foreground);
    elements.historyTerminalCard.style.setProperty("--term-accent", colors[4] || colors[0] || themeObj.cursor);

    if (elements.historyPaletteStrip) {
      elements.historyPaletteStrip.replaceChildren();
      for (const color of colors) {
        const swatch = document.createElement("i");
        swatch.style.background = color;
        elements.historyPaletteStrip.append(swatch);
      }
    }
  }

  if (elements.historyTerminalCursor) {
    elements.historyTerminalCursor.className = `cursor is-${cursorStyle}${cursorBlink ? " is-blink" : ""}`;
  }
}

async function renameHistoryItem(item) {
  if (!item) return;
  const current = item.label || "";
  const next = window.prompt(t("history.promptRename"), current);
  if (next === null) return;
  const clean = next.trim();
  if (clean === current) return;

  try {
    const res = await fetch("/api/history/rename", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ghostty-ui-token": state.token,
      },
      body: JSON.stringify({ backupId: item.id, label: clean }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t("error.request", { status: res.status }));
    }
    item.label = clean;
    renderHistoryList();
    previewHistoryItem(item);
    showToast(clean ? t("history.renameSuccess", { name: clean }) : t("history.renameCleared"), "success");
  } catch (err) {
    showToast(t("history.renameFailed", { err: err.message }), "error");
  }
}

async function previewHistoryItem(item) {
  state.selectedHistoryId = item.id;
  $$(".history-item").forEach((el) => {
    el.classList.toggle("is-selected", el.dataset.id === item.id);
  });

  if (elements.historyPreviewTitle) {
    elements.historyPreviewTitle.textContent = item.label
      ? `🏷 ${item.label}`
      : formatHistoryDate(item.createdAt);
  }
  if (elements.historyPreviewMeta) {
    elements.historyPreviewMeta.textContent = item.label
      ? `📅 ${formatHistoryDate(item.createdAt)} · ID: ${item.id} · ${(item.size / 1024).toFixed(1)} KB`
      : `ID: ${item.id} · ${(item.size / 1024).toFixed(1)} KB`;
  }
  if (elements.historyCodeView) {
    elements.historyCodeView.textContent = t("top.connecting");
  }
  if (elements.historyRenameButton) {
    elements.historyRenameButton.textContent = item.label ? t("history.btnRename") : t("history.btnName");
    elements.historyRenameButton.classList.remove("is-hidden");
  }
  if (elements.restoreHistoryButton) {
    elements.restoreHistoryButton.disabled = false;
    elements.restoreHistoryButton.classList.remove("is-hidden");
  }

  try {
    const res = await fetch(`/api/history/content?id=${encodeURIComponent(item.id)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(t("error.request", { status: res.status }));
    const payload = await res.json();
    if (state.selectedHistoryId === item.id) {
      if (elements.historyCodeView) {
        elements.historyCodeView.textContent = payload.content;
      }
      renderHistoryVisualPreview(payload.content, item);
      setHistoryView(state.historyView || "visual");
    }
  } catch (err) {
    if (elements.historyCodeView) {
      elements.historyCodeView.textContent = t("history.loadFailed", { err: err.message });
    }
  }
}

async function restoreHistoryItem(item) {
  if (isDirty()) {
    if (!window.confirm(t("confirm.discard"))) return;
  }
  if (!window.confirm(t("history.confirmRestore", { id: item.id }))) return;

  setBusy(true);
  try {
    const res = await fetch("/api/history/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ghostty-ui-token": state.token,
      },
      body: JSON.stringify({ backupId: item.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t("error.request", { status: res.status }));
    }
    const payload = await res.json();
    state.content = payload.content;
    state.savedContent = payload.content;
    state.showSuccess = true;
    state.reloadResult = null;
    hydrateFromContent();
    await loadHistoryData();
    showToast(t("history.restoreSuccess", { id: item.id }), "success");
  } catch (err) {
    showToast(t("history.restoreFailed", { err: err.message }), "error");
  } finally {
    setBusy(false);
  }
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
  triggerLiveSync(true);
}

function chooseTheme(name) {
  const themeObj = selectThemeObject(name);
  if (state.themeSelection.mode === "system") {
    let targetSlot = state.previewSlot;
    if (themeObj?.mode === "light" || themeObj?.mode === "dark") {
      targetSlot = themeObj.mode;
    }
    state.previewSlot = targetSlot;
    state.themeSelection[targetSlot] = name;
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
    state.previewSlot = getPreferredSystemSlot();
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
    if (control.tagName === "SELECT") {
      let selectVal = value;
      // Ghostty 官方定义 background-blur=true 等价于 20，将已有的 true 平滑映射选中至 "20"
      if (definition.key === "background-blur") {
        if (selectVal === "true") selectVal = "20";
        if (elements.stageBlurSelect) {
          elements.stageBlurSelect.value = selectVal || "";
        }
      }
      ensureSelectValue(control, selectVal);
      if (definition.key === "font-family" && elements.fontFamilyInput) {
        elements.fontFamilyInput.value = value || "";
      }
    } else if (definition.key === "background-opacity") {
      const transparency = getTransparencyFromConfig(state.content);
      control.value = String(transparency);
      const badgeText = formatTransparencyBadge(transparency);
      if (elements.commonOpacityVal) elements.commonOpacityVal.textContent = badgeText;
      if (elements.previewOpacityVal) elements.previewOpacityVal.textContent = badgeText;
      if (elements.themeOpacitySlider) elements.themeOpacitySlider.value = String(transparency);
    } else {
      control.value = value;
    }
  }

  // 显式兜底水合：确保吸顶中控舱与常用设置的双向滑块、徽章、毛玻璃下拉框绝对与配置 100% 同步
  const currentTrans = getTransparencyFromConfig(state.content);
  const badgeText = formatTransparencyBadge(currentTrans);
  if (elements.commonOpacityVal) elements.commonOpacityVal.textContent = badgeText;
  if (elements.previewOpacityVal) elements.previewOpacityVal.textContent = badgeText;
  if (elements.themeOpacitySlider) elements.themeOpacitySlider.value = String(currentTrans);
  if (elements.backgroundOpacity) elements.backgroundOpacity.value = String(currentTrans);

  const blurVal = getConfigValue(state.content, "background-blur");
  const normalizedBlur = blurVal === "true" ? "20" : (blurVal || "");
  if (elements.stageBlurSelect) elements.stageBlurSelect.value = normalizedBlur;
  const bgBlur = $("#background-blur");
  if (bgBlur) bgBlur.value = normalizedBlur;

  const currentCursor = getConfigValue(state.content, "cursor-style") || "";
  if (elements.cursorGraphicPicker) {
    $$(".cursor-pill", elements.cursorGraphicPicker).forEach((pill) => {
      pill.classList.toggle("is-active", (pill.dataset.value || "") === currentCursor);
    });
  }
}

function hydrateFromContent(options = {}) {
  const themeValue = getConfigValue(state.content, "theme");
  state.themeSelection = parseThemeValue(themeValue);
  if (state.themeSelection.mode === "system" && !["light", "dark"].includes(state.previewSlot)) {
    state.previewSlot = getPreferredSystemSlot();
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
  if (key === "background-blur") {
    if (typeof handleBlurChange === "function") {
      handleBlurChange(control.value);
      return;
    }
  }
  const strategy = control.dataset.strategy || "last";
  state.content = setConfigValue(state.content, key, control.value, {
    strategy,
    removeAll: key !== "font-family",
  });
  state.showSuccess = false;
  state.reloadResult = null;
  syncRawEditor();
  if (key && (key.startsWith("cursor-") || key.startsWith("background-"))) {
    updatePreview();
  }
  triggerLiveSync(true);
}

function updateAppMetadata(payload) {
  state.automation = payload.automation || { reloadSupported: false, shutdownSupported: false, method: "manual" };
  state.ghostty = payload.ghostty;
  state.configPath = payload.config.path;
  const fullPath = payload.config.path || "";
  const shortFileName = fullPath.split("/").filter(Boolean).pop() || "config.ghostty";
  elements.configPath.textContent = shortFileName;
  elements.configPath.title = fullPath;
  const pathWrap = $("#config-path-wrap");
  if (pathWrap) pathWrap.title = `${fullPath} (点击复制路径)`;
  elements.editorFile.textContent = shortFileName;
  elements.themeCount.textContent = t("sidebar.themeCount", { count: payload.themes.length });
  elements.fontCount.textContent = t("sidebar.fontCount", { count: payload.fonts.length });
  elements.ghosttyDot.classList.toggle("is-ok", payload.ghostty.found);
  elements.ghosttyDot.classList.toggle("is-error", !payload.ghostty.found);
  elements.ghosttyVersion.textContent = payload.ghostty.found
    ? `Ghostty ${payload.ghostty.version}`
    : t("status.ghosttyMissing");
  updateShutdownButton();
}

const POPULAR_CODING_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "Geist Mono",
  "SF Mono",
  "Menlo",
  "Monaco",
  "Cascadia Code",
  "Cascadia Mono",
  "Hack",
  "Source Code Pro",
  "MesloLGS NF",
  "JetBrainsMono Nerd Font",
  "FiraCode Nerd Font",
  "Iosevka",
  "Inconsolata",
];

function populateFonts() {
  if (!elements.fontFamily) return;
  const currentVal = elements.fontFamily.value;
  elements.fontFamily.replaceChildren();

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = t("font.defaultOption");
  elements.fontFamily.append(defaultOpt);

  const installedSet = new Set(state.fonts);
  const popularInstalled = POPULAR_CODING_FONTS.filter((f) => installedSet.has(f));
  if (popularInstalled.length > 0) {
    const popularGroup = document.createElement("optgroup");
    popularGroup.label = t("font.popularGroup");
    for (const font of popularInstalled) {
      const option = document.createElement("option");
      option.value = font;
      option.textContent = font;
      popularGroup.append(option);
    }
    elements.fontFamily.append(popularGroup);
  }

  if (state.fonts.length > 0) {
    const allGroup = document.createElement("optgroup");
    allGroup.label = t("font.allGroup");
    for (const font of state.fonts) {
      const option = document.createElement("option");
      option.value = font;
      option.textContent = font;
      allGroup.append(option);
    }
    elements.fontFamily.append(allGroup);
  }

  const customOpt = document.createElement("option");
  customOpt.value = "__custom_manual__";
  customOpt.textContent = t("font.customOption");
  elements.fontFamily.append(customOpt);

  if (currentVal) {
    ensureSelectValue(elements.fontFamily, currentVal);
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
    state.baselineContent = payload.config.content;
    state.validation = payload.validation;
    state.showSuccess = false;
    state.reloadResult = null;
    state.loaded = true;
    state.previewSlot = getPreferredSystemSlot();
    if (elements.liveSyncToggle) elements.liveSyncToggle.checked = state.liveSyncEnabled;
    updateAppMetadata(payload);
    populateFonts();
    hydrateFromContent();
    loadHistoryData();
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
    state.baselineContent = state.content;
    state.reloadResult = payload.reload;
    state.showSuccess = payload.reload ? payload.reload.ok : true;
    syncRawEditor();
    renderNotice();
    loadHistoryData();
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
      if (button.dataset.panel === "themes" && elements.studioStageCard && elements.actionbar) {
        if (elements.actionbar.parentElement !== elements.studioStageCard) {
          elements.studioStageCard.appendChild(elements.actionbar);
        }
      } else if (button.dataset.panel !== "themes" && elements.mainWorkspace && elements.actionbar) {
        if (elements.actionbar.parentElement !== elements.mainWorkspace) {
          elements.mainWorkspace.appendChild(elements.actionbar);
        }
      }
      if (button.dataset.panel === "explore" && !state.market.loaded) {
        loadMarketData();
      }
      if (button.dataset.panel === "history") {
        loadHistoryData();
      }
    });
  });

  $$("[data-explore-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.exploreTab;
      state.market.activeTab = tab;
      $$("[data-explore-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      if (elements.exploreTabThemes) {
        elements.exploreTabThemes.classList.toggle("is-active", tab === "themes");
        elements.exploreTabThemes.classList.toggle("is-hidden", tab !== "themes");
      }
      if (elements.exploreTabFonts) {
        elements.exploreTabFonts.classList.toggle("is-active", tab === "fonts");
        elements.exploreTabFonts.classList.toggle("is-hidden", tab !== "fonts");
      }
    });
  });

  $$("[data-theme-mode]").forEach((button) => button.addEventListener("click", () => setThemeMode(button.dataset.themeMode)));
  $$('[data-theme-slot-button]').forEach((button) => {
    button.addEventListener("click", () => setPreviewSlot(button.dataset.themeSlotButton));
  });
  if (elements.terminalPreview) {
    elements.terminalPreview.addEventListener("click", (event) => {
      if (event.target.closest("button, select, input, a, .preview-slot-switch")) return;
      if (state.themeSelection.mode === "system") {
        setPreviewSlot(state.previewSlot === "light" ? "dark" : "light");
      }
    });
  }
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
    if (control.id === "background-opacity" || control.id === "font-family") return;
    control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => updateCommonSetting(control));
  });

  function setFontPickerMode(isManual) {
    if (!elements.fontFamily || !elements.fontFamilyInput || !elements.toggleFontInput) return;
    elements.fontFamily.classList.toggle("is-hidden", isManual);
    elements.fontFamilyInput.classList.toggle("is-hidden", !isManual);
    elements.toggleFontInput.textContent = isManual ? t("font.dropdownSelect") : t("font.manualInput");
    if (isManual) {
      elements.fontFamilyInput.value = elements.fontFamily.value;
      elements.fontFamilyInput.focus();
    } else {
      ensureSelectValue(elements.fontFamily, elements.fontFamilyInput.value.trim());
    }
  }

  if (elements.toggleFontInput) {
    elements.toggleFontInput.addEventListener("click", () => {
      const isCurrentlyManual = !elements.fontFamilyInput.classList.contains("is-hidden");
      setFontPickerMode(!isCurrentlyManual);
    });
  }

  if (elements.fontFamily) {
    elements.fontFamily.addEventListener("change", () => {
      if (elements.fontFamily.value === "__custom_manual__") {
        setFontPickerMode(true);
        return;
      }
      if (elements.fontFamilyInput) {
        elements.fontFamilyInput.value = elements.fontFamily.value;
      }
      updateCommonSetting(elements.fontFamily);
    });
  }

  if (elements.fontFamilyInput) {
    elements.fontFamilyInput.addEventListener("input", () => {
      const val = elements.fontFamilyInput.value.trim();
      ensureSelectValue(elements.fontFamily, val);
      state.content = setConfigValue(state.content, "font-family", val, {
        strategy: "first",
        removeAll: false,
      });
      state.showSuccess = false;
      state.reloadResult = null;
      syncRawEditor();
    });
  }

  if (elements.cursorStyle) {
    elements.cursorStyle.addEventListener("change", () => {
      const selectedStyle = elements.cursorStyle.value;
      if (elements.cursorGraphicPicker) {
        $$(".cursor-pill", elements.cursorGraphicPicker).forEach((pill) => {
          pill.classList.toggle("is-active", (pill.dataset.value || "") === selectedStyle);
        });
      }
      if (selectedStyle && selectedStyle !== "") {
        if (elements.shellIntegrationFeatures && !elements.shellIntegrationFeatures.value) {
          elements.shellIntegrationFeatures.value = "no-cursor";
          state.content = setConfigValue(state.content, "shell-integration-features", "no-cursor");
        }
      }
      syncRawEditor();
      updatePreview();
    });
  }

  if (elements.cursorGraphicPicker) {
    $$(".cursor-pill", elements.cursorGraphicPicker).forEach((pill) => {
      pill.addEventListener("click", () => {
        const val = pill.dataset.value || "";
        if (elements.cursorStyle) {
          elements.cursorStyle.value = val;
          elements.cursorStyle.dispatchEvent(new Event("change", { bubbles: true }));
          updateCommonSetting(elements.cursorStyle);
        }
        $$(".cursor-pill", elements.cursorGraphicPicker).forEach((p) => {
          p.classList.toggle("is-active", p === pill);
        });
      });
    });
  }

  $$(".size-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const sizeInput = $("#font-size");
      if (sizeInput) {
        sizeInput.value = pill.dataset.size;
        sizeInput.dispatchEvent(new Event("input", { bubbles: true }));
        updateCommonSetting(sizeInput);
      }
    });
  });

  function handleBlurChange(val) {
    state.content = setConfigValue(state.content, "background-blur", val);
    state.showSuccess = false;
    state.reloadResult = null;
    
    // 双向同步舞台下拉框与常用设置下拉框
    if (elements.stageBlurSelect && elements.stageBlurSelect.value !== val) {
      elements.stageBlurSelect.value = val;
    }
    const bgBlur = $("#background-blur");
    if (bgBlur && bgBlur.value !== val) {
      bgBlur.value = val;
    }

    // 智能毛玻璃联动：如果开启了有效毛玻璃（非 false 且非空），但当前透明度依然为 0（实色阻挡毛玻璃折射）
    // 自动为用户将透明度开启至 25%（opacity=0.75），使得毛玻璃通透材质立即可见！
    const currentTrans = getTransparencyFromConfig(state.content);
    if (val && val !== "false" && currentTrans <= 0) {
      state.content = setConfigValue(state.content, "background-opacity", "0.75");
      const autoBadge = formatTransparencyBadge(0.25);
      if (elements.previewOpacityVal) elements.previewOpacityVal.textContent = autoBadge;
      if (elements.commonOpacityVal) elements.commonOpacityVal.textContent = autoBadge;
      if (elements.themeOpacitySlider) elements.themeOpacitySlider.value = "0.25";
      if (elements.backgroundOpacity) elements.backgroundOpacity.value = "0.25";
    }

    syncRawEditor();
    updateDirtyState();
    updatePreview();
    triggerLiveSync(true);
  }

  function handleTransparencyChange(sourceInput) {
    const val = parseFloat(sourceInput.value);
    const badgeText = formatTransparencyBadge(val);
    if (elements.previewOpacityVal) elements.previewOpacityVal.textContent = badgeText;
    if (elements.commonOpacityVal) elements.commonOpacityVal.textContent = badgeText;
    if (elements.themeOpacitySlider && elements.themeOpacitySlider !== sourceInput) {
      elements.themeOpacitySlider.value = String(val);
    }
    if (elements.backgroundOpacity && elements.backgroundOpacity !== sourceInput) {
      elements.backgroundOpacity.value = String(val);
    }
    if (val <= 0) {
      state.content = setConfigValue(state.content, "background-opacity", "");
    } else if (val >= 1) {
      state.content = setConfigValue(state.content, "background-opacity", "0");
    } else {
      const opacity = (Math.round((1 - val) * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
      state.content = setConfigValue(state.content, "background-opacity", opacity);
    }
    syncRawEditor();
    updateDirtyState();
    updatePreview();
    triggerLiveSync(false);
  }

  if (elements.themeOpacitySlider) {
    elements.themeOpacitySlider.addEventListener("input", () => handleTransparencyChange(elements.themeOpacitySlider));
  }
  if (elements.backgroundOpacity) {
    elements.backgroundOpacity.addEventListener("input", () => handleTransparencyChange(elements.backgroundOpacity));
  }
  if (elements.stageBlurSelect) {
    elements.stageBlurSelect.addEventListener("change", () => {
      handleBlurChange(elements.stageBlurSelect.value);
    });
  }

  elements.rawConfig.addEventListener("input", () => {
    state.content = elements.rawConfig.value;
    state.showSuccess = false;
    state.reloadResult = null;
    updateDirtyState();
    updateEditorStats();
    clearTimeout(rawSyncTimer);
    rawSyncTimer = setTimeout(() => hydrateFromContent({ skipRaw: true }), 350);
    triggerLiveSync(false);
  });

  elements.validateButton.addEventListener("click", validateCurrentConfig);
  elements.saveButton.addEventListener("click", () => saveCurrentConfig({ reload: state.automation.reloadSupported }));
  const configPathWrap = $("#config-path-wrap");
  if (configPathWrap) {
    configPathWrap.addEventListener("click", () => {
      if (state.configPath) {
        navigator.clipboard?.writeText(state.configPath).then(() => {
          showToast(t("toast.pathCopied") || "已复制配置路径到剪贴板。", "success");
        }).catch(() => {});
      }
    });
  }
  if (elements.refreshHistoryButton) {
    elements.refreshHistoryButton.addEventListener("click", () => loadHistoryData());
  }
  if (elements.restoreHistoryButton) {
    elements.restoreHistoryButton.addEventListener("click", () => {
      const selected = state.history.find((item) => item.id === state.selectedHistoryId);
      if (selected) restoreHistoryItem(selected);
    });
  }
  if (elements.historyViewVisualBtn) {
    elements.historyViewVisualBtn.addEventListener("click", () => setHistoryView("visual"));
  }
  if (elements.historyViewCodeBtn) {
    elements.historyViewCodeBtn.addEventListener("click", () => setHistoryView("code"));
  }
  if (elements.historyRenameButton) {
    elements.historyRenameButton.addEventListener("click", () => {
      const selected = state.history.find((item) => item.id === state.selectedHistoryId);
      if (selected) renameHistoryItem(selected);
    });
  }
  if (elements.liveSyncToggle) {
    elements.liveSyncToggle.checked = state.liveSyncEnabled;
    elements.liveSyncToggle.addEventListener("change", () => {
      state.liveSyncEnabled = elements.liveSyncToggle.checked;
      localStorage.setItem("ghosttyle-live-sync", String(state.liveSyncEnabled));
      if (state.liveSyncEnabled && isDirty()) {
        triggerLiveSync(true);
      }
    });
  }
  if (elements.revertBaselineButton) {
    elements.revertBaselineButton.addEventListener("click", revertToBaseline);
  }
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
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (state.themeSelection.mode === "system") {
        setPreviewSlot(e.matches ? "dark" : "light");
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveCurrentConfig({ reload: state.automation.reloadSupported });
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (shutdownInProgress || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

bindEvents();
loadState();

if (typeof window !== "undefined") {
  const searchParams = new URLSearchParams(window.location.search);
  const initialPanel = searchParams.get("panel") || window.location.hash.replace("#", "");
  if (initialPanel) {
    const targetNav = $(`[data-panel="${initialPanel}"]`);
    if (targetNav) targetNav.click();
  }
  const initialUiTheme = searchParams.get("ui-theme");
  if (initialUiTheme) {
    applyUiThemePreference(initialUiTheme);
  }
  const initialLang = searchParams.get("lang");
  if (initialLang) {
    applyLanguage(initialLang);
  }
}
