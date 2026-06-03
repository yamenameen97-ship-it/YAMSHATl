import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/group-settings.css';

const GroupSettings = () => {
  const navigate = useNavigate();
  const [privacy, setPrivacy] = useState('public');
  const [permissions, setPermissions] = useState({
    canPost: true,
    canComment: true,
    canUpload: true,
    canLive: true,
    requireApproval: false,
    blockExternalLinks: false
  });

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const members = [
    { id: 1, name: 'أحمد علي', username: '@ahmed.ali', role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed' },
    { id: 2, name: 'محمد خالد', username: '@mohamed.k', role: 'mod', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed' },
    { id: 3, name: 'سارة محمد', username: '@sarah.m', role: 'member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 4, name: 'علي إبراهيم', username: '@ali.ibrahim', role: 'member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali' }
  ];

  return (
    <div className="yam-group-settings-page">
      {/* الهيدر */}
      <header className="yam-settings-header">
        <button className="yam-back-btn" onClick={() => navigate(-1)}>
          <span style={{ fontSize: '20px' }}>❮</span>
        </button>
        <h1>إعدادات المجموعة</h1>
        <button className="yam-more-options-btn">
          <span style={{ fontSize: '20px' }}>⋮</span>
        </button>
      </header>

      {/* بطاقة المجموعة الرئيسية */}
      <section className="yam-group-info-card">
        <div className="yam-group-info-main">
          <div className="yam-group-avatar-wrap">
            <span>🚀</span>
          </div>
          <div className="yam-group-details">
            <div className="yam-group-name-row">
              <h2>رواد المستقبل <span style={{ color: '#8b5cf6', fontSize: '16px' }}>✔️</span></h2>
              <div className="yam-active-now">
                <span className="yam-active-dot-pulse"></span>
                نشط الآن
              </div>
            </div>
            <p className="yam-group-bio">مجتمع يهتم بالابتكار وريادة الأعمال 💡</p>
            <div className="yam-group-stats-row">
              <span className="yam-stat-item">👥 عضو 1.2K</span>
              <span className="yam-stat-item">📅 تم الإنشاء 2026</span>
            </div>
          </div>
        </div>

        <div className="yam-quick-actions">
          <button className="yam-action-btn">
            <span style={{color: '#8b5cf6'}}>✏️</span> تعديل المعلومات
          </button>
          <button className="yam-action-btn">
            <span style={{color: '#8b5cf6'}}>🖼️</span> تغيير الصورة
          </button>
          <button className="yam-action-btn">
            <span style={{color: '#8b5cf6'}}>🔑</span> تغيير الغلاف
          </button>
        </div>
      </section>

      {/* رابط المجموعة */}
      <section className="yam-settings-section">
        <div className="yam-section-title">
          <h3>🔗 رابط المجموعة</h3>
        </div>
        <div className="yam-link-qr-row">
          <div className="yam-link-display">
            https://yamshat.com/g/future-leaders
          </div>
          <div className="yam-qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yamshat.com/g/future-leaders" alt="QR Code" />
          </div>
        </div>
        <div className="yam-link-actions">
          <button className="yam-link-btn primary">📋 نسخ الرابط</button>
          <button className="yam-link-btn secondary">🔗 مشاركة</button>
          <button className="yam-link-btn secondary">🔄 إنشاء رابط جديد</button>
        </div>
      </section>

      <div className="yam-settings-grid">
        {/* إدارة الأعضاء */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>👥 إدارة الأعضاء</h3>
            <button style={{background: '#6d28d9', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '12px'}}>+ إضافة عضو</button>
          </div>
          <div style={{position: 'relative', marginBottom: '15px'}}>
            <input type="text" placeholder="ابحث عن مستخدم..." style={{width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 15px', color: '#fff'}} />
          </div>
          <div className="yam-members-list">
            {members.map(member => (
              <div key={member.id} className="yam-member-item">
                <div className="yam-member-info">
                  <div className="yam-member-avatar">
                    <img src={member.avatar} alt={member.name} />
                    <span className="yam-member-online"></span>
                  </div>
                  <div className="yam-member-name">
                    <h4>{member.name}</h4>
                    <p>{member.username}</p>
                  </div>
                </div>
                <div className="yam-member-actions">
                  {member.role === 'admin' && <span className="yam-badge admin">مشرف</span>}
                  {member.role === 'mod' && <span className="yam-badge admin" style={{borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.1)'}}>ترقية</span>}
                  {member.role === 'member' && <span className="yam-badge danger">إزالة</span>}
                  <span style={{color: '#64748b', cursor: 'pointer', padding: '0 5px'}}>⋮</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* الصلاحيات */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>🛡️ الصلاحيات</h3>
          </div>
          <div className="yam-permissions-list">
            {[
              { label: 'السماح بالنشر', key: 'canPost' },
              { label: 'السماح بالتعليقات', key: 'canComment' },
              { label: 'السماح برفع الملفات', key: 'canUpload' },
              { label: 'السماح بالبث المباشر', key: 'canLive' },
              { label: 'الموافقة المسبقة على المنشورات', key: 'requireApproval' },
              { label: 'منع الروابط الخارجية', key: 'blockExternalLinks' }
            ].map(item => (
              <div key={item.key} className="yam-permission-item" onClick={() => togglePermission(item.key)}>
                <span className="yam-permission-label">{item.label}</span>
                <div className={`yam-checkbox ${permissions[item.key] ? 'checked' : ''}`}>
                  {permissions[item.key] && <span style={{fontSize: '12px'}}>✔️</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="yam-settings-grid">
        {/* الخصوصية */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>🔒 الخصوصية</h3>
          </div>
          <div className="yam-privacy-options">
            {[
              { id: 'public', label: 'عامة' },
              { id: 'private', label: 'خاصة' },
              { id: 'invite', label: 'بالدعوة فقط' }
            ].map(opt => (
              <div key={opt.id} className="yam-privacy-item" onClick={() => setPrivacy(opt.id)}>
                <span className="yam-permission-label">{opt.label}</span>
                <div className={`yam-radio ${privacy === opt.id ? 'selected' : ''}`}>
                  {privacy === opt.id && <div className="yam-radio-inner"></div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* الإحصائيات */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>📊 الإحصائيات</h3>
          </div>
          <div className="yam-stats-grid">
            <div className="yam-stat-card">
              <span className="yam-stat-val">1,234</span>
              <span className="yam-stat-label">👥 الأعضاء</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">4,821</span>
              <span className="yam-stat-label">📝 المنشورات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">15,230</span>
              <span className="yam-stat-label">💬 التعليقات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">85%</span>
              <span className="yam-stat-label">🔥 النشاط اليومي</span>
            </div>
          </div>
        </section>
      </div>

      {/* إدارة متقدمة */}
      <section className="yam-settings-section">
        <div className="yam-section-title">
          <h3>⚙️ إدارة متقدمة</h3>
        </div>
        <div className="yam-advanced-actions">
          <button className="yam-adv-btn">
            <span>نقل الملكية</span>
            <span>👤</span>
          </button>
          <button className="yam-adv-btn">
            <span>أرشفة المجموعة</span>
            <span>📦</span>
          </button>
          <button className="yam-adv-btn delete">
            <span>حذف المجموعة</span>
            <span>🗑️</span>
          </button>
        </div>
      </section>

      <div style={{height: '40px'}}></div>
    </div>
  );
};

export default GroupSettings;
