import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/admin/ToastProvider.jsx';
import {
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
} from '../services/api/correctedLiveStreamApi.js';
import { getCurrentUsername } from '../utils/auth.js';
import '../styles/professional-live-view.css';

const GIFTS = [
  { id: 1, name: 'وردة', icon: '🌹', price: 10 },
  { id: 2, name: 'صاروخ', icon: '🚀', price: 500 },
  { id: 3, name: 'تاج', icon: '👑', price: 1000 },
];

export default function LiveViewer() {
  const { pushToast } = useToast();
  const currentUsername = getCurrentUsername();
  const navigate = useNavigate();
  const { streamId } = useParams();

  const [activeStream, setActiveStream] = useState(null);
  const [streamStats, setStreamStats] = useState({ viewers: 0, hearts: 0, comments: 0 });
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [recentGifts, setRecentGifts] = useState([]);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const statsIntervalRef = useRef(null);
  const commentsIntervalRef = useRef(null);

  const loadStreamDetails = useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getLiveStreamDetails(streamId);
      if (response?.data) {
        setActiveStream(response.data);
        setStreamStats({
          viewers: response.data.viewers_count || 0,
          hearts: response.data.hearts_count || 0,
          comments: 0
        });
      }
    } catch (error) {
      console.error('Error loading stream:', error);
      pushToast?.({ type: 'warning', title: 'خطأ في تحميل البث' });
    }
  }, [streamId, pushToast]);

  const loadComments = useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getLiveComments(streamId);
      if (response?.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [streamId]);

  const updateStats = useCallback(async () => {
    if (!streamId) return;
    try {
      const response = await getLiveStreamStats(streamId);
      if (response?.data) {
        setStreamStats(prev => ({
          ...prev,
          viewers: response.data.viewers_count || prev.viewers,
          hearts: response.data.hearts_count || prev.hearts
        }));
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }, [streamId]);

  useEffect(() => {
    loadStreamDetails();
    statsIntervalRef.current = setInterval(updateStats, 5000);
    commentsIntervalRef.current = setInterval(loadComments, 3000);
    return () => {
      clearInterval(statsIntervalRef.current);
      clearInterval(commentsIntervalRef.current);
    };
  }, [loadStreamDetails, updateStats, loadComments]);

  const handleSendComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !streamId) return;
    try {
      await sendLiveComment(streamId, { text: commentText });
      setCommentText('');
      loadComments();
    } catch (error) {
      pushToast?.({ type: 'warning', title: 'فشل إرسال التعليق' });
    }
  };

  const handleSendHeart = async () => {
    if (!streamId) return;
    try {
      await sendLiveHeart(streamId);
      const newHeart = { id: Date.now(), x: Math.random() * 80 };
      setFloatingHearts(prev => [...prev, newHeart]);
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 2000);
    } catch (error) {
      console.error('Error sending heart:', error);
    }
  };

  const handleSendGift = async (gift) => {
    if (!streamId) return;
    try {
      await sendLiveGift(streamId, { gift_id: gift.id, name: gift.name });
      const giftNotif = { id: Date.now(), user: currentUsername, gift: gift.name, icon: gift.icon };
      setRecentGifts(prev => [giftNotif, ...prev].slice(0, 3));
      setTimeout(() => {
        setRecentGifts(prev => prev.filter(g => g.id !== giftNotif.id));
      }, 5000);
      pushToast?.({ type: 'success', title: 'تم إرسال الهدية!' });
    } catch (error) {
      pushToast?.({ type: 'warning', title: 'فشل إرسال الهدية' });
    }
  };

  return (
    <div className="pro-live-container" dir="rtl">
      {/* Video Section */}
      <div className="pro-live-video-section">
        <div className="pro-live-video-placeholder">
          {/* هنا يتم دمج مشغل الفيديو الحقيقي لاحقاً */}
          <img src={activeStream?.thumbnail_url || 'https://via.placeholder.com/800x1200?text=Live+Stream'} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="Stream" />
        </div>

        <div className="pro-live-video-overlay">
          <header className="pro-live-header">
            <div className="pro-live-host-info">
              <button onClick={() => navigate(-1)} style={{background:'none', border:'none', color:'white', fontSize:'24px', cursor:'pointer'}}>✕</button>
              <div className="pro-live-avatar-wrapper">
                <img src={activeStream?.host_avatar || 'https://via.placeholder.com/100'} className="pro-live-avatar" alt="Host" />
                <div className="pro-live-verified">✓</div>
              </div>
              <div className="pro-live-host-meta">
                <h3>{activeStream?.host_name || 'Yamshat Official'}</h3>
                <span>@{activeStream?.host_username || 'yamshat_team'}</span>
              </div>
            </div>

            <div className="pro-live-badges">
              <div className="pro-live-badge">
                <span className="dot"></span> مباشر
              </div>
              <div className="pro-live-viewers">
                👁 {streamStats.viewers > 1000 ? (streamStats.viewers/1000).toFixed(1)+'K' : streamStats.viewers}
              </div>
            </div>
          </header>

          <div className="pro-live-side-actions">
            <button className="pro-side-btn" onClick={() => {}}>
              <div className="pro-side-icon-circle">🔊</div>
              <span>صوت</span>
            </button>
            <button className="pro-side-btn" onClick={handleSendHeart}>
              <div className="pro-side-icon-circle">🔄</div>
              <span>قلب</span>
            </button>
            <button className="pro-side-btn" onClick={() => handleSendGift(GIFTS[2])}>
              <div className="pro-side-icon-circle">🎁</div>
              <span>هدايا</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="pro-live-bottom-content">
        <div className="pro-live-stream-title-card">
          <div className="pro-live-title-info">
            <h4>{activeStream?.title || 'تصميم جديد لمنصة يمشات 🚀'}</h4>
            <div className="pro-live-tags">
              <span className="pro-live-tag">تقنية</span>
              <span className="pro-live-tag">تطوير</span>
              <span className="pro-live-tag">تصميم</span>
            </div>
          </div>
          <div style={{fontSize:'12px', opacity:0.8}}>🔥 رائج الآن</div>
        </div>

        <div className="pro-live-chat-section">
          <div className="pro-live-messages">
            <div className="pro-chat-msg">
              <span className="pro-chat-user">Yamshat Bot ✓</span>
              <span className="pro-chat-text">أهلاً وسهلاً بكم في البث المباشر 💜</span>
            </div>
            {comments.map((msg, i) => (
              <div key={i} className="pro-chat-msg">
                <span className="pro-chat-user">{msg.username}</span>
                <span className="pro-chat-text">{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="pro-live-gift-notifications">
            {recentGifts.map(gift => (
              <div key={gift.id} className="pro-gift-card">
                <div style={{fontSize:'20px'}}>{gift.icon}</div>
                <div>
                  <div style={{fontWeight:'bold'}}>{gift.user}</div>
                  <div>أرسل {gift.gift}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pro-live-input-bar">
          <div className="pro-chat-input-wrapper">
            <form onSubmit={handleSendComment}>
              <input 
                type="text" 
                className="pro-chat-input" 
                placeholder="قل شيئاً..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="pro-send-btn">➤</button>
            </form>
          </div>
          <div className="pro-action-icons">
            <button className="pro-icon-btn" onClick={handleSendHeart}>😊</button>
            <button className="pro-icon-btn gift" onClick={() => handleSendGift(GIFTS[0])}>🎁</button>
          </div>
        </div>
      </div>

      {/* Floating Hearts */}
      <div className="pro-floating-hearts-container">
        {floatingHearts.map(h => (
          <div 
            key={h.id} 
            className="floating-heart" 
            style={{
              position: 'absolute', 
              bottom: 0, 
              left: h.x + '%',
              fontSize: '24px',
              animation: 'floatUp 2s ease-out forwards'
            }}
          >
            💜
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
