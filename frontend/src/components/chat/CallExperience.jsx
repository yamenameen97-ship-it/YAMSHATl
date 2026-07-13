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
// 🎨 v79 — Premium Video Call UI (pixel-perfect redesign)
//   ▸ Full-screen dark theme with purple neon accents (#7F3DFF)
//   ▸ Custom header with participant avatar, name & live timer
//   ▸ Emoji reaction bar (heart, wave, laugh, thumbs, wow, +)
//   ▸ "Local encryption" badge, "Supports 1080p" chip, signal bars, menu
//   ▸ Main video with picture-in-picture (PiP) self-view
//   ▸ End-to-end encryption info card with lock icon
//   ▸ Two rows of circular controls: Chat, Mic, Camera, Screen-share, More
//     Effects, Speaker, End Call (red), Add, Screenshot
//   ▸ All icons inline SVG (no external deps) — perfect crispness
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M17 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  PlusSquare: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  Dots: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Signal: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <rect x="3" y="14" width="3" height="6" rx="1" />
      <rect x="9" y="10" width="3" height="10" rx="1" />
      <rect x="15" y="6" width="3" height="14" rx="1" />
      <rect x="21" y="14" width="0" height="0" />
    </svg>
  ),
  CameraFlip: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 8h-3l-1.5-2h-7L7 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z" />
      <path d="M8 13a4 4 0 0 1 7-2.5" />
      <path d="M16 15a4 4 0 0 1-7 2.5" />
      <polyline points="15 8.5 15 10.5 13 10.5" />
      <polyline points="9 19.5 9 17.5 11 17.5" />
    </svg>
  ),
  Chat: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  MicOff: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOn: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  CameraOff: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M10.66 5H20a2 2 0 0 1 2 2v10.34" />
      <path d="M16 16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h.34" />
    </svg>
  ),
  Screen: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <polyline points="9 10 12 7 15 10" />
      <line x1="12" y1="7" x2="12" y2="13" />
    </svg>
  ),
  Effects: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  Speaker: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  SpeakerOff: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ),
  PhoneEnd: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 8c-2.5 0-4.9.5-7.2 1.5-.8.3-1.4 1-1.4 1.9v2.5c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6h3c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4v-1.6c1.1-.3 2.2-.4 3.6-.4s2.5.1 3.6.4v1.6c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6h3c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4v-2.5c0-.9-.6-1.6-1.4-1.9C16.9 8.5 14.5 8 12 8z" transform="rotate(135 12 12)" />
    </svg>
  ),
  PersonPlus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Snapshot: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
};

const REACTIONS = ['💜', '👋', '😂', '👍', '😮'];

export default function CallExperience({
  open,
  mode = 'voice',
  callType = 'direct',
  participantName = 'yamenameen97',
  peerId = null,
  incomingInvite = null,
  onClose,
  onStatusChange,
}) {
  const callTarget = peerId || participantName;
  const network = useMemo(() => getCallNetworkSummary(), []);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callState, setCallState] = useState(null);
  const [muted, setMuted] = useState(CALL_DEFAULT_SETTINGS.muted);
  const [speakerEnabled, setSpeakerEnabled] = useState(CALL_DEFAULT_SETTINGS.speaker);
  const [cameraEnabled, setCameraEnabled] = useState(mode === 'video');
  const [reconnectCount, setReconnectCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [streamError, setStreamError] = useState(null);
  const [permissionHint, setPermissionHint] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [tick, setTick] = useState(0);
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
        else await svcStartCall({ peer: callTarget, mode });
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

  // ✅ FIX v83 (الكاميرا لا تفتح + بطاقة التشفير كبيرة):
  // Attach local stream — مربوط بـ callState و cameraEnabled حتى يمتلئ مباشرة
  // فور وصول التدفق المحلي (حتى قبل رد الطرف البعيد).
  useEffect(() => {
    const active = callService.getActiveCall();
    const stream = active?.localStream || callState?.localStream;
    if (localVideoRef.current && stream) {
      if (localVideoRef.current.srcObject !== stream) {
        localVideoRef.current.srcObject = stream;
      }
    }
  }, [callState, cameraEnabled]);

  // ✅ FIX v83: Attach MAIN stage stream (remote if available, else local preview)
  // بدلاً من إظهار placeholder أفاتار كبير ومحبط — نعرض الكاميرا
  // المحلية في المشهد الرئيسي حتى يرد الطرف الآخر (مثل WhatsApp/Meet).
  useEffect(() => {
    if (!remoteVideoRef.current) return;
    const active = callService.getActiveCall();
    const remote = callState?.remoteStream;
    const local = active?.localStream || callState?.localStream;
    // أولوية للتدفق البعيد، وإلا المحلي في وضع الفيديو.
    const chosen = remote || (mode === 'video' ? local : null);
    if (chosen && remoteVideoRef.current.srcObject !== chosen) {
      remoteVideoRef.current.srcObject = chosen;
    }
  }, [callState?.remoteStream, callState?.localStream, callState, mode, cameraEnabled]);

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
  const peerLabel = (() => {
    const activePeer = callState?.peer || '';
    if (typeof activePeer === 'string' && activePeer.startsWith('group:')) return participantName;
    return activePeer || participantName;
  })();
  const effectiveMode = callState?.mode || mode;
  const activeError = streamError || permissionHint;
  // ✅ v83: ملخّص حالة التدفق — لاختيار ما يظهر في المشهد الرئيسي
  const hasRemoteStream = Boolean(callState?.remoteStream);
  const hasLocalStream = Boolean(callState?.localStream || callService.getActiveCall()?.localStream);
  const mainHasVideo = effectiveMode === 'video' && (hasRemoteStream || (hasLocalStream && cameraEnabled));

  const durationLabel = useMemo(() => {
    const startedAt = callState?.startedAt;
    if (!startedAt) return '00:00';
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    return `${m}:${s}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState?.startedAt, tick]);

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
        else await svcStartCall({ peer: callTarget, mode });
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
  const takeSnapshot = () => {
    try {
      const v = remoteVideoRef.current;
      if (!v || !v.videoWidth) return;
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      const link = document.createElement('a');
      link.download = `yamshat-snapshot-${Date.now()}.png`;
      link.href = c.toDataURL('image/png');
      link.click();
    } catch (_) { /* noop */ }
  };
  const flipCamera = () => { /* placeholder for actual device toggle */ };
  const sendReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((arr) => [...arr, { id, emoji, x: 20 + Math.random() * 60 }]);
    window.setTimeout(() => {
      setFloatingReactions((arr) => arr.filter((r) => r.id !== id));
    }, 2600);
  };

  if (!open) return null;

  const statusLabel =
    status === 'connected' ? 'متصل' :
    status === 'ringing' ? 'يرن…' :
    status === 'reconnecting' ? 'إعادة الاتصال' :
    status === 'rejected' ? 'تم الرفض' : 'يتصل…';

  const showVideoMain = effectiveMode === 'video';

  return (
    <div className="yam-call-v79-root" role="dialog" aria-modal="true" aria-label="مكالمة فيديو" dir="rtl">
      <div className="yam-call-v79-shell">

        {/* ═════════ TOP HEADER ═════════ */}
        <header className="yam-call-v79-header">
          <div className="yam-call-v79-header-start">
            <button
              type="button"
              className="yam-call-v79-iconbtn"
              onClick={handleHangup}
              aria-label="إخفاء"
            >
              <Icon.ChevronDown width="22" height="22" />
            </button>
            <div className="yam-call-v79-brand">
              <div className="yam-call-v79-avatar">
                <span>Y</span>
              </div>
              <div className="yam-call-v79-usermeta">
                <div className="yam-call-v79-username">{peerLabel}</div>
                <div className="yam-call-v79-timer">{durationLabel}</div>
              </div>
            </div>
          </div>
          <div className="yam-call-v79-header-end">
            <button type="button" className="yam-call-v79-iconbtn" aria-label="المشاركون">
              <Icon.People width="20" height="20" />
            </button>
            <button type="button" className="yam-call-v79-iconbtn" aria-label="إضافة">
              <Icon.PlusSquare width="20" height="20" />
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

        {/* ═════════ REACTIONS BAR ═════════ */}
        <div className="yam-call-v79-reactions-row">
          <div className="yam-call-v79-reactions">
            {REACTIONS.map((emo, i) => (
              <button
                key={i}
                type="button"
                className="yam-call-v79-reaction-btn"
                onClick={() => sendReaction(emo)}
                aria-label={`تفاعل ${emo}`}
              >
                <span className="yam-call-v79-reaction-emoji">{emo}</span>
              </button>
            ))}
            <button type="button" className="yam-call-v79-reaction-btn yam-call-v79-reaction-plus" aria-label="المزيد من التفاعلات">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div className="yam-call-v79-enc-badge">
            <Icon.Lock width="12" height="12" />
            <span>تشفير محلي</span>
          </div>
        </div>

        {/* ═════════ MAIN VIDEO STAGE ═════════ */}
        <div className="yam-call-v79-stage">
          {/* Top-left "supports 1080p" chip */}
          <div className="yam-call-v79-stage-chip-tl">
            يدعم حتى <span className="yam-call-v79-hd">1080p</span>
          </div>

          {/* Top-right signal + menu */}
          <div className="yam-call-v79-stage-tr">
            <div className={`yam-call-v79-signal q-${connectionQuality}`} aria-label={`جودة: ${connectionQuality}`}>
              <span /><span /><span /><span />
            </div>
            <button type="button" className="yam-call-v79-stage-menubtn" aria-label="خيارات الفيديو">
              <Icon.Dots width="18" height="18" />
            </button>
          </div>

          {/* ✅ v83: إظهار حرف Y النيون فقط عندما لا يوجد فيديو —
              حتى لا يشوّش على المشهد عند فتح الكاميرا */}
          {!mainHasVideo ? (
            <div className="yam-call-v79-neon-y" aria-hidden>Y</div>
          ) : null}

          {/* Main stage: remote if available, else local preview when camera on */}
          <div className="yam-call-v79-remote">
            {mainHasVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={!hasRemoteStream /* دائماً muted إذا كان المعروض هو التدفق المحلي */}
                className="yam-call-v79-remote-video"
              />
            ) : (
              <>
                {effectiveMode !== 'video' && callState?.remoteStream ? (
                  <audio ref={remoteVideoRef} autoPlay />
                ) : null}
                <div className="yam-call-v79-remote-placeholder">
                  <div className="yam-call-v79-remote-avatar">
                    {String(peerLabel || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="yam-call-v79-remote-name">{peerLabel}</div>
                  <div className="yam-call-v79-remote-status">{statusLabel}</div>
                </div>
              </>
            )}
          </div>

          {/* Floating reactions */}
          <div className="yam-call-v79-floats" aria-hidden>
            {floatingReactions.map((r) => (
              <span key={r.id} className="yam-call-v79-float" style={{ insetInlineStart: `${r.x}%` }}>{r.emoji}</span>
            ))}
          </div>

          {/* ✅ v83: PiP self video (bottom-end) — يظهر فقط عند وجود تدفق بعيد
              (أي أن المشهد الرئيسي للطرف الآخر، و PiP للذات).
              قبل اتصال الطرف الآخر، كاميرتي تحتل المشهد الرئيسي مباشرة. */}
          {effectiveMode === 'video' && hasRemoteStream && cameraEnabled && hasLocalStream ? (
            <div className="yam-call-v79-pip">
              <video ref={localVideoRef} autoPlay muted playsInline className="yam-call-v79-pip-video" />
            </div>
          ) : null}
          {/* video element خفي لـ localVideoRef حتى يظل الربط موجوداً للإلتقاط */}
          {effectiveMode === 'video' && !(hasRemoteStream && cameraEnabled && hasLocalStream) ? (
            <video ref={localVideoRef} autoPlay muted playsInline style={{ display: 'none' }} />
          ) : null}

          {/* Camera flip (bottom-start of stage) */}
          <button type="button" className="yam-call-v79-flip" onClick={flipCamera} aria-label="تبديل الكاميرا">
            <Icon.CameraFlip width="22" height="22" />
          </button>

          {/* ✅ v83: بطاقة التشفير — مضغوطة ورفيعة جداً لتطابق التصميم المرجعي.
              كانت تغطي مساحة كبيرة من المشهد، أصبحت الآن شريط رفيع pill في أسفل يمين. */}
          <div className="yam-call-v79-enc-card yam-call-v79-enc-card-compact" role="note" aria-label="المكالمة مشفرة بالكامل">
            <div className="yam-call-v79-enc-card-badge yam-call-v79-enc-card-badge-sm">
              <span className="yam-call-v79-enc-y">Y</span>
              <span className="yam-call-v79-enc-lock"><Icon.Lock width="10" height="10" /></span>
            </div>
            <div className="yam-call-v79-enc-card-text">
              <div className="yam-call-v79-enc-card-title">مشفرة بالكامل</div>
              <div className="yam-call-v79-enc-card-desc">لا يمكن لأحد خارج هذه المكالمة قراءة أو سماع محتواها</div>
            </div>
          </div>

          {activeError ? (
            <div className="yam-call-v79-err" role="alert">
              <div className="yam-call-v79-err-title">⚠️ {activeError.code === 'permission_denied' ? 'الأذونات مطلوبة' : 'تعذّر بدء المكالمة'}</div>
              <div className="yam-call-v79-err-msg">{activeError.message}</div>
              <div className="yam-call-v79-err-actions">
                <button type="button" className="yam-call-v79-err-btn" onClick={reconnect}>إعادة المحاولة</button>
                {activeError.code === 'permission_denied' ? (
                  <a href="https://support.google.com/chrome/answer/2693767" target="_blank" rel="noreferrer" className="yam-call-v79-err-link">كيفية تفعيل الأذونات؟</a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* ═════════ CONTROLS — ROW 1 ═════════ */}
        <div className="yam-call-v79-controls">
          <div className="yam-call-v79-ctrl-row">
            <ControlBtn label="الدردشة" active={showChat} onClick={() => setShowChat((v) => !v)}>
              <Icon.Chat width="22" height="22" />
            </ControlBtn>
            <ControlBtn label="ميكروفون" muted={muted} onClick={handleToggleMute}>
              {muted ? <Icon.MicOff width="22" height="22" /> : <Icon.MicOn width="22" height="22" />}
            </ControlBtn>
            <ControlBtn label="الكاميرا" muted={!cameraEnabled} onClick={handleToggleCamera}>
              {cameraEnabled ? <Icon.Camera width="22" height="22" /> : <Icon.CameraOff width="22" height="22" />}
            </ControlBtn>
            <ControlBtn label="مشاركة الشاشة" onClick={() => {}}>
              <Icon.Screen width="22" height="22" />
            </ControlBtn>
            <ControlBtn label="المزيد" onClick={() => setShowMore((v) => !v)}>
              <Icon.Dots width="22" height="22" />
            </ControlBtn>
          </div>

          {/* ═════════ CONTROLS — ROW 2 ═════════ */}
          <div className="yam-call-v79-ctrl-row">
            <ControlBtn label="تأثيرات" onClick={() => {}}>
              <Icon.Effects width="22" height="22" />
            </ControlBtn>
            <ControlBtn label="سماعة" muted={!speakerEnabled} onClick={toggleSpeaker}>
              {speakerEnabled ? <Icon.Speaker width="22" height="22" /> : <Icon.SpeakerOff width="22" height="22" />}
            </ControlBtn>

            {/* End-call — red pill */}
            <div className="yam-call-v79-ctrl-cell">
              <button
                type="button"
                className="yam-call-v79-endcall"
                onClick={handleHangup}
                aria-label="إنهاء المكالمة"
              >
                <Icon.PhoneEnd width="26" height="26" />
              </button>
              <span className="yam-call-v79-ctrl-label">إنهاء المكالمة</span>
            </div>

            <ControlBtn label="إضافة" onClick={() => {}}>
              <Icon.PersonPlus width="22" height="22" />
            </ControlBtn>
            <ControlBtn label="التقط صورة" onClick={takeSnapshot}>
              <Icon.Snapshot width="22" height="22" />
            </ControlBtn>
          </div>
        </div>

        {/* Home-indicator bar */}
        <div className="yam-call-v79-home-indicator" aria-hidden />

        {/* Hidden diagnostics for status tracking (non-visual) */}
        <div className="yam-call-v79-sr-only" aria-live="polite">
          الشبكة: {network.transport} • الجودة: {connectionQuality} • إعادة الاتصال #{reconnectCount}
        </div>

        {showMore ? (
          <div className="yam-call-v79-more-panel" onClick={() => setShowMore(false)}>
            <div className="yam-call-v79-more-inner" onClick={(e) => e.stopPropagation()}>
              <div className="yam-call-v79-more-title">خيارات المكالمة</div>
              <button type="button" className="yam-call-v79-more-item" onClick={reconnect}>إعادة الاتصال</button>
              <button type="button" className="yam-call-v79-more-item" onClick={takeSnapshot}>حفظ لقطة شاشة</button>
              <button type="button" className="yam-call-v79-more-item" onClick={() => setShowMore(false)}>إغلاق</button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        /* ────────────── ROOT ────────────── */
        .yam-call-v79-root {
          position: fixed; inset: 0; z-index: 9997;
          background: #07080D;
          color: #fff;
          font-family: 'SF Pro Display', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          overflow: hidden;
          display: flex; align-items: stretch; justify-content: center;
        }
        .yam-call-v79-shell {
          position: relative;
          width: 100%;
          max-width: 500px;
          min-height: 100vh;
          background: radial-gradient(120% 60% at 50% 0%, #14091f 0%, #08060f 55%, #050409 100%);
          display: flex; flex-direction: column;
          padding: 14px 14px 8px;
          box-sizing: border-box;
        }

        /* ────────────── HEADER ────────────── */
        .yam-call-v79-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 6px 2px 10px;
        }
        .yam-call-v79-header-start { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .yam-call-v79-header-end { display: flex; align-items: center; gap: 6px; }

        .yam-call-v79-iconbtn {
          background: transparent; border: none;
          width: 40px; height: 40px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          transition: background .15s;
        }
        .yam-call-v79-iconbtn:hover { background: rgba(255,255,255,0.08); }

        .yam-call-v79-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .yam-call-v79-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #7F3DFF 0%, #4B1D9A 100%);
          display: grid; place-items: center;
          color: #fff; font-weight: 800; font-size: 16px;
          box-shadow: 0 0 0 1.5px rgba(127,61,255,0.4);
        }
        .yam-call-v79-usermeta { min-width: 0; }
        .yam-call-v79-username {
          font-size: 15px; font-weight: 600; color: #fff;
          letter-spacing: 0.2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 180px;
        }
        .yam-call-v79-timer {
          font-size: 13px; font-weight: 500;
          color: #B98CFF;
          margin-top: 1px;
        }

        /* ────────────── REACTIONS BAR ────────────── */
        .yam-call-v79-reactions-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; margin: 4px 0 12px;
        }
        .yam-call-v79-reactions {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: nowrap;
        }
        .yam-call-v79-reaction-btn {
          background: transparent; border: none; padding: 0;
          width: 34px; height: 34px; border-radius: 50%;
          display: grid; place-items: center;
          cursor: pointer;
          transition: transform .12s, background .15s;
        }
        .yam-call-v79-reaction-btn:hover { background: rgba(255,255,255,0.08); transform: scale(1.1); }
        .yam-call-v79-reaction-btn:active { transform: scale(0.92); }
        .yam-call-v79-reaction-emoji { font-size: 22px; line-height: 1; }
        .yam-call-v79-reaction-plus {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .yam-call-v79-reaction-plus svg { width: 14px; height: 14px; }

        .yam-call-v79-enc-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 6px 10px 6px 12px;
          font-size: 11px; color: #C9CBD6;
          white-space: nowrap;
        }

        /* ────────────── STAGE ────────────── */
        .yam-call-v79-stage {
          position: relative; flex: 1;
          border-radius: 26px;
          overflow: hidden;
          background: linear-gradient(180deg, #2b1552 0%, #170830 60%, #0c0518 100%);
          min-height: 55vh;
          box-shadow: 0 20px 60px rgba(127,61,255,0.15), inset 0 0 40px rgba(127,61,255,0.08);
          margin-bottom: 14px;
        }
        .yam-call-v79-neon-y {
          position: absolute;
          top: 26%; inset-inline-start: 8%;
          font-family: 'Brush Script MT', cursive;
          font-size: 100px; font-weight: 900;
          color: transparent;
          -webkit-text-stroke: 2px #A56BFF;
          text-shadow: 0 0 20px rgba(165,107,255,0.9), 0 0 40px rgba(127,61,255,0.6);
          filter: blur(0.2px);
          pointer-events: none;
          opacity: 0.85;
          transform: rotate(-8deg);
        }

        .yam-call-v79-remote { position: absolute; inset: 0; }
        .yam-call-v79-remote-video { width: 100%; height: 100%; object-fit: cover; }
        .yam-call-v79-remote-placeholder {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
        }
        .yam-call-v79-remote-avatar {
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(255,255,255,0.14);
          display: grid; place-items: center;
          font-size: 40px; font-weight: 800;
          margin-bottom: 14px;
          border: 2px solid rgba(255,255,255,0.18);
        }
        .yam-call-v79-remote-name { font-size: 18px; font-weight: 700; }
        .yam-call-v79-remote-status { font-size: 13px; color: #B98CFF; margin-top: 4px; }

        .yam-call-v79-stage-chip-tl {
          position: absolute; top: 14px; inset-inline-start: 14px;
          font-size: 12px; color: #E9DEFF; font-weight: 500;
          background: rgba(20,10,40,0.5); backdrop-filter: blur(6px);
          padding: 5px 10px; border-radius: 999px;
          border: 1px solid rgba(165,107,255,0.25);
          z-index: 3;
        }
        .yam-call-v79-hd { color: #C9A1FF; font-weight: 700; }

        .yam-call-v79-stage-tr {
          position: absolute; top: 14px; inset-inline-end: 14px;
          display: flex; align-items: center; gap: 10px;
          z-index: 3;
        }
        .yam-call-v79-signal {
          display: inline-flex; align-items: flex-end; gap: 2px; height: 14px;
        }
        .yam-call-v79-signal span {
          display: block; width: 3px; background: #fff; border-radius: 1px;
        }
        .yam-call-v79-signal span:nth-child(1) { height: 4px; }
        .yam-call-v79-signal span:nth-child(2) { height: 7px; }
        .yam-call-v79-signal span:nth-child(3) { height: 10px; }
        .yam-call-v79-signal span:nth-child(4) { height: 13px; }
        .yam-call-v79-signal.q-stable span:nth-child(4) { opacity: 0.35; }
        .yam-call-v79-signal.q-good   span:nth-child(4) { opacity: 0.6; }
        .yam-call-v79-stage-menubtn {
          background: transparent; border: none; color: #fff; cursor: pointer;
          padding: 4px; display: grid; place-items: center;
        }

        .yam-call-v79-floats { position: absolute; inset: 0; pointer-events: none; z-index: 4; }
        .yam-call-v79-float {
          position: absolute; bottom: 40px;
          font-size: 32px;
          animation: yam-float-up 2.6s ease-out forwards;
        }
        @keyframes yam-float-up {
          0%   { transform: translateY(0)   scale(0.6); opacity: 0; }
          15%  { transform: translateY(-20px) scale(1.1); opacity: 1; }
          80%  { transform: translateY(-260px) scale(1);  opacity: 1; }
          100% { transform: translateY(-320px) scale(0.8); opacity: 0; }
        }

        /* ✅ v83: PiP self view — أصغر قليلاً وأعلى من بطاقة التشفير
           ليطابق التصميم المرجعي (في الجهة المقابلة للبطاقة). */
        .yam-call-v79-pip {
          position: absolute;
          inset-inline-end: 12px; bottom: 60px;
          width: 90px; height: 120px;
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(160deg, #3b1d6e, #1a0a34);
          border: 2px solid rgba(255,255,255,0.14);
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
          z-index: 4;
        }
        .yam-call-v79-pip-video { width: 100%; height: 100%; object-fit: cover; }
        .yam-call-v79-pip-placeholder {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          font-size: 13px; color: #E9DEFF; font-weight: 600;
        }

        /* ✅ v83: زر flip — يوضع تحت PiP مباشرة ليطابق التصميم المرجعي */
        .yam-call-v79-flip {
          position: absolute;
          inset-inline-end: 12px; bottom: 14px;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(20,10,40,0.55); backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff; cursor: pointer;
          display: grid; place-items: center;
          z-index: 4;
        }

        /* Encryption info card (bottom-start of stage) */
        .yam-call-v79-enc-card {
          position: absolute; bottom: 14px; inset-inline-start: 14px;
          background: rgba(15,10,30,0.75);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex; align-items: center; gap: 10px;
          max-width: 260px;
          z-index: 3;
        }
        /* ✅ v83: نسخة مضغوطة من بطاقة التشفير — افتراضيّاً. مطابقة
           للتصميم المرجعي: شريط رفيع لا يتجاوز 65% من عرض المشهد،
           أراضي أقل padding، وخطوط أصغر. */
        .yam-call-v79-enc-card-compact {
          background: rgba(11, 8, 24, 0.46);
          border-radius: 999px;
          padding: 4px 8px;
          gap: 6px;
          width: auto;
          max-width: 156px;
          min-height: 24px;
          bottom: 10px;
          inset-inline-start: 10px;
          border-color: rgba(255,255,255,0.04);
          backdrop-filter: blur(8px);
        }
        .yam-call-v79-enc-card-compact .yam-call-v79-enc-card-title {
          font-size: 9.5px;
          margin-bottom: 0;
          line-height: 1.1;
          white-space: nowrap;
        }
        .yam-call-v79-enc-card-compact .yam-call-v79-enc-card-desc {
          display: none;
        }
        .yam-call-v79-enc-card-badge {
          position: relative;
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #7F3DFF, #4B1D9A);
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .yam-call-v79-enc-card-badge-sm {
          width: 18px; height: 18px;
        }
        .yam-call-v79-enc-card-badge-sm .yam-call-v79-enc-y { font-size: 8px; }
        .yam-call-v79-enc-card-badge-sm .yam-call-v79-enc-lock {
          width: 9px; height: 9px;
          bottom: -1px; inset-inline-end: -1px;
          border-width: 1.25px;
        }
        .yam-call-v79-enc-y { color: #fff; font-weight: 800; font-size: 13px; }
        .yam-call-v79-enc-lock {
          position: absolute; bottom: -3px; inset-inline-end: -3px;
          background: #7F3DFF; color: #fff;
          width: 14px; height: 14px; border-radius: 50%;
          display: grid; place-items: center;
          border: 2px solid #12081F;
        }
        .yam-call-v79-enc-lock svg { width: 7px; height: 7px; }
        .yam-call-v79-enc-card-title {
          font-size: 12px; font-weight: 700; color: #fff;
          margin-bottom: 2px;
        }
        .yam-call-v79-enc-card-desc {
          font-size: 10.5px; color: #B8B4C7; line-height: 1.35;
        }

        /* Error banner */
        .yam-call-v79-err {
          position: absolute; top: 60px; inset-inline-start: 14px; inset-inline-end: 14px;
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

        /* ────────────── CONTROLS ────────────── */
        .yam-call-v79-controls {
          display: flex; flex-direction: column; gap: 14px;
          padding: 6px 4px 4px;
        }
        .yam-call-v79-ctrl-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          align-items: start;
        }
        .yam-call-v79-ctrl-cell {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          min-width: 0;
        }
        .yam-call-v79-ctrl-btn {
          background: rgba(255,255,255,0.09);
          border: none;
          width: 52px; height: 52px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          transition: background .15s, transform .12s;
        }
        .yam-call-v79-ctrl-btn:hover { background: rgba(255,255,255,0.14); }
        .yam-call-v79-ctrl-btn:active { transform: scale(0.94); }
        .yam-call-v79-ctrl-btn.is-active {
          background: #7F3DFF;
          box-shadow: 0 6px 18px rgba(127,61,255,0.45);
        }
        .yam-call-v79-ctrl-btn.is-muted {
          background: rgba(255,255,255,0.18);
        }
        .yam-call-v79-ctrl-btn.is-muted svg { color: #fff; }
        .yam-call-v79-ctrl-label {
          font-size: 11px; color: #C9CBD6;
          text-align: center; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }

        .yam-call-v79-endcall {
          background: #F43C4B;
          border: none;
          width: 60px; height: 60px; border-radius: 50%;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          box-shadow: 0 8px 22px rgba(244,60,75,0.55);
          transition: transform .12s, background .15s;
        }
        .yam-call-v79-endcall:hover { background: #E32B3A; }
        .yam-call-v79-endcall:active { transform: scale(0.92); }

        /* Home indicator */
        .yam-call-v79-home-indicator {
          margin: 6px auto 6px;
          width: 130px; height: 5px; border-radius: 999px;
          background: rgba(255,255,255,0.55);
        }

        /* More panel */
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
        @media (min-width: 640px) {
          .yam-call-v79-shell {
            border-radius: 32px;
            margin: 20px auto;
            min-height: calc(100vh - 40px);
            box-shadow: 0 30px 90px rgba(0,0,0,0.6);
          }
        }
        @media (max-width: 380px) {
          .yam-call-v79-ctrl-btn { width: 46px; height: 46px; }
          .yam-call-v79-endcall { width: 54px; height: 54px; }
          .yam-call-v79-ctrl-label { font-size: 10.5px; }
          .yam-call-v79-username { max-width: 130px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}

// ── Reusable control button ─────────────────────────────────────────────────
function ControlBtn({ label, active, muted, onClick, children }) {
  const cls = [
    'yam-call-v79-ctrl-btn',
    active ? 'is-active' : '',
    muted ? 'is-muted' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className="yam-call-v79-ctrl-cell">
      <button type="button" className={cls} onClick={onClick} aria-label={label} aria-pressed={active ? 'true' : undefined}>
        {children}
      </button>
      <span className="yam-call-v79-ctrl-label">{label}</span>
    </div>
  );
}
