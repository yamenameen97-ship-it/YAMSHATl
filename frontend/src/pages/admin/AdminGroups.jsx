import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../../components/feedback/Skeleton.jsx';
import { createGroup, getGroups, joinGroup } from '../../api/groups.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

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
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState('');
  const { pushToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getGroups();
      setGroups(Array.isArray(data) ? data : []);
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
    return [
      { label: 'إجمالي المجموعات', value: groups.length },
      { label: 'إجمالي الأعضاء', value: members },
      { label: 'متوسط الأعضاء', value: groups.length ? Math.round(members / groups.length) : 0 },
      { label: 'آخر إضافات', value: groups.slice(0, 3).length },
    ];
  }, [groups]);

  const openGroupModal = (group) => {
    setDetailGroup(group);
  };

  const syncDetailGroup = (groupId, nextGroup) => {
    if (!groupId) return;
    setDetailGroup((previous) => (previous && String(previous.id) === String(groupId) ? nextGroup : previous));
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
      setGroups((previous) => previous.map((item) => (String(item.id) === String(group.id) ? data : item)));
      syncDetailGroup(group.id, data);
      pushToast({ title: data?.joined ? 'تم الانضمام للمجموعة' : 'أنت منضم بالفعل', description: data?.name || group.name, type: data?.joined ? 'success' : 'info' });
    } catch (err) {
      pushToast({ title: 'تعذر الانضمام', description: err?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setJoiningGroupId('');
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">Groups Hub</h3>
              <p className="muted">أزرار Create / Join والـ Group Modal بقوا مربوطين بالـ API وبيعرضوا التفاصيل الفعلية للمجموعة.</p>
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
              <p>مستخرج مباشرة من بيانات الـ backend.</p>
            </div>
            <div className="queue-card compact admin-tone-amber">
              <span className="queue-label">جاهزية الانضمام</span>
              <strong>Live</strong>
              <p>تقدر تنضم للمجموعة وتتابع تحديث عدد الأعضاء فوراً.</p>
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
                <p className="muted no-margin">افتح التفاصيل أو انضم لأي مجموعة مباشرة من الجدول.</p>
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
                    <th>الإنشاء</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td>
                        <div className="admin-rich-user-cell">
                          <div className="admin-module-avatar">👥</div>
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
                      <td>{formatDate(group.created_at)}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="mini-action" onClick={() => openGroupModal(group)}>عرض التفاصيل</button>
                          <Button variant="secondary" className="group-join-btn" loading={joiningGroupId === String(group.id)} onClick={() => handleJoin(group)}>
                            {joiningGroupId === String(group.id) ? 'جارٍ الانضمام...' : 'انضمام'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="admin-side-stack">
            <Card className="admin-mini-list-card">
              <div className="card-head split">
                <h3 className="section-title">آخر المجموعات</h3>
                <span className="badge">Feed</span>
              </div>
              <div className="admin-activity-list">
                {groups.slice(0, 6).map((group) => (
                  <div key={group.id} className="admin-activity-item">
                    <span className="admin-activity-dot tone-group" />
                    <div>
                      <strong>{group.name}</strong>
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
                <span className="badge">Live</span>
              </div>
              <div className="queue-grid compact-cards">
                {groups.slice(0, 3).map((group) => (
                  <button key={group.id} type="button" className="queue-card compact admin-tone-violet" style={{ textAlign: 'inherit', cursor: 'pointer' }} onClick={() => openGroupModal(group)}>
                    <span className="queue-label">{group.name}</span>
                    <strong>{group.members_count || 0} عضو</strong>
                    <p>المالك: @{group.owner_username}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </section>
      ) : null}

      <Modal open={createOpen} title="إنشاء مجموعة جديدة" onClose={() => setCreateOpen(false)}>
        <div className="modal-stack">
          <Input label="اسم المجموعة" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="مثال: فريق الدعم" />
          <label className="field">
            <span className="field-label">وصف المجموعة</span>
            <textarea className="input textarea" rows="4" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="اكتب وصف مختصر للمجموعة" />
          </label>
          <Input label="أعضاء مبدئيون" hint="افصل الأسماء بفاصلة" value={form.members} onChange={(event) => setForm((prev) => ({ ...prev, members: event.target.value }))} placeholder="ahmed, sara, nour" />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate} loading={saving}>{saving ? 'جارٍ الإنشاء...' : 'إنشاء المجموعة'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(detailGroup)} title={detailGroup ? detailGroup.name : 'تفاصيل المجموعة'} onClose={() => setDetailGroup(null)}>
        {detailGroup ? (
          <div className="modal-stack">
            <div className="profile-summary-card">
              <div className="avatar-circle large">👥</div>
              <div>
                <strong>{detailGroup.name}</strong>
                <div className="muted">بواسطة @{detailGroup.owner_username}</div>
                <div className="glass-chip" style={{ marginTop: 8 }}>#{detailGroup.id}</div>
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
            <div className="story-feedback-card">
              <strong>قائمة الأعضاء</strong>
              <div className="badge-wrap compact" style={{ marginTop: 10 }}>
                {(detailGroup.members || []).length ? detailGroup.members.map((member) => <span key={member} className="glass-chip">@{member}</span>) : <span className="muted">لا يوجد أعضاء معروضين.</span>}
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => handleJoin(detailGroup)} loading={joiningGroupId === String(detailGroup.id)}>
                {joiningGroupId === String(detailGroup.id) ? 'جارٍ الانضمام...' : 'انضمام للمجموعة'}
              </Button>
              <Button onClick={() => setDetailGroup(null)}>إغلاق</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
