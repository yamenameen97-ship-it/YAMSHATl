import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getPosts } from '../api/posts.js';

const ReelSkeleton = () => (
  <div style={{ height: '100%', width: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner"></div>
    <style>{`
      .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

/**
 * Advanced Reels Component
 * Features: 
 * - Video Preloading & Autoplay Optimization
 * - Adaptive Quality based on Network
 * - Memory Management (Pause/Unload offscreen)
 * - Prevent Rerenders & Memory Leaks
 */
export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMonetization, setShowMonetization] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);
  
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // Adaptive Quality Logic
  const getAdaptiveUrl = useCallback((url) => {
    const connection = navigator.connection || {};
    const type = connection.effectiveType || '4g';
    if (['slow-2g', '2g', '3g'].includes(type) || connection.saveData) {
      return `${url}?quality=low`; // Simulated adaptive quality
    }
    return url;
  }, []);

  const loadReels = useCallback(async (pageNum) => {
    try {
      setIsLoading(true);
      const { data } = await getPosts({ limit: 5, filter: 'trending', page: pageNum });
      const videoPosts = (data || []).filter(p => p.media_url?.match(/\.(mp4|webm|mov)$/i));
      
      if (videoPosts.length === 0) {
        setHasNextPage(false);
      } else {
        const enhancedPosts = videoPosts.map(post => ({
          ...post,
          adaptiveUrl: getAdaptiveUrl(post.media_url)
        }));
        setReels(prev => pageNum === 1 ? enhancedPosts : [...prev, ...enhancedPosts]);
      }
    } catch (err) {
      console.error('Failed to load reels:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getAdaptiveUrl]);

  useEffect(() => {
    loadReels(1);
  }, [loadReels]);

  // Infinite Scroll Logic
  useEffect(() => {
    if (activeIndex >= reels.length - 2 && hasNextPage && !isLoading) {
      setPage(prev => {
        const next = prev + 1;
        loadReels(next);
        return next;
      });
    }
  }, [activeIndex, reels.length, hasNextPage, isLoading, loadReels]);

  // Intersection Observer for Video Management
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.dataset.index);
          const video = videoRefs.current[index];
          
          if (entry.isIntersecting) {
            setActiveIndex(index);
            if (video) {
              // Autoplay Optimization
              video.play().catch(() => {
                // Handle autoplay block by showing play button or muting
                video.muted = true;
                video.play();
              });
              
              // Preload next 2 reels (Video Preloading)
              for (let i = 1; i <= 2; i++) {
                const nextVideo = videoRefs.current[index + i];
                if (nextVideo) nextVideo.preload = 'auto';
              }
            }
          } else {
            if (video) {
              // Pause offscreen videos
              video.pause();
              
              // Memory Management: Unload distant videos
              if (Math.abs(index - activeIndex) > 3) {
                video.preload = 'none';
                const currentSrc = video.src;
                video.src = ''; 
                video.load();
                // Store src to restore later if needed
                video.dataset.src = currentSrc;
              }
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    const elements = document.querySelectorAll('.reel-item');
    elements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [reels, activeIndex]);

  // Memoized Reel Items to prevent unnecessary rerenders
  const renderedReels = useMemo(() => {
    return reels.map((reel, i) => (
      <div 
        key={`${reel.id}-${i}`}
        data-index={i}
        className="reel-item"
        style={{ 
          height: '100%', 
          scrollSnapAlign: 'start', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000'
        }}
      >
        {Math.abs(i - activeIndex) <= 3 ? (
          <video 
            ref={el => videoRefs.current[i] = el}
            src={reel.adaptiveUrl} 
            loop 
            playsInline
            preload={Math.abs(i - activeIndex) <= 1 ? 'auto' : 'metadata'}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
            }}
          />
        ) : (
          <ReelSkeleton />
        )}

        {/* Interaction Overlay */}
        <div style={{ position: 'absolute', right: 16, bottom: 100, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', marginBottom: 10 }}>
            <img src={reel.avatar || `https://ui-avatars.com/api/?name=${reel.username}`} alt="User" style={{ width: '100%', height: '100%' }} />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button className="reel-action-btn">❤️</button>
            <div style={{ fontSize: 12, color: 'white', marginTop: 4 }}>{reel.likes_count || '0'}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="reel-action-btn">💬</button>
            <div style={{ fontSize: 12, color: 'white', marginTop: 4 }}>{reel.comments_count || '0'}</div>
          </div>

          <button className="reel-action-btn">📤</button>
          
          <button 
            onClick={() => setShowMonetization(true)} 
            style={{ background: 'linear-gradient(45deg, #FFD700, #FFA500)', border: 'none', width: 45, height: 45, borderRadius: '50%', color: 'black', fontSize: 20, boxShadow: '0 0 15px rgba(255,215,0,0.5)' }}
          >💰</button>
        </div>

        {/* Content Info */}
        <div style={{ position: 'absolute', bottom: 30, left: 20, right: 80, zIndex: 10, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            @{reel.username}
            <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>متابعة</button>
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, maxWidth: '80%' }}>{reel.content}</div>
        </div>
      </div>
    ));
  }, [reels, activeIndex]);

  return (
    <MainLayout>
      <div style={{ height: 'calc(100vh - 60px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
        
        <div 
          ref={containerRef}
          style={{ 
            height: '100%', 
            overflowY: 'scroll', 
            scrollSnapType: 'y mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          className="reels-scroll-container"
        >
          {renderedReels}

          {isLoading && reels.length === 0 && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ReelSkeleton />
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showMonetization} onClose={() => setShowMonetization(false)} title="نظام الأرباح">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <h3>أرباح المحتوى</h3>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#FFD700', margin: '20px 0' }}>$124.50</div>
          <Button style={{ marginTop: 24, width: '100%', height: 50 }}>سحب الأرباح للمحفظة</Button>
        </div>
      </Modal>

      <style>{`
        .reels-scroll-container::-webkit-scrollbar { display: none; }
        .reel-action-btn { 
          background: rgba(255,255,255,0.15); 
          backdrop-filter: blur(5px);
          border: none; 
          width: 48px; 
          height: 48px; 
          border-radius: 50%; 
          color: white; 
          font-size: 22px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reel-action-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.25); }
      `}</style>
    </MainLayout>
  );
}
