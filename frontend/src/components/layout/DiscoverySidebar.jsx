import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../store/appStore.js';
import { getAuthToken } from '../../utils/auth.js';
import { BACKEND_ORIGIN } from '../../api/config.js';

const DISCOVERY_SECTIONS = [
  {
    title: 'الاستكشاف',
    items: [
      { to: '/search', label: 'البحث الذكي', icon: '🔍', description: 'ابحث عن أشخاص ومنشورات' },
      { to: '/users', label: 'اكتشاف أشخاص', icon: '👥', description: 'اقتراحات شخصية' },
      { to: '/dashboard', label: 'التحليلات', icon: '📊', description: 'إحصائياتك' },
    ],
  },
  {
    title: 'المحتوى',
    items: [
      { to: '/stories', label: 'القصص', icon: '📖', description: 'قصص من متابعيك' },
      { to: '/reels', label: 'الريلز', icon: '🎬', description: 'فيديوهات قصيرة' },
      { to: '/groups', label: 'المجموعات', icon: '👫', description: 'مجموعات مشتركة' },
    ],
  },
  {
    title: 'التفاعل',
    items: [
      { to: '/live/control', label: 'البث المباشر', icon: '📡', description: 'بثوث مباشرة' },
      { to: '/inbox', label: 'الدردشة', icon: '💬', description: 'رسائلك' },
    ],
  },
];

export default function DiscoverySidebar() {
  const location = useLocation();
  const language = useAppStore((state) => state.language);

  const { data: stats = {} } = useQuery({
    queryKey: ['discovery-stats'],
    queryFn: async () => {
      try {
        const response = await fetch(`${BACKEND_ORIGIN}/api/user/stats`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        return response.ok ? response.json() : {};
      } catch {
        return {};
      }
    },
    staleTime: 60_000,
  });

  return (
    <aside className="discovery-sidebar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="discovery-sidebar-content">
        {DISCOVERY_SECTIONS.map((section) => (
          <div key={section.title} className="discovery-section">
            <h3 className="discovery-section-title">{section.title}</h3>
            <div className="discovery-items">
              {section.items.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`discovery-item ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <span className="discovery-item-icon">{item.icon}</span>
                    <div className="discovery-item-content">
                      <strong>{item.label}</strong>
                      <span className="discovery-item-desc">{item.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(stats).length > 0 && (
          <div className="discovery-section discovery-stats">
            <h3 className="discovery-section-title">إحصائياتك</h3>
            <div className="stats-grid">
              {stats.followers_count !== undefined && (
                <div className="stat-item">
                  <strong>{stats.followers_count || 0}</strong>
                  <span>متابعون</span>
                </div>
              )}
              {stats.following_count !== undefined && (
                <div className="stat-item">
                  <strong>{stats.following_count || 0}</strong>
                  <span>يتابعون</span>
                </div>
              )}
              {stats.posts_count !== undefined && (
                <div className="stat-item">
                  <strong>{stats.posts_count || 0}</strong>
                  <span>منشورات</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .discovery-sidebar {
          width: 280px;
          background: rgba(10, 16, 31, 0.6);
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
        }

        .discovery-sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .discovery-sidebar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.28);
          border-radius: 999px;
        }

        .discovery-sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 0 12px;
        }

        .discovery-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .discovery-section-title {
          margin: 0;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .discovery-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .discovery-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: transparent;
          color: #cbd5e1;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .discovery-item:hover {
          background: rgba(124, 58, 237, 0.12);
          color: #dbe4ff;
          border-color: rgba(167, 139, 250, 0.24);
        }

        .discovery-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(99, 102, 241, 0.14));
          color: #fff;
          border-color: rgba(167, 139, 250, 0.24);
        }

        .discovery-item-icon {
          font-size: 18px;
          display: block;
          flex-shrink: 0;
        }

        .discovery-item-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .discovery-item-content strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
        }

        .discovery-item-desc {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .discovery-stats {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .stat-item strong {
          font-size: 16px;
          color: #fff;
        }

        .stat-item span {
          font-size: 10px;
          color: #94a3b8;
        }

        @media (max-width: 1280px) {
          .discovery-sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
