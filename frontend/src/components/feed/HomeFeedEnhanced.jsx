import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Enhanced Home Feed Component
 * Professional social media feed with posts, stories, and recommendations
 */
export default function HomeFeedEnhanced({
  posts,
  currentUser,
  onCreatePost,
  onLikePost,
  onCommentPost,
  onSharePost,
  onSavePost,
  onDeletePost,
  loading,
  onLoadMore,
}) {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);
  const observerTarget = useRef(null);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, onLoadMore]);

  const handleLike = (postId) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
    onLikePost?.(postId, !likedPosts.has(postId));
  };

  const handleSave = (postId) => {
    const newSaved = new Set(savedPosts);
    if (newSaved.has(postId)) {
      newSaved.delete(postId);
    } else {
      newSaved.add(postId);
    }
    setSavedPosts(newSaved);
    onSavePost?.(postId, !savedPosts.has(postId));
  };

  const renderPostCard = (post) => {
    const isLiked = likedPosts.has(post.id);
    const isSaved = savedPosts.has(post.id);

    return (
      <div key={post.id} className="post-card">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-author">
            <div className="post-avatar">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                />
              ) : (
                post.author.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="post-author-info">
              <div className="post-author-name">{post.author.name}</div>
              <div className="post-author-handle">@{post.author.handle}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div className="post-timestamp">
              {formatPostTime(post.createdAt)}
            </div>
            <button
              className="post-menu-btn"
              title="خيارات"
              onClick={() => handlePostMenu(post)}
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="post-content">
          <div className="post-text">
            {post.text}
          </div>

          {/* Post Media */}
          {post.media && post.media.length > 0 && (
            <div className={`post-media ${getMediaGridClass(post.media.length)}`}>
              {post.media.map((media, idx) => (
                <div key={idx} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`post-media-${idx}`}
                      className="post-image"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="post-video"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Stats */}
        {(post.likes > 0 || post.comments > 0 || post.shares > 0) && (
          <div className="post-stats">
            {post.likes > 0 && (
              <div className="post-stat" onClick={() => handleLike(post.id)}>
                👍 {formatNumber(post.likes)}
              </div>
            )}
            {post.comments > 0 && (
              <div className="post-stat">
                💬 {formatNumber(post.comments)}
              </div>
            )}
            {post.shares > 0 && (
              <div className="post-stat">
                ↗️ {formatNumber(post.shares)}
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="post-actions">
          <button
            className={`post-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => handleLike(post.id)}
            style={{
              color: isLiked ? 'var(--color-danger)' : 'var(--color-text-secondary)'
            }}
          >
            {isLiked ? '❤️' : '🤍'} إعجاب
          </button>

          <button
            className="post-action-btn"
            onClick={() => onCommentPost?.(post.id)}
          >
            💬 تعليق
          </button>

          <button
            className="post-action-btn"
            onClick={() => onSharePost?.(post.id)}
          >
            ↗️ مشاركة
          </button>

          <button
            className={`post-action-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => handleSave(post.id)}
            style={{
              color: isSaved ? 'var(--color-primary)' : 'var(--color-text-secondary)'
            }}
          >
            {isSaved ? '🔖' : '🔗'} حفظ
          </button>
        </div>
      </div>
    );
  };

  const renderCreatePostCard = () => {
    return (
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="create-post-avatar">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="create-post-input-wrapper">
            <input
              type="text"
              className="create-post-input"
              placeholder="ما الذي يدور في بالك؟"
              onClick={() => setShowCreatePost(true)}
              readOnly
            />
          </div>
        </div>

        <div className="create-post-actions">
          <div className="create-post-buttons">
            <button className="create-post-btn">
              🖼️ صورة
            </button>
            <button className="create-post-btn">
              🎥 فيديو
            </button>
            <button className="create-post-btn">
              📊 استطلاع
            </button>
            <button className="create-post-btn">
              ⏰ جدولة
            </button>
          </div>
          <button className="create-post-submit">
            نشر
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-container">
      {/* Left Sidebar */}
      <div className="home-sidebar-left">
        <div style={{ padding: 'var(--space-4)' }}>
          <nav className="sidebar-nav">
            {[
              { icon: '🏠', label: 'الرئيسية', active: true },
              { icon: '🔍', label: 'استكشاف', active: false },
              { icon: '🔔', label: 'إشعارات', active: false },
              { icon: '💬', label: 'الرسائل', active: false },
              { icon: '🔖', label: 'المحفوظات', active: false },
              { icon: '👤', label: 'الملف الشخصي', active: false },
              { icon: '⚙️', label: 'الإعدادات', active: false },
            ].map((item, idx) => (
              <button
                key={idx}
                className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
                style={{
                  background: item.active ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: item.active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderLeft: item.active ? '3px solid var(--color-primary)' : 'none',
                }}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Feed */}
      <div className="home-main">
        {/* Header */}
        <div className="home-header">
          <div className="home-header-logo">
            🎯 Yamshat
          </div>

          <div className="home-header-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="ابحث..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                outline: 'none',
                fontSize: 'var(--text-sm)'
              }}
            />
          </div>

          <div className="home-header-actions">
            <button className="home-header-btn notification-btn" data-count="3">
              🔔
            </button>
            <button className="home-header-btn">
              💬
            </button>
            <div className="home-header-profile">
              <div className="home-header-profile-avatar">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="home-header-profile-name">
                {currentUser.name}
              </div>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="feed-container">
          {/* Create Post */}
          {renderCreatePostCard()}

          {/* Stories */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-3)',
            overflowX: 'auto',
            padding: 'var(--space-4)',
            background: 'var(--color-surface-primary)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--color-border-primary)',
          }}>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '100px',
                  height: '140px',
                  borderRadius: 'var(--radius-lg)',
                  background: `linear-gradient(135deg, hsl(${idx * 60}, 70%, 60%), hsl(${idx * 60 + 30}, 70%, 50%))`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 'var(--space-3)',
                  transition: 'transform var(--transition-base)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-primary)',
                  border: '2px solid white',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {String.fromCharCode(65 + idx - 1)}
                </div>
              </div>
            ))}
          </div>

          {/* Posts */}
          {posts.map(renderPostCard)}

          {/* Loading Indicator */}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 'var(--space-8)'
            }}>
              <div className="loader">
                <div className="loader-spinner"></div>
                <div className="loader-text">جاري تحميل المزيد...</div>
              </div>
            </div>
          )}

          {/* Infinite Scroll Target */}
          <div ref={observerTarget} style={{ height: '20px' }} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="home-sidebar-right">
        {/* Trending Section */}
        <div className="trending-section">
          <div className="trending-title">🔥 الأكثر تداولاً</div>
          {[
            { category: 'تكنولوجيا', title: '#ReactJS', count: '125K' },
            { category: 'ترفيه', title: '#الأفلام', count: '89K' },
            { category: 'رياضة', title: '#كرة_القدم', count: '234K' },
            { category: 'أخبار', title: '#أخبار_اليوم', count: '567K' },
          ].map((item, idx) => (
            <button
              key={idx}
              className="trending-item"
            >
              <div className="trending-item-info">
                <div className="trending-item-category">{item.category}</div>
                <div className="trending-item-title">{item.title}</div>
              </div>
              <div className="trending-item-count">{item.count}</div>
            </button>
          ))}
        </div>

        {/* Recommendations */}
        <div className="trending-section">
          <div className="trending-title">👥 اقتراحات متابعة</div>
          {[
            { name: 'أحمد محمد', handle: 'ahmed_m', followers: '12K' },
            { name: 'فاطمة علي', handle: 'fatima_ali', followers: '8K' },
            { name: 'محمود سالم', handle: 'mahmoud_s', followers: '15K' },
          ].map((user, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--text-sm)'
                }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    @{user.handle}
                  </div>
                </div>
              </div>
              <button style={{
                padding: 'var(--space-1) var(--space-3)',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-base)'
              }}>
                متابعة
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function formatPostTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return 'الآن';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}د`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}س`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}ي`;

  return new Date(date).toLocaleDateString('ar-SA');
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}ك`;
  return num.toString();
}

function getMediaGridClass(count) {
  if (count === 1) return 'single';
  if (count === 2) return 'double';
  return 'triple';
}

function handlePostMenu(post) {
  // Menu handling logic
  console.log('Post menu for:', post.id);
}
