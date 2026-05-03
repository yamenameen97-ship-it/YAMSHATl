import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import socket from '../api/socket.js';
import { addComment, createPost, getComments, getPosts, uploadPostMedia } from '../api/posts.js';
import { getUsers, getFollowersSummary, getRelationship, followUser } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

const EMPTY_COUNTS = { followers: 0, following: 0 };

function normalizePost(post, comments = []) {
  return {
    ...post,
    comments,
    liked_by_me: Boolean(post?.liked_by_me),
    comments_count: Number(post?.comments_count || comments.length || 0),
    likes: Number(post?.likes || 0),
  };
}

export default function Feed() {
  const currentUser = getCurrentUsername();
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [relationships, setRelationships] = useState({});
  const [socialCounts, setSocialCounts] = useState({});
  const [form, setForm] = useState({ text: '', file: null });
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError('');
      const [{ data: postsData }, { data: usersData }] = await Promise.all([getPosts(), getUsers()]);
      const rawPosts = Array.isArray(postsData) ? postsData : [];
      const users = (Array.isArray(usersData) ? usersData : [])
        .map((item) => item?.name)
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

      setRelationships(Object.fromEntries(relationEntries));
      setSocialCounts(Object.fromEntries(countsEntries));
      setSuggestions(users.slice(0, 8));
      setPosts(rawPosts.map((post) => normalizePost(post, commentsMap[post.id] || [])));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل الصفحة الرئيسية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { user: currentUser });

    const handleLiked = ({ post_id, likes, liked, username }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === post_id
            ? {
                ...post,
                likes,
                liked_by_me: username === currentUser ? Boolean(liked) : post.liked_by_me,
              }
            : post
        )
      );
    };

    const handleCommentAdded = ({ post_id, comment }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === post_id
            ? {
                ...post,
                comments: [...post.comments, comment],
                comments_count: (post.comments_count || post.comments.length || 0) + 1,
              }
            : post
        )
      );
    };

    const handleFollowUpdate = ({ username, target_username, following, followers_count, following_count }) => {
      if (username === currentUser) {
        setRelationships((prev) => ({ ...prev, [target_username]: following }));
      }
      setSocialCounts((prev) => ({
        ...prev,
        [target_username]: {
          followers: Number(followers_count || prev[target_username]?.followers || 0),
          following: Number(following_count || prev[target_username]?.following || 0),
        },
      }));
    };

    socket.on('post_liked', handleLiked);
    socket.on('comment_added', handleCommentAdded);
    socket.on('user_follow_update', handleFollowUpdate);

    return () => {
      socket.off('post_liked', handleLiked);
      socket.off('comment_added', handleCommentAdded);
      socket.off('user_follow_update', handleFollowUpdate);
    };
  }, [currentUser]);

  const handlePublish = async () => {
    if (!form.text.trim() && !form.file) return;

    try {
      setPublishing(true);
      setError('');
      let media = '';
      if (form.file) {
        const { data } = await uploadPostMedia(form.file);
        media = data?.file_url || data?.url || '';
      }
      await createPost({ content: form.text.trim(), media });
      setForm({ text: '', file: null });
      await loadFeed();
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر نشر المنشور.');
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;

    if (!socket.connected) socket.connect();
    socket.emit('like_post', { post_id: postId, user: currentUser });
  };

  const handleComment = async (postId) => {
    const text = (commentText[postId] || '').trim();
    if (!text || !currentUser) return;

    if (socket.connected) {
      socket.emit('add_comment', { post_id: postId, user: currentUser, text });
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      return;
    }

    try {
      const { data } = await addComment(postId, text);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [...post.comments, data],
                comments_count: (post.comments_count || post.comments.length || 0) + 1,
              }
            : post
        )
      );
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر إضافة التعليق.');
    }
  };

  const handleFollow = async (username) => {
    if (!username || username === currentUser) return;

    if (socket.connected) {
      socket.emit('follow_user', { user: currentUser, target_username: username });
      return;
    }

    try {
      const { data } = await followUser(username);
      setRelationships((prev) => ({ ...prev, [username]: Boolean(data?.following) }));
      setSocialCounts((prev) => ({
        ...prev,
        [username]: {
          followers: Number(data?.followers || prev[username]?.followers || 0),
          following: Number(data?.following_count || prev[username]?.following || 0),
        },
      }));
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحديث المتابعة.');
    }
  };

  const feedStats = useMemo(() => {
    const totalComments = posts.reduce((sum, post) => sum + Number(post.comments_count || 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + Number(post.likes || 0), 0);
    return [
      { label: 'المنشورات', value: posts.length },
      { label: 'التفاعلات', value: totalLikes },
      { label: 'التعليقات', value: totalComments },
    ];
  }, [posts]);

  return (
    <MainLayout>
      <section className="feed-layout">
        <div className="feed-main">
          <Card className="composer-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🏠 الرئيسية</h3>
                <p className="muted">أنشر الآن، وتابع الإعجابات والتعليقات لحظياً بنفس الستايل الداكن الجديد.</p>
              </div>
            </div>

            <textarea
              className="composer-textarea"
              placeholder="اكتب منشورك هنا..."
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
            />

            <div className="composer-actions">
              <label className="upload-label">
                📷 اختيار صورة أو فيديو
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                />
              </label>
              <div className="muted truncate">{form.file?.name || 'لا يوجد ملف مرفق'}</div>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? 'جارٍ النشر...' : 'نشر الآن'}
              </Button>
            </div>
          </Card>

          {error ? <div className="alert error">{error}</div> : null}
          {loading ? <div className="empty-state">جارٍ تحميل المنشورات...</div> : null}

          <div className="feed-stack">
            {posts.map((post) => {
              const isFollowing = relationships[post.username];
              const counts = socialCounts[post.username] || EMPTY_COUNTS;
              const mediaUrl = post.media || '';
              const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(mediaUrl);

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

                  <p className="post-text">{post.content}</p>

                  {mediaUrl ? (
                    isVideo ? (
                      <video className="post-media" src={mediaUrl} controls playsInline />
                    ) : (
                      <img className="post-media" src={mediaUrl} alt={post.content || 'post media'} />
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
                    {post.comments.map((comment) => (
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
        </div>

        <div className="feed-side">
          <Card>
            <h3 className="section-title">نظرة سريعة</h3>
            <div className="stats-grid compact-stats">
              {feedStats.map((item) => (
                <div key={item.label} className="mini-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">اقتراحات للمتابعة</h3>
                <p className="muted">حسابات نشطة داخل الشبكة.</p>
              </div>
            </div>
            <div className="list-grid">
              {suggestions.length === 0 ? <div className="empty-mini">لا توجد اقتراحات حالياً.</div> : null}
              {suggestions.map((name) => (
                <div key={name} className="suggestion-row">
                  <Link to={`/profile/${encodeURIComponent(name)}`} className="user-row compact-row suggestion-link">
                    <div className="avatar-circle">{name.slice(0, 1).toUpperCase()}</div>
                    <div className="user-meta">
                      <strong>{name}</strong>
                      <span className="muted">{socialCounts[name]?.followers || 0} متابع</span>
                    </div>
                  </Link>
                  <button type="button" className="mini-action" onClick={() => handleFollow(name)}>
                    {relationships[name] ? 'إلغاء المتابعة' : 'متابعة'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
