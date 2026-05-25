import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';

export default function MobileDock() {
  const isOnline = useAppStore((state) => state.isOnline);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const dockLinks = useMemo(() => ([
    { to: '/', label: 'الرئيسية', icon: '⌂' },
    { to: '/search', label: 'بحث', icon: '⌕' },
    { to: '/live', label: 'بث', icon: '◉', badge: isOnline ? 'live' : 0 },
    { to: '/inbox', label: 'الدردشة', icon: '✉', badge: unreadInboxCount },
    { to: '/profile', label: 'حسابي', icon: '◌' },
  ]), [isOnline, unreadInboxCount]);

  return (
    <nav className="mobile-dock mobile-dock-professional" aria-label="التنقل السريع">
      <div className="mobile-dock-inner">
        {dockLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `mobile-dock-link ${isActive ? 'active' : ''}`}
            title={link.label}
          >
            <span className="mobile-dock-icon" aria-hidden="true">{link.icon}</span>
            <span className="mobile-dock-label">{link.label}</span>
            {link.badge === 'live' ? <span className="mobile-live-dot" aria-hidden="true" /> : null}
            {typeof link.badge === 'number' && link.badge > 0 ? <strong className="mobile-dock-badge">{link.badge}</strong> : null}
          </NavLink>
        ))}
      </div>

      <style>{`
        .mobile-dock {
          position: fixed;
          inset-inline: 0;
          bottom: 0;
          z-index: 60;
          display: none;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
          background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 72%, transparent), var(--panel-strong));
          border-top: 1px solid var(--line);
          backdrop-filter: blur(24px);
        }

        .mobile-dock-inner {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          width: min(100%, 560px);
          margin: 0 auto;
        }

        .mobile-dock-link {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 62px;
          padding: 10px 6px;
          border-radius: 18px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--muted);
          transition: transform var(--motion-fast), background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast), box-shadow var(--motion-fast);
        }

        .mobile-dock-link:hover {
          color: var(--text);
          background: color-mix(in srgb, var(--panel) 88%, transparent);
          border-color: color-mix(in srgb, var(--line) 75%, transparent);
        }

        .mobile-dock-link.active {
          color: var(--text-on-accent);
          background: linear-gradient(135deg, var(--primary), var(--primary-strong));
          border-color: color-mix(in srgb, var(--primary) 55%, white 8%);
          box-shadow: 0 16px 32px rgba(124, 58, 237, 0.24);
          transform: translateY(-2px);
        }

        .mobile-dock-icon {
          font-size: 20px;
          line-height: 1;
        }

        .mobile-dock-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.01em;
        }

        .mobile-live-dot,
        .mobile-dock-badge {
          position: absolute;
          top: 8px;
          inset-inline-end: 10px;
        }

        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--success);
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.16);
        }

        .mobile-dock-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: var(--danger);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
        }

        @media (max-width: 1023px) {
          .mobile-dock {
            display: block;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-dock-link {
            transition: none;
          }
        }
      `}</style>
    </nav>
  );
}
