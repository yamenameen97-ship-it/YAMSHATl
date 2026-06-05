import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStreamViewers,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  removeViewer,
} from '../../services/api/correctedLiveStreamApi.js';
import { useToast } from '../admin/ToastProvider.jsx';
import '../../styles/viewers-management.css';

function Avatar({ name = '', size = 32 }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color,
        color: 'white',
        fontWeight: 900,
        fontSize: size / 2.5,
        flexShrink: 0,
      }}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function ViewersManagementPanel({
  streamId,
  hostId,
  onViewerCountChange,
}) {
  const { pushToast } = useToast();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, muted, banned
  const pollingStateRef = useRef({ inFlight: false, backoffUntil: 0 });

  // تحميل قائمة المشاهدين
  const loadViewers = useCallback(async () => {
    const state = pollingStateRef.current;
    if (!streamId || state.inFlight || Date.now() < state.backoffUntil) return;

    state.inFlight = true;
    setLoading(true);
    try {
      const response = await getStreamViewers(streamId);
      state.backoffUntil = 0;
      const viewersList = Array.isArray(response?.data) ? response.data : [];
      setViewers(viewersList);
      onViewerCountChange?.(viewersList.length);
    } catch (error) {
      if (Number(error?.response?.status) === 429) {
        const retryAfter = Number(error?.response?.headers?.['retry-after'] || error?.response?.data?.retry_after || 20);
        state.backoffUntil = Date.now() + (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 20000);
      }
      console.error('خطأ في تحميل المشاهدين:', error);
    } finally {
      state.inFlight = false;
      setLoading(false);
    }
  }, [streamId, onViewerCountChange]);

  // تحديث قائمة المشاهدين بإيقاع أهدأ مع backoff عند 429
  useEffect(() => {
    loadViewers();
    const interval = setInterval(loadViewers, 12000);
    return () => clearInterval(interval);
  }, [loadViewers]);

  // معالج كتم المستخدم
  const handleMuteUser = useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;

      try {
        await muteUser(streamId, viewer.user_id, hostId, 'من قبل المضيف', 5);
        
        setViewers(prev =>
          prev.map(v =>
            v.user_id === viewer.user_id ? { ...v, is_muted: true } : v
          )
        );

        pushToast?.({
          type: 'success',
          title: 'تم كتم الصوت',
          description: `تم كتم صوت ${viewer.username}`,
        });

        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: 'warning',
          title: 'خطأ في كتم الصوت',
          description: error?.response?.data?.message || 'حاول مرة أخرى',
        });
      }
    },
    [streamId, hostId, pushToast]
  );

  // معالج فك كتم المستخدم
  const handleUnmuteUser = useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;

      try {
        await unmuteUser(streamId, viewer.user_id);
        
        setViewers(prev =>
          prev.map(v =>
            v.user_id === viewer.user_id ? { ...v, is_muted: false } : v
          )
        );

        pushToast?.({
          type: 'success',
          title: 'تم رفع الكتم',
          description: `تم رفع كتم صوت ${viewer.username}`,
        });

        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: 'warning',
          title: 'خطأ في رفع الكتم',
          description: error?.response?.data?.message || 'حاول مرة أخرى',
        });
      }
    },
    [streamId, pushToast]
  );

  // معالج حظر المستخدم
  const handleBanUser = useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;

      if (!window.confirm(`هل أنت متأكد من حظر ${viewer.username}؟`)) return;

      try {
        await banUser(streamId, viewer.user_id, hostId, 'من قبل المضيف', 'temporary');
        
        setViewers(prev =>
          prev.map(v =>
            v.user_id === viewer.user_id ? { ...v, is_banned: true } : v
          )
        );

        pushToast?.({
          type: 'success',
          title: 'تم الحظر',
          description: `تم حظر ${viewer.username}`,
        });

        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: 'warning',
          title: 'خطأ في الحظر',
          description: error?.response?.data?.message || 'حاول مرة أخرى',
        });
      }
    },
    [streamId, hostId, pushToast]
  );

  // معالج رفع الحظر
  const handleUnbanUser = useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;

      try {
        await unbanUser(streamId, viewer.user_id);
        
        setViewers(prev =>
          prev.map(v =>
            v.user_id === viewer.user_id ? { ...v, is_banned: false } : v
          )
        );

        pushToast?.({
          type: 'success',
          title: 'تم رفع الحظر',
          description: `تم رفع حظر ${viewer.username}`,
        });

        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: 'warning',
          title: 'خطأ في رفع الحظر',
          description: error?.response?.data?.message || 'حاول مرة أخرى',
        });
      }
    },
    [streamId, pushToast]
  );

  // معالج إزالة المستخدم
  const handleRemoveViewer = useCallback(
    async (viewer) => {
      if (!streamId || !viewer.user_id) return;

      try {
        await removeViewer(streamId, viewer.user_id);
        
        setViewers(prev => prev.filter(v => v.user_id !== viewer.user_id));

        pushToast?.({
          type: 'success',
          title: 'تم الإزالة',
          description: `تم إزالة ${viewer.username}`,
        });

        setShowActionMenu(null);
      } catch (error) {
        pushToast?.({
          type: 'warning',
          title: 'خطأ في الإزالة',
          description: error?.response?.data?.message || 'حاول مرة أخرى',
        });
      }
    },
    [streamId, pushToast]
  );

  // تصفية المشاهدين
  const filteredViewers = viewers.filter(viewer => {
    if (filterStatus === 'muted') return viewer.is_muted;
    if (filterStatus === 'banned') return viewer.is_banned;
    return true;
  });

  return (
    <div className="viewers-management-panel" dir="rtl">
      <div className="vmp-header">
        <h3>إدارة المشاهدين</h3>
        <div className="vmp-header-stats">
          <span className="vmp-stat">
            👁 <strong>{viewers.length}</strong> مشاهد
          </span>
          {viewers.some(v => v.is_muted) && (
            <span className="vmp-stat vmp-stat-muted">
              🔇 {viewers.filter(v => v.is_muted).length} مكتوم
            </span>
          )}
          {viewers.some(v => v.is_banned) && (
            <span className="vmp-stat vmp-stat-banned">
              🚫 {viewers.filter(v => v.is_banned).length} محظور
            </span>
          )}
        </div>
      </div>

      <div className="vmp-filters">
        <button
          className={`vmp-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          الكل ({viewers.length})
        </button>
        <button
          className={`vmp-filter-btn ${filterStatus === 'muted' ? 'active' : ''}`}
          onClick={() => setFilterStatus('muted')}
        >
          مكتومون ({viewers.filter(v => v.is_muted).length})
        </button>
        <button
          className={`vmp-filter-btn ${filterStatus === 'banned' ? 'active' : ''}`}
          onClick={() => setFilterStatus('banned')}
        >
          محظورون ({viewers.filter(v => v.is_banned).length})
        </button>
      </div>

      <div className="vmp-viewers-list">
        {loading ? (
          <div className="vmp-loading">جاري التحميل...</div>
        ) : filteredViewers.length > 0 ? (
          filteredViewers.map((viewer) => (
            <div
              key={viewer.user_id}
              className={`vmp-viewer-item ${viewer.is_muted ? 'muted' : ''} ${
                viewer.is_banned ? 'banned' : ''
              }`}
            >
              <div className="vmp-viewer-info">
                <Avatar name={viewer.username} size={32} />
                <div className="vmp-viewer-details">
                  <div className="vmp-viewer-name">
                    {viewer.username}
                    {viewer.is_muted && <span className="vmp-badge muted">🔇 مكتوم</span>}
                    {viewer.is_banned && <span className="vmp-badge banned">🚫 محظور</span>}
                  </div>
                  <div className="vmp-viewer-stats">
                    💜 {viewer.hearts_sent || 0} | 🎁 {viewer.gifts_sent || 0} | 💬{' '}
                    {viewer.comments_count || 0}
                  </div>
                </div>
              </div>

              <div className="vmp-viewer-actions">
                <button
                  className="vmp-action-btn vmp-action-menu"
                  onClick={() =>
                    setShowActionMenu(
                      showActionMenu === viewer.user_id ? null : viewer.user_id
                    )
                  }
                  title="المزيد من الخيارات"
                >
                  ⋮
                </button>

                {showActionMenu === viewer.user_id && (
                  <div className="vmp-action-menu-dropdown">
                    {!viewer.is_muted ? (
                      <button
                        className="vmp-menu-item vmp-menu-mute"
                        onClick={() => handleMuteUser(viewer)}
                      >
                        🔇 كتم الصوت
                      </button>
                    ) : (
                      <button
                        className="vmp-menu-item vmp-menu-unmute"
                        onClick={() => handleUnmuteUser(viewer)}
                      >
                        🔊 رفع الكتم
                      </button>
                    )}

                    {!viewer.is_banned ? (
                      <button
                        className="vmp-menu-item vmp-menu-ban"
                        onClick={() => handleBanUser(viewer)}
                      >
                        🚫 حظر
                      </button>
                    ) : (
                      <button
                        className="vmp-menu-item vmp-menu-unban"
                        onClick={() => handleUnbanUser(viewer)}
                      >
                        ✅ رفع الحظر
                      </button>
                    )}

                    <button
                      className="vmp-menu-item vmp-menu-remove"
                      onClick={() => handleRemoveViewer(viewer)}
                    >
                      ❌ إزالة
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="vmp-empty">
            {filterStatus === 'all'
              ? 'لا يوجد مشاهدون حالياً'
              : 'لا توجد نتائج'}
          </div>
        )}
      </div>
    </div>
  );
}
