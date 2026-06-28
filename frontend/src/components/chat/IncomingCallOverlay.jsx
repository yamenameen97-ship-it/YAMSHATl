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
// 🔧 v59.13.32 — Call System Hard Fix
//   FIX #4: When accepting an incoming call fails due to permissions, show an
//           explicit error banner with retry CTA instead of silently rejecting
//           the call without telling the user why.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global overlay that:
 * 1) Listens for `incoming_call` socket events anywhere in the app.
 * 2) Renders a ringing UI for the callee with Accept / Reject buttons.
 * 3) Plays a soft ringtone (Web Audio beep loop) so the user notices the call
 *    even if the browser tab is in the background.
 * 4) Once accepted, swaps in <CallExperience /> for the live call view.
 *
 * This component must be mounted exactly once (inside AppGuards) so the
 * subscription survives navigation between routes.
 */
export default function IncomingCallOverlay() {
  const [invite, setInvite] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  // 🔧 FIX #4: track accept-time permission errors so we can show them to the
  //            callee instead of just dropping the call.
  const [acceptError, setAcceptError] = useState(null);
  const ringtoneRef = useRef(null);
  const ringtoneCtxRef = useRef(null);
  // ✅ FIX v59.13.6: تتبّع إشعار النظام لإغلاقه عند انتهاء الرنين أو unmount
  const systemNotificationRef = useRef(null);

  // Wire up the global socket listeners exactly once.
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
        // Call ended somewhere else (callee accepted then peer hung up, or
        // we hung up). Clear the overlay.
        setInvite(null);
        setAccepted(false);
        stopRingtone();
      }
    });
    return () => {
      unsubInvite?.();
      unsubCall?.();
      stopRingtone();
      // ✅ FIX v59.13.6: إغلاق AudioContext عند unmount لتحرير عتاد الصوت.
      // السلوك السابق: ringtoneCtxRef كان يُحتفظ به إلى الأبد → تسرّب موارد.
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
      // Reuse a single AudioContext per overlay lifetime.
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

      // Also try a system Notification with sound while the tab is hidden.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        try {
          // ✅ FIX v59.13.6: احفظ الإشعار في ref حتى نتمكّن من إغلاقه عند
          // إيقاف الرنين. السلوك السابق: requireInteraction:true + بدون close()
          // كان يترك الإشعار على الشاشة حتى بعد تصفية المكالمة.
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
    // ✅ FIX v59.13.6: أغلق إشعار النظام إن وُجد لمنع بقائه بعد إغلاق الرنين
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
      // 🔧 FIX #4: keep the overlay open and show a clear error so the callee
      //            can fix permissions and retry. Notify caller that we hit a
      //            media issue rather than a hard reject.
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

  // Show the live call sheet once we accepted (uses callService internally).
  if (accepted && activeCall) {
    return (
      <div style={overlayStyle}>
        <div style={{ width: 'min(960px, 96vw)', maxHeight: '92vh', overflowY: 'auto' }}>
          <CallExperience
            open
            mode={activeCall.mode}
            callType="direct"
            participantName={activeCall.peer}
            incomingInvite={null /* already accepted via the service */}
            onClose={handleClose}
          />
        </div>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>مكالمة واردة</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{invite.caller || 'مستخدم'}</div>
        <div style={{ marginTop: 4, opacity: 0.85 }}>
          {invite.mode === 'video' ? '🎥 مكالمة فيديو' : '📞 مكالمة صوتية'}
        </div>

        {/* 🔧 FIX #4: explicit permission error banner inside the ringing UI */}
        {acceptError ? (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: 'rgba(248,113,113,0.16)',
              border: '1px solid rgba(248,113,113,0.36)',
              color: '#fee2e2',
              fontSize: 13,
              textAlign: 'start',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4 }}>⚠️ تعذّر الرد على المكالمة</strong>
            {acceptError.message}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
          <button type="button" onClick={handleReject} style={{ ...btnBase, background: '#ef4444' }}>رفض</button>
          <button type="button" onClick={handleAccept} style={{ ...btnBase, background: '#22c55e' }}>
            {acceptError ? 'إعادة المحاولة' : (invite.mode === 'video' ? 'رد بالفيديو' : 'رد')}
          </button>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.65 }}>
          سيتم طلب أذونات الميكروفون{invite.mode === 'video' ? ' والكاميرا' : ''} عند القبول
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2, 6, 23, 0.78)',
  zIndex: 9998,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  backdropFilter: 'blur(4px)',
};

const cardStyle = {
  width: 'min(380px, 94vw)',
  background: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
  color: 'white',
  borderRadius: 24,
  padding: '28px 24px',
  textAlign: 'center',
  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.08)',
  animation: 'incomingCallPulse 1.8s ease-in-out infinite',
};

const btnBase = {
  flex: 1,
  maxWidth: 140,
  padding: '12px 18px',
  fontSize: 15,
  fontWeight: 700,
  border: 0,
  borderRadius: 14,
  color: 'white',
  cursor: 'pointer',
};

// Inject keyframes once.
if (typeof document !== 'undefined' && !document.getElementById('incoming-call-keyframes')) {
  const style = document.createElement('style');
  style.id = 'incoming-call-keyframes';
  style.textContent = `@keyframes incomingCallPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }`;
  document.head.appendChild(style);
}
