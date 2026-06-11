import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/users.js';
import BrandLogo from '../ui/BrandLogo.jsx';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { avatarGradient, formatCompactNumber, initialsFromName } from '../yamshat/YamshatDesign.js';
import { useToast } from '../admin/ToastProvider.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'الصفحة الرئيسية', icon: '⌂' },
  { to: '/search', label: 'اكتشف', icon: '⌕' },
  { to: '/users', label: 'المتابعون', icon: '◌' },
  { to: '/notifications', label: 'الإشعارات', icon: '◔', badgeType: 'notifications' },
  { to: '/inbox', label: 'الرسائل', icon: '✉', badgeType: 'messages' },
  { to: '/engagement', label: 'مركز التفاعل', icon: '★' },
  { to: '/voice', label: 'غرف صوتية', icon: '♫' },
  { to: '/profile', label: 'العلامات المحفوظة', icon: '▣' },
];

function Avatar({ name, src, size = 42 }) {
  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontWeight: 800,
        background: avatarGradient(name),
        flexShrink: 0,
      }}
    >
      {initialsFromName(name).slice(0, 1)}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const notificationCount = 0;
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const language = useAppStore((state) => state.language);

  const { data: usersData = [] } = useQuery({
    queryKey: ['sidebar-users'],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 60_000,
  });

  const liveUsers = [];
  const suggestedUsers = Array.isArray(usersData) ? usersData.slice(0, 3) : [];
  const suggestedGroups = [
    { name: 'Gamers Hub', members: '12.5K عضو' },
    { name: 'Tech Talk', members: '5.2K عضو' },
    { name: 'Music Vibes', members: '8.2K عضو' },
  ];

  return (
    <aside className="yamshat-side-rail">
      <div className="yamshat-side-section yam-brand-card">
        <div className="yam-brand-mark yam-brand-mark-logo">
          <BrandLogo size={42} alt="شعار يام شات الرسمي" className="yam-brand-mark-image" />
        </div>
        <div>
          <div className="yam-brand-title">YAMSHAT</div>
          <p className="yam-brand-copy">
            {language === 'en' ? 'The official Yamshat identity is now active across web, PWA, and mobile.' : 'تم تثبيت الشعار الرسمي المعتمد في الويب وتجربة الـ PWA والموبايل مع إزالة أي تعارض بصري سابق.'}
          </p>
          <button type="button" className="yam-primary-btn" onClick={() => {
            pushToast({ type: 'info', title: 'تم فتح إعدادات الترقية', description: 'راجع إعدادات الحساب والاشتراك لتفعيل المزايا الاحترافية.' });
            navigate('/settings');
          }}>ترقية الآن</button>
        </div>
      </div>

      <nav className="yamshat-side-section yam-side-nav">
        {NAV_ITEMS.map((item) => {
          const badge = item.badgeType === 'messages' ? unreadInboxCount : item.badgeType === 'notifications' ? notificationCount : 0;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `yam-side-link ${isActive ? 'active' : ''}`}>
              <span className="yam-side-icon">{item.icon}</span>
              <span>{item.label}</span>
              {badge > 0 ? <span className="yam-side-badge">{badge}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>القنوات التي تتابعها</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {liveUsers.length ? liveUsers.map((room) => (
            <div key={room.id} className="yam-entity-row">
              <Avatar name={room.host || room.username || 'Live'} src={room.avatar} />
              <div className="yam-entity-copy">
                <strong>{room.host || room.username || 'PlayerOne'}</strong>
                <small>{room.title || 'Gaming'}</small>
              </div>
              <div className="yam-live-metric">
                <span className="dot" />
                {formatCompactNumber(room.viewer_count || 0)}
              </div>
            </div>
          )) : (
            ['PlayerOne', 'Ahmed_King', 'ShadowGirl'].map((name, index) => (
              <div key={name} className="yam-entity-row">
                <Avatar name={name} />
                <div className="yam-entity-copy">
                  <strong>{name}</strong>
                  <small>{['Just Chatting', 'VALORANT', 'Fortnite'][index]}</small>
                </div>
                <div className="yam-live-metric"><span className="dot" />{['1.2K', '980', '756'][index]}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>اقتراحات للمتابعة</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {suggestedUsers.map((user) => (
            <div key={user.username || user.id} className="yam-entity-row compact">
              <Avatar name={user.username || 'User'} src={user.avatar} size={40} />
              <div className="yam-entity-copy">
                <strong>{user.username}</strong>
                <small>{user.profile?.activity_tagline || user.email || 'Gaming Creator'}</small>
              </div>
              <button type="button" className="yam-follow-btn" onClick={() => {
                pushToast({ type: 'success', title: 'تمت المتابعة', description: user.username ? `أصبحت تتابع @${user.username}` : 'تمت إضافة المستخدم إلى قائمتك.' });
                navigate(user.username ? `/profile/${encodeURIComponent(user.username)}` : '/users');
              }}>متابعة</button>
            </div>
          ))}
        </div>
      </section>

      <section className="yamshat-side-section">
        <div className="yam-section-head">
          <h3>المجموعات الموصى بها</h3>
          <span>عرض الكل</span>
        </div>
        <div className="yam-stack-list">
          {suggestedGroups.map((group) => (
            <div key={group.name} className="yam-entity-row compact">
              <div className="yam-group-badge">🎮</div>
              <div className="yam-entity-copy">
                <strong>{group.name}</strong>
                <small>{group.members}</small>
              </div>
              <button type="button" className="yam-join-btn" onClick={() => {
                pushToast({ type: 'info', title: 'تم فتح صفحة المجموعات', description: `يمكنك إكمال الانضمام إلى ${group.name} من شاشة المجموعات.` });
                navigate('/groups');
              }}>انضمام</button>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .yamshat-side-rail {
          width: 330px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 22px 18px 32px;
          background: rgba(5, 10, 22, 0.94);
          border-inline-end: 1px solid rgba(148, 163, 184, 0.08);
          display: grid;
          gap: 16px;
          backdrop-filter: blur(16px);
        }
        .yamshat-side-rail::-webkit-scrollbar { width: 6px; }
        .yamshat-side-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        .yamshat-side-section {
          border-radius: 24px;
          background: rgba(12, 18, 34, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 40px rgba(2,6,23,0.24);
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-brand-card {
          background: radial-gradient(circle at top, rgba(139,92,246,0.28), transparent 65%), linear-gradient(180deg, rgba(20, 13, 48, 0.98), rgba(12,18,34,0.96));
          grid-template-columns: 72px 1fr;
          align-items: start;
        }
        .yam-brand-mark {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.08));
          border: 1px solid rgba(167,139,250,0.18);
          overflow: hidden;
        }
        .yam-brand-title { font-size: 20px; font-weight: 900; letter-spacing: 0.04em; }
        .yam-brand-copy { margin: 6px 0 14px; color: #94a3b8; font-size: 13px; line-height: 1.8; }
        .yam-primary-btn, .yam-follow-btn, .yam-join-btn {
          border: none;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 16px 30px rgba(124,58,237,0.24);
        }
        .yam-follow-btn, .yam-join-btn {
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: none;
        }
        .yam-side-nav { padding: 10px; gap: 8px; }
        .yam-side-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          color: #dbe4ff;
          background: transparent;
          transition: 0.2s ease;
          font-weight: 700;
        }
        .yam-side-link.active,
        .yam-side-link:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.14));
          color: white;
        }
        .yam-side-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          font-size: 16px;
        }
        .yam-side-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.18);
          color: #fecaca;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #f8fafc;
        }
        .yam-section-head h3 { margin: 0; font-size: 15px; }
        .yam-section-head span { color: #94a3b8; font-size: 12px; }
        .yam-stack-list {
          display: grid;
          gap: 12px;
        }
        .yam-entity-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
        }
        .yam-entity-row.compact { grid-template-columns: auto 1fr auto; }
        .yam-entity-copy {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .yam-entity-copy strong {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-entity-copy small {
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-live-metric {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fda4af;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-live-metric .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f43f5e;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.12);
        }
        .yam-group-badge {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(124,58,237,0.14);
        }
      `}</style>
    </aside>
  );
}
