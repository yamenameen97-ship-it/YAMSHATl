import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout.jsx';
import GroupSubHeader from '../../components/groups/GroupSubHeader.jsx';
import {
  getGroupPosts, createGroupPost, deleteGroupPost, pinGroupPost,
  getGroupDetails,
} from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';
import { getCurrentUsername } from '../../utils/auth.js';
import '../../styles/groups-features.css';

const formatTime = (t) => {
  if (!t) return '';
  try { return new Date(t).toLocaleString('ar-EG'); } catch { return ''; }
};

const GroupPostsFeed = () => {
  const { groupId } = useParams();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [group, setGroup] = useState(null);
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const taRef = useRef(null);

  const role = useMemo(() => {
    const m = group?.members?.find((x) => (x.username || x.user_id) === currentUser);
    return m?.role || 'member';
  }, [group, currentUser]);
  const canPin = role === 'owner' || role === 'admin' || role === 'moderator';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [postsRes, gRes] = await Promise.allSettled([
          getGroupPosts(groupId, { limit: 50 }),
          getGroupDetails(groupId),
        ]);
        if (cancelled) return;
        if (postsRes.status === 'fulfilled') {
          const list = Array.isArray(postsRes.value?.data)
            ? postsRes.value.data
            : (postsRes.value?.data?.items || postsRes.value?.data?.posts || []);
          const sorted = [...list].sort((a, b) => {
            if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
            return new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0);
          });
          setPosts(sorted);
        }
        if (gRes.status === 'fulfilled') setGroup(gRes.value?.data || null);
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId]);

  const handleCreate = async () => {
    const text = composer.trim();
    if (!text || posting) return;
    setPosting(true);
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content: text,
      author: currentUser,
      author_name: currentUser,
      created_at: new Date().toISOString(),
      pinned: false,
      _pending: true,
    };
    setPosts((p) => [optimistic, ...p]);
    setComposer('');
    try {
      const res = await createGroupPost(groupId, { content: text });
      const real = res?.data?.post || res?.data || optimistic;
      setPosts((p) => p.map((x) => x.id === optimistic.id ? { ...real, _pending: false } : x));
      pushToast?.({ type: 'success', title: 'نشر', description: 'تم نشر المنشور.' });
      setShowComposer(false);
    } catch (e) {
      setPosts((p) => p.filter((x) => x.id !== optimistic.id));
      setComposer(text);
      pushToast?.({ type: 'error', title: 'تعذر النشر', description: e?.message || 'حاول مرة أخرى' });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm('حذف هذا المنشور؟')) return;
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== post.id));
    try {
      await deleteGroupPost(groupId, post.id);
      pushToast?.({ type: 'success', title: 'تم الحذف' });
    } catch (e) {
      setPosts(prev);
      pushToast?.({ type: 'error', title: 'تعذر الحذف' });
    }
  };

  const handlePin = async (post) => {
    const target = !post.pinned;
    setPosts((p) => p.map((x) => x.id === post.id ? { ...x, pinned: target } : x)
      .sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return Number(!!b.pinned) - Number(!!a.pinned);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }));
    try {
      await pinGroupPost(groupId, post.id, target);
      pushToast?.({ type: 'success', title: target ? 'تم التثبيت' : 'تم إلغاء التثبيت' });
    } catch (e) {
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, pinned: !target } : x));
      pushToast?.({ type: 'error', title: 'تعذر التحديث' });
    }
  };

  return (
    <MainLayout>
      <div className="yamg-page" dir="rtl">
        <GroupSubHeader
          title={`منشورات ${group?.name || 'المجموعة'}`}
          subtitle={`${posts.length} منشور`}
          action={
            <button
              className="yamg-btn"
              onClick={() => { setShowComposer((v) => !v); setTimeout(() => taRef.current?.focus(), 50); }}
            >
              {showComposer ? '✕ إغلاق' : '+ منشور جديد'}
            </button>
          }
        />

        {showComposer && (
          <div className="yamg-card">
            <textarea
              ref={taRef}
              className="yamg-textarea"
              placeholder="بماذا تفكر؟ شارك مع أعضاء المجموعة..."
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              dir="rtl"
            />
            <div className="yamg-row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="yamg-btn secondary" onClick={() => { setComposer(''); setShowComposer(false); }}>
                إلغاء
              </button>
              <button className="yamg-btn" disabled={!composer.trim() || posting} onClick={handleCreate}>
                {posting ? '...جاري النشر' : 'نشر'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="yamg-loading"><div className="yamg-spinner" />جاري التحميل...</div>
        ) : posts.length === 0 ? (
          <div className="yamg-empty">
            <span className="ic">📝</span>
            لا توجد منشورات بعد. كن أول من ينشر!
          </div>
        ) : (
          posts.map((post) => {
            const isMine = (post.author || post.user_id) === currentUser;
            return (
              <article key={post.id} className="yamg-card hover" style={post.pinned ? { borderColor: 'rgba(245,158,11,.4)' } : {}}>
                <div className="yamg-post-author">
                  <img
                    src={post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author || 'u'}`}
                    alt=""
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="yamg-post-name">{post.author_name || post.author || 'مستخدم'}</div>
                    <div className="yamg-post-time">{formatTime(post.created_at || post.timestamp)}</div>
                  </div>
                  {post.pinned && <span className="yamg-tag warning">📌 مثبّت</span>}
                  {post._pending && <span className="yamg-tag">جاري الإرسال…</span>}
                </div>

                <div className="yamg-post-body">{post.content || post.text || post.body}</div>

                {(post.media_url || post.image_url) && (
                  <div className="yamg-post-media">
                    {(post.media_type === 'video') ? (
                      <video src={post.media_url} controls />
                    ) : (
                      <img src={post.media_url || post.image_url} alt="" />
                    )}
                  </div>
                )}

                <div className="yamg-post-actions">
                  <button>👍 {post.likes_count || 0} إعجاب</button>
                  <button>💬 {post.comments_count || 0} تعليق</button>
                  {canPin && (
                    <button onClick={() => handlePin(post)}>
                      {post.pinned ? '📍 إلغاء التثبيت' : '📌 تثبيت'}
                    </button>
                  )}
                  {(isMine || canPin) && (
                    <button onClick={() => handleDelete(post)} style={{ color: '#fca5a5' }}>
                      🗑️ حذف
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </MainLayout>
  );
};

export default GroupPostsFeed;
