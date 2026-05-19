import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function LiveControls({ onMuteToggle, onCoHostAdd, onModerate, onSendGift }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  const GIFTS = [
    { id: 1, name: 'وردة', emoji: '🌹', coins: 10 },
    { id: 2, name: 'قهوة', emoji: '☕', coins: 50 },
    { id: 3, name: 'قلب', emoji: '❤️', coins: 100 },
    { id: 4, name: 'تاج', emoji: '👑', coins: 500 },
  ];

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    onMuteToggle?.(!isMuted);
  };

  const handleCameraToggle = () => {
    setIsCameraOff(!isCameraOff);
  };

  return (
    <div style={{ display: 'flex', gap: 15, padding: 20, background: 'rgba(0,0,0,0.5)', borderRadius: 12 }}>
      {/* Mute Control */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMuteToggle}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: isMuted ? '#ff4444' : 'var(--primary)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
      >
        {isMuted ? '🔇' : '🎤'}
      </motion.button>

      {/* Camera Control */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCameraToggle}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: isCameraOff ? '#ff4444' : 'var(--primary)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer'
        }}
        title={isCameraOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
      >
        {isCameraOff ? '📹' : '📷'}
      </motion.button>

      {/* Co-Host Control */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => onCoHostAdd?.()}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--primary)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer'
        }}
        title="إضافة مضيف مشارك"
      >
        👥
      </motion.button>

      {/* Moderation Tools */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowModerationPanel(!showModerationPanel)}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--primary)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer'
        }}
        title="أدوات الإشراف"
      >
        🛡️
      </motion.button>

      {/* Gifts System */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowGiftPanel(!showGiftPanel)}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          background: 'gold',
          color: 'black',
          fontSize: 20,
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        title="إرسال هدية"
      >
        🎁
      </motion.button>

      {/* Moderation Panel */}
      {showModerationPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 80,
            left: 20,
            background: '#222',
            borderRadius: 12,
            padding: 15,
            minWidth: 200,
            zIndex: 100
          }}
        >
          <div style={{ marginBottom: 10, fontWeight: 'bold' }}>أدوات الإشراف</div>
          <button onClick={() => onModerate?.('mute')} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 5, background: '#333', border: 'none', borderRadius: 4, color: 'white' }}>كتم المشاركين</button>
          <button onClick={() => onModerate?.('kick')} style={{ display: 'block', width: '100%', padding: 8, marginBottom: 5, background: '#333', border: 'none', borderRadius: 4, color: 'white' }}>إزالة مشارك</button>
          <button onClick={() => onModerate?.('block')} style={{ display: 'block', width: '100%', padding: 8, background: '#333', border: 'none', borderRadius: 4, color: 'white' }}>حظر المستخدم</button>
        </motion.div>
      )}

      {/* Gifts Panel */}
      {showGiftPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 80,
            right: 20,
            background: '#222',
            borderRadius: 12,
            padding: 15,
            minWidth: 250,
            zIndex: 100
          }}
        >
          <div style={{ marginBottom: 10, fontWeight: 'bold' }}>اختر هدية</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {GIFTS.map(gift => (
              <motion.button
                key={gift.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => onSendGift?.(gift)}
                style={{
                  padding: 10,
                  background: '#333',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 24 }}>{gift.emoji}</div>
                <div style={{ fontSize: 12, marginTop: 5 }}>{gift.name}</div>
                <div style={{ fontSize: 11, color: 'gold' }}>{gift.coins} عملة</div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Viewer Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }} title="مشاركة">📤</button>
        <button style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }} title="الإبلاغ">🚩</button>
      </div>
    </div>
  );
}
