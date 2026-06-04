import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getGroupDetails,
  getGroupMembers,
  updateGroup,
  updateMemberRole,
  removeMember,
  deleteGroup as deleteGroupApi,
  updateGroupSettings,
  generateGroupInvite,
} from '../api/groups.js';
import '../styles/group-settings.css';

const GroupSettings = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(true);
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
  const [searchMember, setSearchMember] = useState('');

  const [members, setMembers] = useState([]);
  const [groupInfo, setGroupInfo] = useState({
    name: 'المجموعة',
    description: '',
    membersCount: 0,
    createdAt: '',
    image_url: '',
    invite_link: ''
  });

  // جلب بيانات المجموعة + الأعضاء من الـ backend
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, membersRes] = await Promise.allSettled([
          getGroupDetails(groupId),
          getGroupMembers(groupId)
        ]);

        if (!cancelled && detailsRes.status === 'fulfilled') {
          const data = detailsRes.value.data || detailsRes.value || {};
          setGroupInfo({
            name: data.name || data.title || 'المجموعة',
            description: data.description || data.bio || '',
            membersCount: data.members_count || data.members?.length || 0,
            createdAt: data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear(),
            image_url: data.image_url || data.icon || '',
            invite_link: data.invite_link || `${window.location.origin}/g/${groupId}`,
            privacy: data.privacy || 'public'
          });
          if (data.privacy) setPrivacy(data.privacy);
        }

        if (!cancelled && membersRes.status === 'fulfilled') {
          const list = Array.isArray(membersRes.value.data)
            ? membersRes.value.data
            : (membersRes.value.data?.items || membersRes.value || []);
          const mapped = list.map((m, idx) => ({
            id: m.id || m.user_id || idx,
            name: m.display_name || m.name || m.username,
            username: m.username ? `@${m.username}` : '',
            role: m.role || 'member',
            avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username || idx}`
          }));
          setMembers(mapped);
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
        pushToast?.({ type: 'error', title: 'خطأ', description: 'تعذر تحميل بيانات المجموعة' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [groupId, pushToast]);

  const togglePermission = useCallback((key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSavePermissions = useCallback(async () => {
    setSaving(true);
    try {
      await updateGroupSettings(groupId, { permissions });
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حفظ الصلاحيات بنجاح' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل حفظ الصلاحيات' });
    } finally {
      setSaving(false);
    }
  }, [groupId, permissions, pushToast]);

  const handleSavePrivacy = useCallback(async () => {
    setSaving(true);
    try {
      await updateGroup(groupId, { privacy });
      pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث إعدادات الخصوصية' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث الخصوصية' });
    } finally {
      setSaving(false);
    }
  }, [groupId, privacy, pushToast]);

  const handleEditMember = useCallback(async (memberId, action) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const usernameClean = (member.username || '').replace(/^@/, '');

    if (action === 'remove') {
      if (!window.confirm(`هل تريد إزالة ${member.name} من المجموعة؟`)) return;
      try {
        await removeMember(groupId, usernameClean);
        setMembers(prev => prev.filter(m => m.id !== memberId));
        pushToast?.({ type: 'success', title: 'تم', description: `تم إزالة ${member.name}` });
      } catch (e) {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل إزالة العضو' });
      }
    } else if (action === 'promote') {
      const newRole = member.role === 'member' ? 'mod' : 'admin';
      try {
        await updateMemberRole(groupId, usernameClean, newRole);
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        pushToast?.({ type: 'success', title: 'تم', description: `تم ترقية ${member.name}` });
      } catch (e) {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل ترقية العضو' });
      }
    } else if (action === 'demote') {
      try {
        await updateMemberRole(groupId, usernameClean, 'member');
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: 'member' } : m));
        pushToast?.({ type: 'success', title: 'تم', description: `تم خفض رتبة ${member.name}` });
      } catch (e) {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل العملية' });
      }
    }
  }, [members, groupId, pushToast]);

  const handleCopyLink = useCallback(() => {
    const link = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
    navigator.clipboard.writeText(link);
    pushToast?.({ type: 'success', title: 'تم', description: 'تم نسخ الرابط' });
  }, [groupInfo.invite_link, groupId, pushToast]);

  const handleShareLink = useCallback(() => {
    const link = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
    if (navigator.share) {
      navigator.share({
        title: groupInfo.name,
        text: 'انضم إلى مجموعتنا',
        url: link
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(link);
      pushToast?.({ type: 'info', title: 'تم النسخ', description: 'تم نسخ الرابط للمشاركة' });
    }
  }, [groupInfo, groupId, pushToast]);

  const handleNewInvite = useCallback(async () => {
    try {
      const res = await generateGroupInvite(groupId);
      const link = res.data?.link || res.data?.invite_link;
      if (link) {
        setGroupInfo(prev => ({ ...prev, invite_link: link }));
        pushToast?.({ type: 'success', title: 'تم', description: 'تم إنشاء رابط جديد' });
      }
    } catch (e) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل إنشاء الرابط' });
    }
  }, [groupId, pushToast]);

  const handleEditInfo = useCallback(async () => {
    const newName = window.prompt('اسم المجموعة الجديد:', groupInfo.name);
    if (!newName || newName === groupInfo.name) return;
    const newDesc = window.prompt('الوصف الجديد:', groupInfo.description);

    try {
      await updateGroup(groupId, { name: newName, description: newDesc });
      setGroupInfo(prev => ({ ...prev, name: newName, description: newDesc ?? prev.description }));
      pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث المعلومات' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث المعلومات' });
    }
  }, [groupId, groupInfo, pushToast]);

  const handleChangeImage = useCallback(() => {
    const url = window.prompt('أدخل رابط الصورة الجديدة:', groupInfo.image_url);
    if (!url) return;
    updateGroup(groupId, { image_url: url })
      .then(() => {
        setGroupInfo(prev => ({ ...prev, image_url: url }));
        pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث الصورة' });
      })
      .catch(() => pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث الصورة' }));
  }, [groupId, groupInfo.image_url, pushToast]);

  const handleDeleteGroup = useCallback(async () => {
    if (!window.confirm('هل أنت متأكد من حذف المجموعة؟ لا يمكن التراجع عن هذا الإجراء')) return;
    if (!window.confirm('هذا الإجراء نهائي. هل تريد المتابعة؟')) return;
    setSaving(true);
    try {
      await deleteGroupApi(groupId);
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حذف المجموعة' });
      navigate('/groups');
    } catch (e) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل حذف المجموعة' });
    } finally {
      setSaving(false);
    }
  }, [groupId, navigate, pushToast]);

  const handleArchiveGroup = useCallback(async () => {
    if (!window.confirm('هل تريد أرشفة المجموعة؟')) return;
    setSaving(true);
    try {
      await updateGroup(groupId, { archived: true });
      pushToast?.({ type: 'success', title: 'تم', description: 'تم أرشفة المجموعة' });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل أرشفة المجموعة' });
    } finally {
      setSaving(false);
    }
  }, [groupId, pushToast]);

  const inviteLink = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`;

  const filteredMembers = searchMember
    ? members.filter(m =>
        (m.name || '').toLowerCase().includes(searchMember.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(searchMember.toLowerCase())
      )
    : members;

  if (loading) {
    return (
      <div className="yam-group-settings-page" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh'}}>
        <div style={{color: '#94a3b8'}}>جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  return (
    <div className="yam-group-settings-page">
      {/* الهيدر */}
      <header className="yam-settings-header">
        <button className="yam-back-btn" onClick={() => navigate(`/groups/${groupId}/chat`)}>
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
            {groupInfo.image_url && groupInfo.image_url.startsWith('http') ? (
              <img src={groupInfo.image_url} alt={groupInfo.name} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              <span>🚀</span>
            )}
          </div>
          <div className="yam-group-details">
            <div className="yam-group-name-row">
              <h2>{groupInfo.name} <span style={{ color: '#8b5cf6', fontSize: '16px' }}>✔️</span></h2>
              <div className="yam-active-now">
                <span className="yam-active-dot-pulse"></span>
                نشط الآن
              </div>
            </div>
            {groupInfo.description && <p className="yam-group-bio">{groupInfo.description}</p>}
            <div className="yam-group-stats-row">
              <span className="yam-stat-item">👥 {groupInfo.membersCount} عضو</span>
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
            {inviteLink}
          </div>
          <div className="yam-qr-box">
            <img src={qrSrc} alt="QR Code" />
          </div>
        </div>
        <div className="yam-link-actions">
          <button className="yam-link-btn primary" onClick={handleCopyLink}>📋 نسخ الرابط</button>
          <button className="yam-link-btn secondary" onClick={handleShareLink}>🔗 مشاركة</button>
          <button className="yam-link-btn secondary" onClick={handleNewInvite}>🔄 إنشاء رابط جديد</button>
        </div>
      </section>

      <div className="yam-settings-grid">
        {/* إدارة الأعضاء */}
        <section className="yam-settings-section">
          <div className="yam-section-title">
            <h3>👥 إدارة الأعضاء</h3>
            <button style={{background: '#6d28d9', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer'}} onClick={() => pushToast?.({ type: 'info', title: 'إضافة عضو', description: 'استخدم رابط الدعوة لإضافة أعضاء جدد' })}>+ إضافة عضو</button>
          </div>
          <div style={{position: 'relative', marginBottom: '15px'}}>
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              style={{width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 15px', color: '#fff'}}
            />
          </div>
          <div className="yam-members-list">
            {filteredMembers.length === 0 ? (
              <div style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>لا يوجد أعضاء حالياً</div>
            ) : filteredMembers.map(member => (
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
                      <span className="yam-badge admin" style={{borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.1)'}}>مراقب</span>
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
              <span className="yam-stat-val">{groupInfo.membersCount}</span>
              <span className="yam-stat-label">👥 الأعضاء</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">—</span>
              <span className="yam-stat-label">📝 المنشورات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">—</span>
              <span className="yam-stat-label">💬 التعليقات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">—</span>
              <span className="yam-stat-label">🔥 النشاط</span>
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
