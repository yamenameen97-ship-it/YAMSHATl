import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import VideoUploader from '../components/upload/VideoUploader.jsx';
import NestedComments from '../components/feed/NestedComments.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, getComments, getPosts } from '../api/posts.js';
import API from '../api/axios.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import { getCurrentUsername } from '../utils/auth.js';
import { getDeviceProfile } from '../utils/deviceProfile.js';
import { getOptimizedImageUrl } from '../utils/performance.js';
import { fetchSuggestedReels } from '../services/recommendationService.js';
import {
  buildAdaptiveSource,
  computeAutoQuality,
  formatWatchPercentage,
  getReelInsightsById,
  getReelsCache,
  getWatchHistory,
  preloadPoster,
  primeVideo,
  saveReelsCache,
  saveWatchHistoryEntry,
  submitModerationReport,
  trackReelAnalytics,
} from '../services/reelsEngine.js';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import UniversalPlayer from '../components/video/UniversalPlayer.jsx';

function computeReelScore(item) {
  const likes = Number(item.likes_count || 0);
  const comments = Number(item.comments_count || 0);
  const shares = Number(item.share_count || 0);
  const saves = Number(item.saved_count || 0);
  const freshnessHours = Math.max(1, (Date.now() - new Date(item.created_at || Date.now()).getTime()) / 36e5);
  return likes * 2 + comments * 3 + shares * 4 + saves * 4 + 96 / freshnessHours;
}

function isVideoUrl(url = '', hints = {}) {
  const candidate = String(url || '');
  if (hints.forceVideo) return true;
  return /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate);
}

function getPosterUrl(reel) {
  const source = reel.thumbnail_url || reel.image_url || reel.preview_url || '';
  return source ? getOptimizedImageUrl(source, 720, 74) : '';
}

function normalizeReel(item = {}) {
  return {
    ...item,
    media_url: resolveMediaUrl(item.media_url || item.video_url || item.videoUrl || ''),
    recommendation_score: item.recommendation_score || computeReelScore(item),
    views_count: Number(item.views_count || item.view_count || 0),
    likes_count: Number(item.likes_count || 0),
    comments_count: Number(item.comments_count || 0),
    share_count: Number(item.share_count || 0),
    saved_count: Number(item.saved_count || 0),
    poster_url: resolveMediaUrl(item.poster_url || getPosterUrl(item)),
    duration_label: item.duration_label || item.duration || '',
  };
}

function dataUrlToFile(dataUrl = '', fileName = 'thumbnail.jpg') {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  const [meta, content] = dataUrl.split(',');
  if (!meta || !content) return null;
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'تلقائي' },
  { value: 'high', label: 'عالي' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'موفر' },
];

const REPORT_OPTIONS = [
  { value: 'spam', label: 'سبام' },
  { value: 'nudity', label: 'محتوى غير مناسب' },
  { value: 'violence', label: 'عنف' },
  { value: 'copyright', label: 'حقوق ملكية' },
  { value: 'other', label: 'سبب آخر' },
];

function ReelItem({ index, style, data }) {
  const {
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    handleReport,
    handleFollow,
    followingUsers,
    currentUser,
    scrollToIndex,
    isDesktop,
    isBuffering,
    bufferPercent,
    selectedQuality,
    activeQuality,
    watchHistoryMap,
    onVideoWaiting,
    onVideoCanPlay,
    onVideoProgress,
    onVideoLoadedMetadata,
    onVideoEnded,
    onVideoError,
    onVideoPlay,
    navDirection,
  } = data;

  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = useRef(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const insights = useMemo(() => (reel ? getReelInsightsById(reel.id) : null), [reel?.id]);
  const watchEntry = reel ? watchHistoryMap[String(reel.id)] : null;

  useEffect(() => {
    setVideoRef(index, videoRef.current);
    return () => setVideoRef(index, null);
  }, [index, setVideoRef]);

  if (!reel) return null;

  return (
    <div style={style} className={`reel-container ${isActive ? 'active' : ''}`}>
      <div className={`reel-card-shell reel-card relative bg-black overflow-hidden h-full w-full ${isActive ? 'active' : ''}`} data-direction={navDirection > 0 ? 'forward' : 'backward'}>
        <video
          ref={videoRef}
          className={`w-full h-full object-cover reel-video ${isActive ? 'active' : ''}`}
          loop
          playsInline
          muted
          autoPlay={isActive}
          preload="metadata"
          poster={reel.poster_url}
          onClick={() => {
            if (!videoRef.current) return;
            if (videoRef.current.paused) videoRef.current.play().catch(() => {});
            else videoRef.current.pause();
          }}
          onPlay={() => onVideoPlay(index)}
          onWaiting={() => onVideoWaiting(index)}
          onCanPlay={() => onVideoCanPlay(index)}
          onProgress={() => onVideoProgress(index)}
          onTimeUpdate={() => {
            if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
            setPlaybackProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
          }}
          onLoadedMetadata={() => onVideoLoadedMetadata(index)}
          onEnded={() => onVideoEnded(index)}
          onError={() => onVideoError(index)}
          onDoubleClick={() => handleLike(reel, { burst: true })}
        />

        <div className="reel-top-overlay absolute inset-x-0 top-0 z-20 px-4 pt-4 pb-10 text-white pointer-events-none">
          <div className="flex items-center justify-between gap-3 pointer-events-auto">
            <div>
              <div className="reel-chip">الريلز</div>
              <p className="reel-hint">{isDesktop ? 'تنقل بالأسهم ↑ ↓' : 'مرر عموديًا أو اسحب للأعلى والأسفل'}</p>
            </div>
            <div className="reel-count-pill">{index + 1} / {reels.length}</div>
          </div>
          <div className="reel-meta-row pointer-events-auto">
            <span className="reel-chip ghost">الجودة: {isActive ? QUALITY_OPTIONS.find((item) => item.value === activeQuality)?.label || activeQuality : 'جاهز'}</span>
            <span className="reel-chip ghost">الوضع: {QUALITY_OPTIONS.find((item) => item.value === selectedQuality)?.label || selectedQuality}</span>
            {watchEntry ? <span className="reel-chip ghost">آخر مشاهدة {formatWatchPercentage(watchEntry.progress || 0)}</span> : null}
          </div>
          {isActive && isBuffering ? (
            <div className="reel-buffer-banner pointer-events-auto">
              <span>جارٍ التحميل الذكي…</span>
              <span>{bufferPercent}%</span>
            </div>
          ) : null}
        </div>

        <div className="reel-bottom-overlay absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
          <div className="flex items-center gap-3 mb-2 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20">
              <img src={getOptimizedImageUrl(reel.user_avatar, 80)} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm">@{reel.username || 'user'}</span>
            {reel.username !== currentUser ? (
              <button type="button" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors" onClick={() => handleFollow(reel.username)}>
                {followingUsers.has(String(reel.username || '')) ? 'تمت المتابعة' : 'متابعة'}
              </button>
            ) : null}
          </div>
          <p className="text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto">{reel.content || 'ريل جديد'}</p>
          <div className="reel-meta-row pointer-events-auto">
            {reel.duration_label ? <span className="reel-chip ghost">{reel.duration_label}</span> : null}
            <span className="reel-chip ghost">👁 {Number(reel.views_count || 0)}</span>
            <span className="reel-chip ghost">⏱ متوسط المشاهدة {Math.round(Number(insights?.avgWatchMs || 0) / 1000)}ث</span>
          </div>
        </div>

        <div className="reel-swipe-indicator" aria-hidden="true">
          <span>︿</span>
          <small>اسحب</small>
          <span>﹀</span>
        </div>

        <div className="reel-actions-stack absolute right-4 bottom-24 flex flex-col gap-4 items-center z-20">
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => handleLike(reel)} className={`reel-action-btn ${reel.is_liked ? 'liked' : ''}`}>❤️</button>
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

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => handleReport(reel)} className="reel-action-btn warn">⚑</button>
            <span className="reel-action-label">بلاغ</span>
          </div>
        </div>

        <div className="reel-progress-rail"><div className="reel-progress-fill" style={{ width: `${Math.max(playbackProgress, 0)}%` }} /></div>

        {isDesktop ? (
          <>
            <button type="button" className="reel-arrow reel-arrow-up" onClick={() => scrollToIndex(index - 1)} disabled={index === 0}>↑</button>
            <button type="button" className="reel-arrow reel-arrow-down" onClick={() => scrollToIndex(index + 1)} disabled={index >= reels.length - 1}>↓</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const listRef = useRef(null);
  const videoRefs = useRef(new Map());
  const viewTimersRef = useRef(new Map());
  const preloadNodesRef = useRef([]);
  const viewedReelsRef = useRef(new Set());
  const gestureRafRef = useRef(0);
  const gestureLockRef = useRef(false);
  const wheelAccumulatorRef = useRef(0);
  const touchStartYRef = useRef(0);
  const activeSessionRef = useRef(null);
  const bufferStartRef = useRef(new Map());
  const bufferCountRef = useRef({});
  const lastInteractionRef = useRef(0);
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
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [activeQuality, setActiveQuality] = useState('high');
  const [navDirection, setNavDirection] = useState(1);
  const [bufferState, setBufferState] = useState({ index: -1, percent: 0, active: false });
  const [reportState, setReportState] = useState({ open: false, reel: null, reason: 'spam', note: '' });
  const [followingUsers, setFollowingUsers] = useState(() => new Set());
  const [watchHistoryMap, setWatchHistoryMap] = useState(() => {
    const items = getWatchHistory();
    return items.reduce((acc, item) => {
      acc[String(item.reelId)] = item;
      return acc;
    }, {});
  });
  const [uploadState, setUploadState] = useState({ mediaUrl: '', previewUrl: '', thumbnailUrl: '', uploading: false, publishing: false, content: '', fileName: '', processedFile: null, originalFile: null });

  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.videoPreloadRange || (deviceProfile.isLowEndDevice ? 1 : 2);
  const isDesktop = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches, []);
  const activeReelItem = reels[activeIndex] || null;
  const activeInsights = activeReelItem ? getReelInsightsById(activeReelItem.id) : null;

  const resetUploadState = useCallback(() => {
    setUploadState({ mediaUrl: '', previewUrl: '', thumbnailUrl: '', uploading: false, publishing: false, content: '', fileName: '', processedFile: null, originalFile: null });
  }, []);

  const hydrateFromCache = useCallback(() => {
    const cached = getReelsCache();
    if (Array.isArray(cached?.items) && cached.items.length) {
      setReels(cached.items.map(normalizeReel));
      setIsLoading(false);
    }
  }, []);

  const finalizeWatchSession = useCallback((reason = 'switch') => {
    const session = activeSessionRef.current;
    if (!session) return;
    const reel = session.reel;
    const video = videoRefs.current.get(session.index);
    const duration = Number(video?.duration || reel?.duration || 0);
    const position = Number(video?.currentTime || 0);
    const watchMs = Math.max(0, Date.now() - session.startedAt);
    const progress = duration > 0 ? Math.min(1, position / duration) : 0;
    const completed = progress >= 0.92 || reason === 'ended';

    if (watchMs >= 600) {
      saveWatchHistoryEntry({
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        position,
        duration,
        progress,
        completed,
        quality: session.quality,
        watchMs,
      });
      setWatchHistoryMap((prev) => ({
        ...prev,
        [String(reel.id)]: {
          reelId: String(reel.id),
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          position,
          duration,
          progress,
          completed,
          quality: session.quality,
          watchMs,
          watchedAt: new Date().toISOString(),
        },
      }));
      trackReelAnalytics('watch_session', {
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        watchMs,
        quality: session.quality,
      });
      if (completed) {
        trackReelAnalytics('completion', {
          reelId: reel.id,
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          quality: session.quality,
        });
      }
    }

    activeSessionRef.current = null;
  }, []);

  const scrollToIndex = useCallback((nextIndex, origin = 'programmatic') => {
    const bounded = Math.max(0, Math.min(nextIndex, reels.length - 1));
    if (!Number.isFinite(bounded) || bounded === activeIndex) return;
    finalizeWatchSession('switch');
    trackReelAnalytics('swipe', {
      reelId: reels[activeIndex]?.id,
      quality: activeQuality,
      origin,
    });
    setNavDirection(bounded > activeIndex ? 1 : -1);
    setActiveIndex(bounded);
    const outer = listRef.current?._outerRef;
    const viewportHeight = outer?.clientHeight || 0;
    if (outer && viewportHeight) {
      outer.scrollTo({ top: viewportHeight * bounded, behavior: 'smooth' });
    } else {
      listRef.current?.scrollToItem?.(bounded, 'start');
    }
    lastInteractionRef.current = Date.now();
  }, [activeIndex, activeQuality, finalizeWatchSession, reels]);

  const queueNavigation = useCallback((direction, origin = 'gesture') => {
    if (gestureLockRef.current) return;
    gestureLockRef.current = true;
    if (gestureRafRef.current) cancelAnimationFrame(gestureRafRef.current);
    gestureRafRef.current = requestAnimationFrame(() => {
      scrollToIndex(activeIndex + direction, origin);
      const cooldown = origin === 'wheel' ? 380 : 260;
      window.setTimeout(() => {
        gestureLockRef.current = false;
      }, cooldown);
    });
  }, [activeIndex, scrollToIndex]);

  const loadReels = useCallback(async () => {
    setIsLoading(true);
    try {
      let data;
      try {
        ({ data } = await API.get('/reels/feed', { params: { limit: 40, offset: 0 } }));
      } catch {
        try {
          ({ data } = await API.get('/reels', { params: { limit: 40, offset: 0 } }));
        } catch {
          const postsResponse = await getPosts({ page: 1, limit: 40 });
          const fallbackItems = Array.isArray(postsResponse?.data)
            ? postsResponse.data
                .filter((post) => isVideoUrl(post?.media_url || post?.image_url || ''))
                .map((post) => ({
                  ...post,
                  video_url: post.media_url || post.image_url || '',
                  media_url: post.media_url || post.image_url || '',
                  thumbnail_url: post.image_url || post.media_url || '',
                  image_url: post.image_url || post.media_url || '',
                }))
            : [];
          data = { items: fallbackItems, reels: fallbackItems };
        }
      }
      const source = Array.isArray(data) ? data : data?.items || data?.reels || [];
      const onlyVideos = source
        .filter((post) => isVideoUrl(post?.media_url || post?.video_url || '', { forceVideo: true }))
        .map(normalizeReel);
      const rankedReels = await fetchSuggestedReels(onlyVideos);
      const normalized = (Array.isArray(rankedReels) ? rankedReels : onlyVideos).map(normalizeReel);
      setReels(normalized);
      saveReelsCache(normalized);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: error?.message });
      hydrateFromCache();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromCache, pushToast]);

  useEffect(() => {
    hydrateFromCache();
    loadReels();
  }, [hydrateFromCache, loadReels]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upload') === '1') {
      setShowUploadModal(true);
    }
    const reelId = params.get('reel');
    if (reelId) {
      const reelIndex = reels.findIndex((item) => String(item.id) === String(reelId));
      if (reelIndex >= 0) {
        setActiveIndex(reelIndex);
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem?.(reelIndex, 'start');
        });
      }
    }
  }, [location.search, reels]);

  useEffect(() => {
    const start = Math.max(0, activeIndex - (navDirection < 0 ? preloadRange : 1));
    const end = Math.min(reels.length, activeIndex + 1 + preloadRange + (navDirection > 0 ? 1 : 0));
    const nextItems = reels.slice(start, end).filter((_, index) => start + index !== activeIndex);
    preloadNodesRef.current.forEach((node) => node?.remove?.());
    preloadNodesRef.current = nextItems
      .map((reel) => {
        preloadPoster(reel.poster_url);
        const quality = computeAutoQuality({
          manualQuality: selectedQuality,
          preferredQuality: deviceProfile.preferredVideoQuality,
          saveData: deviceProfile.saveData,
          effectiveType: deviceProfile.effectiveType,
          bufferEvents: 0,
        });
        return primeVideo(buildAdaptiveSource(reel, quality));
      })
      .filter(Boolean);

    return () => {
      preloadNodesRef.current.forEach((node) => node?.remove?.());
    };
  }, [activeIndex, deviceProfile, navDirection, preloadRange, reels, selectedQuality]);

  useEffect(() => {
    const current = reels[activeIndex];
    const currentKey = String(current?.id || '');

    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const reel = reels[index];
      const inWindow = Math.abs(index - activeIndex) <= preloadRange;
      if (!inWindow || !reel) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.preload = 'none';
        return;
      }

      const bufferEvents = bufferCountRef.current[String(reel.id)] || 0;
      const resolvedQuality = computeAutoQuality({
        manualQuality: selectedQuality,
        preferredQuality: deviceProfile.preferredVideoQuality,
        saveData: deviceProfile.saveData,
        effectiveType: deviceProfile.effectiveType,
        bufferEvents,
      });
      const src = buildAdaptiveSource(reel, resolvedQuality);
      if (index === activeIndex) setActiveQuality(resolvedQuality);
      if (src && video.getAttribute('src') !== src) {
        video.setAttribute('src', src);
        video.load();
      }
      const distance = Math.abs(index - activeIndex);
      video.preload = distance === 0 ? 'auto' : distance === 1 ? 'auto' : 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.autoplay = index === activeIndex;
      if (index === activeIndex) video.play().catch(() => {});
      else video.pause();
    });

    if (current) {
      activeSessionRef.current = {
        reel: current,
        index: activeIndex,
        startedAt: Date.now(),
        quality: computeAutoQuality({
          manualQuality: selectedQuality,
          preferredQuality: deviceProfile.preferredVideoQuality,
          saveData: deviceProfile.saveData,
          effectiveType: deviceProfile.effectiveType,
          bufferEvents: bufferCountRef.current[currentKey] || 0,
        }),
      };
      trackReelAnalytics('impression', {
        reelId: current.id,
        content: current.content,
        username: current.username,
        thumbnail_url: current.poster_url,
      });
      if (viewTimersRef.current.has(currentKey)) clearTimeout(viewTimersRef.current.get(currentKey));
      if (!viewedReelsRef.current.has(currentKey)) {
        const timer = setTimeout(() => {
          viewedReelsRef.current.add(currentKey);
          trackReelAnalytics('qualified_view', {
            reelId: current.id,
            content: current.content,
            username: current.username,
            thumbnail_url: current.poster_url,
            quality: activeSessionRef.current?.quality,
          });
          API.post(`/reels/${encodeURIComponent(current.id)}/view`).catch(() => {});
        }, 2000);
        viewTimersRef.current.set(currentKey, timer);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, deviceProfile, navDirection, preloadRange, reels, selectedQuality]);

  useEffect(() => {
    const handleBeforeUnload = () => finalizeWatchSession('unload');
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      finalizeWatchSession('unmount');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (gestureRafRef.current) cancelAnimationFrame(gestureRafRef.current);
    };
  }, [finalizeWatchSession]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isDesktop || showUploadModal || showCommentsModal || reportState.open) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        queueNavigation(1, 'keyboard');
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        queueNavigation(-1, 'keyboard');
      }
      if (event.key.toLowerCase() === 'u') {
        event.preventDefault();
        setShowUploadModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, queueNavigation, reportState.open, showCommentsModal, showUploadModal]);

  const setVideoRef = useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);

  const handleScroll = useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex && Date.now() - lastInteractionRef.current > 160) {
      finalizeWatchSession('switch');
      setActiveIndex(startIndex);
    }
  }, [activeIndex, finalizeWatchSession]);

  const handleWheelNavigation = useCallback((event) => {
    if (showUploadModal || showCommentsModal || reportState.open) return;
    event.preventDefault();
    wheelAccumulatorRef.current += event.deltaY;
    if (Math.abs(wheelAccumulatorRef.current) < 56) return;
    const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
    wheelAccumulatorRef.current = 0;
    queueNavigation(direction, 'wheel');
  }, [queueNavigation, reportState.open, showCommentsModal, showUploadModal]);

  const handleTouchStart = useCallback((event) => {
    touchStartYRef.current = event.touches?.[0]?.clientY || 0;
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (showUploadModal || showCommentsModal || reportState.open) return;
    const endY = event.changedTouches?.[0]?.clientY || 0;
    const diff = touchStartYRef.current - endY;
    const threshold = Math.max(40, Math.min(window.innerHeight * 0.08, 96));
    if (Math.abs(diff) < threshold) return;
    queueNavigation(diff > 0 ? 1 : -1, 'touch');
  }, [queueNavigation, reportState.open, showCommentsModal, showUploadModal]);

  const handleVideoWaiting = useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    const key = String(reel.id);
    bufferStartRef.current.set(key, Date.now());
    bufferCountRef.current[key] = Number(bufferCountRef.current[key] || 0) + 1;
    setBufferState((prev) => ({ ...prev, active: true, index, percent: Math.max(prev.percent, 18) }));

    const autoQuality = computeAutoQuality({
      manualQuality: selectedQuality,
      preferredQuality: deviceProfile.preferredVideoQuality,
      saveData: deviceProfile.saveData,
      effectiveType: deviceProfile.effectiveType,
      bufferEvents: bufferCountRef.current[key],
    });

    if (selectedQuality === 'auto' && activeIndex === index) {
      setActiveQuality(autoQuality);
      if (bufferCountRef.current[key] >= 2) {
        trackReelAnalytics('auto_quality_downgrade', {
          reelId: reel.id,
          content: reel.content,
          username: reel.username,
          thumbnail_url: reel.poster_url,
          quality: autoQuality,
        });
      }
    }
  }, [activeIndex, deviceProfile, reels, selectedQuality]);

  const handleVideoCanPlay = useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    const key = String(reel.id);
    const startedAt = bufferStartRef.current.get(key);
    const bufferMs = startedAt ? Date.now() - startedAt : 0;
    if (startedAt) {
      trackReelAnalytics('buffer', {
        reelId: reel.id,
        content: reel.content,
        username: reel.username,
        thumbnail_url: reel.poster_url,
        bufferMs,
        quality: activeQuality,
      });
      bufferStartRef.current.delete(key);
    }
    setBufferState({ index, percent: 100, active: false });
  }, [activeQuality, reels]);

  const handleVideoProgress = useCallback((index) => {
    const video = videoRefs.current.get(index);
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (video.buffered?.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      const percent = Math.min(100, Math.round((end / video.duration) * 100));
      if (activeIndex === index) setBufferState((prev) => ({ ...prev, index, percent }));
    }
  }, [activeIndex]);

  const handleVideoLoadedMetadata = useCallback((index) => {
    const video = videoRefs.current.get(index);
    const reel = reels[index];
    if (!video || !reel) return;
    if (!reel.duration_label && Number.isFinite(video.duration) && video.duration > 0) {
      setReels((prev) => prev.map((item, idx) => idx === index ? {
        ...item,
        duration_label: `${Math.round(video.duration)}ث`,
      } : item));
    }
  }, [reels]);

  const handleVideoEnded = useCallback((index) => {
    if (index !== activeIndex) return;
    finalizeWatchSession('ended');
  }, [activeIndex, finalizeWatchSession]);

  const handleVideoError = useCallback((index) => {
    const reel = reels[index];
    if (!reel) return;
    pushToast({ type: 'warning', title: 'تعذر تشغيل الريل', description: 'تم تسجيل الخطأ وسيتم تجربة جودة أخف تلقائيًا.' });
    bufferCountRef.current[String(reel.id)] = Math.max(2, Number(bufferCountRef.current[String(reel.id)] || 0));
    setActiveQuality('low');
  }, [pushToast, reels]);

  const handleVideoPlay = useCallback((index) => {
    const reel = reels[index];
    if (!reel || !activeSessionRef.current || activeSessionRef.current.index !== index) return;
    activeSessionRef.current.quality = activeQuality;
  }, [activeQuality, reels]);

  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(''), 650);
    }

    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: !item.is_liked,
      likes_count: item.is_liked ? Math.max(0, Number(item.likes_count || 0) - 1) : Number(item.likes_count || 0) + 1,
    } : item));

    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/like`);
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب' });
    }
  };

  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: !item.is_saved } : item));
    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/save`);
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر حفظ الريل' });
    }
  };

  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels?reel=${encodeURIComponent(reel.id)}`);
      pushToast({ type: 'success', title: 'تم نسخ رابط الريل' });
    } catch {
      pushToast({ type: 'warning', title: 'تعذر نسخ الرابط' });
    }
  };

  const handleFollow = useCallback((username) => {
    if (!username) return;
    setFollowingUsers((prev) => {
      const next = new Set(prev);
      const key = String(username);
      const isFollowing = next.has(key);
      if (isFollowing) next.delete(key);
      else next.add(key);
      pushToast({
        type: 'success',
        title: isFollowing ? 'تم إلغاء المتابعة' : 'تمت المتابعة',
        description: `@${key}`,
      });
      return next;
    });
  }, [pushToast]);

  const handleReport = useCallback((reel) => {
    setReportState({ open: true, reel, reason: 'spam', note: '' });
  }, []);

  const submitReport = useCallback(() => {
    if (!reportState.reel) return;
    submitModerationReport({
      reelId: reportState.reel.id,
      content: reportState.reel.content,
      username: reportState.reel.username,
      thumbnail_url: reportState.reel.poster_url,
      reason: reportState.reason,
      note: reportState.note,
    });
    pushToast({ type: 'success', title: 'تم إرسال البلاغ للمراجعة' });
    setReportState({ open: false, reel: null, reason: 'spam', note: '' });
  }, [pushToast, reportState]);

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
    if (!uploadState.mediaUrl && !uploadState.processedFile && !uploadState.originalFile) {
      pushToast({ type: 'warning', title: 'ارفع فيديو أولاً' });
      return;
    }

    const caption = uploadState.content?.trim() || 'ريل جديد';
    setUploadState((prev) => ({ ...prev, publishing: true }));

    const tryMultipartFallback = async () => {
      const fallbackFile = uploadState.processedFile || uploadState.originalFile;
      if (!fallbackFile) throw new Error('لا يوجد ملف متاح لإعادة المحاولة.');
      const formData = new FormData();
      formData.append('file', fallbackFile);
      const thumbnailFile = dataUrlToFile(uploadState.thumbnailUrl, `${String(fallbackFile.name || 'reel').replace(/\.[^.]+$/, '')}-thumb.jpg`);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      formData.append('caption', caption);
      formData.append('category', 'general');
      return API.post('/reels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    };

    try {
      if (uploadState.mediaUrl) {
        await API.post('/reels', {
          caption,
          media_url: uploadState.mediaUrl,
          video_url: uploadState.mediaUrl,
          thumbnail_url: uploadState.thumbnailUrl && !String(uploadState.thumbnailUrl).startsWith('data:')
            ? uploadState.thumbnailUrl
            : undefined,
        });
      } else {
        await tryMultipartFallback();
      }
    } catch (error) {
      try {
        await tryMultipartFallback();
      } catch (fallbackError) {
        setUploadState((prev) => ({ ...prev, publishing: false }));
        pushToast({
          type: 'error',
          title: 'فشل نشر الريل',
          description: fallbackError?.response?.data?.detail || fallbackError?.message || error?.response?.data?.detail || error?.message,
        });
        return;
      }
    }

    setShowUploadModal(false);
    setUploadState((prev) => ({ ...prev, publishing: false }));
    resetUploadState();
    navigate('/reels', { replace: true });
    await loadReels();
    pushToast({ type: 'success', title: 'تم نشر الريل بنجاح' });
  };

  const listData = useMemo(() => ({
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    handleReport,
    handleFollow,
    followingUsers,
    currentUser,
    scrollToIndex,
    isDesktop,
    navDirection,
    isBuffering: bufferState.active && bufferState.index === activeIndex,
    bufferPercent: bufferState.percent,
    selectedQuality,
    activeQuality,
    watchHistoryMap,
    onVideoWaiting: handleVideoWaiting,
    onVideoCanPlay: handleVideoCanPlay,
    onVideoProgress: handleVideoProgress,
    onVideoLoadedMetadata: handleVideoLoadedMetadata,
    onVideoEnded: handleVideoEnded,
    onVideoError: handleVideoError,
    onVideoPlay: handleVideoPlay,
  }), [
    activeIndex,
    activeQuality,
    bufferState.active,
    bufferState.index,
    bufferState.percent,
    currentUser,
    followingUsers,
    handleFollow,
    handleReport,
    handleSave,
    handleShare,
    handleVideoCanPlay,
    handleVideoEnded,
    handleVideoError,
    handleVideoLoadedMetadata,
    handleVideoPlay,
    handleVideoProgress,
    handleVideoWaiting,
    isDesktop,
    navDirection,
    reels,
    scrollToIndex,
    selectedQuality,
    setVideoRef,
    watchHistoryMap,
  ]);

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
    navigate('/reels', { replace: true });
  };

  return (
    <MainLayout>
      <div className="reels-page-shell" onWheelCapture={handleWheelNavigation} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="reels-header-bar">
          <div>
            <h1>الريلز</h1>
            <p>{isDesktop ? 'سوايب سريع بالمفاتيح أو عجلة الماوس مع جودة تلقائية ومؤشرات Buffer' : 'مرر بين الفيديوهات مع تحميل مسبق وتخزين ذكي وسجل مشاهدة'}</p>
          </div>
          <div className="reels-toolbar">
            <select className="quality-select" value={selectedQuality} onChange={(event) => {
              const value = event.target.value;
              setSelectedQuality(value);
              trackReelAnalytics('manual_quality_change', {
                reelId: activeReelItem?.id,
                content: activeReelItem?.content,
                username: activeReelItem?.username,
                thumbnail_url: activeReelItem?.poster_url,
                quality: value,
              });
            }}>
              {QUALITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" className="upload-reel-button" onClick={() => setShowUploadModal(true)}>⬆ رفع ريل</button>
          </div>
        </div>

        <div className="reels-stage-shell">
          {isLoading ? (
            <div className="reels-loading-state">
              <div className="reel-loader" />
              <p>جارٍ تحميل الريلز...</p>
            </div>
          ) : reels.length ? (
            <>
              <div className="reels-status-ribbon">
                <span>الجودة الفعلية: <strong>{QUALITY_OPTIONS.find((item) => item.value === activeQuality)?.label || activeQuality}</strong></span>
                <span>الشبكة: <strong>{deviceProfile.effectiveType}</strong></span>
                <span>Buffer events: <strong>{Number(activeInsights?.bufferEvents || 0)}</strong></span>
              </div>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    ref={listRef}
                    height={height}
                    width={width}
                    itemCount={reels.length}
                    itemSize={height}
                    overscanCount={deviceProfile.maxVisibleReels || 2}
                    onItemsRendered={({ visibleStartIndex }) => handleScroll({ startIndex: visibleStartIndex })}
                    itemData={listData}
                    className="no-scrollbar reel-viewport"
                  >
                    {ReelItem}
                  </List>
                )}
              </AutoSizer>
            </>
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
              onUploadComplete={({ url, previewUrl, file, originalFile, thumbnailUrl, payload }) => {
                setUploadState((prev) => ({
                  ...prev,
                  mediaUrl: url || payload?.mediaUrl || payload?.url || '',
                  previewUrl: previewUrl || url || payload?.mediaUrl || '',
                  thumbnailUrl: thumbnailUrl || payload?.thumbnailUrl || '',
                  fileName: file?.name || originalFile?.name || '',
                  processedFile: file || null,
                  originalFile: originalFile || null,
                  uploading: false,
                }));
                pushToast({ type: 'success', title: 'تم رفع الفيديو', description: 'راجع المشغل ثم اضغط نشر الريل.' });
              }}
              onError={(message) => pushToast({ type: 'error', title: 'فشل رفع الفيديو', description: message })}
            />

            {(uploadState.mediaUrl || uploadState.previewUrl) ? (
              <div className="uploaded-preview-shell">
                <div className="uploaded-preview-head">
                  <strong>معاينة الريل</strong>
                  <span>{uploadState.fileName || 'video.mp4'}</span>
                </div>
                <UniversalPlayer
                  src={resolveMediaUrl(uploadState.mediaUrl || uploadState.previewUrl)}
                  poster={uploadState.thumbnailUrl || ''}
                  variant="post"
                  muted
                  className="uploaded-preview-player"
                />
              </div>
            ) : null}

            <div className="upload-modal-actions">
              <Button variant="secondary" onClick={closeUploadModal}>إغلاق</Button>
              <Button onClick={publishReel} loading={uploadState.publishing} disabled={(!uploadState.mediaUrl && !uploadState.processedFile && !uploadState.originalFile) || uploadState.publishing}>نشر الريل الآن</Button>
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

        <Modal isOpen={reportState.open} onClose={() => setReportState({ open: false, reel: null, reason: 'spam', note: '' })} title="بلاغ على ريل">
          <div className="upload-modal-layout">
            <div className="upload-modal-help">
              <strong>@{reportState.reel?.username || 'user'}</strong>
              <p>{reportState.reel?.content || 'حدد سبب البلاغ وسيتم إضافته لقائمة المراجعة.'}</p>
            </div>
            <select value={reportState.reason} onChange={(event) => setReportState((prev) => ({ ...prev, reason: event.target.value }))}>
              {REPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <textarea
              rows={4}
              placeholder="ملاحظات إضافية"
              value={reportState.note}
              onChange={(event) => setReportState((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="upload-modal-actions">
              <Button variant="secondary" onClick={() => setReportState({ open: false, reel: null, reason: 'spam', note: '' })}>إلغاء</Button>
              <Button onClick={submitReport}>إرسال البلاغ</Button>
            </div>
          </div>
        </Modal>

        <style>{`
          .reels-page-shell {
            position: relative;
            /* ✅ الارتفاع يحترم وجود الهيدر العلوي والفوتر السفلي في MainLayout */
            min-height: calc(100dvh - var(--yam-top-chrome-height, 60px) - var(--yam-bottom-chrome-height, 70px));
            height: calc(100dvh - var(--yam-top-chrome-height, 60px) - var(--yam-bottom-chrome-height, 70px));
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
          .reels-toolbar {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .quality-select,
          .upload-reel-button {
            border: none;
            border-radius: 999px;
            padding: 12px 18px;
            font-weight: 900;
            cursor: pointer;
          }
          .quality-select {
            background: rgba(255,255,255,0.1);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.12);
          }
          .upload-reel-button {
            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
            color: #fff;
            box-shadow: 0 18px 36px rgba(59,130,246,0.24);
          }
          .reels-stage-shell {
            flex: 1;
            height: 100%;
          }
          .reels-status-ribbon {
            position: absolute;
            top: 84px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 25;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(2,6,23,0.58);
            border: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(16px);
            font-size: 12px;
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
          .reel-viewport {
            scroll-snap-type: y mandatory;
            overscroll-behavior-y: contain;
            scroll-behavior: smooth;
          }
          .reel-container { scroll-snap-align: start; scroll-snap-stop: always; }
          .reel-card-shell {
            border-radius: 34px;
            box-shadow: 0 28px 70px rgba(0,0,0,0.34);
            transform: scale(0.986);
            transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease;
          }
          .reel-card-shell.active {
            transform: scale(1);
            box-shadow: 0 34px 86px rgba(0,0,0,0.4);
          }
          .reel-video {
            opacity: 0.94;
            transform: scale(1.02);
            transition: transform 260ms ease, opacity 260ms ease, filter 260ms ease;
            filter: saturate(0.94);
          }
          .reel-video.active {
            opacity: 1;
            transform: scale(1);
            filter: saturate(1);
          }
          .reel-top-overlay {
            background: linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.18), transparent);
          }
          .reel-bottom-overlay {
            background: linear-gradient(180deg, transparent, rgba(0,0,0,0.18), rgba(0,0,0,0.86));
          }
          .reel-actions-stack {
            right: 18px;
            bottom: 28px;
          }
          .reel-swipe-indicator {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 19;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 10px 8px;
            border-radius: 999px;
            background: rgba(9,14,28,0.42);
            border: 1px solid rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.82);
            backdrop-filter: blur(14px);
            pointer-events: none;
            box-shadow: 0 12px 30px rgba(0,0,0,0.18);
          }
          .reel-swipe-indicator small {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.02em;
          }
          .reel-progress-rail {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 10px;
            height: 4px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            overflow: hidden;
            z-index: 24;
          }
          .reel-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #8b5cf6, #38bdf8);
            transition: width 120ms linear;
          }
          .reel-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(255,255,255,0.14);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            box-shadow: 0 12px 26px rgba(0,0,0,0.18);
          }
          .reel-chip.ghost {
            background: rgba(15,23,42,0.58);
            border: 1px solid rgba(255,255,255,0.08);
          }
          .reel-meta-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            margin-top: 10px;
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
          .reel-buffer-banner {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(15,23,42,0.72);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            font-weight: 800;
          }
          .reel-action-btn {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(9,14,28,0.54);
            color: #fff;
            font-size: 22px;
            display: grid;
            place-items: center;
            cursor: pointer;
            transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
            box-shadow: 0 16px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06);
            backdrop-filter: blur(16px);
            opacity: 0.96;
          }
          .reel-action-btn:hover {
            transform: translateY(-2px) scale(1.02);
            background: rgba(15,23,42,0.72);
            box-shadow: 0 20px 44px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
          }
          .reel-action-btn.liked {
            background: rgba(239,68,68,0.22);
            color: #fecaca;
          }
          .reel-action-btn.saved {
            background: rgba(245,158,11,0.22);
            color: #fde68a;
          }
          .reel-action-btn.warn {
            background: rgba(249,115,22,0.22);
            color: #fdba74;
          }
          .reel-action-label {
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            font-weight: 700;
          }
          .reel-arrow {
            position: absolute;
            left: 12px;
            width: 48px;
            height: 48px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(9,14,28,0.54);
            color: white;
            font-size: 22px;
            cursor: pointer;
            z-index: 20;
            box-shadow: 0 18px 40px rgba(0,0,0,0.22);
            backdrop-filter: blur(16px);
          }
          .reel-arrow:disabled {
            opacity: 0.35;
            cursor: not-allowed;
          }
          .reel-arrow-up { top: 50%; transform: translateY(-72px); }
          .reel-arrow-down { top: 50%; transform: translateY(20px); }
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
          .uploaded-preview-player,
          .uploaded-preview-video {
            width: 100%;
            min-height: 320px;
            max-height: 420px;
            border-radius: 14px;
            background: #000;
          }
          .upload-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }
          @media (max-width: 768px) {
            .reel-swipe-indicator {
              left: 8px;
              top: auto;
              bottom: 120px;
              transform: none;
            }
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
              align-items: flex-start;
              flex-direction: column;
            }
            .reels-header-bar h1 {
              font-size: 20px;
            }
            .upload-reel-button,
            .quality-select {
              padding: 10px 14px;
              font-size: 14px;
            }
            .reels-status-ribbon {
              top: 112px;
              width: calc(100% - 24px);
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}

