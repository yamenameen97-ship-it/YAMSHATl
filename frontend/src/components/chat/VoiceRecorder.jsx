import { useEffect, useMemo, useRef, useState } from 'react';
import AudioWaveform from './AudioWaveform.jsx';
import VoiceMessagePlayer from '../ui/VoiceMessagePlayer.jsx';

const CODEC_PRIORITY = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || '';
}

function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function VoiceRecorder({ onSend, onCancel, onStateChange }) {
  const [recordingState, setRecordingState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [waveSeed, setWaveSeed] = useState(`voice-${Date.now()}`);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationRef = useRef(0);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    onStateChange?.(recordingState);
  }, [onStateChange, recordingState]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
  }, [previewUrl]);

  const mimeType = useMemo(() => pickSupportedMimeType(), []);

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      clearPreview();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      durationRef.current = 0;
      setDuration(0);
      setWaveSeed(`voice-${Date.now()}`);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        if (!blob.size) {
          setRecordingState('idle');
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setRecordingState('preview');
        mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
      };

      recorder.start(250);
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error(error);
      window.alert('لا يمكن الوصول إلى الميكروفون أو المتصفح لا يدعم التسجيل الصوتي.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    clearPreview();
    setDuration(0);
    durationRef.current = 0;
    setRecordingState('idle');
    onCancel?.();
  };

  const handleSend = () => {
    if (!previewBlob) return;
    const file = new File([previewBlob], `voice-note-${Date.now()}.${mimeType.includes('ogg') ? 'ogg' : 'webm'}`, {
      type: mimeType || previewBlob.type || 'audio/webm',
      lastModified: Date.now(),
    });

    onSend?.({
      blob: previewBlob,
      file,
      durationSeconds: durationRef.current,
      mimeType: file.type,
      waveformSeed: waveSeed,
    });

    clearPreview();
    setDuration(0);
    durationRef.current = 0;
    setRecordingState('idle');
  };

  return (
    <div style={{ padding: 12, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>رسالة صوتية</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {recordingState === 'idle' ? 'Opus codec + waveform + playback controls' : null}
            {recordingState === 'recording' ? 'جارٍ التسجيل...' : null}
            {recordingState === 'paused' ? 'التسجيل متوقف مؤقتًا' : null}
            {recordingState === 'preview' ? 'راجع التسجيل قبل الإرسال' : null}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: recordingState === 'recording' ? '#ff7b7b' : 'var(--text)' }}>
          {formatTime(duration)}
        </div>
      </div>

      {(recordingState === 'recording' || recordingState === 'paused') ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <AudioWaveform seed={waveSeed} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recordingState === 'recording' ? (
              <button type="button" onClick={pauseRecording} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', background: '#2e3350', color: '#fff' }}>إيقاف مؤقت</button>
            ) : (
              <button type="button" onClick={resumeRecording} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', background: '#2e3350', color: '#fff' }}>استكمال</button>
            )}
            <button type="button" onClick={stopRecording} style={{ padding: '8px 14px', borderRadius: 999, border: 'none', background: '#8b5cf6', color: '#fff' }}>إنهاء</button>
            <button type="button" onClick={cancelRecording} style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff' }}>إلغاء</button>
          </div>
        </div>
      ) : null}

      {recordingState === 'idle' ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={startRecording} style={{ padding: '10px 16px', borderRadius: 999, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700 }}>ابدأ التسجيل</button>
          <button type="button" onClick={() => onCancel?.()} style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff' }}>رجوع</button>
        </div>
      ) : null}

      {recordingState === 'preview' && previewUrl ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <audio ref={audioRef} src={previewUrl} preload="metadata" style={{ display: 'none' }} onLoadedMetadata={() => {
            const mediaDuration = clamp(audioRef.current?.duration || durationRef.current || 0, 0, 3600);
            if (mediaDuration) {
              durationRef.current = Math.round(mediaDuration);
              setDuration(Math.round(mediaDuration));
            }
          }} />
          <VoiceMessagePlayer src={previewUrl} seed={waveSeed} title="معاينة الرسالة الصوتية" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={handleSend} style={{ padding: '10px 16px', borderRadius: 999, border: 'none', background: '#22c55e', color: '#06110a', fontWeight: 700 }}>إرسال</button>
            <button type="button" onClick={startRecording} style={{ padding: '10px 16px', borderRadius: 999, border: 'none', background: '#2e3350', color: '#fff' }}>إعادة تسجيل</button>
            <button type="button" onClick={cancelRecording} style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#fff' }}>إلغاء</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

