import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import VideoUploader from '../components/upload/VideoUploader.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { addComment, createPost, getComments, getPosts, likePost, savePost, sharePost } from '../api/posts.js';
import { followUser } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

function isVideoUrl(url = '') {
  return /\.(mp4|webm|mov|m3u8)(\?.*)?$/i.test(url);
}

function normalizeReel(item) {
  return {
    ...item,
    media_url: item.media_url || item.video_url || '',
    thumbnail_url: item.thumbnail_url || item.image_url || '',
    views_count: Number(item.views_count || item.view_count || 0),
    likes_count: Number(item.likes_count || 0),
    comments_count: Number(item.comments_count || 0),
  };
}

export default function Reels() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeReel, setActiveReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [uploadDraft, setUploadDraft] = useState({ url: '', content: '' });

  const featured = useMemo(() => reels.slice(0, 3), [reels]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const { data } = await getPosts({ page: 1, limit: 60 });
      const source = Array.isArray(data) ? data : data?.items || [];
      const onlyVideos = source.filter((item) => isVideoUrl(item.media_url || item.video_url || '')).map(normalizeReel);
      setReels(onlyVideos);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الريلز', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleLike = async (reel) => {
    const snapshot = reels;
    setReels((prev) => prev.map((item) => item.id === reel.id ? {
      ...item,
      is_liked: !item.is_liked,
      likes_count: item.is_liked ? Math.max(0, Number(item.likes_count || 0) - 1) : Number(item.likes_count || 0) + 1,
    } : item));
    try {
      await likePost(reel.id);
    } catch (error) {
      setReels(snapshot);
      pushToast({ type: 'error', title: 'تعذر تحديث الإعجاب', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    }
  };

  const handleSave = async (reel) => {
    const snapshot = reels;
    setBusyId(`save-${reel.id}`);
    setReels((prev) => prev.map((item) => item.id === reel.id ? { ...item, is_saved: !item.is_saved } : item));
    try {
      await savePost(reel.id);
    } catch (error) {
      setReels(snapshot);
      pushToast({ type: 'error', title: 'تعذر حفظ الريل', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusyId('');
    }
  };

  const handleShare = async (reel) => {
    try {
      const link = `${window.location.origin}${window.location.pathname}#/reels`;
      await navigator.clipboard.writeText(link);
      await sharePost(reel.id, 'copy');
      pushToast({ type: 'success', title: 'تم نسخ رابط الريل' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر نسخ الرابط', description: error?.message || 'حاول مرة أخرى.' });
    }
  };

  const handleFollow = async (username) => {
    try {
      setBusyId(`follow-${username}`);
      await followUser(username);
      pushToast({ type: 'success', title: `تمت متابعة @${username}` });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر المتابعة', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusyId('');
    }
  };

  const openComments = async (reel) => {
    setActiveReel(reel);
    setShowCommentsModal(true);
    setCommentText('');
    try {
      const { data } = await getComments(reel.id);
      setComments(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setComments([]);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!activeReel?.id || !commentText.trim()) return;
    try {
      setBusyId('comment');
      const { data } = await addComment(activeReel.id, commentText.trim());
      setComments((prev) => [...prev, data]);
      setReels((prev) => prev.map((item) => item.id === activeReel.id ? { ...item, comments_count: Number(item.comments_count || 0) + 1 } : item));
      setCommentText('');
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إضافة التعليق', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusyId('');
    }
  };

  const publishUploadedReel = async () => {
    if (!uploadDraft.url) return;
    try {
      setBusyId('publish-reel');
      await createPost({ content: uploadDraft.content, media_url: uploadDraft.url });
      pushToast({ type: 'success', title: 'تم نشر الريل' });
      setUploadDraft({ url: '', content: '' });
      setShowUploadModal(false);
      await loadReels();
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر نشر الريل', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge primary" style={{ marginBottom: 12 }}>🎬 Reels</div>
              <h1 className="yam-section-title">واجهة الريلز الجديدة</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0' }}>
                التصميم الجديد يحافظ على نفس خدمات التحميل والإعجاب والحفظ والمشاركة والتعليقات، لكن بشكل أبسط وأوضح للواجهة.
              </p>
            </div>
            <div className="yam-action-row">
              <Button variant="secondary" onClick={loadReels} loading={loading}>تحديث</Button>
              <Button onClick={() => setShowUploadModal(true)}>ريل جديد</Button>
            </div>
          </div>
        </div>

        <div className="yam-grid-main">
          <div className="yam-grid">
            {featured.length ? (
              <div className="yam-card">
                <div className="yam-toolbar">
                  <h3 style={{ margin: 0 }}>مختارات سريعة</h3>
                  <span className="yam-badge">{featured.length}</span>
                </div>
                <div className="yam-reels-grid">
                  {featured.map((reel) => (
                    <div key={`featured-${reel.id}`} className="yam-reel-card">
                      <video src={reel.media_url} poster={reel.thumbnail_url} muted loop playsInline controls />
                      <div className="yam-overlay">
                        <strong>@{reel.username || 'user'}</strong>
                        <div className="yam-meta">{reel.views_count} مشاهدة</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="yam-empty-state">جارٍ تحميل الريلز...</div>
            ) : reels.length ? (
              <div className="yam-reels-grid">
                {reels.map((reel) => (
                  <div key={reel.id} className="yam-reel-card">
                    <video src={reel.media_url} poster={reel.thumbnail_url} muted loop playsInline controls />
                    <div className="yam-overlay">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="yam-avatar-sm">{(reel.username || 'U').slice(0, 1).toUpperCase()}</div>
                          <div>
                            <strong>@{reel.username || 'user'}</strong>
                            <div className="yam-meta" style={{ fontSize: 12 }}>{reel.views_count} مشاهدة</div>
                          </div>
                        </div>
                        {reel.username && reel.username !== currentUser ? (
                          <Button
                            variant="secondary"
                            size="small"
                            loading={busyId === `follow-${reel.username}`}
                            onClick={() => handleFollow(reel.username)}
                          >
                            متابعة
                          </Button>
                        ) : null}
                      </div>

                      <div style={{ fontSize: 13, lineHeight: 1.7, minHeight: 44 }}>{reel.content || 'ريل جديد على يمشات'}</div>

                      <div className="yam-action-row" style={{ marginTop: 12 }}>
                        <Button variant="secondary" size="small" onClick={() => handleLike(reel)}>
                          {reel.is_liked ? '❤️' : '🤍'} {reel.likes_count}
                        </Button>
                        <Button variant="secondary" size="small" onClick={() => openComments(reel)}>
                          💬 {reel.comments_count}
                        </Button>
                        <Button variant="secondary" size="small" loading={busyId === `save-${reel.id}`} onClick={() => handleSave(reel)}>
                          {reel.is_saved ? '📌 محفوظ' : '💾 حفظ'}
                        </Button>
                        <Button variant="secondary" size="small" onClick={() => handleShare(reel)}>
                          🔗 مشاركة
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="yam-empty-state">
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎞️</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>لا توجد ريلز فيديو حالياً</div>
                <div className="yam-empty-copy">ارفع أول ريل من زر "ريل جديد".</div>
              </div>
            )}
          </div>

          <aside className="yam-sidebar-stack">
            <div className="yam-card">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>إحصائيات سريعة</h3>
                <span className="yam-badge success">Live data</span>
              </div>
              <div className="yam-stat-grid">
                <div className="yam-stat"><strong>{reels.length}</strong><span className="yam-meta">عدد الريلز</span></div>
                <div className="yam-stat"><strong>{featured.length}</strong><span className="yam-meta">مختارات بارزة</span></div>
                <div className="yam-stat"><strong>{reels.reduce((sum, item) => sum + Number(item.likes_count || 0), 0)}</strong><span className="yam-meta">إجمالي الإعجابات</span></div>
                <div className="yam-stat"><strong>{reels.reduce((sum, item) => sum + Number(item.views_count || 0), 0)}</strong><span className="yam-meta">إجمالي المشاهدات</span></div>
              </div>
            </div>
          </aside>
        </div>

        <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="إضافة ريل جديد" size="large">
          <div className="yam-grid" style={{ gap: 18 }}>
            <VideoUploader
              onUploadComplete={({ url }) => setUploadDraft((prev) => ({ ...prev, url }))}
              onError={(message) => pushToast({ type: 'error', title: 'تعذر رفع الفيديو', description: message })}
              label="ارفع فيديو الريل"
            />

            {uploadDraft.url ? (
              <div className="yam-grid" style={{ gap: 12 }}>
                <video src={uploadDraft.url} controls style={{ width: '100%', borderRadius: 20 }} />
                <textarea
                  className="yam-textarea"
                  placeholder="اكتب وصفاً للريل"
                  value={uploadDraft.content}
                  onChange={(event) => setUploadDraft((prev) => ({ ...prev, content: event.target.value }))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={publishUploadedReel} loading={busyId === 'publish-reel'}>نشر الريل</Button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>

        <Modal open={showCommentsModal} onClose={() => setShowCommentsModal(false)} title={activeReel ? `تعليقات @${activeReel.username || 'user'}` : 'التعليقات'} size="large">
          <div className="yam-grid" style={{ gap: 16 }}>
            <div className="yam-messages" style={{ maxHeight: 360 }}>
              {comments.length ? comments.map((comment) => (
                <div key={comment.id || `${comment.username}-${comment.created_at}`} className="yam-message peer" style={{ maxWidth: '100%' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>@{comment.username || 'user'}</div>
                  <div>{comment.text || comment.content || 'تعليق'}</div>
                </div>
              )) : <div className="yam-empty-copy">لا توجد تعليقات بعد.</div>}
            </div>

            <form onSubmit={submitComment} className="yam-grid" style={{ gap: 12 }}>
              <textarea
                className="yam-textarea"
                placeholder="اكتب تعليقك"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" loading={busyId === 'comment'} disabled={!commentText.trim()}>إرسال التعليق</Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
