(() => {
  const key = "ghosttyle-ui-theme";
  const legacyKey = "ghostty-config-ui-theme";
  const allowed = new Set(["system", "light", "dark"]);
  let preference = "system";
  try {
    const stored = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (allowed.has(stored)) preference = stored;
  } catch {
    // Storage can be unavailable in hardened browser profiles.
  }
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  document.documentElement.dataset.uiThemePreference = preference;
  document.documentElement.dataset.uiTheme = preference === "system"
    ? (systemDark ? "dark" : "light")
    : preference;

  const languageKey = "ghosttyle-ui-language";
  let language = "zh";
  try {
    const storedLanguage = localStorage.getItem(languageKey);
    language = storedLanguage === "zh" || storedLanguage === "en"
      ? storedLanguage
      : (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  } catch {
    language = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  }
  document.documentElement.dataset.uiLanguage = language;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
})();
