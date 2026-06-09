import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getActiveLiveStreams,
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
  getLiveStreamViewers,
  getLiveToken,
  addViewer,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';
import socketManager from '../services/socketManager.js';
import livekitService from '../services/livekitService.js';
import '../styles/modern-live-viewer.css';
import '../styles/modern-live-viewer-override.css';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
  { id: 5, name: 'تاج ملكي', icon: '👑', price: 1000 },
];

function Avatar({ name = '', size = 42 }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color,
        color: 'white',
        fontWeight: 900,
        fontSize: size / 2.5,
        flexShrink: 0,
      }}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function FloatingHearts({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mlv-floating-hearts" aria-hidden="true">
      {items.map((heart) => (
        <div
          key={heart.id}
          className="mlv-floating-heart"
          style={{
            right: `${heart.x}%`,
            animation: `mlvFloatUp 1.5s ease-out forwards`,
          }}
        >
          {heart.icon || '💜'}
        </div>
      ))}
    </div>
  );
}

export default function LiveViewer() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();
  const { streamId } = useParams();

  // حالة البثوث
  const [streams, setStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // بيانات البث النشط
  const [streamDetails, setStreamDetails] = useState(null);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    hearts: 0,
    comments: 0,
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  // الحالات الأخرى
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewers, setViewers] = useState([]);

  const heartTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const commentsIntervalRef = useRef(null);
  const playerVideoRef = useRef(null);
  const attachedStreamRef = useRef(null);
  const statsErrorCountRef = useRef(0);
  const commentsErrorCountRef = useRef(0);
  const streamEndedRef = useRef(false);
  const routeStreamId = String(streamId || '').trim();

  const [streamEnded, setStreamEnded] = useState(false);
  const [hasRemotePlayback, setHasRemotePlayback] = useState(false);

  const stopAllPolling = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (commentsIntervalRef.current) {
      clearInterval(commentsIntervalRef.current);
      commentsIntervalRef.current = null;
    }
  }, []);

  const isExpectedApiError = (error) => {
    const status = error?.response?.status;
    return status === 401 || status === 403 || status === 404;
  };

  const detachRemoteStream = useCallback(() => {
    attachedStreamRef.current = null;
    if (playerVideoRef.current) {
      try {
        playerVideoRef.current.pause?.();
        playerVideoRef.current.srcObject = null;
        playerVideoRef.current.removeAttribute('src');
        playerVideoRef.current.load?.();
      } catch {
        // ignore detach failures
      }
    }
    setHasRemotePlayback(false);
  }, []);

  const attachRemoteStream = useCallback(() => {
    const room = livekitService.room;
    const player = playerVideoRef.current;
    if (!room || !player) {
      setHasRemotePlayback(false);
      return false;
    }

    const mediaTracks = [];
    room.remoteParticipants?.forEach?.((participant) => {
      participant?.trackPublications?.forEach?.((publication) => {
        const mediaTrack = publication?.track?.mediaStreamTrack;
        if (!mediaTrack) return;
        if (!mediaTracks.some((track) => track.id === mediaTrack.id)) {
          mediaTracks.push(mediaTrack);
        }
      });
    });

    if (!mediaTracks.length) {
      setHasRemotePlayback(false);
      return false;
    }

    try {
      const mediaStream = new MediaStream(mediaTracks);
      attachedStreamRef.current = mediaStream;
      player.srcObject = mediaStream;
      player.muted = false;
      player.playsInline = true;
      player.autoplay = true;
      player.play?.().catch(() => {});
      setHasRemotePlayback(true);
      return true;
    } catch {
      setHasRemotePlayback(false);
      return false;
    }
  }, []);

  const connectToLivePlayback = useCallback(async (targetStreamId) => {
    try {
      const tokenResponse = await getLiveToken(targetStreamId, { role: 'viewer' });
      const livekitUrl = tokenResponse?.data?.livekit_url || '';
      const livekitRoom = tokenResponse?.data?.livekit_room || '';
      const token = tokenResponse?.data?.token || '';
      if (!livekitUrl || !livekitRoom || !token) {
        setHasRemotePlayback(false);
        return false;
      }

      const livekitResult = await livekitService.connect(
        livekitUrl,
        token,
        livekitRoom,
        currentUsername,
        { autoSubscribe: true },
      );

      if (!livekitResult?.success) {
        setHasRemotePlayback(false);
        return false;
      }

      setTimeout(() => {
        attachRemoteStream();
      }, 300);
      return true;
    } catch (error) {
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] تعذّر الاتصال ببث LiveKit:', error?.message || error);
      }
      setHasRemotePlayback(false);
      return false;
    }
  }, [attachRemoteStream, currentUsername]);

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 100 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      setStreams(allStreams);

      let filtered = allStreams;
      if (filter === 'active') {
        filtered = allStreams.filter(s => s.is_active);
      } else if (filter === 'popular') {
        filtered = allStreams
          .filter(s => s.is_active)
          .sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0));
      }
      setFilteredStreams(filtered);
    } catch (error) {
      console.error('خطأ في تحميل البثوث:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // فتح البث
  const openStream = useCallback(async (stream, options = {}) => {
    if (!stream?.id) return;

    if (options.syncUrl !== false) {
      navigate(`/live/view/${stream.id}`);
    }

    if (activeStream?.id && String(activeStream.id) !== String(stream.id)) {
      socketManager.emit('leave_live', { room_id: activeStream.id }, { queue: false });
    }

    stopAllPolling();
    detachRemoteStream();
    await livekitService.disconnect().catch(() => {});
    statsErrorCountRef.current = 0;
    commentsErrorCountRef.current = 0;
    streamEndedRef.current = false;
    setStreamEnded(false);
    setHasRemotePlayback(false);

    setActiveStream(stream);

    try {
      socketManager.connect();
      socketManager.emit('join_live', {
        room_id: stream.id,
        role: 'viewer',
        platform: 'web',
        device_type: 'browser',
      }, { queue: false });

      await addViewer(stream.id, {
        username: currentUsername,
        platform: 'web',
        device_type: 'browser',
      }).catch(() => null);

      const detailsResponse = await getLiveStreamDetails(stream.id).catch((err) => {
        if (!isExpectedApiError(err)) throw err;
        return null;
      });
      if (detailsResponse?.data) {
        setStreamDetails(detailsResponse.data);
        setStreamStats({
          viewers: detailsResponse.data.viewers_count ?? detailsResponse.data.viewer_count ?? 0,
          hearts: detailsResponse.data.hearts_count ?? 0,
          comments: detailsResponse.data.comments_count ?? 0,
        });
      }

      await connectToLivePlayback(stream.id).catch(() => false);

      const commentsResponse = await getLiveComments(stream.id).catch((err) => {
        if (!isExpectedApiError(err)) throw err;
        return { data: [] };
      });
      setComments(Array.isArray(commentsResponse?.data) ? commentsResponse.data : []);

      const viewersResponse = await getLiveStreamViewers(stream.id).catch(() => null);
      if (viewersResponse?.data?.viewers) {
        setViewers(viewersResponse.data.viewers);
      }

      statsIntervalRef.current = setInterval(() => {
        if (streamEndedRef.current) return;
        updateStreamStats(stream.id);
      }, 5000);

      commentsIntervalRef.current = setInterval(() => {
        if (streamEndedRef.current) return;
        loadComments(stream.id);
      }, 4000);

      pushToast?.({
        type: 'success',
        title: 'تم الانضمام للبث',
        description: `مرحباً في بث ${stream.title}`,
      });
    } catch (error) {
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] فشل غير متوقع عند فتح البث', error?.message || error);
      }
      pushToast?.({
        type: 'warning',
        title: 'خطأ في فتح البث',
        description: 'حاول مرة أخرى',
      });
    }
  }, [navigate, pushToast, stopAllPolling, detachRemoteStream, connectToLivePlayback, currentUsername, activeStream?.id]);

  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getLiveStreamStats(streamId);
      if (response?.data) {
        statsErrorCountRef.current = 0;
        setStreamStats(prev => ({
          ...prev,
          viewers: response.data.viewers_count ?? response.data.viewer_count ?? response.data.unique_viewers ?? prev.viewers,
          hearts: response.data.hearts_count ?? prev.hearts,
        }));
      }
    } catch (error) {
      const status = error?.response?.status;
      statsErrorCountRef.current += 1;

      if (status === 404) {
        streamEndedRef.current = true;
        setStreamEnded(true);
        stopAllPolling();
        return;
      }

      if (status === 403 && statsErrorCountRef.current >= 1) {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
        return;
      }

      if (statsErrorCountRef.current >= 3) {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
        return;
      }

      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] تعذّر تحديث الإحصائيات:', status || error?.message);
      }
    }
  }, [stopAllPolling]);

  const loadComments = useCallback(async (streamId) => {
    try {
      const response = await getLiveComments(streamId, 50);
      commentsErrorCountRef.current = 0;
      setComments(Array.isArray(response?.data) ? response.data : []);
      setStreamStats(prev => ({
        ...prev,
        comments: Array.isArray(response?.data) ? response.data.length : 0,
      }));
    } catch (error) {
      const status = error?.response?.status;
      commentsErrorCountRef.current += 1;

      if (status === 404) {
        if (commentsIntervalRef.current) {
          clearInterval(commentsIntervalRef.current);
          commentsIntervalRef.current = null;
        }
        return;
      }

      if (commentsErrorCountRef.current >= 3) {
        if (commentsIntervalRef.current) {
          clearInterval(commentsIntervalRef.current);
          commentsIntervalRef.current = null;
        }
        return;
      }

      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] تعذّر تحميل التعليقات:', status || error?.message);
      }
    }
  }, []);

  const handleSendHeart = useCallback(async () => {
    if (!activeStream?.id) return;
    try {
      await sendLiveHeart(activeStream.id);
      const newHeart = {
        id: Date.now(),
        x: Math.random() * 80 + 10,
        icon: '💜',
      };
      setFloatingHearts(prev => [...prev, newHeart]);
      setStreamStats(prev => ({
        ...prev,
        hearts: prev.hearts + 1,
      }));
    } catch (error) {
      console.error('خطأ في إرسال القلب:', error);
    }
  }, [activeStream?.id]);

  const handleSendGift = useCallback(async (gift) => {
    if (!activeStream?.id) return;
    try {
      await sendLiveGift(activeStream.id, gift.id);
      pushToast?.({
        type: 'success',
        title: `تم إرسال ${gift.name}`,
        description: 'شكراً على الدعم!',
      });

      setShowGiftPanel(false);
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال الهدية',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, pushToast]);

  const handleSendComment = useCallback(async () => {
    if (!activeStream?.id || !commentText.trim()) return;
    try {
      await sendLiveComment(activeStream.id, commentText);
      setCommentText('');
      await loadComments(activeStream.id);
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال التعليق',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream?.id, commentText, pushToast]);

  // تنظيف القلوب الطائرة
  useEffect(() => {
    if (floatingHearts.length === 0) return;

    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      setFloatingHearts(prev => prev.slice(1));
    }, 1500);

    return () => {
      if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    };
  }, [floatingHearts]);

  useEffect(() => {
    const unsubscribe = livekitService.subscribe((snapshot = {}) => {
      if (['participant_connected', 'track_subscribed', 'reconnected', 'track_unsubscribed'].includes(snapshot?.event)) {
        setTimeout(() => {
          attachRemoteStream();
        }, 120);
      }
      if (snapshot?.event === 'disconnected') {
        detachRemoteStream();
      }
    });
    return () => unsubscribe?.();
  }, [attachRemoteStream, detachRemoteStream]);

  // تحميل البثوث عند التحميل
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // فتح البث المطلوب من الرابط مباشرة
  useEffect(() => {
    if (!routeStreamId) return;

    if (streams.length) {
      const matchedStream = streams.find((stream) => String(stream.id) === routeStreamId);
      if (matchedStream && String(activeStream?.id || '') !== String(matchedStream.id)) {
        openStream(matchedStream, { syncUrl: false });
        return;
      }
      if (matchedStream) return;
    }

    if (String(activeStream?.id || '') === routeStreamId) return;

    (async () => {
      try {
        const detailsResponse = await getLiveStreamDetails(routeStreamId);
        if (detailsResponse?.data) {
          const data = detailsResponse.data;
          const stub = {
            id: data.id || routeStreamId,
            title: data.title || 'بث مباشر',
            host_username: data.host_username || data.host || 'مضيف',
            host_name: data.host_name || data.host_username || 'مضيف',
            thumbnail_url: data.thumbnail_url || data.cover_url || data.preview_url || '',
            is_active: (data.is_active ?? data.active) !== false,
            viewers_count: data.viewers_count ?? data.viewer_count ?? 0,
            hearts_count: data.hearts_count ?? 0,
          };
          openStream(stub, { syncUrl: false });
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 404 || status === 403) {
          setStreamEnded(true);
          streamEndedRef.current = true;
          stopAllPolling();
        } else {
          console.warn('[LiveViewer] تعذّر تحميل تفاصيل البث:', status || error?.message);
        }
      }
    })();
  }, [routeStreamId, streams, activeStream?.id, openStream, stopAllPolling]);

  // تطبيق الفلتر
  useEffect(() => {
    let filtered = streams;
    if (filter === 'active') {
      filtered = streams.filter(s => s.is_active);
    } else if (filter === 'popular') {
      filtered = streams
        .filter(s => s.is_active)
        .sort((a, b) => (b.viewers_count || 0) - (a.viewers_count || 0));
    }
    setFilteredStreams(filtered);
  }, [streams, filter]);

  // تنظيف الفترات الزمنية
  useEffect(() => {
    return () => {
      stopAllPolling();
      if (activeStream?.id) {
        socketManager.emit('leave_live', { room_id: activeStream.id }, { queue: false });
      }
      detachRemoteStream();
      livekitService.disconnect().catch(() => {});
    };
  }, [stopAllPolling, activeStream?.id, detachRemoteStream]);

  const hostName = activeStream?.host_name || activeStream?.host_username || 'مضيف البث';
  const rawCover = (
    streamDetails?.thumbnail_url
      || streamDetails?.cover_url
      || streamDetails?.preview_url
      || streamDetails?.cover_image_url
      || streamDetails?.image_url
      || activeStream?.thumbnail_url
      || activeStream?.cover_url
      || activeStream?.preview_url
      || activeStream?.cover_image_url
      || activeStream?.image_url
      || ''
  );
  const coverImage = resolveMediaUrl(rawCover);
  const playbackUrl = resolveMediaUrl(
    streamDetails?.hls_url
      || streamDetails?.playback_url
      || streamDetails?.stream_url
      || streamDetails?.video_url
      || activeStream?.hls_url
      || activeStream?.playback_url
      || activeStream?.stream_url
      || activeStream?.video_url
      || ''
  );

  const getFallbackCover = (seedText = '') => {
    const palette = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899', '#06b6d4'];
    const hash = String(seedText || hostName || 'live')
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const c1 = palette[hash % palette.length];
    const c2 = palette[(hash + 2) % palette.length];
    const initial = (String(seedText || hostName || 'L').charAt(0) || 'L').toUpperCase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="r" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <rect width="800" height="450" fill="url(#r)"/>
  <circle cx="400" cy="205" r="95" fill="rgba(255,255,255,0.18)"/>
  <text x="400" y="235" font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="110" font-weight="900" fill="#fff" text-anchor="middle">${initial}</text>
  <text x="400" y="360" font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle">بث مباشر</text>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const fallbackCover = getFallbackCover(activeStream?.title || hostName);
  const effectiveCover = coverImage || fallbackCover;

  return (
    <div className="mlv-mobile-viewer" dir="rtl">
      {/* Header */}
      <header className="mlv-mobile-header">
        <div className="mlv-mobile-header-top">
          <button className="mlv-mobile-close-btn" onClick={() => navigate(-1)}>
            ✕
          </button>
          <div className="mlv-mobile-header-info">
            <h1>Yamshat Official</h1>
            <p className="mlv-mobile-header-viewers">12.8K مشاهد</p>
          </div>
          <div className="mlv-mobile-header-actions">
            <button className="mlv-mobile-action-icon">👤</button>
            <button className="mlv-mobile-action-icon">👥</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mlv-mobile-main">
        {activeStream ? (
          <>
            {/* Video Player */}
            <div className="mlv-mobile-player">
              {(hasRemotePlayback || playbackUrl) ? (
                <video
                  ref={playerVideoRef}
                  className="mlv-mobile-player-video"
                  src={!hasRemotePlayback ? playbackUrl || undefined : undefined}
                  poster={effectiveCover}
                  autoPlay
                  playsInline
                  muted={false}
                  controls
                  onError={(e) => {
                    if (!hasRemotePlayback) {
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                />
              ) : null}
              <img
                src={effectiveCover}
                alt={activeStream.title || 'غلاف البث'}
                className="mlv-mobile-player-cover"
                onError={(e) => {
                  if (e.currentTarget.src !== fallbackCover) {
                    e.currentTarget.src = fallbackCover;
                  }
                }}
              />
              <div className="mlv-mobile-player-overlay" style={{ opacity: hasRemotePlayback || playbackUrl ? 0.15 : 1 }}>
                <div className="mlv-mobile-player-content">
                  <div className="mlv-mobile-player-icon">📺</div>
                  <p>{activeStream.title || 'جارٍ تحميل البث…'}</p>
                </div>
              </div>
              <FloatingHearts items={floatingHearts} />

              {/* Top Right Badges */}
              <div className="mlv-mobile-top-badges">
                <div className="mlv-mobile-viewers-badge">
                  <span className="mlv-mobile-badge-icon">👁</span>
                  <span className="mlv-mobile-badge-text">10K+</span>
                </div>
                <div className="mlv-mobile-profile-badge">
                  <Avatar name={hostName} size={36} />
                </div>
              </div>

              {/* Bottom Right Actions */}
              <div className="mlv-mobile-right-actions">
                <button className="mlv-mobile-action-btn mlv-mobile-action-heart" onClick={handleSendHeart}>
                  <span>💜</span>
                  <span className="mlv-mobile-action-count">25.7K</span>
                </button>
                <button className="mlv-mobile-action-btn mlv-mobile-action-comment">
                  <span>💬</span>
                  <span className="mlv-mobile-action-count">1,245</span>
                </button>
                <button className="mlv-mobile-action-btn mlv-mobile-action-gift" onClick={() => setShowGiftPanel(!showGiftPanel)}>
                  <span>🎁</span>
                  <span className="mlv-mobile-action-label">هدية</span>
                </button>
                <button className="mlv-mobile-action-btn mlv-mobile-action-share">
                  <span>↗</span>
                  <span className="mlv-mobile-action-count">1,026</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mlv-mobile-comments-section">
              <div className="mlv-mobile-comments-list">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="mlv-mobile-comment-item">
                      <Avatar name={comment.username || comment.user} size={32} />
                      <div className="mlv-mobile-comment-content">
                        <div className="mlv-mobile-comment-header">
                          <span className="mlv-mobile-comment-name">{comment.username || comment.user}</span>
                          {comment.gift_count && (
                            <span className="mlv-mobile-comment-gift">💜 {comment.gift_count}</span>
                          )}
                        </div>
                        <p className="mlv-mobile-comment-text">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mlv-mobile-empty-comments">
                    <p>لا توجد تعليقات بعد</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="mlv-mobile-comment-input-area">
                <input
                  type="text"
                  placeholder="إضافة تعليق..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  className="mlv-mobile-comment-input"
                />
                <button className="mlv-mobile-comment-emoji-btn">😊</button>
                <button className="mlv-mobile-comment-send-btn" onClick={handleSendComment}>
                  ↗
                </button>
              </div>
            </div>

            {/* Gifts Panel */}
            {showGiftPanel && (
              <div className="mlv-mobile-gifts-panel">
                <h3>اختر هدية</h3>
                <div className="mlv-mobile-gifts-list">
                  {GIFTS.map((gift) => (
                    <button
                      key={gift.id}
                      className="mlv-mobile-gift-option"
                      onClick={() => handleSendGift(gift)}
                    >
                      <span className="mlv-mobile-gift-icon">{gift.icon}</span>
                      <span className="mlv-mobile-gift-name">{gift.name}</span>
                      <span className="mlv-mobile-gift-price">{gift.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mlv-mobile-no-stream">
            <div className="mlv-mobile-empty-icon">📺</div>
            <h2>لا يوجد بث نشط</h2>
            <p>اختر بث من القائمة لمشاهدته</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="mlv-mobile-bottom-nav">
        <button className="mlv-mobile-nav-item">😊</button>
        <button className="mlv-mobile-nav-item">👥</button>
        <button className="mlv-mobile-nav-item">🌹</button>
        <button className="mlv-mobile-nav-item">🎁</button>
        <button className="mlv-mobile-nav-item">↗</button>
      </nav>
    </div>
  );
}
