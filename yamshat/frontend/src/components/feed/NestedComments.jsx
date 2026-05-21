import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../ui/Button.jsx';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '💯'];

function enrichMentions(text = '') {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('@')) return <span key={index} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part}</span>;
    return part;
  });
}

function countReactions(reactions = {}) {
  return Object.values(reactions).reduce((sum, value) => sum + Number(value || 0), 0);
}

const CommentRow = ({ index, style, data }) => {
  const { items, onReply, onReact } = data;
  const item = items[index];
  if (!item) return null;

  const totalReactions = countReactions(item.reactions);

  return (
    <div style={{ ...style, padding: '10px' }}>
      <div className={`comment-card-shell ${item.optimistic ? 'optimistic' : ''} ${item.justArrived ? 'live' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong>{item.username || item.user || 'مستخدم'}</strong>
            {item.optimistic ? <span className="comment-state-pill pending">قيد الإرسال</span> : null}
            {item.justArrived ? <span className="comment-state-pill live">وصل الآن</span> : null}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
        </div>

        <div style={{ lineHeight: 1.8, fontSize: 14 }}>{enrichMentions(item.content || item.text || item.comment || '')}</div>

        <div className="comment-toolbar-row" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOJIS.map((emoji) => {
              const count = Number(item.reactions?.[emoji] || 0);
              return (
                <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => onReact(item.id, emoji)}>
                  {emoji} {count ? count : ''}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 11 }}>التفاعلات {totalReactions}</span>
            <button type="button" className="comment-link-btn" style={{ fontSize: 11 }}>رد</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NestedComments({ comments = [], onAddComment, onReply, onToggleReaction }) {
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const sortedComments = useMemo(() => {
    const items = [...comments];
    items.sort((a, b) => {
      if (sortBy === 'popular') return countReactions(b.reactions) - countReactions(a.reactions);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return items;
  }, [comments, sortBy]);

  const listData = useMemo(() => ({
    items: sortedComments,
    onReply,
    onReact: onToggleReaction
  }), [sortedComments, onReply, onToggleReaction]);

  const pendingCount = comments.filter((item) => item.optimistic).length;
  const liveCount = comments.filter((item) => item.justArrived).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
      <div className="comments-head-row">
        <div>
          <h4 style={{ margin: 0 }}>التعليقات ({comments.length})</h4>
        </div>
        <div className="comments-badges-wrap">
          <span className="comment-summary-pill live"><span className="live-mini-dot" />Realtime</span>
          {pendingCount > 0 ? <span className="comment-summary-pill pending">{pendingCount}</span> : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 300 }}>
        {sortedComments.length === 0 ? (
          <div className="muted text-center py-10">لا توجد تعليقات بعد.</div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={sortedComments.length}
                itemSize={140}
                itemData={listData}
                className="no-scrollbar"
              >
                {CommentRow}
              </List>
            )}
          </AutoSizer>
        )}
      </div>

      <div className="comment-composer-shell" style={{ marginTop: 'auto' }}>
        <textarea
          placeholder="اكتب تعليقك..."
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          rows={2}
          style={{ width: '100%', borderRadius: 16, padding: 12, fontSize: 14 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {EMOJIS.slice(0, 4).map((emoji) => (
              <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => setCommentText((prev) => `${prev}${emoji}`)}>{emoji}</button>
            ))}
          </div>
          <Button size="sm" onClick={() => {
            if (!commentText.trim()) return;
            onAddComment({ content: commentText.trim() });
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
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
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
        .comment-summary-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
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
