import { useState, useEffect, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AdminPosts() {
  const [posts, setPosts] = useState([
    { 
      id: 1, 
      author: 'user_1', 
      content: 'هذا منشور تجريبي للمراجعة', 
      aiScore: 0.1, 
      status: 'approved', 
      flags: 0,
      createdAt: '2024-05-10 14:20',
      archived: false,
      reviewed: true,
      reviewedBy: 'admin_1',
      reviewedAt: '2024-05-10 14:25'
    },
    { 
      id: 2, 
      author: 'spammer_99', 
      content: 'اربح المال بسرعة من خلال هذا الرابط...', 
      aiScore: 0.95, 
      status: 'auto-blocked', 
      flags: 3,
      createdAt: '2024-05-10 13:50',
      archived: false,
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null
    },
    { 
      id: 3, 
      author: 'user_42', 
      content: 'محتوى قد يحتوي على كلمات غير لائقة', 
      aiScore: 0.72, 
      status: 'pending', 
      flags: 1,
      createdAt: '2024-05-10 12:30',
      archived: false,
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null
    },
    { 
      id: 4, 
      author: 'user_5', 
      content: 'منشور عادي بدون مشاكل', 
      aiScore: 0.05, 
      status: 'approved', 
      flags: 0,
      createdAt: '2024-05-09 18:00',
      archived: false,
      reviewed: true,
      reviewedBy: 'admin_2',
      reviewedAt: '2024-05-09 18:10'
    },
    { 
      id: 5, 
      author: 'user_8', 
      content: 'محتوى قديم تم أرشفته', 
      aiScore: 0.15, 
      status: 'approved', 
      flags: 0,
      createdAt: '2024-04-01 10:00',
      archived: true,
      reviewed: true,
      reviewedBy: 'admin_1',
      reviewedAt: '2024-04-01 10:15'
    }
  ]);

  const [autoModeration, setAutoModeration] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterArchived, setFilterArchived] = useState('active');
  const [bulkActionModal, setBulkActionModal] = useState(null);
  const [bulkAction, setBulkAction] = useState('approve');

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesArchived = filterArchived === 'all' || (filterArchived === 'active' ? !p.archived : p.archived);
      return matchesStatus && matchesArchived;
    });
  }, [posts, filterStatus, filterArchived]);

  const handleSelectPost = (postId) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  };

  const handleAIScan = (postId) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, status: 'scanning...' } 
        : p
    ));
    setTimeout(() => {
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              status: 'ai-reviewed', 
              aiScore: Math.random().toFixed(2),
              reviewed: true,
              reviewedBy: 'ai_system',
              reviewedAt: new Date().toLocaleString('ar-EG')
            } 
          : p
      ));
    }, 1500);
  };

  const handlePostAction = (postId, action) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? {
            ...p,
            status: action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'flagged',
            reviewed: true,
            reviewedBy: 'current_admin',
            reviewedAt: new Date().toLocaleString('ar-EG')
          }
        : p
    ));
  };

  const handleBulkAction = () => {
    setPosts(prev => prev.map(p => 
      selectedPosts.has(p.id)
        ? {
            ...p,
            status: bulkAction === 'approve' ? 'approved' : bulkAction === 'block' ? 'blocked' : bulkAction === 'archive' ? p.status : p.status,
            archived: bulkAction === 'archive' ? true : p.archived,
            reviewed: true,
            reviewedBy: 'current_admin',
            reviewedAt: new Date().toLocaleString('ar-EG')
          }
        : p
    ));
    setSelectedPosts(new Set());
    setBulkActionModal(null);
  };

  const handleDeletePosts = () => {
    setPosts(prev => prev.filter(p => !selectedPosts.has(p.id)));
    setSelectedPosts(new Set());
    setBulkActionModal(null);
  };

  const handleArchivePost = (postId) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, archived: !p.archived }
        : p
    ));
  };

  const handleShadowBan = (postId) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, status: 'shadow-banned' }
        : p
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      'approved': '#10b981',
      'blocked': '#ef4444',
      'flagged': '#f59e0b',
      'auto-blocked': '#ef4444',
      'pending': '#3b82f6',
      'shadow-banned': '#8b5cf6',
      'scanning': '#64748b'
    };
    return colors[status] || '#64748b';
  };

  const postStats = useMemo(() => ({
    total: posts.length,
    approved: posts.filter(p => p.status === 'approved').length,
    blocked: posts.filter(p => p.status === 'blocked' || p.status === 'auto-blocked').length,
    pending: posts.filter(p => p.status === 'pending').length,
    archived: posts.filter(p => p.archived).length,
    flagged: posts.filter(p => p.flags > 0).length
  }), [posts]);

  return (
    <div className="admin-posts-page">
      <Card className="moderation-controls">
        <div className="flex-between">
          <div>
            <h2>إدارة المحتوى والمنشورات</h2>
            <p className="muted">التحكم في المنشورات، مراجعة قبل النشر، فلترة المحتوى المسيء، والأرشفة.</p>
          </div>
          <div className="automation-toggle">
            <label className="switch-label">
              <span>الأتمتة الذكية:</span>
              <button 
                className={`toggle-btn ${autoModeration ? 'on' : 'off'}`}
                onClick={() => setAutoModeration(!autoModeration)}
              >
                {autoModeration ? 'مفعلة' : 'معطلة'}
              </button>
            </label>
          </div>
        </div>

        <div className="rules-grid mt-4">
          <div className="rule-chip">حظر تلقائي (AI > 0.9)</div>
          <div className="rule-chip">تبليغ تلقائي (AI > 0.7)</div>
          <div className="rule-chip">كلمات محظورة (Regex)</div>
          <div className="rule-chip">روابط مريبة</div>
        </div>
      </Card>

      <Card className="posts-stats-card mt-4">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{postStats.total}</div>
            <div className="stat-label">إجمالي المنشورات</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#10b981' }}>{postStats.approved}</div>
            <div className="stat-label">موافق عليها</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#ef4444' }}>{postStats.blocked}</div>
            <div className="stat-label">محظورة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#3b82f6' }}>{postStats.pending}</div>
            <div className="stat-label">قيد المراجعة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#8b5cf6' }}>{postStats.archived}</div>
            <div className="stat-label">مؤرشفة</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{postStats.flagged}</div>
            <div className="stat-label">مبلغ عنها</div>
          </div>
        </div>
      </Card>

      <Card className="posts-filters-card mt-4">
        <div className="filters-row">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="approved">موافق عليها</option>
            <option value="blocked">محظورة</option>
            <option value="auto-blocked">محظورة تلقائياً</option>
            <option value="pending">قيد المراجعة</option>
            <option value="shadow-banned">مخفية</option>
          </select>
          <select 
            value={filterArchived} 
            onChange={(e) => setFilterArchived(e.target.value)}
            className="filter-select"
          >
            <option value="active">منشورات نشطة</option>
            <option value="archived">منشورات مؤرشفة</option>
            <option value="all">الكل</option>
          </select>
        </div>
      </Card>

      {selectedPosts.size > 0 && (
        <Card className="bulk-actions-card mt-4">
          <div className="bulk-header">
            <span>تم تحديد {selectedPosts.size} منشور</span>
            <div className="bulk-buttons">
              <Button 
                size="small" 
                variant="primary" 
                onClick={() => { setBulkAction('approve'); setBulkActionModal('confirm'); }}
              >
                الموافقة على الجميع
              </Button>
              <Button 
                size="small" 
                variant="warning" 
                onClick={() => { setBulkAction('archive'); setBulkActionModal('confirm'); }}
              >
                أرشفة الجميع
              </Button>
              <Button 
                size="small" 
                variant="danger" 
                onClick={() => setBulkActionModal('delete')}
              >
                حذف الجميع
              </Button>
              <Button 
                size="small" 
                variant="secondary" 
                onClick={() => setSelectedPosts(new Set())}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="posts-moderation-grid mt-4">
        <Card className="select-all-card">
          <div className="select-all-row">
            <input 
              type="checkbox" 
              checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
              onChange={handleSelectAll}
              className="select-checkbox"
            />
            <span>تحديد الكل ({filteredPosts.length})</span>
          </div>
        </Card>

        {filteredPosts.map(post => (
          <Card key={post.id} className={`post-mod-card post-mod-${post.status}`}>
            <div className="post-checkbox-row">
              <input 
                type="checkbox" 
                checked={selectedPosts.has(post.id)}
                onChange={() => handleSelectPost(post.id)}
                className="select-checkbox"
              />
              <div className="post-mod-header">
                <span className="author">@{post.author}</span>
                <div className={`ai-score-badge ${post.aiScore > 0.7 ? 'danger' : 'safe'}`}>
                  AI: {(post.aiScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div className="post-content-preview">{post.content}</div>
            
            <div className="post-meta">
              <span className="meta-item">📅 {post.createdAt}</span>
              {post.reviewed && (
                <span className="meta-item">✓ تمت المراجعة بواسطة {post.reviewedBy} في {post.reviewedAt}</span>
              )}
              {post.archived && (
                <span className="meta-item" style={{ color: '#8b5cf6' }}>📦 مؤرشفة</span>
              )}
            </div>

            <div className="post-mod-footer">
              <div className="status-info">
                <span className="status-label" style={{ color: getStatusColor(post.status) }}>
                  الحالة: {post.status}
                </span>
                {post.flags > 0 && <span className="flags-count">🚩 {post.flags} بلاغات</span>}
              </div>
              <div className="actions">
                <Button size="small" variant="secondary" onClick={() => handleAIScan(post.id)}>فحص AI</Button>
                {post.status !== 'approved' && (
                  <Button size="small" variant="primary" onClick={() => handlePostAction(post.id, 'approve')}>موافقة</Button>
                )}
                {post.status !== 'blocked' && (
                  <Button size="small" variant="danger" onClick={() => handlePostAction(post.id, 'block')}>حظر</Button>
                )}
                {!post.archived && (
                  <Button size="small" variant="warning" onClick={() => handleArchivePost(post.id)}>أرشفة</Button>
                )}
                {post.status !== 'shadow-banned' && (
                  <Button size="small" variant="secondary" onClick={() => handleShadowBan(post.id)}>إخفاء</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bulk Action Confirmation Modal */}
      {bulkActionModal === 'confirm' && (
        <Card className="modal-overlay">
          <div className="modal-content">
            <h3>تأكيد الإجراء الجماعي</h3>
            <p>
              هل تريد {bulkAction === 'approve' ? 'الموافقة على' : 'أرشفة'} {selectedPosts.size} منشور؟
            </p>
            <div className="modal-buttons">
              <Button variant="primary" onClick={handleBulkAction}>تأكيد</Button>
              <Button variant="secondary" onClick={() => setBulkActionModal(null)}>إلغاء</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {bulkActionModal === 'delete' && (
        <Card className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ تأكيد الحذف</h3>
            <p>هل أنت متأكد من حذف {selectedPosts.size} منشور؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="modal-buttons">
              <Button variant="danger" onClick={handleDeletePosts}>حذف نهائي</Button>
              <Button variant="secondary" onClick={() => setBulkActionModal(null)}>إلغاء</Button>
            </div>
          </div>
        </Card>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-posts-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .switch-label { display: flex; align-items: center; gap: 10px; font-weight: bold; }
        .toggle-btn { padding: 5px 15px; border-radius: 20px; border: none; cursor: pointer; transition: all 0.3s; }
        .toggle-btn.on { background: #10b981; color: white; }
        .toggle-btn.off { background: #94a3b8; color: white; }
        
        .rules-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .rule-chip { background: #f1f5f9; padding: 4px 12px; border-radius: 15px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0; }
        
        .posts-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 20px; font-weight: bold; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
        
        .posts-filters-card { padding: 16px; }
        .filters-row { display: flex; gap: 12px; }
        .filter-select { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .bulk-actions-card { padding: 16px; background: #eff6ff; border-left: 4px solid #3b82f6; }
        .bulk-header { display: flex; justify-content: space-between; align-items: center; }
        .bulk-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .posts-moderation-grid { display: grid; gap: 12px; }
        .select-all-card { padding: 12px; background: #f8fafc; }
        .select-all-row { display: flex; align-items: center; gap: 12px; font-weight: bold; }
        .select-checkbox { width: 18px; height: 18px; cursor: pointer; }
        
        .post-mod-card { padding: 16px; border-left: 4px solid #e2e8f0; }
        .post-mod-card.post-mod-approved { border-left-color: #10b981; background: #f0fdf4; }
        .post-mod-card.post-mod-blocked { border-left-color: #ef4444; background: #fef2f2; }
        .post-mod-card.post-mod-auto-blocked { border-left-color: #ef4444; background: #fef2f2; }
        .post-mod-card.post-mod-pending { border-left-color: #3b82f6; background: #eff6ff; }
        .post-mod-card.post-mod-shadow-banned { border-left-color: #8b5cf6; background: #faf5ff; }
        
        .post-checkbox-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .post-mod-header { display: flex; justify-content: space-between; align-items: center; flex: 1; }
        .author { font-weight: bold; color: #3b82f6; }
        .ai-score-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
        .ai-score-badge.danger { background: #fee2e2; color: #991b1b; }
        .ai-score-badge.safe { background: #dcfce7; color: #166534; }
        
        .post-content-preview { font-size: 14px; margin: 12px 0; color: #334155; padding: 8px; background: rgba(0,0,0,0.02); border-radius: 4px; }
        
        .post-meta { display: flex; gap: 12px; font-size: 11px; color: #64748b; margin: 8px 0; flex-wrap: wrap; }
        .meta-item { padding: 2px 6px; background: rgba(0,0,0,0.03); border-radius: 3px; }
        
        .post-mod-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .status-info { display: flex; gap: 15px; font-size: 12px; }
        .flags-count { color: #ef4444; font-weight: bold; }
        .actions { display: flex; gap: 6px; flex-wrap: wrap; }
        
        .modal-overlay { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; }
        .modal-content { padding: 24px; background: white; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); min-width: 300px; }
        .modal-content h3 { margin: 0 0 12px 0; }
        .modal-content p { margin: 0 0 16px 0; color: #64748b; }
        .modal-buttons { display: flex; gap: 8px; }
      `}} />
    </div>
  );
}
