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
          console.log(`Uploading cover: ${p.percent}%`);
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

        // إنشاء منشور تلقائياً يمثل البث الجديد
        // ملاحظة: نرسل حقول واضحة وصريحة حتى يستطيع الـ Feed تمييزه عن غيره
        // ولا نخلط بين thumbnail_url و media_url لتجنب التباس في عرض البث
        try {
          const livePost = {
            type: 'live_stream',
            content: title.trim(),
            title: title.trim(),
            // صورة الغلاف تفترض أن تظهر في المنشور وفي Live Card
            media_url: uploadedCover || undefined,
            image_url: uploadedCover || undefined,
            thumbnail_url: uploadedCover || undefined,
            preview_url: uploadedCover || undefined,
            cover_url: uploadedCover || undefined,
            media_urls: uploadedCover ? [uploadedCover] : undefined,
            // حقول تعريف البث
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

        // ✅ FIX: انضمام المضيف لغرفة البث لاستقبال اللايكات والتعليقات
        socketManager.emit('join_live', {
          room_id: streamId,
          role: 'host',
          platform: 'web',
          device_type: 'browser',
        });

        // ✅ FIX: الاستماع لأحداث البث المباشر (اللايكات والإحصائيات)
        const handleNewHeart = (data) => {
          setStreamStats(prev => ({
            ...prev,
            hearts: data?.count || prev.hearts + 1,
          }));
        };

        const handleRoomStats = (data) => {
          setStreamStats(prev => ({
            ...prev,
            viewers: data?.viewer_count || prev.viewers,
            hearts: data?.hearts_count || prev.hearts,
          }));
        };

        const handleNewComment = (data) => {
          setComments(prev => [...prev, data]);
        };

        socketManager.on('new_heart', handleNewHeart);
        socketManager.on('room_stats', handleRoomStats);
        socketManager.on('new_comment', handleNewComment);

        // حفظ المستمعين للتنظيف لاحقاً
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
  }, [newStreamData.quality, pushToast]);

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

      // تحديث المنشور ليتحول إلى فيديو عادي (أو منشور غير مباشر) بعد إنهاء البث
      // ملاحظة مهمة: نصفّر كل الأعلام المتعلقة بالبث حتى لا تبقى
      // في الـ backend وتعود لـ Feed على أنها "بث نشط" فتتحول المنشورات السابقة في العرض.
      if (activePostId) {
        try {
          await updatePost(activePostId, {
            is_live: false,
            is_live_stream: false,
            has_live_stream: false,
            type: 'video',
            // لا نلمس حقول الوسائط حتى تبقى صورة الغلاف كـ thumbnail للفيديو المسجل
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
  }, [activeStream, pushToast]);

  // تحديث إحصائيات البث
  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getStreamStats(streamId);
      if (response?.data) {
        const data = response.data;
        setStreamStats(prev => ({
          ...prev,
          viewers: data.total_viewers || data.viewers_count || data.viewer_count || prev.viewers,
          hearts: data.total_hearts || data.hearts_count || prev.hearts,
          gifts: data.total_gifts || data.gifts_count || prev.gifts,
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

      setShowGiftPanel(false);
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال الهدية',
        description: 'حاول مرة أخرى',
      });
    }
  }, [activeStream, pushToast]);

  // إرسال قلب
  const handleSendHeart = useCallback(async () => {
    if (!activeStream?.id) return;

    try {
      // ✅ FIX: إرسال القلب عبر Socket
      socketManager.emit('send_heart', {
        room_id: activeStream.id,
      });

      const heart = {
        id: Date.now() + Math.random(),
        icon: '💜',
        x: Math.floor(Math.random() * 80) + 10,
      };
      setFloatingHearts(prev => [...prev.slice(-12), heart]);

      setStreamStats(prev => ({
        ...prev,
        hearts: prev.hearts + 1,
      }));
    } catch (error) {
      console.error('خطأ في إرسال القلب:', error);
    }
  }, [activeStream]);

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

  // تنظيف القلوب الطائرة
  const [floatingHearts, setFloatingHearts] = useState([]);
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

  // تنظيف الفترات الزمنية والمستمعين
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      // تنظيف مستمعي Socket
      socketListenersRef.current.forEach(({ handler, event }) => {
        socketManager.off(event, handler);
      });
      socketListenersRef.current.clear();
    };
  }, []);

  return (
    <div className="modern-live-control" dir="rtl">
      {/* Placeholder for UI - the actual UI rendering code would go here */}
      <div className="live-studio-container">
        <h1>استوديو البث المباشر</h1>
        {/* Add your UI components here */}
      </div>
    </div>
  );
}
