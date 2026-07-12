import React, { memo, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import { statusColor, statusTicks } from '../yamshat/YamshatDesign.js';
import VoiceMessagePlayer from '../ui/VoiceMessagePlayer.jsx';
import SafeImage from './SafeImage.jsx';
import CallBubble from './CallBubble.jsx';
import MessageContextPopup from './MessageContextPopup.jsx';
import MessageReadReceipts from './MessageReadReceipts.jsx';
import MessageRetry from './MessageRetry.jsx';
import useMessageTranslation from '../../hooks/useMessageTranslation.js';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '👏', '👍', '😮'];

// مدة الضغط المطول بالملي ثانية
const LONG_PRESS_MS = 450;
// الحد الأدنى للسحب لتفعيل الرد (بالبيكسل)
const SWIPE_REPLY_THRESHOLD = 60;
// الحد الأقصى للسحب
const SWIPE_REPLY_MAX = 100;

function formatMessageTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function extractFileName(message) {
  if (message?.attachment_name) return message.attachment_name;
  if (Array.isArray(message?.attachments) && message.attachments[0]?.fileName) return message.attachments[0].fileName;
  const mediaUrl = message?.media_url || '';
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

function MessageBubble({
  message,
  isMe,
  prevMessage,
  nextMessage,
  highlightQuery = '',
  reactionState,
  onReply,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
  onResend,
  onReport,
  onReact,
  onJumpToReply,
  registerMessageNode,
  onOpenMedia,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // {x, y}
  const [popupAnchor, setPopupAnchor] = useState(null); // لـ MessageContextPopup (v60)
  const [swipeOffset, setSwipeOffset] = useState(0);
  const reduceMotion = useReducedMotion();

  // مراجع للضغط المطول والسحب
  const longPressTimerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const isSwipingRef = useRef(false);
  const isLongPressFiredRef = useRef(false);
  const bubbleRef = useRef(null);
  // ✅ FIX v59.13.6: حارس isMounted لمنع setState بعد إزالة الفقاعة من virtualized list
  const isMountedRef = useRef(true);

  // ✅ FIX v59.13.6: cleanup نهائي عند unmount — يُلغي مؤقّت الضغط المطوّل
  // السلوك السابق: إذا بدأ المستخدم long-press ثم انتقل لرسالة أخرى
  // (أو تمّت إعادة التدوير في virtualized list) خلال LONG_PRESS_MS
  // → setContextMenu يُستدعى على مكوّن مُزال → تحذير React + تسرّب.
  useEffect(() => () => {
    isMountedRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const hasMedia = Boolean(message?.media_url);
  const isVoice = message?.type === 'voice';
  const isImage = message?.type === 'image' || (hasMedia && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message?.media_url || ''));
  const isVideo = message?.type === 'video' || (hasMedia && /\.(mp4|webm|mov|m4v)$/i.test(message?.media_url || ''));
  const isFile = message?.type === 'file' || (hasMedia && !isVoice && !isImage && !isVideo);
  const content = message?.content || message?.message || '';
  const fileName = extractFileName(message);
  const shouldGlow = highlightQuery.trim() && messageMatchesSearch(message, highlightQuery);
  const groupedWithPrev = areGrouped(prevMessage, message);
  const groupedWithNext = areGrouped(message, nextMessage);
  const showAvatar = !isMe && !groupedWithNext;
  const replyTarget = message?.reply_to || message?.replyTo || null;
  const isFailed = message?.status === 'failed' || message?.failed;

  const topReactions = useMemo(() => (
    Object.entries(reactionState?.counts || {})
      .filter(([, count]) => Number(count || 0) > 0)
      .sort((left, right) => Number(right[1]) - Number(left[1]))
      .slice(0, 3)
  ), [reactionState]);

  const messageId = message?.id || message?.client_id;

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

  const openCurrentMedia = () => {
    if (!message?.media_url) return;
    onOpenMedia?.(message);
  };

  const isVoiceOnly = isVoice && !content && !replyTarget && !message?.deleted;
  // ✅ v87.6: تحديد الفقاعات التي تحتوي فقط على صورة/فيديو (بدون نص أو رد)
  // لجعلها تُعرض بنمط واتساب — بدون خلفية فقاعة، فقط الصورة/الفيديو نفسه
  const isImageOnly = isImage && !content && !replyTarget && !message?.deleted;
  const isVideoOnly = isVideo && !content && !replyTarget && !message?.deleted;
  const isMediaOnly = isImageOnly || isVideoOnly;

  // === القائمة السياقية: فتح + إغلاق ===
  // v60: على الجوال نستخدم popupAnchor (MessageContextPopup) ، وعلى السطح نستخدم contextMenu القديم
  const openContextMenu = useCallback((x, y) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile && bubbleRef.current) {
      // v60: افتح البوب أب الجديد المتمركز حول الرسالة
      const rect = bubbleRef.current.querySelector('.yam-bubble')?.getBoundingClientRect()
        || bubbleRef.current.getBoundingClientRect();
      setPopupAnchor(rect);
      setShowToolbar(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch { /* ignore */ }
      }
      return;
    }
    // سطح المكتب: القائمة القديمة
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 280;
    setContextMenu({
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    });
    setShowToolbar(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(15); } catch { /* ignore */ }
    }
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setPopupAnchor(null);
  }, []);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const onClickAway = () => closeContextMenu();
    const onEsc = (e) => { if (e.key === 'Escape') closeContextMenu(); };
    window.addEventListener('click', onClickAway);
    window.addEventListener('scroll', onClickAway, true);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', onClickAway);
      window.removeEventListener('scroll', onClickAway, true);
      window.removeEventListener('keydown', onEsc);
    };
  }, [contextMenu, closeContextMenu]);

  // === الضغط المطول (touch + mouse) ===
  const startLongPress = useCallback((x, y) => {
    isLongPressFiredRef.current = false;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      // ✅ FIX v59.13.6: افحص أن المكوّن لا يزال متركّبًا قبل لمس الحالة
      if (!isMountedRef.current) return;
      isLongPressFiredRef.current = true;
      openContextMenu(x, y);
    }, LONG_PRESS_MS);
  }, [openContextMenu]);

  const cancelLongPress = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  // === دعم السحب الجانبي للرد ===
  // اتجاه السحب: في RTL، الرسائل الواردة (them) تُسحب من اليمين لليسار،
  // والصادرة (me) تُسحب من اليسار لليمين لتفعيل الرد.
  // نستخدم القيمة المطلقة للإزاحة للحفاظ على بساطة المنطق.
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    isSwipingRef.current = false;
    startLongPress(touch.clientX, touch.clientY);
  }, [startLongPress]);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    // لو الحركة عمودية أكبر من الأفقية، لا نتعامل كسحب
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      cancelLongPress();
      return;
    }
    if (Math.abs(dx) > 10) {
      cancelLongPress();
      isSwipingRef.current = true;
      // اتجاه السحب المسموح حسب الطرف
      // الواردة (them): يسار (dx < 0)؛ الصادرة (me): يمين (dx > 0)
      const allowed = isMe ? Math.max(0, dx) : Math.min(0, dx);
      const clamped = Math.sign(allowed) * Math.min(Math.abs(allowed), SWIPE_REPLY_MAX);
      setSwipeOffset(clamped);
    }
  }, [cancelLongPress, isMe]);

  const handleTouchEnd = useCallback(() => {
    cancelLongPress();
    if (isSwipingRef.current && Math.abs(swipeOffset) >= SWIPE_REPLY_THRESHOLD) {
      onReply?.(message);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch { /* ignore */ }
      }
    }
    isSwipingRef.current = false;
    setSwipeOffset(0);
  }, [cancelLongPress, swipeOffset, onReply, message]);

  // دعم الماوس (سطح المكتب): ضغط مطول
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    startLongPress(e.clientX, e.clientY);
  }, [startLongPress]);

  const handleMouseUp = useCallback(() => cancelLongPress(), [cancelLongPress]);
  const handleMouseLeave = useCallback(() => cancelLongPress(), [cancelLongPress]);

  // قائمة سياق على الماوس اليمين (سطح المكتب)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  }, [openContextMenu]);

  // منع click عند تنفيذ ضغط مطول
  const handleClickCapture = useCallback((e) => {
    if (isLongPressFiredRef.current || isSwipingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressFiredRef.current = false;
    }
  }, []);

  // === أكشنات القائمة السياقية ===
  const doReply = () => { onReply?.(message); closeContextMenu(); };
  const doResend = () => {
    if (onResend) onResend(message);
    else onReply?.(message); // fallback
    closeContextMenu();
  };
  const doDeleteForMe = () => {
    if (onDeleteForMe) onDeleteForMe(messageId);
    else onDelete?.(messageId, false);
    closeContextMenu();
  };
  const doDeleteForEveryone = () => {
    if (onDeleteForEveryone) onDeleteForEveryone(messageId);
    else onDelete?.(messageId, true);
    closeContextMenu();
  };
  const doEdit = () => { onEdit?.(message); closeContextMenu(); };
  const doReport = () => { onReport?.(message); closeContextMenu(); };

  // حساب اتجاه أيقونة الرد أثناء السحب
  const swipeIndicatorVisible = Math.abs(swipeOffset) > 12;
  const swipeIndicatorActive = Math.abs(swipeOffset) >= SWIPE_REPLY_THRESHOLD;

  return (
    <motion.div
      ref={(node) => { bubbleRef.current = node; registerMessageNode?.(String(messageId), node); }}
      className={`yam-message-row ${isMe ? 'me' : 'them'} ${groupedWithPrev ? 'grouped-prev' : ''} ${groupedWithNext ? 'grouped-next' : ''} ${isVoiceOnly ? 'voice-only' : ''} ${isMediaOnly ? 'media-only' : ''}`}
      data-msg-id={messageId}
      layout={!reduceMotion}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => { setShowToolbar(false); handleMouseLeave(); }}
      onContextMenu={handleContextMenu}
      onClickCapture={handleClickCapture}
      dir="rtl"
      {...rowMotion}
    >
      {/* مؤشر السحب للرد */}
      <AnimatePresence>
        {swipeIndicatorVisible && (
          <motion.div
            className={`yam-swipe-reply-indicator ${swipeIndicatorActive ? 'active' : ''} ${isMe ? 'me' : 'them'}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: swipeIndicatorActive ? 1.1 : 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              [isMe ? 'left' : 'right']: 12,
              pointerEvents: 'none',
              fontSize: 20,
              color: swipeIndicatorActive ? '#22c55e' : '#94a3b8',
              fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
            }}
            aria-hidden="true"
          >
            ↩
          </motion.div>
        )}
      </AnimatePresence>

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

      <div
        className="yam-message-stack"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwipingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <motion.div
          className={`yam-bubble ${isMe ? 'bubble-me' : 'bubble-them'} ${shouldGlow ? 'search-hit' : ''} ${showToolbar ? 'toolbar-open' : ''} ${isVoiceOnly ? 'is-voice-only' : ''} ${isMediaOnly ? 'is-media-only' : ''} ${isImageOnly ? 'is-image-only' : ''} ${isVideoOnly ? 'is-video-only' : ''}`}
          layout={!reduceMotion}
        >
          <button
            type="button"
            className="yam-bubble-more"
            aria-label="خيارات الرسالة"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              openContextMenu(rect.left, rect.bottom + 4);
            }}
            style={{ fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact?.(message, emoji);
                      setShowToolbar(false);
                    }}
                    title={`إضافة ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
                <button type="button" onClick={(e) => { e.stopPropagation(); onReply?.(message); setShowToolbar(false); }}>↩</button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {replyTarget ? (
              <motion.button
                type="button"
                className="yam-reply-preview"
                onClick={(e) => { e.stopPropagation(); onJumpToReply?.(replyTarget?.id); }}
                layout={!reduceMotion}
                {...popMotion}
              >
                <strong>↩ الرد على</strong>
                <span>{replyTarget?.content || replyTarget?.message || '...'}</span>
              </motion.button>
            ) : null}
          </AnimatePresence>

          {message?.type === 'call' || message?.call ? (
            <CallBubble
              call={{
                ...(message?.call || {}),
                mode: message?.call?.mode || message?.callMode || 'voice',
                direction: (message?.isMe || message?.sender === message?.currentUser) ? 'outgoing' : 'incoming',
                status: message?.call?.status || message?.callStatus || 'missed',
                duration_sec: message?.call?.duration_sec || message?.callDuration || 0,
                time: message?.time,
                isMe: message?.isMe,
              }}
              onCallBack={() => {
                window.dispatchEvent(new CustomEvent('yamshat:callback', { detail: message }));
              }}
            />
          ) : null}
          {isImage && message?.media_url ? (
            <button type="button" className="yam-media-button" onClick={openCurrentMedia}>
              <SafeImage src={message.media_url} alt={fileName} onOpen={openCurrentMedia} maxHeight={340} />
              <span className="yam-bubble-media-overlay">تكبير</span>
            </button>
          ) : null}

          {isVideo && message?.media_url ? (
            <button type="button" className="yam-media-button yam-video-preview-shell" onClick={openCurrentMedia}>
              <video src={message.media_url} muted playsInline className="yam-bubble-media" preload="metadata" />
              <span className="yam-bubble-media-overlay">تشغيل كامل</span>
            </button>
          ) : null}

          {isVoice && message?.media_url ? (
            <VoiceMessagePlayer
              src={message.media_url}
              seed={message?.waveform_seed || message?.created_at || messageId}
              title="رسالة صوتية"
              bubbleless
              isMe={isMe}
            />
          ) : null}

          {isFile && message?.media_url ? (
            <a href={message.media_url} target="_blank" rel="noreferrer" className="yam-file-card">
              <span className="yam-file-icon">📄</span>
              <span className="yam-file-copy">
                <strong>{fileName}</strong>
                <small>{(message?.attachments?.[0]?.mediaType || message?.type || 'FILE').toUpperCase()}</small>
              </span>
            </a>
          ) : null}

          {/* محتوى الرسالة - الإيموجي يظهر تلقائياً داخل النص */}
          {content && !message?.deleted ? (
            <>
              <div
                className="bubble-text"
                style={{
                  fontFamily: "'Noto Sans Arabic', 'Apple Color Emoji', 'Segoe UI Emoji', system-ui, sans-serif",
                  direction: 'rtl',
                  unicodeBidi: 'plaintext',
                }}
              >
                {content}
              </div>
              {/* v59.13.35 — شريط الترجمة الفورية */}
              <ChatTranslationStrip content={content} isMe={isMe} />
            </>
          ) : null}
          {message?.deleted ? <div className="bubble-deleted">تم حذف الرسالة</div> : null}

          {/* v87.10 — شارة الرسالة المُحوَّلة (Forwarded label) */}
          {(message?.forwarded_from || message?.is_forwarded || message?.forwardedFrom) ? (
            <div className="bubble-forwarded-label" aria-label="رسالة محوّلة">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 17 20 12 15 7" />
                <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
              </svg>
              <span>محوّلة{message?.forwarded_from ? ` من ${message.forwarded_from}` : ''}</span>
            </div>
          ) : null}

          <div className="bubble-meta">
            <span className="bubble-time">{formatMessageTime(message?.created_at)}</span>
            {message?.edited ? <span className="bubble-edited" title="تم التعديل">معدّلة</span> : null}
            {isMe ? (
              /* v87.10 — استبدال statusTicks الثابت بمكوّن MessageReadReceipts الديناميكي
                 الذي يعرض ✓/✓✓/✓✓-مقروءة بألوان مختلفة حسب read_at/delivered_at */
              <MessageReadReceipts
                message={message}
                currentUser={isMe ? message?.sender : undefined}
                className={`bubble-status ds-color-${statusColor(message?.status)}`}
              />
            ) : null}
          </div>
        </motion.div>

        {/* v87.10 — بانر إعادة المحاولة عند فشل الإرسال */}
        {isFailed && onResend ? (
          <MessageRetry
            message={message}
            currentUser={isMe ? message?.sender : null}
            onRetry={onResend}
          />
        ) : null}

        <AnimatePresence initial={false}>
          {topReactions.length ? (
            <motion.div className={`yam-reaction-summary ${isMe ? 'me' : 'them'}`} layout={!reduceMotion} {...popMotion}>
              {topReactions.map(([emoji, count]) => (
                <motion.button
                  key={emoji}
                  type="button"
                  layout={!reduceMotion}
                  className={`yam-reaction-chip ${reactionState?.myReaction === emoji ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onReact?.(message, emoji); }}
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

      {/* v60: القائمة المنبثقة الجديدة للجوال (تطابق التصميم المرجعي) */}
      {popupAnchor ? (
        <MessageContextPopup
          anchorRect={popupAnchor}
          isMe={isMe}
          message={message}
          onClose={closeContextMenu}
          onReact={(emoji) => { onReact?.(message, emoji); }}
          onReply={() => onReply?.(message)}
          onCopy={() => {
            const text = message?.content || message?.message || '';
            if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
              try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
            }
          }}
          onEdit={() => onEdit?.(message)}
          onResend={onResend ? () => onResend(message) : undefined}
          onDelete={() => {
            if (onDeleteForMe) onDeleteForMe(messageId);
            else onDelete?.(messageId, false);
          }}
          onDeleteForMe={() => {
            if (onDeleteForMe) onDeleteForMe(messageId);
            else onDelete?.(messageId, false);
          }}
          onDeleteForEveryone={() => {
            if (onDeleteForEveryone) onDeleteForEveryone(messageId);
            else onDelete?.(messageId, true);
          }}
        />
      ) : null}

      {/* القائمة السياقية الموحّدة (الضغط المطول / كليك يمين / زر ⋯) - سطح المكتب فقط */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="yam-context-menu"
            role="menu"
            aria-label="خيارات الرسالة"
            dir="rtl"
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999,
              background: 'rgba(20, 24, 36, 0.98)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
              minWidth: 200,
              padding: 6,
              fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
              color: '#e6e9f2',
            }}
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" role="menuitem" className="yam-ctx-item" onClick={doReply}>
              <span>↩</span><span>رد</span>
            </button>

            {(isFailed || isMe) ? (
              <button type="button" role="menuitem" className="yam-ctx-item" onClick={doResend}>
                <span>📤</span><span>إعادة إرسال إلى…</span>
              </button>
            ) : null}

            <button type="button" role="menuitem" className="yam-ctx-item" onClick={doDeleteForMe}>
              <span>🗑️</span><span>حذف لدي</span>
            </button>

            {isMe ? (
              <button type="button" role="menuitem" className="yam-ctx-item danger" onClick={doDeleteForEveryone}>
                <span>🧹</span><span>حذف لدى الجميع</span>
              </button>
            ) : null}

            {isMe && !message?.deleted && !hasMedia ? (
              <button type="button" role="menuitem" className="yam-ctx-item" onClick={doEdit}>
                <span>✏️</span><span>تعديل</span>
              </button>
            ) : null}

            {!isMe ? (
              <button type="button" role="menuitem" className="yam-ctx-item danger" onClick={doReport}>
                <span>⚠️</span><span>إبلاغ</span>
              </button>
            ) : null}

            <style>{`
              .yam-ctx-item {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: 0;
                border-radius: 10px;
                color: inherit;
                font: inherit;
                text-align: right;
                cursor: pointer;
                transition: background 0.15s ease;
              }
              .yam-ctx-item:hover, .yam-ctx-item:focus-visible {
                background: rgba(255,255,255,0.08);
                outline: none;
              }
              .yam-ctx-item.danger { color: #f87171; }
              .yam-ctx-item.danger:hover { background: rgba(248, 113, 113, 0.12); }
              .yam-ctx-item > span:first-child { font-size: 16px; width: 22px; text-align: center; }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(MessageBubble);

/* ============================================================
   v59.13.35 — مكوّن شريط الترجمة الفورية
   يظهر تحت نص الرسالة في حال اختلفت لغتها عن لغة الواجهة
   ============================================================ */
function ChatTranslationStrip({ content, isMe }) {
  const { showTranslation, loading, translated, detected, provider } = useMessageTranslation(content, { isMe });

  if (!showTranslation && !loading) return null;

  // إخفاء شريط الترجمة على رسائلي (تظهر فقط على رسائل الطرف الآخر كما في الصورة المرجعية)
  if (isMe) return null;

  if (loading) {
    return (
      <div className="yam-translation-strip is-loading" aria-live="polite">
        <span className="yam-translation-label">جارٍ الترجمة…</span>
      </div>
    );
  }

  return (
    <div
      className="yam-translation-strip"
      style={{ direction: 'rtl', unicodeBidi: 'plaintext' }}
      title={provider === 'backend' ? 'Yamshat Translate' : (provider === 'google-free' ? 'Google Translate' : 'MyMemory')}
    >
      <span className="yam-translation-label">
        تمت الترجمة تلقائياً
      </span>
      <span className="yam-translation-text">{translated}</span>
    </div>
  );
}
