import { buildTrendingHashtags, rankSuggestedUsers } from '../recommendationService.js';
import { extractHashtags, fuzzyScore, normalizeSearchText, tokenize } from '../../utils/fuzzySearch.js';

const indexCache = new Map();

export function extractMentions(text = '') {
  return Array.from(new Set((String(text || '').match(/@[\p{L}\p{N}._-]+/gu) || []).map((item) => item.toLowerCase())));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toTimestamp(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function freshnessBoost(createdAt) {
  const timestamp = toTimestamp(createdAt);
  if (!timestamp) return 0;
  const hours = Math.max(1, (Date.now() - timestamp) / 36e5);
  return Math.max(0, 0.18 - (hours / (24 * 30)) * 0.1);
}

function normalizeHashtagValue(tag = '') {
  const value = String(tag || '').trim();
  if (!value) return '';
  return value.startsWith('#') ? value.toLowerCase() : `#${value.toLowerCase()}`;
}

function normalizeMentionValue(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.startsWith('@') ? text.toLowerCase() : `@${text.toLowerCase()}`;
}

function metricScore(metrics = {}) {
  return (
    toNumber(metrics.likes) * 1.8 +
    toNumber(metrics.comments) * 2.2 +
    toNumber(metrics.shares) * 2.8 +
    toNumber(metrics.saves) * 2.4 +
    toNumber(metrics.views) * 0.015 +
    toNumber(metrics.followers) * 0.03
  );
}

function buildEntry(type, item = {}) {
  const username = item.username || item.handle || item.name || '';
  const title = item.title || item.name || item.content || username || 'Untitled';
  const description = item.description || item.bio || item.caption || item.content || '';
  const content = item.content || item.caption || item.description || '';
  const hashtags = (Array.isArray(item.hashtags) ? item.hashtags : extractHashtags(`${content} ${description}`))
    .map((tag) => normalizeHashtagValue(tag))
    .filter(Boolean);
  const mentions = extractMentions(`${content} ${description} ${username}`).map((itemValue) => normalizeMentionValue(itemValue));
  const metrics = {
    likes: toNumber(item.likes_count || item.like_count || item.likes),
    comments: toNumber(item.comments_count || item.comment_count),
    shares: toNumber(item.share_count || item.shares || item.shareCount),
    saves: toNumber(item.saved_count || item.save_count),
    views: toNumber(item.views_count || item.view_count),
    followers: toNumber(item.followers_count || item.followers),
  };
  const route = type === 'users'
    ? `/profile/${encodeURIComponent(username || item.id || '')}`
    : type === 'hashtags'
      ? `/search?q=${encodeURIComponent(String(title).replace(/^#/, ''))}`
      : type === 'reels'
        ? '/reels'
        : '/';
  const searchText = [
    title,
    username,
    description,
    content,
    hashtags.join(' '),
    mentions.join(' '),
  ].filter(Boolean).join(' • ');

  return {
    id: item.id || `${type}-${username || title}`,
    type,
    title: type === 'hashtags' ? normalizeHashtagValue(title) : title,
    name: username,
    description,
    content,
    hashtags,
    mentions,
    avatar: item.avatar || item.avatar_url || item.user_avatar || '',
    media: item.media_url || item.video_url || item.image_url || item.media || '',
    createdAt: item.created_at || item.updated_at || '',
    isVerified: Boolean(item.is_verified || item.verified),
    metrics,
    route,
    searchText,
    searchableTokens: tokenize(searchText),
    discoveryScore: metricScore(metrics) + freshnessBoost(item.created_at) * 100,
    raw: item,
  };
}

function createCollectionSignature(collections = {}) {
  const users = collections.users || [];
  const posts = collections.posts || [];
  const reels = collections.reels || [];
  const hashtags = collections.hashtags || [];
  const stamp = [
    users.length,
    posts.length,
    reels.length,
    hashtags.length,
    users[0]?.id || users[0]?.username || '',
    posts[0]?.id || posts[0]?.created_at || '',
    reels[0]?.id || reels[0]?.created_at || '',
  ].join(':');
  return stamp;
}

export function buildSearchIndex(collections = {}) {
  const signature = createCollectionSignature(collections);
  if (indexCache.has(signature)) return indexCache.get(signature);

  const entries = [];
  (collections.users || []).forEach((item) => entries.push(buildEntry('users', item)));
  (collections.posts || []).forEach((item) => entries.push(buildEntry('posts', item)));
  (collections.reels || []).forEach((item) => entries.push(buildEntry('reels', item)));
  (collections.hashtags || []).forEach((item) => {
    const tag = typeof item === 'string' ? item : item.tag || item.name || '';
    entries.push(buildEntry('hashtags', {
      ...item,
      id: `hashtag-${tag}`,
      title: normalizeHashtagValue(tag),
      description: typeof item === 'string' ? 'هاشتاج شائع' : item.description || `${item.count || 0} منشور`,
      likes_count: item.engagement || 0,
    }));
  });

  const tokenMap = new Map();
  entries.forEach((entry) => {
    entry.searchableTokens.forEach((token) => {
      if (!tokenMap.has(token)) tokenMap.set(token, new Set());
      tokenMap.get(token).add(entry.id);
    });
    entry.hashtags.forEach((tag) => {
      if (!tokenMap.has(tag)) tokenMap.set(tag, new Set());
      tokenMap.get(tag).add(entry.id);
    });
    entry.mentions.forEach((mention) => {
      if (!tokenMap.has(mention)) tokenMap.set(mention, new Set());
      tokenMap.get(mention).add(entry.id);
    });
  });

  const index = {
    signature,
    entries,
    tokenMap,
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    createdAt: Date.now(),
  };
  indexCache.set(signature, index);
  return index;
}

function resolveCandidates(index, queryTokens = []) {
  if (!queryTokens.length) return index.entries;
  const matchedIds = new Set();
  queryTokens.forEach((token) => {
    const direct = index.tokenMap.get(token);
    if (direct) {
      direct.forEach((id) => matchedIds.add(id));
      return;
    }
    index.tokenMap.forEach((ids, candidateToken) => {
      if (candidateToken.startsWith(token) || candidateToken.includes(token)) {
        ids.forEach((id) => matchedIds.add(id));
      }
    });
  });
  return matchedIds.size
    ? Array.from(matchedIds).map((id) => index.byId.get(id)).filter(Boolean)
    : index.entries;
}

function matchesAdvancedFilters(entry, filters = {}) {
  if (filters.type && filters.type !== 'all' && entry.type !== filters.type) return false;
  if (filters.onlyVerified && !entry.isVerified) return false;
  if (filters.onlyMedia && !entry.media) return false;
  if (filters.requiredHashtag) {
    const required = normalizeHashtagValue(filters.requiredHashtag);
    if (!entry.hashtags.includes(required) && normalizeHashtagValue(entry.title) !== required) return false;
  }
  if (filters.requiredMention) {
    const mention = normalizeMentionValue(filters.requiredMention);
    if (!entry.mentions.includes(mention) && normalizeMentionValue(entry.name) !== mention) return false;
  }
  if (filters.minFollowers && entry.type === 'users' && toNumber(entry.metrics.followers) < Number(filters.minFollowers)) return false;
  return true;
}

function scoreEntry(entry, normalizedQuery = '', queryTokens = [], filters = {}) {
  const relevance = normalizedQuery ? fuzzyScore(normalizedQuery, entry.searchText) : 0;
  const tokenCoverage = queryTokens.length
    ? queryTokens.reduce((score, token) => {
      if (entry.searchableTokens.some((candidate) => candidate === token)) return score + 0.16;
      if (entry.searchableTokens.some((candidate) => candidate.startsWith(token))) return score + 0.12;
      if (entry.hashtags.some((tag) => tag.includes(token)) || entry.mentions.some((mention) => mention.includes(token))) return score + 0.14;
      return score;
    }, 0)
    : 0;
  const popularity = Math.min(metricScore(entry.metrics) / 6000, 0.22);
  const freshness = freshnessBoost(entry.createdAt);
  const discoveryBoost = filters.intent === 'discover-users' && entry.type === 'users' ? 0.12 : 0;
  return Number((relevance + tokenCoverage + popularity + freshness + discoveryBoost).toFixed(4));
}

function sortEntries(entries = [], sortBy = 'relevance') {
  const list = [...entries];
  if (sortBy === 'fresh') {
    return list.sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt));
  }
  if (sortBy === 'trending') {
    return list.sort((left, right) => metricScore(right.metrics) - metricScore(left.metrics));
  }
  if (sortBy === 'people') {
    return list.sort((left, right) => {
      if (left.type === 'users' && right.type !== 'users') return -1;
      if (right.type === 'users' && left.type !== 'users') return 1;
      return right.score - left.score;
    });
  }
  return list.sort((left, right) => right.score - left.score);
}

export function searchIndex(index, query = '', options = {}) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(query).map((token) => {
    if (String(query).trim().startsWith('#') || token.startsWith('#')) return normalizeHashtagValue(token);
    if (String(query).trim().startsWith('@') || token.startsWith('@')) return normalizeMentionValue(token);
    return token;
  });
  const candidates = resolveCandidates(index, queryTokens);
  const filters = {
    ...options,
    requiredHashtag: options.requiredHashtag || (String(query).trim().startsWith('#') ? query : ''),
    requiredMention: options.requiredMention || (String(query).trim().startsWith('@') ? query : ''),
  };

  const results = candidates
    .filter((entry) => matchesAdvancedFilters(entry, filters))
    .map((entry) => ({
      ...entry,
      score: scoreEntry(entry, normalizedQuery, queryTokens, filters),
      explanation: [entry.name, ...(entry.hashtags || []).slice(0, 2), ...(entry.mentions || []).slice(0, 1)].filter(Boolean).join(' • '),
    }))
    .filter((entry) => !normalizedQuery || entry.score >= 0.22);

  return sortEntries(results, options.sortBy || 'relevance');
}

export function getSearchInsights(index, query = '') {
  const results = searchIndex(index, query, { sortBy: 'trending' }).slice(0, 30);
  const hashtags = new Map();
  const mentions = new Map();
  results.forEach((entry) => {
    entry.hashtags.forEach((tag) => hashtags.set(tag, (hashtags.get(tag) || 0) + 1));
    entry.mentions.forEach((mention) => mentions.set(mention, (mentions.get(mention) || 0) + 1));
  });
  return {
    topHashtags: Array.from(hashtags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => ({ tag, count })),
    topMentions: Array.from(mentions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([mention, count]) => ({ mention, count })),
  };
}

export function buildSearchCollections(users = [], posts = []) {
  const reels = posts.filter((item) => /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(String(item.media_url || item.video_url || '')));
  const hashtags = buildTrendingHashtags(posts);
  return { users, posts, reels, hashtags };
}

export function buildUserDiscovery(index, query = '', limit = 8) {
  const queryText = normalizeSearchText(query);
  const users = index.entries.filter((entry) => entry.type === 'users');
  const ranked = rankSuggestedUsers(users.map((entry) => ({
    ...entry.raw,
    username: entry.name,
    followers_count: entry.metrics.followers,
    is_verified: entry.isVerified,
  })), '');

  return ranked
    .map((user) => {
      const matchScore = queryText ? fuzzyScore(queryText, `${user.username || ''} ${user.bio || ''} ${user.name || ''}`) : 0;
      return {
        id: user.id || user.username,
        username: user.username || user.name,
        name: user.name || user.username,
        avatar: user.avatar || user.avatar_url || '',
        bio: user.bio || user.description || '',
        isVerified: Boolean(user.is_verified || user.verified),
        followers: toNumber(user.followers_count || user.followers),
        score: Number((toNumber(user.recommendation_score) + matchScore * 100).toFixed(2)),
        reason: user.recommendation_reason || 'مقترح ليك',
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
