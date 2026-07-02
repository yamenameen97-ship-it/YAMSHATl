import { useEffect, useMemo, useRef, useState } from 'react';
import { CALL_DEFAULT_SETTINGS, getCallNetworkSummary } from '../../config/callConfig.js';
import callService, {
  startCall as svcStartCall,
  endCall as svcEndCall,
  toggleMute as svcToggleMute,
  toggleCamera as svcToggleCamera,
  subscribe as subscribeCall,
  acceptIncomingCall as svcAcceptIncoming,
  describeMediaError,
  probeMediaPermissions,
} from '../../services/callService.js';

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 v79 — Active Voice Call UI (pixel-perfect redesign)
//   ▸ Full-screen deep dark background (#080914) with subtle purple ambient
//   ▸ Top bar: chevron-down (minimize) on the left ┃ speaker + people + dots on right
//   ▸ Centered circular avatar with dual symmetrical animated soundwave bars
//   ▸ Username, "مكالمة صوتية", live purple duration timer (03:12 style)
//   ▸ Encryption pill: "مشفرة بالكامل" + lock icon
//   ▸ Utility grid (5 items): الدردشة • كتم الميكروفون • سماعة • تسجيل • المزيد
//   ▸ Large red end-call button + "إنهاء المكالمة" label
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS = [
  { id: 'host', name: 'أنت', role: 'host' },
  { id: 'guest-1', name: 'ضيف 1', role: 'guest' },
];

// ── Inline SVG icons (stroke-based, currentColor) ────────────────────────────
const Icon = {
  ChevronDown: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9" /></svg>
  ),
  People: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M17 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Dots: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Chat: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="13" y2="14" />
    </svg>
  ),
  MicOff: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="4" y1="4" x2="20" y2="20" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOn: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  // "سماعة" — earpiece / speaker-off silhouette (matches design: speaker with sound-off feel)
  Speaker: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5" />
      <path d="M15 9a4 4 0 0 1 0 6" />
    </svg>
  ),
  SpeakerLoud: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5" />
      <path d="M15 9a4 4 0 0 1 0 6" />
      <path d="M18 6a8 8 0 0 1 0 12" />
    </svg>
  ),
  // "تسجيل" — soundwave inside a circle
  Record: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="11" y1="8" x2="11" y2="16" />
      <line x1="14" y1="6" x2="14" y2="18" />
      <line x1="17" y1="10" x2="17" y2="14" />
    </svg>
  ),
  PhoneEnd: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 8c-2.5 0-4.9.5-7.2 1.5-.8.3-1.4 1-1.4 1.9v2.5c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6h3c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4v-1.6c1.1-.3 2.2-.4 3.6-.4s2.5.1 3.6.4v1.6c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6h3c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4v-2.5c0-.9-.6-1.6-1.4-1.9C16.9 8.5 14.5 8 12 8z" transform="rotate(135 12 12)" />
    </svg>
  ),
};

export default function CallExperience({
  open,
  mode = 'voice',
  callType = 'direct',
  participantName = 'yamenameen97',
  incomingInvite = null,
  onClose,
  onStatusChange,
}) {
  const network = useMemo(() => getCallNetworkSummary(), []);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callState, setCallState] = useState(null);
  const [muted, setMuted] = useState(CALL_DEFAULT_SETTINGS.muted);
  const [speakerEnabled, setSpeakerEnabled] = useState(CALL_DEFAULT_SETTINGS.speaker);
  const [cameraEnabled, setCameraEnabled] = useState(mode === 'video');
  const [recording, setRecording] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [streamError, setStreamError] = useState(null);
  const [permissionHint, setPermissionHint] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [participants] = useState(
    callType === 'group'
      ? MOCK_PARTICIPANTS
      : [{ id: 'peer', name: participantName, role: 'peer' }]
  );

  // Global call state subscription
  useEffect(() => {
    if (!open) return undefined;
    const unsubscribe = subscribeCall((snapshot) => {
      setCallState(snapshot);
      if (snapshot?.status) onStatusChange?.(snapshot.status);
      if (snapshot?.mediaError) setStreamError(snapshot.mediaError);
      if (!snapshot) onClose?.();
    });
    return () => unsubscribe?.();
  }, [open, onClose, onStatusChange]);

  // Pre-flight permission probe
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const states = await probeMediaPermissions(mode);
      if (cancelled || !states) return;
      const blocked = Object.entries(states).filter(([, v]) => v === 'denied');
      if (blocked.length) {
        setPermissionHint({
          code: 'permission_denied',
          message: `إذن ${blocked.map(([k]) => (k === 'camera' ? 'الكاميرا' : 'الميكروفون')).join(' و')} مرفوض من المتصفّح. افتح إعدادات الموقع واسمح بالوصول.`,
        });
      } else {
        setPermissionHint(null);
      }
    })();
    return () => { cancelled = true; };
  }, [open, mode]);

  // Signaling
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (incomingInvite) await svcAcceptIncoming(incomingInvite);
        else await svcStartCall({ peer: participantName, mode });
        if (!cancelled) setStreamError(null);
      } catch (err) {
        setStreamError(describeMediaError(err));
      }
    })();
    const qualityTimer = window.setInterval(() => {
      setConnectionQuality((prev) =>
        prev === 'excellent' ? 'good' : prev === 'good' ? 'stable' : 'excellent'
      );
    }, 6000);
    return () => {
      cancelled = true;
      window.clearInterval(qualityTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Attach local stream
  useEffect(() => {
    const active = callService.getActiveCall();
    if (localVideoRef.current && active?.localStream) {
      localVideoRef.current.srcObject = active.localStream;
    }
  }, [callState]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && callState?.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState?.remoteStream]);

  // Live timer refresh (1 Hz)
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Cleanup streams on unmount
  useEffect(() => () => {
    try {
      if (localVideoRef.current) {
        const ls = localVideoRef.current.srcObject;
        if (ls && typeof ls.getTracks === 'function') {
          ls.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
        }
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    } catch (_) { /* noop */ }
  }, []);

  const status = callState?.status || 'connecting';
  const peerLabel = callState?.peer || participantName;
  const peerAvatar = callState?.peerAvatar || callState?.avatar || null;
  const effectiveMode = callState?.mode || mode;
  const activeError = streamError || permissionHint;
  const isVideo = effectiveMode === 'video';
  const initial = String(peerLabel || 'U').trim().slice(0, 1).toUpperCase();

  const durationLabel = useMemo(() => {
    const startedAt = callState?.startedAt;
    if (!startedAt) return '00:00';
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    return `${m}:${s}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState?.startedAt, tick]);

  const statusLabel =
    status === 'connected' ? 'مكالمة صوتية' :
    status === 'ringing' ? 'يرن…' :
    status === 'reconnecting' ? 'إعادة الاتصال…' :
    status === 'rejected' ? 'تم الرفض' :
    isVideo ? 'مكالمة فيديو' : 'مكالمة صوتية';

  const handleToggleMute = () => { const n = !muted; setMuted(n); svcToggleMute(n); };
  const handleToggleCamera = () => {
    if (mode !== 'video') return;
    const n = !cameraEnabled; setCameraEnabled(n); svcToggleCamera(n);
  };
  const handleHangup = () => { svcEndCall('hangup'); onClose?.(); };
  const reconnect = () => {
    setReconnectCount((p) => p + 1);
    setStreamError(null);
    (async () => {
      try {
        if (incomingInvite) await svcAcceptIncoming(incomingInvite);
        else await svcStartCall({ peer: participantName, mode });
      } catch (err) { setStreamError(describeMediaError(err)); }
    })();
  };
  const toggleSpeaker = async () => {
    setSpeakerEnabled((prev) => !prev);
    const audio = remoteVideoRef.current;
    if (audio && typeof audio.setSinkId === 'function') {
      try {
        await audio.setSinkId(speakerEnabled ? 'default' : 'communications');
      } catch { /* noop */ }
    }
  };
  const toggleRecording = () => setRecording((v) => !v);
  const handleMinimize = () => { onClose?.(); };

  if (!open) return null;

  return (
    <div className="yam-call-v79-root" role="dialog" aria-modal="true" aria-label="مكالمة صوتية" dir="rtl">
      {/* Ambient purple radial glow */}
      <div className="yam-call-v79-ambient" aria-hidden />

      {/* ═════════ TOP HEADER ═════════ */}
      <header className="yam-call-v79-header">
        <button
          type="button"
          className="yam-call-v79-iconbtn"
          onClick={handleMinimize}
          aria-label="إخفاء المكالمة"
        >
          <Icon.ChevronDown width="22" height="22" />
        </button>

        <div className="yam-call-v79-header-end">
          <button type="button" className="yam-call-v79-iconbtn" aria-label="مكبر الصوت" onClick={toggleSpeaker}>
            <Icon.SpeakerLoud width="20" height="20" />
          </button>
          <button type="button" className="yam-call-v79-iconbtn" aria-label="المشاركون">
            <Icon.People width="20" height="20" />
          </button>
          <button
            type="button"
            className="yam-call-v79-iconbtn"
            aria-label="المزيد"
            onClick={() => setShowMore((v) => !v)}
          >
            <Icon.Dots width="20" height="20" />
          </button>
        </div>
      </header>

      {/* ═════════ AVATAR + SOUND WAVES ═════════ */}
      <div className="yam-call-v79-stage-voice">
        <div className="yam-call-v79-wave yam-call-v79-wave-left" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>

        <div className="yam-call-v79-avatar-big">
          {isVideo && callState?.remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <>
              {!isVideo && callState?.remoteStream ? (
                <audio ref={remoteVideoRef} autoPlay />
              ) : null}
              {peerAvatar ? (
                <img src={peerAvatar} alt={peerLabel} />
              ) : (
                <span className="yam-call-v79-avatar-initial">{initial}</span>
              )}
            </>
          )}
        </div>

        <div className="yam-call-v79-wave yam-call-v79-wave-right" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.09}s` }} />
          ))}
        </div>
      </div>

      {/* ═════════ IDENTITY + TIMER ═════════ */}
      <div className="yam-call-v79-identity">
        <div className="yam-call-v79-username">{peerLabel}</div>
        <div className="yam-call-v79-substatus">{statusLabel}</div>
        <div className="yam-call-v79-timer">{durationLabel}</div>
      </div>

      {/* ═════════ ENCRYPTION BADGE ═════════ */}
      <div className="yam-call-v79-enc-badge">
        <span>مشفرة بالكامل</span>
        <span className="yam-call-v79-enc-lock" aria-hidden>
          <Icon.Lock width="12" height="12" />
        </span>
      </div>

      {/* ═════════ UTILITY GRID ═════════ */}
      <div className="yam-call-v79-utility">
        <UtilBtn label="الدردشة" active={showChat} onClick={() => setShowChat((v) => !v)}>
          <Icon.Chat width="22" height="22" />
        </UtilBtn>
        <UtilBtn label="كتم الميكروفون" muted={muted} onClick={handleToggleMute}>
          {muted ? <Icon.MicOff width="22" height="22" /> : <Icon.MicOn width="22" height="22" />}
        </UtilBtn>
        <UtilBtn label="سماعة" active={speakerEnabled} onClick={toggleSpeaker}>
          <Icon.Speaker width="22" height="22" />
        </UtilBtn>
        <UtilBtn label="تسجيل" active={recording} onClick={toggleRecording}>
          <Icon.Record width="22" height="22" />
        </UtilBtn>
        <UtilBtn label="المزيد" onClick={() => setShowMore((v) => !v)}>
          <Icon.Dots width="22" height="22" />
        </UtilBtn>
      </div>

      {/* ═════════ END-CALL ═════════ */}
      <div className="yam-call-v79-endcall-wrap">
        <button
          type="button"
          className="yam-call-v79-endcall"
          onClick={handleHangup}
          aria-label="إنهاء المكالمة"
        >
          <Icon.PhoneEnd width="30" height="30" />
        </button>
        <span className="yam-call-v79-endcall-label">إنهاء المكالمة</span>
      </div>

      {/* Error banner (overlay style, non-blocking) */}
      {activeError ? (
        <div className="yam-call-v79-err" role="alert">
          <div className="yam-call-v79-err-title">
            ⚠️ {activeError.code === 'permission_denied' ? 'الأذونات مطلوبة' : 'تعذّر بدء المكالمة'}
          </div>
          <div className="yam-call-v79-err-msg">{activeError.message}</div>
          <div className="yam-call-v79-err-actions">
            <button type="button" className="yam-call-v79-err-btn" onClick={reconnect}>إعادة المحاولة</button>
            {activeError.code === 'permission_denied' ? (
              <a
                href="https://support.google.com/chrome/answer/2693767"
                target="_blank"
                rel="noreferrer"
                className="yam-call-v79-err-link"
              >
                كيفية تفعيل الأذونات؟
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Diagnostics (screen-reader only) */}
      <div className="yam-call-v79-sr-only" aria-live="polite">
        الشبكة: {network.transport} • الجودة: {connectionQuality} • إعادة الاتصال #{reconnectCount}
      </div>

      {/* More sheet */}
      {showMore ? (
        <div className="yam-call-v79-more-panel" onClick={() => setShowMore(false)}>
          <div className="yam-call-v79-more-inner" onClick={(e) => e.stopPropagation()}>
            <div className="yam-call-v79-more-title">خيارات المكالمة</div>
            <button type="button" className="yam-call-v79-more-item" onClick={reconnect}>إعادة الاتصال</button>
            <button type="button" className="yam-call-v79-more-item" onClick={toggleRecording}>
              {recording ? 'إيقاف التسجيل' : 'بدء تسجيل المكالمة'}
            </button>
            {mode === 'video' ? (
              <button type="button" className="yam-call-v79-more-item" onClick={handleToggleCamera}>
                {cameraEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
              </button>
            ) : null}
            <button type="button" className="yam-call-v79-more-item" onClick={() => setShowMore(false)}>إغلاق</button>
          </div>
        </div>
      ) : null}

      <style>{`
        /* ────────────── ROOT ────────────── */
        .yam-call-v79-root {
          position: fixed; inset: 0; z-index: 9997;
          background: #080914;
          color: #fff;
          font-family: 'SF Pro Display', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          overflow: hidden;
          display: flex; flex-direction: column; align-items: center;
          padding: max(20px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom));
          box-sizing: border-box;
        }
        .yam-call-v79-ambient {
          position: absolute; inset: 0;
          background:
            radial-gradient(70% 45% at 50% 32%, rgba(127,61,255,0.20) 0%, rgba(127,61,255,0.05) 45%, transparent 70%),
            radial-gradient(80% 60% at 50% 100%, rgba(75,29,154,0.10) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ────────────── HEADER ────────────── */
        .yam-call-v79-header {
          position: relative;
          width: 100%;
          max-width: 500px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 2px 8px;
        }
        .yam-call-v79-header-end {
          display: flex; align-items: center; gap: 6px;
        }
        .yam-call-v79-iconbtn {
          background: transparent; border: none;
          width: 40px; height: 40px; border-radius: 50%;
          display: grid; place-items: center;
          color: #E7E5F0; cursor: pointer;
          transition: background .15s;
        }
        .yam-call-v79-iconbtn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .yam-call-v79-iconbtn:active { transform: scale(0.94); }

        /* ────────────── STAGE (avatar + waves) ────────────── */
        .yam-call-v79-stage-voice {
          position: relative;
          width: 100%;
          display: flex; align-items: center; justify-content: center;
          gap: 22px;
          margin-top: 28px;
          margin-bottom: 22px;
        }
        .yam-call-v79-avatar-big {
          position: relative;
          width: 156px; height: 156px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(160deg, #3b1d6e 0%, #1a0a34 100%);
          box-shadow:
            0 0 0 3px rgba(127,61,255,0.45),
            0 0 30px rgba(127,61,255,0.35),
            0 0 70px rgba(127,61,255,0.20);
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .yam-call-v79-avatar-big img,
        .yam-call-v79-avatar-big video {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .yam-call-v79-avatar-initial {
          font-size: 62px; font-weight: 800; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }

        /* Soundwave bars — vibrant violet, symmetric on both sides */
        .yam-call-v79-wave {
          display: inline-flex; align-items: center;
          gap: 4px;
          height: 70px;
          flex-shrink: 0;
        }
        .yam-call-v79-wave span {
          display: block;
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #B98CFF 0%, #7F3DFF 100%);
          box-shadow: 0 0 8px rgba(127,61,255,0.6);
          animation: yam-call-wave 1.1s ease-in-out infinite;
          transform-origin: center;
        }
        .yam-call-v79-wave-left  { justify-content: flex-end; }
        .yam-call-v79-wave-right { justify-content: flex-start; }
        @keyframes yam-call-wave {
          0%,100% { height: 8px;  opacity: 0.55; }
          50%     { height: 46px; opacity: 1; }
        }

        /* ────────────── IDENTITY ────────────── */
        .yam-call-v79-identity {
          position: relative;
          text-align: center;
          margin-bottom: 16px;
        }
        .yam-call-v79-username {
          font-size: 24px; font-weight: 700; color: #fff;
          letter-spacing: 0.2px;
          margin-bottom: 6px;
        }
        .yam-call-v79-substatus {
          font-size: 14px; color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
        }
        .yam-call-v79-timer {
          font-size: 20px; font-weight: 700;
          color: #A56BFF;
          letter-spacing: 1px;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 0 12px rgba(165,107,255,0.4);
        }

        /* ────────────── ENC BADGE ────────────── */
        .yam-call-v79-enc-badge {
          position: relative;
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 12.5px; color: #D8D6E6;
          margin-bottom: 40px;
        }
        .yam-call-v79-enc-lock {
          display: inline-grid; place-items: center;
          color: #A56BFF;
        }

        /* ────────────── UTILITY GRID ────────────── */
        .yam-call-v79-utility {
          position: relative;
          width: 100%;
          max-width: 460px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          margin-bottom: 36px;
        }
        .yam-call-v79-util-cell {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          min-width: 0;
        }
        .yam-call-v79-util-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.04);
          width: 54px; height: 54px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          transition: background .15s, transform .12s;
        }
        .yam-call-v79-util-btn:hover { background: rgba(255,255,255,0.12); }
        .yam-call-v79-util-btn:active { transform: scale(0.94); }
        .yam-call-v79-util-btn.is-active {
          background: #7F3DFF;
          border-color: transparent;
          box-shadow: 0 6px 18px rgba(127,61,255,0.45);
        }
        .yam-call-v79-util-btn.is-muted {
          background: rgba(255,255,255,0.14);
        }
        .yam-call-v79-util-btn.is-muted svg { color: #fff; }
        .yam-call-v79-util-label {
          font-size: 11px; color: rgba(255,255,255,0.72);
          text-align: center;
          white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }

        /* ────────────── END CALL ────────────── */
        .yam-call-v79-endcall-wrap {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          margin-top: auto;
        }
        .yam-call-v79-endcall {
          background: #F43C4B;
          border: none;
          width: 68px; height: 68px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          box-shadow:
            0 10px 26px rgba(244,60,75,0.5),
            0 0 0 6px rgba(244,60,75,0.10);
          transition: transform .12s, background .15s;
        }
        .yam-call-v79-endcall:hover { background: #E32B3A; }
        .yam-call-v79-endcall:active { transform: scale(0.92); }
        .yam-call-v79-endcall-label {
          font-size: 14px; font-weight: 500; color: #fff;
        }

        /* ────────────── ERROR BANNER ────────────── */
        .yam-call-v79-err {
          position: absolute;
          top: 74px; inset-inline-start: 16px; inset-inline-end: 16px;
          background: rgba(180,30,50,0.85);
          border: 1px solid rgba(255,100,100,0.4);
          border-radius: 14px; padding: 12px 14px;
          z-index: 5;
        }
        .yam-call-v79-err-title { font-weight: 800; margin-bottom: 4px; }
        .yam-call-v79-err-msg { font-size: 13px; color: #ffe8ec; line-height: 1.5; }
        .yam-call-v79-err-actions { display: flex; gap: 10px; margin-top: 8px; align-items: center; }
        .yam-call-v79-err-btn {
          background: #fff; color: #7A0F1F; border: none;
          padding: 6px 12px; border-radius: 8px; font-weight: 700; cursor: pointer;
        }
        .yam-call-v79-err-link { color: #fde68a; font-size: 12px; text-decoration: underline; }

        /* ────────────── MORE PANEL ────────────── */
        .yam-call-v79-more-panel {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          z-index: 20;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .yam-call-v79-more-inner {
          width: 100%; max-width: 480px;
          background: #171025;
          border-radius: 18px 18px 0 0;
          padding: 16px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .yam-call-v79-more-title { font-weight: 700; margin-bottom: 8px; }
        .yam-call-v79-more-item {
          background: rgba(255,255,255,0.06);
          border: none; color: #fff;
          padding: 12px 14px; border-radius: 10px;
          text-align: start; cursor: pointer;
          font-size: 14px;
        }
        .yam-call-v79-more-item:hover { background: rgba(255,255,255,0.12); }

        .yam-call-v79-sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0;
          margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        /* ────────────── RESPONSIVE ────────────── */
        @media (max-height: 720px) {
          .yam-call-v79-avatar-big { width: 130px; height: 130px; }
          .yam-call-v79-avatar-initial { font-size: 52px; }
          .yam-call-v79-wave { height: 58px; }
          .yam-call-v79-enc-badge { margin-bottom: 24px; }
          .yam-call-v79-utility { margin-bottom: 24px; }
          .yam-call-v79-endcall { width: 60px; height: 60px; }
        }
        @media (max-width: 380px) {
          .yam-call-v79-util-btn { width: 48px; height: 48px; }
          .yam-call-v79-util-label { font-size: 10.5px; }
          .yam-call-v79-wave { gap: 3px; }
          .yam-call-v79-wave span { width: 3px; }
        }
      `}</style>
    </div>
  );
}

// ── Reusable utility button ─────────────────────────────────────────────────
function UtilBtn({ label, active, muted, onClick, children }) {
  const cls = [
    'yam-call-v79-util-btn',
    active ? 'is-active' : '',
    muted ? 'is-muted' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className="yam-call-v79-util-cell">
      <button
        type="button"
        className={cls}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active ? 'true' : undefined}
      >
        {children}
      </button>
      <span className="yam-call-v79-util-label">{label}</span>
    </div>
  );
}
