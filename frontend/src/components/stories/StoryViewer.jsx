import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoryViewer({ group, onClose, onNext }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef(null);

  const story = group.stories[currentIndex];

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds per story
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused]);

  const handleNext = () => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleReaction = (emoji) => {
    console.log(`Reacted with ${emoji} to story ${story.id}`);
    // Analytics hook call here
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' 
      }}
    >
      {/* Progress Bars */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 10px' }}>
        {group.stories.map((_, idx) => (
          <div key={idx} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', background: 'white', 
              width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 15, gap: 10, color: 'white' }}>
        <img src={`https://ui-avatars.com/api/?name=${group.username}`} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
        <span style={{ fontWeight: 'bold' }}>{group.username}</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: 24 }}>×</button>
      </div>

      {/* Story Content */}
      <div 
        style={{ flex: 1, position: 'relative' }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <img src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
        
        {/* Navigation Areas */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%' }} onClick={handlePrev} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '30%', height: '100%' }} onClick={handleNext} />
      </div>

      {/* Footer / Reply */}
      <div style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input 
          placeholder="إرسال رد..." 
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          style={{ 
            flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: 20, padding: '10px 15px', color: 'white' 
          }} 
        />
        <div style={{ display: 'flex', gap: 15, fontSize: 24 }}>
          {['❤️', '🔥', '😂', '😮'].map(emoji => (
            <button key={emoji} onClick={() => handleReaction(emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{emoji}</button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
