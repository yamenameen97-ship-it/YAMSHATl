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
  sendLiveGift,
  getLiveStreamStats,
  recordLiveStream,
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
import '../styles/enhanced-live-control.css';

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

export default function EnhancedLiveStreamControl() {
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
    comments: 0,
    duration: 0,
    bitrate: 0,
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  // معلومات الكاميرا والبث
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [streamHealth, setStreamHealth] = useState('good');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const buildViewerUrl = useCallback((streamId) => {
    if (!streamId) return '';
    if (typeof window === 'undefined') return `/live/watch/${streamId}`;
    return `${window.location.origin}/#/live/watch/${streamId}`;
  }, []);

  const openViewerPage = useCallback((streamId = activeStream?.id) => {
    if (!streamId) {
      navigate('/live');
      return;
    }
    navigate(`/live/watch/${streamId}`);
  }, [activeStream?.id, navigate]);

  const copyViewerLink = useCallback(async (streamId = activeStream?.id) => {
    const viewerUrl = buildViewerUrl(streamId);
    if (!viewerUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(viewerUrl);
        pushToast?.({
          type: 'success',
          title: 'تم نسخ رابط المشاهدة',
          description: 'ابعت الرابط للمشتركين أو استخدمه في المنشور.',
        });
        return;
      }
    } catch (error) {
      console.error('فشل نسخ رابط المشاهدة:', error);
    }

    pushToast?.({
      type: 'info',
      title: 'رابط المشاهدة جاهز',
      description: viewerUrl,
    });
  }, [activeStream?.id, buildViewerUrl, pushToast]);

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 50 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      const userStreams = allStreams.filter(s => s.host_username === currentUsername);
      setStreams(userStreams);
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في تحميل البثوث',
        description: 'حاول مرة أخرى لاحقاً',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUsername, pushToast]);

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

        // نشر منشور تلقائي للأصدقاء مع رابط صفحة المشاهدة الصحيحة
        try {
          const { createPost } = await import('../api/posts.js');
          const viewerUrl = buildViewerUrl(response.data.id);
          await createPost({
            content: `📢 أنا الآن في بث مباشر بعنوان: ${title.trim()}!\nتابعوا البث من هنا: ${viewerUrl}`,
            image_url: '/live-stream-thumbnail.png',
          });
        } catch (postError) {
          console.error('Failed to create live announcement post:', postError);
        }

        // بدء البث
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
  }, [buildViewerUrl, newStreamData, pushToast]);

  // بدء البث
  const handleStartStream = useCallback(async (streamId) => {
    if (!streamId) return;

    try {
      // الحصول على التوكن من الخادم
      const tokenResponse = await startLiveStream(streamId, {
        quality: newStreamData.quality || '720p',
      });

      if (tokenResponse?.data?.token) {
        setCameraReady(true);
        setStreamHealth('good');

        // بدء تحديث الإحصائيات
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(streamId);
        }, 5000);

        // بدء عداد المدة
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

      // إيقاف الفترات الزمنية
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

      // إيقاف الكاميرا
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
          bitrate: data.bitrate || prev.bitrate,
        }));

        // تحديد صحة البث
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
      // إضافة التعليق محلياً أولاً
      const newComment = {
        id: Date.now(),
        username: currentUsername,
        text: commentText,
        timestamp: new Date().toISOString(),
      };

      setComments(prev => [...prev, newComment]);
      setCommentText('');

      // إرسال التعليق للخادم
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
  const handleSendGift = useCallback(async (giftId) => {
    if (!activeStream?.id) return;

    try {
      await sendLiveGift(activeStream.id, {
        gift_id: giftId,
      });

      pushToast?.({
        type: 'success',
        title: 'تم إرسال الهدية',
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
    <div className="enhanced-live-control" dir="rtl">
      <div className="control-container">
        {/* الشريط العلوي */}
        <header className="control-header">
          <div className="header-content">
            <h1>🎥 لوحة التحكم بالبث المباشر</h1>
            <p>دي صفحة التحكم الخاصة بصاحب البث فقط، ومفصولة عن صفحة المشاهدة للمشتركين.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="refresh-btn"
              onClick={() => openViewerPage()}
              type="button"
            >
              👁 صفحة المشاهدة
            </button>
            <button
              className="refresh-btn"
              onClick={loadStreams}
              disabled={loading}
              type="button"
            >
              {loading ? 'جارٍ التحديث...' : '↻ تحديث'}
            </button>
          </div>
        </header>

        <div className="control-layout">
          {/* القسم الأيسر - إنشاء وإدارة البث */}
          <aside className="control-sidebar">
            {!isStreaming ? (
              <div className="create-stream-panel">
                <h2>إنشاء بث جديد</h2>

                <div className="form-group">
                  <label>عنوان البث *</label>
                  <input
                    type="text"
                    value={newStreamData.title}
                    onChange={(e) =>
                      setNewStreamData({ ...newStreamData, title: e.target.value })
                    }
                    placeholder="مثال: جلسة ألعاب مسائية"
                    maxLength={100}
                  />
                  <span className="char-count">
                    {newStreamData.title.length}/100
                  </span>
                </div>

                <div className="form-group">
                  <label>الوصف</label>
                  <textarea
                    value={newStreamData.description}
                    onChange={(e) =>
                      setNewStreamData({ ...newStreamData, description: e.target.value })
                    }
                    placeholder="أضف وصفاً للبث..."
                    maxLength={500}
                    rows={3}
                  />
                  <span className="char-count">
                    {newStreamData.description.length}/500
                  </span>
                </div>

                <div className="form-group">
                  <label>الفئة</label>
                  <select
                    value={newStreamData.category}
                    onChange={(e) =>
                      setNewStreamData({ ...newStreamData, category: e.target.value })
                    }
                  >
                    {STREAM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>جودة البث</label>
                  <select
                    value={newStreamData.quality}
                    onChange={(e) =>
                      setNewStreamData({ ...newStreamData, quality: e.target.value })
                    }
                  >
                    {QUALITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={newStreamData.isPublic}
                      onChange={(e) =>
                        setNewStreamData({ ...newStreamData, isPublic: e.target.checked })
                      }
                    />
                    بث عام (يمكن للجميع المشاهدة)
                  </label>
                </div>

                <button
                  className="btn btn-primary btn-large"
                  onClick={handleCreateStream}
                  disabled={loading}
                >
                  {loading ? 'جارٍ الإنشاء...' : '🎬 ابدأ البث'}
                </button>
              </div>
            ) : (
              <div className="active-stream-panel">
                <h2>البث النشط</h2>

                <div className="stream-info">
                  <div className="info-item">
                    <span className="label">العنوان:</span>
                    <span className="value">{activeStream?.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">الفئة:</span>
                    <span className="value">{activeStream?.category}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">الحالة:</span>
                    <span className="value status-live">● مباشر الآن</span>
                  </div>
                </div>

                <div className="control-buttons">
                  <button
                    className={`btn ${recordingEnabled ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={handleToggleRecording}
                  >
                    {recordingEnabled ? '⏹ إيقاف التسجيل' : '⏺ بدء التسجيل'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => openViewerPage(activeStream?.id)}
                    type="button"
                  >
                    👁 فتح صفحة المشاهدة
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyViewerLink(activeStream?.id)}
                    type="button"
                  >
                    🔗 نسخ رابط البث
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleEndStream}
                    disabled={loading}
                  >
                    {loading ? 'جارٍ الإنهاء...' : '🛑 إنهاء البث'}
                  </button>
                </div>
              </div>
            )}

            {/* قائمة البثوث السابقة */}
            <div className="streams-list">
              <h3>البثوث السابقة</h3>
              {streams.length === 0 ? (
                <p className="empty-message">لا توجد بثوث سابقة</p>
              ) : (
                <div className="streams-items">
                  {streams.map((stream) => (
                    <div
                      key={stream.id}
                      className={`stream-item ${activeStream?.id === stream.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveStream(stream);
                        setIsStreaming(stream.is_active);
                      }}
                    >
                      <div className="stream-title">{stream.title}</div>
                      <div className="stream-meta">
                        <span>👁 {stream.viewers_count || 0}</span>
                        <span>💜 {stream.hearts_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* القسم الأيمن - معاينة البث والإحصائيات */}
          <main className="control-main">
            {isStreaming && activeStream ? (
              <>
                {/* معاينة الكاميرا */}
                <div className="camera-preview">
                  {cameraError ? (
                    <div className="camera-error">
                      <div className="error-icon">⚠️</div>
                      <p>{cameraError}</p>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      className="preview-video"
                      autoPlay
                      muted
                      playsInline
                    />
                  )}
                </div>

                {/* شريط الإحصائيات */}
                <div className="stats-bar">
                  <div className="stat-item">
                    <span className="stat-icon">👁</span>
                    <span className="stat-label">المشاهدون</span>
                    <span className="stat-value">{streamStats.viewers}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💜</span>
                    <span className="stat-label">القلوب</span>
                    <span className="stat-value">{streamStats.hearts}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-label">التعليقات</span>
                    <span className="stat-value">{comments.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⏱</span>
                    <span className="stat-label">المدة</span>
                    <span className="stat-value">{formatDuration(streamStats.duration)}</span>
                  </div>
                  <div className={`stat-item health-${streamHealth}`}>
                    <span className="stat-icon">📡</span>
                    <span className="stat-label">الصحة</span>
                    <span className="stat-value">
                      {streamHealth === 'good' ? '✓ جيدة' : streamHealth === 'fair' ? '⚠ متوسطة' : '✗ ضعيفة'}
                    </span>
                  </div>
                </div>

                {/* التعليقات والهدايا */}
                <div className="comments-section">
                  <div className="comments-header">
                    <h3>💬 التعليقات المباشرة</h3>
                    <button
                      className="btn btn-small"
                      onClick={() => setShowGiftPanel(!showGiftPanel)}
                    >
                      🎁 إرسال هدية
                    </button>
                  </div>

                  {showGiftPanel && (
                    <div className="gifts-panel">
                      <div className="gifts-grid">
                        {[
                          { id: 1, name: 'وردة', icon: '🌹', price: 10 },
                          { id: 2, name: 'قهوة', icon: '☕', price: 50 },
                          { id: 3, name: 'قلب', icon: '💜', price: 100 },
                          { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
                          { id: 5, name: 'تاج', icon: '👑', price: 1000 },
                        ].map((gift) => (
                          <button
                            key={gift.id}
                            className="gift-btn"
                            onClick={() => handleSendGift(gift.id)}
                            title={`${gift.name} - ${gift.price} نقطة`}
                          >
                            <span className="gift-icon">{gift.icon}</span>
                            <span className="gift-price">{gift.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <p className="empty-message">لا توجد تعليقات حالياً</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            {comment.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="comment-content">
                            <strong>{comment.username}</strong>
                            <p>{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="comment-input">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSendComment();
                      }}
                      placeholder="أضف تعليقاً..."
                    />
                    <button
                      className="btn btn-small"
                      onClick={handleSendComment}
                      disabled={!commentText.trim()}
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-stream-message">
                <div className="empty-icon">📡</div>
                <h2>لا يوجد بث نشط</h2>
                <p>أنشئ بثاً جديداً من اليسار لبدء البث المباشر</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
