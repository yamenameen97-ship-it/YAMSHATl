import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { createPost } from '../../api/posts.js';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import { useToast } from '../admin/ToastProvider.jsx';

const DRAFT_KEY = 'yamshat_post_draft';
const QUOTE_KEY = 'yamshat_quote_draft';

function extractTags(text = '') {
  const hashtags = Array.from(new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.replace('#', ''))));
  const mentions = Array.from(new Set((text.match(/@[\p{L}\p{N}_.-]+/gu) || []).map((item) => item.replace('@', ''))));
  return { hashtags, mentions };
}

export default function PostComposer() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    const savedQuote = localStorage.getItem(QUOTE_KEY);
    if (savedDraft) setContent(savedDraft);
    if (savedQuote) {
      try {
        setQuoteDraft(JSON.parse(savedQuote));
      } catch {
        localStorage.removeItem(QUOTE_KEY);
      }
    }

    const handleQuotedPost = () => {
      try {
        const nextValue = JSON.parse(localStorage.getItem(QUOTE_KEY) || 'null');
        setQuoteDraft(nextValue);
      } catch {
        setQuoteDraft(null);
      }
    };

    window.addEventListener('yamshat:quote-post', handleQuotedPost);
    return () => window.removeEventListener('yamshat:quote-post', handleQuotedPost);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [content]);

  const tagsPreview = useMemo(() => extractTags(content), [content]);

  const clearComposer = () => {
    setContent('');
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate('');
    setShowScheduler(false);
    setIsPinned(false);
    setQuoteDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(QUOTE_KEY);
  };

  const addSnippet = (value) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${value}`);
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
    if (isUploading || (!content.trim() && !media && !quoteDraft)) return;
    setIsUploading(true);
    try {
      let mediaUrl = '';
      if (media) {
        const uploadRes = await mediaUploadService.uploadFile(media, {
          purpose: media?.type?.startsWith('video/') ? 'post-video' : 'post-image',
          onProgress: (payload) => {
            const percent = typeof payload === 'number' ? Number(payload || 0) : Number(payload?.percent || 0);
            setUploadProgress(percent);
          },
        });
        mediaUrl = uploadRes?.mediaUrl || uploadRes?.url || uploadRes?.file_url || '';
      }

      const { hashtags, mentions } = extractTags(content);
      await createPost({
        content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === 'scheduled' ? scheduledDate : null,
        is_pinned: isPinned,
        hashtags,
        mentions,
        quote_source_id: quoteDraft?.id || null,
      });

      pushToast({
        type: 'success',
        title: status === 'draft' ? 'تم حفظ المسودة' : status === 'scheduled' ? 'تمت جدولة المنشور' : 'تم نشر المنشور',
        description: isPinned ? 'المنشور متجهز كمنشور مثبت.' : undefined,
      });
      clearComposer();
      queryClient.invalidateQueries(['feed-data']);
    } catch (error) {
      pushToast({ type: 'error', title: 'فشل نشر المنشور', description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card style={{ marginBottom: 24, padding: 20, border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          {quoteDraft ? (
            <div style={{ borderRadius: 16, padding: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>اقتباس من @{quoteDraft.username}</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{quoteDraft.content}</div>
                </div>
                <button type="button" onClick={() => { setQuoteDraft(null); localStorage.removeItem(QUOTE_KEY); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
            </div>
          ) : null}

          <textarea
            placeholder="اكتب منشورك... استخدم #هاشتاج و @منشن لو حابب"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            style={{ width: '100%', minHeight: 96, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 16, resize: 'none', outline: 'none', paddingTop: 8, lineHeight: 1.7 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button type="button" className="composer-chip" onClick={() => addSnippet('#ترند')}>#هاشتاج</button>
        <button type="button" className="composer-chip" onClick={() => addSnippet('@username')}>@منشن</button>
        <button type="button" className="composer-chip" onClick={() => addSnippet('اقتباس: ')}>اقتباس</button>
        <button type="button" className={`composer-chip ${isPinned ? 'active' : ''}`} onClick={() => setIsPinned((prev) => !prev)}>تثبيت المنشور</button>
      </div>

      {(tagsPreview.hashtags.length || tagsPreview.mentions.length) ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {tagsPreview.hashtags.length ? <div className="muted" style={{ fontSize: 13 }}>هاشتاج: {tagsPreview.hashtags.map((item) => `#${item}`).join(' · ')}</div> : null}
          {tagsPreview.mentions.length ? <div className="muted" style={{ fontSize: 13 }}>منشن: {tagsPreview.mentions.map((item) => `@${item}`).join(' · ')}</div> : null}
        </div>
      ) : null}

      {mediaPreview ? (
        <div style={{ position: 'relative', marginTop: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 320 }}>
          <button type="button" onClick={() => { setMedia(null); setMediaPreview(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', zIndex: 1 }}>✕</button>
          {media?.type?.startsWith('video') ? (
            <video src={mediaPreview} style={{ width: '100%', display: 'block' }} controls />
          ) : (
            <img src={mediaPreview} style={{ width: '100%', objectFit: 'cover' }} alt="Preview" />
          )}
          {isUploading ? (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
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

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: 0.8 }} title="رفع صورة أو فيديو">🖼️</button>
          <button type="button" onClick={() => setShowScheduler((prev) => !prev)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: showScheduler ? 1 : 0.8, color: showScheduler ? 'var(--accent)' : 'inherit' }} title="جدولة">📅</button>
          <span className="muted" style={{ fontSize: 13 }}>{isPinned ? 'هيتثبت بعد النشر' : 'منشور عادي'}</span>
          <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleMediaSelect} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isUploading || (!content.trim() && !quoteDraft)}>حفظ مسودة</Button>
          <Button onClick={() => handleSubmit(showScheduler ? 'scheduled' : 'published')} loading={isUploading} disabled={isUploading || (!content.trim() && !media && !quoteDraft)}>
            {showScheduler ? 'تأكيد الجدولة' : 'نشر'}
          </Button>
        </div>
      </div>

      <style>{`
        .composer-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
          color: #059669;
        }
      `}</style>
    </Card>
  );
}
