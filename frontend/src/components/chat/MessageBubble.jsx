import React, { memo, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮'];

function StatusIcon({ status = '', onRetry, message }) {
  if (!status) return null;

  if (status === 'failed') {
    return (
      <button
        type="button"
        className="ui-chat-bubble-retry"
        onClick={() => onRetry?.(message)}
        title="فشل الإرسال — إعادة المحاولة"
        aria-label="إعادة محاولة الإرسال"
      >
        !
      </button>
    );
  }

  const icon = status === 'sending' ? '◌' : status === 'delivered' ? '✓' : status === 'seen' ? '✓✓' : '';
  if (!icon) return null;

  return (
    <span className="ui-chat-bubble-status" data-status={status} aria-label={status}>
      {icon}
    </span>
  );
}

function MessageBubble({ message, isMine, onReply, onRetry }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const reduceMotion = useReducedMotion();

  const bubbleTone = isMine ? 'mine' : 'their';
  const rowAlign = isMine ? 'end' : 'start';

  const actionMotion = useMemo(() => (
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.16 } }
  ), [reduceMotion]);

  const reactionMotion = useMemo(() => (
    reduceMotion
      ? { initial: false, animate: { opacity: 1, scale: 1 } }
      : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.16 } }
  ), [reduceMotion]);

  return (
    <div
      className="ui-chat-bubble-row"
      data-align={rowAlign}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className="ui-chat-bubble-stack">
        {message.replyTo ? (
          <div className="ui-chat-reply-preview" title={message.replyTo.text}>
            {message.replyTo.text}
          </div>
        ) : null}

        <div className="ui-chat-bubble" data-tone={bubbleTone}>
          <div className="ui-chat-bubble-text">{message.text}</div>

          <div className="ui-chat-bubble-meta">
            {message.isEdited ? <span>معدلة</span> : null}
            {message.time ? <span>{message.time}</span> : null}
            <StatusIcon status={message.status} onRetry={onRetry} message={message} />
          </div>
        </div>

        {showActions ? (
          <motion.div className="ui-chat-bubble-actions" {...actionMotion}>
            <button
              type="button"
              className="ui-chat-bubble-action"
              onClick={() => setShowReactions((current) => !current)}
              aria-label="التفاعلات"
            >
              😀
            </button>
            <button type="button" className="ui-chat-bubble-action" onClick={() => onReply?.(message)} aria-label="رد">
              ↩️
            </button>
          </motion.div>
        ) : null}

        {showReactions ? (
          <motion.div className="ui-chat-bubble-reactions" {...reactionMotion}>
            {REACTIONS.map((reaction) => (
              <button
                key={reaction}
                type="button"
                className="ui-chat-reaction-button"
                onClick={() => setShowReactions(false)}
                aria-label={`تفاعل ${reaction}`}
              >
                {reaction}
              </button>
            ))}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

export default memo(MessageBubble);
