import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'الرئيسية', meta: 'المنشورات', icon: '⌂' },
  { to: '/stories', label: 'الستوري', meta: 'لحظات سريعة', icon: '◌' },
  { to: '/live', label: 'البث', meta: 'غرف مباشرة', icon: '◉' },
  { to: '/inbox', label: 'الرسائل', meta: 'الدردشات', icon: '✉' },
  { to: '/users', label: 'الأصدقاء', meta: 'الحسابات', icon: '◎' },
  { to: '/profile', label: 'حسابي', meta: 'الملف الشخصي', icon: '◍' },
  { to: '/dashboard', label: 'التحليلات', meta: 'النشاط', icon: '◫' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar yamshat-sidebar">
      <div className="sidebar-top">
        <div className="brand-stack">
          <div className="brand-mark">ي</div>
          <div>
            <h1 className="brand-title">Yamshat</h1>
            <p className="brand-subtitle">ستايل داكن بنفس هوية البنفسجي المضيء وربط مباشر بالمنشورات والأسماء المخزنة.</p>
          </div>
        </div>

        <div className="sidebar-highlight card">
          <div className="page-eyebrow">واجهة احترافية</div>
          <strong>شبكة اجتماعية عربية</strong>
          <p className="muted no-margin">تصميم زجاجي، زوايا ناعمة، وإحساس قريب جداً من المرجع المرسل.</p>
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
        <div className="glass-chip">منشورات لحظية</div>
        <div className="glass-chip">أسماء ومتابعات محفوظة</div>
        <div className="glass-chip">Socket + LiveKit</div>
      </div>
    </aside>
  );
}
