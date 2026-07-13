import { ao as hasPreviousPage, am as hasNextPage, b0 as reactExports, bz as useNavigate, ar as jsxRuntimeExports, bD as useQueryClient, bG as useToast, bb as resolveMediaUrl, $ as getAuthToken, bt as useAppStore, X as followUser, bp as unmuteUser, aM as muteUser, bo as unblockUserApi, u as blockUserApi, _ as __vitePreload, h as MainLayout, ak as getStoredUserSnapshot, a7 as getCurrentUsername, N as NavLink, a6 as getCsrfToken, B as BACKEND_ORIGIN, z as clearStoredUser, b2 as redirectToAppPath } from "../index-TztUfWYS.js";
import { u as useIsMobile } from "./useIsMobile-oeGtrRpg.js";
import { g as getComments, a as addComment, h as sortPostsNewestFirst, e as getPosts, l as likePost, s as savePost, f as sharePost, d as deletePost, u as updatePost } from "./posts-C7Lsj7RA.js";
import { M as Modal } from "./Modal-B-5vq1dK.js";
import { Q as QueryObserver, u as useBaseQuery } from "./useBaseQuery-DgKrLtss.js";
import { P as PostComposer } from "./PostComposer-FHQ6zsx4.js";
import { f as formatCompactNumber } from "./YamshatDesign-54IPzo7E.js";
import "./react-virtualized-auto-sizer.esm-ptBjTfg4.js";
var InfiniteQueryObserver = class extends QueryObserver {
  constructor(client, options) {
    super(client, options);
  }
  bindMethods() {
    super.bindMethods();
    this.fetchNextPage = this.fetchNextPage.bind(this);
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
  }
  setOptions(options) {
    options._type = "infinite";
    super.setOptions(options);
  }
  getOptimisticResult(options) {
    options._type = "infinite";
    return super.getOptimisticResult(options);
  }
  fetchNextPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "forward" }
      }
    });
  }
  fetchPreviousPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "backward" }
      }
    });
  }
  createResult(query, options) {
    const { state } = query;
    const parentResult = super.createResult(query, options);
    const { isFetching, isRefetching, isError, isRefetchError } = parentResult;
    const fetchDirection = state.fetchMeta?.fetchMore?.direction;
    const isFetchNextPageError = isError && fetchDirection === "forward";
    const isFetchingNextPage = isFetching && fetchDirection === "forward";
    const isFetchPreviousPageError = isError && fetchDirection === "backward";
    const isFetchingPreviousPage = isFetching && fetchDirection === "backward";
    const result = {
      ...parentResult,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchNextPageError,
      isFetchingNextPage,
      isFetchPreviousPageError,
      isFetchingPreviousPage,
      isRefetchError: isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
      isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
    };
    return result;
  }
};
function useInfiniteQuery(options, queryClient) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver
  );
}
function parseServerDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const d2 = new Date(value);
    return Number.isNaN(d2.getTime()) ? null : d2;
  }
  let str = String(value).trim();
  if (!str) return null;
  const hasTZ = /(Z|[+\-]\d{2}:?\d{2})$/i.test(str);
  if (!hasTZ && /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(str)) {
    str = str.replace(" ", "T") + "Z";
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}
function timeAgoAr$2(value, opts = {}) {
  const justNowThresholdSec = Number.isFinite(opts.justNowThresholdSec) ? opts.justNowThresholdSec : 30;
  const nowMs = Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();
  const d = parseServerDate(value);
  if (!d) return "الآن";
  let diffSec = Math.floor((nowMs - d.getTime()) / 1e3);
  if (diffSec < 0) {
    if (diffSec > -120) return "الآن";
    diffSec = Math.abs(diffSec);
  }
  if (diffSec < justNowThresholdSec) return "الآن";
  if (diffSec < 60) return "منذ لحظات";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return minutes === 1 ? "منذ دقيقة" : `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "أمس" : `منذ ${days} يوم`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "منذ أسبوع" : `منذ ${weeks} أسابيع`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "منذ شهر" : `منذ ${months} شهر`;
  const years = Math.floor(months / 12);
  return years === 1 ? "منذ سنة" : `منذ ${years} سنة`;
}
function formatLocalDateTimeAr(value) {
  const d = parseServerDate(value);
  if (!d) return "";
  try {
    return d.toLocaleString("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return d.toString();
  }
}
function VerifiedBadge() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "13", height: "13", fill: "#8B5CF6", style: { marginInlineStart: 3, flexShrink: 0 }, "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) });
}
function MobilePostCard({
  post = {},
  onLike,
  onComment,
  onShare,
  onSave,
  onMore
}) {
  const navigate = useNavigate();
  const {
    authorName = "مستخدم",
    handle = "@user",
    timeText = "منذ قليل",
    rawTime = null,
    timeTitle = "",
    verified = false,
    avatarUrl = "",
    text = "",
    banner = null,
    likes = 0,
    comments = 0,
    reposts = 0,
    liked = false,
    saved = false,
    isLive = false
  } = post;
  const [liveTime, setLiveTime] = reactExports.useState(() => rawTime ? timeAgoAr$2(rawTime) : timeText);
  reactExports.useEffect(() => {
    setLiveTime(rawTime ? timeAgoAr$2(rawTime) : timeText);
    if (!rawTime) return void 0;
    const id = setInterval(() => setLiveTime(timeAgoAr$2(rawTime)), 30 * 1e3);
    return () => clearInterval(id);
  }, [rawTime, timeText]);
  const formatCount = (n) => {
    if (n >= 1e3) return (n / 1e3).toFixed(1) + " ألف";
    return String(n);
  };
  const cleanUsername = (post.username || (handle || "").replace(/^@/, "") || authorName || "").trim();
  const goToProfile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!cleanUsername) return;
    navigate(`/profile/${encodeURIComponent(cleanUsername)}`);
  };
  const onKeyGoToProfile = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToProfile(e);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "ym-post-card", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ym-post-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ym-more-btn", "aria-label": "المزيد", onClick: () => onMore?.(post), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "currentColor", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "5", cy: "12", r: "1.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "1.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "19", cy: "12", r: "1.8" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-identity-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "ym-post-title-area ym-clickable",
            role: "link",
            tabIndex: 0,
            onClick: goToProfile,
            onKeyDown: onKeyGoToProfile,
            "aria-label": `فتح الملف الشخصي لـ ${authorName}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-author-row", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-author-name", children: authorName }),
                verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedBadge, {})
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-subtext", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-time", title: timeTitle || "", children: liveTime }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-dot", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("bdi", { className: "ym-handle", children: handle }),
                isLive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-live-badge-inline", children: "مباشر" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "ym-post-avatar ym-clickable",
            role: "link",
            tabIndex: 0,
            onClick: goToProfile,
            onKeyDown: onKeyGoToProfile,
            "aria-label": `فتح الملف الشخصي لـ ${authorName}`,
            children: avatarUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatarUrl, alt: "", loading: "lazy", decoding: "async" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 100", width: "66%", height: "66%", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "ym-post-avatar-grad", x1: "0", y1: "0", x2: "0.5", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#A78BFA" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#6D28D9" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "22", y1: "18", x2: "50", y2: "55", stroke: "url(#ym-post-avatar-grad)", strokeWidth: "12", strokeLinecap: "round" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "78", y1: "18", x2: "50", y2: "55", stroke: "url(#ym-post-avatar-grad)", strokeWidth: "12", strokeLinecap: "round" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "50", y1: "55", x2: "50", y2: "86", stroke: "url(#ym-post-avatar-grad)", strokeWidth: "12", strokeLinecap: "round" })
            ] })
          }
        )
      ] })
    ] }),
    text && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-post-content", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { dir: "rtl", children: text }) }),
    banner && (banner.type === "image" || banner.type === "logo") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-post-banner-new", children: [
      isLive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-live-overlay-label", children: "مباشر الآن LIVE" }),
      banner.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "banner-image-container", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: banner.url,
            alt: text && String(text).trim().slice(0, 140) || `صورة منشور من ${authorName}`,
            loading: "lazy",
            decoding: "async",
            onError: (e) => {
              try {
                const el = e.currentTarget;
                el.style.display = "none";
                if (el.parentNode && !el.parentNode.querySelector(".banner-image-fallback")) {
                  const fb = document.createElement("div");
                  fb.className = "banner-image-fallback";
                  fb.setAttribute("role", "img");
                  fb.setAttribute("aria-label", "تعذّر تحميل الصورة");
                  fb.innerText = "🖼️ تعذّر تحميل الصورة";
                  el.parentNode.appendChild(fb);
                }
              } catch {
              }
            }
          }
        ),
        isLive && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "banner-live-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "white", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            formatCount(post.viewers || 2400),
            " مشاهد"
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "banner-logo-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "ym-logo-large", viewBox: "0 0 200 200", "aria-hidden": "true", preserveAspectRatio: "xMidYMid meet", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "ym-banner-grad", x1: "0", y1: "0", x2: "0.5", y2: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#A78BFA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "60%", stopColor: "#8B5CF6" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#6D28D9" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "45", y1: "35", x2: "100", y2: "110", stroke: "url(#ym-banner-grad)", strokeWidth: "24", strokeLinecap: "round" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "155", y1: "35", x2: "100", y2: "110", stroke: "url(#ym-banner-grad)", strokeWidth: "24", strokeLinecap: "round" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "100", y1: "110", x2: "100", y2: "172", stroke: "url(#ym-banner-grad)", strokeWidth: "24", strokeLinecap: "round" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "ym-post-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-footer-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `ym-footer-btn ym-footer-btn-save ${saved ? "is-saved" : ""}`,
          "aria-label": "حفظ",
          onClick: () => onSave?.(post),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: saved ? "#8B5CF6" : "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" }) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-footer-actions-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ym-footer-btn", "aria-label": "مشاركة", onClick: () => onShare?.(post), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-count", children: formatCount(Number(reposts) || 0) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ym-footer-btn", "aria-label": "تعليق", onClick: () => onComment?.(post), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-count", children: formatCount(Number(comments) || 0) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `ym-footer-btn ym-footer-btn-like ${liked ? "liked" : ""}`,
            "aria-label": liked ? "إلغاء الإعجاب" : "إعجاب",
            "aria-pressed": liked ? "true" : "false",
            onClick: () => onLike?.(post),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  viewBox: "0 0 24 24",
                  fill: liked ? "#8B5CF6" : "none",
                  stroke: liked ? "#8B5CF6" : "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ym-count ${liked ? "text-purple" : ""}`, children: formatCount(Number(likes) || 0) })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /* ===================================================================
           v86.7 — بطاقة منشور احترافية موحّدة على الجوال
           - متغيرات CSS مركزية لضبط جميع الأحجام من مكان واحد
           - قيم clamp() تضمن ملاءمة ديناميكية لجميع الشاشات (320px → 768px)
           - overflow مقفول على كل المستويات لمنع الفيضان
           =================================================================== */
        .ym-post-card {
          /* متغيرات موحدة */
          --ym-radius: 14px;
          --ym-pad-x: clamp(10px, 3vw, 14px);
          --ym-pad-y: clamp(10px, 2.6vw, 13px);
          --ym-gap: clamp(6px, 1.8vw, 10px);
          --ym-avatar-size: clamp(34px, 9.5vw, 40px);
          --ym-name-size: clamp(0.82rem, 3.4vw, 0.94rem);
          --ym-meta-size: clamp(0.66rem, 2.6vw, 0.74rem);
          --ym-body-size: clamp(0.8rem, 3.3vw, 0.9rem);
          --ym-btn-size: clamp(0.72rem, 2.9vw, 0.82rem);
          --ym-icon-size: clamp(18px, 5.2vw, 21px);
          --ym-icon-more: clamp(16px, 4.8vw, 18px);

          background-color: #0A0D1A;
          border: 1px solid #1F2937;
          border-radius: var(--ym-radius);
          padding: var(--ym-pad-y) var(--ym-pad-x);
          margin: 8px auto;
          color: #fff;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ym-post-card:active {
          transform: scale(0.998);
        }

        /* =========================
           الهيدر
           ========================= */
        .ym-post-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--ym-gap);
          gap: var(--ym-gap);
          direction: ltr;
          min-width: 0;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
        }
        .ym-identity-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--ym-gap);
          min-width: 0;
          flex: 1 1 auto;
          justify-content: flex-end;
          overflow: hidden;
        }
        .ym-clickable {
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .ym-clickable:hover { opacity: 0.85; }
        .ym-clickable:active { transform: scale(0.97); }
        .ym-clickable:focus-visible {
          outline: 2px solid #8B5CF6;
          outline-offset: 2px;
          border-radius: 8px;
        }
        .ym-post-avatar {
          width: var(--ym-avatar-size);
          height: var(--ym-avatar-size);
          border-radius: 50%;
          background: #14172a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #8B5CF6;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.3);
        }
        .ym-post-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ym-post-title-area {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          min-width: 0;
          flex: 0 1 auto;
          direction: rtl;
          overflow: hidden;
        }
        .ym-author-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 3px;
          direction: rtl;
          unicode-bidi: isolate;
          max-width: 100%;
        }
        .ym-author-name {
          font-weight: 700;
          font-size: var(--ym-name-size);
          color: #fff;
          line-height: 1.25;
          unicode-bidi: plaintext;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-post-subtext {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 4px;
          color: #9CA3AF;
          font-size: var(--ym-meta-size);
          margin-top: 2px;
          justify-content: flex-end;
          direction: rtl;
          unicode-bidi: isolate;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-dot { color: #6B7280; }
        .ym-handle {
          direction: ltr;
          unicode-bidi: isolate;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ym-live-badge-inline {
          color: #8B5CF6;
          margin-inline-start: 4px;
          font-weight: 700;
          font-size: 0.92em;
        }
        .ym-more-btn {
          background: none;
          border: none;
          color: #6B7280;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          min-width: 34px;
          min-height: 34px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .ym-more-btn svg {
          width: var(--ym-icon-more);
          height: var(--ym-icon-more);
        }
        .ym-more-btn:hover { color: #C4B5FD; background: rgba(139, 92, 246, 0.08); }
        .ym-more-btn:active { background: rgba(139, 92, 246, 0.15); }

        /* =========================
           جسم النص
           ========================= */
        .ym-post-content {
          margin-bottom: var(--ym-gap);
          font-size: var(--ym-body-size);
          line-height: 1.55;
          color: #E5E7EB;
          word-wrap: break-word;
          overflow-wrap: break-word;
          direction: rtl;
          text-align: right;
          max-width: 100%;
        }
        .ym-post-content p { margin: 0; }

        /* =========================
           صورة المنشور
           ========================= */
        .ym-post-banner-new {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: var(--ym-gap);
          position: relative;
          background: #000;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 100%;
        }
        .banner-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .banner-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .banner-image-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1f33 0%, #0f1422 100%);
          color: #9CA3AF;
          font-size: 0.85rem;
          text-align: center;
          padding: 12px;
          direction: rtl;
        }
        .banner-logo-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        .ym-logo-large {
          width: 58%;
          height: auto;
          max-width: 260px;
          filter: drop-shadow(0 6px 24px rgba(139, 92, 246, 0.55));
        }
        .ym-live-overlay-label {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: #EF4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          z-index: 10;
        }
        .banner-live-info {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* =========================
           الفوتر
           - شبكة موحّدة: [حفظ] | [مشاركة/تعليق/إعجاب]
           ========================= */
        .ym-post-footer {
          padding-top: 4px;
          border-top: 1px solid rgba(31, 41, 55, 0.6);
          margin-top: 2px;
        }
        .ym-footer-actions {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
          width: 100%;
          direction: ltr;
          min-width: 0;
        }
        .ym-footer-actions-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: clamp(2px, 1.2vw, 6px);
          min-width: 0;
          flex: 0 1 auto;
        }
        .ym-footer-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: var(--ym-btn-size);
          padding: 6px 8px;
          border-radius: 8px;
          transition: background 0.15s ease, color 0.15s ease;
          font-family: inherit;
          min-height: 36px;
          flex-shrink: 0;
          line-height: 1;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          -webkit-user-select: none;
          user-select: none;
        }
        .ym-footer-btn svg {
          width: var(--ym-icon-size);
          height: var(--ym-icon-size);
          flex-shrink: 0;
          display: block;
        }
        .ym-footer-btn .ym-count {
          font-family: 'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif;
          direction: rtl;
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .ym-footer-btn:hover { background: rgba(139, 92, 246, 0.1); color: #C4B5FD; }
        .ym-footer-btn:active { transform: scale(0.94); background: rgba(139, 92, 246, 0.18); }
        .ym-footer-btn-like { color: #9CA3AF; }
        .ym-footer-btn-like.liked { color: #8B5CF6; }
        .ym-footer-btn-save { color: #9CA3AF; }
        .ym-footer-btn-save.is-saved { color: #8B5CF6; }
        .text-purple { color: #8B5CF6; font-weight: 700; }

        /* =========================
           شاشات صغيرة جداً (≤340px) — Redmi 5A, Galaxy Fold مغلق
           ========================= */
        @media (max-width: 340px) {
          .ym-post-card {
            --ym-radius: 12px;
            --ym-pad-x: 8px;
            --ym-pad-y: 9px;
            margin: 6px auto;
          }
          .ym-footer-btn { padding: 5px 5px; gap: 3px; }
          .ym-footer-actions-right { gap: 1px; }
        }

        /* =========================
           سطح المكتب / التابلت
           ========================= */
        @media (min-width: 768px) {
          .ym-post-card {
            --ym-radius: 16px;
            --ym-pad-x: 16px;
            --ym-pad-y: 14px;
            margin: 10px auto;
          }
        }
        @media (min-width: 1024px) {
          .ym-post-card {
            --ym-btn-size: 0.92rem;
          }
        }

        /* دعم المتصفحات التي لا تدعم aspect-ratio */
        @supports not (aspect-ratio: 1 / 1) {
          .ym-post-banner-new {
            height: 0;
            padding-bottom: 100%;
            position: relative;
          }
          .banner-image-container,
          .banner-logo-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
        }
      ` })
  ] });
}
const MobilePostCard$1 = reactExports.memo(MobilePostCard);
function MobileCommentsSheet({ open, postId, onClose }) {
  const [comments, setComments] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [draft, setDraft] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  reactExports.useEffect(() => {
    if (!open || !postId) return;
    let cancelled = false;
    setLoading(true);
    getComments(postId).then((res) => {
      if (cancelled) return;
      const data = res?.data;
      let raw = [];
      if (Array.isArray(data)) raw = data;
      else if (Array.isArray(data?.items)) raw = data.items;
      else if (Array.isArray(data?.comments)) raw = data.comments;
      else if (Array.isArray(data?.results)) raw = data.results;
      else if (Array.isArray(data?.data)) raw = data.data;
      else if (Array.isArray(data?.data?.items)) raw = data.data.items;
      const flat = [];
      const seen = /* @__PURE__ */ new Set();
      const walk = (nodes) => {
        if (!Array.isArray(nodes)) return;
        for (const n of nodes) {
          if (!n || typeof n !== "object") continue;
          const key = n.id ?? `${n.user_id || ""}-${n.created_at || ""}-${(n.content || n.text || "").slice(0, 20)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          flat.push(n);
          if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
          if (Array.isArray(n.children) && n.children.length) walk(n.children);
        }
      };
      walk(raw);
      setComments(flat);
    }).catch((err) => {
      const status = err?.response?.status;
      if (status && status !== 500) {
        console.warn("Failed to load comments", err?.message || err);
      }
      if (!cancelled) setComments([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, postId]);
  reactExports.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-ym-sheet", "open");
    return () => {
      document.body.style.overflow = prev;
      document.body.removeAttribute("data-ym-sheet");
    };
  }, [open]);
  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !postId) return;
    setSending(true);
    try {
      const res = await addComment(postId, content);
      const newComment = res?.data?.comment || res?.data || {
        id: `local-${Date.now()}`,
        content,
        author_name: "أنت",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      setComments((prev) => [newComment, ...prev]);
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      pushToast?.({ type: "success", title: "تمت إضافة التعليق" });
      try {
        const refetch = await getComments(postId);
        const data = refetch?.data;
        let raw = [];
        if (Array.isArray(data)) raw = data;
        else if (Array.isArray(data?.items)) raw = data.items;
        else if (Array.isArray(data?.comments)) raw = data.comments;
        else if (Array.isArray(data?.results)) raw = data.results;
        else if (Array.isArray(data?.data)) raw = data.data;
        const flat = [];
        const seen = /* @__PURE__ */ new Set();
        const walk = (nodes) => {
          if (!Array.isArray(nodes)) return;
          for (const n of nodes) {
            if (!n || typeof n !== "object") continue;
            const key = n.id ?? `${n.user_id || ""}-${n.created_at || ""}-${(n.content || n.text || "").slice(0, 20)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            flat.push(n);
            if (Array.isArray(n.replies) && n.replies.length) walk(n.replies);
            if (Array.isArray(n.children) && n.children.length) walk(n.children);
          }
        };
        walk(raw);
        if (flat.length) setComments(flat);
      } catch (refetchErr) {
        console.warn("Refetch after add failed", refetchErr?.message || refetchErr);
      }
    } catch (err) {
      console.error("Add comment failed", err);
      pushToast?.({ type: "error", title: "تعذر إضافة التعليق" });
    } finally {
      setSending(false);
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-sheet-overlay", "data-yam-comments-sheet": "true", role: "dialog", "aria-modal": "true", "aria-label": "التعليقات", dir: "rtl", onClick: onClose, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] {
          align-items: flex-end !important;
          justify-content: center !important;
          padding: 0 !important;
          z-index: 1200 !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet {
          width: 100% !important;
          max-width: 100% !important;
          height: min(82dvh, 760px) !important;
          max-height: min(82dvh, 760px) !important;
          margin: 0 !important;
          border-radius: 24px 24px 0 0 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          transform: none !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-head {
          flex-shrink: 0 !important;
          padding-top: 10px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          padding-bottom: 12px !important;
          -webkit-overflow-scrolling: touch !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-composer {
          position: sticky !important;
          bottom: 0 !important;
          inset-inline: 0 !important;
          margin-top: auto !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
          background: rgba(9, 12, 26, 0.96) !important;
          border-top: 1px solid rgba(255,255,255,0.08) !important;
          z-index: 2 !important;
          transform: none !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-input {
          flex: 1 1 auto !important;
          min-height: 46px !important;
        }
        html body .ym-sheet-overlay[data-yam-comments-sheet="true"] .ym-sheet-send {
          flex-shrink: 0 !important;
        }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-sheet", dir: "rtl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-handle", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "ym-sheet-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "التعليقات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ym-sheet-close", onClick: onClose, "aria-label": "إغلاق", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 6 L18 18 M18 6 L6 18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-body", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-sheet-empty", children: "جارٍ التحميل..." }) : comments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-sheet-empty", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon", children: "💬" }),
        "لا توجد تعليقات بعد. كن أول من يعلّق!"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "ym-comment-list", children: comments.map((c) => {
        const author = c.author_name || c.username || c.user || "مستخدم";
        const avatar = resolveMediaUrl(c.user_avatar || c.avatar || c.author_avatar || "");
        const txt = c.content || c.text || "";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "ym-comment-item", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-comment-avatar", children: avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar, alt: "", loading: "lazy" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ph", children: String(author).charAt(0) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-comment-body", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-comment-author", children: author }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-comment-text", dir: "auto", children: txt })
          ] })
        ] }, c.id || `c-${Math.random()}`);
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "ym-sheet-composer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "اكتب تعليقاً...",
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            },
            disabled: sending,
            dir: "auto",
            className: "ym-sheet-input"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ym-sheet-send",
            onClick: handleSend,
            disabled: !draft.trim() || sending,
            "aria-label": "إرسال",
            children: sending ? "..." : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3 12 L21 4 L17 21 L13 13 Z", fill: "currentColor" }) })
          }
        )
      ] })
    ] })
  ] });
}
const MobileCommentsSheet$1 = reactExports.memo(MobileCommentsSheet);
function useFeed(options = {}) {
  const {
    tab,
    filter,
    filterType,
    sort,
    sortBy,
    limit = 10,
    includeDrafts = false,
    pollingInterval = 3e4,
    initialData
  } = options;
  const effectiveFilter = String(filterType || tab || filter || "all").trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === "latest" ? "recent" : "recent")).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = reactExports.useRef(Date.now());
  const [authReady, setAuthReady] = reactExports.useState(() => Boolean(getAuthToken()));
  reactExports.useEffect(() => {
    if (authReady) return void 0;
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      if (getAuthToken()) {
        setAuthReady(true);
        clearInterval(interval);
      }
    }, 300);
    const timeout = setTimeout(() => {
      cancelled = true;
      clearInterval(interval);
      setAuthReady(true);
    }, 5e3);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [authReady]);
  const query = useInfiniteQuery({
    queryKey: ["feed-data", effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({
        page: pageParam,
        limit: pageSize,
        filterType: effectiveFilter,
        sortBy: effectiveSort,
        includeDrafts
      });
      lastFetchRef.current = Date.now();
      return {
        items: response.data || [],
        meta: response.meta || {}
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = Boolean(
        lastPage?.meta?.pagination?.has_more ?? lastPage?.meta?.has_more ?? (Array.isArray(lastPage?.items) && lastPage.items.length === pageSize)
      );
      return hasMore ? allPages.length + 1 : void 0;
    },
    enabled: authReady,
    // ✅ يجبر إعادة الجلب دائماً عند دخول الصفحة، حتى لو كان هناك كاش
    refetchOnMount: "always",
    // تقليل staleTime لضمان رؤية المنشورات الجديدة بسرعة
    staleTime: 30 * 1e3,
    cacheTime: 30 * 60 * 1e3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    initialData,
    retry: 2,
    retryDelay: (attempt) => Math.min(1e3 * 2 ** attempt, 5e3),
    refetchInterval: (data) => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
      return data?.pages?.length === 1 ? pollingInterval : false;
    }
  });
  const posts = sortPostsNewestFirst(query.data?.pages.flatMap((page) => page.items || []) || []);
  const meta = query.data?.pages?.[0]?.meta || {};
  return {
    posts,
    meta,
    ...query,
    lastFetched: lastFetchRef.current
  };
}
const FEED_CACHE_PREFIX = "yamshat:feed:cache:v2";
const CACHE_TTL_MS = 1 * 60 * 1e3;
function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function buildCacheKey({ filterType = "all", sortBy = "recent", limit = 12 }) {
  return `${FEED_CACHE_PREFIX}:${filterType}:${sortBy}:${limit}`;
}
function loadCachedFeed(key) {
  if (typeof window === "undefined") return null;
  const parsed = safeParse(window.localStorage.getItem(key) || "null");
  if (!parsed?.timestamp || !parsed?.data) return null;
  if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
  return parsed.data;
}
function persistCachedFeed(key, data) {
  if (typeof window === "undefined" || !data?.pages?.length) return;
  const payload = {
    timestamp: Date.now(),
    data: {
      pages: data.pages.map((page) => ({
        items: Array.isArray(page?.items) ? page.items.slice(0, 24) : [],
        meta: page?.meta || {}
      })),
      pageParams: Array.isArray(data.pageParams) ? data.pageParams : [1]
    }
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}
function useSmartFeed(options = {}) {
  const {
    filterType = "all",
    sortBy = "recent",
    limit = 12,
    ...rest
  } = options;
  const cacheKey = reactExports.useMemo(
    () => buildCacheKey({ filterType, sortBy, limit }),
    [filterType, sortBy, limit]
  );
  const initialData = reactExports.useMemo(() => loadCachedFeed(cacheKey), [cacheKey]);
  const feed = useFeed({
    ...rest,
    filterType,
    sortBy,
    limit,
    initialData
  });
  reactExports.useEffect(() => {
    if (feed.data?.pages?.length) persistCachedFeed(cacheKey, feed.data);
  }, [cacheKey, feed.data]);
  return {
    ...feed,
    cacheKey,
    isHydratedFromCache: Boolean(initialData?.pages?.length)
  };
}
function timeAgoAr$1(dateLike) {
  return timeAgoAr$2(dateLike);
}
function isVideoMediaUrl$1(value = "", post = {}) {
  const candidate = String(value || "");
  return Boolean(
    post.has_video || post.is_reel || String(post.media_type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate)
  );
}
function buildBanner(post = {}) {
  const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls : [post.image_url || post.media_url || post.thumbnail_url || post.media].filter(Boolean);
  const firstMedia = rawMedia[0] || "";
  const resolved = resolveMediaUrl(firstMedia);
  if (!resolved || isVideoMediaUrl$1(resolved || firstMedia, post)) return null;
  return { type: "image", url: resolved };
}
function normalizePost(p, i) {
  const author = p.display_name || p.full_name || p.author_name || p.username || p.user || "مستخدم يام شات";
  const handle = (p.username || p.user || `user${i}`).toString();
  const verified = Boolean(p.verified || p.is_verified || p.official);
  const rawTime = p.created_at || p.published_at || null;
  return {
    id: p.id ?? `p-${i}`,
    rawId: p.id,
    /* ✅ v87.8 FIX: الاحتفاظ بـ user_id لاكتشاف الملكية بشكل موثوق
       (مقارنة username وحدها قد تفشل إذا لم يتم hydrate للـ session.username) */
    userId: p.user_id ?? p.author_id ?? p.userId ?? null,
    /* ✅ v48: تمرير username صريح لتمكين التوجيه إلى /profile/:username عند النقر */
    username: handle.replace(/^@/, ""),
    authorName: author,
    handle: `@${handle.replace(/^@/, "")}`,
    timeText: timeAgoAr$1(rawTime),
    rawTime,
    // ✅ لإعادة حساب الوقت لحظياً في بطاقة المنشور
    timeTitle: formatLocalDateTimeAr(rawTime),
    verified,
    avatarUrl: resolveMediaUrl(p.user_avatar || p.avatar || p.author_avatar || ""),
    text: p.content || p.text || "",
    banner: buildBanner(p),
    likes: Number(p.likes_count ?? p.like_count ?? p.likes ?? 0),
    comments: Number(p.comments_count ?? p.comment_count ?? p.comments ?? 0),
    reposts: Number(p.share_count ?? p.shares ?? p.reposts ?? 0),
    liked: Boolean(p.is_liked ?? p.liked_by_me ?? p.liked),
    reposted: Boolean(p.reposted ?? p.is_reposted),
    saved: Boolean(p.is_saved ?? p.saved_by_me ?? p.saved)
  };
}
function FeedMobile() {
  const [activeFilter, setActiveFilter] = reactExports.useState("all");
  const navigate = useNavigate();
  const [commentsPostId, setCommentsPostId] = reactExports.useState(null);
  const [moreMenuPost, setMoreMenuPost] = reactExports.useState(null);
  const [moreMenuBusy, setMoreMenuBusy] = reactExports.useState(false);
  const [moreMenuState, setMoreMenuState] = reactExports.useState({ following: false, muted: false, blocked: false });
  const [overlay, setOverlay] = reactExports.useState({});
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const session = useAppStore((s) => s.session);
  const smart = useSmartFeed?.({ filterType: activeFilter });
  const rawPosts = smart?.posts || smart?.data || smart?.items || [];
  const loading = smart?.isLoading || smart?.loading;
  smart?.error;
  reactExports.useEffect(() => {
    const handler = (e) => {
      const action = e?.detail?.action || null;
      const tab = action === "video" ? "reel" : action === "story" ? "story" : action === "image" ? "photo" : "post";
      navigate(`/compose?tab=${tab}`);
    };
    window.addEventListener("yamshat:open-composer", handler);
    const url = new URL(window.location.href);
    if (url.searchParams.get("compose") === "1" || /[?&]compose=1/.test(window.location.hash)) {
      try {
        url.searchParams.delete("compose");
        window.history.replaceState(null, "", url.toString());
      } catch {
      }
      navigate("/compose?tab=post");
    }
    return () => window.removeEventListener("yamshat:open-composer", handler);
  }, [navigate]);
  const posts = reactExports.useMemo(() => {
    const normalizedPosts = Array.isArray(rawPosts) && rawPosts.length ? rawPosts.map((p, i) => normalizePost(p, i)) : [];
    const allPosts = normalizedPosts;
    const dedupedMap = /* @__PURE__ */ new Map();
    allPosts.forEach((p) => {
      const key = String(p.id);
      if (!dedupedMap.has(key)) dedupedMap.set(key, p);
    });
    const combined = Array.from(dedupedMap.values());
    return combined.map((p) => {
      const o = overlay[p.id];
      return o ? { ...p, ...o } : p;
    });
  }, [rawPosts, overlay]);
  const filtered = reactExports.useMemo(() => {
    if (activeFilter === "all") return posts;
    if (activeFilter === "updates") {
      return posts.filter((p) => /تحديث|تطوير|إطلاق|جديد|update/i.test(p.text || ""));
    }
    if (activeFilter === "stories" || activeFilter === "story") {
      return posts.filter((p) => p.isStory || p.type === "story" || /#story|ستوري/i.test(p.text || ""));
    }
    if (activeFilter === "ads") return posts.filter((p) => /إعلان|عرض|خصم/.test(p.text || ""));
    if (activeFilter === "community") return posts.filter((p) => /مجتمع|عائلة|أعضاء|#/.test(p.text || ""));
    return posts;
  }, [activeFilter, posts]);
  const requireAuth = reactExports.useCallback(() => {
    if (!session) {
      pushToast?.({ type: "info", title: "يجب تسجيل الدخول", description: "لتتمكن من التفاعل مع المنشورات." });
      return false;
    }
    return true;
  }, [session, pushToast]);
  const setOverlayFor = reactExports.useCallback((id, patch) => {
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id] || {}, ...patch } }));
  }, []);
  const handleLike = reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newLiked = !post.liked;
    const newLikes = Math.max(0, Number(post.likes || 0) + (newLiked ? 1 : -1));
    setOverlayFor(post.id, { liked: newLiked, likes: newLikes });
    try {
      await likePost(post.rawId);
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (err) {
      console.error("Like failed", err);
      setOverlayFor(post.id, { liked: post.liked, likes: Number(post.likes || 0) });
      pushToast?.({ type: "error", title: "تعذر تنفيذ الإعجاب" });
    }
  }, [requireAuth, setOverlayFor, queryClient, pushToast]);
  const handleSave = reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newSaved = !post.saved;
    setOverlayFor(post.id, { saved: newSaved });
    try {
      await savePost(post.rawId);
      pushToast?.({ type: "success", title: newSaved ? "تم الحفظ" : "تمت إزالة الحفظ" });
    } catch (err) {
      console.error("Save failed", err);
      setOverlayFor(post.id, { saved: post.saved });
      pushToast?.({ type: "error", title: "تعذر حفظ المنشور" });
    }
  }, [requireAuth, setOverlayFor, pushToast]);
  const handleShare = reactExports.useCallback(async (post) => {
    const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
    const shareData = {
      title: post.authorName,
      text: post.text?.slice(0, 200) || "منشور على يام شات",
      url: postUrl
    };
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        pushToast?.({ type: "success", title: "تم نسخ رابط المنشور" });
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        pushToast?.({ type: "info", title: "تم إلغاء المشاركة" });
      }
    }
    if (succeeded && post.rawId) {
      try {
        await sharePost(post.rawId, navigator.share ? "native" : "copy");
        const newReposts = Number(post.reposts || 0) + 1;
        setOverlayFor(post.id, { reposts: newReposts });
        queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      } catch (err) {
        console.warn("share tracking failed", err);
      }
    }
  }, [pushToast, setOverlayFor, queryClient]);
  reactExports.useCallback(async (post) => {
    if (!post?.rawId) return;
    if (!requireAuth()) return;
    const newReposted = !post.reposted;
    const newReposts = Math.max(0, Number(post.reposts || 0) + (newReposted ? 1 : -1));
    setOverlayFor(post.id, { reposted: newReposted, reposts: newReposts });
    try {
      await sharePost(post.rawId, "repost");
      pushToast?.({ type: "success", title: newReposted ? "تمت إعادة النشر" : "تم إلغاء إعادة النشر" });
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (err) {
      console.error("Repost failed", err);
      setOverlayFor(post.id, { reposted: post.reposted, reposts: Number(post.reposts || 0) });
      pushToast?.({ type: "error", title: "تعذر إعادة النشر" });
    }
  }, [requireAuth, setOverlayFor, pushToast, queryClient]);
  const handleComment = reactExports.useCallback((post) => {
    if (!post?.rawId) {
      pushToast?.({ type: "info", title: "لا يمكن التعليق على المنشور الترحيبي" });
      return;
    }
    setCommentsPostId(post.rawId);
  }, [pushToast]);
  const handleMore = reactExports.useCallback((post) => {
    setMoreMenuPost(post);
    setMoreMenuState({
      following: Boolean(post?.following),
      muted: Boolean(post?.muted),
      blocked: Boolean(post?.blocked_by_me)
    });
  }, []);
  const closeMoreMenu = reactExports.useCallback(() => {
    setMoreMenuPost(null);
    setMoreMenuBusy(false);
  }, []);
  const handleMenuFollow = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      const response = await followUser(username);
      const nextFollowing = Boolean(response?.data?.following ?? !moreMenuState.following);
      setMoreMenuState((prev) => ({ ...prev, following: nextFollowing }));
      pushToast?.({ type: "success", title: nextFollowing ? "تمت المتابعة" : "تم إلغاء المتابعة" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث المتابعة", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.following, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuMute = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.muted) await unmuteUser(username);
      else await muteUser(username);
      const nextMuted = !moreMenuState.muted;
      setMoreMenuState((prev) => ({ ...prev, muted: nextMuted }));
      pushToast?.({ type: "success", title: nextMuted ? "تم الكتم" : "تم إلغاء الكتم" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث الكتم", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.muted, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuBlock = reactExports.useCallback(async () => {
    if (!moreMenuPost) return;
    const username = String(moreMenuPost.handle || "").replace(/^@/, "");
    if (!username || !requireAuth()) return;
    setMoreMenuBusy(true);
    try {
      if (moreMenuState.blocked) await unblockUserApi(username);
      else await blockUserApi(username);
      const nextBlocked = !moreMenuState.blocked;
      setMoreMenuState((prev) => ({ ...prev, blocked: nextBlocked }));
      pushToast?.({ type: "success", title: nextBlocked ? "تم الحظر" : "تم إلغاء الحظر" });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر تحديث الحظر", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, moreMenuState.blocked, requireAuth, pushToast, closeMoreMenu]);
  const handleMenuReport = reactExports.useCallback(() => {
    if (!moreMenuPost) return;
    try {
      const key = "yamshat:report-post";
      const event = new CustomEvent(key, { detail: { postId: moreMenuPost.rawId, authorHandle: moreMenuPost.handle } });
      window.dispatchEvent(event);
      closeMoreMenu();
    } catch (err) {
      console.error("Report error:", err);
    }
  }, [moreMenuPost, closeMoreMenu]);
  const handleMenuDeleteOwnPost = reactExports.useCallback(async () => {
    if (!moreMenuPost?.rawId) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا المنشور؟")) return;
    setMoreMenuBusy(true);
    try {
      await deletePost(moreMenuPost.rawId);
      pushToast?.({ type: "success", title: "تم حذف المنشور" });
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر حذف المنشور", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, pushToast, queryClient, closeMoreMenu]);
  const handleMenuEditOwnPost = reactExports.useCallback(async () => {
    if (!moreMenuPost?.rawId) return;
    const currentText = String(moreMenuPost.text || moreMenuPost.content || "");
    const newText = window.prompt("تعديل المنشور:", currentText);
    if (newText === null) return;
    const trimmed = newText.trim();
    if (trimmed === currentText.trim()) {
      closeMoreMenu();
      return;
    }
    setMoreMenuBusy(true);
    try {
      await updatePost(moreMenuPost.rawId, { content: trimmed });
      pushToast?.({ type: "success", title: "تم حفظ التعديل" });
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      closeMoreMenu();
    } catch (error2) {
      pushToast?.({ type: "error", title: "تعذر حفظ التعديل", description: error2?.response?.data?.detail || error2?.message });
      setMoreMenuBusy(false);
    }
  }, [moreMenuPost, pushToast, queryClient, closeMoreMenu]);
  const isOwnMoreMenuPost = (() => {
    if (!moreMenuPost) return false;
    const sessionId = session?.id ?? session?.user_id ?? session?.userId ?? null;
    const postUserId = moreMenuPost.userId ?? moreMenuPost.user_id ?? null;
    if (sessionId != null && postUserId != null) {
      if (String(sessionId) === String(postUserId)) return true;
    }
    const myUsername = String(session?.username || session?.user || "").trim().toLowerCase().replace(/^@/, "");
    if (!myUsername) return false;
    const postUsername = String(
      moreMenuPost.username || (moreMenuPost.handle || "").replace(/^@/, "") || ""
    ).trim().toLowerCase();
    return Boolean(postUsername) && postUsername === myUsername;
  })();
  reactExports.useCallback((action = null) => {
    const tab = action === "image" ? "photo" : action === "video" ? "reel" : action === "gif" ? "post" : action === "emoji" ? "post" : "post";
    navigate(`/compose?tab=${tab}`);
  }, [navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "yam-home-mobile-page",
        dir: "rtl",
        role: "region",
        "aria-label": "الصفحة الرئيسية",
        style: {
          fontFamily: "'Noto Sans Arabic','Tajawal','Cairo',sans-serif",
          /* ⭐ v75 — inline guard: يفوز على أي CSS خارجي */
          display: "block",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          marginLeft: 0,
          marginRight: 0,
          marginInlineStart: 0,
          marginInlineEnd: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingInlineStart: 0,
          paddingInlineEnd: 0,
          boxSizing: "border-box",
          direction: "rtl",
          textAlign: "right"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-home-searchbar", role: "search", "aria-label": "البحث في يام شات", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "ym-home-searchbar__btn",
              onClick: () => navigate("/search"),
              "aria-label": "ابحث عن منشور أو صديق",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "ym-home-searchbar__icon", viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "7", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 20 L16.2 16.2", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ym-home-searchbar__placeholder", children: "ابحث عن منشور أو صديق" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-feed", children: filtered.map((post) => {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              MobilePostCard$1,
              {
                post,
                onLike: handleLike,
                onComment: handleComment,
                onShare: handleShare,
                onSave: handleSave,
                onMore: handleMore
              },
              post.id
            );
          }) }),
          !loading && filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-empty", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "icon", children: "📭" }),
            "لا توجد منشورات في هذا التصنيف بعد."
          ] }) : null
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MobileCommentsSheet$1,
      {
        open: Boolean(commentsPostId),
        postId: commentsPostId,
        onClose: () => setCommentsPostId(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: Boolean(moreMenuPost), onClose: closeMoreMenu, title: "خيارات المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-modal-stack", children: [
      !isOwnMoreMenuPost ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab active", onClick: handleMenuFollow, disabled: moreMenuBusy, children: moreMenuState.following ? "إلغاء المتابعة" : "متابعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuMute, disabled: moreMenuBusy, children: moreMenuState.muted ? "إلغاء الكتم" : "كتم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuBlock, disabled: moreMenuBusy, children: moreMenuState.blocked ? "إلغاء الحظر" : "حظر" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab active", onClick: handleMenuEditOwnPost, disabled: moreMenuBusy, children: "تعديل المنشور" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuDeleteOwnPost, disabled: moreMenuBusy, children: "حذف المنشور" })
      ] }),
      !isOwnMoreMenuPost ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "profile-tab", onClick: handleMenuReport, disabled: moreMenuBusy, children: "بلاغ" }) : null
    ] }) })
  ] });
}
const FeedMobile$1 = reactExports.memo(FeedMobile);
const iconStyles = {
  width: "1em",
  height: "1em",
  display: "block"
};
function Path({ d, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d, fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", ...props });
}
function YamshatIcon({ name, size = 20, filled = false }) {
  const props = {
    viewBox: "0 0 24 24",
    style: { ...iconStyles, width: size, height: size },
    "aria-hidden": true
  };
  switch (name) {
    case "home":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4 10.5 12 4l8 6.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M6.5 9.8V20h11V9.8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9.5 20v-5.5h5V20" })
      ] });
    case "discover":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M13.6 10.4 17 7l-3.4 3.4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "m8.4 15.6 7.2-7.2-2.4 6-6 2.4Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 3.5a8.5 8.5 0 1 0 8.5 8.5" })
      ] });
    case "users":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M3.5 19c1.1-2.4 3-3.6 5.7-3.6S13.8 16.6 15 19" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M14.4 17.8c.7-1.3 1.8-2 3.4-2 1.3 0 2.3.5 3.2 1.7" })
      ] });
    case "bell":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M6.5 16.5h11l-1.2-1.7V10a4.3 4.3 0 0 0-8.6 0v4.8L6.5 16.5Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M10 18.5a2 2 0 0 0 4 0" })
      ] });
    case "message":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v9H9l-4 3v-3H5z" }) });
    case "bookmark":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 4.5h10V20l-5-3-5 3V4.5Z" }) });
    case "live":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3.2", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5.5 8.5a7.5 7.5 0 0 0 0 7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M18.5 8.5a7.5 7.5 0 0 1 0 7" })
      ] });
    case "groups":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 7h14" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 12h10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 17h7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M18 12v5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M15.5 14.5h5" })
      ] });
    case "clips":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 5.5h8.5A3.5 3.5 0 0 1 19 9v6.5A3.5 3.5 0 0 1 15.5 19H9A3.5 3.5 0 0 1 5.5 15.5V7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9 3v7" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12.5 3v4" })
      ] });
    case "forum":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v8H9l-4 3v-3H5z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M9 10h6" })
      ] });
    case "menu":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 7h15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 12h15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M4.5 17h15" })
      ] });
    case "plus":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 5v14" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 12h14" })
      ] });
    case "search":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "m20 20-4-4" })
      ] });
    case "moon":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M16.5 4.8A7.7 7.7 0 1 0 19 18.5 8.5 8.5 0 0 1 16.5 4.8Z" }) });
    case "more":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "6", cy: "12", r: "1.3", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "1.3", fill: "currentColor" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "12", r: "1.3", fill: "currentColor" })
      ] });
    case "heart":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 19s-6.5-3.8-8-7.5C2.7 8.8 4.4 6 7.2 6c1.8 0 3 1 3.8 2 0.8-1 2-2 3.8-2 2.8 0 4.5 2.8 3.2 5.5C18.5 15.2 12 19 12 19Z" }) });
    case "comment":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 6.5h14v9H9l-4 3v-3H5z" }) });
    case "repeat":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 7h9l-2.5-2.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M17 17H8l2.5 2.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M17 7v4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M7 17v-4" })
      ] });
    case "play":
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 7.5v9l7-4.5-7-4.5Z", fill: filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }) });
    case "profile":
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ...props, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Path, { d: "M5 19c1.4-2.7 3.7-4 7-4s5.6 1.3 7 4" })
      ] });
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "7", fill: "none", stroke: "currentColor", strokeWidth: "1.9" }) });
  }
}
const STORAGE_KEY = "yamshat_video_settings_v1";
const DEFAULTS = {
  muted: true,
  // start muted to satisfy autoplay policies
  defaultVolume: 1,
  preferredQuality: "auto",
  // 'auto' | 'low' | 'medium' | 'high'
  autoplay: true,
  preloadStrategy: "metadata"
  // 'none' | 'metadata' | 'auto'
};
function readSettings() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
function writeSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
  }
}
let hlsModulePromise = null;
async function loadHls() {
  if (typeof window === "undefined") return null;
  if (window.Hls) return window.Hls;
  if (hlsModulePromise) return hlsModulePromise;
  hlsModulePromise = __vitePreload(() => import(
    /* @vite-ignore */
    "./hls-UO_B3WO7.js"
  ), true ? [] : void 0).then((m) => m?.default || m?.Hls || null).catch(() => null);
  return hlsModulePromise;
}
function isHlsSource(src = "") {
  return /\.m3u8($|\?)/i.test(String(src || ""));
}
class VideoEngine {
  constructor() {
    this.settings = readSettings();
    this.activeVideo = null;
    this.hlsInstances = /* @__PURE__ */ new WeakMap();
    this.listeners = /* @__PURE__ */ new Set();
    this.preloadCache = /* @__PURE__ */ new Map();
  }
  getSettings() {
    return { ...this.settings };
  }
  updateSettings(patch = {}) {
    this.settings = { ...this.settings, ...patch };
    writeSettings(this.settings);
    this._notify();
  }
  subscribe(fn) {
    if (typeof fn !== "function") return () => {
    };
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  _notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.getSettings());
      } catch {
      }
    }
  }
  /**
   * Attach a <video> element to a source (HLS or progressive).
   * Returns a cleanup function.
   */
  async attach(videoEl, src) {
    if (!videoEl || !src) return () => {
    };
    this.detach(videoEl);
    if (isHlsSource(src)) {
      const Hls = await loadHls();
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          lowLatencyMode: false,
          enableWorker: true
        });
        hls.loadSource(src);
        hls.attachMedia(videoEl);
        this.hlsInstances.set(videoEl, hls);
      } else if (videoEl.canPlayType && videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = src;
      } else {
        videoEl.src = src;
      }
    } else {
      videoEl.src = src;
    }
    return () => this.detach(videoEl);
  }
  detach(videoEl) {
    if (!videoEl) return;
    const hls = this.hlsInstances.get(videoEl);
    if (hls) {
      try {
        hls.destroy();
      } catch {
      }
      this.hlsInstances.delete(videoEl);
    }
  }
  /**
   * Only one video can be "active" at a time — pauses everyone else.
   */
  setActive(videoEl) {
    if (this.activeVideo && this.activeVideo !== videoEl) {
      try {
        this.activeVideo.pause();
      } catch {
      }
    }
    this.activeVideo = videoEl;
  }
  clearActive(videoEl) {
    if (this.activeVideo === videoEl) this.activeVideo = null;
  }
  pauseAll() {
    if (this.activeVideo) {
      try {
        this.activeVideo.pause();
      } catch {
      }
    }
    this.activeVideo = null;
  }
  /**
   * Preload metadata for an upcoming source (used by reels).
   */
  preload(src) {
    if (!src || this.preloadCache.has(src)) return;
    try {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = src;
      this.preloadCache.set(src, v);
      setTimeout(() => {
        try {
          v.removeAttribute("src");
          v.load();
        } catch {
        }
        this.preloadCache.delete(src);
      }, 3e4);
    } catch {
    }
  }
}
new VideoEngine();
function ScrollToTopFab({ threshold = 600, targetSelector = null }) {
  const [visible, setVisible] = reactExports.useState(false);
  const getScrollContainer = reactExports.useCallback(() => {
    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) return el;
    }
    return window;
  }, [targetSelector]);
  reactExports.useEffect(() => {
    const container = getScrollContainer();
    const isWindow = container === window;
    const handleScroll = () => {
      const y = isWindow ? window.scrollY || document.documentElement.scrollTop || 0 : container.scrollTop || 0;
      setVisible(y > threshold);
    };
    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [getScrollContainer, threshold]);
  const handleClick = reactExports.useCallback(() => {
    const container = getScrollContainer();
    try {
      if (container === window) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      if (container === window) window.scrollTo(0, 0);
      else container.scrollTop = 0;
    }
  }, [getScrollContainer]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: `yam-scroll-top-fab ${visible ? "is-visible" : ""}`,
        onClick: handleClick,
        "aria-label": "العودة إلى الأعلى",
        title: "العودة إلى الأعلى",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 19V5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 12l7-7 7 7" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-scroll-top-fab {
          position: fixed;
          bottom: 96px;
          inset-inline-start: 18px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid rgba(139, 92, 246, 0.45);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(99, 102, 241, 0.95));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35), 0 2px 6px rgba(0, 0, 0, 0.25);
          opacity: 0;
          transform: translateY(20px) scale(0.85);
          pointer-events: none;
          transition: opacity .22s ease, transform .22s ease, box-shadow .22s ease;
          z-index: 60;
        }
        .yam-scroll-top-fab.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .yam-scroll-top-fab:hover {
          box-shadow: 0 14px 36px rgba(99, 102, 241, 0.5);
          transform: translateY(-2px) scale(1.04);
        }
        .yam-scroll-top-fab:active {
          transform: translateY(0) scale(0.96);
        }
        @media (min-width: 1024px) {
          .yam-scroll-top-fab {
            bottom: 28px;
            inset-inline-start: 28px;
            width: 50px;
            height: 50px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .yam-scroll-top-fab {
            transition: opacity .2s ease;
            transform: none !important;
          }
        }
      ` })
  ] });
}
const FEED_TABS = [
  { id: "following", label: "متابعين" },
  { id: "friends", label: "الأصدقاء" },
  { id: "groups", label: "المجموعات" },
  { id: "favorites", label: "المفضلة" },
  { id: "all", label: "الكل" }
];
const NAV_ITEMS = [
  { to: "/", label: "الرئيسية", icon: "home", exact: true },
  { to: "/reels", label: "الريلز", icon: "clips" },
  { to: "/groups", label: "المجموعات", icon: "groups" },
  { to: "/stories", label: "الستوري", icon: "bookmark" },
  { to: "/inbox", label: "الدردشة", icon: "message" },
  { to: "/notifications", label: "الإشعارات", icon: "bell" },
  { to: "/search", label: "البحث الذكي", icon: "search" },
  { to: "/settings", label: "الإعدادات", icon: "menu" }
];
const QUICK_ACTIONS = [
  { label: "صورة", color: "green", action: "image" },
  { label: "فيديو", color: "violet", action: "video" },
  { label: "رأيك", color: "rose", action: "thought" }
];
const DEFAULT_PROFILE_HIGHLIGHTS = [
  { label: "جديد", kind: "add" }
];
function timeAgoAr(dateLike) {
  return timeAgoAr$2(dateLike);
}
function normalizeHandle(value = "") {
  const cleaned = String(value || "").trim().replace(/^@+/, "");
  return cleaned ? `@${cleaned}` : "@yamshat";
}
function isVideoMediaUrl(value = "", options = {}) {
  const candidate = String(value || "");
  if (options.forceVideo) return true;
  return /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i.test(candidate) || /\b(video|reel|stream)\b/i.test(candidate);
}
function stripFirstUrl(value = "") {
  return String(value || "").replace(/\s*https?:\/\/[^\s]+/i, "").trim();
}
function buildFeedPosts(posts = []) {
  if (Array.isArray(posts) && posts.length) {
    return posts.map((post, index) => {
      const rawMedia = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls : [
        post.media_url,
        post.image_url,
        post.thumbnail_url,
        post.cover_url,
        post.preview_url
      ].filter(Boolean);
      const dedupedMedia = Array.from(new Set(rawMedia.map((u) => String(u || "").trim()).filter(Boolean)));
      const normalizedMedia = dedupedMedia.slice(0, 3).map((url, mediaIndex) => {
        const resolvedUrl = resolveMediaUrl(url);
        const isVideo = isVideoMediaUrl(resolvedUrl || url, {
          forceVideo: Boolean(post.has_video || post.is_reel || post.type === "video" || post.media_type === "video")
        });
        return {
          type: isVideo ? "video" : mediaIndex === 0 ? "image-primary" : "image-secondary",
          kind: isVideo ? "video" : "image",
          url: resolvedUrl
        };
      });
      const sourceTime = post.created_at || post.published_at || null;
      return {
        id: post.id || `post-${index}`,
        rawId: post.id || null,
        // المعرف الحقيقي للمنشور من الـ backend (null للمنشورات الترحيبية)
        userId: post.user_id || null,
        rawUsername: post.username || post.user || "",
        // ✅ FIX (v48): الأولوية للاسم المعروض الديناميكي من الـ backend (display_name/full_name/author_name)
        // حتى يتحدث الاسم في كل المنشورات فور تغييره في الملف الشخصي.
        authorName: post.display_name || post.full_name || post.author_name || post.username || post.user || "مستخدم يام شات",
        authorAvatar: resolveMediaUrl(post.user_avatar || post.avatar || post.author_avatar || ""),
        handle: normalizeHandle(post.username || post.user || `user.${index + 1}`),
        time: timeAgoAr(sourceTime),
        rawTime: sourceTime,
        // ✅ نحتفظ بالقيمة الخام لإعادة الحساب لحظياً كل 30 ثانية
        timeTitle: formatLocalDateTimeAr(sourceTime),
        // ✅ تاريخ كامل بتوقيت الجهاز للـ tooltip
        text: stripFirstUrl(post.content || post.text || ""),
        rawText: post.content || post.text || "",
        likes: Number(post.likes_count || post.like_count || post.likes || 0),
        comments: Number(post.comments_count || post.comment_count || 0),
        shares: Number(post.share_count || post.shares || 0),
        views: Number(post.views_count || post.view_count || 0),
        isLiked: Boolean(post.is_liked ?? post.liked_by_me),
        isSaved: Boolean(post.is_saved ?? post.saved_by_me),
        media: normalizedMedia
      };
    });
  }
  return [];
}
function Avatar({ name, size = 46, accent = false, image = false, src = "" }) {
  const firstLetter = String(name || "Y").trim().charAt(0) || "Y";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `yam-laptop-avatar ${accent ? "accent" : ""} ${image ? "image" : ""}`,
      style: { width: size, height: size, minWidth: size, minHeight: size },
      "aria-hidden": "true",
      children: src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: firstLetter })
    }
  );
}
function MediaTile({ item, index }) {
  const [renderAsVideo, setRenderAsVideo] = reactExports.useState(item?.kind === "video");
  const videoRef = reactExports.useRef(null);
  const tileRef = reactExports.useRef(null);
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setRenderAsVideo(item?.kind === "video");
  }, [item?.kind, item?.url]);
  reactExports.useEffect(() => {
    if (!renderAsVideo) return void 0;
    const node = tileRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return void 0;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6);
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [renderAsVideo, item?.url]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (!video) return void 0;
    if (isVisible) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
        });
      }
    } else {
      video.pause();
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      try {
        video.pause();
      } catch (_) {
      }
    };
  }, [isVisible, item?.url]);
  if (item?.url) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: tileRef, className: `yam-post-media-tile tile-${index}`, children: [
      renderAsVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          ref: videoRef,
          src: item.url,
          className: "yam-post-media-video",
          muted: true,
          loop: true,
          playsInline: true,
          preload: "metadata",
          controls: true
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.url, alt: "post media", className: "yam-post-media-image", onError: () => setRenderAsVideo(true) }),
      index === 0 && renderAsVideo && !isVisible ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-play-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "play", size: 24, filled: true }) }) : null
    ] });
  }
  return null;
}
function PostCard({ post }) {
  useNavigate();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const postUrl = `${window.location.origin}/#/post/${post.rawId || post.id}`;
  const mediaItems = Array.isArray(post.media) ? post.media.slice(0, 3) : [];
  const [liked, setLiked] = reactExports.useState(Boolean(post.isLiked));
  const [saved, setSaved] = reactExports.useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = reactExports.useState(Number(post.likes || 0));
  const [commentsCount, setCommentsCount] = reactExports.useState(Number(post.comments || 0));
  const [sharesCount, setSharesCount] = reactExports.useState(Number(post.shares || 0));
  const [showComments, setShowComments] = reactExports.useState(false);
  const [commentDraft, setCommentDraft] = reactExports.useState("");
  const [localComments, setLocalComments] = reactExports.useState([]);
  const [commentsLoaded, setCommentsLoaded] = reactExports.useState(false);
  const [commentsLoading, setCommentsLoading] = reactExports.useState(false);
  const [sendingComment, setSendingComment] = reactExports.useState(false);
  const [busyAction, setBusyAction] = reactExports.useState(null);
  const [showMoreMenu, setShowMoreMenu] = reactExports.useState(false);
  const [isFollowing, setIsFollowing] = reactExports.useState(false);
  const [isMuted, setIsMuted] = reactExports.useState(false);
  const [isBlocked, setIsBlocked] = reactExports.useState(false);
  const [isDeleted, setIsDeleted] = reactExports.useState(false);
  const [liveTimeAgo, setLiveTimeAgo] = reactExports.useState(() => timeAgoAr$2(post.rawTime || post.time));
  reactExports.useEffect(() => {
    setLiveTimeAgo(timeAgoAr$2(post.rawTime || post.time));
    if (!post.rawTime) return void 0;
    const id = setInterval(() => {
      setLiveTimeAgo(timeAgoAr$2(post.rawTime));
    }, 30 * 1e3);
    return () => clearInterval(id);
  }, [post.rawTime, post.time]);
  const authorUsername = String(post.rawUsername || post.handle || "").replace(/^@/, "");
  const currentUsername = getCurrentUsername();
  const isOwnPost = Boolean(authorUsername && currentUsername && authorUsername === currentUsername);
  const canCallBackend = Boolean(post.rawId);
  const invalidateFeed = reactExports.useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: ["feed-data"] });
    } catch (_) {
    }
  }, [queryClient]);
  const handleLike = async () => {
    if (busyAction === "like") return;
    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    if (!canCallBackend) return;
    setBusyAction("like");
    try {
      const response = await likePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_liked === "boolean") setLiked(data.is_liked);
      if (typeof data.likes_count === "number") setLikesCount(data.likes_count);
      else if (typeof data.like_count === "number") setLikesCount(data.like_count);
      invalidateFeed();
    } catch (error) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      pushToast({ type: "error", title: "تعذر تنفيذ الإعجاب", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };
  const handleShare = async () => {
    if (busyAction === "share") return;
    let platform = "copy";
    let succeeded = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.authorName, text: post.text, url: postUrl });
        platform = "native";
        succeeded = true;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        platform = "copy";
        succeeded = true;
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        pushToast({ type: "info", title: "تعذر فتح نافذة المشاركة" });
      }
      return;
    }
    if (!succeeded) return;
    setSharesCount((count) => count + 1);
    pushToast({ type: "success", title: "تمت مشاركة المنشور" });
    if (!canCallBackend) return;
    setBusyAction("share");
    try {
      const response = await sharePost(post.rawId, platform);
      const data = response?.data || {};
      if (typeof data.share_count === "number") setSharesCount(data.share_count);
      else if (typeof data.shares === "number") setSharesCount(data.shares);
      invalidateFeed();
    } catch (error) {
      console.warn("share tracking failed", error);
    } finally {
      setBusyAction(null);
    }
  };
  const handleSave = async () => {
    if (busyAction === "save") return;
    const prevSaved = saved;
    const nextSaved = !prevSaved;
    setSaved(nextSaved);
    if (!canCallBackend) {
      pushToast({ type: "success", title: nextSaved ? "تم حفظ المنشور" : "تمت إزالة المنشور من المحفوظات" });
      return;
    }
    setBusyAction("save");
    try {
      const response = await savePost(post.rawId);
      const data = response?.data || {};
      if (typeof data.is_saved === "boolean") setSaved(data.is_saved);
      pushToast({ type: "success", title: data.is_saved ?? nextSaved ? "تم حفظ المنشور" : "تمت إزالة المنشور من المحفوظات" });
      invalidateFeed();
    } catch (error) {
      setSaved(prevSaved);
      pushToast({ type: "error", title: "تعذر حفظ المنشور", description: error?.response?.data?.detail || error?.message });
    } finally {
      setBusyAction(null);
    }
  };
  const handleDeletePost = async () => {
    if (!isOwnPost || !canCallBackend) return;
    if (!window.confirm("هل تريد حذف هذا المنشور نهائيًا؟")) return;
    try {
      await deletePost(post.rawId);
      setIsDeleted(true);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: "تم حذف المنشور" });
      invalidateFeed();
    } catch (error) {
      pushToast({ type: "error", title: "تعذر حذف المنشور", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleEditPost = async () => {
    if (!isOwnPost || !canCallBackend) return;
    const currentText = String(post?.text || post?.content || "");
    const newText = window.prompt("تعديل المنشور:", currentText);
    if (newText === null) return;
    const trimmed = newText.trim();
    if (trimmed === currentText.trim()) {
      setShowMoreMenu(false);
      return;
    }
    try {
      await updatePost(post.rawId, { content: trimmed });
      setShowMoreMenu(false);
      pushToast({ type: "success", title: "تم حفظ التعديل" });
      invalidateFeed();
    } catch (error) {
      pushToast({ type: "error", title: "تعذر حفظ التعديل", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleMoreOptions = () => {
    setShowMoreMenu((prev) => !prev);
  };
  const handleFollowAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      const response = await followUser(authorUsername);
      const nextFollowing = Boolean(response?.data?.following ?? !isFollowing);
      setIsFollowing(nextFollowing);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextFollowing ? "تمت المتابعة" : "تم إلغاء المتابعة" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث المتابعة", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleMuteAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isMuted) await unmuteUser(authorUsername);
      else await muteUser(authorUsername);
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextMuted ? "تم الكتم" : "تم إلغاء الكتم" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث الكتم", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleBlockAuthor = async () => {
    if (!authorUsername || isOwnPost) return;
    try {
      if (isBlocked) await unblockUserApi(authorUsername);
      else await blockUserApi(authorUsername);
      const nextBlocked = !isBlocked;
      setIsBlocked(nextBlocked);
      setShowMoreMenu(false);
      pushToast({ type: "success", title: nextBlocked ? "تم الحظر" : "تم إلغاء الحظر" });
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحديث الحظر", description: error?.response?.data?.detail || error?.message });
    }
  };
  const handleReportPost = () => {
    try {
      const key = "yamshat_reported_posts";
      const current = JSON.parse(window.localStorage.getItem(key) || "[]");
      const next = Array.isArray(current) ? current : [];
      next.unshift({ id: post.id, username: authorUsername, created_at: (/* @__PURE__ */ new Date()).toISOString() });
      window.localStorage.setItem(key, JSON.stringify(next.slice(0, 100)));
    } catch {
    }
    setShowMoreMenu(false);
    pushToast({ type: "success", title: "تم إرسال البلاغ للمراجعة" });
  };
  const loadComments = reactExports.useCallback(async () => {
    if (!canCallBackend || commentsLoaded || commentsLoading) return;
    setCommentsLoading(true);
    try {
      const response = await getComments(post.rawId, { page: 1, limit: 20, sort_by: "newest" });
      const data = response?.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const mapped = items.map((item) => ({
        id: item.id,
        author: item.username || item.user || item.author_name || "مستخدم",
        content: item.content || item.text || ""
      }));
      setLocalComments(mapped);
      if (typeof data?.total === "number") setCommentsCount(data.total);
      else if (typeof data?.total_count === "number") setCommentsCount(data.total_count);
      setCommentsLoaded(true);
    } catch (error) {
      pushToast({ type: "error", title: "تعذر تحميل التعليقات", description: error?.response?.data?.detail || error?.message });
    } finally {
      setCommentsLoading(false);
    }
  }, [canCallBackend, commentsLoaded, commentsLoading, post.rawId, pushToast]);
  reactExports.useEffect(() => {
    if (showComments && !commentsLoaded && canCallBackend) {
      loadComments();
    }
  }, [showComments, commentsLoaded, canCallBackend, loadComments]);
  const handleAddComment = async () => {
    const content = commentDraft.trim();
    if (!content || sendingComment) return;
    if (!canCallBackend) {
      setLocalComments((prev) => [{ id: `${post.id}-${Date.now()}`, author: "أنت", content }, ...prev]);
      setCommentsCount((count) => count + 1);
      setCommentDraft("");
      if (!showComments) setShowComments(true);
      pushToast({ type: "success", title: "تمت إضافة التعليق" });
      return;
    }
    setSendingComment(true);
    const tempId = `temp-${Date.now()}`;
    const tempComment = { id: tempId, author: currentUsername || "أنت", content, pending: true };
    setLocalComments((prev) => [tempComment, ...prev]);
    setCommentsCount((count) => count + 1);
    setCommentDraft("");
    if (!showComments) setShowComments(true);
    try {
      const response = await addComment(post.rawId, content);
      const data = response?.data || {};
      const finalComment = {
        id: data.id || tempId,
        author: data.username || data.user || currentUsername || "أنت",
        content: data.content || content
      };
      setLocalComments((prev) => prev.map((c) => c.id === tempId ? finalComment : c));
      pushToast({ type: "success", title: "تمت إضافة التعليق" });
      invalidateFeed();
    } catch (error) {
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      setCommentsCount((count) => Math.max(0, count - 1));
      setCommentDraft(content);
      pushToast({ type: "error", title: "تعذر إرسال التعليق", description: error?.response?.data?.detail || error?.message });
    } finally {
      setSendingComment(false);
    }
  };
  if (isDeleted) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "yam-post-card-v2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-head-v2", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-v2 yam-post-author-v2-reversed", dir: "rtl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.authorName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-verified-badge", children: "✓" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-handle", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-post-handle-text", children: post.handle }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-post-handle-dot", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-post-handle-time", title: post.timeTitle || "", children: liveTimeAgo })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: post.authorName, size: 48, accent: Boolean(post.brandRing), image: true, src: post.authorAvatar })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-meta-v2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-menu-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-ghost-icon-btn", "aria-label": "خيارات المنشور", onClick: handleMoreOptions, title: "خيارات المنشور", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "more", size: 18 }) }),
        showMoreMenu ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-settings-popover", children: !isOwnPost ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item", onClick: handleFollowAuthor, children: isFollowing ? "إلغاء المتابعة" : "متابعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item", onClick: handleMuteAuthor, children: isMuted ? "إلغاء الكتم" : "كتم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleBlockAuthor, children: isBlocked ? "إلغاء الحظر" : "حظر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleReportPost, children: "بلاغ" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item", onClick: handleEditPost, children: "تعديل المنشور" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleDeletePost, children: "حذف المنشور" })
        ] }) }) : null
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-post-copy-v2", children: post.text }),
    mediaItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-post-media-grid-v2 media-count-${mediaItems.length}`, children: mediaItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(MediaTile, { item, index }, `${post.id}-media-${index}`)) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-actions-v2 yam-post-actions-compact", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: `yam-action-btn${liked ? " active" : ""}`,
          onClick: handleLike,
          disabled: busyAction === "like",
          "aria-label": liked ? `تم الإعجاب (${likesCount})` : `أعجبني (${likesCount})`,
          title: liked ? "تم الإعجاب" : "أعجبني",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "heart", size: 18 }),
            likesCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-action-count", children: likesCount }) : null
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: `yam-action-btn${showComments ? " active" : ""}`,
          onClick: () => setShowComments((prev) => !prev),
          "aria-label": `تعليق (${commentsCount})`,
          title: "تعليق",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "comment", size: 18 }),
            commentsCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-action-count", children: commentsCount }) : null
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "yam-action-btn",
          onClick: handleShare,
          disabled: busyAction === "share",
          "aria-label": `مشاركة (${sharesCount})`,
          title: "مشاركة",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "repeat", size: 18 }),
            sharesCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-action-count", children: sharesCount }) : null
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `yam-action-btn${saved ? " active" : ""}`,
          onClick: handleSave,
          disabled: busyAction === "save",
          "aria-label": saved ? "محفوظ" : "حفظ",
          title: saved ? "محفوظ" : "حفظ",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "bookmark", size: 18 })
        }
      )
    ] }),
    showComments ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comments-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comment-composer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: commentDraft,
            onChange: (event) => setCommentDraft(event.target.value),
            placeholder: "اكتب تعليقك هنا...",
            rows: 3,
            disabled: sendingComment
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-post-comment-send", onClick: handleAddComment, disabled: sendingComment || !commentDraft.trim(), children: sendingComment ? "جارٍ الإرسال..." : "إرسال التعليق" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-list", children: commentsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-empty", children: "جارٍ تحميل التعليقات..." }) : localComments.length ? localComments.map((comment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-comment-item", style: comment.pending ? { opacity: 0.6 } : void 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: comment.author }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: comment.content })
      ] }, comment.id)) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-comment-empty", children: "لا توجد تعليقات بعد، كن أول من يعلّق." }) })
    ] }) : null
  ] });
}
function FeedEnhanced() {
  const isMobile = useIsMobile();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    isMobile ? /* @__PURE__ */ jsxRuntimeExports.jsx(FeedMobile$1, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(FeedDesktopInner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollToTopFab, { threshold: 500 })
  ] });
}
function FeedDesktopInner() {
  const navigate = useNavigate();
  const centerStageRef = reactExports.useRef(null);
  const postStackRef = reactExports.useRef(null);
  const { pushToast } = useToast();
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const [activeTab, setActiveTab] = reactExports.useState("all");
  const [isSettingsOpen, setIsSettingsOpen] = reactExports.useState(false);
  const [loggingOut, setLoggingOut] = reactExports.useState(false);
  const profile = getStoredUserSnapshot();
  const profileDetails = profile?.profile || {};
  const username = getCurrentUsername() || profile?.username || profile?.user || "";
  const displayName = profileDetails.full_name || profile?.name || profile?.full_name || username || "مستخدم يام شات";
  const profileAvatar = resolveMediaUrl(profileDetails.avatar || profile?.avatar || profileDetails.avatar_url || profile?.avatar_url || "");
  const isVerified = Boolean(profile?.is_verified || profile?.verified || profileDetails.is_verified || profileDetails.verified);
  const followersCount = Number(profile?.followers_count || profileDetails.followers_count || profile?.followers || 0);
  const followingCount = Number(profile?.following_count || profileDetails.following_count || profile?.following || 0);
  const profileBio = [profileDetails.activity_tagline, profileDetails.bio, profileDetails.location || profile?.location].map((value) => String(value || "").trim()).filter(Boolean).join("\n") || "حدّث ملفك الشخصي ليظهر وصفك الحقيقي هنا.";
  const joinedAt = profile?.created_at || profileDetails.created_at || profileDetails.joined_at || "";
  const joinedLabel = joinedAt ? new Date(joinedAt).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "";
  const dynamicHighlightValues = Array.isArray(profileDetails.highlights) ? profileDetails.highlights : Array.isArray(profileDetails.interests) ? profileDetails.interests : [];
  const profileHighlights = [
    ...DEFAULT_PROFILE_HIGHLIGHTS,
    ...dynamicHighlightValues.filter(Boolean).slice(0, 4).map((item, index) => ({
      label: String(item).slice(0, 18),
      kind: ["travel", "design", "moments", "projects"][index % 4]
    }))
  ];
  const summaryItems = [
    profileDetails.profession ? { icon: "profile", text: profileDetails.profession } : null,
    profileDetails.company ? { icon: "groups", text: profileDetails.company } : null,
    profileDetails.location || profile?.location ? { icon: "discover", text: profileDetails.location || profile?.location } : null,
    joinedLabel ? { icon: "bookmark", text: `انضم في ${joinedLabel}` } : null
  ].filter(Boolean);
  const {
    posts = [],
    fetchNextPage,
    hasNextPage: hasNextPage2,
    isFetching,
    isFetchingNextPage
  } = useSmartFeed({
    filterType: activeTab === "all" ? "all" : "following",
    sortBy: "recent",
    limit: 12,
    pollingInterval: 25e3
  });
  const feedPosts = reactExports.useMemo(() => buildFeedPosts(posts), [posts]);
  const totalPosts = feedPosts.length;
  const profilePostsCount = Number(profile?.posts_count || profileDetails.posts_count || profileDetails.posts || profile?.posts || totalPosts || 0);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return void 0;
    const pageContent = document.querySelector(".page-content");
    if (!pageContent) return void 0;
    const mediaQuery = window.matchMedia("(min-width: 1141px)");
    const syncScrollMode = () => {
      pageContent.classList.toggle("yam-feed-page-locked", mediaQuery.matches);
    };
    syncScrollMode();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncScrollMode);
      return () => {
        pageContent.classList.remove("yam-feed-page-locked");
        mediaQuery.removeEventListener("change", syncScrollMode);
      };
    }
    mediaQuery.addListener(syncScrollMode);
    return () => {
      pageContent.classList.remove("yam-feed-page-locked");
      mediaQuery.removeListener(syncScrollMode);
    };
  }, []);
  reactExports.useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return void 0;
    const handleScroll = () => {
      if (!hasNextPage2 || isFetchingNextPage) return;
      const remainingDistance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (remainingDistance <= 320) fetchNextPage();
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage2, isFetchingNextPage]);
  reactExports.useEffect(() => {
    const scroller = centerStageRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);
  const handleQuickAction = (action) => {
    document.querySelector(".yam-home-composer-slot")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.dispatchEvent(new CustomEvent("yamshat:composer-action", { detail: { action } }));
  };
  const handleThemeToggle = () => {
    toggleTheme();
    pushToast({ type: "success", title: theme === "dark" ? "تم تفعيل الوضع النهاري" : "تم تفعيل الوضع الليلي" });
  };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: "POST",
        headers: {
          ...token ? { Authorization: `Bearer ${token}` } : {},
          ...csrfToken ? { "X-CSRF-Token": csrfToken } : {}
        },
        credentials: "include"
      });
    } catch {
    } finally {
      clearStoredUser();
      setIsSettingsOpen(false);
      setLoggingOut(false);
      redirectToAppPath("/login");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-laptop-page", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-page-noise" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-laptop-shell", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-left-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-logo-card", onClick: () => navigate("/"), style: { cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-logo-mark", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo192.png", alt: "Y", style: { width: "100%", height: "100%", objectFit: "contain" }, onError: (e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { display: "none" }, children: "Y" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-text", children: "YAMSHAT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-main-nav-desktop", children: NAV_ITEMS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          NavLink,
          {
            to: item.to,
            end: Boolean(item.exact),
            className: ({ isActive }) => `yam-nav-link-desktop ${isActive ? "active" : ""}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-link-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: item.icon, size: 18 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
              item.badge ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-link-badge", children: item.badge }) : null
            ]
          },
          item.to
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-rail-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-dark-toggle-row yam-action-surface", onClick: handleThemeToggle, "aria-label": "تبديل الوضع الليلي", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-dark-toggle-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "moon", size: 18 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوضع الليلي" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-dark-toggle-switch ${theme === "dark" ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-logout-btn-desktop", onClick: handleLogout, disabled: loggingOut, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "message", size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل خروج" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "yam-center-stage", ref: centerStageRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-feed-header-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-header-top", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "المنشورات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-brand", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo192.png", alt: "YAMSHAT", style: { height: "24px", marginRight: "8px", verticalAlign: "middle" }, onError: (e) => e.target.style.display = "none" }),
              "YAMSHAT"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-composer-prompt-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-composer-actions-inline", children: QUICK_ACTIONS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-mini-action ${item.color}`, onClick: () => handleQuickAction(item.action), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
            item.label
          ] }, item.label)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-home-composer-slot", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-feed-tabs", dir: "rtl", role: "tablist", children: FEED_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": activeTab === tab.id,
              className: `yam-feed-tab ${activeTab === tab.id ? "active" : ""}`,
              onClick: () => setActiveTab(tab.id),
              children: tab.label
            },
            tab.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-stack-v2", ref: postStackRef, children: [
          feedPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(PostCard, { post }, post.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-feed-status-row", children: isFetchingNextPage ? "جارٍ تحميل المنشورات الأقدم..." : hasNextPage2 ? "اسحب شريط التمرير لأسفل لإظهار منشورات أكثر." : isFetching && !feedPosts.length ? "جارٍ تحميل المنشورات..." : "تم عرض كل المنشورات الحالية." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-right-rail", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-profile-card-v2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-cover-v2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-cover-brand", children: "YAMSHAT" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-body-v2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-avatar-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: displayName, size: 96, accent: true, image: true, src: profileAvatar }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-avatar-camera-btn", "aria-label": "تغيير الصورة", onClick: () => navigate("/profile"), title: "الانتقال إلى الملف الشخصي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "profile", size: 16 }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-name-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: displayName }),
              isVerified ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-verified-badge", children: "✓" }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-profile-handle-v2", children: normalizeHandle(username || displayName) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-stats-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(profilePostsCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المنشورات" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(followersCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المتابعين" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCompactNumber(followingCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "يتابع" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-profile-bio-v2", children: profileBio }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-profile-actions-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-primary-action-btn", onClick: () => navigate("/profile"), children: "تعديل الملف الشخصي" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-menu-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-settings-icon-btn", onClick: () => setIsSettingsOpen((prev) => !prev), "aria-expanded": isSettingsOpen, "aria-label": "فتح إعدادات سريعة", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "menu", size: 18 }) }),
                isSettingsOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-settings-popover", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-popover-item", onClick: handleThemeToggle, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوضع الليلي" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `yam-dark-toggle-switch small ${theme === "dark" ? "active" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-settings-popover-item danger", onClick: handleLogout, disabled: loggingOut, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل خروج" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "message", size: 16 })
                  ] })
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-highlights-row-v2", children: profileHighlights.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-highlight-item-v2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-highlight-ring ${item.kind}`, children: item.kind === "add" ? /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: "plus", size: 18 }) : null }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
            ] }, item.label)) })
          ] })
        ] }),
        summaryItems.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-summary-card-v2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-section-title-row", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "معلومات مختصرة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-summary-list-v2", children: summaryItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-summary-row-v2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-summary-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YamshatIcon, { name: item.icon, size: 16 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.text })
          ] }, item.text)) })
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-laptop-page {
            position: relative;
            min-height: 100%;
            width: 100%;
            max-width: 100%;
            background:
              radial-gradient(circle at top right, rgba(121, 40, 202, 0.22), transparent 18%),
              radial-gradient(circle at top left, rgba(96, 165, 250, 0.10), transparent 16%),
              linear-gradient(180deg, #040815 0%, #070d1d 48%, #060913 100%);
            color: #f5f7ff;
            /* السماح بالتمرير العمودي الكامل على كل الأجهزة */
            overflow-x: hidden;
            overflow-y: visible;
          }

          .yam-page-noise {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(rgba(255,255,255,0.06) 0.5px, transparent 0.5px);
            background-size: 14px 14px;
            opacity: 0.14;
          }

          .yam-laptop-shell {
            position: relative;
            width: min(1800px, 100%);
            max-width: 100%;
            min-height: 100%;
            margin: 0 auto;
            padding: 20px 14px 32px;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 250px minmax(0, 1fr) 360px;
            gap: 18px;
            align-items: start;
            /* على الديسكتوب: نجعل الـ shell بالكامل يملأ الشاشة لتعمل آلية sticky بشكل صحيح */
            min-height: calc(100vh - 24px);
          }

          .yam-left-rail,
          .yam-center-stage,
          .yam-right-rail {
            min-width: 0;
          }

          .yam-left-rail,
          .yam-right-rail {
            position: sticky !important;
            top: 18px;
            align-self: start;
            /* الأشرطة الجانبية ثابتة عند التمرير ولها تمريرها الداخلي الخاص إذا طال محتواها */
            max-height: calc(100vh - 36px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
            z-index: 10;
            contain: layout style paint;
          }

          .yam-left-rail::-webkit-scrollbar,
          .yam-right-rail::-webkit-scrollbar {
            width: 6px;
          }

          .yam-left-rail::-webkit-scrollbar-thumb,
          .yam-right-rail::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 999px;
          }

          .yam-logo-card,
          .yam-feed-header-card,
          .yam-post-card-v2,
          .yam-profile-card-v2,
          .yam-summary-card-v2,
          .yam-main-nav-desktop,
          .yam-rail-footer {
            border: 1px solid rgba(255,255,255,0.07);
            background: linear-gradient(180deg, rgba(7, 12, 25, 0.96), rgba(6, 10, 20, 0.92));
            border-radius: 26px;
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.32);
            backdrop-filter: blur(22px);
          }

          .yam-left-rail {
            display: grid;
            gap: 16px;
          }

          /* على الجوال والتابلت، شيل القيود المتعلقة بالـ rail اليساري */
          @media (max-width: 1140px) {
            .yam-left-rail {
              max-height: none;
              overflow: visible;
            }
          }

          .yam-logo-card {
            min-height: 190px;
            display: grid;
            place-items: center;
            text-align: center;
            padding: 22px;
            background:
              radial-gradient(circle at 50% 15%, rgba(152, 62, 255, 0.32), transparent 38%),
              linear-gradient(180deg, rgba(11, 14, 35, 0.98), rgba(5, 10, 20, 0.98));
          }

          .yam-logo-mark {
            width: 84px;
            height: 84px;
            border-radius: 28px;
            display: grid;
            place-items: center;
            font-size: 46px;
            font-weight: 900;
            color: #dfc5ff;
            border: 1px solid rgba(178, 111, 255, 0.34);
            background: linear-gradient(180deg, rgba(119, 65, 245, 0.25), rgba(71, 27, 152, 0.1));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 40px rgba(103, 45, 221, 0.24);
          }

          .yam-logo-text {
            margin-top: 14px;
            letter-spacing: 0.24em;
            font-size: 15px;
            font-weight: 800;
            color: #e9ddff;
          }

          .yam-main-nav-desktop {
            padding: 14px;
            display: grid;
            gap: 8px;
          }

          .yam-nav-link-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 14px;
            color: #d7def6;
            transition: 0.22s ease;
            font-weight: 700;
          }

          .yam-nav-link-desktop:hover,
          .yam-nav-link-desktop.active {
            color: #fff;
            background: linear-gradient(90deg, rgba(114, 60, 240, 0.24), rgba(85, 73, 243, 0.08));
            box-shadow: var(--shadow-inset-soft);
          }

          .yam-nav-link-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(255,255,255,0.04);
            color: #bda8ff;
          }

          .yam-nav-link-badge {
            margin-inline-start: auto;
            min-width: 26px;
            height: 26px;
            padding: 0 8px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
          }

          .yam-rail-footer {
            padding: 14px;
            display: grid;
            gap: 12px;
          }

          .yam-dark-toggle-row,
          .yam-logout-btn-desktop {
            min-height: 52px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            background: rgba(255,255,255,0.03);
            color: #e5e7f8;
            border: 1px solid rgba(255,255,255,0.05);
          }

          .yam-action-surface {
            width: 100%;
            cursor: pointer;
          }

          .yam-dark-toggle-copy,
          .yam-logout-btn-desktop {
            font-weight: 700;
          }

          .yam-dark-toggle-copy {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-dark-toggle-switch {
            width: 48px;
            height: 28px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            padding: 3px;
            display: flex;
            align-items: center;
          }

          .yam-dark-toggle-switch span {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.26);
            transition: transform 0.2s ease;
          }

          .yam-dark-toggle-switch.active {
            justify-content: flex-end;
            background: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.9));
          }

          .yam-logout-btn-desktop {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.05);
            justify-content: center;
            cursor: pointer;
          }

          .yam-logout-btn-desktop:disabled {
            opacity: 0.7;
            cursor: wait;
          }

          .page-content.yam-feed-page-locked {
            overflow-y: hidden;
          }

          /* منطقة المنشورات المركزية: تأخذ ارتفاع كامل للشاشة وتسمح بالتمرير الداخلي للـ post-stack
             فقط، دون أن تؤثر على ثبات الأشرطة الجانبية */
          .yam-center-stage {
            position: sticky;
            top: 18px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 0;
            height: calc(100vh - 36px);
            max-height: calc(100vh - 36px);
            overflow-x: hidden;
            overflow-y: auto;
            align-self: start;
            direction: rtl;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.92) rgba(255,255,255,0.06);
            padding-inline-start: 4px;
            padding-inline-end: 10px;
            scroll-behavior: smooth;
            overscroll-behavior-y: contain;
          }

          .yam-center-stage > * {
            direction: rtl;
          }

          .yam-center-stage::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-center-stage::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-center-stage::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-center-stage::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }

          .yam-feed-header-card {
            position: relative;
            top: auto;
            z-index: 1;
            flex-shrink: 0;
            padding: 18px 20px 14px;
          }

          .yam-feed-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .yam-feed-header-top h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 900;
          }

          .yam-mobile-brand {
            display: none;
            font-size: 12px;
            letter-spacing: 0.22em;
            color: #bda8ff;
            font-weight: 800;
          }

          .yam-composer-prompt-bar {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            margin-bottom: 14px;
          }

          .yam-home-composer-slot {
            margin-bottom: 14px;
          }

          .yam-home-composer-slot > * {
            margin-bottom: 0 !important;
          }

          .yam-composer-actions-inline {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .yam-mini-action {
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            min-height: 44px;
            padding: 0 14px;
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            cursor: pointer;
          }

          .yam-mini-action:hover {
            background: rgba(139, 92, 246, 0.12);
            border-color: rgba(167, 139, 250, 0.24);
          }

          .yam-mini-action .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .yam-mini-action.green .dot { background: #22c55e; }
          .yam-mini-action.violet .dot { background: #8b5cf6; }
          .yam-mini-action.rose .dot { background: #f43f5e; }

          .yam-composer-input-surface {
            min-height: 52px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #95a0c7;
            font-weight: 600;
          }

          .yam-feed-tabs {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 2px;
            direction: rtl;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
          }

          .yam-feed-tabs::-webkit-scrollbar { display: none; }

          .yam-feed-tab {
            position: relative;
            background: transparent;
            border: none;
            color: #97a2c6;
            padding: 10px 0;
            font-weight: 700;
            white-space: nowrap;
          }

          .yam-feed-tab.active {
            color: #fff;
          }

          .yam-feed-tab.active::after {
            content: '';
            position: absolute;
            inset-inline: 0;
            bottom: 0;
            height: 3px;
            border-radius: 999px;
            background: linear-gradient(90deg, #8b5cf6, #d946ef);
          }

          .yam-post-stack-v2 {
            flex: 0 0 auto;
            min-height: min-content;
            position: relative;
            overflow: visible !important;
            display: grid;
            gap: 18px;
            direction: rtl;
            padding-inline-start: 0;
            padding-inline-end: 0;
            padding-bottom: 28px;
            border: 0;
            -webkit-overflow-scrolling: touch;
            contain: none;
          }


          .yam-post-stack-v2 > * {
            direction: rtl;
          }

          .yam-post-stack-v2::-webkit-scrollbar {
            width: 14px;
            -webkit-appearance: none;
          }

          .yam-post-stack-v2::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.06);
            border-radius: 999px;
            box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(139, 92, 246, 0.92), rgba(99, 102, 241, 0.88));
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .yam-post-stack-v2::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(167, 139, 250, 1), rgba(129, 140, 248, 1));
          }


          .yam-feed-status-row {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 54px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px dashed rgba(167, 139, 250, 0.22);
            background: rgba(139, 92, 246, 0.06);
            color: #c4b5fd;
            font-size: 13px;
            font-weight: 700;
          }

          .yam-post-card-v2 {
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-post-head-v2,
          .yam-post-author-v2,
          .yam-post-meta-v2,
          .yam-post-stats-v2,
          .yam-post-reactions-v2,
          .yam-post-actions-v2,
          .yam-profile-name-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .yam-post-head-v2,
          .yam-post-stats-v2,
          .yam-profile-actions-v2,
          .yam-section-title-row,
          .yam-summary-row-v2 {
            justify-content: space-between;
          }

          /* ✅ v51: جعل الاسم بجوار الصورة دون فجوة — إلغاء flex:1 وجعل العرض حسب المحتوى */
          .yam-post-author-v2-reversed {
            flex: 0 0 auto !important;
            min-width: 0;
            gap: 10px;
          }

          .yam-post-meta-v2 {
            color: #8894bd;
            font-size: 13px;
            flex-shrink: 0;
          }

          .yam-post-author-copy {
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .yam-post-author-line,
          .yam-profile-name-v2 {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-post-author-line strong,
          .yam-profile-name-v2 strong {
            font-size: 18px;
          }

          .yam-post-handle,
          .yam-profile-handle-v2 {
            color: #8f9cc5;
            font-size: 13px;
            margin-top: 2px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-wrap: nowrap;
          }

          /* ✅ v51: المعرّف + الفاصل + الوقت في سطر واحد تحت الاسم */
          .yam-post-handle .yam-post-handle-text {
            color: #8f9cc5;
          }
          .yam-post-handle .yam-post-handle-dot {
            color: #8f9cc5;
            opacity: 0.7;
          }
          .yam-post-handle .yam-post-handle-time {
            color: #8f9cc5;
          }

          .yam-verified-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            background: #3b82f6;
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            flex-shrink: 0;
          }

          .yam-ghost-icon-btn,
          .yam-settings-icon-btn {
            width: 38px;
            height: 38px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.04);
            color: #e8ebff;
            display: grid;
            place-items: center;
          }

          .yam-settings-menu-wrap {
            position: relative;
          }

          .yam-settings-popover {
            position: absolute;
            top: calc(100% + 10px);
            inset-inline-end: 0;
            width: min(260px, 72vw);
            padding: 10px;
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(8, 12, 26, 0.96);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.34);
            display: grid;
            gap: 8px;
            z-index: 20;
            backdrop-filter: blur(20px);
          }

          .yam-settings-popover-item {
            min-height: 48px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            color: #f3f4ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 0 14px;
            font-weight: 800;
          }

          .yam-settings-popover-item.danger {
            color: #fda4af;
          }

          .yam-dark-toggle-switch.small {
            width: 42px;
            height: 24px;
          }

          .yam-dark-toggle-switch.small span {
            width: 18px;
            height: 18px;
          }

          .yam-post-copy-v2 {
            margin: 0;
            color: #edf2ff;
            line-height: 1.9;
            white-space: pre-line;
            font-size: 15px;
          }

          .yam-post-media-grid-v2 {
            display: grid;
            grid-template-columns: 1.05fr 1.25fr 0.72fr;
            gap: 10px;
            min-height: 318px;
          }

          .yam-post-media-grid-v2.media-count-1 {
            grid-template-columns: 1fr;
            min-height: 320px;
          }

          .yam-post-media-grid-v2.media-count-2 {
            grid-template-columns: 1.1fr 0.9fr;
          }

          .yam-post-media-tile {
            position: relative;
            overflow: hidden;
            border-radius: 22px;
            min-height: 318px;
            background: linear-gradient(180deg, rgba(99,102,241,0.18), rgba(15,23,42,0.9));
          }

          .yam-post-media-grid-v2.media-count-3 .tile-2 {
            min-height: 318px;
          }

          .yam-post-media-image,
          .yam-post-media-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .yam-post-media-video {
            background: #000;
          }

          .yam-post-play-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.24));
          }

          .yam-post-play-overlay svg {
            width: 64px !important;
            height: 64px !important;
            padding: 18px;
            border-radius: 50%;
            color: #fff;
            background: rgba(255,255,255,0.16);
            backdrop-filter: blur(10px);
            box-shadow: 0 16px 35px rgba(0,0,0,0.32);
          }

          .scenic-video {
            background:
              linear-gradient(180deg, rgba(10,18,37,0.05), rgba(3,7,18,0.3)),
              radial-gradient(circle at 50% 35%, rgba(255,255,255,0.18), transparent 24%),
              linear-gradient(180deg, #4b5d7d 0%, #1b2740 44%, #0b1224 100%);
          }

          .scenic-lake {
            background:
              radial-gradient(circle at 65% 12%, rgba(255, 196, 148, 0.46), transparent 16%),
              linear-gradient(180deg, #8978ab 0%, #3f4d7c 30%, #173257 56%, #0a1730 100%);
          }

          .scenic-forest {
            background:
              linear-gradient(180deg, rgba(240,240,255,0.24), rgba(18,43,48,0.12) 28%, rgba(7,19,26,0.96) 100%),
              linear-gradient(180deg, #6c768f 0%, #253349 32%, #0f1f2b 100%);
          }

          .portrait-purple {
            background:
              radial-gradient(circle at 45% 30%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(120deg, #081021 12%, #3a065f 55%, #0d0f29 100%);
          }

          .yam-post-reactions-v2 {
            color: #ecf1ff;
            font-size: 14px;
            font-weight: 800;
          }

          .reaction-bubble {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-grid;
            place-items: center;
            font-size: 12px;
            margin-inline-end: -6px;
            border: 2px solid rgba(7,12,25,0.95);
          }

          .reaction-bubble.like { background: #fb7185; }
          .reaction-bubble.support { background: #60a5fa; }
          .reaction-bubble.wow { background: #818cf8; }

          .yam-post-numbers-v2 {
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 14px;
            color: #8994ba;
            font-size: 13px;
          }

          .yam-post-actions-v2 {
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .yam-post-actions-v2 button {
            border: none;
            background: transparent;
            color: #dce2f8;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: 12px;
            cursor: pointer;
          }

          .yam-post-actions-v2 button:hover,
          .yam-post-actions-v2 button.active {
            background: rgba(124,58,237,0.14);
            color: #fff;
          }

          .yam-post-comments-panel {
            display: grid;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }

          .yam-post-comment-composer {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-composer textarea {
            width: 100%;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #eef2ff;
            border-radius: 16px;
            padding: 14px;
            resize: vertical;
            min-height: 96px;
          }

          .yam-post-comment-send {
            justify-self: flex-start;
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(167,139,250,0.24);
            background: linear-gradient(135deg, rgba(124,58,237,0.92), rgba(99,102,241,0.92));
            color: white;
            padding: 0 16px;
            font-weight: 800;
          }

          .yam-post-comment-list {
            display: grid;
            gap: 10px;
          }

          .yam-post-comment-item,
          .yam-post-comment-empty {
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px 14px;
          }

          .yam-post-comment-item p {
            margin: 6px 0 0;
            color: #cbd5f5;
            line-height: 1.8;
          }

          .yam-post-comment-empty {
            color: #94a3b8;
          }

          .yam-right-rail {
            display: grid;
            gap: 18px;
            max-height: calc(100vh - 40px);
            overflow: auto;
            align-self: start;
          }

          .yam-profile-card-v2 {
            overflow: hidden;
          }

          .yam-profile-cover-v2 {
            min-height: 146px;
            padding: 18px;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background:
              radial-gradient(circle at 50% 0%, rgba(146, 71, 255, 0.34), transparent 34%),
              linear-gradient(180deg, #0f1230 0%, #0a0f21 100%);
          }

          .yam-profile-cover-brand {
            letter-spacing: 0.28em;
            color: #ede6ff;
            font-size: 14px;
            font-weight: 900;
            margin-top: 8px;
          }

          .yam-profile-body-v2 {
            position: relative;
            padding: 0 20px 20px;
            text-align: center;
          }

          .yam-profile-avatar-wrap {
            position: relative;
            width: fit-content;
            margin: -48px auto 12px;
          }

          .yam-avatar-camera-btn {
            position: absolute;
            inset-inline-end: 0;
            bottom: 4px;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(10,15,30,0.92);
            color: #fff;
            display: grid;
            place-items: center;
          }

          .yam-profile-stats-v2 {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            margin: 16px 0;
          }

          .yam-profile-stats-v2 div {
            display: grid;
            gap: 4px;
          }

          .yam-profile-stats-v2 strong {
            font-size: 24px;
          }

          .yam-profile-stats-v2 span,
          .yam-highlight-item-v2 span,
          .yam-summary-row-v2 span:last-child {
            color: #97a3ca;
            font-size: 13px;
          }

          .yam-profile-bio-v2 {
            margin: 0;
            color: #dbe3fc;
            line-height: 1.9;
            font-size: 14px;
          }

          .yam-primary-action-btn {
            flex: 1;
            min-height: 48px;
            border: none;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
            background: linear-gradient(135deg, #6d3cf0, #8b5cf6);
            box-shadow: 0 16px 34px rgba(109, 60, 240, 0.28);
          }

          .yam-highlights-row-v2 {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-top: 14px;
          }

          .yam-highlight-item-v2 {
            min-width: 64px;
            display: grid;
            justify-items: center;
            gap: 8px;
          }

          .yam-highlight-ring {
            width: 62px;
            height: 62px;
            border-radius: 50%;
            padding: 3px;
            display: grid;
            place-items: center;
            color: #fff;
            background: linear-gradient(135deg, #7c3aed, #d946ef);
          }

          .yam-highlight-ring::before {
            content: '';
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(180deg, #151a39, #090d1d);
            display: block;
          }

          .yam-highlight-ring.add {
            background: linear-gradient(135deg, #353f62, #1a2035);
            position: relative;
          }

          .yam-highlight-ring svg,
          .yam-highlight-ring.add svg {
            position: absolute;
            z-index: 1;
          }

          .yam-highlight-ring.travel,
          .yam-highlight-ring.design,
          .yam-highlight-ring.moments,
          .yam-highlight-ring.projects {
            position: relative;
          }

          .yam-highlight-ring.travel::after,
          .yam-highlight-ring.design::after,
          .yam-highlight-ring.moments::after,
          .yam-highlight-ring.projects::after {
            content: '';
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            background:
              radial-gradient(circle at 55% 30%, rgba(255,255,255,0.14), transparent 18%),
              linear-gradient(180deg, #273657, #111931 70%, #0a1022);
          }

          .yam-summary-card-v2 {
            padding: 18px;
          }

          .yam-summary-card-v2 h3 {
            margin: 0;
            font-size: 20px;
          }

          .yam-summary-list-v2 {
            display: grid;
            gap: 14px;
            margin-top: 14px;
          }

          .yam-summary-row-v2 {
            justify-content: flex-start;
            gap: 12px;
            color: #dbe2fb;
          }

          .yam-summary-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            color: #c9b7ff;
            background: rgba(255,255,255,0.04);
          }

          .yam-laptop-avatar {
            border-radius: 50%;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 22px;
            font-weight: 900;
            background:
              radial-gradient(circle at 50% 28%, rgba(255,255,255,0.08), transparent 16%),
              linear-gradient(140deg, #1b2340 10%, #6241a8 60%, #0f1428 100%);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 14px 24px rgba(0,0,0,0.24);
            overflow: hidden;
          }

          .yam-laptop-avatar.image span {
            transform: translateY(8px);
          }

          .yam-laptop-avatar.accent {
            box-shadow: 0 0 0 4px rgba(124,58,237,0.18), 0 14px 24px rgba(0,0,0,0.24);
          }

          @media (max-width: 1380px) {
            .yam-laptop-shell {
              grid-template-columns: 220px minmax(0, 1fr) 320px;
            }
          }

          @media (max-width: 1140px) {
            .yam-laptop-shell {
              grid-template-columns: minmax(0, 1fr);
            }

            .yam-left-rail,
            .yam-right-rail {
              position: static;
            }

            .yam-left-rail {
              order: 2;
            }

            .yam-right-rail {
              order: 3;
            }
          }

          @media (max-width: 1024px) {
            .page-content.yam-feed-page-locked {
              overflow-y: auto;
            }

            .yam-laptop-page {
              min-height: auto;
              overflow-x: hidden;
              overflow-y: visible;
            }

            .yam-laptop-shell {
              width: 100%;
              padding: 8px 10px calc(96px + env(safe-area-inset-bottom, 0px));
              gap: 14px;
              min-height: auto;
              grid-template-columns: 1fr;
            }

            .yam-left-rail,
            .yam-right-rail {
              display: none;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-summary-card-v2,
            .yam-profile-card-v2 {
              border-radius: 22px;
            }

            .yam-feed-header-top h1 {
              font-size: 24px;
            }

            .yam-mobile-brand {
              display: block;
            }

            .yam-composer-prompt-bar {
              grid-template-columns: 1fr;
            }

            .yam-composer-actions-inline {
              width: 100%;
              overflow-x: auto;
              padding-bottom: 2px;
            }

            .yam-post-media-grid-v2,
            .yam-post-media-grid-v2.media-count-2,
            .yam-post-media-grid-v2.media-count-3 {
              grid-template-columns: 1fr;
              min-height: auto;
            }

            .yam-post-media-tile,
            .yam-post-media-grid-v2.media-count-3 .tile-2 {
              min-height: 220px;
            }

            .yam-feed-header-card,
            .yam-post-card-v2,
            .yam-home-composer-slot,
            .yam-post-comments-panel {
              width: 100%;
              max-width: 100%;
              overflow: hidden;
            }

            .yam-post-head-v2,
            .yam-post-author-v2,
            .yam-post-meta-v2 {
              min-width: 0;
              flex-wrap: wrap;
            }

            .yam-post-author-copy,
            .yam-post-copy-v2,
            .yam-post-handle {
              min-width: 0;
              overflow-wrap: anywhere;
            }

            .yam-post-stats-v2 {
              gap: 10px;
              flex-direction: column;
              align-items: flex-start;
            }

            .yam-post-numbers-v2 {
              justify-content: flex-start;
            }

            .yam-post-actions-v2 {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              align-items: stretch;
              width: 100%;
              gap: 8px;
            }

            .yam-post-actions-v2 button {
              width: 100%;
              min-width: 0;
              justify-content: center;
              flex-direction: row;
              gap: 6px;
              padding: 10px 6px;
              background: rgba(255,255,255,0.03);
              font-size: 11px;
              text-align: center;
              white-space: nowrap;
            }

            .yam-post-actions-v2 button svg {
              width: 18px !important;
              height: 18px !important;
            }

            .yam-center-stage,
            .yam-post-stack-v2 {
              max-height: none;
              overflow: visible !important;
              height: auto !important;
            }
          }
        ` })
  ] }) });
}
export {
  FeedEnhanced as default
};
