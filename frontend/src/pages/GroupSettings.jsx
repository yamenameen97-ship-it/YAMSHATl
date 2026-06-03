import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import '../styles/group-settings.css';

const GroupSettings = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { pushToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [permissions, setPermissions] = useState({
    canPost: true,
    canComment: true,
    canUpload: true,
    canLive: true,
    requireApproval: false,
    blockExternalLinks: false
  });

  const [members, setMembers] = useState([
    { id: 1, name: 'أحمد علي', username: '@ahmed.ali', role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed' },
    { id: 2, name: 'محمد خالد', username: '@mohamed.k', role: 'mod', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed' },
    { id: 3, name: 'سارة محمد', username: '@sarah.m', role: 'member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 4, name: 'علي إبراهيم', username: '@ali.ibrahim', role: 'member', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali' }
  ]);

  const [groupInfo, setGroupInfo] = useState({
    name: 'رواد المستقبل',
    description: 'مجتمع يهتم بالابتكار وريادة الأعمال 💡',
    membersCount: 1200,
    createdAt: '2026'
  });

  const togglePermission = useCallback((key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSavePermissions = useCallback(async () => {
    setSaving(true);
    try {
      // محاكاة طلب API
      await new Promise(resolve => setTimeout(resolve, 1000));
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حفظ الصلاحيات بنجاح' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل حفظ الصلاحيات' });
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  const handleSavePrivacy = useCallback(async () => {
    setSaving(true);
    try {
      // محاكاة طلب API
      await new Promise(resolve => setTimeout(resolve, 1000));
      pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث إعدادات الخصوصية' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث الخصوصية' });
    } finally {
      setSaving(false);
    }
  }, [pushToast]);

  const handleEditMember = useCallback((memberId, action) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (action === 'remove') {
      if (window.confirm(`هل تريد إزالة ${member.name} من المجموعة؟`)) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        pushToast?.({ type: 'success', title: 'تم', description: `تم إزالة ${member.name}` });
      }
    } else if (action === 'promote') {
      const newRole = member.role === 'member' ? 'mod' : 'admin';
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      pushToast?.({ type: 'success', title: 'تم', description: `تم ترقية ${member.name}` });
    } else if (action === 'demote') {
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: 'member' } : m
      ));
      pushToast?.({ type: 'success', title: 'تم', description: `تم خفض رتبة ${member.name}` });
    }
  }, [members, pushToast]);

  const handleCopyLink = useCallback(() => {
    const link = `https://yamshat.com/g/future-leaders`;
    navigator.clipboard.writeText(link);
    pushToast?.({ type: 'success', title: 'تم', description: 'تم نسخ الرابط' });
  }, [pushToast]);

  const handleShareLink = useCallback(() => {
    const link = `https://yamshat.com/g/future-leaders`;
    if (navigator.share) {
      navigator.share({
        title: 'رواد المستقبل',
        text: 'انضم إلى مجموعتنا',
        url: link
      });
    } else {
      pushToast?.({ type: 'info', title: 'مشاركة', description: 'استخدم نسخ الرابط للمشاركة' });
    }
  }, [pushToast]);

  const handleEditInfo = useCallback(() => {
    pushToast?.({ type: 'info', title: 'تحت التطوير', description: 'سيتم إضافة محرر المعلومات قريباً' });
  }, [pushToast]);

  const handleChangeImage = useCallback(() => {
    pushToast?.({ type: 'info', title: 'تحت التطوير', description: 'سيتم إضافة تغيير الصورة قريباً' });
  }, [pushToast]);

  const handleDeleteGroup = useCallback(() => {
    if (window.confirm('هل أنت متأكد من حذف المجموعة؟ لا يمكن التراجع عن هذا الإجراء')) {
      if (window.confirm('هذا الإجراء نهائي. هل تريد المتابعة؟')) {
        setSaving(true);
        setTimeout(() => {
          pushToast?.({ type: 'success', title: 'تم', description: 'تم حذف المجموعة' });
          navigate('/groups');
        }, 1000);
      }
    }
  }, [navigate, pushToast]);

  const handleArchiveGroup = useCallback(() => {
    if (window.confirm('هل تريد أرشفة المجموعة؟')) {
      setSaving(true);
      setTimeout(() => {
        pushToast?.({ type: 'success', title: 'تم', description: 'تم أرشفة المجموعة' });
      }, 1000);
    }
  }, [pushToast]);

  return (
    <div className="yam-group-settings-page">
      {/* الهيدر */}
      <header className="yam-settings-header">
        <button className="yam-back-btn" onClick={() => navigate(-1)}>
          <span style={{ fontSize: '20px' }}>❮</span>
        </button>
        <h1>إعدادات المجموعة</h1>
        <button className="yam-more-options-btn" onClick={() => pushToast?.({ type: 'info', title: 'المزيد', description: 'خيارات إضافية قريباً' })}>
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
              <h2>{groupInfo.name} <span style={{ color: '#8b5cf6', fontSize: '16px' }}>✔️</span></h2>
              <div className="yam-active-now">
                <span className="yam-active-dot-pulse"></span>
                نشط الآن
              </div>
            </div>
            <p className="yam-group-bio">{groupInfo.description}</p>
            <div className="yam-group-stats-row">
              <span className="yam-stat-item">👥 عضو {groupInfo.membersCount}</span>
              <span className="yam-stat-item">📅 تم الإنشاء {groupInfo.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="yam-quick-actions">
          <button className="yam-action-btn" onClick={handleEditInfo}>
            <span style={{color: '#8b5cf6'}}>✏️</span> تعديل المعلومات
          </button>
          <button className="yam-action-btn" onClick={handleChangeImage}>
            <span style={{color: '#8b5cf6'}}>🖼️</span> تغيير الصورة
          </button>
          <button className="yam-action-btn" onClick={handleChangeImage}>
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
          <button className="yam-link-btn primary" onClick={handleCopyLink}>📋 نسخ الرابط</button>
          <button className="yam-link-btn secondary" onClick={handleShareLink}>🔗 مشاركة</button>
          <button className="yam-link-btn secondary" onClick={() => pushToast?.({ type: 'info', title: 'إنشاء رابط', description: 'سيتم إنشاء رابط جديد' })}>🔄 إنشاء رابط جديد</button>
        </div>
      </section>

      <div className="yam-settings-grid">
        {/* إدارة الأعضاء */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>👥 إدارة الأعضاء</h3>
            <button style={{background: '#6d28d9', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer'}} onClick={() => pushToast?.({ type: 'info', title: 'إضافة عضو', description: 'سيتم إضافة عضو جديد' })}>+ إضافة عضو</button>
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
                  {member.role === 'mod' && (
                    <>
                      <span className="yam-badge admin" style={{borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.1)'}}>ترقية</span>
                      <button style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 5px'}} onClick={() => handleEditMember(member.id, 'demote')}>خفض</button>
                    </>
                  )}
                  {member.role === 'member' && (
                    <>
                      <button style={{background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0 5px'}} onClick={() => handleEditMember(member.id, 'promote')}>ترقية</button>
                      <button style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 5px'}} onClick={() => handleEditMember(member.id, 'remove')}>إزالة</button>
                    </>
                  )}
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
          <button style={{width: '100%', marginTop: '15px', padding: '10px', background: '#6d28d9', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer'}} onClick={handleSavePermissions} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
          </button>
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
          <button style={{width: '100%', marginTop: '15px', padding: '10px', background: '#6d28d9', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer'}} onClick={handleSavePrivacy} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ الخصوصية'}
          </button>
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
          <button className="yam-adv-btn" onClick={() => pushToast?.({ type: 'info', title: 'نقل الملكية', description: 'سيتم نقل الملكية إلى عضو آخر' })}>
            <span>نقل الملكية</span>
            <span>👤</span>
          </button>
          <button className="yam-adv-btn" onClick={handleArchiveGroup}>
            <span>أرشفة المجموعة</span>
            <span>📦</span>
          </button>
          <button className="yam-adv-btn delete" onClick={handleDeleteGroup}>
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
