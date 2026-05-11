import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import VideoUploader from '../components/upload/VideoUploader.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, createPost, getComments, getPosts, likePost, sharePost } from '../api/posts.js';
import { followUser } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

const ReelSkeleton = () => (
  <div style={{ height: '100%', width: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner"></div>
    <style>{`
      .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default function ReelsPage() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [activeReel, setActiveReel] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [uploadState, setUploadState] = useState({ mediaUrl: '', uploading: false, content: '' });

  const loadReels = async () => {
    setIsLoading(true);
    try {
      const { data } = await getPosts({ limit: 20, page: 1 });
      const source = Array.isArray(data) ? data : data?.items || [];
      const onlyVideos = source.filter((post) => /\.(mp4|webm|mov)$/i.test(post?.media_url || ''));
      setReels(onlyVideos);
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: err?.response?.data?.detail || err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const refreshComments = async (postId) => {
    const { data } = await getComments(postId);
    setActiveComments(Array.isArray(data) ? data : data?.items || []);
  };

  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    try {
      await refreshComments(reel.id);
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحميل التعليقات', description: err?.response?.data?.detail || err?.message });
    }
  };

  const updateReel = (reelId, patch) => {
    setReels((prev) => prev.map((item) => item.id === reelId ? { ...item, ...patch } : item));
  };

  const handleLike = async (reel) => {
    try {
      setBusyId(`like-${reel.id}`);
      const { data } = await likePost(reel.id);
      updateReel(reel.id, {
        is_liked: Boolean(data?.liked ?? !reel.is_liked),
        likes_count: Number(data?.likes_count ?? data?.likes ?? reel.likes_count ?? 0),
      });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تنفيذ اللايك', description: err?.response?.data?.detail || err?.message });
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
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر مشاركة الريل', description: err?.response?.data?.detail || err?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleFollow = async (reel) => {
    try {
      setBusyId(`follow-${reel.id}`);
      const { data } = await followUser(reel.username);
      updateReel(reel.id, { following: Boolean(data?.following) });
      pushToast({ type: 'success', title: data?.following ? `أنت تتابع ${reel.username}` : `تم إلغاء متابعة ${reel.username}` });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحديث المتابعة', description: err?.response?.data?.detail || err?.message });
    } finally {
      setBusyId('');
    }
  };

  const handleAddComment = async () => {
    if (!activeReel || !commentDraft.trim()) return;
    try {
      setBusyId(`comment-${activeReel.id}`);
      await addComment(activeReel.id, commentDraft.trim());
      setCommentDraft('');
      await refreshComments(activeReel.id);
      updateReel(activeReel.id, { comments_count: Number(activeReel.comments_count || 0) + 1 });
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: err?.response?.data?.detail || err?.message });
    } finally {
      setBusyId('');
    }
  };

  const renderedReels = useMemo(() => reels.map((reel) => {
    const ownReel = reel.username === currentUser;
    return (
      <div key={reel.id} className="reel-item" style={{ minHeight: 'calc(100vh - 60px)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <video src={reel.media_url} loop controls playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 'calc(100vh - 60px)' }} />

        <div style={{ position: 'absolute', right: 16, bottom: 110, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid white', overflow: 'hidden', marginBottom: 6 }}>
            <img src={reel.avatar || `https://ui-avatars.com/api/?name=${reel.username}`} alt="User" style={{ width: '100%', height: '100%' }} />
          </div>
          <button className="reel-action-btn" onClick={() => handleLike(reel)} disabled={busyId === `like-${reel.id}`}>{reel.is_liked ? '❤️' : '🤍'}</button>
          <div style={{ color: 'white', fontSize: 12 }}>{reel.likes_count || 0}</div>
          <button className="reel-action-btn" onClick={() => openComments(reel)}>💬</button>
          <div style={{ color: 'white', fontSize: 12 }}>{reel.comments_count || 0}</div>
          <button className="reel-action-btn" onClick={() => handleShare(reel)} disabled={busyId === `share-${reel.id}`}>📤</button>
          {!ownReel ? (
            <button className="reel-action-btn" onClick={() => handleFollow(reel)} disabled={busyId === `follow-${reel.id}`}>{reel.following ? '✓' : '➕'}</button>
          ) : null}
        </div>

        <div style={{ position: 'absolute', bottom: 30, left: 20, right: 90, zIndex: 10, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            @{reel.username}
            {!ownReel ? (
              <button onClick={() => handleFollow(reel)} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid white', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                {reel.following ? 'إلغاء المتابعة' : 'متابعة'}
              </button>
            ) : null}
          </div>
          <div style={{ fontSize: 14, opacity: 0.92, maxWidth: '80%' }}>{reel.content}</div>
        </div>
      </div>
    );
  }), [busyId, currentUser, reels]);

  return (
    <MainLayout>
      <div style={{ height: 'calc(100vh - 60px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, display: 'flex', gap: 10 }}>
          <Button onClick={() => setShowUploadModal(true)}>رفع ريلز</Button>
          <Button variant="secondary" onClick={loadReels} loading={isLoading}>تحديث</Button>
        </div>

        <div style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }} className="reels-scroll-container">
          {isLoading && reels.length === 0 ? <ReelSkeleton /> : null}
          {!isLoading && reels.length === 0 ? <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>لا يوجد ريلز حالياً</div> : null}
          {renderedReels}
        </div>
      </div>

      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="رفع ريلز جديد">
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
                pushToast({ type: 'success', title: 'تم نشر الريل' });
                setShowUploadModal(false);
                setUploadState({ mediaUrl: '', uploading: false, content: '' });
                await loadReels();
              } catch (err) {
                pushToast({ type: 'error', title: 'تعذر نشر الريل', description: err?.response?.data?.detail || err?.message });
                setUploadState((prev) => ({ ...prev, uploading: false }));
              }
            }}
          >
            نشر الريل
          </Button>
        </div>
      </Modal>

      <Modal open={showCommentsModal} onClose={() => setShowCommentsModal(false)} title="التعليقات">
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gap: 10 }}>
            {activeComments.length ? activeComments.map((comment) => (
              <div key={comment.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{comment.username || comment.user}</div>
                <div>{comment.content || comment.text || comment.comment}</div>
              </div>
            )) : <div>لا توجد تعليقات بعد.</div>}
          </div>
          <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={3} placeholder="اكتب تعليقك" style={{ width: '100%', borderRadius: 12, padding: 12 }} />
          <Button onClick={handleAddComment} loading={busyId === `comment-${activeReel?.id || ''}`}>إرسال التعليق</Button>
        </div>
      </Modal>

      <style>{`
        .reels-scroll-container::-webkit-scrollbar { display: none; }
        .reel-action-btn {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(5px);
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          color: white;
          font-size: 22px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reel-action-btn:hover { transform: scale(1.08); background: rgba(255,255,255,0.25); }
      `}</style>
    </MainLayout>
  );
}
