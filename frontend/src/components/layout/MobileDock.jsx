import { Link, NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { getUiText } from '../../utils/i18n.js';
import { getPrefetchHandlers } from '../../utils/navigation.js';

export default function MobileDock() {
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const dockLinks = [
    { to: '/', label: ui.nav.home || 'الرئيسية', icon: '⌂', badge: 0 },
    { to: '/search', label: 'بحث', icon: '🔍', badge: 0 },
    { to: '/stories', label: 'قصص', icon: '📖', badge: 0 },
    { to: '/reels', label: ui.nav.reels || 'ريلز', icon: '▣', badge: 0 },
    { to: '/groups', label: 'مجموعات', icon: '👥', badge: 0 },
    { to: '/live', label: ui.nav.live || 'بث', icon: '◉', badge: isOnline ? 'live' : 0 },
    { to: '/inbox', label: ui.nav.inbox || 'دردشة', icon: '✉', badge: unreadInboxCount },
    { to: '/notifications', label: 'إشعارات', icon: '🔔', badge: 0 },
    { to: '/users', label: 'أشخاص', icon: '👤', badge: 0 },
    { to: '/profile', label: 'ملفي', icon: '⚙', badge: 0 },
  ];

  return (
    <nav className="mobile-dock mobile-dock-professional" aria-label={language === 'en' ? 'Quick navigation' : 'التنقل السريع'}>
      <div className="mobile-dock-inner mobile-dock-scrollable">
        {dockLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
            {...getPrefetchHandlers(link.to)}
            title={link.label}
          >
            <span className="mobile-dock-icon">{link.icon}</span>
            <span className="mobile-dock-label">{link.label}</span>
            {link.badge === 'live' ? <span className="mobile-live-dot" aria-hidden="true" /> : null}
            {typeof link.badge === 'number' && link.badge > 0 ? <strong className="topbar-badge">{link.badge}</strong> : null}
          </NavLink>
        ))}
      </div>

      <style>{`
        .mobile-dock {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: rgba(4, 8, 18, 0.94);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          padding: 8px 0;
        }

        .mobile-dock-inner {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .mobile-dock-inner::-webkit-scrollbar {
          display: none;
        }

        .mobile-dock-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 60px;
          height: 60px;
          padding: 6px 8px;
          border-radius: 12px;
          background: transparent;
          color: #94a3b8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          flex-shrink: 0;
        }

        .mobile-dock-link:hover {
          background: rgba(124, 58, 237, 0.12);
          color: #dbe4ff;
        }

        .mobile-dock-link.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(99, 102, 241, 0.14));
          color: #fff;
          border: 1px solid rgba(167, 139, 250, 0.24);
        }

        .mobile-dock-icon {
          font-size: 20px;
          display: block;
          line-height: 1;
        }

        .mobile-dock-label {
          display: block;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.18);
          animation: mobile-live-pulse 1.6s infinite;
          position: absolute;
          top: 2px;
          right: 2px;
        }

        .topbar-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          line-height: 1;
          position: absolute;
          top: 0;
          right: 0;
        }

        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }

        @media (min-width: 1024px) {
          .mobile-dock {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
