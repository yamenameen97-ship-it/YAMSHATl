const STORAGE_KEYS = {
  reelsCache: 'yamshat.reels.cache.v2',
  watchHistory: 'yamshat.reels.watch-history.v2',
  analytics: 'yamshat.reels.analytics.v2',
  moderation: 'yamshat.reels.moderation.v2',
};

const QUALITY_ORDER = ['low', 'medium', 'high'];
const MAX_HISTORY = 120;
const MAX_EVENTS = 180;

function canUseWindow() {
  return typeof window !== 'undefined';
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

function pushRecentEvent(list = [], event) {
  return [event, ...list].slice(0, MAX_EVENTS);
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
      reports: Number(data?.summary?.reports || 0),
    },
    byReel: data?.byReel && typeof data.byReel === 'object' ? data.byReel : {},
    recentEvents: Array.isArray(data?.recentEvents) ? data.recentEvents : [],
    updatedAt: data?.updatedAt || null,
  };
}

function ensureReelAnalyticsEntry(entry = {}) {
  return {
    reelId: String(entry.reelId || ''),
    content: entry.content || '',
    username: entry.username || '',
    thumbnail_url: entry.thumbnail_url || '',
    impressions: Number(entry.impressions || 0),
    qualifiedViews: Number(entry.qualifiedViews || 0),
    completedViews: Number(entry.completedViews || 0),
    totalWatchMs: Number(entry.totalWatchMs || 0),
    avgWatchMs: Number(entry.avgWatchMs || 0),
    bufferEvents: Number(entry.bufferEvents || 0),
    bufferMs: Number(entry.bufferMs || 0),
    lastQuality: entry.lastQuality || 'auto',
    lastSeenAt: entry.lastSeenAt || null,
    reports: Number(entry.reports || 0),
    watchSessions: Number(entry.watchSessions || 0),
  };
}

export function getReelsCache() {
  return readStorage(STORAGE_KEYS.reelsCache, { items: [], updatedAt: null });
}

// v88.41 — نُقلّص الحد المحلي من 80 إلى 10 عناصر (بحسب سياسة "آخر 10 ريلز مُشاهدة").
// التخزين الحقيقي والدائم صار على Cloudinary + قاعدة بيانات Render. هذا مجرد كاش
// سريع للـ UI حتى تظهر الشاشة فوراً عند العودة إلى صفحة الريلز.
export function saveReelsCache(items = []) {
  writeStorage(STORAGE_KEYS.reelsCache, {
    items: Array.isArray(items) ? items.slice(0, 10) : [],
    updatedAt: new Date().toISOString(),
  });
}

export function buildAdaptiveSource(reel = {}, quality = 'high') {
  const base = reel.media_url || reel.video_url || reel.videoUrl || '';
  const manifest = reel.hls_url || reel.stream_url || reel.adaptive_url || '';
  if (manifest) return manifest;
  if (!base) return '';
  if (/\.m3u8($|\?)/i.test(base)) return base;
  const normalized = QUALITY_ORDER.includes(String(quality).toLowerCase()) ? String(quality).toLowerCase() : 'high';
  if (/([?&])quality=/i.test(base)) {
    return base.replace(/([?&])quality=[^&]+/i, `$1quality=${normalized}`);
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}quality=${normalized}`;
}

export function computeAutoQuality({ manualQuality = 'auto', preferredQuality = 'high', bufferEvents = 0, saveData = false, effectiveType = '4g' } = {}) {
  if (manualQuality && manualQuality !== 'auto') return manualQuality;
  let base = saveData || effectiveType === '2g'
    ? 'low'
    : effectiveType === '3g'
      ? 'medium'
      : preferredQuality;
  if (!QUALITY_ORDER.includes(base)) base = 'high';
  let index = QUALITY_ORDER.indexOf(base);
  if (bufferEvents >= 4) index = Math.max(0, index - 2);
  else if (bufferEvents >= 2) index = Math.max(0, index - 1);
  return QUALITY_ORDER[index] || 'high';
}

export function preloadPoster(url = '') {
  if (!canUseWindow() || !url) return;
  const existing = document.head.querySelector(`link[data-reel-poster="${url}"]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.dataset.reelPoster = url;
  document.head.appendChild(link);
}

export function primeVideo(url = '') {
  if (!canUseWindow() || !url) return null;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
  return link;
}

export function getWatchHistory() {
  return readStorage(STORAGE_KEYS.watchHistory, []);
}

export function saveWatchHistoryEntry(entry = {}) {
  const current = getWatchHistory();
  const normalized = {
    reelId: String(entry.reelId || entry.id || ''),
    content: entry.content || '',
    username: entry.username || '',
    thumbnail_url: entry.thumbnail_url || '',
    position: Number(entry.position || 0),
    duration: Number(entry.duration || 0),
    progress: Number(entry.progress || 0),
    quality: entry.quality || 'auto',
    completed: Boolean(entry.completed),
    watchedAt: entry.watchedAt || new Date().toISOString(),
    watchMs: Number(entry.watchMs || 0),
  };
  const deduped = current.filter((item) => String(item.reelId) !== normalized.reelId);
  writeStorage(STORAGE_KEYS.watchHistory, [normalized, ...deduped].slice(0, MAX_HISTORY));
}

export function getReelsAnalyticsDashboard() {
  return ensureAnalyticsShape(readStorage(STORAGE_KEYS.analytics, {}));
}

export function trackReelAnalytics(eventType, payload = {}) {
  const current = ensureAnalyticsShape(readStorage(STORAGE_KEYS.analytics, {}));
  const reelId = String(payload.reelId || 'global');
  const existing = ensureReelAnalyticsEntry(current.byReel[reelId] || { reelId });
  const watchMs = Number(payload.watchMs || 0);
  const bufferMs = Number(payload.bufferMs || 0);

  switch (eventType) {
    case 'impression':
      current.summary.impressions += 1;
      existing.impressions += 1;
      break;
    case 'qualified_view':
      current.summary.qualifiedViews += 1;
      existing.qualifiedViews += 1;
      break;
    case 'completion':
      current.summary.completedViews += 1;
      existing.completedViews += 1;
      break;
    case 'watch_session':
      current.summary.totalWatchMs += watchMs;
      existing.totalWatchMs += watchMs;
      existing.watchSessions += 1;
      existing.avgWatchMs = existing.watchSessions > 0 ? Math.round(existing.totalWatchMs / existing.watchSessions) : 0;
      break;
    case 'buffer':
      current.summary.bufferEvents += 1;
      current.summary.bufferMs += bufferMs;
      existing.bufferEvents += 1;
      existing.bufferMs += bufferMs;
      break;
    case 'swipe':
      current.summary.swipes += 1;
      break;
    case 'manual_quality_change':
      current.summary.manualQualityChanges += 1;
      existing.lastQuality = payload.quality || existing.lastQuality;
      break;
    case 'auto_quality_downgrade':
      current.summary.autoQualityDowngrades += 1;
      existing.lastQuality = payload.quality || existing.lastQuality;
      break;
    case 'report':
      current.summary.reports += 1;
      existing.reports += 1;
      break;
    default:
      break;
  }

  if (payload.content) existing.content = payload.content;
  if (payload.username) existing.username = payload.username;
  if (payload.thumbnail_url) existing.thumbnail_url = payload.thumbnail_url;
  existing.lastSeenAt = new Date().toISOString();
  current.byReel[reelId] = existing;
  current.updatedAt = new Date().toISOString();
  current.recentEvents = pushRecentEvent(current.recentEvents, {
    type: eventType,
    reelId,
    quality: payload.quality || null,
    watchMs,
    bufferMs,
    createdAt: new Date().toISOString(),
  });
  writeStorage(STORAGE_KEYS.analytics, current);
  return current;
}

export function getModerationReports() {
  return readStorage(STORAGE_KEYS.moderation, []);
}

export function submitModerationReport(report = {}) {
  const reports = getModerationReports();
  const entry = {
    id: report.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reelId: String(report.reelId || ''),
    content: report.content || '',
    username: report.username || '',
    thumbnail_url: report.thumbnail_url || '',
    reason: report.reason || 'other',
    note: report.note || '',
    status: report.status || 'pending',
    createdAt: report.createdAt || new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.moderation, [entry, ...reports].slice(0, MAX_HISTORY));
  trackReelAnalytics('report', {
    reelId: entry.reelId,
    content: entry.content,
    username: entry.username,
    thumbnail_url: entry.thumbnail_url,
  });
  return entry;
}

export function getReelInsightsById(reelId) {
  const analytics = getReelsAnalyticsDashboard();
  return ensureReelAnalyticsEntry(analytics.byReel[String(reelId)] || { reelId });
}

export function formatWatchPercentage(progress = 0) {
  return `${Math.round(Number(progress || 0) * 100)}%`;
}
