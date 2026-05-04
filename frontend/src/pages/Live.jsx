import { useEffect, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import socket from '../api/socket.js';
import {
  createLiveRoom,
  endLiveRoom,
  getLiveComments,
  getLiveRooms,
  getLiveToken,
  updateLivePresence,
} from '../api/live.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';

const livekitCache = { module: null };

async function loadLiveKit() {
  if (!livekitCache.module) {
    livekitCache.module = await import('livekit-client');
  }
  return livekitCache.module;
}

function ensureSocketConnected() {
  if (socket.connected && socket.id) {
    return Promise.resolve(socket.id);
  }

  return new Promise((resolve) => {
    const handleConnect = () => {
      socket.off('connect', handleConnect);
      resolve(socket.id || '');
    };

    socket.on('connect', handleConnect);
    socket.connect();
  });
}

export default function Live() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const roomRef = useRef(null);
  const videosRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('بث مباشر جديد');
  const [viewerCount, setViewerCount] = useState(0);
  const [heartsCount, setHeartsCount] = useState(0);
  const [status, setStatus] = useState('يمكنك إنشاء بث جديد أو الانضمام إلى بث قائم.');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const refreshRooms = async () => {
    try {
      const { data } = await getLiveRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUser });

    const handleRoomStats = ({ room_id, viewer_count, hearts_count }) => {
      if (String(room_id) !== String(activeRoomIdRef.current)) return;
      if (typeof viewer_count === 'number') setViewerCount(viewer_count);
      if (typeof hearts_count === 'number') setHeartsCount(hearts_count);
    };

    const handleComment = (payload) => {
      if (String(payload?.room_id || activeRoomIdRef.current) !== String(activeRoomIdRef.current)) return;
      setComments((prev) => [...prev, payload]);
    };

    const handleHeart = ({ count }) => setHeartsCount(Number(count || 0));

    socket.on('room_stats', handleRoomStats);
    socket.on('new_comment', handleComment);
    socket.on('new_heart', handleHeart);

    return () => {
      socket.off('room_stats', handleRoomStats);
      socket.off('new_comment', handleComment);
      socket.off('new_heart', handleHeart);
    };
  }, [currentUser, token]);

  const clearVideoContainer = () => {
    if (videosRef.current) {
      videosRef.current.innerHTML = '';
    }
  };

  const attachVideoTrack = (track, participantLabel) => {
    if (!videosRef.current || track.kind !== 'video') return;
    const wrapper = document.createElement('div');
    wrapper.className = 'live-video-tile';

    const label = document.createElement('div');
    label.className = 'live-video-label';
    label.textContent = participantLabel;

    const element = track.attach();
    element.className = 'live-video-element';
    element.setAttribute('playsinline', 'true');
    element.autoplay = true;

    wrapper.appendChild(element);
    wrapper.appendChild(label);
    videosRef.current.appendChild(wrapper);
  };

  const disconnectRoom = async () => {
    try {
      if (activeRoomIdRef.current) {
        const socketId = await ensureSocketConnected();
        socket.emit('leave_live', { token, room_id: String(activeRoomIdRef.current) });
        await updateLivePresence({
          room_id: activeRoomIdRef.current,
          socket_id: socketId,
          platform: 'web',
          device_type: 'browser',
          is_host: activeRoom?.role === 'host',
          active: false,
        });
      }
    } catch {
      // ignore presence errors on disconnect
    }

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    clearVideoContainer();
    activeRoomIdRef.current = null;
    setActiveRoom(null);
    setViewerCount(0);
    setHeartsCount(0);
    setComments([]);
  };

  const connectToLiveKit = async (session, role) => {
    if (!session?.token || !session?.livekit_url) {
      setStatus('تم الدخول إلى غرفة البث، لكن LiveKit غير مفعّل حالياً. فعّل مفاتيح LiveKit في الباك-إند لعرض الفيديو.');
      return;
    }

    const { connect, RoomEvent } = await loadLiveKit();
    const room = await connect(session.livekit_url, session.token);
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      attachVideoTrack(track, participant.identity);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((element) => element.remove());
    });

    if (role === 'host') {
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);
      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track) attachVideoTrack(publication.track, `${currentUser} (Host)`);
      });
    }

    room.participants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) attachVideoTrack(publication.track, participant.identity);
      });
    });

    setStatus('تم الاتصال بالبث المباشر بنجاح عبر LiveKit.');
  };

  const joinRoom = async (roomRecord, role = 'viewer') => {
    try {
      setJoining(true);
      setError('');
      clearVideoContainer();

      const { data: tokenData } = await getLiveToken({ room_id: roomRecord.id, role, platform: 'web' });
      const { data: commentsData } = await getLiveComments(roomRecord.id);

      const session = {
        ...roomRecord,
        ...tokenData,
        role,
      };

      activeRoomIdRef.current = roomRecord.id;
      setActiveRoom(session);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setViewerCount(Number(roomRecord.viewer_count || 0));
      setHeartsCount(Number(roomRecord.hearts_count || 0));

      const socketId = await ensureSocketConnected();
      socket.emit('join_live', {
        token,
        room_id: String(roomRecord.id),
        user: currentUser,
        role,
        platform: 'web',
        device_type: 'browser',
      });

      await updateLivePresence({
        room_id: roomRecord.id,
        socket_id: socketId,
        platform: 'web',
        device_type: 'browser',
        is_host: role === 'host',
        active: true,
      });

      await connectToLiveKit(session, role);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'تعذر الانضمام إلى البث.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateLive = async () => {
    try {
      setJoining(true);
      setError('');
      const { data } = await createLiveRoom({ title, platform: 'web' });
      await refreshRooms();
      await joinRoom({ id: String(data.room_id || data.id), viewer_count: 0, ...data }, 'host');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر إنشاء البث.');
    } finally {
      setJoining(false);
    }
  };

  const handleSendComment = () => {
    const text = message.trim();
    if (!text || !activeRoomIdRef.current) return;
    socket.emit('send_comment', {
      token,
      room_id: String(activeRoomIdRef.current),
      user: currentUser,
      text,
    });
    setMessage('');
  };

  const handleHeart = () => {
    if (!activeRoomIdRef.current) return;
    socket.emit('send_heart', {
      token,
      room_id: String(activeRoomIdRef.current),
      user: currentUser,
    });
  };

  const handleEndLive = async () => {
    if (!activeRoomIdRef.current) return;
    try {
      await endLiveRoom(activeRoomIdRef.current);
      await disconnectRoom();
      await refreshRooms();
      setStatus('تم إنهاء البث المباشر.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر إنهاء البث.');
    }
  };

  useEffect(() => () => {
    disconnectRoom();
  }, []);

  return (
    <MainLayout>
      <section className="live-layout">
        <div className="live-main">
          <Card className="live-stage-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔴 Live Streaming</h3>
                <p className="muted">واجهة بث مباشر جاهزة مع Socket.io للتنسيق وLiveKit للاتصال المرئي.</p>
              </div>
              <div className="live-stage-stats">
                <span className="glass-chip">👀 {viewerCount}</span>
                <span className="glass-chip">❤️ {heartsCount}</span>
              </div>
            </div>

            <div ref={videosRef} className="live-video-grid" />

            <div className="live-toolbar">
              <input className="input" placeholder="عنوان البث..." value={title} onChange={(event) => setTitle(event.target.value)} />
              <Button onClick={handleCreateLive} disabled={joining}>{joining ? 'جارٍ التجهيز...' : 'بدء بث جديد'}</Button>
              {activeRoom?.role === 'host' ? (
                <Button variant="secondary" onClick={handleEndLive}>إنهاء البث</Button>
              ) : null}
            </div>

            <div className="muted">{status}</div>
            {error ? <div className="alert error">{error}</div> : null}
          </Card>
        </div>

        <div className="live-side">
          <Card>
            <h3 className="section-title">البثوث الحالية</h3>
            {loading ? <div className="empty-mini">جارٍ تحميل الغرف...</div> : null}
            <div className="list-grid">
              {rooms.map((room) => (
                <div key={room.id} className="live-room-row">
                  <div>
                    <strong>{room.title || room.username}</strong>
                    <div className="muted">بواسطة {room.username} • {room.viewer_count || 0} مشاهد</div>
                  </div>
                  <button type="button" className="mini-action" onClick={() => joinRoom(room, room.username === currentUser ? 'host' : 'viewer')}>
                    دخول
                  </button>
                </div>
              ))}
              {!loading && rooms.length === 0 ? <div className="empty-mini">لا توجد بثوث نشطة الآن.</div> : null}
            </div>
          </Card>

          <Card>
            <h3 className="section-title">دردشة البث</h3>
            <div className="live-comments">
              {comments.map((comment) => (
                <div key={comment.id || `${comment.user}-${comment.created_at}-${comment.text}`} className="comment-item">
                  <b>{comment.user}</b>
                  <span>{comment.text}</span>
                </div>
              ))}
              {comments.length === 0 ? <div className="empty-mini">لا توجد تعليقات بعد.</div> : null}
            </div>
            <div className="comment-composer">
              <input className="input" placeholder="اكتب رسالة داخل البث..." value={message} onChange={(event) => setMessage(event.target.value)} />
              <button type="button" className="mini-action" onClick={handleSendComment}>إرسال</button>
              <button type="button" className="mini-action" onClick={handleHeart}>❤️</button>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
