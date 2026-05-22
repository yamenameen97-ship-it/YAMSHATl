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
  const [isDragActive, setIsDragActive] = useState(false);
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

  useEffect(() => () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
  }, [mediaPreview]);

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

  const applySelectedFile = (file) => {
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      pushToast({ type: 'error', title: 'الملف كبير جدًا', description: 'الحد الأقصى 200 ميجا.' });
      return;
    }
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleMediaSelect = (event) => {
    const file = event.target.files?.[0];
    applySelectedFile(file);
  };

  const canSubmit = Boolean(content.trim() || media || quoteDraft);

  const handleSubmit = async (status = 'published') => {
    if (isUploading || !canSubmit) return;
    if (status === 'scheduled' && !scheduledDate) {
      pushToast({ type: 'warning', title: 'حدد وقت الجدولة', description: 'لازم تختار تاريخ ووقت قبل تأكيد الجدولة.' });
      return;
    }
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
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    } catch (error) {
      pushToast({ type: 'error', title: 'فشل نشر المنشور', description: error?.response?.data?.detail || error?.message || 'حاول مرة تانية.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        padding: 18,
        border: '1px solid var(--line)',
        direction: 'rtl',
        borderRadius: 22,
        background: 'linear-gradient(180deg, rgba(13,17,29,0.96), rgba(8,12,22,0.94))',
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setIsDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        applySelectedFile(file);
      }}
    >
      <div className="composer-header-row">
        <div>
          <div className="composer-title">إنشاء منشور</div>
          <div className="composer-subtitle">رتّب الخيارات بالأعلى ثم اكتب المنشور أسفلها ليظهر بشكل أوضح في صفحة المنشورات.</div>
        </div>
        <div className={`composer-status-badge ${isPinned ? 'pinned' : ''}`}>
          {isPinned ? 'منشور مثبت' : 'منشور عادي'}
        </div>
      </div>

      <div className="composer-toolbar" aria-label="أدوات المنشور">
        <button type="button" className="composer-chip" onClick={() => addSnippet('#ترند')}>ترند#</button>
        <button type="button" className="composer-chip" onClick={() => addSnippet('#هاشتاج')}>هاشتاج</button>
        <button type="button" className="composer-chip" onClick={() => addSnippet('@username')}>منشن</button>
        <button type="button" className="composer-chip" onClick={() => addSnippet('اقتباس: ')}>اقتباس</button>
        <button type="button" className={`composer-chip ${isPinned ? 'active' : ''}`} onClick={() => setIsPinned((prev) => !prev)}>
          تثبيت منشور
        </button>
      </div>

      <div className="composer-actions-row">
        <button type="button" className="composer-action-btn" onClick={() => fileInputRef.current?.click()} title="رفع صورة أو فيديو">
          <span>🖼️</span>
          <span>رفع الصورة</span>
        </button>

        <button
          type="button"
          className={`composer-action-btn ${showScheduler ? 'active' : ''}`}
          onClick={() => setShowScheduler((prev) => !prev)}
          title="جدولة"
        >
          <span>📅</span>
          <span>جدولة</span>
        </button>

        <Button
          variant="secondary"
          size="small"
          onClick={() => handleSubmit('draft')}
          disabled={isUploading || !canSubmit}
        >
          حفظ المنشور
        </Button>

        <Button
          size="small"
          onClick={() => handleSubmit(showScheduler ? 'scheduled' : 'published')}
          loading={isUploading}
          disabled={isUploading || !canSubmit}
        >
          {showScheduler ? 'تأكيد الجدولة' : 'النشر'}
        </Button>

        <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleMediaSelect} />
      </div>

      {showScheduler ? (
        <div className="composer-scheduler-box">
          <label className="composer-field-label">تحديد وقت النشر</label>
          <input
            type="datetime-local"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            className="composer-datetime-input"
          />
        </div>
      ) : null}

      <div className={`composer-editor-shell ${isDragActive ? 'drag-active' : ''}`}>
        <div className="composer-editor-topline">
          <span className="composer-field-label">بماذا تفكر؟</span>
          <span className="composer-drop-hint">اسحب وأسقط صورة أو فيديو أو GIF هنا</span>
        </div>

        {quoteDraft ? (
          <div className="composer-quote-box">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>اقتباس من @{quoteDraft.username}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>{quoteDraft.content}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuoteDraft(null);
                localStorage.removeItem(QUOTE_KEY);
              }}
              className="composer-close-btn"
            >
              ✕
            </button>
          </div>
        ) : null}

        <textarea
          placeholder="اكتب منشورك هنا... استخدم #هاشتاج أو @منشن لو حابب"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="composer-textarea"
        />
      </div>

      {(tagsPreview.hashtags.length || tagsPreview.mentions.length) ? (
        <div className="composer-tags-preview">
          {tagsPreview.hashtags.length ? <div className="muted" style={{ fontSize: 13 }}>هاشتاج: {tagsPreview.hashtags.map((item) => `#${item}`).join(' · ')}</div> : null}
          {tagsPreview.mentions.length ? <div className="muted" style={{ fontSize: 13 }}>منشن: {tagsPreview.mentions.map((item) => `@${item}`).join(' · ')}</div> : null}
        </div>
      ) : null}

      {mediaPreview ? (
        <div className="composer-media-preview">
          <button
            type="button"
            onClick={() => {
              setMedia(null);
              if (mediaPreview) URL.revokeObjectURL(mediaPreview);
              setMediaPreview(null);
            }}
            className="composer-close-btn media-close"
          >
            ✕
          </button>
          {media?.type?.startsWith('video') ? (
            <video src={mediaPreview} style={{ width: '100%', display: 'block' }} controls />
          ) : (
            <img src={mediaPreview} style={{ width: '100%', objectFit: 'cover', display: 'block' }} alt="Preview" />
          )}
          {isUploading ? (
            <div className="composer-upload-progress-track">
              <div className="composer-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      <style>{`
        .composer-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .composer-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 4px;
        }
        .composer-subtitle {
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }
        .composer-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--muted);
          font-size: 12px;
          white-space: nowrap;
        }
        .composer-status-badge.pinned {
          background: rgba(16,185,129,0.14);
          border-color: rgba(16,185,129,0.3);
          color: #6ee7b7;
        }
        .composer-toolbar {
          display: flex;
          flex-direction: row-reverse;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
          align-items: center;
        }
        .composer-chip {
          border: 1px solid rgba(167, 139, 250, 0.25);
          background: rgba(139, 92, 246, 0.10);
          color: var(--text);
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .composer-chip:hover {
          background: rgba(139, 92, 246, 0.16);
          border-color: rgba(167, 139, 250, 0.35);
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.14);
          border-color: rgba(16,185,129,0.3);
          color: #6ee7b7;
        }
        .composer-actions-row {
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .composer-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--text);
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .composer-action-btn:hover,
        .composer-action-btn.active {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(167, 139, 250, 0.3);
        }
        .composer-scheduler-box {
          margin-bottom: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.035);
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .composer-field-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }
        .composer-datetime-input {
          width: 100%;
          margin-top: 8px;
          background: var(--bg-input);
          color: var(--text);
          border: 1px solid var(--line);
          padding: 10px 12px;
          border-radius: 10px;
        }
        .composer-editor-shell {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          padding: 14px;
          transition: all 0.2s ease;
        }
        .composer-editor-shell.drag-active {
          border-color: rgba(16,185,129,0.45);
          background: rgba(16,185,129,0.08);
        }
        .composer-editor-topline {
          display: flex;
          flex-direction: row-reverse;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .composer-drop-hint {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px dashed rgba(139, 92, 246, 0.28);
          color: var(--muted);
          font-size: 12px;
          background: rgba(139, 92, 246, 0.05);
        }
        .composer-quote-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 14px;
          padding: 12px;
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          margin-bottom: 12px;
        }
        .composer-close-btn {
          background: rgba(0,0,0,0.18);
          border: none;
          cursor: pointer;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .composer-textarea {
          width: 100%;
          min-height: 120px;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 15px;
          resize: vertical;
          outline: none;
          line-height: 1.9;
          direction: rtl;
        }
        .composer-tags-preview {
          display: grid;
          gap: 8px;
          margin-top: 12px;
        }
        .composer-media-preview {
          position: relative;
          margin-top: 12px;
          border-radius: 14px;
          overflow: hidden;
          max-height: 320px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .composer-close-btn.media-close {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
          background: rgba(0,0,0,0.5);
        }
        .composer-upload-progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255,255,255,0.2);
        }
        .composer-upload-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          transition: width 0.2s;
        }
        @media (max-width: 768px) {
          .composer-header-row,
          .composer-editor-topline {
            align-items: stretch;
          }
          .composer-toolbar,
          .composer-actions-row {
            gap: 8px;
          }
          .composer-action-btn,
          .composer-chip {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </Card>
  );
}
