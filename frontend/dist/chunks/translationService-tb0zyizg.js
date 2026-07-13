const CACHE_KEY = "yamshat:translation-cache";
const CACHE_LIMIT = 500;
const PREFS_KEY = "yamshat:translation-prefs";
let memCache = null;
function loadCache() {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    memCache = {};
  }
  return memCache;
}
function persistCache() {
  try {
    const entries = Object.entries(memCache || {});
    if (entries.length > CACHE_LIMIT) {
      const trimmed = entries.slice(-CACHE_LIMIT);
      memCache = Object.fromEntries(trimmed);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(memCache));
  } catch {
  }
}
function cacheKey(text, target, source) {
  return `${source || "auto"}->${target}::${(text || "").slice(0, 200)}`;
}
function getTranslationPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveTranslationPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs || {}));
  } catch {
  }
}
function quickDetectLang(text) {
  const s = String(text || "");
  if (!s.trim()) return "unknown";
  const arabic = (s.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  if (arabic >= latin) return "ar";
  if (latin > 0) return "en";
  return "unknown";
}
async function translateViaBackend(text, target, source) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target, source: source || "auto" }),
    credentials: "include"
  });
  if (!res.ok) throw new Error("backend translate failed");
  const data = await res.json();
  if (!data || !data.translatedText) throw new Error("invalid response");
  return {
    text: data.translatedText,
    detected: data.detectedSourceLanguage || source || "auto",
    provider: "backend"
  };
}
async function translateViaGoogleFree(text, target, source) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source || "auto",
    tl: target,
    dt: "t",
    q: text
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("google translate failed");
  const data = await res.json();
  const translated = (data?.[0] || []).map((segment) => segment?.[0]).filter(Boolean).join("");
  if (!translated) throw new Error("empty translation");
  return {
    text: translated,
    detected: data?.[2] || source || "auto",
    provider: "google-free"
  };
}
async function translateViaMyMemory(text, target, source) {
  const sl = source && source !== "auto" ? source : quickDetectLang(text) || "en";
  const params = new URLSearchParams({
    q: text,
    langpair: `${sl}|${target}`
  });
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("mymemory failed");
  const data = await res.json();
  const t = data?.responseData?.translatedText;
  if (!t) throw new Error("mymemory empty");
  return { text: t, detected: sl, provider: "mymemory" };
}
async function translateText(text, target, source = "auto") {
  if (!text || !target) {
    return { text: text || "", detected: "unknown", provider: "noop" };
  }
  if (source && source !== "auto" && source === target) {
    return { text, detected: source, provider: "noop" };
  }
  const detectedQuick = quickDetectLang(text);
  if (detectedQuick === target) {
    return { text, detected: detectedQuick, provider: "noop" };
  }
  const cache = loadCache();
  const key = cacheKey(text, target, source);
  if (cache[key]) {
    return { ...cache[key], fromCache: true };
  }
  const attempts = [
    () => translateViaBackend(text, target, source),
    () => translateViaGoogleFree(text, target, source),
    () => translateViaMyMemory(text, target, source)
  ];
  let lastErr = null;
  for (const fn of attempts) {
    try {
      const result = await fn();
      if (result && result.text) {
        cache[key] = result;
        persistCache();
        return result;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  return { text, detected: detectedQuick, provider: "error", error: String(lastErr || "unknown") };
}
function clearTranslationCache() {
  memCache = {};
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
  }
}
export {
  clearTranslationCache as c,
  getTranslationPrefs as g,
  quickDetectLang as q,
  saveTranslationPrefs as s,
  translateText as t
};
