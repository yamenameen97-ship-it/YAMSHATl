import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import socket from '../api/socket.js';
import {
  addLiveCohost,
  createLivePoll,
  createLiveRoom,
  endLiveRoom,
  getLiveComments,
  getLiveDashboard,
  getLiveRoom,
  getLiveRooms,
  getLiveToken,
  moderateLiveUser,
  sendLiveGift,
  sendLiveReaction,
  shareLiveRoom,
  startLiveBattle,
  updateLiveHealth,
  updateLivePresence,
  updateLiveRecording,
  voteLivePoll,
} from '../api/live.js';
import { getAuthToken, getCurrentUsername } from '../utils/auth.js';
import { useAppStore } from '../store/appStore.js';

const livekitCache = { module: null };

async function loadLiveKit() {
  if (!livekitCache.module) livekitCache.module = await import('livekit-client');
  return livekitCache.module;
}

function healthLabel(status) {
  if (status === 'critical') return 'حرج';
  if (status === 'warning') return 'متوسط';
  return 'ممتاز';
}

export default function Live() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useAppStore((state) => state.isOnline);
  const roomRef = useRef(null);
  const videosRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('جاهز لإطلاق البث المباشر أو الانضمام لبث قائم.');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [quality, setQuality] = useState('auto');
  const [createForm, setCreateForm] = useState({
    title: 'بث مباشر جديد',
    scheduled_for: '',
    recording_enabled: true,
    live_notifications_enabled: true,
    background_streaming_enabled: true,
    auto_reconnect_enabled: true,
    adaptive_bitrate_enabled: true,
    cdn_url: '',
  });
  const [giftForm, setGiftForm] = useState({ gift_name: 'rose', coins: 10 });
  const [pollForm, setPollForm] = useState({ question: '', option1: '', option2: '' });
  const [cohostUsername, setCohostUsername] = useState('');
  const [battleRoomId, setBattleRoomId] = useState('');
  const [moderation, setModeration] = useState({ username: '', action: 'mute' });
  const requestedRoomId = searchParams.get('room')?.trim() || '';

  const refreshRooms = async () => {
    const { data } = await getLiveRooms();
    setRooms(Array.isArray(data) ? data : []);
  };

  const syncActiveRoom = async (roomId = activeRoomIdRef.current) => {
    if (!roomId) return;
    const [{ data: roomData }, { data: commentsData }] = await Promise.all([getLiveRoom(roomId), getLiveComments(roomId)]);
    setActiveRoom(roomData || null);
    setComments(Array.isArray(commentsData) ? commentsData : []);
    try {
      const { data: dashboardData } = await getLiveDashboard(roomId);
      setDashboard(dashboardData || null);
    } catch {
      setDashboard(null);
    }
  };

  const disconnectRoom = async () => {
    try {
      if (activeRoomIdRef.current) {
        socket.emit('leave_live', { room_id: String(activeRoomIdRef.current) });
        if (socket.id) {
          await updateLivePresence({ room_id: activeRoomIdRef.current, socket_id: socket.id, platform: 'web', device_type: 'browser', is_host: activeRoom?.role === 'host', active: false });
        }
      }
    } catch {
      // ignore background disconnect errors
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videosRef.current) videosRef.current.replaceChildren();
    activeRoomIdRef.current = null;
    setActiveRoom(null);
    setDashboard(null);
    setComments([]);
    setSearchParams({}, { replace: true });
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

  const publishHealth = async (reconnecting = false) => {
    if (!activeRoomIdRef.current || activeRoom?.role !== 'host') return;
    const navConnection = navigator?.connection || {};
    const bitrate = Math.max(Math.round((navConnection.downlink || 1.8) * 1200), 250);
    const rtt = Math.max(Math.round(navConnection.rtt || 45), 10);
    const packetLoss = reconnecting ? 6 : 1;
    try {
      const { data } = await updateLiveHealth({ room_id: activeRoomIdRef.current, bitrate_kbps: bitrate, rtt_ms: rtt, packet_loss: packetLoss, reconnecting });
      setActiveRoom(data || null);
    } catch {
      // ignore health pings
    }
  };

  const connectToLiveKit = async (session, role) => {
    if (!session?.token || !session?.livekit_url) {
      setStatus('تم تجهيز غرفة البث. LiveKit غير مفعّل حالياً، لكن كل عناصر التفاعل والإدارة شغالة.');
      return;
    }
    try {
      if (videosRef.current) videosRef.current.replaceChildren();
      const { connect, RoomEvent } = await loadLiveKit();
      const room = await connect(session.livekit_url, session.token, {
        autoSubscribe: true,
        dynacast: true,
        adaptiveStream: true,
      });
      roomRef.current = room;
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        attachVideoTrack(track, participant.identity);
      });
      room.on(RoomEvent.Reconnecting, () => {
        setStatus('جاري إعادة الاتصال بالبث...');
        publishHealth(true);
      });
      room.on(RoomEvent.Reconnected, () => {
        setStatus('تمت إعادة الاتصال بالبث بنجاح.');
        publishHealth(false);
      });
      room.on(RoomEvent.Disconnected, () => {
        setStatus('انقطع الاتصال المرئي، لكن البث ما زال متاحاً عبر لوحة المتابعة.');
      });
      room.on(RoomEvent.ParticipantConnected, () => syncActiveRoom(session.room_id));
      room.on(RoomEvent.ParticipantDisconnected, () => syncActiveRoom(session.room_id));
      if (role === 'host') {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      room.participants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) attachVideoTrack(publication.track, participant.identity);
        });
      });
      setStatus('البث متصل مع Auto Reconnect وAdaptive Bitrate.');
      publishHealth(false);
    } catch (err) {
      setStatus(err?.message || 'فشل الاتصال المرئي. استمر في البث النصي والتحليلات المباشرة.');
    }
  };

  const joinRoom = async (roomRecord, role = 'viewer') => {
    try {
      setJoining(true);
      setError('');
      const { data: tokenData } = await getLiveToken({ room_id: roomRecord.id, role, platform: 'web' });
      activeRoomIdRef.current = roomRecord.id;
      setSearchParams({ room: String(roomRecord.id) }, { replace: true });
      const session = { ...roomRecord, ...tokenData, role };
      setActiveRoom(session);
      socket.emit('join_live', { room_id: String(roomRecord.id), role, platform: 'web', device_type: 'browser' });
      if (socket.id) {
        await updateLivePresence({ room_id: roomRecord.id, socket_id: socket.id, platform: 'web', device_type: 'browser', is_host: role === 'host', active: true });
      }
      await Promise.all([syncActiveRoom(roomRecord.id), connectToLiveKit(session, role)]);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'تعذر الانضمام إلى البث.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateLive = async () => {
    try {
      setJoining(true);
      const { data } = await createLiveRoom(createForm);
      await refreshRooms();
      await joinRoom(data, 'host');
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر إنشاء البث.');
    } finally {
      setJoining(false);
    }
  };

  const handleSendComment = () => {
    const text = message.trim();
    if (!text || !activeRoomIdRef.current) return;
    socket.emit('send_comment', { room_id: String(activeRoomIdRef.current), text });
    setMessage('');
  };

  const handleHeart = () => {
    if (!activeRoomIdRef.current) return;
    socket.emit('send_heart', { room_id: String(activeRoomIdRef.current) });
  };

  const runRoomAction = async (runner) => {
    if (!activeRoomIdRef.current) return;
    try {
      setError('');
      await runner();
      await Promise.all([syncActiveRoom(activeRoomIdRef.current), refreshRooms()]);
    } catch (err) {
      setError(err?.response?.data?.detail || 'تعذر تنفيذ الإجراء.');
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await refreshRooms();
      } catch (err) {
        setError(err?.response?.data?.detail || 'تعذر تحميل البث المباشر.');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    socket.connect();
    socket.emit('register_user', { user: currentUser, token });
    const offStats = socket.on('room_stats', ({ room_id }) => {
      if (String(room_id) === String(activeRoomIdRef.current)) syncActiveRoom(room_id);
      refreshRooms();
    });
    const offComment = socket.on('new_comment', (payload) => {
      if (String(payload?.room_id) !== String(activeRoomIdRef.current)) return;
      setComments((prev) => [...prev, payload]);
    });
    const offGift = socket.on('live_gift', ({ room_id }) => {
      if (String(room_id) === String(activeRoomIdRef.current)) syncActiveRoom(room_id);
    });
    const offPoll = socket.on('live_poll', ({ room_id }) => {
      if (String(room_id) === String(activeRoomIdRef.current)) syncActiveRoom(room_id);
    });
    const offReact = socket.on('live_reaction', ({ room_id }) => {
      if (String(room_id) === String(activeRoomIdRef.current)) syncActiveRoom(room_id);
    });
    return () => {
      offStats?.();
      offComment?.();
      offGift?.();
      offPoll?.();
      offReact?.();
    };
  }, [currentUser, token]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshRooms();
      if (activeRoomIdRef.current) syncActiveRoom(activeRoomIdRef.current);
    }, 12000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden' && activeRoom?.role === 'host') {
        setStatus('Background Streaming مفعّل: البث مستمر حتى أثناء ترك الشاشة.');
      }
      if (document.visibilityState === 'visible' && activeRoom?.role === 'host') {
        publishHealth(false);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => document.removeEventListener('visibilitychange', visibilityHandler);
  }, [activeRoom?.role]);

  useEffect(() => {
    if (!requestedRoomId || !rooms.length || activeRoomIdRef.current) return;
    const requestedRoom = rooms.find((room) => String(room.id) === String(requestedRoomId));
    if (requestedRoom) joinRoom(requestedRoom, 'viewer');
  }, [requestedRoomId, rooms.length]);

  const roomCards = useMemo(() => rooms.filter((room) => room.active), [rooms]);

  if (loading && !rooms.length) {
    return <MainLayout><Card className="hero-card"><p>جارٍ تحميل مركز البث المباشر...</p></Card></MainLayout>;
  }

  if (error && !rooms.length && !activeRoom) {
    return <MainLayout><ErrorState title="تعذر تحميل البث" description={error} onRetry={refreshRooms} /></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="live-shell">
        <section className="dashboard-hero-grid">
          <Card className="hero-card live-upgrade-hero">
            <div className="hero-card-topline"><span className="badge">LiveKit Stability Suite</span><span className="live-pill"><span className="status-dot live-dot" />On Air Ready</span></div>
            <h2>غرفة بث مطوّرة مع Auto Reconnect وAdaptive Bitrate وStream Health Monitor</h2>
            <p>ضفت لوحة تفاعلية للبث فيها عدد مشاهدين حقيقي، هدايا وعملات، Reactions، Polls، Multi Host، Battle Streams، Live Moderation، Replay، Recording، Scheduling، وCreator Dashboard.</p>
            <div className="hero-actions-wrap">
              <Button onClick={handleCreateLive} loading={joining}>{joining ? 'جارٍ التجهيز...' : 'ابدأ بث جديد'}</Button>
              <span className="glass-chip">الحالة: {status}</span>
              <span className="glass-chip">الشبكة: {isOnline ? 'متصل' : 'أوفلاين'}</span>
            </div>
          </Card>

          <Card>
            <div className="card-head split"><h3 className="section-title">إعدادات البث</h3><span className="badge">Scheduling + CDN</span></div>
            <div className="live-form-grid">
              <Input label="عنوان البث" value={createForm.title} onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))} />
              <Input label="موعد البث" type="datetime-local" value={createForm.scheduled_for} onChange={(event) => setCreateForm((prev) => ({ ...prev, scheduled_for: event.target.value }))} />
              <Input label="CDN URL" value={createForm.cdn_url} onChange={(event) => setCreateForm((prev) => ({ ...prev, cdn_url: event.target.value }))} placeholder="https://cdn.example.com/live" />
            </div>
            <div className="badge-row">
              {['recording_enabled', 'live_notifications_enabled', 'background_streaming_enabled', 'auto_reconnect_enabled', 'adaptive_bitrate_enabled'].map((key) => (
                <button key={key} type="button" className={`tab-btn ${createForm[key] ? 'active' : ''}`} onClick={() => setCreateForm((prev) => ({ ...prev, [key]: !prev[key] }))}>{key.replaceAll('_', ' ')}</button>
              ))}
            </div>
          </Card>
        </section>

        {error ? <div className="alert error">{error}</div> : null}

        <section className="analytics-grid live-analytics-grid">
          <Card>
            <div className="card-head split"><h3 className="section-title">الغرف النشطة</h3><span className="badge">Viewer Count حقيقي</span></div>
            {roomCards.length ? (
              <div className="room-grid">
                {roomCards.map((room) => (
                  <div key={room.id} className="room-card">
                    <div className="room-card-head">
                      <strong>{room.title}</strong>
                      {room.featured ? <span className="glass-chip">Featured</span> : null}
                    </div>
                    <p className="muted no-margin">{room.username} • {room.stream_health?.status ? healthLabel(room.stream_health.status) : 'ممتاز'}</p>
                    <div className="story-viewer-actions">
                      <span className="glass-chip">👀 {room.real_viewer_count || room.viewer_count || 0}</span>
                      <span className="glass-chip">💬 {room.comments_count || 0}</span>
                      <span className="glass-chip">🎁 {room.gifts_summary?.count || 0}</span>
                    </div>
                    <div className="hero-actions-wrap">
                      <Button variant="secondary" onClick={() => joinRoom(room, room.username === currentUser ? 'host' : 'viewer')}>دخول البث</Button>
                      <Button variant="secondary" onClick={() => shareLiveRoom({ room_id: room.id })}>Share</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="🎥" title="لا توجد غرف مباشرة حالياً" description="ابدأ أول بث من اللوحة اللي فوق وهيظهر هنا فوراً." />}
          </Card>

          <Card>
            <div className="card-head split"><h3 className="section-title">بثّي الحالي</h3><span className="badge">Creator Dashboard</span></div>
            {activeRoom ? (
              <div className="dashboard-mini-summary live-dashboard-mini">
                <div><strong>{activeRoom.viewer_count || 0}</strong><span>مشاهدون</span></div>
                <div><strong>{activeRoom.gifts_summary?.coin_pot || 0}</strong><span>Coins</span></div>
                <div><strong>{activeRoom.live_share_count || 0}</strong><span>Shares</span></div>
                <div><strong>{dashboard?.creator_dashboard?.engagement_score || 0}</strong><span>Engagement</span></div>
              </div>
            ) : <EmptyState icon="📡" title="لسه ما دخلتش غرفة" description="اختار أي بث أو ابدأ واحد جديد علشان تظهر لوحة التحكم." />}
          </Card>
        </section>

        {activeRoom ? (
          <>
            <Card className="live-room-stage">
              <div className="card-head split">
                <div>
                  <h3 className="section-title">{activeRoom.title}</h3>
                  <p className="muted no-margin">المضيف: {activeRoom.username} • الصحة: {healthLabel(activeRoom.stream_health?.status)}</p>
                </div>
                <div className="story-viewer-actions">
                  <span className="glass-chip">ABR: {activeRoom.adaptive_bitrate_enabled ? 'On' : 'Off'}</span>
                  <span className="glass-chip">Reconnect: {activeRoom.auto_reconnect_enabled ? 'On' : 'Off'}</span>
                  <span className="glass-chip">CDN: {activeRoom.cdn_url ? 'Ready' : 'Default'}</span>
                  <Button variant="secondary" onClick={disconnectRoom}>مغادرة</Button>
                  {activeRoom.role === 'host' ? <Button onClick={() => runRoomAction(() => endLiveRoom(activeRoom.id))}>إنهاء البث</Button> : null}
                </div>
              </div>
              <div className="live-stage-grid">
                <div className="live-video-surface" data-quality={quality} ref={videosRef} />
                <div className="live-side-panel">
                  <div className="story-viewer-actions wrap">
                    <span className="glass-chip">👀 {activeRoom.viewer_count || 0}</span>
                    <span className="glass-chip">❤️ {activeRoom.hearts_count || 0}</span>
                    <span className="glass-chip">🎁 {activeRoom.gifts_summary?.count || 0}</span>
                    <span className="glass-chip">📊 {dashboard?.creator_dashboard?.retention_hint || 'Growing'}</span>
                  </div>
                  <div className="badge-row">
                    {['auto', '720p', '1080p'].map((item) => <button key={item} type="button" className={`tab-btn ${quality === item ? 'active' : ''}`} onClick={() => setQuality(item)}>{item}</button>)}
                  </div>
                  <div className="input-shell textarea-shell live-comment-box">
                    <label>شات البث</label>
                    <textarea value={message} rows={3} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب تعليق أو إعلان سريع للبث" />
                  </div>
                  <div className="hero-actions-wrap">
                    <Button variant="secondary" onClick={handleSendComment}>إرسال تعليق</Button>
                    <Button variant="secondary" onClick={handleHeart}>Heart</Button>
                    <Button variant="secondary" onClick={() => runRoomAction(() => sendLiveReaction({ room_id: activeRoom.id, reaction: 'fire' }))}>🔥 Reaction</Button>
                    <Button variant="secondary" onClick={() => runRoomAction(() => shareLiveRoom({ room_id: activeRoom.id }))}>Share</Button>
                  </div>
                </div>
              </div>
            </Card>

            <section className="analytics-grid live-tools-grid">
              <Card>
                <div className="card-head split"><h3 className="section-title">Gifts + Coins + Recording</h3><span className="badge">Monetization</span></div>
                <div className="live-form-grid">
                  <Input label="نوع الهدية" value={giftForm.gift_name} onChange={(event) => setGiftForm((prev) => ({ ...prev, gift_name: event.target.value }))} />
                  <Input label="Coins" type="number" value={giftForm.coins} onChange={(event) => setGiftForm((prev) => ({ ...prev, coins: Number(event.target.value || 0) }))} />
                </div>
                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => runRoomAction(() => sendLiveGift({ room_id: activeRoom.id, gift_name: giftForm.gift_name, coins: giftForm.coins }))}>إرسال هدية</Button>
                  <Button variant="secondary" onClick={() => runRoomAction(() => updateLiveRecording({ room_id: activeRoom.id, enabled: !activeRoom.recording?.enabled }))}>{activeRoom.recording?.enabled ? 'إيقاف التسجيل' : 'تشغيل التسجيل'}</Button>
                </div>
                <p className="muted">رصيد المضيف/المشرف: {dashboard?.wallet?.coin_balance || 0} coins</p>
              </Card>

              <Card>
                <div className="card-head split"><h3 className="section-title">Polls + Multi Host + Battle</h3><span className="badge">Engagement</span></div>
                <div className="live-form-grid">
                  <Input label="سؤال الاستطلاع" value={pollForm.question} onChange={(event) => setPollForm((prev) => ({ ...prev, question: event.target.value }))} />
                  <Input label="اختيار أول" value={pollForm.option1} onChange={(event) => setPollForm((prev) => ({ ...prev, option1: event.target.value }))} />
                  <Input label="اختيار ثاني" value={pollForm.option2} onChange={(event) => setPollForm((prev) => ({ ...prev, option2: event.target.value }))} />
                </div>
                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => runRoomAction(() => createLivePoll({ room_id: activeRoom.id, question: pollForm.question, options: [pollForm.option1, pollForm.option2] }))}>إنشاء Poll</Button>
                  {activeRoom.active_poll?.options?.map((option) => <Button key={option.id} variant="secondary" onClick={() => runRoomAction(() => voteLivePoll(activeRoom.active_poll.id, { room_id: activeRoom.id, option_id: option.id }))}>{option.text} ({option.votes})</Button>)}
                </div>
                <div className="live-form-grid">
                  <Input label="اسم الـ Co-host" value={cohostUsername} onChange={(event) => setCohostUsername(event.target.value)} />
                  <Input label="Battle Room ID" value={battleRoomId} onChange={(event) => setBattleRoomId(event.target.value)} />
                </div>
                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => runRoomAction(() => addLiveCohost({ room_id: activeRoom.id, username: cohostUsername }))}>إضافة Co-host</Button>
                  <Button variant="secondary" onClick={() => runRoomAction(() => startLiveBattle({ room_id: activeRoom.id, opponent_room_id: battleRoomId }))}>بدء Battle</Button>
                </div>
              </Card>
            </section>

            <section className="analytics-grid live-tools-grid">
              <Card>
                <div className="card-head split"><h3 className="section-title">Live Moderation</h3><span className="badge">Mute / Kick</span></div>
                <div className="live-form-grid">
                  <Input label="اسم المستخدم" value={moderation.username} onChange={(event) => setModeration((prev) => ({ ...prev, username: event.target.value }))} />
                  <Input label="الإجراء" value={moderation.action} onChange={(event) => setModeration((prev) => ({ ...prev, action: event.target.value }))} />
                </div>
                <div className="hero-actions-wrap">
                  <Button variant="secondary" onClick={() => runRoomAction(() => moderateLiveUser({ room_id: activeRoom.id, username: moderation.username, action: moderation.action }))}>تنفيذ الإجراء</Button>
                </div>
                <div className="badge-row">
                  {(activeRoom.moderation?.muted_users || []).map((item) => <span key={`mute-${item}`} className="glass-chip">🔇 {item}</span>)}
                  {(activeRoom.moderation?.kicked_users || []).map((item) => <span key={`kick-${item}`} className="glass-chip">⛔ {item}</span>)}
                </div>
              </Card>

              <Card>
                <div className="card-head split"><h3 className="section-title">Replay + Analytics + Reactions</h3><span className="badge">Replay Center</span></div>
                <div className="dashboard-mini-summary live-dashboard-mini">
                  <div><strong>{activeRoom.replay?.clips?.length || 0}</strong><span>Clips</span></div>
                  <div><strong>{activeRoom.analytics?.shares || 0}</strong><span>Shares</span></div>
                  <div><strong>{activeRoom.analytics?.gift_events || 0}</strong><span>Gifts</span></div>
                  <div><strong>{activeRoom.analytics?.poll_votes || 0}</strong><span>Votes</span></div>
                </div>
                <div className="badge-row">
                  {Object.entries(activeRoom.live_reactions || {}).map(([key, value]) => <span key={key} className="glass-chip">{key} {value}</span>)}
                </div>
                {(activeRoom.replay?.clips || []).length ? (
                  <div className="timeline-list">
                    {activeRoom.replay.clips.map((clip) => (
                      <div key={clip.id} className="timeline-item">
                        <strong>{clip.label}</strong>
                        <p>{clip.started_at} → {clip.ended_at}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="muted">الـ Replay هيتكوّن تلقائياً بعد نهاية البث المسجّل.</p>}
              </Card>
            </section>

            <Card>
              <div className="card-head split"><h3 className="section-title">تعليقات البث المباشر</h3><span className="badge">Community Feed</span></div>
              {comments.length ? (
                <div className="timeline-list">
                  {comments.map((comment) => (
                    <div key={comment.id} className="timeline-item">
                      <strong>{comment.user}</strong>
                      <p>{comment.text}</p>
                      <small>{comment.created_at ? new Date(comment.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon="💬" title="لسه ما فيش تعليقات" description="أول تعليق أو تفاعل هيظهر هنا لحظياً." />}
            </Card>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}
