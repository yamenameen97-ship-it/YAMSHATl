/**
 * Shop API client — يجلب/يرسل إعلانات صفحة التسوق من/إلى الخادم
 * حتى تظهر لكل المشتركين وليس فقط لناشرها على متصفحه المحلي.
 */
import API from './axios.js';

/** جلب كل الإعلانات النشطة من الخادم */
export async function fetchShopAds({ limit = 100, offset = 0 } = {}) {
  const res = await API.get('/shop/ads', { params: { limit, offset } });
  const data = res?.data || {};
  const items = Array.isArray(data.items) ? data.items : [];
  return items;
}

/** نشر إعلان جديد على الخادم */
export async function publishShopAd(payload) {
  const body = {
    name: String(payload?.name || '').trim(),
    price: Number(payload?.price || 0),
    currency: String(payload?.currency || 'USD'),
    address: String(payload?.address || '').trim(),
    description: String(payload?.description || '').trim(),
    image: String(payload?.image || ''),
  };
  const res = await API.post('/shop/ads', body);
  return res?.data || null;
}

/** حذف إعلان (لصاحبه فقط أو الأدمن) */
export async function deleteShopAd(serverId) {
  const id = Number(serverId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('invalid ad id');
  const res = await API.delete(`/shop/ads/${id}`);
  return res?.data || null;
}

/** إعجاب / إلغاء إعجاب */
export async function toggleShopAdLike(serverId) {
  const id = Number(serverId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('invalid ad id');
  const res = await API.post(`/shop/ads/${id}/like`);
  return res?.data || null;
}

/** تفاعل emoji */
export async function reactToShopAd(serverId, key) {
  const id = Number(serverId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('invalid ad id');
  const res = await API.post(`/shop/ads/${id}/react`, { key });
  return res?.data || null;
}

export default {
  fetchShopAds,
  publishShopAd,
  deleteShopAd,
  toggleShopAdLike,
  reactToShopAd,
};
