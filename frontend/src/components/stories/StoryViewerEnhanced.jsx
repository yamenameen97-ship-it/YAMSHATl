import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  viewStory,
  reactToStory,
  replyToStory,
  deleteStory,
  getStoryViewers,
  voteStoryPoll,
  downloadStoryMedia,
  toggleStoryHighlight,
} from '../../api/stories.js';
// ✅ v59.13.16 FIX #2: إضافة زر إبلاغ في عارض الستوري لقصص الآخرين
import ReportModal from '../reports/ReportModal.jsx';
// ✅ v59.13.27 FIX: safety-net لتحويل media_url النسبي إلى رابط مطلق
// قبل تمريره لـ<img>/<video> — يحمي من حالات الـoptimistic update
// أو القصص الواردة من مصادر لم تمر عبر api/stories.js (مثل cache قديم).
import { resolveMediaUrl } from '../../config/mediaConfig.js';

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
  // v59.10: تحسينات
  const [muted, setMuted] = useState(false);                  // كتم صوت الفيديو
  const [showViewers, setShowViewers] = useState(false);      // Modal المشاهدين
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [pollMyVote, setPollMyVote] = useState(null);         // تصويت المستخدم على الاستطلاع
  const [pollVotes, setPollVotes] = useState({});             // عدد الأصوات
  const [toast, setToast] = useState('');
  // ✅ v59.13.16 FIX #2: حالة فتح مودال إبلاغ الستوري
  const [showReport, setShowReport] = useState(false);
  const timerRef = useRef(null);
  const startYRef = useRef(0);
  const longPressRef = useRef(null);                          // لتمييز long-press عن click
  // ✅ FIX v59.13.4: مرجع لعنصر <video> للتحكم الفعلي بالتشغيل/الإيقاف
  const videoElRef = useRef(null);
  // ✅ FIX v59.13.6: تتبّع مؤقّت التوست + حارس isMounted لمنع setState على مكوّن مُزال
  const toastTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // دالة موحَّدة لعرض التوست: تُلغي المؤقّت السابق وتُسجّل المؤقّت الجديد
  const showToast = useCallback((message, duration = 2500, onAfter) => {
    if (!isMountedRef.current) return;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(message);
    toastTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setToast('');
      toastTimerRef.current = null;
      if (typeof onAfter === 'function') onAfter();
    }, duration);
  }, []);

  // cleanup نهائي عند unmount: إلغاء مؤقّت التوست + الـ long-press + ضبط isMounted=false
  useEffect(() => () => {
    isMountedRef.current = false;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const rawCurrent = stories[storyIdx];
  // ✅ v59.13.27: تطبيع media_url قبل أي استخدام في الـrender أو الـAPI calls.
  // إذا كان الرابط نسبياً (/uploads/xxx) يتم تحويله إلى BACKEND_ORIGIN/uploads/xxx.
  // إذا كان blob:/data: أو مطلقاً مسبقاً يبقى كما هو.
  const current = useMemo(() => {
    if (!rawCurrent) return rawCurrent;
    const fixedMedia = resolveMediaUrl(rawCurrent.media_url || rawCurrent.media || '');
    return {
      ...rawCurrent,
      media_url: fixedMedia || rawCurrent.media_url || '',
      media: fixedMedia || rawCurrent.media || '',
    };
  }, [rawCurrent]);
  const STORY_MS = current?.media_type === 'video' ? 15000 : 5000;
  const STEP_MS = 50;

  // إعادة الضبط عند تغيير المجموعة
  // ✅ v59.13.13 FIX #2: مسح مسودة الرد + لوحة التفاعلات + حالة الإيقاف عند تبديل صاحب الستوري
  //                       الخلل السابق: المستخدم يكتب رداً لـ User A ثم ينتقل لـ User B
  //                       → النص يبقى وقد يُرسل للشخص الخطأ! (Privacy leak)
  useEffect(() => {
    setStoryIdx(0);
    setProgress(0);
    setImgError(false);
    setShowViewers(false);
    setReplyText('');
    setShowReactions(false);
    setPaused(false);
  }, [group?.user_id]);

  // v59.10: تحميل حالة التصويت عند تغيير القصة
  useEffect(() => {
    if (current) {
      setPollMyVote(current.my_vote ?? null);
      setPollVotes(current.poll_votes || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // ✅ FIX v59.13.4: مزامنة حالة الفيديو الفعلية مع حالة paused / muted
  // السلوك السابق: long-press كان يوقف فقط مؤقت التقدم لكن الفيديو يستمر!
  useEffect(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.muted = muted;
    if (paused) {
      if (!v.paused) { try { v.pause(); } catch { /* ignore */ } }
    } else {
      if (v.paused) { v.play?.().catch(() => {}); }
    }
  }, [paused, muted, current?.id]);

  // تنظيف الفيديو عند الانتقال بين القصص أو unmount
  useEffect(() => () => {
    const v = videoElRef.current;
    if (v && !v.paused) { try { v.pause(); } catch { /* ignore */ } }
  }, [current?.id]);

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
    // ✅ FIX v59.13.8 (#5): حارس mount بعد الـ await
    //    (العارض قد يغلق الـ onClose ثم يصل رد الـ reactToStory)
    if (!isMountedRef.current) return;
    setShowReactions(false);
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !current?.id) return;
    setReplyText('');
    try { await replyToStory(current.id, text); } catch (_) {}
    // لا حاجة لـ setState بعد await هنا (setReplyText تمّت قبل الـ await).
  };

  const handleDelete = async () => {
    if (!current?.id) return;
    if (!window.confirm('حذف هذه القصة؟')) return;
    try {
      await deleteStory(current.id);
      // ✅ FIX v59.13.8 (#5): تجنّب setState بعد unmount
      if (!isMountedRef.current) return;
      handleNextStory();
    } catch (_) {
      if (!isMountedRef.current) return;
      showToast('تعذّر الحذف');
    }
  };

  // v59.10: تنزيل القصة إلى الجهاز
  const handleDownload = async () => {
    if (!current?.media_url) return;
    setPaused(true);
    const ok = await downloadStoryMedia(
      current.media_url,
      `story-${current.username || 'user'}-${current.id}`,
    );
    showToast(ok ? 'تم الحفظ ✓' : 'تعذّر التنزيل', 2500, () => {
      if (isMountedRef.current) setPaused(false);
    });
  };

  // v59.10: أرشفة كـ highlight
  const handleHighlight = async () => {
    if (!current?.id) return;
    const title = window.prompt('عنوان اللحظة المميزة (اختياري):', current.highlight_title || '');
    if (title === null) return;
    try {
      await toggleStoryHighlight(current.id, title || '');
      // ✅ FIX v59.13.8 (#5): حارس mount
      if (!isMountedRef.current) return;
      showToast(current.highlight ? 'تمت إزالة الإبراز ✓' : 'تمت الإضافة للإبراز ✓');
    } catch (_) {
      if (!isMountedRef.current) return;
      showToast('تعذّر التحديث');
    }
  };

  // v59.10: عرض قائمة المشاهدين (للمالك فقط)
  const handleShowViewers = async () => {
    if (!current?.id) return;
    setShowViewers(true);
    setPaused(true);
    setLoadingViewers(true);
    try {
      const res = await getStoryViewers(current.id);
      // ✅ FIX v59.13.8 (#5): حارس mount بعد الـ await الشبكي
      if (!isMountedRef.current) return;
      setViewers(res?.data?.viewers || []);
    } catch (_) {
      if (!isMountedRef.current) return;
      setViewers([]);
    } finally {
      if (isMountedRef.current) setLoadingViewers(false);
    }
  };

  const handleCloseViewers = () => {
    setShowViewers(false);
    setPaused(false);
  };

  // v59.10: التصويت على الاستطلاع
  const handleVotePoll = async (optionIndex) => {
    if (!current?.id) return;
    if (pollMyVote === optionIndex) return; // لا تكرار لنفس الخيار
    // تحديث متفائل (optimistic)
    setPollVotes(prev => {
      const next = { ...prev };
      if (pollMyVote !== null && pollMyVote !== undefined) {
        const prevKey = String(pollMyVote);
        next[prevKey] = Math.max(0, (next[prevKey] || 0) - 1);
      }
      const newKey = String(optionIndex);
      next[newKey] = (next[newKey] || 0) + 1;
      return next;
    });
    setPollMyVote(optionIndex);
    try {
      const res = await voteStoryPoll(current.id, optionIndex);
      // ✅ FIX v59.13.8 (#5): تجنّب setState بعد unmount
      //    (فترة الإفصاح عن النتيجة قد تصل بعد إغلاق العارض
      //    → setPollVotes على مكوّن مُزال + التحديث المتفائل يبقى دون مزامنة)
      if (!isMountedRef.current) return;
      setPollVotes(res?.data?.poll_votes || {});
    } catch (_) {
      if (!isMountedRef.current) return;
      showToast('تعذّر التصويت');
    }
  };

  // v59.10: long-press للإيقاف بدل mousedown عادي
  const handlePressStart = () => {
    longPressRef.current = setTimeout(() => setPaused(true), 180);
  };
  const handlePressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setPaused(false);
  };

  if (!current) return null;
  const isOwner = group?.is_self || (currentUserId && current?.user_id === currentUserId);
  const hasPoll = current.poll_question && Array.isArray(current.poll_options) && current.poll_options.length >= 2;
  const totalPollVotes = Object.values(pollVotes || {}).reduce((s, n) => s + (n || 0), 0);

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
        {/* ✅ v85.4 FIX #1: أفاتار مالك القصة الحقيقي من الباكاند
            (سابقاً: ui-avatars.com دائماً → أفاتار المستخدم غير مرئي) */}
        <div className="yam-story-header">
          <img
            className="yam-story-avatar-sm"
            src={
              group?.user_avatar
              || group?.avatar_url
              || current?.user_avatar
              || current?.avatar_url
              || `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || 'user')}&background=8b5cf6&color=fff`
            }
            alt=""
            onError={(e) => {
              const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || 'user')}&background=8b5cf6&color=fff`;
              if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
            }}
          />
          <div className="yam-story-meta">
            <strong>{group?.username || 'مستخدم'}</strong>
            <span className="yam-story-time">{formatTime(current?.created_at)}</span>
          </div>
          {current?.privacy === 'close_friends' && (
            <span className="yam-story-badge yam-cf" title="أصدقاء مقربون">💚</span>
          )}
          {/* v59.10: زر كتم الصوت للفيديو */}
          {current.media_type === 'video' && (
            <button
              type="button"
              className="yam-story-icon-btn"
              onClick={() => setMuted(m => !m)}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >{muted ? '🔇' : '🔊'}</button>
          )}
          {isOwner && (
            <>
              <button
                type="button"
                className="yam-story-icon-btn"
                onClick={handleHighlight}
                aria-label="إبراز"
                title={current.highlight ? 'إزالة الإبراز' : 'إبراز'}
              >{current.highlight ? '⭐' : '☆'}</button>
              <button
                type="button"
                className="yam-story-icon-btn"
                onClick={handleDelete}
                aria-label="حذف القصة"
                title="حذف"
              >🗑️</button>
            </>
          )}
          {/* ✅ v59.13.16 FIX #2: زر إبلاغ لقصص الآخرين فقط */}
          {!isOwner && (
            <button
              type="button"
              className="yam-story-icon-btn"
              onClick={() => { setPaused(true); setShowReport(true); }}
              aria-label="إبلاغ عن القصة"
              title="إبلاغ"
            >🚩</button>
          )}
          <button
            type="button"
            className="yam-story-icon-btn"
            onClick={handleDownload}
            aria-label="تنزيل"
            title="تنزيل في الجهاز"
          >⬇</button>
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
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {current.media_type === 'video' ? (
            <video
              ref={videoElRef}
              src={current.media_url}
              autoPlay
              playsInline
              muted={muted}
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

          {/* v59.10: الاستطلاع */}
          {hasPoll && (
            <div className="yam-story-poll" onClick={(e) => e.stopPropagation()}>
              <div className="yam-story-poll-question">{current.poll_question}</div>
              <div className="yam-story-poll-options">
                {current.poll_options.map((opt, idx) => {
                  const count = pollVotes[String(idx)] || 0;
                  const pct = totalPollVotes > 0 ? Math.round((count / totalPollVotes) * 100) : 0;
                  const mine = pollMyVote === idx;
                  const showResults = pollMyVote !== null && pollMyVote !== undefined;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`yam-poll-option ${mine ? 'mine' : ''} ${showResults ? 'voted' : ''}`}
                      onClick={() => handleVotePoll(idx)}
                      disabled={isOwner}
                    >
                      {showResults && (
                        <span
                          className="yam-poll-bar"
                          style={{ width: `${pct}%` }}
                          aria-hidden
                        />
                      )}
                      <span className="yam-poll-text">
                        {opt} {mine && '✓'}
                      </span>
                      {showResults && <span className="yam-poll-pct">{pct}%</span>}
                    </button>
                  );
                })}
              </div>
              {totalPollVotes > 0 && (
                <div className="yam-poll-total">{totalPollVotes} مصوت</div>
              )}
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

        {/* لصاحب القصة — عدّاد المشاهدات (قابل للنقر لعرض القائمة) */}
        {isOwner && (
          <button
            type="button"
            className="yam-story-owner-info clickable"
            onClick={handleShowViewers}
            aria-label="عرض المشاهدين"
          >
            👁 {current.views_count || 0} مشاهدة
            {current.reactions_count ? ` • 💖 ${current.reactions_count}` : ''}
            {current.replies_count ? ` • 💬 ${current.replies_count}` : ''}
            <span className="yam-story-chevron">›</span>
          </button>
        )}

        {/* v59.10: Toast */}
        {toast && <div className="yam-viewer-toast">{toast}</div>}

        {/* v59.10: Modal قائمة المشاهدين */}
        <AnimatePresence>
          {showViewers && (
            <motion.div
              className="yam-viewers-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <div className="yam-viewers-handle" />
              <div className="yam-viewers-header">
                <strong>المشاهدون ({viewers.length})</strong>
                <button type="button" onClick={handleCloseViewers} aria-label="إغلاق">✕</button>
              </div>
              <div className="yam-viewers-list">
                {loadingViewers && (
                  <div className="yam-viewers-empty">جاري التحميل…</div>
                )}
                {!loadingViewers && viewers.length === 0 && (
                  <div className="yam-viewers-empty">لم يشاهد القصة أحد بعد</div>
                )}
                {!loadingViewers && viewers.map((v, i) => (
                  <div key={`${v.username}-${i}`} className="yam-viewer-row">
                    <img
                      src={v.avatar_url}
                      alt=""
                      className="yam-viewer-avatar"
                      loading="lazy"
                    />
                    <div className="yam-viewer-info">
                      <strong>{v.username}</strong>
                      <span>{formatTime(v.viewed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{viewerStyles}</style>

      {/* ✅ v59.13.16 FIX #2: مودال الإبلاغ للستوري */}
      <ReportModal
        open={showReport}
        onClose={() => { setShowReport(false); setPaused(false); }}
        targetType="story"
        targetId={current?.id}
        targetLabel={`قصة @${group?.username || ''}`}
      />
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
  background: transparent;
  border-left: 0; border-right: 0; border-bottom: 0;
  font-family: inherit;
  width: 100%;
  cursor: default;
}
.yam-story-owner-info.clickable {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.yam-story-owner-info.clickable:hover { opacity: 1; background: rgba(255,255,255,0.04); }
.yam-story-chevron { font-size: 18px; opacity: 0.7; }

/* v59.10: الاستطلاع */
.yam-story-poll {
  position: absolute;
  bottom: 80px;
  inset-inline-start: 16px;
  inset-inline-end: 16px;
  background: rgba(15,15,20,0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 12px;
  z-index: 3;
}
.yam-story-poll-question {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
}
.yam-story-poll-options { display: flex; flex-direction: column; gap: 6px; }
.yam-poll-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px;
  color: #fff;
  font-size: 13.5px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  overflow: hidden;
}
.yam-poll-option:disabled { cursor: default; }
.yam-poll-option.mine { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.18); }
.yam-poll-bar {
  position: absolute;
  top: 0; bottom: 0;
  inset-inline-start: 0;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.55), rgba(236, 72, 153, 0.35));
  z-index: 0;
  transition: width 0.4s ease-out;
}
.yam-poll-text { position: relative; z-index: 1; }
.yam-poll-pct { position: relative; z-index: 1; font-weight: 800; }
.yam-poll-total { text-align: center; color: rgba(255,255,255,0.65); font-size: 11px; margin-top: 8px; }

/* v59.10: Toast */
.yam-viewer-toast {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 15, 20, 0.95);
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  z-index: 10;
  border: 1px solid rgba(139, 92, 246, 0.4);
}

/* v59.10: Bottom Sheet للمشاهدين */
.yam-viewers-sheet {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  max-height: 70%;
  background: #14141c;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.yam-viewers-handle {
  width: 44px; height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  margin: 8px auto 0;
}
.yam-viewers-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.yam-viewers-header strong { font-size: 15px; }
.yam-viewers-header button {
  background: transparent; border: none; color: #fff;
  font-size: 18px; cursor: pointer; padding: 4px 8px;
}
.yam-viewers-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 16px;
}
.yam-viewer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
}
.yam-viewer-row:hover { background: rgba(255,255,255,0.04); }
.yam-viewer-avatar {
  width: 42px; height: 42px;
  border-radius: 50%;
  object-fit: cover;
  background: #1a1a22;
}
.yam-viewer-info { display: flex; flex-direction: column; line-height: 1.3; }
.yam-viewer-info strong { font-size: 14px; color: #fff; }
.yam-viewer-info span { font-size: 11.5px; color: rgba(255,255,255,0.55); }
.yam-viewers-empty {
  text-align: center; color: rgba(255,255,255,0.5);
  padding: 32px 16px; font-size: 13px;
}

@media (max-width: 380px) {
  .yam-story-reply { font-size: 13px; padding: 9px 14px; }
  .yam-story-meta strong { font-size: 13px; }
}
`;
