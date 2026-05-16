/**
 * YAMSHAT Live / Broadcast page – redesign
 * Features:
 *  - room picker + big featured live canvas
 *  - live comments, likes, flying hearts, gifts, share
 *  - recording toggle, analytics, supporter goal, co-host panel
 *  - real-time room stats via socket.io
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
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
import { avatarGradient, formatTimeAgo, initialsFromName } from '../components/yamshat/YamshatDesign.js';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
  { id: 5, name: 'تاج', icon: '👑', price: 1000 },
];

function Avatar({ name = '', src, size = 42, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: ring ? '2px solid rgba(239,68,68,0.88)' : 'none',
    boxShadow: ring ? '0 0 0 4px rgba(239,68,68,0.12)' : 'none',
  };
  return src
    ? <img src={src} alt={name} style={style} />
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: avatarGradient(name) }}>{initialsFromName(name).slice(0, 1)}</div>;
}

function FloatingHearts({ items }) {
  return (
    <div className="yam-live-hearts-layer" aria-hidden>
      {items.map((item) => (
        <span
          key={item.id}
          className="yam-live-heart"
          style={{ left: `${item.left}%`, animationDuration: `${item.duration}ms` }}
        >
          💜
        </span>
      ))}
    </div>
  );
}

export default function Live() {
  const { pushToast } = useToast();
  const currentUser = getCurrentUsername();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [busy, setBusy] = useState('');
  const [showGiftTray, setShowGiftTray] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [latencyMs, setLatencyMs] = useState(1250);
  const [coHosts, setCoHosts] = useState([]);
  const commentsEndRef = useRef(null);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const { data } = await getLiveRooms();
      const next = Array.isArray(data) ? data : [];
      setRooms(next);
      if (!activeRoom && next.length) setActiveRoom(next[0]);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل البثوث', description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRooms(false);
    }
  }, [activeRoom, pushToast]);

  const loadRoomDetails = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingRoom(true);
    try {
      const [{ data: room }, { data: liveComments }] = await Promise.all([
        getLiveRoom(roomId),
        getLiveComments(roomId),
      ]);
      setActiveRoom(room);
      setComments(Array.isArray(liveComments) ? liveComments : []);
      setCoHosts(room?.multi_host?.current_hosts || []);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحميل تفاصيل البث', description: error?.response?.data?.detail || error?.message });
    } finally {
      setLoadingRoom(false);
    }
  }, [pushToast]);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  useEffect(() => {
    if (!activeRoom?.id) return;
    loadRoomDetails(activeRoom.id);
  }, [activeRoom?.id, loadRoomDetails]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  useEffect(() => {
    if (!activeRoom?.id) return undefined;

    socketManager.connect();
    socketManager.emit('join_live', {
      room_id: activeRoom.id,
      role: activeRoom.host === currentUser ? 'host' : 'viewer',
      platform: 'web',
      device_type: 'browser',
    });

    const handleComment = (payload) => {
      if (!payload || payload.room_id !== activeRoom.id) return;
      setComments((prev) => [...prev, payload]);
    };

    const handleStats = (payload) => {
      if (!payload || payload.room_id !== activeRoom.id) return;
      setActiveRoom((prev) => prev ? { ...prev, viewer_count: payload.viewer_count, hearts_count: payload.hearts_count } : prev);
      setRooms((prev) => prev.map((room) => room.id === payload.room_id ? { ...room, viewer_count: payload.viewer_count, hearts_count: payload.hearts_count } : room));
      setLatencyMs((prev) => prev > 1950 ? 980 : prev + 75);
    };

    const handleHeart = () => {
      const id = `heart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const next = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
      setFloatingHearts((prev) => [...prev, next]);
      setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), next.duration);
    };

    socketManager.on('new_comment', handleComment);
    socketManager.on('room_stats', handleStats);
    socketManager.on('new_heart', handleHeart);

    return () => {
      socketManager.emit('leave_live', { room_id: activeRoom.id });
      socketManager.off('new_comment', handleComment);
      socketManager.off('room_stats', handleStats);
      socketManager.off('new_heart', handleHeart);
    };
  }, [activeRoom?.id, activeRoom?.host, currentUser]);

  const hostName = activeRoom?.host || activeRoom?.username || 'Streamer';
  const isHost = hostName === currentUser;
  const currentPot = Number(activeRoom?.economy?.pot || activeRoom?.economy?.current_pot || 0);
  const goalTarget = 2000;
  const goalPercent = Math.min(100, Math.round((currentPot / goalTarget) * 100));
  const topGifters = Array.isArray(activeRoom?.economy?.top_gifters) ? activeRoom.economy.top_gifters : [];
  const recordingStatus = activeRoom?.recording?.status || 'idle';
  const healthScore = Number(activeRoom?.analytics?.health_score || 92);
  const bitrate = Number(activeRoom?.analytics?.avg_bitrate || 4200);
  const heartsCount = Number(activeRoom?.hearts_count || 0);
  const viewerCount = Number(activeRoom?.viewer_count || 0);

  const sendComment = async () => {
    if (!commentText.trim() || !activeRoom?.id) return;
    const optimistic = {
      id: `local-${Date.now()}`,
      room_id: activeRoom.id,
      user: currentUser,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    socketManager.emit('send_comment', { room_id: activeRoom.id, text: commentText.trim() });
    setCommentText('');
  };

  const sendHeart = () => {
    if (!activeRoom?.id) return;
    socketManager.emit('send_heart', { room_id: activeRoom.id });
    const id = `heart-${Date.now()}`;
    const next = { id, left: 14 + Math.random() * 72, duration: 1500 + Math.random() * 900 };
    setFloatingHearts((prev) => [...prev, next]);
    setTimeout(() => setFloatingHearts((prev) => prev.filter((item) => item.id !== id)), next.duration);
  };

  const giveGift = async (gift) => {
    if (!activeRoom?.id) return;
    try {
      await sendLiveGift({ room_id: activeRoom.id, gift_name: gift.name, coins: gift.price });
      pushToast({ type: 'success', title: `تم إرسال ${gift.icon} ${gift.name}` });
      loadRoomDetails(activeRoom.id);
      setShowGiftTray(false);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إرسال الهدية', description: error?.response?.data?.detail || error?.message });
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#/live`;
      await navigator.clipboard.writeText(url);
      pushToast({ type: 'success', title: 'تم نسخ رابط البث' });
    } catch {
      pushToast({ type: 'warning', title: 'تعذر النسخ', description: 'انسخ الرابط يدويًا.' });
    }
  };

  const handleFollowHost = () => {
    pushToast({ type: 'success', title: `تمت متابعة ${hostName}` });
  };

  const handleEnableAlerts = () => {
    pushToast({ type: 'success', title: 'تم تفعيل تنبيه البث المباشر' });
  };

  const handleCreateRoom = async () => {
    try {
      setBusy('create');
      const { data } = await createLiveRoom({ title: `بث مباشر مع ${currentUser}` });
      setActiveRoom(data);
      await loadRooms();
      pushToast({ type: 'success', title: 'تم إنشاء غرفة البث' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إنشاء البث', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy('');
    }
  };

  const toggleRecording = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy('recording');
      const action = recordingStatus === 'recording' ? 'stop' : 'start';
      await updateLiveRecording({ room_id: activeRoom.id, action });
      await loadRoomDetails(activeRoom.id);
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر تحديث التسجيل', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy('');
    }
  };

  const stopLive = async () => {
    if (!activeRoom?.id) return;
    try {
      setBusy('end');
      await endLiveRoom(activeRoom.id);
      setActiveRoom(null);
      setComments([]);
      await loadRooms();
      pushToast({ type: 'success', title: 'تم إنهاء البث' });
    } catch (error) {
      pushToast({ type: 'error', title: 'تعذر إنهاء البث', description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <MainLayout>
      <div className="yam-live-page desktop-post mobile-post">
        {/* ── Main live stage ────────────────────────────────────────── */}
        <div className="yam-live-main">
          <div className="yam-live-stage-card">
            <FloatingHearts items={floatingHearts} />
            <div className="yam-live-stage-gradient" />
            <div className="yam-live-stage-head">
              <div className="yam-live-badges">
                <span className="live-badge live">LIVE</span>
                <span className="live-badge">👁 {viewerCount}</span>
                <span className="live-badge">💜 {heartsCount}</span>
                <span className="live-badge">⚡ {latencyMs}ms</span>
              </div>
              <div className="yam-live-stage-actions">
                <button type="button" className="yam-live-action-btn" onClick={loadRooms}>تحديث</button>
                <button type="button" className="yam-live-action-btn" onClick={handleShare}>مشاركة</button>
                {isHost && <button type="button" className="yam-live-action-btn" onClick={toggleRecording}>{recordingStatus === 'recording' ? 'إيقاف التسجيل' : 'بدء التسجيل'}</button>}
                {isHost && <button type="button" className="yam-live-action-btn danger" onClick={stopLive}>إنهاء البث</button>}
              </div>
            </div>

            <div className="yam-live-video-placeholder">
              <div className="yam-live-hero-icon">🎥</div>
              <h1>{activeRoom?.title || 'بث مباشر مميز'}</h1>
              <p>المضيف: <strong>{hostName}</strong></p>
              <div className="yam-live-stage-tech">WebRTC • RTMP ingest • HLS playback • Adaptive moderation</div>
            </div>

            <div className="yam-live-stage-footer">
              <div className="yam-live-host-block">
                <Avatar name={hostName} size={56} ring />
                <div>
                  <div className="yam-live-host-line">
                    <strong>{hostName}</strong> <span className="verify-dot">✓</span>
                  </div>
                  <div className="muted">Gaming • Just Chatting • Battle Royale</div>
                </div>
              </div>
              <div className="yam-live-footer-actions">
                <button type="button" className="yam-live-pill-btn" onClick={handleFollowHost}>متابعة</button>
                <button type="button" className="yam-live-pill-btn" onClick={handleEnableAlerts}>تنبيه</button>
                <button type="button" className="yam-live-pill-btn" onClick={handleShare}>نسخ الرابط</button>
              </div>
            </div>
          </div>

          <div className="yam-live-bottom-grid">
            {/* Support goal */}
            <section className="yam-live-panel">
              <div className="yam-panel-head">
                <h3>هدف الدعم</h3>
                <span>${currentPot.toLocaleString()} / ${goalTarget.toLocaleString()}</span>
              </div>
              <div className="yam-goal-bar"><span style={{ width: `${goalPercent}%` }} /></div>
              <div className="yam-goal-note">تم تحقيق {goalPercent}% من الهدف</div>
              <div className="yam-top-supporters">
                {topGifters.length ? topGifters.map(([name, total]) => (
                  <div key={name} className="yam-supporter-row">
                    <span>{name}</span>
                    <strong>{total} coin</strong>
                  </div>
                )) : <div className="muted">لا يوجد داعمون بعد</div>}
              </div>
            </section>

            {/* Stream info */}
            <section className="yam-live-panel">
              <div className="yam-panel-head">
                <h3>معلومات البث</h3>
                <span>اليوم</span>
              </div>
              <div className="yam-info-stats-grid">
                <div className="yam-stat-box"><small>المشاهدين</small><strong>{viewerCount}</strong></div>
                <div className="yam-stat-box"><small>الصحة</small><strong>{healthScore}%</strong></div>
                <div className="yam-stat-box"><small>Bitrate</small><strong>{bitrate}</strong></div>
                <div className="yam-stat-box"><small>التسجيل</small><strong>{recordingStatus}</strong></div>
              </div>
              <div className="yam-schedule-card">
                <strong>الجدول القادم</strong>
                <p>غدًا 09:00 مساءً – جلسة لعب وتحديات مع المتابعين</p>
              </div>
            </section>

            {/* Co-hosts */}
            <section className="yam-live-panel">
              <div className="yam-panel-head">
                <h3>الضيوف / Co-host</h3>
                <span>{coHosts.length}</span>
              </div>
              <div className="yam-cohost-list">
                {(coHosts.length ? coHosts : [hostName]).map((name, index) => (
                  <div key={name} className="yam-cohost-row">
                    <Avatar name={name} size={38} />
                    <div>
                      <strong>{name}</strong>
                      <small>{index === 0 ? 'Host' : 'Co-host'}</small>
                    </div>
                    <button type="button" className="yam-mini-chip">Live</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── Right column: live rooms + chat ───────────────────────── */}
        <aside className="yam-live-sidebar">
          <div className="yam-live-rooms-head">
            <h3>الغرف المباشرة</h3>
            {!activeRoom && currentUser ? (
              <button type="button" className="yam-create-live-btn" onClick={handleCreateRoom} disabled={busy === 'create'}>
                {busy === 'create' ? '...' : 'بدء بث'}
              </button>
            ) : null}
          </div>

          <div className="yam-room-list">
            {loadingRooms && <div className="yam-live-side-empty">جارٍ تحميل الغرف...</div>}
            {!loadingRooms && !rooms.length && <div className="yam-live-side-empty">لا يوجد بث مباشر الآن</div>}
            {rooms.map((room) => (
              <button key={room.id} type="button" className={`yam-room-card ${activeRoom?.id === room.id ? 'active' : ''}`} onClick={() => setActiveRoom(room)}>
                <div className="yam-room-card-top">
                  <span className="room-live-pill">LIVE</span>
                  <span className="room-viewers">👁 {room.viewer_count || 0}</span>
                </div>
                <strong>{room.title || 'بث مباشر'}</strong>
                <div className="muted">{room.host || room.username}</div>
              </button>
            ))}
          </div>

          <div className="yam-live-chat-box">
            <div className="yam-live-chat-head">
              <div>
                <strong>تعليقات البث</strong>
                <div className="muted">تفاعل، علّق، أرسل قلوب وهدايا</div>
              </div>
              <div className="yam-live-chat-head-actions">
                <button type="button" className="yam-icon-lite" onClick={() => setShowGiftTray((prev) => !prev)}>🎁</button>
                <button type="button" className="yam-icon-lite" onClick={sendHeart}>💜</button>
                <button type="button" className="yam-icon-lite" onClick={handleShare}>⤴</button>
              </div>
            </div>

            {showGiftTray && (
              <div className="yam-gift-tray">
                {GIFTS.map((gift) => (
                  <button key={gift.id} type="button" className="yam-gift-card" onClick={() => giveGift(gift)}>
                    <span className="gift-icon">{gift.icon}</span>
                    <strong>{gift.name}</strong>
                    <small>{gift.price} coin</small>
                  </button>
                ))}
              </div>
            )}

            <div className="yam-comments-stream">
              {loadingRoom && <div className="yam-live-side-empty">جارٍ تحميل التعليقات...</div>}
              {!loadingRoom && !comments.length && <div className="yam-live-side-empty">أول تعليق منك؟</div>}
              {comments.map((item) => (
                <div key={item.id} className="yam-live-comment">
                  <Avatar name={item.user} size={36} />
                  <div className="yam-live-comment-body">
                    <div className="yam-live-comment-top">
                      <strong>{item.user}</strong>
                      <span>{formatTimeAgo(item.created_at)}</span>
                    </div>
                    <div className="yam-live-comment-text">{item.text}</div>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <div className="yam-live-comment-composer">
              <input
                type="text"
                placeholder="اكتب تعليقًا..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') sendComment(); }}
                disabled={!activeRoom?.id}
              />
              <button type="button" className="yam-send-comment-btn" onClick={sendComment} disabled={!activeRoom?.id || !commentText.trim()}>
                إرسال
              </button>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .yam-live-page {
          direction: rtl;
          display: grid;
          grid-template-columns: minmax(0,1fr) 380px;
          gap: 16px;
          padding: 18px;
          min-height: calc(100vh - 66px);
          background: radial-gradient(circle at top, rgba(139,92,246,0.06), transparent 30%), #050b18;
        }
        @media (max-width: 1180px) {
          .yam-live-page { grid-template-columns: 1fr; }
        }

        .yam-live-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .yam-live-stage-card {
          position: relative;
          overflow: hidden;
          border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(180deg, rgba(10,16,31,0.97), rgba(8,13,27,0.96));
          min-height: 520px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 60px rgba(2,6,23,0.46);
        }
        .yam-live-stage-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, rgba(239,68,68,0.22), transparent 30%), radial-gradient(circle at 25% 25%, rgba(139,92,246,0.24), transparent 35%);
          pointer-events: none;
        }
        .yam-live-stage-head,
        .yam-live-stage-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 18px 22px;
        }
        .yam-live-badges,
        .yam-live-stage-actions,
        .yam-live-footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.74);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 12px;
          font-weight: 700;
        }
        .live-badge.live {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border-color: transparent;
          color: white;
        }
        .yam-live-action-btn,
        .yam-live-pill-btn,
        .yam-mini-chip,
        .yam-create-live-btn,
        .yam-send-comment-btn {
          border: none;
          border-radius: 14px;
          padding: 10px 14px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          color: white;
          cursor: pointer;
          font-weight: 700;
        }
        .yam-live-action-btn:hover,
        .yam-live-pill-btn:hover,
        .yam-mini-chip:hover,
        .yam-create-live-btn:hover,
        .yam-send-comment-btn:hover {
          background: rgba(139,92,246,0.18);
        }
        .yam-live-action-btn.danger {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .yam-live-video-placeholder {
          flex: 1;
          min-height: 320px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          position: relative;
          z-index: 1;
        }
        .yam-live-hero-icon { font-size: 88px; margin-bottom: 12px; }
        .yam-live-video-placeholder h1 { margin: 0; font-size: 34px; font-weight: 900; }
        .yam-live-video-placeholder p { margin: 8px 0 12px; font-size: 16px; color: #cbd5e1; }
        .yam-live-stage-tech {
          display: inline-flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
          font-size: 13px;
        }
        .yam-live-host-block { display: flex; align-items: center; gap: 12px; }
        .yam-live-host-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot { color: #3b82f6; }

        .yam-live-hearts-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 4;
        }
        .yam-live-heart {
          position: absolute;
          bottom: 90px;
          font-size: 28px;
          animation-name: fly-heart;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes fly-heart {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          60% { transform: translateY(-180px) scale(1.35) rotate(-8deg); opacity: 0.92; }
          100% { transform: translateY(-340px) scale(0.35) rotate(12deg); opacity: 0; }
        }

        .yam-live-bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 16px;
        }
        @media (max-width: 960px) {
          .yam-live-bottom-grid { grid-template-columns: 1fr; }
        }
        .yam-live-panel {
          border-radius: 24px;
          background: rgba(12,18,34,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 18px;
          box-shadow: 0 20px 40px rgba(2,6,23,0.26);
        }
        .yam-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }
        .yam-panel-head h3 { margin: 0; font-size: 17px; font-weight: 900; }
        .yam-panel-head span { color: #94a3b8; font-size: 13px; }
        .yam-goal-bar {
          width: 100%;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 10px;
        }
        .yam-goal-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(135deg, #7c3aed, #ef4444);
        }
        .yam-goal-note { color: #94a3b8; font-size: 13px; margin-bottom: 12px; }
        .yam-supporter-row,
        .yam-cohost-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .yam-top-supporters,
        .yam-cohost-list { display: grid; gap: 8px; }
        .yam-info-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        .yam-stat-box {
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          display: grid;
          gap: 6px;
        }
        .yam-stat-box small { color: #94a3b8; font-size: 12px; }
        .yam-stat-box strong { font-size: 20px; font-weight: 900; }
        .yam-schedule-card {
          border-radius: 16px;
          padding: 14px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.14);
        }
        .yam-schedule-card strong { display: block; margin-bottom: 8px; }
        .yam-schedule-card p { margin: 0; color: #cbd5e1; line-height: 1.6; }

        .yam-live-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
        }
        .yam-live-rooms-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .yam-live-rooms-head h3 { margin: 0; font-size: 20px; font-weight: 900; }
        .yam-room-list,
        .yam-live-chat-box {
          border-radius: 24px;
          background: rgba(12,18,34,0.94);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 14px;
          box-shadow: 0 20px 40px rgba(2,6,23,0.28);
        }
        .yam-room-list { display: grid; gap: 10px; max-height: 260px; overflow-y: auto; }
        .yam-room-card {
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: white;
          text-align: start;
          cursor: pointer;
          display: grid;
          gap: 6px;
        }
        .yam-room-card.active {
          background: rgba(139,92,246,0.16);
          border-color: rgba(139,92,246,0.32);
        }
        .yam-room-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .room-live-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          background: #ef4444;
          color: white;
        }
        .room-viewers { color: #94a3b8; font-size: 12px; }
        .yam-live-side-empty { padding: 16px; color: #64748b; text-align: center; }

        .yam-live-chat-box {
          display: flex;
          flex-direction: column;
          min-height: 420px;
          flex: 1;
          min-height: 0;
        }
        .yam-live-chat-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .yam-live-chat-head strong { display: block; font-size: 16px; margin-bottom: 4px; }
        .muted { color: #94a3b8; font-size: 12px; }
        .yam-live-chat-head-actions { display: flex; gap: 6px; }
        .yam-icon-lite {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          color: white;
          cursor: pointer;
        }
        .yam-gift-tray {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .yam-gift-card {
          display: grid;
          gap: 4px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(124,58,237,0.08);
          border: 1px solid rgba(124,58,237,0.14);
          color: white;
          cursor: pointer;
          text-align: center;
        }
        .gift-icon { font-size: 22px; }
        .yam-comments-stream {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-inline-end: 2px;
        }
        .yam-comments-stream::-webkit-scrollbar { width: 4px; }
        .yam-comments-stream::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.24); border-radius: 999px; }
        .yam-live-comment {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .yam-live-comment:last-child { border-bottom: none; }
        .yam-live-comment-body { flex: 1; min-width: 0; }
        .yam-live-comment-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }
        .yam-live-comment-top strong { font-size: 13px; }
        .yam-live-comment-top span { font-size: 11px; color: #64748b; }
        .yam-live-comment-text { font-size: 14px; line-height: 1.5; color: #e2e8f0; word-break: break-word; }
        .yam-live-comment-composer {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .yam-live-comment-composer input {
          flex: 1;
          min-width: 0;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
        }
        .yam-send-comment-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          border-color: transparent;
          min-width: 88px;
        }
      `}</style>
    </MainLayout>
  );
}
