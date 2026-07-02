import { useEffect, useState, useRef } from 'react';
import callService, {
  bootstrapCallService,
  onIncomingCall,
  acceptIncomingCall,
  rejectIncomingCall,
  subscribe as subscribeCall,
  describeMediaError,
} from '../../services/callService.js';
import CallExperience from './CallExperience.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 v79 — Incoming Voice Call UI (pixel-perfect redesign)
//   ▸ Deep dark background (#080914) with subtle purple radial glow
//   ▸ Neon violet "Y" logo at the very top
//   ▸ Username + "مكالمة صوتية واردة..." subtitle
//   ▸ Circular avatar with concentric animated rings + purple glow border
//   ▸ Two pill actions: "رسالة" (message icon) + "تذكير" (bell icon)
//   ▸ Two large circular action buttons:
//        Reject (dark translucent, X icon)   →   label: "رفض"
//        Accept (solid vibrant purple, phone) →   label: "قبول"
//   ▸ Bottom hint: chevron-up + "اسحب للأعلى للرد"
// ─────────────────────────────────────────────────────────────────────────────

// ── Inline SVG icons (stroke-based, currentColor) ────────────────────────────
const Icon = {
  Message: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="13" y2="14" />
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  ChevronUp: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  YLogo: (p) => (
    // Neon stylized "Y" — two upward-angled strokes meeting the vertical stem
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 8 L20 22 L34 8" />
      <path d="M20 22 L20 34" />
    </svg>
  ),
};

/**
 * Global overlay that:
 * 1) Listens for `incoming_call` socket events anywhere in the app.
 * 2) Renders a ringing UI for the callee with Accept / Reject buttons.
 * 3) Plays a soft ringtone (Web Audio beep loop) so the user notices the call
 *    even if the browser tab is in the background.
 * 4) Once accepted, swaps in <CallExperience /> for the live call view.
 */
export default function IncomingCallOverlay() {
  const [invite, setInvite] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [acceptError, setAcceptError] = useState(null);
  const ringtoneRef = useRef(null);
  const ringtoneCtxRef = useRef(null);
  const systemNotificationRef = useRef(null);

  useEffect(() => {
    bootstrapCallService();
    const unsubInvite = onIncomingCall((payload) => {
      setInvite(payload);
      setAccepted(false);
      startRingtone();
    });
    const unsubCall = subscribeCall((snapshot) => {
      setActiveCall(snapshot);
      if (!snapshot) {
        setInvite(null);
        setAccepted(false);
        stopRingtone();
      }
    });
    return () => {
      unsubInvite?.();
      unsubCall?.();
      stopRingtone();
      const ctx = ringtoneCtxRef.current;
      if (ctx && typeof ctx.close === 'function' && ctx.state !== 'closed') {
        try { ctx.close(); } catch (_) { /* noop */ }
      }
      ringtoneCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRingtone = () => {
    stopRingtone();
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = ringtoneCtxRef.current || new Ctx();
      ringtoneCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const loop = () => {
        if (!ringtoneRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 720;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.75);
      };
      ringtoneRef.current = setInterval(loop, 1400);
      loop();

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        try {
          if (systemNotificationRef.current) {
            try { systemNotificationRef.current.close(); } catch (_) { /* noop */ }
          }
          systemNotificationRef.current = new Notification('مكالمة واردة', {
            body: 'يحاول مستخدم الاتصال بك',
            tag: 'yamshat-incoming-call',
            requireInteraction: true,
          });
        } catch (_) { /* noop */ }
      }
    } catch (_) { /* noop */ }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current);
      ringtoneRef.current = null;
    }
    if (systemNotificationRef.current) {
      try { systemNotificationRef.current.close(); } catch (_) { /* noop */ }
      systemNotificationRef.current = null;
    }
  };

  const handleAccept = async () => {
    if (!invite) return;
    stopRingtone();
    setAcceptError(null);
    setAccepted(true);
    try {
      await acceptIncomingCall(invite);
    } catch (err) {
      const desc = describeMediaError(err);
      setAcceptError(desc);
      setAccepted(false);
      try { rejectIncomingCall(invite, 'media_unavailable'); } catch (_) {}
    }
  };

  const handleReject = () => {
    if (!invite) return;
    rejectIncomingCall(invite, 'rejected');
    stopRingtone();
    setInvite(null);
    setAccepted(false);
    setAcceptError(null);
  };

  const handleClose = () => {
    setInvite(null);
    setAccepted(false);
    setAcceptError(null);
  };

  const handleMessage = () => {
    // Reject with message intent — real messaging hook can be wired later.
    if (!invite) return;
    try { rejectIncomingCall(invite, 'message'); } catch (_) {}
    stopRingtone();
    setInvite(null);
    setAcceptError(null);
  };

  const handleRemind = () => {
    // "تذكير" — silence ringtone but keep card visible briefly.
    stopRingtone();
  };

  // Show the live call sheet once we accepted (uses callService internally).
  if (accepted && activeCall) {
    return (
      <CallExperience
        open
        mode={activeCall.mode}
        callType="direct"
        participantName={activeCall.peer}
        incomingInvite={null /* already accepted via the service */}
        onClose={handleClose}
      />
    );
  }

  if (!invite) return null;

  const callerName = invite.caller || 'yamenameen97';
  const callerAvatar = invite.callerAvatar || invite.avatar || null;
  const isVideo = invite.mode === 'video';
  const initial = String(callerName).trim().slice(0, 1).toUpperCase();

  return (
    <div className="yam-inc-v79-root" dir="rtl" role="dialog" aria-modal="true" aria-label="مكالمة واردة">
      {/* Ambient purple radial glow */}
      <div className="yam-inc-v79-ambient" aria-hidden />

      {/* Neon Y logo at the very top */}
      <div className="yam-inc-v79-logo" aria-hidden>
        <Icon.YLogo width="40" height="40" />
      </div>

      {/* Caller identity */}
      <div className="yam-inc-v79-identity">
        <div className="yam-inc-v79-username">{callerName}</div>
        <div className="yam-inc-v79-subtitle">
          {isVideo ? 'مكالمة فيديو واردة...' : 'مكالمة صوتية واردة...'}
        </div>
      </div>

      {/* Avatar with concentric animated rings */}
      <div className="yam-inc-v79-avatar-wrap">
        <span className="yam-inc-v79-ring yam-inc-v79-ring-1" aria-hidden />
        <span className="yam-inc-v79-ring yam-inc-v79-ring-2" aria-hidden />
        <span className="yam-inc-v79-ring yam-inc-v79-ring-3" aria-hidden />
        <span className="yam-inc-v79-ring yam-inc-v79-ring-4" aria-hidden />
        <div className="yam-inc-v79-avatar">
          {callerAvatar ? (
            <img src={callerAvatar} alt={callerName} />
          ) : (
            <span className="yam-inc-v79-avatar-initial">{initial}</span>
          )}
        </div>
      </div>

      {/* Permission error banner (kept above the pills) */}
      {acceptError ? (
        <div className="yam-inc-v79-err" role="alert">
          <strong>⚠️ تعذّر الرد على المكالمة</strong>
          <span>{acceptError.message}</span>
        </div>
      ) : null}

      {/* Quick action pills: Message + Remind */}
      <div className="yam-inc-v79-pills">
        <button type="button" className="yam-inc-v79-pill" onClick={handleMessage} aria-label="إرسال رسالة">
          <Icon.Message width="16" height="16" />
          <span>رسالة</span>
        </button>
        <button type="button" className="yam-inc-v79-pill" onClick={handleRemind} aria-label="تذكير">
          <Icon.Bell width="16" height="16" />
          <span>تذكير</span>
        </button>
      </div>

      {/* Main accept / reject buttons */}
      <div className="yam-inc-v79-actions">
        <div className="yam-inc-v79-action-cell">
          <button
            type="button"
            className="yam-inc-v79-btn yam-inc-v79-btn-reject"
            onClick={handleReject}
            aria-label="رفض المكالمة"
          >
            <Icon.Close width="28" height="28" />
          </button>
          <span className="yam-inc-v79-action-label">رفض</span>
        </div>

        <div className="yam-inc-v79-action-cell">
          <button
            type="button"
            className="yam-inc-v79-btn yam-inc-v79-btn-accept"
            onClick={handleAccept}
            aria-label={acceptError ? 'إعادة المحاولة' : 'قبول المكالمة'}
          >
            <Icon.Phone width="28" height="28" />
          </button>
          <span className="yam-inc-v79-action-label">
            {acceptError ? 'إعادة المحاولة' : 'قبول'}
          </span>
        </div>
      </div>

      {/* Swipe-up hint */}
      <div className="yam-inc-v79-hint" aria-hidden>
        <Icon.ChevronUp width="20" height="20" />
        <span>اسحب للأعلى للرد</span>
      </div>

      <style>{`
        /* ────────────── ROOT ────────────── */
        .yam-inc-v79-root {
          position: fixed; inset: 0; z-index: 9998;
          background: #080914;
          color: #fff;
          font-family: 'SF Pro Display', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center;
          padding: max(48px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom));
          box-sizing: border-box;
        }
        .yam-inc-v79-ambient {
          position: absolute; inset: 0;
          background:
            radial-gradient(60% 40% at 50% 42%, rgba(127,61,255,0.22) 0%, rgba(127,61,255,0.06) 45%, transparent 70%),
            radial-gradient(80% 60% at 50% 100%, rgba(75,29,154,0.18) 0%, transparent 60%);
          pointer-events: none;
        }

        /* ────────────── NEON Y LOGO ────────────── */
        .yam-inc-v79-logo {
          position: relative;
          color: #A56BFF;
          display: grid; place-items: center;
          filter:
            drop-shadow(0 0 6px rgba(165,107,255,0.9))
            drop-shadow(0 0 14px rgba(127,61,255,0.6))
            drop-shadow(0 0 28px rgba(127,61,255,0.35));
          margin-bottom: 22px;
        }

        /* ────────────── IDENTITY ────────────── */
        .yam-inc-v79-identity {
          position: relative;
          text-align: center;
          margin-bottom: 28px;
        }
        .yam-inc-v79-username {
          font-size: 26px; font-weight: 700; color: #fff;
          letter-spacing: 0.2px;
          margin-bottom: 6px;
        }
        .yam-inc-v79-subtitle {
          font-size: 14px; font-weight: 400;
          color: rgba(255,255,255,0.62);
        }

        /* ────────────── AVATAR + RINGS ────────────── */
        .yam-inc-v79-avatar-wrap {
          position: relative;
          width: 190px; height: 190px;
          display: grid; place-items: center;
          margin-bottom: 40px;
        }
        .yam-inc-v79-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(165,107,255,0.28);
          pointer-events: none;
          animation: yam-inc-ring-pulse 3s ease-out infinite;
        }
        .yam-inc-v79-ring-1 { width: 100%; height: 100%; animation-delay: 0s; }
        .yam-inc-v79-ring-2 { width: 130%; height: 130%; animation-delay: 0.6s; border-color: rgba(165,107,255,0.20); }
        .yam-inc-v79-ring-3 { width: 165%; height: 165%; animation-delay: 1.2s; border-color: rgba(165,107,255,0.13); }
        .yam-inc-v79-ring-4 { width: 210%; height: 210%; animation-delay: 1.8s; border-color: rgba(165,107,255,0.07); }
        @keyframes yam-inc-ring-pulse {
          0%   { transform: scale(0.85); opacity: 0.9; }
          70%  { opacity: 0.35; }
          100% { transform: scale(1.15); opacity: 0; }
        }

        .yam-inc-v79-avatar {
          position: relative;
          width: 150px; height: 150px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(160deg, #3b1d6e 0%, #1a0a34 100%);
          box-shadow:
            0 0 0 3px #6D28D9,
            0 0 24px rgba(109,40,217,0.55),
            0 0 60px rgba(127,61,255,0.35);
          display: grid; place-items: center;
        }
        .yam-inc-v79-avatar img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .yam-inc-v79-avatar-initial {
          font-size: 62px; font-weight: 800; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }

        /* ────────────── PILLS (Message + Remind) ────────────── */
        .yam-inc-v79-pills {
          position: relative;
          display: flex;
          justify-content: center;
          gap: 60px;
          margin-bottom: 34px;
        }
        .yam-inc-v79-pill {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 9px 18px;
          display: inline-flex; align-items: center; gap: 8px;
          color: #fff; font-size: 13px; font-weight: 500;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: background .15s, transform .12s;
        }
        .yam-inc-v79-pill:hover { background: rgba(255,255,255,0.10); }
        .yam-inc-v79-pill:active { transform: scale(0.96); }
        .yam-inc-v79-pill svg { opacity: 0.9; }

        /* ────────────── ACTION BUTTONS ────────────── */
        .yam-inc-v79-actions {
          position: relative;
          display: flex;
          justify-content: center;
          gap: 90px;
          margin-bottom: 26px;
        }
        .yam-inc-v79-action-cell {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .yam-inc-v79-btn {
          width: 68px; height: 68px; border-radius: 50%;
          border: none;
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          transition: transform .12s, box-shadow .2s, background .15s;
        }
        .yam-inc-v79-btn:active { transform: scale(0.94); }
        .yam-inc-v79-btn-reject {
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .yam-inc-v79-btn-reject:hover { background: rgba(255,255,255,0.16); }
        .yam-inc-v79-btn-accept {
          background: #7F3DFF;
          box-shadow:
            0 10px 24px rgba(127,61,255,0.5),
            0 0 0 6px rgba(127,61,255,0.12);
          animation: yam-inc-accept-pulse 1.8s ease-in-out infinite;
        }
        .yam-inc-v79-btn-accept:hover { background: #8F52FF; }
        @keyframes yam-inc-accept-pulse {
          0%,100% { box-shadow: 0 10px 24px rgba(127,61,255,0.5), 0 0 0 6px rgba(127,61,255,0.12); }
          50%     { box-shadow: 0 10px 28px rgba(127,61,255,0.65), 0 0 0 12px rgba(127,61,255,0.06); }
        }
        .yam-inc-v79-action-label {
          font-size: 14px; font-weight: 500; color: #fff;
        }

        /* ────────────── SWIPE-UP HINT ────────────── */
        .yam-inc-v79-hint {
          position: relative;
          margin-top: auto;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
        }
        .yam-inc-v79-hint svg { animation: yam-inc-hint-bounce 1.6s ease-in-out infinite; }
        @keyframes yam-inc-hint-bounce {
          0%,100% { transform: translateY(0); opacity: 0.5; }
          50%     { transform: translateY(-6px); opacity: 1; }
        }

        /* ────────────── ERROR ────────────── */
        .yam-inc-v79-err {
          position: relative;
          margin: -10px 0 22px;
          background: rgba(248,113,113,0.14);
          border: 1px solid rgba(248,113,113,0.36);
          color: #fee2e2;
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13px;
          text-align: center;
          max-width: 340px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .yam-inc-v79-err strong { font-weight: 700; }

        /* ────────────── RESPONSIVE ────────────── */
        @media (max-height: 700px) {
          .yam-inc-v79-avatar-wrap { width: 160px; height: 160px; margin-bottom: 26px; }
          .yam-inc-v79-avatar { width: 128px; height: 128px; }
          .yam-inc-v79-avatar-initial { font-size: 52px; }
          .yam-inc-v79-username { font-size: 22px; }
          .yam-inc-v79-pills { margin-bottom: 24px; }
          .yam-inc-v79-actions { gap: 70px; }
          .yam-inc-v79-btn { width: 60px; height: 60px; }
        }
        @media (max-width: 360px) {
          .yam-inc-v79-pills { gap: 36px; }
          .yam-inc-v79-actions { gap: 60px; }
        }
      `}</style>
    </div>
  );
}
