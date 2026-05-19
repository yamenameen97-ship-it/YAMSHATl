import React, { useState, useRef, useEffect } from 'react';
import { useDoubleTap } from '../../hooks/useDoubleTap'; // سنقوم بإنشائه

export default function ReelPlayer({ reel, isActive }) {
  const videoRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [previewTime, setPreviewTime] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleDoubleTap = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
    // منطق الإعجاب هنا
  };

  const bindDoubleTap = {
    onDoubleClick: handleDoubleTap,
    onTouchStart: (e) => {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - (videoRef.current.lastTap || 0) < 300) {
          handleDoubleTap();
        }
        videoRef.current.lastTap = now;
      }
    }
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const time = pct * videoRef.current.duration;
    setPreviewTime(time);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }} {...bindDoubleTap}>
      <video
        ref={videoRef}
        src={reel.videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        loop
        playsInline
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Buffering UI */}
      {isBuffering && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="reel-spinner"></div>
        </div>
      )}

      {/* Double Tap Heart Animation */}
      {showHeart && (
        <div className="heart-animation" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 80 }}>
          ❤️
        </div>
      )}

      {/* Quality Selector */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <select 
          value={quality} 
          onChange={(e) => setQuality(e.target.value)}
          style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px' }}
        >
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="480p">480p</option>
        </select>
      </div>

      {/* Seek Preview & Progress Bar */}
      <div 
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
        onMouseMove={handleSeek}
        onMouseLeave={() => setPreviewTime(null)}
      >
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)' }} />
        {previewTime !== null && (
          <div style={{ position: 'absolute', bottom: 10, left: `${(previewTime / videoRef.current.duration) * 100}%`, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
            {Math.floor(previewTime)}s
          </div>
        )}
      </div>

      <style>{`
        .reel-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .heart-animation { animation: heartPop 0.8s ease-out forwards; pointer-events: none; opacity: 0; }
        @keyframes heartPop { 
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
