import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب', icon: '❤️', price: 100 },
  { id: 4, name: 'سيارة', icon: '🚗', price: 1000 },
  { id: 5, name: 'تاج', icon: '👑', price: 5000 }
];

export default function Live() {
  const { pushToast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hosts, setHosts] = useState([{ id: 1, name: 'أنت', isMain: true }]);
  const [comments, setComments] = useState([
    { id: 1, user: 'خالد', text: 'بث رائع!' },
    { id: 2, user: 'سارة', text: 'كيف حالك؟' }
  ]);

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) pushToast({ type: 'success', message: 'أنت الآن على الهواء مباشرة!' });
  };

  const handleSendGift = (gift) => {
    pushToast({ type: 'info', message: `تم إرسال ${gift.name} ${gift.icon}` });
    setShowGifts(false);
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#000', position: 'relative' }}>
        
        {/* Main Stream Area */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: '#1a1a1a', 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2,
            padding: 2
          }}>
            {hosts.map(host => (
              <div key={host.id} style={{ 
                flex: hosts.length === 1 ? '1 1 100%' : '1 1 48%', 
                background: '#333', 
                borderRadius: 8,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: 40 }}>👤</div>
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                  {host.name}
                </div>
              </div>
            ))}
          </div>

          {/* Stream Overlay */}
          <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: '#ff4444', padding: '4px 12px', borderRadius: 4, fontWeight: 'bold', fontSize: 12 }}>LIVE</div>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>👁️ 1.2k</div>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4, fontSize: 12, color: '#44ff44' }}>Excellent Connection</div>
          </div>

          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="small" onClick={() => setShowAnalytics(true)}>📊 التحليلات</Button>
            <Button variant="danger" size="small" onClick={toggleLive}>{isLive ? 'إنهاء البث' : 'بدء البث'}</Button>
          </div>

          {/* Bottom Controls */}
          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 15 }}>
            <button onClick={() => setShowGifts(true)} style={{ background: 'gold', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>🎁</button>
            <button onClick={() => setIsRecording(!isRecording)} style={{ background: isRecording ? '#ff4444' : 'white', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>⏺️</button>
            <button onClick={() => setHosts([...hosts, { id: Date.now(), name: 'ضيف جديد' }])} style={{ background: 'var(--primary)', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, color: 'white', cursor: 'pointer' }}>👥</button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div style={{ width: 350, background: 'rgba(0,0,0,0.8)', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 15, borderBottom: '1px solid #333', fontWeight: 'bold' }}>الدردشة المباشرة</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map(c => (
              <div key={c.id} style={{ fontSize: 14 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginLeft: 8 }}>{c.user}:</span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 15, borderTop: '1px solid #333' }}>
            <input 
              placeholder="اكتب تعليقاً..." 
              style={{ width: '100%', background: '#222', border: 'none', padding: '10px 15px', borderRadius: 20, color: 'white' }}
            />
          </div>
        </div>
      </div>

      {/* Gifts Modal */}
      <Modal isOpen={showGifts} onClose={() => setShowGifts(false)} title="أرسل هدية للمضيف">
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
          {GIFTS.map(gift => (
            <div 
              key={gift.id} 
              onClick={() => handleSendGift(gift)}
              style={{ textAlign: 'center', padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 12, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{gift.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{gift.name}</div>
              <div style={{ color: 'gold', fontSize: 12 }}>{gift.price} عملة</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="إحصائيات البث المباشر">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>2,450</div>
              <div className="muted">إجمالي المشاهدات</div>
            </Card>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'gold' }}>15,200</div>
              <div className="muted">إجمالي العملات</div>
            </Card>
          </div>
          <h4>مخطط التفاعل</h4>
          <div style={{ height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 10, display: 'flex', alignItems: 'flex-end', gap: 5, padding: 10 }}>
            {[20, 45, 30, 80, 60, 90, 40, 55, 70, 85].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
