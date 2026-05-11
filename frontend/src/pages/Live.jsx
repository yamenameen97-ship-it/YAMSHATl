import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { createLiveRoom, endLiveRoom, getLiveComments, getLiveRoom, getLiveRooms, sendLiveGift, updateLiveRecording } from '../api/live.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب', icon: '❤️', price: 100 },
  { id: 4, name: 'سيارة', icon: '🚗', price: 1000 },
  { id: 5, name: 'تاج', icon: '👑', price: 5000 }
];

export default function Live() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const { data } = await getLiveRooms();
      const nextRooms = Array.isArray(data) ? data : [];
      setRooms(nextRooms);
      if (!activeRoom && nextRooms.length) {
        setActiveRoom(nextRooms[0]);
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحميل البثوث', description: err?.response?.data?.detail || err?.message });
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
      setActiveRoom(room);
      setComments(Array.isArray(roomComments) ? roomComments : []);
    } catch (err) {
      pushToast({ type: 'error', title: 'تعذر تحميل تفاصيل البث', description: err?.response?.data?.detail || err?.message });
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!activeRoom?.id) return undefined;

    loadRoomDetails(activeRoom.id);
    socketManager.connect();
    socketManager.emit('join_live', { room_id: activeRoom.id, role: activeRoom.username === currentUser ? 'host' : 'viewer' });

    const handleComment = (payload) => {
      if (!payload || payload.room_id !== activeRoom.id) return;
      setComments((prev) => [...prev, payload]);
    };

    const handleStats = (payload) => {
      if (payload?.room_id !== activeRoom.id) return;
      setActiveRoom((prev) => prev ? { ...prev, viewer_count: payload.viewer_count, hearts_count: payload.hearts_count } : prev);
    };

    socketManager.on('new_comment', handleComment);
    socketManager.on('room_stats', handleStats);

    return () => {
      socketManager.emit('leave_live', { room_id: activeRoom.id });
      socketManager.off('new_comment', handleComment);
      socketManager.off('room_stats', handleStats);
    };
  }, [activeRoom?.id, currentUser]);

  const isHost = activeRoom?.username === currentUser;

  const analytics = useMemo(() => {
    const stream = activeRoom?.stream_analytics || {};
    const economy = activeRoom?.economy || {};
    return {
      views: Number(activeRoom?.viewer_count || 0),
      hearts: Number(activeRoom?.hearts_count || 0),
      bitrate: Number(stream?.bitrate_kbps || 0),
      packetLoss: Number(stream?.packet_loss_percent || 0),
      coins: Number(economy?.total_coins || 0),
    };
  }, [activeRoom]);

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#000', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161616' }}>
          {loading ? <div style={{ color: 'white' }}>جارٍ تحميل البث...</div> : null}
          {!loading && !activeRoom ? <div style={{ color: 'white' }}>لا يوجد بث مباشر حالياً.</div> : null}

          {activeRoom ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, #222, #111)' }}>
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: 80 }}>🎥</div>
                  <div style={{ fontWeight: 'bold', fontSize: 24 }}>{activeRoom.title || 'بث مباشر'}</div>
                  <div style={{ opacity: 0.8 }}>المضيف: {activeRoom.username}</div>
                </div>
              </div>

              <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ background: '#ff4444', padding: '4px 12px', borderRadius: 4, fontWeight: 'bold', fontSize: 12 }}>LIVE</div>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4, fontSize: 12 }}>👁️ {activeRoom.viewer_count || 0}</div>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 4, fontSize: 12, color: '#44ff44' }}>❤️ {activeRoom.hearts_count || 0}</div>
              </div>

              <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="small" onClick={loadRooms} loading={loading}>تحديث</Button>
                <Button variant="secondary" size="small" onClick={() => setShowAnalytics(true)} disabled={!activeRoom}>التحليلات</Button>
                {isHost ? (
                  <>
                    <Button variant="secondary" size="small" onClick={async () => {
                      try {
                        setBusy('recording');
                        const action = isRecording ? 'stop' : 'start';
                        await updateLiveRecording({ room_id: activeRoom.id, action });
                        setIsRecording((prev) => !prev);
                      } catch (err) {
                        pushToast({ type: 'error', title: 'تعذر تحديث التسجيل', description: err?.response?.data?.detail || err?.message });
                      } finally {
                        setBusy('');
                      }
                    }} loading={busy === 'recording'}>{isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}</Button>
                    <Button variant="danger" size="small" onClick={async () => {
                      try {
                        setBusy('end-live');
                        await endLiveRoom(activeRoom.id);
                        pushToast({ type: 'success', title: 'تم إنهاء البث' });
                        setActiveRoom(null);
                        setComments([]);
                        await loadRooms();
                      } catch (err) {
                        pushToast({ type: 'error', title: 'تعذر إنهاء البث', description: err?.response?.data?.detail || err?.message });
                      } finally {
                        setBusy('');
                      }
                    }} loading={busy === 'end-live'}>إنهاء البث</Button>
                  </>
                ) : null}
              </div>

              <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 15 }}>
                <button onClick={() => setShowGifts(true)} style={{ background: 'gold', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, cursor: 'pointer' }}>🎁</button>
                <button onClick={() => activeRoom && socketManager.emit('send_heart', { room_id: activeRoom.id })} style={{ background: '#ff4d6d', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, cursor: 'pointer', color: '#fff' }}>❤️</button>
                {!isHost ? null : (
                  <button onClick={async () => {
                    try {
                      setBusy('create-live');
                      const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
                      setActiveRoom(data);
                      await loadRooms();
                    } catch (err) {
                      pushToast({ type: 'error', title: 'تعذر إنشاء البث', description: err?.response?.data?.detail || err?.message });
                    } finally {
                      setBusy('');
                    }
                  }} style={{ background: 'var(--primary)', border: 'none', width: 50, height: 50, borderRadius: '50%', fontSize: 24, color: 'white', cursor: 'pointer' }}>➕</button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ width: 360, background: 'rgba(0,0,0,0.86)', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 15, borderBottom: '1px solid #333', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>الدردشة المباشرة</span>
            {!activeRoom && currentUser ? (
              <Button size="small" onClick={async () => {
                try {
                  setBusy('create-live');
                  const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
                  setActiveRoom(data);
                  pushToast({ type: 'success', title: 'تم إنشاء غرفة البث' });
                  await loadRooms();
                } catch (err) {
                  pushToast({ type: 'error', title: 'تعذر إنشاء غرفة البث', description: err?.response?.data?.detail || err?.message });
                } finally {
                  setBusy('');
                }
              }} loading={busy === 'create-live'}>بدء بث</Button>
            ) : null}
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'grid', gap: 8 }}>
            {rooms.length ? rooms.map((room) => (
              <Card key={room.id} style={{ padding: 12, cursor: 'pointer', border: activeRoom?.id === room.id ? '1px solid var(--primary)' : undefined }} onClick={() => setActiveRoom(room)}>
                <div style={{ fontWeight: 'bold' }}>{room.title || 'بث مباشر'}</div>
                <div className="muted">{room.username} · {room.viewer_count || 0} مشاهد</div>
              </Card>
            )) : <div style={{ color: '#bbb' }}>لا توجد غرف متاحة الآن.</div>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map((comment) => (
              <div key={comment.id || `${comment.user}-${comment.text}-${Math.random()}`} style={{ fontSize: 14 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginLeft: 8 }}>{comment.user || comment.username}:</span>
                <span>{comment.text}</span>
              </div>
            ))}
            {!comments.length ? <div style={{ color: '#999' }}>ابدأ التفاعل داخل البث.</div> : null}
          </div>

          <div style={{ padding: 15, borderTop: '1px solid #333', display: 'grid', gap: 10 }}>
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="اكتب تعليقاً..." style={{ width: '100%', background: '#222', border: 'none', padding: '10px 15px', borderRadius: 20, color: 'white' }} />
            <Button onClick={() => {
              if (!activeRoom?.id || !commentText.trim()) return;
              socketManager.emit('send_comment', { room_id: activeRoom.id, text: commentText.trim() });
              setCommentText('');
            }} disabled={!activeRoom || !commentText.trim()}>إرسال التعليق</Button>
          </div>
        </div>
      </div>

      <Modal open={showGifts} onClose={() => setShowGifts(false)} title="أرسل هدية للمضيف">
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
          {GIFTS.map((gift) => (
            <div key={gift.id} onClick={async () => {
              if (!activeRoom?.id) return;
              try {
                await sendLiveGift({ room_id: activeRoom.id, gift_name: gift.name, coins: gift.price });
                pushToast({ type: 'success', title: `تم إرسال ${gift.name} ${gift.icon}` });
                setShowGifts(false);
              } catch (err) {
                pushToast({ type: 'error', title: 'تعذر إرسال الهدية', description: err?.response?.data?.detail || err?.message });
              }
            }} style={{ textAlign: 'center', padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{gift.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>{gift.name}</div>
              <div style={{ color: 'gold', fontSize: 12 }}>{gift.price} عملة</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={showAnalytics} onClose={() => setShowAnalytics(false)} title="إحصائيات البث المباشر">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{analytics.views}</div>
              <div className="muted">المشاهدات الحالية</div>
            </Card>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'gold' }}>{analytics.coins}</div>
              <div className="muted">إجمالي العملات</div>
            </Card>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d6d' }}>{analytics.hearts}</div>
              <div className="muted">القلوب</div>
            </Card>
            <Card style={{ padding: 15, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#7dd3fc' }}>{analytics.bitrate}</div>
              <div className="muted">Bitrate kbps</div>
            </Card>
          </div>
          <div className="muted">Packet loss: {analytics.packetLoss}%</div>
        </div>
      </Modal>
    </MainLayout>
  );
}
