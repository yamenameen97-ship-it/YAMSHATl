import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { getStories, getStoryArchive, uploadStory } from '../api/stories.js';

const FILTERS = [
  { name: 'الأصلي', class: '' },
  { name: 'ذهبي', class: 'sepia(0.5) contrast(1.2)' },
  { name: 'بارد', class: 'hue-rotate(180deg) brightness(1.1)' },
  { name: 'درامي', class: 'grayscale(1) contrast(1.5)' },
  { name: 'ناعم', class: 'blur(1px) brightness(1.2)' }
];

export default function Stories() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState('feed');
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCloseFriends, setIsCloseFriends] = useState(false);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [storiesRes, archiveRes] = await Promise.all([getStories(), getStoryArchive()]);
      setStories(Array.isArray(storiesRes?.data) ? storiesRes.data : []);
      setArchive(Array.isArray(archiveRes?.data) ? archiveRes.data : []);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'تعذر تحميل القصص';
      setError(detail);
      pushToast({ type: 'error', title: 'فشل تحميل القصص', description: detail });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      pushToast({ type: 'error', title: 'الملف كبير جدًا', description: 'الحد الأقصى لرفع الستوري هو 150 ميجا.' });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setActiveTab('create');
  };

  useEffect(() => {
    if (activeTab !== 'create' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctxRef.current = ctx;
  }, [activeTab, previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const drawingData = canvasRef.current?.toDataURL?.('image/png') || '';
      await uploadStory(selectedFile, {
        is_close_friends: isCloseFriends,
        filter_name: activeFilter.name,
        drawing_data: drawingData,
      });
      pushToast({ type: 'success', title: 'تم نشر الستوري' });
      setSelectedFile(null);
      setPreviewUrl('');
      setIsCloseFriends(false);
      setActiveFilter(FILTERS[0]);
      setActiveTab('feed');
      await loadData();
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر رفع الستوري', description: err?.response?.data?.detail || err?.message });
    } finally {
      setUploading(false);
    }
  };

  const storyCards = useMemo(() => (
    stories.map((story) => (
      <Card key={story.id} style={{ height: 260, position: 'relative', overflow: 'hidden', border: story.is_close_friends ? '3px solid #44ff44' : '1px solid var(--line)' }}>
        {story.media_url?.match(/\.(mp4|webm|mov)$/i)
          ? <video src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop />
          : <img src={story.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', bottom: 0, insetInline: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>{story.username}</div>
          {story.is_close_friends ? <div style={{ color: '#44ff44', fontSize: 10 }}>⭐ الأصدقاء المقربون</div> : null}
        </div>
      </Card>
    ))
  ), [stories]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 10px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setActiveTab('feed')} style={{ background: activeTab === 'feed' ? 'var(--primary)' : '' }}>القصص</Button>
          <Button variant="secondary" onClick={() => setActiveTab('archive')} style={{ background: activeTab === 'archive' ? 'var(--primary)' : '' }}>الأرشيف</Button>
          <label style={{ marginInlineStart: 'auto' }}>
            <input type="file" hidden onChange={handleFileSelect} accept="image/*,video/*" />
            <Button as="span" style={{ cursor: 'pointer' }}>رفع ستوري</Button>
          </label>
          <Button variant="secondary" onClick={loadData} loading={loading}>تحديث</Button>
        </div>

        {loading ? <Card style={{ padding: 24 }}>جارٍ تحميل الستوري...</Card> : null}
        {!loading && error ? <Card style={{ padding: 24 }}>{error}</Card> : null}

        {!loading && !error && activeTab === 'feed' ? (
          stories.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>{storyCards}</div> : <Card style={{ padding: 24 }}>لا توجد قصص حالياً.</Card>
        ) : null}

        {!loading && !error && activeTab === 'archive' ? (
          archive.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {archive.map((story) => (
                <div key={story.id} style={{ aspectRatio: '9/16', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                  {story.media_url?.match(/\.(mp4|webm|mov)$/i)
                    ? <video src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} muted />
                    : <img src={story.media_url} alt="archived" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />}
                </div>
              ))}
            </div>
          ) : <Card style={{ padding: 24 }}>الأرشيف فارغ.</Card>
        ) : null}

        {activeTab === 'create' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', borderRadius: 16, overflow: 'hidden' }}>
              {selectedFile?.type?.startsWith('video/')
                ? <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: activeFilter.class }} controls />
                : <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: activeFilter.class }} />}
              {!selectedFile?.type?.startsWith('video/') ? (
                <canvas
                  ref={canvasRef}
                  onMouseDown={(event) => {
                    setIsDrawing(true);
                    const { offsetX, offsetY } = event.nativeEvent;
                    ctxRef.current.beginPath();
                    ctxRef.current.moveTo(offsetX, offsetY);
                  }}
                  onMouseMove={(event) => {
                    if (!isDrawing || !ctxRef.current) return;
                    const { offsetX, offsetY } = event.nativeEvent;
                    ctxRef.current.lineTo(offsetX, offsetY);
                    ctxRef.current.stroke();
                  }}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
                />
              ) : null}
              <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button type="button" onClick={() => ctxRef.current?.clearRect?.(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: 8, borderRadius: '50%' }}>🔄</button>
                <button type="button" onClick={() => setIsCloseFriends((prev) => !prev)} style={{ background: isCloseFriends ? '#44ff44' : 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: 8, borderRadius: '50%' }}>⭐</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {FILTERS.map((filter) => (
                <button
                  key={filter.name}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: activeFilter.name === filter.name ? 'var(--primary)' : '#222',
                    color: 'white',
                    border: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {filter.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={() => setActiveTab('feed')} style={{ flex: 1 }}>إلغاء</Button>
              <Button onClick={handleUpload} style={{ flex: 2 }} loading={uploading} disabled={uploading || !selectedFile}>
                {isCloseFriends ? 'نشر للأصدقاء المقربين' : 'نشر الستوري'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
