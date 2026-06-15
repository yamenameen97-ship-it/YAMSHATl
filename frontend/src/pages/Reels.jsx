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
import { REEL_FILTERS, getSavedFilter, saveFilter, getFilterById } from '../components/reels/ReelFilters.js';

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
    reelFilterId,
    reelFilterStyle,
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
          style={reelFilterStyle}
          loop
          playsInline
          muted
          autoPlay={isActive}
          preload={isActive ? 'auto' : 'metadata'}
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

        {/* ✅ تم إخفاء شارات الجودة وتنبيه التمرير لأنها كانت تغطي المحتوى. أزرار البحث/الرجوع موجودة الآن في reels-floating-top-bar على مستوى الصفحة. */}
        {isActive && isBuffering ? (
          <div className="reel-top-overlay absolute inset-x-0 top-0 z-20 px-4 pt-20 pb-4 text-white pointer-events-none">
            <div className="reel-buffer-banner pointer-events-auto">
              <span>جارٍ التحميل الذكي…</span>
              <span>{bufferPercent}%</span>
            </div>
          </div>
        ) : null}

        {/* ✅ v42+: وصف الفيديو شفاف تمامًا، نص عائم فوق الفيديو بدون أي تدرّج داكن يغطّيه */}
        <div className="reel-bottom-overlay reel-bottom-overlay-clear absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
          <div className="flex items-center gap-2 mb-2 pointer-events-auto reel-username-row">
            <span className="font-bold text-sm reel-floating-text">@{reel.username || 'user'}</span>
          </div>
          <p className="text-sm leading-6 line-clamp-3 mb-2 pointer-events-auto reel-floating-text">{reel.content || 'ريل جديد'}</p>
          <div className="reel-meta-row pointer-events-auto">
            {reel.duration_label ? <span className="reel-chip-floating">{reel.duration_label}</span> : null}
            <span className="reel-chip-floating">👁 {Number(reel.views_count || 0)}</span>
          </div>
        </div>

        {/* ✅ v42+: كومة أزرار التفاعل بنفس ترتيب TikTok — الصورة الشخصية+متابعة في الأعلى ثم الإعجاب/التعليق/الحفظ/المشاركة */}
        <div className="reel-actions-stack absolute right-3 bottom-36 flex flex-col gap-4 items-center z-30 pointer-events-auto">
          {/* صورة الناشر + زر متابعة (+) */}
          <div className="reel-avatar-wrap">
            <div className="reel-avatar-ring">
              <img src={getOptimizedImageUrl(reel.user_avatar, 120)} alt={reel.username || 'user'} className="reel-avatar-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            {reel.username !== currentUser && !followingUsers.has(String(reel.username || '')) ? (
              <button type="button" aria-label="متابعة" className="reel-avatar-plus" onClick={(e) => { e.stopPropagation(); handleFollow(reel.username); }}>+</button>
            ) : null}
            {reel.username !== currentUser && followingUsers.has(String(reel.username || '')) ? (
              <span className="reel-avatar-check" aria-label="متابَع">✓</span>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" aria-label="إعجاب" onClick={(e) => { e.stopPropagation(); handleLike(reel); }} className={`reel-action-btn reel-action-btn--icon ${reel.is_liked ? 'liked' : ''}`}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill={reel.is_liked ? '#ef4444' : 'currentColor'} stroke="#fff" strokeWidth="1.4"><path d="M12 21s-7-4.5-9.5-9C.7 8.4 2.6 4 6.5 4c2 0 3.6 1.1 4.5 2.6C11.9 5.1 13.5 4 15.5 4 19.4 4 21.3 8.4 19.5 12c-2.5 4.5-9.5 9-9.5 9z"/></svg>
            </button>
            <span className="reel-action-label">{reel.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" aria-label="تعليقات" onClick={(e) => { e.stopPropagation(); openComments(reel); }} className="reel-action-btn reel-action-btn--icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6 2 11c0 2.6 1.3 4.9 3.4 6.6L4 22l4.9-1.6c1 .3 2 .4 3.1.4 5.5 0 10-4 10-9.4S17.5 2 12 2z"/></svg>
            </button>
            <span className="reel-action-label">{reel.comments_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" aria-label="حفظ" onClick={(e) => { e.stopPropagation(); handleSave(reel); }} className={`reel-action-btn reel-action-btn--icon ${reel.is_saved ? 'saved' : ''}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill={reel.is_saved ? '#fbbf24' : '#fff'}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg>
            </button>
            <span className="reel-action-label">{reel.saved_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" aria-label="مشاركة" onClick={(e) => { e.stopPropagation(); handleShare(reel); }} className="reel-action-btn reel-action-btn--icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M3 12l18-9-4 9 4 9z"/></svg>
            </button>
            <span className="reel-action-label">{reel.share_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button type="button" aria-label="بلاغ" onClick={(e) => { e.stopPropagation(); handleReport(reel); }} className="reel-action-btn reel-action-btn--icon warn">⚑</button>
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
  // ✅ v42+: تبويبات علوية على نمط TikTok: استكشاف / أتابعه / لك
  // القيم المتاحة: 'explore' | 'following' | 'foryou'
  const [topTab, setTopTab] = useState('foryou');
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
  /* ✅ v33+1: فلتر الريلز العام للصفحة */
  const [reelFilterId, setReelFilterId] = useState(() => getSavedFilter());
  const [showReelFilterPanel, setShowReelFilterPanel] = useState(false);
  const currentReelFilter = useMemo(() => getFilterById(reelFilterId), [reelFilterId]);
  const reelFilterStyle = useMemo(() => ({
    filter: currentReelFilter?.filter && currentReelFilter.filter !== 'none' ? currentReelFilter.filter : 'none',
    WebkitFilter: currentReelFilter?.filter && currentReelFilter.filter !== 'none' ? currentReelFilter.filter : 'none',
    transition: 'filter 220ms ease',
  }), [currentReelFilter]);

  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.videoPreloadRange || (deviceProfile.isLowEndDevice ? 1 : 2);
  const isDesktop = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches, []);
  const activeReelItem = reels[activeIndex] || null;
  const activeInsights = activeReelItem ? getReelInsightsById(activeReelItem.id) : null;

  const resetUploadState = useCallback(() => {
    setUploadState({ mediaUrl: '', previewUrl: '', thumbnailUrl: '', uploading: false, publishing: false, content: '', fileName: '', processedFile: null, originalFile: null });
  }, []);

  const hydrateFromCache = useCallback(() => {
    // تسريع الظهور على الجوال: عرض الريلز من الكاش فورًا إذا كانت متاحة
    try {
      const cached = getReelsCache();
      if (Array.isArray(cached?.items) && cached.items.length) {
        setReels(cached.items.map(normalizeReel));
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.warn('hydrate cache failed', e);
    }
    return false;
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
    const nextLiked = !reel.is_liked;
    const nextCount = reel.is_liked
      ? Math.max(0, Number(reel.likes_count || 0) - 1)
      : Number(reel.likes_count || 0) + 1;

    // تحديث تفاؤلي فوري
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: nextLiked,
      likes_count: nextCount,
    } : item));

    // تحديث الكاش لضمان التخزين
    try {
      const cached = getReelsCache();
      if (cached?.items) {
        const updated = cached.items.map((item) => item.id === reel.id ? {
          ...item, is_liked: nextLiked, likes_count: nextCount,
        } : item);
        saveReelsCache(updated);
      }
    } catch (e) {}

    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/like`);
      trackReelAnalytics(nextLiked ? 'like' : 'unlike', { reelId: reel.id, username: reel.username });
    } catch {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب' });
    }
  };

  const handleSave = async (reel) => {
    const originalReels = [...reels];
    const nextSaved = !reel.is_saved;
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: nextSaved } : item));

    try {
      const cached = getReelsCache();
      if (cached?.items) {
        const updated = cached.items.map((item) => item.id === reel.id ? { ...item, is_saved: nextSaved } : item);
        saveReelsCache(updated);
      }
    } catch (e) {}

    try {
      await API.post(`/reels/${encodeURIComponent(reel.id)}/save`);
      trackReelAnalytics(nextSaved ? 'save' : 'unsave', { reelId: reel.id, username: reel.username });
      pushToast({ type: 'success', title: nextSaved ? 'تم حفظ الريل' : 'تم إلغاء الحفظ' });
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

  /* ✅ v42+: ترتيب الريلز حسب التبويب العلوي:
     - استكشف: الأشخاص الذين تتابعهم أولاً، ثم الأقرب للأقرب (أصدقاء الأصدقاء / نفس الدولة / نتائج بحثي السابقة).
     - أتابعه: فقط فيديوهات الأشخاص الذين تتابعهم.
     - لك: الترتيب الافتراضي (توصيات). */
  const visibleReels = useMemo(() => {
    if (!Array.isArray(reels) || reels.length === 0) return [];
    const followed = followingUsers || new Set();
    let searchHistoryKeywords = [];
    try {
      const raw = localStorage.getItem('yamshat_search_history') || localStorage.getItem('search_history') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) searchHistoryKeywords = parsed.map((x) => String(x?.q || x).toLowerCase()).slice(0, 12);
    } catch (_) { /* ignore */ }
    let userCountry = '';
    try { userCountry = (localStorage.getItem('user_country') || '').toLowerCase(); } catch (_) {}

    if (topTab === 'following') {
      return reels.filter((r) => followed.has(String(r.username || '')));
    }

    if (topTab === 'explore') {
      // ترتيب: متابَعون > أصدقاء الأصدقاء > نفس الدولة > نتائج البحث السابقة > الباقي
      const rank = (r) => {
        const uname = String(r.username || '');
        if (followed.has(uname)) return 0;
        if (Array.isArray(r.mutual_followers) && r.mutual_followers.length > 0) return 1;
        if (userCountry && String(r.user_country || r.country || '').toLowerCase() === userCountry) return 2;
        const text = `${r.content || ''} ${uname}`.toLowerCase();
        if (searchHistoryKeywords.some((kw) => kw && text.includes(kw))) return 3;
        return 4;
      };
      return [...reels].sort((a, b) => {
        const ra = rank(a); const rb = rank(b);
        if (ra !== rb) return ra - rb;
        return (Number(b.recommendation_score) || 0) - (Number(a.recommendation_score) || 0);
      });
    }

    // لك: الترتيب الافتراضي بعد التوصيات
    return reels;
  }, [reels, topTab, followingUsers]);

  const listData = useMemo(() => ({
    reels: visibleReels,
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
    reelFilterId,
    reelFilterStyle,
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
    visibleReels,
    scrollToIndex,
    selectedQuality,
    setVideoRef,
    watchHistoryMap,
    reelFilterId,
    reelFilterStyle,
  ]);

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
    navigate('/reels', { replace: true });
  };

  return (
    <MainLayout>
      <div className="reels-page-shell" onWheelCapture={handleWheelNavigation} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* ✅ v44: شعار YAMSHAT في الزاوية العلوية اليسرى (عائم فوق الفيديو) */}
        <div className="reels-corner-brand" dir="rtl" aria-label="YAMSHAT">
          <svg viewBox="0 0 100 100" width="22" height="22" aria-hidden="true">
            <defs>
              <linearGradient id="reels-y-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <path d="M20 20 L50 60 L80 20 L70 20 L50 45 L30 20 Z" fill="url(#reels-y-grad)" />
            <path d="M45 60 L55 60 L55 85 L45 85 Z" fill="url(#reels-y-grad)" />
          </svg>
          <span className="reels-corner-brand-text">YAMSHAT</span>
        </div>

        {/* ✅ v42+: شريط علوي عائم شفاف بتبويبات TikTok */}
        <div className="reels-top-tabs-bar" dir="rtl">
          <button
            type="button"
            className="reels-floating-btn reels-search-btn"
            aria-label="بحث"
            onClick={() => navigate('/search')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>

          <div className="reels-tabs-center" role="tablist">
            <button
              type="button"
              role="tab"
              className={`reels-tab-btn ${topTab === 'explore' ? 'active' : ''}`}
              aria-selected={topTab === 'explore'}
              onClick={() => setTopTab('explore')}
            >استكشف</button>
            <button
              type="button"
              role="tab"
              className={`reels-tab-btn ${topTab === 'following' ? 'active' : ''}`}
              aria-selected={topTab === 'following'}
              onClick={() => setTopTab('following')}
            >أتابعه</button>
            <button
              type="button"
              role="tab"
              className={`reels-tab-btn ${topTab === 'foryou' ? 'active' : ''}`}
              aria-selected={topTab === 'foryou'}
              onClick={() => setTopTab('foryou')}
            >لك</button>
          </div>

          <button
            type="button"
            className="reels-floating-btn reels-live-btn"
            aria-label="بث مباشر"
            onClick={() => navigate('/live')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="14" height="12" rx="2"/>
              <path d="M17 10l4-2v8l-4-2z"/>
            </svg>
          </button>
        </div>

        {/* ✅ v42+: أدوات إضافية عائمة (فلتر) تظهر فقط في وضع الفيديو الواحد */}
        {topTab !== 'explore' ? (
          <div className="reels-floating-sub-bar" dir="rtl">
            <button
              type="button"
              className={`reels-floating-btn reels-filter-btn ${reelFilterId !== 'none' ? 'is-active' : ''}`}
              aria-label="فلاتر وتحسينات الفيديو"
              aria-expanded={showReelFilterPanel}
              onClick={() => setShowReelFilterPanel((s) => !s)}
              title={currentReelFilter?.label || 'فلاتر'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.9L19 9l-3.8 3.4L16.5 18 12 15.3 7.5 18l1.3-5.6L5 9l5.1-1.1L12 3z" />
              </svg>
            </button>
          </div>
        ) : null}

        {/* ✅ v33+1: لوحة اختيار فلاتر الريلز (RTL + Noto Sans Arabic) */}
        {showReelFilterPanel ? (
          <div className="reels-filter-sheet" dir="rtl" role="dialog" aria-label="فلاتر وتحسينات الفيديو">
            <div className="reels-filter-sheet-head">
              <strong>فلاتر وتحسينات الفيديو</strong>
              <button type="button" className="reels-filter-close" onClick={() => setShowReelFilterPanel(false)} aria-label="إغلاق">✕</button>
            </div>
            <div className="reels-filter-sheet-grid">
              {REEL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`reels-filter-sheet-chip ${reelFilterId === f.id ? 'active' : ''}`}
                  onClick={() => { setReelFilterId(f.id); saveFilter(f.id); }}
                >
                  <span
                    className="reels-filter-sheet-thumb"
                    style={{
                      filter: f.filter !== 'none' ? f.filter : 'none',
                      WebkitFilter: f.filter !== 'none' ? f.filter : 'none',
                      backgroundImage: activeReelItem?.poster_url ? `url(${activeReelItem.poster_url})` : undefined,
                    }}
                    aria-hidden="true"
                  />
                  <span className="reels-filter-sheet-label">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="reels-stage-shell">
          {isLoading ? (
            <div className="reels-loading-state">
              <div className="reel-loader" />
              <p>جارٍ تحميل الريلز...</p>
            </div>
          ) : visibleReels.length ? (
            topTab === 'explore' ? (
              /* ✅ v42+: وضع الاستكشاف على شكل شبكة صور مصغّرة مثل TikTok */
              <div className="reels-explore-grid no-scrollbar" dir="rtl">
                {visibleReels.map((reel, idx) => (
                  <button
                    key={reel.id || idx}
                    type="button"
                    className="reels-explore-card"
                    onClick={() => {
                      // عند الضغط على أي فيديو في الاستكشاف: افتحه في وضع التمرير العمودي (لك)
                      const fullIdx = reels.findIndex((r) => String(r.id) === String(reel.id));
                      setTopTab('foryou');
                      requestAnimationFrame(() => {
                        if (fullIdx >= 0) {
                          setActiveIndex(fullIdx);
                          listRef.current?.scrollToItem?.(fullIdx, 'start');
                        }
                      });
                    }}
                  >
                    <div className="reels-explore-thumb">
                      {reel.poster_url ? (
                        <img src={reel.poster_url} alt="" loading="lazy" />
                      ) : (
                        <div className="reels-explore-thumb-fallback">🎥</div>
                      )}
                      {reel.username === currentUser ? null : followingUsers.has(String(reel.username || '')) ? (
                        <span className="reels-explore-badge follow">متابَع</span>
                      ) : null}
                    </div>
                    <div className="reels-explore-meta">
                      <span className="reels-explore-likes">♥ {Number(reel.likes_count || 0)}</span>
                      <span className="reels-explore-user">{reel.username || 'user'}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* ✅ وضع الفيديو الواحد بالتمرير العمودي */}
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      ref={listRef}
                      height={height}
                      width={width}
                      itemCount={visibleReels.length}
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
            )
          ) : (
            <div className="reels-empty-state">
              <div className="empty-icon">🎬</div>
              <h2>{topTab === 'following' ? 'لا توجد فيديوهات من متابعيك' : 'مافيش ريلز لسه'}</h2>
              <p>{topTab === 'following' ? 'تابِع بعض الأشخاص لتظهر فيديواتهم هنا.' : 'اضغط على زر رفع ريل وأضف أول فيديو بشكل واضح ومباشر.'}</p>
              {topTab !== 'following' ? <Button onClick={() => setShowUploadModal(true)}>رفع أول ريل</Button> : null}
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

        {/* ✅ v42+: ورقة سفلية للتعليقات تغطي نصف الشاشة فقط — فيديو الريل يبقى ظاهرًا في الأعلى */}
        {showCommentsModal ? (
          <div className="reels-comments-overlay" role="presentation" onClick={() => setShowCommentsModal(false)}>
            <div className="reels-comments-sheet" role="dialog" aria-label="التعليقات" dir="rtl" onClick={(e) => e.stopPropagation()}>
              <div className="reels-comments-sheet-handle" />
              <div className="reels-comments-sheet-head">
                <button type="button" className="reels-comments-close" aria-label="إغلاق" onClick={() => setShowCommentsModal(false)}>✕</button>
                <strong>{Number(activeReel?.comments_count || activeComments?.length || 0)} تعليقاً</strong>
                <span style={{ width: 28 }} />
              </div>
              <div className="reels-comments-sheet-body">
                <NestedComments
              comments={activeComments}
              onAddComment={async (payload) => {
                // ✅ v33+1 (إصلاح حفظ تعليق الريلز على ويب الجوال):
                // 1) NestedComments يرسل كائن { content }، نطبّع للنص.
                // 2) نُنشئ نسخة تفاؤلية محلية فورًا حتى لو فشل API على شبكة الجوال البطيئة.
                // 3) نُحدّث الكاش (getReelsCache/saveReelsCache) لضمان ظهور التعليق بعد إعادة فتح الصفحة.
                // 4) نُحاول جميع endpoints المحتملة (reels/:id/comment ثم posts/:id/comment) لأن الـ backend
                //    على الجوال أحيانًا يرفض المسار الأول.
                const text = typeof payload === 'string'
                  ? payload
                  : String(payload?.content || payload?.text || '').trim();
                if (!text || !activeReel?.id) return;

                const tempId = `tmp-${Date.now()}`;
                const optimistic = {
                  id: tempId,
                  content: text,
                  user: currentUser,
                  username: currentUser,
                  user_avatar: '',
                  created_at: new Date().toISOString(),
                  is_pending: true,
                };
                // إضافة تفاؤلية فورية لتجربة ويب جوال سلسة
                setActiveComments((prev) => [optimistic, ...prev]);
                setReels((prev) => prev.map((item) =>
                  String(item.id) === String(activeReel.id)
                    ? { ...item, comments_count: Number(item.comments_count || 0) + 1 }
                    : item
                ));

                const persistToCache = (savedItem) => {
                  try {
                    const cached = getReelsCache();
                    if (cached?.items) {
                      const updated = cached.items.map((item) => String(item.id) === String(activeReel.id)
                        ? { ...item, comments_count: Number(item.comments_count || 0) + 1 }
                        : item);
                      saveReelsCache(updated);
                    }
                  } catch (_) { /* ignore cache errors */ }
                };

                try {
                  let saved = null;
                  try {
                    const { data } = await addComment(activeReel.id, text);
                    saved = data?.comment || data?.data || data;
                  } catch (firstErr) {
                    // محاولة احتياطية على endpoint الريلز المباشر
                    try {
                      const fallback = await API.post(`/reels/${encodeURIComponent(activeReel.id)}/comment`, { content: text });
                      saved = fallback?.data?.comment || fallback?.data?.data || fallback?.data;
                    } catch (secondErr) {
                      throw firstErr;
                    }
                  }

                  if (saved && saved.id) {
                    // استبدال النسخة المؤقتة بالنسخة الحقيقية
                    setActiveComments((prev) => prev.map((c) => String(c.id) === tempId ? saved : c));
                  } else {
                    // البقاء على النسخة التفاؤلية وإزالة علم pending
                    setActiveComments((prev) => prev.map((c) => String(c.id) === tempId ? { ...c, is_pending: false } : c));
                  }
                  persistToCache(saved);
                  pushToast({ type: 'success', title: 'تم نشر التعليق' });
                } catch (error) {
                  // التراجع: إزالة النسخة التفاؤلية + إنقاص العداد
                  setActiveComments((prev) => prev.filter((c) => String(c.id) !== tempId));
                  setReels((prev) => prev.map((item) =>
                    String(item.id) === String(activeReel.id)
                      ? { ...item, comments_count: Math.max(0, Number(item.comments_count || 0) - 1) }
                      : item
                  ));
                  pushToast({ type: 'error', title: 'تعذر نشر التعليق', description: error?.response?.data?.detail || error?.message });
                }
              }}
              onReply={async (parentId, text) => {
                if (!text || !activeReel?.id) return;
                try {
                  const { data } = await addComment(activeReel.id, text, parentId);
                  const saved = data?.comment || data?.data || data;
                  if (saved) {
                    setActiveComments((prev) => prev.map((c) =>
                      String(c.id) === String(parentId)
                        ? { ...c, replies: [saved, ...(c.replies || [])] }
                        : c
                    ));
                  }
                } catch (error) {
                  pushToast({ type: 'error', title: 'تعذر إرسال الرد', description: error?.message });
                }
              }}
                />
              </div>
            </div>
          </div>
        ) : null}

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
            /* ✅ تم إخفاؤه بالكامل لأنه كان يغطي محتوى الفيديو */
            display: none !important;
          }
          /* ✅ شريط علوي عائم شفاف: رجوع + بحث */
          .reels-floating-top-bar {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 12px);
            inset-inline: 12px;
            z-index: 40;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            pointer-events: none;
          }
          .reels-floating-btn {
            pointer-events: auto;
            width: 42px;
            height: 42px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            border: none;
            background: transparent;
            color: #fff;
            cursor: pointer;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7));
            transition: transform 140ms ease, opacity 140ms ease;
          }
          .reels-floating-btn:hover,
          .reels-floating-btn:active {
            transform: scale(1.08);
            opacity: 0.9;
          }
          .reels-floating-btn svg {
            display: block;
          }
          /* في RTL: سهم الرجوع (chevron right) يبدو طبيعيًا بدون تدوير لأن الصورة تظهر سهمًا للرجوع */
          .reels-floating-btn.is-active {
            background: rgba(139, 92, 246, 0.55);
            border-color: rgba(167,139,250,0.55);
          }

          /* ✅ v44: شعار YAMSHAT في الزاوية العلوية اليسرى (داخل الريلز فقط) */
          .reels-corner-brand {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 8px);
            inset-inline-start: 12px; /* RTL → الزاوية اليسرى */
            z-index: 50;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 999px;
            background: rgba(0,0,0,0.28);
            backdrop-filter: blur(8px) saturate(140%);
            -webkit-backdrop-filter: blur(8px) saturate(140%);
            pointer-events: none;
            user-select: none;
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          }
          .reels-corner-brand-text {
            color: #fff;
            font-weight: 900;
            font-size: 11px;
            letter-spacing: 1px;
            text-shadow: 0 2px 6px rgba(0,0,0,0.7);
          }

          /* ✅ v42+: شريط التبويبات العلوي على نمط TikTok (استكشف | أتابعه | لك) */
          .reels-top-tabs-bar {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 10px);
            inset-inline: 0;
            z-index: 45;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 14px;
            gap: 8px;
            pointer-events: none;
            background: transparent !important; /* v44: بدون أي خلفية */
          }
          .reels-top-tabs-bar > button,
          .reels-top-tabs-bar .reels-tabs-center { pointer-events: auto; }
          .reels-tabs-center {
            display: flex;
            align-items: center;
            gap: 18px;
            justify-content: center;
            flex: 1;
          }
          .reels-tab-btn {
            border: none;
            background: transparent;
            color: rgba(255,255,255,0.72);
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
            font-size: 16px;
            font-weight: 700;
            padding: 8px 4px;
            cursor: pointer;
            position: relative;
            text-shadow: 0 2px 6px rgba(0,0,0,0.6);
            transition: color 160ms ease, transform 160ms ease;
          }
          .reels-tab-btn:hover { color: #fff; }
          .reels-tab-btn.active {
            color: #fff;
            font-weight: 900;
            transform: scale(1.04);
          }
          .reels-tab-btn.active::after {
            content: '';
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: -2px;
            width: 22px;
            height: 3px;
            border-radius: 999px;
            background: #fff;
            box-shadow: 0 0 8px rgba(255,255,255,0.55);
          }
          .reels-floating-sub-bar {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 60px);
            inset-inline-end: 12px;
            z-index: 40;
            display: flex;
            gap: 8px;
            pointer-events: none;
          }
          .reels-floating-sub-bar > * { pointer-events: auto; }

          /* ✅ v42+: شبكة الاستكشاف (نمط TikTok Discover) */
          .reels-explore-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
            padding: 64px 8px 16px 8px;
            height: 100%;
            overflow-y: auto;
            background: #000;
            -webkit-overflow-scrolling: touch;
          }
          @media (min-width: 768px) {
            .reels-explore-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
          @media (min-width: 1200px) {
            .reels-explore-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          }
          .reels-explore-card {
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: transparent;
            border: none;
            padding: 0;
            cursor: pointer;
            color: #fff;
            font-family: inherit;
            text-align: start;
          }
          .reels-explore-thumb {
            position: relative;
            width: 100%;
            aspect-ratio: 9 / 14;
            border-radius: 10px;
            overflow: hidden;
            background: #1a1a1a;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          }
          .reels-explore-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 300ms ease;
          }
          .reels-explore-card:hover .reels-explore-thumb img { transform: scale(1.04); }
          .reels-explore-thumb-fallback {
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            font-size: 32px;
            background: linear-gradient(135deg, #4f46e5, #ec4899);
          }
          .reels-explore-badge {
            position: absolute;
            top: 6px;
            inset-inline-start: 6px;
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 800;
            background: rgba(0,0,0,0.65);
            backdrop-filter: blur(8px);
            color: #fff;
          }
          .reels-explore-badge.follow {
            background: rgba(139,92,246,0.85);
          }
          .reels-explore-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            padding: 0 4px;
            font-size: 11px;
            color: rgba(255,255,255,0.85);
          }
          .reels-explore-likes { font-weight: 800; }
          .reels-explore-user {
            font-size: 11px;
            color: rgba(255,255,255,0.7);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 70%;
          }

          /* ✅ v42+: نص الوصف العائم الشفاف فوق الفيديو (بدون أي تدرّج داكن) */
          .reel-bottom-overlay-clear {
            background: transparent !important;
          }
          .reel-floating-text {
            text-shadow: 0 1px 2px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.7);
          }
          .reel-username-row .reel-floating-text { font-size: 15px; }
          .reel-chip-floating {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 8px;
            background: rgba(0,0,0,0.32);
            backdrop-filter: blur(4px);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          }

          /* ✅ v42+: صورة الناشر + زر متابعة (+) على نمط TikTok */
          .reel-avatar-wrap {
            position: relative;
            width: 48px;
            height: 48px;
            margin-bottom: 6px;
          }
          .reel-avatar-ring {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid #fff;
            overflow: hidden;
            background: linear-gradient(135deg, #4f46e5, #ec4899);
            box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          }
          .reel-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .reel-avatar-plus {
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #fff;
            background: #ef4444;
            color: #fff;
            font-size: 16px;
            font-weight: 900;
            line-height: 1;
            padding: 0;
            display: grid;
            place-items: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(239,68,68,0.6);
            animation: reelPlusPop 280ms ease-out;
          }
          @keyframes reelPlusPop {
            from { transform: translateX(-50%) scale(0.4); opacity: 0; }
            to   { transform: translateX(-50%) scale(1); opacity: 1; }
          }
          .reel-avatar-check {
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #fff;
            background: #22c55e;
            color: #fff;
            font-size: 12px;
            font-weight: 900;
            display: grid;
            place-items: center;
            box-shadow: 0 4px 10px rgba(34,197,94,0.6);
          }

          /* ✅ v42+: تكييف أزرار التفاعل لتبدو شفافة على نمط TikTok */
          .reel-action-btn--icon {
            width: 46px !important;
            height: 46px !important;
            border-radius: 999px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));
            padding: 0;
            color: #fff;
          }
          .reel-action-btn--icon:hover {
            transform: scale(1.08);
            background: rgba(255,255,255,0.08) !important;
          }
          .reel-action-btn--icon svg { display: block; }
          .reel-action-label {
            text-shadow: 0 1px 3px rgba(0,0,0,0.85);
          }

          /* ✅ v42+: ورقة سفلية للتعليقات (نصف الشاشة) */
          .reels-comments-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            animation: reelsOverlayIn 180ms ease-out;
          }
          @keyframes reelsOverlayIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .reels-comments-sheet {
            width: 100%;
            max-width: 720px;
            height: 62vh;
            max-height: 62dvh;
            background: #0f1115;
            color: #fff;
            border-top-left-radius: 22px;
            border-top-right-radius: 22px;
            box-shadow: 0 -16px 50px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
            animation: reelsSheetUp 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          @keyframes reelsSheetUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          .reels-comments-sheet-handle {
            width: 44px;
            height: 4px;
            background: rgba(255,255,255,0.25);
            border-radius: 999px;
            margin: 8px auto 6px;
          }
          .reels-comments-sheet-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 16px 10px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            font-size: 14px;
            font-weight: 700;
          }
          .reels-comments-close {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.08);
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            display: grid;
            place-items: center;
          }
          .reels-comments-close:hover { background: rgba(255,255,255,0.16); }
          .reels-comments-sheet-body {
            flex: 1;
            overflow-y: auto;
            padding: 4px 12px 12px;
            -webkit-overflow-scrolling: touch;
          }
          @media (max-width: 480px) {
            .reels-comments-sheet {
              height: 60vh;
              max-height: 60dvh;
            }
          }
          /* ✅ v33+1: لوحة فلاتر الريلز */
          .reels-filter-sheet {
            position: absolute;
            top: calc(env(safe-area-inset-top, 0px) + 64px);
            inset-inline-end: 12px;
            z-index: 50;
            width: min(360px, calc(100% - 24px));
            max-height: 60vh;
            overflow-y: auto;
            padding: 16px;
            border-radius: 22px;
            background: rgba(9, 14, 28, 0.92);
            border: 1px solid rgba(255,255,255,0.14);
            backdrop-filter: blur(22px) saturate(150%);
            -webkit-backdrop-filter: blur(22px) saturate(150%);
            box-shadow: 0 24px 60px rgba(0,0,0,0.48);
            color: #fff;
            font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, -apple-system, sans-serif;
            direction: rtl;
            animation: reelsFilterSheetIn 220ms ease-out;
          }
          @keyframes reelsFilterSheetIn {
            from { opacity: 0; transform: translateY(-12px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .reels-filter-sheet-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
            font-weight: 800;
            font-size: 15px;
          }
          .reels-filter-close {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.10);
            color: #fff;
            cursor: pointer;
            font-size: 14px;
            font-weight: 800;
          }
          .reels-filter-close:hover { background: rgba(255,255,255,0.20); }
          .reels-filter-sheet-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }
          .reels-filter-sheet-chip {
            display: grid;
            gap: 6px;
            padding: 6px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.10);
            background: rgba(255,255,255,0.04);
            color: #fff;
            cursor: pointer;
            transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
            font-family: inherit;
          }
          .reels-filter-sheet-chip:hover {
            background: rgba(255,255,255,0.08);
            transform: translateY(-2px);
          }
          .reels-filter-sheet-chip.active {
            border-color: #a78bfa;
            background: rgba(139, 92, 246, 0.22);
            box-shadow: 0 0 0 2px rgba(167,139,250,0.35);
          }
          .reels-filter-sheet-thumb {
            display: block;
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 10px;
            background-color: #1f2937;
            background-size: cover;
            background-position: center;
            background-image: linear-gradient(135deg, #4f46e5 0%, #ec4899 50%, #f59e0b 100%);
          }
          .reels-filter-sheet-label {
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            line-height: 1.3;
          }
          @media (max-width: 768px) {
            .reels-filter-sheet {
              inset-inline-start: 10px;
              inset-inline-end: 10px;
              width: auto;
            }
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
            /* ✅ v42+: أزلنا التدرج الداكن، النص يعوم فوق الفيديو بظلّ نصّ فقط */
            background: transparent;
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

