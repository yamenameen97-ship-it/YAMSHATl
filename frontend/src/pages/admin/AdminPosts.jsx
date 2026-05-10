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
  moderatePostAI,
  bulkUpdatePostStatus,
  toggleShadowBan
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
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionBusyKey, setActionBusyKey] = useState('');
  const [mediaReviewOpen, setMediaReviewOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);
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

  const handleAIModeration = async (postId) => {
    try {
      setActionBusyKey(`ai-${postId}`);
      const { data } = await moderatePostAI(postId);
      pushToast({ 
        title: 'AI Moderation Complete', 
        description: `Score: ${data.score}. Status: ${data.flagged ? 'Flagged' : 'Clean'}`, 
        type: data.flagged ? 'warning' : 'success' 
      });
      loadPosts();
    } catch (error) {
      pushToast({ title: 'AI Moderation Failed', description: 'Could not process request', type: 'error' });
    } finally {
      setActionBusyKey('');
    }
  };

  const handleShadowBan = async (userId) => {
    try {
      await toggleShadowBan(userId, true);
      pushToast({ title: 'User Shadow Banned', description: `User ID: ${userId}`, type: 'warning' });
    } catch (error) {
      pushToast({ title: 'Action Failed', description: 'Could not shadow ban user', type: 'error' });
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) return;
    try {
      setActionBusyKey('bulk-action');
      await bulkUpdatePostStatus(selectedIds, action);
      pushToast({ title: 'Bulk Action Success', description: `Applied ${action} to ${selectedIds.length} posts`, type: 'success' });
      setSelectedIds([]);
      loadPosts();
    } catch (error) {
      pushToast({ title: 'Bulk Action Failed', type: 'error' });
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
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المحتوى أو اسم المستخدم" />
            <label className="field select-field"><span className="field-label">Sorting</span><select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="created_at">الأحدث</option><option value="engagement">التفاعل</option></select></label>
            <label className="field select-field"><span className="field-label">Direction</span><select className="input" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}><option value="desc">تنازلي</option><option value="asc">تصاعدي</option></select></label>
          </div>
        </Card>
        <Card>
          <div className="action-row wide">
            <Button onClick={() => setOpen(true)}>منشور جديد</Button>
            <div className="bulk-actions-group">
              <Button variant="secondary" disabled={!selectedIds.length} onClick={() => handleBulkAction('approve')}>Approve All</Button>
              <Button variant="secondary" className="danger" disabled={!selectedIds.length} onClick={() => handleBulkAction('delete')}>Delete All</Button>
            </div>
            <Button variant="secondary" onClick={() => loadPosts(pagination.page)} loading={loading}>Refresh</Button>
            <span className="muted">{selectedIds.length} items selected</span>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <h3 className="section-title">Post Moderation & AI Control</h3>
          <div className="pagination-row">
            <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => loadPosts(pagination.page - 1)}>السابق</Button>
            <span>{pagination.page} / {pagination.pages}</span>
            <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => loadPosts(pagination.page + 1)}>التالي</Button>
          </div>
        </div>

        {loading ? <TableSkeleton rows={6} /> : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? posts.map(p => p.id) : [])} /></th>
                  <th>ID</th>
                  <th>Author</th>
                  <th>Content & Media</th>
                  <th>AI Flag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td><input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelected(post.id)} /></td>
                    <td>#{post.id}</td>
                    <td>
                      <div className="user-cell">
                        <span>{post.username}</span>
                        <button className="text-link tiny" onClick={() => handleShadowBan(post.user_id)}>Shadow Ban</button>
                      </div>
                    </td>
                    <td>
                      <div className="content-preview">
                        <p>{post.content?.slice(0, 50)}...</p>
                        {post.image_url && <button className="media-badge" onClick={() => openMediaReview(post)}>Review Media</button>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${post.ai_flagged ? 'danger' : 'success'}`}>
                        {post.ai_flagged ? 'Auto-Flagged' : 'Clean'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="mini-action" onClick={() => handleAIModeration(post.id)}>AI Scan</button>
                        <button className="mini-action danger" onClick={() => setDeleteTarget(post)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={mediaReviewOpen} title="Media Review" onClose={() => setMediaReviewOpen(false)}>
        {currentMedia && (
          <div className="media-review-container">
            <img src={currentMedia.image_url} alt="Post content" className="review-img" />
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setMediaReviewOpen(false)}>Close</Button>
              <Button className="danger" onClick={() => { handleBulkAction('delete'); setMediaReviewOpen(false); }}>Flag & Remove</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Existing Create/Edit and Delete Modals... */}
    </AdminLayout>
  );
}
