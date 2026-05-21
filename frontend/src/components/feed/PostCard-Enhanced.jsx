/**
 * Enhanced Post Card Component
 * Professional post display with interactions and media
 */

import { useState } from 'react';

export default function PostCardEnhanced({
  post = {},
  onLike = null,
  onComment = null,
  onShare = null,
  onSave = null,
  onMenuClick = null,
}) {
  const [liked, setLiked] = useState(post.liked || false);
  const [saved, setSaved] = useState(post.saved || false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const {
    id = '',
    author = {},
    content = '',
    image = null,
    video = null,
    timestamp = new Date(),
    likes = 0,
    comments = [],
    shares = 0,
  } = post;

  const handleLike = () => {
    setLiked(!liked);
    onLike?.(id, !liked);
  };

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(id, !saved);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onComment?.(id, commentText);
      setCommentText('');
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes}د`;
    if (hours < 24) return `منذ ${hours}س`;
    if (days < 7) return `منذ ${days}أ`;
    return d.toLocaleDateString('ar-SA');
  };

  return (
    <article className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-header-left">
          <div className="post-avatar">{author.avatar || '👤'}</div>
          <div className="post-author-info">
            <h3 className="post-author-name">{author.name || 'Unknown'}</h3>
            <p className="post-author-handle">@{author.handle || 'user'}</p>
          </div>
        </div>
        <div className="post-header-right">
          <span className="post-timestamp">{formatTime(timestamp)}</span>
          <button
            className="post-menu-btn"
            onClick={() => onMenuClick?.(id)}
            title="More options"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {content && <p className="post-text">{content}</p>}

        {image && (
          <img
            src={image}
            alt="Post image"
            className="post-image"
            loading="lazy"
          />
        )}

        {video && (
          <div className="post-video-container">
            <video
              src={video}
              className="post-video"
              controls
              preload="metadata"
            />
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="post-stats">
        <div className="post-stat">
          <span className="post-stat-value">{likes}</span>
          <span>إعجاب</span>
        </div>
        <div className="post-stat">
          <span className="post-stat-value">{comments.length}</span>
          <span>تعليق</span>
        </div>
        <div className="post-stat">
          <span className="post-stat-value">{shares}</span>
          <span>مشاركة</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <button
          className={`post-action-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          title={liked ? 'Unlike' : 'Like'}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>إعجاب</span>
        </button>
        <button
          className="post-action-btn"
          onClick={() => setShowComments(!showComments)}
          title="Comment"
        >
          <span>💬</span>
          <span>تعليق</span>
        </button>
        <button
          className="post-action-btn"
          onClick={() => onShare?.(id)}
          title="Share"
        >
          <span>↗️</span>
          <span>مشاركة</span>
        </button>
        <button
          className={`post-action-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          title={saved ? 'Unsave' : 'Save'}
        >
          <span>{saved ? '⭐' : '☆'}</span>
          <span>حفظ</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          <div className="post-comment-input">
            <input
              type="text"
              placeholder="اكتب تعليقاً..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-input"
            />
            <button
              className="comment-submit-btn"
              onClick={handleComment}
              disabled={!commentText.trim()}
            >
              ✓
            </button>
          </div>

          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((comment, idx) => (
                <div key={idx} className="comment-item">
                  <div className="comment-avatar">{comment.author?.avatar || '👤'}</div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <strong className="comment-author">
                        {comment.author?.name || 'Unknown'}
                      </strong>
                      <span className="comment-time">{formatTime(comment.timestamp)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <div className="comment-actions">
                      <button className="comment-action">إعجاب</button>
                      <button className="comment-action">رد</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* ==================== POST CARD ==================== */

          .post-card {
            background-color: var(--color-surface-primary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            margin-bottom: var(--spacing-6);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            transition: var(--transition-normal);
            animation: slideInUp var(--duration-normal) var(--ease-out);
          }

          .post-card:hover {
            box-shadow: var(--shadow-md);
          }

          /* ==================== POST HEADER ==================== */

          .post-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-4);
            border-bottom: 1px solid var(--color-border-secondary);
          }

          .post-header-left {
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
          }

          .post-avatar {
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

          .post-author-info {
            display: flex;
            flex-direction: column;
          }

          .post-author-name {
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            margin: 0;
          }

          .post-author-handle {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
            margin: 0;
          }

          .post-header-right {
            display: flex;
            align-items: center;
            gap: var(--spacing-3);
          }

          .post-timestamp {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }

          .post-menu-btn {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-md);
            background-color: transparent;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-lg);
            transition: var(--transition-colors);
          }

          .post-menu-btn:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          /* ==================== POST CONTENT ==================== */

          .post-content {
            padding: var(--spacing-4);
          }

          .post-text {
            color: var(--color-text-primary);
            font-size: var(--font-size-base);
            line-height: var(--line-height-relaxed);
            margin: 0 0 var(--spacing-4) 0;
            word-break: break-word;
          }

          .post-image {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
            border-radius: var(--radius-lg);
            margin-bottom: var(--spacing-4);
            cursor: pointer;
            transition: var(--transition-normal);
            display: block;
          }

          .post-image:hover {
            transform: scale(1.02);
          }

          .post-video-container {
            margin-bottom: var(--spacing-4);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          .post-video {
            width: 100%;
            max-height: 400px;
            border-radius: var(--radius-lg);
          }

          /* ==================== POST STATS ==================== */

          .post-stats {
            display: flex;
            justify-content: space-around;
            padding: var(--spacing-3) var(--spacing-4);
            border-top: 1px solid var(--color-border-secondary);
            border-bottom: 1px solid var(--color-border-secondary);
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
          }

          .post-stat {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            cursor: pointer;
            transition: var(--transition-colors);
          }

          .post-stat:hover {
            color: var(--color-primary-500);
          }

          .post-stat-value {
            font-weight: var(--font-weight-semibold);
          }

          /* ==================== POST ACTIONS ==================== */

          .post-actions {
            display: flex;
            justify-content: space-around;
            padding: var(--spacing-3) 0;
          }

          .post-action-btn {
            flex: 1;
            height: 40px;
            border: none;
            background-color: transparent;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-2);
            font-size: var(--font-size-sm);
            transition: var(--transition-colors);
            border-radius: var(--radius-md);
            font-family: var(--font-family-primary);
          }

          .post-action-btn:hover {
            background-color: var(--color-interactive-hover);
            color: var(--color-primary-500);
          }

          .post-action-btn.liked {
            color: var(--color-error);
          }

          .post-action-btn.saved {
            color: var(--color-primary-500);
          }

          /* ==================== COMMENTS SECTION ==================== */

          .post-comments {
            padding: var(--spacing-4);
            border-top: 1px solid var(--color-border-secondary);
            animation: slideInDown var(--duration-fast) var(--ease-out);
          }

          .post-comment-input {
            display: flex;
            gap: var(--spacing-2);
            margin-bottom: var(--spacing-4);
          }

          .comment-input {
            flex: 1;
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-full);
            padding: var(--spacing-2) var(--spacing-4);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-primary);
            transition: var(--transition-colors);
          }

          .comment-input:focus {
            outline: none;
            border-color: var(--color-primary-500);
            background-color: var(--color-surface-secondary);
          }

          .comment-submit-btn {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition-colors);
            font-size: var(--font-size-base);
          }

          .comment-submit-btn:hover:not(:disabled) {
            background: var(--gradient-primary-hover);
          }

          .comment-submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .comments-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-3);
          }

          .comment-item {
            display: flex;
            gap: var(--spacing-3);
            padding-bottom: var(--spacing-3);
            border-bottom: 1px solid var(--color-border-secondary);
          }

          .comment-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .comment-avatar {
            width: 36px;
            height: 36px;
            border-radius: var(--radius-full);
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: var(--font-weight-bold);
            font-size: var(--font-size-sm);
            flex-shrink: 0;
          }

          .comment-content {
            flex: 1;
          }

          .comment-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            margin-bottom: var(--spacing-1);
          }

          .comment-author {
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .comment-time {
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }

          .comment-text {
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
            margin: 0 0 var(--spacing-2) 0;
          }

          .comment-actions {
            display: flex;
            gap: var(--spacing-4);
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          }

          .comment-action {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            transition: var(--transition-colors);
            font-family: var(--font-family-primary);
          }

          .comment-action:hover {
            color: var(--color-primary-500);
          }

          /* ==================== ANIMATIONS ==================== */

          @keyframes slideInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideInDown {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          /* ==================== RESPONSIVE ==================== */

          @media (max-width: 768px) {
            .post-card {
              margin-bottom: var(--spacing-4);
              border-radius: 0;
              border-left: none;
              border-right: none;
            }

            .post-image,
            .post-video {
              max-height: 300px;
            }

            .post-actions {
              padding: var(--spacing-2) 0;
            }

            .post-action-btn {
              font-size: var(--font-size-xs);
            }
          }
        `
      }} />
    </article>
  );
}
