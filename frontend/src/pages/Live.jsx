import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  addLiveComment,
  createLiveRoom,
  endLiveRoom,
  getLiveComments,
  getLiveRoom,
  getLiveRooms,
  sendLiveGift,
  updateLiveRecording,
} from '../api/live.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';

const GIFTS = [
  { id: 1, icon: '🌹', name: 'وردة', amount: 10 },
  { id: 2, icon: '☕', name: 'قهوة', amount: 50 },
  { id: 3, icon: '❤️', name: 'قلب', amount: 100 },
  { id: 4, icon: '👑', name: 'تاج', amount: 500 },
];

function buildFallbackThumbnail(room) {
  const text = encodeURIComponent(room?.title || room?.username || 'Yamshat Live');
  return `https://placehold.co/900x560/0f172a/ffffff?text=${text}`;
}

export default function Live() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const isHost = activeRoom?.username && activeRoom.username === currentUser;

  const loadRooms = async (preferRoomId) => {
    setLoading(true);
    try {
      const { data } = await getLiveRooms();
      const nextRooms = Array.isArray(data) ? data : [];
      setRooms(nextRooms);
      const selected = preferRoomId
        ? nextRooms.find((room) => String(room.id) === String(preferRoomId))
        : activeRoom
          ? nextRooms.find((room) => String(room.id) === String(activeRoom.id))
          : nextRooms[0];
      setActiveRoom(selected || null);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل البثوث', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoomDetails = async (roomId) => {
    if (!roomId) return;
    try {
      const [{ data: room }, { data: roomComments }] = await Promise.all([
        getLiveRoom(roomId),
        getLiveComments(roomId),
      ]);
      setActiveRoom(room || null);
      setComments(Array.isArray(roomComments) ? roomComments : []);
      setIsRecording(Boolean(room?.recording_enabled));
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل تفاصيل البث', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!activeRoom?.id) {
      setComments([]);
      return undefined;
    }

    loadRoomDetails(activeRoom.id);
    socketManager.connect?.();
    socketManager.emit?.('join_live', { room_id: activeRoom.id, role: isHost ? 'host' : 'viewer' });

    const handleComment = (payload) => {
      if (!payload || String(payload.room_id) !== String(activeRoom.id)) return;
      setComments((prev) => [...prev, payload]);
    };

    const handleStats = (payload) => {
      if (!payload || String(payload.room_id) !== String(activeRoom.id)) return;
      setActiveRoom((prev) => prev ? {
        ...prev,
        viewer_count: payload.viewer_count ?? prev.viewer_count,
        hearts_count: payload.hearts_count ?? prev.hearts_count,
      } : prev);
    };

    socketManager.on?.('new_comment', handleComment);
    socketManager.on?.('room_stats', handleStats);

    return () => {
      socketManager.emit?.('leave_live', { room_id: activeRoom.id });
      socketManager.off?.('new_comment', handleComment);
      socketManager.off?.('room_stats', handleStats);
    };
  }, [activeRoom?.id, isHost]);

  const stats = useMemo(() => ({
    viewers: Number(activeRoom?.viewer_count || 0),
    hearts: Number(activeRoom?.hearts_count || 0),
    gifts: Number(activeRoom?.economy?.total_coins || 0),
  }), [activeRoom]);

  const handleCreateRoom = async () => {
    try {
      setBusy('create');
      const { data } = await createLiveRoom({ title: `بث ${currentUser || 'Yamshat'}` });
      await loadRooms(data?.id);
      pushToast({ type: 'success', title: 'تم بدء البث', description: 'واجهة البث الجديدة مرتبطة بنفس خدمة إنشاء الغرف.' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر بدء البث', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  const handleEndRoom = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy('end');
      await endLiveRoom(activeRoom.id);
      setActiveRoom(null);
      setComments([]);
      await loadRooms();
      pushToast({ type: 'success', title: 'تم إنهاء البث' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إنهاء البث', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  const handleRecording = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy('recording');
      const action = isRecording ? 'stop' : 'start';
      await updateLiveRecording({ room_id: activeRoom.id, action });
      setIsRecording((prev) => !prev);
      pushToast({ type: 'success', title: isRecording ? 'تم إيقاف التسجيل' : 'تم تشغيل التسجيل' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث التسجيل', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  const handleGift = async (gift) => {
    if (!activeRoom?.id) return;
    try {
      setBusy(`gift-${gift.id}`);
      await sendLiveGift({ room_id: activeRoom.id, gift_id: gift.id, amount: gift.amount });
      pushToast({ type: 'success', title: `تم إرسال ${gift.name}` });
      setShowGifts(false);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال الهدية', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!activeRoom?.id || !commentText.trim()) return;
    try {
      setBusy('comment');
      const payload = { room_id: activeRoom.id, text: commentText.trim() };
      const { data } = await addLiveComment(payload);
      if (data) {
        setComments((prev) => [...prev, data]);
      }
      setCommentText('');
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال التعليق', description: error?.response?.data?.detail || error?.message || 'حاول مرة أخرى.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge live" style={{ marginBottom: 12 }}>🔴 بث مباشر</div>
              <h1 className="yam-section-title">واجهة البث الجديدة</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0' }}>
                تم استبدال صفحة البث بتصميم أحدث مع الحفاظ على إنشاء الغرف، التعليقات، الهدايا، وإنهاء البث والتسجيل.
              </p>
            </div>
            <div className="yam-action-row">
              <Button variant="secondary" onClick={() => loadRooms(activeRoom?.id)} loading={loading}>تحديث</Button>
              <Button onClick={handleCreateRoom} loading={busy === 'create'}>بدء بث</Button>
            </div>
          </div>
        </div>

        <div className="yam-grid-main">
          <div className="yam-grid">
            <div className="yam-card" style={{ padding: 18 }}>
              <div className="yam-media-frame" style={{ position: 'relative' }}>
                {activeRoom ? (
                  <>
                    <img
                      src={activeRoom.thumbnail_url || activeRoom.cover_url || buildFallbackThumbnail(activeRoom)}
                      alt={activeRoom.title || 'live room'}
                      style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', opacity: 0.92 }}
                    />
                    <div className="yam-overlay">
                      <div className="yam-action-row" style={{ marginBottom: 10 }}>
                        <span className="yam-badge live">LIVE</span>
                        <span className="yam-badge">👥 {stats.viewers}</span>
                        <span className="yam-badge">❤️ {stats.hearts}</span>
                        <span className="yam-badge">💰 {stats.gifts}</span>
                      </div>
                      <h2 style={{ margin: '0 0 8px' }}>{activeRoom.title || 'بث مباشر'}</h2>
                      <div className="yam-meta">المضيف: @{activeRoom.username || 'unknown'}</div>
                    </div>
                  </>
                ) : (
                  <div className="yam-empty-state" style={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>📺</div>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>لا يوجد بث محدد الآن</div>
                      <div className="yam-empty-copy">اختر بثاً من القائمة الجانبية أو ابدأ بثاً جديداً.</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="yam-stat-grid" style={{ marginTop: 18 }}>
                <div className="yam-stat"><strong>{rooms.length}</strong><span className="yam-meta">غرف متاحة</span></div>
                <div className="yam-stat"><strong>{stats.viewers}</strong><span className="yam-meta">مشاهدون الآن</span></div>
                <div className="yam-stat"><strong>{comments.length}</strong><span className="yam-meta">تعليقات الجلسة</span></div>
                <div className="yam-stat"><strong>{isRecording ? 'ON' : 'OFF'}</strong><span className="yam-meta">التسجيل</span></div>
              </div>

              <div className="yam-action-row" style={{ marginTop: 18 }}>
                <Button variant="secondary" onClick={() => setShowGifts(true)} disabled={!activeRoom}>إرسال هدية</Button>
                <Button variant="secondary" onClick={handleRecording} disabled={!activeRoom || !isHost} loading={busy === 'recording'}>
                  {isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                </Button>
                <Button variant="danger" onClick={handleEndRoom} disabled={!activeRoom || !isHost} loading={busy === 'end'}>إنهاء البث</Button>
              </div>
            </div>

            <div className="yam-card">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>الدردشة المباشرة</h3>
                <span className="yam-badge primary">{comments.length} رسالة</span>
              </div>
              <div className="yam-messages" style={{ maxHeight: 360 }}>
                {comments.length ? comments.map((comment) => (
                  <div key={comment.id || `${comment.username}-${comment.created_at}`} className={`yam-message ${comment.username === currentUser ? 'me' : 'peer'}`}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>@{comment.username || 'user'}</div>
                    <div>{comment.text || comment.content || 'تعليق'}</div>
                    <div className="yam-meta" style={{ fontSize: 12, marginTop: 8 }}>
                      {comment.created_at ? new Date(comment.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                    </div>
                  </div>
                )) : <div className="yam-empty-copy">لا توجد تعليقات بعد على هذا البث.</div>}
              </div>

              <form onSubmit={handleCommentSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <textarea
                  className="yam-textarea"
                  placeholder="اكتب تعليقك المباشر..."
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  disabled={!activeRoom}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={busy === 'comment'} disabled={!activeRoom || !commentText.trim()}>
                    إرسال التعليق
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <aside className="yam-sidebar-stack">
            <div className="yam-card">
              <div className="yam-toolbar">
                <h3 style={{ margin: 0 }}>البثوث الحالية</h3>
                <span className="yam-badge">{rooms.length}</span>
              </div>
              <div className="yam-live-grid" style={{ gridTemplateColumns: '1fr' }}>
                {loading ? <div className="yam-empty-copy">جارٍ التحميل...</div> : rooms.length ? rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={`yam-live-card ${activeRoom?.id === room.id ? 'active' : ''}`}
                    style={{ textAlign: 'inherit', cursor: 'pointer', padding: 0 }}
                    onClick={() => setActiveRoom(room)}
                  >
                    <img src={room.thumbnail_url || room.cover_url || buildFallbackThumbnail(room)} alt={room.title || 'room'} />
                    <div className="yam-overlay">
                      <div className="yam-action-row" style={{ marginBottom: 8 }}>
                        <span className="yam-badge live">LIVE</span>
                        <span className="yam-badge">👥 {room.viewer_count || 0}</span>
                      </div>
                      <strong>{room.title || 'بث مباشر'}</strong>
                      <div className="yam-meta">@{room.username || 'user'}</div>
                    </div>
                  </button>
                )) : <div className="yam-empty-copy">لا توجد غرف بث متاحة حالياً.</div>}
              </div>
            </div>
          </aside>
        </div>

        <Modal open={showGifts} onClose={() => setShowGifts(false)} title="إرسال هدية" size="medium">
          <div className="yam-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {GIFTS.map((gift) => (
              <button
                key={gift.id}
                type="button"
                className="yam-card"
                style={{ cursor: 'pointer', textAlign: 'center' }}
                onClick={() => handleGift(gift)}
              >
                <div style={{ fontSize: 42, marginBottom: 10 }}>{gift.icon}</div>
                <strong style={{ display: 'block', marginBottom: 6 }}>{gift.name}</strong>
                <div className="yam-meta">{gift.amount} coins</div>
              </button>
            ))}
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
