import { useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '💯'];

function enrichMentions(text = '') {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('@')) return <span key={index} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part}</span>;
    if (part.startsWith('#')) return <span key={index} style={{ color: 'var(--accent)', fontWeight: 700 }}>{part}</span>;
    return part;
  });
}

function flattenComments(items = [], depth = 0, result = []) {
  items.forEach((item) => {
    result.push({ ...item, depth });
    if (Array.isArray(item?.replies) && item.replies.length) {
      flattenComments(item.replies, depth + 1, result);
    }
  });
  return result;
}

const CommentRow = ({ index, style, data }) => {
  const {
    items,
    replyState,
    editState,
    onReplyStateChange,
    onEditStateChange,
    onReplySubmit,
    onEditSubmit,
    onLike,
    onPin,
    onHide,
    onReport,
    onDelete,
    onCopy,
    onReact,
  } = data;

  const item = items[index];
  if (!item) return null;

  const replyText = replyState[item.id] || '';
  const editText = editState[item.id] ?? item.content ?? '';
  const totalReactions = Object.values(item.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const isEditing = typeof editState[item.id] === 'string';
  const isReplying = typeof replyState[item.id] === 'string';

  return (
    <div style={{ ...style, padding: '10px 8px' }}>
      <div
        className={`comment-card-shell ${item.optimistic ? 'optimistic' : ''} ${item.justArrived ? 'live' : ''} ${item.is_hidden ? 'is-hidden' : ''}`}
        style={{ marginInlineStart: `${Math.min(item.depth || 0, 5) * 18}px` }}
      >
        <div className="comment-top-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong>{item.username || item.user || 'مستخدم'}</strong>
            {item.is_pinned ? <span className="comment-state-pill pinned">📌 مثبت</span> : null}
            {item.optimistic ? <span className="comment-state-pill pending">قيد الإرسال</span> : null}
            {item.justArrived ? <span className="comment-state-pill live">الآن</span> : null}
            {item.is_hidden ? <span className="comment-state-pill muted">مخفي</span> : null}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
        </div>

        {isEditing ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <textarea value={editText} onChange={(event) => onEditStateChange(item.id, event.target.value)} rows={3} style={{ width: '100%', borderRadius: 12, padding: 10 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => onEditSubmit(item.id, editText)}>حفظ</Button>
              <Button size="small" variant="secondary" onClick={() => onEditStateChange(item.id, null)}>إلغاء</Button>
            </div>
          </div>
        ) : (
          <div style={{ lineHeight: 1.8, fontSize: 14, marginTop: 8 }}>
            {item.is_hidden ? <em>هذا التعليق مخفي.</em> : enrichMentions(item.content || item.text || item.comment || '')}
          </div>
        )}

        <div className="comment-toolbar-row" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => onReact?.(item.id, emoji)}>
                {emoji} {Number(item.reactions?.[emoji] || 0) || ''}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="comment-link-btn" onClick={() => onLike?.(item.id)}>{item.is_liked ? '💙' : '🤍'} {item.likes_count || 0}</button>
            <button type="button" className="comment-link-btn" onClick={() => onReplyStateChange(item.id, isReplying ? null : '')}>رد</button>
            <button type="button" className="comment-link-btn" onClick={() => onEditStateChange(item.id, item.content || '')}>تعديل</button>
            <button type="button" className="comment-link-btn" onClick={() => onPin?.(item.id, !item.is_pinned)}>{item.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>
            <button type="button" className="comment-link-btn" onClick={() => onHide?.(item.id, !item.is_hidden)}>{item.is_hidden ? 'إظهار' : 'إخفاء'}</button>
            <button type="button" className="comment-link-btn" onClick={() => onCopy?.(item)}>نسخ</button>
            <button type="button" className="comment-link-btn" onClick={() => onReport?.(item.id)}>إبلاغ</button>
            <button type="button" className="comment-link-btn danger" onClick={() => onDelete?.(item.id)}>حذف</button>
            <span className="muted" style={{ fontSize: 11 }}>إجمالي التفاعل {totalReactions}</span>
          </div>
        </div>

        {isReplying ? (
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            <textarea value={replyText} onChange={(event) => onReplyStateChange(item.id, event.target.value)} rows={2} placeholder={`رد على @${item.username || 'user'}`} style={{ width: '100%', borderRadius: 12, padding: 10 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => onReplySubmit(item.id, replyText)}>إرسال الرد</Button>
              <Button size="small" variant="secondary" onClick={() => onReplyStateChange(item.id, null)}>إلغاء</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default function NestedComments({
  comments = [],
  pagination = null,
  sortBy = 'newest',
  loadingMore = false,
  onSortChange,
  onLoadMore,
  onAddComment,
  onReply,
  onToggleReaction,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onPinComment,
  onHideComment,
  onReportComment,
  onCopyComment,
}) {
  const [commentText, setCommentText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editDrafts, setEditDrafts] = useState({});

  const flatComments = useMemo(() => flattenComments(comments), [comments]);
  const pendingCount = flatComments.filter((item) => item.optimistic).length;
  const liveCount = flatComments.filter((item) => item.justArrived).length;

  const listData = useMemo(() => ({
    items: flatComments,
    replyState: replyDrafts,
    editState: editDrafts,
    onReplyStateChange: (commentId, value) => {
      setReplyDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onEditStateChange: (commentId, value) => {
      setEditDrafts((prev) => {
        const next = { ...prev };
        if (value === null) delete next[commentId];
        else next[commentId] = value;
        return next;
      });
    },
    onReplySubmit: (commentId, value) => {
      if (!String(value || '').trim()) return;
      onReply?.(commentId, value.trim());
      setReplyDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onEditSubmit: (commentId, value) => {
      if (!String(value || '').trim()) return;
      onEditComment?.(commentId, value.trim());
      setEditDrafts((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    },
    onLike: onLikeComment,
    onPin: onPinComment,
    onHide: onHideComment,
    onReport: onReportComment,
    onDelete: onDeleteComment,
    onCopy: onCopyComment,
    onReact: onToggleReaction,
  }), [flatComments, replyDrafts, editDrafts, onReply, onEditComment, onLikeComment, onPinComment, onHideComment, onReportComment, onDeleteComment, onCopyComment, onToggleReaction]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      <div className="comments-head-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0 }}>التعليقات ({flatComments.length})</h4>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>النظام يدعم الردود المتداخلة والتحديثات الفورية والإجراءات السريعة.</div>
        </div>
        <div className="comments-badges-wrap">
          <span className="comment-summary-pill live"><span className="live-mini-dot" />Realtime {liveCount ? `(${liveCount})` : ''}</span>
          {pendingCount > 0 ? <span className="comment-summary-pill pending">معلق {pendingCount}</span> : null}
          <select value={sortBy} onChange={(event) => onSortChange?.(event.target.value)} style={{ minHeight: 34, borderRadius: 999, padding: '0 12px' }}>
            <option value="newest">الأحدث</option>
            <option value="popular">الأكثر تفاعلاً</option>
            <option value="oldest">الأقدم</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 320 }}>
        {flatComments.length === 0 ? (
          <div className="muted text-center py-10">لا توجد تعليقات بعد.</div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={flatComments.length}
                itemSize={220}
                itemData={listData}
                className="no-scrollbar"
              >
                {CommentRow}
              </List>
            )}
          </AutoSizer>
        )}
      </div>

      {pagination?.has_more ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={onLoadMore} loading={loadingMore}>تحميل المزيد من التعليقات</Button>
        </div>
      ) : null}

      <div className="comment-composer-shell" style={{ marginTop: 'auto' }}>
        <textarea
          placeholder="اكتب تعليقك... تقدر تستخدم @mention و #hashtag"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          rows={3}
          style={{ width: '100%', borderRadius: 16, padding: 12, fontSize: 14 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => setCommentText((prev) => `${prev}${emoji}`)}>{emoji}</button>
            ))}
          </div>
          <Button size="small" onClick={() => {
            if (!commentText.trim()) return;
            onAddComment?.({ content: commentText.trim() });
            setCommentText('');
          }}>نشر</Button>
        </div>
      </div>

      <style>{`
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-card-shell.is-hidden {
          opacity: 0.78;
          border-style: dashed;
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          color: inherit;
        }
        .comment-link-btn.danger {
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap,
        .comment-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .comment-top-row {
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
        }
        .comment-summary-pill.live,
        .comment-state-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .comment-state-pill.pending,
        .comment-summary-pill.pending {
          background: rgba(251,191,36,0.12);
          color: #fde68a;
        }
        .comment-state-pill.pinned {
          background: rgba(139,92,246,0.16);
          color: #d8b4fe;
        }
        .comment-state-pill.muted {
          background: rgba(148,163,184,0.14);
          color: #cbd5e1;
        }
        .live-mini-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
