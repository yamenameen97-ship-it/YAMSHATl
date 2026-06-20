/**
 * ReelComposerYamshat
 * شاشة منشئ الريلز - تصميم يطابق Yamshat / TikTok-style تماماً
 * Full-screen camera/recorder UI matching the provided design pixel-perfect.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - onPickFile: (file: File) => void   // عند اختيار من المعرض
 *  - onPublishMockTap?: () => void      // عند الضغط على زر التسجيل المركزي (اختياري)
 */
import { useEffect, useRef, useState } from 'react';

export default function ReelComposerYamshat({ open, onClose, onPickFile, onPublishMockTap }) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('reels'); // قوالب | ريلز | لايف | نشر | صورة
  const [flashOn, setFlashOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [noiseReduce, setNoiseReduce] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onPickFile) onPickFile(file);
    // reset so same file can be re-picked
    event.target.value = '';
  };

  // Left options column (icon + label)
  const leftOptions = [
    { id: 'duration', label: 'المدة', value: '15s', icon: TimerIcon },
    { id: 'speed', label: 'السرعة', value: '1x', icon: SpeedIcon },
    { id: 'beauty', label: 'تحسين', value: 'إيقاف', icon: SparkleIcon },
    { id: 'filters', label: 'الفلاتر', value: '', icon: FiltersIcon },
    { id: 'effects', label: 'المؤثرات', value: '', icon: EffectsIcon },
    { id: 'timer', label: 'المؤقت', value: '', icon: TimerCircleIcon },
    { id: 'layout', label: 'التخطيط', value: '9:16', icon: LayoutIcon },
    { id: 'retouch', label: 'تجميل', value: 'إيقاف', icon: RetouchIcon },
  ];

  // Right options column
  const rightOptions = [
    { id: 'flip', label: 'قلب', value: '', icon: FlipIcon, onClick: () => {} },
    { id: 'flash', label: 'الفلاش', value: flashOn ? 'تشغيل' : 'إيقاف', icon: FlashIcon, onClick: () => setFlashOn(v => !v) },
    { id: 'quality', label: 'الجودة', value: '1080p', icon: QualityIcon, onClick: () => {} },
    { id: 'mic', label: 'الميكروفون', value: micOn ? 'تشغيل' : 'إيقاف', icon: MicIcon, onClick: () => setMicOn(v => !v) },
    { id: 'noise', label: 'تقليل الضوضاء', value: noiseReduce ? 'تشغيل' : 'إيقاف', icon: NoiseIcon, onClick: () => setNoiseReduce(v => !v) },
    { id: 'mute', label: 'كتم الأصوات', value: muted ? 'تشغيل' : '', icon: MuteIcon, onClick: () => setMuted(v => !v) },
    { id: 'captions', label: 'الترجمة', value: captionsOn ? 'تشغيل' : 'إيقاف', icon: CaptionsIcon, onClick: () => setCaptionsOn(v => !v) },
  ];

  const tabs = [
    { id: 'templates', label: 'قوالب' },
    { id: 'reels', label: 'ريلز' },
    { id: 'live', label: 'لايف' },
    { id: 'post', label: 'نشر' },
    { id: 'photo', label: 'صورة' },
  ];

  return (
    <div className="yrc-root" dir="rtl" role="dialog" aria-label="منشئ ريل">
      <style>{composerStyles}</style>

      {/* Top bar */}
      <header className="yrc-top">
        <button type="button" className="yrc-close" onClick={onClose} aria-label="إغلاق">
          <CloseIcon />
        </button>
        <div className="yrc-sound-pill">
          <MusicNoteIcon />
          <span>إضافة صوت</span>
        </div>
        <button type="button" className="yrc-settings" aria-label="إعدادات">
          <SettingsGearIcon />
        </button>
      </header>

      {/* Left column */}
      <aside className="yrc-side yrc-left">
        {leftOptions.map(opt => (
          <button key={opt.id} type="button" className="yrc-opt">
            <span className="yrc-opt-icon"><opt.icon /></span>
            <span className="yrc-opt-text">
              <span className="yrc-opt-label">{opt.label}</span>
              {opt.value ? <span className="yrc-opt-value">{opt.value}</span> : null}
            </span>
          </button>
        ))}
        <button type="button" className="yrc-collapse" aria-label="طي">
          <ChevronUpIcon />
        </button>
      </aside>

      {/* Right column */}
      <aside className="yrc-side yrc-right">
        {rightOptions.map(opt => (
          <button key={opt.id} type="button" className="yrc-opt" onClick={opt.onClick}>
            <span className="yrc-opt-icon"><opt.icon /></span>
            <span className="yrc-opt-text">
              <span className="yrc-opt-label">{opt.label}</span>
              {opt.value ? <span className="yrc-opt-value">{opt.value}</span> : null}
            </span>
          </button>
        ))}
      </aside>

      {/* Center record area */}
      <div className="yrc-record-area">
        <button type="button" className="yrc-mini-x" aria-label="تجاهل" onClick={onClose}>
          <XSmallIcon />
        </button>

        <button
          type="button"
          className="yrc-record"
          aria-label="تسجيل"
          onClick={() => onPublishMockTap && onPublishMockTap()}
        >
          <span className="yrc-record-inner" />
        </button>

        <button type="button" className="yrc-mini-ok" aria-label="موافق">
          <CheckSmallIcon />
        </button>
      </div>

      {/* Tabs */}
      <nav className="yrc-tabs" aria-label="نمط الإنشاء">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`yrc-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id ? <span className="yrc-tab-dot" /> : null}
          </button>
        ))}
      </nav>

      {/* Bottom: Gallery & Drafts */}
      <footer className="yrc-bottom">
        <button type="button" className="yrc-bottom-btn" onClick={handleGalleryClick}>
          <GalleryIcon />
          <span>المعرض</span>
        </button>
        <button type="button" className="yrc-bottom-btn">
          <DraftsIcon />
          <span>المسودات</span>
        </button>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}

/* ---------------- Icons (inline SVG, stroke-based, white) ---------------- */
const stroke = { stroke: 'currentColor', strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

function CloseIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" {...stroke} /></svg>);
}
function MusicNoteIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12" {...stroke} /><circle cx="7" cy="18" r="2" {...stroke} /><circle cx="17" cy="16" r="2" {...stroke} /></svg>);
}
function SettingsGearIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" {...stroke} /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2L10 21h4l.6-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" {...stroke} /></svg>);
}
function ChevronUpIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" {...stroke} /></svg>);
}
function XSmallIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" {...stroke} /></svg>);
}
function CheckSmallIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 12l5 5 9-11" {...stroke} /></svg>);
}
function GalleryIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" {...stroke} /><path d="M3 16l5-5 4 4 3-3 6 6" {...stroke} /><circle cx="9" cy="10" r="1.5" {...stroke} /></svg>);
}
function DraftsIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" {...stroke} /><path d="M8 8h8M8 12h8M8 16h5" {...stroke} /></svg>);
}

/* Left icons */
function TimerIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" {...stroke} /><path d="M12 9v4l3 2M9 3h6" {...stroke} /></svg>);
}
function SpeedIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 14a8 8 0 0 1 16 0" {...stroke} /><path d="M12 14l4-4" {...stroke} /><circle cx="12" cy="14" r="1" fill="currentColor" /></svg>);
}
function SparkleIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3l1.5 4L18 8.5 13.5 10 12 14l-1.5-4L6 8.5 10.5 7 12 3z" {...stroke} /><path d="M18 16l.7 2 2 .7-2 .6L18 21l-.7-1.7-2-.6 2-.7L18 16z" {...stroke} /></svg>);
}
function FiltersIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="9" cy="10" r="5" {...stroke} /><circle cx="15" cy="14" r="5" {...stroke} /></svg>);
}
function EffectsIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 19l4-4M7 5l2 2M19 5l-2 2M19 19l-4-4M12 12l5-2-2 5-3-3z" {...stroke} /></svg>);
}
function TimerCircleIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 7v5l3 2" {...stroke} /></svg>);
}
function LayoutIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" {...stroke} /><path d="M5 9h14" {...stroke} /></svg>);
}
function RetouchIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 20s2-7 7-7 7 7 7 7" {...stroke} /><circle cx="12" cy="8" r="4" {...stroke} /><path d="M16 4l2 2" {...stroke} /></svg>);
}

/* Right icons */
function FlipIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 7l3-3v2h10a3 3 0 0 1 3 3v3M20 17l-3 3v-2H7a3 3 0 0 1-3-3v-3" {...stroke} /></svg>);
}
function FlashIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...stroke} /><path d="M3 3l18 18" {...stroke} /></svg>);
}
function QualityIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" {...stroke} /><text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">1080</text></svg>);
}
function MicIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" {...stroke} /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...stroke} /></svg>);
}
function NoiseIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 12h2l1-4 2 8 2-12 2 16 2-8 1 4h4" {...stroke} /></svg>);
}
function MuteIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5z" {...stroke} /><path d="M16 9l5 6M21 9l-5 6" {...stroke} /></svg>);
}
function CaptionsIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" {...stroke} /><path d="M7 13a2 2 0 1 1 2-2M13 13a2 2 0 1 1 2-2" {...stroke} /></svg>);
}

/* ---------------- Styles ---------------- */
const composerStyles = `
.yrc-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  color: #fff;
  overflow: hidden;
  font-family: 'Tajawal', 'Cairo', system-ui, -apple-system, sans-serif;
  -webkit-user-select: none;
  user-select: none;
}

/* Top header */
.yrc-top {
  position: absolute;
  top: 0; inset-inline: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
  z-index: 10;
}
.yrc-close, .yrc-settings {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; color: #fff;
  cursor: pointer;
  border-radius: 999px;
}
.yrc-close:active, .yrc-settings:active { background: rgba(255,255,255,0.08); }
.yrc-sound-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(20,20,20,0.85);
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(255,255,255,0.06);
}
.yrc-sound-pill svg { opacity: 0.95; }

/* Side columns */
.yrc-side {
  position: absolute;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  z-index: 5;
}
.yrc-left { inset-inline-start: 10px; }
.yrc-right { inset-inline-end: 10px; }

.yrc-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  color: #fff;
  padding: 4px 6px;
  cursor: pointer;
  border-radius: 10px;
  min-width: 64px;
}
.yrc-right .yrc-opt {
  flex-direction: row-reverse;
}
.yrc-opt:active { background: rgba(255,255,255,0.08); }
.yrc-opt-icon {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.yrc-opt-text {
  display: flex; flex-direction: column;
  line-height: 1.15;
  text-align: start;
}
.yrc-right .yrc-opt-text { text-align: end; }
.yrc-opt-label { font-size: 12.5px; font-weight: 500; }
.yrc-opt-value { font-size: 11px; color: rgba(255,255,255,0.62); margin-top: 2px; }

.yrc-collapse {
  margin-top: 8px;
  width: 28px; height: 28px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  align-self: center;
}

/* Record area */
.yrc-record-area {
  position: absolute;
  inset-inline: 0;
  bottom: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
  z-index: 4;
}
.yrc-mini-x, .yrc-mini-ok {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: rgba(60,60,60,0.85);
  border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.yrc-mini-x:active, .yrc-mini-ok:active { transform: scale(0.94); }

.yrc-record {
  width: 92px; height: 92px;
  border-radius: 999px;
  background: transparent;
  border: 5px solid #fff;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.yrc-record:active { transform: scale(0.94); }
.yrc-record-inner {
  width: 70px; height: 70px;
  border-radius: 999px;
  background: #8b5cf6;
  background: linear-gradient(180deg, #9d6bff 0%, #7c3aed 100%);
  box-shadow: 0 4px 18px rgba(139,92,246,0.45);
}

/* Tabs */
.yrc-tabs {
  position: absolute;
  inset-inline: 0;
  bottom: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  z-index: 5;
}
.yrc-tab {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.62);
  font-size: 14px;
  font-weight: 600;
  padding: 4px 2px;
  cursor: pointer;
  position: relative;
  font-family: inherit;
}
.yrc-tab.active {
  color: #a78bfa;
}
.yrc-tab-dot {
  position: absolute;
  bottom: -8px; left: 50%;
  transform: translateX(-50%);
  width: 6px; height: 6px; border-radius: 999px;
  background: #a78bfa;
  box-shadow: 0 0 8px rgba(167,139,250,0.6);
}

/* Bottom buttons */
.yrc-bottom {
  position: absolute;
  inset-inline: 0;
  bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 26px;
  z-index: 5;
}
.yrc-bottom-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 12px;
  font-family: inherit;
}
.yrc-bottom-btn:active { background: rgba(255,255,255,0.08); }

/* Responsive — keep mobile-first sizing; clamp on wider screens */
@media (min-width: 720px) {
  .yrc-root {
    /* keep phone-like centered frame on desktop */
    display: flex; align-items: center; justify-content: center;
  }
}
`;
