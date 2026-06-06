import API from './axios.js';

const SUPPORTED_REMOTE_SEARCH_TYPES = new Set(['all', 'users', 'posts', 'reels', 'hashtags']);

function normalizeRemoteResult(item = {}) {
  const type = item.type || 'posts';
  const title = item.title || item.name || item.description || 'نتيجة';
  return {
    id: item.id || `${type}-${title}`,
    type,
    title,
    name: item.name || title,
    description: item.description || item.content || '',
    content: item.content || item.description || '',
    avatar: item.avatar || item.image || '',
    media: item.media || item.image || '',
    hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
    mentions: Array.isArray(item.mentions) ? item.mentions : [],
    isVerified: Boolean(item.isVerified || item.verified || item.metadata?.is_verified),
    score: Number(item.score ?? item.relevance_score ?? 0),
    route: item.route || (type === 'users' ? `/profile/${encodeURIComponent(item.name || title)}` : type === 'hashtags' ? `/search?q=${encodeURIComponent(String(title).replace(/^#/, ''))}` : `/post/${encodeURIComponent(item.id || '')}`),
    metrics: item.metrics || item.metadata || {},
    createdAt: item.createdAt || item.timestamp || '',
    source: 'remote',
  };
}

export async function liveSearch(params = {}) {
  const rawType = String(params?.type || 'all').trim().toLowerCase();
  const sanitizedParams = {
    q: String(params?.q || '').trim(),
    type: SUPPORTED_REMOTE_SEARCH_TYPES.has(rawType) ? rawType : 'all',
    limit: Math.min(Math.max(Number(params?.limit) || 12, 1), 50),
  };

  if (!sanitizedParams.q) {
    return { query: '', results: [], total: 0 };
  }

  const { data } = await API.get('/search', {
    params: sanitizedParams,
    cache: false,
    forceRefresh: true,
  });
  return {
    ...data,
    results: Array.isArray(data?.results) ? data.results.map(normalizeRemoteResult) : [],
  };
}

export async function getSearchSuggestions(query, limit = 8) {
  const { data } = await API.get('/search/suggestions', {
    params: { q: query, limit },
    cache: false,
    forceRefresh: true,
  });
  return data;
}

export async function getTrendingSearches(limit = 8) {
  const { data } = await API.get('/search/trending', {
    params: { limit },
    cache: false,
    forceRefresh: true,
  });
  return data;
}
