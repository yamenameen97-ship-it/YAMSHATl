import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { createPost, uploadPostMedia } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';

export default function PostComposer() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  useEffect(() => {
    const savedDraft = localStorage.getItem('yamshat_post_draft');
    if (savedDraft) {
      setContent(savedDraft);
      pushToast({ type: 'info', title: 'تمت استعادة المسودة' });
    }
  }, [pushToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem('yamshat_post_draft', content);
      } else {
        localStorage.removeItem('yamshat_post_draft');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [content]);

  const clearComposer = () => {
    setContent('');
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate('');
    setShowScheduler(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    localStorage.removeItem('yamshat_post_draft');
  };

  const handleMediaSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      pushToast({ type: 'error', title: 'الملف كبير جدًا', description: 'الحد الأقصى 200 ميجا.' });
      return;
    }
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (status = 'published') => {
    if (isUploading || (!content.trim() && !media)) return;
    setIsUploading(true);
    try {
      let mediaUrl = '';
      if (media) {
        const uploadRes = await uploadPostMedia(media, (event) => {
          const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setUploadProgress(percent);
        });
        mediaUrl = uploadRes?.data?.media_url || uploadRes?.data?.url || uploadRes?.data?.file_url || '';
      }

      await createPost({
        content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === 'scheduled' ? scheduledDate : null,
      });

      pushToast({
        type: 'success',
        title: status === 'draft' ? 'تم حفظ المسودة' : status === 'scheduled' ? 'تمت جدولة المنشور' : 'تم نشر المنشور',
      });
      clearComposer();
      queryClient.invalidateQueries(['feed-data']);
    } catch (err) {
      pushToast({ type: 'error', title: 'فشل نشر المنشور', description: err?.response?.data?.detail || err?.message || 'حاول مرة تانية.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card style={{ marginBottom: 24, padding: 20, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
        <textarea
          placeholder="بماذا تفكر اليوم؟"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          style={{ width: '100%', minHeight: 80, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 16, resize: 'none', outline: 'none', paddingTop: 8 }}
        />
      </div>

      {mediaPreview ? (
        <div style={{ position: 'relative', marginTop: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 300 }}>
          <button onClick={() => { setMedia(null); setMediaPreview(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1 }}>✕</button>
          {media?.type?.startsWith('video') ? (
            <video src={mediaPreview} style={{ width: '100%', display: 'block' }} controls />
          ) : (
            <img src={mediaPreview} style={{ width: '100%', objectFit: 'cover' }} alt="Preview" />
          )}
          {isUploading ? (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${uploadProgress}%`, transition: 'width 0.2s' }}></div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showScheduler ? (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-soft)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>تحديد وقت النشر</label>
          <input type="datetime-local" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--line)', padding: 10, borderRadius: 8 }} />
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: 0.8 }} title="رفع صورة أو فيديو">🖼️</button>
          <button onClick={() => setShowScheduler((prev) => !prev)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: showScheduler ? 1 : 0.8, color: showScheduler ? 'var(--accent)' : 'inherit' }} title="جدولة">📅</button>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleMediaSelect} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isUploading || !content.trim()}>حفظ مسودة</Button>
          <Button onClick={() => handleSubmit(showScheduler ? 'scheduled' : 'published')} loading={isUploading} disabled={isUploading || (!content.trim() && !media)}>
            {showScheduler ? 'تأكيد الجدولة' : 'نشر'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
