import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioWaveform from '../chat/AudioWaveform.jsx';

function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function VoiceMessagePlayer({
  src,
  seed,
  title = 'رسالة صوتية',
  compact = false,
  autoPlay = false,
}) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const speedOptions = useMemo(() => [1, 1.25, 1.5, 2], []);

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
      if (Number.isFinite(audio.duration)) {
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
      stopProgressLoop();
      rafRef.current = requestAnimationFrame(syncProgress);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [autoPlay, stopProgressLoop, syncProgress]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((event) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const nextTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const handleRateChange = useCallback((nextRate) => {
    const audio = audioRef.current;
    setPlaybackRate(nextRate);
    if (audio) audio.playbackRate = nextRate;
  }, []);

  return (
    <div className={`yam-voice-card ${compact ? 'compact' : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="yam-voice-header">
        <button type="button" className={`yam-voice-play ${isPlaying ? 'playing' : ''}`} onClick={togglePlayback} aria-label={isPlaying ? 'إيقاف الرسالة الصوتية' : 'تشغيل الرسالة الصوتية'}>
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
              onClick={() => handleRateChange(option)}
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
