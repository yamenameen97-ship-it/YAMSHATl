import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';

export default function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // posts, archive, saved
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [theme, setTheme] = useState('midnight');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    const { data } = await getProfileBundle(username);
    setProfile(data);
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await updateMyProfile({ profile_theme: newTheme });
  };

  if (!profile) return <MainLayout><div>Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Profile Header */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', marginBottom: 50 }}>
          <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 'bold' }}>
            {profile.user.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>{profile.user.username}</h2>
              {isOwnProfile ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="small" onClick={() => setShowCustomization(true)}>تخصيص المظهر</Button>
                  <Button variant="secondary" size="small" onClick={() => setShowAnalytics(true)}>📊 التحليلات</Button>
                </div>
              ) : (
                <Button size="small">متابعة</Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 30, marginBottom: 20 }}>
              <div><strong>{profile.posts_count || 0}</strong> منشور</div>
              <div><strong>{profile.followers_count || 0}</strong> متابع</div>
              <div><strong>{profile.following_count || 0}</strong> يتابع</div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{profile.user.profile?.bio || 'لا يوجد نبذة شخصية'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, borderTop: '1px solid var(--line)', marginBottom: 30 }}>
          {['posts', 'archive', 'saved'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '15px 0',
                background: 'none',
                border: 'none',
                borderTop: activeTab === t ? '1px solid white' : '1px solid transparent',
                color: activeTab === t ? 'white' : '#888',
                cursor: 'pointer',
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              {t === 'posts' ? 'المنشورات' : t === 'archive' ? 'الأرشيف' : 'المحفوظات'}
            </button>
          ))}
        </div>

        {/* Grid Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {(activeTab === 'posts' ? profile.posts : activeTab === 'archive' ? profile.archived_posts : profile.saved_posts)?.map(post => (
            <div key={post.id} style={{ aspectRatio: '1/1', background: '#222', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              <img src={post.media_url || post.image_url} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {activeTab === 'archive' && (
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>
                  📦 مؤرشف
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Modal */}
      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات الحساب الشخصي">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 }}>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--primary)' }}>12.5k</div>
              <div className="muted">زيارات الملف الشخصي</div>
            </Card>
            <Card style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#44ff44' }}>+15%</div>
              <div className="muted">معدل التفاعل</div>
            </Card>
          </div>
          <h4>أداء المنشورات (آخر 30 يوم)</h4>
          <div style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 15, display: 'flex', alignItems: 'flex-end', gap: 8, padding: 20 }}>
            {[30, 50, 40, 80, 60, 95, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', fontSize: 10 }}>{h}%</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Customization Modal */}
      <Modal isOpen={showCustomization} onClose={() => setShowCustomization(false)} title="تخصيص مظهر الملف الشخصي">
        <div style={{ padding: 20 }}>
          <h4>اختر السمة (Theme)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginTop: 15 }}>
            {['midnight', 'ocean', 'sunset', 'forest', 'aurora'].map(t => (
              <div 
                key={t} 
                onClick={() => handleThemeChange(t)}
                style={{ 
                  padding: 20, 
                  borderRadius: 12, 
                  background: t === 'midnight' ? '#0f172a' : t === 'ocean' ? '#0c4a6e' : t === 'sunset' ? '#7c2d12' : t === 'forest' ? '#064e3b' : '#4c1d95',
                  border: theme === t ? '3px solid white' : '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              >
                {t.toUpperCase()}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 30 }}>
            <h4>إعدادات متقدمة</h4>
            <div style={{ display: 'grid', gap: 15, marginTop: 15 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>إظهار شارة التحقق</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>تخطيط الشبكة المتقدم</span>
                <input type="checkbox" />
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
