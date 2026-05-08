import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import socket from '../api/socket.js';
import {
  createLiveRoom,
  endLiveRoom,
  getLiveComments,
  getLiveRoom,
  getLiveRooms,
  getLiveToken,
  updateLivePresence,
} from '../api/live.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { sanitizeInputText } from '../utils/sanitize.js';
import { useAppStore } from '../store/appStore.js';

const livekitCache = { module: null };

async function loadLiveKit() {
  if (!livekitCache.module) livekitCache.module = await import('livekit-client');
  return livekitCache.module;
}

function ensureSocketConnected() {
  if (socket.connected && socket.id) return Promise.resolve(socket.id);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useAppStore((state) => state.isOnline);
  const roomRef = useRef(null);
  const videosRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const autoJoinRoomRef = useRef('');
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
  const [quality, setQuality] = useState('auto');
  const [showFallback, setShowFallback] = useState(false);
  const requestedRoomId = searchParams.get('room')?.trim() || '';

  const refreshRooms = async () => {
    try {
      setLoading(true);
      const { data } = await getLiveRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const syncActiveRoom = async (roomId = activeRoomIdRef.current) => {
    if (!roomId) return;
    try {
      const [{ data: roomData }, { data: commentsData }] = await Promise.all([
        getLiveRoom(roomId),
        getLiveComments(roomId),
      ]);
      setActiveRoom((prev) => ({ ...prev, ...(roomData || {}) }));
      setViewerCount(Number(roomData?.viewer_count || 0));
      setHeartsCount(Number(roomData?.hearts_count || 0));
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch {
      // ignore background sync failures
    }
  };

  useEffect(() => {
    refreshRooms();
  }, []);

  useEffect(() => {
    if (!activeRoomIdRef.current) return undefined;

    let timer = null;
    const stopPolling = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const startPolling = () => {
      if (timer || socket.connected) return;
      timer = window.setInterval(() => {
        syncActiveRoom(activeRoomIdRef.current);
        refreshRooms();
      }, 12000);
    };
    const handleSocketConnect = () => {
      stopPolling();
      syncActiveRoom(activeRoomIdRef.current);
      refreshRooms();
    };
    const handleSocketDisconnect = () => startPolling();

    if (socket.connected) handleSocketConnect();
    else startPolling();

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    return () => {
      stopPolling();
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
    };
  }, [activeRoom?.id]);

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
      setActiveRoom((prev) => ({ ...prev, latest_comment_preview: payload }));
    };

    const handleHeart = ({ count }) => setHeartsCount(Number(count || 0));
    const handleAdminLiveUpdate = ({ room }) => {
      if (!room || String(room.id) !== String(activeRoomIdRef.current)) return;
      setActiveRoom((prev) => ({ ...prev, ...room }));
      setViewerCount(Number(room.viewer_count || 0));
      setHeartsCount(Number(room.hearts_count || 0));
    };

    socket.on('room_stats', handleRoomStats);
    socket.on('new_comment', handleComment);
    socket.on('new_heart', handleHeart);
    socket.on('admin:live_updated', handleAdminLiveUpdate);

    return () => {
      socket.off('room_stats', handleRoomStats);
      socket.off('new_comment', handleComment);
      socket.off('new_heart', handleHeart);
      socket.off('admin:live_updated', handleAdminLiveUpdate);
    };
  }, [currentUser, token]);

  const clearVideoContainer = () => {
    if (videosRef.current) videosRef.current.replaceChildren();
  };

  const applyQualityPreference = () => {
    if (!videosRef.current) return;
    videosRef.current.dataset.quality = quality;
  };

  useEffect(() => {
    applyQualityPreference();
  }, [quality]);

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
    applyQualityPreference();
  };

  const syncRoomQueryParam = (roomId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (roomId) nextParams.set('room', String(roomId));
    else nextParams.delete('room');
    setSearchParams(nextParams, { replace: true });
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
      // ignore disconnect errors
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    clearVideoContainer();
    activeRoomIdRef.current = null;
    autoJoinRoomRef.current = '';
    syncRoomQueryParam(null);
    setActiveRoom(null);
    setViewerCount(0);
    setHeartsCount(0);
    setComments([]);
  };

  const connectToLiveKit = async (session, role) => {
    if (!session?.token || !session?.livekit_url) {
      setShowFallback(true);
      setStatus('تم الدخول إلى غرفة البث لكن LiveKit غير مفعّل حالياً، لذلك تم تفعيل وضع المتابعة النصي كبديل.');
      return;
    }

    try {
      const { connect, RoomEvent } = await loadLiveKit();
      const room = await connect(session.livekit_url, session.token);
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        attachVideoTrack(track, participant.identity);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });

      room.on(RoomEvent.Disconnected, () => {
        setShowFallback(true);
        setStatus('انقطع الاتصال المرئي. تم التحويل إلى وضع fallback مع استمرار الشات والإحصاءات.');
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

      setShowFallback(false);
      setStatus('تم الاتصال بالبث المباشر بنجاح.');
    } catch (err) {
      setShowFallback(true);
      setStatus(err?.message || 'فشل الاتصال المرئي. تم تفعيل وضع fallback.');
    }
  };

  const joinRoom = async (roomRecord, role = 'viewer') => {
    try {
      setJoining(true);
      setError('');
      clearVideoContainer();
      const { data: tokenData } = await getLiveToken({ room_id: roomRecord.id, role, platform: 'web' });
      const { data: commentsData } = await getLiveComments(roomRecord.id);
      const session = { ...roomRecord, ...tokenData, role };

      activeRoomIdRef.current = roomRecord.id;
      autoJoinRoomRef.current = String(roomRecord.id);
      syncRoomQueryParam(roomRecord.id);
      setActiveRoom(session);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setViewerCount(Number(roomRecord.viewer_count || 0));
      setHeartsCount(Number(roomRecord.hearts_count || 0));

      const socketId = await ensureSocketConnected();
      socket.emit('join_live', { token, room_id: String(roomRecord.id), user: currentUser, role, platform: 'web', device_type: 'browser' });
      await updateLivePresence({ room_id: roomRecord.id, socket_id: socketId, platform: 'web', device_type: 'browser', is_host: role === 'host', active: true });
      await connectToLiveKit(session, role);
      await syncActiveRoom(roomRecord.id);
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
      const safeTitle = sanitizeInputText(title, { maxLength: 120 }) || 'بث مباشر جديد';
      const { data } = await createLiveRoom({ title: safeTitle, platform: 'web' });
      await refreshRooms();
      await joinRoom({ id: String(data.room_id || data.id), viewer_count: 0, ...data }, 'host');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || 'تعذر إنشاء البث.');
    } finally {
      setJoining(false);
    }
  };

  const handleSendComment = () => {
    const text = sanitizeInputText(message, { maxLength: 600 });
    if (!text || !activeRoomIdRef.current) return;
    socket.emit('send_comment', { token, room_id: String(activeRoomIdRef.current), user: currentUser, text });
    setMessage('');
  };

  const handleHeart = () => {
    if (!activeRoomIdRef.current) return;
    socket.emit('send_heart', { token, room_id: String(activeRoomIdRef.current), user: currentUser });
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

  const copyRoomIdentifier = async () => {
    if (!activeRoom?.room_id && !activeRoom?.id) return;
    try {
      await navigator.clipboard.writeText(String(activeRoom.room_id || activeRoom.id));
      setStatus('تم نسخ رقم الغرفة ويمكنك مشاركته مع الفريق أو الدعم.');
    } catch {
      setStatus('تعذر نسخ رقم الغرفة من المتصفح الحالي.');
    }
  };

  useEffect(() => {
    if (!requestedRoomId || loading || joining || rooms.length === 0) return;
    if (String(activeRoomIdRef.current) === String(requestedRoomId)) return;
    if (autoJoinRoomRef.current === String(requestedRoomId)) return;

    const requestedRoom = rooms.find((room) =>
      String(room.id) === String(requestedRoomId) || String(room.room_id) === String(requestedRoomId)
    );

    if (requestedRoom) {
      autoJoinRoomRef.current = String(requestedRoom.id || requestedRoom.room_id || requestedRoomId);
      joinRoom(requestedRoom, requestedRoom.username === currentUser ? 'host' : 'viewer');
    }
  }, [requestedRoomId, rooms, loading, joining, currentUser]);

  useEffect(() => () => {
    disconnectRoom();
  }, []);

  const viewerExperienceLabel = useMemo(() => {
    if (!activeRoom) return 'اختر بثاً لمتابعته.';
    return activeRoom.role === 'host'
      ? 'أنت الآن كمضيف ويمكنك متابعة الذروة، التعليق المثبّت، وإنهاء البث.'
      : 'أنت الآن كمشاهد مع شات مباشر وإحصاءات فورية.';
  }, [activeRoom]);

  const liveStats = useMemo(() => [
    { label: 'غرف نشطة', value: rooms.length },
    { label: 'مشاهدون الآن', value: viewerCount },
    { label: 'قلوب البث', value: heartsCount },
    { label: 'ذروة الغرفة', value: activeRoom?.peak_viewer_count || 0 },
  ], [activeRoom?.peak_viewer_count, heartsCount, rooms.length, viewerCount]);

  return (
    <MainLayout>
      <section className="live-layout">
        <div className="live-main">
          <Card className="live-stage-card">
            <div className="section-head compact">
              <div>
                <h3 className="section-title">🔴 Live Streaming</h3>
                <p className="muted">واجهة بث مباشر محسّنة مع Start/End، عداد مشاهدين، جودة، مزامنة دورية، وتعليق مثبّت يظهر للمستخدم بشكل أوضح.</p>
              </div>
              <div className="live-stage-stats">
                <span className="glass-chip">👀 {viewerCount}</span>
                <span className="glass-chip">❤️ {heartsCount}</span>
                {activeRoom?.featured ? <span className="glass-chip">⭐ مميّز</span> : null}
              </div>
            </div>

            <div className="stories-stats-grid notification-stats-grid-4">
              {liveStats.map((item) => (
                <div key={item.label} className="mini-stat stories-stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div ref={videosRef} className="live-video-grid" />
            {showFallback ? <div className="live-fallback-card">تم تفعيل وضع المتابعة النصي بسبب تعذر الاتصال المرئي. ما زال بإمكانك متابعة التعليقات والإحصاءات.</div> : null}
            {!activeRoom && !loading ? <EmptyState icon="📡" title="لا يوجد بث نشط في المعاينة" description="أنشئ بثاً جديداً أو ادخل لأحد البثوث الحالية." /> : null}

            {activeRoom?.pinned_comment ? (
              <div className="notification-group-head" style={{ marginTop: 16 }}>
                <strong>📌 تعليق مثبّت</strong>
                <span className="muted">{activeRoom.pinned_comment.user}</span>
                <p>{activeRoom.pinned_comment.text}</p>
              </div>
            ) : null}

            <div className="live-toolbar wrap-composer-actions">
              <input className="input" placeholder="عنوان البث..." value={title} onChange={(event) => setTitle(event.target.value)} />
              <select className="input live-quality-select" value={quality} onChange={(event) => setQuality(event.target.value)}>
                <option value="auto">الجودة: تلقائي</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
              <Button onClick={handleCreateLive} disabled={joining || !isOnline}>{joining ? 'جارٍ التجهيز...' : 'Start Live'}</Button>
              {activeRoom?.role === 'host' ? <Button variant="secondary" onClick={handleEndLive}>End Live</Button> : null}
              {activeRoom ? <Button variant="secondary" onClick={() => joinRoom(activeRoom, activeRoom.role || 'viewer')}>إعادة الاتصال</Button> : null}
              {activeRoom ? <Button variant="secondary" onClick={copyRoomIdentifier}>نسخ رقم الغرفة</Button> : null}
            </div>

            <div className="muted">{status}</div>
            <div className="muted">{viewerExperienceLabel}</div>
            {!isOnline ? <div className="alert warning">لا يوجد اتصال إنترنت حالياً، لذا تم إيقاف إنشاء/الاتصال بالبث مؤقتاً.</div> : null}
            {error ? <ErrorState title="خطأ في البث المباشر" description={error} onRetry={refreshRooms} /> : null}
          </Card>
        </div>

        <div className="live-side">
          <Card>
            <div className="section-head compact">
              <div>
                <h3 className="section-title">البثوث الحالية</h3>
                <p className="muted">الغرف المميزة تظهر أولاً مع مؤشرات الذروة والنشاط.</p>
              </div>
            </div>
            {loading ? <div className="empty-mini">جارٍ تحميل الغرف...</div> : null}
            <div className="list-grid">
              {rooms.map((room) => (
                <div key={room.id} className="live-room-row">
                  <div>
                    <strong>{room.title || room.username}</strong>
                    <div className="muted">بواسطة {room.username} • {room.viewer_count || 0} مشاهد • ذروة {room.peak_viewer_count || 0}</div>
                    <div className="story-viewer-actions">
                      {room.featured ? <span className="glass-chip">مميّز</span> : null}
                      <span className="glass-chip">💬 {room.comments_count || 0}</span>
                      <span className="glass-chip">❤️ {room.hearts_count || 0}</span>
                    </div>
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
                  <b>{comment.user}{comment.pinned ? ' 📌' : ''}</b>
                  <span>{comment.text}</span>
                </div>
              ))}
              {comments.length === 0 ? <div className="empty-mini">لا توجد تعليقات بعد.</div> : null}
            </div>
            <div className="comment-composer">
              <input
                className="input"
                placeholder="اكتب رسالة داخل البث..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <button type="button" className="mini-action" onClick={handleSendComment}>إرسال</button>
              <button type="button" className="mini-action" onClick={handleHeart}>❤️</button>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
