import { useState, useEffect, useCallback, useRef } from 'react';
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
import '../styles/livestream-dashboard.css';

export default function LiveStreamDashboard() {
  const currentUsername = getCurrentUsername();
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    hearts: 0,
    comments: 0,
    duration: 0,
  });
  const [newStreamData, setNewStreamData] = useState({
    title: '',
    description: '',
    category: 'ألعاب',
  });

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // تحميل البثوث
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
    if (!newStreamData.title.trim()) {
      alert('أدخل عنوان البث');
      return;
    }

    setLoading(true);
    try {
      const response = await createLiveStream({
        title: newStreamData.title.trim(),
        description: newStreamData.description.trim(),
        category: newStreamData.category,
        is_public: true,
      });

      if (response?.data) {
        setActiveStream(response.data);
        setIsStreaming(true);
        setNewStreamData({ title: '', description: '', category: 'ألعاب' });

        // بدء البث
        await startLiveStream(response.data.id);

        // بدء تحديث الإحصائيات
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = setInterval(() => {
          updateStreamStats(response.data.id);
        }, 5000);

        // بدء عداد المدة
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        let duration = 0;
        durationIntervalRef.current = setInterval(() => {
          duration += 1;
          setStreamStats(prev => ({ ...prev, duration }));
        }, 1000);
      }
    } catch (error) {
      console.error('خطأ في إنشاء البث:', error);
      alert('فشل في إنشاء البث');
    } finally {
      setLoading(false);
    }
  }, [newStreamData]);

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
      setStreamStats({ viewers: 0, hearts: 0, comments: 0, duration: 0 });
      await loadStreams();
    } catch (error) {
      console.error('خطأ في إنهاء البث:', error);
      alert('فشل في إنهاء البث');
    } finally {
      setLoading(false);
    }
  }, [activeStream, loadStreams]);

  // تحديث الإحصائيات
  const updateStreamStats = useCallback(async (streamId) => {
    try {
      const response = await getLiveStreamStats(streamId);
      if (response?.data) {
        setStreamStats(prev => ({
          ...prev,
          viewers: response.data.viewers_count || response.data.unique_viewers || prev.viewers,
          hearts: response.data.hearts_count || prev.hearts,
        }));
      }
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }, []);

  // تحميل التعليقات
  const loadComments = useCallback(async (streamId) => {
    try {
      const response = await getLiveComments(streamId, 50);
      setComments(Array.isArray(response?.data) ? response.data : []);
      setStreamStats(prev => ({
        ...prev,
        comments: Array.isArray(response?.data) ? response.data.length : 0,
      }));
    } catch (error) {
      console.error('خطأ في تحميل التعليقات:', error);
    }
  }, []);

  // إرسال تعليق
  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !activeStream?.id) return;

    try {
      // إضافة التعليق محلياً
      const newComment = {
        id: Date.now(),
        username: currentUsername,
        text: commentText,
      };

      setComments(prev => [...prev, newComment]);
      setCommentText('');
      await loadComments(activeStream.id);
    } catch (error) {
      console.error('خطأ في إرسال التعليق:', error);
    }
  }, [commentText, activeStream, currentUsername, loadComments]);

  // إرسال هدية
  const handleSendGift = useCallback(async (giftId) => {
    if (!activeStream?.id) return;

    try {
      await sendLiveGift(activeStream.id, { gift_id: giftId });
      setShowGiftPanel(false);
    } catch (error) {
      console.error('خطأ في إرسال الهدية:', error);
    }
  }, [activeStream]);

  // تبديل التسجيل
  const handleToggleRecording = useCallback(async () => {
    if (!activeStream?.id) return;

    try {
      const action = recordingEnabled ? 'stop' : 'start';
      await recordLiveStream(activeStream.id, { action });
      setRecordingEnabled(!recordingEnabled);
    } catch (error) {
      console.error('خطأ في التسجيل:', error);
    }
  }, [activeStream, recordingEnabled]);

  // تحميل الكاميرا
  useEffect(() => {
    if (!isStreaming || !activeStream?.id) return;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          alert('هذا المتصفح لا يدعم الكاميرا');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }
      } catch (error) {
        console.error('خطأ في تشغيل الكاميرا:', error);
        alert('فشل في تشغيل الكاميرا');
      }
    };

    setupCamera();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isStreaming, activeStream?.id]);

  // تحميل البثوث عند التحميل
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  // تنظيف الفترات الزمنية
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="livestream-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📡</span>
            <span className="logo-text">LiveStream Control</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar"></div>
          <div className="user-info">
            <p className="user-name">{currentUsername}</p>
            <p className="user-status">{isStreaming ? 'مباشر الآن' : 'متصل'}</p>
          </div>
        </div>

        {!isStreaming ? (
          <div className="create-stream-panel">
            <h2>إنشاء بث جديد</h2>

            <div className="form-group">
              <label>عنوان البث</label>
              <input
                type="text"
                value={newStreamData.title}
                onChange={(e) => setNewStreamData({ ...newStreamData, title: e.target.value })}
                placeholder="أدخل عنوان البث"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>الوصف</label>
              <textarea
                value={newStreamData.description}
                onChange={(e) => setNewStreamData({ ...newStreamData, description: e.target.value })}
                placeholder="أضف وصفاً للبث"
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>الفئة</label>
              <select
                value={newStreamData.category}
                onChange={(e) => setNewStreamData({ ...newStreamData, category: e.target.value })}
              >
                <option>ألعاب</option>
                <option>موسيقى</option>
                <option>تعليم</option>
                <option>ترفيه</option>
                <option>رياضة</option>
                <option>تقنية</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
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
                className="btn btn-danger"
                onClick={handleEndStream}
                disabled={loading}
              >
                {loading ? 'جارٍ الإنهاء...' : '🛑 إنهاء البث'}
              </button>
            </div>
          </div>
        )}

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

      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="بحث..." />
          </div>
          <div className="top-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">✉️</button>
          </div>
        </header>

        <div className="dashboard-content">
          {isStreaming && activeStream ? (
            <>
              <div className="page-header">
                <h1>🎥 لوحة التحكم بالبث المباشر</h1>
                <p>تحكم كامل بالبث والمشاهدين والإحصائيات</p>
              </div>

              {/* معاينة الكاميرا */}
              <div className="camera-preview">
                <video
                  ref={localVideoRef}
                  className="preview-video"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {/* شريط الإحصائيات */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👁</div>
                  <span className="stat-label">المشاهدون</span>
                  <span className="stat-value">{streamStats.viewers}</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💜</div>
                  <span className="stat-label">القلوب</span>
                  <span className="stat-value">{streamStats.hearts}</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💬</div>
                  <span className="stat-label">التعليقات</span>
                  <span className="stat-value">{streamStats.comments}</span>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱</div>
                  <span className="stat-label">المدة</span>
                  <span className="stat-value">{formatDuration(streamStats.duration)}</span>
                </div>
              </section>

              {/* قسم التعليقات */}
              <div className="comments-section">
                <h3>💬 التعليقات المباشرة</h3>
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="empty-message">لا توجد تعليقات حالياً</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <strong>{comment.username}</strong>
                        <p>{comment.text}</p>
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

              {/* لوحة الهدايا */}
              <div className="gifts-section">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowGiftPanel(!showGiftPanel)}
                >
                  🎁 إرسال هدية
                </button>

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
                          <span className="gift-name">{gift.name}</span>
                          <span className="gift-price">{gift.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-stream-message">
              <div className="empty-icon">📡</div>
              <h2>لا يوجد بث نشط</h2>
              <p>أنشئ بثاً جديداً من اليسار لبدء البث المباشر</p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .livestream-dashboard {
          display: grid;
          grid-template-columns: 300px 1fr;
          min-height: 100vh;
          background: var(--bg, #0e0e18);
          color: var(--text, #fff);
        }

        .sidebar {
          background: var(--panel, #1a1a25);
          border-right: 1px solid var(--line, #2a2a3a);
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--line, #2a2a3a);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-icon { font-size: 24px; }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg, #0e0e18);
          border-radius: 10px;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
        }

        .user-info { flex: 1; }
        .user-name { margin: 0; font-weight: 600; font-size: 14px; }
        .user-status { margin: 0; font-size: 12px; color: var(--muted, #888); }

        .create-stream-panel,
        .active-stream-panel,
        .streams-list {
          background: var(--bg, #0e0e18);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 10px;
          padding: 15px;
        }

        .create-stream-panel h2,
        .active-stream-panel h2,
        .streams-list h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #888);
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 10px;
          background: var(--panel, #1a1a25);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 8px;
          color: var(--text, #fff);
          font-family: inherit;
          font-size: 13px;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .btn {
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          width: 100%;
          margin-top: 10px;
        }

        .btn-secondary {
          background: rgba(139, 92, 246, 0.1);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stream-info {
          background: var(--panel, #1a1a25);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid var(--line, #2a2a3a);
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item .label {
          font-weight: 600;
          font-size: 12px;
          color: var(--muted, #888);
        }

        .info-item .value {
          font-size: 13px;
        }

        .status-live {
          color: #10b981;
          font-weight: 600;
        }

        .control-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .streams-list {
          flex: 1;
          overflow-y: auto;
        }

        .streams-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stream-item {
          padding: 10px;
          background: var(--panel, #1a1a25);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .stream-item:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .stream-item.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
        }

        .stream-title {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stream-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: var(--muted, #888);
        }

        .empty-message {
          text-align: center;
          color: var(--muted, #888);
          font-size: 12px;
          padding: 15px;
          margin: 0;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: var(--panel, #1a1a25);
          border-bottom: 1px solid var(--line, #2a2a3a);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg, #0e0e18);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 8px;
          flex: 1;
          max-width: 300px;
        }

        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text, #fff);
          font-size: 13px;
        }

        .search-bar input::placeholder {
          color: var(--muted, #888);
        }

        .top-actions {
          display: flex;
          gap: 10px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid var(--line, #2a2a3a);
          background: var(--bg, #0e0e18);
          color: var(--text, #fff);
          cursor: pointer;
          font-size: 18px;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .page-header {
          margin-bottom: 20px;
        }

        .page-header h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
        }

        .page-header p {
          margin: 0;
          color: var(--muted, #888);
          font-size: 14px;
        }

        .camera-preview {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 20px;
          border: 1px solid var(--line, #2a2a3a);
        }

        .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: var(--panel, #1a1a25);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }

        .stat-icon {
          font-size: 28px;
          margin-bottom: 8px;
          display: block;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--muted, #888);
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          font-size: 22px;
          font-weight: 700;
        }

        .comments-section,
        .gifts-section {
          background: var(--panel, #1a1a25);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .comments-section h3,
        .gifts-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .comments-list {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .comment-item {
          padding: 10px;
          background: var(--bg, #0e0e18);
          border-radius: 8px;
        }

        .comment-item strong {
          display: block;
          font-size: 13px;
          margin-bottom: 4px;
        }

        .comment-item p {
          margin: 0;
          font-size: 13px;
          color: var(--text, #fff);
        }

        .comment-input {
          display: flex;
          gap: 8px;
        }

        .comment-input input {
          flex: 1;
          padding: 8px 10px;
          background: var(--bg, #0e0e18);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 8px;
          color: var(--text, #fff);
          font-size: 13px;
        }

        .comment-input .btn {
          padding: 8px 12px;
        }

        .gifts-panel {
          background: var(--bg, #0e0e18);
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
        }

        .gifts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
        }

        .gift-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px;
          background: var(--panel, #1a1a25);
          border: 1px solid var(--line, #2a2a3a);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--text, #fff);
        }

        .gift-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          transform: translateY(-2px);
        }

        .gift-icon {
          font-size: 24px;
        }

        .gift-name {
          font-size: 11px;
          font-weight: 600;
        }

        .gift-price {
          font-size: 10px;
          color: var(--muted, #888);
        }

        .no-stream-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          color: var(--muted, #888);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.5;
        }

        .no-stream-message h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: var(--text, #fff);
        }

        .no-stream-message p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .livestream-dashboard {
            grid-template-columns: 1fr;
          }

          .sidebar {
            max-height: 300px;
            border-right: none;
            border-bottom: 1px solid var(--line, #2a2a3a);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
