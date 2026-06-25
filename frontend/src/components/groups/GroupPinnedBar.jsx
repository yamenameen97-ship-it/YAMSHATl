import React, { useEffect, useState, useCallback, useRef } from 'react';
import { listPinnedMessages, pinGroupMessage } from '../../api/groups.js';

/**
 * GroupPinnedBar — شريط الرسائل المثبّتة
 * يظهر أعلى دردشة المجموعة. ينقر عليه لفتح/طيّ قائمة كاملة.
 * onJump(messageId): callback للتمرير إلى الرسالة في الدردشة.
 *
 * ✅ v59.13.11 FIX #2:
 *   - حماية setState بعد unmount في fetchPinned (كانت تستدعي
 *     setPinned/setLoading بعد await بدون أي فحص mount).
 *   - تأكيد قبل إلغاء التثبيت (window.confirm) لتفادي الفقد العَرَضي
 *     لرسالة مثبّتة بنقرة خطأ من المشرف.
 *   - dir="rtl" + Noto Sans Arabic في الحاوية لضمان عرض صحيح.
 */
const GroupPinnedBar = ({ groupId, canManage = false, onJump = () => {} }) => {
  const [pinned, setPinned] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ v59.13.11 FIX #2: حماية mount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchPinned = useCallback(async () => {
    if (!groupId) return;
    try {
      if (isMountedRef.current) setLoading(true);
      const res = await listPinnedMessages(groupId);
      if (!isMountedRef.current) return;
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setPinned(list);
    } catch {
      if (isMountedRef.current) setPinned([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchPinned(); }, [fetchPinned]);

  const handleUnpin = async (msgId, e) => {
    e.stopPropagation();
    // ✅ v59.13.11 FIX #2: تأكيد قبل إلغاء التثبيت
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm('هل أنت متأكد من إلغاء تثبيت هذه الرسالة؟');
      if (!ok) return;
    }
    try {
      await pinGroupMessage(groupId, msgId, false);
      if (!isMountedRef.current) return;
      setPinned((prev) => prev.filter((p) => p.id !== msgId));
    } catch { /* ignore */ }
  };

  if (loading || pinned.length === 0) return null;

  const first = pinned[0];
  const preview = String(first?.content || first?.text || first?.body || '').slice(0, 80);

  // ✅ v59.13.13 FIX #4: دعم لوحة المفاتيح (Enter/Space) + tabIndex لتمكين التركيز
  //                       الخلل السابق: العنصر role="button" لكن بلا onKeyDown ولا tabIndex
  //                       → مستخدمو اللوحة/قارئو الشاشة لا يستطيعون فتح قائمة الرسائل المثبّتة.
  const handleBarKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
    } else if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{ fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif' }}
      className="yam-pinned-bar yamg-pinned-bar"
      onClick={() => setOpen((v) => !v)}
      onKeyDown={handleBarKey}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`رسائل مثبّتة (${pinned.length})`}
    >
      <span className="ic">📌</span>
      <span className="body">{preview || 'رسالة مثبّتة'}</span>
      {pinned.length > 1 && <span className="count">{pinned.length}</span>}
      <span style={{ fontSize: 12, color: '#fde68a' }}>{open ? '▲' : '▼'}</span>

      {open && (
        <div className="yamg-pinned-list" dir="rtl" onClick={(e) => e.stopPropagation()}>
          {pinned.map((p) => (
            <div
              key={p.id}
              className="yamg-pinned-item"
              onClick={() => { onJump(p.id); setOpen(false); }}
            >
              <div className="pin-text">{String(p.content || p.text || p.body || '').slice(0, 140)}</div>
              <div className="pin-meta">
                {p.sender_name || p.author || 'مستخدم'} ·{' '}
                {p.timestamp ? new Date(p.timestamp).toLocaleString('ar-EG') : ''}
                {canManage && (
                  <button
                    onClick={(e) => handleUnpin(p.id, e)}
                    aria-label="إلغاء تثبيت الرسالة"
                    style={{
                      marginInlineStart: 8,
                      background: 'transparent',
                      color: '#fca5a5',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'inherit',
                    }}
                  >إلغاء التثبيت</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupPinnedBar;
