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
  deleteAdminComment,
  getAdminPostComments,
  getAdminPosts,
  getAdminReports,
  toggleHideAdminComment,
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

  // v88.44 — Comment management state
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentActionBusy, setCommentActionBusy] = useState('');
  const [commentsIncludeHidden, setCommentsIncludeHidden] = useState(true);

  // v88.44 — Reports linked to posts
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [reportsForPost, setReportsForPost] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

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

  // ============================================================
  // v88.44 — Comment Management Functions
  // ============================================================
  const openCommentsModal = async (post) => {
    setCommentsPost(post);
    setCommentsModalOpen(true);
    await loadPostComments(post.id);
  };

  const loadPostComments = async (postId, includeHidden = commentsIncludeHidden) => {
    try {
      setCommentsLoading(true);
      setCommentsError('');
      const { data } = await getAdminPostComments(postId, { include_hidden: includeHidden, page_size: 200 });
      setComments(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      const message = error?.response?.data?.detail || 'حدث خطأ أثناء تحميل التعليقات.';
      setCommentsError(message);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!comment?.id) return;
    try {
      setCommentActionBusy(`delete-${comment.id}`);
      await deleteAdminComment(comment.id);
      pushToast({ title: 'تم حذف التعليق', type: 'success' });
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      // Refresh post list to update comment count
      loadPosts(pagination.page);
    } catch (error) {
      pushToast({ title: 'فشل حذف التعليق', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setCommentActionBusy('');
    }
  };

  const handleToggleHideComment = async (comment) => {
    if (!comment?.id) return;
    const newHidden = !comment.is_hidden;
    try {
      setCommentActionBusy(`hide-${comment.id}`);
      await toggleHideAdminComment(comment.id, newHidden);
      pushToast({ title: newHidden ? 'تم إخفاء التعليق' : 'تم إظهار التعليق', type: 'success' });
      setComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, is_hidden: newHidden } : c));
    } catch (error) {
      pushToast({ title: 'فشل تحديث حالة التعليق', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setCommentActionBusy('');
    }
  };

  // ============================================================
  // v88.44 — Reports linked to post
  // ============================================================
  const openReportsModal = async (post) => {
    setReportsModalOpen(true);
    setReportsForPost([]);
    setReportsLoading(true);
    try {
      const { data } = await getAdminReports({ target_type: 'post', search: String(post.id), page_size: 50 });
      // Filter to only reports targeting this specific post
      const allReports = Array.isArray(data?.items) ? data.items : [];
      const matching = allReports.filter((r) => String(r.target_id) === String(post.id));
      setReportsForPost(matching);
    } catch (error) {
      pushToast({ title: 'تعذر تحميل البلاغات', description: error?.response?.data?.detail || error?.message, type: 'error' });
      setReportsForPost([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
    setCommentsPost(null);
    setComments([]);
    setCommentsError('');
  };

  const closeReportsModal = () => {
    setReportsModalOpen(false);
    setReportsForPost([]);
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '--';
    try {
      return new Date(isoStr).toLocaleString('ar-EG');
    } catch {
      return isoStr;
    }
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
                          <button className="mini-action" onClick={() => openCommentsModal(post)} title="عرض وحذف التعليقات">
                            💬 تعليقات{comments > 0 ? ` (${comments})` : ''}
                          </button>
                          <button className="mini-action" onClick={() => openReportsModal(post)} title="البلاغات المرتبطة بهذا المنشور">
                            🚩 بلاغات
                          </button>
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

      {/* ============================================================ */}
      {/* v88.44 — Comments Management Modal                           */}
      {/* ============================================================ */}
      <Modal open={commentsModalOpen} title={commentsPost ? `تعليقات المنشور #${commentsPost.id}` : 'التعليقات'} onClose={closeCommentsModal}>
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {commentsPost ? (
            <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(59,130,246,0.08)' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>محتوى المنشور:</div>
              <div style={{ fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {commentsPost.content ? commentsPost.content.slice(0, 200) : 'بدون نص'}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={commentsIncludeHidden}
                onChange={(e) => {
                  setCommentsIncludeHidden(e.target.checked);
                  if (commentsPost) loadPostComments(commentsPost.id, e.target.checked);
                }}
              />
              إظهار التعليقات المخفية
            </label>
            <Button variant="secondary" size="small" onClick={() => commentsPost && loadPostComments(commentsPost.id)} loading={commentsLoading}>
              تحديث
            </Button>
          </div>

          {commentsLoading ? <div className="muted" style={{ textAlign: 'center', padding: 24 }}>جاري تحميل التعليقات…</div> : null}

          {commentsError ? (
            <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#ef4444', fontSize: 13 }}>{commentsError}</div>
          ) : null}

          {!commentsLoading && !commentsError && !comments.length ? (
            <div className="muted" style={{ textAlign: 'center', padding: 24 }}>لا توجد تعليقات على هذا المنشور.</div>
          ) : null}

          {!commentsLoading && !commentsError && comments.length ? (
            <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: comment.is_hidden ? '#faf5ff' : '#f8fafc',
                    opacity: comment.is_hidden ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div>
                      <strong style={{ color: '#3b82f6' }}>@{comment.username}</strong>
                      <span className="muted" style={{ marginRight: 8, fontSize: 12 }}>#{comment.id} • UID: {comment.user_id}</span>
                      {comment.is_hidden ? (
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: '#fef3c7', color: '#92400e', marginRight: 6 }}>مخفي</span>
                      ) : null}
                      {comment.is_pinned ? (
                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: '#dbeafe', color: '#1e40af', marginRight: 6 }}>📌 مثبّت</span>
                      ) : null}
                    </div>
                    <span className="muted" style={{ fontSize: 11 }}>{formatDateTime(comment.created_at)}</span>
                  </div>

                  <div style={{ fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 8 }}>
                    {comment.content || 'بدون محتوى'}
                  </div>

                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    <span>👍 {comment.likes_count || 0}</span>
                    <span>💬 {comment.replies_count || 0} ردود</span>
                    {comment.parent_id ? <span>↳ رد على #{comment.parent_id}</span> : null}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="mini-action"
                      onClick={() => handleToggleHideComment(comment)}
                      disabled={commentActionBusy === `hide-${comment.id}`}
                    >
                      {comment.is_hidden ? '👁️ إظهار' : '🚫 إخفاء'}
                    </button>
                    <button
                      className="mini-action danger"
                      onClick={() => handleDeleteComment(comment)}
                      disabled={commentActionBusy === `delete-${comment.id}`}
                    >
                      🗑️ حذف التعليق
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <Button variant="secondary" onClick={closeCommentsModal}>إغلاق</Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* v88.44 — Reports linked to post Modal                        */}
      {/* ============================================================ */}
      <Modal open={reportsModalOpen} title="البلاغات المرتبطة بالمنشور" onClose={closeReportsModal}>
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {reportsLoading ? <div className="muted" style={{ textAlign: 'center', padding: 24 }}>جاري تحميل البلاغات…</div> : null}

          {!reportsLoading && !reportsForPost.length ? (
            <div className="muted" style={{ textAlign: 'center', padding: 24 }}>لا توجد بلاغات على هذا المنشور.</div>
          ) : null}

          {!reportsLoading && reportsForPost.length ? (
            <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {reportsForPost.map((report) => (
                <div key={report.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <div>
                      <strong>بلاغ #{report.id}</strong>
                      <span style={{ marginRight: 8, padding: '2px 8px', borderRadius: 999, fontSize: 11, background: '#fee2e2', color: '#991b1b' }}>
                        {report.reason_label || report.reason}
                      </span>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, background: '#dbeafe', color: '#1e40af' }}>{report.status}</span>
                  </div>
                  {report.details ? (
                    <div style={{ fontSize: 13, color: '#334155', marginBottom: 6 }}>{report.details}</div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                    {report.reporter ? <span>المبلّغ: @{report.reporter.username}</span> : null}
                    {report.target_owner ? <span>صاحب المحتوى: @{report.target_owner.username}</span> : null}
                    {report.priority ? <span>الأولوية: {report.priority}</span> : null}
                    {report.duplicate_count > 0 ? <span>تكرار: {report.duplicate_count}</span> : null}
                    <span>{formatDateTime(report.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <Button variant="secondary" onClick={closeReportsModal}>إغلاق</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
