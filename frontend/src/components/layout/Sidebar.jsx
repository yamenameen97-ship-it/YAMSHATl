import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'الرئيسية', meta: 'المنشورات والقصص', icon: '⌂' },
  { to: '/stories', label: 'الستوري', meta: 'لحظات سريعة', icon: '◌' },
  { to: '/reels', label: 'الريلز', meta: 'فيديوهات قصيرة', icon: '▣' },
  { to: '/live', label: 'البث المباشر', meta: 'غرف مباشرة', icon: '◉' },
  { to: '/inbox', label: 'الدردشة', meta: 'الرسائل', icon: '✉' },
  { to: '/notifications', label: 'الإشعارات', meta: 'مركز التنبيهات', icon: '🔔' },
  { to: '/users', label: 'الأصدقاء', meta: 'ابدأ محادثة', icon: '◎' },
  { to: '/groups', label: 'المجموعات', meta: 'إنشاء ومتابعة', icon: '◍' },
  { to: '/profile', label: 'الملف الشخصي', meta: 'إحصائياتك', icon: '◌' },
  { to: '/dashboard', label: 'القائمة', meta: 'الحساب والإعدادات', icon: '☰' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar yamshat-sidebar">
      <div className="sidebar-top">
        <div className="brand-stack">
          <div className="brand-mark">ي</div>
          <div>
            <h1 className="brand-title">Yamshat</h1>
            <p className="brand-subtitle">تقسيم أوضح للشاشات: الرئيسية للمنشورات، ولكل قسم صفحة مستقلة بنفس الهوية الداكنة البنفسجية.</p>
          </div>
        </div>

        <div className="sidebar-highlight card">
          <div className="page-eyebrow">واجهة مرتبة</div>
          <strong>كل شاشة لوحدها</strong>
          <p className="muted no-margin">الهوم للمنشورات والقصص، والريلز والستوري والدردشة والبث والقائمة كلهم في صفحات منفصلة.</p>
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
        <div className="glass-chip">منشورات + ستوري</div>
        <div className="glass-chip">ريلز + لايف + دردشة</div>
        <div className="glass-chip">قائمة مستقلة للإعدادات</div>
      </div>
    </aside>
  );
}
