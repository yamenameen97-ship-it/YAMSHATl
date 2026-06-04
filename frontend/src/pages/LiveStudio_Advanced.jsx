import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  createLiveStream,
  getLiveToken,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  getStreamAnalytics,
  manageRecording,
  updateStreamTitle,
  getStreamViewers,
  updateStreamSettings,
  getRecoveryData,
  sendHeartbeat,
} from '../services/api/correctedLiveStreamApi.js';
import { API_BASE } from '../api/config.js';
import { getCurrentUsername } from '../utils/auth.js';
import ViewersManagementPanel from '../components/live/ViewersManagementPanel.jsx';
import '../styles/modern-live-control.css';

const QUALITY_OPTIONS = [
  { value: '1080p', label: '1080p (أفضل جودة)', bitrate: 6000 },
  { value: '720p', label: '720p (موصى به)', bitrate: 3000 },
  { value: '480p', label: '480p (سريع)', bitrate: 1500 },
];

const STREAM_CATEGORIES = [
  'ألعاب',
  'موسيقى',
  'تعليم',
  'ترفيه',
  'رياضة',
  'تقنية',
  'أخرى',
];

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

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function getHealthStatus(bitrate, packetLoss = 0) {
  if (packetLoss > 5 || bitrate < 500) return { status: 'poor', color: '#ef4444', label: 'ضعيف' };
  if (packetLoss > 2 || bitrate < 1500) return { status: 'fair', color: '#f59e0b', label: 'متوسط' };
  return { status: 'good', color: '#10b981', label: 'ممتاز' };
}

export default function LiveStudioAdvanced() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();

  // حالة البث
  const [activeStream, setActiveStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);

  // بيانات البث الجديد
  const [newStreamData, setNewStreamData] = useState({
    title: '',
    description: '',
    category: 'ألعاب',
    quality: '720p',
    isPublic: true,
    giftGoal: 0,
    minimumGiftAmount: 0,
  });

  // إحصائيات البث
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    peakViewers: 0,
    hearts: 0,
    gifts: 0,
    comments: 0,
    duration: 0,
    bitrate: 0,
    packetLoss: 0,
    avgBitrate: 0,
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [viewers, setViewers] = useState([]);

  // معلومات الكاميرا والبث
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [streamHealth, setStreamHealth] = useState('good');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    online: false,
    livekitConfigured: false,
    apiBase: API_BASE,
    serviceStatus: 'unknown',
    error: '',
  });

  // إعدادات البث
  const [streamSettings, setStreamSettings] = useState({
    isPublic: true,
    allowComments: true,
    allowGifts: true,
    requireCommentApproval: false,
    chatSpeedLimit: 0,
  });

  // إعادة الاتصال
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const refreshBackendStatus = useCallback(async () => {
    const backendOrigin = API_BASE.replace(/\/api\/?$/, '');

    setBackendStatus((prev) => ({
      ...prev,
      checking: true,
      apiBase: API_BASE,
      error: '',
    }));

    try {
      const response = await fetch(`${backendOrigin}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setBackendStatus({
        checking: false,
        online: true,
        livekitConfigured: Boolean(data?.livekit_configured || data?.services?.livekit?.configured),
        apiBase: API_BASE,
        serviceStatus: data?.status || 'ok',
        error: '',
      });
    } catch (error) {
      setBackendStatus({
        checking: false,
        online: false,
        livekitConfigured: false,
        apiBase: API_BASE,
        serviceStatus: 'offline',
        error: error?.message || 'تعذر الوصول للخادم',
      });
    }
  }, []);

  // إنشاء بث جديد
  const handleCreateStream = useCallback(async () => {
    const { title, description, category, quality } = newStreamData;

    if (!title.trim()) {
      pushToast?.({
        type: 'info',
        title: 'عنوان البث مطلوب',
        description: 'أدخل عنواناً للبث المباشر',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await createLiveStream({
        title: title.trim(),
        description: description.trim(),
        category,
        quality,
        isPublic: newStreamData.isPublic,
        giftGoal: newStreamData.giftGoal,
        minimumGiftAmount: newStreamData.minimumGiftAmount,
      });

      if (response?.data) {
        setActiveStream(response.data);
        setIsStreaming(true);
        setEditedTitle(response.data.title);
        setNewStreamData({
          title: '',
          description: '',
          category: 'ألعاب',
          quality: '720p',
          isPublic: true,
          giftGoal: 0,
          minimumGiftAmount: 0,
        });

        pushToast?.({
          type: 'success',
          title: 'تم إنشاء البث بنجاح',
          description: 'جاهز لبدء البث المباشر',
        });

        await handleStartStream(response.data.id || response.data.room_id);
      }
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إنشاء البث',
        description: error?.response?.data?.message || 'حاول مرة أخرى',
      });
    } finally {
      setLoading(false);
    }
  }, [newStreamData, pushToast]);

  // بدء البث
  const handleStartStream = useCallback(async (roomId) => {
    if (!roomId) return;

    try {
      const tokenResponse = await getLiveToken(roomId, {
        role: 'host',
        quality: newStreamData.quality || '720p',
      });

      if (tokenResponse?.data?.token) {
        setCameraReady(true);
        setStreamHealth('good');

        // بدء تحديث الإحصائيات
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(roomId);
        }, 5000);

        // بدء عداد المدة
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        let duration = 0;
        durationIntervalRef.current = setInterval(() => {
          duration += 1;
          setStreamStats(prev => ({ ...prev, duration }));
        }, 1000);

        // بدء نبض الاتصال
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          sendHeartbeat(roomId).catch(err => console.error('Heartbeat error:', err));
        }, 30000);

        pushToast?.({
          type: 'success',
          title: 'بدأ البث بنجاح',
          description: 'أنت الآن مباشر!',
        });
      }
    } catch (error) {
      setCameraError('فشل في بدء البث. تحقق من الاتصال.');
      pushToast?.({
        type: 'warning',
        title: 'خطأ في بدء البث',
        description: error?.response?.data?.message || 'حاول مرة أخرى',
      });
    }
  }, [newStreamData.quality, pushToast]);

  // إنهاء البث
  const handleEndStream = useCallback(async () => {
    if (!activeStream?.id && !activeStream?.room_id) return;

    if (!window.confirm('هل أنت متأكد من إنهاء البث؟')) return;

    setLoading(true);
    try {
      const roomId = activeStream.id || activeStream.room_id;
      await endLiveStream(roomId);

      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
      setStreamStats({
        viewers: 0,
        peakViewers: 0,
        hearts: 0,
        gifts: 0,
        comments: 0,
        duration: 0,
        bitrate: 0,
        packetLoss: 0,
        avgBitrate: 0,
      });

      pushToast?.({
        type: 'success',
        title: 'تم إنهاء البث',
        description: 'شكراً على البث!',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إنهاء البث',
        description: error?.response?.data?.message || 'حاول مرة أخرى',
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast]);

  // تحديث عنوان البث
  const handleUpdateTitle = useCallback(async () => {
    if (!editedTitle.trim() || !activeStream?.id && !activeStream?.room_id) return;

    try {
      await updateStreamTitle(activeStream.id || activeStream.room_id, editedTitle);
      
      setActiveStream(prev => ({
        ...prev,
        title: editedTitle.trim(),
      }));

      setEditingTitle(false);
      pushToast?.({
        type: 'success',
        title: 'تم تحديث العنوان',
        description: 'تم حفظ عنوان البث الجديد',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في تحديث العنوان',
        description: 'حاول مرة أخرى',
      });
    }
  }, [editedTitle, activeStream, pushToast]);

  // تحديث إحصائيات البث
  const updateStreamStats = useCallback(async (roomId) => {
    try {
      const response = await getStreamAnalytics(roomId);
      if (response?.data) {
        const data = response.data;
        setStreamStats(prev => ({
          ...prev,
          viewers: data.viewer_count || data.viewers || prev.viewers,
          peakViewers: data.peak_viewer_count || data.peak_viewers || prev.peakViewers,
          hearts: data.hearts_count || data.hearts || prev.hearts,
          bitrate: data.bitrate || prev.bitrate,
          avgBitrate: data.avg_bitrate || prev.avgBitrate,
          packetLoss: data.packet_loss || prev.packetLoss,
        }));

        // تحديث حالة الصحة
        const health = getHealthStatus(data.bitrate, data.packet_loss);
        setStreamHealth(health.status);
      }
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }, []);

  // تحميل التعليقات
  const loadComments = useCallback(async (roomId) => {
    try {
      const response = await getLiveComments(roomId);
      setComments(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('خطأ في تحميل التعليقات:', error);
    }
  }, []);

  // إرسال تعليق
  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !activeStream?.id && !activeStream?.room_id) return;

    try {
      const roomId = activeStream.id || activeStream.room_id;
      const newComment = {
        id: Date.now(),
        username: currentUsername,
        text: commentText,
        timestamp: new Date().toISOString(),
      };

      setComments(prev => [...prev, newComment]);
      setCommentText('');

      await sendLiveComment(roomId, {
        text: commentText,
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال التعليق',
        description: 'حاول مرة أخرى',
      });
    }
  }, [commentText, activeStream, currentUsername, pushToast]);

  // إرسال هدية
  const handleSendGift = useCallback(async (gift) => {
    if (!activeStream?.id && !activeStream?.room_id || !gift) return;

    try {
      const roomId = activeStream.id || activeStream.room_id;
      await sendLiveGift(roomId, {
        giftId: gift.id,
        name: gift.name,
        price: gift.price,
      });

      setStreamStats(prev => ({
        ...prev,
        gifts: prev.gifts + 1,
      }));

      pushToast?.({
        type: 'success',
        title: `تم إرسال ${gift.name}`,
        description: 'شكراً على الدعم!',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال الهدية',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, pushToast]);

  // تبديل التسجيل
  const handleToggleRecording = useCallback(async () => {
    if (!activeStream?.id && !activeStream?.room_id) return;

    try {
      const roomId = activeStream.id || activeStream.room_id;
      const action = recordingEnabled ? 'stop' : 'start';
      await manageRecording(roomId, action);

      setRecordingEnabled(!recordingEnabled);
      pushToast?.({
        type: 'success',
        title: recordingEnabled ? 'تم إيقاف التسجيل' : 'بدأ التسجيل',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في التسجيل',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, recordingEnabled, pushToast]);

  useEffect(() => {
    refreshBackendStatus();
    const interval = setInterval(refreshBackendStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshBackendStatus]);

  // تحميل الكاميرا
  useEffect(() => {
    if (!isStreaming || !activeStream?.id && !activeStream?.room_id) return;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('هذا المتصفح لا يدعم الكاميرا');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }

        setCameraReady(true);
        setCameraError('');
      } catch (error) {
        const permissionDenied = error?.name === 'NotAllowedError';
        setCameraError(
          permissionDenied
            ? 'تم رفض إذن الكاميرا. اسمح بالوصول وحاول مجدداً.'
            : 'خطأ في تشغيل الكاميرا'
        );
      }
    };

    setupCamera();

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isStreaming, activeStream?.id, activeStream?.room_id]);

  // تحميل التعليقات عند تغيير البث النشط
  useEffect(() => {
    if (activeStream?.id || activeStream?.room_id) {
      const roomId = activeStream.id || activeStream.room_id;
      loadComments(roomId);
      const interval = setInterval(() => loadComments(roomId), 3000);
      return () => clearInterval(interval);
    }
  }, [activeStream?.id, activeStream?.room_id, loadComments]);

  const healthStatus = getHealthStatus(streamStats.bitrate, streamStats.packetLoss);
  const giftProgress = newStreamData.giftGoal > 0 
    ? Math.min((streamStats.gifts / newStreamData.giftGoal) * 100, 100)
    : 0;
  const backendReadyForLive = backendStatus.online && backendStatus.livekitConfigured;
  const backendStatusTone = backendStatus.checking
    ? 'checking'
    : backendReadyForLive
      ? 'ready'
      : backendStatus.online
        ? 'warning'
        : 'offline';

  return (
    <div className="modern-live-control" dir="rtl">
      <header className="mlc-header">
        <div className="mlc-header-content">
          <button className="mlc-back-btn" onClick={() => navigate(-1)}>
            <span>&lt;</span>
          </button>
          <div>
            <h1>تحكم البث المباشر</h1>
            <p>{isStreaming ? 'أنت الآن مباشر' : 'جاهز للبث'}</p>
          </div>
        </div>
        <div className="mlc-header-actions">
          {isStreaming && (
            <button className="mlc-live-badge">
              <span className="mlc-live-dot"></span>
              مباشر
            </button>
          )}
          <button className="mlc-menu-btn">⋮</button>
        </div>
      </header>

      <div className="mlc-container">
        <main className="mlc-main">
          {/* Video Section */}
          <div className="mlc-video-section">
            <div className="mlc-video-container">
              {cameraReady ? (
                <video
                  ref={localVideoRef}
                  className="mlc-video"
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <div className="mlc-video-placeholder">
                  <div className="mlc-placeholder-icon">📺</div>
                  <p>{cameraError || 'جاري تحضير الكاميرا...'}</p>
                </div>
              )}
              <div className="mlc-video-overlay">
                <span className="mlc-viewer-count">👁 {streamStats.viewers}K</span>
                {isStreaming && (
                  <span 
                    className="mlc-health-badge"
                    style={{ background: healthStatus.color }}
                    title={`صحة البث: ${healthStatus.label}`}
                  >
                    {healthStatus.label}
                  </span>
                )}
              </div>
            </div>

            {/* Stream Title + Backend Link Status */}
            <div className="mlc-stream-title-section">
              <div className="mlc-section-title-row">
                <h3>{isStreaming ? 'عنوان البث' : 'تجهيز البث'}</h3>
                <span className={`mlc-status-pill mlc-status-pill-${backendStatusTone}`}>
                  {backendStatus.checking
                    ? 'جارٍ فحص الربط'
                    : backendReadyForLive
                      ? 'الربط كامل وجاهز للبث'
                      : backendStatus.online
                        ? 'الخادم متصل لكن LiveKit غير مهيأ'
                        : 'الخادم غير متصل'}
                </span>
              </div>

              {isStreaming ? (
                <div className="mlc-stream-title-box">
                  {editingTitle ? (
                    <>
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="أدخل عنوان البث..."
                        className="mlc-title-input"
                        maxLength="100"
                      />
                      <button
                        className="mlc-save-btn"
                        onClick={handleUpdateTitle}
                      >
                        ✓
                      </button>
                      <button
                        className="mlc-cancel-btn"
                        onClick={() => {
                          setEditingTitle(false);
                          setEditedTitle(activeStream?.title || '');
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mlc-title-copy">
                        <p>{activeStream?.title || 'بث بدون عنوان'}</p>
                        <span>العنوان متزامن مع الخادم ويمكن تعديله مباشرة أثناء البث.</span>
                      </div>
                      <button
                        className="mlc-edit-btn"
                        onClick={() => setEditingTitle(true)}
                        title="تعديل العنوان"
                      >
                        ✎
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="mlc-pre-live-grid">
                  <div className="mlc-pre-live-card">
                    <label className="mlc-title-label" htmlFor="stream-title-input">مربع عنوان البث</label>
                    <input
                      id="stream-title-input"
                      type="text"
                      value={newStreamData.title}
                      onChange={(e) => setNewStreamData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="اكتب عنوان البث الذي سيظهر للمشاهدين"
                      className="mlc-title-input mlc-title-input-full"
                      maxLength="100"
                    />
                    <div className="mlc-field-meta">
                      <span>يظهر قبل البث ويمكن تعديله لاحقاً من نفس الصفحة.</span>
                      <strong>{newStreamData.title.trim().length}/100</strong>
                    </div>
                  </div>

                  <div className="mlc-pre-live-card mlc-backend-status-card">
                    <div className="mlc-backend-status-head">
                      <strong>حالة الربط</strong>
                      <button className="mlc-inline-link" onClick={refreshBackendStatus} type="button">تحديث الفحص</button>
                    </div>
                    <div className="mlc-status-grid">
                      <div className="mlc-status-chip">
                        <span>API</span>
                        <strong>{backendStatus.online ? 'متصل' : backendStatus.checking ? 'جارٍ الفحص' : 'غير متصل'}</strong>
                      </div>
                      <div className="mlc-status-chip">
                        <span>LiveKit</span>
                        <strong>{backendStatus.livekitConfigured ? 'جاهز' : 'غير مربوط'}</strong>
                      </div>
                      <div className="mlc-status-chip">
                        <span>الحالة</span>
                        <strong>{backendStatus.serviceStatus}</strong>
                      </div>
                    </div>
                    <p className="mlc-backend-note">
                      {backendReadyForLive
                        ? 'صفحة البث مربوطة بالواجهة الخلفية وجاهزة للتشغيل الكامل.'
                        : backendStatus.online
                          ? 'الصفحة مرتبطة بالباك إند، لكن البث الفعلي يحتاج تفعيل LiveKit في إعدادات الخادم.'
                          : 'الواجهة موجودة، لكن التشغيل الكامل لن يكتمل قبل ربط الخادم وتشغيل خدمات البث.'}
                    </p>
                    <code className="mlc-api-base">{backendStatus.apiBase}</code>
                    {backendStatus.error ? <span className="mlc-error-text">{backendStatus.error}</span> : null}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Panel */}
            <div className="mlc-stats-panel">
              <h3>إحصائيات البث</h3>
              <div className="mlc-stats-grid">
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">👁</span>
                  <span className="mlc-stat-value">{streamStats.viewers}</span>
                  <span className="mlc-stat-label">المشاهدون</span>
                </div>
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">📈</span>
                  <span className="mlc-stat-value">{streamStats.peakViewers}</span>
                  <span className="mlc-stat-label">الذروة</span>
                </div>
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">💜</span>
                  <span className="mlc-stat-value">{streamStats.hearts}</span>
                  <span className="mlc-stat-label">الإعجابات</span>
                </div>
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">🎁</span>
                  <span className="mlc-stat-value">{streamStats.gifts}</span>
                  <span className="mlc-stat-label">الهدايا</span>
                </div>
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">⏱</span>
                  <span className="mlc-stat-value">{formatDuration(streamStats.duration)}</span>
                  <span className="mlc-stat-label">المدة</span>
                </div>
                <div className="mlc-stat-item">
                  <span className="mlc-stat-icon">📊</span>
                  <span className="mlc-stat-value">{streamStats.bitrate}kbps</span>
                  <span className="mlc-stat-label">معدل البت</span>
                </div>
              </div>
            </div>

            {/* Gift Goal Section */}
            {newStreamData.giftGoal > 0 && (
              <div className="mlc-gift-goal-section">
                <h3>هدف الهدايا</h3>
                <div className="mlc-gift-goal-box">
                  <div className="mlc-gift-goal-header">
                    <span className="mlc-gift-icon">🎁</span>
                    <span className="mlc-gift-label">تقدم هدفك</span>
                  </div>
                  <div className="mlc-progress-bar">
                    <div
                      className="mlc-progress-fill"
                      style={{ width: `${giftProgress}%` }}
                    ></div>
                  </div>
                  <div className="mlc-progress-text">
                    <span>{streamStats.gifts} / {newStreamData.giftGoal}</span>
                    <span>{Math.round(giftProgress)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="mlc-controls">
            {!isStreaming ? (
              <button
                className="mlc-control-btn mlc-control-btn-start"
                onClick={handleCreateStream}
                disabled={loading}
              >
                <span>▶</span>
                {loading ? 'جاري البدء...' : 'بدء البث'}
              </button>
            ) : (
              <>
                <button
                  className="mlc-control-btn mlc-control-btn-stop"
                  onClick={handleEndStream}
                  disabled={loading}
                >
                  <span>⏹</span>
                  إيقاف البث
                </button>
                <button
                  className={`mlc-control-btn mlc-control-btn-record ${
                    recordingEnabled ? 'active' : ''
                  }`}
                  onClick={handleToggleRecording}
                >
                  <span>{recordingEnabled ? '⏹' : '⏺'}</span>
                  {recordingEnabled ? 'إيقاف التسجيل' : 'بدء التسجيل'}
                </button>
              </>
            )}
          </div>

          {/* Messages Section */}
          <div className="mlc-messages-section">
            <div className="mlc-messages-header">
              <h3>لوحة الرسائل</h3>
              <div className="mlc-messages-info">
                <span className="mlc-message-count">({comments.length}) الكل</span>
              </div>
            </div>

            <div className="mlc-messages-list">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="mlc-message-item">
                    <Avatar name={comment.username} size={36} />
                    <div className="mlc-message-content">
                      <div className="mlc-message-header">
                        <span className="mlc-message-name">{comment.username}</span>
                      </div>
                      <p className="mlc-message-text">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mlc-empty-messages">
                  <p>لا توجد رسائل حتى الآن</p>
                </div>
              )}
            </div>

            <div className="mlc-comment-input">
              <input
                type="text"
                placeholder="اكتب رسالة..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <button onClick={handleSendComment}>إرسال</button>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="mlc-sidebar">
          {/* Viewers Management */}
          {isStreaming && (activeStream?.id || activeStream?.room_id) && (
            <ViewersManagementPanel
              streamId={activeStream.id || activeStream.room_id}
              hostId={activeStream.host_id}
              onViewerCountChange={(count) => {
                setStreamStats(prev => ({ ...prev, viewers: count }));
              }}
            />
          )}

          {/* Gifts Panel */}
          <div className="mlc-gifts-section">
            <h3>الهدايا</h3>
            <div className="mlc-gifts-grid">
              {GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  className="mlc-gift-btn"
                  onClick={() => handleSendGift(gift)}
                  disabled={!isStreaming}
                  title={`${gift.name} - ${gift.price} نقطة`}
                >
                  <span className="mlc-gift-icon-large">{gift.icon}</span>
                  <span className="mlc-gift-price">{gift.price}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
