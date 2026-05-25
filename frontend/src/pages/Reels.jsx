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

function normalizeReel(item = {}) {
  return {
    ...item,
    media_url: item.media_url || item.video_url || item.videoUrl || '',
    recommendation_score: item.recommendation_score || computeReelScore(item),
    views_count: Number(item.views_count || item.view_count || 0),
    likes_count: Number(item.likes_count || 0),
    comments_count: Number(item.comments_count || 0),
    share_count: Number(item.share_count || 0),
    saved_count: Number(item.saved_count || 0),
    poster_url: item.poster_url || getPosterUrl(item),
    duration_label: item.duration_label || item.duration || '',
  };
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
  } = data;

  const reel = reels[index];
  const isActive = index === activeIndex;
  const videoRef = useRef(null);
  const insights = useMemo(() => (reel ? getReelInsightsById(reel.id) : null), [reel?.id]);
  const watchEntry = reel ? watchHistoryMap[String(reel.id)] : null;

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
          onLoadedMetadata={() => onVideoLoadedMetadata(index)}
          onEnded={() => onVideoEnded(index)}
          onError={() => onVideoError(index)}
          onDoubleClick={() => handleLike(reel, { burst: true })}
        />

        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10 text-white pointer-events-none">
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
          <div className="reel-meta-row pointer-events-auto">
            {reel.duration_label ? <span className="reel-chip ghost">{reel.duration_label}</span> : null}
            <span className="reel-chip ghost">👁 {Number(reel.views_count || 0)}</span>
            <span className="reel-chip ghost">⏱ متوسط المشاهدة {Math.round(Number(insights?.avgWatchMs || 0) / 1000)}ث</span>
          </div>
        </div>

        <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-20">
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
  const [bufferState, setBufferState] = useState({ index: -1, percent: 0, active: false });
  const [reportState, setReportState] = useState({ open: false, reel: null, reason: 'spam', note: '' });
  const [watchHistoryMap, setWatchHistoryMap] = useState(() => {
    const items = getWatchHistory();
    return items.reduce((acc, item) => {
      acc[String(item.reelId)] = item;
      return acc;
    }, {});
  });
  const [uploadState, setUploadState] = useState({ mediaUrl: '', previewUrl: '', uploading: false, publishing: false, content: '', fileName: '' });

  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.videoPreloadRange || (deviceProfile.isLowEndDevice ? 1 : 2);
  const isDesktop = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches, []);
  const activeReelItem = reels[activeIndex] || null;
  const activeInsights = activeReelItem ? getReelInsightsById(activeReelItem.id) : null;

  const resetUploadState = useCallback(() => {
    setUploadState({ mediaUrl: '', previewUrl: '', uploading: false, publishing: false, content: '', fileName: '' });
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
    setActiveIndex(bounded);
    listRef.current?.scrollToItem?.(bounded, 'start');
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
      const { data } = await getPosts({ limit: 40, page: 1 });
      const source = Array.isArray(data) ? data : data?.items || [];
      const onlyVideos = source
        .filter((post) => isVideoUrl(post?.media_url || post?.video_url || ''))
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
  }, [location.search]);

  useEffect(() => {
    const nextItems = reels.slice(activeIndex + 1, activeIndex + 1 + preloadRange);
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
  }, [activeIndex, deviceProfile, preloadRange, reels, selectedQuality]);

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
      video.preload = index === activeIndex ? 'auto' : 'metadata';
      video.muted = index !== activeIndex;
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
        }, 2000);
        viewTimersRef.current.set(currentKey, timer);
        return () => clearTimeout(timer);
      }
    }
  }, [activeIndex, deviceProfile, preloadRange, reels, selectedQuality]);

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
    wheelAccumulatorRef.current += event.deltaY;
    if (Math.abs(wheelAccumulatorRef.current) < 70) return;
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
      await likePost(reel.id);
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب' });
    }
  };

  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: !item.is_saved } : item));
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
      pushToast({ type: 'success', title: 'تم نسخ رابط الريل' });
      await sharePost(reel.id, 'copy');
    } catch {
      pushToast({ type: 'warning', title: 'تعذر نسخ الرابط' });
    }
  };

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
        type: 'video',
        is_reel: true,
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
    handleReport,
    currentUser,
    scrollToIndex,
    isDesktop,
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
    reels,
    scrollToIndex,
    selectedQuality,
    setVideoRef,
    watchHistoryMap,
  ]);

  const closeUploadModal = () => {
    setShowUploadModal(false);
    navigate('/reels', { replace: true });
  };

  return (
    <MainLayout hideNav>
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
                    className="no-scrollbar"
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
              <Button onClick={publishReel} loading={uploadState.publishing} disabled={!uploadState.mediaUrl || uploadState.publishing}>نشر الريل الآن</Button>
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
