import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups } from '../api/groups.js';
import '../styles/groups-list.css';

const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // نفترض أن الباك إند يعيد قائمة من المجموعات في response.data أو response
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

  const filteredGroups = activeCategory === 'الكل' 
    ? groups 
    : groups.filter(g => g.category === activeCategory);

  return (
    <div className="yam-groups-page">
      {/* الهيدر */}
      <header className="yam-groups-header">
        <div className="yam-groups-title-section">
          <h1>المجموعات</h1>
          <p className="yam-groups-subtitle">تواصل، شارك، وكن جزءاً من المجتمع ✨</p>
        </div>
      </header>

      <button className="yam-create-group-btn" onClick={() => navigate('/groups/create')}>
        <span>+</span> إنشاء مجموعة
      </button>

      {/* البحث */}
      <section className="yam-search-filter-section" style={{marginTop: '24px'}}>
        <div className="yam-filter-btn" onClick={() => navigate('/groups/settings')}>⚙️</div>
        <div className="yam-search-bar-wrap">
          <input type="text" className="yam-search-input" placeholder="ابحث عن مجموعة..." />
          <span className="yam-search-icon">🔍</span>
        </div>
      </section>

      {/* التصنيفات */}
      <section className="yam-categories-scroll">
        {categories.map(cat => (
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

      {/* قائمة المجموعات */}
      <section className="yam-groups-list">
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>جاري التحميل...</div>
        ) : error ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#ef4444'}}>{error}</div>
        ) : filteredGroups.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>لا توجد مجموعات حالياً.</div>
        ) : (
          filteredGroups.map(group => (
            <div key={group.id} className="yam-group-card" onClick={() => navigate(`/groups/${group.id}/chat`)} style={{cursor: 'pointer'}}>
              <div className="yam-group-main-info">
                <div className="yam-group-neon-icon" style={{'--neon-color': group.color || '#8b5cf6'}}>
                  <span style={{color: group.color || '#8b5cf6'}}>{group.icon || '👥'}</span>
                </div>
                <div className="yam-group-text-details">
                  <h3>{group.name} {group.verified && <span style={{color: '#8b5cf6', fontSize: '14px'}}>✔️</span>}</h3>
                  <p className="yam-group-desc">{group.description || group.desc || 'لا يوجد وصف للمجموعة'}</p>
                  <div className="yam-group-meta">
                    <span className="yam-member-count">👥 {group.members_count || group.members || 0} عضو</span>
                    <span className="yam-status-dot" style={{backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%'}}></span>
                  </div>
                </div>
              </div>
              <div className="yam-group-side-info">
                <span className="yam-last-active">
                  {group.is_active && <span className="yam-active-dot"></span>}
                  {group.last_active_human || 'نشط'}
                </span>
                {group.unread_count > 0 && <div className="yam-unread-badge">{group.unread_count}</div>}
                <div className="yam-more-btn" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/groups/${group.id}/settings`);
                }}>⋮</div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* النافبار السفلي */}
      <nav className="yam-bottom-nav">
        <div className="yam-nav-item" onClick={() => navigate('/')}>
          <span className="yam-nav-icon">🏠</span>
          <span>الرئيسية</span>
        </div>
        <div className="yam-nav-item active">
          <span className="yam-nav-icon">👥</span>
          <span>المجموعات</span>
        </div>
        <div className="yam-center-nav-btn" onClick={() => navigate('/')}>
          <span>Y</span>
        </div>
        <div className="yam-nav-item" onClick={() => navigate('/inbox')}>
          <span className="yam-nav-icon">💬</span>
          <span>الرسائل</span>
        </div>
        <div className="yam-nav-item" onClick={() => navigate('/settings')}>
          <span className="yam-nav-icon">⋯</span>
          <span>المزيد</span>
        </div>
      </nav>

      {/* مساحة فارغة في الأسفل للنافبار */}
      <div style={{height: '100px'}}></div>
    </div>
  );
};

export default GroupsHome;
