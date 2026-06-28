import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
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
// 🔧 v59.13.32 — Call System Hard Fix
//   FIX #1: Render the call sheet as a full-screen overlay (own portal-style
//           container, position: fixed) so the post-call UI is visible above
//           the chat column on every breakpoint.
//   FIX #2: Show explicit, actionable permission errors (camera/mic) with a
//           "Retry" button and link to browser settings instructions.
//   FIX #5: Stop attached srcObject + null it out on unmount/teardown so the
//           camera LED turns off and there's no memory leak.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PARTICIPANTS = [
  { id: 'host', name: 'أنت', role: 'host' },
  { id: 'guest-1', name: 'ضيف 1', role: 'guest' },
];

function avatarGradient(index = 0) {
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    'linear-gradient(135deg, #f97316, #ef4444)',
    'linear-gradient(135deg, #10b981, #14b8a6)',
    'linear-gradient(135deg, #eab308, #f97316)',
  ];
  return gradients[index % gradients.length];
}

export default function CallExperience({
  open,
  mode = 'voice',
  callType = 'direct',
  participantName = 'المستخدم',
  // When `incomingInvite` is set we render the answer UI for an inbound call.
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
  const [reconnectCount, setReconnectCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  // 🔧 FIX #2: structured error { code, message } instead of plain string.
  const [streamError, setStreamError] = useState(null);
  const [permissionHint, setPermissionHint] = useState(null);
  const [participants] = useState(callType === 'group' ? MOCK_PARTICIPANTS : [{ id: 'peer', name: participantName, role: 'peer' }]);

  // Subscribe to global call state so we know when the remote side answers /
  // hangs up and we get the remote MediaStream.
  useEffect(() => {
    if (!open) return undefined;
    const unsubscribe = subscribeCall((snapshot) => {
      setCallState(snapshot);
      if (snapshot?.status) onStatusChange?.(snapshot.status);
      if (snapshot?.mediaError) setStreamError(snapshot.mediaError);
      if (!snapshot) {
        // The other side hung up or the call ended elsewhere.
        onClose?.();
      }
    });
    return () => unsubscribe?.();
  }, [open, onClose, onStatusChange]);

  // 🔧 FIX #2: pre-flight permission probe so we can warn BEFORE the modal
  //            tries to grab the camera / mic.
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

  // Kick off the actual signaling once the modal is opened.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const run = async () => {
      try {
        if (incomingInvite) {
          await svcAcceptIncoming(incomingInvite);
        } else {
          await svcStartCall({ peer: participantName, mode });
        }
        if (cancelled) return;
        setStreamError(null);
      } catch (err) {
        // 🔧 FIX #2: map raw DOMException → friendly message.
        const desc = describeMediaError(err);
        setStreamError(desc);
      }
    };
    run();
    const qualityTimer = window.setInterval(() => {
      setConnectionQuality((prev) => {
        if (prev === 'excellent') return 'good';
        if (prev === 'good') return 'stable';
        return 'excellent';
      });
    }, 6000);
    return () => {
      cancelled = true;
      window.clearInterval(qualityTimer);
    };
    // Intentionally omit `mode`/`participantName` from deps: the call session
    // is established once when the modal opens, and changing those after the
    // fact would tear down the live call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Attach the local stream to the <video> element.
  useEffect(() => {
    const active = callService.getActiveCall();
    if (localVideoRef.current && active?.localStream) {
      localVideoRef.current.srcObject = active.localStream;
    }
  }, [callState]);

  // Attach the remote stream to its <video>/<audio> element.
  useEffect(() => {
    if (remoteVideoRef.current && callState?.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState?.remoteStream]);

  // 🔧 FIX #5: clear srcObject on unmount so the <video>/<audio> element
  //            releases its reference to the MediaStream. Otherwise the camera
  //            LED stays on for ~10s after the modal closes on Chromium.
  useEffect(() => () => {
    try {
      if (localVideoRef.current) {
        const ls = localVideoRef.current.srcObject;
        if (ls && typeof ls.getTracks === 'function') {
          ls.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
        }
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    } catch (_) { /* noop */ }
  }, []);

  const status = callState?.status || 'connecting';

  const durationLabel = useMemo(() => {
    const startedAt = callState?.startedAt;
    if (!startedAt) return '00:00';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [callState?.startedAt, reconnectCount, status]);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    svcToggleMute(next);
  };

  const handleToggleCamera = () => {
    if (mode !== 'video') return;
    const next = !cameraEnabled;
    setCameraEnabled(next);
    svcToggleCamera(next);
  };

  const handleHangup = () => {
    svcEndCall('hangup');
    onClose?.();
  };

  const reconnect = () => {
    setReconnectCount((prev) => prev + 1);
    setStreamError(null);
    // Try to restart media if it failed previously.
    (async () => {
      try {
        if (incomingInvite) {
          await svcAcceptIncoming(incomingInvite);
        } else {
          await svcStartCall({ peer: participantName, mode });
        }
      } catch (err) {
        setStreamError(describeMediaError(err));
      }
    })();
  };

  const toggleSpeaker = async () => {
    setSpeakerEnabled((prev) => !prev);
    const audio = remoteVideoRef.current;
    if (audio && typeof audio.setSinkId === 'function') {
      try {
        await audio.setSinkId(speakerEnabled ? 'default' : 'communications');
      } catch {
        // sink switching not supported
      }
    }
  };

  if (!open) return null;

  const peerLabel = callState?.peer || participantName;
  const effectiveMode = callState?.mode || mode;
  const activeError = streamError || permissionHint;

  return (
    // 🔧 FIX #1: full-screen fixed overlay so the post-call sheet is always
    //            visible above the chat layout (works on mobile + desktop).
    <div className="yam-call-sheet-root" role="dialog" aria-modal="true" aria-label="مكالمة">
      <div className="yam-call-sheet-scrim" onClick={handleHangup} />
      <div className="yam-call-sheet-body" dir="rtl">
        {/* Top bar: title + close — FIX #1: visible close button */}
        <div className="yam-call-sheet-header">
          <div>
            <div className="yam-call-sheet-eyebrow">
              {callType === 'group' ? 'مكالمة جماعية' : effectiveMode === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
            </div>
            <h3 className="yam-call-sheet-title">{callType === 'group' ? 'غرفة مكالمة جماعية' : peerLabel}</h3>
          </div>
          <button
            type="button"
            className="yam-call-sheet-close"
            onClick={handleHangup}
            aria-label="إغلاق المكالمة"
          >
            ✕
          </button>
        </div>

      <Card style={{ padding: 16, background: 'linear-gradient(160deg, rgba(15,23,42,0.95), rgba(30,41,59,0.96))', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 4 }}>
              {callType === 'group' ? 'Group call' : effectiveMode === 'video' ? 'Video call' : 'Voice call'}
            </div>
            <h3 style={{ margin: 0, fontSize: 24 }}>{callType === 'group' ? 'غرفة مكالمة جماعية' : peerLabel}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span className="call-chip">{network.transport}</span>
              <span className="call-chip">
                {status === 'connected' ? 'متصل' : status === 'ringing' ? 'يرن...' : status === 'reconnecting' ? 'إعادة الاتصال' : status === 'rejected' ? 'تم الرفض' : 'يتصل...'}
              </span>
              <span className="call-chip">{connectionQuality}</span>
              <span className="call-chip">{durationLabel}</span>
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>TURN/STUN</div>
            <div style={{ fontSize: 13 }}>{network.turn.length ? `${network.turn.length} TURN` : 'TURN غير متاح'} · {network.stun.length} STUN</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Reconnect #{reconnectCount}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: callType === 'group' ? 'repeat(auto-fit, minmax(160px, 1fr))' : (effectiveMode === 'video' ? '1fr 1fr' : '1fr'), gap: 12 }}>
          {/* Local preview */}
          <div style={{ minHeight: 220, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
            {effectiveMode === 'video' && cameraEnabled ? (
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, rgba(59,130,246,0.35), rgba(15,23,42,0.95))' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: 30, fontWeight: 700, background: 'rgba(255,255,255,0.15)' }}>
                    Y
                  </div>
                  <div style={{ fontWeight: 700 }}>أنت</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{effectiveMode === 'video' ? 'الكاميرا مغلقة' : 'مكالمة صوتية'}</div>
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', insetInlineStart: 12, bottom: 12, background: 'rgba(15,23,42,0.78)', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>
              {muted ? 'الميك مكتوم' : 'الميك شغال'}
            </div>
          </div>

          {/* Remote preview (only for direct calls) */}
          {callType !== 'group' ? (
            <div style={{ minHeight: 220, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              {callState?.remoteStream ? (
                effectiveMode === 'video' ? (
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <audio ref={remoteVideoRef} autoPlay />
                    <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, rgba(139,92,246,0.35), rgba(15,23,42,0.95))' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: 30, fontWeight: 700, background: 'rgba(255,255,255,0.15)' }}>
                          {String(peerLabel || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700 }}>{peerLabel}</div>
                        <div style={{ opacity: 0.75, fontSize: 12 }}>المكالمة قيد التشغيل</div>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, rgba(236,72,153,0.35), rgba(15,23,42,0.95))' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: 30, fontWeight: 700, background: 'rgba(255,255,255,0.15)' }}>
                      {String(peerLabel || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700 }}>{peerLabel}</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>{status === 'ringing' ? 'يرن... في انتظار الرد' : 'جاري الاتصال...'}</div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {callType === 'group'
            ? participants.map((participant, index) => (
                <div key={participant.id} style={{ minHeight: 220, borderRadius: 20, overflow: 'hidden', background: avatarGradient(index), position: 'relative', display: 'grid', placeItems: 'center' }}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', margin: '0 auto 10px', fontSize: 26, fontWeight: 700 }}>
                      {participant.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 700 }}>{participant.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{participant.role === 'host' ? 'Host' : 'Participant'}</div>
                  </div>
                </div>
              ))
            : null}
        </div>

        {activeError ? (
          // 🔧 FIX #2: clear, actionable error banner with retry CTA.
          <div className="yam-call-error" role="alert">
            <div className="yam-call-error-title">
              <span aria-hidden>⚠️</span>
              <span>{activeError.code === 'permission_denied' ? 'الأذونات مطلوبة' : activeError.code === 'insecure_context' ? 'اتصال غير آمن' : activeError.code === 'no_device' ? 'لا يوجد جهاز' : activeError.code === 'device_busy' ? 'الجهاز مشغول' : 'تعذّر بدء المكالمة'}</span>
            </div>
            <div className="yam-call-error-msg">{activeError.message}</div>
            <div className="yam-call-error-actions">
              <Button variant="secondary" onClick={reconnect}>إعادة المحاولة</Button>
              {activeError.code === 'permission_denied' ? (
                <a
                  className="yam-call-error-help"
                  href="https://support.google.com/chrome/answer/2693767"
                  target="_blank"
                  rel="noreferrer"
                >كيفية تفعيل الأذونات؟</a>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 14 }}>
        <Button variant={muted ? 'warning' : 'secondary'} onClick={handleToggleMute}>{muted ? 'إلغاء كتم' : 'كتم الميك'}</Button>
        <Button variant={speakerEnabled ? 'secondary' : 'warning'} onClick={toggleSpeaker}>{speakerEnabled ? 'السماعة الخارجية' : 'سماعة المكالمة'}</Button>
        {effectiveMode === 'video' ? <Button variant={cameraEnabled ? 'secondary' : 'warning'} onClick={handleToggleCamera}>{cameraEnabled ? 'قفل الكاميرا' : 'فتح الكاميرا'}</Button> : null}
        <Button variant="secondary" onClick={reconnect}>إعادة الاتصال</Button>
        <Button variant="danger" onClick={handleHangup}>إنهاء</Button>
      </div>

      <Card style={{ padding: 16, marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>جاهزية المكالمات</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="call-info-row"><strong>الوضع</strong><span>{callType === 'group' ? 'جماعي' : effectiveMode === 'video' ? 'فيديو + صوت' : 'صوت فقط'}</span></div>
          <div className="call-info-row"><strong>WebRTC</strong><span>إشارات عبر السوكت + ICE</span></div>
          <div className="call-info-row"><strong>STUN</strong><span>{network.stun.join(' • ')}</span></div>
          <div className="call-info-row"><strong>TURN</strong><span>{network.turn.length ? network.turn.join(' • ') : 'أضف VITE_TURN_URL / USERNAME / CREDENTIAL'}</span></div>
          <div className="call-info-row"><strong>الحالة</strong><span>{status}</span></div>
        </div>
      </Card>

      <style>{`
        /* 🔧 FIX #1: full-screen overlay */
        .yam-call-sheet-root {
          position: fixed;
          inset: 0;
          z-index: 9997;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .yam-call-sheet-scrim {
          position: absolute;
          inset: 0;
          background: rgba(2,6,23,0.72);
          backdrop-filter: blur(8px);
          cursor: pointer;
        }
        .yam-call-sheet-body {
          position: relative;
          width: min(960px, 96vw);
          max-height: 92vh;
          overflow-y: auto;
          background: linear-gradient(160deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.55);
          color: #fff;
        }
        .yam-call-sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .yam-call-sheet-eyebrow {
          font-size: 12px;
          opacity: 0.7;
          letter-spacing: 0.02em;
        }
        .yam-call-sheet-title {
          margin: 4px 0 0;
          font-size: 20px;
          font-weight: 800;
        }
        .yam-call-sheet-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background 0.15s, transform 0.12s;
          flex-shrink: 0;
        }
        .yam-call-sheet-close:hover {
          background: rgba(239,68,68,0.85);
          transform: scale(1.05);
        }
        .call-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
        }
        .call-info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          font-size: 13px;
        }
        /* 🔧 FIX #2: explicit error banner */
        .yam-call-error {
          margin-top: 14px;
          border-radius: 14px;
          padding: 14px;
          background: rgba(248,113,113,0.14);
          border: 1px solid rgba(248,113,113,0.32);
          font-size: 13px;
          display: grid;
          gap: 8px;
        }
        .yam-call-error-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          color: #fecaca;
        }
        .yam-call-error-msg {
          color: #fee2e2;
          line-height: 1.55;
        }
        .yam-call-error-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .yam-call-error-help {
          color: #fbbf24;
          text-decoration: underline;
          font-size: 12px;
        }
        @media (max-width: 640px) {
          .yam-call-sheet-body {
            width: 100vw;
            max-height: 100vh;
            border-radius: 0;
            padding: 14px;
          }
          .yam-call-sheet-root {
            padding: 0;
          }
          .call-info-row {
            flex-direction: column;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
