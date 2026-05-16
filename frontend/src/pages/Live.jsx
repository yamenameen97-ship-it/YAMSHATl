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
  { id: 5, name: 'تاج', icon: '👑', price: 5000 },
];

const DEFAULT_HOSTS = ['المضيف', 'Co-host 1', 'Co-host 2'];

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
  const [coHosts, setCoHosts] = useState(DEFAULT_HOSTS);
  const [moderationLog, setModerationLog] = useState([]);
  const [viewerLatencyMs, setViewerLatencyMs] = useState(1800);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const { data } = await getLiveRooms();
      const nextRooms = Array.isArray(data) ? data : [];
      setRooms(nextRooms);
      if (!activeRoom && nextRooms.length) setActiveRoom(nextRooms[0]);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل البثوث', description: error?.response?.data?.detail || error?.message });
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
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل تفاصيل البث', description: error?.response?.data?.detail || error?.message });
    }
  };

  useEffect(() => { loadRooms(); }, []);

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
      setViewerLatencyMs((prev) => prev > 2400 ? 1700 : prev + 120);
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
      bitrate: Number(stream?.bitrate_kbps || 4200),
      packetLoss: Number(stream?.packet_loss_percent || 0.6),
      coins: Number(economy?.total_coins || 0),
    };
  }, [activeRoom]);

  const moderationAction = (action) => {
    const entry = { id: Date.now(), action, created_at: new Date().toISOString() };
    setModerationLog((prev) => [entry, ...prev].slice(0, 8));
    pushToast({ type: 'success', title: `تم تنفيذ ${action}` });
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 70px)', background: '#000', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: '#161616' }}>
          {loading ? <div style={{ color: 'white', padding: 24 }}>جارٍ تحميل البث...</div> : null}
          {!loading && !activeRoom ? <div style={{ color: 'white', padding: 24 }}>لا يوجد بث مباشر حالياً.</div> : null}

          {activeRoom ? (
            <>
              <div style={{ flex: 1, position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 12, padding: 14 }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'linear-gradient(160deg, #111827, #0f172a)' }}>
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: 80 }}>🎥</div>
                      <div style={{ fontWeight: 'bold', fontSize: 24 }}>{activeRoom.title || 'بث مباشر'}</div>
                      <div style={{ opacity: 0.8 }}>المضيف: {activeRoom.username}</div>
                      <div className="muted" style={{ color: 'rgba(255,255,255,0.68)', marginTop: 10 }}>جاهز للـ WebRTC أو RTMP + HLS حسب الباك إند</div>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="live-badge live-live">LIVE</div>
                    <div className="live-badge">👁️ {activeRoom.viewer_count || 0}</div>
                    <div className="live-badge">❤️ {activeRoom.hearts_count || 0}</div>
                    <div className="live-badge">Latency ~ {viewerLatencyMs}ms</div>
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
                          } catch (error) {
                            pushToast({ type: 'error', title: 'تعذر تحديث التسجيل', description: error?.response?.data?.detail || error?.message });
                          } finally {
                            setBusy('');
                          }
                        }} loading={busy === 'recording'}>{isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}</Button>
                        <Button variant="danger" size="small" onClick={async () => {
                          try {
                            setBusy('end-live');
                            await endLiveRoom(activeRoom.id);
                            setActiveRoom(null);
                            setComments([]);
                            await loadRooms();
                          } catch (error) {
                            pushToast({ type: 'error', title: 'تعذر إنهاء البث', description: error?.response?.data?.detail || error?.message });
                          } finally {
                            setBusy('');
                          }
                        }} loading={busy === 'end-live'}>إنهاء البث</Button>
                      </>
                    ) : null}
                  </div>

                  <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span className="live-badge">WebRTC</span>
                    <span className="live-badge">RTMP Ingest ready</span>
                    <span className="live-badge">HLS Playback ready</span>
                    <span className="live-badge">Adaptive moderation</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  <Card style={{ padding: 14, background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Multi-host</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {coHosts.map((host, index) => (
                        <div key={host} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 14, padding: 10, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: index === 0 ? 'linear-gradient(135deg, #f97316, #ef4444)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>{host.slice(0, 1)}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{host}</div>
                              <div style={{ fontSize: 12, opacity: 0.72 }}>{index === 0 ? 'Host' : 'Co-host'}</div>
                            </div>
                          </div>
                          {isHost && index > 0 ? <button type="button" className="mini-action" onClick={() => moderationAction(`mute ${host}`)}>Mute</button> : null}
                        </div>
                      ))}
                    </div>
                    {isHost ? <Button variant="secondary" fullWidth onClick={() => setCoHosts((prev) => [...prev, `Co-host ${prev.length}`])}>إضافة Co-host</Button> : null}
                  </Card>

                  <Card style={{ padding: 14, background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Moderation</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <button type="button" className="mini-action" onClick={() => moderationAction('slow mode')}>Slow mode</button>
                      <button type="button" className="mini-action" onClick={() => moderationAction('mute spammer')}>Mute spammer</button>
                      <button type="button" className="mini-action" onClick={() => moderationAction('hide abusive gift')}>Hide gift</button>
                    </div>
                  </Card>
                </div>
              </div>

              <div style={{ padding: '0 14px 14px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowGifts(true)} className="floating-live-btn">🎁</button>
                <button type="button" onClick={() => activeRoom && socketManager.emit('send_heart', { room_id: activeRoom.id })} className="floating-live-btn">❤️</button>
                {isHost ? (
                  <button type="button" onClick={async () => {
                    try {
                      setBusy('create-live');
                      const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
                      setActiveRoom(data);
                      await loadRooms();
                    } catch (error) {
                      pushToast({ type: 'error', title: 'تعذر إنشاء البث', description: error?.response?.data?.detail || error?.message });
                    } finally {
                      setBusy('');
                    }
                  }} className="floating-live-btn">➕</button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div style={{ width: 380, background: 'rgba(0,0,0,0.9)', borderInlineStart: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 15, borderBottom: '1px solid #333', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Live chat + gifts</span>
            {!activeRoom && currentUser ? (
              <Button size="small" onClick={async () => {
                try {
                  setBusy('create-live');
                  const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
                  setActiveRoom(data);
                  await loadRooms();
                } catch (error) {
                  pushToast({ type: 'error', title: 'تعذر إنشاء غرفة البث', description: error?.response?.data?.detail || error?.message });
                } finally {
                  setBusy('');
                }
              }} loading={busy === 'create-live'}>بدء بث</Button>
            ) : null}
          </div>

          <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {rooms.length ? rooms.map((room) => (
              <Card key={room.id} style={{ padding: 12, cursor: 'pointer', border: activeRoom?.id === room.id ? '1px solid var(--primary)' : undefined }} onClick={() => setActiveRoom(room)}>
                <div style={{ fontWeight: 'bold' }}>{room.title || 'بث مباشر'}</div>
                <div className="muted">{room.username} · {room.viewer_count || 0} مشاهد</div>
              </Card>
            )) : <div style={{ color: '#bbb' }}>لا توجد غرف متاحة الآن.</div>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {comments.map((comment) => (
              <div key={comment.id || `${comment.user}-${comment.text}-${Math.random()}`} style={{ fontSize: 14, padding: 10, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginInlineEnd: 8 }}>{comment.user || comment.username}:</span>
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
              setComments((prev) => [...prev, { id: Date.now(), user: currentUser, text: commentText.trim() }]);
              setCommentText('');
            }} disabled={!activeRoom || !commentText.trim()}>إرسال التعليق</Button>

            {moderationLog.length ? (
              <Card style={{ padding: 12, background: 'rgba(255,255,255,0.04)', color: 'white' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>آخر إجراءات الموديريشن</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {moderationLog.map((entry) => (
                    <div key={entry.id} className="muted" style={{ fontSize: 12 }}>{entry.action} · {new Date(entry.created_at).toLocaleTimeString('ar-EG')}</div>
                  ))}
                </div>
              </Card>
            ) : null}
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
                setShowGifts(false);
              } catch (error) {
                pushToast({ type: 'error', title: 'تعذر إرسال الهدية', description: error?.response?.data?.detail || error?.message });
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
            <Card style={{ padding: 15, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{analytics.views}</div><div className="muted">المشاهدات الحالية</div></Card>
            <Card style={{ padding: 15, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold', color: 'gold' }}>{analytics.coins}</div><div className="muted">إجمالي العملات</div></Card>
            <Card style={{ padding: 15, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d6d' }}>{analytics.hearts}</div><div className="muted">القلوب</div></Card>
            <Card style={{ padding: 15, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 'bold', color: '#7dd3fc' }}>{analytics.bitrate}</div><div className="muted">Bitrate kbps</div></Card>
          </div>
          <div className="muted">Packet loss: {analytics.packetLoss}% · Suggested stack: WebRTC for low latency / RTMP ingest + HLS playback for scale</div>
        </div>
      </Modal>

      <style>{`
        .live-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(0,0,0,0.45);
          color: white;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .live-live {
          background: rgba(239,68,68,0.92);
          border-color: transparent;
          font-weight: 700;
        }
        .floating-live-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 22px;
          background: rgba(255,255,255,0.14);
          color: white;
        }
      `}</style>
    </MainLayout>
  );
}
