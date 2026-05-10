import { useEffect, useMemo, useState, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getStories, getStoryArchive, uploadStory } from '../api/stories.js';

const FILTERS = [
  { name: 'الأصلي', class: '' },
  { name: 'ذهبي', class: 'sepia(0.5) contrast(1.2)' },
  { name: 'بارد', class: 'hue-rotate(180deg) brightness(1.1)' },
  { name: 'درامي', class: 'grayscale(1) contrast(1.5)' },
  { name: 'ناعم', class: 'blur(1px) brightness(1.2)' }
];

export default function Stories() {
  const [activeTab, setActiveTab] = useState('feed'); // feed, archive, create
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [sRes, aRes] = await Promise.all([getStories(), getStoryArchive()]);
    setStories(sRes.data || []);
    setArchive(aRes.data || []);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setActiveTab('create');
    }
  };

  // Drawing Logic
  useEffect(() => {
    if (activeTab === 'create' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 5;
      ctxRef.current = ctx;
    }
  }, [activeTab]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleUpload = async () => {
    // In real app, we would combine canvas drawing with image
    await uploadStory({
      file: selectedFile,
      is_close_friends: isCloseFriends,
      filter: activeFilter.name
    });
    setActiveTab('feed');
    loadData();
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 10px' }}>
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <Button variant="secondary" onClick={() => setActiveTab('feed')} style={{ background: activeTab === 'feed' ? 'var(--primary)' : '' }}>القصص</Button>
          <Button variant="secondary" onClick={() => setActiveTab('archive')} style={{ background: activeTab === 'archive' ? 'var(--primary)' : '' }}>🗄️ الأرشيف</Button>
          <label style={{ marginLeft: 'auto' }}>
            <input type="file" hidden onChange={handleFileSelect} accept="image/*,video/*" />
            <Button as="span" style={{ cursor: 'pointer' }}>➕ قصة جديدة</Button>
          </label>
        </div>

        {activeTab === 'feed' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {stories.map(story => (
              <Card key={story.id} style={{ 
                height: 250, 
                position: 'relative', 
                overflow: 'hidden',
                border: story.is_close_friends ? '3px solid #44ff44' : '1px solid var(--line)'
              }}>
                <img src={story.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12 }}>{story.username}</div>
                  {story.is_close_friends && <div style={{ color: '#44ff44', fontSize: 10 }}>⭐ الأصدقاء المقربون</div>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'archive' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {archive.map(story => (
              <div key={story.id} style={{ aspectRatio: '9/16', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                <img src={story.media_url} alt="archived" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', borderRadius: 16, overflow: 'hidden' }}>
              <img 
                src={previewUrl} 
                alt="preview" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', filter: activeFilter.class }} 
              />
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
              />
              <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: 8, borderRadius: '50%' }}>🔄</button>
                <button onClick={() => setIsCloseFriends(!isCloseFriends)} style={{ background: isCloseFriends ? '#44ff44' : 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: 8, borderRadius: '50%' }}>⭐</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {FILTERS.map(f => (
                <button 
                  key={f.name} 
                  onClick={() => setActiveFilter(f)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 20, 
                    background: activeFilter.name === f.name ? 'var(--primary)' : '#222',
                    color: 'white',
                    border: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={() => setActiveTab('feed')} style={{ flex: 1 }}>إلغاء</Button>
              <Button onClick={handleUpload} style={{ flex: 2 }}>نشر القصة {isCloseFriends ? '(المقربون)' : ''}</Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
