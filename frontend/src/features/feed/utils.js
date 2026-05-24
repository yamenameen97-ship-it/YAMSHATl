import { extractHashtags, normalizeSearchText, tokenize } from '../../utils/fuzzySearch.js';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'have', 'just', 'into', 'about', 'will', 'been', 'were', 'their', 'them', 'they',
  'في', 'من', 'على', 'الى', 'إلى', 'عن', 'هذا', 'هذه', 'ذلك', 'تلك', 'مع', 'كان', 'كانت', 'لقد', 'تم', 'هو', 'هي', 'هم', 'هن', 'كما', 'لكن', 'ثم',
  'أو', 'او', 'بل', 'كل', 'بعض', 'اي', 'أي', 'بعد', 'قبل', 'اليوم', 'الان', 'الآن', 'عند', 'عشان', 'جداً', 'جدا', 'مش', 'مو', 'بس', 'لسه',
]);

export function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export function hoursSince(value) {
  if (!value) return 999;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || Number.isNaN(timestamp)) return 999;
  return Math.max(0.05, (Date.now() - timestamp) / 36e5);
}

export function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export function getPostAuthor(post = {}) {
  return String(post.username || post.author_username || post.author || post.user?.username || '').trim();
}

export function getPostId(post = {}) {
  const direct = post.id || post._id || post.uuid || post.slug || post.post_id;
  if (direct) return String(direct);

  const author = getPostAuthor(post);
  const content = normalizeSearchText(post.content || post.description || post.caption || '').slice(0, 80);
  const createdAt = String(post.created_at || post.createdAt || post.timestamp || '').trim();
  const media = Array.isArray(post.media_urls) && post.media_urls.length
    ? String(post.media_urls[0])
    : String(post.media_url || post.image_url || post.media || '');

  return [author, createdAt, content, media].filter(Boolean).join('::');
}

export function getUserId(user = {}) {
  return String(user.id || user._id || user.uuid || user.username || user.handle || user.name || user.email || '').trim();
}

export function detectMediaType(post = {}) {
  const explicitType = String(post.type || post.content_type || post.post_type || '').toLowerCase();
  if (explicitType.includes('video') || explicitType.includes('reel') || explicitType.includes('live')) return 'video';

  const mediaItems = Array.isArray(post.media_urls) && post.media_urls.length
    ? post.media_urls
    : [post.media_url || post.image_url || post.media].filter(Boolean);

  const combined = mediaItems.join(' ').toLowerCase();
  if (/\.(mp4|webm|mov|m3u8|avi)(\?|$)/i.test(combined)) return 'video';
  if (mediaItems.length) return 'image';
  return 'text';
}

export function getPostTopics(post = {}) {
  const hashtags = Array.isArray(post.hashtags) && post.hashtags.length
    ? post.hashtags.map((item) => String(item).startsWith('#') ? String(item).toLowerCase() : `#${String(item).toLowerCase()}`)
    : extractHashtags(`${post.content || ''} ${post.description || ''} ${post.caption || ''}`);

  const tags = [
    ...(Array.isArray(post.tags) ? post.tags : []),
    ...(Array.isArray(post.topics) ? post.topics : []),
    post.category,
    post.topic,
  ].filter(Boolean).map((item) => normalizeSearchText(item));

  const textTokens = tokenize(`${post.content || ''} ${post.description || ''} ${post.caption || ''} ${post.title || ''}`)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  return uniqueValues([
    ...hashtags,
    ...tags,
    ...textTokens,
  ]);
}

export function buildTextFingerprint(post = {}) {
  const author = normalizeSearchText(getPostAuthor(post));
  const body = normalizeSearchText(post.content || post.description || post.caption || '').slice(0, 120);
  const mediaType = detectMediaType(post);
  const createdAt = String(post.created_at || '').slice(0, 16);
  return `${author}::${body}::${mediaType}::${createdAt}`;
}

export function logarithmicScore(value, multiplier = 1) {
  return Math.log10(1 + Math.max(0, safeNumber(value))) * multiplier;
}

export function getEngagementSummary(post = {}) {
  return {
    likes: safeNumber(post.likes_count ?? post.like_count ?? post.likes),
    comments: safeNumber(post.comments_count ?? post.comment_count),
    shares: safeNumber(post.share_count ?? post.shares),
    saves: safeNumber(post.saved_count ?? post.save_count),
    views: safeNumber(post.views_count ?? post.view_count ?? post.impressions_count),
  };
}

export function serializeFeedCacheKey(parts = []) {
  return parts.map((item) => String(item ?? '')).join('::');
}
