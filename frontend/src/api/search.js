import API from './axios.js';

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
  const { data } = await API.get('/search', { params, cache: false, forceRefresh: true });
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
