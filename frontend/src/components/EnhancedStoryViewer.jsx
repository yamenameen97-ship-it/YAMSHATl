/**
 * مكون عرض الستوري المحسّن مع معالجة حركات متقدمة
 * تحسينات:
 * - حركات سلسة وسريعة الاستجابة
 * - ردود فعل لمس وهزة محسّنة
 * - معالجة أداء محسّنة
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGesture, useTouchFeedback } from '../hooks/useGesture';
import GestureContainer from './GestureContainer';
import axios from 'axios';
import { API_BASE } from '../api/config.js';

const API_BASE_URL = API_BASE;
const REACTION_TYPES = ['❤️', '😂', '😮', '😢', '😠', '👍', '💕'];

export const EnhancedStoryViewer = ({ stories = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const storyRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const { triggerFeedback, triggerHaptic } = useTouchFeedback();

  const currentStory = useMemo(() => stories[currentIndex], [stories, currentIndex]);

  /**
   * تحديث التقدم مع تحسينات الأداء
   */
  useEffect(() => {
    if (!currentStory) return;

    const startTime = Date.now();
    const duration = currentStory.duration || 5000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNextStory();
      } else {
        progressIntervalRef.current = requestAnimationFrame(updateProgress);
      }
    };

    progressIntervalRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressIntervalRef.current) {
        cancelAnimationFrame(progressIntervalRef.current);
      }
    };
  }, [currentIndex, currentStory]);

  /**
   * تسجيل مشاهدة القصة
   */
  useEffect(() => {
    if (currentStory) {
      recordStoryView(currentStory.id);
    }
  }, [currentIndex, currentStory]);

  /**
   * تسجيل مشاهدة
   */
  const recordStoryView = useCallback(async (storyId) => {
    try {
      await axios.post(`${API_BASE_URL}/stories/${storyId}/view`, {
        viewDuration: currentStory?.duration || 5000
      });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }, [currentStory]);

  /**
   * الانتقال للقصة التالية مع حركة سلسة
   */
  const handleNextStory = useCallback(() => {
    if (isAnimating) return;

    if (currentIndex < stories.length - 1) {
      setIsAnimating(true);
      triggerHaptic([10, 5, 10]);

      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, stories.length, isAnimating, triggerHaptic]);

  /**
   * الانتقال للقصة السابقة مع حركة سلسة
   */
  const handlePreviousStory = useCallback(() => {
    if (isAnimating) return;

    if (currentIndex > 0) {
      setIsAnimating(true);
      triggerHaptic([10, 5, 10]);

      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
        setIsAnimating(false);
      }, 300);
    }
  }, [currentIndex, isAnimating, triggerHaptic]);

  /**
   * معالجة السحب الأفقي
   */
  const handleSwipe = useCallback((data) => {
    if (data.direction === 'right') {
      handlePreviousStory();
    } else if (data.direction === 'left') {
      handleNextStory();
    }
  }, [handlePreviousStory, handleNextStory]);

  /**
   * معالجة النقر المزدوج
   */
  const handleDoubleTap = useCallback((data) => {
    addReaction('❤️', data.x, data.y);
  }, []);

  /**
   * إضافة تفاعل
   */
  const addReaction = useCallback(async (reactionType, x, y) => {
    try {
      triggerFeedback(storyRef.current, 'heavy');
      triggerHaptic([10, 5, 10, 5, 10]);

      await axios.post(`${API_BASE_URL}/stories/${currentStory.id}/reactions`, {
        reactionType,
        x: x / window.innerWidth,
        y: y / window.innerHeight
      });

      // إضافة تفاعل عائم
      const reactionId = Math.random().toString();
      setFloatingReactions(prev => [...prev, {
        id: reactionId,
        type: reactionType,
        x,
        y
      }]);

      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
      }, 1000);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [currentStory, triggerFeedback, triggerHaptic]);

  /**
   * إضافة رد
   */
  const addReply = useCallback(async () => {
    if (!replyText.trim()) return;

    try {
      triggerFeedback(storyRef.current, 'medium');

      await axios.post(`${API_BASE_URL}/stories/${currentStory.id}/replies`, {
        message: replyText,
        isDirectMessage: false
      });

      setReplyText('');
      setShowReplies(true);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  }, [replyText, currentStory, triggerFeedback]);

  if (!currentStory) {
    return <div className="no-stories">لا توجد قصص</div>;
  }

  return (
    <GestureContainer
      ref={storyRef}
      onSwipe={handleSwipe}
      onDoubleTap={handleDoubleTap}
      enableFeedback={true}
      enableHaptic={true}
      className="story-viewer-container"
      style={styles.container}
    >
      {/* شريط التقدم */}
      <div style={styles.progressBars}>
        {stories.map((_, index) => (
          <div
            key={index}
            style={{
              ...styles.progressBar,
              width: `${100 / stories.length}%`,
              backgroundColor: index < currentIndex ? '#fff' : 'rgba(255,255,255,0.3)'
            }}
          >
            <div
              style={{
                ...styles.progressFill,
                width: index === currentIndex ? `${progress}%` : '100%',
                backgroundColor: '#fff',
                transition: 'width 0.05s linear'
              }}
            />
          </div>
        ))}
      </div>

      {/* رأس القصة */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          <img
            src={currentStory.userAvatar}
            alt={currentStory.username}
            style={styles.avatar}
          />
          <div>
            <p style={styles.username}>{currentStory.username}</p>
            <p style={styles.timestamp}>{getTimeAgo(currentStory.createdAt)}</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setShowViewers(!showViewers)}
            style={styles.headerButton}
          >
            👁️ {currentStory.viewCount}
          </button>
          <button style={styles.headerButton}>⋯</button>
        </div>
      </div>

      {/* محتوى القصة */}
      <div style={styles.storyContent}>
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.mediaUrl}
            style={styles.media}
            autoPlay
            muted
          />
        ) : (
          <img src={currentStory.mediaUrl} alt="Story" style={styles.media} />
        )}

        {/* الملصقات */}
        {currentStory.stickers?.map(sticker => (
          <div
            key={sticker.id}
            style={{
              ...styles.sticker,
              left: `${sticker.x * 100}%`,
              top: `${sticker.y * 100}%`,
              transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
              opacity: sticker.opacity
            }}
          >
            {sticker.content}
          </div>
        ))}

        {/* التفاعلات العائمة */}
        {floatingReactions.map(reaction => (
          <div
            key={reaction.id}
            style={{
              ...styles.floatingReaction,
              left: `${reaction.x}px`,
              top: `${reaction.y}px`,
              animation: 'floatUp 1s ease-out forwards'
            }}
          >
            {reaction.type}
          </div>
        ))}

        {/* التسمية التوضيحية */}
        {currentStory.caption && (
          <div style={styles.caption}>{currentStory.caption}</div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div style={styles.controls}>
        <button
          onClick={handlePreviousStory}
          disabled={currentIndex === 0 || isAnimating}
          style={styles.controlButton}
        >
          ◀️
        </button>

        <div style={styles.actionButtons}>
          <button
            onClick={() => setShowReactions(!showReactions)}
            style={styles.actionButton}
          >
            😊 {currentStory.reactions?.length || 0}
          </button>
          <button
            onClick={() => setShowReplies(!showReplies)}
            style={styles.actionButton}
          >
            💬 {currentStory.replies?.length || 0}
          </button>
          <button style={styles.actionButton}>📤</button>
        </div>

        <button
          onClick={handleNextStory}
          disabled={currentIndex === stories.length - 1 || isAnimating}
          style={styles.controlButton}
        >
          ▶️
        </button>
      </div>

      {/* قائمة الردود */}
      {showReplies && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>الردود</h3>
            <div style={styles.repliesList}>
              {currentStory.replies?.map(reply => (
                <div key={reply.id} style={styles.replyItem}>
                  <img src={reply.avatar} alt={reply.username} style={styles.replyAvatar} />
                  <div style={styles.replyInfo}>
                    <p style={styles.replyName}>{reply.username}</p>
                    <p style={styles.replyMessage}>{reply.message}</p>
                    <p style={styles.replyTime}>{getTimeAgo(reply.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* حقل إدخال الرد */}
            <div style={styles.replyInput}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك..."
                style={styles.replyInputField}
              />
              <button
                onClick={addReply}
                disabled={!replyText.trim()}
                style={styles.replyButton}
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* أنماط CSS */}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
          }
        }
      `}</style>
    </GestureContainer>
  );
};

/**
 * حساب الوقت المنقضي
 */
function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'للتو';
  if (seconds < 3600) return `قبل ${Math.floor(seconds / 60)} دقيقة`;
  if (seconds < 86400) return `قبل ${Math.floor(seconds / 3600)} ساعة`;
  return `قبل ${Math.floor(seconds / 86400)} يوم`;
}

/**
 * الأنماط
 */
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    overflow: 'hidden'
  },
  progressBars: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    display: 'flex',
    gap: '2px',
    zIndex: 10
  },
  progressBar: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff'
  },
  header: {
    position: 'absolute',
    top: '10px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    zIndex: 5
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  username: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold'
  },
  timestamp: {
    margin: 0,
    fontSize: '12px',
    color: '#ccc'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  headerButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  storyContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  media: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  sticker: {
    position: 'absolute',
    fontSize: '40px',
    cursor: 'grab'
  },
  floatingReaction: {
    position: 'absolute',
    fontSize: '40px',
    fontWeight: 'bold'
  },
  caption: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '8px',
    fontSize: '14px'
  },
  controls: {
    position: 'absolute',
    bottom: '20px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 15px',
    zIndex: 5
  },
  controlButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px'
  },
  actionButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  repliesList: {
    marginBottom: '20px'
  },
  replyItem: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  replyAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  replyInfo: {
    flex: 1
  },
  replyName: {
    margin: '0 0 5px 0',
    fontWeight: 'bold'
  },
  replyMessage: {
    margin: '0 0 5px 0',
    fontSize: '14px'
  },
  replyTime: {
    margin: 0,
    fontSize: '12px',
    color: '#999'
  },
  replyInput: {
    display: 'flex',
    gap: '10px'
  },
  replyInputField: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  replyButton: {
    padding: '10px 20px',
    backgroundColor: '#007AFF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default EnhancedStoryViewer;
