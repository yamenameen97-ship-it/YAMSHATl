import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ProfileSkeleton } from '../components/feedback/Skeleton.jsx';
import {
  addCloseFriend,
  followUser,
  getMe,
  getProfileBundle,
  muteUser,
  removeCloseFriend,
  unmuteUser,
  updateMyProfile,
  uploadAvatar,
} from '../api/users.js';
import { getCurrentUsername, mergeStoredUser } from '../utils/auth.js';

const TABS = [
  { key: 'posts', label: 'المنشورات' },
  { key: 'saved', label: 'المحفوظات' },
  { key: 'liked', label: 'المعجب بها' },
];

function MediaPreview({ post }) {
  const media = post?.image_url || post?.media || post?.media_urls?.[0] || '';
  if (!media) return null;
  if (/\.(mp4|mov|webm|mkv)$/i.test(media)) {
    return <video className="post-media" src={media} controls playsInline />;
  }
  return <img className="post-media" src={media} alt={post?.content || 'post media'} />;
}

export default function Profile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [resolvedUsername, setResolvedUsername] = useState(routeUsername || currentUser || '');
  const username = routeUsername || resolvedUsername || currentUser;
  const isOwnProfile = Boolean(username) && username === currentUser;
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('posts');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [form, setForm] = useState({
    username: username || '',
    avatar: '',
    cover_photo: '',
    bio: '',
    profile_theme: 'midnight',
    privacy_level: 'public',
    activity_tagline: '',
    badges: [],
  });

  useEffect(() => {
    let active = true;

    const resolveUsername = async () => {
      if (routeUsername) {
        setResolvedUsername(routeUsername);
        return;
      }
      if (currentUser) {
        setResolvedUsername(currentUser);
        return;
      }
      try {
        const { data } = await getMe();
        if (!active) return;
        setResolvedUsername(data?.username || data?.user || '');
      } catch {
        if (active) setResolvedUsername('');
      }
    };

    resolveUsername();
    return () => {
      active = false;
    };
  }, [currentUser, routeUsername]);

  const loadProfile = async () => {
    if (!username) {
      setLoading(false);
      setError('تعذر تحديد الحساب المطلوب فتحه.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { data } = await getProfileBundle(username);
      setBundle(data || null);
      const profile = data?.user?.profile || {};
      setForm({
        username: data?.user?.username || username,
        avatar: data?.user?.avatar || '',
        cover_photo: profile?.cover_photo || '',
        bio: profile?.bio || '',
        profile_theme: profile?.profile_theme || 'midnight',
        privacy_level: profile?.privacy_level || 'public',
        activity_tagline: profile?.activity_tagline || '',
        badges: Array.isArray(profile?.badges) ? profile.badges : [],
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل الملف الشخصي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const activeItems = useMemo(() => {
    if (!bundle) return [];
    if (tab === 'saved') return bundle.saved_posts || [];
    if (tab === 'liked') return bundle.liked_posts || [];
    return bundle.posts || [];
  }, [bundle, tab]);

  const handleUploadChange = (setter) => (event) => {
    const file = event.target.files?.[0];
    if (!file?.type?.startsWith('image/')) return;
    setter(file);
  };

  const uploadImage = async (file) => {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await uploadAvatar(formData);
    return data?.file_url || data?.url || '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const avatar = avatarFile ? await uploadImage(avatarFile) : form.avatar;
      const cover_photo = coverFile ? await uploadImage(coverFile) : form.cover_photo;
      const { data } = await updateMyProfile({
        ...form,
        avatar,
        cover_photo,
        badges: Array.isArray(form.badges) ? form.badges : [],
      });
      mergeStoredUser(data);
      setEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
      if (routeUsername && routeUsername !== data?.username) {
        navigate(`/profile/${encodeURIComponent(data?.username)}`, { replace: true });
      }
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر حفظ الملف الشخصي.');
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    try {
      await followUser(username);
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحديث المتابعة.');
    }
  };

  const handleMute = async () => {
    try {
      const isMuted = Boolean(bundle?.relationship?.muted);
      if (isMuted) await unmuteUser(username);
      else await muteUser(username);
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحديث الكتم.');
    }
  };

  const handleCloseFriend = async () => {
    try {
      const isCloseFriend = Boolean(bundle?.relationship?.close_friend);
      if (isCloseFriend) await removeCloseFriend(username);
      else await addCloseFriend(username);
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحديث قائمة الأصدقاء المقرّبين.');
    }
  };

  if (loading) {
    return <MainLayout><ProfileSkeleton /></MainLayout>;
  }

  if (error && !bundle) {
    return <MainLayout><ErrorState title="تعذر فتح الملف الشخصي" description={error} onRetry={loadProfile} /></MainLayout>;
  }

  const user = bundle?.user || {};
  const profile = user?.profile || {};
  const relationship = bundle?.relationship || {};

  return (
    <MainLayout>
      <div className={`profile-shell profile-theme-${profile.profile_theme || 'midnight'}`}>
        <Card className="profile-cover-card">
          <div className="profile-cover" style={{ backgroundImage: form.cover_photo ? `url(${form.cover_photo})` : undefined }}>
            <div className="profile-cover-overlay">
              <div className="profile-avatar-stack">
                {form.avatar ? <img src={form.avatar} alt={user.username} className="avatar-circle xl avatar-image" /> : <div className="avatar-circle xl">{user.username?.slice(0, 1)?.toUpperCase() || 'U'}</div>}
                <div>
                  <div className="profile-title-row">
                    <h2 className="section-title">{user.username}</h2>
                    {profile.is_verified ? <span className="glass-chip">✔ موثّق</span> : null}
                    {(profile.badges || []).slice(0, 4).map((badge) => <span key={badge} className="glass-chip">{badge}</span>)}
                  </div>
                  <p className="muted no-margin">{profile.activity_tagline || 'ملف شخصي متكامل لصُنّاع المحتوى والمتابعين.'}</p>
                  <p className="profile-bio">{profile.bio || 'أضف نبذة تعريفية مميزة تعكس أسلوبك ومحتواك.'}</p>
                </div>
              </div>
              <div className="hero-actions-wrap">
                {isOwnProfile ? (
                  <Button variant="secondary" onClick={() => setEditing((prev) => !prev)}>{editing ? 'إغلاق التعديل' : 'تعديل البروفايل'}</Button>
                ) : (
                  <>
                    <Button variant={relationship.following ? 'secondary' : 'primary'} onClick={handleFollow}>{relationship.following ? 'إلغاء المتابعة' : 'متابعة'}</Button>
                    <Button variant="secondary" onClick={handleMute}>{relationship.muted ? 'إلغاء الكتم' : 'كتم'}</Button>
                    <Button variant="secondary" onClick={handleCloseFriend}>{relationship.close_friend ? 'إزالة من المقرّبين' : 'إضافة للمقرّبين'}</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <section className="kpi-grid profile-kpis">
          <Card className="mini-stat"><strong>{bundle?.counts?.posts || 0}</strong><span>المنشورات</span></Card>
          <Card className="mini-stat"><strong>{bundle?.counts?.followers || 0}</strong><span>المتابعون</span></Card>
          <Card className="mini-stat"><strong>{bundle?.counts?.following || 0}</strong><span>يتابع</span></Card>
          <Card className="mini-stat"><strong>{bundle?.profile_insights?.profile_completion || 0}%</strong><span>اكتمال البروفايل</span></Card>
        </section>

        {editing && isOwnProfile ? (
          <Card className="profile-editor-card">
            <div className="card-head split"><h3 className="section-title">تخصيص البروفايل</h3><span className="badge">Theme + Privacy + Identity</span></div>
            <div className="profile-editor-grid">
              <Input label="اسم المستخدم" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
              <Input label="الثيم" value={form.profile_theme} onChange={(event) => setForm((prev) => ({ ...prev, profile_theme: event.target.value }))} />
              <Input label="الخصوصية" value={form.privacy_level} onChange={(event) => setForm((prev) => ({ ...prev, privacy_level: event.target.value }))} />
              <Input label="سطر تعريفي" value={form.activity_tagline} onChange={(event) => setForm((prev) => ({ ...prev, activity_tagline: event.target.value }))} />
              <div className="profile-upload-group">
                <label className="upload-label"><input type="file" accept="image/*" onChange={handleUploadChange(setAvatarFile)} hidden />رفع الصورة الشخصية</label>
                <label className="upload-label"><input type="file" accept="image/*" onChange={handleUploadChange(setCoverFile)} hidden />رفع صورة الغلاف</label>
              </div>
              <div className="input-shell textarea-shell profile-textarea-shell">
                <label>النبذة</label>
                <textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} rows={4} placeholder="عرّف الناس بنفسك، تخصصك، أو نوع المحتوى اللي بتقدمه" />
              </div>
            </div>
            <div className="hero-actions-wrap">
              <Button onClick={handleSave} loading={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</Button>
            </div>
          </Card>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        <section className="analytics-grid profile-analytics-grid">
          <Card>
            <div className="card-head split"><h3 className="section-title">Profile Insights</h3><span className="badge">Insights</span></div>
            <div className="dashboard-mini-summary">
              <div><strong>{bundle?.followers_analytics?.growth_hint || '—'}</strong><span>اتجاه النمو</span></div>
              <div><strong>{bundle?.followers_analytics?.engaged_followers || 0}</strong><span>متابعون متفاعلون</span></div>
              <div><strong>{bundle?.creator_dashboard?.engagement_rate || 0}</strong><span>Engagement</span></div>
            </div>
            <p className="muted">{bundle?.creator_dashboard?.best_next_step || 'استمر في التفاعل وبناء مجتمعك.'}</p>
          </Card>

          <Card>
            <div className="card-head split"><h3 className="section-title">Achievements & Privacy</h3><span className="badge">Profile</span></div>
            <div className="badge-row">
              {(bundle?.achievements || []).length ? bundle.achievements.map((item) => <span key={item} className="glass-chip">{item}</span>) : <span className="glass-chip">ابدأ أول إنجاز جديد</span>}
            </div>
            <div className="profile-list compact">
              <div><strong>الخصوصية:</strong> <span>{bundle?.privacy?.level || 'public'}</span></div>
              <div><strong>الثيم:</strong> <span>{bundle?.profile_insights?.theme || 'midnight'}</span></div>
              <div><strong>الموثوقية:</strong> <span>{profile.is_verified ? 'Verified Badge' : 'لم يتم التوثيق بعد'}</span></div>
            </div>
          </Card>
        </section>

        {isOwnProfile ? (
          <section className="analytics-grid profile-analytics-grid">
            <Card>
              <div className="card-head split"><h3 className="section-title">Saved / Liked / Close Friends</h3><span className="badge">Creator Dashboard</span></div>
              <div className="dashboard-mini-summary">
                <div><strong>{bundle?.saved_posts?.length || 0}</strong><span>Saved Posts</span></div>
                <div><strong>{bundle?.liked_posts?.length || 0}</strong><span>Liked Posts</span></div>
                <div><strong>{bundle?.close_friends?.length || 0}</strong><span>Close Friends</span></div>
              </div>
              <div className="profile-list compact">
                <div><strong>Block List:</strong> <span>{bundle?.block_list?.length || 0}</span></div>
                <div><strong>Muted Users:</strong> <span>{bundle?.muted_users?.length || 0}</span></div>
                <div><strong>Wallet:</strong> <span>{user?.wallet?.coin_balance || 0} coins</span></div>
              </div>
            </Card>

            <Card>
              <div className="card-head split"><h3 className="section-title">Activity Timeline</h3><span className="badge">Timeline</span></div>
              {(bundle?.activity_timeline || []).length ? (
                <div className="timeline-list">
                  {bundle.activity_timeline.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="timeline-item">
                      <strong>{item.label}</strong>
                      <p>{item.description}</p>
                      <small>{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon="🕒" title="لا يوجد نشاط بعد" description="أول تفاعل أو منشور هيتسجل هنا." />}
            </Card>
          </section>
        ) : null}

        <Card>
          <div className="card-head split"><h3 className="section-title">مكتبة المحتوى</h3><div className="tab-row">{TABS.filter((item) => isOwnProfile || item.key === 'posts').map((item) => <button key={item.key} type="button" className={`tab-btn ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>{item.label}</button>)}</div></div>
          {activeItems.length ? (
            <div className="feed-stack">
              {activeItems.map((post) => (
                <Card key={`${tab}-${post.id}`} className="post-card">
                  <div className="post-head">
                    <div>
                      <strong>{post.username}</strong>
                      <div className="muted">{post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : 'الآن'}</div>
                    </div>
                    <div className="story-viewer-actions">
                      <span className="glass-chip">❤️ {post.likes || post.like_count || 0}</span>
                      {'saved_by_me' in post ? <span className="glass-chip">💾 {post.saved_by_me ? 'محفوظ' : 'غير محفوظ'}</span> : null}
                    </div>
                  </div>
                  <p className="post-text">{post.content}</p>
                  <MediaPreview post={post} />
                </Card>
              ))}
            </div>
          ) : <EmptyState icon="🗂️" title="لا توجد عناصر في هذا القسم" description="أضف محتوى جديد أو جرّب قسم تاني." />}
        </Card>
      </div>
    </MainLayout>
  );
}
