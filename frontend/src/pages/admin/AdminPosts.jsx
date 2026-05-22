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
import {
  bulkDeleteAdminPosts,
  createAdminPost,
  deleteAdminPost,
  getAdminPosts,
  updateAdminPost,
} from '../../api/admin.js';
import socket from '../../api/socket.js';
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
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState('');
  const [mediaReviewOpen, setMediaReviewOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
  const { pushToast } = useToast();
  const debouncedSearch = useDebouncedValue(search, 350);

  const resetForm = () => {
    setForm(initialForm);
    setEditingPost(null);
    setFormOpen(false);
  };

  const loadPosts = async (page = pagination.page) => {
    try {
      setLoading(true);
      setLoadError('');
      const { data } = await getAdminPosts({
        page,
        page_size: pagination.page_size,
        search: debouncedSearch,
        sort_by: sortBy,
        sort_direction: sortDirection,
      });
      setPosts(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      const message = error?.response?.data?.detail || 'حدث خطأ أثناء تحميل المنشورات.';
      setLoadError(message);
      pushToast({ title: 'تعذر تحميل المحتوى', description: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, [debouncedSearch, sortBy, sortDirection]);

  useEffect(() => {
    const syncPosts = () => loadPosts(pagination.page);
    socket.on('admin:post_created', syncPosts);
    socket.on('admin:post_updated', syncPosts);
    socket.on('admin:post_deleted', syncPosts);
    socket.on('admin:posts_bulk_deleted', syncPosts);
    return () => {
      socket.off('admin:post_created', syncPosts);
      socket.off('admin:post_updated', syncPosts);
      socket.off('admin:post_deleted', syncPosts);
      socket.off('admin:posts_bulk_deleted', syncPosts);
    };
  }, [pagination.page, debouncedSearch, sortBy, sortDirection]);

  const toggleSelected = (postId) => {
    setSelectedIds((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? posts.map((post) => post.id) : []);
  };

  const openCreateModal = () => {
    setEditingPost(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setForm({
      content: post?.content || '',
      image_url: post?.image_url || '',
      user_id: post?.user_id ? String(post.user_id) : '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const content = String(form.content || '').trim();
    if (!content) {
      pushToast({ title: 'محتوى المنشور مطلوب', type: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        content,
        image_url: String(form.image_url || '').trim() || undefined,
        user_id: form.user_id ? Number(form.user_id) : undefined,
      };

      if (editingPost?.id) {
        await updateAdminPost(editingPost.id, payload);
        pushToast({ title: 'تم تعديل المنشور', type: 'success' });
      } else {
        await createAdminPost(payload);
        pushToast({ title: 'تم إنشاء المنشور', type: 'success' });
      }

      resetForm();
      loadPosts(editingPost?.id ? pagination.page : 1);
    } catch (error) {
      pushToast({
        title: editingPost?.id ? 'فشل تعديل المنشور' : 'فشل إنشاء المنشور',
        description: error?.response?.data?.detail || error?.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!post?.id) return;
    try {
      setActionBusyKey(`delete-${post.id}`);
      await deleteAdminPost(post.id);
      pushToast({ title: 'تم حذف المنشور', type: 'success' });
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== post.id));
      loadPosts(pagination.page);
    } catch (error) {
      pushToast({ title: 'فشل حذف المنشور', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    try {
      setActionBusyKey('bulk-delete');
      await bulkDeleteAdminPosts(selectedIds);
      pushToast({ title: 'تم حذف المنشورات المحددة', description: `عدد العناصر: ${selectedIds.length}`, type: 'success' });
      setSelectedIds([]);
      loadPosts(pagination.page);
    } catch (error) {
      pushToast({ title: 'فشل الحذف الجماعي', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const openMediaReview = (post) => {
    setCurrentMedia(post);
    setMediaReviewOpen(true);
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card>
          <div className="filters-row wrap">
            <Input
              label="بحث"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث في المحتوى أو اسم المستخدم"
            />
            <label className="field select-field">
              <span className="field-label">الترتيب</span>
              <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="created_at">الأحدث</option>
                <option value="engagement">الأعلى تفاعلاً</option>
              </select>
            </label>
            <label className="field select-field">
              <span className="field-label">الاتجاه</span>
              <select className="input" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <div className="action-row wide">
            <Button onClick={openCreateModal}>منشور جديد</Button>
            <Button
              variant="secondary"
              className="danger"
              disabled={!selectedIds.length}
              loading={actionBusyKey === 'bulk-delete'}
              onClick={handleBulkDelete}
            >
              حذف المحدد
            </Button>
            <Button variant="secondary" onClick={() => loadPosts(pagination.page)} loading={loading}>تحديث</Button>
            <span className="muted">{selectedIds.length} عنصر محدد</span>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <div>
            <h3 className="section-title">إدارة المنشورات</h3>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              تم ربط الصفحة فقط بالعمليات المدعومة فعليًا من الخادم: عرض، إنشاء، تعديل، حذف، وحذف جماعي.
            </p>
          </div>
          <div className="pagination-row">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => loadPosts(pagination.page - 1)}>السابق</Button>
            <span>{pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => loadPosts(pagination.page + 1)}>التالي</Button>
          </div>
        </div>

        {loadError && !loading ? <ErrorState title="تعذر تحميل المنشورات" description={loadError} onRetry={() => loadPosts(pagination.page)} /> : null}

        {loading ? <TableSkeleton rows={6} /> : null}

        {!loading && !loadError && !posts.length ? (
          <EmptyState title="لا توجد منشورات" description="ابدأ بإنشاء منشور جديد من لوحة الإدارة." />
        ) : null}

        {!loading && !loadError && posts.length ? (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={posts.length > 0 && selectedIds.length === posts.length}
                      onChange={(event) => toggleAll(event.target.checked)}
                    />
                  </th>
                  <th>ID</th>
                  <th>الكاتب</th>
                  <th>المحتوى</th>
                  <th>التفاعل</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const likes = Number(post.likes ?? post.like_count ?? 0);
                  const comments = Number(post.comments ?? post.comment_count ?? 0);
                  return (
                    <tr key={post.id}>
                      <td>
                        <input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelected(post.id)} />
                      </td>
                      <td>#{post.id}</td>
                      <td>
                        <div className="user-cell">
                          <strong>{post.username || 'unknown'}</strong>
                          <span className="muted">UID: {post.user_id}</span>
                        </div>
                      </td>
                      <td>
                        <div className="content-preview">
                          <p>{post.content ? `${post.content.slice(0, 90)}${post.content.length > 90 ? '…' : ''}` : 'بدون نص'}</p>
                          {post.image_url ? <button className="media-badge" onClick={() => openMediaReview(post)}>معاينة الوسائط</button> : null}
                        </div>
                      </td>
                      <td>
                        <div className="stacked-metrics">
                          <span>إعجابات: {likes}</span>
                          <span>تعليقات: {comments}</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-row">
                          <button className="mini-action" onClick={() => openEditModal(post)}>تعديل</button>
                          <button className="mini-action danger" onClick={() => setDeleteTarget(post)}>حذف</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Modal open={formOpen} title={editingPost ? 'تعديل منشور' : 'منشور جديد'} onClose={resetForm}>
        <div className="stacked-form" style={{ display: 'grid', gap: 12 }}>
          <Input
            label="محتوى المنشور"
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="اكتب نص المنشور"
          />
          <Input
            label="رابط الصورة"
            value={form.image_url}
            onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
            placeholder="https://..."
          />
          <Input
            label="رقم المستخدم"
            value={form.user_id}
            onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value.replace(/[^0-9]/g, '') }))}
            placeholder="اختياري"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={resetForm}>إلغاء</Button>
            <Button onClick={handleSave} loading={saving}>{editingPost ? 'حفظ التعديل' : 'إنشاء المنشور'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} title="تأكيد حذف المنشور" onClose={() => setDeleteTarget(null)}>
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0 }}>
            هل تريد حذف المنشور رقم <strong>#{deleteTarget?.id}</strong> نهائيًا؟
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button className="danger" loading={actionBusyKey === `delete-${deleteTarget?.id || ''}`} onClick={() => handleDelete(deleteTarget)}>
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={mediaReviewOpen} title="معاينة الوسائط" onClose={() => setMediaReviewOpen(false)}>
        {currentMedia ? (
          <div className="media-review-container" style={{ display: 'grid', gap: 12 }}>
            <img src={currentMedia.image_url} alt="Post content" className="review-img" style={{ width: '100%', borderRadius: 14 }} />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setMediaReviewOpen(false)}>إغلاق</Button>
              <Button className="danger" onClick={() => { setMediaReviewOpen(false); setDeleteTarget(currentMedia); }}>حذف هذا المنشور</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
