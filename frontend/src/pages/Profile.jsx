import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import socket from '../api/socket.js';
import { getFollowersSummary, getRelationship, getUserPosts, followUser, updateMyProfile, uploadAvatar } from '../api/users.js';
import { getAuthToken, getCurrentUsername, mergeStoredUser } from '../utils/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';

export default function Profile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;
  const [posts, setPosts] = useState([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileForm, setProfileForm] = useState({ username: username || '', avatar: '' });

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profileForm.avatar || '';
  }, [avatarFile, profileForm.avatar]);

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
      const firstAvatar = Array.isArray(postsRes?.data) ? '' : '';
      setProfileForm((prev) => ({ ...prev, username, avatar: prev.avatar || firstAvatar || '' }));
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
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('يمكن رفع صور فقط للصورة الشخصية.');
      return;
    }
    setError('');
    setAvatarFile(file);
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      setError('');
      let avatarUrl = profileForm.avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const { data } = await uploadAvatar(formData);
        avatarUrl = data?.file_url || data?.url || avatarUrl;
      }
      const payload = {
        username: sanitizeInputText(profileForm.username, { maxLength: 50 }),
        avatar: avatarUrl,
      };
      const { data } = await updateMyProfile(payload);
      mergeStoredUser(data);
      setProfileForm({ username: data?.username || payload.username, avatar: data?.avatar || avatarUrl || '' });
      setAvatarFile(null);
      setEditing(false);
      if (routeUsername && routeUsername !== (data?.username || payload.username)) {
        navigate(`/profile/${encodeURIComponent(data?.username || payload.username)}`, { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'تعذر حفظ الملف الشخصي.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="profile-grid">
        <Card className="profile-card">
          <div className="profile-header">
            {avatarPreview ? (
              <img src={avatarPreview} alt={username} className="avatar-circle large avatar-image" />
            ) : (
              <div className="avatar-circle large">{username?.slice(0, 1)?.toUpperCase() || 'U'}</div>
            )}
            <div className="user-meta">
              <h3 className="section-title">{username}</h3>
              <p className="muted">ملف شخصي اجتماعي متصل بالمنشورات والمتابعات بنفس هوية Yamshat الجديدة.</p>
            </div>
            {username !== currentUser ? (
              <Button variant={following ? 'secondary' : 'primary'} onClick={handleFollow}>
                {following ? 'إلغاء المتابعة' : 'متابعة'}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setEditing((prev) => !prev)}>
                {editing ? 'إغلاق التعديل' : 'تعديل الملف الشخصي'}
              </Button>
            )}
          </div>

          <div className="stats-grid compact-stats profile-stats">
            <div className="mini-stat"><strong>{posts.length}</strong><span>المنشورات</span></div>
            <div className="mini-stat"><strong>{counts.followers}</strong><span>المتابعون</span></div>
            <div className="mini-stat"><strong>{counts.following}</strong><span>يتابع</span></div>
          </div>

          {isOwnProfile && editing ? (
            <div className="profile-edit-grid">
              <Input
                label="اسم المستخدم"
                value={profileForm.username}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="اسم المستخدم"
              />
              <div className="profile-edit-actions">
                <label className="upload-label">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                  رفع صورة شخصية
                </label>
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </div>
          ) : null}
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
