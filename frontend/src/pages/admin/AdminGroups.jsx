import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../../components/feedback/Skeleton.jsx';
import { createGroup, joinGroup } from '../../api/groups.js';
import {
  getAdminGroups,
  freezeAdminGroup,
  deleteAdminGroup,
  getAdminGroupMessages,
  deleteAdminGroupMessage,
  muteAdminGroupMember,
  removeAdminGroupMember,
} from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

/**
 * ========================================================================
 * AdminGroups — إدارة المجموعات (v88.46 Stage 2)
 * ------------------------------------------------------------------------
 *  - أزرار: تجميد المجموعة / فك التجميد / حذف مجموعة كاملة
 *  - كتم / فك كتم عضو + طرد عضو + حذف رسالة داخل مجموعة
 *  - المدير لا يحتاج أن يكون عضواً في أي مجموعة
 * ========================================================================
 */

const initialForm = { name: '', description: '', members: '' };

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-EG');
  } catch {
    return '—';
  }
}

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);
  const [detailMessages, setDetailMessages] = useState([]);
  const [detailLoadingMsgs, setDetailLoadingMsgs] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState('');
  const [busyKey, setBusyKey] = useState(''); // "freeze-<gid>" / "delete-<gid>" / "member-<gid>-<u>"
  const { pushToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAdminGroups({ include_frozen: true });
      const arr = Array.isArray(data) ? data : (data?.items || []);
      setGroups(arr);
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تحميل المجموعات.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const members = groups.reduce((sum, item) => sum + Number(item.members_count || 0), 0);
    const frozen = groups.filter((g) => g.is_frozen).length;
    return [
      { label: 'إجمالي المجموعات', value: groups.length },
      { label: 'إجمالي الأعضاء', value: members },
      { label: 'مجموعات مُجمَّدة', value: frozen },
      { label: 'متوسط الأعضاء', value: groups.length ? Math.round(members / groups.length) : 0 },
    ];
  }, [groups]);

  const syncDetailGroup = (groupId, nextGroup) => {
    if (!groupId) return;
    setDetailGroup((previous) => (previous && String(previous.id) === String(groupId) ? nextGroup : previous));
  };

  const openGroupModal = async (group) => {
    setDetailGroup(group);
    setDetailMessages([]);
    setDetailLoadingMsgs(true);
    try {
      const { data } = await getAdminGroupMessages(group.id, { limit: 200 });
      setDetailMessages(data?.items || []);
    } catch {
      setDetailMessages([]);
    } finally {
      setDetailLoadingMsgs(false);
    }
  };

  const refreshDetailMessages = async () => {
    if (!detailGroup) return;
    setDetailLoadingMsgs(true);
    try {
      const { data } = await getAdminGroupMessages(detailGroup.id, { limit: 200 });
      setDetailMessages(data?.items || []);
    } finally {
      setDetailLoadingMsgs(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      pushToast({ title: 'اسم المجموعة مطلوب', description: 'اكتب اسم واضح قبل الإنشاء.', type: 'warning' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        members: form.members.split(',').map((item) => item.trim()).filter(Boolean),
      };
      const { data } = await createGroup(payload);
      setCreateOpen(false);
      setForm(initialForm);
      pushToast({ title: 'تم إنشاء المجموعة', description: data?.name || payload.name, type: 'success' });
      await load();
      if (data) setDetailGroup(data);
    } catch (err) {
      pushToast({ title: 'تعذر إنشاء المجموعة', description: err?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (group) => {
    try {
      setJoiningGroupId(String(group.id));
      const { data } = await joinGroup(group.id);
      setGroups((previous) => previous.map((item) => (String(item.id) === String(group.id) ? { ...item, ...data } : item)));
      syncDetailGroup(group.id, { ...group, ...data });
      pushToast({ title: data?.joined ? 'تم الانضمام للمجموعة' : 'أنت منضم بالفعل', description: data?.name || group.name, type: data?.joined ? 'success' : 'info' });
    } catch (err) {
      pushToast({ title: 'تعذر الانضمام', description: err?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setJoiningGroupId('');
    }
  };

  // ---------- إجراءات المدير الخارقة ----------
  const handleFreezeToggle = async (group) => {
    const willFreeze = !group.is_frozen;
    const confirmMsg = willFreeze
      ? `تجميد المجموعة "${group.name}"؟ سيمنع كل الرسائل والدعوات.`
      : `فك تجميد المجموعة "${group.name}"؟`;
    if (!window.confirm(confirmMsg)) return;
    const reason = willFreeze ? (window.prompt('سبب التجميد (اختياري):', '') || '') : '';
    setBusyKey(`freeze-${group.id}`);
    try {
      const { data } = await freezeAdminGroup(group.id, willFreeze, reason);
      setGroups((prev) =>
        prev.map((g) => (String(g.id) === String(group.id) ? { ...g, ...data, is_frozen: data.is_frozen } : g)),
      );
      syncDetailGroup(group.id, { ...group, ...data });
      pushToast({
        title: willFreeze ? 'تم تجميد المجموعة' : 'تم فك التجميد',
        description: group.name,
        type: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'فشلت العملية',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`حذف نهائي للمجموعة "${group.name}" وكل رسائلها؟ لا يمكن التراجع.`)) return;
    const reason = window.prompt('سبب الحذف (اختياري):', '') || '';
    setBusyKey(`delete-${group.id}`);
    try {
      await deleteAdminGroup(group.id, reason);
      setGroups((prev) => prev.filter((g) => String(g.id) !== String(group.id)));
      if (detailGroup && String(detailGroup.id) === String(group.id)) {
        setDetailGroup(null);
      }
      pushToast({ title: 'تم حذف المجموعة', description: group.name, type: 'success' });
    } catch (err) {
      pushToast({
        title: 'تعذر حذف المجموعة',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleMuteMember = async (group, username, currentlyMuted = false) => {
    if (!username) return;
    const willMute = !currentlyMuted;
    if (!window.confirm(willMute ? `كتم @${username} داخل "${group.name}"؟` : `فك كتم @${username}؟`)) return;
    const reason = willMute ? (window.prompt('سبب الكتم (اختياري):', '') || '') : '';
    setBusyKey(`member-${group.id}-${username}`);
    try {
      await muteAdminGroupMember(group.id, username, { muted: willMute, reason });
      pushToast({
        title: willMute ? 'تم كتم العضو' : 'تم فك الكتم',
        description: `@${username}`,
        type: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'فشلت عملية الكتم',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleRemoveMember = async (group, username) => {
    if (!username) return;
    if (!window.confirm(`طرد @${username} من "${group.name}"؟`)) return;
    const reason = window.prompt('سبب الطرد (اختياري):', '') || '';
    setBusyKey(`kick-${group.id}-${username}`);
    try {
      await removeAdminGroupMember(group.id, username, reason);
      const updatedMembers = (group.members || []).filter((u) => u !== username);
      const updated = { ...group, members: updatedMembers, members_count: Math.max(0, (group.members_count || updatedMembers.length + 1) - 1) };
      setGroups((prev) => prev.map((g) => (String(g.id) === String(group.id) ? updated : g)));
      syncDetailGroup(group.id, updated);
      pushToast({ title: 'تم طرد العضو', description: `@${username}`, type: 'success' });
    } catch (err) {
      pushToast({
        title: 'تعذر طرد العضو',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteMessage = async (group, msg) => {
    if (!msg?.id) return;
    if (!window.confirm(`حذف الرسالة ${msg.id}؟`)) return;
    const reason = window.prompt('سبب الحذف (اختياري):', '') || '';
    setBusyKey(`msg-${msg.id}`);
    try {
      await deleteAdminGroupMessage(group.id, msg.id, reason);
      setDetailMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_deleted: true } : m)));
      pushToast({ title: 'تم حذف الرسالة', description: `#${msg.id}`, type: 'success' });
    } catch (err) {
      pushToast({
        title: 'تعذر حذف الرسالة',
        description: err?.response?.data?.detail || 'حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">مركز المجموعات — سيطرة المدير الكاملة</h3>
              <p className="muted">تجميد، حذف، كتم أعضاء، وحذف رسائل بدون الحاجة لأن يكون المدير عضواً في المجموعة.</p>
            </div>
            <div className="action-row">
              <Button onClick={() => setCreateOpen(true)}>إنشاء مجموعة</Button>
              <Button variant="secondary" onClick={load} loading={loading}>{loading ? 'جارٍ التحديث...' : 'تحديث'}</Button>
            </div>
          </div>
          <div className="status-list compact-grid">
            {stats.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
          </div>
        </Card>
        <Card>
          <div className="queue-grid compact-cards">
            <div className="queue-card compact admin-tone-success">
              <span className="queue-label">أكبر مجموعة</span>
              <strong>{groups[0]?.name || '—'}</strong>
              <p>{groups[0]?.description || 'هتظهر هنا تفاصيل المجموعة الأعلى في القائمة.'}</p>
            </div>
            <div className="queue-card compact admin-tone-blue">
              <span className="queue-label">صاحب المجموعة الأولى</span>
              <strong>{groups[0]?.owner_username || '—'}</strong>
              <p>مستخرج مباشرة من الخادم.</p>
            </div>
            <div className="queue-card compact admin-tone-amber">
              <span className="queue-label">حالة السيطرة</span>
              <strong>مدير أعلى</strong>
              <p>تقدر تجمّد أي مجموعة أو تحذفها فوراً.</p>
            </div>
          </div>
        </Card>
      </section>

      {error ? <ErrorState title="تعذر تحميل المجموعات" description={error} onRetry={load} /> : null}
      {loading ? <ListSkeleton count={5} /> : null}
      {!loading && groups.length === 0 ? (
        <EmptyState icon="👥" title="لا توجد مجموعات بعد" description="أنشئ أول مجموعة من الزر اللي فوق وهتظهر هنا فوراً." actionLabel="إنشاء مجموعة" onAction={() => setCreateOpen(true)} />
      ) : null}

      {!loading && groups.length > 0 ? (
        <section className="admin-deep-grid">
          <Card className="admin-rich-table-card">
            <div className="card-head split">
              <div>
                <h3 className="section-title">قائمة المجموعات</h3>
                <p className="muted no-margin">تحكم كامل: تجميد، حذف، كتم أعضاء، وحذف رسائل.</p>
              </div>
              <span className="badge">{groups.length}</span>
            </div>
            <div className="table-shell admin-rich-table-shell">
              <table className="admin-table admin-rich-table">
                <thead>
                  <tr>
                    <th>المجموعة</th>
                    <th>الوصف</th>
                    <th>المالك</th>
                    <th>الأعضاء</th>
                    <th>الحالة</th>
                    <th>الإنشاء</th>
                    <th>إجراءات المدير</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => {
                    const frozen = Boolean(group.is_frozen);
                    return (
                      <tr key={group.id} style={frozen ? { background: 'rgba(59,130,246,0.06)' } : undefined}>
                        <td>
                          <div className="admin-rich-user-cell">
                            <div className="admin-module-avatar">{frozen ? '❄️' : '👥'}</div>
                            <div>
                              <strong>{group.name}</strong>
                              <small>#{group.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="content-cell compact">
                            <strong>{group.description || 'بدون وصف'}</strong>
                            <small>{group.members?.slice(0, 3).join(' • ') || 'لا توجد أسماء أعضاء بعد'}</small>
                          </div>
                        </td>
                        <td>@{group.owner_username}</td>
                        <td><strong>{group.members_count || group.members?.length || 0}</strong></td>
                        <td>
                          {frozen ? (
                            <span className="glass-chip" style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd' }}>
                              مُجمَّدة
                            </span>
                          ) : (
                            <span className="glass-chip" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
                              نشطة
                            </span>
                          )}
                        </td>
                        <td>{formatDate(group.created_at)}</td>
                        <td>
                          <div className="action-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                            <button type="button" className="mini-action" onClick={() => openGroupModal(group)}>عرض/إدارة</button>
                            <button
                              type="button"
                              className="mini-action"
                              disabled={busyKey === `freeze-${group.id}`}
                              onClick={() => handleFreezeToggle(group)}
                              style={{
                                background: frozen ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                                color: frozen ? '#6ee7b7' : '#93c5fd',
                              }}
                            >
                              {frozen ? 'فك التجميد' : 'تجميد'}
                            </button>
                            <button
                              type="button"
                              className="mini-action"
                              disabled={busyKey === `delete-${group.id}`}
                              onClick={() => handleDeleteGroup(group)}
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="admin-side-stack">
            <Card className="admin-mini-list-card">
              <div className="card-head split">
                <h3 className="section-title">آخر المجموعات</h3>
                <span className="badge">الخلاصة</span>
              </div>
              <div className="admin-activity-list">
                {groups.slice(0, 6).map((group) => (
                  <div key={group.id} className="admin-activity-item">
                    <span className="admin-activity-dot tone-group" />
                    <div>
                      <strong>{group.name} {group.is_frozen ? '❄️' : ''}</strong>
                      <p>{group.description || 'تم إنشاء مجموعة جديدة.'}</p>
                      <small>{formatDate(group.created_at)}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="admin-mini-list-card">
              <div className="card-head split">
                <h3 className="section-title">مؤشرات سريعة</h3>
                <span className="badge">مباشر</span>
              </div>
              <div className="queue-grid compact-cards">
                {groups.slice(0, 3).map((group) => (
                  <button key={group.id} type="button" className="queue-card compact admin-tone-violet" style={{ textAlign: 'inherit', cursor: 'pointer' }} onClick={() => openGroupModal(group)}>
                    <span className="queue-label">{group.name} {group.is_frozen ? '❄️' : ''}</span>
                    <strong>{group.members_count || 0} عضو</strong>
                    <p>المالك: @{group.owner_username}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </section>
      ) : null}

      {/* Modal إنشاء مجموعة */}
      <Modal open={createOpen} title="إنشاء مجموعة جديدة" onClose={() => setCreateOpen(false)}>
        <div className="modal-stack">
          <Input label="اسم المجموعة" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="مثال: فريق الدعم" />
          <label className="field">
            <span className="field-label">وصف المجموعة</span>
            <textarea className="input textarea" rows="4" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="اكتب وصف مختصر للمجموعة" />
          </label>
          <Input label="أعضاء مبدئيون" hint="افصل الأسماء بفاصلة" value={form.members} onChange={(event) => setForm((prev) => ({ ...prev, members: event.target.value }))} placeholder="أحمد، سارة، نور" />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate} loading={saving}>{saving ? 'جارٍ الإنشاء...' : 'إنشاء المجموعة'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal تفاصيل / إدارة مجموعة */}
      <Modal open={Boolean(detailGroup)} title={detailGroup ? `${detailGroup.name}${detailGroup.is_frozen ? ' — ❄️ مُجمَّدة' : ''}` : 'تفاصيل المجموعة'} onClose={() => setDetailGroup(null)}>
        {detailGroup ? (
          <div className="modal-stack">
            <div className="profile-summary-card">
              <div className="avatar-circle large">{detailGroup.is_frozen ? '❄️' : '👥'}</div>
              <div>
                <strong>{detailGroup.name}</strong>
                <div className="muted">بواسطة @{detailGroup.owner_username}</div>
                <div className="glass-chip" style={{ marginTop: 8 }}>#{detailGroup.id}</div>
                {detailGroup.is_frozen && detailGroup.frozen_reason ? (
                  <div className="muted" style={{ marginTop: 6, color: '#93c5fd' }}>سبب التجميد: {detailGroup.frozen_reason}</div>
                ) : null}
              </div>
            </div>

            <div className="story-feedback-card">
              <strong>الوصف</strong>
              <p style={{ marginTop: 8 }}>{detailGroup.description || 'بدون وصف'}</p>
            </div>

            <div className="stats-inline-grid">
              <div><strong>{detailGroup.members_count || detailGroup.members?.length || 0}</strong><span>أعضاء</span></div>
              <div><strong>@{detailGroup.owner_username}</strong><span>المالك</span></div>
              <div><strong>{formatDate(detailGroup.created_at)}</strong><span>تاريخ الإنشاء</span></div>
            </div>

            {/* أدوات المدير الخارقة */}
            <div className="story-feedback-card">
              <strong>إجراءات المدير</strong>
              <div className="action-row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => handleFreezeToggle(detailGroup)}
                  loading={busyKey === `freeze-${detailGroup.id}`}
                >
                  {detailGroup.is_frozen ? 'فك التجميد' : 'تجميد المجموعة'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDeleteGroup(detailGroup)}
                  loading={busyKey === `delete-${detailGroup.id}`}
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                >
                  حذف المجموعة نهائياً
                </Button>
                <Button variant="secondary" onClick={() => handleJoin(detailGroup)} loading={joiningGroupId === String(detailGroup.id)}>
                  {joiningGroupId === String(detailGroup.id) ? 'جارٍ الانضمام...' : 'انضمام'}
                </Button>
                <Button variant="secondary" onClick={refreshDetailMessages}>تحديث الرسائل</Button>
              </div>
            </div>

            {/* قائمة الأعضاء مع أزرار كتم/طرد */}
            <div className="story-feedback-card">
              <strong>قائمة الأعضاء ({(detailGroup.members || []).length})</strong>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(detailGroup.members || []).length ? (
                  detailGroup.members.map((member) => (
                    <div
                      key={member}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: 'rgba(15,23,42,0.4)',
                        borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.10)',
                      }}
                    >
                      <span className="glass-chip">@{member}</span>
                      <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="mini-action"
                          disabled={busyKey === `member-${detailGroup.id}-${member}`}
                          onClick={() => handleMuteMember(detailGroup, member, false)}
                          style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d' }}
                        >
                          كتم
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          disabled={busyKey === `member-${detailGroup.id}-${member}`}
                          onClick={() => handleMuteMember(detailGroup, member, true)}
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}
                        >
                          فك الكتم
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          disabled={busyKey === `kick-${detailGroup.id}-${member}`}
                          onClick={() => handleRemoveMember(detailGroup, member)}
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                        >
                          طرد
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="muted">لا يوجد أعضاء معروضين.</span>
                )}
              </div>
            </div>

            {/* رسائل المجموعة مع زر حذف لكل رسالة */}
            <div className="story-feedback-card">
              <strong>رسائل المجموعة (آخر 200)</strong>
              <div style={{ marginTop: 10, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detailLoadingMsgs ? (
                  <span className="muted">جارٍ تحميل الرسائل...</span>
                ) : detailMessages.length === 0 ? (
                  <span className="muted">لا توجد رسائل بعد.</span>
                ) : (
                  detailMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '6px 10px',
                        background: msg.is_deleted ? 'rgba(239,68,68,0.06)' : 'rgba(15,23,42,0.4)',
                        borderRadius: 8,
                        border: msg.is_deleted ? '1px dashed rgba(239,68,68,0.30)' : '1px solid rgba(148,163,184,0.10)',
                        opacity: msg.is_deleted ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                        <strong style={{ color: '#f8fafc' }}>@{msg.sender}</strong>
                        <span className="muted">{formatDate(msg.created_at)}</span>
                        {!msg.is_deleted ? (
                          <button
                            type="button"
                            className="mini-action"
                            disabled={busyKey === `msg-${msg.id}`}
                            onClick={() => handleDeleteMessage(detailGroup, msg)}
                            style={{ marginInlineStart: 'auto', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                          >
                            حذف
                          </button>
                        ) : (
                          <span className="glass-chip" style={{ marginInlineStart: 'auto' }}>محذوفة</span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#e2e8f0', wordBreak: 'break-word' }}>
                        {msg.content || (msg.message_type !== 'text' ? `[${msg.message_type}]` : '—')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-actions">
              <Button onClick={() => setDetailGroup(null)}>إغلاق</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
