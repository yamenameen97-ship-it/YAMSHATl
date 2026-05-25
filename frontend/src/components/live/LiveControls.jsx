import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const baseButtonStyle = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  border: 'none',
  color: 'white',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 25px rgba(0,0,0,0.18)',
};

const panelStyle = {
  position: 'absolute',
  top: 86,
  background: 'rgba(12, 18, 33, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
  minWidth: 250,
  zIndex: 120,
  backdropFilter: 'blur(10px)',
  color: 'white',
};

const GIFTS = [
  { id: 1, name: 'وردة', emoji: '🌹', coins: 10 },
  { id: 2, name: 'قهوة', emoji: '☕', coins: 50 },
  { id: 3, name: 'قلب', emoji: '❤️', coins: 100 },
  { id: 4, name: 'تاج', emoji: '👑', coins: 500 },
];

const QUALITIES = [
  { id: 'auto', label: 'تلقائي' },
  { id: 'ultra', label: 'Ultra' },
  { id: 'hd', label: 'HD' },
  { id: 'sd', label: 'SD' },
  { id: 'low', label: 'Low' },
  { id: 'audioOnly', label: 'صوت فقط' },
];

function ActionButton({ title, active = false, danger = false, color, onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        ...baseButtonStyle,
        background: color || (danger ? '#ef4444' : active ? '#0ea5e9' : 'rgba(255,255,255,0.14)'),
      }}
      title={title}
      type="button"
    >
      {children}
    </motion.button>
  );
}

function Chip({ label, value, accent = '#38bdf8' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 10px', minWidth: 74 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

export default function LiveControls({
  isMuted: controlledMuted,
  isCameraOff: controlledCameraOff,
  isRecording = false,
  recordingState = 'idle',
  reconnecting = false,
  streamMode = 'auto',
  viewerLatencyMs = 0,
  coHostCount = 0,
  pendingGuestsCount = 0,
  moderationQueueCount = 0,
  healthScore = 100,
  disabled = false,
  onMuteToggle,
  onCameraToggle,
  onCoHostAdd,
  onModerate,
  onSendGift,
  onReconnect,
  onRecordingToggle,
  onChangeQuality,
  onOpenAnalytics,
  onManageGuests,
  onStartRecovery,
}) {
  const [isMutedInternal, setIsMutedInternal] = useState(false);
  const [isCameraOffInternal, setIsCameraOffInternal] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);

  const isMuted = typeof controlledMuted === 'boolean' ? controlledMuted : isMutedInternal;
  const isCameraOff = typeof controlledCameraOff === 'boolean' ? controlledCameraOff : isCameraOffInternal;

  const healthLabel = useMemo(() => {
    if (healthScore >= 85) return { text: 'ممتاز', color: '#10b981' };
    if (healthScore >= 65) return { text: 'جيد', color: '#f59e0b' };
    if (healthScore >= 40) return { text: 'ضعيف', color: '#f97316' };
    return { text: 'حرج', color: '#ef4444' };
  }, [healthScore]);

  const toggleMute = () => {
    if (disabled) return;
    const next = !isMuted;
    if (typeof controlledMuted !== 'boolean') setIsMutedInternal(next);
    onMuteToggle?.(next);
  };

  const toggleCamera = () => {
    if (disabled) return;
    const next = !isCameraOff;
    if (typeof controlledCameraOff !== 'boolean') setIsCameraOffInternal(next);
    onCameraToggle?.(next);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 16, background: 'rgba(0,0,0,0.48)', borderRadius: 18 }}>
      <ActionButton title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'} active={!isMuted} color={isMuted ? '#ef4444' : '#0ea5e9'} onClick={toggleMute}>
        {isMuted ? '🔇' : '🎤'}
      </ActionButton>

      <ActionButton title={isCameraOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'} active={!isCameraOff} color={isCameraOff ? '#ef4444' : '#0ea5e9'} onClick={toggleCamera}>
        {isCameraOff ? '📷' : '📹'}
      </ActionButton>

      <ActionButton title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'} active={isRecording} danger={isRecording} onClick={() => onRecordingToggle?.(!isRecording)}>
        {isRecording ? '⏹️' : '⏺️'}
      </ActionButton>

      <ActionButton title="إدارة الضيوف والمضيفين" active={pendingGuestsCount > 0 || coHostCount > 0} onClick={() => onManageGuests?.()}>
        👥
      </ActionButton>

      <ActionButton title="أدوات الإشراف" active={showModerationPanel || moderationQueueCount > 0} onClick={() => setShowModerationPanel((prev) => !prev)}>
        🛡️
      </ActionButton>

      <ActionButton title="الجودة والبث التكيفي" active={showQualityPanel} onClick={() => setShowQualityPanel((prev) => !prev)}>
        📶
      </ActionButton>

      <ActionButton title="إرسال هدية" color="gold" onClick={() => setShowGiftPanel((prev) => !prev)}>
        🎁
      </ActionButton>

      <ActionButton title="إعادة الاتصال" danger={reconnecting} onClick={() => onReconnect?.()}>
        {reconnecting ? '🔄' : '♻️'}
      </ActionButton>

      <ActionButton title="استعادة البث" onClick={() => onStartRecovery?.()}>
        🧷
      </ActionButton>

      <ActionButton title="التحليلات المباشرة" onClick={() => onOpenAnalytics?.()}>
        📊
      </ActionButton>

      <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip label="الصحة" value={healthLabel.text} accent={healthLabel.color} />
        <Chip label="التسجيل" value={recordingState === 'recording' ? 'يعمل' : recordingState === 'paused' ? 'متوقف' : 'جاهز'} accent={isRecording ? '#ef4444' : '#cbd5e1'} />
        <Chip label="الضيوف" value={`${coHostCount} / +${pendingGuestsCount}`} accent="#a78bfa" />
        <Chip label="التأخير" value={`${Math.round(Number(viewerLatencyMs || 0))} ms`} accent="#38bdf8" />
        <Chip label="النمط" value={streamMode || 'auto'} accent="#facc15" />
      </div>

      {showModerationPanel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...panelStyle, left: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>أدوات الإشراف</strong>
            <span style={{ color: moderationQueueCount ? '#f59e0b' : 'rgba(255,255,255,0.65)', fontSize: 12 }}>الانتظار: {moderationQueueCount}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <button type="button" onClick={() => onModerate?.('mute')} style={{ padding: 10, borderRadius: 10, border: 'none', background: '#1e293b', color: 'white' }}>كتم المشارك</button>
            <button type="button" onClick={() => onModerate?.('kick')} style={{ padding: 10, borderRadius: 10, border: 'none', background: '#1e293b', color: 'white' }}>إخراج المشارك</button>
            <button type="button" onClick={() => onModerate?.('ban')} style={{ padding: 10, borderRadius: 10, border: 'none', background: '#7f1d1d', color: 'white' }}>حظر المستخدم</button>
            <button type="button" onClick={() => onModerate?.('slow_mode')} style={{ padding: 10, borderRadius: 10, border: 'none', background: '#92400e', color: 'white' }}>تفعيل Slow Mode</button>
            <button type="button" onClick={() => onCoHostAdd?.()} style={{ padding: 10, borderRadius: 10, border: 'none', background: '#4c1d95', color: 'white' }}>ترقية ضيف إلى Co-host</button>
          </div>
        </motion.div>
      )}

      {showGiftPanel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...panelStyle, right: 16 }}>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>اختَر هدية</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {GIFTS.map((gift) => (
              <button
                key={gift.id}
                type="button"
                onClick={() => onSendGift?.(gift)}
                style={{ padding: 10, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 24 }}>{gift.emoji}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{gift.name}</div>
                <div style={{ fontSize: 11, color: 'gold' }}>{gift.coins} عملة</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {showQualityPanel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...panelStyle, left: 212, minWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>الجودة التكيفية</strong>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>الوضع الحالي: {streamMode}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {QUALITIES.map((quality) => (
              <button
                key={quality.id}
                type="button"
                onClick={() => onChangeQuality?.(quality.id)}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: quality.id === streamMode ? '1px solid #38bdf8' : '1px solid transparent',
                  background: quality.id === streamMode ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.06)',
                  color: 'white',
                  textAlign: 'start',
                }}
              >
                {quality.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            الجودة التلقائية تقلّل البتريت والدقة تلقائيًا وقت ضعف الشبكة، وتسمح بالرجوع التدريجي عند تحسن الاتصال.
          </div>
        </motion.div>
      )}
    </div>
  );
}
