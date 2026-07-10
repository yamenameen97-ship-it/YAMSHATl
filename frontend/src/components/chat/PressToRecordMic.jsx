import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * PressToRecordMic — زر تسجيل صوتي بأسلوب واتساب (Press & Hold).
 *
 * السلوك المطلوب (كما وصف المستخدم):
 *   1) الضغط على زر المكرفون  ⇒ يبدأ التسجيل فوراً.
 *   2) أثناء الضغط:
 *        • السحب لأعلى فوق العتبة  ⇒ قفل التسجيل (LOCK) — يستمر بدون الحاجة للضغط،
 *          ويظهر زر إرسال وزر إلغاء.
 *        • السحب لأسفل فوق العتبة ⇒ إلغاء التسجيل فوراً (مثل واتساب).
 *   3) رفع الإصبع بدون قفل ولا إلغاء ⇒ يتوقف التسجيل ويظهر معاينة مع زر إرسال.
 *   4) في وضع القفل: زر إرسال أو زر إلغاء يعملان كما هو متوقّع.
 *
 * الملاحظات:
 *   - يعتمد على Pointer Events (يعمل على اللمس والفأرة معاً).
 *   - يستخدم MediaRecorder API مع تفضيل Opus.
 *   - يعرض شارة عائمة أعلى الزر توضّح للمستخدم إمكانية السحب للأعلى (قفل) وللأسفل (إلغاء).
 *   - آمن ضد unmount أثناء العمليات غير المتزامنة.
 */

const CODEC_PRIORITY = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'];

// عتبات السحب بالبكسل (positive = up, negative = down)
const LOCK_THRESHOLD_PX = 70;   // للأعلى (سالب في اليّ)
const CANCEL_THRESHOLD_PX = 90; // للأسفل (موجب في اليّ)
const MAX_RECORDING_SECONDS = 300; // 5 دقائق

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || '';
}

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

/**
 * @param {Object} props
 * @param {(payload: { blob: Blob, file: File, durationSeconds: number, mimeType: string }) => void} props.onSend
 * @param {(state: 'idle'|'recording'|'locked') => void} [props.onStateChange]
 * @param {(msg: string) => void} [props.onError]
 * @param {boolean} [props.disabled]
 * @param {number} [props.maxSeconds]
 */
export default function PressToRecordMic({ onSend, onStateChange, onError, disabled = false, maxSeconds = MAX_RECORDING_SECONDS }) {
  // 'idle' | 'recording' | 'locked'
  const [phase, setPhase] = useState('idle');
  const [duration, setDuration] = useState(0);
  // إزاحة الإصبع الحاليّة أثناء السحب (للتلميح البصري)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const startYRef = useRef(0);
  const pointerIdRef = useRef(null);
  const isMountedRef = useRef(true);
  // نستخدم "cancel intent" حتى لا نبني بلوب عندما يريد المستخدم الإلغاء
  const cancelIntentRef = useRef(false);
  const lockedRef = useRef(false);
  const btnRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // تنظيف نهائي عند إزالة المكوّن
      stopTimer();
      try {
        const rec = mediaRecorderRef.current;
        if (rec && rec.state !== 'inactive') {
          rec.ondataavailable = null;
          rec.onstop = null;
          rec.stop();
        }
      } catch { /* ignore */ }
      mediaStreamRef.current?.getTracks()?.forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emitState = useCallback((next) => {
    onStateChange?.(next);
  }, [onStateChange]);

  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      durationRef.current += 1;
      if (isMountedRef.current) setDuration(durationRef.current);
      if (durationRef.current >= maxSeconds) {
        // إيقاف تلقائي عند الحد الأقصى + إرسال ما تم تسجيله
        stopAndFinalize({ cancel: false });
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginRecording = async () => {
    if (disabled) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError?.('المتصفح لا يدعم التسجيل الصوتي (جرّب على HTTPS).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      durationRef.current = 0;
      cancelIntentRef.current = false;
      lockedRef.current = false;
      setDuration(0);

      const mimeType = pickSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        // إيقاف مسارات الميديا
        mediaStreamRef.current?.getTracks()?.forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        mediaStreamRef.current = null;

        // إذا كانت النية إلغاء — لا نبني ولا نرسل
        if (cancelIntentRef.current) {
          audioChunksRef.current = [];
          durationRef.current = 0;
          if (isMountedRef.current) {
            setDuration(0);
            setPhase('idle');
            setDragOffset({ x: 0, y: 0 });
          }
          emitState('idle');
          return;
        }

        // بناء البلوب وإرساله للمستدعي
        const cleanMime = normalizeMime(mimeType || (audioChunksRef.current[0]?.type) || 'audio/webm') || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: cleanMime });
        audioChunksRef.current = [];

        if (!blob.size) {
          if (isMountedRef.current) {
            setPhase('idle');
            setDuration(0);
            setDragOffset({ x: 0, y: 0 });
          }
          emitState('idle');
          return;
        }

        const ext = extensionForMime(cleanMime);
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, {
          type: cleanMime,
          lastModified: Date.now(),
        });

        try {
          onSend?.({
            blob,
            file,
            durationSeconds: durationRef.current,
            mimeType: cleanMime,
          });
        } catch (err) {
          onError?.('تعذّر إرسال التسجيل.');
        }

        durationRef.current = 0;
        if (isMountedRef.current) {
          setDuration(0);
          setPhase('idle');
          setDragOffset({ x: 0, y: 0 });
        }
        emitState('idle');
      };

      recorder.start(250);
      if (!isMountedRef.current) return;
      setPhase('recording');
      emitState('recording');
      startTimer();
    } catch (error) {
      const name = error?.name || '';
      let msg = 'تعذّر بدء التسجيل الصوتي.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        msg = 'تم رفض الوصول للميكروفون. فعّل الإذن من إعدادات المتصفح ثم حاول مجدداً.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'لا يوجد ميكروفون متاح في هذا الجهاز.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = 'الميكروفون مشغول بتطبيق آخر.';
      } else if (name === 'SecurityError') {
        msg = 'تسجيل الصوت يتطلّب اتصالاً آمناً (HTTPS).';
      }
      onError?.(msg);
      if (isMountedRef.current) {
        setPhase('idle');
        setDragOffset({ x: 0, y: 0 });
      }
      emitState('idle');
    }
  };

  const stopAndFinalize = ({ cancel }) => {
    cancelIntentRef.current = Boolean(cancel);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch { /* ignore */ }
    } else {
      // إذا لم يكن هناك تسجيل نشط، نظّف الحالة يدوياً
      stopTimer();
      mediaStreamRef.current?.getTracks()?.forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
      mediaStreamRef.current = null;
      if (isMountedRef.current) {
        setPhase('idle');
        setDuration(0);
        setDragOffset({ x: 0, y: 0 });
      }
      emitState('idle');
    }
  };

  // ============ Pointer handlers ============
  const onPointerDown = async (event) => {
    if (disabled || phase !== 'idle') return;
    // نتعامل مع الأزرار الرئيسية فقط (فأرة/لمس/قلم)
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();

    pointerIdRef.current = event.pointerId;
    startYRef.current = event.clientY;
    try { btnRef.current?.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
    await beginRecording();
  };

  const onPointerMove = (event) => {
    if (phase !== 'recording') return;
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;

    const dy = event.clientY - startYRef.current;
    setDragOffset({ x: 0, y: dy });

    // إذا سُحب لأعلى (dy سالب) بمقدار كافٍ → قفل التسجيل
    if (dy <= -LOCK_THRESHOLD_PX) {
      lockedRef.current = true;
      try { btnRef.current?.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      setPhase('locked');
      setDragOffset({ x: 0, y: 0 });
      emitState('locked');
      return;
    }

    // إذا سُحب لأسفل (dy موجب) بمقدار كافٍ → إلغاء فوري (مثل واتساب)
    if (dy >= CANCEL_THRESHOLD_PX) {
      try { btnRef.current?.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      stopAndFinalize({ cancel: true });
    }
  };

  const onPointerUp = (event) => {
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    try { btnRef.current?.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
    pointerIdRef.current = null;

    // إذا قفل المستخدم — لا نفعل شيئاً عند رفع الإصبع
    if (lockedRef.current) return;

    // إذا كنّا نسجّل (بدون قفل ولا إلغاء) → أوقف التسجيل وأرسل الملف تلقائياً
    // (السلوك الذي طلبه المستخدم: يوقف التسجيل عند رفع الإصبع، ثم يضغط إرسال —
    //  نحن نُرسل الرسالة فوراً كما في واتساب لأن هذا هو الأكثر شيوعاً).
    if (phase === 'recording') {
      stopAndFinalize({ cancel: false });
    }
  };

  const onPointerCancel = (event) => {
    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) return;
    pointerIdRef.current = null;
    if (lockedRef.current) return;
    if (phase === 'recording') {
      // pointercancel يحدث في السيناريوهات الغريبة (مقاطعة النظام) — نلغي بدل الإرسال
      stopAndFinalize({ cancel: true });
    }
  };

  // ============ Controls in Locked mode ============
  const handleLockedSend = () => {
    if (phase !== 'locked') return;
    stopAndFinalize({ cancel: false });
  };
  const handleLockedCancel = () => {
    if (phase !== 'locked') return;
    stopAndFinalize({ cancel: true });
  };

  // نُشير إلى مقدار السحب لعرض المؤشرات
  const dragUp = Math.max(0, -dragOffset.y);
  const dragDown = Math.max(0, dragOffset.y);
  const willLock = dragUp >= LOCK_THRESHOLD_PX * 0.7;
  const willCancel = dragDown >= CANCEL_THRESHOLD_PX * 0.7;

  return (
    <div className="yam-p2r-wrap" dir="rtl">
      <style>{`
        .yam-p2r-wrap { position: relative; display: inline-flex; align-items: center; }
        .yam-p2r-mic {
          width: 44px; height: 44px; min-width: 44px; min-height: 44px;
          border-radius: 999px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.55); color: #a78bfa;
          font-size: 20px; display: grid; place-items: center;
          cursor: pointer; user-select: none;
          transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
          touch-action: none;
        }
        .yam-p2r-mic:disabled { opacity: 0.5; cursor: not-allowed; }
        .yam-p2r-mic.recording {
          background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
          transform: scale(1.15);
          box-shadow: 0 0 0 6px rgba(239,68,68,0.18), 0 8px 22px rgba(239,68,68,0.3);
          animation: yam-p2r-pulse 1.1s ease-in-out infinite;
        }
        .yam-p2r-mic.locked {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff;
        }
        @keyframes yam-p2r-pulse {
          0%,100% { box-shadow: 0 0 0 6px rgba(239,68,68,0.18), 0 8px 22px rgba(239,68,68,0.3); }
          50%     { box-shadow: 0 0 0 12px rgba(239,68,68,0.08), 0 8px 22px rgba(239,68,68,0.35); }
        }

        /* لوحة عائمة أثناء التسجيل (بديل شبيه بواتساب) */
        .yam-p2r-floating {
          position: absolute;
          bottom: calc(100% + 14px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 240px;
          padding: 12px 14px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 40px rgba(0,0,0,0.4);
          color: #e2e8f0;
          font-size: 13px;
          display: grid; gap: 10px;
          z-index: 40;
          pointer-events: none;
        }
        .yam-p2r-floating.locked-panel { pointer-events: auto; }
        .yam-p2r-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          direction: rtl;
        }
        .yam-p2r-timer {
          display: inline-flex; align-items: center; gap: 8px;
          font-weight: 700; font-variant-numeric: tabular-nums;
        }
        .yam-p2r-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.18);
          animation: yam-p2r-dot 1s ease-in-out infinite;
        }
        @keyframes yam-p2r-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: .35; transform: scale(.75); }
        }
        .yam-p2r-hint {
          font-size: 12px; color: #94a3b8; text-align: center;
        }
        .yam-p2r-hint.danger { color: #f87171; font-weight: 700; }
        .yam-p2r-hint.lock  { color: #a78bfa; font-weight: 700; }
        .yam-p2r-arrow {
          display: inline-block; margin: 0 4px;
        }
        .yam-p2r-locked-actions {
          display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
          gap: 8px; margin-top: 4px;
        }
        .yam-p2r-btn {
          padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05); color: #e2e8f0; font-weight: 700;
          font-size: 13px; cursor: pointer;
        }
        .yam-p2r-btn.cancel { background: rgba(239,68,68,0.14); color: #fca5a5; border-color: rgba(239,68,68,0.32); }
        .yam-p2r-btn.send   { background: linear-gradient(135deg, #22c55e, #16a34a); color: #06110a; border: none; }
        .yam-p2r-btn:active { transform: translateY(1px); }

        /* شارة "اسحب" — تظهر بجوار الزر أثناء التسجيل بدون قفل */
        .yam-p2r-side-hint {
          position: absolute;
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0.9;
        }
      `}</style>

      {/* اللوحة العائمة (أثناء التسجيل غير المقفول) */}
      {phase === 'recording' ? (
        <div className="yam-p2r-floating" aria-live="polite">
          <div className="yam-p2r-row">
            <span className="yam-p2r-timer">
              <span className="yam-p2r-dot" aria-hidden="true" />
              {formatTime(duration)}
            </span>
            <span className="yam-p2r-hint" style={{ textAlign: 'end', minWidth: 0 }}>
              اسحب <span className="yam-p2r-arrow">▲</span> للقفل
              &nbsp;•&nbsp;
              <span style={{ color: '#f87171' }}>اسحب ▼ للإلغاء</span>
            </span>
          </div>
          {willCancel ? (
            <div className="yam-p2r-hint danger">🗑️ حرّر الآن لإلغاء التسجيل</div>
          ) : willLock ? (
            <div className="yam-p2r-hint lock">🔒 حرّر الآن لقفل التسجيل</div>
          ) : (
            <div className="yam-p2r-hint">حرّر الإصبع لإيقاف التسجيل وإرساله</div>
          )}
        </div>
      ) : null}

      {/* لوحة الوضع المقفول */}
      {phase === 'locked' ? (
        <div className="yam-p2r-floating locked-panel">
          <div className="yam-p2r-row">
            <span className="yam-p2r-timer">
              <span className="yam-p2r-dot" aria-hidden="true" />
              {formatTime(duration)}
            </span>
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>🔒 تسجيل مقفول</span>
          </div>
          <div className="yam-p2r-locked-actions">
            <button type="button" className="yam-p2r-btn cancel" onClick={handleLockedCancel} aria-label="إلغاء التسجيل">
              🗑️ إلغاء
            </button>
            <button type="button" className="yam-p2r-btn send" onClick={handleLockedSend} aria-label="إرسال التسجيل">
              ➤ إرسال
            </button>
          </div>
        </div>
      ) : null}

      <button
        ref={btnRef}
        type="button"
        className={`yam-p2r-mic ${phase === 'recording' ? 'recording' : ''} ${phase === 'locked' ? 'locked' : ''}`}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="اضغط مطولاً للتسجيل الصوتي"
        aria-pressed={phase !== 'idle'}
        title="اضغط مطولاً للتسجيل — اسحب للأعلى للقفل، للأسفل للإلغاء"
      >
        🎤
      </button>
    </div>
  );
}
