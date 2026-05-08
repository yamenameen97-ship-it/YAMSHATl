import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import PageLoader from '../components/feedback/PageLoader.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import NestedComments from '../components/feed/NestedComments.jsx';
import {
  addComment,
  createPost,
  getComments,
  getDraftPosts,
  getPostInsights,
  getPosts,
  likePost,
  savePost,
  sharePost,
  uploadPostMedia,
} from '../api/posts.js';
import { useAppStore } from '../store/appStore.js';

const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));
const PAGE_SIZE = 12;
const MODERATION_BLOCKLIST = ['ممنوع', 'abuse', 'hate'];

async function fetchReelsPage({ pageParam = 0 }) {
  const { data } = await getPosts({ skip: pageParam, limit: PAGE_SIZE });
  const posts = Array.isArray(data) ? data : [];
  const reels = posts.filter((post) => isVideo(post.media || post.image_url));
  return {
    items: reels,
    nextCursor: posts.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
  };
}

function emitToast(toast) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yamshat:toast', { detail: toast }));
}

async function buildVideoThumbnail(file) {
  if (typeof window === 'undefined') return null;
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.muted = true;
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = reject;
    });
    video.currentTime = Math.min(1, Math.max(0.15, video.duration / 4 || 0.15));
    await new Promise((resolve) => {
      video.onseeked = resolve;
      setTimeout(resolve, 200);
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(320, video.videoWidth || 320);
    canvas.height = Math.max(180, video.videoHeight || 180);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-thumb.jpg`, { type: 'image/jpeg' }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function Reels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveData, setSaveData] = useState(false);
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState({});
  const [savedIds, setSavedIds] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [bufferingMap, setBufferingMap] = useState({});
  const [bufferMap, setBufferMap] = useState({});
  const [heartBurst, setHeartBurst] = useState({ visible: false, x: 0, y: 0 });
  const [commentsOpenFor, setCommentsOpenFor] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentDraftMap, setCommentDraftMap] = useState({});
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [studioFile, setStudioFile] = useState(null);
  const [studioPreview, setStudioPreview] = useState('');
  const [studioCaption, setStudioCaption] = useState('');
  const [studioDraft, setStudioDraft] = useState(true);
  const [studioMusic, setStudioMusic] = useState('Original');
  const [studioEffect, setStudioEffect] = useState('Clean');
  const [studioThumbnailName, setStudioThumbnailName] = useState('');
  const [studioUploading, setStudioUploading] = useState(false);
  const [studioProgress, setStudioProgress] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);
  const [draftsCount, setDraftsCount] = useState(0);
  const [adaptiveProfile, setAdaptiveProfile] = useState('Balanced');
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const sentinelRef = useRef(null);
  const tapRef = useRef({ time: 0, index: -1 });
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const clearUploadProgress = useAppStore((state) => state.clearUploadProgress);

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['reels-v2'],
    queryFn: fetchReelsPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const reels = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) || [];
    const unique = [];
    const seen = new Set();
    items.forEach((item) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      unique.push(item);
    });
    return unique;
  }, [data]);

  const rankedRecommendations = useMemo(() => [...reels]
    .sort((a, b) => {
      const scoreA = (a.likes || a.like_count || 0) + ((a.comments_count || 0) * 2) + (a.share_count || 0) + (a.save_count || 0);
      const scoreB = (b.likes || b.like_count || 0) + ((b.comments_count || 0) * 2) + (b.share_count || 0) + (b.save_count || 0);
      return scoreB - scoreA;
    })
    .slice(0, 5), [reels]);
  const activeReel = reels[activeIndex] || null;

  useEffect(() => {
    setSaveData(Boolean(navigator.connection?.saveData));
    const connection = navigator.connection;
    if (connection?.saveData) setAdaptiveProfile('Data Saver');
    else if ((connection?.downlink || 5) <= 1.5) setAdaptiveProfile('Lite');
    else if ((connection?.downlink || 5) >= 5) setAdaptiveProfile('HD');
    else setAdaptiveProfile('Balanced');
  }, []);

  useEffect(() => {
    let ignore = false;
    getDraftPosts().then(({ data: drafts }) => {
      if (!ignore) setDraftsCount((Array.isArray(drafts) ? drafts : []).filter((post) => isVideo(post.media || post.image_url)).length);
    }).catch(() => null);
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!studioPreview?.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(studioPreview);
  }, [studioPreview]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.index);
          const video = videoRefs.current[index];
          if (!video) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(index);
            video.muted = muted;
            video.play().catch(() => null);
            const nextVideo = videoRefs.current[index + 1];
            if (nextVideo) nextVideo.preload = saveData ? 'metadata' : 'auto';
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.25, 0.6, 0.9] }
    );

    Object.values(videoRefs.current).forEach((video) => video?.parentElement && observer.observe(video.parentElement));
    return () => observer.disconnect();
  }, [reels, saveData, muted]);

  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.15, rootMargin: '300px 0px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') handleNext(1);
      if (event.key === 'ArrowUp') handleNext(-1);
      if (event.key.toLowerCase() === 'm') setMuted((prev) => !prev);
      if (event.key.toLowerCase() === 'l' && activeReel) handleToggleLike(activeReel.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, reels.length, activeReel]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      if (!video) return;
      video.muted = muted || Number(index) !== activeIndex;
    });
  }, [activeIndex, muted]);

  const handleNext = (direction = 1) => {
    const nextIndex = Math.max(0, Math.min(reels.length - 1, activeIndex + direction));
    const target = containerRef.current?.querySelector(`[data-reel-index="${nextIndex}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleLike = async (postId) => {
    await likePost(postId);
    setLikedIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
    await refetch();
  };

  const handleToggleSave = async (postId) => {
    await savePost(postId);
    setSavedIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
    await refetch();
  };

  const handleShare = async (post) => {
    const link = `${window.location.origin}${window.location.pathname}#reel-${post?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Yamshat Reel', text: post?.content || 'ريل جديد', url: link });
        await sharePost(post.id, 'native-share');
      } else {
        await navigator.clipboard.writeText(link);
        await sharePost(post.id, 'copy-link');
      }
      emitToast({ type: 'success', title: 'تمت المشاركة', description: 'رابط الريل جاهز للمشاركة.' });
      await refetch();
    } catch {
      emitToast({ type: 'warning', title: 'المشاركة اتلغت', description: 'جرّب تاني أو انسخ الرابط يدوي.' });
    }
  };

  const openComments = async (postId) => {
    if (commentsOpenFor === postId) {
      setCommentsOpenFor(null);
      return;
    }
    const { data: commentsData } = await getComments(postId);
    setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(commentsData) ? commentsData : [] }));
    setCommentsOpenFor(postId);
  };

  const submitComment = async (postId, parentId = null, overrideText = null) => {
    const raw = overrideText ?? commentDraftMap[postId] ?? '';
    const text = String(raw || '').trim();
    if (!text) return;
    await addComment(postId, text, parentId);
    const { data: commentsData } = await getComments(postId);
    setCommentsMap((prev) => ({ ...prev, [postId]: Array.isArray(commentsData) ? commentsData : [] }));
    if (!parentId) setCommentDraftMap((prev) => ({ ...prev, [postId]: '' }));
    await refetch();
  };

  const openInsights = async (postId) => {
    setInsightsOpen(true);
    const { data: payload } = await getPostInsights(postId);
    setInsightsData(payload || null);
  };

  const handleTimeUpdate = (index, event) => {
    const video = event.currentTarget;
    const progress = video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0;
    setProgressMap((prev) => ({ ...prev, [index]: progress }));
  };

  const handleProgress = (index, event) => {
    const video = event.currentTarget;
    try {
      const buffered = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
      const percent = video.duration ? Math.min(100, Math.round((buffered / video.duration) * 100)) : 0;
      setBufferMap((prev) => ({ ...prev, [index]: percent }));
    } catch {
      // noop
    }
  };

  const triggerHeart = (clientX, clientY) => {
    setHeartBurst({ visible: true, x: clientX, y: clientY });
    window.clearTimeout(triggerHeart.timeoutId);
    triggerHeart.timeoutId = window.setTimeout(() => setHeartBurst({ visible: false, x: 0, y: 0 }), 700);
  };

  const handleDoubleTap = async (event, postId, index) => {
    const now = Date.now();
    const last = tapRef.current;
    if (last.index === index && now - last.time < 280) {
      await handleToggleLike(postId);
      triggerHeart(event.clientX || window.innerWidth / 2, event.clientY || window.innerHeight / 2);
      tapRef.current = { time: 0, index: -1 };
      return;
    }
    tapRef.current = { time: now, index };
  };

  const stats = useMemo(() => [
    { label: 'إجمالي الريلز', value: reels.length },
    { label: 'Draft Reels', value: draftsCount },
    { label: 'ريلز محفوظة', value: Object.values(savedIds).filter(Boolean).length },
    { label: 'الوضع', value: muted ? 'Muted' : 'Sound On' },
  ], [draftsCount, muted, reels.length, savedIds]);

  const handleStudioFile = async (file) => {
    if (!file) return;
    setStudioFile(file);
    setStudioPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    const thumb = await buildVideoThumbnail(file);
    setStudioThumbnailName(thumb?.name || 'جاهز محلياً');
  };

  const submitStudio = async () => {
    if (!studioFile) {
      emitToast({ type: 'warning', title: 'اختر فيديو', description: 'لازم تضيف فيديو قبل الرفع.' });
      return;
    }
    if (MODERATION_BLOCKLIST.some((word) => studioCaption.toLowerCase().includes(word))) {
      emitToast({ type: 'error', title: 'المحتوى مرفوض', description: 'فيه كلمات محتاجة مراجعة قبل نشر الريل.' });
      return;
    }
    setStudioUploading(true);
    setStudioProgress(0);
    try {
      const { data: uploadData } = await uploadPostMedia(studioFile, (progressEvent) => {
        const value = Math.round((progressEvent?.progress || 0) * 100);
        setStudioProgress(value);
        setUploadProgress('reelStudio', value);
      });
      const videoUrl = uploadData?.file_url || uploadData?.url || uploadData?.imagekit_url || uploadData?.cloud_url;
      const decoratedCaption = [studioCaption.trim(), studioMusic !== 'Original' ? `🎵 ${studioMusic}` : '', studioEffect !== 'Clean' ? `✨ ${studioEffect}` : '']
        .filter(Boolean)
        .join(' • ');
      await createPost({
        content: decoratedCaption || 'ريل جديد',
        media_urls: [videoUrl],
        is_draft: studioDraft,
        allow_comments: true,
      });
      emitToast({ type: 'success', title: studioDraft ? 'تم حفظ الريل كمسودة' : 'تم نشر الريل', description: 'الرفع الخلفي خلص بنجاح.' });
      setStudioFile(null);
      setStudioCaption('');
      setStudioMusic('Original');
      setStudioEffect('Clean');
      setStudioThumbnailName('');
      if (studioPreview?.startsWith('blob:')) URL.revokeObjectURL(studioPreview);
      setStudioPreview('');
      clearUploadProgress('reelStudio');
      await refetch();
      const { data: drafts } = await getDraftPosts();
      setDraftsCount((Array.isArray(drafts) ? drafts : []).filter((post) => isVideo(post.media || post.image_url)).length);
    } catch (err) {
      emitToast({ type: 'error', title: 'فشل رفع الريل', description: err?.response?.data?.detail || 'حصلت مشكلة أثناء رفع الفيديو.' });
    } finally {
      setStudioUploading(false);
    }
  };

  return (
    <MainLayout>
      <section className="reels-page-shell">
        <div className="section-head">
          <div>
            <h3 className="section-title">🎬 الريلز</h3>
            <p className="muted">تم تحسين تحميل الفيديوهات، Buffering، التعليقات Overlay، Double Tap Like، Studio للرفع، توصيات، وAuto Replay داخل تجربة أقرب للتطبيقات الاجتماعية الحديثة.</p>
          </div>
          <div className="live-stage-stats">
            <span className="glass-chip">Swipe Ready</span>
            <span className="glass-chip">{adaptiveProfile}</span>
            <span className="glass-chip">{saveData ? 'Data Saver' : 'Next Video Preload'}</span>
            <span className="glass-chip">{muted ? 'Muted' : 'Sound On'}</span>
          </div>
        </div>

        <div className="stories-stats-grid notification-stats-grid-4">
          {stats.map((item) => (
            <div key={item.label} className="mini-stat stories-stat-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="reels-layout-enhanced">
          <div className="reels-viewport" ref={containerRef} onTouchStart={(event) => setTouchStartY(event.touches[0]?.clientY || null)} onTouchEnd={(event) => {
            const endY = event.changedTouches[0]?.clientY;
            if (touchStartY == null || endY == null) return;
            const delta = touchStartY - endY;
            if (Math.abs(delta) < 60) return;
            handleNext(delta > 0 ? 1 : -1);
          }}>
            {isLoading ? <PageLoader label="جارٍ تحميل الريلز..." /> : null}
            {isError ? (
              <ErrorState
                title="تعذر تحميل الريلز"
                description={error?.response?.data?.message || error?.message || 'حدث خطأ أثناء جلب الفيديوهات.'}
                onRetry={refetch}
              />
            ) : null}
            {!isLoading && !isError && reels.length === 0 ? (
              <EmptyState
                icon="🎥"
                title="لا توجد فيديوهات منشورة"
                description="بمجرد نشر أي فيديو سيظهر هنا تلقائياً بشكل عمودي."
              />
            ) : null}

            {reels.map((post, index) => {
              const localLikes = likedIds[post.id] ? 1 : 0;
              return (
                <article key={post.id || index} className="reel-slide" data-reel-index={index} id={`reel-${post.id}`}>
                  <div className="reel-video-shell" data-index={index}>
                    <video
                      ref={(node) => {
                        if (node) videoRefs.current[index] = node;
                      }}
                      className="reel-video"
                      src={post.media || post.image_url}
                      controls
                      playsInline
                      preload={saveData ? 'metadata' : index <= activeIndex + 1 ? 'auto' : 'metadata'}
                      muted={muted || index !== activeIndex}
                      onClick={(event) => handleDoubleTap(event, post.id, index)}
                      onTimeUpdate={(event) => handleTimeUpdate(index, event)}
                      onProgress={(event) => handleProgress(index, event)}
                      onWaiting={() => setBufferingMap((prev) => ({ ...prev, [index]: true }))}
                      onCanPlay={() => setBufferingMap((prev) => ({ ...prev, [index]: false }))}
                      onEnded={(event) => {
                        event.currentTarget.currentTime = 0;
                        event.currentTarget.play().catch(() => null);
                      }}
                    />
                    {heartBurst.visible && index === activeIndex ? (
                      <div className="reel-like-burst" style={{ left: heartBurst.x, top: heartBurst.y }}>❤️</div>
                    ) : null}
                    {bufferingMap[index] ? <div className="reel-buffering-chip">جارٍ التحميل…</div> : null}
                    <div className="upload-progress-shell compact-upload-progress">
                      <div className="upload-progress-buffer" style={{ width: `${bufferMap[index] || 0}%` }} />
                      <div className="upload-progress-bar" style={{ width: `${progressMap[index] || 0}%` }} />
                      <span>{progressMap[index] || 0}%</span>
                    </div>
                    <div className="reel-overlay">
                      <div>
                        <strong>@{post.username}</strong>
                        <p>{post.content || 'ريل جديد داخل يمشات'}</p>
                      </div>
                      <div className="reel-stats-overlay">
                        <span>❤️ {(post.likes || post.like_count || 0) + localLikes}</span>
                        <span>💬 {post.comments_count || post.comment_count || 0}</span>
                        <span>📆 {post.created_at ? new Date(post.created_at).toLocaleDateString('ar-EG') : 'اليوم'}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            <div ref={sentinelRef} className="reels-sentinel">{isFetchingNextPage ? 'جارٍ تحميل المزيد...' : hasNextPage ? 'اسحب للأسفل للمزيد' : 'تم الوصول لآخر الريلز'}</div>
          </div>

          <aside className="reels-side-rail card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">تحكم سريع</h3>
                <p className="muted">إعجاب مزدوج، حفظ، مشاركة، تعليقات Overlay، وتحسين سحب عمودي للموبايل.</p>
              </div>
            </div>
            <div className="reels-control-stack">
              <button type="button" className="mini-action" onClick={() => handleNext(-1)}>⬆ السابق</button>
              <button type="button" className="mini-action" onClick={() => handleNext(1)}>⬇ التالي</button>
              <button type="button" className="mini-action" onClick={() => setMuted((prev) => !prev)}>{muted ? '🔊 تشغيل الصوت' : '🔇 كتم الصوت'}</button>
              <div className="muted">الحالي: {activeIndex + 1} / {reels.length}</div>
              <div className="muted">Adaptive Profile: {adaptiveProfile}</div>
            </div>

            {activeReel ? (
              <div className="notifications-shortcuts-grid">
                <button type="button" className={`mini-action ${likedIds[activeReel.id] ? 'active-filter-chip' : ''}`} onClick={() => handleToggleLike(activeReel.id)}>
                  {likedIds[activeReel.id] ? '❤️ تم الإعجاب' : '🤍 إعجاب'}
                </button>
                <button type="button" className={`mini-action ${savedIds[activeReel.id] ? 'active-filter-chip' : ''}`} onClick={() => handleToggleSave(activeReel.id)}>
                  {savedIds[activeReel.id] ? '📌 محفوظ' : '📁 حفظ'}
                </button>
                <button type="button" className="mini-action" onClick={() => handleShare(activeReel)}>🔗 مشاركة</button>
                <button type="button" className="mini-action" onClick={() => openComments(activeReel.id)}>💬 التعليقات</button>
                <button type="button" className="mini-action" onClick={() => openInsights(activeReel.id)}>📊 Analytics</button>
              </div>
            ) : null}

            <div className="integration-grid">
              <div className="integration-card linked">
                <div className="integration-label-row"><strong>Reel Studio</strong><span className="glass-chip">Background Upload</span></div>
                <div className="studio-upload-grid">
                  <label className="upload-label" style={{ margin: 0 }}>
                    <input type="file" accept="video/*" hidden onChange={(event) => handleStudioFile(event.target.files?.[0])} />
                    اختر فيديو ريل
                  </label>
                  <input className="input" value={studioCaption} placeholder="وصف الريل" onChange={(event) => setStudioCaption(event.target.value)} />
                  <div className="studio-inline-fields">
                    <select className="input" value={studioMusic} onChange={(event) => setStudioMusic(event.target.value)}>
                      <option>Original</option>
                      <option>Beat Drop</option>
                      <option>Ambient Rise</option>
                      <option>Street Pop</option>
                    </select>
                    <select className="input" value={studioEffect} onChange={(event) => setStudioEffect(event.target.value)}>
                      <option>Clean</option>
                      <option>Cinematic</option>
                      <option>Glow</option>
                      <option>Retro</option>
                    </select>
                  </div>
                  <label className="remember-me-row"><input type="checkbox" checked={studioDraft} onChange={(event) => setStudioDraft(event.target.checked)} /><span>حفظ كـ Draft</span></label>
                  {studioPreview ? <video src={studioPreview} className="reel-studio-preview" controls playsInline /> : null}
                  {studioThumbnailName ? <div className="glass-chip">Thumbnail: {studioThumbnailName}</div> : null}
                  {studioUploading ? (
                    <div className="upload-progress-shell compact-upload-progress">
                      <div className="upload-progress-bar" style={{ width: `${studioProgress}%` }} />
                      <span>{studioProgress}%</span>
                    </div>
                  ) : null}
                  <Button onClick={submitStudio} loading={studioUploading}>رفع الريل</Button>
                  <div className="muted">Compression: يتم التحسين حسب الشبكة والمتصفح قبل الرفع، مع توليد Thumbnail محلي سريع.</div>
                </div>
              </div>

              {activeReel ? (
                <div className="integration-card linked">
                  <div className="integration-label-row"><strong>صاحب الريل</strong><span className="glass-chip">@{activeReel.username}</span></div>
                  <div className="integration-value">{activeReel.created_at ? new Date(activeReel.created_at).toLocaleString('ar-EG') : 'الآن'}</div>
                  <p>{activeReel.content || 'بدون وصف.'}</p>
                </div>
              ) : null}

              <div className="integration-card linked">
                <div className="integration-label-row"><strong>التوصيات</strong><span className="glass-chip">Smart Order</span></div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {rankedRecommendations.map((item) => (
                    <button key={item.id} type="button" className="mini-action" style={{ justifyContent: 'space-between' }} onClick={() => {
                      const index = reels.findIndex((reel) => reel.id === item.id);
                      if (index >= 0) {
                        setActiveIndex(index);
                        containerRef.current?.querySelector(`[data-reel-index="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}>
                      <span>@{item.username}</span>
                      <span>{(item.likes || 0) + ((item.comments_count || 0) * 2)}</span>
                    </button>
                  ))}
                  {!rankedRecommendations.length ? <div className="muted">التوصيات هتظهر أول ما يتوفر محتوى فيديو.</div> : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <Modal open={commentsOpenFor != null} title="تعليقات الريل" onClose={() => setCommentsOpenFor(null)}>
        {commentsOpenFor ? (
          <NestedComments
            comments={commentsMap[commentsOpenFor] || []}
            rootValue={commentDraftMap[commentsOpenFor] || ''}
            onRootValueChange={(value) => setCommentDraftMap((prev) => ({ ...prev, [commentsOpenFor]: value }))}
            onSubmitRoot={() => submitComment(commentsOpenFor)}
            onSubmitReply={(parentId, value) => submitComment(commentsOpenFor, parentId, value)}
          />
        ) : null}
      </Modal>

      <Modal open={insightsOpen} title="Reel Analytics" onClose={() => setInsightsOpen(false)}>
        {insightsData ? (
          <div className="insights-grid-modal">
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Likes</span><strong>{insightsData.likes}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Comments</span><strong>{insightsData.comments}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Shares</span><strong>{insightsData.shares}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Saves</span><strong>{insightsData.saves}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Edits</span><strong>{insightsData.edits}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Engagement</span><strong>{insightsData.engagement_score}</strong></div>
            <div className="glass-chip" style={{ justifyContent: 'space-between' }}><span>Comment Velocity</span><strong>{insightsData.comment_velocity}</strong></div>
            <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 8 }}>
              {(insightsData.recent_commenters || []).map((item) => (
                <div key={item.id} className="glass-chip" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <strong>@{item.username}</strong>
                  <span>{item.content}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="muted">اختَر ريل لعرض التحليلات.</div>}
      </Modal>
    </MainLayout>
  );
}
