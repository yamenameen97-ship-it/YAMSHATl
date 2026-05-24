import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const DEFAULT_GIFTS = [
  { id: 1, name: 'وردة', emoji: '🌹', coins: 10 },
  { id: 2, name: 'قهوة', emoji: '☕', coins: 50 },
  { id: 3, name: 'قلب', emoji: '❤️', coins: 100 },
  { id: 4, name: 'تاج', emoji: '👑', coins: 500 },
];

function ControlButton({ title, active, color, onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title={title}
      style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        border: 'none',
        background: active ? color : 'rgba(255,255,255,0.12)',
        color: active ? '#101828' : 'white',
        fontSize: 20,
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {children}
    </motion.button>
  );
}

ControlButton.propTypes = {
  title: PropTypes.string.isRequired,
  active: PropTypes.bool,
  color: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

ControlButton.defaultProps = {
  active: false,
  color: '#22c55e',
  onClick: undefined,
  children: null,
};

export default function LiveControls({
  isHost,
  isMuted,
  isCameraOff,
  connectionLabel,
  recordingStatus,
  onMuteToggle,
  onCameraToggle,
  onCoHostAdd,
  onModerate,
  onSendGift,
  onRecordingToggle,
  onRecovery,
  onSync,
  onShare,
  onDisconnect,
  gifts,
}) {
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  const giftList = useMemo(() => Array.isArray(gifts) && gifts.length ? gifts : DEFAULT_GIFTS, [gifts]);

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 12, padding: 16, background: 'rgba(0,0,0,0.45)', borderRadius: 18, flexWrap: 'wrap', alignItems: 'center' }}>
      {isHost ? <ControlButton title={isMuted ? 'فتح المايك' : 'كتم المايك'} active color="#60a5fa" onClick={onMuteToggle}>{isMuted ? '🔇' : '🎤'}</ControlButton> : null}
      {isHost ? <ControlButton title={isCameraOff ? 'فتح الكاميرا' : 'إغلاق الكاميرا'} active color="#f59e0b" onClick={onCameraToggle}>{isCameraOff ? '📷' : '📹'}</ControlButton> : null}
      {isHost ? <ControlButton title="التسجيل" active={recordingStatus === 'recording'} color="#ef4444" onClick={onRecordingToggle}>{recordingStatus === 'recording' ? '⏺️' : '⏹️'}</ControlButton> : null}
      <ControlButton title="الهدايا" active={showGiftPanel} color="#facc15" onClick={() => setShowGiftPanel((prev) => !prev)}>🎁</ControlButton>
      {isHost ? <ControlButton title="الإشراف" active={showModerationPanel} color="#34d399" onClick={() => setShowModerationPanel((prev) => !prev)}>🛡️</ControlButton> : null}
      {isHost ? <ControlButton title="إضافة مضيف" active color="#c084fc" onClick={onCoHostAdd}>👥</ControlButton> : null}
      {isHost ? <ControlButton title="الاستعادة" active color="#fb7185" onClick={onRecovery}>♻️</ControlButton> : null}
      <ControlButton title="مزامنة" active color="#38bdf8" onClick={onSync}>🔄</ControlButton>
      <ControlButton title="مشاركة" active color="#a3e635" onClick={onShare}>📤</ControlButton>
      <ControlButton title="فصل" active color="#fda4af" onClick={onDisconnect}>⛔</ControlButton>

      <div style={{ marginInlineStart: 'auto', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
        <strong style={{ fontSize: 13 }}>حالة الاتصال</strong>
        <span style={{ fontSize: 12, color: '#cbd5e1' }}>{connectionLabel || 'غير متصل'} • التسجيل: {recordingStatus || 'idle'}</span>
      </div>

      {showModerationPanel ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'absolute', top: 78, insetInlineStart: 12, background: '#111827', borderRadius: 14, padding: 14, minWidth: 220, zIndex: 100, boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
        >
          <div style={{ marginBottom: 10, fontWeight: 'bold' }}>أدوات الإشراف السريع</div>
          <button onClick={() => onModerate?.('mute_all')} style={panelButtonStyle}>كتم مشاغبين</button>
          <button onClick={() => onModerate?.('delete_last_flagged')} style={panelButtonStyle}>حذف آخر تعليق مخالف</button>
          <button onClick={() => onModerate?.('pin_highlight')} style={panelButtonStyle}>تثبيت تعليق مميز</button>
        </motion.div>
      ) : null}

      {showGiftPanel ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'absolute', top: 78, insetInlineEnd: 12, background: '#111827', borderRadius: 14, padding: 14, minWidth: 260, zIndex: 100, boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
        >
          <div style={{ marginBottom: 10, fontWeight: 'bold' }}>إرسال هدية</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {giftList.map((gift) => (
              <button key={gift.id} onClick={() => onSendGift?.(gift)} style={{ ...panelButtonStyle, marginBottom: 0, minHeight: 82 }}>
                <div style={{ fontSize: 24 }}>{gift.emoji}</div>
                <div style={{ fontSize: 13 }}>{gift.name}</div>
                <div style={{ fontSize: 11, color: '#fbbf24' }}>{gift.coins} عملة</div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

const panelButtonStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  marginBottom: 8,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: 'white',
  cursor: 'pointer',
  textAlign: 'center',
};

LiveControls.propTypes = {
  isHost: PropTypes.bool,
  isMuted: PropTypes.bool,
  isCameraOff: PropTypes.bool,
  connectionLabel: PropTypes.string,
  recordingStatus: PropTypes.string,
  onMuteToggle: PropTypes.func,
  onCameraToggle: PropTypes.func,
  onCoHostAdd: PropTypes.func,
  onModerate: PropTypes.func,
  onSendGift: PropTypes.func,
  onRecordingToggle: PropTypes.func,
  onRecovery: PropTypes.func,
  onSync: PropTypes.func,
  onShare: PropTypes.func,
  onDisconnect: PropTypes.func,
  gifts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    emoji: PropTypes.string,
    coins: PropTypes.number,
  })),
};

LiveControls.defaultProps = {
  isHost: false,
  isMuted: false,
  isCameraOff: false,
  connectionLabel: '',
  recordingStatus: 'idle',
  onMuteToggle: undefined,
  onCameraToggle: undefined,
  onCoHostAdd: undefined,
  onModerate: undefined,
  onSendGift: undefined,
  onRecordingToggle: undefined,
  onRecovery: undefined,
  onSync: undefined,
  onShare: undefined,
  onDisconnect: undefined,
  gifts: undefined,
};
