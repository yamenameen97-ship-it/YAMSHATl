import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'الرئيسية', meta: 'الصفحة الرئيسية', icon: '⌂' },
  { to: '/stories', label: 'الستوري', meta: 'لحظات سريعة', icon: '◌' },
  { to: '/reels', label: 'الريلز', meta: 'فيديوهات قصيرة', icon: '▣' },
  { to: '/live', label: 'البث المباشر', meta: 'غرف مباشرة', icon: '◉' },
  { to: '/inbox', label: 'الدردشة', meta: 'الرسائل', icon: '✉' },
  { to: '/notifications', label: 'الإشعارات', meta: 'مركز التنبيهات', icon: '🔔' },
  { to: '/users', label: 'الأصدقاء', meta: 'ابدأ محادثة', icon: '◎' },
  { to: '/groups', label: 'المجموعات', meta: 'إنشاء ومتابعة', icon: '◍' },
  { to: '/profile', label: 'الملف الشخصي', meta: 'إحصائياتك', icon: '◌' },
  { to: '/dashboard', label: 'لوحة النشاط', meta: 'نظرة سريعة', icon: '◫' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar yamshat-sidebar">
      <div className="sidebar-top">
        <div className="brand-stack">
          <div className="brand-mark">ي</div>
          <div>
            <h1 className="brand-title">Yamshat</h1>
            <p className="brand-subtitle">تواصل، شارك، عش اللحظة — والآن بنفس الاستايل الموحد على الويب والجوال مع مركز إشعارات مستقل.</p>
          </div>
        </div>

        <div className="sidebar-highlight card">
          <div className="page-eyebrow">واجهة احترافية</div>
          <strong>هوية اجتماعية عربية موحدة</strong>
          <p className="muted no-margin">المنشورات، الستوري، الريلز، الرسائل، البث، والإشعارات كلها بنفس الروح الداكنة البنفسجية.</p>
        </div>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-link-icon">{link.icon}</span>
            <span className="nav-link-copy">
              <strong>{link.label}</strong>
              <small>{link.meta}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="glass-chip">ريلز وستوري</div>
        <div className="glass-chip">دردشة وبث وإشعارات</div>
        <div className="glass-chip">Dark Purple UI</div>
      </div>
    </aside>
  );
}
