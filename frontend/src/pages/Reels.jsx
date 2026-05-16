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

// مكون بطاقة الفيديو في العرض الشبكي
const ReelGridCard = ({ reel, onSelect, onLike, currentUser }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(reel)}
    >
      <img
        src={getPosterUrl(reel)}
        alt={reel.content}
        className="w-full h-full object-cover"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
          ▶
        </div>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm">
        <div className="flex items-center gap-2 mb-1">
          <img
            src={getOptimizedImageUrl(reel.user_avatar, 32)}
            alt={reel.username}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-bold text-xs">@{reel.username}</span>
        </div>
        <p className="line-clamp-1 text-xs">{reel.content}</p>
      </div>

      {/* Stats */}
      <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold">
        ❤️ {reel.likes_count || 0}
      </div>
    </div>
  );
};

// مكون عرض الفيديو العمودي الكامل
const ReelFullScreen = ({ reel, reels, onClose, onLike, onSave, onShare, onComment, currentUser }) => {
  const videoRef = useRef(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(reels.findIndex(r => r.id === reel.id));
  const [showComments, setShowComments] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const currentDisplayReel = reels[currentReelIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReelIndex]);

  const handleNext = () => {
    if (currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(currentReelIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentReelIndex > 0) {
      setCurrentReelIndex(currentReelIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all"
      >
        ✕
      </button>

      {/* Main Video Container */}
      <div className="w-full h-full max-w-md flex flex-col relative">
        {/* Video */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          <video
            ref={videoRef}
            src={getAdaptiveVideoSrc(currentDisplayReel, getDeviceProfile(), true)}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
              }
            }}
            onDoubleClick={() => onLike(currentDisplayReel, { burst: true })}
          />

          {/* Navigation Hints */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-white/40 text-xs p-4">
            <div>⬆ السابق</div>
            <div>⬇ التالي</div>
          </div>
        </div>

        {/* Bottom Info & Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={getOptimizedImageUrl(currentDisplayReel.user_avatar, 48)}
              alt={currentDisplayReel.username}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div className="flex-1">
              <p className="font-bold text-white">@{currentDisplayReel.username}</p>
              <p className="text-white/80 text-sm">{currentDisplayReel.content}</p>
            </div>
            {currentDisplayReel.username !== currentUser && (
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-white text-sm font-bold transition-all">
                متابعة
              </button>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          <button
            onClick={() => onLike(currentDisplayReel)}
            className={`p-3 rounded-full transition-all transform hover:scale-110 ${
              currentDisplayReel.is_liked ? 'text-red-500 bg-red-500/20' : 'text-white bg-white/10'
            }`}
          >
            <div className="text-2xl">❤️</div>
            <div className="text-xs font-bold">{currentDisplayReel.likes_count || 0}</div>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all transform hover:scale-110"
          >
            <div className="text-2xl">💬</div>
            <div className="text-xs font-bold">{currentDisplayReel.comments_count || 0}</div>
          </button>

          <button
            onClick={() => onSave(currentDisplayReel)}
            className={`p-3 rounded-full transition-all transform hover:scale-110 ${
              currentDisplayReel.is_saved ? 'text-yellow-500 bg-yellow-500/20' : 'text-white bg-white/10'
            }`}
          >
            <div className="text-2xl">🔖</div>
          </button>

          <button
            onClick={() => onShare(currentDisplayReel)}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all transform hover:scale-110"
          >
            <div className="text-2xl">📤</div>
          </button>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          disabled={currentReelIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 disabled:opacity-30 p-2 rounded-full text-white transition-all"
        >
          ▲
        </button>

        <button
          onClick={handleNext}
          disabled={currentReelIndex === reels.length - 1}
          className="absolute left-4 bottom-20 bg-white/20 hover:bg-white/30 disabled:opacity-30 p-2 rounded-full text-white transition-all"
        >
          ▼
        </button>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/95 border-l border-white/10 flex flex-col z-20">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-bold">التعليقات</h3>
            <button onClick={() => setShowComments(false)} className="text-white/60 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Comments will be rendered here */}
          </div>
          <div className="p-4 border-t border-white/10">
            <input
              type="text"
              placeholder="أضف تعليقاً..."
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:bg-white/20"
            />
          </div>
        </div>
      )}
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'vertical'
  const [selectedReel, setSelectedReel] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'trending', 'following', 'new'
  
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

  const handleLike = async (reel, { burst = false } = {}) => {
    if (burst) {
      setHeartBurstId(String(reel.id));
      setTimeout(() => setHeartBurstId(''), 650);
    }
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">الريلز</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'}`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('vertical')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'vertical' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/60'}`}
              >
                ☰
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-bold transition-all"
              >
                📹 رفع
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {['الكل', 'الأحدث', 'المشهورين', 'شائع'].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setFilterTab(['all', 'new', 'trending', 'popular'][idx])}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  filterTab === ['all', 'new', 'trending', 'popular'][idx]
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-white/60">جاري التحميل...</div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reels.map(reel => (
                <ReelGridCard
                  key={reel.id}
                  reel={reel}
                  onSelect={(r) => setSelectedReel(r)}
                  onLike={handleLike}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        ) : (
          // Vertical View (Vertical Scroll)
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {reels.map((reel, idx) => (
                <div
                  key={reel.id}
                  className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedReel(reel)}
                >
                  <img
                    src={getPosterUrl(reel)}
                    alt={reel.content}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="text-white text-5xl opacity-0 group-hover:opacity-100">▶</div>
                  </div>
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold">
                    ❤️ {reel.likes_count || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="رفع ريل جديد">
        <VideoUploader
          onUpload={(mediaUrl, content) => {
            setUploadState({ mediaUrl, uploading: true, content });
            createPost({ media_url: mediaUrl, content, post_type: 'reel' })
              .then(() => {
                pushToast({ type: 'success', title: 'تم رفع الريل بنجاح' });
                setShowUploadModal(false);
                loadReels();
              })
              .catch(err => pushToast({ type: 'error', title: 'خطأ في الرفع', description: err.message }));
          }}
        />
      </Modal>

      {/* Full Screen Reel Viewer */}
      {selectedReel && (
        <ReelFullScreen
          reel={selectedReel}
          reels={reels}
          onClose={() => setSelectedReel(null)}
          onLike={handleLike}
          onSave={handleSave}
          onShare={handleShare}
          onComment={openComments}
          currentUser={currentUser}
        />
      )}
    </MainLayout>
  );
}
