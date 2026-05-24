import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

const THEMES = ['midnight', 'ocean', 'sunset', 'forest', 'aurora'];
const PRIVACY_LEVELS = [
  { id: 'public', label: 'عام' },
  { id: 'followers', label: 'للمتابعين' },
  { id: 'private', label: 'خاص' },
];

function isVideoPost(post) {
  const urls = Array.isArray(post?.media_urls) ? post.media_urls : [post?.media, post?.image_url, post?.media_url].filter(Boolean);
  return urls.some((url) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(String(url || '')));
}

function getPrimaryMedia(post) {
  const mediaUrls = Array.isArray(post?.media_urls) ? post.media_urls.filter(Boolean) : [];
  return mediaUrls[0] || post?.media || post?.image_url || post?.media_url || '';
}

function StatCard({ label, value, hint, color = 'var(--primary)' }) {
  return (
    <Card style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.04)' }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {hint ? <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{hint}</div> : null}
    </Card>
  );
}

export default function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    bio: '',
    activity_tagline: '',
    avatar: '',
    cover_photo: '',
    profile_theme: 'midnight',
    privacy_level: 'public',
    badges: '',
  });

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setForm({
        username: data?.user?.username || username,
        bio: data?.user?.profile?.bio || '',
        activity_tagline: data?.user?.profile?.activity_tagline || '',
        avatar: data?.user?.avatar || '',
        cover_photo: data?.user?.profile?.cover_photo || '',
        profile_theme: data?.profile_insights?.theme || data?.user?.profile?.profile_theme || 'midnight',
        privacy_level: data?.user?.profile?.privacy_level || 'public',
        badges: Array.isArray(data?.user?.profile?.badges) ? data.user.profile.badges.join(', ') : '',
      });
    } catch (error) {
      console.error('Failed to load profile', error);
      setProfile({
        user: { username, avatar: '', profile: { bio: '', activity_tagline: '' } },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        saved_posts: [],
        liked_posts: [],
        activity_timeline: [],
      });
    }
  };

  const posts = Array.isArray(profile?.posts) ? profile.posts : [];
  const savedPosts = Array.isArray(profile?.saved_posts) ? profile.saved_posts : [];
  const pinnedPosts = useMemo(() => [...posts].sort((a, b) => ((b?.like_count || 0) + (b?.save_count || 0)) - ((a?.like_count || 0) + (a?.save_count || 0))).slice(0, 3), [posts]);
  const mediaPosts = useMemo(() => posts.filter((post) => Boolean(getPrimaryMedia(post))), [posts]);
  const reelsPosts = useMemo(() => posts.filter(isVideoPost), [posts]);

  const tabs = [
    { id: 'posts', label: 'المنشورات', items: posts },
    { id: 'pinned', label: 'المثبتة', items: pinnedPosts },
    { id: 'media', label: 'الوسائط', items: mediaPosts },
    { id: 'reels', label: 'الريلز', items: reelsPosts },
    { id: 'saved', label: 'المحفوظات', items: savedPosts, ownOnly: true },
    { id: 'timeline', label: 'النشاط', items: profile?.activity_timeline || [] },
  ].filter((tab) => !tab.ownOnly || isOwnProfile);

  const activeItems = tabs.find((tab) => tab.id === activeTab)?.items || [];

  const submitProfileEdit = async () => {
    try {
      setSaving(true);
      await updateMyProfile({
        username: form.username,
        bio: form.bio,
        activity_tagline: form.activity_tagline,
        avatar: form.avatar,
        cover_photo: form.cover_photo,
        profile_theme: form.profile_theme,
        privacy_level: form.privacy_level,
        badges: form.badges.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setShowEditModal(false);
      await loadProfile();
    } catch (error) {
      console.error('Failed to update profile', error);
      alert(error?.response?.data?.detail || error?.message || 'تعذر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div>Loading...</div>;

  const completion = profile?.profile_insights?.profile_completion || 0;
  const engagementRate = profile?.creator_dashboard?.engagement_rate || 0;
  const walletCoins = profile?.creator_dashboard?.wallet?.coin_balance || 0;
  const followersHint = profile?.followers_analytics?.growth_hint || 'مستقر';

  return (
    <MainLayout>
      <div className="profile-page desktop-post mobile-post" style={{ maxWidth: 1080, margin: '0 auto', padding: '30px 18px 60px' }}>
        <div style={{ borderRadius: 28, overflow: 'hidden', marginBottom: 26, background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.18))', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ minHeight: 180, backgroundImage: profile?.user?.profile?.cover_photo ? `url(${profile.user.profile.cover_photo})` : 'linear-gradient(135deg, rgba(59,130,246,0.30), rgba(16,185,129,0.22))', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ padding: '0 24px 24px', marginTop: -54 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-end' }}>
              <div style={{ width: 112, height: 112, borderRadius: '50%', background: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 'bold', overflow: 'hidden', border: '4px solid rgba(15,23,42,0.95)' }}>
                {profile.user.avatar ? <img src={profile.user.avatar} alt={profile.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile.user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <h2 style={{ margin: 0 }}>{profile.user.username}</h2>
                  {profile?.user?.profile?.is_verified ? <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.16)', color: '#6ee7b7', fontSize: 12 }}>موثق</span> : null}
                  <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: 'var(--muted)', fontSize: 12 }}>{profile?.user?.profile?.activity_tagline || 'حساب اجتماعي'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 14 }}>
                  <div><strong>{profile.counts?.posts ?? 0}</strong> منشور</div>
                  <div><strong>{profile.counts?.followers ?? 0}</strong> متابع</div>
                  <div><strong>{profile.counts?.following ?? 0}</strong> يتابع</div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{profile.user.profile?.bio || 'أضف نبذة مختصرة تعرف بيك.'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {isOwnProfile ? (
                  <>
                    <Button variant="secondary" onClick={() => setShowEditModal(true)}>✏️ تعديل البروفايل</Button>
                    <Button onClick={() => setShowAnalytics(true)}>📊 التحليلات</Button>
                  </>
                ) : (
                  <Button>متابعة</Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="اكتمال الملف" value={`${completion}%`} hint="كل ما تكمل بياناتك فرص الظهور تزيد" />
          <StatCard label="معدل التفاعل" value={engagementRate} hint={profile?.creator_dashboard?.best_next_step || 'حافظ على النشر المنتظم'} color="#22c55e" />
          <StatCard label="محفظة الحساب" value={`${walletCoins} عملة`} hint="جاهز للهدايا والدعم" color="#f59e0b" />
          <StatCard label="نمو المتابعين" value={followersHint} hint={`${profile?.followers_analytics?.engaged_followers || 0} متابع متفاعل`} color="#a78bfa" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18, borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: activeTab === tab.id ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.08)',
                background: activeTab === tab.id ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? 'white' : 'var(--muted)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'timeline' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {activeItems.length ? activeItems.map((item, index) => (
              <Card key={`${item.type}-${index}`} style={{ padding: 18, borderRadius: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <strong>{item.label}</strong>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>{item.description}</p>
                  </div>
                  <small className="muted">{item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
                </div>
              </Card>
            )) : <Card style={{ padding: 24, textAlign: 'center' }}>لا يوجد نشاط ظاهر حالياً</Card>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {activeItems.length ? activeItems.map((post) => {
              const media = getPrimaryMedia(post);
              const isVideo = isVideoPost(post);
              return (
                <Card key={post.id} style={{ padding: 0, overflow: 'hidden', borderRadius: 18, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ aspectRatio: '1 / 1', background: '#111827', position: 'relative', display: 'grid', placeItems: 'center' }}>
                    {media ? (
                      isVideo ? (
                        <video src={media} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={media} alt={post.content || 'post'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : (
                      <div style={{ padding: 20, color: 'var(--muted)', textAlign: 'center' }}>{post.content || 'بدون وسائط'}</div>
                    )}
                    {activeTab === 'pinned' ? <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.18)', color: '#fbbf24', fontSize: 12 }}>📌 مثبت</div> : null}
                    {activeTab === 'reels' || isVideo ? <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.18)', color: '#93c5fd', fontSize: 12 }}>🎬 Reel</div> : null}
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{(post.content || 'منشور بدون نص').slice(0, 70)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 12 }}>
                      <span>❤️ {post.like_count || post.likes || 0}</span>
                      <span>💾 {post.save_count || 0}</span>
                    </div>
                  </div>
                </Card>
              );
            }) : <Card style={{ padding: 28, textAlign: 'center', gridColumn: '1 / -1' }}>لا يوجد محتوى في هذا التبويب</Card>}
          </div>
        )}
      </div>

      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات الحساب الشخصي" size="large">
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatCard label="أفضل خطوة" value={profile?.creator_dashboard?.best_next_step || 'استمر'} hint="اقتراح ذكي لتحسين الحساب" />
            <StatCard label="الإنجازات" value={(profile?.achievements || []).length} hint={(profile?.achievements || []).join(' • ') || 'ابدأ أول إنجاز'} color="#22c55e" />
            <StatCard label="الأصدقاء المقربون" value={profile?.followers_analytics?.close_friends_count || 0} hint="من لوحة الملف الشخصي" color="#f97316" />
            <StatCard label="الوسائط" value={mediaPosts.length} hint={`${reelsPosts.length} ريلز تقريباً`} color="#38bdf8" />
          </div>
          <Card style={{ padding: 20, borderRadius: 20 }}>
            <h4 style={{ marginTop: 0 }}>ملخص سريع</h4>
            <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.9 }}>
              <li>المنشورات المثبتة بتجيب أفضل تفاعل حالياً: {pinnedPosts.length}</li>
              <li>أكتر نوع محتوى ظاهر عندك: {reelsPosts.length > mediaPosts.length / 2 ? 'فيديو/ريلز' : 'صور ومنشورات عادية'}</li>
              <li>نصيحة سريعة: {profile?.creator_dashboard?.best_next_step || 'استمر على نفس النسق'}</li>
            </ul>
          </Card>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل الملف الشخصي" size="large">
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>اسم المستخدم</span>
              <input value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} placeholder="اسم المستخدم" />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>عنوان قصير</span>
              <input value={form.activity_tagline} onChange={(event) => setForm((prev) => ({ ...prev, activity_tagline: event.target.value }))} placeholder="مثلاً: صانع محتوى" />
            </label>
          </div>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>النبذة</span>
            <textarea rows={4} value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} placeholder="اكتب نبذة عنك" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>رابط الصورة الشخصية</span>
              <input value={form.avatar} onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))} placeholder="https://..." />
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>رابط الغلاف</span>
              <input value={form.cover_photo} onChange={(event) => setForm((prev) => ({ ...prev, cover_photo: event.target.value }))} placeholder="https://..." />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>الثيم</span>
              <select value={form.profile_theme} onChange={(event) => setForm((prev) => ({ ...prev, profile_theme: event.target.value }))}>
                {THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 8 }}>
              <span>الخصوصية</span>
              <select value={form.privacy_level} onChange={(event) => setForm((prev) => ({ ...prev, privacy_level: event.target.value }))}>
                {PRIVACY_LEVELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>الشارات</span>
            <input value={form.badges} onChange={(event) => setForm((prev) => ({ ...prev, badges: event.target.value }))} placeholder="creator, verified, vip" />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
            <Button onClick={submitProfileEdit} loading={saving}>حفظ التعديلات</Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
