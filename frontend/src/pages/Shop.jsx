import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getCurrentUsername } from '../utils/auth.js';
import { sendMessage as bridgeSend, listThreadsFor } from '../utils/shopChatBridge.js';
import shopNotify from '../utils/shopNotify.js';

/**
 * Shop — v88.35 (Marketplace + Private Chat + Notifications)
 * ---------------------------------------------------------
 * التغييرات مقارنة بـ v88.27:
 *  ① إرسال الطلب: بدلاً من مجرد تخزينه، يُرسَل أيضاً كرسالة خاصة إلى صاحب
 *    المنتج داخل قناة /shop/chat/:productId/:buyer، ويُطلَق له إشعار.
 *  ② الاستفسار: لم يعد "تعليقاً عاماً" — بل رسالة خاصة تفتح دردشة
 *    /shop/chat/:productId/:buyer فوراً، ويصل إشعار للبائع.
 *  ③ زر "تعليق" في شريط الإجراءات السفلي أُعيدت تسميته وتوجيهه إلى نفس
 *    الدردشة الخاصة (كان يفتح مودال الاستفسار العام).
 *  ④ الإعجاب: يرسل إشعاراً للبائع (بدون فتح دردشة).
 *  ⑤ عدّاد الطلبات على بطاقة البائع يعرض فقط الطلبات النشطة
 *    (pending / accepted) — ليس المرفوضة أو المسلَّمة (كانت تتراكم بلا داعٍ).
 *  ⑥ زر جديد "📨 دردشتي مع البائع" للمشتري يفتح الخيط مباشرة إذا كان لديه واحد.
 */

const STORAGE_KEY = 'yamshat_shop_v1';

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'إعجاب' },
  { key: 'love', emoji: '❤️', label: 'حب' },
  { key: 'wow', emoji: '😮', label: 'مندهش' },
  { key: 'fire', emoji: '🔥', label: 'رائع' },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], orders: {}, inquiries: {}, prefs: {} };
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      orders: parsed.orders && typeof parsed.orders === 'object' ? parsed.orders : {},
      inquiries: parsed.inquiries && typeof parsed.inquiries === 'object' ? parsed.inquiries : {},
      prefs: parsed.prefs && typeof parsed.prefs === 'object' ? parsed.prefs : {},
    };
  } catch {
    return { products: [], orders: {}, inquiries: {}, prefs: {} };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('shop storage error', err);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('failed'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

const seedProducts = () => ([
  {
    id: `p-${Date.now() - 500000}-a`,
    seller: 'yamshat_shop',
    sellerName: 'متجر يام شات',
    name: 'سماعة بلوتوث لاسلكية',
    price: 25,
    currency: 'USD',
    address: 'صنعاء - شارع الزبيري',
    description: 'سماعة لاسلكية بجودة صوت عالية وبطارية تدوم 8 ساعات، توصيل مجاني داخل المدينة.',
    image: '',
    createdAt: Date.now() - 3600 * 1000 * 2,
    likes: 3,
    likedBy: [],
    reactions: { like: 3 },
    saved: false,
  },
]);

// ✅ Fix #5: عد الطلبات النشطة فقط (استبعد المرفوضة والمسلَّمة)
function activeOrdersCount(list) {
  if (!Array.isArray(list)) return 0;
  return list.filter((o) => o.status !== 'rejected' && o.status !== 'delivered').length;
}

export default function Shop() {
  const me = getCurrentUsername() || 'guest';
  const navigate = useNavigate();

  const [state, setState] = useState(() => {
    const s = loadState();
    if (!s.products || s.products.length === 0) {
      s.products = seedProducts();
      saveState(s);
    }
    return s;
  });

  const [composerOpen, setComposerOpen] = useState(false);
  const [orderModal, setOrderModal] = useState(null); // productId
  const [ordersPanelProduct, setOrdersPanelProduct] = useState(null); // seller view

  const persist = useCallback((next) => {
    setState(next);
    saveState(next);
  }, []);

  const addProduct = (product) => {
    const p = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      seller: me,
      sellerName: me,
      createdAt: Date.now(),
      likes: 0,
      likedBy: [],
      reactions: {},
      saved: false,
      ...product,
    };
    persist({ ...state, products: [p, ...state.products] });
  };

  const removeProduct = (id) => {
    if (!window.confirm('حذف هذا المنتج؟')) return;
    const next = { ...state };
    next.products = state.products.filter((p) => p.id !== id);
    delete next.orders[id];
    delete next.inquiries[id];
    persist(next);
  };

  const toggleLike = (id) => {
    const product = state.products.find((p) => p.id === id);
    if (!product) return;
    const wasLiked = (product.likedBy || []).includes(me);

    const next = { ...state, products: state.products.map((p) => {
      if (p.id !== id) return p;
      const likedBy = new Set(p.likedBy || []);
      if (likedBy.has(me)) {
        likedBy.delete(me);
        return { ...p, likes: Math.max(0, (p.likes || 0) - 1), likedBy: Array.from(likedBy) };
      }
      likedBy.add(me);
      return { ...p, likes: (p.likes || 0) + 1, likedBy: Array.from(likedBy) };
    }) };
    persist(next);

    // ④ إشعار للبائع فقط عند الإعجاب (لا نُشعِر لصاحبه أو عند فك الإعجاب)
    if (!wasLiked && product.seller !== me) {
      shopNotify.push({
        to: product.seller,
        from: me,
        kind: 'like',
        product,
        text: 'أعجبه منتجك',
        path: '/shop',
      });
    }
  };

  const toggleSave = (id) => {
    const next = { ...state, products: state.products.map((p) => (
      p.id === id ? { ...p, saved: !p.saved } : p
    )) };
    persist(next);
  };

  const react = (id, key) => {
    const next = { ...state, products: state.products.map((p) => {
      if (p.id !== id) return p;
      const r = { ...(p.reactions || {}) };
      r[key] = (r[key] || 0) + 1;
      return { ...p, reactions: r };
    }) };
    persist(next);
  };

  const sharePost = async (product) => {
    const text = `${product.name} — ${product.price} ${product.currency}\n${product.description}\n${product.address}`;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text }); return; } catch { /* noop */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('yamshat:toast', { detail: { type: 'success', title: 'تم نسخ تفاصيل المنتج' } }));
    } catch {
      alert(text);
    }
  };

  // ① إرسال الطلب = تخزين + رسالة خاصة + إشعار
  const submitOrder = (productId, payload) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;

    const next = { ...state };
    const list = Array.isArray(next.orders[productId]) ? [...next.orders[productId]] : [];
    const order = {
      id: `o-${Date.now()}`,
      buyer: me,
      createdAt: Date.now(),
      status: 'pending',
      replies: [],
      ...payload,
    };
    list.push(order);
    next.orders = { ...next.orders, [productId]: list };
    persist(next);
    setOrderModal(null);

    // رسالة خاصة في دردشة المنتج
    const orderText = [
      `📦 طلب شراء جديد`,
      `الاسم: ${payload.buyerName}`,
      `التواصل: ${payload.contact}`,
      `الكمية: ${payload.quantity}`,
      payload.message ? `الرسالة: ${payload.message}` : '',
    ].filter(Boolean).join('\n');

    bridgeSend({
      product,
      buyer: me,
      seller: product.seller,
      from: me,
      text: orderText,
      kind: 'order',
      meta: { orderId: order.id },
    });

    // إشعار للبائع
    if (product.seller !== me) {
      shopNotify.push({
        to: product.seller,
        from: me,
        kind: 'order',
        product,
        text: `طلب شراء (${payload.quantity} × ${product.name})`,
        path: `/shop/chat/${product.id}/${me}`,
      });
    }

    window.dispatchEvent(new CustomEvent('yamshat:toast', {
      detail: { type: 'success', title: 'تم إرسال طلبك ووصلت رسالتك للبائع.' }
    }));

    // فتح الدردشة الخاصة للمشتري ليتابع الرد
    navigate(`/shop/chat/${product.id}/${me}`);
  };

  const replyToOrder = (productId, orderId, message) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    const next = { ...state };
    const list = (next.orders[productId] || []).map((o) => {
      if (o.id !== orderId) return o;
      const replies = [...(o.replies || []), { author: me, message, at: Date.now() }];
      return { ...o, replies };
    });
    next.orders = { ...next.orders, [productId]: list };
    persist(next);

    // ابعث الرد أيضاً كرسالة خاصة داخل الخيط الصحيح
    const order = list.find((o) => o.id === orderId);
    if (order) {
      bridgeSend({
        product,
        buyer: order.buyer,
        seller: product.seller,
        from: me,
        text: message,
        kind: 'reply',
      });
      if (order.buyer !== me) {
        shopNotify.push({
          to: order.buyer,
          from: me,
          kind: 'inquiry',
          product,
          text: `ردٌ من البائع: ${message}`,
          path: `/shop/chat/${product.id}/${order.buyer}`,
        });
      }
    }
  };

  const setOrderStatus = (productId, orderId, status) => {
    const product = state.products.find((p) => p.id === productId);
    const next = { ...state };
    const list = (next.orders[productId] || []).map((o) => (o.id === orderId ? { ...o, status } : o));
    next.orders = { ...next.orders, [productId]: list };
    persist(next);

    const order = list.find((o) => o.id === orderId);
    if (order && product) {
      const label = status === 'accepted' ? 'تم قبول طلبك ✅'
        : status === 'rejected' ? 'تم رفض طلبك ✖'
        : status === 'delivered' ? 'تم تسليم طلبك 📦'
        : 'تحديث حالة طلبك';
      bridgeSend({
        product,
        buyer: order.buyer,
        seller: product.seller,
        from: me,
        text: label,
        kind: 'reply',
      });
      if (order.buyer !== me) {
        shopNotify.push({
          to: order.buyer,
          from: me,
          kind: 'order',
          product,
          text: label,
          path: `/shop/chat/${product.id}/${order.buyer}`,
        });
      }
    }
  };

  // ② الاستفسار = فتح دردشة خاصة مباشرة (بدون مودال عام)
  const openInquiryChat = (product) => {
    // المشتري (أنا) يفتح خيطه مع البائع
    // إذا كنت أنا البائع، افتح رابط سوق لأنه لا يوجد خيط ذاتي
    if (product.seller === me) {
      window.dispatchEvent(new CustomEvent('yamshat:toast', {
        detail: { type: 'info', title: 'هذا منتجك — افتح "الطلبات" لرؤية استفسارات المشترين.' }
      }));
      setOrdersPanelProduct(product.id);
      return;
    }
    // أول مرة يفتح فيها المشتري الدردشة، أضف رسالة ترحيب لجعل البائع
    // على علم بوجود اهتمام (ولن يتم إرسال إشعار طلب — سيصل حين يكتب أولى رسائله).
    navigate(`/shop/chat/${product.id}/${me}`);
  };

  const productBeingOrdered = useMemo(
    () => state.products.find((p) => p.id === orderModal) || null,
    [state.products, orderModal],
  );
  const productForOrdersPanel = useMemo(
    () => state.products.find((p) => p.id === ordersPanelProduct) || null,
    [state.products, ordersPanelProduct],
  );

  // خيوطي لعرض شارة على البطاقة إن كنت المشتري
  const myThreads = useMemo(() => listThreadsFor(me), [me, state]);

  return (
    <MainLayout>
      <div dir="rtl" className="shop-page yam-shop-page" data-page="shop">
        <header className="shop-hero">
          <div className="shop-hero-inner">
            <div>
              <h1>🛍 التسوق</h1>
              <p>سوق يام شات — اعرض منتجاتك واستقبل الطلبات مباشرة.</p>
            </div>
            <button type="button" className="shop-add-btn" onClick={() => setComposerOpen(true)}>
              + إضافة إعلان
            </button>
          </div>
        </header>

        <main className="shop-grid">
          {state.products.length === 0 && (
            <div className="shop-empty">لا توجد إعلانات بعد. كن أول من ينشر منتجاً!</div>
          )}
          {state.products.map((product) => {
            const mineWithSeller = myThreads.find((t) => t.productId === product.id && t.buyer === me);
            return (
              <ProductCard
                key={product.id}
                product={product}
                me={me}
                orders={state.orders[product.id] || []}
                hasOpenThread={Boolean(mineWithSeller)}
                onLike={() => toggleLike(product.id)}
                onSave={() => toggleSave(product.id)}
                onShare={() => sharePost(product)}
                onReact={(key) => react(product.id, key)}
                onOrder={() => setOrderModal(product.id)}
                onInquire={() => openInquiryChat(product)}
                onManageOrders={() => setOrdersPanelProduct(product.id)}
                onDelete={() => removeProduct(product.id)}
                onOpenChat={() => navigate(`/shop/chat/${product.id}/${me}`)}
              />
            );
          })}
        </main>

        {composerOpen && (
          <ProductComposer
            onClose={() => setComposerOpen(false)}
            onSubmit={(data) => { addProduct(data); setComposerOpen(false); }}
          />
        )}

        {productBeingOrdered && (
          <OrderModal
            product={productBeingOrdered}
            onClose={() => setOrderModal(null)}
            onSubmit={(payload) => submitOrder(productBeingOrdered.id, payload)}
          />
        )}

        {productForOrdersPanel && (
          <OrdersPanel
            product={productForOrdersPanel}
            orders={state.orders[productForOrdersPanel.id] || []}
            me={me}
            onClose={() => setOrdersPanelProduct(null)}
            onReply={(orderId, msg) => replyToOrder(productForOrdersPanel.id, orderId, msg)}
            onStatus={(orderId, status) => setOrderStatus(productForOrdersPanel.id, orderId, status)}
            onOpenBuyerChat={(buyer) => navigate(`/shop/chat/${productForOrdersPanel.id}/${buyer}`)}
          />
        )}
      </div>

      <style>{`
        .shop-page {
          padding: 12px 12px 90px;
          max-width: 900px;
          margin: 0 auto;
          color: #e2e8f0;
          font-family: "Noto Sans Arabic","Cairo",system-ui,sans-serif;
        }
        .shop-hero {
          background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(20,184,166,0.12));
          border: 1px solid rgba(167,139,250,0.22);
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 14px;
        }
        .shop-hero-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .shop-hero h1 { margin: 0; font-size: 1.25rem; color: #f8fafc; }
        .shop-hero p { margin: 4px 0 0; color: #cbd5e1; font-size: 0.86rem; }
        .shop-add-btn {
          background: linear-gradient(180deg, #7c3aed, #4c1d95);
          color: #fff;
          border: 0;
          border-radius: 12px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(124,58,237,0.35);
        }
        .shop-grid {
          display: grid;
          gap: 14px;
        }
        .shop-empty {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
          background: rgba(15,23,42,0.5);
          border-radius: 14px;
          border: 1px dashed rgba(148,163,184,0.2);
        }
      `}</style>
    </MainLayout>
  );
}

/* --------------------- Product Card --------------------- */
function ProductCard({
  product, me, orders, hasOpenThread,
  onLike, onSave, onShare, onReact, onOrder, onInquire,
  onManageOrders, onDelete, onOpenChat,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const isOwner = product.seller === me;
  const liked = (product.likedBy || []).includes(me);
  const totalReactions = Object.values(product.reactions || {}).reduce((a, b) => a + b, 0);
  const activeOrders = activeOrdersCount(orders); // ✅ Fix #5

  return (
    <article className="pc-card">
      <header className="pc-header">
        <div className="pc-avatar">{(product.sellerName || 'U').slice(0, 1).toUpperCase()}</div>
        <div className="pc-meta">
          <strong>{product.sellerName || product.seller}</strong>
          <span>{timeAgo(product.createdAt)} • 📍 {product.address}</span>
        </div>
        {isOwner && (
          <div className="pc-owner-actions">
            <button type="button" onClick={onManageOrders} title="طلبات هذا المنتج">
              📥 {activeOrders}
            </button>
            <button type="button" onClick={onDelete} title="حذف">🗑</button>
          </div>
        )}
      </header>

      {product.image && (
        <div className="pc-image-wrap">
          <img src={product.image} alt={product.name} />
        </div>
      )}

      <div className="pc-body">
        <h3 className="pc-name">{product.name}</h3>
        <div className="pc-price">
          {product.price} <small>{product.currency || 'USD'}</small>
        </div>
        {product.description && <p className="pc-desc">{product.description}</p>}
      </div>

      <div className="pc-cta">
        <button type="button" className="pc-btn primary" onClick={onOrder} disabled={isOwner}>
          📦 إرسال طلب
        </button>
        <button type="button" className="pc-btn secondary" onClick={onInquire}>
          💬 استفسار (خاص)
        </button>
        {!isOwner && hasOpenThread && (
          <button type="button" className="pc-btn tertiary" onClick={onOpenChat} title="فتح دردشتك الخاصة بهذا المنتج">
            📨 دردشتي مع البائع
          </button>
        )}
      </div>

      <footer className="pc-footer">
        <div className="pc-actions-row">
          <button
            type="button"
            className={`pc-act ${liked ? 'liked' : ''}`}
            onClick={onLike}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {liked ? '❤️' : '🤍'} إعجاب {product.likes > 0 && <em>{product.likes}</em>}
            {showReactions && (
              <div className="pc-reactions-pop" onMouseLeave={() => setShowReactions(false)}>
                {REACTIONS.map((r) => (
                  <button key={r.key} type="button" title={r.label} onClick={(e) => { e.stopPropagation(); onReact(r.key); setShowReactions(false); }}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </button>

          {/* ✅ Fix #3: زر "تعليق" لم يعد يفتح استفساراً عاماً — يوجّه لدردشة خاصة */}
          <button type="button" className="pc-act" onClick={onInquire} title="محادثة خاصة مع البائع">
            💬 راسل البائع
          </button>

          <button type="button" className={`pc-act ${product.saved ? 'saved' : ''}`} onClick={onSave}>
            {product.saved ? '🔖' : '📑'} حفظ
          </button>

          <button type="button" className="pc-act" onClick={onShare}>
            ↗ مشاركة
          </button>
        </div>
        {totalReactions > 0 && (
          <div className="pc-reactions-summary">
            {Object.entries(product.reactions || {}).map(([k, v]) => {
              const r = REACTIONS.find((x) => x.key === k);
              return r ? <span key={k}>{r.emoji} {v}</span> : null;
            })}
          </div>
        )}
      </footer>

      <style>{`
        .pc-card {
          background: linear-gradient(180deg, rgba(15,23,42,0.85), rgba(8,10,22,0.9));
          border: 1px solid rgba(148,163,184,0.14);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .pc-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(148,163,184,0.08);
        }
        .pc-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: #fff; display: grid; place-items: center; font-weight: 800;
        }
        .pc-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .pc-meta strong { color: #f8fafc; font-size: 0.95rem; }
        .pc-meta span { color: #94a3b8; font-size: 0.78rem; }
        .pc-owner-actions { display: flex; gap: 6px; }
        .pc-owner-actions button {
          background: rgba(30,41,59,0.7); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.16);
          border-radius: 10px; padding: 6px 10px; cursor: pointer; font-size: 0.82rem;
        }
        .pc-image-wrap { background: #000; }
        .pc-image-wrap img {
          width: 100%; max-height: 420px; object-fit: cover; display: block;
        }
        .pc-body { padding: 12px 14px; }
        .pc-name { margin: 0 0 6px; color: #f8fafc; font-size: 1.02rem; }
        .pc-price {
          color: #34d399; font-weight: 800; font-size: 1.15rem; margin-bottom: 8px;
        }
        .pc-price small { color: #94a3b8; font-weight: 600; font-size: 0.75rem; margin-right: 4px; }
        .pc-desc { color: #cbd5e1; font-size: 0.9rem; line-height: 1.55; margin: 0; white-space: pre-wrap; }
        .pc-cta {
          display: flex; gap: 8px; padding: 10px 14px; flex-wrap: wrap;
          border-top: 1px solid rgba(148,163,184,0.08);
        }
        .pc-btn {
          flex: 1; min-width: 130px; padding: 11px 12px; border-radius: 12px; border: 0;
          font-weight: 700; cursor: pointer; font-family: inherit; font-size: 0.9rem;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        }
        .pc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pc-btn.primary {
          background: linear-gradient(180deg, #7c3aed, #4c1d95); color: #fff;
          box-shadow: 0 4px 14px rgba(124,58,237,0.35);
        }
        .pc-btn.secondary {
          background: rgba(20,184,166,0.18); color: #5eead4;
          border: 1px solid rgba(20,184,166,0.35);
        }
        .pc-btn.tertiary {
          background: rgba(59,130,246,0.18); color: #93c5fd;
          border: 1px solid rgba(59,130,246,0.35);
        }
        .pc-footer {
          padding: 8px 12px 12px;
          border-top: 1px solid rgba(148,163,184,0.08);
        }
        .pc-actions-row {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .pc-act {
          position: relative;
          flex: 1; min-width: 0;
          background: transparent; color: #cbd5e1;
          border: 1px solid rgba(148,163,184,0.14); border-radius: 10px;
          padding: 8px 6px; font-size: 0.82rem; cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        }
        .pc-act em { font-style: normal; color: #a78bfa; font-weight: 700; margin-right: 2px; }
        .pc-act.liked { background: rgba(239,68,68,0.14); color: #fca5a5; border-color: rgba(239,68,68,0.28); }
        .pc-act.saved { background: rgba(139,92,246,0.14); color: #c4b5fd; border-color: rgba(139,92,246,0.28); }
        .pc-reactions-pop {
          position: absolute; bottom: calc(100% + 6px); right: 50%; transform: translateX(50%);
          background: rgba(15,23,42,0.96); border: 1px solid rgba(148,163,184,0.2);
          border-radius: 999px; padding: 5px 8px; display: flex; gap: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 5;
        }
        .pc-reactions-pop button {
          background: transparent; border: 0; font-size: 1.15rem; cursor: pointer; padding: 2px 4px;
        }
        .pc-reactions-summary {
          display: flex; gap: 8px; padding-top: 6px; color: #94a3b8; font-size: 0.78rem;
        }
      `}</style>
    </article>
  );
}

/* --------------------- Composer --------------------- */
function ProductComposer({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '', price: '', currency: 'USD', address: '', description: '', image: '',
  });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد 5MB).');
      return;
    }
    try {
      setBusy(true);
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!form.name.trim()) { alert('اسم المنتج مطلوب.'); return; }
    if (!form.price || Number(form.price) <= 0) { alert('أدخل سعراً صحيحاً.'); return; }
    if (!form.address.trim()) { alert('العنوان مطلوب.'); return; }
    onSubmit({
      name: form.name.trim(),
      price: Number(form.price),
      currency: form.currency,
      address: form.address.trim(),
      description: form.description.trim(),
      image: form.image,
    });
  };

  return (
    <ModalShell title="إضافة إعلان" onClose={onClose}>
      <label className="ml-lbl">اسم المنتج
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: هاتف آيفون 15" />
      </label>
      <div className="ml-row">
        <label className="ml-lbl">السعر
          <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
        </label>
        <label className="ml-lbl">العملة
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option>USD</option><option>SAR</option><option>YER</option><option>EGP</option><option>AED</option>
          </select>
        </label>
      </div>
      <label className="ml-lbl">العنوان
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="المدينة - المنطقة" />
      </label>
      <label className="ml-lbl">الوصف
        <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="مواصفات المنتج، الحالة، طرق الدفع..." />
      </label>
      <label className="ml-lbl">صورة المنتج
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} />
      </label>
      {form.image && (
        <div className="ml-preview">
          <img src={form.image} alt="preview" />
          <button type="button" onClick={() => setForm({ ...form, image: '' })}>إزالة</button>
        </div>
      )}
      <div className="ml-actions">
        <button type="button" className="ml-btn cancel" onClick={onClose}>إلغاء</button>
        <button type="button" className="ml-btn primary" onClick={submit} disabled={busy}>
          {busy ? 'جاري المعالجة…' : 'نشر الإعلان'}
        </button>
      </div>
    </ModalShell>
  );
}

/* --------------------- Order Modal (buyer) --------------------- */
function OrderModal({ product, onClose, onSubmit }) {
  const [form, setForm] = useState({ buyerName: '', contact: '', message: '', quantity: 1 });
  return (
    <ModalShell title={`إرسال طلب — ${product.name}`} onClose={onClose}>
      <div className="ml-info">💰 السعر: {product.price} {product.currency} — 📍 {product.address}</div>
      <div className="ml-info" style={{ background: 'rgba(124,58,237,0.14)', color: '#c4b5fd', borderColor: 'rgba(167,139,250,0.32)' }}>
        سيصل طلبك كرسالة خاصة إلى صاحب المنتج، وستُفتح دردشتك معه تلقائياً.
      </div>
      <label className="ml-lbl">اسمك
        <input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
      </label>
      <label className="ml-lbl">رقم الاتصال / واتساب
        <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
      </label>
      <label className="ml-lbl">الكمية
        <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 1 })} />
      </label>
      <label className="ml-lbl">رسالة للبائع
        <textarea rows="3" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="مثال: أرغب باستلامه اليوم" />
      </label>
      <div className="ml-actions">
        <button type="button" className="ml-btn cancel" onClick={onClose}>إلغاء</button>
        <button
          type="button" className="ml-btn primary"
          onClick={() => {
            if (!form.buyerName.trim() || !form.contact.trim()) {
              alert('الاسم ورقم الاتصال مطلوبان.');
              return;
            }
            onSubmit(form);
          }}
        >📦 إرسال الطلب</button>
      </div>
    </ModalShell>
  );
}

/* --------------------- Orders Panel (seller) --------------------- */
function OrdersPanel({ product, orders, me, onClose, onReply, onStatus, onOpenBuyerChat }) {
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');

  return (
    <ModalShell title={`الطلبات — ${product.name}`} onClose={onClose}>
      {orders.length === 0 && <div className="ml-empty">لا توجد طلبات بعد.</div>}
      {orders.map((o) => (
        <div key={o.id} className="ml-order">
          <div className="ml-order-head">
            <strong>{o.buyerName || o.buyer}</strong>
            <span className={`ml-status ${o.status}`}>{
              o.status === 'accepted' ? 'مقبول' :
              o.status === 'rejected' ? 'مرفوض' :
              o.status === 'delivered' ? 'مسلَّم' : 'قيد المراجعة'
            }</span>
          </div>
          <div className="ml-order-meta">
            <span>📞 {o.contact}</span>
            <span>× {o.quantity}</span>
            <span>{timeAgo(o.createdAt)}</span>
          </div>
          {o.message && <p className="ml-order-msg">{o.message}</p>}
          {(o.replies || []).map((r, i) => (
            <div key={i} className="ml-reply"><strong>{r.author}:</strong> {r.message}</div>
          ))}
          {product.seller === me && (
            <>
              <div className="ml-order-actions">
                <button type="button" onClick={() => onStatus(o.id, 'accepted')}>✅ قبول</button>
                <button type="button" onClick={() => onStatus(o.id, 'delivered')}>📦 تسليم</button>
                <button type="button" onClick={() => onStatus(o.id, 'rejected')}>✖ رفض</button>
                <button type="button" onClick={() => onOpenBuyerChat && onOpenBuyerChat(o.buyer)}>💬 فتح المحادثة</button>
              </div>
              <div className="ml-reply-row">
                {replyFor === o.id ? (
                  <>
                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="ردّك للمشتري…" />
                    <button type="button" onClick={() => { if (replyText.trim()) { onReply(o.id, replyText.trim()); setReplyText(''); setReplyFor(null); } }}>إرسال</button>
                  </>
                ) : (
                  <button type="button" className="ml-reply-btn" onClick={() => setReplyFor(o.id)}>💬 ردّ سريع</button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </ModalShell>
  );
}

/* --------------------- Modal Shell --------------------- */
function ModalShell({ title, children, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div className="ml-layer" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="ml-panel" role="dialog" aria-modal="true">
        <header className="ml-head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>
        <div className="ml-body">{children}</div>
      </div>
      <style>{`
        .ml-layer {
          position: fixed; inset: 0; z-index: 2300;
          background: rgba(2,6,23,0.72); backdrop-filter: blur(4px);
          display: grid; place-items: center; padding: 12px;
          font-family: "Noto Sans Arabic","Cairo",system-ui,sans-serif;
        }
        .ml-panel {
          width: min(560px, 100%); max-height: 92vh;
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,10,22,0.99));
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 18px; display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.55);
        }
        .ml-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,0.12);
        }
        .ml-head h3 { margin: 0; color: #f8fafc; font-size: 1rem; }
        .ml-head button {
          background: rgba(30,41,59,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.16);
          width: 34px; height: 34px; border-radius: 10px;
          font-size: 1.2rem; cursor: pointer;
        }
        .ml-body {
          padding: 14px 16px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ml-lbl {
          display: flex; flex-direction: column; gap: 5px;
          color: #cbd5e1; font-size: 0.86rem; font-weight: 600;
        }
        .ml-lbl input, .ml-lbl textarea, .ml-lbl select {
          background: rgba(2,6,23,0.7); color: #f1f5f9;
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 10px; padding: 10px 12px; font: inherit;
          resize: vertical;
        }
        .ml-row { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }
        .ml-preview { display: flex; align-items: center; gap: 10px; }
        .ml-preview img { max-width: 120px; max-height: 120px; border-radius: 10px; object-fit: cover; }
        .ml-preview button {
          background: rgba(239,68,68,0.18); color: #fecaca;
          border: 1px solid rgba(239,68,68,0.3); border-radius: 8px;
          padding: 6px 12px; cursor: pointer;
        }
        .ml-info {
          background: rgba(20,184,166,0.12); color: #99f6e4;
          border: 1px solid rgba(20,184,166,0.25);
          border-radius: 10px; padding: 8px 12px; font-size: 0.85rem;
        }
        .ml-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
        .ml-btn { padding: 10px 18px; border-radius: 10px; border: 0; font-weight: 700; cursor: pointer; font-family: inherit; }
        .ml-btn.primary { background: linear-gradient(180deg, #7c3aed, #4c1d95); color: #fff; }
        .ml-btn.cancel { background: rgba(30,41,59,0.7); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.18); }
        .ml-empty { text-align: center; color: #94a3b8; padding: 14px; }
        .ml-reply {
          margin-top: 6px; padding: 6px 10px; background: rgba(124,58,237,0.14);
          border-right: 3px solid rgba(167,139,250,0.5); border-radius: 8px;
          color: #ddd6fe; font-size: 0.85rem;
        }
        .ml-reply-row { display: flex; gap: 6px; margin-top: 6px; }
        .ml-reply-row input {
          flex: 1; background: rgba(2,6,23,0.7); color: #f1f5f9;
          border: 1px solid rgba(148,163,184,0.18); border-radius: 8px; padding: 6px 10px; font: inherit;
        }
        .ml-reply-row button {
          background: rgba(124,58,237,0.35); color: #fff; border: 0;
          border-radius: 8px; padding: 6px 12px; cursor: pointer;
        }
        .ml-reply-btn {
          background: transparent; color: #a78bfa; border: 1px solid rgba(167,139,250,0.3);
          border-radius: 8px; padding: 4px 10px; cursor: pointer; font-size: 0.82rem;
        }
        .ml-order {
          background: rgba(15,23,42,0.75); border: 1px solid rgba(148,163,184,0.14);
          border-radius: 12px; padding: 10px 12px; margin-bottom: 8px;
        }
        .ml-order-head { display: flex; justify-content: space-between; align-items: center; }
        .ml-order-head strong { color: #f8fafc; }
        .ml-status {
          font-size: 0.72rem; padding: 3px 9px; border-radius: 999px; font-weight: 700;
        }
        .ml-status.pending { background: rgba(234,179,8,0.2); color: #fde68a; }
        .ml-status.accepted { background: rgba(34,197,94,0.2); color: #86efac; }
        .ml-status.rejected { background: rgba(239,68,68,0.2); color: #fca5a5; }
        .ml-status.delivered { background: rgba(59,130,246,0.2); color: #93c5fd; }
        .ml-order-meta {
          display: flex; gap: 12px; flex-wrap: wrap;
          color: #94a3b8; font-size: 0.78rem; margin-top: 6px;
        }
        .ml-order-msg { color: #e2e8f0; font-size: 0.9rem; margin: 8px 0 4px; }
        .ml-order-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .ml-order-actions button {
          background: rgba(30,41,59,0.7); color: #e2e8f0;
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 8px; padding: 6px 10px; font-size: 0.82rem; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
