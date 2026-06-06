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
} from '../services/api/correctedLiveStreamApi.js';
import { createPost, updatePost } from '../api/posts.js';
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

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const livePostUpdateIntervalRef = useRef(null);

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

        await handleStartStream(response.data.stream_id);
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

  // دالة للتقاط لقطة من الفيديو
  const captureThumbnail = () => {
    const video = localVideoRef.current;
    if (!video) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 450;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

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
        
        // إنشاء منشور البث تلقائياً في الخلاصة وإرساله للـ Backend
        setTimeout(async () => {
          const thumbnail = captureThumbnail() || 'https://placehold.co/800x450?text=Live+Stream';
          
          const livePostData = {
            type: 'live',
            post_type: 'LIVE',
            live_stream_id: streamId,
            title: newStreamData.title || 'بث مباشر',
            content: newStreamData.description || newStreamData.title || 'بث مباشر جديد',
            thumbnail_url: thumbnail,
            media_url: thumbnail,
            is_live: true,
            status: 'published'
          };

          try {
            // إضافة معلومات المضيف للمنشور المحلي لضمان ظهوره بشكل صحيح في الويب
            const hostInfo = {
              authorName: currentUsername,
              username: currentUsername,
              avatarUrl: '', // يمكن جلبها من الـ store إذا لزم الأمر
            };

            // 1. الإرسال إلى الـ Backend ليراه الجميع
            const backendResponse = await createPost({ ...livePostData, ...hostInfo });
            const savedPost = backendResponse?.data || livePostData;
            
            // 2. التحديث المحلي (للتوافق مع الكود الحالي)
            const localPost = {
              ...savedPost,
              ...hostInfo,
              id: savedPost.id || `live-${streamId}`,
              streamId: streamId,
              isLive: true,
              thumbnail: thumbnail,
              createdAt: new Date().toISOString(),
            };
            
            const existing = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
            // التأكد من عدم تكرار نفس البث
            const filteredExisting = existing.filter(p => p.streamId !== streamId);
            localStorage.setItem('yamshat_posts', JSON.stringify([localPost, ...filteredExisting]));
            
            // إرسال حدث لتحديث الخلاصة فوراً
            window.dispatchEvent(new CustomEvent('yamshat:live-post-created', { detail: localPost }));
            console.log('Live post synced with backend successfully');
          } catch (e) {
            console.error('Error syncing live post with backend:', e);
            
            // Fallback to local storage if backend fails
            const fallbackPost = { 
              ...livePostData, 
              authorName: currentUsername,
              username: currentUsername,
              id: `live-${streamId}`, 
              streamId, 
              isLive: true, 
              thumbnail,
              createdAt: new Date().toISOString()
            };
            const existing = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
            const filteredExisting = existing.filter(p => p.streamId !== streamId);
            localStorage.setItem('yamshat_posts', JSON.stringify([fallbackPost, ...filteredExisting]));
            window.dispatchEvent(new CustomEvent('yamshat:live-post-created', { detail: fallbackPost }));
          }
        }, 500);

        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(streamId);
          // تحديث عدد المشاهدين في منشور البث
          try {
            const existing = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
            const updated = existing.map(p => 
              p.streamId === streamId ? { ...p, viewers: streamStats.viewers } : p
            );
            localStorage.setItem('yamshat_posts', JSON.stringify(updated));
          } catch (e) {
            console.error('Error updating live post viewers:', e);
          }
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
        
        // إرسال حدث لتحديث الخلاصة
        window.dispatchEvent(new CustomEvent('yamshat:stream-started', { detail: { streamId } }));
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
    if (!activeStream?.stream_id) return;

    if (!window.confirm('هل أنت متأكد من إنهاء البث؟')) return;

    setLoading(true);
    
    // دالة تنظيف الحالة المحلية (Local Cleanup) وتحديث الـ Backend
    const performLocalCleanup = async () => {
      const streamId = activeStream.stream_id;
      
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // 1. محاولة تحديث حالة المنشور في الـ Backend
      try {
        const existing = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
        const post = existing.find(p => p.streamId === streamId);
        if (post && post.rawId) {
          await updatePost(post.rawId, { is_live: false, status: 'archived' });
        }
      } catch (e) {
        console.error('Error updating post status on backend:', e);
      }

      // 2. إزالة منشور البث من localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('yamshat_posts') || '[]');
        const filtered = existing.filter(p => p.streamId !== streamId);
        localStorage.setItem('yamshat_posts', JSON.stringify(filtered));
        
        // إرسال حدث لتحديث الخلاصة
        window.dispatchEvent(new CustomEvent('yamshat:stream-ended', { detail: { streamId } }));
      } catch (e) {
        console.error('Error removing live post:', e);
      }

      setActiveStream(null);
      setIsStreaming(false);
      setCameraReady(false);
    };

    try {
      await endLiveStream(activeStream.stream_id);
      await performLocalCleanup();
      
      pushToast?.({
        type: 'success',
        title: 'تم إنهاء البث',
        description: 'تم حفظ البث في سجلاتك',
      });
    } catch (error) {
      // حتى لو فشل الـ API، نقوم بالتنظيف المحلي
      await performLocalCleanup();
      pushToast?.({
        type: 'warning',
        title: 'تنبيه',
        description: 'تم إنهاء البث محلياً، قد يكون هناك تأخير في تحديث الخادم',
      });
    } finally {
      setLoading(false);
    }
  }, [activeStream, pushToast]);

  // تحديث إحصائيات البث
  const updateStreamStats = async (streamId) => {
    try {
      const stats = await getStreamStats(streamId);
      if (stats?.data) {
        setStreamStats(prev => ({
          ...prev,
          viewers: stats.data.viewers_count || 0,
          hearts: stats.data.hearts_count || 0,
          gifts: stats.data.gifts_count || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stream stats:', error);
    }
  };

  // إرسال تعليق
  const handleSendComment = async () => {
    if (!commentText.trim() || !activeStream?.stream_id) return;

    try {
      await sendLiveComment(activeStream.stream_id, commentText.trim());
      setCommentText('');
      // سيتم تحديث التعليقات عبر الـ polling أو الـ socket لاحقاً
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'فشل إرسال التعليق',
      });
    }
  };

  // إرسال هدية
  const handleSendGift = async (gift) => {
    if (!activeStream?.stream_id) return;

    try {
      await sendLiveGift(activeStream.stream_id, gift.id);
      setShowGiftPanel(false);
      pushToast?.({
        type: 'success',
        title: `تم إرسال ${gift.name}`,
      });
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'فشل إرسال الهدية',
        description: 'تأكد من رصيدك',
      });
    }
  };

  // التحكم في الكاميرا والميكروفون
  const handleToggleCamera = async () => {
    const newState = !cameraState.cameraEnabled;
    setCameraState(prev => ({ ...prev, cameraEnabled: newState }));
    if (activeStream?.stream_id) {
      await toggleCamera(activeStream.stream_id, newState);
    }
  };

  const handleToggleMicrophone = async () => {
    const newState = !cameraState.microphoneEnabled;
    setCameraState(prev => ({ ...prev, microphoneEnabled: newState }));
    if (activeStream?.stream_id) {
      await toggleMicrophone(activeStream.stream_id, newState);
    }
  };

  return (
    <div className="modern-live-studio">
      {/* واجهة التحكم بالبث */}
      <div className="studio-container">
        {!isStreaming ? (
          <div className="setup-screen">
            <h1>إعداد البث المباشر</h1>
            <div className="setup-form">
              <input 
                type="text" 
                placeholder="عنوان البث..." 
                value={newStreamData.title}
                onChange={e => setNewStreamData(prev => ({ ...prev, title: e.target.value }))}
              />
              <textarea 
                placeholder="وصف البث..." 
                value={newStreamData.description}
                onChange={e => setNewStreamData(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="form-row">
                <select 
                  value={newStreamData.category}
                  onChange={e => setNewStreamData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {STREAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={newStreamData.quality}
                  onChange={e => setNewStreamData(prev => ({ ...prev, quality: e.target.value }))}
                >
                  {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>
              </div>
              <button 
                className="start-btn" 
                onClick={handleCreateStream}
                disabled={loading}
              >
                {loading ? 'جاري البدء...' : 'بدء البث المباشر'}
              </button>
            </div>
          </div>
        ) : (
          <div className="live-screen">
            <div className="video-preview">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="live-overlay">
                <div className="live-badge">مباشر</div>
                <div className="viewer-count">👁️ {streamStats.viewers}</div>
              </div>
              <div className="stream-controls">
                <button onClick={handleToggleCamera} className={cameraState.cameraEnabled ? 'active' : ''}>
                  {cameraState.cameraEnabled ? '📹' : '📵'}
                </button>
                <button onClick={handleToggleMicrophone} className={cameraState.microphoneEnabled ? 'active' : ''}>
                  {cameraState.microphoneEnabled ? '🎤' : '🔇'}
                </button>
                <button className="end-btn" onClick={handleEndStream}>إنهاء البث</button>
              </div>
            </div>
            
            <div className="studio-sidebar">
              <div className="stats-panel">
                <div className="stat-item">
                  <span className="label">المشاهدات</span>
                  <span className="value">{streamStats.viewers}</span>
                </div>
                <div className="stat-item">
                  <span className="label">القلوب</span>
                  <span className="value">{streamStats.hearts}</span>
                </div>
                <div className="stat-item">
                  <span className="label">الوقت</span>
                  <span className="value">
                    {Math.floor(streamStats.duration / 60)}:
                    {(streamStats.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              <div className="chat-panel">
                <div className="chat-messages">
                  {comments.map((c, i) => (
                    <div key={i} className="chat-msg">
                      <strong>{c.username}:</strong> {c.text}
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input 
                    type="text" 
                    placeholder="اكتب تعليقاً..." 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendComment()}
                  />
                  <button onClick={handleSendComment}>إرسال</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
