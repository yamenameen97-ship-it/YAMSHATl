import { useMemo, useState } from 'react';
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

function CommentNode({ item, depth = 0, onReply, onReact }) {
  const [replyValue, setReplyValue] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  return (
    <div style={{ display: 'grid', gap: 10, marginInlineStart: depth ? 18 : 0, paddingInlineStart: depth ? 12 : 0, borderInlineStart: depth ? '2px solid rgba(59,130,246,0.12)' : 'none' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6, alignItems: 'center' }}>
          <strong>{item.username || item.user || 'مستخدم'}</strong>
          <span className="muted" style={{ fontSize: 12 }}>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</span>
        </div>
        <div style={{ lineHeight: 1.7 }}>{enrichMentions(item.content || item.text || item.comment || '')}</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {EMOJIS.map((emoji) => {
            const count = Number(item.reactions?.[emoji] || 0);
            return (
              <button key={emoji} type="button" className="comment-emoji-btn" onClick={() => onReact(item.id, emoji)}>
                {emoji} {count ? count : ''}
              </button>
            );
          })}
          <button type="button" className="comment-link-btn" onClick={() => setShowReplyBox((prev) => !prev)}>رد</button>
        </div>

        {showReplyBox ? (
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
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
        ) : null}
      </div>

      {item.replies?.length ? item.replies.map((reply) => (
        <CommentNode key={reply.id} item={reply} depth={depth + 1} onReply={onReply} onReact={onReact} />
      )) : null}
    </div>
  );
}

export default function NestedComments({ comments = [], onAddComment, onReply, onToggleReaction }) {
  const [commentText, setCommentText] = useState('');
  const [selectedMention, setSelectedMention] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const commentTree = useMemo(() => {
    const items = [...comments];
    items.sort((a, b) => {
      if (sortBy === 'popular') {
        const totalA = Object.values(a.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
        const totalB = Object.values(b.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
        return totalB - totalA;
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    return buildTree(items);
  }, [comments, sortBy]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0 }}>التعليقات ({comments.length})</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={selectedMention} onChange={(event) => setSelectedMention(event.target.value)} placeholder="منشن سريع" style={{ borderRadius: 999, padding: '8px 12px' }} />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={{ borderRadius: 999, padding: '8px 12px' }}>
            <option value="newest">الأحدث</option>
            <option value="popular">الأكثر تفاعلاً</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
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

      <div style={{ display: 'grid', gap: 12 }}>
        {commentTree.length ? commentTree.map((item) => (
          <CommentNode key={item.id} item={item} onReply={onReply} onReact={onToggleReaction} />
        )) : <div className="muted">لا توجد تعليقات بعد.</div>}
      </div>

      <style>{`
        .comment-emoji-btn,
        .comment-link-btn {
          border: 1px solid rgba(59,130,246,0.12);
          background: rgba(59,130,246,0.06);
          border-radius: 999px;
          padding: 6px 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
