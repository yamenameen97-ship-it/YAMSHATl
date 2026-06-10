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
  recordLiveStream,
  updateCameraState,
  closeCameraStream,
  toggleCamera,
  toggleMicrophone,
  getStreamViewers,
} from '../services/api/advancedLiveStreamApi.js';
import { createPost, updatePost } from '../api/posts.js';
import { uploadFile } from '../services/media/mediaUploadService.js';
import { getCurrentUsername } from '../utils/auth.js';
import socketManager from '../services/socketManager.js';
import livekitService from '../services/livekitService.js';
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
  const [cameraState, setCameraState] = useState({
    cameraEnabled: true,
    microphoneEnabled: true,
    screenShareEnabled: false,
  });

  // صورة الغلاف
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [activePostId, setActivePostId] = useState(null);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const socketListenersRef = useRef(new Map());
  const heartTimerRef = useRef(null);

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
      let uploadedCover = '';
      if (coverImage) {
        const uploadRes = await uploadFile(coverImage, (p) => {
          // ✅ FIX: إغراق الكونسول بـ 16 سطراً أثناء الرفع غير مفيد للمستخدم
          if (import.meta?.env?.DEV) {
            // eslint-disable-next-line no-console
            console.debug(`Uploading cover: ${p.percent}%`);
          }
        });
        uploadedCover = uploadRes?.url || '';
      }

      const response = await createLiveStream({
        title: title.trim(),
        description: description.trim(),
        category,
        quality,
        isPublic: newStreamData.isPublic,
        thumbnail_url: uploadedCover,
      });

      if (response?.data) {
        const streamId = response.data.id;
        setActiveStream(response.data);
        setIsStreaming(true);

        try {
          const livePost = {
            type: 'live_stream',
            content: title.trim(),
            title: title.trim(),
            media_url: uploadedCover || undefined,
            image_url: uploadedCover || undefined,
            thumbnail_url: uploadedCover || undefined,
            preview_url: uploadedCover || undefined,
            cover_url: uploadedCover || undefined,
            media_urls: uploadedCover ? [uploadedCover] : undefined,
            stream_id: streamId,
            live_stream_id: streamId,
            live_id: streamId,
            username: currentUsername,
            is_live: true,
            is_live_stream: true,
            has_live_stream: true,
            status: 'published'
          };
          const postRes = await createPost(livePost);
          if (postRes?.data?.id) {
            setActivePostId(postRes.data.id);
          }
        } catch (postErr) {
          console.error('Failed to create live post:', postErr);
        }

        setNewStreamData({
          title: '',
          description: '',
          category: 'ألعاب',
          quality: '720p',
          isPublic: true,
        });
        setCoverImage(null);
        setCoverPreview('');

        pushToast?.({
          type: 'success',
          title: 'تم إنشاء البث بنجاح',
          description: 'جاهز لبدء البث المباشر',
        });

        // ✅ إرسال إشعار محلي للأصدقاء/المتابعين بأن البث بدأ.
        // GlobalNotificationListener يلتقط الحدث ويعرض toast + يحدّث الجرس.
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('yamshat:notification', {
              detail: {
                id: `live-start-${streamId}`,
                type: 'live_stream_started',
                title: `🔴 ${currentUsername || 'مستخدم'} بدأ بثاً مباشراً`,
                body: title.trim() || 'انضم الآن إلى البث المباشر',
                path: `/live/view/${streamId}`,
                created_at: new Date().toISOString(),
                payload: {
                  stream_id: streamId,
                  host: currentUsername,
                  thumbnail_url: uploadedCover || '',
                },
              },
            }));
            // Toast فوري للمستخدمين النشطين
            window.dispatchEvent(new CustomEvent('yamshat:toast', {
              detail: {
                type: 'info',
                title: `🔴 بث مباشر جديد من ${currentUsername || 'مستخدم'}`,
                description: title.trim(),
                duration: 5000,
              },
            }));
          }
        } catch (notifErr) {
          console.error('Failed to dispatch live notification:', notifErr);
        }

        await handleStartStream(streamId);
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
  }, [newStreamData, pushToast, coverImage, currentUsername]);

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

        // ✅ FIX: نشر الكاميرا/المايك فعلياً في LiveKit حتى يقدر المشاهدون يفتحوا البث
        const livekitUrl = tokenResponse?.data?.livekit_url || '';
        const livekitRoom = tokenResponse?.data?.livekit_room || '';
        if (livekitUrl && livekitRoom) {
          const livekitResult = await livekitService.connect(
            livekitUrl,
            tokenResponse.data.token,
            livekitRoom,
            currentUsername,
            {
              autoSubscribe: true,
              mediaState: {
                cameraEnabled: cameraState.cameraEnabled !== false,
                microphoneEnabled: cameraState.microphoneEnabled !== false,
              },
            },
          );
          if (!livekitResult?.success) {
            throw new Error(livekitResult?.error || 'livekit_connect_error');
          }
          await livekitService.setCameraEnabled(cameraState.cameraEnabled !== false).catch(() => {});
          await livekitService.setMicrophoneEnabled(cameraState.microphoneEnabled !== false).catch(() => {});
        }

        // ✅ FIX: انضمام المضيف لغرفة البث لاستقبال اللايكات والتعليقات
        socketManager.emit('join_live', {
          room_id: streamId,
          role: 'host',
          platform: 'web',
          device_type: 'browser',
        }, { queue: false });

        // ✅ FIX: الاستماع لأحداث البث المباشر
        const handleNewHeart = (data) => {
          setStreamStats(prev => ({
            ...prev,
            hearts: data?.count ?? (prev.hearts + 1),
          }));
        };

        const handleRoomStats = (data) => {
          setStreamStats(prev => ({
            ...prev,
            viewers: data?.viewer_count ?? prev.viewers,
            hearts: data?.hearts_count ?? prev.hearts,
          }));
        };

        const handleNewComment = (data) => {
          setComments(prev => [...prev, data]);
        };

        socketManager.on('new_heart', handleNewHeart);
        socketManager.on('room_stats', handleRoomStats);
        socketManager.on('new_comment', handleNewComment);

        socketListenersRef.current.set('new_heart', { handler: handleNewHeart, event: 'new_heart' });
        socketListenersRef.current.set('room_stats', { handler: handleRoomStats, event: 'room_stats' });
        socketListenersRef.current.set('new_comment', { handler: handleNewComment, event: 'new_comment' });

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
  }, [newStreamData.quality, pushToast, currentUsername, cameraState.cameraEnabled, cameraState.microphoneEnabled]);

  // إنهاء البث
  const handleEndStream = useCallback(async () => {
    if (!activeStream?.id) return;

    if (!window.confirm('هل أنت متأكد من إنهاء البث؟')) return;

    setLoading(true);
    try {
      // ✅ FIX: مغادرة غرفة البث وإيقاف الاستماع للأحداث
      socketManager.emit('leave_live', { room_id: activeStream.id });
      socketListenersRef.current.forEach(({ handler, event }) => {
        socketManager.off(event, handler);
      });
      socketListenersRef.current.clear();

      // ✅ FIX: قطع اتصال LiveKit إذا كان موجوداً
      await livekitService.disconnect();

      await endLiveStream(activeStream.id);

      if (activePostId) {
        try {
          await updatePost(activePostId, {
            is_live: false,
            is_live_stream: false,
            has_live_stream: false,
            type: 'video',
          });
        } catch (updateErr) {
          console.error('Failed to update post on end stream:', updateErr);
        }
      }

      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
      setActivePostId(null);
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
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إنهاء البث',
        description: error?.response?.data?.message || 'حاول مرة أخرى',
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast, activePostId]);

  // تحديث إحصائيات البث
  // ✅ FIX: إيقاف الاستطلاع بصمت عند 401/403/404 لتفادي إغراق الكونسول
  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getStreamStats(streamId);
      if (response?.data) {
        const data = response.data;
        setStreamStats(prev => ({
          ...prev,
          viewers: data.total_viewers ?? data.viewers_count ?? data.viewer_count ?? prev.viewers,
          hearts: data.total_hearts ?? data.hearts_count ?? prev.hearts,
          gifts: data.total_gifts ?? data.gifts_count ?? prev.gifts,
          bitrate: data.bitrate ?? prev.bitrate,
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
      const status = error?.response?.status;
      // 401/403/404 = صلاحيات/انتهاء/غير موجود → أوقف الاستطلاع بصمت
      if (status === 401 || status === 403 || status === 404) {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
        return;
      }
      // أخطاء أخرى: لا تطبع رسائل متكررة في الكونسول
      // (تم استبدال console.error بصمت لتقليل الضوضاء)
    }
  }, []);

  // تحميل التعليقات
  const loadComments = useCallback(async (streamId) => {
    try {
      const response = await getLiveComments(streamId);
      if (Array.isArray(response?.data)) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('خطأ في تحميل التعليقات:', error);
    }
  }, []);

  // ✅ FIX: تحميل التعليقات عند بدء البث
  useEffect(() => {
    if (activeStream?.id && isStreaming) {
      loadComments(activeStream.id);
    }
  }, [activeStream?.id, isStreaming, loadComments]);

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
      const textToSend = commentText;
      setCommentText('');

      // ✅ FIX: إرسال التعليق عبر Socket للحصول على تحديثات فورية
      socketManager.emit('send_comment', {
        room_id: activeStream.id,
        text: textToSend,
      });

      await sendLiveComment(activeStream.id, {
        text: textToSend,
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
      // ✅ FIX: إرسال الهدية عبر Socket للحصول على تحديثات فورية
      socketManager.emit('send_gift', {
        room_id: activeStream.id,
        gift_id: gift.id,
        name: gift.name,
        price: gift.price,
      });

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

  // تبديل الكاميرا
  const handleToggleCamera = useCallback(async () => {
    if (!activeStream?.id) return;

    try {
      const newState = !cameraState.cameraEnabled;
      await toggleCamera(activeStream.id, newState);
      await livekitService.setCameraEnabled(newState).catch(() => {});
      
      setCameraState(prev => ({
        ...prev,
        cameraEnabled: newState,
      }));

      pushToast?.({
        type: 'success',
        title: newState ? 'تم تشغيل الكاميرا' : 'تم إيقاف الكاميرا',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في تبديل الكاميرا',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, cameraState.cameraEnabled, pushToast]);

  // تبديل الميكروفون
  const handleToggleMicrophone = useCallback(async () => {
    if (!activeStream?.id) return;

    try {
      const newState = !cameraState.microphoneEnabled;
      await toggleMicrophone(activeStream.id, newState);
      await livekitService.setMicrophoneEnabled(newState).catch(() => {});
      
      setCameraState(prev => ({
        ...prev,
        microphoneEnabled: newState,
      }));

      pushToast?.({
        type: 'success',
        title: newState ? 'تم تشغيل الميكروفون' : 'تم كتم الميكروفون',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في تبديل الميكروفون',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, cameraState.microphoneEnabled, pushToast]);

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

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // تنظيف المستمعين عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      socketListenersRef.current.forEach(({ handler, event }) => {
        socketManager.off(event, handler);
      });
      socketListenersRef.current.clear();
    };
  }, []);

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
        {/* Main Content */}
        <main className="mlc-main">
          {/* Video Section */}
          <div className="mlc-video-section">
            {!isStreaming && (
              <div className="mlc-pre-live-card" style={{ marginBottom: '16px' }}>
                <h3 className="mlc-title-label">إعدادات البث</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="عنوان البث..."
                    className="mlc-message-text"
                    style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '10px', borderRadius: '8px', color: 'white' }}
                    value={newStreamData.title}
                    onChange={(e) => setNewStreamData(prev => ({ ...prev, title: e.target.value }))}
                  />
                  
                  <div className="cover-upload-section">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>صورة الغلاف</label>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="cover-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCoverImage(file);
                        setCoverPreview(URL.createObjectURL(file));
                      }}
                    />
                    <button 
                      onClick={() => document.getElementById('cover-upload-input').click()}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(124, 58, 237, 0.4)', color: 'white', cursor: 'pointer' }}
                    >
                      رفع صورة الغلاف
                    </button>
                    {coverPreview && (
                      <div style={{ marginTop: '12px', position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                        <img src={coverPreview} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => { setCoverImage(null); setCoverPreview(''); }}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                  className={`mlc-control-btn mlc-control-btn-camera ${
                    !cameraState.cameraEnabled ? 'disabled' : ''
                  }`}
                  onClick={handleToggleCamera}
                >
                  <span>{cameraState.cameraEnabled ? '📷' : '🚫'}</span>
                  {cameraState.cameraEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                </button>
                <button
                  className={`mlc-control-btn mlc-control-btn-mute ${
                    !cameraState.microphoneEnabled ? 'disabled' : ''
                  }`}
                  onClick={handleToggleMicrophone}
                >
                  <span>{cameraState.microphoneEnabled ? '🎤' : '🔇'}</span>
                  {cameraState.microphoneEnabled ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}
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
                    <Avatar name={comment.username || comment.user} size={36} />
                    <div className="mlc-message-content">
                      <div className="mlc-message-header">
                        <span className="mlc-message-name">{comment.username || comment.user}</span>
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
          {isStreaming && activeStream?.id && (
            <ViewersManagementPanel
              streamId={activeStream.id}
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
