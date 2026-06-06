import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * LiveStreamCard - صفحة بث مباشر احترافية متكاملة
 * تعرض البث مع كل الميزات التفاعلية والتعليقات والهدايا والتأثيرات
 */
export default function LiveStreamCard({ 
  stream, 
  onClose, 
  onSendComment, 
  onSendGift,
  onSendHeart,
  currentUser,
  isViewer = true 
}) {
  const [comments, setComments] = useState(stream?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showGiftNotification, setShowGiftNotification] = useState(null);
  const videoRef = useRef(null);
  const commentsEndRef = useRef(null);

  const GIFTS = [
    { id: 1, name: 'وردة', emoji: '🌹', coins: 10, color: '#ef4444' },
    { id: 2, name: 'صاروخ', emoji: '🚀', coins: 50, color: '#f97316' },
    { id: 3, name: 'تاج', emoji: '👑', coins: 100, color: '#fbbf24' },
    { id: 4, name: 'ماس', emoji: '💎', coins: 200, color: '#06b6d4' },
    { id: 5, name: 'نار', emoji: '🔥', coins: 150, color: '#ef4444' },
    { id: 6, name: 'نجم', emoji: '⭐', coins: 75, color: '#fbbf24' },
  ];

  // التمرير التلقائي للتعليقات الجديدة
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await onSendComment?.(stream?.id, commentText);
      setComments([...comments, {
        id: Date.now(),
        user: currentUser,
        text: commentText,
        timestamp: new Date().toISOString(),
        avatar: '👤',
      }]);
      setCommentText('');
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const handleSendGift = async (gift) => {
    try {
      await onSendGift?.(stream?.id, gift);
      setShowGiftPanel(false);
      
      // إظهار إشعار الهدية
      setShowGiftNotification(gift);
      setTimeout(() => setShowGiftNotification(null), 2000);
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const handleSendHeart = async () => {
    try {
      await onSendHeart?.(stream?.id);
      const id = `heart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newHeart = { 
        id, 
        left: 14 + Math.random() * 72, 
        duration: 1500 + Math.random() * 900 
      };
      setFloatingHearts((prev) => [...prev, newHeart]);
      setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), newHeart.duration);
    } catch (error) {
      console.error('Error sending heart:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="enhanced-live-stream-card"
    >
      {/* خلفية البث */}
      <div className="enhanced-live-stream-container">
        {/* طبقة القلوب العائمة */}
        <div className="enhanced-live-hearts-layer" aria-hidden>
          {floatingHearts.map((item) => (
            <motion.span 
              key={item.id} 
              className="enhanced-live-heart"
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: -100, opacity: 0, scale: 0.3 }}
              transition={{ duration: item.duration / 1000 }}
              style={{ left: `${item.left}%` }}
            >
              💜
            </motion.span>
          ))}
        </div>

        {/* رأس البث */}
        <div className="enhanced-live-stream-header">
          <div className="enhanced-live-stream-badges">
            <motion.span 
              className="enhanced-live-badge enhanced-live-badge-active"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🔴 مباشر
            </motion.span>
            <span className="enhanced-live-badge">
              👁 {stream?.viewer_count || 0}
            </span>
            <span className="enhanced-live-badge">
              💜 {stream?.hearts_count || 0}
            </span>
          </div>
          <button 
            type="button" 
            className="enhanced-live-close-btn"
            onClick={onClose}
            aria-label="إغلاق البث"
          >
            ✕
          </button>
        </div>

        {/* منطقة الفيديو */}
        <div className="enhanced-live-stream-video-area">
          <video 
            ref={videoRef}
            className="enhanced-live-stream-video"
            autoPlay
            playsInline
            controls={false}
            src={stream?.stream_url}
          />
          
          {/* معلومات البث */}
          <div className="enhanced-live-stream-info">
            <div className="enhanced-live-stream-host-info">
              <div className="enhanced-live-stream-avatar">
                {stream?.host_avatar ? (
                  <img src={stream.host_avatar} alt={stream?.host_name} />
                ) : (
                  <div className="enhanced-live-stream-avatar-placeholder">
                    {stream?.host_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="enhanced-live-verified-badge">✓</div>
              </div>
              <div className="enhanced-live-stream-details">
                <h3>{stream?.host_name}</h3>
                <p>@{stream?.host_username}</p>
              </div>
            </div>

            {/* أزرار التفاعل الجانبية */}
            <div className="enhanced-live-stream-actions">
              <motion.button 
                type="button"
                className="enhanced-live-action-btn enhanced-live-action-sound"
                onClick={() => setSoundEnabled(!soundEnabled)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </motion.button>
              <motion.button 
                type="button"
                className="enhanced-live-action-btn enhanced-live-action-heart"
                onClick={handleSendHeart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="إرسال قلب"
              >
                💜
              </motion.button>
              <motion.button 
                type="button"
                className="enhanced-live-action-btn enhanced-live-action-gift"
                onClick={() => setShowGiftPanel(!showGiftPanel)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="إرسال هدية"
              >
                🎁
              </motion.button>
            </div>
          </div>
        </div>

        {/* إشعار الهدية */}
        {showGiftNotification && (
          <motion.div
            className="enhanced-live-gift-notification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span className="enhanced-live-gift-notification-emoji">
              {showGiftNotification.emoji}
            </span>
            <div className="enhanced-live-gift-notification-text">
              <p className="enhanced-live-gift-notification-user">{currentUser}</p>
              <p className="enhanced-live-gift-notification-gift">
                أرسل {showGiftNotification.name}
              </p>
            </div>
          </motion.div>
        )}

        {/* منطقة التعليقات والهدايا */}
        <div className="enhanced-live-stream-interaction">
          {/* لوحة الهدايا */}
          {showGiftPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="enhanced-live-gift-panel"
            >
              <div className="enhanced-live-gift-header">
                <strong>اختر هدية</strong>
                <button 
                  type="button"
                  onClick={() => setShowGiftPanel(false)}
                  className="enhanced-live-gift-close"
                >
                  ✕
                </button>
              </div>
              <div className="enhanced-live-gift-grid">
                {GIFTS.map((gift) => (
                  <motion.button
                    key={gift.id}
                    type="button"
                    className="enhanced-live-gift-item"
                    onClick={() => handleSendGift(gift)}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ borderColor: gift.color }}
                  >
                    <div className="enhanced-live-gift-emoji">{gift.emoji}</div>
                    <div className="enhanced-live-gift-name">{gift.name}</div>
                    <div className="enhanced-live-gift-price" style={{ color: gift.color }}>
                      {gift.coins}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* منطقة التعليقات */}
          <div className="enhanced-live-comments-section">
            <div className="enhanced-live-comments-header">
              <strong>التعليقات المباشرة</strong>
              <span className="enhanced-live-comments-count">{comments.length}</span>
            </div>
            <div className="enhanced-live-comments-list">
              {comments.map((comment) => (
                <motion.div 
                  key={comment.id} 
                  className="enhanced-live-comment-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="enhanced-live-comment-avatar">{comment.avatar}</span>
                  <div className="enhanced-live-comment-content">
                    <strong className="enhanced-live-comment-user">
                      {comment.user}
                    </strong>
                    <p className="enhanced-live-comment-text">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* صندوق إدخال التعليقات */}
          <div className="enhanced-live-comment-input-box">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendComment();
              }}
              placeholder="اكتب تعليقك..."
              className="enhanced-live-comment-input"
            />
            <motion.button
              type="button"
              onClick={handleSendComment}
              className="enhanced-live-comment-send-btn"
              disabled={!commentText.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ➤
            </motion.button>
          </div>
        </div>

        {/* شريط الأدوات السفلي */}
        <div className="enhanced-live-stream-toolbar">
          <motion.button 
            type="button" 
            className="enhanced-live-toolbar-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>👍</span>
            <span>مشاركة</span>
          </motion.button>
          <motion.button 
            type="button" 
            className="enhanced-live-toolbar-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>👥</span>
            <span>دعوة</span>
          </motion.button>
          <motion.button 
            type="button" 
            className="enhanced-live-toolbar-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🎁</span>
            <span>هدية</span>
          </motion.button>
          <motion.button 
            type="button" 
            className="enhanced-live-toolbar-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>📊</span>
            <span>استطلاع</span>
          </motion.button>
          <motion.button 
            type="button" 
            className="enhanced-live-toolbar-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>⋯</span>
            <span>المزيد</span>
          </motion.button>
        </div>
      </div>

      <style>{`
        .enhanced-live-stream-card {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          direction: rtl;
        }

        .enhanced-live-stream-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 50%, #0a0e27 100%);
          overflow: hidden;
        }

        /* طبقة القلوب العائمة */
        .enhanced-live-hearts-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }

        .enhanced-live-heart {
          position: absolute;
          font-size: 32px;
          opacity: 0.8;
        }

        /* رأس البث */
        .enhanced-live-stream-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
          z-index: 10;
        }

        .enhanced-live-stream-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .enhanced-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .enhanced-live-badge-active {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .enhanced-live-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .enhanced-live-close-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* منطقة الفيديو */
        .enhanced-live-stream-video-area {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          margin-top: 60px;
          margin-bottom: 120px;
        }

        .enhanced-live-stream-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* معلومات البث */
        .enhanced-live-stream-info {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          z-index: 5;
        }

        .enhanced-live-stream-host-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .enhanced-live-stream-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
        }

        .enhanced-live-stream-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .enhanced-live-stream-avatar-placeholder {
          color: white;
          font-weight: bold;
          font-size: 20px;
        }

        .enhanced-live-verified-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid #0a0e27;
        }

        .enhanced-live-stream-details {
          color: white;
        }

        .enhanced-live-stream-details h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .enhanced-live-stream-details p {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* أزرار التفاعل الجانبية */
        .enhanced-live-stream-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .enhanced-live-action-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .enhanced-live-action-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(124, 58, 237, 0.5);
        }

        .enhanced-live-action-heart:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .enhanced-live-action-gift:hover {
          background: rgba(251, 146, 60, 0.3);
          border-color: rgba(251, 146, 60, 0.5);
        }

        /* إشعار الهدية */
        .enhanced-live-gift-notification {
          position: fixed;
          bottom: 200px;
          right: 20px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(59, 130, 246, 0.9));
          border: 1px solid rgba(124, 58, 237, 0.5);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 100;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4);
        }

        .enhanced-live-gift-notification-emoji {
          font-size: 32px;
        }

        .enhanced-live-gift-notification-text {
          color: white;
        }

        .enhanced-live-gift-notification-user {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
        }

        .enhanced-live-gift-notification-gift {
          margin: 2px 0 0;
          font-size: 11px;
          opacity: 0.9;
        }

        /* منطقة التفاعل */
        .enhanced-live-stream-interaction {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.95) 100%);
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          gap: 8px;
          z-index: 5;
          overflow-y: auto;
        }

        /* لوحة الهدايا */
        .enhanced-live-gift-panel {
          position: absolute;
          bottom: 120px;
          left: 16px;
          right: 16px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 16px;
          padding: 12px;
          backdrop-filter: blur(10px);
          max-height: 200px;
          overflow-y: auto;
        }

        .enhanced-live-gift-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          color: white;
          font-size: 14px;
        }

        .enhanced-live-gift-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        .enhanced-live-gift-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .enhanced-live-gift-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .enhanced-live-gift-item:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
          transform: translateY(-2px);
        }

        .enhanced-live-gift-emoji {
          font-size: 24px;
        }

        .enhanced-live-gift-name {
          font-size: 11px;
          font-weight: 600;
        }

        .enhanced-live-gift-price {
          font-size: 10px;
          font-weight: 700;
        }

        /* منطقة التعليقات */
        .enhanced-live-comments-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
        }

        .enhanced-live-comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .enhanced-live-comments-count {
          background: rgba(124, 58, 237, 0.3);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
        }

        .enhanced-live-comments-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 0;
        }

        .enhanced-live-comment-item {
          display: flex;
          gap: 6px;
          font-size: 11px;
          line-height: 1.3;
        }

        .enhanced-live-comment-avatar {
          font-size: 14px;
          flex-shrink: 0;
        }

        .enhanced-live-comment-content {
          flex: 1;
          min-width: 0;
        }

        .enhanced-live-comment-user {
          color: #a78bfa;
          font-weight: 700;
          display: block;
        }

        .enhanced-live-comment-text {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          word-break: break-word;
        }

        /* صندوق إدخال التعليقات */
        .enhanced-live-comment-input-box {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .enhanced-live-comment-input {
          flex: 1;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
        }

        .enhanced-live-comment-input:focus {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(124, 58, 237, 0.6);
        }

        .enhanced-live-comment-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .enhanced-live-comment-send-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .enhanced-live-comment-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.5);
        }

        .enhanced-live-comment-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* شريط الأدوات السفلي */
        .enhanced-live-stream-toolbar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.95) 100%);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 0;
          border-top: 1px solid rgba(124, 58, 237, 0.2);
        }

        .enhanced-live-toolbar-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 4px 8px;
        }

        .enhanced-live-toolbar-btn:hover {
          transform: scale(1.1);
          color: #a78bfa;
        }

        /* استجابة الجوال */
        @media (max-width: 768px) {
          .enhanced-live-stream-card {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
          }

          .enhanced-live-stream-container {
            height: 100vh;
          }

          .enhanced-live-stream-header {
            padding: 8px 12px;
          }

          .enhanced-live-stream-video-area {
            margin-top: 50px;
            margin-bottom: 140px;
          }

          .enhanced-live-stream-interaction {
            height: 140px;
            padding: 8px 12px;
          }

          .enhanced-live-stream-toolbar {
            height: 70px;
          }

          .enhanced-live-action-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .enhanced-live-comment-input {
            font-size: 14px;
            padding: 10px;
          }
        }

        /* Scrollbar styling */
        .enhanced-live-comments-list::-webkit-scrollbar,
        .enhanced-live-gift-panel::-webkit-scrollbar,
        .enhanced-live-stream-interaction::-webkit-scrollbar {
          width: 4px;
        }

        .enhanced-live-comments-list::-webkit-scrollbar-track,
        .enhanced-live-gift-panel::-webkit-scrollbar-track,
        .enhanced-live-stream-interaction::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .enhanced-live-comments-list::-webkit-scrollbar-thumb,
        .enhanced-live-gift-panel::-webkit-scrollbar-thumb,
        .enhanced-live-stream-interaction::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.5);
          border-radius: 2px;
        }

        .enhanced-live-comments-list::-webkit-scrollbar-thumb:hover,
        .enhanced-live-gift-panel::-webkit-scrollbar-thumb:hover,
        .enhanced-live-stream-interaction::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.8);
        }
      `}</style>
    </motion.div>
  );
}
