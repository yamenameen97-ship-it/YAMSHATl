import { Link, NavLink } from 'react-router-dom';
import { avatarGradient, initialsFromName } from '../yamshat/YamshatDesign.js';
import YamshatIcon from '../yamshat/YamshatIcon.jsx';

const MAIN_TABS = [
  { to: '/', label: 'الرئيسية' },
  { to: '/live', label: 'البث المباشر' },
  { to: '/groups', label: 'المجموعات' },
  { to: '/reels', label: 'المقاطع' },
  { to: '/stories', label: 'المنتديات' },
];

function Avatar({ username = 'Ahmed_King' }) {
  return (
    <div
      className="yam-topbar-avatar"
      aria-label={username}
      style={{ background: avatarGradient(username) }}
    >
      {initialsFromName(username).slice(0, 1)}
    </div>
  );
}

function IconButton({ children, badge, className = '', as: Component = 'button', ...props }) {
  return (
    <Component className={`yam-topbar-icon-btn ${className}`.trim()} {...props}>
      {children}
      {badge ? <span className="yam-topbar-badge">{badge}</span> : null}
    </Component>
  );
}

export default function Topbar() {
  return (
    <header className="yam-ref-topbar">
      <div className="yam-ref-topbar-desktop">
        <div className="yam-ref-brand-strip">
          <Link to="/" className="yam-ref-brand" aria-label="YAMSHAT home">
            <span className="yam-ref-brand-mark">Y</span>
            <span className="yam-ref-brand-title">YAMSHAT</span>
          </Link>

          <nav className="yam-ref-tabs" aria-label="التنقل الرئيسي">
            {MAIN_TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `yam-ref-tab ${isActive ? 'active' : ''}`}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="yam-ref-search-shell">
          <label className="yam-ref-search-box">
            <input type="search" placeholder="ابحث في يامشات" aria-label="ابحث في يامشات" />
            <span className="yam-ref-search-icon"><YamshatIcon name="search" size={18} /></span>
          </label>
        </div>

        <div className="yam-ref-actions">
          <IconButton title="الوضع الليلي"><YamshatIcon name="moon" size={18} /></IconButton>
          <IconButton as={Link} to="/notifications" title="الإشعارات" badge="3"><YamshatIcon name="bell" size={18} /></IconButton>
          <IconButton as={Link} to="/inbox" title="الرسائل"><YamshatIcon name="message" size={18} /></IconButton>
          <Link to="/profile" className="yam-topbar-profile-link" title="الملف الشخصي">
            <Avatar />
          </Link>
        </div>
      </div>

      <div className="yam-ref-topbar-mobile">
        <button type="button" className="yam-mobile-icon" aria-label="القائمة">
          <YamshatIcon name="menu" size={20} />
        </button>
        <h1>المنشورات</h1>
        <div className="yam-mobile-actions">
          <button type="button" className="yam-mobile-icon accent" aria-label="إضافة">
            <YamshatIcon name="plus" size={18} />
          </button>
          <button type="button" className="yam-mobile-icon" aria-label="الإشعارات">
            <YamshatIcon name="bell" size={18} />
            <span className="yam-mobile-dot" />
          </button>
        </div>
      </div>

      <style>{`
        .yam-ref-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(4, 8, 18, 0.84);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .yam-ref-topbar-desktop {
          display: grid;
          grid-template-columns: auto minmax(260px, 1fr) auto;
          align-items: center;
          gap: 22px;
          padding: 14px 22px;
        }
        .yam-ref-brand-strip,
        .yam-ref-actions,
        .yam-mobile-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .yam-ref-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }
        .yam-ref-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #f5f3ff;
          font-weight: 900;
          background: linear-gradient(135deg, #4c1d95, #7c3aed 68%, #312e81);
          box-shadow: 0 14px 28px rgba(91, 33, 182, 0.24);
        }
        .yam-ref-brand-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }
        .yam-ref-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .yam-ref-tab {
          position: relative;
          padding: 10px 14px 14px;
          color: #cbd5e1;
          font-size: 15px;
          font-weight: 700;
        }
        .yam-ref-tab::after {
          content: '';
          position: absolute;
          inset-inline: 14px;
          bottom: 4px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, #8b5cf6, #a855f7);
          opacity: 0;
          transform: scaleX(0.65);
          transition: 0.2s ease;
        }
        .yam-ref-tab.active,
        .yam-ref-tab:hover {
          color: #ffffff;
        }
        .yam-ref-tab.active::after,
        .yam-ref-tab:hover::after {
          opacity: 1;
          transform: scaleX(1);
        }
        .yam-ref-search-shell {
          display: flex;
          justify-content: center;
        }
        .yam-ref-search-box {
          position: relative;
          width: min(520px, 100%);
          display: flex;
          align-items: center;
        }
        .yam-ref-search-box input {
          width: 100%;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(10, 18, 34, 0.92);
          border-radius: 18px;
          padding: 13px 44px 13px 16px;
          color: #f8fafc;
        }
        .yam-ref-search-icon {
          position: absolute;
          inset-inline-end: 14px;
          display: grid;
          place-items: center;
          color: #94a3b8;
        }
        .yam-topbar-icon-btn,
        .yam-mobile-icon {
          position: relative;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #e2e8f0;
          background: rgba(10, 18, 34, 0.88);
        }
        .yam-topbar-profile-link {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .yam-topbar-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          border: 2px solid rgba(168, 85, 247, 0.7);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14);
        }
        .yam-topbar-badge {
          position: absolute;
          top: -3px;
          inset-inline-end: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #7c3aed;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          border: 2px solid rgba(4, 8, 18, 0.9);
        }
        .yam-ref-topbar-mobile {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 10px;
        }
        .yam-ref-topbar-mobile h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
        }
        .yam-mobile-icon.accent {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: #fff;
          box-shadow: 0 12px 20px rgba(124, 58, 237, 0.22);
        }
        .yam-mobile-dot {
          position: absolute;
          top: 7px;
          inset-inline-end: 7px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9333ea;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.14);
        }
        @media (max-width: 960px) {
          .yam-ref-topbar-desktop {
            grid-template-columns: 1fr;
          }
          .yam-ref-actions {
            justify-content: flex-end;
          }
        }
        @media (max-width: 767px) {
          .yam-ref-topbar-desktop {
            display: none;
          }
          .yam-ref-topbar-mobile {
            display: flex;
          }
          .yam-ref-topbar {
            background: rgba(6, 11, 22, 0.96);
            border-bottom: none;
          }
        }
      `}</style>
    </header>
  );
}
