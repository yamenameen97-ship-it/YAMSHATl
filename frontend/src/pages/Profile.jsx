import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { followUser, getProfileBundle, updateMyProfile } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

const PROFILE_TABS = [
  { id: 'posts', label: 'المنشورات' },
  { id: 'archive', label: 'الأرشيف' },
  { id: 'saved', label: 'المحفوظات' },
];

const THEMES = ['midnight', 'ocean', 'sunset', 'forest', 'aurora'];

function getTabItems(profile, activeTab) {
  if (!profile) return [];
  if (activeTab === 'archive') return profile.archived_posts || [];
  if (activeTab === 'saved') return profile.saved_posts || [];
  return profile.posts || [];
}

export default function Profile() {
  const { pushToast } = useToast();
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = String(username) === String(currentUser);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [theme, setTheme] = useState('midnight');
  const [busy, setBusy] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setTheme(data?.user?.profile?.profile_theme || 'midnight');
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل الملف الشخصي', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const items = useMemo(() => getTabItems(profile, activeTab), [profile, activeTab]);

  const handleThemeChange = async (newTheme) => {
    if (!isOwnProfile) return;
    try {
      setBusy(`theme-${newTheme}`);
      setTheme(newTheme);
      await updateMyProfile({ profile_theme: newTheme });
      pushToast({ type: 'success', title: 'تم حفظ السمة الجديدة' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر حفظ السمة', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  const handleFollow = async () => {
    if (isOwnProfile) return;
    try {
      setBusy('follow');
      await followUser(username);
      pushToast({ type: 'success', title: `تمت متابعة @${username}` });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر المتابعة', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return <MainLayout><div className="yam-page yam-page-narrow"><div className="yam-empty-state">جارٍ تحميل الملف الشخصي...</div></div></MainLayout>;
  }

  if (!profile?.user) {
    return <MainLayout><div className="yam-page yam-page-narrow"><div className="yam-empty-state">تعذر العثور على الملف الشخصي.</div></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-card" style={{ marginBottom: 22, padding: 26 }}>
          <div className="yam-grid" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'center' }}>
            <div className="yam-avatar-lg">{profile.user.username?.slice(0, 1)?.toUpperCase() || 'U'}</div>
            <div>
              <div className="yam-toolbar" style={{ marginBottom: 10 }}>
                <div>
                  <div className="yam-badge primary" style={{ marginBottom: 12 }}>👤 الملف الشخصي</div>
                  <h1 className="yam-section-title" style={{ marginBottom: 8 }}>@{profile.user.username}</h1>
                  <div className="yam-meta">{profile.user.profile?.bio || 'لا توجد نبذة شخصية حتى الآن.'}</div>
                </div>

                <div className="yam-action-row">
                  {isOwnProfile ? (
                    <>
                      <Button variant="secondary" onClick={() => setShowCustomization(true)}>تخصيص المظهر</Button>
                      <Button variant="secondary" onClick={() => setShowAnalytics(true)}>التحليلات</Button>
                    </>
                  ) : (
                    <Button onClick={handleFollow} loading={busy === 'follow'}>متابعة</Button>
                  )}
                </div>
              </div>

              <div className="yam-stat-grid">
                <div className="yam-stat"><strong>{profile.posts_count || 0}</strong><span className="yam-meta">منشور</span></div>
                <div className="yam-stat"><strong>{profile.followers_count || 0}</strong><span className="yam-meta">متابع</span></div>
                <div className="yam-stat"><strong>{profile.following_count || 0}</strong><span className="yam-meta">يتابع</span></div>
                <div className="yam-stat"><strong>{theme}</strong><span className="yam-meta">السمة الحالية</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="yam-card">
          <div className="yam-toolbar">
            <div className="yam-tabs">
              {PROFILE_TABS.map((tab) => (
                <button key={tab.id} type="button" className={`yam-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="yam-badge">{items.length}</span>
          </div>

          {items.length ? (
            <div className="yam-profile-grid">
              {items.map((item) => (
                <div key={item.id} className="yam-card" style={{ padding: 10, overflow: 'hidden' }}>
                  {item.media_url || item.image_url ? (
                    <img src={item.media_url || item.image_url} alt={item.content || 'post'} style={{ aspectRatio: '1 / 1', borderRadius: 18 }} />
                  ) : (
                    <div className="yam-empty-state" style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', padding: 16 }}>📝</div>
                  )}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.content ? String(item.content).slice(0, 48) : 'منشور بدون وصف'}</div>
                    <div className="yam-meta" style={{ fontSize: 12 }}>
                      ❤️ {item.likes_count || 0} · 💬 {item.comments_count || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="yam-empty-state">
              <div style={{ fontSize: 42, marginBottom: 10 }}>🗂️</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>لا توجد عناصر في هذا التبويب</div>
              <div className="yam-empty-copy">جرّب التبديل بين المنشورات والأرشيف والمحفوظات.</div>
            </div>
          )}
        </div>

        <Modal open={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات الحساب" size="large">
          <div className="yam-stat-grid">
            <div className="yam-stat"><strong>{profile.posts_count || 0}</strong><span className="yam-meta">إجمالي المنشورات</span></div>
            <div className="yam-stat"><strong>{profile.followers_count || 0}</strong><span className="yam-meta">إجمالي المتابعين</span></div>
            <div className="yam-stat"><strong>{profile.following_count || 0}</strong><span className="yam-meta">إجمالي المتابَعين</span></div>
            <div className="yam-stat"><strong>{(profile.posts || []).reduce((sum, item) => sum + Number(item.likes_count || 0), 0)}</strong><span className="yam-meta">مجموع الإعجابات</span></div>
          </div>
        </Modal>

        <Modal open={showCustomization} onClose={() => setShowCustomization(false)} title="تخصيص المظهر" size="large">
          <div className="yam-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {THEMES.map((item) => (
              <button
                key={item}
                type="button"
                className="yam-card"
                style={{
                  cursor: 'pointer',
                  background: item === 'midnight' ? '#0f172a' : item === 'ocean' ? '#0c4a6e' : item === 'sunset' ? '#7c2d12' : item === 'forest' ? '#064e3b' : '#4c1d95',
                  border: theme === item ? '2px solid white' : '2px solid transparent',
                  textAlign: 'center',
                }}
                onClick={() => handleThemeChange(item)}
              >
                <strong style={{ display: 'block', textTransform: 'uppercase' }}>{item}</strong>
                <div className="yam-meta" style={{ marginTop: 8, color: 'rgba(255,255,255,0.75)' }}>
                  {busy === `theme-${item}` ? 'جارٍ الحفظ...' : 'اختيار هذه السمة'}
                </div>
              </button>
            ))}
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
