import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [isDrafting, setIsDrafting] = useState(false);
  
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('yamshat_post_draft');
    if (savedDraft) {
      setContent(savedDraft);
      pushToast({ type: 'info', message: 'تم استعادة المسودة المحفوظة' });
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem('yamshat_post_draft', content);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content]);

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        pushToast({ type: 'error', message: 'حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)' });
        return;
      }
      setMedia(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearComposer = () => {
    setContent('');
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate('');
    setShowScheduler(false);
    localStorage.removeItem('yamshat_post_draft');
  };

  const handleSubmit = async (status = 'published') => {
    if (!content.trim() && !media) return;

    setIsUploading(true);
    try {
      let mediaUrl = '';
      if (media) {
        // Simulate Media Compression & Upload Progress
        const formData = new FormData();
        formData.append('file', media);
        
        // In real app, axios onUploadProgress would be used
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(r => setTimeout(r, 100));
        }
        
        const uploadRes = await uploadPostMedia(formData);
        mediaUrl = uploadRes.data.url;
      }

      await createPost({
        content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === 'scheduled' ? scheduledDate : null
      });

      pushToast({ 
        type: 'success', 
        message: status === 'published' ? 'تم النشر بنجاح!' : status === 'draft' ? 'تم حفظ المسودة' : 'تم جدولة المنشور' 
      });
      clearComposer();
      queryClient.invalidateQueries(['feed-data']);
    } catch (err) {
      pushToast({ type: 'error', message: 'فشل النشر، يمكنك المحاولة مرة أخرى' });
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
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: 80,
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            fontSize: 16,
            resize: 'none',
            outline: 'none',
            paddingTop: 8
          }}
        />
      </div>

      {mediaPreview && (
        <div style={{ position: 'relative', marginTop: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 300 }}>
          <button 
            onClick={() => { setMedia(null); setMediaPreview(null); }}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1 }}
          >✕</button>
          {media?.type.startsWith('video') ? (
            <video src={mediaPreview} style={{ width: '100%', display: 'block' }} controls />
          ) : (
            <img src={mediaPreview} style={{ width: '100%', objectFit: 'cover' }} alt="Preview" />
          )}
          {isUploading && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${uploadProgress}%`, transition: 'width 0.2s' }}></div>
            </div>
          )}
        </div>
      )}

      {showScheduler && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-soft)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold' }}>تحديد وقت النشر التلقائي:</label>
          <input 
            type="datetime-local" 
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--line)', padding: 10, borderRadius: 8 }}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: 0.8 }}
            title="إضافة وسائط"
          >🖼️</button>
          <button 
            onClick={() => setShowScheduler(!showScheduler)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: showScheduler ? 1 : 0.8, color: showScheduler ? 'var(--accent)' : 'inherit' }}
            title="جدولة المنشور"
          >📅</button>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleMediaSelect} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isUploading || !content.trim()}>
            حفظ مسودة
          </Button>
          <Button 
            onClick={() => handleSubmit(showScheduler ? 'scheduled' : 'published')} 
            loading={isUploading}
            disabled={isUploading || (!content.trim() && !media)}
          >
            {showScheduler ? 'تأكيد الجدولة' : 'نشر'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
