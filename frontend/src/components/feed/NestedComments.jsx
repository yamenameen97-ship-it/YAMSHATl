import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../ui/Button.jsx';

const EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '💯'];

function enrichMentions(text = '') {
  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('@')) return <span key={index} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part}</span>;
    return part;
  });
}

function buildTree(items = []) {
  const map = new Map();
  const roots = [];
  items.forEach((item) => map.set(String(item.id), { ...item, replies: [...(item.replies || [])] }));
  map.forEach((item) => {
    const parentId = item.parent_id ?? item.parentId ?? null;
    if (parentId && map.has(String(parentId))) map.get(String(parentId)).replies.push(item);
    else roots.push(item);
  });
  return roots;
}

function countReactions(reactions = {}) {
  return Object.values(reactions).reduce((sum, value) => sum + Number(value || 0), 0);
}

function CommentNode({ item, depth = 0, onReply, onReact }) {
  const [replyValue, setReplyValue] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const totalReactions = countReactions(item.reactions);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
      style={{ display: 'grid', gap: 10, marginInlineStart: depth ? 18 : 0, paddingInlineStart: depth ? 12 : 0, borderInlineStart: depth ? '2px solid rgba(59,130,246,0.12)' : 'none' }}
    >
      <div className={`comment-card-shell ${item.optimistic ? 'optimistic' : ''} ${item.justArrived ? 'live' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong>{item.username || item.user || 'مستخدم'}</strong>
            {item.optimistic ? <span className="comment-state-pill pending">قيد الإرسال</span> : null}
            {item.justArrived ? <span className="comment-state-pill live">وصل الآن</span> : null}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
        </div>

        <div style={{ lineHeight: 1.8 }}>{enrichMentions(item.content || item.text || item.comment || '')}</div>

        <div className="comment-toolbar-row">
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
            <span className="muted" style={{ fontSize: 12 }}>التفاعلات {totalReactions}</span>
            <button type="button" className="comment-link-btn" onClick={() => setShowReplyBox((prev) => !prev)}>رد</button>
          </div>
        </div>

        <AnimatePresence>
          {showReplyBox ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <textarea value={replyValue} onChange={(event) => setReplyValue(event.target.value)} rows={2} placeholder="اكتب رد مع @منشن لو حابب" style={{ width: '100%', borderRadius: 12, padding: 10 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button variant="secondary" onClick={() => { setShowReplyBox(false); setReplyValue(''); }}>إلغاء</Button>
                  <Button onClick={() => {
                    if (!replyValue.trim()) return;
                    onReply(item.id, replyValue.trim());
                    setReplyValue('');
                    setShowReplyBox(false);
                  }}>إرسال الرد</Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {item.replies?.length ? item.replies.map((reply) => (
        <CommentNode key={reply.id} item={reply} depth={depth + 1} onReply={onReply} onReact={onReact} />
      )) : null}
    </motion.div>
  );
}

export default function NestedComments({ comments = [], onAddComment, onReply, onToggleReaction }) {
  const [commentText, setCommentText] = useState('');
  const [selectedMention, setSelectedMention] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const commentTree = useMemo(() => {
    const items = [...comments];
    items.sort((a, b) => {
      if (sortBy === 'popular') return countReactions(b.reactions) - countReactions(a.reactions);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return buildTree(items);
  }, [comments, sortBy]);

  const pendingCount = comments.filter((item) => item.optimistic).length;
  const liveCount = comments.filter((item) => item.justArrived).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="comments-head-row">
        <div>
          <h4 style={{ margin: 0 }}>التعليقات ({comments.length})</h4>
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>واجهة تعليقات لحظية مع Animations و Optimistic Updates</div>
        </div>
        <div className="comments-badges-wrap">
          <span className="comment-summary-pill live"><span className="live-mini-dot" />Realtime</span>
          {pendingCount > 0 ? <span className="comment-summary-pill pending">{pendingCount} قيد الإرسال</span> : null}
          {liveCount > 0 ? <span className="comment-summary-pill accent">{liveCount} جديد</span> : null}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={selectedMention} onChange={(event) => setSelectedMention(event.target.value)} placeholder="منشن سريع" style={{ borderRadius: 999, padding: '8px 12px' }} />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={{ borderRadius: 999, padding: '8px 12px' }}>
            <option value="newest">الأحدث</option>
            <option value="popular">الأكثر تفاعلاً</option>
          </select>
        </div>
      </div>

      <div className="comment-composer-shell">
        <textarea
          placeholder="اكتب تعليقك... دعم @mentions + realtime updates"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          rows={3}
          style={{ width: '100%', borderRadius: 16, padding: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => setCommentText((prev) => `${prev}${emoji}`)}>{emoji}</button>
            ))}
            <button type="button" className="comment-link-btn" onClick={() => setCommentText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${selectedMention || 'username'} `)}>إضافة منشن</button>
          </div>
          <Button onClick={() => {
            if (!commentText.trim()) return;
            onAddComment({ content: commentText.trim() });
            setCommentText('');
          }}>نشر التعليق</Button>
        </div>
      </div>

      <motion.div layout style={{ display: 'grid', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {commentTree.length ? commentTree.map((item) => (
            <CommentNode key={item.id} item={item} onReply={onReply} onReact={onToggleReaction} />
          )) : <div className="muted">لا توجد تعليقات بعد.</div>}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .comment-composer-shell,
        .comment-card-shell {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.05);
          border-radius: 18px;
          padding: 14px;
        }
        .comment-card-shell.optimistic {
          border-color: rgba(245,158,11,0.28);
          background: rgba(245,158,11,0.06);
        }
        .comment-card-shell.live {
          box-shadow: 0 0 0 1px rgba(34,197,94,0.26), 0 18px 36px rgba(34,197,94,0.08);
        }
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .comments-head-row,
        .comment-toolbar-row,
        .comments-badges-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
        }
        .comment-state-pill,
        .comment-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .comment-state-pill.pending,
        .comment-summary-pill.pending {
          background: rgba(245,158,11,0.12);
          color: #fbbf24;
        }
        .comment-state-pill.live,
        .comment-summary-pill.live {
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }
        .comment-summary-pill.accent {
          background: rgba(139,92,246,0.14);
          color: #c4b5fd;
        }
        .live-mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: comment-live-pulse 1.5s infinite;
        }
        @keyframes comment-live-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
