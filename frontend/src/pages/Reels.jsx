import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import VideoUploader from '../components/upload/VideoUploader.jsx';
import NestedComments from '../components/feed/NestedComments.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, createPost, getComments, getPosts, likePost, savePost, sharePost } from '../api/posts.js';
import { getCurrentUsername } from '../utils/auth.js';
import { appendVideoQuality, getDeviceProfile } from '../utils/deviceProfile.js';
import { getOptimizedImageUrl } from '../utils/performance.js';
import { isVideoMediaUrl } from '../utils/mediaType.js';
import { fetchSuggestedReels } from '../services/recommendationService.js';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function computeReelScore(item) {
  const likes = Number(item.likes_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const saves = Number(item.saved_count || 0);
  const freshnessHours = Math.max(1, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 36e5);
  return likes * 2 + comments * 3 + shares * 4 + saves * 4 + 96 / freshnessHours;
}

function isVideoUrl(url = '') {
  return isVideoMediaUrl(url);
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

const ReelItem = ({ index, style, data }) => {
  const {
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    currentUser,
    scrollToIndex,
    isDesktop,
  } = data;

  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = useRef(null);

  useEffect(() => {
    setVideoRef(index, videoRef.current);
    return () => setVideoRef(index, null);
  }, [index, setVideoRef]);

  if (!reel) return null;

  return (
    <div style={style} className="reel-container">
      <div className="reel-card relative bg-black overflow-hidden h-full w-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={!isActive}
          poster={getPosterUrl(reel)}
          onClick={() => {
            if (!videoRef.current) return;
            if (videoRef.current.paused) videoRef.current.play().catch(() => {});
            else videoRef.current.pause();
          }}
          onDoubleClick={() => handleLike(reel, { burst: true })}
        />

        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 text-white pointer-events-none">
          <div className="flex items-center justify-between gap-3 pointer-events-auto">
            <div>
              <div className="reel-chip">الريلز</div>
              <p className="reel-hint">{isDesktop ? 'تنقل بالأسهم ↑ ↓' : 'تنقل بالسحب العمودي'}</p>
            </div>
            <div className="reel-count-pill">{index + 1} / {reels.length}</div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent text-white pointer-events-none">
          <div className="flex items-center gap-3 mb-2 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20">
              <img src={getOptimizedImageUrl(reel.user_avatar, 80)} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm">@{reel.username || 'user'}</span>
            {reel.username !== currentUser ? (
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">متابعة</button>
            ) : null}
          </div>
          <p className="text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto">{reel.content || 'ريل جديد'}</p>
          <div className="flex items-center gap-2 text-xs text-white/80 pointer-events-auto">
            {reel.duration_label ? <span className="reel-chip ghost">{reel.duration_label}</span> : null}
            <span className="reel-chip ghost">👁 {Number(reel.views_count || 0)}</span>
          </div>
        </div>

        <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-20">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleLike(reel)}
              className={`reel-action-btn ${reel.is_liked ? 'liked' : ''}`}
            >
              ❤️
            </button>
            <span className="reel-action-label">{reel.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => openComments(reel)} className="reel-action-btn">💬</button>
            <span className="reel-action-label">{reel.comments_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => handleSave(reel)} className={`reel-action-btn ${reel.is_saved ? 'saved' : ''}`}>🔖</button>
            <span className="reel-action-label">حفظ</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => handleShare(reel)} className="reel-action-btn">↗</button>
            <span className="reel-action-label">مشاركة</span>
          </div>
        </div>

        {isDesktop ? (
          <>
            <button type="button" className="reel-arrow reel-arrow-up" onClick={() => scrollToIndex(index - 1)} disabled={index === 0}>↑</button>
            <button type="button" className="reel-arrow reel-arrow-down" onClick={() => scrollToIndex(index + 1)} disabled={index >= reels.length - 1}>↓</button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const listRef = useRef(null);
  const videoRefs = useRef(new Map());
  const viewTimersRef = useRef(new Map());
  const preloadNodesRef = useRef([]);
  const viewedReelsRef = useRef(new Set());
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heartBurstId, setHeartBurstId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeReel, setActiveReel] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [uploadState, setUploadState] = useState({ mediaUrl: '', previewUrl: '', uploading: false, publishing: false, content: '', fileName: '' });

  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.isLowEndDevice ? 1 : 2;
  const isDesktop = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches, []);

  const resetUploadState = useCallback(() => {
    setUploadState({ mediaUrl: '', previewUrl: '', uploading: false, publishing: false, content: '', fileName: '' });
  }, []);

  const scrollToIndex = useCallback((nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, reels.length - 1));
    if (!Number.isFinite(bounded)) return;
    setActiveIndex(bounded);
    listRef.current?.scrollToItem?.(bounded, 'start');
  }, [reels.length]);

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
      setReels(Array.isArray(rankedReels) ? rankedReels : onlyVideos);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: error?.message });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upload') === '1') {
      setShowUploadModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    preloadNodesRef.current.forEach((node) => node.remove?.());
    preloadNodesRef.current = [];

    const nextItems = reels.slice(activeIndex + 1, activeIndex + 1 + preloadRange);
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
    };
  }, [activeIndex, deviceProfile, reels, preloadRange]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const isPreload = Math.abs(index - activeIndex) <= preloadRange;
      const reel = reels[index];

      if (!isPreload) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.preload = 'none';
        return;
      }

      if (!reel) return;
      const src = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
      if (video.src !== src) {
        video.src = src;
        video.load();
      }
      video.preload = index === activeIndex ? 'auto' : 'metadata';
      if (index === activeIndex) video.play().catch(() => {});
      else video.pause();
    });

    const activeReelItem = reels[activeIndex];
    if (activeReelItem) {
      const timerKey = String(activeReelItem.id);
      if (viewTimersRef.current.has(timerKey)) clearTimeout(viewTimersRef.current.get(timerKey));
      if (!viewedReelsRef.current.has(timerKey)) {
        const timer = setTimeout(() => {
          viewedReelsRef.current.add(timerKey);
        }, 2000);
        viewTimersRef.current.set(timerKey, timer);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, reels, deviceProfile, preloadRange]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isDesktop) return;
      if (showUploadModal || showCommentsModal) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
      if (event.key.toLowerCase() === 'u') {
        event.preventDefault();
        setShowUploadModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isDesktop, scrollToIndex, showCommentsModal, showUploadModal]);

  const setVideoRef = useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);

  const handleScroll = useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex) setActiveIndex(startIndex);
  }, [activeIndex]);

  const handleWheelNavigation = useCallback((event) => {
    if (showUploadModal || showCommentsModal || wheelLockRef.current) return;
    if (Math.abs(event.deltaY) < 18) return;
    wheelLockRef.current = true;
    scrollToIndex(activeIndex + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 420);
  }, [activeIndex, scrollToIndex, showCommentsModal, showUploadModal]);

  const handleTouchStart = useCallback((event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY || 0;
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (showUploadModal || showCommentsModal) return;
    const endY = event.changedTouches?.[0]?.clientY || 0;
    const diff = touchStartYRef.current - endY;
    if (Math.abs(diff) < 50) return;
    scrollToIndex(activeIndex + (diff > 0 ? 1 : -1));
  }, [activeIndex, scrollToIndex, showCommentsModal, showUploadModal]);

  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(''), 650);
    }

    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: !item.is_liked,
      likes_count: item.is_liked ? Number(item.likes_count || 0) - 1 : Number(item.likes_count || 0) + 1,
    } : item));

    try {
      await likePost(reel.id);
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب' });
    }
  };

  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_saved: !item.is_saved,
      saved_count: item.is_saved ? Math.max(0, Number(item.saved_count || 0) - 1) : Number(item.saved_count || 0) + 1,
    } : item));
    try {
      await savePost(reel.id);
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر حفظ الريل' });
    }
  };

  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
      await sharePost(reel.id, 'copy');
      setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, share_count: Number(item.share_count || 0) + 1 } : item));
      pushToast({ type: 'success', title: 'تم نسخ رابط الريل' });
    } catch {
      pushToast({ type: 'warning', title: 'تعذر نسخ الرابط' });
    }
  };

  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      const { data } = await getComments(reel.id);
      setActiveComments(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setActiveComments([]);
    }
  };

  const publishReel = async () => {
    if (!uploadState.mediaUrl) {
      pushToast({ type: 'warning', title: 'ارفع فيديو أولاً' });
      return;
    }
    try {
      setUploadState((prev) => ({ ...prev, publishing: true }));
      await createPost({
        content: uploadState.content?.trim() || 'ريل جديد',
        media_url: uploadState.mediaUrl,
        media: uploadState.mediaUrl,
        media_urls: [uploadState.mediaUrl],
      });
      setShowUploadModal(false);
      resetUploadState();
      navigate('/reels', { replace: true });
      await loadReels();
      pushToast({ type: 'success', title: 'تم نشر الريل بنجاح' });
    } catch (error) {
      setUploadState((prev) => ({ ...prev, publishing: false }));
      pushToast({ type: 'error', title: 'فشل نشر الريل', description: error?.response?.data?.detail || error?.message });
    }
  };

  const listData = useMemo(() => ({
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    currentUser,
    scrollToIndex,
    isDesktop,
  }), [reels, activeIndex, setVideoRef, currentUser, scrollToIndex, isDesktop]);

  const closeUploadModal = () => {
    setShowUploadModal(false);
    navigate('/reels', { replace: true });
  };

  return (
    <MainLayout hideNav>
      <div
        className="reels-page-shell"
        onWheelCapture={handleWheelNavigation}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="reels-header-bar">
          <div>
            <h1>الريلز</h1>
            <p>{isDesktop ? 'استخدم الأسهم للتنقل بين الفيديوهات' : 'مرر لأعلى وأسفل للتنقل بين الفيديوهات'}</p>
          </div>
          <button type="button" className="upload-reel-button" onClick={() => setShowUploadModal(true)}>
            ⬆ رفع ريل
          </button>
        </div>

        <div className="reels-stage-shell">
          {isLoading ? (
            <div className="reels-loading-state">
              <div className="reel-loader" />
              <p>جارٍ تحميل الريلز...</p>
            </div>
          ) : reels.length ? (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={reels.length}
                  itemSize={height}
                  onItemsRendered={({ visibleStartIndex }) => handleScroll({ startIndex: visibleStartIndex })}
                  itemData={listData}
                  className="no-scrollbar"
                >
                  {ReelItem}
                </List>
              )}
            </AutoSizer>
          ) : (
            <div className="reels-empty-state">
              <div className="empty-icon">🎬</div>
              <h2>مافيش ريلز لسه</h2>
              <p>اضغط على زر رفع ريل وأضف أول فيديو بشكل واضح ومباشر.</p>
              <Button onClick={() => setShowUploadModal(true)}>رفع أول ريل</Button>
            </div>
          )}
        </div>

        {heartBurstId ? <div className="reel-heart-burst">❤️</div> : null}

        <Modal isOpen={showUploadModal} onClose={closeUploadModal} title="إضافة ريل جديد">
          <div className="upload-modal-layout">
            <div className="upload-modal-help">
              <strong>الخطوة 1</strong>
              <p>اختر فيديو واضح للريل</p>
              <strong>الخطوة 2</strong>
              <p>بعد اكتمال الرفع سيظهر لك مشغل فيديو للمعاينة</p>
              <strong>الخطوة 3</strong>
              <p>اضغط زر نشر الريل</p>
            </div>

            <textarea
              value={uploadState.content}
              onChange={(event) => setUploadState((prev) => ({ ...prev, content: event.target.value }))}
              rows={4}
              placeholder="اكتب وصف الريل أو الكابشن"
              className="upload-caption-field"
            />

            <VideoUploader
              label="رفع فيديو الريل"
              onUploadComplete={({ url, previewUrl, file }) => {
                setUploadState((prev) => ({
                  ...prev,
                  mediaUrl: url || '',
                  previewUrl: previewUrl || '',
                  fileName: file?.name || '',
                  uploading: false,
                }));
                pushToast({ type: 'success', title: 'تم رفع الفيديو', description: 'راجع المعاينة ثم اضغط نشر الريل.' });
              }}
              onError={(message) => pushToast({ type: 'error', title: 'فشل رفع الفيديو', description: message })}
            />

            {uploadState.mediaUrl ? (
              <div className="uploaded-preview-shell">
                <div className="uploaded-preview-head">
                  <strong>معاينة الريل</strong>
                  <span>{uploadState.fileName || 'video.mp4'}</span>
                </div>
                <video src={uploadState.mediaUrl} controls playsInline className="uploaded-preview-video" />
              </div>
            ) : null}

            <div className="upload-modal-actions">
              <Button variant="secondary" onClick={closeUploadModal}>إغلاق</Button>
              <Button onClick={publishReel} loading={uploadState.publishing} disabled={!uploadState.mediaUrl || uploadState.publishing}>
                نشر الريل الآن
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="التعليقات">
          <div className="comments-modal-shell">
            <NestedComments
              comments={activeComments}
              onAddComment={async (content) => {
                const { data } = await addComment(activeReel.id, content);
                setActiveComments((prev) => [data, ...prev]);
              }}
            />
          </div>
        </Modal>

        <style>{`
          .reels-page-shell {
            position: relative;
            min-height: 100vh;
            height: 100vh;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .reels-header-bar {
            position: absolute;
            inset-inline: 0;
            top: 0;
            z-index: 30;
            padding: 18px 18px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0));
          }
          .reels-header-bar h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 900;
          }
          .reels-header-bar p {
            margin: 4px 0 0;
            color: rgba(255,255,255,0.76);
            font-size: 13px;
          }
          .upload-reel-button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            font-weight: 900;
            cursor: pointer;
            box-shadow: 0 18px 36px rgba(59,130,246,0.24);
          }
          .reels-stage-shell {
            flex: 1;
            height: 100%;
          }
          .reels-loading-state,
          .reels-empty-state {
            height: 100%;
            display: grid;
            place-items: center;
            text-align: center;
            gap: 12px;
            padding: 24px;
          }
          .reel-loader {
            width: 54px;
            height: 54px;
            border-radius: 999px;
            border: 4px solid rgba(255,255,255,0.16);
            border-top-color: #8b5cf6;
            animation: reelSpin 0.9s linear infinite;
          }
          .reels-empty-state .empty-icon {
            width: 84px;
            height: 84px;
            border-radius: 26px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.06);
            font-size: 34px;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .reel-container { scroll-snap-align: start; }
          .reel-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }
          .reel-chip.ghost {
            background: rgba(15,23,42,0.58);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .reel-hint {
            margin: 8px 0 0;
            color: rgba(255,255,255,0.78);
            font-size: 12px;
          }
          .reel-count-pill {
            border-radius: 999px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-action-btn {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.12);
            color: #fff;
            font-size: 24px;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease;
          }
          .reel-action-btn:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.18);
          }
          .reel-action-btn.liked {
            background: rgba(239,68,68,0.22);
            color: #fecaca;
          }
          .reel-action-btn.saved {
            background: rgba(245,158,11,0.22);
            color: #fde68a;
          }
          .reel-action-label {
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
          }
          .reel-arrow {
            position: absolute;
            left: 24px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.34);
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 20;
          }
          .reel-arrow:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .reel-arrow-up { top: 50%; transform: translateY(-68px); }
          .reel-arrow-down { top: 50%; transform: translateY(16px); }
          .reel-heart-burst {
            position: absolute;
            inset: 0;
            z-index: 35;
            display: grid;
            place-items: center;
            font-size: 84px;
            pointer-events: none;
            animation: heartBurst 0.65s ease-out forwards;
          }
          .upload-modal-layout,
          .comments-modal-shell {
            display: grid;
            gap: 14px;
          }
          .upload-modal-help {
            display: grid;
            gap: 6px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #cbd5e1;
          }
          .upload-modal-help strong {
            color: #fff;
          }
          .upload-modal-help p {
            margin: 0;
            font-size: 13px;
          }
          .upload-caption-field {
            width: 100%;
            border-radius: 16px;
            padding: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            resize: vertical;
          }
          .uploaded-preview-shell {
            display: grid;
            gap: 10px;
            padding: 14px;
            border-radius: 16px;
            background: rgba(15,23,42,0.62);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .uploaded-preview-head {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            color: #fff;
            font-size: 13px;
          }
          .uploaded-preview-video {
            width: 100%;
            max-height: 320px;
            border-radius: 14px;
            background: #000;
          }
          .upload-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }
          @keyframes reelSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes heartBurst {
            0% { opacity: 0; transform: scale(0.4); }
            45% { opacity: 1; transform: scale(1.08); }
            100% { opacity: 0; transform: scale(1.35); }
          }
          @media (max-width: 1023px) {
            .reels-header-bar {
              padding: 14px 14px 12px;
            }
            .reels-header-bar h1 {
              font-size: 20px;
            }
            .upload-reel-button {
              padding: 10px 14px;
              font-size: 14px;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
