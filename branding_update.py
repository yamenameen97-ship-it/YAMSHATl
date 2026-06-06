from pathlib import Path
from PIL import Image

ROOT = Path('/home/user/project_work')
logo_src = Path('/home/user/project_input/official_logo.png')
logo = Image.open(logo_src).convert('RGBA')

frontend_public = ROOT / 'frontend' / 'public'
frontend_src_public = ROOT / 'frontend' / 'src' / 'public'
mobile_res = ROOT / 'mobile' / 'app' / 'src' / 'main' / 'res'


def ensure_parent(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)


def save_png_resized(dst: Path, size: int):
    ensure_parent(dst)
    img = logo.resize((size, size), Image.LANCZOS)
    img.save(dst, 'PNG')


def save_jpg(dst: Path, size: int = 1024):
    ensure_parent(dst)
    img = logo.resize((size, size), Image.LANCZOS).convert('RGB')
    img.save(dst, 'JPEG', quality=95)


# --- Generate web brand assets ---
for base in [frontend_public, frontend_src_public]:
    ensure_parent(base / 'brand' / 'yamshat-logo.png')
    logo.save(base / 'brand' / 'yamshat-logo.png', 'PNG')
    save_jpg(base / 'brand' / 'yamshat-logo.jpg')

icon_targets = {
    'icon-72.png': 72,
    'icon-96.png': 96,
    'badge-96.png': 96,
    'icon-128.png': 128,
    'icon-144.png': 144,
    'icon-152.png': 152,
    'icon-192.png': 192,
    'icon-maskable-192.png': 192,
    'icon-384.png': 384,
    'icon-512.png': 512,
    'icon-maskable-512.png': 512,
    'apple-touch-icon.png': 180,
    'favicon-16.png': 16,
    'favicon-32.png': 32,
}

for name, size in icon_targets.items():
    save_png_resized(frontend_public / 'icons' / name, size)
    save_png_resized(frontend_src_public / 'icons' / name, size)

# legacy duplicate root-level icons under src/public
legacy_root_icons = {
    'icon-72.png': 72,
    'icon-96.png': 96,
    'icon-128.png': 128,
    'icon-144.png': 144,
    'icon-152.png': 152,
    'icon-192.png': 192,
    'icon-384.png': 384,
    'icon-maskable-192.png': 192,
}
for name, size in legacy_root_icons.items():
    save_png_resized(frontend_src_public / name, size)

# --- Generate Android assets ---
ensure_parent(mobile_res / 'drawable-nodpi' / 'yam_logo.png')
logo.save(mobile_res / 'drawable-nodpi' / 'yam_logo.png', 'PNG')
android_icons = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}
for folder, size in android_icons.items():
    save_png_resized(mobile_res / folder / 'ic_launcher.png', size)
    save_png_resized(mobile_res / folder / 'ic_launcher_round.png', size)

# --- File overwrite helpers ---
def write(path: Path, content: str):
    ensure_parent(path)
    path.write_text(content, encoding='utf-8')


def replace_once(path: Path, old: str, new: str):
    text = path.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'Pattern not found in {path}: {old[:80]}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')


def append_if_missing(path: Path, marker: str, addition: str):
    text = path.read_text(encoding='utf-8')
    if marker not in text:
        path.write_text(text.rstrip() + '\n\n' + addition.strip() + '\n', encoding='utf-8')


# --- Overwrite focused React components ---
write(ROOT / 'frontend' / 'src' / 'components' / 'auth' / 'AuthShell.jsx', """import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo.jsx';

const featureItems = [
  { label: 'المشاركة', value: 'منشورات، صور، فيديو، وتفاعل لحظي' },
  { label: 'المجتمع', value: 'ريلز، ستوري، دردشة، وبث مباشر' },
  { label: 'الهوية', value: 'Dark mode + purple glow + Arabic mobile UX' },
];

export default function AuthShell({ badge, title, description, footer, alternateAction, children }) {
  return (
    <div className="auth-shell auth-shell-enhanced">
      <motion.div className="auth-card auth-card-enhanced" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="auth-copy auth-copy-enhanced">
          <div className="auth-brand-lockup">
            <div className="auth-brand-orb" aria-hidden="true">
              <BrandLogo size={76} alt="شعار يام شات الرسمي" className="auth-brand-logo" />
            </div>
            <div className="auth-brand-content">
              <span className="badge">{badge}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>

          <div className="auth-feature-list">
            {featureItems.map((item) => (
              <div key={item.label} className="auth-feature-item">
                <span className="auth-feature-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="auth-side-footer">
            <span>واجهة جوال اجتماعية مطورة على نفس المشروع الحالي بالكامل.</span>
            <div className="auth-side-links">
              <Link to="/login">تسجيل الدخول</Link>
              <Link to="/register">إنشاء حساب</Link>
              <Link to="/">الرئيسية</Link>
            </div>
          </div>
        </div>

        <div className="auth-form-panel auth-form-panel-watermarked">
          <motion.div
            className="auth-floating-watermark"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94, rotate: -8 }}
            animate={{ opacity: 0.1, scale: [0.96, 1.04, 0.98], rotate: [-8, -2, -10], y: [0, -14, 6] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            <BrandLogo size={380} alt="" className="auth-floating-watermark-logo" shadow={false} />
          </motion.div>
          <div className="auth-form-panel-content">
            {alternateAction ? <div className="auth-switch-row">{alternateAction}</div> : null}
            {children}
            {footer ? <div className="auth-note auth-note-large">{footer}</div> : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
""")

write(ROOT / 'frontend' / 'src' / 'components' / 'admin' / 'AdminSidebar.jsx', """import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../api/auth.js';
import BrandLogo from '../brand/BrandLogo.jsx';
import { clearStoredUser, getStoredUser } from '../../utils/auth.js';
import { getAdminNavItems } from './adminNavigation.js';

export default function AdminSidebar({ collapsed, permissions = [], role = 'user' }) {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const navGroups = useMemo(() => getAdminNavItems(role, permissions), [permissions, role]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore network logout errors and clear locally
    }
    clearStoredUser();
    navigate('/admin/login', { replace: true });
  };

  return (
    <aside className={`admin-sidebar admin-reference-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="admin-brand admin-reference-brand">
        <div className="brand-logo brand-logo-reference">
          <BrandLogo size={38} alt="Yamshat Admin" className="brand-logo-reference-image" />
        </div>
        {!collapsed ? (
          <div>
            <strong>Yamshat Admin</strong>
            <span>لوحة تحكم موحّدة</span>
          </div>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="admin-sidebar-usercard">
          <div className="admin-sidebar-avatar">{(currentUser?.username || 'A').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{currentUser?.full_name || currentUser?.username || 'المدير العام'}</strong>
            <span>{role === 'admin' ? 'Super Admin' : role || 'Admin'}</span>
          </div>
          <div className="admin-sidebar-status">متصل</div>
        </div>
      ) : null}

      <div className="admin-sidebar-scroll">
        {navGroups.map((group) => (
          <div key={group.title} className="admin-sidebar-group">
            {!collapsed ? <div className="admin-sidebar-group-title">{group.title}</div> : null}
            <nav className="admin-nav admin-reference-nav">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.exact)}
                  className={({ isActive }) => `admin-nav-link admin-reference-link ${isActive ? 'active' : ''}`}
                >
                  <span className="admin-nav-icon admin-reference-icon">{item.icon}</span>
                  {!collapsed ? <span>{item.label}</span> : null}
                  {!collapsed && item.badge ? <em className="admin-nav-badge">{item.badge}</em> : null}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="admin-sidebar-footer-block">
        {!collapsed ? (
          <div className="sidebar-promo admin-reference-promo compact">
            <span className="badge">واجهة واحدة</span>
            <p>تم تثبيت الشعار الرسمي في كامل واجهات الإدارة مع الحفاظ على نفس سرعة التنقّل والتنظيم.</p>
          </div>
        ) : null}
        <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
          <span>⇠</span>
          {!collapsed ? <span>تسجيل الخروج</span> : null}
        </button>
      </div>
    </aside>
  );
}
""")

write(ROOT / 'frontend' / 'src' / 'components' / 'layout' / 'Sidebar.jsx', """import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/users.js';
import { getLiveRooms } from '../../api/live.js';
import BrandLogo from '../brand/BrandLogo.jsx';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { avatarGradient, formatCompactNumber, initialsFromName } from '../yamshat/YamshatDesign.js';
import { useToast } from '../admin/ToastProvider.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'الصفحة الرئيسية', icon: '⌂' },
  { to: '/search', label: 'اكتشف', icon: '⌕' },
  { to: '/users', label: 'المتابعون', icon: '◌' },
  { to: '/notifications', label: 'الإشعارات', icon: '◔', badgeType: 'notifications' },
  { to: '/inbox', label: 'الرسائل', icon: '✉', badgeType: 'messages' },
  { to: '/profile', label: 'العلامات المحفوظة', icon: '▣' },
];

function Avatar({ name, src, size = 42 }) {
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontWeight: 800,
        background: avatarGradient(name),
        flexShrink: 0,
      }}
    >
      {initialsFromName(name).slice(0, 1)}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const notificationCount = 0;
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const language = useAppStore((state) => state.language);

  const { data: usersData = [] } = useQuery({
    queryKey: ['sidebar-users'],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 60_000,
  });

  const { data: liveData = [] } = useQuery({
    queryKey: ['sidebar-live-rooms'],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 20_000,
    refetchInterval: 25_000,
  });

  const liveUsers = Array.isArray(liveData) ? liveData.slice(0, 5) : [];
  const suggestedUsers = Array.isArray(usersData) ? usersData.slice(0, 3) : [];
  const suggestedGroups = [
    { name: 'Gamers Hub', members: '12.5K عضو' },
    { name: 'Tech Talk', members: '5.2K عضو' },
    { name: 'Music Vibes', members: '8.2K عضو' },
  ];

  return (
    <aside className="yamshat-side-rail">
      <div className="yamshat-side-section yam-brand-card">
        <div className="yam-brand-mark yam-brand-mark-logo">
          <BrandLogo size={42} alt="شعار يام شات الرسمي" className="yam-brand-mark-image" />
        </div>
        <div>
          <div className="yam-brand-title">YAMSHAT</div>
          <p className="yam-brand-copy">
            {language === 'en' ? 'The official Yamshat identity is now active across web, PWA, and mobile.' : 'تم تثبيت الشعار الرسمي المعتمد في الويب وتجربة الـ PWA والموبايل مع إزالة أي تعارض بصري سابق.'}
          </p>
          <button type="button" className="yam-primary-btn" onClick={() => {
            pushToast({ type: 'info', title: 'تم فتح إعدادات الترقية', description: 'راجع إعدادات الحساب والاشتراك لتفعيل المزايا الاحترافية.' });
            navigate('/settings');
          }}>ترقية الآن</button>
        </div>
      </div>

      <nav className="yamshat-side-section yam-side-nav">
        {NAV_ITEMS.map((item) => {
          const badge = item.badgeType === 'messages' ? unreadInboxCount : item.badgeType === 'notifications' ? notificationCount : 0;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `yam-side-link ${isActive ? 'active' : ''}`}>
              <span className="yam-side-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge > 0 ? <span className="yam-side-badge">{badge}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>القنوات التي تتابعها</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {liveUsers.length ? liveUsers.map((room) => (
            <div key={room.id} className="yam-entity-row">
              <Avatar name={room.host || room.username || 'Live'} src={room.avatar} />
              <div className="yam-entity-copy">
                <strong>{room.host || room.username || 'PlayerOne'}</strong>
                <small>{room.title || 'Gaming'}</small>
              </div>
              <div className="yam-live-metric">
                <span className="dot" />
                {formatCompactNumber(room.viewer_count || 0)}
              </div>
            </div>
          )) : (
            ['PlayerOne', 'Ahmed_King', 'ShadowGirl'].map((name, index) => (
              <div key={name} className="yam-entity-row">
                <Avatar name={name} />
                <div className="yam-entity-copy">
                  <strong>{name}</strong>
                  <small>{['Just Chatting', 'VALORANT', 'Fortnite'][index]}</small>
                </div>
                <div className="yam-live-metric"><span className="dot" />{['1.2K', '980', '756'][index]}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>اقتراحات للمتابعة</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {suggestedUsers.map((user) => (
            <div key={user.username || user.id} className="yam-entity-row compact">
              <Avatar name={user.username || 'User'} src={user.avatar} size={40} />
              <div className="yam-entity-copy">
                <strong>{user.username}</strong>
                <small>{user.profile?.activity_tagline || user.email || 'Gaming Creator'}</small>
              </div>
              <button type="button" className="yam-follow-btn" onClick={() => {
                pushToast({ type: 'success', title: 'تمت المتابعة', description: user.username ? `أصبحت تتابع @${user.username}` : 'تمت إضافة المستخدم إلى قائمتك.' });
                navigate(user.username ? `/profile/${encodeURIComponent(user.username)}` : '/users');
              }}>متابعة</button>
            </div>
          ))}
        </div>
      </section>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>المجموعات الموصى بها</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {suggestedGroups.map((group) => (
            <div key={group.name} className="yam-entity-row compact">
              <div className="yam-group-badge">🎮</div>
              <div className="yam-entity-copy">
                <strong>{group.name}</strong>
                <small>{group.members}</small>
              </div>
              <button type="button" className="yam-join-btn" onClick={() => {
                pushToast({ type: 'info', title: 'تم فتح صفحة المجموعات', description: `يمكنك إكمال الانضمام إلى ${group.name} من شاشة المجموعات.` });
                navigate('/groups');
              }}>انضمام</button>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .yamshat-side-rail {
          width: 330px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 22px 18px 32px;
          background: rgba(5, 10, 22, 0.94);
          border-inline-end: 1px solid rgba(148, 163, 184, 0.08);
          display: grid;
          gap: 16px;
          backdrop-filter: blur(16px);
        }
        .yamshat-side-rail::-webkit-scrollbar { width: 6px; }
        .yamshat-side-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        .yamshat-side-section {
          border-radius: 24px;
          background: rgba(12, 18, 34, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 40px rgba(2,6,23,0.24);
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-brand-card {
          background: radial-gradient(circle at top, rgba(139,92,246,0.28), transparent 65%), linear-gradient(180deg, rgba(20, 13, 48, 0.98), rgba(12,18,34,0.96));
          grid-template-columns: 72px 1fr;
          align-items: start;
        }
        .yam-brand-mark {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.08));
          border: 1px solid rgba(167,139,250,0.18);
          overflow: hidden;
        }
        .yam-brand-title { font-size: 20px; font-weight: 900; letter-spacing: 0.04em; }
        .yam-brand-copy { margin: 6px 0 14px; color: #94a3b8; font-size: 13px; line-height: 1.8; }
        .yam-primary-btn, .yam-follow-btn, .yam-join-btn {
          border: none;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 16px 30px rgba(124,58,237,0.24);
        }
        .yam-follow-btn, .yam-join-btn {
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: none;
        }
        .yam-side-nav { padding: 10px; gap: 8px; }
        .yam-side-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          color: #dbe4ff;
          background: transparent;
          transition: 0.2s ease;
          font-weight: 700;
        }
        .yam-side-link.active,
        .yam-side-link:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.14));
          color: white;
        }
        .yam-side-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          font-size: 16px;
        }
        .yam-side-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.18);
          color: #fecaca;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f8fafc;
        }
        .yam-section-head h3 { margin: 0; font-size: 15px; }
        .yam-section-head span { color: #94a3b8; font-size: 12px; }
        .yam-stack-list {
          display: grid;
          gap: 12px;
        }
        .yam-entity-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }
        .yam-entity-row.compact { grid-template-columns: auto 1fr auto; }
        .yam-entity-copy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .yam-entity-copy strong {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-entity-copy small {
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-live-metric {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fda4af;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-live-metric .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.12);
        }
        .yam-group-badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(124,58,237,0.14);
        }
      `}</style>
    </aside>
  );
}
""")

write(ROOT / 'frontend' / 'src' / 'components' / 'desktop' / 'Sidebar.jsx', """import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo.jsx';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'الرئيسية' },
    { path: '/stories', icon: '📱', label: 'القصص' },
    { path: '/reels', icon: '🎬', label: 'الريلز' },
    { path: '/groups', icon: '👥', label: 'المجموعات' },
    { path: '/live/control', icon: '🔴', label: 'بث مباشر' },
    { path: '/chat', icon: '💬', label: 'الرسائل' },
    { path: '/notifications', icon: '🔔', label: 'التنبيهات' },
    { path: '/profile', icon: '👤', label: 'الملف الشخصي' },
    { path: '/settings', icon: '⚙️', label: 'الإعدادات' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BrandLogo size={42} alt="Yamshat" className="desktop-sidebar-brand" />
        <h2 style={{ margin: 0 }}>YAMSHAT</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
""")

# --- Patch larger files with targeted replacements ---
replace_once(
    ROOT / 'frontend' / 'src' / 'pages' / 'Chat.jsx',
    "import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';\n",
    "import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';\nimport BrandLogo from '../components/brand/BrandLogo.jsx';\n",
)
replace_once(
    ROOT / 'frontend' / 'src' / 'pages' / 'Chat.jsx',
    """          <div className=\"yam-sidebar-brand\">\n            <div className=\"yam-brand-mark\">Y</div>\n            <div className=\"yam-brand-name\">YAMSHAT</div>\n          </div>\n""",
    """          <div className=\"yam-sidebar-brand\">\n            <div className=\"yam-brand-mark\">\n              <BrandLogo size={30} alt=\"Yamshat\" className=\"yam-brand-mark-image\" />\n            </div>\n            <div className=\"yam-brand-name\">YAMSHAT</div>\n          </div>\n""",
)

replace_once(
    ROOT / 'frontend' / 'src' / 'pages' / 'Inbox.jsx',
    "import useIsMobile from '../hooks/useIsMobile.js';\n",
    "import useIsMobile from '../hooks/useIsMobile.js';\nimport BrandLogo from '../components/brand/BrandLogo.jsx';\n",
)
replace_once(
    ROOT / 'frontend' / 'src' / 'pages' / 'Inbox.jsx',
    """            <button type=\"button\" className=\"yam-brand\" onClick={() => navigate('/')} aria-label=\"YAMSHAT\">\n              <span className=\"yam-brand-mark\">Y</span>\n              <span className=\"yam-brand-text\">YAMSHAT</span>\n            </button>\n""",
    """            <button type=\"button\" className=\"yam-brand\" onClick={() => navigate('/')} aria-label=\"YAMSHAT\">\n              <span className=\"yam-brand-mark\">\n                <BrandLogo size={28} alt=\"Yamshat\" className=\"yam-brand-mark-image\" />\n              </span>\n              <span className=\"yam-brand-text\">YAMSHAT</span>\n            </button>\n""",
)

replace_once(
    ROOT / 'frontend' / 'src' / 'components' / 'mobile' / 'MobilePostCard.jsx',
    "import { memo } from 'react';\n",
    "import { memo } from 'react';\nimport BrandLogo from '../brand/BrandLogo.jsx';\n",
)
replace_once(
    ROOT / 'frontend' / 'src' / 'components' / 'mobile' / 'MobilePostCard.jsx',
    """function YamshatY({ size = 22 }) {\n  return (\n    <svg viewBox=\"0 0 24 24\" width={size} height={size} aria-hidden=\"true\">\n      <path d=\"M5 3 L12 13 L19 3 L16 3 L12 8 L8 3 Z M10 13 L14 13 L14 21 L10 21 Z\" fill=\"#fff\" />\n    </svg>\n  );\n}\n""",
    """function YamshatY({ size = 22 }) {\n  return <BrandLogo size={size} alt=\"Yamshat\" shadow={false} className=\"ym-inline-brand\" />;\n}\n""",
)
replace_once(
    ROOT / 'frontend' / 'src' / 'components' / 'mobile' / 'MobilePostCard.jsx',
    """              <span className=\"brand-logo\">\n                <svg viewBox=\"0 0 64 64\" width=\"56\" height=\"56\">\n                  <defs>\n                    <linearGradient id=\"ym-banner-grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n                      <stop offset=\"0%\" stopColor=\"#C4B5FD\" />\n                      <stop offset=\"100%\" stopColor=\"#7C3AED\" />\n                    </linearGradient>\n                  </defs>\n                  <path d=\"M14 8 L32 36 L50 8 L42 8 L32 22 L22 8 Z M28 36 L36 36 L36 58 L28 58 Z\" fill=\"url(#ym-banner-grad)\" />\n                </svg>\n              </span>\n""",
    """              <span className=\"brand-logo\">\n                <BrandLogo size={56} alt=\"Yamshat\" shadow={false} className=\"ym-banner-brand\" />\n              </span>\n""",
)

# --- Styling additions ---
append_if_missing(
    ROOT / 'frontend' / 'src' / 'styles' / 'global.css',
    '.auth-form-panel-watermarked',
    """
.brand-logo-img {
  max-width: 100%;
  max-height: 100%;
}

.auth-brand-lockup {
  display: flex;
  align-items: center;
  gap: 18px;
}

.auth-brand-orb {
  width: 92px;
  height: 92px;
  flex-shrink: 0;
  border-radius: 26px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.32), rgba(91, 33, 182, 0.12) 60%, rgba(15, 23, 42, 0.02) 100%);
  border: 1px solid rgba(167, 139, 250, 0.16);
  box-shadow: 0 24px 60px rgba(76, 29, 149, 0.28);
}

.auth-brand-content {
  display: grid;
  gap: 8px;
}

.auth-brand-content h1,
.auth-brand-content p {
  margin: 0;
}

.auth-form-panel-watermarked {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.auth-form-panel-watermarked::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 75% 20%, rgba(124, 58, 237, 0.14), transparent 34%), radial-gradient(circle at 20% 100%, rgba(56, 189, 248, 0.08), transparent 28%);
  z-index: 0;
}

.auth-form-panel-content {
  position: relative;
  z-index: 1;
}

.auth-floating-watermark {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  transform: translate(-50%, -50%);
  width: min(78%, 420px);
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 0;
}

.auth-floating-watermark-logo {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
  opacity: 0.95;
  mix-blend-mode: screen;
}

.yam-brand-mark img,
.brand-logo-reference img,
.sidebar-logo img,
.yam-brand img,
.ym-inline-brand,
.ym-banner-brand {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

@media (max-width: 900px) {
  .auth-brand-lockup {
    align-items: flex-start;
  }

  .auth-brand-orb {
    width: 74px;
    height: 74px;
    border-radius: 22px;
  }

  .auth-floating-watermark {
    width: min(92%, 360px);
  }
}
"""
)

append_if_missing(
    ROOT / 'frontend' / 'src' / 'styles' / 'admin-modern.css',
    '.brand-logo-reference-image',
    """
.brand-logo-reference {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-logo-reference-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}
"""
)

# --- Lightweight mobile XML branding refresh texts only keep official asset in place ---
mobile_brand_files = [
    mobile_res / 'layout' / 'activity_login.xml',
    mobile_res / 'layout' / 'activity_register.xml',
    mobile_res / 'layout' / 'activity_forgot_password.xml',
    mobile_res / 'layout' / 'activity_verify_email.xml',
    mobile_res / 'layout' / 'activity_main.xml',
    mobile_res / 'layout' / 'activity_profile.xml',
    mobile_res / 'layout' / 'activity_splash.xml',
]
for path in mobile_brand_files:
    text = path.read_text(encoding='utf-8')
    text = text.replace('android:contentDescription="Yamshat Logo"', 'android:contentDescription="Yamshat Official Logo"')
    text = text.replace('android:contentDescription="Yamshat"', 'android:contentDescription="Yamshat Official Logo"')
    text = text.replace('android:text="Yamshat"', 'android:text="YAMSHAT"')
    path.write_text(text, encoding='utf-8')

print('Branding update completed successfully.')
