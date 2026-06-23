import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { viewStory, reactToStory, replyToStory, deleteStory } from '../../api/stories.js';

/**
 * StoryViewerEnhanced — عارض ستوري احترافي.
 * -----------------------------------------------------------------
 * • RTL + خط Noto Sans Arabic.
 * • متجاوب: ملء الشاشة على الجوال، إطار مركزي 9:16 على اللابتوب.
 * • شريط تقدّم لكل ستوري داخل المجموعة (يتقدّم تلقائيًا بعد المدة).
 * • Tap يمين/يسار للتنقل (في RTL: اليسار = التالي، اليمين = السابق).
 * • Hold للإيقاف المؤقت، Swipe down للإغلاق.
 * • ردود فعل بإيموجي + رد نصي + حذف للمالك.
 * • كيبورد: ← → للتنقل، Esc للإغلاق، Space للإيقاف/الاستكمال.
 */
export default function StoryViewerEnhanced({
  group,
  allGroups = [],
  currentIndex = 0,
  onClose,
  onNextGroup,
  onPrevGroup,
  currentUserId,
}) {
  const stories = useMemo(() => group?.stories || [], [group]);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef(null);
  const startYRef = useRef(0);

  const current = stories[storyIdx];
  const STORY_MS = current?.media_type === 'video' ? 15000 : 5000;
  const STEP_MS = 50;

  // إعادة الضبط عند تغيير المجموعة
  useEffect(() => {
    setStoryIdx(0);
    setProgress(0);
    setImgError(false);
  }, [group?.user_id]);

  // عدّاد التقدّم
  useEffect(() => {
    if (!current) return;
    if (paused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (STEP_MS / STORY_MS) * 100;
        if (next >= 100) {
          clearInterval(timerRef.current);
          requestAnimationFrame(handleNextStory);
          return 0;
        }
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIdx, paused, current?.id]);

  // تسجيل المشاهدة
  useEffect(() => {
    if (current?.id) {
      viewStory(current.id).catch(() => {});
    }
  }, [current?.id]);

  const handleNextStory = useCallback(() => {
    setImgError(false);
    if (storyIdx < stories.length - 1) {
      setStoryIdx(i => i + 1);
      setProgress(0);
    } else {
      if (typeof onNextGroup === 'function') onNextGroup();
      else if (typeof onClose === 'function') onClose();
    }
  }, [storyIdx, stories.length, onNextGroup, onClose]);

  const handlePrevStory = useCallback(() => {
    setImgError(false);
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
      setProgress(0);
    } else if (typeof onPrevGroup === 'function') {
      onPrevGroup();
    }
  }, [storyIdx, onPrevGroup]);

  // كيبورد
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'ArrowRight') { handlePrevStory(); return; }  // RTL: يمين = سابق
      if (e.key === 'ArrowLeft')  { handleNextStory(); return; }  // RTL: يسار = تالي
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNextStory, handlePrevStory, onClose]);

  const handleReact = async (emoji) => {
    if (!current?.id) return;
    try { await reactToStory(current.id, emoji); } catch (_) {}
    setShowReactions(false);
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !current?.id) return;
    setReplyText('');
    try { await replyToStory(current.id, text); } catch (_) {}
  };

  const handleDelete = async () => {
    if (!current?.id) return;
    if (!window.confirm('حذف هذه القصة؟')) return;
    try {
      await deleteStory(current.id);
      handleNextStory();
    } catch (_) {
      alert('تعذّر الحذف.');
    }
  };

  if (!current) return null;
  const isOwner = group?.is_self || (currentUserId && current?.user_id === currentUserId);

  return (
    <motion.div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="عارض الستوري"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="yam-story-viewer"
      onTouchStart={(e) => { startYRef.current = e.touches[0].clientY; }}
      onTouchEnd={(e) => {
        const dy = e.changedTouches[0].clientY - startYRef.current;
        if (dy > 80) onClose?.();
      }}
    >
      <div className="yam-story-stage">
        {/* أشرطة التقدّم */}
        <div className="yam-progress-row">
          {stories.map((_, i) => (
            <div key={i} className="yam-progress-track">
              <div
                className="yam-progress-fill"
                style={{
                  width: i < storyIdx ? '100%' : (i === storyIdx ? `${progress}%` : '0%'),
                }}
              />
            </div>
          ))}
        </div>

        {/* الهيدر */}
        <div className="yam-story-header">
          <img
            className="yam-story-avatar-sm"
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || 'user')}&background=8b5cf6&color=fff`}
            alt=""
          />
          <div className="yam-story-meta">
            <strong>{group?.username || 'مستخدم'}</strong>
            <span className="yam-story-time">{formatTime(current?.created_at)}</span>
          </div>
          {current?.privacy === 'close_friends' && (
            <span className="yam-story-badge yam-cf" title="أصدقاء مقربون">💚</span>
          )}
          {isOwner && (
            <button
              type="button"
              className="yam-story-icon-btn"
              onClick={handleDelete}
              aria-label="حذف القصة"
              title="حذف"
            >🗑️</button>
          )}
          <button
            type="button"
            className="yam-story-icon-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >✕</button>
        </div>

        {/* الوسائط */}
        <div
          className="yam-story-media-wrap"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {current.media_type === 'video' ? (
            <video
              src={current.media_url}
              autoPlay
              playsInline
              muted={false}
              onEnded={handleNextStory}
              onError={() => setImgError(true)}
              className="yam-story-media"
            />
          ) : (
            <img
              src={current.media_url}
              alt={current.caption || ''}
              className="yam-story-media"
              onError={() => setImgError(true)}
            />
          )}

          {imgError && (
            <div className="yam-story-error">
              <span>تعذّر تحميل الوسائط.</span>
            </div>
          )}

          {/* الكابشن */}
          {current.caption && (
            <div className="yam-story-caption">{current.caption}</div>
          )}

          {/* مناطق التنقّل (في RTL النص يمين = سابق، يسار = تالي) */}
          <button
            type="button"
            aria-label="السابقة"
            className="yam-story-tap yam-tap-prev"
            onClick={handlePrevStory}
          />
          <button
            type="button"
            aria-label="التالية"
            className="yam-story-tap yam-tap-next"
            onClick={handleNextStory}
          />
        </div>

        {/* الفوتر — رد + ردود فعل */}
        {!isOwner && (
          <div className="yam-story-footer">
            <input
              type="text"
              dir="rtl"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
              placeholder={`الرد على ${group?.username || ''}…`}
              className="yam-story-reply"
              aria-label="رد على القصة"
            />
            <button
              type="button"
              className="yam-story-react-btn"
              onClick={() => setShowReactions(s => !s)}
              aria-label="اختيار ردّ فعل"
            >😍</button>
            {replyText.trim() && (
              <button
                type="button"
                className="yam-story-send-btn"
                onClick={handleSendReply}
                aria-label="إرسال"
              >➤</button>
            )}
            {showReactions && (
              <div className="yam-reactions-bar">
                {['❤️','🔥','😂','😮','😢','👏','💯'].map(emo => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => handleReact(emo)}
                    aria-label={`تفاعل ${emo}`}
                  >{emo}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* لصاحب القصة — عدّاد المشاهدات */}
        {isOwner && (
          <div className="yam-story-owner-info">
            👁 {current.views_count || 0} مشاهدة
            {current.reactions_count ? ` • 💖 ${current.reactions_count}` : ''}
            {current.replies_count ? ` • 💬 ${current.replies_count}` : ''}
          </div>
        )}
      </div>

      <style>{viewerStyles}</style>
    </motion.div>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `قبل ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `قبل ${hrs} س`;
    return d.toLocaleDateString('ar');
  } catch (_) { return ''; }
}

const viewerStyles = `
.yam-story-viewer {
  font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.96);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.yam-story-stage {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  background: #000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* على اللابتوب: إطار 9:16 في المنتصف */
@media (min-width: 900px) {
  .yam-story-viewer { padding: 20px; }
  .yam-story-stage {
    max-width: 420px;
    max-height: 92vh;
    aspect-ratio: 9 / 16;
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  }
}
@media (min-width: 1280px) {
  .yam-story-stage { max-width: 460px; }
}

.yam-progress-row {
  display: flex;
  gap: 4px;
  padding: 10px 12px 0;
  z-index: 3;
}
.yam-progress-track {
  flex: 1;
  height: 2.5px;
  background: rgba(255,255,255,0.28);
  border-radius: 2px;
  overflow: hidden;
}
.yam-progress-fill {
  height: 100%;
  background: #fff;
  transition: width 50ms linear;
}

.yam-story-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: #fff;
  z-index: 3;
}
.yam-story-avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.85);
}
.yam-story-meta { display: flex; flex-direction: column; line-height: 1.15; }
.yam-story-meta strong { font-size: 14px; font-weight: 700; }
.yam-story-time { font-size: 11px; opacity: 0.75; }
.yam-story-badge {
  margin-inline-start: auto;
  font-size: 18px;
  padding: 2px 8px;
  background: rgba(34,197,94,0.18);
  border-radius: 10px;
}
.yam-story-badge.yam-cf + .yam-story-icon-btn { margin-inline-start: 6px; }
.yam-story-icon-btn {
  background: rgba(255,255,255,0.08);
  border: none;
  color: #fff;
  font-size: 16px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-inline-start: 4px;
}
.yam-story-icon-btn:hover { background: rgba(255,255,255,0.16); }
.yam-story-header > .yam-story-icon-btn:last-child { margin-inline-start: auto; }
.yam-story-header > .yam-story-badge + .yam-story-icon-btn:last-child,
.yam-story-header > .yam-story-icon-btn + .yam-story-icon-btn:last-child {
  margin-inline-start: 4px;
}

.yam-story-media-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  user-select: none;
  touch-action: pan-y;
}
.yam-story-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.yam-story-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0,0,0,0.6);
  font-size: 14px;
}

.yam-story-caption {
  position: absolute;
  bottom: 14px;
  inset-inline-start: 16px;
  inset-inline-end: 16px;
  color: #fff;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(8px);
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  text-align: start;
}

.yam-story-tap {
  position: absolute;
  top: 0; bottom: 0;
  width: 30%;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 2;
}
.yam-tap-prev { inset-inline-start: 0; }
.yam-tap-next { inset-inline-end: 0; }

.yam-story-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 14px;
  position: relative;
  z-index: 3;
}
.yam-story-reply {
  flex: 1;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  color: #fff;
  border-radius: 22px;
  padding: 11px 16px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}
.yam-story-reply::placeholder { color: rgba(255,255,255,0.5); }
.yam-story-reply:focus { border-color: rgba(139,92,246,0.7); }
.yam-story-react-btn, .yam-story-send-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}
.yam-story-send-btn {
  background: #8b5cf6;
  transform: scaleX(-1); /* السهم يشير للشمال في RTL */
}
.yam-reactions-bar {
  position: absolute;
  bottom: 64px;
  inset-inline-end: 14px;
  background: rgba(20,20,28,0.95);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.yam-reactions-bar button {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.15s;
}
.yam-reactions-bar button:hover { transform: scale(1.3); }

.yam-story-owner-info {
  padding: 12px 16px;
  color: #fff;
  font-size: 13px;
  opacity: 0.85;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.08);
}

@media (max-width: 380px) {
  .yam-story-reply { font-size: 13px; padding: 9px 14px; }
  .yam-story-meta strong { font-size: 13px; }
}
`;
