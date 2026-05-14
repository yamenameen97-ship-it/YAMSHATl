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

function getAdaptiveVideoSrc(reel, profile, active = false) {
  const quality = active
    ? profile.preferredVideoQuality
    : profile.isLowEndDevice
      ? 'low'
      : 'medium';
  return appendVideoQuality(reel.media_url || reel.video_url || '', quality);
}

const ReelItem = ({ index, style, data }) => {
  const { reels, activeIndex, setVideoRef, handleLike, openComments, handleSave, handleShare, busyId, heartBurstId, currentUser } = data;
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
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={!isActive}
          poster={getPosterUrl(reel)}
          onClick={() => {
            if (videoRef.current) {
              if (videoRef.current.paused) videoRef.current.play();
              else videoRef.current.pause();
            }
          }}
          onDoubleClick={() => handleLike(reel, { burst: true })}
        />

        {/* Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white pointer-events-none">
          <div className="flex items-center gap-3 mb-2 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20">
              <img src={getOptimizedImageUrl(reel.user_avatar, 80)} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm">@{reel.username}</span>
            {reel.username !== currentUser && (
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
                متابعة
              </button>
            )}
          </div>
          <p className="text-sm line-clamp-2 mb-2 pointer-events-auto">{reel.content}</p>
        </div>

        {/* Action Buttons */}
        <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center z-10">
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => handleLike(reel)}
              disabled={busyId === `like-${reel.id}`}
              className={`p-3 rounded-full transition-all transform active:scale-90 ${reel.is_liked ? 'text-red-500 bg-red-500/10' : 'text-white bg-white/10'}`}
            >
              <svg className="w-7 h-7" fill={reel.is_liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <span className="text-white text-xs font-medium">{reel.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => openComments(reel)}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <span className="text-white text-xs font-medium">{reel.comments_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => handleSave(reel)}
              disabled={busyId === `save-${reel.id}`}
              className={`p-3 rounded-full transition-all ${reel.is_saved ? 'text-yellow-500 bg-yellow-500/10' : 'text-white bg-white/10'}`}
            >
              <svg className="w-7 h-7" fill={reel.is_saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <button 
            onClick={() => handleShare(reel)}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Heart Burst Animation */}
        {heartBurstId === String(reel.id) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="animate-ping">
              <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        )}
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
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heartBurstId, setHeartBurstId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeReel, setActiveReel] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [uploadState, setUploadState] = useState({ mediaUrl: '', uploading: false, content: '' });
  
  const deviceProfile = useMemo(() => getDeviceProfile(), []);
  const preloadRange = deviceProfile.isLowEndDevice ? 1 : 2;

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
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: error?.message });
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Intelligent Preload
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

  // Unload and Memory Management
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      const isVisible = Math.abs(index - activeIndex) <= 1;
      const isPreload = Math.abs(index - activeIndex) <= preloadRange;
      const reel = reels[index];
      
      if (!isPreload) {
        // Unload far videos to save RAM/GPU
        video.pause();
        video.src = '';
        video.load();
        video.removeAttribute('src');
        video.preload = 'none';
      } else if (reel) {
        const src = getAdaptiveVideoSrc(reel, deviceProfile, index === activeIndex);
        if (video.src !== src) {
          video.src = src;
          video.load();
        }
        video.preload = index === activeIndex ? 'auto' : 'metadata';
        
        if (index === activeIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });

    // View tracking
    const activeReelItem = reels[activeIndex];
    if (activeReelItem) {
      const timerKey = String(activeReelItem.id);
      if (viewTimersRef.current.has(timerKey)) clearTimeout(viewTimersRef.current.get(timerKey));
      const timer = setTimeout(() => {
        setReels(prev => prev.map((r, i) => i === activeIndex ? { ...r, views_count: (r.views_count || 0) + 1 } : r));
      }, 2000);
      viewTimersRef.current.set(timerKey, timer);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, reels, deviceProfile, preloadRange]);

  const setVideoRef = useCallback((index, node) => {
    if (node) videoRefs.current.set(index, node);
    else videoRefs.current.delete(index);
  }, []);

  const handleScroll = useCallback(({ startIndex }) => {
    if (startIndex !== activeIndex) {
      setActiveIndex(startIndex);
    }
  }, [activeIndex]);

  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(''), 650);
    }
    // Optimistic Update
    const originalReels = [...reels];
    setReels(prev => prev.map(r => r.id === reel.id ? { 
      ...r, 
      is_liked: !r.is_liked, 
      likes_count: r.is_liked ? (r.likes_count - 1) : (r.likes_count + 1) 
    } : r));

    try {
      await likePost(reel.id);
    } catch (error) {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحديث الإعجاب' });
    }
  };

  const handleSave = async (reel) => {
    const originalReels = [...reels];
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, is_saved: !r.is_saved } : r));
    try {
      await savePost(reel.id);
    } catch (error) {
      setReels(originalReels);
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر حفظ الريل' });
    }
  };

  const handleShare = async (reel) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
      pushToast({ type: 'success', title: 'تم نسخ الرابط' });
      await sharePost(reel.id, 'copy');
    } catch (e) {}
  };

  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      const { data } = await getComments(reel.id);
      setActiveComments(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {}
  };

  const listData = useMemo(() => ({
    reels,
    activeIndex,
    setVideoRef,
    handleLike,
    openComments,
    handleSave,
    handleShare,
    busyId,
    heartBurstId,
    currentUser
  }), [reels, activeIndex, setVideoRef, busyId, heartBurstId, currentUser]);

  return (
    <MainLayout hideNav={true}>
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <h1 className="text-white font-bold text-xl">Reels</h1>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Virtualized Reels List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-black">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Modals */}
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="إضافة ريل جديد">
          <VideoUploader 
            onUploadSuccess={(url) => {
              setShowUploadModal(false);
              loadReels();
              pushToast({ type: 'success', title: 'تم الرفع بنجاح' });
            }}
          />
        </Modal>

        <Modal isOpen={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="التعليقات">
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <NestedComments 
              comments={activeComments} 
              onAddComment={async (content) => {
                const { data } = await addComment(activeReel.id, { content });
                setActiveComments(prev => [data, ...prev]);
              }}
            />
          </div>
        </Modal>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .reel-container { scroll-snap-align: start; }
      `}</style>
    </MainLayout>
  );
}
