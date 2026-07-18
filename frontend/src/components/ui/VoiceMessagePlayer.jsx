import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioWaveform from '../chat/AudioWaveform.jsx';

// ✅ v87.22 FIX #3: إذا لم تُقرأ المدّة بعد من metadata, أظهر "–:––" بدل 0:00 المضلّل
function formatTime(seconds = 0, { placeholder = false } = {}) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return placeholder ? '–:––' : '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function toPositiveNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function senderFallbackLetter(label = '') {
  const normalized = String(label || '').trim();
  return normalized ? normalized.charAt(0).toUpperCase() : '•';
}

/**
 * VoiceMessagePlayer — مشغل رسائل صوتية بنمط واتساب.
 *
 * Props:
 *  - src:              رابط الصوت
 *  - seed:             مفتاح لتوليد موجة ثابتة
 *  - title:            عنوان اختياري
 *  - compact:          تقليص المسافات الداخلية
 *  - autoPlay:         تشغيل تلقائي
 *  - bubbleless:       عرض المشغل كـ pill أفقي صغير بدون صندوق محيط
 *  - isMe:             يضبط لون الأكسنت ليتناسب مع فقاعة المرسل/المستقبل
 *  - initialDuration:  مدة أولية من قاعدة البيانات لتجنّب ظهور 0:00 دائماً
 *  - avatarSrc:        صورة صغيرة على يمين الرسالة مثل التصميم المرجعي
 *  - avatarAlt:        اسم صاحب الصورة المصغّرة
 */
export default function VoiceMessagePlayer({
  src,
  seed,
  title = 'رسالة صوتية',
  compact = false,
  autoPlay = false,
  bubbleless = false,
  isMe = false,
  initialDuration = 0,
  avatarSrc = '',
  avatarAlt = 'مستخدم',
}) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const seededDuration = toPositiveNumber(initialDuration, 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(seededDuration);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const speedOptions = useMemo(() => [1, 1.5, 2], []);

  useEffect(() => {
    setDuration(toPositiveNumber(initialDuration, 0));
    setCurrentTime(0);
    setIsPlaying(false);
    setHasPlayed(false);
    setLoadError(false);
  }, [src, initialDuration]);

  const stopProgressLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const syncProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime || 0);
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(syncProgress);
    }
  }, []);

  useEffect(() => () => stopProgressLoop(), [stopProgressLoop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const commitDuration = (candidate) => {
      const next = toPositiveNumber(candidate, 0);
      if (next > 0) setDuration(next);
    };

    const handleLoadedMetadata = () => {
      commitDuration(audio.duration);
      setLoadError(false);
    };
    const handleDurationChange = () => {
      commitDuration(audio.duration);
    };
    const handleEnded = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(toPositiveNumber(audio.duration, duration));
    };
    const handlePause = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(audio.currentTime || 0);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasPlayed(true);
      setLoadError(false);
      stopProgressLoop();
      rafRef.current = requestAnimationFrame(syncProgress);
    };
    const handleError = () => {
      // ✅ v88.5.1 FIX: لا نُظهر أيقونة الخطأ عند فشل تحميل الميتاداتا (CORS/شبكة مؤقتة).
      // نُبقي زر التشغيل ▶ ظاهراً، ونضع loadError=true فقط عند الفشل الفعلي أثناء المحاولة.
      stopProgressLoop();
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    if (seededDuration > 0 && (!Number.isFinite(audio.duration) || audio.duration <= 0)) {
      setDuration(seededDuration);
    }

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [autoPlay, duration, seededDuration, stopProgressLoop, syncProgress, src]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // إعادة المحاولة: امسح حالة الخطأ السابقة قبل بدء التشغيل
      setLoadError(false);
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          // تجاهل AbortError (يحدث عند التبديل السريع بين الرسائل)
          const name = err && err.name ? String(err.name) : '';
          if (name === 'AbortError' || name === 'NotAllowedError') return;
          setLoadError(true);
        });
      }
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((event) => {
    const audio = audioRef.current;
    const playableDuration = toPositiveNumber(audio?.duration, duration || seededDuration);
    if (!audio || playableDuration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let ratio = (event.clientX - rect.left) / rect.width;
    if (isRtl) ratio = 1 - ratio;
    ratio = Math.max(0, Math.min(1, ratio));
    const nextTime = ratio * playableDuration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration, seededDuration]);

  const cycleRate = useCallback(() => {
    const audio = audioRef.current;
    const currentIdx = speedOptions.indexOf(playbackRate);
    const nextRate = speedOptions[(currentIdx + 1) % speedOptions.length] || 1;
    setPlaybackRate(nextRate);
    if (audio) audio.playbackRate = nextRate;
  }, [playbackRate, speedOptions]);

  if (bubbleless) {
    const knownDuration = duration || seededDuration;
    const displayTime = isPlaying || hasPlayed ? currentTime : knownDuration;
    // ✅ v87.22 FIX #3: إذا لم تُعرف المدّة بعد ولم نبدأ التشغيل
    //     → أظهر placeholder (–:––) بدل 0:00 الخاطئ
    const timePlaceholder = !isPlaying && !hasPlayed && knownDuration <= 0;
    const showRate = isPlaying || (hasPlayed && playbackRate !== 1);
    const showAvatar = Boolean(String(avatarSrc || '').trim());

    return (
      <div
        className={`yam-voice-pill ${isMe ? 'me' : 'them'} ${isPlaying ? 'playing' : ''}`}
        dir="ltr"
        role="group"
        aria-label={title}
      >
        <audio ref={audioRef} src={src} preload="metadata" playsInline />

        <button
          type="button"
          className="yam-voice-pill__play"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}
          disabled={!src}
        >
          {loadError ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          ) : isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="yam-voice-pill__wave"
          onClick={handleSeek}
          aria-label="موضع التشغيل"
        >
          <AudioWaveform seed={seed || src} compact progress={progress} playing={isPlaying} />
        </button>

        <div className="yam-voice-pill__meta">
          {showRate ? (
            <button
              type="button"
              className="yam-voice-pill__rate"
              onClick={cycleRate}
              aria-label="تغيير السرعة"
            >
              {playbackRate}×
            </button>
          ) : null}
          <span className="yam-voice-pill__time">{formatTime(displayTime, { placeholder: timePlaceholder })}</span>
          <span className="yam-voice-pill__badge" aria-hidden="true">
            {showAvatar ? (
              <img src={avatarSrc} alt={avatarAlt} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            ) : showRate ? (
              <span className="yam-voice-pill__badge-fallback">{senderFallbackLetter(avatarAlt)}</span>
            ) : (
              <span className="yam-voice-pill__badge-mic">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`yam-voice-card ${compact ? 'compact' : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" playsInline />
      <div className="yam-voice-header">
        <button
          type="button"
          className={`yam-voice-play ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlayback}
          aria-label={isPlaying ? 'إيقاف الرسالة الصوتية' : 'تشغيل الرسالة الصوتية'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="yam-voice-copy">
          <strong>{title}</strong>
          <span>{formatTime(currentTime)} / {formatTime(duration || seededDuration)}</span>
        </div>
        <div className="yam-voice-rates">
          {speedOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`yam-speed-pill ${playbackRate === option ? 'active' : ''}`}
              onClick={() => {
                const audio = audioRef.current;
                setPlaybackRate(option);
                if (audio) audio.playbackRate = option;
              }}
            >
              ×{option}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="yam-voice-seek" onClick={handleSeek} aria-label="التنقل داخل الرسالة الصوتية">
        <AudioWaveform seed={seed || src} compact={compact} progress={progress} playing={isPlaying} />
      </button>
    </div>
  );
}
