// ======================================================================
// Yamshat — Trending API Client (v88.51)
// ======================================================================
import API from './axios.js';

export const getGlobalTrending = (limit = 20) =>
  API.get('/trending/global', { params: { limit }, cache: true, cacheTtlMs: 15_000 });

export const getCountryTrending = (code, limit = 20) =>
  API.get(`/trending/country/${encodeURIComponent(code)}`, {
    params: { limit },
    cache: true,
    cacheTtlMs: 15_000,
  });

export const getTrendingOverview = () =>
  API.get('/trending/overview', { cache: true, cacheTtlMs: 15_000 });

export const refreshTrending = (scope = 'global', country = null) =>
  API.post('/trending/refresh', null, { params: { scope, country } });

export const getTrendingSignals = (limit = 20) =>
  API.get('/trending/signals', { params: { limit }, cache: false, forceRefresh: true });

export const pinTrending = (key) => API.post(`/trending/${encodeURIComponent(key)}/pin`);
export const unpinTrending = (key) => API.post(`/trending/${encodeURIComponent(key)}/unpin`);
export const hideTrending = (key) => API.post(`/trending/${encodeURIComponent(key)}/hide`);
export const unhideTrending = (key) => API.post(`/trending/${encodeURIComponent(key)}/unhide`);
