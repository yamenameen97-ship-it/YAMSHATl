import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'الرئيسية', meta: 'المنشورات والقصص', icon: '⌂' },
  { to: '/reels', label: 'الريلز', meta: 'فيديوهات قصيرة', icon: '▣' },
  { to: '/live', label: 'البث المباشر', meta: 'غرف مباشرة', icon: '◉' },
  { to: '/inbox', label: 'الدردشة', meta: 'الرسائل', icon: '✉' },
  { to: '/notifications', label: 'الإشعارات', meta: 'مجمّعة ومرتبة', icon: '🔔' },
  { to: '/users', label: 'المستخدمون', meta: 'متابعة وبدء تواصل', icon: '◎' },
  { to: '/groups', label: 'المجموعات', meta: 'إنشاء ومتابعة', icon: '◍' },
  { to: '/stories', label: 'الستوري', meta: 'لحظات سريعة', icon: '◌' },
  { to: '/profile', label: 'الملف الشخصي', meta: 'إحصائياتك', icon: '◌' },
  { to: '/dashboard', label: 'القائمة', meta: 'الإعدادات والاختبارات', icon: '☰' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar yamshat-sidebar">
      <div className="sidebar-top">
        <div className="brand-stack brand-stack-rich">
          <div className="brand-mark brand-mark-image">
            <img src="/brand/yamshat-logo.jpg" alt="Yamshat" className="brand-logo-img" />
          </div>
          <div>
            <h1 className="brand-title">YAMSHAT</h1>
            <p className="brand-subtitle">تصميم موحّد للويب والجوال بنفس الستايل الداكن البنفسجي الموجود في المراجع.</p>
          </div>
        </div>

        <div className="sidebar-highlight card sidebar-highlight-rich">
          <div className="page-eyebrow">تجربة منظمة</div>
          <strong>المنشورات · الريلز · البث · الدردشة</strong>
          <p className="muted no-margin">كل خدمة في شاشة مستقلة مع تنقّل أوضح وأزرار سفلية أقرب لتصميم تطبيقات الجوال.</p>
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

      <div className="sidebar-footer sidebar-footer-rich">
        <div className="glass-chip">هوية موحّدة</div>
        <div className="glass-chip">Responsive أدق</div>
        <div className="glass-chip">Offline Sync أقوى</div>
        <a href="/admin.html" className="glass-chip admin-entry-chip">دخول الأدمن</a>
      </div>
    </aside>
  );
}
