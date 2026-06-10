/**
 * 🎥 LiveStudio.jsx — واجهة المضيف (Host)
 * ============================================================
 * المعمارية الجديدة (وفق متطلبات المالك):
 *   createLiveStream()          ← API
 *   startLiveStream() → token   ← API (هنا backend ينشئ غرفة LiveKit)
 *   livekitService.connect()    ← LiveKit يفتح الكاميرا والمايك بنفسه
 *   socket.emit("join_live")    ← Socket للتعليقات/القلوب/الهدايا
 *   setIsStreaming(true)
 *
 * ❌ لا navigator.mediaDevices.getUserMedia() هنا
 * ❌ لا localVideo.srcObject = stream يدوياً
 * ✅ نستخدم livekitService.attachLocalVideo(videoRef.current)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  getStreamStats,
  getLiveStreamViewers,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
import socketManager from '../services/socketManager.js';
import livekitService from '../services/livekitService.js';
import '../styles/modern-live-control.css';

const STREAM_CATEGORIES = ['ألعاب', 'موسيقى', 'تعليم', 'ترفيه', 'رياضة', 'تقنية', 'أخرى'];

const GIFTS = [
  { id: 1, name: 'وردة',     icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة',     icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة',     icon: '⭐', price: 250 },
  { id: 5, name: 'تاج ملكي', icon: '👑', price: 1000 },
];

function Avatar({ name = '', size = 42 }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
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

export default function LiveStudio() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();

  // ── حالة البث ──
  const [activeStream, setActiveStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  // بيانات نموذج البث
  const [newStreamData, setNewStreamData] = useState({
    title: '', description: '', category: 'ألعاب', isPublic: true,
  });

  // إحصائيات
  const [streamStats, setStreamStats] = useState({ viewers: 0, hearts: 0, comments: 0, gifts: 0 });
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  // ── refs ──
  const localVideoRef = useRef(null);
  const commentsBoxRef = useRef(null);
  const statsPollRef = useRef(null);

  // ── socket handlers (تعليقات/قلوب/هدايا فقط) ──
  useEffect(() => {
    if (!activeStream?.id) return;
    const roomId = activeStream.id;

    const onComment = (payload) => {
      if (!payload || (payload.room_id && payload.room_id !== roomId)) return;
      setComments((prev) => {
        const exists = prev.some((c) => c.id === payload.id);
        return exists ? prev : [...prev, payload];
      });
    };
    const onStats = (payload) => {
      if (!payload || payload.room_id !== roomId) return;
      setStreamStats((s) => ({
        ...s,
        viewers: payload.viewer_count ?? s.viewers,
        hearts: payload.hearts_count ?? s.hearts,
      }));
    };
    const onGift = (payload) => {
      if (!payload || payload.room_id !== roomId) return;
      setStreamStats((s) => ({ ...s, gifts: (s.gifts || 0) + 1 }));
    };

    socketManager.on?.('new_comment', onComment);
    socketManager.on?.('live_comment', onComment);
    socketManager.on?.('room_stats', onStats);
    socketManager.on?.('new_heart', onStats);
    socketManager.on?.('new_gift', onGift);

    return () => {
      socketManager.off?.('new_comment', onComment);
      socketManager.off?.('live_comment', onComment);
      socketManager.off?.('room_stats', onStats);
      socketManager.off?.('new_heart', onStats);
      socketManager.off?.('new_gift', onGift);
    };
  }, [activeStream?.id]);

  // ── livekit handlers (لربط الفيديو المحلي عند نشر المسار) ──
  useEffect(() => {
    if (!isStreaming) return;
    const unsub = livekitService.subscribe((state) => {
      if (state.event === 'local_track_published' && localVideoRef.current) {
        // لحظة نشر مسار الكاميرا → نربطه بعنصر <video>
        setTimeout(() => livekitService.attachLocalVideo(localVideoRef.current), 100);
      }
    });
    return unsub;
  }, [isStreaming]);

  // ── جلب الإحصائيات دورياً ──
  useEffect(() => {
    if (!activeStream?.id || !isStreaming) return;
    const tick = async () => {
      try {
        const res = await getStreamStats(activeStream.id);
        const d = res?.data?.data || res?.data || {};
        setStreamStats((s) => ({
          ...s,
          viewers: d.viewer_count ?? s.viewers,
          hearts: d.hearts_count ?? s.hearts,
          comments: d.comments_count ?? s.comments,
          gifts: d.gifts_count ?? s.gifts,
        }));
      } catch (_) { /* ignore */ }
    };
    tick();
    statsPollRef.current = setInterval(tick, 5000);
    return () => clearInterval(statsPollRef.current);
  }, [activeStream?.id, isStreaming]);

  // ── auto-scroll comments ──
  useEffect(() => {
    if (commentsBoxRef.current) {
      commentsBoxRef.current.scrollTop = commentsBoxRef.current.scrollHeight;
    }
  }, [comments]);

  // ════════════════════════════ بدء البث ════════════════════════════
  const handleStartStream = useCallback(async () => {
    if (!newStreamData.title.trim()) {
      pushToast?.({ type: 'error', message: 'الرجاء إدخال عنوان البث' });
      return;
    }
    setLoading(true);
    try {
      // (1) إنشاء سجل البث في DB
      const createRes = await createLiveStream({
        title: newStreamData.title.trim(),
        description: newStreamData.description.trim(),
        is_public: newStreamData.isPublic,
      });
      const stream = createRes?.data?.data || createRes?.data || {};
      if (!stream?.id) throw new Error('فشل إنشاء البث (لا يوجد id)');

      // (2) طلب توكن host → backend ينشئ غرفة LiveKit فعلياً
      const tokenRes = await startLiveStream(stream.id, { role: 'host' });
      const tokenData = tokenRes?.data?.data || tokenRes?.data || {};
      const lkToken = tokenData.token;
      const lkUrl = tokenData.livekit_url;
      const lkRoom = tokenData.livekit_room;
      if (!lkToken || !lkUrl) throw new Error('فشل استخراج توكن LiveKit');

      // (3) الاتصال بـ LiveKit (LiveKit يفتح الكاميرا والمايك بنفسه)
      const connectRes = await livekitService.connect({
        url: lkUrl,
        token: lkToken,
        role: 'host',
        enableCamera: true,
        enableMicrophone: true,
      });
      if (!connectRes.success) throw new Error(connectRes.error || 'فشل الاتصال بـ LiveKit');

      // (4) socket join_live للتعليقات/القلوب
      try {
        const accessToken = (typeof window !== 'undefined' && window.localStorage)
          ? window.localStorage.getItem('access_token') : '';
        socketManager.emit?.('join_live', {
          room_id: stream.id,
          role: 'host',
          token: accessToken,
        }, { queue: false });
      } catch (_) {}

      setActiveStream({ ...stream, livekit_room: lkRoom });
      setIsStreaming(true);
      pushToast?.({ type: 'success', message: '🔴 بدأ البث بنجاح' });
    } catch (err) {
      console.error('startStream error', err);
      pushToast?.({ type: 'error', message: err?.message || 'فشل بدء البث' });
    } finally {
      setLoading(false);
    }
  }, [newStreamData, pushToast]);

  // ════════════════════════════ إنهاء البث ════════════════════════════
  const handleEndStream = useCallback(async () => {
    if (!activeStream?.id) return;
    setLoading(true);
    try {
      try { await endLiveStream(activeStream.id); } catch (_) {}
      try {
        socketManager.emit?.('leave_live', { room_id: activeStream.id }, { queue: false });
      } catch (_) {}
      await livekitService.disconnect();
      setIsStreaming(false);
      setActiveStream(null);
      setComments([]);
      setStreamStats({ viewers: 0, hearts: 0, comments: 0, gifts: 0 });
      pushToast?.({ type: 'success', message: 'تم إنهاء البث' });
    } catch (err) {
      pushToast?.({ type: 'error', message: err?.message || 'فشل إنهاء البث' });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast]);

  // ════════════════════════════ إرسال تعليق ════════════════════════════
  const handleSendComment = useCallback(async () => {
    if (!activeStream?.id || !commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');
    try {
      await sendLiveComment(activeStream.id, { content: text });
    } catch (err) {
      pushToast?.({ type: 'error', message: 'فشل إرسال التعليق' });
    }
  }, [activeStream, commentInput, pushToast]);

  // ════════════════════════════ التحكم بالكاميرا/المايك ════════════════════════════
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const toggleCam = async () => {
    if (cameraOn) await livekitService.disableCamera();
    else await livekitService.enableCamera();
    setCameraOn(!cameraOn);
  };
  const toggleMic = async () => {
    if (micOn) await livekitService.disableMicrophone();
    else await livekitService.enableMicrophone();
    setMicOn(!micOn);
  };

  // cleanup عند إغلاق الصفحة
  useEffect(() => {
    return () => {
      if (isStreaming) {
        livekitService.disconnect().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ════════════════════════════ Render ════════════════════════════
  if (!isStreaming) {
    return (
      <div dir="rtl" className="live-studio-setup" style={styles.setupContainer}>
        <div style={styles.setupCard}>
          <h1 style={styles.setupTitle}>🎥 بدء بث مباشر</h1>
          <p style={styles.setupSubtitle}>أهلاً @{currentUsername}، جهّز معلومات البث ثم اضغط بدء.</p>

          <label style={styles.label}>عنوان البث</label>
          <input
            type="text"
            value={newStreamData.title}
            onChange={(e) => setNewStreamData((d) => ({ ...d, title: e.target.value }))}
            placeholder="مثال: نلعب سوياً 🎮"
            style={styles.input}
          />

          <label style={styles.label}>وصف البث (اختياري)</label>
          <textarea
            value={newStreamData.description}
            onChange={(e) => setNewStreamData((d) => ({ ...d, description: e.target.value }))}
            placeholder="ماذا سيحدث في هذا البث؟"
            style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
          />

          <label style={styles.label}>التصنيف</label>
          <select
            value={newStreamData.category}
            onChange={(e) => setNewStreamData((d) => ({ ...d, category: e.target.value }))}
            style={styles.input}
          >
            {STREAM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={{ ...styles.label, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={newStreamData.isPublic}
              onChange={(e) => setNewStreamData((d) => ({ ...d, isPublic: e.target.checked }))}
            />
            <span>بث عام (متاح للجميع)</span>
          </label>

          <button
            disabled={loading}
            onClick={handleStartStream}
            style={{ ...styles.startBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '⏳ جارٍ التحضير…' : '🔴 بدء البث'}
          </button>
          <button onClick={() => navigate(-1)} style={styles.cancelBtn}>إلغاء</button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="live-studio-active" style={styles.liveContainer}>
      <div style={styles.videoPane}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={styles.video}
        />
        <div style={styles.liveBadge}>🔴 مباشر</div>
        <div style={styles.statsOverlay}>
          <span>👁 {streamStats.viewers}</span>
          <span>❤ {streamStats.hearts}</span>
          <span>💬 {streamStats.comments}</span>
          <span>🎁 {streamStats.gifts}</span>
        </div>

        <div style={styles.controls}>
          <button onClick={toggleCam} style={styles.ctlBtn}>{cameraOn ? '📹' : '🚫'}</button>
          <button onClick={toggleMic} style={styles.ctlBtn}>{micOn ? '🎙️' : '🔇'}</button>
          <button onClick={handleEndStream} style={{ ...styles.ctlBtn, background: '#ef4444' }}>⏹ إنهاء</button>
        </div>
      </div>

      <div style={styles.chatPane}>
        <div style={styles.chatHeader}>
          <strong>{activeStream?.title}</strong>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            الغرفة: {activeStream?.livekit_room}
          </div>
        </div>
        <div ref={commentsBoxRef} style={styles.commentsBox}>
          {comments.map((c) => (
            <div key={c.id} style={styles.commentRow}>
              <Avatar name={c.username || c.user} size={28} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>@{c.username || c.user}</div>
                <div style={{ fontSize: 14 }}>{c.content || c.text}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
              لا توجد تعليقات بعد. كن أول من يتفاعل!
            </div>
          )}
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
    </div>
  );
}

// ── styles ──
const styles = {
  setupContainer: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif',
  },
  setupCard: {
    background: '#1f2937', color: 'white', padding: 32, borderRadius: 16,
    width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  setupTitle: { margin: '0 0 8px', fontSize: 28, fontWeight: 900 },
  setupSubtitle: { margin: '0 0 24px', color: '#9ca3af', fontSize: 14 },
  label: { display: 'block', marginTop: 14, marginBottom: 6, fontSize: 14, fontWeight: 600 },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #374151',
    background: '#111827', color: 'white', fontSize: 14, fontFamily: 'inherit',
  },
  startBtn: {
    width: '100%', marginTop: 24, padding: '14px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
    fontWeight: 800, fontSize: 16, cursor: 'pointer',
  },
  cancelBtn: {
    width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, border: '1px solid #374151',
    background: 'transparent', color: '#9ca3af', cursor: 'pointer',
  },
  liveContainer: {
    minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16,
    background: '#0f172a', padding: 16, color: 'white',
    fontFamily: '"Noto Sans Arabic", "Tajawal", sans-serif',
  },
  videoPane: { position: 'relative', background: '#000', borderRadius: 16, overflow: 'hidden' },
  video: { width: '100%', height: '100%', objectFit: 'cover', minHeight: 480 },
  liveBadge: {
    position: 'absolute', top: 16, right: 16, background: '#ef4444', padding: '6px 12px',
    borderRadius: 20, fontWeight: 800, fontSize: 13,
  },
  statsOverlay: {
    position: 'absolute', top: 16, left: 16, display: 'flex', gap: 12,
    background: 'rgba(0,0,0,0.5)', padding: '8px 14px', borderRadius: 20, fontSize: 14, fontWeight: 700,
  },
  controls: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 12, background: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 30,
  },
  ctlBtn: {
    width: 50, height: 50, borderRadius: '50%', border: 'none', background: '#374151',
    color: 'white', fontSize: 22, cursor: 'pointer',
  },
  chatPane: { display: 'flex', flexDirection: 'column', background: '#1f2937', borderRadius: 16 },
  chatHeader: { padding: 16, borderBottom: '1px solid #374151' },
  commentsBox: { flex: 1, padding: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' },
  commentRow: { display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start' },
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
