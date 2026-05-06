import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
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
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 350);

  const loadPosts = async (page = pagination.page) => {
    try {
      setLoading(true);
      const { data } = await getAdminPosts({ page, page_size: pagination.page_size, search: debouncedSearch, sort_by: sortBy, sort_direction: sortDirection });
      setPosts(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      pushToast({ title: 'تعذر تحميل المحتوى', description: error?.response?.data?.detail || 'حدث خطأ.', type: 'error' });
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
    if (editingPost) {
      await updateAdminPost(editingPost.id, payload);
      pushToast({ title: 'تم تحديث المنشور', description: `#${editingPost.id}`, type: 'success' });
    } else {
      await createAdminPost(payload);
      pushToast({ title: 'تم إنشاء المنشور', description: 'منشور جديد تمت إضافته بنجاح.', type: 'success' });
    }
    setOpen(false);
    setForm(initialForm);
    loadPosts(editingPost ? pagination.page : 1);
  };

  const handleDelete = async (postId) => {
    await deleteAdminPost(postId);
    pushToast({ title: 'تم حذف المنشور', description: `#${postId}`, type: 'info' });
    loadPosts(1);
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    await bulkDeleteAdminPosts(selectedIds);
    pushToast({ title: 'حذف جماعي', description: `تم حذف ${selectedIds.length} عنصر.`, type: 'success' });
    setSelectedIds([]);
    loadPosts(1);
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
            <Button variant="secondary" disabled={!selectedIds.length} onClick={handleBulkDelete}>حذف جماعي</Button>
            <span className="muted">{selectedIds.length} عنصر محدد</span>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">Posts / Data Management</h3>
            <p className="muted">CRUD كامل، فرز، فلترة، Bulk Actions، وإدارة محتوى من مكان واحد.</p>
          </div>
          <div className="pagination-row">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => loadPosts(pagination.page - 1)}>السابق</Button>
            <span>صفحة {pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => loadPosts(pagination.page + 1)}>التالي</Button>
          </div>
        </div>

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
              {loading ? <tr><td colSpan="7" className="table-empty">جارٍ تحميل المحتوى...</td></tr> : posts.map((post) => (
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
                      <button type="button" className="mini-action danger" onClick={() => handleDelete(post.id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title={editingPost ? 'تعديل المنشور' : 'إنشاء منشور جديد'} onClose={() => setOpen(false)}>
        <div className="modal-stack">
          <label className="field"><span className="field-label">Content</span><textarea className="input textarea" rows="6" value={form.content} onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))} placeholder="اكتب نص المنشور" /></label>
          <Input label="Image URL" value={form.image_url} onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))} placeholder="https://..." />
          <Input label="User ID" value={form.user_id} onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))} placeholder="اختياري" />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editingPost ? 'حفظ التعديلات' : 'إنشاء'}</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
