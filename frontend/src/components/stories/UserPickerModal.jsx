import { useEffect, useMemo, useState } from 'react';
import { getUsers } from '../../api/users.js';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * UserPickerModal — v87.11
 * نافذة اختيار مستخدم لإضافته إلى قائمة (المقربون / إخفاء الستوري).
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - excludedUsernames: string[]  → لا تظهر في القائمة (مثلاً: أعضاء فعلاً)
 *  - onPick: (user) => Promise<void>  → عند الاختيار
 *  - onClose: () => void
 */
export default function UserPickerModal({ open, title, excludedUsernames = [], onPick, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [busyUser, setBusyUser] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getUsers({ limit: 100 });
        if (cancelled) return;
        const arr = Array.isArray(res?.data) ? res.data : [];
        setUsers(arr);
      } catch (e) {
        if (!cancelled) setError('تعذّر تحميل قائمة المستخدمين');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const excluded = useMemo(() => new Set(excludedUsernames.map((u) => String(u || '').toLowerCase())), [excludedUsernames]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users
      .filter((u) => u && u.username && !excluded.has(String(u.username).toLowerCase()))
      .filter((u) => !needle
        || String(u.username || '').toLowerCase().includes(needle)
        || String(u.fullName || u.full_name || '').toLowerCase().includes(needle));
  }, [users, q, excluded]);

  if (!open) return null;

  const handlePick = async (user) => {
    if (!user?.username || busyUser) return;
    setBusyUser(user.username);
    try {
      await onPick(user);
    } catch (e) {
      // يترك للمُستدعي التعامل مع الرسائل
    } finally {
      setBusyUser('');
    }
  };

  return (
    <div className="upm-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="upm-card" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="upm-head">
          <h3>{title || 'اختيار مستخدم'}</h3>
          <button type="button" className="upm-close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>
        <div className="upm-search">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو اسم المستخدم…"
            autoFocus
          />
        </div>
        <div className="upm-body">
          {loading ? (
            <div className="upm-empty">جارٍ التحميل…</div>
          ) : error ? (
            <div className="upm-empty upm-error">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="upm-empty">لا توجد نتائج مطابقة.</div>
          ) : (
            filtered.map((u) => (
              <div key={u.username} className="upm-row">
                <div className="upm-user">
                  <img
                    src={resolveMediaUrl(u.avatar || u.avatar_url || '') || '/default-avatar.png'}
                    alt=""
                    onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                  />
                  <div className="upm-user-info">
                    <div className="upm-name">{u.fullName || u.full_name || u.username}</div>
                    <div className="upm-username">@{u.username}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="upm-add"
                  onClick={() => handlePick(u)}
                  disabled={busyUser === u.username}
                >
                  {busyUser === u.username ? '…' : 'إضافة'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        .upm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index: 9999; padding: 12px; }
        .upm-card { width: min(520px, 100%); max-height: 82vh; display:flex; flex-direction:column; background: var(--surface, #1a1c22); color: var(--text, #e7e9ee); border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,0.5); overflow: hidden; }
        .upm-head { display:flex; align-items:center; justify-content:space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .upm-head h3 { font-size: 15px; margin: 0; }
        .upm-close { background: transparent; border: 0; color: inherit; font-size: 22px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
        .upm-close:hover { background: rgba(255,255,255,0.08); }
        .upm-search { padding: 10px 12px; }
        .upm-search input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; font-size: 13px; }
        .upm-body { flex: 1 1 auto; overflow-y: auto; padding: 4px 10px 12px; }
        .upm-row { display:flex; align-items:center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; }
        .upm-row:hover { background: rgba(255,255,255,0.04); }
        .upm-user { display:flex; align-items:center; gap: 10px; min-width: 0; }
        .upm-user img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .upm-user-info { min-width: 0; }
        .upm-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .upm-username { font-size: 12px; opacity: 0.7; }
        .upm-add { padding: 6px 14px; border-radius: 8px; border: 0; background: linear-gradient(135deg, #4f9cff, #6b7cff); color: #fff; font-weight: 600; cursor: pointer; font-size: 12px; }
        .upm-add:disabled { opacity: 0.6; cursor: default; }
        .upm-empty { padding: 30px 20px; text-align: center; opacity: 0.7; font-size: 13px; }
        .upm-empty.upm-error { color: #ff8a8a; }
      `}</style>
    </div>
  );
}
