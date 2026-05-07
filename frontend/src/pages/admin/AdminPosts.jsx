import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { TableSkeleton } from '../../components/feedback/Skeleton.jsx';
import useDebouncedValue from '../../hooks/useDebouncedValue.js';
import { bulkDeleteAdminPosts, createAdminPost, deleteAdminPost, getAdminPosts, updateAdminPost } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const initialForm = { content: '', image_url: '', user_id: '' };

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, page_size: 10 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingPost, setEditingPost] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState('');
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 350);

  const loadPosts = async (page = pagination.page) => {
    try {
      setLoading(true);
      setLoadError('');
      const { data } = await getAdminPosts({ page, page_size: pagination.page_size, search: debouncedSearch, sort_by: sortBy, sort_direction: sortDirection });
      setPosts(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      const message = error?.response?.data?.detail || 'حدث خطأ.';
      setLoadError(message);
      pushToast({ title: 'تعذر تحميل المحتوى', description: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [debouncedSearch, sortBy, sortDirection]);

  const toggleSelected = (postId) => {
    setSelectedIds((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setForm(initialForm);
    setOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setForm({ content: post.content, image_url: post.image_url || '', user_id: post.user_id || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, user_id: form.user_id ? Number(form.user_id) : undefined };
    try {
      setSaving(true);
      if (editingPost) {
        await updateAdminPost(editingPost.id, payload);
        pushToast({ title: 'تم تحديث المنشور', description: `#${editingPost.id}`, type: 'success' });
      } else {
        await createAdminPost(payload);
        pushToast({ title: 'تم إنشاء المنشور', description: 'منشور جديد تمت إضافته بنجاح.', type: 'success' });
      }
      setOpen(false);
      setForm(initialForm);
      await loadPosts(editingPost ? pagination.page : 1);
    } catch (error) {
      pushToast({ title: 'تعذر حفظ المنشور', description: error?.response?.data?.detail || 'تحقق من البيانات ثم حاول تاني.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      setActionBusyKey(`delete-${postId}`);
      await deleteAdminPost(postId);
      pushToast({ title: 'تم حذف المنشور', description: `#${postId}`, type: 'info' });
      await loadPosts(1);
    } catch (error) {
      pushToast({ title: 'تعذر حذف المنشور', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      setActionBusyKey('bulk-delete');
      await bulkDeleteAdminPosts(selectedIds);
      pushToast({ title: 'حذف جماعي', description: `تم حذف ${selectedIds.length} عنصر.`, type: 'success' });
      setSelectedIds([]);
      await loadPosts(1);
    } catch (error) {
      pushToast({ title: 'تعذر تنفيذ الحذف الجماعي', description: error?.response?.data?.detail || 'حاول مرة تانية.', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="filters-row wrap">
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المحتوى أو اسم المستخدم" />
            <label className="field select-field"><span className="field-label">Sorting</span><select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="created_at">الأحدث</option><option value="engagement">التفاعل</option></select></label>
            <label className="field select-field"><span className="field-label">Direction</span><select className="input" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}><option value="desc">تنازلي</option><option value="asc">تصاعدي</option></select></label>
          </div>
        </Card>
        <Card>
          <div className="action-row wide">
            <Button onClick={handleOpenCreate}>منشور جديد</Button>
            <Button variant="secondary" disabled={!selectedIds.length || actionBusyKey === 'bulk-delete'} onClick={handleBulkDelete} loading={actionBusyKey === 'bulk-delete'}>
              {actionBusyKey === 'bulk-delete' ? 'جارٍ الحذف...' : 'حذف جماعي'}
            </Button>
            <span className="muted">{selectedIds.length} عنصر محدد</span>
          </div>
        </Card>
      </section>

      {loadError && !loading ? <ErrorState title="تعذر تحميل المنشورات" description={loadError} onRetry={() => loadPosts(pagination.page)} /> : null}

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">Content Management</h3>
            <p className="muted">فلترة وفرز وتحديد متعدد مع إنشاء وتعديل وحذف للمحتوى.</p>
          </div>
          <div className="pagination-row">
            <Button variant="secondary" disabled={pagination.page <= 1 || loading} onClick={() => loadPosts(pagination.page - 1)}>السابق</Button>
            <span>صفحة {pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages || loading} onClick={() => loadPosts(pagination.page + 1)}>التالي</Button>
          </div>
        </div>

        {loading ? <TableSkeleton rows={6} columns={7} /> : null}

        {!loading && posts.length === 0 ? (
          <EmptyState icon="🗒️" title="لا توجد منشورات مطابقة" description="جرّب تعديل البحث أو الفرز، أو أنشئ منشور جديد من الأعلى." actionLabel="منشور جديد" onAction={handleOpenCreate} />
        ) : null}

        {!loading && posts.length > 0 ? (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={posts.length > 0 && selectedIds.length === posts.length} onChange={(event) => setSelectedIds(event.target.checked ? posts.map((item) => item.id) : [])} /></th>
                  <th>المعرف</th>
                  <th>الكاتب</th>
                  <th>المحتوى</th>
                  <th>التفاعل</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td><input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelected(post.id)} /></td>
                    <td>#{post.id}</td>
                    <td>{post.username}</td>
                    <td>
                      <div className="content-cell">
                        <strong>{post.content.slice(0, 80)}</strong>
                        {post.image_url ? <small>{post.image_url}</small> : <small>بدون صورة</small>}
                      </div>
                    </td>
                    <td>{post.engagement}</td>
                    <td>{post.created_at ? new Date(post.created_at).toLocaleString('ar-EG') : '—'}</td>
                    <td>
                      <div className="action-row">
                        <button type="button" className="mini-action" onClick={() => handleOpenEdit(post)}>تعديل</button>
                        <button type="button" className="mini-action danger" onClick={() => handleDelete(post.id)} disabled={actionBusyKey === `delete-${post.id}`} aria-busy={actionBusyKey === `delete-${post.id}`}>
                          {actionBusyKey === `delete-${post.id}` ? 'جارٍ الحذف...' : 'حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Modal open={open} title={editingPost ? 'تعديل المنشور' : 'إنشاء منشور جديد'} onClose={() => setOpen(false)}>
        <div className="modal-stack">
          <label className="field"><span className="field-label">Content</span><textarea className="input textarea" rows="6" value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} placeholder="اكتب نص المنشور" /></label>
          <Input label="Image URL" value={form.image_url} onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))} placeholder="https://..." />
          <Input label="User ID" value={form.user_id} onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))} placeholder="اختياري" />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} loading={saving}>{saving ? 'جارٍ الحفظ...' : editingPost ? 'حفظ التعديلات' : 'إنشاء'}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
