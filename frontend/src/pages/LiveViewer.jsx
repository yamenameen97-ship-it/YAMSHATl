import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// ✅ FIX (2026-06-10): دالة مساعدة خارج المكوّن لتفادي TDZ في minified bundle
function resolveHostName(stream) {
  if (!stream) return 'مضيف البث';
  return stream.host_name || stream.host_username || stream.host || 'مضيف البث';
}

function isExpectedApiError(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403 || status === 404;
}

function Avatar({ name = '', size = 42 }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const safeName = String(name || '');
  const hash = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
      {safeName.charAt(0).toUpperCase() || '?'}
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

// ✅ FIX (2026-06-10): SVG fallback خارج المكوّن لتفادي recreate وتفادي TDZ
function buildFallbackCover(seedText = 'live') {
  const palette = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899', '#06b6d4'];
  const seed = String(seedText || 'live');
  const hash = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const c1 = palette[hash % palette.length];
  const c2 = palette[(hash + 2) % palette.length];
  const initial = (seed.charAt(0) || 'L').toUpperCase();
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
    shares: 0,
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  // ✅ FIX (2026-06-11): إضافة state لفتح/طي قسم التعليقات في فورم عرض البث.
  // قبلاً: زر التعليق بلا onClick → الضغط لا يفعل شيئاً.
  // افتراضياً مفتوح في وضع الموبايل (تجربة TikTok/Instagram Live).
  const [showComments, setShowComments] = useState(true);

  // الحالات الأخرى
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [, setIsFollowing] = useState(false);
  const [, setViewers] = useState([]);

  const heartTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const commentsIntervalRef = useRef(null);
  const playerVideoRef = useRef(null);
  const attachedStreamRef = useRef(null);
  const statsErrorCountRef = useRef(0);
  const commentsErrorCountRef = useRef(0);
  const streamEndedRef = useRef(false);
  const attachRetryRef = useRef(null);
  const attachRetryCountRef = useRef(0);
  const routeStreamId = String(streamId || '').trim();

  const [streamEnded, setStreamEnded] = useState(false);
  const [hasRemotePlayback, setHasRemotePlayback] = useState(false);
  const [streamNotFound, setStreamNotFound] = useState(false);

  // ✅ FIX (2026-06-10) — المشكلة الأصلية: ReferenceError: Cannot access 'hostName' before initialization
  // السبب الجذري: في minified bundle كان hostName معرّفاً كـ const ويُستخدم في useCallback closures
  // قبل أن يصل التنفيذ لسطر تعريفه (TDZ في إعادة ترتيب الـ rollup).
  // الحل: useMemo + ref لجعل القيمة متاحة بأمان في كل closure.
  const hostName = useMemo(
    () => resolveHostName(activeStream),
    [activeStream?.host_name, activeStream?.host_username, activeStream?.host]
  );

  // مرجع للحفاظ على آخر قيمة hostName ليستخدمه أي callback غير مرتبط بدورة re-render
  const hostNameRef = useRef(hostName);
  useEffect(() => {
    hostNameRef.current = hostName;
  }, [hostName]);

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

  // ✅ منطق إرفاق المسار البعيد مع إعادة محاولة تلقائية
  const attachRemoteStream = useCallback(() => {
    const player = playerVideoRef.current;
    if (!player) {
      setHasRemotePlayback(false);
      return false;
    }

    const mediaStream = livekitService.buildRemoteMediaStream?.()
      || (() => {
        const room = livekitService.room;
        if (!room) return null;
        const tracks = [];
        room.remoteParticipants?.forEach?.((participant) => {
          participant?.trackPublications?.forEach?.((publication) => {
            const mt = publication?.track?.mediaStreamTrack;
            if (mt && !tracks.some((t) => t.id === mt.id)) tracks.push(mt);
          });
        });
        return tracks.length ? new MediaStream(tracks) : null;
      })();

    if (!mediaStream) {
      setHasRemotePlayback(false);
      if (attachRetryCountRef.current < 20 && livekitService.room) {
        attachRetryCountRef.current += 1;
        if (attachRetryRef.current) clearTimeout(attachRetryRef.current);
        attachRetryRef.current = setTimeout(() => {
          attachRemoteStream();
        }, 1500);
      }
      return false;
    }

    try {
      attachedStreamRef.current = mediaStream;
      player.srcObject = mediaStream;
      player.playsInline = true;
      player.autoplay = true;
      player.muted = false;
      const playPromise = player.play?.();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          try {
            player.muted = true;
            player.play?.().catch(() => {});
          } catch { /* ignore */ }
        });
      }
      attachRetryCountRef.current = 0;
      if (attachRetryRef.current) {
        clearTimeout(attachRetryRef.current);
        attachRetryRef.current = null;
      }
      setHasRemotePlayback(true);
      return true;
    } catch (err) {
      console.warn('[LiveViewer] attach failed:', err?.message);
      setHasRemotePlayback(false);
      return false;
    }
  }, []);

  const connectToLivePlayback = useCallback(async (targetStreamId) => {
    try {
      const tokenResponse = await getLiveToken(targetStreamId, { role: 'viewer' });
      const livekitUrl = tokenResponse?.data?.livekit_url || tokenResponse?.data?.url || '';
      const livekitRoom = tokenResponse?.data?.livekit_room || tokenResponse?.data?.room || '';
      const token = tokenResponse?.data?.token || '';

      if (!livekitUrl || !livekitRoom || !token) {
        console.warn('[LiveViewer] استجابة /token ناقصة:', {
          hasUrl: !!livekitUrl, hasRoom: !!livekitRoom, hasToken: !!token,
        });
        setHasRemotePlayback(false);
        pushToast?.({
          type: 'warning',
          title: 'البث غير متاح',
          description: 'خدمة LiveKit غير مهيأة على الخادم.',
        });
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
        console.warn('[LiveViewer] فشل اتصال LiveKit:', livekitResult?.error);
        setHasRemotePlayback(false);
        return false;
      }

      attachRetryCountRef.current = 0;
      setTimeout(() => attachRemoteStream(), 300);
      setTimeout(() => attachRemoteStream(), 1200);
      setTimeout(() => attachRemoteStream(), 3000);
      return true;
    } catch (error) {
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] تعذّر الاتصال ببث LiveKit:', error?.message || error);
      }
      setHasRemotePlayback(false);
      return false;
    }
  }, [attachRemoteStream, currentUsername, pushToast]);

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 100 });
      const rawStreams = Array.isArray(response?.data) ? response.data : [];
      const seen = new Set();
      const allStreams = rawStreams.filter((s) => {
        const sid = String(s?.id || '');
        if (!sid || seen.has(sid)) return false;
        seen.add(sid);
        return true;
      });
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
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] خطأ في تحميل البثوث:', error?.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // ✅ FIX (2026-06-10): تحديث الإحصائيات (forward declaration via ref pattern)
  const updateStreamStatsRef = useRef(null);
  const loadCommentsRef = useRef(null);

  const updateStreamStats = useCallback(async (sid) => {
    try {
      const response = await getLiveStreamStats(sid);
      if (response?.data) {
        statsErrorCountRef.current = 0;
        setStreamStats(prev => ({
          ...prev,
          viewers: response.data.viewers_count ?? response.data.viewer_count ?? response.data.unique_viewers ?? prev.viewers,
          hearts: response.data.hearts_count ?? prev.hearts,
        }));
        if (response.data.is_active === false || response.data.stream_status === 'ended') {
          streamEndedRef.current = true;
          setStreamEnded(true);
          stopAllPolling();
        }
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

  const loadComments = useCallback(async (sid) => {
    try {
      const response = await getLiveComments(sid, 50);
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

  // مزامنة المراجع بعد التعريف لتجنب TDZ في openStream
  useEffect(() => {
    updateStreamStatsRef.current = updateStreamStats;
    loadCommentsRef.current = loadComments;
  }, [updateStreamStats, loadComments]);

  // ✅ FIX (2026-06-11 v11): مرجع لتتبّع آخر streamId المتصل به
  // لتفادي disconnect غير ضروري عند فتح نفس البث من useEffect (StrictMode double-invoke).
  const connectedStreamIdRef = useRef(null);
  const isConnectingRef = useRef(false);

  // فتح البث
  const openStream = useCallback(async (stream, options = {}) => {
    if (!stream?.id) return;

    // ✅ FIX (2026-06-11 v11): تجاهل مكالمات openStream المكرّرة لنفس البث
    // (StrictMode + useEffect على routeStreamId + streams كانا يستدعيان openStream مرتين
    //  في نفس tick → ينفّذ disconnect ثم connect ثم disconnect → WebSocket closes).
    if (isConnectingRef.current && String(connectedStreamIdRef.current) === String(stream.id)) {
      return;
    }
    if (String(connectedStreamIdRef.current) === String(stream.id) && livekitService.room) {
      // متصلون أصلاً بنفس البث — لا تفعل شيء
      return;
    }

    isConnectingRef.current = true;

    if (options.syncUrl !== false) {
      navigate(`/live/view/${stream.id}`);
    }

    // فصل البث السابق فقط إذا كان مختلفاً
    if (connectedStreamIdRef.current && String(connectedStreamIdRef.current) !== String(stream.id)) {
      socketManager.emit('leave_live', { room_id: connectedStreamIdRef.current }, { queue: false });
      stopAllPolling();
      detachRemoteStream();
      await livekitService.disconnect().catch(() => {});
    }

    statsErrorCountRef.current = 0;
    commentsErrorCountRef.current = 0;
    streamEndedRef.current = false;
    setStreamEnded(false);
    setStreamNotFound(false);
    setHasRemotePlayback(false);

    connectedStreamIdRef.current = stream.id;
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
        // ✅ FIX (2026-06-10): التعامل الصامت مع 404 (البث انتهى/حُذف)
        const status = err?.response?.status;
        if (status === 404) {
          setStreamNotFound(true);
          streamEndedRef.current = true;
        }
        return null;
      });
      if (detailsResponse?.data) {
        setStreamDetails(detailsResponse.data);
        setStreamStats({
          viewers: detailsResponse.data.viewers_count ?? detailsResponse.data.viewer_count ?? 0,
          hearts: detailsResponse.data.hearts_count ?? 0,
          comments: detailsResponse.data.comments_count ?? 0,
          shares: 0,
        });
        if (detailsResponse.data.is_active === false || detailsResponse.data.stream_status === 'ended') {
          streamEndedRef.current = true;
          setStreamEnded(true);
          return;
        }
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

      // ✅ FIX: استخدام المراجع لتفادي TDZ
      statsIntervalRef.current = setInterval(() => {
        if (streamEndedRef.current) return;
        updateStreamStatsRef.current?.(stream.id);
      }, 5000);

      commentsIntervalRef.current = setInterval(() => {
        if (streamEndedRef.current) return;
        loadCommentsRef.current?.(stream.id);
      }, 4000);

      pushToast?.({
        type: 'success',
        title: 'تم الانضمام للبث',
        description: `مرحباً في بث ${stream.title || ''}`,
      });
    } catch (error) {
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] فشل غير متوقع عند فتح البث', error?.message || error);
      }
    } finally {
      isConnectingRef.current = false;
    }
    // ✅ FIX (2026-06-11 v11): إزالة activeStream?.id من dependencies
    // كان يسبّب إعادة إنشاء openStream عند كل تحديث للحالة → useEffect يعيد التشغيل
    // → disconnect + connect متكرّر → WebSocket closes before established.
  }, [navigate, pushToast, stopAllPolling, detachRemoteStream, connectToLivePlayback, currentUsername]);

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
      if (!isExpectedApiError(error)) {
        console.warn('[LiveViewer] خطأ في إرسال القلب:', error?.message);
      }
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
  }, [activeStream?.id, pushToast]);

  const handleSendComment = useCallback(async () => {
    if (!activeStream?.id || !commentText.trim()) return;
    try {
      await sendLiveComment(activeStream.id, commentText);
      setCommentText('');
      await loadCommentsRef.current?.(activeStream.id);
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال التعليق',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream?.id, commentText, pushToast]);

  const formatLiveNum = useCallback((n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ألف`;
    return num.toLocaleString('ar-EG');
  }, []);

  // ✅ FIX: استخدام hostNameRef بدل hostName مباشرة لتفادي TDZ
  const handleShareStream = useCallback(() => {
    if (!activeStream?.id) return;
    try {
      const url = `${window.location.origin}/#/live/view/${activeStream.id}`;
      const currentHostName = hostNameRef.current || 'مضيف البث';
      const shareData = {
        title: `${currentHostName} في بث مباشر`,
        text: activeStream.title || 'بث مباشر',
        url,
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        pushToast?.({ type: 'success', title: 'تم نسخ رابط البث' });
      }
    } catch (_) { /* noop */ }
  }, [activeStream?.id, activeStream?.title, pushToast]);

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

  // الاستماع لأحداث LiveKit
  useEffect(() => {
    const unsubscribe = livekitService.subscribe?.((snapshot = {}) => {
      const reAttachEvents = [
        'participant_connected',
        'track_subscribed',
        'track_unsubscribed',
        'remote_track_published',
        'reconnected',
        'connection_state_changed',
      ];
      if (reAttachEvents.includes(snapshot?.event)) {
        setTimeout(() => attachRemoteStream(), 120);
        setTimeout(() => attachRemoteStream(), 800);
      }
      if (snapshot?.event === 'disconnected') {
        detachRemoteStream();
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [attachRemoteStream, detachRemoteStream]);

  // تنظيف retry timer
  useEffect(() => {
    return () => {
      if (attachRetryRef.current) {
        clearTimeout(attachRetryRef.current);
        attachRetryRef.current = null;
      }
    };
  }, []);

  // تحميل البثوث عند التحميل
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // فتح البث من الرابط
  // ✅ FIX (2026-06-10): إعادة محاولة ذكية لـ 404 (DB قد يحتاج لحظة بعد إنشاء البث من LiveStudio)
  useEffect(() => {
    if (!routeStreamId) return;

    // ✅ FIX (2026-06-11 v11): استخدم connectedStreamIdRef بدل activeStream?.id
    // لمنع إعادة التشغيل بين mount/setState في StrictMode.
    if (String(connectedStreamIdRef.current || '') === routeStreamId) return;

    if (streams.length) {
      const matchedStream = streams.find((stream) => String(stream.id) === routeStreamId);
      if (matchedStream && String(connectedStreamIdRef.current || '') !== String(matchedStream.id)) {
        openStream(matchedStream, { syncUrl: false });
        return;
      }
      if (matchedStream) return;
    }

    let cancelled = false;
    const retryDelays = [0, 1500, 3500]; // إعادة محاولة 3 مرات بفواصل متزايدة

    (async () => {
      let lastError = null;
      for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
        if (cancelled) return;
        if (retryDelays[attempt] > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
          if (cancelled) return;
        }
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
            if (!stub.is_active) {
              setActiveStream(stub);
              setStreamEnded(true);
              streamEndedRef.current = true;
              stopAllPolling();
              return;
            }
            openStream(stub, { syncUrl: false });
            return; // نجاح → إنهاء الـ retries
          }
        } catch (error) {
          lastError = error;
          const status = error?.response?.status;
          // 403: غير مصرح — لا فائدة من إعادة المحاولة
          if (status === 403) {
            setStreamEnded(true);
            streamEndedRef.current = true;
            stopAllPolling();
            return;
          }
          // 404 على المحاولات الأولى → نعيد المحاولة (قد يكون البث في طور الإنشاء)
          if (status === 404 && attempt < retryDelays.length - 1) {
            continue;
          }
          // 404 على آخر محاولة → معلن بأن البث غير موجود
          if (status === 404) {
            setStreamNotFound(true);
            setStreamEnded(true);
            streamEndedRef.current = true;
            stopAllPolling();
            return;
          }
          console.warn('[LiveViewer] تعذّر تحميل تفاصيل البث:', status || error?.message);
        }
      }
      if (lastError) {
        console.warn('[LiveViewer] فشلت جميع محاولات تحميل البث:', lastError?.message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // ✅ FIX (2026-06-11 v11): إزالة activeStream?.id من dependencies
    // كان يسبب re-trigger في كل setActiveStream → race condition مع WebSocket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeStreamId, streams, openStream, stopAllPolling]);

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

  // ✅ FIX (2026-06-11 v11): تنظيف فقط عند unmount حقيقي للمكوّن
  // كان السبب الجذري الرئيسي: dependency على activeStream?.id كان يُعيد تشغيل
  // الـ cleanup عند كل تغيير لـ activeStream → يستدعي livekitService.disconnect()
  // مباشرة بعد setActiveStream() داخل openStream → WebSocket يُغلق قبل أن يكتمل
  // المصافحة → "Client initiated disconnect" في سجلات الكونسول.
  // الحل: استخدام ref لتمرير القيمة الحالية بدون dependency.
  useEffect(() => {
    return () => {
      stopAllPolling();
      const lastId = connectedStreamIdRef.current;
      if (lastId) {
        socketManager.emit('leave_live', { room_id: lastId }, { queue: false });
      }
      detachRemoteStream();
      livekitService.disconnect().catch(() => {});
      connectedStreamIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fallbackCover = useMemo(
    () => buildFallbackCover(activeStream?.title || hostName),
    [activeStream?.title, hostName]
  );
  const effectiveCover = coverImage || fallbackCover;

  // ✅ FIX (2026-06-10): شاشة "البث غير موجود/انتهى" بدل crash
  if (streamNotFound) {
    return (
      <div className="mlv-mobile-viewer" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}>
        <div className="mlv-mobile-no-stream" style={{ padding: 40, textAlign: 'center' }}>
          <div className="mlv-mobile-empty-icon" style={{ fontSize: 64 }}>📭</div>
          <h2>البث غير متاح</h2>
          <p style={{ opacity: 0.8 }}>قد يكون البث قد انتهى أو حُذف.</p>
          <button
            onClick={() => navigate('/live')}
            style={{
              marginTop: 24, padding: '12px 32px', background: '#7c3aed',
              color: '#fff', border: 'none', borderRadius: 24,
              fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
              fontWeight: 700, cursor: 'pointer'
            }}
          >
            استكشف البثوث النشطة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mlv-mobile-viewer" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="mlv-mobile-header">
        <div className="mlv-mobile-header-top">
          <button className="mlv-mobile-close-btn" onClick={() => navigate(-1)}>
            ✕
          </button>
          <div className="mlv-mobile-header-info">
            <h1>{activeStream ? hostName : 'بث مباشر'}</h1>
            <p className="mlv-mobile-header-viewers">
              {streamStats.viewers > 0
                ? `${streamStats.viewers.toLocaleString('ar-EG')} مشاهد`
                : 'لا يوجد مشاهدون حالياً'}
            </p>
          </div>
          <div className="mlv-mobile-header-actions">
            <button className="mlv-mobile-action-icon" aria-label="المتابعين">👤</button>
            <button className="mlv-mobile-action-icon" aria-label="المشاهدون">👥</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mlv-mobile-main">
        {activeStream ? (
          <>
            {/* Video Player */}
            <div className="mlv-mobile-player">
              {(hasRemotePlayback || playbackUrl) && !streamEnded ? (
                <video
                  ref={playerVideoRef}
                  className="mlv-mobile-player-video"
                  src={!hasRemotePlayback ? playbackUrl || undefined : undefined}
                  poster={effectiveCover}
                  autoPlay
                  playsInline
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
              <div
                className="mlv-mobile-player-overlay"
                style={{ opacity: (hasRemotePlayback || playbackUrl) && !streamEnded ? 0.15 : 1 }}
              >
                <div className="mlv-mobile-player-content" dir="rtl">
                  <div className="mlv-mobile-player-icon">
                    {streamEnded ? '⏹️' : '📺'}
                  </div>
                  <p style={{ fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}>
                    {streamEnded
                      ? 'انتهى البث المباشر'
                      : (hasRemotePlayback
                          ? (activeStream.title || 'البث جارٍ…')
                          : 'جارٍ الاتصال بالبث… انتظر قليلاً')}
                  </p>
                  {!hasRemotePlayback && !streamEnded ? (
                    <p style={{
                      fontSize: 12, opacity: 0.85, marginTop: 8,
                      fontFamily: "'Noto Sans Arabic', system-ui, sans-serif"
                    }}>
                      إن استمر الانتظار، تأكد من أن المُضيف بدأ البث فعلاً
                    </p>
                  ) : null}
                  {streamEnded ? (
                    <button
                      onClick={() => navigate('/live')}
                      style={{
                        marginTop: 16, padding: '10px 24px', background: '#7c3aed',
                        color: '#fff', border: 'none', borderRadius: 20,
                        fontFamily: "'Noto Sans Arabic', system-ui, sans-serif",
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      تصفح البثوث النشطة
                    </button>
                  ) : null}
                </div>
              </div>
              <FloatingHearts items={floatingHearts} />

              <div className="mlv-mobile-top-badges">
                <div className="mlv-mobile-viewers-badge">
                  <span className="mlv-mobile-badge-icon">👁</span>
                  <span className="mlv-mobile-badge-text">{formatLiveNum(streamStats.viewers)}</span>
                </div>
                <div className="mlv-mobile-profile-badge">
                  <Avatar name={hostName} size={36} />
                </div>
              </div>

              {!streamEnded ? (
                <div className="mlv-mobile-right-actions">
                  <button className="mlv-mobile-action-btn mlv-mobile-action-heart" onClick={handleSendHeart} aria-label="اعجاب">
                    <span>💜</span>
                    <span className="mlv-mobile-action-count">{formatLiveNum(streamStats.hearts)}</span>
                  </button>
                  <button
                    className={`mlv-mobile-action-btn mlv-mobile-action-comment${showComments ? ' is-active' : ''}`}
                    onClick={() => setShowComments((v) => !v)}
                    aria-label="تعليقات"
                    aria-expanded={showComments}
                  >
                    <span>💬</span>
                    <span className="mlv-mobile-action-count">{formatLiveNum(streamStats.comments)}</span>
                  </button>
                  <button className="mlv-mobile-action-btn mlv-mobile-action-gift" onClick={() => setShowGiftPanel(!showGiftPanel)} aria-label="هدية">
                    <span>🎁</span>
                    <span className="mlv-mobile-action-label">هدية</span>
                  </button>
                  <button className="mlv-mobile-action-btn mlv-mobile-action-share" onClick={handleShareStream} aria-label="مشاركة">
                    <span>↗</span>
                    <span className="mlv-mobile-action-count">{formatLiveNum(streamStats.shares || 0)}</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Comments Section */}
            {!streamEnded && showComments ? (
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
            ) : null}

            {showGiftPanel && !streamEnded && (
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
            <h2>{loading ? 'جارٍ التحميل…' : 'لا يوجد بث نشط'}</h2>
            <p>{loading ? '' : 'اختر بث من القائمة لمشاهدته'}</p>
            {filteredStreams.length > 0 && (
              <div style={{ marginTop: 24, width: '100%' }}>
                {filteredStreams.map(s => (
                  <button
                    key={s.id}
                    onClick={() => openStream(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 12, margin: '8px 0', width: '100%',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#fff', cursor: 'pointer', textAlign: 'right',
                      fontFamily: "'Noto Sans Arabic', system-ui, sans-serif"
                    }}
                  >
                    <Avatar name={resolveHostName(s)} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{s.title || resolveHostName(s)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{s.viewers_count || 0} مشاهد</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
