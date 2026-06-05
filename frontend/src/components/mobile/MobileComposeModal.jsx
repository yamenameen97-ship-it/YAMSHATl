import { memo, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createPost, uploadPostMedia } from '../../api/posts.js';
import { useToast } from '../admin/ToastProvider.jsx';
import { resolveMediaUrl } from '../../config/mediaConfig.js';
import { clearLocalFeedCaches, injectPostIntoFeedCache } from '../../utils/feedCache.js';

/**
 * MobileComposeModal
 * مودال إنشاء منشور للموبايل — يستخدم createPost الحقيقي من backend.
 * يدعم: نص + رفع صورة + معاينة + حالة الإرسال.
 */
function MobileComposeModal({ open, onClose, initialAction = null }) {
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  // Focus على textarea عند الفتح + معالجة action إذا كان image/video
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      if (initialAction === 'image' && fileInputRef.current) {
        fileInputRef.current.accept = 'image/*';
        fileInputRef.current.click();
      } else if (initialAction === 'video' && fileInputRef.current) {
        fileInputRef.current.accept = 'video/*';
        fileInputRef.current.click();
      }
    }, 80);
    return () => clearTimeout(t);
  }, [open, initialAction]);

  // قفل التمرير للخلفية عند فتح المودال
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const reset = () => {
    setText('');
    setMediaFile(null);
    setMediaPreview('');
    setUploadedMediaUrl('');
    setIsUploading(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose?.();
  };

  const handlePickFile = (accept = 'image/*,video/*') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // معاينة محلية
    const localUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(localUrl);
    setUploadedMediaUrl('');

    // رفع فوري
    setIsUploading(true);
    try {
      const res = await uploadPostMedia(file);
      const url = res?.data?.url || res?.data?.media_url || res?.data?.path || '';
      if (url) {
        setUploadedMediaUrl(url);
      } else {
        throw new Error('No URL in upload response');
      }
    } catch (err) {
      console.error('Upload failed', err);
      pushToast?.({ type: 'error', title: 'تعذر رفع الملف', description: 'حاول مرة أخرى.' });
      setMediaFile(null);
      setMediaPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content && !uploadedMediaUrl) {
      pushToast?.({ type: 'info', title: 'لا يوجد محتوى', description: 'اكتب نصاً أو أضف وسائط.' });
      return;
    }
    if (isUploading) {
      pushToast?.({ type: 'info', title: 'جارٍ رفع الملف...', description: 'انتظر اكتمال الرفع.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        content,
        status: 'published',
      };
      if (uploadedMediaUrl) {
        payload.media_url = uploadedMediaUrl;
        payload.image_url = uploadedMediaUrl;
        payload.media_urls = [uploadedMediaUrl];
      }
      const createdPostResponse = await createPost(payload);
      const createdPost = createdPostResponse?.data || null;
      if (createdPost) {
        injectPostIntoFeedCache(queryClient, createdPost);
      } else {
        clearLocalFeedCaches();
      }

      // تحديث الفيد
      await queryClient.invalidateQueries({ queryKey: ['feed-data'] });
      pushToast?.({ type: 'success', title: 'تم نشر المنشور بنجاح' });
      reset();
      onClose?.();
    } catch (err) {
      console.error('Create post failed', err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'تعذر نشر المنشور';
      pushToast?.({ type: 'error', title: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ym-modal-overlay" role="dialog" aria-modal="true" aria-label="إنشاء منشور" onClick={handleClose}>
      <div className="ym-modal" onClick={(e) => e.stopPropagation()}>
        <header className="ym-modal-head">
          <button type="button" className="ym-modal-close" onClick={handleClose} aria-label="إغلاق">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <h3>منشور جديد</h3>
          <button
            type="button"
            className="ym-modal-publish"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || (!text.trim() && !uploadedMediaUrl)}
          >
            {isSubmitting ? 'ينشر...' : 'نشر'}
          </button>
        </header>

        <div className="ym-modal-body">
          <textarea
            ref={textareaRef}
            className="ym-modal-textarea"
            placeholder="بماذا تفكر؟"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={2000}
            dir="auto"
          />

          {mediaPreview ? (
            <div className="ym-modal-media-preview">
              {mediaFile?.type?.startsWith('video/') ? (
                <video src={mediaPreview} controls playsInline />
              ) : (
                <img src={resolveMediaUrl(uploadedMediaUrl) || mediaPreview} alt="معاينة" />
              )}
              {isUploading ? <div className="ym-modal-upload-progress">جارٍ الرفع...</div> : null}
              <button
                type="button"
                className="ym-modal-media-remove"
                aria-label="إزالة الوسائط"
                onClick={() => { setMediaFile(null); setMediaPreview(''); setUploadedMediaUrl(''); }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M6 6 L18 18 M18 6 L6 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="ym-modal-counter">{text.length} / 2000</div>
        </div>

        <footer className="ym-modal-actions">
          <button type="button" className="ym-modal-action" onClick={() => handlePickFile('image/*')} aria-label="إضافة صورة">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
              <path d="M21 17 L15 11 L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="ym-modal-action" onClick={() => handlePickFile('video/*')} aria-label="إضافة فيديو">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <rect x="3" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M17 10 L22 7 V17 L17 14 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="ym-modal-action" aria-label="إيموجي" onClick={() => {
            setText((t) => t + '😊');
            textareaRef.current?.focus();
          }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="9" cy="10" r="1.2" fill="currentColor" />
              <circle cx="15" cy="10" r="1.2" fill="currentColor" />
              <path d="M8 14.5 C9.5 16.5, 14.5 16.5, 16 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={handleFileChange}
          />
        </footer>
      </div>
    </div>
  );
}

export default memo(MobileComposeModal);
