import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import {
  getGroupDetails,
  getGroupMembers,
  updateGroup,
  updateMemberRole,
  removeMember,
  deleteGroup as deleteGroupApi,
  updateGroupSettings,
  generateGroupInvite,
  uploadGroupImage,
  transferOwnership,
  addMember,
  getGroupAnalytics,
} from '../api/groups.js';
import '../styles/group-settings.css';

/**
 * GroupSettings — v2 مُصلحة
 * -----------------------
 * إصلاحات:
 *  - رفع صورة/غلاف فعلي (بدلاً من window.prompt لرابط).
 *  - فصل تغيير الصورة عن تغيير الغلاف (كانا يستدعيان نفس الدالة).
 *  - تفعيل "نقل الملكية" + "إضافة عضو".
 *  - "خفض" يظهر أيضاً للمشرف (admin) لا للمراقب فقط.
 *  - جلب إحصائيات حقيقية (عدد المنشورات/التعليقات/النشاط) من API.
 *  - زر "المزيد ⋮" يفتح قائمة إجراءات (نسخ ID، تجديد رابط، فتح الدردشة).
 */
const GroupSettings = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { pushToast } = useToast();

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const pageRootRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  const [showMore, setShowMore] = useState(false);

  const [members, setMembers] = useState([]);
  const [groupInfo, setGroupInfo] = useState({
    name: 'المجموعة',
    description: '',
    membersCount: 0,
    createdAt: '',
    image_url: '',
    cover_image_url: '',
    invite_link: ''
  });
  const [stats, setStats] = useState({
    posts: '—',
    comments: '—',
    activity: '—',
  });

  useEffect(() => {
    const rootEl = pageRootRef.current;
    const pageContent = rootEl?.closest?.('.page-content');
    if (!pageContent) return undefined;

    pageContent.classList.add('group-settings-page-content-scroll');
    return () => {
      pageContent.classList.remove('group-settings-page-content-scroll');
    };
  }, []);

  // جلب بيانات المجموعة + الأعضاء + الإحصائيات
  useEffect(() => {
    if (!groupId) { setLoading(false); return; }

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [detailsRes, membersRes, analyticsRes] = await Promise.allSettled([
          getGroupDetails(groupId),
          getGroupMembers(groupId),
          getGroupAnalytics(groupId),
        ]);

        if (!cancelled && detailsRes.status === 'fulfilled') {
          const data = detailsRes.value.data?.group || detailsRes.value.data || {};
          setGroupInfo({
            name: data.name || data.title || 'المجموعة',
            description: data.description || data.bio || '',
            membersCount: data.members_count || data.members?.length || 0,
            createdAt: data.created_at ? new Date(data.created_at).getFullYear() : new Date().getFullYear(),
            image_url: data.image_url || data.icon || '',
            cover_image_url: data.cover_image_url || '',
            invite_link: data.invite_link || `${window.location.origin}/g/${groupId}`,
            privacy: data.privacy || 'public',
            posts_count: data.posts_count || 0,
          });
          if (data.privacy) setPrivacy(data.privacy);
          if (data.posts_count !== undefined) {
            setStats((s) => ({ ...s, posts: data.posts_count }));
          }
        }

        if (!cancelled && membersRes.status === 'fulfilled') {
          const list = Array.isArray(membersRes.value.data)
            ? membersRes.value.data
            : (membersRes.value.data?.items || membersRes.value.data?.members || []);
          const mapped = list.map((m, idx) => ({
            id: m.id || m.user_id || idx,
            name: m.display_name || m.user_name || m.name || m.username,
            username: m.username ? `@${m.username}` : (m.user_id ? `@${m.user_id}` : ''),
            role: m.role || 'member',
            avatar: m.user_avatar || m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username || m.user_id || idx}`
          }));
          setMembers(mapped);
        }

        if (!cancelled && analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
          const a = analyticsRes.value.data;
          setStats((s) => ({
            posts: a.posts_count ?? s.posts,
            comments: a.comments_count ?? s.comments,
            activity: a.activity_score ?? s.activity,
          }));
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
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSavePermissions = useCallback(async () => {
    setSaving(true);
    try {
      await updateGroupSettings(groupId, { permissions });
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حفظ الصلاحيات بنجاح' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل حفظ الصلاحيات' });
    } finally {
      setSaving(false);
    }
  }, [groupId, permissions, pushToast]);

  const handleSavePrivacy = useCallback(async () => {
    setSaving(true);
    try {
      await updateGroup(groupId, { privacy, is_public: privacy === 'public' });
      pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث إعدادات الخصوصية' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث الخصوصية' });
    } finally {
      setSaving(false);
    }
  }, [groupId, privacy, pushToast]);

  const handleEditMember = useCallback(async (memberId, action) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    const usernameClean = (member.username || '').replace(/^@/, '');

    if (action === 'remove') {
      if (!window.confirm(`هل تريد إزالة ${member.name} من المجموعة؟`)) return;
      try {
        await removeMember(groupId, usernameClean);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        pushToast?.({ type: 'success', title: 'تم', description: `تم إزالة ${member.name}` });
      } catch {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل إزالة العضو' });
      }
    } else if (action === 'promote') {
      const newRole = member.role === 'member' ? 'moderator' : 'admin';
      try {
        await updateMemberRole(groupId, usernameClean, newRole);
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
        pushToast?.({ type: 'success', title: 'تم', description: `تم ترقية ${member.name} إلى ${newRole === 'admin' ? 'مشرف' : 'مراقب'}` });
      } catch {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل ترقية العضو' });
      }
    } else if (action === 'demote') {
      // مشرف → مراقب، مراقب → عضو
      const newRole = member.role === 'admin' ? 'moderator' : 'member';
      try {
        await updateMemberRole(groupId, usernameClean, newRole);
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
        pushToast?.({ type: 'success', title: 'تم', description: `تم خفض رتبة ${member.name}` });
      } catch {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل العملية' });
      }
    } else if (action === 'transfer') {
      if (!window.confirm(`هل أنت متأكد من نقل ملكية المجموعة إلى ${member.name}؟ ستفقد صلاحيات المالك.`)) return;
      try {
        await transferOwnership(groupId, usernameClean);
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: 'owner' } : m)));
        pushToast?.({ type: 'success', title: 'تم', description: `تم نقل الملكية إلى ${member.name}` });
      } catch {
        pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل نقل الملكية' });
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
      navigator.share({ title: groupInfo.name, text: 'انضم إلى مجموعتنا', url: link }).catch(() => {});
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
        setGroupInfo((prev) => ({ ...prev, invite_link: link }));
        pushToast?.({ type: 'success', title: 'تم', description: 'تم إنشاء رابط جديد' });
      }
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل إنشاء الرابط' });
    }
  }, [groupId, pushToast]);

  const handleEditInfo = useCallback(async () => {
    const newName = window.prompt('اسم المجموعة الجديد:', groupInfo.name);
    if (!newName || newName === groupInfo.name) return;
    const newDesc = window.prompt('الوصف الجديد:', groupInfo.description);

    try {
      await updateGroup(groupId, { name: newName, description: newDesc });
      setGroupInfo((prev) => ({ ...prev, name: newName, description: newDesc ?? prev.description }));
      pushToast?.({ type: 'success', title: 'تم', description: 'تم تحديث المعلومات' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل تحديث المعلومات' });
    }
  }, [groupId, groupInfo, pushToast]);

  // رفع صورة فعلي (avatar أو cover)
  const onImageSelected = async (e, kind) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      pushToast?.({ type: 'warning', title: 'الصورة كبيرة', description: 'الحد الأقصى 5 ميجابايت' });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadGroupImage(groupId, file, kind);
      setGroupInfo((prev) => kind === 'cover'
        ? { ...prev, cover_image_url: url }
        : { ...prev, image_url: url });
      pushToast?.({ type: 'success', title: 'تم', description: kind === 'cover' ? 'تم تحديث الغلاف' : 'تم تحديث الصورة' });
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: kind === 'cover' ? 'فشل تحديث الغلاف' : 'فشل تحديث الصورة' });
    } finally {
      setUploading(false);
    }
  };

  const handleChangeAvatar = useCallback(() => avatarInputRef.current?.click(), []);
  const handleChangeCover = useCallback(() => coverInputRef.current?.click(), []);

  const handleAddMember = useCallback(async () => {
    const username = window.prompt('اسم المستخدم لإضافته للمجموعة:');
    if (!username || !username.trim()) return;
    const u = username.trim().replace(/^@/, '');
    try {
      await addMember(groupId, { user_id: u, user_name: u, user_avatar: '' });
      setMembers((prev) => ([
        ...prev,
        {
          id: u,
          name: u,
          username: `@${u}`,
          role: 'member',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u}`,
        },
      ]));
      pushToast?.({ type: 'success', title: 'تم', description: `تم إضافة @${u}` });
    } catch (e) {
      pushToast?.({ type: 'error', title: 'خطأ', description: e?.response?.data?.detail || 'فشل إضافة العضو' });
    }
  }, [groupId, pushToast]);

  const handleDeleteGroup = useCallback(async () => {
    if (!window.confirm('هل أنت متأكد من حذف المجموعة؟ لا يمكن التراجع عن هذا الإجراء')) return;
    if (!window.confirm('هذا الإجراء نهائي. هل تريد المتابعة؟')) return;
    setSaving(true);
    try {
      await deleteGroupApi(groupId);
      pushToast?.({ type: 'success', title: 'تم', description: 'تم حذف المجموعة' });
      navigate('/groups');
    } catch {
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
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل أرشفة المجموعة' });
    } finally {
      setSaving(false);
    }
  }, [groupId, pushToast]);

  // نقل الملكية من قائمة الإجراءات المتقدمة
  const handleTransferOwnershipPrompt = useCallback(async () => {
    const username = window.prompt('اسم المستخدم الجديد للمالك (يجب أن يكون عضواً):');
    if (!username || !username.trim()) return;
    const u = username.trim().replace(/^@/, '');
    if (!window.confirm(`هل أنت متأكد من نقل ملكية المجموعة إلى @${u}؟`)) return;
    try {
      await transferOwnership(groupId, u);
      pushToast?.({ type: 'success', title: 'تم', description: `تم نقل الملكية إلى @${u}` });
      setMembers((prev) => prev.map((m) => ((m.username || '').replace(/^@/, '') === u ? { ...m, role: 'owner' } : m)));
    } catch {
      pushToast?.({ type: 'error', title: 'خطأ', description: 'فشل نقل الملكية' });
    }
  }, [groupId, pushToast]);

  const inviteLink = groupInfo.invite_link || `${window.location.origin}/g/${groupId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}`;

  const filteredMembers = searchMember
    ? members.filter((m) =>
        (m.name || '').toLowerCase().includes(searchMember.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(searchMember.toLowerCase())
      )
    : members;

  if (loading) {
    return (
      <MainLayout>
        <div
          ref={pageRootRef}
          className="yam-group-settings-page"
          dir="rtl"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}
        >
          <div style={{ color: '#94a3b8' }}>جاري تحميل الإعدادات...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
    <div
      ref={pageRootRef}
      className="yam-group-settings-page"
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif" }}
    >
      {/* inputs مخفية لرفع الصورة والغلاف */}
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onImageSelected(e, 'avatar')} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onImageSelected(e, 'cover')} />

      {/* الهيدر */}
      <header className="yam-settings-header">
        <button className="yam-back-btn" onClick={() => navigate(`/groups/${groupId}/chat`)} aria-label="رجوع">
          <span style={{ fontSize: '20px' }}>❮</span>
        </button>
        <h1>إعدادات المجموعة</h1>
        <div style={{ position: 'relative' }}>
          <button className="yam-more-options-btn" onClick={() => setShowMore((v) => !v)} aria-label="المزيد">
            <span style={{ fontSize: '20px' }}>⋮</span>
          </button>
          {showMore && (
            <div
              style={{
                position: 'absolute', insetInlineEnd: 0, top: '110%',
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '8px', minWidth: '180px', zIndex: 30,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}
            >
              <button
                style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '8px 10px', cursor: 'pointer', textAlign: 'right' }}
                onClick={() => { setShowMore(false); navigate(`/groups/${groupId}/chat`); }}
              >💬 فتح الدردشة</button>
              <button
                style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '8px 10px', cursor: 'pointer', textAlign: 'right' }}
                onClick={() => { setShowMore(false); navigator.clipboard.writeText(String(groupId)); pushToast?.({ type: 'success', title: 'تم', description: 'تم نسخ معرّف المجموعة' }); }}
              >🔖 نسخ معرّف المجموعة</button>
              <button
                style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '8px 10px', cursor: 'pointer', textAlign: 'right' }}
                onClick={() => { setShowMore(false); handleNewInvite(); }}
              >🔄 تجديد رابط الدعوة</button>
            </div>
          )}
        </div>
      </header>

      {/* بطاقة المجموعة الرئيسية */}
      <section className="yam-group-info-card">
        {/* غلاف */}
        {groupInfo.cover_image_url && (
          <div
            style={{
              width: '100%', height: '120px', borderRadius: '12px',
              backgroundImage: `url(${groupInfo.cover_image_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              marginBottom: '12px',
            }}
          />
        )}
        <div className="yam-group-info-main">
          <div className="yam-group-avatar-wrap">
            {groupInfo.image_url && String(groupInfo.image_url).startsWith('http') ? (
              <img src={groupInfo.image_url} alt={groupInfo.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
          <button className="yam-action-btn" onClick={handleEditInfo} disabled={uploading}>
            <span style={{ color: '#8b5cf6' }}>✏️</span> تعديل المعلومات
          </button>
          <button className="yam-action-btn" onClick={handleChangeAvatar} disabled={uploading}>
            <span style={{ color: '#8b5cf6' }}>🖼️</span> {uploading ? 'جاري الرفع...' : 'تغيير الصورة'}
          </button>
          <button className="yam-action-btn" onClick={handleChangeCover} disabled={uploading}>
            <span style={{ color: '#8b5cf6' }}>🌅</span> تغيير الغلاف
          </button>
        </div>
      </section>

      {/* رابط المجموعة */}
      <section className="yam-settings-section">
        <div className="yam-section-title">
          <h3>🔗 رابط المجموعة</h3>
        </div>
        <div className="yam-link-qr-row">
          <div className="yam-link-display">{inviteLink}</div>
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
            <button
              style={{ background: '#6d28d9', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer' }}
              onClick={handleAddMember}
            >+ إضافة عضو</button>
          </div>
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              dir="rtl"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 15px', color: '#fff' }}
            />
          </div>
          <div className="yam-members-list">
            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>لا يوجد أعضاء حالياً</div>
            ) : filteredMembers.map((member) => (
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
                  {member.role === 'owner' && <span className="yam-badge admin" style={{ borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>المالك</span>}
                  {member.role === 'admin' && (
                    <>
                      <span className="yam-badge admin">مشرف</span>
                      <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'demote')}>خفض</button>
                    </>
                  )}
                  {(member.role === 'mod' || member.role === 'moderator') && (
                    <>
                      <span className="yam-badge admin" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>مراقب</span>
                      <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'promote')}>ترقية</button>
                      <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'demote')}>خفض</button>
                    </>
                  )}
                  {member.role === 'member' && (
                    <>
                      <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'promote')}>ترقية</button>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'remove')}>إزالة</button>
                    </>
                  )}
                  {member.role !== 'owner' && (
                    <button title="نقل الملكية" style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '0 5px' }} onClick={() => handleEditMember(member.id, 'transfer')}>👑</button>
                  )}
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
            ].map((item) => (
              <div key={item.key} className="yam-permission-item" onClick={() => togglePermission(item.key)}>
                <span className="yam-permission-label">{item.label}</span>
                <div className={`yam-checkbox ${permissions[item.key] ? 'checked' : ''}`}>
                  {permissions[item.key] && <span style={{ fontSize: '12px' }}>✔️</span>}
                </div>
              </div>
            ))}
          </div>
          <button
            style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#6d28d9', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
            onClick={handleSavePermissions}
            disabled={saving}
          >
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
            ].map((opt) => (
              <div key={opt.id} className="yam-privacy-item" onClick={() => setPrivacy(opt.id)}>
                <span className="yam-permission-label">{opt.label}</span>
                <div className={`yam-radio ${privacy === opt.id ? 'selected' : ''}`}>
                  {privacy === opt.id && <div className="yam-radio-inner"></div>}
                </div>
              </div>
            ))}
          </div>
          <button
            style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#6d28d9', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
            onClick={handleSavePrivacy}
            disabled={saving}
          >
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
              <span className="yam-stat-val">{stats.posts}</span>
              <span className="yam-stat-label">📝 المنشورات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">{stats.comments}</span>
              <span className="yam-stat-label">💬 التعليقات</span>
            </div>
            <div className="yam-stat-card">
              <span className="yam-stat-val">{stats.activity}</span>
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
          <button className="yam-adv-btn" onClick={handleTransferOwnershipPrompt}>
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

      <div style={{ height: '40px' }}></div>
    </div>
    </MainLayout>
  );
};

export default GroupSettings;
