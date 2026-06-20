import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PRIMARY_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: '⌂' },
  { to: '/friends', label: 'الأصدقاء', icon: '👥' },
  { to: '/groups', label: 'المجموعات', icon: '👨‍👩‍👧‍👦' },
  { to: '/inbox', label: 'الرسائل', icon: '✉' },
  { to: '/notifications', label: 'الإشعارات', icon: '🔔' },
  { to: '/profile', label: 'الملف الشخصي', icon: '👤' },
  { to: '/profile?tab=saved', label: 'المحفوظات', icon: '🔖' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙' },
];

const SERVICE_ITEMS = [
  { to: '/inbox', label: 'الدردشة', icon: '💬' },
  { to: '/chat', label: 'المكالمات', icon: '📞' },
  { to: '/groups', label: 'المجموعات', icon: '👥' },
  { to: '/search', label: 'الأخبار', icon: '📰' },
  { to: '/profile?panel=themes', label: 'الثيمات المميزة', icon: '🖼' },
];

export default function YamServicesMenu({ open = false, onClose, onLogout, brandLabel = 'Yamshat' }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="yam-services-layer" dir="rtl">
      <button type="button" className="yam-services-backdrop" aria-label="إغلاق القائمة" onClick={onClose} />
      <aside className="yam-services-panel" role="dialog" aria-modal="true" aria-label="قائمة يام شات">
        <div className="yam-services-header">
          <div className="yam-services-brand-badge">Y</div>
          <div className="yam-services-brand-copy">
            <strong>{brandLabel}</strong>
            <span>خدمات يام شات</span>
          </div>
          <button type="button" className="yam-services-close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>

        <nav className="yam-services-nav" aria-label="القائمة الرئيسية">
          {PRIMARY_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className="yam-services-link" onClick={onClose}>
              <span className="yam-services-link-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="yam-services-section-title">خدمات يام شات</div>
        <nav className="yam-services-nav" aria-label="خدمات يام شات">
          {SERVICE_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className="yam-services-link service" onClick={onClose}>
              <span className="yam-services-link-icon service" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button type="button" className="yam-services-logout" onClick={onLogout}>
          <span aria-hidden="true">🚪</span>
          <span>تسجيل الخروج</span>
        </button>

        <div className="yam-services-footer">© 2024 Yamshat. حقوق محفوظة.</div>
      </aside>

      <style>{`
        .yam-services-layer {
          position: fixed;
          inset: 0;
          z-index: 2200;
        }
        .yam-services-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(3px);
          cursor: pointer;
        }
        .yam-services-panel {
          position: absolute;
          top: 0;
          right: 0;
          width: min(320px, 88vw);
          height: 100%;
          padding: 18px 14px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: linear-gradient(180deg, rgba(10,13,26,0.98), rgba(8,10,22,0.99));
          border-left: 1px solid rgba(167, 139, 250, 0.18);
          box-shadow: -14px 0 40px rgba(0, 0, 0, 0.42);
          overflow-y: auto;
        }
        .yam-services-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 6px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .yam-services-brand-badge {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #f5f3ff;
          font-weight: 900;
          font-size: 1.05rem;
          background: radial-gradient(circle at 30% 20%, #a78bfa, #7c3aed 65%, #4c1d95 100%);
          box-shadow: 0 0 22px rgba(124, 58, 237, 0.35);
        }
        .yam-services-brand-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        .yam-services-brand-copy strong {
          color: #f8fafc;
          font-size: 1rem;
        }
        .yam-services-brand-copy span {
          color: #94a3b8;
          font-size: 0.82rem;
        }
        .yam-services-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.62);
          color: #e2e8f0;
          font-size: 1.3rem;
          cursor: pointer;
        }
        .yam-services-nav {
          display: grid;
          gap: 8px;
        }
        .yam-services-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          color: #e2e8f0;
          text-decoration: none;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
        }
        .yam-services-link:hover {
          transform: translateX(-3px);
          background: rgba(91, 33, 182, 0.2);
          border-color: rgba(167, 139, 250, 0.28);
        }
        .yam-services-link.service {
          background: rgba(17, 24, 39, 0.58);
        }
        .yam-services-link-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: rgba(124, 58, 237, 0.18);
          color: #ddd6fe;
          flex-shrink: 0;
          font-size: 1rem;
        }
        .yam-services-link-icon.service {
          background: linear-gradient(180deg, rgba(59,130,246,0.3), rgba(20,184,166,0.24));
        }
        .yam-services-section-title {
          padding: 10px 6px 2px;
          color: #cbd5e1;
          font-size: 0.92rem;
          font-weight: 800;
        }
        .yam-services-logout {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px 16px;
          border-radius: 16px;
          border: 1px solid rgba(248, 113, 113, 0.22);
          background: rgba(127, 29, 29, 0.16);
          color: #fecaca;
          font-weight: 700;
          cursor: pointer;
        }
        .yam-services-footer {
          padding-top: 4px;
          text-align: center;
          color: #64748b;
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
