import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import '../styles/modern-live-viewer.css';

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

function FloatingHearts({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mlv-floating-hearts" aria-hidden="true">
      {items.map((heart) => (
        <div
          key={heart.id}
          className="mlv-floating-heart"
          style={{
            right: `${heart.x}%`,
            animation: `mlvFloatUp 1.5s ease-out forwards`,
          }}
        >
          {heart.icon || '💜'}
        </div>
      ))}
    </div>
  );
}

export default function LiveViewer() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();
  const { streamId } = useParams();

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
  const routeStreamId = String(streamId || '').trim();

  // تحميل البثوث النشطة
  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActiveLiveStreams({ limit: 100 });
      const allStreams = Array.isArray(response?.data) ? response.data : [];
      setStreams(allStreams);

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
      console.error('خطأ في تحميل البثوث:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // فتح البث
  const openStream = useCallback(async (stream, options = {}) => {
    if (!stream?.id) return;

    if (options.syncUrl !== false) {
      navigate(`/live/view/${stream.id}`);
    }

    setActiveStream(stream);

    try {
      const detailsResponse = await getLiveStreamDetails(stream.id);
      if (detailsResponse?.data) {
        setStreamDetails(detailsResponse.data);
        setStreamStats({
          viewers: detailsResponse.data.viewers_count || 0,
          hearts: detailsResponse.data.hearts_count || 0,
          comments: 0,
        });
      }

      const commentsResponse = await getLiveComments(stream.id);
      setComments(Array.isArray(commentsResponse?.data) ? commentsResponse.data : []);

      const viewersResponse = await getLiveStreamViewers(stream.id);
      if (viewersResponse?.data?.viewers) {
        setViewers(viewersResponse.data.viewers);
      }

      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = setInterval(() => {
        updateStreamStats(stream.id);
      }, 3000);

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
  }, [navigate, pushToast]);

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

  // فتح البث المطلوب من الرابط مباشرة
  useEffect(() => {
    if (!routeStreamId || !streams.length) return;

    const matchedStream = streams.find((stream) => String(stream.id) === routeStreamId);
    if (matchedStream && String(activeStream?.id || '') !== String(matchedStream.id)) {
      openStream(matchedStream, { syncUrl: false });
    }
  }, [routeStreamId, streams, activeStream?.id, openStream]);

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

  // تنظيف الفترات الزمنية
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (commentsIntervalRef.current) clearInterval(commentsIntervalRef.current);
    };
  }, []);

  const hostName = activeStream?.host_name || activeStream?.host_username || 'مضيف البث';

  return (
    <div className="modern-live-viewer" dir="rtl">
      {/* Header */}
      <header className="mlv-header">
        <div className="mlv-header-left">
          <button className="mlv-back-btn" onClick={() => navigate(-1)}>
            &lt;
          </button>
          <h1>البث المباشر</h1>
        </div>
        <div className="mlv-header-right">
          <button className="mlv-refresh-btn" onClick={loadStreams} disabled={loading}>
            ↻
          </button>
        </div>
      </header>

      <div className="mlv-container">
        {/* Main Content */}
        <main className="mlv-main">
          {activeStream ? (
            <>
              {/* Video Player */}
              <div className="mlv-player-section">
                <div className="mlv-player">
                  <div className="mlv-player-placeholder">
                    <div className="mlv-player-icon">📺</div>
                    <p>بث مباشر من {hostName}</p>
                    <small>{activeStream.title}</small>
                  </div>
                  <FloatingHearts items={floatingHearts} />
                </div>

                {/* Stream Info */}
                <div className="mlv-stream-info">
                  <div className="mlv-info-header">
                    <Avatar name={hostName} size={48} />
                    <div className="mlv-host-details">
                      <h2>{activeStream.title}</h2>
                      <p>المضيف: {hostName}</p>
                    </div>
                    {activeStream.is_active && (
                      <span className="mlv-live-badge">● مباشر</span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="mlv-stats-row">
                    <div className="mlv-stat">
                      <span className="mlv-stat-icon">👁</span>
                      <span className="mlv-stat-value">{streamStats.viewers}</span>
                      <span className="mlv-stat-label">مشاهد</span>
                    </div>
                    <div className="mlv-stat">
                      <span className="mlv-stat-icon">💜</span>
                      <span className="mlv-stat-value">{streamStats.hearts}</span>
                      <span className="mlv-stat-label">قلب</span>
                    </div>
                    <div className="mlv-stat">
                      <span className="mlv-stat-icon">💬</span>
                      <span className="mlv-stat-value">{streamStats.comments}</span>
                      <span className="mlv-stat-label">تعليق</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mlv-action-buttons">
                <button className="mlv-action-btn mlv-action-heart" onClick={handleSendHeart}>
                  <span>💜</span>
                  إعجاب
                </button>
                <button className="mlv-action-btn mlv-action-gift" onClick={() => setShowGiftPanel(!showGiftPanel)}>
                  <span>🎁</span>
                  هدية
                </button>
                <button className="mlv-action-btn mlv-action-share">
                  <span>↗</span>
                  مشاركة
                </button>
                <button className="mlv-action-btn mlv-action-follow">
                  <span>👥</span>
                  متابعة
                </button>
              </div>

              {/* Gifts Panel */}
              {showGiftPanel && (
                <div className="mlv-gifts-panel">
                  <h3>اختر هدية</h3>
                  <div className="mlv-gifts-list">
                    {GIFTS.map((gift) => (
                      <button
                        key={gift.id}
                        className="mlv-gift-option"
                        onClick={() => handleSendGift(gift)}
                      >
                        <span className="mlv-gift-icon">{gift.icon}</span>
                        <span className="mlv-gift-name">{gift.name}</span>
                        <span className="mlv-gift-price">{gift.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="mlv-comments-section">
                <h3>التعليقات</h3>

                <div className="mlv-comments-list">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="mlv-comment-item">
                        <Avatar name={comment.username} size={32} />
                        <div className="mlv-comment-content">
                          <div className="mlv-comment-header">
                            <span className="mlv-comment-name">{comment.username}</span>
                            <span className="mlv-comment-time">الآن</span>
                          </div>
                          <p className="mlv-comment-text">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mlv-empty-comments">
                      <p>لا توجد تعليقات حتى الآن</p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="mlv-comment-input">
                  <input
                    type="text"
                    placeholder="أضف تعليقاً..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <button onClick={handleSendComment} disabled={!commentText.trim()}>
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mlv-empty-state">
              <div className="mlv-empty-icon">📡</div>
              <p>لا توجد بثوث نشطة حالياً</p>
              <p className="mlv-empty-subtitle">تحقق لاحقاً لمتابعة البثوث المباشرة</p>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="mlv-sidebar">
          {/* Streams List */}
          <div className="mlv-streams-list-section">
            <h3>البثوث المتاحة</h3>

            {/* Filters */}
            <div className="mlv-filter-buttons">
              <button
                className={`mlv-filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                الكل
              </button>
              <button
                className={`mlv-filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                النشطة
              </button>
              <button
                className={`mlv-filter-btn ${filter === 'popular' ? 'active' : ''}`}
                onClick={() => setFilter('popular')}
              >
                الأكثر
              </button>
            </div>

            {/* Streams Items */}
            <div className="mlv-streams-items">
              {filteredStreams.length > 0 ? (
                filteredStreams.map((stream) => (
                  <button
                    key={stream.id}
                    className={`mlv-stream-card ${activeStream?.id === stream.id ? 'active' : ''}`}
                    onClick={() => openStream(stream)}
                  >
                    <div className="mlv-stream-card-header">
                      <Avatar name={stream.host_username} size={32} />
                      <div className="mlv-stream-card-info">
                        <h4>{stream.title}</h4>
                        <p>{stream.host_username}</p>
                      </div>
                    </div>
                    <div className="mlv-stream-card-stats">
                      <span>👁 {stream.viewers_count || 0}</span>
                      <span>💜 {stream.hearts_count || 0}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="mlv-empty-streams">
                  <p>لا توجد بثوث متاحة</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
