import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import {
  createGroup,
  createPinnedGroupMessage,
  getGroupAuditLogs,
  getGroupDetails,
  getGroupInvites,
  getGroupJoinRequests,
  getGroups,
  getPinnedGroupMessages,
  inviteToGroup,
  moderateGroupUser,
  reviewGroupJoinRequest,
  updateGroupMemberPermissions,
  updateGroupMemberRole,
} from '../api/groups.js';

const ROLE_OPTIONS = [
  { id: 'owner', label: 'المالك', color: '#ef4444' },
  { id: 'admin', label: 'أدمن', color: '#f97316' },
  { id: 'moderator', label: 'مشرف', color: '#f59e0b' },
  { id: 'member', label: 'عضو', color: '#22c55e' },
];

const MANAGEABLE_PERMISSIONS = [
  'messages.send',
  'messages.pin',
  'moderation.manage',
  'invites.manage',
  'join_requests.review',
  'roles.manage',
  'permissions.manage',
  'members.manage',
];

function RoleBadge({ role }) {
  const meta = ROLE_OPTIONS.find((item) => item.id === role) || ROLE_OPTIONS[3];
  return (
    <span style={{ padding: '4px 10px', borderRadius: 999, background: `${meta.color}22`, color: meta.color, fontSize: 12, fontWeight: 700 }}>
      {meta.label}
    </span>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', is_private: false, allow_member_invites: true });
  const [inviteUsername, setInviteUsername] = useState('');
  const [pinnedDraft, setPinnedDraft] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    const { data } = await getGroups();
    const list = Array.isArray(data) ? data : [];
    setGroups(list);
    const firstId = selectedGroupId || list[0]?.id || '';
    setSelectedGroupId(firstId);
    if (firstId) {
      const matched = list.find((item) => item.id === firstId);
      if (matched) setSelectedGroup(matched);
    }
  };

  const loadGroupDetails = async (groupId) => {
    setLoading(true);
    try {
      const [detailsResponse, auditResponse] = await Promise.allSettled([
        getGroupDetails(groupId),
        getGroupAuditLogs(groupId),
      ]).then((results) => results.map((result) => result.status === 'fulfilled' ? result.value : null));

      const details = detailsResponse?.data || null;
      if (details) {
        setSelectedGroup(details);
        setGroups((prev) => prev.map((item) => item.id === groupId ? { ...item, ...details } : item));
      }
      if (auditResponse) {
        setAuditLogs(Array.isArray(auditResponse.data) ? auditResponse.data : []);
      } else {
        setAuditLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedMembers = useMemo(() => Array.isArray(selectedGroup?.members) ? selectedGroup.members : [], [selectedGroup]);
  const joinRequests = useMemo(() => Array.isArray(selectedGroup?.join_requests) ? selectedGroup.join_requests : [], [selectedGroup]);
  const pinnedMessages = useMemo(() => Array.isArray(selectedGroup?.pinned_messages) ? selectedGroup.pinned_messages : [], [selectedGroup]);
  const invites = useMemo(() => Array.isArray(selectedGroup?.invites) ? selectedGroup.invites : [], [selectedGroup]);

  const refreshSelected = async () => {
    if (selectedGroupId) {
      await loadGroupDetails(selectedGroupId);
    }
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) return;
    const { data } = await createGroup(createForm);
    setShowCreateModal(false);
    setCreateForm({ name: '', description: '', is_private: false, allow_member_invites: true });
    await loadGroups();
    setSelectedGroupId(data?.id || selectedGroupId);
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !selectedGroupId) return;
    await inviteToGroup(selectedGroupId, { username: inviteUsername.trim() });
    setInviteUsername('');
    await refreshSelected();
  };

  const handleRoleChange = async (username, role) => {
    await updateGroupMemberRole(selectedGroupId, username, { role });
    await refreshSelected();
  };

  const togglePermission = async (member, permission) => {
    const current = new Set(member.permissions || []);
    if (current.has(permission)) current.delete(permission); else current.add(permission);
    await updateGroupMemberPermissions(selectedGroupId, member.username, { permissions: [...current] });
    await refreshSelected();
  };

  const handleModeration = async (username, action) => {
    await moderateGroupUser(selectedGroupId, { username, action });
    await refreshSelected();
  };

  const handleJoinRequest = async (requestId, approve) => {
    await reviewGroupJoinRequest(selectedGroupId, requestId, { approve });
    await refreshSelected();
  };

  const handleCreatePinnedMessage = async () => {
    if (!pinnedDraft.trim()) return;
    await createPinnedGroupMessage(selectedGroupId, { text: pinnedDraft.trim() });
    setPinnedDraft('');
    await refreshSelected();
  };

  const loadSupplementalTabData = async (tab) => {
    if (!selectedGroupId) return;
    if (tab === 'requests') {
      try {
        const { data } = await getGroupJoinRequests(selectedGroupId);
        setSelectedGroup((prev) => prev ? { ...prev, join_requests: Array.isArray(data) ? data : prev.join_requests } : prev);
      } catch {
        // ignore permissions issues for non-admin users
      }
    }
    if (tab === 'pinned') {
      const { data } = await getPinnedGroupMessages(selectedGroupId);
      setSelectedGroup((prev) => prev ? { ...prev, pinned_messages: Array.isArray(data) ? data : [] } : prev);
    }
    if (tab === 'invites') {
      try {
        const { data } = await getGroupInvites(selectedGroupId);
        setSelectedGroup((prev) => prev ? { ...prev, invites: Array.isArray(data) ? data : [] } : prev);
      } catch {
        // ignore permissions issues for non-admin users
      }
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadSupplementalTabData(activeTab);
    }
  }, [activeTab, selectedGroupId]);

  return (
    <MainLayout>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ width: 320, borderLeft: '1px solid var(--line)', padding: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0 }}>المجموعات</h3>
            <Button size="small" onClick={() => setShowCreateModal(true)}>+ إنشاء</Button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {groups.map((group) => (
              <Card
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  borderRadius: 18,
                  background: selectedGroupId === group.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: selectedGroupId === group.id ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{group.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>{group.description || 'بدون وصف'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, color: 'var(--muted)', fontSize: 12 }}>
                  <span>{group.members_count} عضو</span>
                  <span>{group.pending_requests_count || 0} طلب</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {selectedGroup ? (
          <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h1 style={{ margin: '0 0 10px 0' }}>{selectedGroup.name}</h1>
                <p className="muted" style={{ margin: 0, maxWidth: 680 }}>{selectedGroup.description || 'أضف وصف واضح للمجموعة وأهدافها.'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: 12 }}>
                    {selectedGroup.settings?.is_private ? '🔒 خاصة' : '🌍 عامة'}
                  </span>
                  <span style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: 12 }}>
                    الدعوات: {selectedGroup.settings?.allow_member_invites ? 'مسموح' : 'مقفل'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setShowInviteModal(true)}>➕ دعوة</Button>
                <Button variant="secondary" onClick={refreshSelected}>↻ تحديث</Button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              <Card style={{ padding: 18, borderRadius: 18 }}><div className="muted">الأعضاء</div><strong style={{ fontSize: 28 }}>{selectedGroup.members_count || 0}</strong></Card>
              <Card style={{ padding: 18, borderRadius: 18 }}><div className="muted">طلبات الانضمام</div><strong style={{ fontSize: 28 }}>{selectedGroup.pending_requests_count || 0}</strong></Card>
              <Card style={{ padding: 18, borderRadius: 18 }}><div className="muted">الرسائل المثبتة</div><strong style={{ fontSize: 28 }}>{pinnedMessages.length}</strong></Card>
              <Card style={{ padding: 18, borderRadius: 18 }}><div className="muted">الدعوات</div><strong style={{ fontSize: 28 }}>{invites.length}</strong></Card>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--line)', marginBottom: 22, paddingBottom: 12 }}>
              {[
                ['members', 'الأدوار والصلاحيات'],
                ['moderation', 'المودريشن'],
                ['requests', 'طلبات الانضمام'],
                ['pinned', 'الرسائل المثبتة'],
                ['invites', 'الدعوات'],
                ['logs', 'السجل'],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: activeTab === tab ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    background: activeTab === tab ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.03)',
                    color: activeTab === tab ? 'white' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'members' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {selectedMembers.map((member) => (
                  <Card key={member.username} style={{ padding: 18, borderRadius: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <strong>{member.username}</strong>
                          <RoleBadge role={member.role} />
                          {member.is_muted ? <span style={{ color: '#f59e0b', fontSize: 12 }}>مكتوم</span> : null}
                          {member.is_banned ? <span style={{ color: '#ef4444', fontSize: 12 }}>محظور</span> : null}
                        </div>
                        <div className="muted" style={{ fontSize: 13 }}>انضم في {member.joined_at ? new Date(member.joined_at).toLocaleDateString('ar-EG') : '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        <select value={member.role} onChange={(event) => handleRoleChange(member.username, event.target.value)} style={{ borderRadius: 12, padding: '10px 12px' }}>
                          {ROLE_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {MANAGEABLE_PERMISSIONS.map((permission) => {
                        const enabled = (member.permissions || []).includes(permission);
                        return (
                          <button
                            key={permission}
                            type="button"
                            onClick={() => togglePermission(member, permission)}
                            style={{
                              borderRadius: 999,
                              padding: '8px 12px',
                              border: enabled ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)',
                              background: enabled ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                              color: enabled ? '#86efac' : 'var(--muted)',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            {permission}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}

            {activeTab === 'moderation' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {selectedMembers.map((member) => (
                  <Card key={`moderation-${member.username}`} style={{ padding: 18, borderRadius: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <strong>{member.username}</strong>
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>تحكم سريع في الميوت أو الطرد أو الحظر</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button variant="secondary" onClick={() => handleModeration(member.username, member.is_muted ? 'unmute' : 'mute')}>{member.is_muted ? 'فك الكتم' : 'كتم'}</Button>
                        <Button variant="secondary" onClick={() => handleModeration(member.username, 'kick')}>طرد</Button>
                        <Button variant="danger" onClick={() => handleModeration(member.username, 'ban')}>حظر</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}

            {activeTab === 'requests' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {joinRequests.length ? joinRequests.map((request) => (
                  <Card key={request.id} style={{ padding: 18, borderRadius: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <strong>{request.username}</strong>
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>{request.note || 'بدون ملاحظة إضافية'}</div>
                        <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>الحالة: {request.status}</div>
                      </div>
                      {request.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Button variant="secondary" onClick={() => handleJoinRequest(request.id, false)}>رفض</Button>
                          <Button onClick={() => handleJoinRequest(request.id, true)}>قبول</Button>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                )) : <Card style={{ padding: 22, borderRadius: 18, textAlign: 'center' }}>لا توجد طلبات انضمام حالياً</Card>}
              </div>
            ) : null}

            {activeTab === 'pinned' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <Card style={{ padding: 18, borderRadius: 18 }}>
                  <h4 style={{ marginTop: 0 }}>إضافة رسالة مثبتة</h4>
                  <textarea rows={3} value={pinnedDraft} onChange={(event) => setPinnedDraft(event.target.value)} placeholder="اكتب الرسالة المثبتة للمجموعة" />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button onClick={handleCreatePinnedMessage}>تثبيت الرسالة</Button>
                  </div>
                </Card>
                {pinnedMessages.length ? pinnedMessages.map((message) => (
                  <Card key={message.id} style={{ padding: 18, borderRadius: 18 }}>
                    <strong>📌 {message.author}</strong>
                    <p style={{ margin: '10px 0 0' }}>{message.text}</p>
                  </Card>
                )) : <Card style={{ padding: 22, borderRadius: 18, textAlign: 'center' }}>لسه مفيش رسائل مثبتة</Card>}
              </div>
            ) : null}

            {activeTab === 'invites' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {invites.length ? invites.map((invite) => (
                  <Card key={invite.id} style={{ padding: 18, borderRadius: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <strong>{invite.invitee}</strong>
                        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>بواسطة {invite.inviter}</div>
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{invite.status}</span>
                        <a href={invite.invite_link} target="_blank" rel="noreferrer" style={{ color: '#a78bfa' }}>رابط الدعوة</a>
                      </div>
                    </div>
                  </Card>
                )) : <Card style={{ padding: 22, borderRadius: 18, textAlign: 'center' }}>لا توجد دعوات حالياً</Card>}
              </div>
            ) : null}

            {activeTab === 'logs' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {auditLogs.length ? auditLogs.map((log, index) => (
                  <Card key={`${log.timestamp}-${index}`} style={{ padding: 18, borderRadius: 18 }}>
                    <strong>{log.actor}</strong>
                    <p style={{ margin: '8px 0 0' }}>{log.description}</p>
                    <small className="muted">{log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG') : 'الآن'}</small>
                  </Card>
                )) : <Card style={{ padding: 22, borderRadius: 18, textAlign: 'center' }}>لا يوجد سجل ظاهر لك حالياً</Card>}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="اختر مجموعة لعرض التفاصيل" description={loading ? 'جارٍ التحميل...' : 'هتظهر هنا الأدوار والصلاحيات والمودريشن والدعوات.'} />
          </div>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="إنشاء مجموعة جديدة" size="large">
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>اسم المجموعة</span>
            <input value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="اسم المجموعة" />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>وصف المجموعة</span>
            <textarea rows={4} value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="هدف المجموعة وقواعدها" />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>مجموعة خاصة</span>
            <input type="checkbox" checked={createForm.is_private} onChange={(event) => setCreateForm((prev) => ({ ...prev, is_private: event.target.checked }))} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>السماح بدعوات الأعضاء</span>
            <input type="checkbox" checked={createForm.allow_member_invites} onChange={(event) => setCreateForm((prev) => ({ ...prev, allow_member_invites: event.target.checked }))} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreateGroup}>إنشاء</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="دعوة عضو للمجموعة">
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>اسم المستخدم</span>
            <input value={inviteUsername} onChange={(event) => setInviteUsername(event.target.value)} placeholder="username" />
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>إلغاء</Button>
            <Button onClick={handleInvite}>إرسال الدعوة</Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
