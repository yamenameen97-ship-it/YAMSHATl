import { useEffect, useMemo, useRef, useState } from 'react';
import AudioWaveform from './AudioWaveform.jsx';
import VoiceMessagePlayer from '../ui/VoiceMessagePlayer.jsx';

const CODEC_PRIORITY = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || '';
}

/**
 * جرد معلمات الكودك من mime type (مثل "audio/webm;codecs=opus" → "audio/webm").
 * مهم لأن بعض السيرفرات / قوائم التحقق ترفض الصيغة الكاملة.
 */
function normalizeMime(rawType = '') {
  return String(rawType || '').split(';')[0].trim().toLowerCase();
}

function extensionForMime(mime = '') {
  const base = normalizeMime(mime);
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('mpeg')) return 'mp3';
  if (base.includes('mp4') || base.includes('m4a') || base.includes('aac')) return 'm4a';
  if (base.includes('wav')) return 'wav';
  return 'webm';
}

function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ✅ v59.13.16 FIX #4: حد أقصى لمدة التسجيل الصوتي (5 دقائق)
const MAX_RECORDING_SECONDS = 300;

export default function VoiceRecorder({ onSend, onCancel, onStateChange, maxSeconds = MAX_RECORDING_SECONDS }) {
  const [recordingState, setRecordingState] = useState('idle');
  const [duration, setDuration] = useState(0);
  const [waveSeed, setWaveSeed] = useState(`voice-${Date.now()}`);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBlob, setPreviewBlob] = useState(null);
  // ✅ v59.13.16 FIX #4: بنر خطأ غير حاجب بدل من window.alert الذي يجمّد الواجهة
  const [errorMessage, setErrorMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationRef = useRef(0);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const errorTimerRef = useRef(null);

  useEffect(() => {
    onStateChange?.(recordingState);
  }, [onStateChange, recordingState]);

  // ✅ FIX v59.13.4: cleanup عند unmount فقط (deps فارغة)
  // المشكلة السابقة: dep على previewUrl كان يستدعي revoke على URL الجديد
  //                  ويحرر تسجيلات ما زالت جارية عند كل تغيير حالة.
  useEffect(() => {
    const previousUrlRef = { current: previewUrl };
    return () => {
      if (previousUrlRef.current) URL.revokeObjectURL(previousUrlRef.current);
    };
  }, [previewUrl]);

  // cleanup نهائي عند إزالة المكوّن: أوقف المؤقت + مسارات الميديا
  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        // امنع تشغيل onstop بعد unmount لتفادي setState على مكوّن مزال
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
    } catch { /* تجاهل */ }
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
  }, []);

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
      // ✅ v59.13.16 FIX #4: إيقاف تلقائي عند الوصول للحد الأقصى
      if (durationRef.current >= maxSeconds) {
        try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        } catch { /* ignore */ }
        showError(`تم الوصول للحد الأقصى للتسجيل (${Math.floor(maxSeconds / 60)} دقائق).`, 3500);
      }
    }, 1000);
  };

  // ✅ v59.13.16 FIX #4: عرض رسالة خطأ داخل المكوّن بدل alert
  const showError = (text, ms = 4000) => {
    setErrorMessage(text);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setErrorMessage(''), ms);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage('');
    // ✅ v59.13.16 FIX #4: تحقّق مسبق من دعم المتصفح بدون alert
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showError('المتصفح لا يدعم التسجيل الصوتي في هذا السياق (جرّب على HTTPS).');
      return;
    }
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
      // ✅ v59.13.16 FIX #4: بدل window.alert (الذي يجمّد الواجهة) — رسالة داخل المكوّن
      console.warn('[VoiceRecorder] getUserMedia failed:', error?.name, error?.message);
      const name = error?.name || '';
      let msg = 'تعذّر بدء التسجيل الصوتي.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        msg = 'تم رفض الوصول للميكروفون. فعّل الإذن من إعدادات المتصفح ثم حاول مجدداً.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'لا يوجد ميكروفون متاح في هذا الجهاز.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = 'الميكروفون مشغول بتطبيق آخر. أغلقه ثم حاول مجدداً.';
      } else if (name === 'SecurityError') {
        msg = 'تسجيل الصوت يتطلّب اتصالاً آمناً (HTTPS).';
      }
      showError(msg, 5000);
      setRecordingState('idle');
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
    // ✅ FIX v59.13.4: قبل stop() نعطّل onstop حتى لا يبني blob ويفتح preview
    // للتسجيل الملغي. السلوك السابق كان يعرض preview لتسجيل اختاره المستخدم إلغاءه!
    stopTimer();
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
    } catch { /* تجاهل أخطاء stop المتكررة */ }
    audioChunksRef.current = [];
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    clearPreview();
    setDuration(0);
    durationRef.current = 0;
    setRecordingState('idle');
    onCancel?.();
  };

  const handleSend = () => {
    if (!previewBlob) return;
    // تطبيع mime type: إزالة معلمة codecs لأن السيرفر وبعض الأنظمة ترفض "audio/webm;codecs=opus"
    const rawType = mimeType || previewBlob.type || 'audio/webm';
    const cleanType = normalizeMime(rawType) || 'audio/webm';
    const ext = extensionForMime(cleanType);
    const file = new File([previewBlob], `voice-note-${Date.now()}.${ext}`, {
      type: cleanType,
      lastModified: Date.now(),
    });

    onSend?.({
      blob: previewBlob,
      file,
      durationSeconds: durationRef.current,
      mimeType: cleanType,
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

      {/* ✅ v59.13.16 FIX #4: بنر رسالة خطأ غير حاجب (يحل محل window.alert) */}
      {errorMessage ? (
        <div role="alert" style={{
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
          fontSize: 13, border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span aria-hidden="true">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* ✅ v59.13.16 FIX #4: مؤشر الحد الأقصى للتسجيل */}
      {(recordingState === 'recording' || recordingState === 'paused') ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{
            height: 4, borderRadius: 4,
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
          }} aria-hidden="true">
            <div style={{
              height: '100%',
              width: `${Math.min(100, (duration / maxSeconds) * 100)}%`,
              background: duration / maxSeconds > 0.9
                ? 'linear-gradient(90deg,#ef4444,#f97316)'
                : 'linear-gradient(90deg,#8b5cf6,#a855f7)',
              transition: 'width 250ms ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'start' }}>
            {formatTime(duration)} / {formatTime(maxSeconds)}
          </div>
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

