const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const NON_TEXT = /[^\p{L}\p{N}#@._\s-]/gu;

export function normalizeSearchText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(NON_TEXT, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value = '') {
  return normalizeSearchText(value).split(' ').filter(Boolean);
}

export function levenshteinDistance(a = '', b = '') {
  const left = normalizeSearchText(a);
  const right = normalizeSearchText(b);
  if (!left) return right.length;
  if (!right) return left.length;

  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[left.length][right.length];
}

export function fuzzyScore(query = '', candidate = '') {
  const q = normalizeSearchText(query);
  const text = normalizeSearchText(candidate);
  if (!q || !text) return 0;
  if (q === text) return 1;
  if (text.startsWith(q)) return 0.97;
  if (text.includes(q)) return 0.92;

  const qTokens = tokenize(q);
  const cTokens = tokenize(text);
  const tokenHits = qTokens.reduce((score, token) => {
    if (cTokens.some((item) => item === token)) return score + 0.28;
    if (cTokens.some((item) => item.startsWith(token))) return score + 0.22;
    if (cTokens.some((item) => item.includes(token))) return score + 0.16;
    return score;
  }, 0);

  const distance = levenshteinDistance(q, text.slice(0, Math.max(q.length, Math.min(text.length, q.length + 8))));
  const distanceScore = Math.max(0, 1 - (distance / Math.max(q.length, text.length, 1)));
  return Math.min(0.91, Math.max(tokenHits, distanceScore * 0.8));
}

export function extractHashtags(text = '') {
  return Array.from(new Set((String(text || '').match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.toLowerCase())));
}

export function detectSearchIntent(query = '') {
  const raw = String(query || '').trim();
  const normalized = normalizeSearchText(raw);
  const rawTokens = raw.split(/\s+/).filter(Boolean);
  const tokens = tokenize(raw);
  const hashtags = extractHashtags(raw);
  const startsWithHashtag = raw.startsWith('#');
  return {
    raw,
    normalized,
    rawTokens,
    tokens,
    hashtags,
    startsWithHashtag,
    isLive: Boolean(raw),
  };
}

function routeForType(type, item = {}) {
  if (type === 'users') return `/profile/${encodeURIComponent(item.username || item.handle || item.name || '')}`;
  if (type === 'posts') return item.id ? `/post/${encodeURIComponent(item.id)}` : '/';
  if (type === 'reels') return '/reels';
  if (type === 'groups') return item.id ? `/groups?group=${encodeURIComponent(item.id)}` : '/groups';
  return '/search';
}

function toSearchEntry(type, item = {}) {
  const username = item.username || item.handle || item.name || '';
  const title = item.title || item.name || item.content || item.caption || username || 'Untitled';
  const description = item.description || item.bio || item.content || item.caption || '';
  const hashtags = item.hashtags || extractHashtags(`${item.content || ''} ${item.caption || ''} ${item.description || ''}`);

  return {
    id: item.id || `${type}-${username || title}`,
    type,
    name: username || item.name || '',
    title,
    description,
    content: item.content || item.caption || item.description || '',
    hashtags,
    avatar: item.avatar || item.avatar_url || item.cover_url || '',
    media: item.media_url || item.video_url || item.image_url || item.cover_image || '',
    metrics: {
      likes: Number(item.likes_count || 0),
      followers: Number(item.followers_count || 0),
      comments: Number(item.comments_count || 0),
      views: Number(item.views_count || item.view_count || 0),
      shares: Number(item.share_count || 0),
      posts: Number(item.posts_count || 0),
      members: Number(item.members_count || item.member_count || 0),
    },
    route: routeForType(type, item),
    raw: item,
  };
}

export function searchInCollections(query = '', collections = {}, options = {}) {
  const intent = detectSearchIntent(query);
  const filter = options.filter || 'all';
  const activeHashtag = normalizeSearchText(options.activeHashtag || '').replace(/^#/, '');
  const limit = Number(options.limit || 0);
  const buckets = [];

  if (filter === 'all' || filter === 'users' || filter === 'people') {
    (collections.users || []).forEach((item) => buckets.push(toSearchEntry('users', item)));
  }
  if (filter === 'all' || filter === 'posts') {
    (collections.posts || []).forEach((item) => buckets.push(toSearchEntry('posts', item)));
  }
  if (filter === 'all' || filter === 'reels') {
    (collections.reels || []).forEach((item) => buckets.push(toSearchEntry('reels', item)));
  }
  if (filter === 'all' || filter === 'groups') {
    (collections.groups || []).forEach((item) => buckets.push(toSearchEntry('groups', item)));
  }
  if (filter === 'all' || filter === 'hashtags') {
    (collections.hashtags || []).forEach((item) => {
      const tag = typeof item === 'string' ? item : item.tag || item.name || '';
      const title = tag.startsWith('#') ? tag : `#${tag}`;
      buckets.push({
        id: `hashtag-${title}`,
        type: 'hashtags',
        title,
        name: title.replace(/^#/, ''),
        description: typeof item === 'string' ? 'هاشتاج شائع' : item.description || `${item.count || item.posts_count || 0} منشور`,
        content: '',
        hashtags: [title.toLowerCase()],
        avatar: '',
        media: '',
        metrics: { posts: Number(item.count || item.posts_count || 0) },
        route: `/search?q=${encodeURIComponent(title.replace(/^#/, ''))}&type=hashtags`,
        raw: item,
      });
    });
  }

  const scored = buckets
    .map((entry) => {
      const searchable = [entry.title, entry.name, entry.description, entry.content, ...(entry.hashtags || [])].join(' • ');
      const baseScore = intent.normalized ? fuzzyScore(intent.normalized, searchable) : 0;
      const hashtagHit = activeHashtag
        ? (entry.hashtags || []).some((tag) => normalizeSearchText(tag).replace(/^#/, '') === activeHashtag)
        : true;
      const intentHashtagBoost = intent.hashtags.length && (entry.hashtags || []).some((tag) => intent.hashtags.includes(String(tag).toLowerCase())) ? 0.18 : 0;
      const exactTypeBoost = intent.startsWithHashtag && entry.type === 'hashtags' ? 0.12 : 0;
      const popularity = (
        Number(entry.metrics?.likes || 0) * 2 +
        Number(entry.metrics?.followers || 0) * 3 +
        Number(entry.metrics?.members || 0) * 2.8 +
        Number(entry.metrics?.views || 0) * 0.02 +
        Number(entry.metrics?.comments || 0) * 2 +
        Number(entry.metrics?.posts || 0) * 1.8 +
        Number(entry.metrics?.shares || 0) * 2
      );

      return {
        ...entry,
        hashtagHit,
        score: Number((baseScore + intentHashtagBoost + exactTypeBoost + Math.min(popularity / 10000, 0.28)).toFixed(4)),
      };
    })
    .filter((entry) => entry.hashtagHit)
    .filter((entry) => !intent.normalized || entry.score >= 0.22)
    .sort((a, b) => b.score - a.score);

  return limit > 0 ? scored.slice(0, limit) : scored;
}

export function groupSearchResults(entries = []) {
  return entries.reduce((acc, item) => {
    const key = item.type || 'all';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}
