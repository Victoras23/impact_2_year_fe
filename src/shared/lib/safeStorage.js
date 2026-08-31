// localStorage nu este garantat (Chrome/Safari îl blochează pe file://).
// Toate accesările trec prin try/catch.
export function readStorage(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null || raw === undefined ? fallback : raw;
  } catch (e) {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value); } catch (e) { /* ignorat */ }
}

export function readJson(key, fallback) {
  const raw = readStorage(key, null);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (e) { return fallback; }
}

export function writeJson(key, value) {
  try { writeStorage(key, JSON.stringify(value)); } catch (e) { /* ignorat */ }
}
