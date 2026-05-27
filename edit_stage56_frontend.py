from pathlib import Path

ROOT = Path('/home/user/project_work/frontend/src')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing pattern for {label}')
    return text.replace(old, new, 1)

# --- FeedEnhanced.jsx ---
feed_path = ROOT / 'pages' / 'FeedEnhanced.jsx'
feed = feed_path.read_text()
feed = replace_once(
    feed,
    "import { redirectToAppPath } from '../utils/router.js';\n",
    "import { redirectToAppPath } from '../utils/router.js';\nimport { useDoubleTap } from '../hooks/useDoubleTap.js';\n",
    'feed import useDoubleTap',
)
feed = replace_once(
    feed,
    "const QUICK_ACTIONS = [\n  { label: 'صورة', color: 'green' },\n  { label: 'فيديو', color: 'violet' },\n  { label: 'رأيك', color: 'rose' },\n];\n\n",
    "const QUICK_ACTIONS = [\n  { label: 'صورة', color: 'green' },\n  { label: 'فيديو', color: 'violet' },\n  { label: 'رأيك', color: 'rose' },\n];\n\nconst FEED_HERO_STATS = [\n  { value: '24', label: 'ستوري نشطة' },\n  { value: '8.2K', label: 'تفاعل اليوم' },\n  { value: '99%', label: 'سلاسة الواجهة' },\n];\n\nconst HOME_STORIES = [\n  { id: 'mine', label: 'أنت', caption: 'أضف الآن' },\n  { id: 'live', label: 'مباشر', caption: 'LIVE', live: true },\n  { id: 'travel', label: 'سفر', caption: 'مشاهد' },\n  { id: 'design', label: 'تصميم', caption: 'أفكار' },\n  { id: 'team', label: 'الفريق', caption: 'تحديث' },\n  { id: 'moments', label: 'لحظات', caption: 'جديد' },\n];\n\n",
    'feed hero constants',
)
old_postcard = """function PostCard({ post }) {
  const { pushToast } = useToast();
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(post.shares || 0));
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [localComments, setLocalComments] = useState([]);

  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((count) => Math.max(0, count + (next ? 1 : -1)));
      return next;
    });
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/#/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      }
      setSharesCount((count) => count + 1);
      pushToast({ type: 'success', title: 'تمت مشاركة المنشور أو نسخ رابطه' });
    } catch {
      pushToast({ type: 'info', title: 'تعذر فتح نافذة المشاركة', description: 'تم تجاهل العملية بدون خطأ مؤثر.' });
    }
  };

  const handleSave = () => {
    setSaved((prev) => !prev);
    pushToast({ type: 'success', title: saved ? 'تمت إزالة المنشور من المحفوظات' : 'تم حفظ المنشور' });
  };

  const handleAddComment = () => {
    const content = commentDraft.trim();
    if (!content) return;
    setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: 'أنت', content }, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft('');
    if (!showComments) setShowComments(true);
    pushToast({ type: 'success', title: 'تمت إضافة التعليق' });
  };

  return (
    <article className="yam-post-card-v2">
      <div className="yam-post-head-v2">
        <div className="yam-post-author-v2">
          <Avatar name={post.authorName} size={48} accent={Boolean(post.brandRing)} image />
          <div className="yam-post-author-copy">
            <div className="yam-post-author-line">
              <strong>{post.authorName}</strong>
              <span className="yam-verified-badge">✓</span>
            </div>
            <div className="yam-post-handle">{post.handle}</div>
          </div>
        </div>
        <div className="yam-post-meta-v2">
          <span>{post.time}</span>
          <button type="button" className="yam-ghost-icon-btn" aria-label="خيارات المنشور">
            <YamshatIcon name="more" size={18} />
          </button>
        </div>
      </div>

      <p className="yam-post-copy-v2">{post.text}</p>

      <div className={`yam-post-media-grid-v2 media-count-${mediaItems.length || 1}`}>
        {mediaItems.map((item, index) => (
          <MediaTile key={`${post.id}-media-${index}`} item={item} index={index} />
        ))}
      </div>

      <div className="yam-post-stats-v2">
        <div className="yam-post-reactions-v2">
          <span className="reaction-bubble like">❤</span>
          <span className="reaction-bubble support">👍</span>
          <span className="reaction-bubble wow">💙</span>
          <strong>{formatCompactNumber(likesCount)}</strong>
        </div>
        <div className="yam-post-numbers-v2">
          <span>{formatCompactNumber(commentsCount)} تعليق</span>
          <span>{formatCompactNumber(sharesCount)} مشاركة</span>
          <span>{formatCompactNumber(post.views || 0)} مشاهدة</span>
        </div>
      </div>

      <div className="yam-post-actions-v2">
        <button type="button" className={liked ? 'active' : ''} onClick={handleLike}><YamshatIcon name="heart" size={17} />{liked ? 'تم الإعجاب' : 'أعجبني'}</button>
        <button type="button" className={showComments ? 'active' : ''} onClick={() => setShowComments((prev) => !prev)}><YamshatIcon name="comment" size={17} />تعليق</button>
        <button type="button" onClick={handleShare}><YamshatIcon name="repeat" size={17} />مشاركة</button>
        <button type="button" className={saved ? 'active' : ''} onClick={handleSave}><YamshatIcon name="bookmark" size={17} />{saved ? 'محفوظ' : 'حفظ'}</button>
      </div>

      {showComments ? (
        <div className="yam-post-comments-panel">
          <div className="yam-post-comment-composer">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="اكتب تعليقك هنا..."
              rows={3}
            />
            <button type="button" className="yam-post-comment-send" onClick={handleAddComment}>إرسال التعليق</button>
          </div>

          <div className="yam-post-comment-list">
            {localComments.length ? localComments.map((comment) => (
              <div key={comment.id} className="yam-post-comment-item">
                <strong>{comment.author}</strong>
                <p>{comment.content}</p>
              </div>
            )) : <div className="yam-post-comment-empty">لا توجد تعليقات بعد، كن أول من يعلّق.</div>}
          </div>
        </div>
      ) : null}
    </article>
  );
}
"""
new_postcard = """function PostCard({ post }) {
  const { pushToast } = useToast();
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = useState(Number(post.shares || 0));
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [showLikeBurst, setShowLikeBurst] = useState(false);

  const triggerLikeBurst = () => {
    setShowLikeBurst(false);
    window.requestAnimationFrame(() => setShowLikeBurst(true));
    window.setTimeout(() => setShowLikeBurst(false), 720);
  };

  const forceLike = () => {
    setLiked((prev) => {
      if (prev) return prev;
      setLikesCount((count) => count + 1);
      pushToast({ type: 'success', title: 'تم الإعجاب بالمنشور' });
      return true;
    });
    triggerLikeBurst();
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const handleMediaDoubleTap = useDoubleTap(() => {
    forceLike();
  }, 260);

  const handleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikesCount((count) => Math.max(0, count + (next ? 1 : -1)));
      if (next) triggerLikeBurst();
      return next;
    });
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/#/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      }
      setSharesCount((count) => count + 1);
      pushToast({ type: 'success', title: 'تمت مشاركة المنشور أو نسخ رابطه' });
    } catch {
      pushToast({ type: 'info', title: 'تعذر فتح نافذة المشاركة', description: 'تم تجاهل العملية بدون خطأ مؤثر.' });
    }
  };

  const handleSave = () => {
    setSaved((prev) => !prev);
    pushToast({ type: 'success', title: saved ? 'تمت إزالة المنشور من المحفوظات' : 'تم حفظ المنشور' });
  };

  const handleAddComment = () => {
    const content = commentDraft.trim();
    if (!content) return;
    setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: 'أنت', content }, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft('');
    if (!showComments) setShowComments(true);
    pushToast({ type: 'success', title: 'تمت إضافة التعليق' });
  };

  return (
    <article className="yam-post-card-v2">
      <div className="yam-post-head-v2">
        <div className="yam-post-author-v2">
          <Avatar name={post.authorName} size={48} accent={Boolean(post.brandRing)} image />
          <div className="yam-post-author-copy">
            <div className="yam-post-author-line">
              <strong>{post.authorName}</strong>
              <span className="yam-verified-badge">✓</span>
            </div>
            <div className="yam-post-handle">{post.handle}</div>
          </div>
        </div>
        <div className="yam-post-meta-v2">
          <span>{post.time}</span>
          <button type="button" className="yam-ghost-icon-btn" aria-label="خيارات المنشور">
            <YamshatIcon name="more" size={18} />
          </button>
        </div>
      </div>

      <p className="yam-post-copy-v2">{post.text}</p>

      <div
        className={`yam-post-media-grid-v2 media-count-${mediaItems.length || 1}`}
        onClick={handleMediaDoubleTap}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            forceLike();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="دبل تاب للإعجاب"
      >
        {mediaItems.map((item, index) => (
          <MediaTile key={`${post.id}-media-${index}`} item={item} index={index} />
        ))}
        <div className={`yam-like-burst ${showLikeBurst ? 'visible' : ''}`} aria-hidden="true">❤</div>
        <div className="yam-post-doubletap-badge">دبل تاب للإعجاب</div>
      </div>

      <div className="yam-post-stats-v2">
        <div className="yam-post-reactions-v2">
          <span className="reaction-bubble like">❤</span>
          <span className="reaction-bubble support">👍</span>
          <span className="reaction-bubble wow">💙</span>
          <strong>{formatCompactNumber(likesCount)}</strong>
        </div>
        <div className="yam-post-numbers-v2">
          <span>{formatCompactNumber(commentsCount)} تعليق</span>
          <span>{formatCompactNumber(sharesCount)} مشاركة</span>
          <span>{formatCompactNumber(post.views || 0)} مشاهدة</span>
        </div>
      </div>

      <div className="yam-post-actions-v2">
        <button type="button" className={liked ? 'active' : ''} onClick={handleLike}><YamshatIcon name="heart" size={17} />{liked ? 'تم الإعجاب' : 'أعجبني'}</button>
        <button type="button" className={showComments ? 'active' : ''} onClick={() => setShowComments((prev) => !prev)}><YamshatIcon name="comment" size={17} />تعليق</button>
        <button type="button" onClick={handleShare}><YamshatIcon name="repeat" size={17} />مشاركة</button>
        <button type="button" className={saved ? 'active' : ''} onClick={handleSave}><YamshatIcon name="bookmark" size={17} />{saved ? 'محفوظ' : 'حفظ'}</button>
      </div>

      {showComments ? (
        <div className="yam-post-comments-panel">
          <div className="yam-post-comment-composer">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="اكتب تعليقك هنا..."
              rows={3}
            />
            <button type="button" className="yam-post-comment-send" onClick={handleAddComment}>إرسال التعليق</button>
          </div>

          <div className="yam-post-comment-list">
            {localComments.length ? localComments.map((comment) => (
              <div key={comment.id} className="yam-post-comment-item">
                <strong>{comment.author}</strong>
                <p>{comment.content}</p>
              </div>
            )) : <div className="yam-post-comment-empty">لا توجد تعليقات بعد، كن أول من يعلّق.</div>}
          </div>
        </div>
      ) : null}
    </article>
  );
}
"""
feed = replace_once(feed, old_postcard, new_postcard, 'feed postcard')
old_main = """          <main className="yam-center-stage">
            <section className="yam-feed-header-card">
              <div className="yam-feed-header-top">
                <h1>المنشورات</h1>
                <div className="yam-mobile-brand">YAMSHAT</div>
              </div>

              <div className="yam-composer-prompt-bar">
                <div className="yam-composer-actions-inline">
                  {QUICK_ACTIONS.map((item) => (
                    <button key={item.label} type="button" className={`yam-mini-action ${item.color}`}>
                      <span className="dot" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="yam-home-composer-slot">
                <PostComposer />
              </div>

              <div className="yam-feed-tabs">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yam-feed-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="yam-post-stack-v2">
              {feedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </main>
"""
new_main = """          <main className="yam-center-stage">
            <section className="yam-feed-header-card">
              <div className="yam-feed-header-top">
                <h1>المنشورات</h1>
                <div className="yam-mobile-brand">YAMSHAT</div>
              </div>

              <div className="yam-feed-hero-shell">
                <div className="yam-feed-hero-copy">
                  <strong>واجهة أخف، أوضح، وأقرب لتجربة التطبيق الأصلي</strong>
                  <p>رتّبنا الأولويات بصرياً: العنوان أولاً، أدوات الإنشاء بعدها، ثم الستوري كمسار سريع للاكتشاف، وأخيراً البطاقات بمسافات أهدأ وعمق أوضح.</p>
                  <div className="yam-feed-hero-tags">
                    <span className="yam-feed-hero-tag">motion immersive</span>
                    <span className="yam-feed-hero-tag">native micro-interactions</span>
                    <span className="yam-feed-hero-tag">touch-first hierarchy</span>
                  </div>
                </div>
                <div className="yam-feed-hero-stats">
                  {FEED_HERO_STATS.map((item) => (
                    <div key={item.label} className="yam-feed-stat-card">
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="yam-composer-prompt-bar">
                <div className="yam-composer-actions-inline">
                  {QUICK_ACTIONS.map((item) => (
                    <button key={item.label} type="button" className={`yam-mini-action ${item.color}`}>
                      <span className="dot" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="yam-home-composer-slot">
                <PostComposer />
              </div>

              <div className="yam-home-story-strip-card">
                <div className="yam-home-story-strip-head">
                  <h3>شريط الستوري</h3>
                  <span>gradients + rings + live depth</span>
                </div>
                <div className="yam-home-story-strip">
                  {HOME_STORIES.map((story) => (
                    <button key={story.id} type="button" className="story-strip-item" onClick={() => navigate('/stories')}>
                      <span className={`story-strip-ring ${story.live ? 'live' : ''}`}>
                        <span>{story.label.slice(0, 1)}</span>
                        {story.live ? <span className="story-live-indicator">LIVE</span> : null}
                      </span>
                      <span>{story.label}</span>
                      <small>{story.caption}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="yam-feed-tabs">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yam-feed-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="yam-section-title-row">
              <h3>نبض اليوم</h3>
              <span className="yam-feed-section-meta">{feedPosts.length} بطاقات مصقولة</span>
            </div>

            <div className="yam-post-stack-v2">
              {feedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </main>
"""
feed = replace_once(feed, old_main, new_main, 'feed main area')
feed = replace_once(
    feed,
    ".yam-feed-tab.active::after {\n            content: '';\n            position: absolute;\n            inset-inline: 0;\n            bottom: 0;\n            height: 3px;\n            border-radius: 999px;\n            background: linear-gradient(90deg, #8b5cf6, #d946ef);\n          }\n",
    ".yam-feed-tab.active::after {\n            content: '';\n            position: absolute;\n            inset-inline: 0;\n            bottom: 0;\n            height: 3px;\n            border-radius: 999px;\n            background: linear-gradient(90deg, #8b5cf6, #d946ef);\n          }\n\n          .yam-feed-section-meta {\n            color: #bfc8e8;\n            font-size: 13px;\n            font-weight: 700;\n          }\n",
    'feed section meta style',
)
feed_path.write_text(feed)

# --- Stories.jsx ---
stories_path = ROOT / 'pages' / 'Stories.jsx'
stories = stories_path.read_text()
stories = replace_once(
    stories,
    "import { useEffect, useMemo, useRef, useState } from 'react';\n",
    "import { useEffect, useMemo, useRef, useState } from 'react';\n",
    'stories import anchor',
)
stories = replace_once(
    stories,
    "import { useToast } from '../components/admin/ToastProvider.jsx';\n",
    "import { useToast } from '../components/admin/ToastProvider.jsx';\nimport GestureContainer from '../components/GestureContainer.jsx';\nimport OptimizedVideo from '../components/ui/OptimizedVideo.jsx';\n",
    'stories add imports',
)
stories = replace_once(
    stories,
    "function storyAudienceLabel(story) {\n  return story?.is_close_friends ? 'الأصدقاء المقربون' : 'عام';\n}\n\n",
    "function storyAudienceLabel(story) {\n  return story?.is_close_friends ? 'الأصدقاء المقربون' : 'عام';\n}\n\nfunction StoryMedia({ story, cover = false, autoPlay = false, muted = true, loop = false, controls = false, loadingLabel = 'جارٍ تجهيز الوسائط...' }) {\n  const [isLoaded, setIsLoaded] = useState(false);\n\n  useEffect(() => {\n    setIsLoaded(false);\n  }, [story?.id, story?.media_url]);\n\n  return (\n    <div className=\"story-media-shell\">\n      {isVideoStory(story) ? (\n        <OptimizedVideo\n          src={story.media_url}\n          alt={story?.caption || 'story video'}\n          controls={controls}\n          autoplay={autoPlay}\n          muted={muted}\n          loop={loop}\n          lazy={false}\n          aspectRatio=\"9/16\"\n          style={{ borderRadius: 0, background: '#070b14' }}\n          onLoad={() => setIsLoaded(true)}\n        />\n      ) : (\n        <img\n          src={story.media_url}\n          alt={story?.caption || 'story'}\n          loading=\"lazy\"\n          decoding=\"async\"\n          onLoad={() => setIsLoaded(true)}\n          style={{ width: '100%', height: '100%', objectFit: cover ? 'cover' : 'contain' }}\n        />\n      )}\n\n      {!isLoaded ? (\n        <div className=\"story-media-loader\">\n          <div>\n            <div className=\"pulse\">{isVideoStory(story) ? '▶' : '◌'}</div>\n            <span>{loadingLabel}</span>\n          </div>\n        </div>\n      ) : null}\n    </div>\n  );\n}\n\n",
    'stories media helper',
)
stories = replace_once(
    stories,
    "  const [viewerOpen, setViewerOpen] = useState(false);\n  const [replyText, setReplyText] = useState('');\n  const [progress, setProgress] = useState(0);\n  const [paused, setPaused] = useState(false);\n",
    "  const [viewerOpen, setViewerOpen] = useState(false);\n  const [replyText, setReplyText] = useState('');\n  const [progress, setProgress] = useState(0);\n  const [paused, setPaused] = useState(false);\n  const [viewerDragOffset, setViewerDragOffset] = useState({ x: 0, y: 0 });\n  const [showHeartBurst, setShowHeartBurst] = useState(false);\n",
    'stories states',
)
stories = replace_once(
    stories,
    "  const reactToCurrentStory = async (emoji) => {\n",
    "  const reactToCurrentStory = async (emoji) => {\n",
    'stories reaction anchor',
)
stories = replace_once(
    stories,
    "  const archiveCount = archive.length;\n",
    "  const triggerHeartBurst = () => {\n    setShowHeartBurst(false);\n    window.requestAnimationFrame(() => setShowHeartBurst(true));\n    window.setTimeout(() => setShowHeartBurst(false), 720);\n  };\n\n  const goToPreviousStory = () => {\n    if (activeStoryIndex > 0) setActiveStoryIndex((prev) => prev - 1);\n    else if (activeGroupIndex > 0) {\n      const previousGroupIndex = activeGroupIndex - 1;\n      const previousGroupLength = viewerGroups[previousGroupIndex]?.stories?.length || 1;\n      setActiveGroupIndex(previousGroupIndex);\n      setActiveStoryIndex(previousGroupLength - 1);\n    }\n  };\n\n  const goToNextStory = () => {\n    if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((prev) => prev + 1);\n    else if (activeGroupIndex < viewerGroups.length - 1) {\n      setActiveGroupIndex((prev) => prev + 1);\n      setActiveStoryIndex(0);\n    }\n  };\n\n  const handleViewerDoubleTap = () => {\n    reactToCurrentStory('❤️');\n    triggerHeartBurst();\n    if (navigator.vibrate) navigator.vibrate(10);\n  };\n\n  const archiveCount = archive.length;\n",
    'stories gesture helpers',
)
stories = replace_once(
    stories,
    "      <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 10px', display: 'grid', gap: 18 }}>",
    "      <div className=\"story-dashboard-shell\" style={{ maxWidth: 980, margin: '0 auto', padding: '20px 10px' }}>",
    'stories shell class',
)
stories = replace_once(
    stories,
    "        <Card style={{ padding: 18 }}>",
    "        <Card className=\"story-hero-card story-shell-surface\" style={{ padding: 18 }}>",
    'stories hero card class',
)
stories = replace_once(
    stories,
    "              {storyGroups.map((group, groupIndex) => (\n                <button key={group.username} type=\"button\" onClick={() => openViewer('feed', groupIndex, 0)} className=\"story-user-card\">\n                  <div className=\"story-user-ring\">\n                    <img src={`https://ui-avatars.com/api/?name=${group.username}`} alt={group.username} className=\"story-user-avatar\" />\n                  </div>\n                  <div style={{ marginTop: 8, fontSize: 12 }}>{group.username}</div>\n                  <small className=\"muted\">{group.stories.length} قصة</small>\n                </button>\n              ))}",
    "              {storyGroups.map((group, groupIndex) => (\n                <button key={group.username} type=\"button\" onClick={() => openViewer('feed', groupIndex, 0)} className=\"story-user-card\">\n                  <div className=\"story-user-ring\">\n                    <img src={`https://ui-avatars.com/api/?name=${group.username}`} alt={group.username} className=\"story-user-avatar\" />\n                    {groupIndex === 0 ? <span className=\"story-live-indicator\">LIVE</span> : null}\n                  </div>\n                  <div style={{ marginTop: 8, fontSize: 12 }}>{group.username}</div>\n                  <small className=\"muted\">{group.stories.length} قصة</small>\n                </button>\n              ))}",
    'stories live indicator',
)
stories = replace_once(
    stories,
    "                <Card key={story.id} style={{ overflow: 'hidden', padding: 0 }}>\n                  <div style={{ aspectRatio: '9 / 16', position: 'relative', background: '#111' }}>\n                    {isVideoStory(story)\n                      ? <video src={story.media_url} muted loop autoPlay playsInline preload=\"metadata\" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />\n                      : <img src={story.media_url} alt=\"story\" loading=\"lazy\" decoding=\"async\" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}\n                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>",
    "                <Card key={story.id} className=\"story-grid-card story-shell-surface\" style={{ overflow: 'hidden', padding: 0 }}>\n                  <div style={{ position: 'relative' }}>\n                    <StoryMedia story={story} cover autoPlay muted loop loadingLabel=\"جارٍ تحميل معاينة الستوري...\" />\n                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, flexWrap: 'wrap', zIndex: 2 }}>",
    'stories grid media',
)
stories = replace_once(
    stories,
    "                    <Card key={story.id} style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }} onClick={() => openViewer('archive', groupIndex, nestedIndex)}>\n                      <div style={{ aspectRatio: '9 / 16', background: '#111', position: 'relative' }}>\n                        {isVideoStory(story)\n                          ? <video src={story.media_url} muted preload=\"metadata\" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />\n                          : <img src={story.media_url} alt=\"archived\" loading=\"lazy\" decoding=\"async\" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.78 }} />}\n                        <div style={{ position: 'absolute', top: 10, left: 10 }}><span className=\"story-chip\">🗄️ مؤرشف</span></div>\n                        <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white' }}>",
    "                    <Card key={story.id} className=\"story-archive-card story-shell-surface\" style={{ overflow: 'hidden', padding: 0, cursor: 'pointer' }} onClick={() => openViewer('archive', groupIndex, nestedIndex)}>\n                      <div style={{ position: 'relative' }}>\n                        <StoryMedia story={story} cover muted loadingLabel=\"جارٍ تحميل الأرشيف...\" />\n                        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}><span className=\"story-chip\">🗄️ مؤرشف</span></div>\n                        <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 10, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white', zIndex: 2 }}>",
    'stories archive media',
)
stories = replace_once(
    stories,
    "              <div\n                style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000', borderRadius: 20, overflow: 'hidden' }}\n                onMouseDown={() => setPaused(true)}\n                onMouseUp={() => setPaused(false)}\n                onTouchStart={() => setPaused(true)}\n                onTouchEnd={() => setPaused(false)}\n              >\n                {isVideoStory(activeStory)\n                  ? <video key={activeStory.id} src={activeStory.media_url} controls autoPlay playsInline preload=\"metadata\" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />\n                  : <img src={activeStory.media_url} alt=\"story\" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}\n\n                <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>\n                  {activeStory.music ? <span className=\"story-chip\">🎵 {activeStory.music}</span> : null}\n                  {activeStory.sticker_items?.map((sticker) => <span key={sticker} className=\"story-chip\">{sticker}</span>)}\n                </div>\n\n                <button type=\"button\" className=\"story-nav-hit story-nav-prev\" onClick={() => {\n                  if (activeStoryIndex > 0) setActiveStoryIndex((prev) => prev - 1);\n                  else if (activeGroupIndex > 0) {\n                    const previousGroupIndex = activeGroupIndex - 1;\n                    const previousGroupLength = viewerGroups[previousGroupIndex]?.stories?.length || 1;\n                    setActiveGroupIndex(previousGroupIndex);\n                    setActiveStoryIndex(previousGroupLength - 1);\n                  }\n                }}>‹</button>\n                <button type=\"button\" className=\"story-nav-hit story-nav-next\" onClick={() => {\n                  if (activeStoryIndex < (activeGroup?.stories?.length || 0) - 1) setActiveStoryIndex((prev) => prev + 1);\n                  else if (activeGroupIndex < viewerGroups.length - 1) {\n                    setActiveGroupIndex((prev) => prev + 1);\n                    setActiveStoryIndex(0);\n                  }\n                }}>›</button>\n\n                <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white' }}>\n                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeStory.caption || 'بدون كابشن'}</div>\n                  <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {activeStory.music || 'بدون موسيقى'} · {storyAudienceLabel(activeStory)}</div>\n                </div>\n              </div>",
    "              <GestureContainer\n                onSwipe={(data) => {\n                  setPaused(false);\n                  setViewerDragOffset({ x: data.direction === 'left' ? -72 : 72, y: 0 });\n                  window.setTimeout(() => setViewerDragOffset({ x: 0, y: 0 }), 220);\n                  if (data.direction === 'right') goToPreviousStory();\n                  else if (data.direction === 'left') goToNextStory();\n                }}\n                onSwipeVertical={(data) => {\n                  setPaused(false);\n                  setViewerDragOffset({ x: 0, y: data.direction === 'down' ? 88 : -44 });\n                  window.setTimeout(() => setViewerDragOffset({ x: 0, y: 0 }), 220);\n                  if (data.direction === 'down') setViewerOpen(false);\n                }}\n                onDoubleTap={handleViewerDoubleTap}\n                className=\"story-viewer-stage swiping\"\n                style={{\n                  transform: `translate3d(${viewerDragOffset.x}px, ${viewerDragOffset.y}px, 0)`,\n                }}\n              >\n                <div\n                  onMouseDown={() => setPaused(true)}\n                  onMouseUp={() => setPaused(false)}\n                  onTouchStart={() => setPaused(true)}\n                  onTouchEnd={() => setPaused(false)}\n                >\n                  <StoryMedia story={activeStory} autoPlay muted={false} controls loadingLabel=\"جارٍ تحميل الفيديو...\" />\n\n                  <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 2 }}>\n                    {activeStory.music ? <span className=\"story-chip\">🎵 {activeStory.music}</span> : null}\n                    {activeStory.sticker_items?.map((sticker) => <span key={sticker} className=\"story-chip\">{sticker}</span>)}\n                  </div>\n\n                  <button type=\"button\" className=\"story-nav-hit story-nav-prev\" onClick={goToPreviousStory}>‹</button>\n                  <button type=\"button\" className=\"story-nav-hit story-nav-next\" onClick={goToNextStory}>›</button>\n\n                  <div className={`story-reaction-float ${showHeartBurst ? 'visible' : ''}`} aria-hidden=\"true\">❤️</div>\n\n                  <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 16, background: 'linear-gradient(transparent, rgba(0,0,0,0.84))', color: 'white', zIndex: 2 }}>\n                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{activeStory.caption || 'بدون كابشن'}</div>\n                    <div style={{ fontSize: 12, opacity: 0.82 }}>🎵 {activeStory.music || 'بدون موسيقى'} · {storyAudienceLabel(activeStory)} · اسحب للتنقل</div>\n                  </div>\n                </div>\n              </GestureContainer>",
    'stories viewer gesture stage',
)
stories_path.write_text(stories)

print('Updated FeedEnhanced.jsx and Stories.jsx')
