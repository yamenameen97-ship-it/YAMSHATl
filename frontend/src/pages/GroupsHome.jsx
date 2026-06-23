import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getGroups, searchGroups } from '../api/groups.js';
import '../styles/groups-list.css';

/**
 * GroupsHome — v2 مُصلحة
 * --------------------
 * إصلاحات:
 *  - حقل البحث أصبح فعّالاً (مرتبط بـ state ويفلتر القائمة + يستدعي searchGroups عند الكتابة).
 *  - زر الفلتر/الإعدادات لم يعد يذهب لمسار خاطئ (يفتح فلاتر التصنيفات بدل /groups/settings بدون id).
 *  - زر "⋮" داخل البطاقة يذهب لإعدادات المجموعة الخاصة بها فقط (آمن).
 *  - حالة "لا نتائج للبحث" منفصلة عن "لا توجد مجموعات".
 */
const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const categories = [
    { id: 1, name: 'الكل', icon: '📱' },
    { id: 2, name: 'دراسة', icon: '🎓' },
    { id: 3, name: 'تقنية', icon: '💻' },
    { id: 4, name: 'ألعاب', icon: '🎮' },
    { id: 5, name: 'تصميم', icon: '🖋️' },
    { id: 6, name: 'ترفيه', icon: '😊' }
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await getGroups();
        const groupsData = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        setGroups(groupsData);
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // بحث ذكي مع debounce + fallback للبحث المحلي
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const handle = setTimeout(async () => {
      try {
        const res = await searchGroups(searchQuery.trim(), 50);
        const data = res?.data?.groups || res?.data || [];
        if (Array.isArray(data) && data.length) {
          setGroups((prev) => {
            const map = new Map(prev.map((g) => [String(g.id), g]));
            for (const g of data) map.set(String(g.id), { ...map.get(String(g.id)), ...g });
            return Array.from(map.values());
          });
        }
      } catch { /* fallback للبحث المحلي فقط */ }
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const filteredGroups = useMemo(() => {
    const byCategory = activeCategory === 'الكل'
      ? groups
      : groups.filter((g) => g.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((g) =>
      String(g.name || '').toLowerCase().includes(q) ||
      String(g.description || g.desc || '').toLowerCase().includes(q)
    );
  }, [groups, activeCategory, searchQuery]);

  return (
    <MainLayout>
      <div className="yam-groups-page" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}>
        <header className="yam-groups-header">
          <div className="yam-groups-title-section">
            <h1>المجموعات</h1>
            <p className="yam-groups-subtitle">تواصل، شارك، وكن جزءاً من المجتمع ✨</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="yam-create-group-btn" onClick={() => navigate('/groups/wizard')}>
            <span>+</span> إنشاء مجموعة (معالج)
          </button>
          <button
            className="yam-create-group-btn"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)' }}
            onClick={() => navigate('/groups/discover')}
          >
            <span>🔭</span> اكتشف مجموعات
          </button>
        </div>

        {/* البحث */}
        <section className="yam-search-filter-section" style={{ marginTop: '24px' }}>
          <div
            className="yam-filter-btn"
            onClick={() => setShowFilters((v) => !v)}
            title="إظهار/إخفاء التصنيفات"
            aria-label="إظهار/إخفاء التصنيفات"
          >⚙️</div>
          <div className="yam-search-bar-wrap">
            <input
              type="text"
              className="yam-search-input"
              placeholder="ابحث عن مجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir="rtl"
              enterKeyHint="search"
            />
            <span className="yam-search-icon">🔍</span>
          </div>
        </section>

        {/* التصنيفات */}
        {showFilters && (
          <section className="yam-categories-scroll">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`yam-category-pill ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </div>
            ))}
          </section>
        )}

        {/* قائمة المجموعات */}
        <section className="yam-groups-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>جاري التحميل...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              {searchQuery.trim() ? 'لا توجد نتائج مطابقة لبحثك.' : 'لا توجد مجموعات حالياً.'}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="yam-group-card"
                onClick={() => navigate(`/groups/${group.id}/chat`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="yam-group-main-info">
                  <div className="yam-group-neon-icon" style={{ '--neon-color': group.color || '#8b5cf6' }}>
                    <span style={{ color: group.color || '#8b5cf6' }}>{group.icon || '👥'}</span>
                  </div>
                  <div className="yam-group-text-details">
                    <h3>{group.name} {group.verified && <span style={{ color: '#8b5cf6', fontSize: '14px' }}>✔️</span>}</h3>
                    <p className="yam-group-desc">{group.description || group.desc || 'لا يوجد وصف للمجموعة'}</p>
                    <div className="yam-group-meta">
                      <span className="yam-member-count">👥 {group.members_count || group.members || 0} عضو</span>
                      <span className="yam-status-dot" style={{ backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%' }}></span>
                    </div>
                  </div>
                </div>
                <div className="yam-group-side-info">
                  <span className="yam-last-active">
                    {group.is_active && <span className="yam-active-dot"></span>}
                    {group.last_active_human || 'نشط'}
                  </span>
                  {group.unread_count > 0 && <div className="yam-unread-badge">{group.unread_count}</div>}
                  <div
                    className="yam-more-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/groups/${group.id}/settings`);
                    }}
                  >⋮</div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default GroupsHome;
