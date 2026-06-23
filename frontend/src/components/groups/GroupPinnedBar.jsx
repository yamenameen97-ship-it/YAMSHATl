import React, { useEffect, useState, useCallback } from 'react';
import { listPinnedMessages, pinGroupMessage } from '../../api/groups.js';

/**
 * GroupPinnedBar — شريط الرسائل المثبّتة
 * يظهر أعلى دردشة المجموعة. ينقر عليه لفتح/طيّ قائمة كاملة.
 * onJump(messageId): callback للتمرير إلى الرسالة في الدردشة.
 */
const GroupPinnedBar = ({ groupId, canManage = false, onJump = () => {} }) => {
  const [pinned, setPinned] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPinned = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const res = await listPinnedMessages(groupId);
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
      setPinned(list);
    } catch {
      setPinned([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchPinned(); }, [fetchPinned]);

  const handleUnpin = async (msgId, e) => {
    e.stopPropagation();
    try {
      await pinGroupMessage(groupId, msgId, false);
      setPinned((prev) => prev.filter((p) => p.id !== msgId));
    } catch { /* ignore */ }
  };

  if (loading || pinned.length === 0) return null;

  const first = pinned[0];
  const preview = String(first?.content || first?.text || first?.body || '').slice(0, 80);

  return (
    <div
      className="yam-pinned-bar yamg-pinned-bar"
      onClick={() => setOpen((v) => !v)}
      role="button"
      aria-expanded={open}
    >
      <span className="ic">📌</span>
      <span className="body">{preview || 'رسالة مثبّتة'}</span>
      {pinned.length > 1 && <span className="count">{pinned.length}</span>}
      <span style={{ fontSize: 12, color: '#fde68a' }}>{open ? '▲' : '▼'}</span>

      {open && (
        <div className="yamg-pinned-list" onClick={(e) => e.stopPropagation()}>
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
                    style={{
                      marginInlineStart: 8,
                      background: 'transparent',
                      color: '#fca5a5',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 11,
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
