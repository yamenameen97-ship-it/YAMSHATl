/**
 * 👁 LiveViewer.jsx — واجهة المشاهد (Viewer)
 * ============================================================
 * المعمارية الجديدة (وفق متطلبات المالك):
 *   joinLiveRoom() (HTTP)            ← يضيف المشاهد لقائمة الغرفة
 *   get token (role=viewer)          ← من /live_room/{id}/token
 *   livekitService.connect(viewer)   ← اتصال بـ LiveKit (لا كاميرا)
 *   استقبال track عبر RoomEvent.TrackSubscribed
 *   ربط الفيديو بـ videoRef.current
 *
 * ❌ المشاهد لا يفتح الكاميرا إطلاقاً
 * ❌ لا navigator.getUserMedia()
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getLiveStreamDetails,
  getLiveToken,
  sendLiveComment,
  sendLiveGift,
  addViewer,
  removeViewer,
  getLiveComments,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
import socketManager from '../services/socketManager.js';
import livekitService from '../services/livekitService.js';

const GIFTS = [
  { id: 1, name: 'وردة',     icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة',     icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة',     icon: '⭐', price: 250 },
  { id: 5, name: 'تاج ملكي', icon: '👑', price: 1000 },
];

function Avatar({ name = '', size = 36 }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const hash = (name || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', background: color,
      color: 'white', fontWeight: 900, fontSize: size / 2.5, flexShrink: 0,
    }}>
      {(name?.charAt(0) || '?').toUpperCase()}
    </div>
  );
}

export default function LiveViewer() {
  const { streamId: paramId } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [stats, setStats] = useState({ viewers: 0, hearts: 0 });
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [floatingGifts, setFloatingGifts] = useState([]);
  const [showGifts, setShowGifts] = useState(false);

  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const commentsBoxRef = useRef(null);

  // ════════════════════════ join + connect to LiveKit ════════════════════════
  const joinStream = useCallback(async (sid) => {
    setLoading(true);
    try {
      // (1) جلب تفاصيل البث
      const detailsRes = await getLiveStreamDetails(sid);
      const detail = detailsRes?.data?.data || detailsRes?.data || {};
      if (!detail?.id) throw new Error('البث غير موجود');
      if (!detail.is_active) throw new Error('البث منتهٍ');
      setStream(detail);
      setStats({
        viewers: detail.viewer_count || 0,
        hearts: detail.hearts_count || 0,
      });

      // (2) إضافة المشاهد إلى DB (best-effort)
      try { await addViewer(sid, { platform: 'web' }); } catch (_) {}

      // (3) جلب التعليقات الموجودة (آخر 50)
      try {
        const cRes = await getLiveComments(sid, 50);
        const cs = cRes?.data?.data || cRes?.data || [];
        setComments(Array.isArray(cs) ? cs : []);
      } catch (_) {}

      // (4) طلب توكن viewer
      const tokRes = await getLiveToken(sid, { role: 'viewer' });
      const td = tokRes?.data?.data || tokRes?.data || {};
      if (!td?.token || !td?.livekit_url) throw new Error('فشل استخراج توكن LiveKit');

      // (5) connect — viewer لا يفتح كاميرا
      const connectRes = await livekitService.connect({
        url: td.livekit_url,
        token: td.token,
        role: 'viewer',
        enableCamera: false,
        enableMicrophone: false,
      });
      if (!connectRes.success) throw new Error(connectRes.error || 'فشل الاتصال');

      // (6) socket join_live للتعليقات/القلوب
      try {
        const accessToken = (typeof window !== 'undefined' && window.localStorage)
          ? window.localStorage.getItem('access_token') : '';
        socketManager.emit?.('join_live', {
          room_id: sid,
          role: 'viewer',
          token: accessToken,
        }, { queue: false });
      } catch (_) {}

      setConnected(true);
    } catch (err) {
      console.error('joinStream error', err);
      pushToast?.({ type: 'error', message: err?.message || 'فشل الانضمام للبث' });
      setTimeout(() => navigate('/live'), 1500);
    } finally {
      setLoading(false);
    }
  }, [navigate, pushToast]);

  useEffect(() => {
    if (paramId) joinStream(paramId);
  }, [paramId, joinStream]);

  // ════════════════════════ livekit events → ربط الفيديو ════════════════════════
  useEffect(() => {
    if (!connected) return;
    const unsub = livekitService.subscribe((state) => {
      if (state.event === 'track_subscribed') {
        if (state.kind === 'video' && remoteVideoRef.current) {
          setTimeout(() => livekitService.attachRemoteVideo(remoteVideoRef.current, state.identity), 80);
        }
        if (state.kind === 'audio' && remoteAudioRef.current) {
          setTimeout(() => livekitService.attachRemoteAudio(remoteAudioRef.current, state.identity), 80);
        }
      }
    });
    // محاولة فورية إن كان الفيديو متاحاً مسبقاً
    setTimeout(() => {
      if (remoteVideoRef.current) livekitService.attachRemoteVideo(remoteVideoRef.current);
      if (remoteAudioRef.current) livekitService.attachRemoteAudio(remoteAudioRef.current);
    }, 600);
    return unsub;
  }, [connected]);

  // ════════════════════════ socket events (تعليقات/قلوب/هدايا) ════════════════════════
  useEffect(() => {
    if (!stream?.id) return;
    const roomId = stream.id;

    const onComment = (payload) => {
      if (!payload || (payload.room_id && payload.room_id !== roomId)) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === payload.id)) return prev;
        return [...prev, payload];
      });
    };
    const onStats = (payload) => {
      if (!payload || payload.room_id !== roomId) return;
      setStats((s) => ({
        viewers: payload.viewer_count ?? s.viewers,
        hearts: payload.hearts_count ?? s.hearts,
      }));
    };
    const onHeart = (payload) => {
      if (!payload || payload.room_id !== roomId) return;
      const id = Date.now() + Math.random();
      setFloatingHearts((p) => [...p, { id, left: 20 + Math.random() * 60 }]);
      setTimeout(() => setFloatingHearts((p) => p.filter((h) => h.id !== id)), 3000);
      setStats((s) => ({ ...s, hearts: payload.count ?? s.hearts + 1 }));
    };
    const onGift = (payload) => {
      if (!payload || payload.room_id !== roomId) return;
      const id = Date.now() + Math.random();
      const giftName = payload.gift?.gift_name || payload.gift_name || 'هدية';
      setFloatingGifts((p) => [...p, { id, name: giftName, user: payload.gift?.username || '' }]);
      setTimeout(() => setFloatingGifts((p) => p.filter((g) => g.id !== id)), 4000);
    };
    const onEnded = (payload) => {
      if (!payload || (payload.room_id && payload.room_id !== roomId)) return;
      pushToast?.({ type: 'info', message: 'انتهى البث' });
      setTimeout(() => navigate('/live'), 1200);
    };

    socketManager.on?.('new_comment', onComment);
    socketManager.on?.('live_comment', onComment);
    socketManager.on?.('room_stats', onStats);
    socketManager.on?.('new_heart', onHeart);
    socketManager.on?.('new_gift', onGift);
    socketManager.on?.('live_ended', onEnded);

    return () => {
      socketManager.off?.('new_comment', onComment);
      socketManager.off?.('live_comment', onComment);
      socketManager.off?.('room_stats', onStats);
      socketManager.off?.('new_heart', onHeart);
      socketManager.off?.('new_gift', onGift);
      socketManager.off?.('live_ended', onEnded);
    };
  }, [stream?.id, navigate, pushToast]);

  // auto-scroll
  useEffect(() => {
    if (commentsBoxRef.current) {
      commentsBoxRef.current.scrollTop = commentsBoxRef.current.scrollHeight;
    }
  }, [comments]);

  // ════════════════════════ المغادرة (cleanup) ════════════════════════
  const leaveStream = useCallback(async () => {
    try {
      if (stream?.id) {
        try { await removeViewer(stream.id); } catch (_) {}
        try { socketManager.emit?.('leave_live', { room_id: stream.id }, { queue: false }); } catch (_) {}
      }
    } finally {
      await livekitService.disconnect();
      setConnected(false);
    }
  }, [stream]);

  useEffect(() => {
    return () => { leaveStream().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ════════════════════════ Actions ════════════════════════
  const handleSendComment = async () => {
    if (!stream?.id || !commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');
    try {
      await sendLiveComment(stream.id, { content: text });
    } catch (_) {
      pushToast?.({ type: 'error', message: 'فشل إرسال التعليق' });
    }
  };

  const handleSendHeart = () => {
    if (!stream?.id) return;
    try {
      const accessToken = window.localStorage?.getItem('access_token') || '';
      socketManager.emit?.('send_heart', { room_id: stream.id, token: accessToken }, { queue: false });
    } catch (_) {}
    // تأثير محلي فوري
    const id = Date.now() + Math.random();
    setFloatingHearts((p) => [...p, { id, left: 20 + Math.random() * 60 }]);
    setTimeout(() => setFloatingHearts((p) => p.filter((h) => h.id !== id)), 3000);
  };

  const handleSendGift = async (gift) => {
    if (!stream?.id) return;
    setShowGifts(false);
    try {
      await sendLiveGift(stream.id, {
        gift_id: String(gift.id),
        name: gift.name,
        price: gift.price,
        amount: 1,
      });
      pushToast?.({ type: 'success', message: `أرسلت ${gift.icon} ${gift.name}` });
    } catch (err) {
      pushToast?.({ type: 'error', message: err?.response?.data?.detail || 'فشل إرسال الهدية' });
    }
  };

  // ════════════════════════ Render ════════════════════════
  if (loading) {
    return (
      <div dir="rtl" style={styles.loading}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <div>جارٍ الانضمام للبث…</div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={styles.viewer}>
      <div style={styles.videoPane}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={styles.video}
        />
        <audio ref={remoteAudioRef} autoPlay />

        <div style={styles.topOverlay}>
          <div style={styles.hostInfo}>
            <Avatar name={stream?.host_username} size={36} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>@{stream?.host_username}</div>
              <div style={{ fontSize: 11, color: '#fca5a5' }}>🔴 مباشر</div>
            </div>
          </div>
          <div style={styles.viewerCount}>👁 {stats.viewers}</div>
        </div>

        {/* قلوب طائرة */}
        {floatingHearts.map((h) => (
          <div key={h.id} style={{
            position: 'absolute', bottom: 100, left: `${h.left}%`, fontSize: 36,
            animation: 'floatUp 3s ease-out forwards', pointerEvents: 'none',
          }}>❤️</div>
        ))}

        {/* هدايا متحركة */}
        {floatingGifts.map((g) => (
          <div key={g.id} style={{
            position: 'absolute', top: '40%', right: 20,
            background: 'linear-gradient(135deg, #fbbf24, #ef4444)',
            color: 'white', padding: '10px 16px', borderRadius: 14,
            fontWeight: 800, animation: 'slideIn 4s ease-out forwards',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)', pointerEvents: 'none',
          }}>
            🎁 {g.name} {g.user ? `من @${g.user}` : ''}
          </div>
        ))}

        <div style={styles.bottomActions}>
          <button onClick={handleSendHeart} style={styles.actionBtn}>❤️</button>
          <button onClick={() => setShowGifts((s) => !s)} style={styles.actionBtn}>🎁</button>
          <button onClick={async () => { await leaveStream(); navigate('/live'); }} style={{ ...styles.actionBtn, background: '#ef4444' }}>🚪</button>
        </div>

        {showGifts && (
          <div style={styles.giftPanel}>
            {GIFTS.map((g) => (
              <button key={g.id} onClick={() => handleSendGift(g)} style={styles.giftItem}>
                <div style={{ fontSize: 30 }}>{g.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: '#fbbf24' }}>{g.price} 🪙</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={styles.chatPane}>
        <div ref={commentsBoxRef} style={styles.commentsBox}>
          {comments.map((c) => (
            <div key={c.id} style={styles.commentRow}>
              <Avatar name={c.username || c.user} size={28} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#fbbf24' }}>@{c.username || c.user}</div>
                <div style={{ fontSize: 14 }}>{c.content || c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.composer}>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="اكتب تعليقاً…"
            style={styles.commentInput}
          />
          <button onClick={handleSendComment} style={styles.sendBtn}>إرسال</button>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 1; }
          100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        @keyframes slideIn {
          0%   { transform: translateX(100%); opacity: 0; }
          15%  { transform: translateX(0);    opacity: 1; }
          85%  { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(-30%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  viewer: {
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12,
    background: '#0f172a', color: 'white', padding: 12,
    fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif',
  },
  loading: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 12,
    alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white',
    fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif',
  },
  videoPane: { position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden', minHeight: 500 },
  video: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 500 },
  topOverlay: {
    position: 'absolute', top: 14, left: 14, right: 14,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  hostInfo: {
    display: 'flex', gap: 10, alignItems: 'center',
    background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 24,
  },
  viewerCount: {
    background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 20,
    fontWeight: 700, fontSize: 13,
  },
  bottomActions: {
    position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 12,
  },
  actionBtn: {
    width: 52, height: 52, borderRadius: '50%', border: 'none',
    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
    color: 'white', fontSize: 24, cursor: 'pointer',
  },
  giftPanel: {
    position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: 14,
    background: 'rgba(15,23,42,0.95)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  giftItem: {
    background: '#1f2937', color: 'white', border: 'none', borderRadius: 10,
    padding: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, minWidth: 70,
  },
  chatPane: { display: 'flex', flexDirection: 'column', background: '#1f2937', borderRadius: 16 },
  commentsBox: { flex: 1, padding: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 130px)' },
  commentRow: { display: 'flex', gap: 10, padding: '6px 0', alignItems: 'flex-start' },
  composer: { padding: 12, borderTop: '1px solid #374151', display: 'flex', gap: 8 },
  commentInput: {
    flex: 1, padding: '10px 14px', borderRadius: 20, border: 'none',
    background: '#111827', color: 'white', fontSize: 14, fontFamily: 'inherit',
  },
  sendBtn: {
    padding: '10px 18px', borderRadius: 20, border: 'none',
    background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer',
  },
};
