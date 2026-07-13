import { b0 as reactExports, ar as jsxRuntimeExports, bz as useNavigate, by as useLocation, bG as useToast, aE as mediaUploadService, A as API, a7 as getCurrentUsername } from "../index-TztUfWYS.js";
import { c as getReelsCache, s as saveReelsCache } from "./reelsEngine-bJfUGmhY.js";
const CAMERA_FILTERS = [
  {
    id: "none",
    label: "عادي",
    emoji: "○",
    filter: "none",
    beauty: "",
    gradient: "linear-gradient(135deg,#444,#222)"
  },
  {
    id: "beauty",
    label: "جمالية",
    emoji: "✨",
    filter: "brightness(1.10) contrast(1.04) saturate(1.10)",
    beauty: " blur(0.45px) brightness(1.04) saturate(1.06)",
    gradient: "linear-gradient(135deg,#ff7eb3,#ff65a3,#7afcff)"
  },
  {
    id: "games",
    label: "ألعاب",
    emoji: "🎮",
    filter: "brightness(1.06) contrast(1.18) saturate(1.40) hue-rotate(-8deg)",
    beauty: "",
    gradient: "linear-gradient(135deg,#7afcff,#feff9c,#fff740)"
  },
  {
    id: "cinematic",
    label: "سينمائي",
    emoji: "🎬",
    filter: "brightness(0.98) contrast(1.22) saturate(1.16) sepia(0.10)",
    beauty: "",
    gradient: "linear-gradient(135deg,#232526,#414345)"
  },
  {
    id: "warm",
    label: "دافئ",
    emoji: "🔥",
    filter: "brightness(1.04) contrast(1.06) saturate(1.18) sepia(0.18) hue-rotate(-6deg)",
    beauty: "",
    gradient: "linear-gradient(135deg,#ff9966,#ff5e62)"
  },
  {
    id: "cool",
    label: "بارد",
    emoji: "❄️",
    filter: "brightness(1.02) contrast(1.10) saturate(0.94) hue-rotate(14deg)",
    beauty: "",
    gradient: "linear-gradient(135deg,#36d1dc,#5b86e5)"
  },
  {
    id: "vivid",
    label: "حيوي",
    emoji: "🌈",
    filter: "brightness(1.06) contrast(1.18) saturate(1.50)",
    beauty: "",
    gradient: "linear-gradient(135deg,#ff6a00,#ee0979,#9b51e0)"
  },
  {
    id: "vintage",
    label: "كلاسيكي",
    emoji: "📷",
    filter: "sepia(0.50) contrast(1.10) brightness(0.96) saturate(0.85)",
    beauty: "",
    gradient: "linear-gradient(135deg,#c79081,#dfa579)"
  },
  {
    id: "mono",
    label: "مونو",
    emoji: "🖤",
    filter: "grayscale(1) contrast(1.18)",
    beauty: "",
    gradient: "linear-gradient(135deg,#bdc3c7,#2c3e50)"
  },
  {
    id: "soft",
    label: "ناعم",
    emoji: "🌸",
    filter: "brightness(1.10) contrast(0.94) saturate(1.10) blur(0.4px)",
    beauty: " brightness(1.04)",
    gradient: "linear-gradient(135deg,#fbc2eb,#a6c1ee)"
  },
  {
    id: "sharp",
    label: "حاد",
    emoji: "⚡",
    filter: "contrast(1.28) brightness(1.02) saturate(1.20)",
    beauty: "",
    gradient: "linear-gradient(135deg,#f7971e,#ffd200)"
  },
  {
    id: "neon",
    label: "نيون",
    emoji: "💜",
    filter: "contrast(1.20) saturate(1.55) hue-rotate(-22deg) brightness(1.06)",
    beauty: "",
    gradient: "linear-gradient(135deg,#7b2ff7,#f107a3)"
  },
  {
    id: "sunset",
    label: "غروب",
    emoji: "🌅",
    filter: "sepia(0.20) saturate(1.30) brightness(1.06) hue-rotate(-12deg)",
    beauty: "",
    gradient: "linear-gradient(135deg,#ff512f,#f09819)"
  },
  {
    id: "dream",
    label: "حلم",
    emoji: "☁️",
    filter: "brightness(1.12) contrast(0.90) saturate(1.20) blur(0.6px)",
    beauty: " brightness(1.05)",
    gradient: "linear-gradient(135deg,#a1c4fd,#c2e9fb)"
  }
];
const STORAGE_KEY = "yamshat-reels-cam-filter-v1";
function getSavedCamFilter() {
  try {
    if (typeof window === "undefined") return "none";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return CAMERA_FILTERS.find((f) => f.id === saved) ? saved : "none";
  } catch {
    return "none";
  }
}
function saveCamFilter(id) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(id || "none"));
  } catch {
  }
}
function getCamFilterCss(id, withBeauty = false) {
  const f = CAMERA_FILTERS.find((x) => x.id === id) || CAMERA_FILTERS[0];
  let css = f.filter === "none" ? "" : f.filter;
  if (withBeauty && f.beauty) css = `${css} ${f.beauty}`.trim();
  return css || "none";
}
function FilterThumb({ filter, isActive, stream, galleryUrl, facing, onClick }) {
  const vidRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    if (stream) {
      try {
        if (v.srcObject !== stream) v.srcObject = stream;
        v.muted = true;
        v.playsInline = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {
        });
      } catch {
      }
    } else if (galleryUrl) {
      try {
        v.srcObject = null;
        if (v.src !== galleryUrl) v.src = galleryUrl;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {
        });
      } catch {
      }
    } else {
      try {
        v.srcObject = null;
        v.removeAttribute("src");
        v.load();
      } catch {
      }
    }
    return () => {
      try {
        v.pause();
        v.srcObject = null;
        v.removeAttribute("src");
        v.load();
      } catch {
      }
    };
  }, [stream, galleryUrl]);
  const hasMedia = Boolean(stream || galleryUrl);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      className: `ymrc-fchip ${isActive ? "is-active" : ""}`,
      onClick,
      "aria-label": `فلتر ${filter.label}`,
      "aria-pressed": isActive,
      title: filter.label,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "ymrc-fchip-ring",
            style: { background: filter.gradient },
            "aria-hidden": true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ymrc-fchip-circle", children: [
          hasMedia ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "video",
            {
              ref: vidRef,
              className: "ymrc-fchip-video",
              style: {
                filter: filter.filter === "none" ? "none" : filter.filter,
                transform: stream && facing === "user" ? "scaleX(-1)" : "none"
              },
              muted: true,
              playsInline: true,
              autoPlay: true
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "ymrc-fchip-fallback",
              style: { background: filter.gradient },
              "aria-hidden": true,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-emoji", children: filter.emoji })
            }
          ),
          hasMedia ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-emoji is-overlay", "aria-hidden": true, children: filter.emoji }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-label", children: filter.label })
      ]
    }
  );
}
function CameraFilterCarousel({
  stream = null,
  facing = "user",
  galleryUrl = "",
  activeId = "none",
  onSelect,
  onOpenMore
}) {
  const scrollerRef = reactExports.useRef(null);
  const filters = reactExports.useMemo(() => CAMERA_FILTERS, []);
  reactExports.useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const idx = filters.findIndex((f) => f.id === activeId);
    if (idx < 0) return;
    const node = root.querySelector(`[data-fid="${activeId}"]`);
    if (node && typeof node.scrollIntoView === "function") {
      try {
        node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch {
      }
    }
  }, [activeId, filters]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-fcar", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-fcar-fade ymrc-fcar-fade-r", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-fcar-fade ymrc-fcar-fade-l", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-fcar-scroll", ref: scrollerRef, children: [
      filters.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-fid": f.id, className: "ymrc-fcar-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        FilterThumb,
        {
          filter: f,
          isActive: activeId === f.id,
          stream,
          galleryUrl,
          facing,
          onClick: () => onSelect && onSelect(f)
        }
      ) }, f.id)),
      onOpenMore ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-fcar-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "ymrc-fchip ymrc-fchip-more",
          onClick: onOpenMore,
          "aria-label": "مزيد من الفلاتر",
          title: "مزيد من الفلاتر",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-ring", style: { background: "linear-gradient(135deg,#555,#222)" }, "aria-hidden": true }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-circle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-fallback", style: { background: "rgba(0,0,0,0.55)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2.2", strokeLinecap: "round", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "7" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 20l-3.5-3.5" })
            ] }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-fchip-label", children: "المزيد" })
          ]
        }
      ) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .ymrc-fcar {
          position: relative;
          width: 100%;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          direction: rtl;
          pointer-events: auto;
        }
        .ymrc-fcar-scroll {
          display: flex;
          flex-direction: row-reverse;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 6px 14px 8px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ymrc-fcar-scroll::-webkit-scrollbar { display: none; }
        .ymrc-fcar-cell {
          flex: 0 0 auto;
          scroll-snap-align: center;
        }
        .ymrc-fcar-fade {
          position: absolute;
          top: 0; bottom: 0;
          width: 32px;
          pointer-events: none;
          z-index: 2;
        }
        .ymrc-fcar-fade-r {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.55), transparent);
        }
        .ymrc-fcar-fade-l {
          left: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.55), transparent);
        }
        .ymrc-fchip {
          appearance: none;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          display: grid;
          justify-items: center;
          gap: 6px;
          color: #fff;
          transition: transform 140ms ease;
        }
        .ymrc-fchip:hover { transform: translateY(-1px); }
        .ymrc-fchip-ring {
          display: none;
        }
        .ymrc-fchip-circle {
          position: relative;
          width: 52px; height: 52px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.18);
          background: #1a1a22;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          transition: width 160ms ease, height 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .ymrc-fchip.is-active .ymrc-fchip-circle {
          width: 64px; height: 64px;
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.35), 0 6px 18px rgba(255,255,255,0.18);
          transform: translateY(-2px);
        }
        .ymrc-fchip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #0a0a14;
        }
        .ymrc-fchip-fallback {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 22px;
        }
        .ymrc-fchip-emoji {
          font-size: 20px;
          line-height: 1;
        }
        .ymrc-fchip-emoji.is-overlay {
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 22px;
          height: 22px;
          background: rgba(0,0,0,0.55);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 13px;
          backdrop-filter: blur(4px);
        }
        .ymrc-fchip-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.7);
          max-width: 72px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.92;
        }
        .ymrc-fchip.is-active .ymrc-fchip-label {
          opacity: 1;
          color: #fff;
        }
        .ymrc-fchip-more .ymrc-fchip-circle {
          background: rgba(0,0,0,0.55);
          border-color: rgba(255,255,255,0.22);
          backdrop-filter: blur(6px);
        }
      ` })
  ] });
}
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const ACCEPTED_VIDEO = "video/*,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv,.3gp";
const DURATION_OPTIONS = [15, 30, 60, 90];
const SPEED_OPTIONS = [0.3, 0.5, 1, 2, 3];
const QUALITY_OPTIONS = ["480p", "720p", "1080p", "2K", "4K"];
const LAYOUT_OPTIONS = ["9:16", "1:1", "4:5", "16:9"];
const FLASH_MODES = [
  { v: "off", label: "إيقاف" },
  { v: "on", label: "تشغيل" },
  { v: "auto", label: "تلقائي" }
];
const EFFECTS = [
  { v: "none", label: "بدون مؤثر" },
  { v: "sparkle", label: "بريق" },
  { v: "glow", label: "توهج" },
  { v: "shake", label: "اهتزاز" },
  { v: "zoom", label: "تكبير ديناميكي" }
];
const TIMER_OPTIONS = [0, 3, 5, 10];
const TABS = [
  { id: "templates", label: "قوالب" },
  { id: "photo", label: "صورة" },
  { id: "reel", label: "ريلز" },
  { id: "live", label: "لايف" },
  { id: "post", label: "نشر" }
];
function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${u[i] || "B"}`;
}
function RailButton({ icon, label, sub, onClick, active = false, ariaLabel }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      className: `ymrc-rail-btn ${active ? "is-active" : ""}`,
      onClick,
      "aria-label": ariaLabel || label,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-rail-ico", "aria-hidden": true, children: icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ymrc-rail-text", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-rail-label", children: label }),
          sub ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-rail-sub", children: sub }) : null
        ] })
      ]
    }
  );
}
const Icons = {
  Close: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2.2", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 6l12 12M18 6l-12 12" }) }),
  Music: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "#fff", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 17V5l10-2v12" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "7", cy: "17", r: "3", fill: "none", stroke: "#fff", strokeWidth: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "17", cy: "15", r: "3", fill: "none", stroke: "#fff", strokeWidth: "2" })
  ] }),
  Settings: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 4.27 16.96l.06-.06A1.65 1.65 0 0 0 4.66 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82L4.21 7.12A2 2 0 1 1 7.04 4.29l.06.06A1.65 1.65 0 0 0 8.92 4.7 1.65 1.65 0 0 0 9.92 3.19V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 14.92 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
  ] }),
  Timer: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "13", r: "8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 9v4l3 2M9 2h6" })
  ] }),
  Flip: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M17 2l4 4-4 4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 11V9a4 4 0 0 1 4-4h14" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 22l-4-4 4-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 13v2a4 4 0 0 1-4 4H3" })
  ] }),
  Speed: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) }),
  Sparkle: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" })
  ] }),
  Filters: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8", cy: "10", r: "5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "16", cy: "10", r: "5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "17", r: "5" })
  ] }),
  Effects: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M3 21l9-9M12.2 6.2l-1.4-1.4" }) }),
  Layout: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "7", y: "3", width: "10", height: "18", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 12h10" })
  ] }),
  Beautify: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 11l2 2 4-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" })
  ] }),
  Flash: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "3", x2: "21", y2: "21" })
  ] }),
  Quality: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", stroke: "#fff", strokeWidth: "1.8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: "12", y: "15", textAnchor: "middle", fontSize: "7", fill: "#fff", stroke: "none", fontWeight: "700", children: "1080" })
  ] }),
  Mic: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "2", width: "6", height: "12", rx: "3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 10v2a7 7 0 0 0 14 0v-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 19v3" })
  ] }),
  Noise: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 12h2l2-6 4 12 4-9 2 5h4" }) }),
  Mute: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M15.5 8.5a5 5 0 0 1 0 7" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 5a9 9 0 0 1 0 14" })
  ] }),
  Caption: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M7 11h4M7 14h7" })
  ] }),
  Camera: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "30", height: "30", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "13", r: "4" })
  ] }),
  Gallery: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "9", cy: "9", r: "2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15l-5-5L5 21" })
  ] }),
  Draft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "17 21 17 13 7 13 7 21" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 3 7 8 15 8" })
  ] }),
  Check: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "#fff", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "4 12 10 18 20 6" }) })
};
function ReelComposer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { push: pushToast } = useToast() || {};
  const initialTabFromUrl = reactExports.useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const t = (sp.get("tab") || "").toLowerCase();
      if (["post", "reel", "story", "live", "photo", "templates"].includes(t)) return t;
    } catch {
    }
    if (location.pathname.startsWith("/post")) return "post";
    if (location.pathname.startsWith("/reels")) return "reel";
    return "reel";
  }, [location.search, location.pathname]);
  const [activeTab, setActiveTab] = reactExports.useState(initialTabFromUrl);
  const [duration, setDuration] = reactExports.useState(15);
  const [speed, setSpeed] = reactExports.useState(1);
  const [quality, setQuality] = reactExports.useState("1080p");
  const [layout, setLayout] = reactExports.useState("9:16");
  const [flash, setFlash] = reactExports.useState("off");
  const [filter, setFilter] = reactExports.useState(() => getSavedCamFilter());
  const [effect, setEffect] = reactExports.useState("none");
  const [timer, setTimer] = reactExports.useState(0);
  const [beautify, setBeautify] = reactExports.useState(false);
  const [micOn, setMicOn] = reactExports.useState(true);
  const [noiseReduction, setNoiseReduction] = reactExports.useState(false);
  const [muteAll, setMuteAll] = reactExports.useState(false);
  const [captions, setCaptions] = reactExports.useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = reactExports.useState(false);
  const [showSheet, setShowSheet] = reactExports.useState(null);
  const [audioTrack, setAudioTrack] = reactExports.useState(null);
  const [stream, setStream] = reactExports.useState(null);
  const [facing, setFacing] = reactExports.useState("user");
  const [recording, setRecording] = reactExports.useState(false);
  const [recordedBlob, setRecordedBlob] = reactExports.useState(null);
  const [recordTime, setRecordTime] = reactExports.useState(0);
  const [galleryFile, setGalleryFile] = reactExports.useState(null);
  const [galleryPreviewUrl, setGalleryPreviewUrl] = reactExports.useState("");
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [uploading, setUploading] = reactExports.useState(false);
  const [errorMessage, setErrorMessage] = reactExports.useState("");
  const [cameraOn, setCameraOn] = reactExports.useState(false);
  const videoRef = reactExports.useRef(null);
  const previewVideoRef = reactExports.useRef(null);
  const mediaRecorderRef = reactExports.useRef(null);
  const recordedChunksRef = reactExports.useRef([]);
  const recordTimerRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const countdownTimerRef = reactExports.useRef(null);
  const isMountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!cameraOn) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: micOn && !muteAll
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {
          });
        }
      } catch (err) {
        setErrorMessage("تعذّر الوصول للكاميرا: " + (err?.message || ""));
        setCameraOn(false);
      }
    }
    start();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOn, facing, micOn, muteAll]);
  reactExports.useEffect(() => {
    if (!cameraOn && stream) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
      }
      setStream(null);
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = null;
        } catch {
        }
      }
    }
  }, [cameraOn]);
  reactExports.useEffect(() => {
    return () => {
      if (galleryPreviewUrl) {
        try {
          URL.revokeObjectURL(galleryPreviewUrl);
        } catch {
        }
      }
    };
  }, [galleryPreviewUrl]);
  const requestOpenCamera = reactExports.useCallback(() => {
    setErrorMessage("");
    if (galleryFile) {
      setGalleryFile(null);
      if (galleryPreviewUrl) {
        try {
          URL.revokeObjectURL(galleryPreviewUrl);
        } catch {
        }
      }
      setGalleryPreviewUrl("");
    }
    setCameraOn(true);
  }, [galleryFile, galleryPreviewUrl]);
  reactExports.useEffect(() => {
    if (!recording) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      return;
    }
    recordTimerRef.current = setInterval(() => {
      setRecordTime((t) => {
        const nx = t + 0.1;
        if (nx >= duration) {
          stopRecording();
          return duration;
        }
        return nx;
      });
    }, 100);
    return () => recordTimerRef.current && clearInterval(recordTimerRef.current);
  }, [recording, duration]);
  reactExports.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      try {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.ondataavailable = null;
          mediaRecorderRef.current.onstop = null;
          if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        }
      } catch {
      }
    };
  }, []);
  const previewFilter = reactExports.useMemo(() => {
    let f = getCamFilterCss(filter, true);
    if (f === "none") f = "";
    if (beautify) f = `${f} blur(0.4px) brightness(1.06) saturate(1.1)`.trim();
    return f || "";
  }, [filter, beautify]);
  reactExports.useEffect(() => {
    saveCamFilter(filter);
  }, [filter]);
  const activeCamFilter = reactExports.useMemo(
    () => CAMERA_FILTERS.find((x) => x.id === filter) || CAMERA_FILTERS[0],
    [filter]
  );
  const startRecording = reactExports.useCallback(() => {
    if (!stream || recording) return;
    setErrorMessage("");
    setRecordedBlob(null);
    setRecordTime(0);
    recordedChunksRef.current = [];
    try {
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      rec.ondataavailable = (e) => {
        if (e.data?.size) recordedChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        if (!isMountedRef.current) return;
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
      };
      mediaRecorderRef.current = rec;
      rec.start(250);
      setRecording(true);
    } catch (err) {
      setErrorMessage("تعذّر بدء التسجيل: " + (err?.message || ""));
    }
  }, [stream, recording]);
  const stopRecording = reactExports.useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {
    }
    setRecording(false);
  }, []);
  const onCenterPress = () => {
    if (recording) {
      stopRecording();
      return;
    }
    if (timer && timer > 0) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      let countdown = timer;
      pushToast?.({ tone: "info", message: `يبدأ التسجيل خلال ${countdown}…` });
      countdownTimerRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return;
        }
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          startRecording();
        }
      }, 1e3);
      return;
    }
    startRecording();
  };
  const onCancel = () => {
    setRecordedBlob(null);
    setGalleryFile(null);
    if (galleryPreviewUrl) {
      try {
        URL.revokeObjectURL(galleryPreviewUrl);
      } catch {
      }
    }
    setGalleryPreviewUrl("");
    setRecordTime(0);
    setUploadProgress(0);
    setErrorMessage("");
  };
  const onConfirm = async () => {
    const file = galleryFile || (recordedBlob ? new File([recordedBlob], `reel-${Date.now()}.webm`, { type: "video/webm" }) : null);
    if (!file) {
      pushToast?.({ tone: "warning", message: "سجّل ريل أو اختر من المعرض أولاً" });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage("");
    let mediaUrl = "";
    try {
      const upload = await mediaUploadService.uploadFile(file, {
        purpose: "reel-upload",
        compressionPreset: "balanced",
        processingProfile: `${filter}:${effect}${beautify ? ":beauty" : ""}`,
        // ✅ v59.13.7 FIX #3 (ج): تجنّب setState بعد unmount
        onProgress: (p) => {
          if (!isMountedRef.current) return;
          setUploadProgress(Math.min(100, Number(p?.percent || 0)));
        }
      });
      mediaUrl = upload?.mediaUrl || upload?.url || "";
    } catch (uploadErr) {
      mediaUrl = "";
    }
    try {
      let publishResponse;
      if (mediaUrl) {
        publishResponse = await API.post("/reels", {
          media_url: mediaUrl,
          duration,
          quality,
          layout,
          filter,
          effect,
          audio_track: audioTrack?.id || null,
          captions,
          beautify
        });
      } else {
        const fd = new FormData();
        fd.append("file", file, file.name || `reel-${Date.now()}.webm`);
        fd.append("caption", captions || "");
        fd.append("category", "general");
        publishResponse = await API.post("/reels", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!isMountedRef.current || !e?.total) return;
            setUploadProgress(Math.min(100, Math.round(e.loaded * 100 / e.total)));
          }
        });
      }
      const created = publishResponse?.data?.item || publishResponse?.data?.reel || publishResponse?.data || {};
      const currentUsername = getCurrentUsername();
      const cached = Array.isArray(getReelsCache()?.items) ? getReelsCache().items : [];
      const optimisticReel = {
        ...created,
        id: created?.id || `local-reel-${Date.now()}`,
        username: created?.username || created?.user?.username || currentUsername || "أنت",
        content: created?.content || created?.caption || "",
        caption: created?.caption || created?.content || "",
        created_at: created?.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        media_url: created?.media_url || created?.video_url || mediaUrl,
        video_url: created?.video_url || created?.media_url || mediaUrl,
        thumbnail_url: created?.thumbnail_url || "",
        likes_count: Number(created?.likes_count || 0),
        comments_count: Number(created?.comments_count || 0),
        share_count: Number(created?.share_count || 0),
        views_count: Number(created?.views_count || 0)
      };
      const deduped = [optimisticReel, ...cached].filter((item, index, arr) => {
        const key = String(item?.id || item?.media_url || item?.video_url || index);
        return arr.findIndex((candidate) => String(candidate?.id || candidate?.media_url || candidate?.video_url || "") === key) === index;
      }).slice(0, 80);
      saveReelsCache(deduped);
      try {
        window.dispatchEvent(new CustomEvent("yamshat:reels-updated", { detail: { reelId: optimisticReel.id } }));
      } catch {
      }
      if (!isMountedRef.current) return;
      pushToast?.({ tone: "success", message: "تم نشر الريل بنجاح 🎉" });
      navigate("/reels", { replace: true, state: { highlightReelId: optimisticReel.id } });
    } catch (err) {
      const m = err?.response?.data?.detail || err?.message || "فشل نشر الريل";
      if (isMountedRef.current) {
        setErrorMessage(m);
        pushToast?.({ tone: "error", message: m });
      }
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  };
  const onGalleryPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_VIDEO_SIZE) {
      pushToast?.({ tone: "error", message: `الملف كبير جداً. الحد ${MAX_VIDEO_SIZE / (1024 * 1024)}MB` });
      return;
    }
    setCameraOn(false);
    setGalleryFile(f);
    setRecordedBlob(null);
    if (galleryPreviewUrl) {
      try {
        URL.revokeObjectURL(galleryPreviewUrl);
      } catch {
      }
    }
    try {
      const url = URL.createObjectURL(f);
      setGalleryPreviewUrl(url);
    } catch {
    }
    setErrorMessage("");
    try {
      e.target.value = "";
    } catch {
    }
    pushToast?.({ tone: "info", message: "تم اختيار الفيديو — جرّب التحسينات قبل النشر" });
  };
  const onTabSwitch = (id) => {
    setActiveTab(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState(null, "", url.toString());
    } catch {
    }
    if (id === "live") {
      navigate("/voice");
      return;
    }
  };
  const recPct = Math.min(100, recordTime / duration * 100);
  const hasGalleryPreview = Boolean(galleryFile && galleryPreviewUrl);
  reactExports.useEffect(() => {
    if (previewVideoRef.current) {
      try {
        previewVideoRef.current.playbackRate = speed || 1;
      } catch {
      }
    }
  }, [speed, galleryPreviewUrl]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-root", dir: "rtl", children: [
    hasGalleryPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        ref: previewVideoRef,
        src: galleryPreviewUrl,
        playsInline: true,
        autoPlay: true,
        loop: true,
        muted: muteAll,
        controls: false,
        className: "ymrc-cam",
        style: { filter: previewFilter || "none" }
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        ref: videoRef,
        playsInline: true,
        autoPlay: true,
        muted: true,
        className: "ymrc-cam",
        style: { filter: previewFilter || "none", transform: facing === "user" ? "scaleX(-1)" : "none", display: cameraOn ? "block" : "none" }
      }
    ),
    !hasGalleryPreview && !cameraOn ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-cam-placeholder", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymrc-open-cam", onClick: requestOpenCamera, "aria-label": "فتح الكاميرا", children: [
        Icons.Camera,
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اضغط لفتح الكاميرا" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "ymrc-cam-hint", children: [
        "أو اختر مقطعاً من ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymrc-link-btn", onClick: () => fileInputRef.current?.click(), children: "المعرض" })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-veil", "aria-hidden": true }),
    recording ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-recbar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { width: `${recPct}%` } }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ymrc-top", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymrc-icon-btn", onClick: () => navigate(-1), "aria-label": "إغلاق", children: Icons.Close }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-top-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymrc-pill", onClick: () => setShowSheet("audio"), "aria-label": "إضافة صوت", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إضافة صوت" }),
          Icons.Music
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `ymrc-cam-toggle ${cameraOn ? "is-on" : ""}`,
            onClick: () => cameraOn ? setCameraOn(false) : requestOpenCamera(),
            "aria-label": cameraOn ? "إيقاف الكاميرا" : "فتح الكاميرا",
            title: cameraOn ? "إيقاف الكاميرا" : "فتح الكاميرا",
            children: Icons.Camera
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymrc-icon-btn", onClick: () => setShowSettingsSheet(true), "aria-label": "الإعدادات", children: Icons.Settings })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "ymrc-rail ymrc-rail-left", "aria-label": "أدوات الفيديو", children: [
      !hasGalleryPreview && /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Timer, label: "المدة", sub: `${duration}s`, onClick: () => setShowSheet("duration") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Speed, label: "السرعة", sub: `${speed}x`, onClick: () => setShowSheet("speed") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Sparkle, label: "تحسين", sub: beautify ? "تشغيل" : "إيقاف", active: beautify, onClick: () => setBeautify((v) => !v) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Filters, label: "الفلاتر", onClick: () => setShowSheet("filter"), active: filter !== "none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Effects, label: "المؤثرات", onClick: () => setShowSheet("effect"), active: effect !== "none" }),
      !hasGalleryPreview && /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Timer, label: "المؤقت", sub: timer ? `${timer}s` : "إيقاف", onClick: () => setShowSheet("timer"), active: timer > 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Layout, label: "التخطيط", sub: layout, onClick: () => setShowSheet("layout") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Beautify, label: "تجميل", sub: beautify ? "تشغيل" : "إيقاف", active: beautify, onClick: () => setBeautify((v) => !v) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "ymrc-rail ymrc-rail-right", "aria-label": "إعدادات الكاميرا", children: [
      !hasGalleryPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Flip, label: "قلب", onClick: () => setFacing((f) => f === "user" ? "environment" : "user") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Flash, label: "الفلاش", sub: FLASH_MODES.find((m) => m.v === flash)?.label, onClick: () => setShowSheet("flash"), active: flash !== "off" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Quality, label: "الجودة", sub: quality, onClick: () => setShowSheet("quality") }),
      !hasGalleryPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Mic, label: "الميكروفون", sub: micOn ? "تشغيل" : "إيقاف", active: micOn, onClick: () => setMicOn((v) => !v) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Noise, label: "فلاتر الضوضاء", sub: noiseReduction ? "تشغيل" : "إيقاف", active: noiseReduction, onClick: () => setNoiseReduction((v) => !v) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Mute, label: "كتم الأصوات", sub: muteAll ? "مكتوم" : "تشغيل", active: muteAll, onClick: () => setMuteAll((v) => !v) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RailButton, { icon: Icons.Caption, label: "الترجمة", sub: captions ? "تشغيل" : "إيقاف", active: captions, onClick: () => setCaptions((v) => !v) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-record-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymrc-side-btn", onClick: onCancel, "aria-label": "إلغاء", children: Icons.Close }),
      hasGalleryPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "ymrc-record is-confirm",
          onClick: onConfirm,
          disabled: uploading,
          "aria-label": "تأكيد ونشر الفيديو المختار",
          title: "تأكيد ونشر",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-record-core ymrc-record-core-check", children: Icons.Check })
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `ymrc-record ${recording ? "is-recording" : ""} ${!cameraOn ? "is-disabled" : ""}`,
          onClick: cameraOn ? onCenterPress : requestOpenCamera,
          "aria-label": !cameraOn ? "فتح الكاميرا" : recording ? "إيقاف التسجيل" : "بدء التسجيل",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-record-core" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymrc-side-btn", onClick: onConfirm, "aria-label": "تأكيد ونشر", disabled: uploading || !recordedBlob && !galleryFile, children: Icons.Check })
    ] }),
    cameraOn || hasGalleryPreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-fcar-wrap", role: "region", "aria-label": "فلاتر الكاميرا", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      CameraFilterCarousel,
      {
        stream: cameraOn ? stream : null,
        facing,
        galleryUrl: hasGalleryPreview ? galleryPreviewUrl : "",
        activeId: filter,
        onSelect: (f) => setFilter(f.id),
        onOpenMore: () => setShowSheet("filter")
      }
    ) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "ymrc-tabs", "aria-label": "نوع المحتوى", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `ymrc-tab ${activeTab === t.id ? "is-active" : ""}`,
        onClick: () => onTabSwitch(t.id),
        children: [
          t.id === "post" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-dot", "aria-hidden": true }) : null,
          t.label
        ]
      },
      t.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-bottom", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymrc-bottom-btn", onClick: () => fileInputRef.current?.click(), children: [
        Icons.Gallery,
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المعرض" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymrc-bottom-btn", onClick: () => navigate("/settings/reels"), children: [
        Icons.Draft,
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المسودات" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: ACCEPTED_VIDEO, onChange: onGalleryPick, style: { display: "none" } }),
    hasGalleryPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-preview-badge", role: "status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-preview-dot" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "وضع المعاينة — جرّب الفلاتر والمؤثرات والسرعة قبل النشر" })
    ] }) : null,
    showSheet ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-sheet-back", onClick: () => setShowSheet(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-sheet", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-sheet-handle" }),
      showSheet === "duration" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "مدّة الريل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: DURATION_OPTIONS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: `ymrc-chip ${duration === d ? "is-on" : ""}`, onClick: () => {
          setDuration(d);
          setShowSheet(null);
        }, children: [
          d,
          "s"
        ] }, d)) })
      ] }),
      showSheet === "speed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "سرعة التسجيل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: SPEED_OPTIONS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: `ymrc-chip ${speed === s ? "is-on" : ""}`, onClick: () => {
          setSpeed(s);
          setShowSheet(null);
        }, children: [
          s,
          "x"
        ] }, s)) })
      ] }),
      showSheet === "quality" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "جودة الفيديو" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: QUALITY_OPTIONS.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${quality === q ? "is-on" : ""}`, onClick: () => {
          setQuality(q);
          setShowSheet(null);
        }, children: q }, q)) })
      ] }),
      showSheet === "layout" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "تخطيط الفيديو" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: LAYOUT_OPTIONS.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${layout === l ? "is-on" : ""}`, onClick: () => {
          setLayout(l);
          setShowSheet(null);
        }, children: l }, l)) })
      ] }),
      showSheet === "flash" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "الفلاش" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: FLASH_MODES.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${flash === m.v ? "is-on" : ""}`, onClick: () => {
          setFlash(m.v);
          setShowSheet(null);
        }, children: m.label }, m.v)) })
      ] }),
      showSheet === "filter" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "كل الفلاتر" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ymrc-muted", children: "اختر فلتراً لتطبيقه فوراً على الكاميرا وعلى الفيديو المُسجَّل." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: CAMERA_FILTERS.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `ymrc-chip ${filter === f.id ? "is-on" : ""}`,
            onClick: () => {
              setFilter(f.id);
              setShowSheet(null);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginInlineEnd: 6 }, children: f.emoji }),
              f.label
            ]
          },
          f.id
        )) })
      ] }),
      showSheet === "effect" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "المؤثرات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: EFFECTS.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${effect === e.v ? "is-on" : ""}`, onClick: () => {
          setEffect(e.v);
          setShowSheet(null);
        }, children: e.label }, e.v)) })
      ] }),
      showSheet === "timer" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "المؤقت قبل التسجيل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: TIMER_OPTIONS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${timer === t ? "is-on" : ""}`, onClick: () => {
          setTimer(t);
          setShowSheet(null);
        }, children: t === 0 ? "إيقاف" : `${t}s` }, t)) })
      ] }),
      showSheet === "audio" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "إضافة صوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ymrc-muted", children: "اختر مقطعاً صوتياً للريل أو حمّل من جهازك." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-grid", children: ["افتراضي", "موسيقى ١", "موسيقى ٢", "بدون صوت"].map((label, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `ymrc-chip ${audioTrack?.id === idx ? "is-on" : ""}`, onClick: () => {
          setAudioTrack({ id: idx, label });
          setShowSheet(null);
        }, children: label }, label)) })
      ] })
    ] }) }) : null,
    showSettingsSheet ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-sheet-back", onClick: () => setShowSettingsSheet(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymrc-sheet", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-sheet-handle" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "إعدادات الريل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "ymrc-settings-list", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الجودة الافتراضية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: quality })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "التخطيط" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: layout })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المدّة القصوى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            duration,
            "s"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الفلتر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            activeCamFilter.emoji,
            " ",
            activeCamFilter.label
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المؤثر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: EFFECTS.find((x) => x.v === effect)?.label })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تجميل تلقائي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: beautify ? "تشغيل" : "إيقاف" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ميكروفون" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: micOn ? "تشغيل" : "إيقاف" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تقليل الضوضاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: noiseReduction ? "تشغيل" : "إيقاف" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الترجمة التلقائية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: captions ? "تشغيل" : "إيقاف" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ymrc-cta", onClick: () => {
        setShowSettingsSheet(false);
        navigate("/settings/reels");
      }, children: "فتح إعدادات الريلز الكاملة" })
    ] }) }) : null,
    (uploading || errorMessage || (recordedBlob || galleryFile)) && !showSheet && !showSettingsSheet ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymrc-upload-pill", role: "status", children: uploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-up-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { style: { width: `${uploadProgress}%` } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "جاري النشر… ",
        uploadProgress,
        "%"
      ] })
    ] }) : errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymrc-err", children: errorMessage }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
      "جاهز للنشر — ",
      galleryFile ? `${galleryFile.name} (${formatBytes(galleryFile.size)})` : "تسجيل جديد"
    ] }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .ymrc-root {
          position: fixed;
          inset: 0;
          background: #000;
          color: #fff;
          overflow: hidden;
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          z-index: 1000;
        }
        .ymrc-cam {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          background: #0a0a14;
        }
        .ymrc-veil {
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 80% at 50% 110%, rgba(0,0,0,0.55), transparent 60%),
            radial-gradient(80% 60% at 50% 0%, rgba(0,0,0,0.45), transparent 70%),
            linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25));
        }
        .ymrc-recbar {
          position: absolute; top: env(safe-area-inset-top, 0); inset-inline: 0;
          height: 3px; background: rgba(255,255,255,0.12);
          z-index: 5;
        }
        .ymrc-recbar span {
          display: block; height: 100%;
          background: linear-gradient(90deg, #ff3b6b, #b66bff);
          transition: width 100ms linear;
        }
        .ymrc-top {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 14px);
          inset-inline: 14px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          z-index: 6;
        }
        .ymrc-top-center {
          display: inline-flex; align-items: center; gap: 10px;
        }
        .ymrc-cam-toggle {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          display: grid; place-items: center;
          color: #fff; cursor: pointer;
          backdrop-filter: blur(6px);
          transition: transform 120ms ease, background 120ms ease;
        }
        .ymrc-cam-toggle:hover { transform: scale(1.05); }
        .ymrc-cam-toggle.is-on {
          background: linear-gradient(135deg, rgba(139,92,246,0.85), rgba(99,102,241,0.85));
          border-color: rgba(167,139,250,0.85);
          box-shadow: 0 4px 18px rgba(138,92,255,0.45);
        }
        .ymrc-cam-toggle svg { width: 22px; height: 22px; }

        .ymrc-cam-placeholder {
          position: absolute; inset: 0;
          display: grid; place-items: center;
          background:
            radial-gradient(60% 50% at 50% 45%, rgba(139,92,246,0.18), transparent 70%),
            #0a0a14;
          z-index: 1;
          padding: 0 24px;
          text-align: center;
        }
        .ymrc-open-cam {
          display: grid; justify-items: center; gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.18);
          border-radius: 22px;
          padding: 26px 28px;
          color: #fff;
          font-size: 15px; font-weight: 800;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: transform 120ms ease, background 120ms ease;
        }
        .ymrc-open-cam:hover {
          transform: translateY(-2px);
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.45);
        }
        .ymrc-open-cam svg { width: 44px; height: 44px; }
        .ymrc-cam-hint {
          margin-top: 16px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
        }
        .ymrc-link-btn {
          background: transparent; border: 0;
          color: #b066ff;
          font-weight: 800; cursor: pointer;
          padding: 0 4px;
          text-decoration: underline;
        }

        .ymrc-preview-badge {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 64px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          z-index: 5;
          pointer-events: none;
        }
        .ymrc-preview-badge > span:last-child {
          background: rgba(0,0,0,0.6);
          padding: 6px 12px; border-radius: 999px;
          font-size: 12px; color: #fff;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(167,139,250,0.35);
        }
        .ymrc-preview-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #b066ff;
          box-shadow: 0 0 0 4px rgba(176,102,255,0.15);
          animation: ymrc-pulse 1.6s ease-in-out infinite;
        }
        @keyframes ymrc-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
        .ymrc-icon-btn {
          width: 38px; height: 38px;
          display: grid; place-items: center;
          background: transparent; border: 0; color: #fff;
          cursor: pointer;
        }
        .ymrc-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(0,0,0,0.55);
          color: #fff; border: 0; cursor: pointer;
          font-size: 15px; font-weight: 700;
          backdrop-filter: blur(6px);
        }
        .ymrc-rail {
          position: absolute;
          top: calc(env(safe-area-inset-top, 0) + 72px);
          display: grid; gap: 22px;
          z-index: 5;
        }
        .ymrc-rail-left { inset-inline-start: 10px; }
        .ymrc-rail-right { inset-inline-end: 10px; }
        .ymrc-rail-btn {
          display: grid; justify-items: center; gap: 4px;
          background: transparent; border: 0; color: #fff;
          padding: 4px; cursor: pointer;
          min-width: 64px;
        }
        .ymrc-rail-ico {
          width: 36px; height: 36px;
          display: grid; place-items: center;
          border-radius: 12px;
          background: rgba(0,0,0,0.0);
        }
        .ymrc-rail-btn.is-active .ymrc-rail-ico {
          background: rgba(139,92,246,0.35);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.55);
        }
        .ymrc-rail-text {
          display: grid; justify-items: center;
          font-size: 11px; line-height: 1.15;
        }
        .ymrc-rail-label { color: #fff; font-weight: 600; }
        .ymrc-rail-sub { color: rgba(255,255,255,0.72); font-size: 10px; margin-top: 1px; }

        .ymrc-record-row {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 222px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center; gap: 36px;
          z-index: 6;
        }
        /* حاوية شريط الفلاتر السفلي (على طريقة سناب شات) */
        .ymrc-fcar-wrap {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 140px);
          inset-inline: 0;
          z-index: 7;
          pointer-events: auto;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.55) 100%);
          padding-top: 8px;
        }
        .ymrc-side-btn {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(0,0,0,0.55);
          display: grid; place-items: center;
          border: 0; color: #fff; cursor: pointer;
          backdrop-filter: blur(6px);
        }
        .ymrc-side-btn:disabled { opacity: 0.45; }
        .ymrc-record {
          width: 82px; height: 82px;
          border-radius: 50%;
          background: #8a5cff;
          border: 4px solid #fff;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 8px 28px rgba(138,92,255,0.45);
          cursor: pointer;
          display: grid; place-items: center;
          transition: transform 120ms ease;
        }
        .ymrc-record:active { transform: scale(0.96); }
        .ymrc-record.is-recording { background: #ef4444; }
        .ymrc-record.is-recording .ymrc-record-core {
          width: 26px; height: 26px;
          background: #fff;
          border-radius: 6px;
        }
        .ymrc-record.is-disabled {
          background: rgba(138,92,255,0.45);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 6px 20px rgba(138,92,255,0.25);
        }
        .ymrc-record.is-confirm {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.25), 0 8px 28px rgba(34,197,94,0.45);
        }
        .ymrc-record.is-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
        .ymrc-record-core-check {
          background: transparent !important;
          display: grid; place-items: center;
        }
        .ymrc-record-core-check svg {
          width: 36px; height: 36px;
        }
        .ymrc-record-core {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #8a5cff;
          transition: all 150ms ease;
        }

        .ymrc-tabs {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 90px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 22px;
          z-index: 6;
          /* الترتيب البصري في الصورة من اليمين لليسار: قوالب صورة ريلز لايف نشر */
          direction: rtl;
        }
        .ymrc-tab {
          background: transparent; border: 0; color: rgba(255,255,255,0.75);
          font-size: 14px; font-weight: 700;
          padding: 6px 4px; cursor: pointer;
          position: relative;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .ymrc-tab.is-active {
          color: #b066ff;
        }
        .ymrc-tab.is-active::after {
          content: ''; position: absolute; bottom: -4px; inset-inline: 8px; height: 2px;
          border-radius: 2px; background: #b066ff;
        }
        .ymrc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #b066ff;
          display: inline-block;
        }

        .ymrc-bottom {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 0) + 14px);
          inset-inline: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px;
          z-index: 6;
        }
        .ymrc-bottom-btn {
          display: grid; justify-items: center; gap: 2px;
          background: transparent; border: 0; color: #fff;
          font-size: 12px; cursor: pointer;
          padding: 6px 10px;
        }

        /* Bottom sheets */
        .ymrc-sheet-back {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 10;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .ymrc-sheet {
          width: 100%; max-width: 560px;
          background: #14141c;
          border-radius: 22px 22px 0 0;
          padding: 14px 18px 22px;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
        }
        .ymrc-sheet-handle {
          width: 46px; height: 5px; border-radius: 99px;
          background: rgba(255,255,255,0.2);
          margin: 0 auto 10px;
        }
        .ymrc-sheet h4 {
          margin: 6px 0 12px;
          color: #fff; font-size: 16px; font-weight: 800;
          text-align: center;
        }
        .ymrc-muted { margin: 0 0 10px; color: #9ca3af; font-size: 13px; text-align: center; }
        .ymrc-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .ymrc-chip {
          padding: 12px 8px;
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          color: #fff; border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; font-weight: 700; font-size: 13px;
        }
        .ymrc-chip.is-on {
          background: linear-gradient(135deg, rgba(139,92,246,0.45), rgba(99,102,241,0.4));
          border-color: rgba(167,139,250,0.7);
          color: #fff;
        }
        .ymrc-settings-list {
          list-style: none; margin: 0; padding: 0;
          display: grid; gap: 6px;
        }
        .ymrc-settings-list li {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 13px;
        }
        .ymrc-settings-list strong { color: #c7b8ff; font-weight: 800; }
        .ymrc-cta {
          margin-top: 12px;
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: #fff; border: 0; font-weight: 800; cursor: pointer;
        }

        .ymrc-upload-pill {
          position: absolute;
          left: 50%; transform: translateX(-50%);
          bottom: calc(env(safe-area-inset-bottom, 0) + 316px);
          background: rgba(0,0,0,0.7);
          padding: 10px 14px; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12px; color: #fff;
          z-index: 7;
          max-width: 88%;
          backdrop-filter: blur(6px);
        }
        .ymrc-up-bar {
          width: 140px; height: 6px; border-radius: 999px;
          background: rgba(255,255,255,0.15); overflow: hidden;
        }
        .ymrc-up-bar i {
          display: block; height: 100%; border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          transition: width 120ms ease;
        }
        .ymrc-err { color: #fca5a5; }

        @media (min-width: 720px) {
          .ymrc-rail { gap: 24px; }
        }
      ` })
  ] });
}
export {
  ReelComposer as default
};
