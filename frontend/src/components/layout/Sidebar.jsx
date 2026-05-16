import { NavLink } from 'react-router-dom';
import { avatarGradient, initialsFromName } from '../yamshat/YamshatDesign.js';
import { suggestedGroups, suggestedUsers } from '../yamshat/showcaseData.js';
import YamshatIcon from '../yamshat/YamshatIcon.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'الصفحة الرئيسية', icon: 'home' },
  { to: '/search', label: 'اكتشف', icon: 'discover' },
  { to: '/users', label: 'المتابعون', icon: 'users' },
  { to: '/notifications', label: 'الإشعارات', icon: 'bell', badge: '3' },
  { to: '/inbox', label: 'الرسائل', icon: 'message' },
  { to: '/profile', label: 'العلامات المحفوظة', icon: 'bookmark' },
];

function Avatar({ name, size = 44 }) {
  return (
    <div
      className="yam-side-avatar"
      style={{ width: size, height: size, background: avatarGradient(name) }}
      aria-label={name}
    >
      {initialsFromName(name).slice(0, 1)}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="yam-ref-sidebar">
      <section className="yam-ref-pro-card">
        <div className="yam-ref-pro-crown">♛</div>
        <div className="yam-ref-pro-copy">
          <h2>YAMSHAT PRO</h2>
          <p>ترقية تجربة يامشات الخاصة بك بمميزات حصرية وإشعارات خاصة والمزيد.</p>
          <button type="button">ترقية الآن</button>
        </div>
      </section>

      <nav className="yam-ref-side-nav" aria-label="القائمة الجانبية">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `yam-ref-side-link ${isActive ? 'active' : ''}`}>
            <span className="yam-ref-side-link-main">
              <span className="yam-ref-side-icon"><YamshatIcon name={item.icon} size={18} /></span>
              <span>{item.label}</span>
            </span>
            {item.badge ? <span className="yam-ref-side-badge">{item.badge}</span> : null}
          </NavLink>
        ))}
      </nav>

      <section className="yam-ref-side-card">
        <div className="yam-ref-card-head">
          <h3>اقتراحات للمتابعة</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-ref-list">
          {suggestedUsers.map((user) => (
            <div key={user.id} className="yam-ref-user-row">
              <div className="yam-ref-user-main">
                <Avatar name={user.username} />
                <div>
                  <strong>
                    {user.username}
                    {user.verified ? <span className="yam-ref-verify">✓</span> : null}
                  </strong>
                  <small>{user.tagline}</small>
                </div>
              </div>
              <button type="button" className="yam-mini-btn">متابعة</button>
            </div>
          ))}
        </div>
      </section>

      <section className="yam-ref-side-card">
        <div className="yam-ref-card-head">
          <h3>المجموعات الموصى بها</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-ref-list">
          {suggestedGroups.map((group) => (
            <div key={group.id} className="yam-ref-user-row">
              <div className="yam-ref-user-main">
                <div className="yam-ref-group-badge">🎮</div>
                <div>
                  <strong>{group.name}</strong>
                  <small>{group.members}</small>
                </div>
              </div>
              <button type="button" className="yam-mini-btn">انضمام</button>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .yam-ref-sidebar {
          width: 320px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 18px 16px 22px;
          display: grid;
          align-content: start;
          gap: 16px;
          background: rgba(4, 9, 20, 0.96);
          border-inline-end: 1px solid rgba(255,255,255,0.04);
        }
        .yam-ref-sidebar::-webkit-scrollbar { width: 6px; }
        .yam-ref-sidebar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.18); border-radius: 999px; }
        .yam-ref-pro-card,
        .yam-ref-side-nav,
        .yam-ref-side-card {
          background: rgba(10, 16, 30, 0.92);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          box-shadow: 0 18px 42px rgba(2, 6, 23, 0.25);
        }
        .yam-ref-pro-card {
          padding: 20px;
          display: grid;
          gap: 16px;
          background: radial-gradient(circle at top, rgba(124,58,237,0.26), transparent 58%), linear-gradient(180deg, rgba(17, 10, 40, 0.96), rgba(9, 15, 28, 0.96));
        }
        .yam-ref-pro-crown {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          color: #c4b5fd;
          font-size: 26px;
          background: rgba(76, 29, 149, 0.32);
          border: 1px solid rgba(167,139,250,0.2);
        }
        .yam-ref-pro-copy h2,
        .yam-ref-card-head h3 {
          margin: 0;
        }
        .yam-ref-pro-copy p {
          margin: 8px 0 16px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.8;
        }
        .yam-ref-pro-copy button,
        .yam-mini-btn {
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          color: #fff;
          font-weight: 800;
          background: linear-gradient(135deg, #6d28d9, #8b5cf6 75%);
          box-shadow: 0 12px 24px rgba(109, 40, 217, 0.22);
        }
        .yam-mini-btn {
          padding: 9px 14px;
          border-radius: 12px;
          box-shadow: none;
          font-size: 13px;
        }
        .yam-ref-side-nav {
          padding: 12px;
          display: grid;
          gap: 8px;
        }
        .yam-ref-side-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 16px;
          color: #e2e8f0;
          font-weight: 700;
        }
        .yam-ref-side-link.active,
        .yam-ref-side-link:hover {
          background: linear-gradient(135deg, rgba(109,40,217,0.24), rgba(99,102,241,0.14));
        }
        .yam-ref-side-link-main,
        .yam-ref-user-main,
        .yam-ref-card-head {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .yam-ref-card-head {
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .yam-ref-card-head span {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 700;
        }
        .yam-ref-side-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #ddd6fe;
          background: rgba(255,255,255,0.04);
        }
        .yam-ref-side-badge {
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #7c3aed;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }
        .yam-ref-side-card {
          padding: 18px;
        }
        .yam-ref-list {
          display: grid;
          gap: 12px;
        }
        .yam-ref-user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .yam-side-avatar,
        .yam-ref-group-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 900;
          flex-shrink: 0;
        }
        .yam-ref-group-badge {
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(109,40,217,0.28), rgba(59,130,246,0.18));
          font-size: 20px;
        }
        .yam-ref-user-row strong {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
        }
        .yam-ref-user-row small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 12px;
        }
        .yam-ref-verify {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: inline-grid;
          place-items: center;
          background: #3b82f6;
          color: white;
          font-size: 10px;
          font-weight: 900;
        }
        @media (max-width: 1180px) {
          .yam-ref-sidebar {
            width: 286px;
          }
        }
        @media (max-width: 767px) {
          .yam-ref-sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
