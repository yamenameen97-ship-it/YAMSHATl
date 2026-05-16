import { Link, NavLink } from 'react-router-dom';
import YamshatIcon from '../yamshat/YamshatIcon.jsx';

const DOCK_LINKS = [
  { to: '/', label: 'الرئيسية', icon: 'home' },
  { to: '/search', label: 'اكتشف', icon: 'discover' },
  { to: '/inbox', label: 'الرسائل', icon: 'message', badge: true },
  { to: '/profile', label: 'الملف الشخصي', icon: 'profile' },
];

export default function MobileDock() {
  return (
    <nav className="yam-mobile-dock" aria-label="التنقل السفلي">
      <div className="yam-mobile-dock-inner">
        {DOCK_LINKS.slice(0, 2).map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `yam-mobile-dock-link ${isActive ? 'active' : ''}`}>
            <span className="yam-mobile-dock-icon"><YamshatIcon name={link.icon} size={19} /></span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        <Link to={{ pathname: '/', hash: '#composer' }} className="yam-mobile-dock-link yam-mobile-dock-create" aria-label="إنشاء منشور">
          <span className="yam-mobile-dock-icon"><YamshatIcon name="plus" size={22} /></span>
        </Link>

        {DOCK_LINKS.slice(2).map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `yam-mobile-dock-link ${isActive ? 'active' : ''}`}>
            <span className="yam-mobile-dock-icon"><YamshatIcon name={link.icon} size={19} /></span>
            <span>{link.label}</span>
            {link.badge ? <strong className="yam-mobile-dock-badge">•</strong> : null}
          </NavLink>
        ))}
      </div>

      <style>{`
        .yam-mobile-dock {
          display: none;
        }
        @media (max-width: 767px) {
          .yam-mobile-dock {
            position: fixed;
            inset-inline: 0;
            bottom: 0;
            z-index: 60;
            display: block;
            padding: 0 12px 12px;
            pointer-events: none;
          }
          .yam-mobile-dock-inner {
            pointer-events: auto;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            align-items: end;
            gap: 6px;
            padding: 10px 12px 8px;
            border-radius: 28px;
            background: rgba(8, 12, 22, 0.96);
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 -6px 30px rgba(2,6,23,0.45);
            backdrop-filter: blur(18px);
          }
          .yam-mobile-dock-link {
            position: relative;
            min-width: 0;
            display: grid;
            justify-items: center;
            gap: 6px;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 700;
            padding: 8px 4px;
            text-align: center;
          }
          .yam-mobile-dock-link.active {
            color: #f8fafc;
          }
          .yam-mobile-dock-icon {
            display: grid;
            place-items: center;
          }
          .yam-mobile-dock-create {
            width: 60px;
            height: 60px;
            align-self: start;
            justify-self: center;
            margin-top: -24px;
            border-radius: 50%;
            color: #fff;
            background: linear-gradient(135deg, #7c3aed, #9333ea);
            box-shadow: 0 16px 28px rgba(124,58,237,0.34);
          }
          .yam-mobile-dock-create span:last-child {
            display: none;
          }
          .yam-mobile-dock-badge {
            position: absolute;
            top: 2px;
            inset-inline-end: 18px;
            color: #7c3aed;
            font-size: 18px;
            line-height: 1;
          }
        }
      `}</style>
    </nav>
  );
}
