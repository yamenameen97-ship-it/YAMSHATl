import React, { useState, useEffect } from "react";
import "./AdvancedReactions.css";

const REACTION_TYPES = {
  like: { emoji: "👍", label: "إعجاب", color: "#3B82F6" },
  love: { emoji: "❤️", label: "حب", color: "#EF4444" },
  haha: { emoji: "😆", label: "ضحك", color: "#F59E0B" },
  wow: { emoji: "😮", label: "دهشة", color: "#8B5CF6" },
  sad: { emoji: "😢", label: "حزن", color: "#6B7280" },
  angry: { emoji: "😡", label: "غضب", color: "#DC2626" }
};

export default function AdvancedReactions({ 
  postId,
  userId,
  onReactionChange,
  initialReactions = null
}) {
  const [reactions, setReactions] = useState({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0
  });
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [reactionStats, setReactionStats] = useState(null);

  useEffect(() => {
    if (initialReactions) {
      setReactions(initialReactions);
    } else {
      fetchReactions();
    }
    fetchUserReaction();
  }, [postId, userId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/reactions/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setReactions({
          like: data.reactions.like || 0,
          love: data.reactions.love || 0,
          haha: data.reactions.haha || 0,
          wow: data.reactions.wow || 0,
          sad: data.reactions.sad || 0,
          angry: data.reactions.angry || 0,
          total: data.reactions.total || 0
        });
      }
    } catch (err) {
      console.error("Error fetching reactions:", err);
    }
  };

  const fetchUserReaction = async () => {
    try {
      const response = await fetch(`/api/reactions/${postId}/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserReaction(data.reaction_type);
      }
    } catch (err) {
      // لا توجد ردة فعل سابقة
      setUserReaction(null);
    }
  };

  const handleReaction = async (reactionType) => {
    setLoading(true);
    try {
      // إذا كان نفس التفاعل، قم بإزالته
      if (userReaction === reactionType) {
        const response = await fetch(`/api/reactions/${postId}/remove?user_id=${userId}`, {
          method: "DELETE"
        });
        
        if (response.ok) {
          const data = await response.json();
          updateReactionsFromResponse(data);
          setUserReaction(null);
        }
      } else {
        // إضافة أو تحديث التفاعل
        const response = await fetch(`/api/reactions/${postId}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            reaction_type: reactionType
          })
        });

        if (response.ok) {
          const data = await response.json();
          updateReactionsFromResponse(data);
          setUserReaction(reactionType);
        }
      }
    } catch (err) {
      console.error("Error updating reaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateReactionsFromResponse = (data) => {
    if (data.post_reactions) {
      const newReactions = {
        like: data.post_reactions.like || 0,
        love: data.post_reactions.love || 0,
        haha: data.post_reactions.haha || 0,
        wow: data.post_reactions.wow || 0,
        sad: data.post_reactions.sad || 0,
        angry: data.post_reactions.angry || 0,
        total: data.post_reactions.total || 0
      };
      setReactions(newReactions);
      
      if (onReactionChange) {
        onReactionChange(newReactions);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reactions/${postId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setReactionStats(data);
        setShowStats(true);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) - reactions.total;
  };

  return (
    <div className="advanced-reactions">
      <div className="reactions-container">
        <div className="reactions-bar">
          {Object.entries(REACTION_TYPES).map(([type, config]) => (
            <button
              key={type}
              className={`reaction-btn ${userReaction === type ? "active" : ""}`}
              onClick={() => handleReaction(type)}
              disabled={loading}
              title={config.label}
              style={{
                "--reaction-color": config.color
              }}
            >
              <span className="reaction-emoji">{config.emoji}</span>
              {reactions[type] > 0 && (
                <span className="reaction-count">{reactions[type]}</span>
              )}
            </button>
          ))}
        </div>

        {getTotalReactions() > 0 && (
          <button 
            className="total-reactions-btn"
            onClick={fetchStats}
          >
            {getTotalReactions()} تفاعل
          </button>
        )}
      </div>

      {/* نافذة الإحصائيات */}
      {showStats && reactionStats && (
        <div className="stats-modal">
          <div className="stats-content">
            <div className="stats-header">
              <h3>إحصائيات التفاعلات</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStats(false)}
              >
                ✕
              </button>
            </div>

            <div className="stats-grid">
              {Object.entries(REACTION_TYPES).map(([type, config]) => {
                const count = reactionStats.reactions_breakdown[type] || 0;
                const percentage = reactionStats.percentage_breakdown[type] || 0;
                
                return (
                  <div key={type} className="stat-item">
                    <div className="stat-emoji">{config.emoji}</div>
                    <div className="stat-label">{config.label}</div>
                    <div className="stat-count">{count}</div>
                    <div className="stat-bar">
                      <div 
                        className="stat-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color
                        }}
                      />
                    </div>
                    <div className="stat-percentage">{percentage}%</div>
                  </div>
                );
              })}
            </div>

            <div className="stats-summary">
              <div className="summary-item">
                <span className="summary-label">إجمالي التفاعلات:</span>
                <span className="summary-value">{reactionStats.total_reactions}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">عدد المستخدمين:</span>
                <span className="summary-value">{reactionStats.unique_users}</span>
              </div>
              {reactionStats.most_common_reaction && (
                <div className="summary-item">
                  <span className="summary-label">الأكثر شيوعاً:</span>
                  <span className="summary-value">
                    {REACTION_TYPES[reactionStats.most_common_reaction].emoji}
                    {REACTION_TYPES[reactionStats.most_common_reaction].label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* خلفية النافذة المشروطة */}
      {showStats && (
        <div 
          className="stats-backdrop"
          onClick={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
