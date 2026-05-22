import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import {
  endAdminLiveRoom,
  featureAdminLiveRoom,
  getAdminLiveOverview,
  pinLatestAdminLiveComment,
} from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

function statusBadgeClass(status = '') {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'live' || normalized === 'ready') return 'success';
  if (normalized === 'ended') return 'danger';
  return 'warning';
}

export default function AdminLive() {
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [busyKey, setBusyKey] = useState('');
  const { pushToast } = useToast();

  const loadLiveStatus = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminLiveOverview();
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
      setStats(data?.stats || {});
    } catch (error) {
      pushToast({
        title: 'تعذر تحميل حالة البث',
        description: error?.response?.data?.detail || error?.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveStatus();

    const syncLive = () => loadLiveStatus();
    socket.on('admin:live_updated', syncLive);
    socket.on('stream_metrics_update', syncLive);

    return () => {
      socket.off('admin:live_updated', syncLive);
      socket.off('stream_metrics_update', syncLive);
    };
  }, []);

  const handleEmergencyStop = async (roomId) => {
    if (!window.confirm('تأكيد إنهاء هذا البث؟')) return;
    try {
      setBusyKey(`end-${roomId}`);
      await endAdminLiveRoom(roomId);
      pushToast({ title: 'تم إنهاء البث', description: `تم إيقاف الغرفة ${roomId}`, type: 'success' });
      if (selectedRoom?.id === roomId) setSelectedRoom(null);
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: 'فشل إنهاء البث', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  const handleFeatureToggle = async (room) => {
    try {
      setBusyKey(`feature-${room.id}`);
      await featureAdminLiveRoom(room.id, !room.featured);
      pushToast({
        title: room.featured ? 'تم إلغاء تمييز الغرفة' : 'تم تمييز الغرفة',
        description: room.title,
        type: 'success',
      });
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: 'فشل تحديث حالة التمييز', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  const handlePinLatest = async (roomId) => {
    try {
      setBusyKey(`pin-${roomId}`);
      await pinLatestAdminLiveComment(roomId);
      pushToast({ title: 'تم تثبيت آخر تعليق', type: 'success' });
      loadLiveStatus();
    } catch (error) {
      pushToast({ title: 'تعذر تثبيت التعليق', description: error?.response?.data?.detail || error?.message, type: 'error' });
    } finally {
      setBusyKey('');
    }
  };

  return (
    <AdminLayout>
      <section className="live-monitoring-header">
        <Card className="metrics-bar">
          <div className="metric-item">
            <span className="label">الغرف النشطة</span>
            <span className="value">{stats.active_rooms || 0}</span>
          </div>
          <div className="metric-item">
            <span className="label">المشاهدون الآن</span>
            <span className="value">{stats.current_viewers || 0}</span>
          </div>
          <div className="metric-item">
            <span className="label">القلوب</span>
            <span className="value">{stats.hearts_count || 0}</span>
          </div>
          <div className="metric-item">
            <span className="label">أعلى ذروة</span>
            <span className="value">{stats.top_peak_viewers || 0}</span>
          </div>
        </Card>
      </section>

      <section className="streams-grid">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">إدارة البث المباشر</h3>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                تم ربط اللوحة بالحقول والعمليات الفعلية الراجعة من الخادم بدل القيم غير الموجودة.
              </p>
            </div>
            <Button variant="secondary" onClick={loadLiveStatus} loading={loading}>تحديث</Button>
          </div>

          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المضيف</th>
                  <th>العنوان</th>
                  <th>المشاهدون</th>
                  <th>التعليقات</th>
                  <th>القلوب</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length ? rooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.username || room.host || 'unknown'}</td>
                    <td>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong>{room.title}</strong>
                        <span className="muted">{room.featured ? 'غرفة مميزة' : 'غرفة عادية'}</span>
                      </div>
                    </td>
                    <td>{room.viewer_count || 0}</td>
                    <td>{room.comments_count || 0}</td>
                    <td>{room.hearts_count || 0}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(room.stream_status)}`}>
                        {room.stream_status || (room.active ? 'live' : 'unknown')}
                      </span>
                    </td>
                    <td>
                      <div className="action-row" style={{ flexWrap: 'wrap' }}>
                        <button className="mini-action" onClick={() => setSelectedRoom(room)}>مراقبة</button>
                        <button className="mini-action" onClick={() => handleFeatureToggle(room)} disabled={busyKey === `feature-${room.id}`}>
                          {room.featured ? 'إلغاء التمييز' : 'تمييز'}
                        </button>
                        <button className="mini-action" onClick={() => handlePinLatest(room.id)} disabled={busyKey === `pin-${room.id}`}>
                          تثبيت آخر تعليق
                        </button>
                        <button className="mini-action danger" onClick={() => handleEmergencyStop(room.id)} disabled={busyKey === `end-${room.id}`}>
                          إنهاء البث
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 24 }}>
                      {loading ? 'جارٍ تحميل الغرف...' : 'لا توجد غرف بث نشطة الآن.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Modal open={!!selectedRoom} title="تفاصيل غرفة البث" onClose={() => setSelectedRoom(null)}>
        {selectedRoom ? (
          <div className="stream-mod-container" style={{ display: 'grid', gap: 14 }}>
            <div className="stream-preview-placeholder" style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }}>
              <div className="overlay-metrics" style={{ display: 'grid', gap: 8 }}>
                <span>المعرف: {selectedRoom.id}</span>
                <span>العنوان: {selectedRoom.title}</span>
                <span>المضيف: {selectedRoom.username || selectedRoom.host}</span>
                <span>المشاهدون الحاليون: {selectedRoom.viewer_count || 0}</span>
                <span>ذروة المشاهدة: {selectedRoom.peak_viewer_count || 0}</span>
                <span>التعليقات: {selectedRoom.comments_count || 0}</span>
                <span>القلوب: {selectedRoom.hearts_count || 0}</span>
                <span>التسجيل: {selectedRoom.recording?.status || 'idle'}</span>
                <span>الحالة: {selectedRoom.stream_status || 'unknown'}</span>
              </div>
            </div>

            <div className="mod-controls" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => handleFeatureToggle(selectedRoom)}>
                {selectedRoom.featured ? 'إلغاء تمييز الغرفة' : 'تمييز الغرفة'}
              </Button>
              <Button variant="secondary" onClick={() => handlePinLatest(selectedRoom.id)}>تثبيت آخر تعليق</Button>
              <Button className="danger" onClick={() => handleEmergencyStop(selectedRoom.id)}>إنهاء البث</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
