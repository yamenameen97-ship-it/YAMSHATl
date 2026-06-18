import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../../api/users.js';
import { getChatThreads } from '../../api/chat.js';

/**
 * NewChatDialog (v28)
 * -------------------
 * مودال "دردشة جديدة" يُفتح عند الضغط على زر "+" داخل صفحة الدردشة.
 * يعرض:
 *   1) الأسماء التي سبقت الدردشة معها (آخر المحادثات).
 *   2) زر "إضافة من جهات الاتصال" (Contact Picker API إن توفرت في المتصفح).
 *   3) حقل بحث عن مشترك بالاسم للدردشة معه.
 *
 * مفعّل في كل الصفحات عبر حدث window: 'yamshat:open-new-chat'.
 * dir=rtl + Noto Sans Arabic.
 */
export default function NewChatDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');

  // الاستماع للحدث العام الصادر من زر "+" في BottomNav
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('yamshat:open-new-chat', handler);
    return () => window.removeEventListener('yamshat:open-new-chat', handler);
  }, []);

  // تحميل قائمة المحادثات السابقة عند فتح المودال
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await getChatThreads();
        const list = Array.isArray(resp?.data) ? resp.data : [];
        if (!cancelled) setRecent(list.slice(0, 10));
      } catch {
        if (!cancelled) setRecent([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // البحث عن مستخدمين بالاسم
  useEffect(() => {
    if (!open) return undefined;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await getUsers({ q: query.trim(), limit: 20 });
        const list = Array.isArray(resp?.data) ? resp.data : (resp?.data?.users || []);
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setUsers([]);
    setContactsError('');
  }, []);

  const goChat = useCallback((username) => {
    if (!username) return;
    close();
    navigate(`/chat/${encodeURIComponent(username)}`);
  }, [close, navigate]);

  // إضافة جهة اتصال من ذاكرة الهاتف (Contact Picker API — Chrome Android)
  const pickFromContacts = useCallback(async () => {
    setContactsError('');
    try {
      if (!('contacts' in navigator) || !navigator.contacts?.select) {
        setContactsError('متصفحك لا يدعم اختيار جهات الاتصال. استخدم البحث بالأعلى.');
        return;
      }
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const chosen = await navigator.contacts.select(props, opts);
      if (!chosen || !chosen.length) return;
      const c = chosen[0];
      const name = Array.isArray(c.name) ? c.name[0] : (c.name || '');
      if (name) {
        setQuery(name);
      }
    } catch (err) {
      setContactsError('تعذر فتح جهات الاتصال.');
    }
  }, []);

  const filteredRecent = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((r) => String(r?.username || r?.name || '').toLowerCase().includes(q));
  }, [recent, query]);

  if (!open) return null;

  return (
    <div
      className="ynd-overlay"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="دردشة جديدة"
      onClick={close}
      style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
    >
      <div className="ynd-modal" onClick={(e) => e.stopPropagation()}>
        <header className="ynd-head">
          <strong>دردشة جديدة</strong>
          <button type="button" className="ynd-close" onClick={close} aria-label="إغلاق">✕</button>
        </header>

        <div className="ynd-body">
          <div className="ynd-search-row">
            <input
              type="search"
              className="ynd-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مشترك بالاسم..."
              aria-label="البحث عن مستخدم"
              autoFocus
            />
            <button type="button" className="ynd-contact-btn" onClick={pickFromContacts} title="إضافة من جهات الاتصال">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
              </svg>
              <span>من جهات الاتصال</span>
            </button>
          </div>
          {contactsError ? <p className="ynd-hint warn">{contactsError}</p> : null}

          {filteredRecent.length > 0 ? (
            <>
              <h4 className="ynd-section">سبق التحدث معهم</h4>
              <div className="ynd-list">
                {filteredRecent.map((r, idx) => {
                  const name = r.username || r.name || '—';
                  return (
                    <button
                      key={`recent-${name}-${idx}`}
                      type="button"
                      className="ynd-row"
                      onClick={() => goChat(name)}
                    >
                      <span className="ynd-avatar" aria-hidden="true">
                        {r.avatar ? <img src={r.avatar} alt="" /> : (name || '?').slice(0, 1)}
                      </span>
                      <span className="ynd-meta">
                        <strong>{name}</strong>
                        <small>{r.last_message ? String(r.last_message).slice(0, 40) : 'افتح المحادثة'}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          <h4 className="ynd-section">نتائج البحث</h4>
          <div className="ynd-list">
            {loading ? (
              <p className="ynd-hint">جارٍ البحث…</p>
            ) : users.length === 0 ? (
              <p className="ynd-hint">{query ? `لا توجد نتائج لـ "${query}".` : 'اكتب اسم مشترك لبدء البحث.'}</p>
            ) : (
              users.map((u) => {
                const name = u.full_name || u.name || u.username || '—';
                const handle = u.username || u.user_name || u.handle || '';
                return (
                  <button
                    key={u.id || handle || name}
                    type="button"
                    className="ynd-row"
                    onClick={() => goChat(handle || name)}
                  >
                    <span className="ynd-avatar" aria-hidden="true">
                      {u.avatar ? <img src={u.avatar} alt="" /> : (name || '?').slice(0, 1)}
                    </span>
                    <span className="ynd-meta">
                      <strong>{name}</strong>
                      {handle ? <small>@{handle}</small> : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        .ynd-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.65);
          display: grid; place-items: center;
          z-index: 9999;
          padding: 16px;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
        }
        .ynd-modal {
          width: min(460px, 100%);
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          background: #131826;
          border: 1px solid #2a2f44;
          border-radius: 18px;
          color: #fff;
          box-shadow: 0 20px 60px rgba(0,0,0,0.55);
        }
        .ynd-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid #2a2f44;
        }
        .ynd-head strong { font-size: 16px; }
        .ynd-close {
          width: 34px; height: 34px;
          border: none; background: transparent; color: #aaa;
          border-radius: 10px; cursor: pointer; font-size: 18px;
        }
        .ynd-close:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .ynd-body { padding: 14px 16px 18px; display: grid; gap: 12px; }
        .ynd-search-row { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }
        .ynd-input {
          flex: 1; min-width: 0; min-height: 44px;
          padding: 10px 12px; border-radius: 12px;
          border: 1px solid #2a2f44; background: #0e1220; color: #fff;
          font: inherit; box-sizing: border-box;
        }
        .ynd-input:focus { outline: 2px solid rgba(139,92,246,0.5); outline-offset: 1px; }
        .ynd-contact-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 12px; min-height: 44px;
          border-radius: 12px; border: 1px solid rgba(139,92,246,0.3);
          background: rgba(139,92,246,0.14); color: #d8c8ff;
          font-weight: 700; cursor: pointer; font: inherit;
        }
        .ynd-contact-btn:hover { background: rgba(139,92,246,0.24); }
        .ynd-section {
          margin: 4px 0 0; font-size: 12px; color: #8b90b7;
          font-weight: 700; letter-spacing: 0.04em;
        }
        .ynd-list { display: grid; gap: 4px; max-height: 280px; overflow-y: auto; }
        .ynd-hint {
          color: #8b90b7; text-align: center;
          font-size: 13px; padding: 14px 6px; margin: 0;
        }
        .ynd-hint.warn { color: #fca5a5; }
        .ynd-row {
          display: flex; gap: 10px; align-items: center;
          padding: 10px; border-radius: 12px;
          border: 1px solid transparent; background: transparent;
          color: #fff; cursor: pointer; text-align: start;
          font: inherit;
        }
        .ynd-row:hover { background: rgba(255,255,255,0.04); border-color: #2a2f44; }
        .ynd-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          display: grid; place-items: center; overflow: hidden;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff; font-weight: 800; flex-shrink: 0;
        }
        .ynd-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ynd-meta { display: grid; gap: 2px; min-width: 0; }
        .ynd-meta strong { font-size: 14px; }
        .ynd-meta small {
          color: #8b90b7; font-size: 12px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 280px;
        }
      `}</style>
    </div>
  );
}
