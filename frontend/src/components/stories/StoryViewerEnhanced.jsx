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
  muteUserStories,
  unmuteUserStories,
} from '../../api/stories.js';
import ReportModal from '../reports/ReportModal.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';

function getCountdownData(value, now = Date.now()) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return { expired: true, label: 'انتهى العد التنازلي', shortLabel: 'انتهى', target };
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const shortParts = [];
  if (days > 0) shortParts.push(`${days}ي`);
  if (hours > 0 || days > 0) shortParts.push(`${hours}س`);
  shortParts.push(`${minutes}د`);
  if (days === 0) shortParts.push(`${String(seconds).padStart(2, '0')}ث`);
  return { expired: false, label: shortParts.join(' '), shortLabel: shortParts.join(' '), target };
}

function extractDecorations(story) {
  const stickers = Array.isArray(story?.stickers) ? story.stickers : [];
  const locationText = stickers.find((s) => String(s).startsWith('location::'))?.replace('location::', '') || '';
  const questionText = stickers.find((s) => String(s).startsWith('question::'))?.replace('question::', '') || '';
  const emojiStickers = stickers.filter((s) => !String(s).includes('::'));
  return {
    locationText,
    questionText,
    emojiStickers,
    mentions: Array.isArray(story?.mentions) ? story.mentions : [],
  };
}

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
  const [muted, setMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewerReactions, setViewerReactions] = useState([]);
  const [viewerReplies, setViewerReplies] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [pollMyVote, setPollMyVote] = useState(null);
  const [pollVotes, setPollVotes] = useState({});
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [toast, setToast] = useState('');
  const [isStoryMuted, setIsStoryMuted] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const timerRef = useRef(null);
  const longPressRef = useRef(null);
  const startYRef = useRef(0);
  const videoElRef = useRef(null);
  const toastTimerRef = useRef(null);
  const musicAudioRef = useRef(null);
  const isMountedRef = useRef(true);

  const rawCurrent = stories[storyIdx];
  const current = useMemo(() => {
    if (!rawCurrent) return rawCurrent;
    const fixedMedia = resolveMediaUrl(rawCurrent.media_url || rawCurrent.media || '');
    return {
      ...rawCurrent,
      media_url: fixedMedia || rawCurrent.media_url || '',
      media: fixedMedia || rawCurrent.media || '',
      user_avatar: resolveMediaUrl(rawCurrent.user_avatar || rawCurrent.avatar_url || ''),
      avatar_url: resolveMediaUrl(rawCurrent.avatar_url || rawCurrent.user_avatar || ''),
    };
  }, [rawCurrent]);

  const STORY_MS = current?.media_type === 'video' ? 15000 : 5000;
  const STEP_MS = 50;
  const decoration = useMemo(() => extractDecorations(current), [current]);
  const isOwner = group?.is_self || (currentUserId && current?.user_id === currentUserId);
  const hasPoll = current?.poll_question && Array.isArray(current?.poll_options) && current.poll_options.length >= 2;
  const totalPollVotes = Object.values(pollVotes || {}).reduce((s, n) => s + (n || 0), 0);
  const countdownData = getCountdownData(current?.countdown_at, countdownNow);

  const showToast = useCallback((message, duration = 2500, onAfter) => {
    if (!isMountedRef.current) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setToast('');
      toastTimerRef.current = null;
      if (typeof onAfter === 'function') onAfter();
    }, duration);
  }, []);

  useEffect(() => () => {
    isMountedRef.current = false;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
  }, []);

  useEffect(() => {
    setStoryIdx(0);
    setProgress(0);
    setImgError(false);
    setShowViewers(false);
    setReplyText('');
    setShowReactions(false);
    setPaused(false);
  }, [group?.user_id]);

  useEffect(() => {
    if (current) {
      setPollMyVote(current.my_vote ?? null);
      setPollVotes(current.poll_votes || {});
      setIsStoryMuted(!!current.is_muted_by_viewer);
    }
  }, [current?.id]);

  useEffect(() => {
    if (!current?.countdown_at) return undefined;
    setCountdownNow(Date.now());
    const timer = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [current?.id, current?.countdown_at]);

  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }
    if (current?.music_url && !musicMuted) {
      const audio = new Audio(current.music_url);
      audio.volume = 0.35;
      audio.loop = true;
      audio.play().catch(() => {});
      musicAudioRef.current = audio;
    }
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, [current?.id, current?.music_url, musicMuted]);

  useEffect(() => {
    const v = videoElRef.current;
    if (!v) return;
    v.muted = muted;
    if (paused) {
      if (!v.paused) v.pause();
    } else if (v.paused) {
      v.play?.().catch(() => {});
    }
  }, [paused, muted, current?.id]);

  useEffect(() => {
    if (!current) return;
    if (paused) {
      clearInterval(timerRef.current);
      return undefined;
    }
    timerRef.current = setInterval(() => {
      setProgress((p) => {
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
  }, [storyIdx, paused, current?.id]);

  useEffect(() => {
    if (current?.id) viewStory(current.id).catch(() => {});
  }, [current?.id]);

  const handleNextStory = useCallback(() => {
    setImgError(false);
    if (storyIdx < stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (typeof onNextGroup === 'function') onNextGroup();
    else if (typeof onClose === 'function') onClose();
  }, [storyIdx, stories.length, onNextGroup, onClose]);

  const handlePrevStory = useCallback(() => {
    setImgError(false);
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (typeof onPrevGroup === 'function') onPrevGroup();
  }, [storyIdx, onPrevGroup]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'ArrowRight') { handlePrevStory(); return; }
      if (e.key === 'ArrowLeft') { handleNextStory(); return; }
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNextStory, handlePrevStory, onClose]);

  const handleReact = async (emoji) => {
    if (!current?.id) return;
    try { await reactToStory(current.id, emoji); } catch {}
    if (!isMountedRef.current) return;
    setShowReactions(false);
    showToast(`تم التفاعل ${emoji}`);
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !current?.id) return;
    setReplyText('');
    try { await replyToStory(current.id, text); showToast('تم إرسال الرد'); } catch { showToast('تعذّر إرسال الرد'); }
  };

  const handleDelete = async () => {
    if (!current?.id) return;
    if (!window.confirm('حذف هذه القصة؟')) return;
    try {
      await deleteStory(current.id);
      if (!isMountedRef.current) return;
      handleNextStory();
    } catch {
      if (!isMountedRef.current) return;
      showToast('تعذّر الحذف');
    }
  };

  const handleDownload = async () => {
    if (!current?.media_url) return;
    setPaused(true);
    const ok = await downloadStoryMedia(current.media_url, `story-${current.username || 'user'}-${current.id}`);
    showToast(ok ? 'تم الحفظ ✓' : 'تعذّر التنزيل', 2500, () => { if (isMountedRef.current) setPaused(false); });
  };

  const handleHighlight = async () => {
    if (!current?.id) return;
    const title = window.prompt('عنوان اللحظة المميزة (اختياري):', current.highlight_title || '');
    if (title === null) return;
    try {
      await toggleStoryHighlight(current.id, title || '');
      if (!isMountedRef.current) return;
      showToast(current.highlight ? 'تمت إزالة الإبراز ✓' : 'تمت الإضافة للإبراز ✓');
    } catch {
      if (!isMountedRef.current) return;
      showToast('تعذّر التحديث');
    }
  };

  const handleShowViewers = async () => {
    if (!current?.id) return;
    setShowViewers(true);
    setPaused(true);
    setLoadingViewers(true);
    try {
      const res = await getStoryViewers(current.id);
      if (!isMountedRef.current) return;
      setViewers(res?.data?.viewers || []);
      setViewerReactions(res?.data?.reactions || []);
      setViewerReplies(res?.data?.replies || []);
    } catch {
      if (!isMountedRef.current) return;
      setViewers([]);
      setViewerReactions([]);
      setViewerReplies([]);
    } finally {
      if (isMountedRef.current) setLoadingViewers(false);
    }
  };

  const handleCloseViewers = () => {
    setShowViewers(false);
    setPaused(false);
  };

  const handleVotePoll = async (optionIndex) => {
    if (!current?.id || pollMyVote === optionIndex) return;
    setPollVotes((prev) => {
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
      if (!isMountedRef.current) return;
      setPollVotes(res?.data?.poll_votes || {});
    } catch {
      if (!isMountedRef.current) return;
      showToast('تعذّر التصويت');
    }
  };

  const handleMuteUserStories = async () => {
    if (!group?.username) return;
    try {
      if (isStoryMuted) {
        await unmuteUserStories(group.username);
        if (!isMountedRef.current) return;
        setIsStoryMuted(false);
        showToast('تم إلغاء كتم القصص ✓');
      } else {
        await muteUserStories(group.username);
        if (!isMountedRef.current) return;
        setIsStoryMuted(true);
        showToast('تم كتم قصص هذا المستخدم ✓');
      }
    } catch {
      if (!isMountedRef.current) return;
      showToast('تعذّر التحديث');
    }
  };

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
      onTouchEnd={(e) => { if (e.changedTouches[0].clientY - startYRef.current > 80) onClose?.(); }}
    >
      <div className="yam-story-stage">
        <div className="yam-progress-row">
          {stories.map((_, i) => (
            <div key={i} className="yam-progress-track"><div className="yam-progress-fill" style={{ width: i < storyIdx ? '100%' : (i === storyIdx ? `${progress}%` : '0%') }} /></div>
          ))}
        </div>

        <div className="yam-story-header">
          <img className="yam-story-avatar-sm" src={group?.user_avatar || group?.avatar_url || current?.user_avatar || current?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || 'user')}&background=8b5cf6&color=fff`} alt="" onError={(e) => { const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.username || 'user')}&background=8b5cf6&color=fff`; if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback; }} />
          <div className="yam-story-meta"><strong>{group?.username || 'مستخدم'}</strong><span className="yam-story-time">{formatTime(current?.created_at)}</span></div>
          {current?.privacy === 'close_friends' && <span className="yam-story-badge yam-cf">💚</span>}
          {current.media_type === 'video' && <button type="button" className="yam-story-icon-btn" onClick={() => setMuted((m) => !m)}>{muted ? '🔇' : '🔊'}</button>}
          {current?.music_url && <button type="button" className="yam-story-icon-btn" onClick={() => setMusicMuted((m) => !m)}>{musicMuted ? '🎵' : '🎶'}</button>}
          {!isOwner && <button type="button" className="yam-story-icon-btn" onClick={handleMuteUserStories}>{isStoryMuted ? '🔕' : '🔕'}</button>}
          {isOwner && (
            <>
              <button type="button" className="yam-story-icon-btn" onClick={handleHighlight}>{current.highlight ? '⭐' : '☆'}</button>
              <button type="button" className="yam-story-icon-btn" onClick={handleDelete}>🗑️</button>
            </>
          )}
          {!isOwner && <button type="button" className="yam-story-icon-btn" onClick={() => { setPaused(true); setShowReport(true); }}>🚩</button>}
          <button type="button" className="yam-story-icon-btn" onClick={handleDownload}>⬇</button>
          <button type="button" className="yam-story-icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="yam-story-media-wrap" onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}>
          {current.media_type === 'video' ? (
            <video ref={videoElRef} src={current.media_url} autoPlay playsInline muted={muted} onEnded={handleNextStory} onError={() => setImgError(true)} className="yam-story-media" />
          ) : (
            <img src={current.media_url} alt={current.caption || ''} className="yam-story-media" onError={() => setImgError(true)} />
          )}

          {imgError && <div className="yam-story-error"><span>تعذّر تحميل الوسائط.</span></div>}

          {decoration.locationText && <div className="yam-story-location">📍 {decoration.locationText}</div>}
          {decoration.mentions.length > 0 && <div className="yam-story-mentions">{decoration.mentions.map((m) => <span key={m}>@{m}</span>)}</div>}
          {decoration.questionText && <div className="yam-story-question"><strong>❓ سؤال</strong><span>{decoration.questionText}</span></div>}
          {decoration.emojiStickers.length > 0 && <div className="yam-story-emoji-strip">{decoration.emojiStickers.join(' ')}</div>}

          {countdownData && (
            <div className={`yam-story-countdown ${countdownData.expired ? 'expired' : ''}`}>
              <div className="yam-story-countdown-title">⏳ العد التنازلي</div>
              <div className="yam-story-countdown-value">{countdownData.shortLabel}</div>
              <div className="yam-story-countdown-meta">ينتهي {new Date(current.countdown_at).toLocaleString('ar-EG')}</div>
            </div>
          )}

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
                    <button key={idx} type="button" className={`yam-poll-option ${mine ? 'mine' : ''} ${showResults ? 'voted' : ''}`} onClick={() => handleVotePoll(idx)} disabled={isOwner}>
                      {showResults && <span className="yam-poll-bar" style={{ width: `${pct}%` }} aria-hidden />}
                      <span className="yam-poll-text">{opt} {mine && '✓'}</span>
                      {showResults && <span className="yam-poll-pct">{pct}%</span>}
                    </button>
                  );
                })}
              </div>
              {totalPollVotes > 0 && <div className="yam-poll-total">{totalPollVotes} مصوت</div>}
            </div>
          )}

          {current.caption && <div className="yam-story-caption">{current.caption}</div>}

          <button type="button" aria-label="السابقة" className="yam-story-tap yam-tap-prev" onClick={handlePrevStory} />
          <button type="button" aria-label="التالية" className="yam-story-tap yam-tap-next" onClick={handleNextStory} />
        </div>

        {!isOwner && (
          <div className="yam-story-footer">
            <input type="text" dir="rtl" value={replyText} onChange={(e) => setReplyText(e.target.value)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }} placeholder={`الرد على ${group?.username || ''}…`} className="yam-story-reply" aria-label="رد على القصة" />
            <button type="button" className="yam-story-react-btn" onClick={() => setShowReactions((s) => !s)}>😍</button>
            {replyText.trim() && <button type="button" className="yam-story-send-btn" onClick={handleSendReply}>➤</button>}
            {showReactions && (
              <div className="yam-reactions-bar">
                {['❤️', '🔥', '😂', '😮', '😢', '👏', '💯'].map((emo) => <button key={emo} type="button" onClick={() => handleReact(emo)}>{emo}</button>)}
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <button type="button" className="yam-story-owner-info clickable" onClick={handleShowViewers}>
            👁 {current.views_count || 0} مشاهدة
            {current.reactions_count ? ` • 💖 ${current.reactions_count}` : ''}
            {current.replies_count ? ` • 💬 ${current.replies_count}` : ''}
            <span className="yam-story-chevron">›</span>
          </button>
        )}

        {toast && <div className="yam-viewer-toast">{toast}</div>}

        <AnimatePresence>
          {showViewers && (
            <motion.div className="yam-viewers-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}>
              <div className="yam-viewers-handle" />
              <div className="yam-viewers-header">
                <strong>إحصاءات القصة</strong>
                <button type="button" onClick={handleCloseViewers}>✕</button>
              </div>
              <div className="yam-viewers-list">
                {loadingViewers && <div className="yam-viewers-empty">جاري التحميل…</div>}
                {!loadingViewers && (
                  <>
                    <section className="yam-sheet-section">
                      <div className="yam-sheet-title">👁 المشاهدون ({viewers.length})</div>
                      {viewers.length === 0 ? <div className="yam-viewers-empty">لم يشاهد القصة أحد بعد</div> : viewers.map((v, i) => (
                        <div key={`${v.username}-${i}`} className="yam-viewer-row">
                          <img src={v.avatar_url} alt="" className="yam-viewer-avatar" loading="lazy" />
                          <div className="yam-viewer-info"><strong>{v.username}</strong><span>{formatTime(v.viewed_at)}</span></div>
                        </div>
                      ))}
                    </section>

                    <section className="yam-sheet-section">
                      <div className="yam-sheet-title">💖 التفاعلات ({viewerReactions.length || current.reactions_count || 0})</div>
                      {viewerReactions.length === 0 ? (
                        <div className="yam-viewers-empty">لا توجد قائمة تفاعلات مفصلة بعد.</div>
                      ) : viewerReactions.map((r, i) => (
                        <div key={`${r.username}-${i}`} className="yam-viewer-row reaction">
                          <img src={r.avatar_url} alt="" className="yam-viewer-avatar" loading="lazy" />
                          <div className="yam-viewer-info"><strong>{r.username}</strong><span>{formatTime(r.created_at)}</span></div>
                          <div className="yam-reaction-emoji">{r.emoji}</div>
                        </div>
                      ))}
                    </section>

                    <section className="yam-sheet-section">
                      <div className="yam-sheet-title">💬 الردود ({viewerReplies.length || current.replies_count || 0})</div>
                      {viewerReplies.length === 0 ? (
                        <div className="yam-viewers-empty">لا توجد ردود بعد.</div>
                      ) : viewerReplies.map((r, i) => (
                        <div key={`${r.username}-${i}`} className="yam-viewer-row reply">
                          <img src={r.avatar_url} alt="" className="yam-viewer-avatar" loading="lazy" />
                          <div className="yam-viewer-info"><strong>{r.username}</strong><span>{r.text}</span><span>{formatTime(r.created_at)}</span></div>
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{viewerStyles}</style>

      <ReportModal open={showReport} onClose={() => { setShowReport(false); setPaused(false); }} targetType="story" targetId={current?.id} targetLabel={`قصة @${group?.username || ''}`} />
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
  } catch {
    return '';
  }
}

const viewerStyles = `
.yam-story-viewer { font-family:'Noto Sans Arabic','Tajawal',system-ui,sans-serif; position:fixed; inset:0; background:rgba(0,0,0,.96); z-index:2000; display:flex; align-items:center; justify-content:center; padding:0; }
.yam-story-stage { position:relative; width:100%; height:100%; max-width:100vw; background:#000; display:flex; flex-direction:column; overflow:hidden; }
@media (min-width: 900px) { .yam-story-viewer { padding:20px; } .yam-story-stage { max-width:420px; max-height:92vh; aspect-ratio:9/16; border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.7); } }
.yam-progress-row { display:flex; gap:4px; padding:10px 12px 0; z-index:3; }
.yam-progress-track { flex:1; height:2.5px; background:rgba(255,255,255,.28); border-radius:2px; overflow:hidden; }
.yam-progress-fill { height:100%; background:#fff; transition:width 50ms linear; }
.yam-story-header { display:flex; align-items:center; gap:10px; padding:10px 14px; color:#fff; z-index:3; }
.yam-story-avatar-sm { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,.85); }
.yam-story-meta { display:flex; flex-direction:column; line-height:1.15; }
.yam-story-meta strong { font-size:14px; font-weight:700; }
.yam-story-time { font-size:11px; opacity:.75; }
.yam-story-badge { margin-inline-start:auto; font-size:18px; padding:2px 8px; background:rgba(34,197,94,.18); border-radius:10px; }
.yam-story-icon-btn { background:rgba(255,255,255,.08); border:none; color:#fff; font-size:16px; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; margin-inline-start:4px; }
.yam-story-header > .yam-story-icon-btn:last-child { margin-inline-start:auto; }
.yam-story-media-wrap { position:relative; flex:1; display:flex; align-items:center; justify-content:center; background:#000; overflow:hidden; user-select:none; touch-action:pan-y; }
.yam-story-media { width:100%; height:100%; object-fit:contain; }
.yam-story-error { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; background:rgba(0,0,0,.6); font-size:14px; }
.yam-story-location, .yam-story-mentions, .yam-story-question, .yam-story-countdown { position:absolute; left:50%; transform:translateX(-50%); z-index:3; color:#fff; }
.yam-story-location { top:84px; background:rgba(17,24,39,.76); border:1px solid rgba(255,255,255,.12); padding:10px 14px; border-radius:999px; font-size:13px; font-weight:800; }
.yam-story-mentions { top:132px; display:flex; gap:8px; flex-wrap:wrap; max-width:calc(100% - 32px); justify-content:center; }
.yam-story-mentions span { background:rgba(17,24,39,.7); border:1px solid rgba(255,255,255,.08); padding:7px 10px; border-radius:999px; font-size:12px; }
.yam-story-question { top:174px; width:min(340px,calc(100% - 32px)); background:rgba(15,15,20,.82); border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:8px; text-align:center; }
.yam-story-question strong { font-size:14px; }
.yam-story-emoji-strip { position:absolute; bottom:148px; left:50%; transform:translateX(-50%); font-size:30px; text-shadow:0 4px 14px rgba(0,0,0,.45); z-index:3; }
.yam-story-caption { position:absolute; bottom:14px; inset-inline-start:16px; inset-inline-end:16px; color:#fff; background:rgba(0,0,0,.45); backdrop-filter:blur(8px); padding:8px 12px; border-radius:12px; font-size:14px; line-height:1.5; text-align:start; }
.yam-story-tap { position:absolute; top:0; bottom:0; width:30%; background:transparent; border:none; cursor:pointer; z-index:2; }
.yam-tap-prev { inset-inline-start:0; } .yam-tap-next { inset-inline-end:0; }
.yam-story-footer { display:flex; align-items:center; gap:8px; padding:10px 14px 14px; position:relative; z-index:3; }
.yam-story-reply { flex:1; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); color:#fff; border-radius:22px; padding:11px 16px; font-size:14px; outline:none; font-family:inherit; }
.yam-story-react-btn,.yam-story-send-btn { background:rgba(255,255,255,.1); border:none; color:#fff; width:42px; height:42px; border-radius:50%; font-size:20px; cursor:pointer; }
.yam-story-send-btn { background:#8b5cf6; transform:scaleX(-1); }
.yam-reactions-bar { position:absolute; bottom:64px; inset-inline-end:14px; background:rgba(20,20,28,.95); border:1px solid rgba(255,255,255,.1); border-radius:28px; padding:8px 12px; display:flex; gap:6px; box-shadow:0 10px 30px rgba(0,0,0,.5); }
.yam-reactions-bar button { background:transparent; border:none; font-size:24px; cursor:pointer; padding:4px; }
.yam-story-owner-info { padding:12px 16px; color:#fff; font-size:13px; opacity:.85; text-align:center; border-top:1px solid rgba(255,255,255,.08); background:transparent; border-left:0; border-right:0; border-bottom:0; font-family:inherit; width:100%; }
.yam-story-owner-info.clickable { cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }
.yam-story-chevron { font-size:18px; opacity:.7; }
.yam-story-countdown { top:auto; bottom:84px; min-width:180px; max-width:calc(100% - 40px); padding:12px 16px; border-radius:18px; background:rgba(17,24,39,.76); border:1px solid rgba(255,255,255,.12); box-shadow:0 16px 36px rgba(0,0,0,.26); backdrop-filter:blur(14px); text-align:center; }
.yam-story-countdown.expired { background:rgba(127,29,29,.78); border-color:rgba(248,113,113,.38); }
.yam-story-countdown-title { font-size:11px; color:rgba(255,255,255,.72); margin-bottom:6px; font-weight:700; }
.yam-story-countdown-value { font-size:21px; font-weight:900; }
.yam-story-countdown-meta { margin-top:6px; font-size:11.5px; color:rgba(255,255,255,.7); }
.yam-story-poll { position:absolute; bottom:80px; inset-inline-start:16px; inset-inline-end:16px; background:rgba(15,15,20,.85); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.1); border-radius:14px; padding:12px; z-index:3; }
.yam-story-poll-question { color:#fff; font-size:14px; font-weight:700; margin-bottom:10px; text-align:center; }
.yam-story-poll-options { display:flex; flex-direction:column; gap:6px; }
.yam-poll-option { position:relative; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); border-radius:10px; color:#fff; font-size:13.5px; cursor:pointer; font-family:inherit; font-weight:600; overflow:hidden; }
.yam-poll-option.mine { border-color:#8b5cf6; background:rgba(139,92,246,.18); }
.yam-poll-bar { position:absolute; top:0; bottom:0; inset-inline-start:0; background:linear-gradient(90deg,rgba(139,92,246,.55),rgba(236,72,153,.35)); z-index:0; transition:width .4s ease-out; }
.yam-poll-text,.yam-poll-pct { position:relative; z-index:1; }
.yam-poll-total { text-align:center; color:rgba(255,255,255,.65); font-size:11px; margin-top:8px; }
.yam-viewer-toast { position:absolute; top:80px; left:50%; transform:translateX(-50%); background:rgba(15,15,20,.95); color:#fff; padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; z-index:10; border:1px solid rgba(139,92,246,.4); }
.yam-viewers-sheet { position:absolute; left:0; right:0; bottom:0; max-height:76%; background:#14141c; border-top-left-radius:18px; border-top-right-radius:18px; z-index:20; display:flex; flex-direction:column; border-top:1px solid rgba(255,255,255,.1); }
.yam-viewers-handle { width:44px; height:4px; background:rgba(255,255,255,.3); border-radius:4px; margin:8px auto 0; }
.yam-viewers-header { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; color:#fff; border-bottom:1px solid rgba(255,255,255,.06); }
.yam-viewers-header button { background:transparent; border:none; color:#fff; font-size:18px; cursor:pointer; }
.yam-viewers-list { flex:1; overflow-y:auto; padding:4px 0 16px; }
.yam-sheet-section { padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,.05); }
.yam-sheet-title { color:#fff; font-size:13px; font-weight:800; padding:12px 18px 8px; opacity:.9; }
.yam-viewer-row { display:flex; align-items:center; gap:12px; padding:10px 18px; }
.yam-viewer-avatar { width:42px; height:42px; border-radius:50%; object-fit:cover; background:#1a1a22; }
.yam-viewer-info { display:flex; flex-direction:column; line-height:1.35; min-width:0; }
.yam-viewer-info strong { font-size:14px; color:#fff; }
.yam-viewer-info span { font-size:11.5px; color:rgba(255,255,255,.55); overflow-wrap:anywhere; }
.yam-reaction-emoji { margin-inline-start:auto; font-size:28px; }
.yam-viewers-empty { text-align:center; color:rgba(255,255,255,.5); padding:24px 16px; font-size:13px; }
@media (max-width: 380px) { .yam-story-reply { font-size:13px; padding:9px 14px; } .yam-story-meta strong { font-size:13px; } }
`;
