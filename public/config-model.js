const ASSIGNMENT = /^\s*([a-z0-9-]+)\s*=\s*(.*?)\s*$/i;

export const FIELD_DEFINITIONS = [
  { key: "font-family", strategy: "first" },
  { key: "font-size" },
  { key: "font-thicken" },
  { key: "background-opacity" },
  { key: "background-blur" },
  { key: "cursor-style" },
  { key: "cursor-style-blink" },
  { key: "shell-integration-features" },
  { key: "window-padding-x" },
  { key: "window-padding-y" },
  { key: "macos-titlebar-style" },
  { key: "copy-on-select" },
  { key: "mouse-hide-while-typing" },
  { key: "confirm-close-surface" },
];

export function stripQuotes(value = "") {
  const text = String(value).trim();
  if (text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")))) {
    return text.slice(1, -1);
  }
  return text;
}

export function parseConfig(content = "") {
  const entries = new Map();
  const lines = String(content).split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/^\s*#/.test(line)) return;
    const match = line.match(ASSIGNMENT);
    if (!match) return;
    const key = match[1].toLowerCase();
    const entry = { index, key, rawValue: match[2], value: stripQuotes(match[2]) };
    if (!entries.has(key)) entries.set(key, []);
    entries.get(key).push(entry);
  });
  return { entries, lines };
}

export function getConfigValue(content, key, strategy = "last") {
  const values = parseConfig(content).entries.get(key) || [];
  if (!values.length) return "";
  return (strategy === "first" ? values[0] : values.at(-1)).value;
}

function formatAssignment(key, value) {
  return `${key} = ${String(value).trim()}`;
}

export function setConfigValue(content, key, value, options = {}) {
  const strategy = options.strategy || "last";
  const removeAll = options.removeAll ?? true;
  const source = String(content || "");
  const hadTrailingNewline = source.endsWith("\n");
  const lines = source.split(/\r?\n/);
  if (hadTrailingNewline) lines.pop();

  const indexes = [];
  lines.forEach((line, index) => {
    if (/^\s*#/.test(line)) return;
    const match = line.match(ASSIGNMENT);
    if (match?.[1]?.toLowerCase() === key.toLowerCase()) indexes.push(index);
  });

  const empty = value === undefined || value === null || String(value).trim() === "";
  if (empty) {
    if (removeAll) {
      for (const index of indexes.reverse()) lines.splice(index, 1);
    } else if (indexes.length) {
      lines.splice(strategy === "first" ? indexes[0] : indexes.at(-1), 1);
    }
  } else if (indexes.length) {
    const targetIndex = strategy === "first" ? indexes[0] : indexes.at(-1);
    lines[targetIndex] = formatAssignment(key, value);
  } else {
    while (lines.length && !lines.at(-1).trim()) lines.pop();
    if (lines.length) lines.push("");
    lines.push(formatAssignment(key, value));
  }

  const result = lines.join("\n");
  return hadTrailingNewline || result ? `${result}\n` : "";
}

export function applyConfigPatch(content, patch = {}) {
  let result = String(content || "");
  for (const [key, value] of Object.entries(patch)) {
    const definition = FIELD_DEFINITIONS.find((field) => field.key === key);
    result = setConfigValue(result, key, value, {
      strategy: definition?.strategy || "last",
      removeAll: key !== "font-family",
    });
  }
  return result;
}

export function parseThemeValue(rawValue = "") {
  const value = stripQuotes(rawValue);
  const pairs = value.split(",").map((part) => part.trim()).filter(Boolean);
  const modes = Object.fromEntries(pairs.flatMap((part) => {
    const match = part.match(/^(light|dark)\s*:\s*(.+)$/i);
    return match ? [[match[1].toLowerCase(), match[2].trim()]] : [];
  }));
  if (modes.light && modes.dark) {
    return { mode: "system", light: modes.light, dark: modes.dark, single: "" };
  }
  return { mode: "single", light: "", dark: "", single: value };
}

export function formatThemeValue(selection) {
  if (selection.mode === "system") {
    if (!selection.light || !selection.dark) return "";
    return `light:${selection.light},dark:${selection.dark}`;
  }
  return selection.single || "";
}

function levenshtein(left, right) {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let indexA = 1; indexA <= a.length; indexA += 1) {
    let diagonal = row[0];
    row[0] = indexA;
    for (let indexB = 1; indexB <= b.length; indexB += 1) {
      const previous = row[indexB];
      row[indexB] = Math.min(
        row[indexB] + 1,
        row[indexB - 1] + 1,
        diagonal + (a[indexA - 1] === b[indexB - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[b.length];
}

export function suggestTheme(missingName, themeNames = []) {
  const missing = String(missingName || "").trim();
  if (!missing || !themeNames.length) return "";
  const exact = new Map(themeNames.map((name) => [name.toLowerCase(), name]));
  if (exact.has(missing.toLowerCase())) return exact.get(missing.toLowerCase());

  const suffixCandidates = [
    missing.replace(/\s+light$/i, ""),
    missing.replace(/\s+dark$/i, ""),
  ].filter((candidate) => candidate !== missing);
  for (const candidate of suffixCandidates) {
    if (exact.has(candidate.toLowerCase())) return exact.get(candidate.toLowerCase());
  }

  return [...themeNames]
    .map((name) => ({ name, distance: levenshtein(missing, name) }))
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))[0]?.name || "";
}

export function missingThemeSelections(themeValue, themeNames = []) {
  const available = new Set(themeNames);
  const selection = parseThemeValue(themeValue);
  const candidates = selection.mode === "system"
    ? [{ slot: "light", name: selection.light }, { slot: "dark", name: selection.dark }]
    : [{ slot: "single", name: selection.single }];
  return candidates
    .filter(({ name }) => name && !available.has(name))
    .map(({ slot, name }) => ({ slot, name, suggestion: suggestTheme(name, themeNames) }));
}
