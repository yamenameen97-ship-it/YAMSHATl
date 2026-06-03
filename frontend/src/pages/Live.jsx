import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '../components/layout/MainLayout.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  startLiveStream,
  endLiveStream,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
  getLiveStreamViewers,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
  { id: 5, name: 'تاج', icon: '👑', price: 1000 },
];

const ROOM_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'النشطة' },
  { key: 'mine', label: 'الخاصة بي' },
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
    : <div style={{ ...style, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, background: `linear-gradient(135deg, #7c3aed, #3b82f6)` }}>{name?.charAt(0).toUpperCase() || '?'}</div>;
}

function FloatingHearts({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="yam-floating-hearts" aria-hidden="true">
      {items.map((heart) => (
        <span key={heart.id} className="yam-floating-heart" style={{ insetInlineEnd: `${heart.x}%` }}>
          {heart.icon || '💜'}
        </span>
      ))}
    </div>
  );
}

export default function Live() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [showGiftTray, setShowGiftTray] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [heartsCount, setHeartsCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [liveTokenInfo, setLiveTokenInfo] = useState(null);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    hearts: 0,
    comments: 0,
  });

  const heartTimer = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const commentsIntervalRef = useRef(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getActiveLiveStreams({ limit: 100 });
      setRooms(Array.isArray(resp?.data) ? resp.data : []);
    } catch (err) {
      pushToast?.({ type: 'warning', title: 'تعذر تحميل غرف البث', description: 'حاول مرة أخرى لاحقاً.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  const loadComments = useCallback(async (roomId) => {
    if (!roomId) return;
    try {
      const resp = await getLiveComments(roomId, 50);
      setComments(Array.isArray(resp?.data) ? resp.data : []);
    } catch {
      setComments([]);
    }
  }, []);

  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getLiveStreamStats(streamId);
      if (response?.data) {
        setStreamStats({
          viewers: response.data.viewers_count || response.data.unique_viewers || 0,
          hearts: response.data.hearts_count || 0,
          comments: comments.length,
        });
      }
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }, [comments.length]);

  const openRoom = useCallback(async (room) => {
    if (!room?.id) return;
    setActiveRoom(room);
    setViewerCount(Number(room.viewers_count) || 0);
    setHeartsCount(Number(room.hearts_count) || 0);
    try {
      const detail = await getLiveStreamDetails(room.id);
      if (detail?.data) {
        setActiveRoom(detail.data);
        setViewerCount(Number(detail.data.viewers_count) || 0);
        setHeartsCount(Number(detail.data.hearts_count) || 0);
      }
    } catch {
      // silent
    }
    loadComments(room.id);

    // بدء تحديث الإحصائيات
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = setInterval(() => {
      updateStreamStats(room.id);
    }, 3000);

    // بدء تحديث التعليقات
    if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
    commentsIntervalRef.current = setInterval(() => {
      loadComments(room.id);
    }, 2000);
  }, [loadComments, updateStreamStats]);

  const handleCreateRoom = useCallback(async () => {
    const title = newRoomTitle.trim();
    if (!title) {
      pushToast?.({ type: 'info', title: 'اكتب عنواناً للبث' });
      return;
    }
    setBusy('create');
    try {
      const resp = await createLiveStream({ title });
      if (resp?.data) {
        pushToast?.({ type: 'success', title: 'تم إنشاء غرفة البث' });
        setNewRoomTitle('');
        await loadRooms();
        openRoom(resp.data);
      }
    } catch {
      pushToast?.({ type: 'warning', title: 'تعذر إنشاء البث', description: 'تحقق من الاتصال وحاول مجدداً.' });
    } finally {
      setBusy('');
    }
  }, [newRoomTitle, pushToast, loadRooms, openRoom]);

  const handleEndRoom = useCallback(async () => {
    if (!activeRoom?.id) return;
    setBusy('end');
    try {
      await endLiveStream(activeRoom.id);
      pushToast?.({ type: 'success', title: 'تم إنهاء البث' });
      setActiveRoom(null);
      setCameraReady(false);
      setCameraError('');
      setLiveTokenInfo(null);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
      loadRooms();
    } catch {
      pushToast?.({ type: 'warning', title: 'تعذر إنهاء البث' });
    } finally {
      setBusy('');
    }
  }, [activeRoom, pushToast, loadRooms]);

  const handleSendComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || !activeRoom?.id) return;
    try {
      await sendLiveComment(activeRoom.id, { text });
      setCommentText('');
      loadComments(activeRoom.id);
    } catch {
      pushToast?.({ type: 'warning', title: 'تعذر إرسال التعليق' });
    }
  }, [commentText, activeRoom, pushToast, loadComments]);

  const sendHeart = useCallback(async () => {
    if (!activeRoom?.id) return;
    try {
      await sendLiveHeart(activeRoom.id);
      setHeartsCount((c) => c + 1);
      const heart = { id: Date.now() + Math.random(), icon: '💜', x: Math.floor(Math.random() * 80) + 10 };
      setFloatingHearts((arr) => [...arr.slice(-12), heart]);
    } catch (error) {
      console.error('خطأ في إرسال القلب:', error);
    }
  }, [activeRoom]);

  const handleSendGift = useCallback(async (gift) => {
    if (!activeRoom?.id || !gift) return;
    try {
      await sendLiveGift(activeRoom.id, { gift_id: gift.id, name: gift.name, price: gift.price });
      pushToast?.({ type: 'success', title: `تم إرسال ${gift.name}` });
      setShowGiftTray(false);
    } catch {
      pushToast?.({ type: 'warning', title: 'تعذر إرسال الهدية' });
    }
  }, [activeRoom, pushToast]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    let cancelled = false;

    const stopPreview = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };

    const setupLivePreview = async () => {
      stopPreview();
      setCameraReady(false);
      setCameraError('');
      setLiveTokenInfo(null);

      if (!activeRoom?.id) return;

      const isHost = activeRoom?.host_username === currentUsername;
      if (!isHost) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('هذا المتصفح لا يدعم تشغيل الكاميرا للبث المباشر.');
        return;
      }

      try {
        const [stream, tokenResponse] = await Promise.all([
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: true,
          }),
          startLiveStream(activeRoom.id, { role: 'host' }).catch((error) => ({ error })),
        ]);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          try {
            await localVideoRef.current.play();
          } catch {
            // تجاهل فشل التشغيل التلقائي
          }
        }

        if (tokenResponse?.data?.token) {
          setLiveTokenInfo(tokenResponse.data);
        }

        setCameraReady(true);
      } catch (error) {
        if (cancelled) return;
        const permissionDenied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
        const deviceMissing = error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError';
        setCameraReady(false);
        setCameraError(
          permissionDenied
            ? 'تم رفض إذن الكاميرا أو الميكروفون. اسمح بالوصول ثم أعد المحاولة.'
            : deviceMissing
              ? 'لم يتم العثور على كاميرا أو ميكروفون متاح لهذا البث.'
              : 'تعذر تشغيل معاينة الكاميرا للبث الآن.',
        );
      }
    };

    setupLivePreview();

    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [activeRoom?.id, activeRoom?.host_username, currentUsername]);

  useEffect(() => {
    if (floatingHearts.length === 0) return undefined;
    if (heartTimer.current) clearTimeout(heartTimer.current);
    heartTimer.current = setTimeout(() => setFloatingHearts((arr) => arr.slice(1)), 1500);
    return () => {
      if (heartTimer.current) clearTimeout(heartTimer.current);
    };
  }, [floatingHearts]);

  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
    };
  }, []);

  const filteredRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    if (filter === 'active') return rooms.filter((r) => r.is_active);
    if (filter === 'mine') return rooms.filter((r) => r.host_username === currentUsername);
    return rooms;
  }, [rooms, filter, currentUsername]);

  const isHost = activeRoom?.host_username === currentUsername;
  const hostName = activeRoom?.host_name || activeRoom?.host_username || 'مضيف البث';

  return (
    <MainLayout>
      <div className="yam-live-page" dir="rtl">
        <header className="yam-live-header">
          <div>
            <div className="yam-live-kicker">البث المباشر</div>
            <h1>غرف البث الحية</h1>
            <p>تابع البث المباشر، انضم كمشاهد، أو ابدأ بثك الخاص.</p>
          </div>
          <button type="button" className="yam-live-refresh" onClick={loadRooms} disabled={loading}>
            {loading ? 'جارٍ التحديث…' : '↻ تحديث'}
          </button>
        </header>

        {/* إنشاء غرفة جديدة */}
        <section className="yam-live-create-card">
          <strong>ابدأ بثاً جديداً</strong>
          <div className="yam-live-create-row">
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="عنوان البث (مثال: جلسة دردشة مسائية)"
              aria-label="عنوان البث"
            />
            <button type="button" onClick={handleCreateRoom} disabled={busy === 'create'}>
              {busy === 'create' ? 'جارٍ الإنشاء…' : '🎥 ابدأ البث'}
            </button>
          </div>
        </section>

        {/* فلاتر الغرف */}
        <div className="yam-live-filters" role="tablist">
          {ROOM_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`yam-live-filter ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* قائمة الغرف */}
        <section className="yam-live-rooms-grid">
          {filteredRooms.length === 0 ? (
            <div className="yam-live-empty">
              <div className="yam-live-empty-icon">📡</div>
              <strong>لا توجد غرف بث حالياً</strong>
              <p>أنشئ غرفة جديدة أو حدّث القائمة لمشاهدة آخر البثوث.</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <article key={room.id} className={`yam-live-room-card ${room.is_active ? 'is-active' : ''}`}>
                <div className="yam-live-room-head">
                  <Avatar name={room.host_name || room.host_username || 'مضيف'} size={44} ring={room.is_active} />
                  <div className="yam-live-room-meta">
                    <strong>{room.title || 'بث مباشر'}</strong>
                    <span>المضيف: {room.host_name || room.host_username || '—'}</span>
                  </div>
                  {room.is_active ? <span className="yam-live-live-badge">● مباشر</span> : null}
                </div>
                <div className="yam-live-room-stats">
                  <span>👁 {room.viewers_count || 0}</span>
                  <span>💜 {room.hearts_count || 0}</span>
                </div>
                <button type="button" className="yam-live-room-cta" onClick={() => openRoom(room)}>
                  {room.is_active ? 'انضم للبث' : 'عرض التفاصيل'}
                </button>
              </article>
            ))
          )}
        </section>

        {/* واجهة الغرفة النشطة */}
        {activeRoom ? (
          <section className="yam-live-stage">
            <div className="yam-live-stage-head">
              <div className="yam-live-stage-host">
                <Avatar name={hostName} size={48} ring />
                <div>
                  <strong>{activeRoom.title || 'بث مباشر'}</strong>
                  <span>{hostName}</span>
                </div>
              </div>
              <div className="yam-live-stage-stats">
                <span>👁 {viewerCount}</span>
                <span>💜 {heartsCount}</span>
                {isHost ? (
                  <button type="button" className="yam-live-end-btn" onClick={handleEndRoom} disabled={busy === 'end'}>
                    {busy === 'end' ? 'جارٍ الإنهاء…' : '🛑 إنهاء'}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="yam-live-stage-body">
              {cameraError ? (
                <div className="yam-live-stage-placeholder">
                  <div className="yam-live-stage-icon">⚠️</div>
                  <p>{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={localVideoRef}
                    className="yam-live-stage-video"
                    autoPlay
                    muted
                    playsInline
                  />
                  {!cameraReady && (
                    <div className="yam-live-stage-placeholder">
                      <div className="yam-live-stage-icon">📹</div>
                      <p>جاري تحضير الكاميرا...</p>
                    </div>
                  )}
                </>
              )}
              <FloatingHearts items={floatingHearts} />
            </div>

            <div className="yam-live-actions">
              <button type="button" className="yam-live-action" onClick={sendHeart}>
                💜 قلب ({heartsCount})
              </button>
              <button type="button" className="yam-live-action" onClick={() => setShowGiftTray(!showGiftTray)}>
                🎁 هدية
              </button>
            </div>

            {showGiftTray && (
              <div className="yam-live-gift-tray">
                {GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    type="button"
                    className="yam-live-gift"
                    onClick={() => handleSendGift(gift)}
                    title={`${gift.name} - ${gift.price} نقطة`}
                  >
                    <span className="yam-live-gift-icon">{gift.icon}</span>
                    <span>{gift.name}</span>
                    <small>{gift.price}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="yam-live-comments">
              <div className="yam-live-comments-list">
                {comments.length === 0 ? (
                  <div className="yam-live-comments-empty">لا توجد تعليقات حالياً</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="yam-live-comment-row">
                      <Avatar name={comment.username} size={32} />
                      <div>
                        <strong>{comment.username}</strong>
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="yam-live-comment-input">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendComment();
                  }}
                  placeholder="أضف تعليقاً..."
                />
                <button type="button" onClick={handleSendComment} disabled={!commentText.trim()}>
                  إرسال
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <style>{`
          .yam-live-page { padding: 16px; }
          .yam-live-header { display: grid; gap: 16px; margin-bottom: 24px; }
          .yam-live-header > div { display: grid; gap: 6px; }
          .yam-live-kicker { font-size: 12px; color: var(--muted, #888); font-weight: 700; text-transform: uppercase; }
          .yam-live-header h1 { margin: 0; font-size: 28px; }
          .yam-live-header p { margin: 0; color: var(--muted, #888); }
          .yam-live-refresh {
            min-height: 40px;
            padding: 0 14px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--panel, #1a1a25);
            color: var(--text, #fff);
            cursor: pointer;
          }
          .yam-live-create-card {
            background: var(--panel, #1a1a25);
            border: 1px solid var(--line, #2a2a3a);
            border-radius: 16px;
            padding: 14px;
            display: grid;
            gap: 10px;
            margin-bottom: 20px;
          }
          .yam-live-create-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .yam-live-create-row input {
            flex: 1;
            min-width: 200px;
            min-height: 44px;
            padding: 0 12px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--bg, #0e0e18);
            color: var(--text, #fff);
          }
          .yam-live-create-row button {
            min-height: 44px;
            padding: 0 18px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
            font-weight: 700;
            cursor: pointer;
          }
          .yam-live-filters {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            margin-bottom: 20px;
          }
          .yam-live-filter {
            min-height: 38px;
            padding: 0 16px;
            border-radius: 999px;
            border: 1px solid var(--line, #2a2a3a);
            background: transparent;
            color: var(--text, #fff);
            cursor: pointer;
          }
          .yam-live-filter.active {
            background: var(--accent, #8b5cf6);
            border-color: var(--accent, #8b5cf6);
            color: white;
          }
          .yam-live-rooms-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            margin-bottom: 24px;
          }
          .yam-live-empty {
            grid-column: 1 / -1;
            text-align: center;
            padding: 32px;
            background: var(--panel, #1a1a25);
            border-radius: 16px;
            border: 1px dashed var(--line, #2a2a3a);
          }
          .yam-live-empty-icon { font-size: 40px; }
          .yam-live-room-card {
            background: var(--panel, #1a1a25);
            border: 1px solid var(--line, #2a2a3a);
            border-radius: 16px;
            padding: 14px;
            display: grid;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .yam-live-room-card:hover {
            border-color: #8b5cf6;
            background: rgba(139, 92, 246, 0.05);
          }
          .yam-live-room-card.is-active { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }
          .yam-live-room-head { display: flex; align-items: center; gap: 10px; }
          .yam-live-room-meta { flex: 1; }
          .yam-live-room-meta strong { display: block; }
          .yam-live-room-meta span { font-size: 12px; color: var(--muted, #888); }
          .yam-live-live-badge { font-size: 11px; color: #ef4444; font-weight: 700; }
          .yam-live-room-stats { display: flex; gap: 14px; font-size: 13px; color: var(--muted, #888); }
          .yam-live-room-cta {
            min-height: 40px;
            border-radius: 10px;
            border: none;
            background: var(--accent, #8b5cf6);
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .yam-live-room-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
          .yam-live-stage {
            background: var(--panel, #1a1a25);
            border: 1px solid var(--line, #2a2a3a);
            border-radius: 16px;
            padding: 14px;
            display: grid;
            gap: 12px;
          }
          .yam-live-stage-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
          .yam-live-stage-host { display: flex; gap: 10px; align-items: center; }
          .yam-live-stage-stats { display: flex; gap: 12px; align-items: center; }
          .yam-live-end-btn {
            min-height: 38px;
            padding: 0 14px;
            border-radius: 10px;
            border: none;
            background: #ef4444;
            color: white;
            font-weight: 700;
            cursor: pointer;
          }
          .yam-live-stage-body {
            position: relative;
            min-height: 280px;
            border-radius: 14px;
            background: linear-gradient(135deg, #1a1230, #0e0e18);
            display: grid;
            place-items: center;
            overflow: hidden;
          }
          .yam-live-stage-video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            background: #05070f;
          }
          .yam-live-stage-placeholder {
            text-align: center;
            padding: 24px;
            display: grid;
            gap: 8px;
            z-index: 1;
          }
          .yam-live-stage-icon { font-size: 56px; }
          .yam-floating-hearts { position: absolute; inset: 0; pointer-events: none; }
          .yam-floating-heart { position: absolute; bottom: 0; font-size: 22px; animation: yam-rise 1.5s ease-out forwards; }
          @keyframes yam-rise { from { bottom: 0; opacity: 1; } to { bottom: 90%; opacity: 0; } }
          .yam-live-actions { display: flex; gap: 8px; flex-wrap: wrap; }
          .yam-live-action {
            min-height: 42px;
            padding: 0 16px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--bg, #0e0e18);
            color: var(--text, #fff);
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          .yam-live-action:hover {
            background: var(--accent, #8b5cf6);
            border-color: var(--accent, #8b5cf6);
          }
          .yam-live-gift-tray {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 8px;
            padding: 10px;
            background: var(--bg, #0e0e18);
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
          }
          .yam-live-gift {
            display: grid;
            gap: 4px;
            justify-items: center;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--panel, #1a1a25);
            color: var(--text, #fff);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .yam-live-gift:hover {
            background: var(--accent, #8b5cf6);
            border-color: var(--accent, #8b5cf6);
            transform: translateY(-2px);
          }
          .yam-live-gift-icon { font-size: 26px; }
          .yam-live-gift small { color: var(--muted, #888); font-size: 11px; }
          .yam-live-comments { display: grid; gap: 8px; }
          .yam-live-comments-list {
            max-height: 240px;
            overflow-y: auto;
            display: grid;
            gap: 8px;
            padding: 6px;
            background: var(--bg, #0e0e18);
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
          }
          .yam-live-comments-empty { color: var(--muted, #888); font-size: 13px; text-align: center; padding: 12px; }
          .yam-live-comment-row { display: flex; gap: 8px; align-items: flex-start; padding: 6px; }
          .yam-live-comment-row strong { display: block; }
          .yam-live-comment-row p { margin: 2px 0 0; font-size: 14px; }
          .yam-live-comment-input { display: flex; gap: 8px; }
          .yam-live-comment-input input {
            flex: 1;
            min-height: 42px;
            padding: 0 12px;
            border-radius: 12px;
            border: 1px solid var(--line, #2a2a3a);
            background: var(--bg, #0e0e18);
            color: var(--text, #fff);
          }
          .yam-live-comment-input button {
            min-height: 42px;
            padding: 0 16px;
            border-radius: 12px;
            border: none;
            background: var(--accent, #8b5cf6);
            color: white;
            font-weight: 700;
            cursor: pointer;
          }

          @media (max-width: 640px) {
            .yam-live-page { padding: 12px; }
            .yam-live-rooms-grid { grid-template-columns: 1fr; }
            .yam-live-stage-body { min-height: 220px; }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
