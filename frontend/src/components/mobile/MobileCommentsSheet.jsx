import { memo, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addComment, getComments, likeComment } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

/**
 * MobileCommentsSheet — bottom sheet لعرض/إضافة التعليقات على منشور.
 * ✅ v88.64 FIX: إصلاح شامل لأزرار التفاعل على التعليقات
 *  - زر إعجاب (❤️) مع عرض عدد الإعجابات
 *  - زر رد: عند الضغط عليه يفتح فقاعة الردود السابقة (إن وجدت)
 *    مع منطقة كتابة الرد وزر إرسال
 *  - بعد إرسال الرد يرجع لقائمة التعليقات ويحدّث عدد الردود
 */
function MobileCommentsSheet({ open, postId, onClose }) {
  // v88.64: هيكل تعليق = { ...c, replies: [...], reply_count, likes_count, is_liked }
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  // v88.64: id التعليق الذي فُتِح على "وضع الرد" — عند الضغط على زر رد يفتح لوحة الردود.
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replySending, setReplySending] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  // ─────────────────────────────────────────────────────────────
  // v88.64: تحويل نتائج الـ backend إلى قائمة جذور مع مصفوفة ردود
  // (بدل تسطيح كل شيء) حتى يظهر عدد الردود وفقاعتها لكل تعليق.
  // ─────────────────────────────────────────────────────────────
  const normalizeComments = useCallback((data) => {
    let raw = [];
    if (Array.isArray(data)) raw = data;
    else if (Array.isArray(data?.items)) raw = data.items;
    else if (Array.isArray(data?.comments)) raw = data.comments;
    else if (Array.isArray(data?.results)) raw = data.results;
    else if (Array.isArray(data?.data)) raw = data.data;
    else if (Array.isArray(data?.data?.items)) raw = data.data.items;

    // إذا كانت شجرة بالفعل — نستخدمها. إذا كانت مسطحة نبني الشجرة من parent_id.
    const hasNestedReplies = raw.some((n) => Array.isArray(n?.replies) && n.replies.length);
    if (hasNestedReplies) {
      return raw.map((n) => ({
        ...n,
        replies: Array.isArray(n.replies) ? n.replies : [],
        reply_count: Number(n.reply_count ?? (Array.isArray(n.replies) ? n.replies.length : 0)),
        likes_count: Number(n.likes_count ?? n.like_count ?? 0),
        is_liked: Boolean(n.is_liked ?? n.liked_by_me),
      }));
    }

    // بناء شجرة من مصفوفة مسطحة
    const byId = new Map();
    const roots = [];
    raw.forEach((n) => {
      if (!n || typeof n !== 'object' || n.id == null) return;
      byId.set(n.id, {
        ...n,
        replies: [],
        reply_count: 0,
        likes_count: Number(n.likes_count ?? n.like_count ?? 0),
        is_liked: Boolean(n.is_liked ?? n.liked_by_me),
      });
    });
    byId.forEach((node) => {
      const pid = node.parent_id;
      if (pid && byId.has(pid)) {
        byId.get(pid).replies.push(node);
      } else {
        roots.push(node);
      }
    });
    byId.forEach((node) => { node.reply_count = node.replies.length; });
    return roots;
  }, []);

  const refetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      const res = await getComments(postId);
      setComments(normalizeComments(res?.data));
    } catch (err) {
      const status = err?.response?.status;
      if (status && status !== 500) {
        console.warn('Failed to reload comments', err?.message || err);
      }
    }
  }, [postId, normalizeComments]);

  useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setLoading(true);
    getComments(postId)
      .then((res) => {
        if (cancelled) return;
        setComments(normalizeComments(res?.data));
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status && status !== 500) {
          console.warn('Failed to load comments', err?.message || err);
        }
        if (!cancelled) setComments([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, postId, normalizeComments]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-ym-sheet', 'open');

    const updateKbInset = () => {
      try {
        const vv = window.visualViewport;
        if (!vv) { document.documentElement.style.setProperty('--ym-kb-inset', '0px'); return; }
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty('--ym-kb-inset', `${Math.round(kb)}px`);
      } catch { /* ignore */ }
    };
    updateKbInset();
    window.visualViewport?.addEventListener('resize', updateKbInset);
    window.visualViewport?.addEventListener('scroll', updateKbInset);

    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute('data-ym-sheet');
      window.visualViewport?.removeEventListener('resize', updateKbInset);
      window.visualViewport?.removeEventListener('scroll', updateKbInset);
      document.documentElement.style.setProperty('--ym-kb-inset', '0px');
    };
  }, [open]);

  // ─────────────────────────────────────────────────────────────
  // v88.64: إرسال تعليق رئيسي
  // ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      await addComment(postId, content);
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      pushToast?.({ type: 'success', title: 'تمت إضافة التعليق' });
      await refetchComments();
    } catch (err) {
      console.error('Add comment failed', err);
      pushToast?.({ type: 'error', title: 'تعذر إضافة التعليق' });
    } finally {
      setSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // v88.64: زر إعجاب — تحديث تفاؤلي فوري ثم تزامن مع الخادم
  // ─────────────────────────────────────────────────────────────
  const handleLike = async (commentId) => {
    if (!commentId) return;
    // تحديث تفاؤلي
    setComments((prev) => prev.map((c) => {
      if (c.id === commentId) {
        const nowLiked = !c.is_liked;
        return {
          ...c,
          is_liked: nowLiked,
          likes_count: Math.max(0, Number(c.likes_count || 0) + (nowLiked ? 1 : -1)),
        };
      }
      if (Array.isArray(c.replies) && c.replies.length) {
        return {
          ...c,
          replies: c.replies.map((r) => {
            if (r.id !== commentId) return r;
            const nowLiked = !r.is_liked;
            return {
              ...r,
              is_liked: nowLiked,
              likes_count: Math.max(0, Number(r.likes_count || 0) + (nowLiked ? 1 : -1)),
            };
          }),
        };
      }
      return c;
    }));

    try {
      await likeComment(commentId);
    } catch (err) {
      console.warn('like comment failed', err?.message || err);
      pushToast?.({ type: 'error', title: 'تعذر تسجيل الإعجاب' });
      // إعادة الجلب لتصحيح الحالة
      await refetchComments();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // v88.64: فتح/إغلاق وضع الرد
  // ─────────────────────────────────────────────────────────────
  const openReply = (commentId) => {
    setActiveReplyId(commentId);
    setReplyDraft('');
  };
  const closeReply = () => {
    setActiveReplyId(null);
    setReplyDraft('');
  };

  // ─────────────────────────────────────────────────────────────
  // v88.64: إرسال الرد ثم الرجوع لقائمة التعليقات مع تحديث عدد الردود
  // ─────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    const content = replyDraft.trim();
    if (!content || !activeReplyId || !postId) return;
    setReplySending(true);
    try {
      await addComment(postId, content, activeReplyId);
      pushToast?.({ type: 'success', title: 'تم إرسال الرد' });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      // نُغلق وضع الرد فوراً كي "يرجع لقائمة التعليقات" كما طلب المستخدم
      closeReply();
      // إعادة الجلب لعرض العدد الجديد للردود
      await refetchComments();
    } catch (err) {
      console.error('Reply failed', err);
      pushToast?.({ type: 'error', title: 'تعذر إرسال الرد' });
    } finally {
      setReplySending(false);
    }
  };

  if (!open) return null;

  // ─────────────────────────────────────────────────────────────
  // v88.64: صف تعليق واحد (يستخدم للتعليق الرئيسي والرد)
  // ─────────────────────────────────────────────────────────────
  const renderCommentRow = (c, isReply = false) => {
    const author = c.display_name || c.full_name || c.author_name || c.username || c.user || 'مستخدم';
    const avatar = resolveMediaUrl(c.user_avatar || c.avatar || c.author_avatar || '');
    const txt = c.content || c.text || '';
    const likes = Number(c.likes_count || 0);
    const isLiked = Boolean(c.is_liked);
    const replyCount = Number(c.reply_count || (Array.isArray(c.replies) ? c.replies.length : 0));
    const isActive = activeReplyId === c.id;

    return (
      <li key={c.id || `c-${Math.random()}`} className={`ym-comment-item ${isReply ? 'is-reply' : ''}`}>
        <span className="ym-comment-avatar">
          {avatar ? <img src={avatar} alt="" loading="lazy" /> : <span className="ph">{String(author).charAt(0)}</span>}
        </span>
        <div className="ym-comment-body">
          <div className="ym-comment-bubble">
            <div className="ym-comment-author">{author}</div>
            <div className="ym-comment-text" dir="auto">{txt}</div>
          </div>

          {/* v88.64: شريط أزرار التفاعل — إعجاب + عدد، رد + عدد الردود */}
          {!isReply ? (
            <div className="ym-comment-actions">
              <button
                type="button"
                className={`ym-c-action-btn ${isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(c.id)}
                aria-label="إعجاب"
              >
                <span className="ym-c-action-icon">{isLiked ? '❤️' : '🤍'}</span>
                <span className="ym-c-action-label">إعجاب</span>
                {likes > 0 ? <span className="ym-c-action-count">{likes}</span> : null}
              </button>

              <button
                type="button"
                className={`ym-c-action-btn ${isActive ? 'active' : ''}`}
                onClick={() => (isActive ? closeReply() : openReply(c.id))}
                aria-label="رد"
              >
                <span className="ym-c-action-icon">💬</span>
                <span className="ym-c-action-label">رد</span>
                {replyCount > 0 ? <span className="ym-c-action-count">{replyCount}</span> : null}
              </button>
            </div>
          ) : (
            /* للرد: زر إعجاب مبسّط فقط */
            <div className="ym-comment-actions is-reply-actions">
              <button
                type="button"
                className={`ym-c-action-btn small ${isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(c.id)}
                aria-label="إعجاب"
              >
                <span className="ym-c-action-icon">{isLiked ? '❤️' : '🤍'}</span>
                {likes > 0 ? <span className="ym-c-action-count">{likes}</span> : null}
              </button>
            </div>
          )}

          {/* v88.64: عند فتح "وضع الرد" — نظهر فقاعة الردود السابقة إن وجدت + منطقة كتابة الرد + زر إرسال */}
          {isActive && !isReply ? (
            <div className="ym-reply-panel">
              {Array.isArray(c.replies) && c.replies.length > 0 ? (
                <ul className="ym-reply-list">
                  {c.replies.map((r) => renderCommentRow(r, true))}
                </ul>
              ) : (
                <div className="ym-reply-empty">لا توجد ردود بعد. كن أول من يرد!</div>
              )}

              <div className="ym-reply-composer">
                <input
                  type="text"
                  placeholder={`الرد على ${author}...`}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  disabled={replySending}
                  dir="auto"
                  className="ym-reply-input"
                  autoFocus
                />
                <button
                  type="button"
                  className="ym-reply-send"
                  onClick={handleSendReply}
                  disabled={!replyDraft.trim() || replySending}
                  aria-label="إرسال الرد"
                >
                  {replySending ? '...' : (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M3 12 L21 4 L17 21 L13 13 Z" fill="currentColor" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="ym-reply-cancel"
                  onClick={closeReply}
                  aria-label="إلغاء"
                  disabled={replySending}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <div className="ym-sheet-overlay" data-yam-comments-sheet="true" role="dialog" aria-modal="true" aria-label="التعليقات" dir="rtl" onClick={onClose}>
      <style>{`
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483000 !important;
          background: rgba(0,0,0,0.55) !important;
          display: flex !important;
          align-items: flex-end !important;
          justify-content: center !important;
          padding: 0 0 calc(70px + env(safe-area-inset-bottom, 0px) + var(--ym-kb-inset, 0px)) !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          pointer-events: auto !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        @supports (padding: max(0px)) {
          html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
            padding-bottom: max(
              calc(70px + env(safe-area-inset-bottom, 0px)),
              calc(env(safe-area-inset-bottom, 0px) + var(--ym-kb-inset, 0px))
            ) !important;
          }
        }
        @media (min-width: 900px) {
          html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--ym-kb-inset, 0px)) !important;
          }
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet {
          position: relative !important;
          width: 100% !important;
          max-width: 640px !important;
          height: min(78dvh, 720px) !important;
          max-height: 78dvh !important;
          min-height: 320px !important;
          margin: 0 !important;
          background: #0f1420 !important;
          border-radius: 22px 22px 0 0 !important;
          border-top: 1px solid rgba(139,92,246,0.35) !important;
          box-shadow: 0 -20px 60px rgba(0,0,0,0.55) !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          transform: none !important;
          pointer-events: auto !important;
          visibility: visible !important;
          opacity: 1 !important;
          inset: auto !important;
          top: auto !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-handle {
          width: 44px !important;
          height: 4px !important;
          background: rgba(255,255,255,0.28) !important;
          border-radius: 2px !important;
          margin: 8px auto 0 !important;
          flex-shrink: 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head {
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px 12px !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head h3 {
          margin: 0 !important;
          color: #fff !important;
          font-size: 16px !important;
          font-weight: 700 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-close {
          background: transparent !important;
          border: 0 !important;
          color: #fff !important;
          cursor: pointer !important;
          padding: 6px !important;
          border-radius: 8px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain !important;
          padding: 12px 16px !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-composer {
          position: relative !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          top: auto !important;
          inset: auto !important;
          transform: none !important;
          margin: 0 !important;
          flex-shrink: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 12px 14px !important;
          background: rgba(15, 20, 32, 0.98) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          z-index: 5 !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-input {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          min-height: 44px !important;
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 22px !important;
          padding: 10px 16px !important;
          color: #fff !important;
          font-family: inherit !important;
          font-size: 16px !important;
          outline: 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send {
          width: 44px !important;
          height: 44px !important;
          flex-shrink: 0 !important;
          border-radius: 50% !important;
          border: 0 !important;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
          color: #fff !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          box-shadow: 0 6px 18px rgba(139,92,246,0.45) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }

        /* v88.64: قائمة تعليقات ─────────────────────────────── */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-list {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 14px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-item {
          display: flex !important;
          gap: 10px !important;
          align-items: flex-start !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-item.is-reply {
          margin-inline-start: 40px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-avatar {
          width: 36px !important;
          height: 36px !important;
          flex-shrink: 0 !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: #fff !important;
          font-weight: 700 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-avatar img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-body {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-bubble {
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 16px !important;
          padding: 8px 12px !important;
          color: #e5e7eb !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-author {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #fff !important;
          margin-bottom: 2px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-text {
          font-size: 14px !important;
          line-height: 1.6 !important;
          word-break: break-word !important;
        }

        /* v88.64: شريط أزرار التفاعل — إعجاب + رد */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-comment-actions {
          display: flex !important;
          gap: 14px !important;
          align-items: center !important;
          padding: 6px 10px 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn {
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          background: transparent !important;
          border: 0 !important;
          padding: 4px 6px !important;
          color: #9ca3af !important;
          font-size: 12.5px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          border-radius: 10px !important;
          transition: color .15s ease, background .15s ease !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn:hover {
          background: rgba(255,255,255,0.05) !important;
          color: #e5e7eb !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn.liked {
          color: #f87171 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn.active {
          color: #a78bfa !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-icon {
          font-size: 14px !important;
          line-height: 1 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-count {
          background: rgba(255,255,255,0.08) !important;
          color: inherit !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          border-radius: 999px !important;
          padding: 1px 7px !important;
          min-width: 18px !important;
          text-align: center !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn.liked .ym-c-action-count {
          background: rgba(248,113,113,0.16) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-c-action-btn.small {
          font-size: 11.5px !important;
          padding: 2px 4px !important;
        }

        /* v88.64: لوحة الرد ─────────────────────────────── */
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-panel {
          margin-top: 10px !important;
          background: rgba(139,92,246,0.06) !important;
          border: 1px solid rgba(139,92,246,0.18) !important;
          border-radius: 14px !important;
          padding: 10px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-list {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          max-height: 220px !important;
          overflow-y: auto !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-empty {
          font-size: 12.5px !important;
          color: #94a3b8 !important;
          text-align: center !important;
          padding: 6px 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-composer {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-input {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          min-height: 40px !important;
          background: rgba(255,255,255,0.06) !important;
          border: 1px solid rgba(255,255,255,0.10) !important;
          border-radius: 20px !important;
          padding: 8px 14px !important;
          color: #fff !important;
          font-family: inherit !important;
          font-size: 15px !important;
          outline: 0 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-send {
          width: 40px !important;
          height: 40px !important;
          flex-shrink: 0 !important;
          border-radius: 50% !important;
          border: 0 !important;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
          color: #fff !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          box-shadow: 0 4px 14px rgba(139,92,246,0.40) !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-send:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-reply-cancel {
          background: transparent !important;
          border: 1px solid rgba(255,255,255,0.10) !important;
          color: #cbd5e1 !important;
          padding: 6px 10px !important;
          border-radius: 999px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          flex-shrink: 0 !important;
        }

        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-empty {
          text-align: center !important;
          color: #94a3b8 !important;
          padding: 40px 12px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-empty .icon {
          font-size: 32px !important;
          margin-bottom: 6px !important;
        }

        html body[data-ym-sheet="open"] .mobile-bottom-nav,
        html body[data-ym-sheet="open"] .yam-bottom-nav,
        html body[data-ym-sheet="open"] .ym-bottomnav,
        html body[data-ym-sheet="open"] nav.bottom-nav,
        html body[data-ym-sheet="open"] [class*="BottomNav"],
        html body[data-ym-sheet="open"] [class*="bottomnav"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
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
              {comments.map((c) => renderCommentRow(c, false))}
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
