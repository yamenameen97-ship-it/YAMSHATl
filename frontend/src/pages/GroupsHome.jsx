import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/groups-list.css';

const GroupsHome = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('الكل');

  const categories = [
    { id: 1, name: 'الكل', icon: '📱' },
    { id: 2, name: 'دراسة', icon: '🎓' },
    { id: 3, name: 'تقنية', icon: '💻' },
    { id: 4, name: 'ألعاب', icon: '🎮' },
    { id: 5, name: 'تصميم', icon: '🖋️' },
    { id: 6, name: 'ترفيه', icon: '😊' }
  ];

  const groups = [
    {
      id: 1,
      name: 'رواد المستقبل',
      desc: 'مجتمع يهتم بالابتكار وريادة الأعمال 💡',
      members: '1.2K',
      lastActive: 'نشط الآن',
      unread: 15,
      icon: '🚀',
      color: '#8b5cf6',
      verified: true
    },
    {
      id: 2,
      name: 'مطورين العرب',
      desc: 'كل ما يخص البرمجة والتطوير 💻',
      members: '3.4K',
      lastActive: 'منذ 5 دقائق',
      unread: 8,
      icon: '</>',
      color: '#ec4899',
      verified: true
    },
    {
      id: 3,
      name: 'عشاق الألعاب',
      desc: 'تحديثات، أخبار، ونقاشات الألعاب 🔥',
      members: '2.8K',
      lastActive: 'منذ 15 دقيقة',
      unread: 23,
      icon: '🎮',
      color: '#3b82f6',
      verified: true
    },
    {
      id: 4,
      name: 'مصممين مبدعين',
      desc: 'شارك أعمالك وتعلم التصميم 🎨',
      members: '1.6K',
      lastActive: 'منذ ساعة',
      unread: 6,
      icon: '🖌️',
      color: '#f59e0b',
      verified: true
    },
    {
      id: 5,
      name: 'دردشة عامة',
      desc: 'نقاشات حرة ومواضيع متنوعة ☕',
      members: '5.7K',
      lastActive: 'منذ 2 ساعة',
      unread: 12,
      icon: '☕',
      color: '#10b981',
      verified: false
    },
    {
      id: 6,
      name: 'طلاب الجامعات',
      desc: 'مذاكرة، ملفات، ونصائح أكاديمية 📚',
      members: '2.1K',
      lastActive: 'منذ 3 ساعة',
      unread: 9,
      icon: '📖',
      color: '#6366f1',
      verified: true
    }
  ];

  return (
    <div className="yam-groups-page">
      {/* الهيدر */}
      <header className="yam-groups-header">
        <div className="yam-groups-title-section">
          <h1>المجموعات</h1>
          <p className="yam-groups-subtitle">تواصل، شارك، وكن جزءاً من المجتمع ✨</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{fontSize: '24px'}}>🔔</div>
          <div style={{width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #8b5cf6'}}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="profile" style={{width: '100%', height: '100%'}} />
          </div>
        </div>
      </header>

      <button className="yam-create-group-btn">
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
        {groups.map(group => (
          <div key={group.id} className="yam-group-card">
            <div className="yam-group-main-info">
              <div className="yam-group-neon-icon" style={{'--neon-color': group.color}}>
                <span style={{color: group.color}}>{group.icon}</span>
              </div>
              <div className="yam-group-text-details">
                <h3>{group.name} {group.verified && <span style={{color: '#8b5cf6', fontSize: '14px'}}>✔️</span>}</h3>
                <p className="yam-group-desc">{group.desc}</p>
                <div className="yam-group-meta">
                  <span className="yam-member-count">👥 عضو {group.members}</span>
                  <span className="yam-status-dot" style={{backgroundColor: '#22c55e', width: '8px', height: '8px', borderRadius: '50%'}}></span>
                </div>
              </div>
            </div>
            <div className="yam-group-side-info">
              <span className="yam-last-active">
                {group.lastActive === 'نشط الآن' && <span className="yam-active-dot"></span>}
                {group.lastActive}
              </span>
              <div className="yam-unread-badge">{group.unread}</div>
              <div className="yam-more-btn">⋮</div>
            </div>
          </div>
        ))}
      </section>

      {/* النافبار السفلي */}
      <nav className="yam-bottom-nav">
        <div className="yam-nav-item">
          <span className="yam-nav-icon">🏠</span>
          <span>الرئيسية</span>
        </div>
        <div className="yam-nav-item active">
          <span className="yam-nav-icon">👥</span>
          <span>المجموعات</span>
        </div>
        <div className="yam-center-nav-btn">
          <span>Y</span>
        </div>
        <div className="yam-nav-item">
          <span className="yam-nav-icon">💬</span>
          <span>الرسائل</span>
        </div>
        <div className="yam-nav-item">
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
