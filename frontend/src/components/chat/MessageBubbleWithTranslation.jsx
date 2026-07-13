import React, { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import { statusColor, statusTicks } from '../yamshat/YamshatDesign.js';
import VoiceMessagePlayer from '../ui/VoiceMessagePlayer.jsx';
import MessageTranslator from './MessageTranslator.jsx';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮'];

function formatMessageTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const IMAGE_MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic|heif)(?:$|\?)/i;
const VIDEO_MEDIA_RE = /\.(mp4|webm|mov|m4v|mkv)(?:$|\?)/i;
const AUDIO_MEDIA_RE = /\.(mp3|wav|ogg|oga|m4a|aac|opus|webm)(?:$|\?)/i;

function getPrimaryAttachment(message = {}) {
  return Array.isArray(message?.attachments) && message.attachments.length ? (message.attachments[0] || {}) : {};
}

function resolveMessageMediaUrl(message = {}) {
  const attachment = getPrimaryAttachment(message);
  return String(
    message?.media_url
    || message?.media_urls?.[0]
    || attachment?.url
    || attachment?.mediaUrl
    || attachment?.media_url
    || ''
  ).trim();
}

function resolveMessageMediaKind(message = {}) {
  const attachment = getPrimaryAttachment(message);
  const rawType = String(
    message?.type
    || message?.message_type
    || attachment?.kind
    || attachment?.type
    || attachment?.mediaType
    || attachment?.media_type
    || ''
  ).trim().toLowerCase();
  const mime = String(attachment?.mime_type || attachment?.mimeType || '').trim().toLowerCase();
  const mediaUrl = resolveMessageMediaUrl(message).toLowerCase();

  if (['voice', 'audio', 'audio_message', 'voice_message'].includes(rawType)) return 'voice';
  if (['image', 'photo', 'img', 'media_image'].includes(rawType)) return 'image';
  if (['video', 'media_video'].includes(rawType)) return 'video';
  if (['file', 'document', 'attachment'].includes(rawType)) return 'file';

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'voice';

  if (IMAGE_MEDIA_RE.test(mediaUrl)) return 'image';
  if (VIDEO_MEDIA_RE.test(mediaUrl)) return 'video';
  if (AUDIO_MEDIA_RE.test(mediaUrl)) return 'voice';

  if (mediaUrl) return 'file';
  return 'none';
}

function extractFileName(message) {
  const attachment = getPrimaryAttachment(message);
  if (message?.attachment_name) return message.attachment_name;
  if (attachment?.fileName) return attachment.fileName;
  if (attachment?.file_name) return attachment.file_name;
  if (attachment?.name) return attachment.name;
  const mediaUrl = resolveMessageMediaUrl(message);
  if (!mediaUrl) return 'ملف مرفق';
  try {
    const clean = mediaUrl.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() || 'ملف مرفق');
  } catch {
    return 'ملف مرفق';
  }
}

function messageMatchesSearch(message, query) {
  const lowered = String(query || '').trim().toLowerCase();
  if (!lowered) return true;
  return [
    message?.content,
    message?.message,
    message?.sender,
    extractFileName(message),
  ].some((value) => String(value || '').toLowerCase().includes(lowered));
}

function areGrouped(firstMessage, secondMessage) {
  if (!firstMessage || !secondMessage) return false;
  if (firstMessage.sender !== secondMessage.sender) return false;
  const firstStamp = new Date(firstMessage.created_at || 0).getTime();
  const secondStamp = new Date(secondMessage.created_at || 0).getTime();
  return Math.abs(secondStamp - firstStamp) <= 5 * 60 * 1000;
}

function MessageBubbleWithTranslation({
  message,
  isMe,
  prevMessage,
  nextMessage,
  highlightQuery = '',
  reactionState,
  onReply,
  onDelete,
  onReact,
  onJumpToReply,
  registerMessageNode,
  onOpenMedia,
  onTranslate,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const reduceMotion = useReducedMotion();

  const mediaUrl = resolveMessageMediaUrl(message);
  const mediaKind = resolveMessageMediaKind(message);
  const hasMedia = Boolean(mediaUrl);
  const isVoice = mediaKind === 'voice';
  const isImage = mediaKind === 'image';
  const isVideo = mediaKind === 'video';
  const isFile = mediaKind === 'file';
  const content = message?.content || message?.message || '';
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);
  const groupedWithPrev = areGrouped(prevMessage, message);
  const groupedWithNext = areGrouped(message, nextMessage);
  const showAvatar = !isMe && !groupedWithNext;
  const replyTarget = message?.reply_to || message?.replyTo || null;

  const topReactions = useMemo(() => (
    Object.entries(reactionState?.counts || {})
      .filter(([, count]) => Number(count || 0) > 0)
      .sort((left, right) => Number(right[1]) - Number(left[1]))
      .slice(0, 3)
  ), [reactionState]);

  const rowMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: isMe ? 20 : -20, y: 14, scale: 0.985 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
      };

  const popMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1, scale: 1 } }
    : {
        initial: { opacity: 0, scale: 0.9, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 6 },
        transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      };

  const messageId = message?.id || message?.client_id;

  const openCurrentMedia = () => {
    if (!mediaUrl) return;
    onOpenMedia?.(message);
  };

  const isVoiceOnly = isVoice && !content && !replyTarget && !message?.deleted;
  const isImageOnly = isImage && !content && !replyTarget && !message?.deleted;
  const isVideoOnly = isVideo && !content && !replyTarget && !message?.deleted;
  const isMediaOnly = isImageOnly || isVideoOnly;

  return (
    <>
      <motion.div
        ref={(node) => registerMessageNode?.(String(messageId), node)}
        className={`yam-message-row ${isMe ? 'me' : 'them'} ${groupedWithPrev ? 'grouped-prev' : ''} ${groupedWithNext ? 'grouped-next' : ''} ${isVoiceOnly ? 'voice-only' : ''} ${isMediaOnly ? 'media-only' : ''}`}
        data-msg-id={messageId}
        layout={!reduceMotion}
        onMouseEnter={() => setShowToolbar(true)}
        onMouseLeave={() => setShowToolbar(false)}
        {...rowMotion}
      >
        <div className={`yam-message-avatar ${showAvatar ? 'visible' : ''}`}>
          {showAvatar ? (
            <Avatar
              name={message?.sender || 'مستخدم'}
              src={message?.sender_avatar}
              size="sm"
              showStatus
              status="online"
            />
          ) : null}
        </div>

        <div className="yam-message-stack">
          <motion.div
            className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'} ${shouldGlow ? 'search-hit' : ''} ${showToolbar ? 'toolbar-open' : ''} ${isVoiceOnly ? 'is-voice-only' : ''} ${isMediaOnly ? 'is-media-only' : ''} ${isImageOnly ? 'is-image-only' : ''} ${isVideoOnly ? 'is-video-only' : ''}`}
            layout={!reduceMotion}
          >
            <button
              type="button"
              className="yam-bubble-more"
              aria-label="خيارات الرسالة"
              onClick={() => setShowToolbar((current) => !current)}
            >
              ⋯
            </button>

            <AnimatePresence initial={false}>
              {showToolbar ? (
                <motion.div className="yam-bubble-toolbar" {...popMotion}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onReact?.(message, emoji);
                        setShowToolbar(false);
                      }}
                      title={`إضافة ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => { onReply?.(message); setShowToolbar(false); }}
                    title="الرد"
                  >
                    ↩
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTranslator(true);
                      setShowToolbar(false);
                    }}
                    title="ترجمة"
                    className="translate-btn"
                  >
                    🌐
                  </button>
                  {isMe && !message?.deleted ? <button type="button" onClick={() => { onDelete?.(messageId, false); setShowToolbar(false); }}>🗑</button> : null}
                  {isMe && !message?.deleted ? <button type="button" onClick={() => { onDelete?.(messageId, true); setShowToolbar(false); }}>🧹</button> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {replyTarget ? (
                <motion.button
                  type="button"
                  className="yam-reply-preview"
                  onClick={() => onJumpToReply?.(replyTarget?.id)}
                  layout={!reduceMotion}
                  {...popMotion}
                >
                  <strong>↩ الرد على</strong>
                  <span>{replyTarget?.content || replyTarget?.message || '...'}</span>
                </motion.button>
              ) : null}
            </AnimatePresence>

            {isImage && mediaUrl ? (
              <button type="button" className="yam-media-button" onClick={openCurrentMedia}>
                <img src={mediaUrl} alt={fileName} className="yam-bubble-media" loading="lazy" decoding="async" />
                <span className="yam-bubble-media-overlay">تكبير</span>
              </button>
            ) : null}

            {isVideo && mediaUrl ? (
              <button type="button" className="yam-media-button yam-video-preview-shell" onClick={openCurrentMedia}>
                <video src={mediaUrl} muted playsInline className="yam-bubble-media" preload="metadata" />
                <span className="yam-bubble-media-overlay">تشغيل كامل</span>
              </button>
            ) : null}

            {isVoice && mediaUrl ? (
              <VoiceMessagePlayer
                src={mediaUrl}
                seed={message?.waveform_seed || message?.created_at || messageId}
                title="رسالة صوتية"
                bubbleless
                isMe={isMe}
              />
            ) : null}

            {isFile && mediaUrl ? (
              <a href={mediaUrl} target="_blank" rel="noreferrer" className="yam-file-card">
                <span className="yam-file-icon">📄</span>
                <span className="yam-file-copy">
                  <strong>{fileName}</strong>
                  <small>{(message?.attachments?.[0]?.mediaType || message?.type || 'FILE').toUpperCase()}</small>
                </span>
              </a>
            ) : null}

            {content && !message?.deleted ? <div className="bubble-text">{content}</div> : null}
            {message?.deleted ? <div className="bubble-deleted">تم حذف الرسالة</div> : null}

            <div className="bubble-meta">
              <span className="bubble-time">{formatMessageTime(message?.created_at)}</span>
              {isMe ? (
                <span
                  className="bubble-status"
                  data-status={message?.status || 'sent'}
                  data-ds-status-color={statusColor(message?.status)}
                >
                  {statusTicks(message?.status)}
                </span>
              ) : null}
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {topReactions.length ? (
              <motion.div className={`yam-reaction-summary ${isMe ? 'me' : 'them'}`} layout={!reduceMotion} {...popMotion}>
                {topReactions.map(([emoji, count]) => (
                  <motion.button
                    key={emoji}
                    type="button"
                    layout={!reduceMotion}
                    className={`yam-reaction-chip ${reactionState?.myReaction === emoji ? 'active' : ''}`}
                    onClick={() => onReact?.(message, emoji)}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </motion.button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* مكون الترجمة الفورية */}
      <MessageTranslator
        message={message}
        isOpen={showTranslator}
        onClose={() => setShowTranslator(false)}
        onTranslate={onTranslate}
      />

      <style>{`
        .translate-btn {
          background: rgba(59, 130, 246, 0.2) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        .translate-btn:hover {
          background: rgba(59, 130, 246, 0.3) !important;
        }
      `}</style>
    </>
  );
}

export default memo(MessageBubbleWithTranslation);
