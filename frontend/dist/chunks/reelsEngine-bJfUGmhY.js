const STORAGE_KEYS = {
  reelsCache: "yamshat.reels.cache.v2",
  watchHistory: "yamshat.reels.watch-history.v2",
  analytics: "yamshat.reels.analytics.v2",
  moderation: "yamshat.reels.moderation.v2"
};
function canUseWindow() {
  return typeof window !== "undefined";
}
function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function readStorage(key, fallback) {
  if (!canUseWindow()) return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}
function writeStorage(key, value) {
  if (!canUseWindow()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
function ensureAnalyticsShape(data = {}) {
  return {
    summary: {
      impressions: Number(data?.summary?.impressions || 0),
      qualifiedViews: Number(data?.summary?.qualifiedViews || 0),
      completedViews: Number(data?.summary?.completedViews || 0),
      totalWatchMs: Number(data?.summary?.totalWatchMs || 0),
      bufferEvents: Number(data?.summary?.bufferEvents || 0),
      bufferMs: Number(data?.summary?.bufferMs || 0),
      swipes: Number(data?.summary?.swipes || 0),
      manualQualityChanges: Number(data?.summary?.manualQualityChanges || 0),
      autoQualityDowngrades: Number(data?.summary?.autoQualityDowngrades || 0),
      reports: Number(data?.summary?.reports || 0)
    },
    byReel: data?.byReel && typeof data.byReel === "object" ? data.byReel : {},
    recentEvents: Array.isArray(data?.recentEvents) ? data.recentEvents : [],
    updatedAt: data?.updatedAt || null
  };
}
function ensureReelAnalyticsEntry(entry = {}) {
  return {
    reelId: String(entry.reelId || ""),
    content: entry.content || "",
    username: entry.username || "",
    thumbnail_url: entry.thumbnail_url || "",
    impressions: Number(entry.impressions || 0),
    qualifiedViews: Number(entry.qualifiedViews || 0),
    completedViews: Number(entry.completedViews || 0),
    totalWatchMs: Number(entry.totalWatchMs || 0),
    avgWatchMs: Number(entry.avgWatchMs || 0),
    bufferEvents: Number(entry.bufferEvents || 0),
    bufferMs: Number(entry.bufferMs || 0),
    lastQuality: entry.lastQuality || "auto",
    lastSeenAt: entry.lastSeenAt || null,
    reports: Number(entry.reports || 0),
    watchSessions: Number(entry.watchSessions || 0)
  };
}
function getReelsCache() {
  return readStorage(STORAGE_KEYS.reelsCache, { items: [], updatedAt: null });
}
function saveReelsCache(items = []) {
  writeStorage(STORAGE_KEYS.reelsCache, {
    items: Array.isArray(items) ? items.slice(0, 80) : [],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function getWatchHistory() {
  return readStorage(STORAGE_KEYS.watchHistory, []);
}
function getReelsAnalyticsDashboard() {
  return ensureAnalyticsShape(readStorage(STORAGE_KEYS.analytics, {}));
}
function getModerationReports() {
  return readStorage(STORAGE_KEYS.moderation, []);
}
function getReelInsightsById(reelId) {
  const analytics = getReelsAnalyticsDashboard();
  return ensureReelAnalyticsEntry(analytics.byReel[String(reelId)] || { reelId });
}
export {
  getReelInsightsById as a,
  getReelsAnalyticsDashboard as b,
  getReelsCache as c,
  getWatchHistory as d,
  getModerationReports as g,
  saveReelsCache as s
};
