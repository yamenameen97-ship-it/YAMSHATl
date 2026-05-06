import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/chatStore.js';
import { getUiText } from '../../utils/i18n.js';

export default function Sidebar() {
  const language = useAppStore((state) => state.language);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const links = [
    { to: '/', label: ui.nav.home, meta: ui.navMeta.home, icon: '⌂' },
    { to: '/reels', label: ui.nav.reels, meta: ui.navMeta.reels, icon: '▣' },
    { to: '/live', label: ui.nav.live, meta: ui.navMeta.live, icon: '◉' },
    { to: '/inbox', label: ui.nav.inbox, meta: ui.navMeta.inbox, icon: '✉' },
    { to: '/notifications', label: ui.nav.notifications, meta: ui.navMeta.notifications, icon: '🔔' },
    { to: '/users', label: ui.nav.users, meta: ui.navMeta.users, icon: '◎' },
    { to: '/groups', label: ui.nav.groups, meta: ui.navMeta.groups, icon: '◍' },
    { to: '/stories', label: ui.nav.stories, meta: ui.navMeta.stories, icon: '◌' },
    { to: '/profile', label: ui.nav.profile, meta: ui.navMeta.profile, icon: '◌' },
    { to: '/dashboard', label: ui.nav.dashboard, meta: ui.navMeta.dashboard, icon: '☰' },
  ];

  return (
    <aside className="sidebar yamshat-sidebar">
      <div className="sidebar-top">
        <div className="brand-stack brand-stack-rich">
          <div className="brand-mark brand-mark-image">
            <img src="/brand/yamshat-logo.jpg" alt="Yamshat" className="brand-logo-img" />
          </div>
          <div>
            <h1 className="brand-title">YAMSHAT</h1>
            <p className="brand-subtitle">{ui.brandSubtitle}</p>
          </div>
        </div>

        <div className="sidebar-highlight card sidebar-highlight-rich">
          <div className="page-eyebrow">Yamshat UI</div>
          <strong>{language === 'en' ? 'Posts · Reels · Live · Chat' : 'المنشورات · الريلز · البث · الدردشة'}</strong>
          <p className="muted no-margin">
            {language === 'en'
              ? 'Every service now has its own page with cleaner top and bottom navigation.'
              : 'كل خدمة الآن في صفحة مستقلة مع شريط علوي وسفلي أكثر توازناً.'}
          </p>
        </div>
      </div>

      <nav className="nav-links">
        {links.map((link) => {
          const badge = link.to === '/inbox' ? unreadInboxCount : 0;
          return (
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
              {badge > 0 ? <strong className="topbar-badge">{badge}</strong> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer sidebar-footer-rich">
        <div className="glass-chip">DB linked</div>
        <div className="glass-chip">Top bar</div>
        <div className="glass-chip">Bottom bar</div>
        <a href="/admin.html" className="glass-chip admin-entry-chip">Admin</a>
      </div>
    </aside>
  );
}
