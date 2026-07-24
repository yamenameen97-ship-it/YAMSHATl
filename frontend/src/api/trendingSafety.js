// ======================================================================
// Yamshat — Trending Safety API Client (v88.52)
// ----------------------------------------------------------------------
// إدارة حارس سلامة التريندات من لوحة الأدمن.
// - يعرض المحتوى المحجوب تلقائياً (تحريض/كراهية/طائفية/سياسي/ديني/إرهاب/تعصب)
// - يتيح للأدمن حجب/سماح/إعادة تعيين
// - يعرض قائمة كلمات مفتاحية مخصصة
// ======================================================================
import API from './axios.js';

export const getSafetySnapshot = () =>
  API.get('/trending/safety/snapshot', { cache: false, forceRefresh: true });

export const getBlockedFromTrending = (limit = 50) =>
  API.get('/trending/safety/blocked', { params: { limit }, cache: false, forceRefresh: true });

export const getReviewQueue = (limit = 50) =>
  API.get('/trending/safety/review', { params: { limit }, cache: false, forceRefresh: true });

export const addBlocklistWord = (word) =>
  API.post('/trending/safety/blocklist/add', null, { params: { word } });

export const removeBlocklistWord = (word) =>
  API.post('/trending/safety/blocklist/remove', null, { params: { word } });

export const manualBlockKey = (key, reason = '') =>
  API.post(`/trending/safety/${encodeURIComponent(key)}/block`, null, { params: { reason } });

export const manualAllowKey = (key, reason = '') =>
  API.post(`/trending/safety/${encodeURIComponent(key)}/allow`, null, { params: { reason } });

export const resetManualDecision = (key) =>
  API.post(`/trending/safety/${encodeURIComponent(key)}/reset`);

export const classifyText = (text) =>
  API.post('/trending/safety/classify', null, { params: { text } });
