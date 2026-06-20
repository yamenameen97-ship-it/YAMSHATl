import { useState } from "react";
import { useLocation } from "wouter";

/**
 * صفحة الملف الشخصي - تصميم يطابق تطبيق Yamshat الموبايل
 * Profile Page - Pixel-perfect match for Yamshat mobile design
 */
export default function ProfileYamshat() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"grid" | "reels" | "tagged">("reels");
  const [activeSubTab, setActiveSubTab] = useState<"liked" | "reels" | "posts">("reels");
  const [isFollowing, setIsFollowing] = useState(false);

  // بيانات الريلز التجريبية - يمكن استبدالها بـ API لاحقاً
  const reels = [
    { id: 1, views: "1.2M", thumb: "linear-gradient(135deg, #1a0033 0%, #4a0080 50%, #1a0033 100%)" },
    { id: 2, views: "850K", thumb: "linear-gradient(135deg, #0d001a 0%, #6b21a8 50%, #1a0033 100%)" },
    { id: 3, views: "2.3M", thumb: "linear-gradient(135deg, #1a0033 0%, #8b5cf6 50%, #4a0080 100%)" },
    { id: 4, views: "950K", thumb: "linear-gradient(135deg, #0a0014 0%, #5b21b6 50%, #1a0033 100%)" },
    { id: 5, views: "670K", thumb: "linear-gradient(135deg, #1a0033 0%, #7c3aed 50%, #0d001a 100%)" },
    { id: 6, views: "1.1M", thumb: "linear-gradient(135deg, #0d001a 0%, #6d28d9 50%, #1a0033 100%)" },
  ];

  return (
    <div className="ys-profile-root" dir="rtl">
      <style>{profileStyles}</style>

      {/* Status Bar (mobile only) */}
      <div className="ys-status-bar">
        <span className="ys-time">9:41</span>
        <div className="ys-status-icons">
          <span className="ys-signal">●●●●</span>
          <span className="ys-wifi">📶</span>
          <span className="ys-battery">🔋</span>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="ys-top-header">
        <button className="ys-icon-btn" onClick={() => window.history.back()} aria-label="رجوع">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="ys-username-wrap">
          <span className="ys-username">yamenameen97</span>
          <span className="ys-verified">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#3897f0">
              <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
            </svg>
          </span>
        </div>
        <div className="ys-header-right">
          <button className="ys-icon-btn" aria-label="إشعارات">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
          <button className="ys-icon-btn" aria-label="القائمة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="ys-content">
        {/* Avatar Section */}
        <section className="ys-avatar-section">
          <div className="ys-avatar-ring">
            <div className="ys-avatar">
              <div className="ys-y-logo">Y</div>
              <button className="ys-follow-plus" aria-label="إضافة">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          <h1 className="ys-name">Y A M E N</h1>
          <p className="ys-handle">@yamenameen97</p>
        </section>

        {/* Stats Row */}
        <section className="ys-stats">
          <div className="ys-stat">
            <span className="ys-stat-num">78</span>
            <span className="ys-stat-label">يتابع</span>
          </div>
          <div className="ys-stat">
            <span className="ys-stat-num">1.2M</span>
            <span className="ys-stat-label">متابع</span>
          </div>
          <div className="ys-stat">
            <span className="ys-stat-num">32.4M</span>
            <span className="ys-stat-label">إعجابات</span>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="ys-actions">
          <button className="ys-action-btn ys-action-chevron" aria-label="المزيد">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button className="ys-action-btn ys-action-message">
            <span>رسالة</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
          <button
            className={`ys-action-btn ys-action-follow ${isFollowing ? "ys-following" : ""}`}
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? "تمت المتابعة" : "متابعة"}
          </button>
        </section>

        {/* Bio */}
        <section className="ys-bio">
          <p className="ys-bio-text">
            صانع محتوى تقني | عاشق للتصميم والمونتاج <span className="ys-purple-heart">💜</span>
            <br />
            شارك شغفي واستمتع بالمحتوى
          </p>
          <div className="ys-contact-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>للتواصل والإعلانات</span>
          </div>
          <div className="ys-contact-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <a href="https://yamshat.com" className="ys-link">yamshat.com</a>
          </div>
        </section>

        {/* Main Tabs (icons) */}
        <nav className="ys-main-tabs">
          <button
            className={`ys-tab-btn ${activeTab === "grid" ? "active" : ""}`}
            onClick={() => setActiveTab("grid")}
            aria-label="شبكة"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="6" height="6" />
              <rect x="15" y="3" width="6" height="6" />
              <rect x="3" y="15" width="6" height="6" />
              <rect x="15" y="15" width="6" height="6" />
            </svg>
          </button>
          <button
            className={`ys-tab-btn ${activeTab === "reels" ? "active" : ""}`}
            onClick={() => setActiveTab("reels")}
            aria-label="ريلز"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" />
            </svg>
          </button>
          <button
            className={`ys-tab-btn ${activeTab === "tagged" ? "active" : ""}`}
            onClick={() => setActiveTab("tagged")}
            aria-label="مخفي"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </nav>

        {/* Sub Tabs */}
        <nav className="ys-sub-tabs">
          <button
            className={`ys-sub-tab ${activeSubTab === "liked" ? "active" : ""}`}
            onClick={() => setActiveSubTab("liked")}
          >
            تم الإعجاب
          </button>
          <button
            className={`ys-sub-tab ${activeSubTab === "reels" ? "active" : ""}`}
            onClick={() => setActiveSubTab("reels")}
          >
            الريلز
          </button>
          <button
            className={`ys-sub-tab ${activeSubTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveSubTab("posts")}
          >
            المنشورات
          </button>
        </nav>

        {/* Reels Grid */}
        <section className="ys-reels-grid">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="ys-reel-card"
              style={{ background: reel.thumb }}
              onClick={() => setLocation("/reels")}
            >
              <div className="ys-reel-overlay">
                <div className="ys-reel-y">Y</div>
              </div>
              <div className="ys-reel-views">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                <span>{reel.views}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Spacer for bottom nav */}
        <div className="ys-bottom-spacer" />
      </main>

      {/* Bottom Navigation */}
      <BottomNav active="newreel" setLocation={setLocation} />
    </div>
  );
}

// Bottom Nav Component (مشترك بين الصفحتين)
export function BottomNav({
  active,
  setLocation,
}: {
  active: "profile" | "reels" | "newreel" | "chats" | "home";
  setLocation: (path: string) => void;
}) {
  const items = [
    { id: "profile", label: "حسابي", path: "/profile", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )},
    { id: "reels", label: "الريلز", path: "/reels", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="7" y1="3" x2="7" y2="21" />
        <line x1="17" y1="3" x2="17" y2="21" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    )},
    { id: "newreel", label: "ريلز جديد", path: "/reels/new", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="18" rx="3" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" />
      </svg>
    )},
    { id: "chats", label: "الدردشات", path: "/messages", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    )},
    { id: "home", label: "الرئيسية", path: "/", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  return (
    <nav className="ys-bottom-nav" dir="rtl">
      {items.map((item) => (
        <button
          key={item.id}
          className={`ys-nav-item ${active === item.id ? "active" : ""}`}
          onClick={() => setLocation(item.path)}
        >
          <div className={`ys-nav-icon-wrap ${item.id === "newreel" ? "ys-nav-newreel" : ""} ${active === item.id ? "active" : ""}`}>
            {item.icon}
          </div>
          <span className="ys-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// CSS داخل الملف لضمان عدم تأثره بأي CSS عام آخر
const profileStyles = `
.ys-profile-root {
  position: fixed;
  inset: 0;
  background: #000000;
  color: #ffffff;
  font-family: 'Noto Sans Arabic', 'Cairo', 'Tahoma', sans-serif;
  direction: rtl;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

/* === Status Bar (mobile look) === */
.ys-status-bar {
  display: none;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px 4px;
  font-size: 14px;
  font-weight: 600;
  background: #000;
  flex-shrink: 0;
}
.ys-status-icons { display: flex; gap: 6px; align-items: center; font-size: 12px; }

/* === Top Header === */
.ys-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #000;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.05);
}
.ys-icon-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background .2s;
}
.ys-icon-btn:hover { background: rgba(255,255,255,0.06); }
.ys-username-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}
.ys-verified { display: inline-flex; }
.ys-header-right { display: flex; gap: 4px; }

/* === Content (scrollable) === */
.ys-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 0;
  -webkit-overflow-scrolling: touch;
}
.ys-content::-webkit-scrollbar { width: 0; }

/* === Avatar === */
.ys-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px 16px;
}
.ys-avatar-ring {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
}
.ys-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #1a0a2e 0%, #000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid #000;
}
.ys-y-logo {
  font-size: 56px;
  font-weight: 900;
  color: #a78bfa;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.8);
  font-family: 'Arial Black', sans-serif;
  letter-spacing: -2px;
  transform: skewX(-5deg);
}
.ys-follow-plus {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #8b5cf6;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.ys-name {
  margin: 14px 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
}
.ys-handle {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

/* === Stats === */
.ys-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ys-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ys-stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.ys-stat-label {
  font-size: 13px;
  color: #9ca3af;
}

/* === Action Buttons === */
.ys-actions {
  display: flex;
  gap: 8px;
  padding: 14px 16px;
  align-items: stretch;
}
.ys-action-btn {
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  transition: all .2s;
  color: #fff;
}
.ys-action-chevron {
  background: #1f1f23;
  padding: 10px;
  flex-shrink: 0;
}
.ys-action-message {
  background: #1f1f23;
  flex: 1;
}
.ys-action-message:hover { background: #2a2a30; }
.ys-action-follow {
  background: #8b5cf6;
  flex: 1.6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}
.ys-action-follow:hover { background: #7c3aed; }
.ys-action-follow.ys-following { background: #2a2a30; }

/* === Bio === */
.ys-bio {
  padding: 4px 16px 16px;
  text-align: center;
}
.ys-bio-text {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.7;
  color: #e5e7eb;
}
.ys-purple-heart { color: #8b5cf6; }
.ys-contact-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
}
.ys-link {
  color: #a78bfa;
  text-decoration: none;
}
.ys-link:hover { text-decoration: underline; }

/* === Main Tabs === */
.ys-main-tabs {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 8px 0;
  margin-top: 8px;
}
.ys-tab-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 10px 30px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -10px;
  transition: all .2s;
}
.ys-tab-btn.active {
  color: #a78bfa;
}

/* === Sub Tabs === */
.ys-sub-tabs {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: #000;
  position: relative;
}
.ys-sub-tab {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 12px;
  position: relative;
  transition: color .2s;
}
.ys-sub-tab.active {
  color: #fff;
  font-weight: 700;
}
.ys-sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #8b5cf6;
  border-radius: 3px;
}

/* === Reels Grid === */
.ys-reels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 0 2px;
}
.ys-reel-card {
  aspect-ratio: 9/16;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .2s;
}
.ys-reel-card:hover { transform: scale(0.98); }
.ys-reel-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%);
}
.ys-reel-y {
  font-size: 36px;
  font-weight: 900;
  color: rgba(167, 139, 250, 0.7);
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
  font-family: 'Arial Black', sans-serif;
  transform: skewX(-5deg);
  opacity: 0.7;
}
.ys-reel-views {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.ys-bottom-spacer {
  height: 80px;
}

/* === Bottom Navigation === */
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
.ys-nav-item {
  flex: 1;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
  transition: color .2s;
}
.ys-nav-item.active { color: #fff; }
.ys-nav-icon-wrap {
  width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all .2s;
}
.ys-nav-newreel.active {
  background: #8b5cf6;
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}
.ys-nav-label { font-size: 11px; }

/* === Desktop / Web (laptop) responsive === */
@media (min-width: 1024px) {
  .ys-profile-root {
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

/* Mobile show status bar */
@media (max-width: 1023px) {
  .ys-status-bar { display: flex; }
}
`;
