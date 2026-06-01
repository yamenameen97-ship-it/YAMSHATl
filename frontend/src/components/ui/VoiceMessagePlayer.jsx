import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioWaveform from '../chat/AudioWaveform.jsx';

function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * VoiceMessagePlayer — مشغل رسائل صوتية بنمط واتساب.
 *
 * Props:
 *  - src:        رابط الصوت
 *  - seed:       مفتاح لتوليد موجة ثابتة
 *  - title:      عنوان اختياري (يُخفى في وضع bubbleless)
 *  - compact:    تقليص المسافات الداخلية
 *  - autoPlay:   تشغيل تلقائي
 *  - bubbleless: عرض المشغل كـ pill أفقي صغير بدون صندوق محيط (نمط واتساب)
 *  - isMe:       يضبط لون الأكسنت ليتناسب مع فقاعة المرسل/المستقبل
 */
export default function VoiceMessagePlayer({
  src,
  seed,
  title = 'رسالة صوتية',
  compact = false,
  autoPlay = false,
  bubbleless = false,
  isMe = false,
}) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const speedOptions = useMemo(() => [1, 1.5, 2], []);

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

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
    };
    const handlePause = () => {
      stopProgressLoop();
      setIsPlaying(false);
      setCurrentTime(audio.currentTime || 0);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasPlayed(true);
      stopProgressLoop();
      rafRef.current = requestAnimationFrame(syncProgress);
    };
    const handleError = () => {
      setLoadError(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

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
  }, [autoPlay, stopProgressLoop, syncProgress, src]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => setLoadError(true));
      }
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((event) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let ratio = (event.clientX - rect.left) / rect.width;
    if (isRtl) ratio = 1 - ratio;
    ratio = Math.max(0, Math.min(1, ratio));
    const nextTime = ratio * audio.duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const cycleRate = useCallback(() => {
    const audio = audioRef.current;
    const currentIdx = speedOptions.indexOf(playbackRate);
    const nextRate = speedOptions[(currentIdx + 1) % speedOptions.length] || 1;
    setPlaybackRate(nextRate);
    if (audio) audio.playbackRate = nextRate;
  }, [playbackRate, speedOptions]);

  // ===== الوضع المضغوط بنمط واتساب (Pill أفقي) =====
  if (bubbleless) {
    const displayTime = isPlaying || hasPlayed ? currentTime : duration;
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
          disabled={loadError && !src}
        >
          {loadError ? '!' : isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
          <span className="yam-voice-pill__time">{formatTime(displayTime)}</span>
          {(isPlaying || hasPlayed) && (
            <button
              type="button"
              className="yam-voice-pill__rate"
              onClick={cycleRate}
              aria-label="تغيير السرعة"
            >
              ×{playbackRate}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== الوضع الكامل (للمعاينة قبل الإرسال) =====
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
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
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
