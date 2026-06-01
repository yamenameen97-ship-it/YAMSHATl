import React, { useState, useEffect, useRef, useCallback } from 'react';
import { defaultStoryManager } from '../../services/storyManager.js';
import logger from '../../utils/logger.js';

/**
 * StoryViewerEnhanced Component
 * 
 * عارض قصص محسّن مع:
 * - شريط تقدم لكل قصة
 * - معالجة انتهاء المدة
 * - تفاعلات محسّنة
 * - تحليلات
 * - معالجة الأخطاء
 */
export default function StoryViewerEnhanced({
  stories = [],
  onClose,
  currentUser,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const progressIntervalRef = useRef(null);
  const storyDurationRef = useRef(5000); // 5 ثوان

  // تصفية القصص المنتهية
  const validStories = React.useMemo(() => {
    return defaultStoryManager.filterExpiredStories(stories);
  }, [stories]);

  const currentStory = validStories[currentIndex];

  // معالج التقدم
  useEffect(() => {
    if (!currentStory || isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (storyDurationRef.current / 50));
        
        if (next >= 100) {
          handleNextStory();
          return 0;
        }
        
        return next;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, isPaused]);

  // تسجيل العرض
  useEffect(() => {
    if (currentStory && currentUser) {
      defaultStoryManager.recordView(currentStory.id, currentUser.id);
    }
  }, [currentStory, currentUser]);

  // معالج الانتقال للقصة التالية
  const handleNextStory = useCallback(() => {
    if (currentIndex < validStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose?.();
    }
  }, [currentIndex, validStories.length, onClose]);

  // معالج الرجوع للقصة السابقة
  const handlePrevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // معالج التفاعل
  const handleReaction = useCallback((reactionType) => {
    if (currentStory && currentUser) {
      defaultStoryManager.recordInteraction(
        currentStory.id,
        currentUser.id,
        'reaction',
        { type: reactionType }
      );
      logger.info('Reaction recorded', { reactionType });
    }
    setShowReactions(false);
  }, [currentStory, currentUser]);

  if (!currentStory || validStories.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* شريط التقدم */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        display: 'flex',
        gap: '4px',
        padding: '8px',
        zIndex: 10,
      }}>
        {validStories.map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '3px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: '#fff',
                width: `${idx === currentIndex ? progress : idx < currentIndex ? 100 : 0}%`,
                transition: 'width 0.1s linear',
              }}
            />
          </div>
        ))}
      </div>

      {/* محتوى القصة */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {currentStory.media_url && (
          <img
            src={currentStory.media_url}
            alt="story"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {currentStory.media_type === 'video' && currentStory.media_url && (
          <video
            src={currentStory.media_url}
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {/* معلومات المستخدم */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#fff',
          zIndex: 5,
        }}>
          <img
            src={currentStory.user_avatar || '/default-avatar.png'}
            alt={currentStory.username}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {currentStory.username}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              منذ {new Date(currentStory.created_at).toLocaleTimeString('ar-EG')}
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          zIndex: 5,
        }}>
          <button
            onClick={handlePrevStory}
            disabled={currentIndex === 0}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#fff',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '20px',
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
          >
            ‹
          </button>
        </div>

        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          zIndex: 5,
        }}>
          <button
            onClick={handleNextStory}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#fff',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ›
          </button>
        </div>

        {/* أزرار الإجراءات */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          display: 'flex',
          gap: '12px',
          zIndex: 5,
        }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {isPaused ? '▶️ استئناف' : '⏸️ إيقاف'}
          </button>

          <button
            onClick={() => setShowReactions(!showReactions)}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            😊 رد
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ✕ إغلاق
          </button>
        </div>

        {/* قائمة التفاعلات */}
        {showReactions && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            zIndex: 5,
          }}>
            {['❤️', '😂', '😮', '😢', '🔥', '👍'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
