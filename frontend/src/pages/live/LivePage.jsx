import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب', icon: '❤️', price: 100 },
];

export default function LivePage() {
  const { pushToast } = useToast();
  const [streamStatus, setStreamStatus] = useState('loading'); // loading, live, reconnecting, error
  const [latency, setLatency] = useState(0);
  const [showGifts, setShowGifts] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStreamStatus('live'), 1500);
    const latencyInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 80) + 20);
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(latencyInterval);
    };
  }, []);

  const handleReconnect = () => {
    setStreamStatus('reconnecting');
    setTimeout(() => setStreamStatus('live'), 2000);
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#000', position: 'relative' }}>
        
        {/* Main Stream Area */}
        <div style={{ flex: 1, position: 'relative', background: '#1a1a1a' }}>
          {streamStatus === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <div className="live-spinner"></div>
            </div>
          )}

          {streamStatus === 'reconnecting' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="live-spinner"></div>
                <p>جاري إعادة الاتصال...</p>
              </div>
            </div>
          )}

          {streamStatus === 'live' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 60 }}>👤</div>
            </div>
          )}

          {/* Overlays */}
          <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10 }}>
            <div style={{ background: '#ff4444', padding: '4px 12px', borderRadius: 4, fontWeight: 'bold', fontSize: 12 }}>مباشر</div>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>
              تأخير: {latency}ms
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 15 }}>
            <button onClick={() => setShowGifts(true)} style={{ background: 'gold', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>🎁</button>
            <Button variant="danger" onClick={() => setIsLive(!isLive)}>{isLive ? 'إنهاء' : 'بدء'}</Button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, background: 'rgba(0,0,0,0.9)', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 15, borderBottom: '1px solid #333' }}>الدردشة المباشرة</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}><span style={{ fontWeight: 'bold' }}>نظام:</span> أهلاً بك في البث المباشر!</div>
          </div>
          <div style={{ padding: 15 }}>
            <input placeholder="تعليق..." style={{ width: '100%', background: '#222', border: 'none', padding: 10, borderRadius: 20, color: 'white' }} />
          </div>
        </div>
      </div>

      <Modal isOpen={showGifts} onClose={() => setShowGifts(false)} title="إرسال هدية">
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {GIFTS.map(g => (
            <div key={g.id} style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <div style={{ fontSize: 24 }}>{g.icon}</div>
              <div style={{ fontSize: 12 }}>{g.name}</div>
            </div>
          ))}
        </div>
      </Modal>

      <style>{`
        .live-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #ff4444; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </MainLayout>
  );
}
