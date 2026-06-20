import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * LiveStreamCard - مكون عرض البث المباشر في صفحة المنشورات
 * يعرض البث مع كل الميزات التفاعلية والتعليقات والهدايا
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
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const videoRef = useRef(null);

  const GIFTS = [
    { id: 1, name: 'وردة', emoji: '🌹', coins: 10 },
    { id: 2, name: 'صاروخ', emoji: '🚀', coins: 50 },
    { id: 3, name: 'تاج', emoji: '👑', coins: 100 },
  ];

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await onSendComment?.(stream?.id, commentText);
      setComments([...comments, {
        id: Date.now(),
        user: currentUser,
        text: commentText,
        timestamp: new Date().toISOString(),
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
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  };

  const handleSendHeart = async () => {
    try {
      await onSendHeart?.(stream?.id);
      const id = `heart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newHeart = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
      setFloatingHearts((prev) => [...prev, newHeart]);
      setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), newHeart.duration);
    } catch (error) {
      console.error('Error sending heart:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="yam-live-stream-card"
    >
      {/* خلفية البث */}
      <div className="yam-live-stream-container">
        {/* طبقة القلوب العائمة */}
        <div className="yam-live-hearts-layer" aria-hidden>
          {floatingHearts.map((item) => (
            <span 
              key={item.id} 
              className="yam-live-heart" 
              style={{ 
                left: `${item.left}%`, 
                animationDuration: `${item.duration}ms` 
              }}
            >
              💜
            </span>
          ))}
        </div>

        {/* رأس البث */}
        <div className="yam-live-stream-header">
          <div className="yam-live-stream-badges">
            <span className="yam-live-badge yam-live-badge-active">
              🔴 مباشر
            </span>
            <span className="yam-live-badge">
              👁 {stream?.viewer_count || 0}
            </span>
            <span className="yam-live-badge">
              💜 {stream?.hearts_count || 0}
            </span>
          </div>
          <button 
            type="button" 
            className="yam-live-close-btn"
            onClick={onClose}
            aria-label="إغلاق البث"
          >
            ✕
          </button>
        </div>

        {/* منطقة الفيديو */}
        <div className="yam-live-stream-video-area">
          <video 
            ref={videoRef}
            className="yam-live-stream-video"
            autoPlay
            playsInline
            controls={false}
            src={stream?.stream_url}
          />
          
          {/* معلومات البث */}
          <div className="yam-live-stream-info">
            <div className="yam-live-stream-host-info">
              <div className="yam-live-stream-avatar">
                {stream?.host_avatar ? (
                  <img src={stream.host_avatar} alt={stream?.host_name} />
                ) : (
                  <div className="yam-live-stream-avatar-placeholder">
                    {stream?.host_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="yam-live-stream-details">
                <h3>{stream?.host_name}</h3>
                <p>@{stream?.host_username}</p>
              </div>
            </div>

            {/* أزرار التفاعل الجانبية */}
            <div className="yam-live-stream-actions">
              <button 
                type="button"
                className="yam-live-action-btn yam-live-action-sound"
                title="صوت"
              >
                🔊
              </button>
              <button 
                type="button"
                className="yam-live-action-btn yam-live-action-heart"
                onClick={handleSendHeart}
                title="إرسال قلب"
              >
                💜
              </button>
              <button 
                type="button"
                className="yam-live-action-btn yam-live-action-gift"
                onClick={() => setShowGiftPanel(!showGiftPanel)}
                title="إرسال هدية"
              >
                🎁
              </button>
            </div>
          </div>
        </div>

        {/* منطقة التعليقات والهدايا */}
        <div className="yam-live-stream-interaction">
          {/* لوحة الهدايا */}
          {showGiftPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="yam-live-gift-panel"
            >
              <div className="yam-live-gift-header">
                <strong>اختر هدية</strong>
                <button 
                  type="button"
                  onClick={() => setShowGiftPanel(false)}
                  className="yam-live-gift-close"
                >
                  ✕
                </button>
              </div>
              <div className="yam-live-gift-grid">
                {GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    type="button"
                    className="yam-live-gift-item"
                    onClick={() => handleSendGift(gift)}
                  >
                    <div className="yam-live-gift-emoji">{gift.emoji}</div>
                    <div className="yam-live-gift-name">{gift.name}</div>
                    <div className="yam-live-gift-price">{gift.coins} عملة</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* منطقة التعليقات */}
          <div className="yam-live-comments-section">
            <div className="yam-live-comments-header">
              <strong>التعليقات المباشرة</strong>
              <span className="yam-live-comments-count">{comments.length}</span>
            </div>
            <div className="yam-live-comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="yam-live-comment-item">
                  <strong className="yam-live-comment-user">
                    {comment.user}
                  </strong>
                  <p className="yam-live-comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* صندوق إدخال التعليقات */}
          <div className="yam-live-comment-input-box">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendComment();
              }}
              placeholder="اكتب تعليقك..."
              className="yam-live-comment-input"
            />
            <button
              type="button"
              onClick={handleSendComment}
              className="yam-live-comment-send-btn"
              disabled={!commentText.trim()}
            >
              ➤
            </button>
          </div>
        </div>

        {/* شريط الأدوات السفلي */}
        <div className="yam-live-stream-toolbar">
          <button type="button" className="yam-live-toolbar-btn">
            👍 مشاركة
          </button>
          <button type="button" className="yam-live-toolbar-btn">
            👥 دعوة
          </button>
          <button type="button" className="yam-live-toolbar-btn">
            🎁 هدية
          </button>
          <button type="button" className="yam-live-toolbar-btn">
            📊 استطلاع
          </button>
          <button type="button" className="yam-live-toolbar-btn">
            ⋯ المزيد
          </button>
        </div>
      </div>

      <style>{`
        .yam-live-stream-card {
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

        .yam-live-stream-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a0e27 0%, #1a0f3f 50%, #0a0e27 100%);
          overflow: hidden;
        }

        /* طبقة القلوب العائمة */
        .yam-live-hearts-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }

        .yam-live-heart {
          position: absolute;
          font-size: 32px;
          animation: float-up 2s ease-in forwards;
          opacity: 0.8;
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
          }
        }

        /* رأس البث */
        .yam-live-stream-header {
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

        .yam-live-stream-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .yam-live-badge {
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

        .yam-live-badge-active {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-color: rgba(255, 255, 255, 0.2);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .yam-live-close-btn {
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

        .yam-live-close-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        /* منطقة الفيديو */
        .yam-live-stream-video-area {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          margin-top: 60px;
          margin-bottom: 120px;
        }

        .yam-live-stream-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* معلومات البث */
        .yam-live-stream-info {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          z-index: 5;
        }

        .yam-live-stream-host-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .yam-live-stream-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .yam-live-stream-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yam-live-stream-avatar-placeholder {
          color: white;
          font-weight: bold;
          font-size: 20px;
        }

        .yam-live-stream-details {
          color: white;
        }

        .yam-live-stream-details h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }

        .yam-live-stream-details p {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* أزرار التفاعل الجانبية */
        .yam-live-stream-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .yam-live-action-btn {
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

        .yam-live-action-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(124, 58, 237, 0.5);
          transform: scale(1.1);
        }

        .yam-live-action-heart:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .yam-live-action-gift:hover {
          background: rgba(251, 146, 60, 0.3);
          border-color: rgba(251, 146, 60, 0.5);
        }

        /* منطقة التفاعل */
        .yam-live-stream-interaction {
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
        .yam-live-gift-panel {
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

        .yam-live-gift-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          color: white;
          font-size: 14px;
        }

        .yam-live-gift-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        .yam-live-gift-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .yam-live-gift-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }

        .yam-live-gift-item:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
          transform: translateY(-2px);
        }

        .yam-live-gift-emoji {
          font-size: 24px;
        }

        .yam-live-gift-name {
          font-size: 11px;
          font-weight: 600;
        }

        .yam-live-gift-price {
          font-size: 10px;
          color: #fbbf24;
        }

        /* منطقة التعليقات */
        .yam-live-comments-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;
        }

        .yam-live-comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .yam-live-comments-count {
          background: rgba(124, 58, 237, 0.3);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
        }

        .yam-live-comments-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 0;
        }

        .yam-live-comment-item {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 11px;
          line-height: 1.3;
        }

        .yam-live-comment-user {
          color: #a78bfa;
          font-weight: 700;
          flex-shrink: 0;
        }

        .yam-live-comment-text {
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          flex: 1;
          word-break: break-word;
        }

        /* صندوق إدخال التعليقات */
        .yam-live-comment-input-box {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .yam-live-comment-input {
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

        .yam-live-comment-input:focus {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(124, 58, 237, 0.6);
        }

        .yam-live-comment-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .yam-live-comment-send-btn {
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

        .yam-live-comment-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.5);
        }

        .yam-live-comment-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* شريط الأدوات السفلي */
        .yam-live-stream-toolbar {
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

        .yam-live-toolbar-btn {
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

        .yam-live-toolbar-btn:hover {
          transform: scale(1.1);
          color: #a78bfa;
        }

        /* استجابة الجوال */
        @media (max-width: 768px) {
          .yam-live-stream-card {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
          }

          .yam-live-stream-container {
            height: 100vh;
          }

          .yam-live-stream-header {
            padding: 8px 12px;
          }

          .yam-live-stream-video-area {
            margin-top: 50px;
            margin-bottom: 140px;
          }

          .yam-live-stream-interaction {
            height: 140px;
            padding: 8px 12px;
          }

          .yam-live-stream-toolbar {
            height: 70px;
          }

          .yam-live-action-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .yam-live-comment-input {
            font-size: 14px;
            padding: 10px;
          }
        }

        /* Scrollbar styling */
        .yam-live-comments-list::-webkit-scrollbar,
        .yam-live-gift-panel::-webkit-scrollbar,
        .yam-live-stream-interaction::-webkit-scrollbar {
          width: 4px;
        }

        .yam-live-comments-list::-webkit-scrollbar-track,
        .yam-live-gift-panel::-webkit-scrollbar-track,
        .yam-live-stream-interaction::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .yam-live-comments-list::-webkit-scrollbar-thumb,
        .yam-live-gift-panel::-webkit-scrollbar-thumb,
        .yam-live-stream-interaction::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.5);
          border-radius: 2px;
        }

        .yam-live-comments-list::-webkit-scrollbar-thumb:hover,
        .yam-live-gift-panel::-webkit-scrollbar-thumb:hover,
        .yam-live-stream-interaction::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.8);
        }
      `}</style>
    </motion.div>
  );
}
