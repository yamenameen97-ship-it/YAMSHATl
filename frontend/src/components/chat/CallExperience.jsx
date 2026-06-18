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
} from '../../services/callService.js';

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
  const [streamError, setStreamError] = useState('');
  const [participants] = useState(callType === 'group' ? MOCK_PARTICIPANTS : [{ id: 'peer', name: participantName, role: 'peer' }]);

  // Subscribe to global call state so we know when the remote side answers /
  // hangs up and we get the remote MediaStream.
  useEffect(() => {
    if (!open) return undefined;
    const unsubscribe = subscribeCall((snapshot) => {
      setCallState(snapshot);
      if (snapshot?.status) onStatusChange?.(snapshot.status);
      if (!snapshot) {
        // The other side hung up or the call ended elsewhere.
        onClose?.();
      }
    });
    return () => unsubscribe?.();
  }, [open, onClose, onStatusChange]);

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
        setStreamError('');
      } catch (err) {
        setStreamError(err?.message || 'تعذر بدء المكالمة. تأكد من السماح بالميكروفون والكاميرا.');
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

  useEffect(() => () => {
    // Tear down on unmount only if the modal is closing.
    // The actual call lifecycle is managed by callService.
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

  return (
    <div style={{ display: 'grid', gap: 16 }}>
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

        {streamError ? (
          <div style={{ marginTop: 14, borderRadius: 14, padding: 12, background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 13 }}>
            {streamError}
          </div>
        ) : null}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <Button variant={muted ? 'warning' : 'secondary'} onClick={handleToggleMute}>{muted ? 'إلغاء كتم' : 'كتم الميك'}</Button>
        <Button variant={speakerEnabled ? 'secondary' : 'warning'} onClick={toggleSpeaker}>{speakerEnabled ? 'السماعة الخارجية' : 'سماعة المكالمة'}</Button>
        {effectiveMode === 'video' ? <Button variant={cameraEnabled ? 'secondary' : 'warning'} onClick={handleToggleCamera}>{cameraEnabled ? 'قفل الكاميرا' : 'فتح الكاميرا'}</Button> : null}
        <Button variant="secondary" onClick={reconnect}>إعادة الاتصال</Button>
        <Button variant="danger" onClick={handleHangup}>إنهاء</Button>
      </div>

      <Card style={{ padding: 16 }}>
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
        @media (max-width: 640px) {
          .call-info-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
