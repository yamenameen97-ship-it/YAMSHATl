import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  getLiveStreamStats,
  recordLiveStream,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
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

export default function LiveStudio() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();

  // حالة البث
  const [streams, setStreams] = useState([]);
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
  });

  // إحصائيات البث
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    hearts: 0,
    gifts: 0,
    comments: 0,
    duration: 0,
    bitrate: 0,
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [viewers, setViewers] = useState([]);

  // معلومات الكاميرا والبث
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [streamHealth, setStreamHealth] = useState('good');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 50 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      const userStreams = allStreams.filter(s => s.host_username === currentUsername);
      setStreams(userStreams);
    } catch (error) {
      console.error('خطأ في تحميل البثوث:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUsername]);

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
        is_public: newStreamData.isPublic,
      });

      if (response?.data) {
        setActiveStream(response.data);
        setIsStreaming(true);
        setNewStreamData({
          title: '',
          description: '',
          category: 'ألعاب',
          quality: '720p',
          isPublic: true,
        });

        pushToast?.({
          type: 'success',
          title: 'تم إنشاء البث بنجاح',
          description: 'جاهز لبدء البث المباشر',
        });

        await handleStartStream(response.data.id);
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
  const handleStartStream = useCallback(async (streamId) => {
    if (!streamId) return;

    try {
      const tokenResponse = await startLiveStream(streamId, {
        quality: newStreamData.quality || '720p',
      });

      if (tokenResponse?.data?.token) {
        setCameraReady(true);
        setStreamHealth('good');

        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(streamId);
        }, 5000);

        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        let duration = 0;
        durationIntervalRef.current = setInterval(() => {
          duration += 1;
          setStreamStats(prev => ({ ...prev, duration }));
        }, 1000);

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
    if (!activeStream?.id) return;

    if (!window.confirm('هل أنت متأكد من إنهاء البث؟')) return;

    setLoading(true);
    try {
      await endLiveStream(activeStream.id);

      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
      setStreamStats({
        viewers: 0,
        hearts: 0,
        gifts: 0,
        comments: 0,
        duration: 0,
        bitrate: 0,
      });

      pushToast?.({
        type: 'success',
        title: 'تم إنهاء البث',
        description: 'شكراً على البث!',
      });

      await loadStreams();
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إنهاء البث',
        description: error?.response?.data?.message || 'حاول مرة أخرى',
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast, loadStreams]);

  // تحديث إحصائيات البث
  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getLiveStreamStats(streamId);
      if (response?.data) {
        const data = response.data;
        setStreamStats(prev => ({
          ...prev,
          viewers: data.viewers_count || data.unique_viewers || prev.viewers,
          hearts: data.hearts_count || prev.hearts,
          gifts: data.gifts_count || prev.gifts,
          bitrate: data.bitrate || prev.bitrate,
        }));

        if (data.bitrate && data.bitrate < 1000) {
          setStreamHealth('poor');
        } else if (data.bitrate && data.bitrate < 2000) {
          setStreamHealth('fair');
        } else {
          setStreamHealth('good');
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }, []);

  // تحميل التعليقات
  const loadComments = useCallback(async (streamId) => {
    try {
      const response = await getLiveComments(streamId);
      setComments(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('خطأ في تحميل التعليقات:', error);
    }
  }, []);

  // إرسال تعليق
  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !activeStream?.id) return;

    try {
      const newComment = {
        id: Date.now(),
        username: currentUsername,
        text: commentText,
        timestamp: new Date().toISOString(),
      };

      setComments(prev => [...prev, newComment]);
      setCommentText('');

      await sendLiveComment(activeStream.id, {
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
    if (!activeStream?.id || !gift) return;

    try {
      await sendLiveGift(activeStream.id, {
        gift_id: gift.id,
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

      setShowGiftPanel(false);
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
    if (!activeStream?.id) return;

    try {
      const action = recordingEnabled ? 'stop' : 'start';
      await recordLiveStream(activeStream.id, { action });

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

  // تحميل الكاميرا
  useEffect(() => {
    if (!isStreaming || !activeStream?.id) return;

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
    };
  }, [isStreaming, activeStream?.id]);

  // تحميل البثوث عند التحميل
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // تحميل التعليقات عند تغيير البث النشط
  useEffect(() => {
    if (activeStream?.id) {
      loadComments(activeStream.id);
      const interval = setInterval(() => loadComments(activeStream.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeStream?.id, loadComments]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="modern-live-control" dir="rtl">
      {/* Header */}
      <header className="mlc-header">
        <div className="mlc-header-content">
          <button className="mlc-back-btn" onClick={() => navigate(-1)}>
            <span>&lt;</span>
          </button>
          <div>
            <h1>تحكم البث المباشر</h1>
            <p>أنت الآن مباشر</p>
          </div>
        </div>
        <div className="mlc-header-actions">
          <button className="mlc-live-badge">
            <span className="mlc-live-dot"></span>
            مباشر
          </button>
          <button className="mlc-menu-btn">⋮</button>
        </div>
      </header>

      <div className="mlc-container">
        {/* Main Content */}
        <main className="mlc-main">
          {/* Video Preview */}
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
              </div>
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
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="mlc-controls">
            <button className="mlc-control-btn mlc-control-btn-stop">
              <span>⏹</span>
              إيقاف البث
            </button>
            <button className="mlc-control-btn mlc-control-btn-share">
              <span>↗</span>
              مشاركة البث
            </button>
            <button className="mlc-control-btn mlc-control-btn-edit">
              <span>✏</span>
              تعديل العنوان
            </button>
            <button className="mlc-control-btn mlc-control-btn-mute">
              <span>🔇</span>
              كتم الصوت
            </button>
            <button className="mlc-control-btn mlc-control-btn-camera">
              <span>📷</span>
              كاميرا
            </button>
          </div>

          {/* Stream Title */}
          <div className="mlc-stream-title-section">
            <h3>عنوان البث</h3>
            <div className="mlc-stream-title-box">
              <p>🚀 💜 تصميم جديد لمنصة أسطورية</p>
              <button className="mlc-edit-btn">✏</button>
            </div>
          </div>

          {/* Gift Goal */}
          <div className="mlc-gift-goal-section">
            <h3>هدف الهدايا</h3>
            <div className="mlc-gift-goal-box">
              <div className="mlc-gift-goal-header">
                <span className="mlc-gift-icon">🎁</span>
                <span className="mlc-gift-label">هدف الهدايا</span>
              </div>
              <div className="mlc-progress-bar">
                <div className="mlc-progress-fill" style={{ width: '75%' }}></div>
              </div>
              <div className="mlc-progress-text">
                <span>750 / 1000</span>
              </div>
              <button className="mlc-edit-goal-btn">تعديل الهدف</button>
            </div>
          </div>

          {/* Messages Section */}
          <div className="mlc-messages-section">
            <div className="mlc-messages-header">
              <h3>لوحة الرسائل</h3>
              <div className="mlc-messages-info">
                <span className="mlc-message-count">(125) الكل</span>
                <button className="mlc-filter-btn">⚙</button>
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
                        {comment.gift_count && (
                          <span className="mlc-message-gift">💜 {comment.gift_count}</span>
                        )}
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

            <div className="mlc-messages-footer">
              <button className="mlc-view-all-btn">عرض الكل</button>
              <button className="mlc-settings-btn">إعدادات الرسائل</button>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="mlc-sidebar">
          {/* Viewers List */}
          <div className="mlc-viewers-section">
            <h3>المشتركون الحاليون</h3>
            <div className="mlc-viewers-list">
              {viewers.length > 0 ? (
                viewers.slice(0, 8).map((viewer) => (
                  <div key={viewer.id} className="mlc-viewer-item">
                    <Avatar name={viewer.username} size={32} />
                    <span className="mlc-viewer-name">{viewer.username}</span>
                  </div>
                ))
              ) : (
                <p className="mlc-empty-viewers">لا يوجد مشتركون حالياً</p>
              )}
            </div>
          </div>

          {/* Gifts Panel */}
          <div className="mlc-gifts-section">
            <h3>الهدايا</h3>
            <div className="mlc-gifts-grid">
              {GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  className="mlc-gift-btn"
                  onClick={() => handleSendGift(gift)}
                  title={`${gift.name} - ${gift.price} نقطة`}
                >
                  <span className="mlc-gift-icon-large">{gift.icon}</span>
                  <span className="mlc-gift-price">{gift.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mlc-quick-actions">
            <button className="mlc-quick-action-btn">
              <span>👍</span>
              <span>مشاركة</span>
            </button>
            <button className="mlc-quick-action-btn">
              <span>👥</span>
              <span>دعوة</span>
            </button>
            <button className="mlc-quick-action-btn">
              <span>🎁</span>
              <span>إرسال هدية</span>
            </button>
            <button className="mlc-quick-action-btn">
              <span>📊</span>
              <span>إحصائيات</span>
            </button>
            <button className="mlc-quick-action-btn">
              <span>⋯</span>
              <span>المزيد</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
