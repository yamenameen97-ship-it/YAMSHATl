import { useEffect, useMemo, useState, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  createGroup,
  getGroupAuditLogs,
  getGroupDetails,
  getGroups,
  inviteGroupMember,
  joinGroup,
  moderateGroupMember,
  updateGroupMemberRole,
} from '../api/groups.js';
import { getCurrentUsername } from '../utils/auth.js';

const ROLE_META = {
  owner: { label: 'المالك', color: '#f59e0b' },
  admin: { label: 'مدير', color: '#ef4444' },
  moderator: { label: 'مشرف', color: '#8b5cf6' },
  member: { label: 'عضو', color: '#22c55e' },
};

function roleMeta(role) {
  return ROLE_META[String(role || 'member').toLowerCase()] || ROLE_META.member;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-EG');
}

export default function Groups() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleDraft, setRoleDraft] = useState({ username: '', role: 'member' });
  const [inviteUsername, setInviteUsername] = useState('');
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  const loadGroups = useCallback(async ({ preferredGroupId = '' } = {}) => {
    setLoadingGroups(true);
    try {
      const { data } = await getGroups({ forceRefresh: true });
      const nextGroups = Array.isArray(data) ? data : [];
      setGroups(nextGroups);

      const fallbackId = preferredGroupId || selectedGroupId || nextGroups[0]?.id || '';
      if (fallbackId) {
        setSelectedGroupId(String(fallbackId));
      } else {
        setSelectedGroupId('');
        setSelectedGroup(null);
        setAuditLogs([]);
      }
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل المجموعات', description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingGroups(false);
    }
  }, [pushToast, selectedGroupId]);

  const loadGroupDetails = useCallback(async (groupId) => {
    if (!groupId) return;
    setLoadingDetails(true);
    try {
      const [{ data: details }, auditResponse] = await Promise.allSettled([
        getGroupDetails(groupId, { forceRefresh: true }),
        getGroupAuditLogs(groupId, { forceRefresh: true }),
      ]);

      if (details.status !== 'fulfilled') {
        throw details.reason;
      }

      const groupPayload = details.value?.data || null;
      setSelectedGroup(groupPayload);
      setGroups((prev) => prev.map((item) => String(item.id) === String(groupId) ? { ...item, ...groupPayload } : item));

      if (auditResponse.status === 'fulfilled') {
        const logs = Array.isArray(auditResponse.value?.data) ? auditResponse.value.data : [];
        setAuditLogs(logs);
      } else {
        setAuditLogs(Array.isArray(groupPayload?.audit_logs_preview) ? groupPayload.audit_logs_preview : []);
      }
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل تفاصيل المجموعة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingDetails(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [loadGroupDetails, selectedGroupId]);

  const members = useMemo(() => Array.isArray(selectedGroup?.members) ? selectedGroup.members : [], [selectedGroup]);
  const myMembership = useMemo(() => members.find((member) => member.username === currentUsername) || null, [currentUsername, members]);
  const myRole = String(myMembership?.role || '').toLowerCase();
  const canManageRoles = myRole === 'owner' || myRole === 'admin';
  const canModerate = canManageRoles || myRole === 'moderator';
  const isMember = Boolean(myMembership);
  const inviteLink = selectedGroup ? `${window.location.origin}/groups?group=${selectedGroup.id}` : '';

  const analytics = useMemo(() => {
    const totalMembers = members.length;
    const admins = members.filter((member) => ['owner', 'admin'].includes(String(member.role || '').toLowerCase())).length;
    const moderators = members.filter((member) => String(member.role || '').toLowerCase() === 'moderator').length;
    const muted = members.filter((member) => Boolean(member.is_muted)).length;
    return { totalMembers, admins, moderators, muted };
  }, [members]);

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) return;
    setSavingGroup(true);
    try {
      const { data } = await createGroup({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });
      const nextId = String(data?.id || '');
      pushToast({ type: 'success', title: 'تم إنشاء المجموعة' });
      setCreateForm({ name: '', description: '' });
      setShowCreateModal(false);
      await loadGroups({ preferredGroupId: nextId });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إنشاء المجموعة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!selectedGroup?.id) return;
    setBusyAction('join');
    try {
      await joinGroup(selectedGroup.id);
      pushToast({ type: 'success', title: 'تم الانضمام إلى المجموعة' });
      await loadGroups({ preferredGroupId: selectedGroup.id });
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر الانضمام', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleInvite = async () => {
    if (!selectedGroup?.id || !inviteUsername.trim()) return;
    setBusyAction('invite');
    try {
      await inviteGroupMember(selectedGroup.id, inviteUsername.trim());
      pushToast({ type: 'success', title: 'تم إرسال الدعوة' });
      setInviteUsername('');
      setShowInviteModal(false);
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال الدعوة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedGroup?.id || !roleDraft.username || !roleDraft.role) return;
    setBusyAction(`role:${roleDraft.username}`);
    try {
      await updateGroupMemberRole(selectedGroup.id, roleDraft.username, roleDraft.role);
      pushToast({ type: 'success', title: 'تم تحديث الصلاحية' });
      setShowRoleModal(false);
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث الصلاحية', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction('');
    }
  };

  const handleModeration = async (username, action) => {
    if (!selectedGroup?.id || !username) return;
    setBusyAction(`${action}:${username}`);
    try {
      await moderateGroupMember(selectedGroup.id, { username, action });
      pushToast({ type: 'success', title: action === 'kick' ? 'تم إخراج العضو' : action === 'mute' ? 'تم كتم العضو' : 'تم إلغاء الكتم' });
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تنفيذ الإجراء', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction('');
    }
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ width: 320, borderLeft: '1px solid var(--line)', padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0 }}>المجموعات</h3>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>ربط مباشر بالـ API الحقيقي</div>
            </div>
            <Button size="small" onClick={() => setShowCreateModal(true)}>➕</Button>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {loadingGroups ? <Card style={{ padding: 16 }}>جارٍ تحميل المجموعات...</Card> : null}
            {!loadingGroups && !groups.length ? <EmptyState title="لا توجد مجموعات بعد" description="ابدأ بإنشاء أول مجموعة" /> : null}
            {groups.map((group) => (
              <Card
                key={group.id}
                onClick={() => setSelectedGroupId(String(group.id))}
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  background: selectedGroupId === String(group.id) ? 'rgba(139, 92, 246, 0.12)' : '',
                  border: selectedGroupId === String(group.id) ? '1px solid var(--primary)' : '1px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{group.name}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{group.members_count || 0} عضو</div>
                  </div>
                  {Array.isArray(group.members) && group.members.some((member) => member.username === currentUsername) ? (
                    <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.14)', color: '#22c55e', alignSelf: 'start' }}>منضم</span>
                  ) : null}
                </div>
                <div className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>{group.description || 'بدون وصف'}</div>
              </Card>
            ))}
          </div>
        </div>

        {selectedGroup ? (
          <div style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: '0 0 8px 0' }}>{selectedGroup.name}</h1>
                <p className="muted" style={{ margin: 0, maxWidth: 760 }}>{selectedGroup.description || 'وصف المجموعة غير متوفر حالياً.'}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <span className="muted">المالك: <strong>{selectedGroup.owner_username}</strong></span>
                  <span className="muted">الإنشاء: <strong>{formatDate(selectedGroup.created_at)}</strong></span>
                  <span className="muted">الأعضاء: <strong>{analytics.totalMembers}</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {!isMember ? <Button onClick={handleJoinGroup} loading={busyAction === 'join'}>انضمام</Button> : null}
                {isMember ? <Button variant="secondary" onClick={() => setShowInviteModal(true)}>➕ دعوة</Button> : null}
                <Button variant="secondary" onClick={() => setShowAnalytics(true)}>📊 التحليلات</Button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto' }}>
              {[
                { id: 'members', label: 'الأعضاء' },
                { id: 'moderation', label: 'الرقابة' },
                { id: 'settings', label: 'الإعدادات' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'white' : '#888',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingDetails ? <Card style={{ padding: 16, marginBottom: 20 }}>جارٍ تحميل تفاصيل المجموعة...</Card> : null}

            {activeTab === 'members' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {members.map((member) => {
                  const meta = roleMeta(member.role);
                  const isCurrentMember = member.username === currentUsername;
                  const actionBusy = busyAction.endsWith(`:${member.username}`);
                  return (
                    <Card key={member.username} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                          {String(member.username || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{member.username} {isCurrentMember ? <span className="muted">(أنت)</span> : null}</div>
                          <div className="muted" style={{ fontSize: 12 }}>انضم: {formatDate(member.joined_at)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: `${meta.color}22`, color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                        {member.is_muted ? <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.16)', color: '#ef4444', fontWeight: 700 }}>مكتوم</span> : null}
                        {canManageRoles && !isCurrentMember ? (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => {
                              setRoleDraft({ username: member.username, role: String(member.role || 'member').toLowerCase() });
                              setShowRoleModal(true);
                            }}
                            loading={busyAction === `role:${member.username}`}
                          >
                            تغيير الصلاحية
                          </Button>
                        ) : null}
                        {canModerate && !isCurrentMember ? (
                          <>
                            <Button variant="secondary" size="small" onClick={() => handleModeration(member.username, member.is_muted ? 'unmute' : 'mute')} loading={actionBusy}>
                              {member.is_muted ? 'إلغاء الكتم' : 'كتم'}
                            </Button>
                            <Button variant="secondary" size="small" onClick={() => handleModeration(member.username, 'kick')} loading={busyAction === `kick:${member.username}`}>
                              إخراج
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {activeTab === 'moderation' ? (
              <div style={{ display: 'grid', gap: 20 }}>
                <Card style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>سجل التدقيق</h4>
                  {!auditLogs.length ? <div className="muted">لا توجد أحداث رقابية متاحة لهذا الحساب.</div> : null}
                  <div style={{ display: 'grid', gap: 12, marginTop: auditLogs.length ? 16 : 0 }}>
                    {auditLogs.slice().reverse().map((log, index) => (
                      <div key={`${log.timestamp || index}-${log.action || index}`} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <strong>{log.actor || 'system'} · {log.action || 'event'}</strong>
                          <span className="muted" style={{ fontSize: 12 }}>{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="muted" style={{ marginTop: 6 }}>{log.description || 'لا يوجد وصف'}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>قواعد المجموعة</h4>
                  <div style={{ display: 'grid', gap: 10, marginTop: 15 }}>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>1. الاحترام المتبادل بين الأعضاء</div>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>2. يمنع نشر المحتوى المسيء أو المزعج</div>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>3. أدوات الرقابة مربوطة الآن بالـ backend الحقيقي</div>
                  </div>
                </Card>
              </div>
            ) : null}

            {activeTab === 'settings' ? (
              <div style={{ display: 'grid', gap: 20 }}>
                <Card style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>إعدادات الوصول</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div className="muted">الخصوصية: <strong>{selectedGroup.settings?.is_private ? 'خاصة' : 'عامة'}</strong></div>
                    <div className="muted">دعوات الأعضاء: <strong>{selectedGroup.settings?.allow_member_invites ? 'مفعلة' : 'مقفلة'}</strong></div>
                    <div className="muted">Slow mode: <strong>{selectedGroup.settings?.slow_mode || 0} ثانية</strong></div>
                  </div>
                </Card>
                <Card style={{ padding: 20 }}>
                  <h4 style={{ marginTop: 0 }}>رابط الانضمام</h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input readOnly value={inviteLink} style={{ flex: 1, minWidth: 240, background: '#222', border: '1px solid #444', padding: 12, borderRadius: 12, color: 'white' }} />
                    <Button variant="secondary" onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        pushToast({ type: 'success', title: 'تم نسخ الرابط' });
                      } catch (error) {
                        pushToast({ type: 'error', title: 'تعذر نسخ الرابط', description: error?.message });
                      }
                    }}>نسخ</Button>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="اختر مجموعة لعرض تفاصيلها" />
          </div>
        )}
      </div>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="دعوة عضو للمجموعة">
        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div className="muted">أدخل اسم المستخدم لإرسال دعوة فعلية عبر الـ API.</div>
          <input
            value={inviteUsername}
            onChange={(event) => setInviteUsername(event.target.value)}
            placeholder="اسم المستخدم"
            style={{ width: '100%', background: '#222', border: '1px solid #444', padding: 12, borderRadius: 12, color: 'white' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>إلغاء</Button>
            <Button onClick={handleInvite} loading={busyAction === 'invite'} disabled={!inviteUsername.trim()}>إرسال الدعوة</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء مجموعة جديدة">
        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>اسم المجموعة</span>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="اكتب اسم المجموعة"
              style={{ width: '100%', borderRadius: 12, padding: 12 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>وصف المجموعة</span>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="اكتب وصف واضح للمجموعة"
              rows={4}
              style={{ width: '100%', borderRadius: 12, padding: 12 }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreateGroup} loading={savingGroup} disabled={!createForm.name.trim()}>إنشاء المجموعة</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="تحديث دور العضو">
        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div className="muted">المستخدم: <strong>{roleDraft.username || '—'}</strong></div>
          <select value={roleDraft.role} onChange={(event) => setRoleDraft((prev) => ({ ...prev, role: event.target.value }))} style={{ width: '100%', borderRadius: 12, padding: 12 }}>
            {Object.entries(ROLE_META).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>إلغاء</Button>
            <Button onClick={handleUpdateRole} loading={busyAction === `role:${roleDraft.username}`}>حفظ التغيير</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} title="تحليلات المجموعة">
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 15 }}>
            {[
              ['إجمالي الأعضاء', analytics.totalMembers, 'var(--primary)'],
              ['المديرون', analytics.admins, '#ef4444'],
              ['المشرفون', analytics.moderators, '#8b5cf6'],
              ['المكتومون', analytics.muted, '#f59e0b'],
            ].map(([label, value, color]) => (
              <Card key={label} style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 'bold', color }}>{value}</div>
                <div className="muted">{label}</div>
              </Card>
            ))}
          </div>
          <Card style={{ padding: 16 }}>
            <h4 style={{ marginTop: 0 }}>آخر أحداث المجموعة</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {(auditLogs.length ? auditLogs.slice().reverse() : (selectedGroup?.audit_logs_preview || []).slice().reverse()).slice(0, 6).map((log, index) => (
                <div key={`${log.timestamp || index}-${index}`} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                  <strong>{log.actor || 'system'} · {log.action || 'event'}</strong>
                  <div className="muted" style={{ marginTop: 6 }}>{log.description || 'لا يوجد وصف'}</div>
                </div>
              ))}
              {!auditLogs.length && !(selectedGroup?.audit_logs_preview || []).length ? <div className="muted">لا توجد بيانات تحليلية إضافية بعد.</div> : null}
            </div>
          </Card>
        </div>
      </Modal>
    </MainLayout>
  );
}
