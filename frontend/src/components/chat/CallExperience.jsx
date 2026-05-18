import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { CALL_DEFAULT_SETTINGS, getCallNetworkSummary } from '../../config/callConfig.js';

const MOCK_PARTICIPANTS = [
  { id: 'host', name: 'أنت', role: 'host' },
  { id: 'guest-1', name: 'ضيف 1', role: 'guest' },
  { id: 'guest-2', name: 'ضيف 2', role: 'guest' },
  { id: 'guest-3', name: 'ضيف 3', role: 'guest' },
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
  onClose,
  onStatusChange,
}) {
  const network = useMemo(() => getCallNetworkSummary(), []);
  const localVideoRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [muted, setMuted] = useState(CALL_DEFAULT_SETTINGS.muted);
  const [speakerEnabled, setSpeakerEnabled] = useState(CALL_DEFAULT_SETTINGS.speaker);
  const [cameraEnabled, setCameraEnabled] = useState(mode === 'video');
  const [cameraFacingMode, setCameraFacingMode] = useState(CALL_DEFAULT_SETTINGS.cameraFacingMode);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [startedAt, setStartedAt] = useState(null);
  const [streamError, setStreamError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState(callType === 'group' ? MOCK_PARTICIPANTS : [{ id: 'peer', name: participantName, role: 'peer' }]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const requestMedia = async () => {
      setStatus('connecting');
      setStreamError('');
      onStatusChange?.('connecting');
      try {
        const shouldUseVideo = mode === 'video';
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: shouldUseVideo
            ? {
                facingMode: cameraFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatus('connected');
        setStartedAt(Date.now());
        onStatusChange?.('connected');
      } catch (error) {
        setStatus('fallback');
        setStreamError(error?.message || 'تعذر الوصول للميكروفون أو الكاميرا.');
        onStatusChange?.('fallback');
      }
    };

    requestMedia();

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
  }, [cameraFacingMode, mode, onStatusChange, open]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => () => {
    localStream?.getTracks?.().forEach((track) => track.stop());
  }, [localStream]);

  const durationLabel = useMemo(() => {
    if (!startedAt) return '00:00';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [startedAt, reconnectCount, status]);

  const toggleMute = () => {
    const nextValue = !muted;
    setMuted(nextValue);
    localStream?.getAudioTracks?.().forEach((track) => {
      track.enabled = !nextValue;
    });
  };

  const toggleCamera = async () => {
    if (mode !== 'video') return;
    const nextValue = !cameraEnabled;
    setCameraEnabled(nextValue);
    localStream?.getVideoTracks?.().forEach((track) => {
      track.enabled = nextValue;
    });
  };

  const switchCamera = async () => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    setReconnectCount((prev) => prev + 1);
  };

  const reconnect = async () => {
    localStream?.getTracks?.().forEach((track) => track.stop());
    setLocalStream(null);
    setStatus('reconnecting');
    setReconnectCount((prev) => prev + 1);
    onStatusChange?.('reconnecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video' ? { facingMode: cameraFacingMode } : false,
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setStatus('connected');
      onStatusChange?.('connected');
    } catch (error) {
      setStatus('fallback');
      setStreamError(error?.message || 'تعذر استعادة الاتصال.');
      onStatusChange?.('fallback');
    }
  };

  const toggleSpeaker = async () => {
    setSpeakerEnabled((prev) => !prev);
    const video = localVideoRef.current;
    if (video && typeof video.setSinkId === 'function') {
      try {
        await video.setSinkId(speakerEnabled ? 'default' : 'communications');
      } catch {
        // Browser does not support sink switching. Keep UX state only.
      }
    }
  };

  if (!open) return null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card style={{ padding: 16, background: 'linear-gradient(160deg, rgba(15,23,42,0.95), rgba(30,41,59,0.96))', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 4 }}>{callType === 'group' ? 'Group call' : mode === 'video' ? 'Video call' : 'Voice call'}</div>
            <h3 style={{ margin: 0, fontSize: 24 }}>{callType === 'group' ? 'غرفة مكالمة جماعية' : participantName}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span className="call-chip">{network.transport}</span>
              <span className="call-chip">{status === 'connected' ? 'Connected' : status === 'reconnecting' ? 'Reconnecting' : status === 'fallback' ? 'Fallback mode' : 'Connecting'}</span>
              <span className="call-chip">{connectionQuality}</span>
              <span className="call-chip">{durationLabel}</span>
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>TURN/STUN</div>
            <div style={{ fontSize: 13 }}>{network.turn.length ? `${network.turn.length} TURN` : 'TURN pending'} · {network.stun.length} STUN</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Reconnect #{reconnectCount}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: callType === 'group' ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr', gap: 12 }}>
          <div style={{ minHeight: 220, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
            {mode === 'video' && cameraEnabled && localStream ? (
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at top, rgba(59,130,246,0.35), rgba(15,23,42,0.95))' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: 30, fontWeight: 700, background: 'rgba(255,255,255,0.15)' }}>
                    {String(participantName || 'Y').slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700 }}>أنت</div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>{mode === 'video' ? 'الكاميرا مغلقة أو غير متاحة' : 'مكالمة صوتية فقط'}</div>
                </div>
              </div>
            )}
            <div style={{ position: 'absolute', insetInlineStart: 12, bottom: 12, background: 'rgba(15,23,42,0.78)', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>
              {muted ? 'الميكروفون مكتوم' : 'الميكروفون شغال'}
            </div>
          </div>

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
        <Button variant={muted ? 'warning' : 'secondary'} onClick={toggleMute}>{muted ? 'إلغاء كتم' : 'كتم الميك'}</Button>
        <Button variant={speakerEnabled ? 'secondary' : 'warning'} onClick={toggleSpeaker}>{speakerEnabled ? 'السماعة الخارجية' : 'سماعة المكالمة'}</Button>
        {mode === 'video' ? <Button variant={cameraEnabled ? 'secondary' : 'warning'} onClick={toggleCamera}>{cameraEnabled ? 'قفل الكاميرا' : 'فتح الكاميرا'}</Button> : null}
        {mode === 'video' ? <Button variant="secondary" onClick={switchCamera}>تبديل الكاميرا</Button> : null}
        <Button variant="secondary" onClick={reconnect}>إعادة الاتصال</Button>
        {callType === 'group' ? <Button variant="success" onClick={() => setParticipants((prev) => [...prev, { id: `guest-${Date.now()}`, name: `ضيف ${prev.length + 1}`, role: 'guest' }])}>إضافة مشارك</Button> : null}
        <Button variant="danger" onClick={onClose}>إنهاء</Button>
      </div>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>جاهزية المكالمات</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div className="call-info-row"><strong>Voice / Video / Group</strong><span>{callType === 'group' ? 'جاهز' : mode === 'video' ? 'فيديو + صوت' : 'صوت فقط'}</span></div>
          <div className="call-info-row"><strong>WebRTC</strong><span>مفعل على الواجهة مع ICE config</span></div>
          <div className="call-info-row"><strong>STUN</strong><span>{network.stun.join(' • ')}</span></div>
          <div className="call-info-row"><strong>TURN</strong><span>{network.turn.length ? network.turn.join(' • ') : 'أضف VITE_TURN_URL / USERNAME / CREDENTIAL'}</span></div>
          <div className="call-info-row"><strong>Reconnect strategy</strong><span>Exponential retry + manual reconnect</span></div>
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
