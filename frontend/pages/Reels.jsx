import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getPosts } from '../api/posts.js';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showMonetization, setShowMonetization] = useState(false);
  const [isAISubtitlesEnabled, setIsAISubtitlesEnabled] = useState(true);
  const [activeEffect, setActiveEffect] = useState('none');
  const videoRefs = useRef([]);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    const { data } = await getPosts({ limit: 20 });
    // Filter for videos only
    const videoPosts = (data || []).filter(p => p.media_url?.match(/\.(mp4|webm)$/i));
    setReels(videoPosts);
  };

  const handleScroll = (e) => {
    const index = Math.round(e.target.scrollTop / e.target.clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
      // Pause all and play active
      videoRefs.current.forEach((v, i) => {
        if (v) i === index ? v.play() : v.pause();
      });
    }
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#000' }}>
        
        {/* Reels Feed */}
        <div 
          onScroll={handleScroll}
          style={{ 
            flex: 1, 
            overflowY: 'scroll', 
            scrollSnapType: 'y mandatory',
            height: '100%'
          }}
        >
          {reels.map((reel, i) => (
            <div 
              key={reel.id} 
              style={{ 
                height: '100%', 
                scrollSnapAlign: 'start', 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video 
                ref={el => videoRefs.current[i] = el}
                src={reel.media_url} 
                loop 
                muted={false}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  filter: activeEffect === 'vintage' ? 'sepia(0.5)' : activeEffect === 'neon' ? 'hue-rotate(90deg) saturate(2)' : 'none'
                }}
              />

              {/* AI Subtitles Overlay */}
              {isAISubtitlesEnabled && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 150, 
                  left: '10%', 
                  right: '10%', 
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 18,
                  color: 'white'
                }}>
                  [AI Subtitles: {reel.content?.slice(0, 50)}...]
                </div>
              )}

              {/* Right Side Actions */}
              <div style={{ position: 'absolute', right: 15, bottom: 100, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 45, height: 45, borderRadius: '50%', color: 'white', fontSize: 20 }}>❤️</button>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{reel.likes_count || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 45, height: 45, borderRadius: '50%', color: 'white', fontSize: 20 }}>💬</button>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{reel.comments_count || 0}</div>
                </div>
                <button onClick={() => setShowMonetization(true)} style={{ background: 'gold', border: 'none', width: 45, height: 45, borderRadius: '50%', color: 'black', fontSize: 20 }}>💰</button>
              </div>

              {/* Bottom Info */}
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 80 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>@{reel.username}</div>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{reel.content}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Controls (Recommendation & Effects) */}
        <div style={{ width: 300, background: '#111', borderLeft: '1px solid #333', padding: 20, display: 'none' }}>
          <h3>محرك التوصيات</h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <Card style={{ padding: 10 }}>
              <div style={{ fontWeight: 'bold' }}>بناءً على اهتماماتك</div>
              <div className="muted" style={{ fontSize: 12 }}>نقترح لك ريلز تقنية</div>
            </Card>
          </div>

          <h3 style={{ marginTop: 30 }}>تأثيرات الفيديو</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 15 }}>
            {['none', 'vintage', 'neon', 'hdr'].map(eff => (
              <button 
                key={eff} 
                onClick={() => setActiveEffect(eff)}
                style={{ 
                  padding: 10, 
                  background: activeEffect === eff ? 'var(--primary)' : '#222',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white'
                }}
              >
                {eff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monetization Modal */}
      <Modal 
        isOpen={showMonetization} 
        onClose={() => setShowMonetization(false)}
        title="نظام الأرباح (Monetization)"
      >
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💰</div>
          <h3>أرباح هذا الريل</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: 'gold', margin: '15px 0' }}>$12.45</div>
          <div style={{ display: 'grid', gap: 12, textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <span>أرباح الإعلانات:</span>
              <span>$8.20</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
              <span>الهدايا:</span>
              <span>$4.25</span>
            </div>
          </div>
          <Button style={{ marginTop: 20, width: '100%' }}>سحب الأرباح</Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
