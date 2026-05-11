import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import VideoUploader from '../components/upload/VideoUploader.jsx';
import NestedComments from '../components/feed/NestedComments.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, createPost, getComments, getPosts, likePost, savePost, sharePost } from '../api/posts.js';
import { followUser } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';
import { appendVideoQuality, getDeviceProfile } from '../utils/deviceProfile.js';
import { getOptimizedImageUrl } from '../utils/performance.js';
import { fetchSuggestedReels } from '../services/recommendationService.js';

function computeReelScore(item) {
  const likes = Number(item.likes_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const saves = Number(item.saved_count || 0);
  const freshnessHours = Math.max(1, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 36e5);
  return likes * 2 + comments * 3 + shares * 4 + saves * 4 + 96 / freshnessHours;
}

function isVideoUrl(url = '') {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(url);
}

function getPosterUrl(reel) {
  const source = reel.thumbnail_url || reel.image_url || reel.preview_url || '';
  return source ? getOptimizedImageUrl(source, 720, 74) : '';
}

function getAdaptiveVideoSrc(reel, profile, active = false) {
  const quality = active
    ? profile.preferredVideoQuality
    : profile.isLowEndDevice
      ? 'low'
      : 'medium';
  return appendVideoQuality(reel.media_url || reel.video_url || '', quality);
}

export default function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const scrollRef = useRef(null);
  const videoRefs = useRef(new Map());
  const viewTimersRef = useRef(new Map());
  const rafRef = useRef(0);
  const preloadNodesRef = useRef([]);
  const [viewportHeight, setViewportHeight] = useState(typeof window === 'undefined' ? 760 : window.innerHeight - 70);
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [heartBurstId, setHeartBurstId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeReel, setActiveReel] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [uploadState, setUploadState] = useState({ mediaUrl: '', uploading: false, content: '' });
  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = Math.max(1, Number(deviceProfile.videoPreloadRange || 2));
  const itemHeight = Math.max(620, viewportHeight);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight - 70);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadReels = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getPosts({ limit: 40, page: 1 });
      const source = Array.isArray(data) ? data : data?.items || [];
      const onlyVideos = source
        .filter((post) => isVideoUrl(post?.media_url || post?.video_url || ''))
        .map((item) => ({
          ...item,
          media_url: item.media_url || item.video_url,
          recommendation_score: computeReelScore(item),
          views_count: Number(item.views_count || item.view_count || 0),
          poster_url: getPosterUrl(item),
          duration_label: item.duration_label || item.duration || '',
        }));
      const rankedReels = await fetchSuggestedReels(onlyVideos);
      setReels(rankedReels);
      setActiveIndex((prev) => Math.min(prev, Math.max(0, rankedReels.length - 1)));
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: error?.response?.data?.detail || error?.message });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  useEffect(() => {
    preloadNodesRef.current.forEach((node) => node.remove?.());
    preloadNodesRef.current = [];

    const nextItems = reels.slice(activeIndex + 1, activeIndex + 3);
    nextItems.forEach((reel) => {
      const href = getAdaptiveVideoSrc(reel, deviceProfile, false);
      if (!href) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = href;
      document.head.appendChild(link);
      preloadNodesRef.current.push(link);
    });

    return () => {
      preloadNodesRef.current.forEach((node) => node.remove?.());
      preloadNodesRef.current = [];
    };
  }, [activeIndex, deviceProfile, reels]);

  const visibleRange = useMemo(() => {
    if (!reels.length) return { start: 0, end: 0 };
    const start = Math.max(0, activeIndex - preloadRange);
    const end = Math.min(reels.length - 1, activeIndex + preloadRange);
    return { start, end };
  }, [activeIndex, reels.length, preloadRange]);

  const renderedReels = useMemo(() => {
    const overscan = deviceProfile.isLowEndDevice ? 0 : 1;
    return reels
      .map((reel, index) => ({ reel, index }))
      .filter(({ index }) => index >= Math.max(0, visibleRange.start - overscan) && index <= Math.min(reels.length - 1, visibleRange.end + overscan));
  }, [deviceProfile.isLowEndDevice, reels, visibleRange.end, visibleRange.start]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const reel = reels[index];
      if (!reel) return;
      const shouldKeepLoaded = Math.abs(index - activeIndex) <= preloadRange;
      const nextSrc = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
      if (shouldKeepLoaded) {
        if (video.dataset.src !== nextSrc) {
          video.dataset.src = nextSrc;
        }
        if (video.getAttribute('src') !== nextSrc) {
          video.src = nextSrc;
          video.load();
        }
        video.preload = index === activeIndex ? 'auto' : 'metadata';
        video.muted = index !== activeIndex;
        video.playsInline = true;
        if (index === activeIndex) {
          video.play?.().catch(() => null);
        } else {
          video.pause?.();
        }
      } else {
        video.pause?.();
        if (video.getAttribute('src')) {
          video.removeAttribute('src');
          video.load();
        }
        video.preload = 'none';
      }
    });

    const activeReelItem = reels[activeIndex];
    if (!activeReelItem) return undefined;
    const timerKey = String(activeReelItem.id);
    if (viewTimersRef.current.has(timerKey)) window.clearTimeout(viewTimersRef.current.get(timerKey));
    const timer = window.setTimeout(() => {
      setReels((prev) => prev.map((item, index) => index === activeIndex ? { ...item, views_count: Number(item.views_count || 0) + 1 } : item));
    }, deviceProfile.isLowEndDevice ? 2300 : 1800);
    viewTimersRef.current.set(timerKey, timer);
    return () => window.clearTimeout(timer);
  }, [activeIndex, deviceProfile, preloadRange, reels]);

  useEffect(() => () => {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    viewTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    preloadNodesRef.current.forEach((node) => node.remove?.());
  }, []);

  const setVideoRef = (index, node) => {
    if (!node) {
      videoRefs.current.delete(index);
      return;
    }
    const reel = reels[index];
    const shouldKeepLoaded = Math.abs(index - activeIndex) <= preloadRange;
    if (reel && shouldKeepLoaded) {
      const src = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
      node.dataset.src = src;
      if (!node.getAttribute('src')) node.src = src;
    }
    videoRefs.current.set(index, node);
  };

  const refreshComments = async (postId) => {
    const { data } = await getComments(postId);
    setActiveComments(Array.isArray(data) ? data : data?.items || []);
  };

  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      await refreshComments(reel.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: error?.response?.data?.detail || error?.message });
    }
  };

  const updateReel = (reelId, patch) => {
    setReels((prev) => prev.map((item) => item.id === reelId ? { ...item, ...patch } : item));
  };

  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      window.setTimeout(() => setHeartBurstId(''), 650);
    }
    try {
      setBusyId(`like-${reel.id}`);
      const { data } = await likePost(reel.id);
      updateReel(reel.id, {
        is_liked: Boolean(data?.liked ?? !reel.is_liked),
        likes_count: Number(data?.likes_count ?? data?.likes ?? (reel.likes_count || 0) + (reel.is_liked ? -1 : 1)),
      });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تنفيذ اللايك', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleSave = async (reel) => {
    try {
      setBusyId(`save-${reel.id}`);
      await savePost(reel.id);
      updateReel(reel.id, { is_saved: !reel.is_saved, saved_count: Number(reel.saved_count || 0) + (reel.is_saved ? -1 : 1) });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حفظ الريل', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleShare = async (reel) => {
    try {
      setBusyId(`share-${reel.id}`);
      await navigator.clipboard.writeText(`${window.location.origin}/post/${reel.id}`);
      await sharePost(reel.id, 'copy');
      updateReel(reel.id, { share_count: Number(reel.share_count || 0) + 1 });
      pushToast({ type: 'success', title: 'تم نسخ رابط الريل' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر مشاركة الريل', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleFollow = async (reel) => {
    try {
      setBusyId(`follow-${reel.id}`);
      const { data } = await followUser(reel.username);
      updateReel(reel.id, { following: Boolean(data?.following) });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث المتابعة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleAddComment = async ({ content, parentId = null }) => {
    if (!activeReel || !content?.trim()) return;
    try {
      setBusyId(`comment-${activeReel.id}`);
      const { data } = await addComment(activeReel.id, content.trim(), parentId);
      const nextComment = data || { id: Date.now(), username: currentUser, content, parent_id: parentId, created_at: new Date().toISOString(), reactions: {} };
      setActiveComments((prev) => [...prev, nextComment]);
      updateReel(activeReel.id, { comments_count: Number(activeReel.comments_count || 0) + 1 });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleScroll = (event) => {
    const top = event.currentTarget.scrollTop;
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      const nextIndex = Math.round(top / itemHeight);
      setActiveIndex(Math.max(0, Math.min(reels.length - 1, nextIndex)));
    });
  };

  const currentReel = reels[activeIndex];

  return (
    <MainLayout>
      <div style={{ height: 'calc(100vh - 60px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={() => setShowUploadModal(true)}>رفع ريل</Button>
          <Button variant="secondary" onClick={loadReels} loading={isLoading}>تحديث</Button>
          <span className="reels-info-chip">سحب أنعم</span>
          <span className="reels-info-chip">preload مجاور</span>
          <span className="reels-info-chip">FPS friendly</span>
          <span className="reels-info-chip">adaptive {deviceProfile.preferredVideoQuality}</span>
          <span className="reels-info-chip">{deviceProfile.isLowEndDevice ? 'وضع خفيف للجوال' : 'وضع عادي'}</span>
        </div>

        {currentReel ? (
          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 20, display: 'grid', gap: 8, justifyItems: 'end' }}>
            <span className="reels-status-pill">{buffering ? 'جارٍ التحميل...' : 'تشغيل سلس'}</span>
            <span className="reels-status-pill">{Math.round(playbackProgress)}%</span>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
          className="reels-scroll-container"
        >
          {isLoading && reels.length === 0 ? <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'white' }}>جارٍ تحميل الريلز...</div> : null}
          {!isLoading && reels.length === 0 ? <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'white' }}>لا يوجد ريلز حالياً</div> : null}
          <div style={{ height: `${Math.max(reels.length, 1) * itemHeight}px`, position: 'relative' }}>
            {renderedReels.map(({ reel, index }) => {
              const ownReel = reel.username === currentUser;
              const isActive = index === activeIndex;
              const isNear = Math.abs(index - activeIndex) <= preloadRange;
              const adaptiveSrc = getAdaptiveVideoSrc(reel, deviceProfile, isActive);
              return (
                <div
                  key={reel.id}
                  style={{
                    position: 'absolute',
                    insetInline: 0,
                    top: index * itemHeight,
                    height: itemHeight,
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {isNear ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }} onDoubleClick={() => handleLike(reel, { burst: true })}>
                      <video
                        ref={(node) => setVideoRef(index, node)}
                        src={adaptiveSrc}
                        loop
                        controls={isActive}
                        muted={!isActive}
                        playsInline
                        preload={isActive ? 'auto' : 'metadata'}
                        poster={reel.poster_url || ''}
                        disablePictureInPicture={deviceProfile.isLowEndDevice}
                        onWaiting={() => isActive && setBuffering(true)}
                        onPlaying={() => isActive && setBuffering(false)}
                        onTimeUpdate={(event) => {
                          if (!isActive) return;
                          const duration = event.currentTarget.duration || 0;
                          const current = event.currentTarget.currentTime || 0;
                          setPlaybackProgress(duration ? (current / duration) * 100 : 0);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: itemHeight, willChange: 'transform, opacity' }}
                      />
                      <div className={`reel-heart-burst ${heartBurstId === String(reel.id) ? 'visible' : ''}`}>❤️</div>
                      <div className="reel-surface-glow" />
                    </div>
                  ) : reel.poster_url ? (
                    <img
                      src={reel.poster_url}
                      alt={reel.content || 'reel preview'}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)', background: 'radial-gradient(circle at top, rgba(59,130,246,0.26), rgba(0,0,0,1))' }}>
                      تحميل عند الاقتراب للحفاظ على الذاكرة
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="reels-info-chip">👁️ {reel.views_count || 0}</span>
                    <span className="reels-info-chip">⚡ {Math.round(reel.ranking_score || reel.recommendation_score || 0)}</span>
                    <span className="reels-info-chip">{reel.trending_badge || 'Suggested'}</span>
                    <span className="reels-info-chip">{reel.media_url?.endsWith('.m3u8') ? 'HLS' : 'MP4/WebM'}</span>
                    <span className="reels-info-chip">{isNear ? 'loaded' : 'lazy'}</span>
                  </div>

                  <div style={{ position: 'absolute', right: 16, bottom: 110, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', zIndex: 10 }}>
                    <div style={{ width: 54, height: 54, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', marginBottom: 2, boxShadow: '0 16px 30px rgba(0,0,0,0.25)' }}>
                      <img src={reel.avatar || `https://ui-avatars.com/api/?name=${reel.username}`} alt="User" loading="lazy" decoding="async" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <button type="button" className="reel-action-btn" onClick={() => handleLike(reel)} disabled={busyId === `like-${reel.id}`}>{reel.is_liked ? '❤️' : '🤍'}</button>
                    <div style={{ color: 'white', fontSize: 12 }}>{reel.likes_count || 0}</div>
                    <button type="button" className="reel-action-btn" onClick={() => openComments(reel)}>💬</button>
                    <div style={{ color: 'white', fontSize: 12 }}>{reel.comments_count || 0}</div>
                    <button type="button" className="reel-action-btn" onClick={() => handleSave(reel)} disabled={busyId === `save-${reel.id}`}>{reel.is_saved ? '🔖' : '📑'}</button>
                    <button type="button" className="reel-action-btn" onClick={() => handleShare(reel)} disabled={busyId === `share-${reel.id}`}>📤</button>
                    {!ownReel ? <button type="button" className="reel-action-btn" onClick={() => handleFollow(reel)} disabled={busyId === `follow-${reel.id}`}>{reel.following ? '✓' : '➕'}</button> : null}
                  </div>

                  <div style={{ position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, padding: '60px 20px 26px', zIndex: 10, color: 'white', background: 'linear-gradient(transparent, rgba(0,0,0,0.88))' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      @{reel.username}
                      {!ownReel ? (
                        <button type="button" onClick={() => handleFollow(reel)} className="reel-follow-btn">
                          {reel.following ? 'إلغاء المتابعة' : 'متابعة'}
                        </button>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.94, maxWidth: '80%', marginBottom: 8, lineHeight: 1.7 }}>{reel.content || 'بدون وصف'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span className="reels-info-chip">scroll snap</span>
                      <span className="reels-info-chip">requestAnimationFrame</span>
                      <span className="reels-info-chip">nearby preload</span>
                      <span className="reels-info-chip">memory cleanup</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="رفع ريل جديد">
        <div style={{ display: 'grid', gap: 14 }}>
          <textarea value={uploadState.content} onChange={(event) => setUploadState((prev) => ({ ...prev, content: event.target.value }))} rows={4} placeholder="اكتب وصف الريل" style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <VideoUploader
            label="رفع فيديو الريلز"
            onUploadComplete={({ url }) => setUploadState((prev) => ({ ...prev, mediaUrl: url }))}
            onError={(message) => pushToast({ type: 'error', title: 'تعذر رفع الفيديو', description: message })}
          />
          <Button
            loading={uploadState.uploading}
            disabled={!uploadState.mediaUrl}
            onClick={async () => {
              try {
                setUploadState((prev) => ({ ...prev, uploading: true }));
                await createPost({ content: uploadState.content || 'ريل جديد', media_url: uploadState.mediaUrl });
                setShowUploadModal(false);
                setUploadState({ mediaUrl: '', uploading: false, content: '' });
                await loadReels();
              } catch (error) {
                pushToast({ type: 'error', title: 'تعذر نشر الريل', description: error?.response?.data?.detail || error?.message });
                setUploadState((prev) => ({ ...prev, uploading: false }));
              }
            }}
          >نشر الريل</Button>
        </div>
      </Modal>

      <Modal open={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="تعليقات الريل" size="large">
        <NestedComments
          comments={activeComments}
          onAddComment={handleAddComment}
          onReply={(parentId, content) => handleAddComment({ content, parentId })}
          onToggleReaction={(commentId, emoji) => setActiveComments((prev) => prev.map((item) => String(item.id) === String(commentId) ? { ...item, reactions: { ...(item.reactions || {}), [emoji]: Number(item.reactions?.[emoji] || 0) + 1 } } : item))}
        />
      </Modal>

      <style>{`
        .reels-scroll-container::-webkit-scrollbar { display: none; }
        .reel-action-btn {
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.12);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: white;
          font-size: 22px;
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 32px rgba(0,0,0,0.24);
        }
        .reel-action-btn:hover {
          transform: translateY(-2px) scale(1.04);
          background: rgba(255,255,255,0.24);
          box-shadow: 0 18px 36px rgba(0,0,0,0.3);
        }
        .reels-info-chip,
        .reels-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          color: white;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }
        .reels-status-pill {
          justify-content: center;
          min-width: 102px;
        }
        .reel-follow-btn {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          cursor: pointer;
          transition: background 180ms ease, transform 180ms ease;
        }
        .reel-follow-btn:hover {
          background: rgba(255,255,255,0.22);
          transform: translateY(-1px);
        }
        .reel-heart-burst {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-size: 88px;
          opacity: 0;
          transform: scale(0.6);
          pointer-events: none;
        }
        .reel-heart-burst.visible {
          animation: reelHeartPop 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reel-surface-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 100%, rgba(59,130,246,0.12), transparent 42%);
        }
        @keyframes reelHeartPop {
          0% { opacity: 0; transform: scale(0.5); }
          25% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.3); }
        }
        @media (max-width: 768px) {
          .reel-action-btn {
            width: 42px;
            height: 42px;
            font-size: 20px;
          }
        }
      `}</style>
    </MainLayout>
  );
}
