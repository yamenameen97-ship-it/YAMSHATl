/**
 * shopChatBridge.js — v88.35
 * جسر رسائل خاص بالسوق بين المشتري وصاحب المنتج.
 * يعمل محلياً عبر localStorage (لأن باك-إند الدردشة العامة يتطلب حسابات مسجلة
 * من الطرفين، وقد لا يكون المشتري/البائع مسجلين بنفس التطبيق).
 *
 * البنية:
 *   yamshat_shop_threads_v1: {
 *     [threadId]: {
 *       id, productId, productName, productImage,
 *       seller, buyer, createdAt, updatedAt,
 *       messages: [{ id, from, text, at, kind }]
 *     }
 *   }
 *
 * threadId = `t-${productId}-${buyer}` (ثابت لكل زوج مشتري/منتج).
 * يتم إطلاق حدث `yamshat:shop-thread-updated` عند أي تحديث حتى تُحدَّث
 * الواجهات المفتوحة تلقائياً.
 */

const KEY = 'yamshat_shop_threads_v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:shop-thread-updated'));
    }
  } catch (err) {
    console.warn('shopChatBridge storage error', err);
  }
}

export function buildThreadId(productId, buyer) {
  return `t-${productId}-${buyer}`;
}

export function getThread(threadId) {
  const all = readAll();
  return all[threadId] || null;
}

export function listThreadsFor(username) {
  const all = readAll();
  const list = Object.values(all).filter((t) => (
    t && (t.buyer === username || t.seller === username)
  ));
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * Ensures a thread exists and appends a message.
 * message: { from, text, kind? } — kind ∈ 'order' | 'inquiry' | 'reply' | 'text'
 * Returns the updated thread.
 */
export function sendMessage({ product, buyer, seller, from, text, kind = 'text', meta = null }) {
  if (!product || !product.id || !buyer || !seller || !from || !text) return null;
  const threadId = buildThreadId(product.id, buyer);
  const all = readAll();
  const now = Date.now();
  const existing = all[threadId] || {
    id: threadId,
    productId: product.id,
    productName: product.name || '',
    productImage: product.image || '',
    seller,
    buyer,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const msg = {
    id: `m-${now}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    text: String(text),
    at: now,
    kind,
    ...(meta ? { meta } : {}),
  };
  const nextThread = {
    ...existing,
    productName: product.name || existing.productName,
    productImage: product.image || existing.productImage,
    updatedAt: now,
    messages: [...(existing.messages || []), msg],
  };
  all[threadId] = nextThread;
  writeAll(all);
  return nextThread;
}

export function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('yamshat:shop-thread-updated', handler);
  window.addEventListener('storage', (e) => { if (e.key === KEY) callback(); });
  return () => {
    window.removeEventListener('yamshat:shop-thread-updated', handler);
  };
}

export default {
  buildThreadId,
  getThread,
  listThreadsFor,
  sendMessage,
  subscribe,
};
