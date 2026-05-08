import { useMemo, useState } from 'react';
import Button from '../ui/Button.jsx';

function CommentNode({ node, depth, onReply, submittingReplyId, replyDrafts, setReplyDrafts }) {
  const [openReply, setOpenReply] = useState(false);
  const createdAt = useMemo(() => {
    try {
      return node?.created_at ? new Date(node.created_at).toLocaleString('ar-EG') : 'الآن';
    } catch {
      return 'الآن';
    }
  }, [node?.created_at]);

  return (
    <div className="nested-comment-node" style={{ marginInlineStart: depth ? Math.min(depth * 18, 54) : 0 }}>
      <div className="nested-comment-card">
        <div className="nested-comment-head">
          <strong>{node.username || 'user'}</strong>
          <span className="muted">{createdAt}</span>
        </div>
        <div className="nested-comment-content">{node.content}</div>
        <div className="nested-comment-actions">
          <button type="button" className="mini-action" onClick={() => setOpenReply((prev) => !prev)}>
            {openReply ? 'إلغاء الرد' : 'رد'}
          </button>
          {node.reply_count ? <span className="glass-chip">{node.reply_count} رد</span> : null}
        </div>
        {openReply ? (
          <div className="nested-comment-reply-box">
            <input
              className="input"
              value={replyDrafts[node.id] || ''}
              placeholder={`رد على @${node.username || 'user'}`}
              onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [node.id]: event.target.value }))}
            />
            <Button
              loading={submittingReplyId === node.id}
              onClick={async () => {
                await onReply(node.id, replyDrafts[node.id] || '');
                setOpenReply(false);
              }}
            >
              إرسال الرد
            </Button>
          </div>
        ) : null}
      </div>

      {Array.isArray(node.replies) && node.replies.length ? (
        <div className="nested-comment-children">
          {node.replies.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onReply={onReply}
              submittingReplyId={submittingReplyId}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function NestedComments({
  comments = [],
  rootValue = '',
  onRootValueChange,
  onSubmitRoot,
  onSubmitReply,
  submitting = false,
}) {
  const [replyDrafts, setReplyDrafts] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);

  return (
    <div className="nested-comments-shell">
      <div className="nested-comments-list">
        {(comments || []).map((node) => (
          <CommentNode
            key={node.id}
            node={node}
            depth={0}
            replyDrafts={replyDrafts}
            setReplyDrafts={setReplyDrafts}
            submittingReplyId={submittingReplyId}
            onReply={async (parentId, value) => {
              setSubmittingReplyId(parentId);
              try {
                await onSubmitReply(parentId, value);
                setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }));
              } finally {
                setSubmittingReplyId(null);
              }
            }}
          />
        ))}
        {!comments.length ? <div className="muted">مفيش تعليقات لسه. ابدأ أول تعليق.</div> : null}
      </div>

      <div className="nested-comment-reply-box root-comment-box">
        <input
          className="input"
          value={rootValue}
          placeholder="اكتب تعليقاً"
          onChange={(event) => onRootValueChange(event.target.value)}
        />
        <Button loading={submitting} onClick={onSubmitRoot}>إرسال</Button>
      </div>
    </div>
  );
}
