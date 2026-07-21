import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getCurrentUsername } from '../utils/auth.js';
import { getThread, sendMessage, subscribe, buildThreadId } from '../utils/shopChatBridge.js';
import shopNotify from '../utils/shopNotify.js';

/**
 * ShopChat — v88.35
 * دردشة خاصة بالمنتج بين المشتري وصاحب المنتج فقط.
 * المسار: /shop/chat/:productId/:peer
 *
 * القواعد:
 *  • لا أحد غير هذين الطرفين يستطيع رؤية الرسائل (الرسائل مخزّنة تحت threadId
 *    ثنائي، ولا تظهر في أي علف عام).
 *  • عند الفتح تُحدَّث الرسائل مباشرةً عبر subscribe.
 *  • عند الإرسال يذهب إشعار للطرف الآخر (shopNotify.push).
 */
const STORAGE_KEY = 'yamshat_shop_v1';

function loadProduct(productId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.products) ? parsed.products : [];
    return list.find((p) => p.id === productId) || null;
  } catch {
    return null;
  }
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
}

export default function ShopChat() {
  const params = useParams();
  const navigate = useNavigate();
  const me = getCurrentUsername() || 'guest';

  // معرّف الخيط: نحن نعرف المنتج والطرف الآخر من المسار.
  // إذا كنت أنا البائع، فالطرف الآخر = المشتري، والعكس.
  const productId = params.productId;
  const peer = params.peer;

  const product = useMemo(() => loadProduct(productId), [productId]);
  const iAmSeller = product && product.seller === me;
  const buyer = iAmSeller ? peer : me;
  const seller = product ? product.seller : peer;
  const threadId = buildThreadId(productId, buyer);

  const [thread, setThread] = useState(() => getThread(threadId));
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const refresh = useCallback(() => {
    setThread(getThread(threadId));
  }, [threadId]);

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    return unsub;
  }, [refresh]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread]);

  const send = () => {
    const value = text.trim();
    if (!value || !product) return;
    sendMessage({
      product,
      buyer,
      seller,
      from: me,
      text: value,
      kind: 'text',
    });
    // إشعار للطرف الآخر
    const other = me === buyer ? seller : buyer;
    shopNotify.push({
      to: other,
      from: me,
      kind: 'inquiry',
      product,
      text: value,
      path: `/shop/chat/${product.id}/${me === buyer ? buyer : buyer}`,
    });
    setText('');
    refresh();
  };

  if (!product) {
    return (
      <MainLayout>
        <div dir="rtl" style={{ padding: 20, color: '#e2e8f0' }}>
          <p>هذا المنتج لم يعد متاحاً.</p>
          <button type="button" onClick={() => navigate('/shop')} style={{
            marginTop: 12, background: 'linear-gradient(180deg,#7c3aed,#4c1d95)', color: '#fff',
            border: 0, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 700,
          }}>← عودة للسوق</button>
        </div>
      </MainLayout>
    );
  }

  const messages = thread?.messages || [];
  const otherLabel = iAmSeller ? `المشتري: ${buyer}` : `البائع: ${seller}`;

  return (
    <MainLayout>
      <div dir="rtl" className="sc-wrap">
        <header className="sc-head">
          <button type="button" className="sc-back" onClick={() => navigate('/shop')}>←</button>
          <div className="sc-head-info">
            <strong>{product.name}</strong>
            <span>{otherLabel} • دردشة خاصة</span>
          </div>
          {product.image && (
            <img src={product.image} alt="" className="sc-thumb" />
          )}
        </header>

        <div className="sc-notice">
          🔒 هذه محادثة خاصة بينك وبين {iAmSeller ? 'المشتري' : 'صاحب المنتج'} فقط —
          لا أحد آخر يستطيع الاطلاع عليها.
        </div>

        <main className="sc-scroll" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="sc-empty">لا توجد رسائل بعد. ابدأ المحادثة.</div>
          )}
          {messages.map((m) => {
            const mine = m.from === me;
            return (
              <div key={m.id} className={`sc-msg ${mine ? 'mine' : 'theirs'} ${m.kind || ''}`}>
                {m.kind === 'order' && <div className="sc-tag">📦 طلب</div>}
                {m.kind === 'inquiry' && <div className="sc-tag">💬 استفسار</div>}
                <div className="sc-msg-text">{m.text}</div>
                <div className="sc-msg-time">{fmtTime(m.at)}</div>
              </div>
            );
          })}
        </main>

        <footer className="sc-compose">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="اكتب رسالتك…"
          />
          <button type="button" onClick={send}>إرسال</button>
        </footer>
      </div>

      <style>{`
        .sc-wrap {
          max-width: 860px; margin: 0 auto; display: flex; flex-direction: column;
          height: calc(100vh - 60px); color: #e2e8f0;
          font-family: "Noto Sans Arabic","Cairo",system-ui,sans-serif;
        }
        .sc-head {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: linear-gradient(180deg, rgba(15,23,42,0.95), rgba(8,10,22,0.98));
          border-bottom: 1px solid rgba(148,163,184,0.14);
        }
        .sc-back {
          background: rgba(30,41,59,0.7); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.18);
          width: 36px; height: 36px; border-radius: 10px; cursor: pointer; font-size: 1.1rem;
        }
        .sc-head-info { flex: 1; display: flex; flex-direction: column; }
        .sc-head-info strong { color: #f8fafc; }
        .sc-head-info span { color: #94a3b8; font-size: 0.78rem; }
        .sc-thumb {
          width: 44px; height: 44px; object-fit: cover; border-radius: 10px;
          border: 1px solid rgba(148,163,184,0.2);
        }
        .sc-notice {
          background: rgba(20,184,166,0.1); color: #99f6e4;
          border-bottom: 1px solid rgba(20,184,166,0.2);
          padding: 8px 14px; font-size: 0.82rem; text-align: center;
        }
        .sc-scroll {
          flex: 1; overflow-y: auto; padding: 14px;
          background: linear-gradient(180deg, rgba(2,6,23,0.4), rgba(2,6,23,0.7));
          display: flex; flex-direction: column; gap: 8px;
        }
        .sc-empty { text-align: center; color: #94a3b8; padding: 20px; }
        .sc-msg {
          max-width: 78%; padding: 8px 12px; border-radius: 12px;
          display: flex; flex-direction: column; gap: 3px;
          border: 1px solid transparent;
        }
        .sc-msg.mine {
          align-self: flex-start;
          background: linear-gradient(180deg, #7c3aed, #4c1d95); color: #fff;
        }
        .sc-msg.theirs {
          align-self: flex-end;
          background: rgba(30,41,59,0.85); color: #f1f5f9;
          border-color: rgba(148,163,184,0.16);
        }
        .sc-msg.order { border-color: rgba(124,58,237,0.5); }
        .sc-msg.inquiry { border-color: rgba(20,184,166,0.45); }
        .sc-tag {
          font-size: 0.72rem; opacity: 0.85; font-weight: 700;
        }
        .sc-msg-text { font-size: 0.92rem; white-space: pre-wrap; line-height: 1.5; }
        .sc-msg-time { font-size: 0.68rem; opacity: 0.75; align-self: flex-end; }
        .sc-compose {
          display: flex; gap: 8px; padding: 10px 12px;
          background: linear-gradient(180deg, rgba(8,10,22,0.98), rgba(15,23,42,0.95));
          border-top: 1px solid rgba(148,163,184,0.14);
        }
        .sc-compose input {
          flex: 1; background: rgba(2,6,23,0.7); color: #f1f5f9;
          border: 1px solid rgba(148,163,184,0.2); border-radius: 12px;
          padding: 11px 14px; font: inherit;
        }
        .sc-compose button {
          background: linear-gradient(180deg, #7c3aed, #4c1d95); color: #fff;
          border: 0; border-radius: 12px; padding: 10px 18px;
          font-weight: 700; cursor: pointer; font-family: inherit;
        }
      `}</style>
    </MainLayout>
  );
}
