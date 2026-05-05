import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { FeedSkeleton } from '../components/feedback/Skeleton.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import socket from '../api/socket.js';
import { addComment, createPost, getComments, getPosts, uploadPostMedia } from '../api/posts.js';
import { getUsers, getFollowersSummary, getRelationship, followUser } from '../api/users.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { useAppStore } from '../store/appStore.js';

const EMPTY_COUNTS = { followers: 0, following: 0 };
const isVideo = (value) => /\.(mp4|mov|webm|mkv)$/i.test(String(value || ''));

function normalizeComment(comment) {
  return {
    ...comment,
    username: comment?.username || comment?.user || 'user',
    comment: comment?.comment || comment?.text || comment?.content || '',
  };
}

function normalizePost(post, comments = []) {
  return {
    ...post,
    media: post?.media || post?.image_url || '',
    comments: comments.map(normalizeComment),
    liked_by_me: Boolean(post?.liked_by_me),
    comments_count: Number(post?.comments_count || post?.comment_count || comments.length || 0),
    likes: Number(post?.likes || post?.like_count || 0),
  };
}

async function loadFeedData(currentUser) {
  const [{ data: postsData }, { data: usersData }] = await Promise.all([getPosts(), getUsers()]);
  const rawPosts = Array.isArray(postsData) ? postsData : [];
  const users = (Array.isArray(usersData) ? usersData : [])
    .map((item) => item?.username || item?.name)
    .filter(Boolean)
    .filter((name) => name !== currentUser);

  const commentsEntries = await Promise.all(
    rawPosts.slice(0, 30).map(async (post) => {
      try {
        const { data } = await getComments(post.id);
        return [post.id, Array.isArray(data) ? data : []];
      } catch {
        return [post.id, []];
      }
    })
  );

  const commentsMap = Object.fromEntries(commentsEntries);
  const authors = [...new Set(rawPosts.map((post) => post?.username).filter(Boolean).filter((name) => name !== currentUser))];
  const profilesToLoad = [...new Set([...authors, ...users.slice(0, 8)])];

  const [relationEntries, countsEntries] = await Promise.all([
    Promise.all(
      profilesToLoad.map(async (name) => {
        try {
          const { data } = await getRelationship(name);
          return [name, Boolean(data?.following)];
        } catch {
          return [name, false];
        }
      })
    ),
    Promise.all(
      profilesToLoad.map(async (name) => {
        try {
          const { data } = await getFollowersSummary(name);
          return [name, { followers: Number(data?.followers || 0), following: Number(data?.following || 0) }];
        } catch {
          return [name, EMPTY_COUNTS];
        }
      })
    ),
  ]);

  return {
    posts: rawPosts.map((post) => normalizePost(post, commentsMap[post.id] || [])),
    suggestions: users.slice(0, 8),
    relationships: Object.fromEntries(relationEntries),
    socialCounts: Object.fromEntries(countsEntries),
  };
}

export default function Feed() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const setUploadProgress = useAppStore((state) => state.setUploadProgress);
  const clearUploadProgress = useAppStore((state) => state.clearUploadProgress);
  const uploadProgress = useAppStore((state) => state.uploadProgress.feedComposer || 0);
  const [form, setForm] = useState({ text: '', file: null, preview: '' });
  const [commentText, setCommentText] = useState({});
  const [publishing, setPublishing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['feed', currentUser],
    queryFn: () => loadFeedData(currentUser),
  });

  const posts = data?.posts || [];
  const suggestions = data?.suggestions || [];
  const relationships = data?.relationships || {};
  const socialCounts = data?.socialCounts || {};

  useEffect(() => {
    if (!currentUser) return undefined;

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUser });

    const handleLiked = ({ post_id, likes, liked, username }) => {
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          posts: previous.posts.map((post) =>
            post.id === post_id
              ? {
                  ...post,
                  likes,
                  liked_by_me: username === currentUser ? Boolean(liked) : post.liked_by_me,
                }
              : post
          ),
        };
      });
    };

    const handleCommentAdded = ({ post_id, comment }) => {
      const normalized = normalizeComment(comment || {});
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          posts: previous.posts.map((post) =>
            post.id === post_id
              ? {
                  ...post,
                  comments: [...post.comments, normalized],
                  comments_count: (post.comments_count || post.comments.length || 0) + 1,
                }
              : post
          ),
        };
      });
    };

    const handleFollowUpdate = ({ username, target_username, following, followers_count, following_count }) => {
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          relationships:
            username === currentUser
              ? { ...previous.relationships, [target_username]: following }
              : previous.relationships,
          socialCounts: {
            ...previous.socialCounts,
            [target_username]: {
              followers: Number(followers_count || previous.socialCounts[target_username]?.followers || 0),
              following: Number(following_count || previous.socialCounts[target_username]?.following || 0),
            },
          },
        };
      });
    };

    socket.on('post_liked', handleLiked);
    socket.on('comment_added', handleCommentAdded);
    socket.on('user_follow_update', handleFollowUpdate);

    return () => {
      socket.off('post_liked', handleLiked);
      socket.off('comment_added', handleCommentAdded);
      socket.off('user_follow_update', handleFollowUpdate);
    };
  }, [currentUser, queryClient, token]);

  useEffect(() => () => {
    if (form.preview?.startsWith('blob:')) URL.revokeObjectURL(form.preview);
  }, [form.preview]);

  const feedStats = useMemo(() => {
    const totalComments = posts.reduce((sum, post) => sum + Number(post.comments_count || 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + Number(post.likes || 0), 0);
    return [
      { label: 'المنشورات', value: posts.length },
      { label: 'التفاعلات', value: totalLikes },
      { label: 'التعليقات', value: totalComments },
    ];
  }, [posts]);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (form.preview?.startsWith('blob:')) URL.revokeObjectURL(form.preview);
    setForm((prev) => ({ ...prev, file, preview: URL.createObjectURL(file) }));
  };

  const resetComposer = () => {
    if (form.preview?.startsWith('blob:')) URL.revokeObjectURL(form.preview);
    setForm({ text: '', file: null, preview: '' });
    clearUploadProgress('feedComposer');
  };

  const handlePublish = async () => {
    if (!form.text.trim() && !form.file) return;
    const optimisticId = `optimistic-${Date.now()}`;
    const cleanContent = sanitizeInputText(form.text, { maxLength: 2000 });

    try {
      setPublishing(true);
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          posts: [
            normalizePost({
              id: optimisticId,
              username: currentUser,
              content: cleanContent,
              media: form.preview,
              created_at: new Date().toISOString(),
              likes: 0,
              liked_by_me: false,
              comments_count: 0,
            }),
            ...previous.posts,
          ],
        };
      });

      let media = '';
      if (form.file) {
        const { data } = await uploadPostMedia(form.file, (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          setUploadProgress('feedComposer', progress);
        });
        media = data?.file_url || data?.url || '';
      }
      await createPost({ content: cleanContent, image_url: media, media });
      pushToast({ type: 'success', title: 'تم النشر', description: 'تم نشر المحتوى بنجاح.' });
      resetComposer();
      await refetch();
    } catch (err) {
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return { ...previous, posts: previous.posts.filter((post) => post.id !== optimisticId) };
      });
      pushToast({ type: 'warning', title: 'فشل النشر', description: err?.response?.data?.message || 'تعذر نشر المنشور.' });
    } finally {
      setPublishing(false);
      clearUploadProgress('feedComposer');
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    if (!socket.connected) socket.connect();
    socket.emit('like_post', { token, post_id: postId, user: currentUser });
  };

  const handleComment = async (postId) => {
    const text = sanitizeInputText(commentText[postId] || '', { maxLength: 600 });
    if (!text || !currentUser) return;

    if (socket.connected) {
      socket.emit('add_comment', { token, post_id: postId, user: currentUser, text });
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      return;
    }

    try {
      const { data: comment } = await addComment(postId, text);
      const normalized = normalizeComment(comment || {});
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          posts: previous.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...post.comments, normalized],
                  comments_count: (post.comments_count || post.comments.length || 0) + 1,
                }
              : post
          ),
        };
      });
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      pushToast({ type: 'warning', title: 'تعذر إضافة التعليق', description: err?.response?.data?.message || 'حاول مرة أخرى.' });
    }
  };

  const handleFollow = async (username) => {
    if (!username || username === currentUser) return;

    if (socket.connected) {
      socket.emit('follow_user', { token, user: currentUser, target_username: username });
      return;
    }

    try {
      const { data: response } = await followUser(username);
      queryClient.setQueryData(['feed', currentUser], (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          relationships: { ...previous.relationships, [username]: Boolean(response?.following) },
          socialCounts: {
            ...previous.socialCounts,
            [username]: {
              followers: Number(response?.followers || previous.socialCounts[username]?.followers || 0),
              following: Number(response?.following_count || previous.socialCounts[username]?.following || 0),
            },
          },
        };
      });
    } catch (err) {
      pushToast({ type: 'warning', title: 'تعذر تحديث المتابعة', description: err?.response?.data?.message || 'حاول مرة أخرى.' });
    }
  };

  return (
    <MainLayout>
      <section className="feed-layout">
        <div className="feed-main">
          <Card className="composer-card upload-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFileSelect(event.dataTransfer.files?.[0]);
            }}>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🏠 الرئيسية</h3>
                <p className="muted">نشر سريع مع معاينة قبل الإرسال، رفع بProgress bar، وتحديثات لحظية وكاش مركزي.</p>
              </div>
            </div>

            <textarea
              className="composer-textarea"
              placeholder="اكتب منشورك هنا..."
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
            />

            {form.preview ? (
              <div className="upload-preview-shell">
                {isVideo(form.file?.name || form.preview) ? (
                  <video className="composer-preview-media" src={form.preview} controls playsInline muted />
                ) : (
                  <img className="composer-preview-media" src={form.preview} alt="preview" />
                )}
                <button type="button" className="mini-action" onClick={resetComposer}>إزالة المرفق</button>
              </div>
            ) : (
              <div className="dropzone-hint">اسحب ملف هنا أو اختر صورة/فيديو. سيتم ضغط الملف في الباك-إند إن كان مدعوماً.</div>
            )}

            {uploadProgress > 0 ? (
              <div className="upload-progress-shell">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span>{uploadProgress}%</span>
              </div>
            ) : null}

            <div className="composer-actions">
              <label className="upload-label">
                📷 اختيار صورة أو فيديو
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(event) => handleFileSelect(event.target.files?.[0])}
                />
              </label>
              <div className="muted truncate">{form.file?.name || 'لا يوجد ملف مرفق'}</div>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? 'جارٍ النشر...' : 'نشر الآن'}
              </Button>
            </div>
          </Card>

          <Card className="stats-inline-card">
            <div className="stories-stats-grid notification-stats-grid">
              {feedStats.map((item) => (
                <div key={item.label} className="mini-stat notifications-stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {isLoading ? <FeedSkeleton count={3} /> : null}
          {isError ? (
            <ErrorState
              title="تعذر تحميل الصفحة الرئيسية"
              description={error?.response?.data?.message || error?.message || 'حدث خطأ أثناء جلب البيانات.'}
              onRetry={refetch}
            />
          ) : null}
          {!isLoading && !isError && posts.length === 0 ? (
            <EmptyState
              icon="📝"
              title="لا توجد منشورات"
              description="ابدأ أول منشور الآن وسيظهر هنا مباشرة." 
            />
          ) : null}

          {!isLoading && !isError ? (
            <div className="feed-stack">
              {posts.map((post) => {
                const isFollowing = relationships[post.username];
                const counts = socialCounts[post.username] || EMPTY_COUNTS;
                const mediaUrl = post.media || '';

                return (
                  <Card key={post.id} className="post-card">
                    <div className="post-head">
                      <div className="user-row compact-row">
                        <Link to={`/profile/${encodeURIComponent(post.username)}`} className="avatar-circle">
                          {post.username?.slice(0, 1)?.toUpperCase() || 'U'}
                        </Link>
                        <div className="user-meta">
                          <Link to={`/profile/${encodeURIComponent(post.username)}`}><strong>{post.username}</strong></Link>
                          <span className="muted">
                            {post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}
                          </span>
                        </div>
                      </div>

                      {post.username !== currentUser ? (
                        <button type="button" className="mini-action" onClick={() => handleFollow(post.username)}>
                          {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                        </button>
                      ) : null}
                    </div>

                    {post.content ? <p className="post-text">{post.content}</p> : null}

                    {mediaUrl ? (
                      isVideo(mediaUrl) ? (
                        <video className="post-media" src={mediaUrl} controls playsInline preload="metadata" />
                      ) : (
                        <img className="post-media" src={mediaUrl} alt={post.content || 'post media'} loading="lazy" />
                      )
                    ) : null}

                    <div className="post-social-meta">
                      <span>👥 {counts.followers} متابع</span>
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments_count}</span>
                    </div>

                    <div className="post-actions-bar">
                      <button type="button" className={`reaction-btn ${post.liked_by_me ? 'active' : ''}`} onClick={() => handleLike(post.id)}>
                        {post.liked_by_me ? '💙' : '🤍'} إعجاب {post.likes}
                      </button>
                      <Link to={`/profile/${encodeURIComponent(post.username)}`} className="reaction-btn link-btn">
                        👤 الملف الشخصي
                      </Link>
                    </div>

                    <div className="comment-list">
                      {post.comments.slice(-4).map((comment) => (
                        <div key={comment.id || `${comment.username}-${comment.created_at}-${comment.comment}`} className="comment-item">
                          <b>{comment.username}</b>
                          <span>{comment.comment}</span>
                        </div>
                      ))}
                    </div>

                    <div className="comment-composer">
                      <input
                        className="input"
                        placeholder="اكتب تعليقاً..."
                        value={commentText[post.id] || ''}
                        onChange={(event) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [post.id]: event.target.value,
                          }))
                        }
                      />
                      <button type="button" className="mini-action" onClick={() => handleComment(post.id)}>
                        إرسال
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="feed-side">
          <Card>
            <h3 className="section-title">اقتراحات متابعة</h3>
            <div className="list-grid compact-list">
              {suggestions.map((username) => (
                <button key={username} type="button" className="story-user-card" onClick={() => handleFollow(username)}>
                  <div className="story-ring"><div className="story-avatar">{username.slice(0, 1).toUpperCase()}</div></div>
                  <strong>{username}</strong>
                  <span className="muted">{relationships[username] ? 'تتابعه الآن' : 'اقتراح جديد'}</span>
                </button>
              ))}
              {suggestions.length === 0 ? <div className="empty-mini">ستظهر اقتراحات المتابعة هنا.</div> : null}
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
