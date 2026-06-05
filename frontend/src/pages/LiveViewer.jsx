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
    <div className="enhanced-live-viewer" dir="rtl">
      <div className="viewer-container">
        {/* Header */}
        <header className="viewer-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '24px', marginInlineEnd: '15px' }}>
              &larr;
            </button>
            <h1>البث المباشر</h1>
            <p>شاهد وتفاعل مع البثوث المباشرة</p>
          </div>
          <button className="refresh-btn" onClick={loadStreams} disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث القائمة'}
          </button>
        </header>

        <div className="viewer-layout">
          {/* Main Content */}
          <main className="viewer-main">
            {activeStream ? (
              <div className="stream-container">
                {/* Video Player */}
                <div className="stream-player">
                  <div className="player-placeholder">
                    <div className="player-icon">📺</div>
                    <p>بث مباشر من {hostName}</p>
                    <small>{activeStream.title}</small>
                  </div>
                  <FloatingHearts items={floatingHearts} />
                </div>

                {/* Stream Info */}
                <div className="stream-info">
                  <div className="info-header">
                    <Avatar name={hostName} size={48} />
                    <div className="host-details">
                      <h2>{activeStream.title}</h2>
                      <p>المضيف: {hostName}</p>
                    </div>
                    {activeStream.is_active && (
                      <span className="live-badge">● مباشر</span>
                    )}
                  </div>

                  {/* Stats Row */}
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
                      <span className="stat-icon">🏆</span>
                      <span className="stat-value">#1</span>
                      <span className="stat-label">الترتيب</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button className="action-btn heart-btn" onClick={handleSendHeart}>
                      <span className="btn-icon">💜</span>
                      <span className="btn-label">إعجاب</span>
                    </button>
                    <button className="action-btn gift-btn" onClick={() => setShowGiftPanel(!showGiftPanel)}>
                      <span className="btn-icon">🎁</span>
                      <span className="btn-label">هدية</span>
                    </button>
                    <button className="action-btn">
                      <span className="btn-icon">↗</span>
                      <span className="btn-label">مشاركة</span>
                    </button>
                    <button className={`action-btn follow-btn ${isFollowing ? 'following' : ''}`} onClick={() => setIsFollowing(!isFollowing)}>
                      <span className="btn-icon">👥</span>
                      <span className="btn-label">{isFollowing ? 'متابع' : 'متابعة'}</span>
                    </button>
                  </div>

                  {/* Gifts Panel */}
                  {showGiftPanel && (
                    <div className="gifts-panel">
                      <h3 className="gifts-title">اختر هدية للدعم</h3>
                      <div className="gifts-grid">
                        {GIFTS.map((gift) => (
                          <button
                            key={gift.id}
                            className="gift-option"
                            onClick={() => handleSendGift(gift)}
                          >
                            <span className="gift-emoji">{gift.icon}</span>
                            <span className="gift-name">{gift.name}</span>
                            <span className="gift-price">{gift.price} عملة</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="comments-container">
                    <div className="comments-list" style={{ height: '300px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      {comments.length > 0 ? (
                        comments.map((c, i) => (
                          <div key={i} className="comment-item" style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                            <Avatar name={c.username || c.user} size={32} />
                            <div>
                              <strong style={{ fontSize: '12px', color: '#7c3aed' }}>{c.username || c.user}</strong>
                              <p style={{ margin: 0, fontSize: '14px' }}>{c.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>لا توجد تعليقات بعد. كن أول من يعلق!</p>
                      )}
                    </div>
                    <div className="comment-input-area" style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="اكتب تعليقاً..."
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.5)', color: 'white' }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                      />
                      <button 
                        onClick={handleSendComment}
                        style={{ padding: '0 20px', borderRadius: '8px', background: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px dashed rgba(148, 163, 184, 0.2)' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📺</div>
                <h2>لم يتم اختيار بث</h2>
                <p>اختر أحد البثوث المباشرة من القائمة الجانبية للمشاهدة</p>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="streams-sidebar">
            <div className="filters">
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>الكل</button>
              <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>النشط</button>
              <button className={`filter-btn ${filter === 'popular' ? 'active' : ''}`} onClick={() => setFilter('popular')}>الشائع</button>
            </div>

            <div className="streams-list">
              {filteredStreams.length > 0 ? (
                filteredStreams.map((s) => (
                  <div
                    key={s.id}
                    className={`stream-card ${activeStream?.id === s.id ? 'active' : ''}`}
                    onClick={() => openStream(s)}
                  >
                    <div className="stream-card-header">
                      <Avatar name={s.host_name || s.host_username} size={32} />
                      {s.is_active && <span className="live-indicator">مباشر</span>}
                    </div>
                    <div className="stream-card-content">
                      <h4>{s.title}</h4>
                      <p className="host-name">{s.host_name || s.host_username}</p>
                    </div>
                    <div className="stream-card-stats">
                      <span>👁 {s.viewers_count || 0}</span>
                      <span>💜 {s.hearts_count || 0}</span>
                    </div>
                    <div className="stream-category">{s.category || 'عام'}</div>
                  </div>
                ))
              ) : (
                <div className="empty-streams">
                  <p>لا توجد بثوث مباشرة حالياً</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
