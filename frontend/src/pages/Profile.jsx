import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getProfileBundle, updateMyProfile } from '../api/users.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useToast } from '../components/admin/ToastProvider.jsx';

export default function Profile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [theme, setTheme] = useState('midnight');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data } = await getProfileBundle(username);
      setProfile(data);
    } catch (error) {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الملف الشخصي' });
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateMyProfile({ profile_theme: newTheme });
      pushToast({ type: 'success', title: 'تم تحديث المظهر' });
    } catch (error) {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحديث المظهر' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    pushToast({ type: 'success', title: 'تم تسجيل الخروج' });
    navigate('/login');
  };

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-white/60">جاري التحميل...</div>
        </div>
      </MainLayout>
    );
  }

  const badges = [
    { id: 1, name: 'محترف', icon: '🏆', description: 'منشئ محتوى متميز' },
    { id: 2, name: 'نجم', icon: '⭐', description: 'أكثر من 1M متابع' },
    { id: 3, name: 'عبقري', icon: '🧠', description: 'محتوى تعليمي متميز' },
    { id: 4, name: 'حارس', icon: '🛡️', description: 'مجتمع آمن وإيجابي' }
  ];

  const groups = [
    { id: 1, name: 'Gamers Hub', icon: '🎮', memberCount: 12500, isJoined: true },
    { id: 2, name: 'VALORANT Arabia', icon: '🎯', memberCount: 8700, isJoined: true },
    { id: 3, name: 'Tech Talk', icon: '💻', memberCount: 5200, isJoined: false }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Banner */}
        <div className="h-64 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2220%22 cy=%2220%22 r=%222%22 fill=%22white%22/%3E%3Ccircle cx=%2280%22 cy=%2280%22 r=%222%22 fill=%22white%22/%3E%3C/svg%3E')] bg-repeat"></div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="max-w-6xl mx-auto px-4 relative -mt-20 mb-8">
          <div className="flex gap-8 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center border-4 border-slate-900 shadow-lg">
                <span className="text-6xl font-bold">{profile.user.username[0].toUpperCase()}</span>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{profile.user.username}</h1>
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-white/60 mb-4">@{profile.user.username}</p>
              <p className="text-white mb-6 leading-relaxed max-w-2xl">{profile.user.profile?.bio || 'لا يوجد نبذة شخصية'}</p>
              
              <div className="flex gap-4 text-sm text-white/70 mb-6">
                <span>📍 السعودية</span>
                <span>📅 انضم في مايو 2022</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => setShowCustomization(true)}
                      className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-white font-bold transition-all"
                    >
                      تعديل الملف الشخصي
                    </button>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600/20 hover:bg-red-600/30 px-6 py-2 rounded-lg text-red-400 font-bold transition-all border border-red-600/50"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-white font-bold transition-all">
                    متابعة
                  </button>
                )}
                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-all">
                  ⋯
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {(profile.followers_count || 0).toLocaleString('ar-SA')}
              </div>
              <div className="text-white/60 text-sm mt-1">المتابعون</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {(profile.following_count || 0).toLocaleString('ar-SA')}
              </div>
              <div className="text-white/60 text-sm mt-1">يتابع</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                {(profile.posts_count || 0).toLocaleString('ar-SA')}
              </div>
              <div className="text-white/60 text-sm mt-1">المنشورات</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
                12.5k
              </div>
              <div className="text-white/60 text-sm mt-1">الإعجابات</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">الإنجازات</h2>
          <div className="grid grid-cols-4 gap-4">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="bg-white/5 border border-purple-500/30 rounded-lg p-4 text-center hover:border-purple-500/60 transition-all cursor-pointer group"
                title={badge.description}
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{badge.icon}</div>
                <div className="text-white font-bold text-sm">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="flex gap-8 border-b border-white/10">
            {[
              { id: 'posts', label: '📹 المنشورات', icon: '📹' },
              { id: 'likes', label: '❤️ الإعجابات', icon: '❤️' },
              { id: 'groups', label: '👥 المجموعات', icon: '👥' },
              { id: 'about', label: 'ℹ️ عن', icon: 'ℹ️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-white border-b-purple-500'
                    : 'text-white/60 border-b-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-4">
              {(profile.posts || []).map(post => (
                <div
                  key={post.id}
                  className="aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer relative"
                >
                  <img
                    src={post.media_url || post.image_url}
                    alt="post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="text-white text-3xl opacity-0 group-hover:opacity-100">▶</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="grid grid-cols-3 gap-4">
              {(profile.saved_posts || []).slice(0, 9).map(post => (
                <div
                  key={post.id}
                  className="aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer relative"
                >
                  <img
                    src={post.media_url || post.image_url}
                    alt="liked"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2 text-2xl">❤️</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-3">
              {groups.map(group => (
                <div
                  key={group.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{group.icon}</div>
                    <div>
                      <h4 className="text-white font-bold">{group.name}</h4>
                      <p className="text-white/60 text-sm">{group.memberCount.toLocaleString('ar-SA')} عضو</p>
                    </div>
                  </div>
                  <button className={`px-6 py-2 rounded-lg font-bold transition-all ${
                    group.isJoined
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}>
                    {group.isJoined ? 'غادر' : 'انضم'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">معلومات عن {profile.user.username}</h3>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-white/60 text-sm mb-2">النبذة الشخصية</p>
                    <p className="text-white">{profile.user.profile?.bio || 'لا توجد نبذة شخصية'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/60 text-sm mb-2">الموقع</p>
                      <p className="text-white">السعودية</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-2">تاريخ الانضمام</p>
                      <p className="text-white">مايو 2022</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-white/60 text-sm mb-3">الهاشتاجات المفضلة</p>
                    <div className="flex flex-wrap gap-2">
                      {['#Gaming', '#Valorant', '#Music', '#Funny', '#FYP', '#Cyberpunk'].map(tag => (
                        <span
                          key={tag}
                          className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-purple-600/40 transition-all"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-600/20 hover:bg-red-600/30 px-6 py-3 rounded-lg text-red-400 font-bold transition-all border border-red-600/50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
        <div className="p-6">
          <h4 className="text-white font-bold mb-4">اختر السمة (Theme)</h4>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { id: 'midnight', name: 'منتصف الليل', color: '#0f172a' },
              { id: 'ocean', name: 'المحيط', color: '#0c4a6e' },
              { id: 'sunset', name: 'الغروب', color: '#7c2d12' },
              { id: 'forest', name: 'الغابة', color: '#064e3b' },
              { id: 'aurora', name: 'الشفق', color: '#4c1d95' },
              { id: 'cyber', name: 'سايبر', color: '#1a1a2e' }
            ].map(t => (
              <div
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                  theme === t.id ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: t.color }}
              >
                <p className="text-white text-sm font-bold">{t.name}</p>
              </div>
            ))}
          </div>

          <h4 className="text-white font-bold mb-4">إعدادات متقدمة</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-white">إظهار شارة التحقق</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-white">تخطيط الشبكة المتقدم</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-white">إظهار الإحصائيات</span>
            </label>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
