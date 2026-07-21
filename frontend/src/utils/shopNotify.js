/**
 * shopNotify.js — v88.35
 * إشعارات محلية لأحداث السوق (طلب / استفسار / إعجاب).
 * تُخزَّن في localStorage تحت 'yamshat_shop_notifications_v1' حتى يراها
 * صاحب المنتج حتى لو كان خارج التطبيق حين وقوع الحدث.
 *
 * تُطلق أيضاً حدث `yamshat:toast` فوري للجلسة الحالية، وحدث
 * `yamshat:notification` متوافق مع GlobalNotificationListener الحالي.
 */

const KEY = 'yamshat_shop_notifications_v1';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    // احتفظ فقط بأحدث 200 إشعاراً لكل مستخدم مجتمعة
    const limited = list.slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(limited));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:shop-notify-updated'));
    }
  } catch (err) {
    console.warn('shopNotify storage error', err);
  }
}

/**
 * أرسل إشعاراً لصاحب منتج.
 * kind: 'order' | 'inquiry' | 'like'
 */
export function push({ to, from, kind, product, text, path }) {
  if (!to || !product) return null;
  const id = `sn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item = {
    id,
    to,
    from: from || 'مجهول',
    kind: kind || 'order',
    productId: product.id,
    productName: product.name || '',
    productImage: product.image || '',
    text: text || '',
    path: path || `/shop`,
    created_at: new Date().toISOString(),
    seen: false,
  };
  const all = readAll();
  writeAll([item, ...all]);

  const title = (
    kind === 'order' ? '📦 طلب جديد على منتجك'
    : kind === 'inquiry' ? '💬 استفسار جديد على منتجك'
    : kind === 'like' ? '❤️ إعجاب جديد على منتجك'
    : '🔔 نشاط جديد على منتجك'
  );
  const body = `${item.from}: ${item.text || product.name}`;

  // toast فوري
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('yamshat:toast', {
        detail: { type: 'info', title, description: body, duration: 4200 },
      }));
    } catch { /* noop */ }
    // متوافق مع الـ GlobalNotificationListener
    try {
      window.dispatchEvent(new CustomEvent('yamshat:notification', {
        detail: {
          id,
          title,
          body,
          type: `shop_${kind}`,
          path: item.path,
          created_at: item.created_at,
          payload: { productId: product.id, from: item.from, screen: 'shop' },
        },
      }));
    } catch { /* noop */ }
    // إشعار متصفح إذا كان مسموحاً والتبويب في الخلفية
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        const notif = new Notification(title, {
          body,
          icon: '/icons/icon-512.png',
          tag: `yamshat-shop-${kind}-${product.id}`,
          data: { url: item.path },
        });
        notif.onclick = () => {
          try { window.focus(); } catch { /* noop */ }
          try {
            if (typeof window.history?.pushState === 'function') {
              window.history.pushState({}, '', item.path);
              window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
              window.location.assign(item.path);
            }
          } catch { /* noop */ }
          notif.close();
        };
      }
    } catch { /* noop */ }
  }
  return item;
}

export function listFor(username) {
  return readAll().filter((n) => n.to === username);
}

export function markAllSeenFor(username) {
  const all = readAll();
  writeAll(all.map((n) => (n.to === username ? { ...n, seen: true } : n)));
}

export default { push, listFor, markAllSeenFor };
