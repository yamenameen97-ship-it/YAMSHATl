import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import {
  endAdminLiveRoom,
  featureAdminLiveRoom,
  getAdminLiveOverview,
  pinLatestAdminLiveComment,
} from '../../api/admin.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const fallbackData = {
  summary_cards: [],
  attention_queue: [],
  rooms: [],
  stats: {
    active_rooms: 0,
    featured_rooms: 0,
    current_viewers: 0,
    comments_count: 0,
    hearts_count: 0,
    top_peak_viewers: 0,
  },
  generated_at: null,
};

export default function AdminLive() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [workingRoomId, setWorkingRoomId] = useState('');
  const { pushToast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const response = await getAdminLiveOverview();
      setData({ ...fallbackData, ...(response.data || {}) });
    } catch (error) {
      pushToast({
        type: 'warning',
        title: 'تعذر تحميل لوحة البث',
        description: error?.response?.data?.detail || 'حاول التحديث مرة ثانية.',
      });
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer = null;
    const handleRefresh = () => load();
    const stopPolling = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const startPolling = () => {
      if (timer || socket.connected) return;
      timer = window.setInterval(handleRefresh, 20000);
    };

    load();
    socket.on('admin:live_updated', handleRefresh);
    socket.on('room_stats', handleRefresh);
    socket.on('new_comment', handleRefresh);
    socket.on('connect', handleRefresh);
    socket.on('connect', stopPolling);
    socket.on('disconnect', startPolling);
    if (!socket.connected) startPolling();
    return () => {
      stopPolling();
      socket.off('admin:live_updated', handleRefresh);
      socket.off('room_stats', handleRefresh);
      socket.off('new_comment', handleRefresh);
      socket.off('connect', handleRefresh);
      socket.off('connect', stopPolling);
      socket.off('disconnect', startPolling);
    };
  }, []);

  const generatedAt = useMemo(() => (
    data.generated_at ? new Date(data.generated_at).toLocaleString('ar-EG') : 'الآن'
  ), [data.generated_at]);

  const handleAction = async (roomId, action) => {
    try {
      setWorkingRoomId(String(roomId));
      if (action === 'feature') {
        const room = data.rooms.find((item) => String(item.id) === String(roomId));
        await featureAdminLiveRoom(roomId, !room?.featured);
      }
      if (action === 'pin') await pinLatestAdminLiveComment(roomId);
      if (action === 'end') await endAdminLiveRoom(roomId);
      await load();
      pushToast({ type: 'success', title: 'تم تنفيذ الإجراء', description: 'تم تحديث حالة غرفة البث بنجاح.' });
    } catch (error) {
      pushToast({
        type: 'warning',
        title: 'تعذر تنفيذ الإجراء',
        description: error?.response?.data?.detail || 'تحقق من حالة الغرفة ثم حاول مرة أخرى.',
      });
    } finally {
      setWorkingRoomId('');
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid">
        <Card className="hero-card admin-hero-card polished-hero-card">
          <div className="hero-card-topline">
            <span className="badge">Live Control Room</span>
            <span className="live-pill"><span className="status-dot live-dot" />مراقبة لحظية</span>
          </div>
          <h2>لوحة تحكم البث المباشر للمستخدم بشكل أقوى وأقرب للجاهزية</h2>
          <p>أضفت مركز متابعة حي يوضح عدد الغرف النشطة، الذروة، التعليقات المثبتة، والغرف المميزة مع أوامر سريعة لإنهاء البث أو إبراز غرفة أو تثبيت آخر تعليق.</p>
          <div className="hero-actions-wrap">
            <Button onClick={load}>{loading ? 'جارٍ التحديث...' : 'تحديث الآن'}</Button>
            <span className="glass-chip">آخر مزامنة: {generatedAt}</span>
          </div>
        </Card>

        <Card className="spotlight-card">
          <div className="card-head split">
            <h3 className="section-title">نبض البث الحي</h3>
            <span className="badge">Realtime</span>
          </div>
          <div className="dashboard-mini-summary">
            <div>
              <strong>{data.stats.active_rooms}</strong>
              <span>غرف نشطة</span>
            </div>
            <div>
              <strong>{data.stats.current_viewers}</strong>
              <span>مشاهدون الآن</span>
            </div>
            <div>
              <strong>{data.stats.top_peak_viewers}</strong>
              <span>أعلى ذروة</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="kpi-grid">
        {(data.summary_cards || []).map((item) => (
          <Card key={item.key} className="mini-stat stories-stat-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Card>
        ))}
      </section>

      <section className="analytics-grid">
        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">صف المراقبة السريعة</h3>
              <p className="muted no-margin">الغرف التي تحتاج تدخل أو متابعة مباشرة من الإدارة.</p>
            </div>
          </div>
          <div className="queue-grid">
            {(data.attention_queue || []).map((item) => (
              <div key={item.key} className="queue-card">
                <span className="queue-label">{item.title}</span>
                <strong>{item.featured ? 'مميّز' : 'قيد المتابعة'}</strong>
                <p>{item.description}</p>
                <div className="story-viewer-actions">
                  {item.featured ? <span className="glass-chip">Featured</span> : null}
                  {item.has_pinned_comment ? <span className="glass-chip">Pinned Comment</span> : null}
                </div>
              </div>
            ))}
            {!loading && data.attention_queue.length === 0 ? <div className="empty-state">لا توجد غرف مباشرة حالياً.</div> : null}
          </div>
        </Card>

        <Card>
          <div className="card-head split">
            <div>
              <h3 className="section-title">توصيات جاهزية</h3>
              <p className="muted no-margin">لمسات تساعد البث يبقى منظم وواضح للمستخدمين.</p>
            </div>
          </div>
          <div className="alert-stack enhanced">
            <div className="alert-card info">
              <strong>تمييز البث المهم</strong>
              <p>تقدر ترفع الغرف المهمة لأعلى القائمة عن طريق زر “تمييز” من نفس لوحة التحكم.</p>
            </div>
            <div className="alert-card success">
              <strong>تثبيت آخر تعليق</strong>
              <p>مفيد لتثبيت سؤال أو إعلان سريع داخل البث بدل ضياعه بين الرسائل.</p>
            </div>
            <div className="alert-card warning">
              <strong>إنهاء البث من الإدارة</strong>
              <p>لو البث توقف أو صار فيه خلل تقدر تقفله فوراً من لوحة الأدمن بدون انتظار المضيف.</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="section-card-block">
        <div className="card-head split">
          <div>
            <h3 className="section-title">كل الغرف المباشرة</h3>
            <p className="muted no-margin">عرض تفصيلي مع آخر نشاط، حالة التمييز، والتعليق المثبّت.</p>
          </div>
          <span className="badge">{data.rooms.length} غرفة</span>
        </div>

        <div className="notifications-group-stack">
          {(data.rooms || []).map((room) => (
            <Card key={room.id} className="notifications-list-card">
              <div className="notification-header-inline notifications-toolbar">
                <div>
                  <h3 className="section-title no-margin">{room.title}</h3>
                  <p className="muted">بواسطة {room.username} • بدأ {room.created_at ? new Date(room.created_at).toLocaleString('ar-EG') : 'الآن'}</p>
                </div>
                <div className="story-viewer-actions">
                  {room.featured ? <span className="glass-chip">مميّز</span> : null}
                  <span className="glass-chip">👀 {room.viewer_count}</span>
                  <span className="glass-chip">🔥 {room.peak_viewer_count}</span>
                  <span className="glass-chip">💬 {room.comments_count}</span>
                  <span className="glass-chip">❤️ {room.hearts_count}</span>
                </div>
              </div>

              <div className="integration-grid">
                <div className="integration-card linked">
                  <div className="integration-label-row"><strong>الحالة</strong><span className="glass-chip">{room.active ? 'مباشر' : 'منتهي'}</span></div>
                  <div className="integration-value">آخر نشاط: {room.last_activity_at ? new Date(room.last_activity_at).toLocaleString('ar-EG') : '—'}</div>
                  <p>المشاهدون الحاليون: {room.viewers_preview?.map((viewer) => viewer.username).join('، ') || 'لا يوجد'}.</p>
                </div>
                <div className="integration-card linked">
                  <div className="integration-label-row"><strong>التعليق المثبّت</strong><span className="glass-chip">{room.pinned_comment ? 'موجود' : 'غير موجود'}</span></div>
                  <div className="integration-value">{room.pinned_comment?.user || '—'}</div>
                  <p>{room.pinned_comment?.text || room.latest_comment_preview?.text || 'لا يوجد تعليق مناسب للتثبيت بعد.'}</p>
                </div>
              </div>

              <div className="hero-actions-wrap">
                <Button variant="secondary" onClick={() => handleAction(room.id, 'feature')} disabled={workingRoomId === String(room.id)}>
                  {room.featured ? 'إلغاء التمييز' : 'تمييز الغرفة'}
                </Button>
                <Button variant="secondary" onClick={() => handleAction(room.id, 'pin')} disabled={workingRoomId === String(room.id)}>
                  تثبيت آخر تعليق
                </Button>
                <Button onClick={() => handleAction(room.id, 'end')} disabled={workingRoomId === String(room.id)}>
                  إنهاء البث
                </Button>
              </div>
            </Card>
          ))}

          {!loading && data.rooms.length === 0 ? <div className="empty-state">حالياً ما فيش غرف بث شغالة.</div> : null}
        </div>
      </Card>
    </AdminLayout>
  );
}
