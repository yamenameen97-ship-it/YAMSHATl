/**
 * Enhanced Create Post Component
 * Professional post creation interface
 */

import { useState, useRef } from 'react';

export default function CreatePostEnhanced({ onPost = null, user = {} }) {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef(null);

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedMedia) return;

    setIsPosting(true);
    try {
      await onPost?.({
        content: content.trim(),
        media: selectedMedia,
        timestamp: new Date(),
      });

      setContent('');
      setSelectedMedia(null);
      setMediaPreview(null);
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="create-post-card">
      {/* Header with Avatar */}
      <div className="create-post-header">
        <div className="create-post-avatar">{user.avatar || '👤'}</div>
        <input
          type="text"
          className="create-post-input"
          placeholder="ما الذي تفكر فيه؟"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPosting}
        />
      </div>

      {/* Media Preview */}
      {mediaPreview && (
        <div className="create-post-media-preview">
          {selectedMedia?.type.startsWith('image/') && (
            <img src={mediaPreview} alt="Preview" className="preview-image" />
          )}
          {selectedMedia?.type.startsWith('video/') && (
            <video src={mediaPreview} className="preview-video" controls />
          )}
          <button
            className="remove-media-btn"
            onClick={removeMedia}
            title="Remove media"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="create-post-actions">
        <div className="create-post-action-group">
          <button
            className="create-post-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Add image or video"
            disabled={isPosting}
          >
            🖼️
            <span>صورة/فيديو</span>
          </button>
          <button
            className="create-post-action-btn"
            title="Add poll"
            disabled={isPosting}
          >
            📊
            <span>استطلاع</span>
          </button>
          <button
            className="create-post-action-btn"
            title="Schedule post"
            disabled={isPosting}
          >
            🕐
            <span>جدولة</span>
          </button>
        </div>

        <button
          className="create-post-submit-btn"
          onClick={handlePost}
          disabled={(!content.trim() && !selectedMedia) || isPosting}
        >
          {isPosting ? 'جاري الإرسال...' : 'نشر'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleMediaSelect}
        style={{ display: 'none' }}
        accept="image/*,video/*"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== CREATE POST CARD ==================== */

          .create-post-card {
            background-color: var(--color-surface-primary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-4);
            margin-bottom: var(--spacing-6);
            box-shadow: var(--shadow-sm);
            transition: var(--transition-normal);
          }

          .create-post-card:hover {
            box-shadow: var(--shadow-md);
          }

          /* ==================== HEADER ==================== */

          .create-post-header {
            display: flex;
            gap: var(--spacing-3);
            align-items: center;
            margin-bottom: var(--spacing-4);
          }

          .create-post-avatar {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: var(--font-weight-bold);
            flex-shrink: 0;
            font-size: var(--font-size-lg);
          }

          .create-post-input {
            flex: 1;
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-full);
            padding: var(--spacing-3) var(--spacing-4);
            color: var(--color-text-primary);
            font-size: var(--font-size-base);
            cursor: pointer;
            transition: var(--transition-colors);
            font-family: var(--font-family-primary);
            height: 44px;
          }

          .create-post-input:hover,
          .create-post-input:focus {
            background-color: var(--color-surface-secondary);
            border-color: var(--color-primary-500);
            outline: none;
          }

          .create-post-input::placeholder {
            color: var(--color-text-muted);
          }

          .create-post-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ==================== MEDIA PREVIEW ==================== */

          .create-post-media-preview {
            position: relative;
            margin-bottom: var(--spacing-4);
            border-radius: var(--radius-lg);
            overflow: hidden;
            background-color: var(--color-bg-tertiary);
            max-height: 300px;
          }

          .preview-image,
          .preview-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .remove-media-btn {
            position: absolute;
            top: var(--spacing-2);
            right: var(--spacing-2);
            width: 36px;
            height: 36px;
            border-radius: var(--radius-full);
            background-color: rgba(0, 0, 0, 0.6);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
          }

          .remove-media-btn:hover {
            background-color: rgba(0, 0, 0, 0.8);
          }

          /* ==================== ACTIONS ==================== */

          .create-post-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: var(--spacing-4);
            border-top: 1px solid var(--color-border-secondary);
          }

          .create-post-action-group {
            display: flex;
            gap: var(--spacing-2);
          }

          .create-post-action-btn {
            height: 40px;
            border: none;
            background-color: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-2);
            font-size: var(--font-size-sm);
            transition: var(--transition-colors);
            padding: 0 var(--spacing-3);
            font-family: var(--font-family-primary);
          }

          .create-post-action-btn:hover:not(:disabled) {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .create-post-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ==================== SUBMIT BUTTON ==================== */

          .create-post-submit-btn {
            padding: var(--spacing-2) var(--spacing-8);
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: var(--radius-full);
            cursor: pointer;
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            transition: var(--transition-colors);
            font-family: var(--font-family-primary);
            height: 40px;
            min-width: 100px;
          }

          .create-post-submit-btn:hover:not(:disabled) {
            background: var(--gradient-primary-hover);
            box-shadow: var(--shadow-lg);
          }

          .create-post-submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* ==================== RESPONSIVE ==================== */

          @media (max-width: 768px) {
            .create-post-card {
              padding: var(--spacing-3);
              margin-bottom: var(--spacing-4);
              border-radius: 0;
              border-left: none;
              border-right: none;
            }

            .create-post-header {
              margin-bottom: var(--spacing-3);
            }

            .create-post-avatar {
              width: 40px;
              height: 40px;
              font-size: var(--font-size-base);
            }

            .create-post-input {
              font-size: var(--font-size-sm);
              padding: var(--spacing-2) var(--spacing-3);
              height: 40px;
            }

            .create-post-action-btn {
              font-size: var(--font-size-xs);
              padding: 0 var(--spacing-2);
              height: 36px;
            }

            .create-post-action-btn span {
              display: none;
            }

            .create-post-submit-btn {
              padding: var(--spacing-2) var(--spacing-4);
              font-size: var(--font-size-xs);
              height: 36px;
              min-width: 80px;
            }
          }
        `
      }} />
    </div>
  );
}
