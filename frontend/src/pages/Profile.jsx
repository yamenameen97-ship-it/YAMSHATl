import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import socket from '../api/socket.js';
import { getFollowersSummary, getRelationship, getUserPosts, followUser } from '../api/users.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';

export default function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const username = routeUsername || currentUser;
  const [posts, setPosts] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const requests = [getFollowersSummary(username), getUserPosts(username)];
      if (username !== currentUser) requests.push(getRelationship(username));
      const [countsRes, postsRes, relationRes] = await Promise.all(requests);
      setCounts({
        followers: Number(countsRes?.data?.followers || 0),
        following: Number(countsRes?.data?.following || 0),
      });
      setPosts(Array.isArray(postsRes?.data) ? postsRes.data : []);
      setFollowing(Boolean(relationRes?.data?.following));
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر تحميل الملف الشخصي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) loadProfile();
  }, [username]);

  useEffect(() => {
    if (!currentUser) return undefined;
    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUser });

    const handleFollowUpdate = ({ username: actor, target_username, following: nextFollowing, followers_count, following_count }) => {
      if (target_username !== username) return;
      setCounts({ followers: Number(followers_count || 0), following: Number(following_count || 0) });
      if (actor === currentUser) setFollowing(Boolean(nextFollowing));
    };

    socket.on('user_follow_update', handleFollowUpdate);
    return () => socket.off('user_follow_update', handleFollowUpdate);
  }, [currentUser, token, username]);

  const handleFollow = async () => {
    if (!username || username === currentUser) return;

    if (socket.connected) {
      socket.emit('follow_user', { token, user: currentUser, target_username: username });
      return;
    }

    try {
      const { data } = await followUser(username);
      setFollowing(Boolean(data?.following));
      setCounts({
        followers: Number(data?.followers || counts.followers),
        following: Number(data?.following_count || counts.following),
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر تحديث المتابعة.');
    }
  };

  return (
    <MainLayout>
      <div className="profile-grid">
        <Card className="profile-card">
          <div className="profile-header">
            <div className="avatar-circle large">{username?.slice(0, 1)?.toUpperCase() || 'U'}</div>
            <div className="user-meta">
              <h3 className="section-title">{username}</h3>
              <p className="muted">ملف شخصي اجتماعي متصل بالمنشورات والمتابعات بنفس هوية Yamshat الجديدة.</p>
            </div>
            {username !== currentUser ? (
              <Button variant={following ? 'secondary' : 'primary'} onClick={handleFollow}>
                {following ? 'إلغاء المتابعة' : 'متابعة'}
              </Button>
            ) : null}
          </div>

          <div className="stats-grid compact-stats profile-stats">
            <div className="mini-stat"><strong>{posts.length}</strong><span>المنشورات</span></div>
            <div className="mini-stat"><strong>{counts.followers}</strong><span>المتابعون</span></div>
            <div className="mini-stat"><strong>{counts.following}</strong><span>يتابع</span></div>
          </div>
        </Card>

        {error ? <div className="alert error">{error}</div> : null}
        {loading ? <div className="empty-state">جارٍ تحميل الملف الشخصي...</div> : null}

        <div className="feed-stack">
          {posts.map((post) => {
            const media = post.media || post.image_url || '';
            return (
              <Card key={post.id} className="post-card">
                <div className="post-head">
                  <div>
                    <strong>{post.username}</strong>
                    <div className="muted">{post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}</div>
                  </div>
                  <div className="glass-chip">❤️ {post.likes || post.like_count || 0}</div>
                </div>
                <p className="post-text">{post.content}</p>
                {media ? (
                  /\.(mp4|mov|webm|mkv)$/i.test(media) ? (
                    <video className="post-media" src={media} controls playsInline />
                  ) : (
                    <img className="post-media" src={media} alt={post.content || 'post media'} />
                  )
                ) : null}
              </Card>
            );
          })}

          {!loading && posts.length === 0 ? <Card className="empty-card">لا توجد منشورات لهذا الحساب بعد.</Card> : null}
        </div>
      </div>
    </MainLayout>
  );
}
