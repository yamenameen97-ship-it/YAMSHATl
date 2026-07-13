import { memo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addComment, getComments } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileCommentsSheet — bottom sheet لعرض/إضافة التعليقات على منشور.
 * يستخدم getComments + addComment الحقيقيين من backend.
 */
function MobileCommentsSheet({ open, postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setLoading(true);
    getComments(postId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        // ✅ v85.9 FIX: دعم أشكال إرجاع متعدّدة من الـ backend — مصفوفة مباشرة،
        // أو { items }، أو { comments }، أو { results }، أو { data: [...] } ملتففة مرتين.
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data?.items)) raw = data.items;
        else if (Array.isArray(data?.comments)) raw = data.comments;
        else if (Array.isArray(data?.results)) raw = data.results;
        else if (Array.isArray(data?.data)) raw = data.data;
        else if (Array.isArray(data?.data?.items)) raw = data.data.items;

        // ✅ v85.7 FIX: تسطيح شجرة التعليقات (جذور + ردود) إلى قائمة مسطحة
        // لأن الـ backend يُرجع الآن items كشجرة (داخل كل جذر replies[]).
        // ✅ v85.9 FIX: تجنّب الحلقات اللانهائية لو أرجع الباكاند مرجعاً دائرياً.
        const flat = [];
        const seen = new Set();
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const n of nodes) {
            if (!n || typeof n !== 'object') continue;
            const key = n.id ?? `${n.user_id || ''}-${n.created_at || ''}-${(n.content || n.text || '').slice(0,20)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(n);
            if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
            if (Array.isArray(n.children) && n.children.length) walk(n.children);
          }
        };
        walk(raw);
        setComments(flat);
      })
      .catch((err) => {
        // 500 من الـ backend عند غياب التعليقات => نتعامل بصمت بدون رمي خطأ في الكونسول
        const status = err?.response?.status;
        if (status && status !== 500) {
          console.warn('Failed to load comments', err?.message || err);
        }
        if (!cancelled) setComments([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // ✅ v60.8 FIX: تعيين data-attribute على body حتى يتم إخفاء BottomNav عبر CSS
    // وبالتالي تظهر منطقة كتابة التعليق بالكامل ولا تفقد خلف شريط التنقل
    document.body.setAttribute('data-ym-sheet', 'open');
    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute('data-ym-sheet');
    };
  }, [open]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      const res = await addComment(postId, content);
      const newComment = res?.data?.comment || res?.data || {
        id: `local-${Date.now()}`,
        content,
        author_name: 'أنت',
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      pushToast?.({ type: 'success', title: 'تمت إضافة التعليق' });

      // ✅ v87.8 FIX: إعادة جلب التعليقات من الخادم فور الإرسال لضمان التزامن الحقيقي.
      // إذا فشل التخزين داخل الخادم لأي سبب (مثلاً: allow_comments=false يتم تجاوزه مؤقتاً،
      // او رد 200 خاطئ)، سيظهر ذلك فوراً بدل الانتظار للمرة التالية.
      try {
        const refetch = await getComments(postId);
        const data = refetch?.data;
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data?.items)) raw = data.items;
        else if (Array.isArray(data?.comments)) raw = data.comments;
        else if (Array.isArray(data?.results)) raw = data.results;
        else if (Array.isArray(data?.data)) raw = data.data;
        const flat = [];
        const seen = new Set();
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const n of nodes) {
            if (!n || typeof n !== 'object') continue;
            const key = n.id ?? `${n.user_id || ''}-${n.created_at || ''}-${(n.content || n.text || '').slice(0,20)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(n);
            if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
            if (Array.isArray(n.children) && n.children.length) walk(n.children);
          }
        };
        walk(raw);
        if (flat.length) setComments(flat);
      } catch (refetchErr) {
        // إذا فشلت إعادة الجلب، نبقي التعليق المضاف محلياً (فعلناه أعلاه).
        console.warn('Refetch after add failed', refetchErr?.message || refetchErr);
      }
    } catch (err) {
      console.error('Add comment failed', err);
      pushToast?.({ type: 'error', title: 'تعذر إضافة التعليق' });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ym-sheet-overlay" data-yam-comments-sheet="true" role="dialog" aria-modal="true" aria-label="التعليقات" dir="rtl" onClick={onClose}>
      <style>{`
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
          align-items: flex-end !important;
          justify-content: center !important;
          padding: 0 !important;
          z-index: 1200 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet {
          width: 100% !important;
          max-width: 100% !important;
          height: min(82dvh, 760px) !important;
          max-height: min(82dvh, 760px) !important;
          margin: 0 !important;
          border-radius: 24px 24px 0 0 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          transform: none !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head {
          flex-shrink: 0 !important;
          padding-top: 10px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          padding-bottom: 12px !important;
          -webkit-overflow-scrolling: touch !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-composer {
          position: sticky !important;
          bottom: 0 !important;
          inset-inline: 0 !important;
          margin-top: auto !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
          background: rgba(9, 12, 26, 0.96) !important;
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          z-index: 2 !important;
          transform: none !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-input {
          flex: 1 1 auto !important;
          min-height: 46px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send {
          flex-shrink: 0 !important;
        }
      `}</style>
      <div className="ym-sheet" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="ym-sheet-handle" aria-hidden="true" />
        <header className="ym-sheet-head">
          <h3>التعليقات</h3>
          <button type="button" className="ym-sheet-close" onClick={onClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="ym-sheet-body">
          {loading ? (
            <div className="ym-sheet-empty">جارٍ التحميل...</div>
          ) : comments.length === 0 ? (
            <div className="ym-sheet-empty">
              <div className="icon">💬</div>
              لا توجد تعليقات بعد. كن أول من يعلّق!
            </div>
          ) : (
            <ul className="ym-comment-list">
              {comments.map((c) => {
                const author = c.author_name || c.username || c.user || 'مستخدم';
                const avatar = resolveMediaUrl(c.user_avatar || c.avatar || c.author_avatar || '');
                const txt = c.content || c.text || '';
                return (
                  <li key={c.id || `c-${Math.random()}`} className="ym-comment-item">
                    <span className="ym-comment-avatar">
                      {avatar ? <img src={avatar} alt="" loading="lazy" /> : <span className="ph">{String(author).charAt(0)}</span>}
                    </span>
                    <div className="ym-comment-body">
                      <div className="ym-comment-author">{author}</div>
                      <div className="ym-comment-text" dir="auto">{txt}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="ym-sheet-composer">
          <input
            type="text"
            placeholder="اكتب تعليقاً..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
            dir="auto"
            className="ym-sheet-input"
          />
          <button
            type="button"
            className="ym-sheet-send"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            aria-label="إرسال"
          >
            {sending ? '...' : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M3 12 L21 4 L17 21 L13 13 Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default memo(MobileCommentsSheet);
