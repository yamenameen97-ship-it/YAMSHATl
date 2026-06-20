import { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "./ProfileYamshat";

/**
 * صفحة الريلز - تصميم يطابق تطبيق Yamshat الموبايل
 * Reels Page - Pixel-perfect match for Yamshat mobile design
 */
export default function ReelsYamshat() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"reels" | "following" | "discover">("reels");
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(1200);
  const [progress, setProgress] = useState(45);

  return (
    <div className="yr-reels-root" dir="rtl">
      <style>{reelsStyles}</style>

      {/* Status Bar */}
      <div className="yr-status-bar">
        <span>9:41</span>
        <div className="yr-status-icons">
          <span>●●●●</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Top Bar */}
      <header className="yr-top-bar">
        <div className="yr-top-left">
          <button className="yr-icon-btn" aria-label="بحث">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <div className="yr-brand">
            <div className="yr-brand-y">Y</div>
            <span className="yr-brand-text">YAMSHAT</span>
          </div>
        </div>
        <div className="yr-top-right">
          <button className="yr-icon-btn" aria-label="إشعارات">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <button className="yr-pill-btn" aria-label="المجموعات">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="yr-plus-mini">+</span>
            <span>المجموعات</span>
          </button>
          <button className="yr-pill-btn" aria-label="ستوري">
            <span className="yr-plus-mini">+</span>
            <span>ستوري</span>
          </button>
          <button className="yr-icon-btn" aria-label="القائمة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Page Title + Tabs */}
      <div className="yr-title-row">
        <h1 className="yr-page-title">الريلز</h1>
      </div>

      <nav className="yr-feed-tabs">
        <button
          className={`yr-feed-tab ${activeTab === "reels" ? "active" : ""}`}
          onClick={() => setActiveTab("reels")}
        >
          ريلز
        </button>
        <button
          className={`yr-feed-tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => setActiveTab("following")}
        >
          متابعة
        </button>
        <button
          className={`yr-feed-tab ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => setActiveTab("discover")}
        >
          اكتشف
        </button>
      </nav>

      {/* Reel Container */}
      <main className="yr-reel-wrap">
        <div className="yr-reel-stage">
          {/* Background image (cyberpunk city with sports car) */}
          <div className="yr-reel-bg">
            <div className="yr-city-lights" />
            <div className="yr-rain-overlay" />
            <div className="yr-yamshat-watermark">
              <div className="yr-watermark-y">Y</div>
              <div className="yr-watermark-text">YAMSHAT</div>
            </div>
            <div className="yr-car-silhouette" />
            <div className="yr-vignette" />
          </div>

          {/* Top overlay icons */}
          <button className="yr-reel-dots" aria-label="المزيد">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
          <button className="yr-reel-mute" onClick={() => setMuted(!muted)} aria-label="كتم">
            {muted ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>

          {/* Right side actions */}
          <aside className="yr-reel-actions">
            <button className="yr-act-avatar" aria-label="ملف">
              <div className="yr-act-avatar-ring">
                <div className="yr-act-avatar-inner">Y</div>
                <span className="yr-act-plus">+</span>
              </div>
            </button>

            <button className="yr-act-btn" onClick={() => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1); }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill={liked ? "#ef4444" : "white"} stroke={liked ? "#ef4444" : "white"} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span className="yr-act-label">{formatCount(likes)}</span>
            </button>

            <button className="yr-act-btn" onClick={() => setLocation("/messages")}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span className="yr-act-label">128</span>
            </button>

            <button className="yr-act-btn">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span className="yr-act-label">356</span>
            </button>

            <button className="yr-act-music" aria-label="موسيقى">
              <div className="yr-music-spin">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="white" />
                </svg>
              </div>
            </button>
          </aside>

          {/* Bottom caption */}
          <div className="yr-reel-info">
            <div className="yr-info-user">
              <span className="yr-info-username">yamenameen97</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#3897f0">
                <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
              </svg>
              <span className="yr-info-time">منذ 5 دقيقة</span>
            </div>
            <p className="yr-info-caption">
              <span className="yr-heart-purple">💜</span> الليل، المدينة، والإضاءة البنفسجية
            </p>
            <p className="yr-info-hashtags">#Yamshat #Reels #Night</p>
          </div>

          {/* Floating Y badge */}
          <div className="yr-floating-y">Y</div>

          {/* Progress Bar */}
          <div className="yr-progress">
            <div className="yr-progress-track">
              <div className="yr-progress-fill" style={{ width: `${progress}%` }} />
              <div className="yr-progress-dot" style={{ left: `${progress}%` }} />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav active="newreel" setLocation={setLocation} />
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + " ألف";
  return n.toString();
}

const reelsStyles = `
.yr-reels-root {
  position: fixed;
  inset: 0;
  background: #000;
  color: #fff;
  font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
  direction: rtl;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.yr-status-bar {
  display: none;
  justify-content: space-between;
  padding: 8px 20px 4px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.yr-status-icons { display: flex; gap: 6px; font-size: 12px; }

/* Top Bar */
.yr-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #000;
  flex-shrink: 0;
  gap: 8px;
}
.yr-top-left { display: flex; align-items: center; gap: 8px; }
.yr-top-right { display: flex; align-items: center; gap: 6px; }
.yr-icon-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
}
.yr-icon-btn:hover { background: rgba(255,255,255,0.06); }

.yr-brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.yr-brand-y {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 16px;
  color: #fff;
  font-family: 'Arial Black', sans-serif;
  transform: skewX(-5deg);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}
.yr-brand-text {
  font-weight: 700;
  letter-spacing: 1.5px;
  font-size: 15px;
  color: #fff;
}

.yr-pill-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 16px;
}
.yr-pill-btn:hover { background: rgba(255,255,255,0.06); }
.yr-plus-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: #8b5cf6;
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

/* Title */
.yr-title-row {
  padding: 4px 16px;
  display: flex;
  justify-content: flex-start;
}
.yr-page-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

/* Feed tabs */
.yr-feed-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 16px 12px;
  justify-content: flex-end;
}
.yr-feed-tab {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 20px;
  transition: all .2s;
}
.yr-feed-tab.active {
  background: #8b5cf6;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

/* Reel Wrap */
.yr-reel-wrap {
  flex: 1;
  padding: 0 12px 12px;
  overflow: hidden;
  display: flex;
}
.yr-reel-stage {
  position: relative;
  flex: 1;
  border-radius: 24px;
  overflow: hidden;
  background: #0a0014;
  box-shadow: 0 8px 40px rgba(139, 92, 246, 0.3);
}

/* Background composition */
.yr-reel-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.5) 0%, transparent 50%),
    linear-gradient(180deg, #0d0020 0%, #1a0033 30%, #2d0a4e 60%, #0a0014 100%);
}
.yr-city-lights {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 20% 30%, #ff00ff, transparent),
    radial-gradient(2px 2px at 60% 20%, #00ffff, transparent),
    radial-gradient(1px 1px at 80% 40%, #a78bfa, transparent),
    radial-gradient(3px 3px at 15% 60%, #ec4899, transparent),
    radial-gradient(2px 2px at 70% 70%, #8b5cf6, transparent),
    radial-gradient(1px 1px at 40% 80%, #c084fc, transparent),
    radial-gradient(2px 2px at 90% 25%, #d946ef, transparent),
    radial-gradient(1.5px 1.5px at 25% 45%, #a78bfa, transparent),
    radial-gradient(2.5px 2.5px at 50% 50%, rgba(139, 92, 246, 0.6), transparent);
  background-size: 100% 100%;
  opacity: 0.9;
  animation: yrSparkle 4s ease-in-out infinite alternate;
}
@keyframes yrSparkle {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}
.yr-rain-overlay {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      105deg,
      transparent 0,
      transparent 8px,
      rgba(167, 139, 250, 0.04) 8px,
      rgba(167, 139, 250, 0.04) 9px
    );
  opacity: 0.5;
}
.yr-yamshat-watermark {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
}
.yr-watermark-y {
  font-size: 80px;
  font-weight: 900;
  color: #a78bfa;
  font-family: 'Arial Black', sans-serif;
  text-shadow:
    0 0 30px rgba(167, 139, 250, 0.9),
    0 0 60px rgba(139, 92, 246, 0.5);
  transform: skewX(-6deg);
  letter-spacing: -4px;
}
.yr-watermark-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
  text-shadow: 0 0 12px rgba(167, 139, 250, 0.6);
}
.yr-car-silhouette {
  position: absolute;
  bottom: 18%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 25%;
  background:
    radial-gradient(ellipse at center bottom, rgba(0,0,0,0.95) 30%, transparent 70%),
    linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.9) 100%);
  border-radius: 50% 50% 10% 10% / 60% 60% 10% 10%;
  filter: blur(1px);
}
.yr-car-silhouette::after {
  content: '';
  position: absolute;
  bottom: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 6px;
  background: #ef4444;
  border-radius: 4px;
  box-shadow:
    0 0 12px #ef4444,
    0 0 24px rgba(239, 68, 68, 0.7);
}
.yr-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%),
    linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%);
}

/* Top icons over reel */
.yr-reel-dots {
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  border: none;
  color: #fff;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}
.yr-reel-mute {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  border: none;
  color: #fff;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

/* Right side actions */
.yr-reel-actions {
  position: absolute;
  left: 14px;
  bottom: 110px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  z-index: 5;
}
.yr-act-avatar {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.yr-act-avatar-ring {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  padding: 2px;
}
.yr-act-avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #1a0a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #a78bfa;
  font-size: 18px;
  font-family: 'Arial Black', sans-serif;
  border: 2px solid #000;
}
.yr-act-plus {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #8b5cf6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid #000;
}
.yr-act-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0;
  font-family: inherit;
}
.yr-act-btn:active { transform: scale(0.9); }
.yr-act-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.yr-act-music {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.yr-music-spin {
  animation: yrSpin 3s linear infinite;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}
@keyframes yrSpin {
  to { transform: rotate(360deg); }
}

/* Info bottom-left of reel */
.yr-reel-info {
  position: absolute;
  bottom: 60px;
  right: 14px;
  left: 80px;
  z-index: 4;
  text-align: right;
}
.yr-info-user {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.yr-info-username {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
}
.yr-info-time {
  font-size: 12px;
  color: #d1d5db;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
}
.yr-info-caption {
  margin: 0 0 4px;
  font-size: 14px;
  color: #fff;
  line-height: 1.5;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
}
.yr-heart-purple { color: #a78bfa; }
.yr-info-hashtags {
  margin: 0;
  font-size: 13px;
  color: #c4b5fd;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
}

/* Floating Y badge bottom-right */
.yr-floating-y {
  position: absolute;
  bottom: 60px;
  left: 18px;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  font-family: 'Arial Black', sans-serif;
  transform: skewX(-5deg);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5);
  z-index: 4;
}

/* Progress bar */
.yr-progress {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  z-index: 5;
}
.yr-progress-track {
  position: relative;
  height: 3px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  overflow: visible;
}
.yr-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #c084fc);
  border-radius: 2px;
}
.yr-progress-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
}

/* Bottom Nav inherited from ProfileYamshat */
.ys-bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #000;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 8px 4px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 100;
}

/* Desktop */
@media (min-width: 1024px) {
  .yr-reels-root {
    position: relative;
    inset: auto;
    min-height: 100vh;
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 60px rgba(139, 92, 246, 0.15);
    border-left: 1px solid rgba(255,255,255,0.05);
    border-right: 1px solid rgba(255,255,255,0.05);
  }
  body { background: #050505 !important; }
}
@media (max-width: 1023px) {
  .yr-status-bar { display: flex; }
}
`;
