import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useAppStore } from '../store/appStore.js';
import { clearStoredUser, getStoredUser } from '../utils/auth.js';

const QUICK_TILES = [
  { title: 'الملف الشخصي', note: 'تعديل الحساب والصورة والمنشورات', icon: '👤', to: '/profile', tone: 'linear-gradient(135deg, rgba(139,92,246,0.34), rgba(99,102,241,0.14))' },
  { title: 'المناسبات', note: 'واجهة الفعاليات القادمة', icon: '📅', to: '/groups', tone: 'linear-gradient(135deg, rgba(236,72,153,0.26), rgba(139,92,246,0.12))' },
  { title: 'آخر منشوراتك', note: 'راجع نشاطك ومحتواك', icon: '📝', to: '/', tone: 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(6,182,212,0.12))' },
  { title: 'الريلز', note: 'شاهد وارفع فيديوهات قصيرة', icon: '🎬', to: '/reels', tone: 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(236,72,153,0.14))' },
  { title: 'المجموعات', note: 'ادخل المجتمعات والغرف', icon: '👥', to: '/groups', tone: 'linear-gradient(135deg, rgba(34,197,94,0.24), rgba(6,182,212,0.12))' },
  { title: 'الرسائل', note: 'افتح الدردشات الخاصة', icon: '💬', to: '/inbox', tone: 'linear-gradient(135deg, rgba(14,165,233,0.24), rgba(99,102,241,0.12))' },
];

const SETTINGS_TILES = [
  { title: 'الإشعارات', to: '/notifications', icon: '🔔' },
  { title: 'البث المباشر', to: '/live', icon: '📡' },
  { title: 'القصص', to: '/stories', icon: '📖' },
  { title: 'المستخدمون', to: '/users', icon: '✨' },
  { title: 'الإعدادات', to: '/settings', icon: '⚙️' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isOnline = useAppStore((state) => state.isOnline);

  const handleLogout = () => {
    clearStoredUser();
    navigate('/login');
  };

  const stats = [
    { label: 'المنشورات', value: user?.posts_count ?? 128 },
    { label: 'المتابعون', value: user?.followers_count ?? '12.5K' },
    { label: 'المتابَعون', value: user?.following_count ?? 560 },
  ];

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide menu-page-shell">
        <div className="yam-hero menu-hero-reference" style={{ marginBottom: 22 }}>
          <div className="menu-hero-card-ref">
            <div className="menu-hero-copy-ref">
              <div className="yam-badge primary">☰ القائمة</div>
              <h1 className="yam-section-title" style={{ marginTop: 14 }}>القائمة الرئيسية</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0', maxWidth: 720 }}>
                دي الصفحة اللي المفروض تبان على الموبايل بشكل مرتب: اختصارات واضحة، إحصائيات الحساب، وروابط سريعة لكل الصفحات الأساسية بدل شاشة عشوائية أو مزدحمة.
              </p>

              <div className="menu-status-row">
                <span className={`menu-status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'متصل' : 'غير متصل'}</span>
                <span className="menu-status-pill neutral">YAMSHAT UI</span>
              </div>
            </div>

            <div className="menu-user-summary-ref">
              <div className="menu-avatar-ref">{(user?.username || user?.user || 'Y').slice(0, 1).toUpperCase()}</div>
              <div>
                <strong style={{ fontSize: '1.2rem' }}>{user?.full_name || user?.username || 'Yamshat User'}</strong>
                <div className="yam-meta" style={{ marginTop: 6 }}>@{user?.username || user?.user || 'yamshat_user'}</div>
              </div>
              <div className="yam-stat-grid menu-stats-grid-ref">
                {stats.map((item) => (
                  <div key={item.label} className="yam-stat">
                    <strong>{item.value}</strong>
                    <span className="yam-meta">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button fullWidth onClick={() => navigate('/profile')}>تعديل الملف الشخصي</Button>
            </div>
          </div>
        </div>

        <div className="menu-grid-sections">
          <Card className="menu-surface-ref">
            <div className="yam-toolbar">
              <h3 style={{ margin: 0 }}>روابط سريعة</h3>
              <span className="yam-badge">{QUICK_TILES.length}</span>
            </div>

            <div className="menu-action-grid-ref">
              {QUICK_TILES.map((item) => (
                <Link key={item.title} to={item.to} className="menu-action-card-ref" style={{ background: item.tone }}>
                  <span className="menu-action-icon-ref">{item.icon}</span>
                  <strong>{item.title}</strong>
                  <span className="yam-meta">{item.note}</span>
                </Link>
              ))}
            </div>
          </Card>

          <div className="menu-side-stack-ref">
            <Card className="menu-surface-ref">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>اختصارات إضافية</h3>
                <span className="yam-badge success">جاهزة</span>
              </div>
              <div className="menu-mini-grid-ref">
                {SETTINGS_TILES.map((item) => (
                  <Link key={item.title} to={item.to} className="menu-mini-link-ref">
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="menu-surface-ref menu-danger-zone-ref">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>الجلسة</h3>
                <span className="yam-badge">آمن</span>
              </div>
              <p className="yam-section-note" style={{ marginTop: 0 }}>
                لو حبيت تنهي الجلسة وتدخل بحساب تاني، استخدم الزر ده.
              </p>
              <Button variant="danger" fullWidth onClick={handleLogout}>تسجيل خروج</Button>
            </Card>
          </div>
        </div>

        <style>{`
          .menu-page-shell {
            display: grid;
            gap: 22px;
          }

          .menu-hero-reference {
            overflow: hidden;
          }

          .menu-hero-card-ref {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
            gap: 18px;
            align-items: stretch;
          }

          .menu-hero-copy-ref,
          .menu-user-summary-ref,
          .menu-grid-sections,
          .menu-side-stack-ref {
            display: grid;
            gap: 16px;
          }

          .menu-user-summary-ref {
            padding: 18px;
            border-radius: 28px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            align-content: start;
          }

          .menu-avatar-ref {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-size: 2rem;
            font-weight: 800;
            color: white;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            box-shadow: 0 18px 36px rgba(139,92,246,0.26);
          }

          .menu-status-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 16px;
          }

          .menu-status-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.05);
            color: #e5e7eb;
          }

          .menu-status-pill.online { background: rgba(34,197,94,0.16); color: #bbf7d0; }
          .menu-status-pill.offline { background: rgba(249,115,22,0.16); color: #fdba74; }
          .menu-status-pill.neutral { background: rgba(139,92,246,0.16); color: #ddd6fe; }

          .menu-grid-sections {
            grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.82fr);
            align-items: start;
          }

          .menu-surface-ref {
            border-radius: 28px;
          }

          .menu-action-grid-ref {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }

          .menu-action-card-ref {
            display: grid;
            gap: 12px;
            min-height: 168px;
            padding: 18px;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.08);
            color: #f8fafc;
            box-shadow: 0 22px 50px rgba(8,9,24,0.24);
          }

          .menu-action-icon-ref {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            font-size: 1.5rem;
            background: rgba(11,18,32,0.66);
            border: 1px solid rgba(255,255,255,0.08);
          }

          .menu-mini-grid-ref {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .menu-mini-link-ref {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 56px;
            padding: 0 14px;
            border-radius: 18px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            color: #e2e8f0;
          }

          .menu-danger-zone-ref {
            background: linear-gradient(180deg, rgba(127,29,29,0.22), rgba(15,23,42,0.92));
          }

          .menu-stats-grid-ref {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          @media (max-width: 1100px) {
            .menu-hero-card-ref,
            .menu-grid-sections {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .menu-action-grid-ref,
            .menu-mini-grid-ref,
            .menu-stats-grid-ref {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 520px) {
            .menu-action-grid-ref,
            .menu-mini-grid-ref,
            .menu-stats-grid-ref {
              grid-template-columns: 1fr;
            }

            .menu-action-card-ref {
              min-height: 132px;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
