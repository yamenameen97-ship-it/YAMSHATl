import { useState, useEffect, useCallback, useRef } from 'react';
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
} from '../services/api/liveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
// import '../styles/enhanced-live-viewer.css';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'قهوة', icon: '☕', price: 50 },
  { id: 3, name: 'قلب كبير', icon: '💜', price: 100 },
  { id: 4, name: 'نجمة', icon: '⭐', price: 250 },
  { id: 5, name: 'تاج ملكي', icon: '👑', price: 1000 },
];

const STREAM_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'النشطة' },
  { key: 'popular', label: 'الأكثر مشاهدة' },
];

function Avatar({ name = '', size = 42, ring = false }) {
  const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f97316', '#ec4899'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color,
    color: 'white',
    fontWeight: 900,
    fontSize: size / 2,
    flexShrink: 0,
    border: ring ? '3px solid rgba(239, 68, 68, 0.8)' : 'none',
    boxShadow: ring ? '0 0 0 6px rgba(239, 68, 68, 0.1)' : 'none',
  };

  return (
    <div style={style}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function FloatingHearts({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="floating-hearts" aria-hidden="true">
      {items.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            right: `${heart.x}%`,
            animation: `floatUp 1.5s ease-out forwards`,
          }}
        >
          {heart.icon || '💜'}
        </div>
      ))}
    </div>
  );
}

export default function Live() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();

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
  });

  // التعليقات والهدايا
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  // الحالات الأخرى
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewers, setViewers] = useState([]);

  const heartTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const commentsIntervalRef = useRef(null);

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 100 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      setStreams(allStreams);

      // تطبيق الفلتر
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
      pushToast?.({
        type: 'warning',
        title: 'خطأ في تحميل البثوث',
        description: 'حاول مرة أخرى لاحقاً',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, pushToast]);

  // فتح البث
  const openStream = useCallback(async (stream) => {
    if (!stream?.id) return;

    setActiveStream(stream);

    try {
      // تحميل تفاصيل البث
      const detailsResponse = await getLiveStreamDetails(stream.id);
      if (detailsResponse?.data) {
        setStreamDetails(detailsResponse.data);
        setStreamStats({
          viewers: detailsResponse.data.viewers_count || 0,
          hearts: detailsResponse.data.hearts_count || 0,
          comments: 0,
        });
      }

      // تحميل التعليقات
      const commentsResponse = await getLiveComments(stream.id);
      setComments(Array.isArray(commentsResponse?.data) ? commentsResponse.data : []);

      // تحميل المشاهدين
      const viewersResponse = await getLiveStreamViewers(stream.id);
      if (viewersResponse?.data?.viewers) {
        setViewers(viewersResponse.data.viewers);
      }

      // بدء تحديث الإحصائيات
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = setInterval(() => {
        updateStreamStats(stream.id);
      }, 3000);

      // بدء تحديث التعليقات
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
      commentsIntervalRef.current = setInterval(() => {
        loadComments(stream.id);
      }, 2000);

      pushToast?.({
        type: 'success',
        title: 'تم الانضمام للبث',
        description: `مرحباً في بث ${stream.title}`,
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في فتح البث',
        description: 'حاول مرة أخرى',
      });
    }
  }, [pushToast]);

  // تحديث إحصائيات البث
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
      await sendLiveComment(activeStream.id, {
        text: commentText,
      });

      setCommentText('');
      await loadComments(activeStream.id);

      pushToast?.({
        type: 'success',
        title: 'تم إرسال التعليق',
      });
    } catch (error) {
      pushToast?.({
        type: 'warning',
        title: 'خطأ في إرسال التعليق',
        description: 'حاول مرة أخرى',
      });
    }
  }, [commentText, activeStream, pushToast, loadComments]);

  // إرسال قلب
  const handleSendHeart = useCallback(async () => {
    if (!activeStream?.id) return;

    try {
      await sendLiveHeart(activeStream.id);

      // إضافة قلب طائر
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

  // إرسال هدية
  const handleSendGift = useCallback(async (gift) => {
    if (!activeStream?.id || !gift) return;

    try {
      await sendLiveGift(activeStream.id, {
        gift_id: gift.id,
        name: gift.name,
        price: gift.price,
      });

      pushToast?.({
        type: 'success',
        title: `تم إرسال ${gift.name}`,
        description: `شكراً على الدعم!`,
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

  // تحميل البثوث عند التحميل
  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

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

  // تنظيف الفترات الزمنية عند الفصل
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
    };
  }, []);

  const hostName = activeStream?.host_name || activeStream?.host_username || 'مضيف البث';

  return (
    <div className="enhanced-live-viewer" dir="rtl">
      <div className="viewer-container">
        {/* الشريط العلوي */}
        <header className="viewer-header">
          <div className="header-content">
            <h1>📡 البث المباشر</h1>
            <p>تابع البثوث الحية والمشاهدين من حول العالم</p>
          </div>
          <button
            className="refresh-btn"
            onClick={loadStreams}
            disabled={loading}
          >
            {loading ? 'جارٍ التحديث...' : '↻ تحديث'}
          </button>
        </header>

        <div className="viewer-layout">
          {/* البث الرئيسي */}
          <main className="viewer-main">
            {activeStream ? (
              <>
                {/* منطقة البث */}
                <div className="stream-container">
                  <div className="stream-player">
                    <div className="player-placeholder">
                      <div className="player-icon">📺</div>
                      <p>بث مباشر من {hostName}</p>
                      <small>{activeStream.title}</small>
                    </div>
                    <FloatingHearts items={floatingHearts} />
                  </div>

                  {/* معلومات البث */}
                  <div className="stream-info">
                    <div className="info-header">
                      <Avatar name={hostName} size={48} ring={activeStream.is_active} />
                      <div className="host-details">
                        <h2>{activeStream.title}</h2>
                        <p>المضيف: {hostName}</p>
                      </div>
                      {activeStream.is_active && (
                        <span className="live-badge">● مباشر</span>
                      )}
                    </div>

                    {/* شريط الإحصائيات */}
                    <div className="stats-row">
                      <div className="stat">
                        <span className="stat-icon">👁</span>
                        <span className="stat-value">{streamStats.viewers}</span>
                        <span className="stat-label">مشاهد</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">💜</span>
                        <span className="stat-value">{streamStats.hearts}</span>
                        <span className="stat-label">قلب</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">💬</span>
                        <span className="stat-value">{streamStats.comments}</span>
                        <span className="stat-label">تعليق</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{viewers.length}</span>
                        <span className="stat-label">متابع</span>
                      </div>
                    </div>

                    {/* أزرار التفاعل */}
                    <div className="action-buttons">
                      <button
                        className="action-btn heart-btn"
                        onClick={handleSendHeart}
                        title="إرسال قلب"
                      >
                        <span className="btn-icon">💜</span>
                        <span className="btn-label">قلب</span>
                      </button>
                      <button
                        className="action-btn gift-btn"
                        onClick={() => setShowGiftPanel(!showGiftPanel)}
                        title="إرسال هدية"
                      >
                        <span className="btn-icon">🎁</span>
                        <span className="btn-label">هدية</span>
                      </button>
                      <button
                        className={`action-btn follow-btn ${isFollowing ? 'following' : ''}`}
                        onClick={() => setIsFollowing(!isFollowing)}
                        title={isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
                      >
                        <span className="btn-icon">{isFollowing ? '✓' : '+'}</span>
                        <span className="btn-label">{isFollowing ? 'متابع' : 'متابعة'}</span>
                      </button>
                    </div>

                    {/* لوحة الهدايا */}
                    {showGiftPanel && (
                      <div className="gifts-panel">
                        <div className="gifts-title">اختر هدية</div>
                        <div className="gifts-grid">
                          {GIFTS.map((gift) => (
                            <button
                              key={gift.id}
                              className="gift-option"
                              onClick={() => handleSendGift(gift)}
                              title={`${gift.name} - ${gift.price} نقطة`}
                            >
                              <span className="gift-emoji">{gift.icon}</span>
                              <span className="gift-name">{gift.name}</span>
                              <span className="gift-price">{gift.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* قسم التعليقات */}
                <div className="comments-container">
                  <div className="comments-header">
                    <h3>💬 التعليقات المباشرة</h3>
                    <span className="comment-count">{comments.length}</span>
                  </div>

                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <div className="empty-comments">
                        <p>لا توجد تعليقات حالياً</p>
                        <small>كن أول من يعلق!</small>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <Avatar
                            name={comment.username}
                            size={32}
                          />
                          <div className="comment-content">
                            <strong>{comment.username}</strong>
                            <p>{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="comment-input-area">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSendComment();
                      }}
                      placeholder="اكتب تعليقاً..."
                      maxLength={200}
                    />
                    <button
                      className="send-btn"
                      onClick={handleSendComment}
                      disabled={!commentText.trim()}
                    >
                      إرسال
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-stream-selected">
                <div className="empty-icon">📡</div>
                <h2>اختر بثاً لمشاهدته</h2>
                <p>اختر من البثوث المتاحة على اليمين</p>
              </div>
            )}
          </main>

          {/* قائمة البثوث */}
          <aside className="streams-sidebar">
            {/* الفلاتر */}
            <div className="filters">
              {STREAM_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* قائمة البثوث */}
            <div className="streams-list">
              {filteredStreams.length === 0 ? (
                <div className="empty-streams">
                  <p>لا توجد بثوث متاحة</p>
                </div>
              ) : (
                filteredStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className={`stream-card ${activeStream?.id === stream.id ? 'active' : ''}`}
                    onClick={() => openStream(stream)}
                  >
                    <div className="stream-card-header">
                      <Avatar name={stream.host_name || stream.host_username} size={36} />
                      {stream.is_active && <span className="live-indicator">● مباشر</span>}
                    </div>

                    <div className="stream-card-content">
                      <h4>{stream.title}</h4>
                      <p className="host-name">
                        {stream.host_name || stream.host_username}
                      </p>
                    </div>

                    <div className="stream-card-stats">
                      <span>👁 {stream.viewers_count || 0}</span>
                      <span>💜 {stream.hearts_count || 0}</span>
                    </div>

                    {stream.category && (
                      <div className="stream-category">
                        {stream.category}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
