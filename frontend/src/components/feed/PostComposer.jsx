import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import { createPost } from '../../api/posts.js';
import mediaUploadService from '../../services/media/mediaUploadService.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { clearLocalFeedCaches, injectPostIntoFeedCache } from '../../utils/feedCache.js';

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
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isPinned, setIsPinned] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  // ✅ FIX v59.13.8 (#2): isMountedRef لمنع setState بعد unmount
  //    خلال handleSubmit الـ async الطويلة (رفع فيديو حتّى 200MB).
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);
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

    const focusComposer = () => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleQuotedPost = () => {
      try {
        const nextValue = JSON.parse(localStorage.getItem(QUOTE_KEY) || 'null');
        setQuoteDraft(nextValue);
      } catch {
        setQuoteDraft(null);
      }
      window.setTimeout(focusComposer, 30);
    };

    const handleComposerAction = (event) => {
      const action = event?.detail?.action;
      if (action === 'image') {
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*';
          fileInputRef.current.click();
        }
        return;
      }

      if (action === 'video') {
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'video/*';
          fileInputRef.current.click();
        }
        return;
      }

      if (fileInputRef.current) fileInputRef.current.accept = 'image/*,video/*';
      if (action === 'thought') {
        setContent((prev) => prev || 'شاركنا رأيك... ');
      }
      window.setTimeout(focusComposer, 30);
    };

    window.addEventListener('yamshat:quote-post', handleQuotedPost);
    window.addEventListener('yamshat:composer-action', handleComposerAction);
    return () => {
      window.removeEventListener('yamshat:quote-post', handleQuotedPost);
      window.removeEventListener('yamshat:composer-action', handleComposerAction);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [content]);

  // ✅ FIX v59.13.4: إلغاء الـ ObjectURL السابق عند استبداله أو عند unmount.
  // المشكلة السابقة: cleanup كان يستخدم القيمة الجديدة لـ mediaPreview بدلاً
  // من القديمة (بسبب closure)، فيُلغي الـ URL الجديد ويترك القديم معلّقاً في الذاكرة،
  // ويجعل صورة المعاينة الجديدة معطّلة.
  // الحل: التقاط الـ URL في وقت ترتيب الـ effect ثم إلغاؤه فعلّياً في cleanup.
  useEffect(() => {
    const urlToRevoke = mediaPreview;
    return () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [mediaPreview]);

  const tagsPreview = useMemo(() => extractTags(content), [content]);

  const clearComposer = () => {
    setContent('');
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate('');
    setShowScheduler(false);
    setShowPollBuilder(false);
    setPollQuestion('');
    setPollOptions(['', '']);
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

  const normalizedPollOptions = pollOptions.map((item) => item.trim()).filter(Boolean);
  const canSubmit = Boolean(content.trim() || media || quoteDraft || (showPollBuilder && pollQuestion.trim() && normalizedPollOptions.length >= 2));

  const handleSubmit = async (status = 'published') => {
    if (isUploading || !canSubmit) return;
    if (status === 'scheduled' && !scheduledDate) {
      pushToast({ type: 'warning', title: 'حدد وقت الجدولة', description: 'لازم تختار تاريخ ووقت قبل تأكيد الجدولة.' });
      return;
    }
    if (showPollBuilder && (!pollQuestion.trim() || normalizedPollOptions.length < 2)) {
      pushToast({ type: 'warning', title: 'الاستطلاع غير مكتمل', description: 'اكتب سؤال الاستطلاع وأضف خيارين على الأقل.' });
      return;
    }
    setIsUploading(true);
    try {
      let mediaUrl = '';
      let thumbnailUrl = '';
      let isVideoMedia = false;
      if (media) {
        isVideoMedia = Boolean(media?.type?.startsWith('video/'));
        // ✅ v33+1: إصلاح فشل نشر فيديو كمنشور
                // 1) نستخدم purpose مدعوم من الـ backend (post-attachment) بدل post-video/post-image
                //    لتجنب رفض الرفع لأسباب صلاحيات/whitelist.
                // 2) نفصل useCdn = true للفيديو حتى يُستخدم مسار الرفع المستأنف (resumable).
                // 3) نلتقط thumbnail من الرد لو توفر.
        const uploadRes = await mediaUploadService.uploadFile(media, {
          purpose: isVideoMedia ? 'post-attachment' : 'post-image',
          processingProfile: isVideoMedia ? 'balanced' : '',
          useCdn: true,
          onProgress: (payload) => {
            // ✅ FIX v59.13.8 (#2): حارس isMounted داخل onProgress
            //    (يستمر الإطلاق حتّى بعد unmount إذا لم يلغِ الرفع).
            if (!isMountedRef.current) return;
            const percent = typeof payload === 'number' ? Number(payload || 0) : Number(payload?.percent || 0);
            setUploadProgress(percent);
          },
        });
        mediaUrl = uploadRes?.mediaUrl || uploadRes?.url || uploadRes?.file_url || uploadRes?.media_url || '';
        thumbnailUrl = uploadRes?.thumbnailUrl || uploadRes?.thumbnail_url || uploadRes?.poster_url || '';
        if (!mediaUrl) {
          throw new Error('فشل الحصول على رابط الفيديو بعد الرفع. حاول مرة أخرى.');
        }
      }

      const { hashtags, mentions } = extractTags(content);
      const poll = showPollBuilder
        ? normalizedPollOptions.map((label) => ({ label }))
        : undefined;

      const createdPostResponse = await createPost({
        content: pollQuestion.trim() ? `${pollQuestion.trim()}\n${content}`.trim() : content,
        media_url: mediaUrl,
        // ✅ v33+1: تمرير حقول إضافية تجعل الـ backend/frontend يتعرف على الفيديو بوضوح
        video_url: isVideoMedia ? mediaUrl : undefined,
        media_type: isVideoMedia ? 'video' : (media ? 'image' : undefined),
        thumbnail_url: thumbnailUrl || undefined,
        has_video: isVideoMedia || undefined,
        status,
        scheduled_at: status === 'scheduled' ? scheduledDate : null,
        is_pinned: isPinned,
        hashtags,
        mentions,
        poll,
        quote_source_id: quoteDraft?.id || null,
      });

      const createdPost = createdPostResponse?.data || null;
      // ✅ FIX v59.13.8 (#2): حتّى لو تم unmount نجح المنشور على السيرفر
      //    — نحدّث cache الفيد لأنّه عالمي (غير مرتبط بالمكوّن)
      //    لكن نتجنّب setState و toast المحلي.
      if (status === 'published' && createdPost) {
        injectPostIntoFeedCache(queryClient, createdPost);
      } else {
        clearLocalFeedCaches();
      }
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });

      if (!isMountedRef.current) return;

      pushToast({
        type: 'success',
        title: status === 'draft' ? 'تم حفظ المسودة' : status === 'scheduled' ? 'تمت جدولة المنشور' : 'تم نشر المنشور',
        description: isPinned ? 'المنشور متجهز كمنشور مثبت.' : undefined,
      });
      clearComposer();
    } catch (error) {
      // ✅ v33+1: رسالة فشل واضحة + محاولة احتياطية عبر multipart للفيديو
      const detail = error?.response?.data?.detail || error?.message || '';
      const isVideoMedia = Boolean(media?.type?.startsWith('video/'));
      if (isVideoMedia && media) {
        try {
          const { uploadPostMedia } = await import('../../api/posts.js');
          const uploadResp = await uploadPostMedia(media, (event) => {
            if (event?.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
          });
          const fallbackUrl = uploadResp?.data?.url || uploadResp?.data?.media_url || uploadResp?.data?.file_url || '';
          if (fallbackUrl) {
            const { hashtags: hh, mentions: mm } = extractTags(content);
            // ✅ FIX v59.13.8 (#2): فحص isMounted قبل إنشاء المنشور الاحتياطي
            //    (إذا غادر المستخدم الصفحة أثناء الـ fallback upload — لا نكمل المسار الاحتياطي)
            if (!isMountedRef.current) return;
            const createdPostResponse = await createPost({
              content: pollQuestion.trim() ? `${pollQuestion.trim()}\n${content}`.trim() : content,
              media_url: fallbackUrl,
              video_url: fallbackUrl,
              media_type: 'video',
              has_video: true,
              status,
              scheduled_at: status === 'scheduled' ? scheduledDate : null,
              is_pinned: isPinned,
              hashtags: hh,
              mentions: mm,
              quote_source_id: quoteDraft?.id || null,
            });
            const createdPost = createdPostResponse?.data || null;
            if (status === 'published' && createdPost) {
              injectPostIntoFeedCache(queryClient, createdPost);
            } else {
              clearLocalFeedCaches();
            }
            queryClient.invalidateQueries({ queryKey: ['feed-data'] });
            if (!isMountedRef.current) return;
            pushToast({ type: 'success', title: 'تم نشر الفيديو عبر مسار احتياطي' });
            clearComposer();
            return;
          }
        } catch (fallbackError) {
          if (!isMountedRef.current) return;
          pushToast({
            type: 'error',
            title: 'فشل نشر الفيديو',
            description: fallbackError?.response?.data?.detail || fallbackError?.message || detail || 'تعذر رفع الفيديو، افحص الإنترنت وحاول مرة أخرى.',
          });
          return;
        }
      }
      if (!isMountedRef.current) return;
      pushToast({ type: 'error', title: 'فشل نشر المنشور', description: detail || 'حاول مرة تانية.' });
    } finally {
      // ✅ FIX v59.13.8 (#2): حارس isMounted في finally
      if (isMountedRef.current) setIsUploading(false);
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

      <div className="composer-actions-row" dir="rtl">
        <button
          type="button"
          className="composer-action-btn composer-action-btn--media"
          onClick={() => fileInputRef.current?.click()}
          title="رفع صورة أو فيديو"
          aria-label="رفع صورة أو فيديو"
        >
          <span className="composer-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
              <path d="M21 17l-5-5-9 9" />
            </svg>
          </span>
          <span className="composer-action-label">رفع وسائط</span>
        </button>

        {/* ✅ v87.21: زر "رفع الفيديو" منفصل وصريح مطلوب من المستخدم.
            يفتح picker نوعه video/* فقط. عند الاختيار يُرفع كفيديو
            (is_draft:false, media_type:'video', has_video:true).
            هذا يضمن أن الفيديو يُنشر كمنشور نهائي لا كمسودة. */}
        <button
          type="button"
          className="composer-action-btn composer-action-btn--video"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'video/*';
              fileInputRef.current.value = '';
              fileInputRef.current.click();
            }
          }}
          title="رفع فيديو"
          aria-label="رفع فيديو"
        >
          <span className="composer-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path d="M16 10l6-3v10l-6-3z" />
            </svg>
          </span>
          <span className="composer-action-label">رفع الفيديو</span>
        </button>

        <button
          type="button"
          className="composer-action-btn composer-action-btn--emoji"
          onClick={() => {
            const emoji = '😊';
            setContent((prev) => `${prev}${emoji}`);
            window.setTimeout(() => textareaRef.current?.focus(), 30);
          }}
          title="إضافة إيموجي"
          aria-label="إضافة إيموجي"
        >
          <span className="composer-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M8.5 14.5c1 1.5 2.4 2.2 3.5 2.2s2.5-.7 3.5-2.2" />
            </svg>
          </span>
          <span className="composer-action-label">إيموجي</span>
        </button>

        <button
          type="button"
          className={`composer-action-btn ${showScheduler ? 'active' : ''}`}
          onClick={() => setShowScheduler((prev) => !prev)}
          title="جدولة"
          aria-label="جدولة"
        >
          <span className="composer-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 9h18M8 3v4M16 3v4" />
            </svg>
          </span>
          <span className="composer-action-label">جدولة</span>
        </button>

        <button
          type="button"
          className={`composer-action-btn ${showPollBuilder ? 'active' : ''}`}
          onClick={() => setShowPollBuilder((prev) => !prev)}
          title="استطلاع"
          aria-label="استطلاع"
        >
          <span className="composer-action-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
            </svg>
          </span>
          <span className="composer-action-label">استطلاع</span>
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

      {showPollBuilder ? (
        <div className="composer-scheduler-box" style={{ display: 'grid', gap: 10 }}>
          <label className="composer-field-label">سؤال الاستطلاع</label>
          <input
            type="text"
            value={pollQuestion}
            onChange={(event) => setPollQuestion(event.target.value)}
            className="composer-datetime-input"
            placeholder="مثال: أي تحسين تحبه أكثر في صفحة المنشورات؟"
          />
          <div style={{ display: 'grid', gap: 8 }}>
            {pollOptions.map((option, index) => (
              <div key={`poll-option-${index}`} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={option}
                  onChange={(event) => setPollOptions((prev) => prev.map((item, idx) => idx === index ? event.target.value : item))}
                  className="composer-datetime-input"
                  placeholder={`الخيار ${index + 1}`}
                />
                {pollOptions.length > 2 ? (
                  <button type="button" className="composer-chip" onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== index))}>حذف</button>
                ) : null}
              </div>
            ))}
          </div>
          {pollOptions.length < 4 ? (
            <button type="button" className="composer-chip" onClick={() => setPollOptions((prev) => [...prev, ''])}>إضافة خيار</button>
          ) : null}
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
          ref={textareaRef}
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
            <video
              src={mediaPreview}
              style={{ width: '100%', maxHeight: 'min(70dvh, 560px)', objectFit: 'contain', display: 'block', background: '#060a14', touchAction: 'pan-y' }}
              controls
            />
          ) : (
            <img
              src={mediaPreview}
              style={{ width: '100%', maxHeight: 'min(70dvh, 560px)', objectFit: 'contain', display: 'block', background: '#060a14', touchAction: 'pan-y' }}
              alt="Preview"
            />
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
        /* v46: أزرار أكبر وأوضح مع أيقونات SVG واضحة */
        .composer-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 14px;
          border: 1px solid rgba(167, 139, 250, 0.28);
          background: rgba(139, 92, 246, 0.10);
          color: var(--text);
          padding: 12px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Noto Sans Arabic', 'Tajawal', sans-serif;
          transition: all 0.2s ease;
        }
        .composer-action-btn:hover,
        .composer-action-btn:active,
        .composer-action-btn.active {
          background: rgba(139, 92, 246, 0.20);
          border-color: rgba(167, 139, 250, 0.50);
          transform: translateY(-1px);
        }
        .composer-action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(167, 139, 250, 0.18);
          color: #c4b5fd;
          flex-shrink: 0;
        }
        .composer-action-btn--media .composer-action-icon { color: #93c5fd; background: rgba(59,130,246,0.18); }
        .composer-action-btn--emoji .composer-action-icon { color: #fcd34d; background: rgba(251,191,36,0.18); }
        .composer-action-label {
          font-weight: 700;
          font-size: 14px;
          white-space: nowrap;
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
          max-height: none;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(3, 7, 18, 0.92);
          touch-action: pan-y;
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
        @media (max-width: 1024px) {
          .composer-header-row,
          .composer-editor-topline {
            align-items: stretch;
          }
          .composer-toolbar {
            gap: 8px;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .composer-toolbar::-webkit-scrollbar {
            display: none;
          }
          .composer-chip {
            width: auto;
            min-width: max-content;
            justify-content: center;
            padding: 8px 12px;
            flex: 0 0 auto;
          }
          .composer-actions-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding: 8px 0;
          }
          .composer-action-btn,
          .composer-actions-row > button {
            width: 100%;
            min-width: 0;
            min-height: 58px;
            justify-content: center;
            padding-inline: 14px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 14px;
            direction: rtl;
          }
          .composer-action-btn .composer-action-icon {
            width: 32px;
            height: 32px;
          }
          .composer-action-btn .composer-action-icon svg {
            width: 24px;
            height: 24px;
          }
          .composer-status-badge {
            align-self: flex-start;
          }
          .composer-drop-hint {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .composer-quote-box {
            flex-direction: column;
          }
          .composer-textarea {
            min-height: 96px;
            line-height: 1.75;
          }
        }
      `}</style>
    </Card>
  );
}
