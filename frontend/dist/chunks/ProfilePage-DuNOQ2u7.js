import { E as reactExports, ah as resolveMediaUrl, I as jsxRuntimeExports, F as useNavigate, J as Button, aJ as updateMyProfile, a8 as useParams, a6 as useSearchParams, af as getCurrentUsername, av as getProfileBundle, aD as followUser, a0 as MainLayout, a2 as Card } from "../index-DRmq1dbV.js";
import { M as Modal } from "./Modal-Xyu_csOj.js";
const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
const FALLBACK_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23222'/><path d='M20 56l14-18 10 12 6-8 12 14H20z' fill='%23555'/><circle cx='30' cy='28' r='5' fill='%23555'/></svg>`
);
function OptimizedImage({
  src,
  alt,
  className,
  style,
  placeholder = TRANSPARENT_PIXEL,
  fallback = FALLBACK_SVG
}) {
  const [isLoaded, setIsLoaded] = reactExports.useState(false);
  const [currentSrc, setCurrentSrc] = reactExports.useState(placeholder);
  const [hasErrored, setHasErrored] = reactExports.useState(false);
  const mountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => () => {
    mountedRef.current = false;
  }, []);
  reactExports.useEffect(() => {
    setIsLoaded(false);
    setHasErrored(false);
    const resolved = resolveMediaUrl(src);
    if (!resolved) {
      setCurrentSrc(fallback);
      return void 0;
    }
    const img = new Image();
    img.src = resolved;
    img.onload = () => {
      if (!mountedRef.current) return;
      setCurrentSrc(resolved);
      setIsLoaded(true);
    };
    img.onerror = () => {
      if (!mountedRef.current) return;
      setCurrentSrc(fallback);
      setIsLoaded(true);
      setHasErrored(true);
    };
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallback]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `image-container ${className || ""}`,
      style: {
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#222",
        ...style
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: currentSrc,
          alt,
          loading: "lazy",
          onError: (event) => {
            if (event.currentTarget.src !== fallback) {
              event.currentTarget.src = fallback;
            }
          },
          style: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isLoaded || hasErrored ? "none" : "blur(10px)",
            transition: "filter 0.3s ease-in-out",
            opacity: isLoaded || hasErrored ? 1 : 0.7
          }
        }
      )
    }
  );
}
const FallbackAvatar = ({ name = "User" }) => {
  const initials = String(name || "U").split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-fallback-avatar", children: initials });
};
const FallbackCover = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-fallback-cover" });
const VerifiedBadge = () => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-verified", title: "حساب موثّق", "aria-label": "حساب موثّق", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "20", height: "20", "aria-hidden": "true", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      fill: "#3b82f6",
      d: "M12 2l2.39 2.06L17.5 4l.94 3.06L21 8l-.94 3.06L21 14l-3.06.94L17.5 18l-3.11-.06L12 20l-2.39-2.06L6.5 18l-.94-3.06L3 14l.94-3.06L3 8l3.06-.94L6.5 4l3.11.06L12 2z"
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "path",
    {
      fill: "#fff",
      d: "M10.7 14.4l-2.4-2.4 1.06-1.06 1.34 1.34 3.94-3.94 1.06 1.07z"
    }
  )
] }) });
const detectLinkType = (url = "") => {
  const u = String(url).toLowerCase();
  if (u.includes("instagram.com")) return { icon: "📷", label: "Instagram" };
  if (u.includes("twitter.com") || u.includes("x.com")) return { icon: "𝕏", label: "X" };
  if (u.includes("tiktok.com")) return { icon: "🎵", label: "TikTok" };
  if (u.includes("youtube.com") || u.includes("youtu.be")) return { icon: "▶️", label: "YouTube" };
  if (u.includes("facebook.com")) return { icon: "f", label: "Facebook" };
  if (u.includes("linkedin.com")) return { icon: "in", label: "LinkedIn" };
  if (u.includes("github.com")) return { icon: "⌨️", label: "GitHub" };
  if (u.includes("t.me") || u.includes("telegram")) return { icon: "✈️", label: "Telegram" };
  if (u.includes("wa.me") || u.includes("whatsapp")) return { icon: "💬", label: "WhatsApp" };
  return { icon: "🔗", label: "موقع" };
};
const BioLinks = ({ links = [] }) => {
  if (!Array.isArray(links) || links.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-bio-links", role: "list", children: links.slice(0, 5).map((raw, i) => {
    const link = typeof raw === "string" ? { url: raw, title: "" } : raw || {};
    const href = link.url || "";
    if (!href) return null;
    const meta = detectLinkType(href);
    const label = link.title || meta.label;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        className: "ymp-bio-link",
        href,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        role: "listitem",
        title: href,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-bio-link-icon", "aria-hidden": "true", children: meta.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-bio-link-label", children: label })
        ]
      },
      `biolink-${i}`
    );
  }) });
};
const StoryHighlights = ({ highlights = [], isOwnProfile, onAddHighlight }) => {
  if ((!Array.isArray(highlights) || highlights.length === 0) && !isOwnProfile) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-highlights", role: "region", "aria-label": "القصص المميزة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-highlights-track", children: [
    isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "ymp-highlight-item ymp-highlight-add",
        onClick: onAddHighlight,
        "aria-label": "إضافة قصة مميزة جديدة",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-highlight-ring", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-highlight-thumb ymp-highlight-plus", children: "＋" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-highlight-title", children: "جديد" })
        ]
      }
    ),
    highlights.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "ymp-highlight-item",
        onClick: () => typeof h.onClick === "function" ? h.onClick(h) : null,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-highlight-ring", children: h.cover ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "ymp-highlight-thumb", src: resolveMediaUrl(h.cover), alt: h.title || "قصة مميزة" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-highlight-thumb ymp-highlight-fallback", children: "📖" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-highlight-title", children: h.title || "قصة" })
        ]
      },
      h.id || `hl-${i}`
    ))
  ] }) });
};
function ProfileHeader({
  profile,
  isOwnProfile,
  onAnalyticsClick,
  onCustomizationClick,
  onFollowClick,
  activeTab: externalActiveTab,
  onTabChange,
  tabs: externalTabs,
  onAddHighlight,
  onBlockUser,
  onReportUser
}) {
  const navigate = useNavigate();
  const [showCoverEditor, setShowCoverEditor] = reactExports.useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = reactExports.useState(false);
  const [showMoreMenu, setShowMoreMenu] = reactExports.useState(false);
  const [copyFlash, setCopyFlash] = reactExports.useState(false);
  const [internalTab, setInternalTab] = reactExports.useState("all");
  const activeTab = externalActiveTab || internalTab;
  const moreMenuRef = reactExports.useRef(null);
  const [coverImage, setCoverImage] = reactExports.useState(profile?.user?.profile?.cover_photo || "");
  const [avatarImage, setAvatarImage] = reactExports.useState(profile?.user?.avatar || "");
  const [coverImageError, setCoverImageError] = reactExports.useState(false);
  const [avatarImageError, setAvatarImageError] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const avatarInputRef = reactExports.useRef(null);
  const handleTabChange = reactExports.useCallback((tab) => {
    setInternalTab(tab);
    if (typeof onTabChange === "function") onTabChange(tab);
  }, [onTabChange]);
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("الرجاء اختيار صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً (الحد الأقصى 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target?.result);
      setCoverImageError(false);
    };
    reader.onerror = () => alert("حدث خطأ في قراءة الملف");
    reader.readAsDataURL(file);
  };
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("الرجاء اختيار صورة");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً (الحد الأقصى 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarImage(event.target?.result);
      setAvatarImageError(false);
      setShowAvatarCropper(true);
    };
    reader.onerror = () => alert("حدث خطأ في قراءة الملف");
    reader.readAsDataURL(file);
  };
  const applyCrop = async () => {
    try {
      await updateMyProfile({ avatar: avatarImage });
      setShowAvatarCropper(false);
    } catch (error) {
      console.error("Failed to update avatar:", error);
      alert("فشل تحديث الصورة الشخصية");
    }
  };
  const saveCoverImage = async () => {
    try {
      await updateMyProfile({ cover_photo: coverImage });
      setShowCoverEditor(false);
    } catch (error) {
      console.error("Failed to update cover:", error);
      alert("فشل تحديث صورة الغلاف");
    }
  };
  const tabs = reactExports.useMemo(() => {
    if (Array.isArray(externalTabs) && externalTabs.length > 0) return externalTabs;
    return [
      { key: "all", label: "الكل" },
      { key: "reels", label: "ريلز" },
      { key: "photos", label: "الصور" },
      { key: "tagged", label: "المُعلَّمة", icon: "🏷️" }
    ];
  }, [externalTabs]);
  const localFullName = (() => {
    try {
      const uname = profile?.user?.username;
      return uname ? window.localStorage.getItem(`yamshat:profile:fullname:${uname}`) || "" : "";
    } catch {
      return "";
    }
  })();
  const fullName = profile?.user?.display_name || profile?.user?.full_name || profile?.user?.profile?.full_name || localFullName || profile?.user?.username || "مستخدم";
  const username = profile?.user?.username || "مستخدم";
  const postsCount = profile?.posts_count || 0;
  const followersCount = profile?.followers_count || 0;
  const followingCount = profile?.following_count || 0;
  const bio = profile?.user?.profile?.bio || "";
  const tagline = profile?.user?.profile?.activity_tagline || "منشئ محتوى رقمي";
  const isVerified = profile?.user?.is_verified || profile?.user?.verified || false;
  const isFollowing = profile?.is_following || false;
  const city = profile?.user?.profile?.city || "";
  const gender = profile?.user?.profile?.gender || "";
  const bioLinks = reactExports.useMemo(() => {
    const raw = profile?.user?.profile?.bio_links || profile?.user?.profile?.links || profile?.user?.links || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(Boolean);
  }, [profile]);
  const highlights = reactExports.useMemo(() => {
    const raw = profile?.user?.profile?.highlights || profile?.highlights || [];
    return Array.isArray(raw) ? raw : [];
  }, [profile]);
  const onlineStatus = reactExports.useMemo(() => {
    const p = profile?.user || {};
    const isOnline = Boolean(p.is_online || p.online || profile?.is_online);
    const lastSeen = p.last_seen || p.last_active || profile?.last_seen || null;
    return { isOnline, lastSeen };
  }, [profile]);
  const formatCount = (n) => {
    const num = Number(n) || 0;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)} مليون`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(num % 1e3 === 0 ? 0 : 1)} ألف`;
    return String(num);
  };
  const formatLastSeen = (ts) => {
    if (!ts) return "";
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return "";
    const diffMin = Math.floor((Date.now() - d.getTime()) / 6e4);
    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffMin < 60 * 24) return `منذ ${Math.floor(diffMin / 60)} ساعة`;
    return `منذ ${Math.floor(diffMin / 1440)} يوم`;
  };
  const handleMessage = reactExports.useCallback(() => {
    navigate(`/chat/${encodeURIComponent(username)}`);
  }, [navigate, username]);
  const profileUrl = reactExports.useMemo(() => {
    try {
      return `${window.location.origin}/profile/${encodeURIComponent(username)}`;
    } catch {
      return `/profile/${encodeURIComponent(username)}`;
    }
  }, [username]);
  const handleShareProfile = reactExports.useCallback(async () => {
    setShowMoreMenu(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: fullName, text: `تصفح ملف ${fullName} على يام شات`, url: profileUrl });
        return;
      }
    } catch {
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1600);
    } catch {
      alert(profileUrl);
    }
  }, [fullName, profileUrl]);
  const handleCopyLink = reactExports.useCallback(async () => {
    setShowMoreMenu(false);
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1600);
    } catch {
      alert(profileUrl);
    }
  }, [profileUrl]);
  const handleBlock = reactExports.useCallback(() => {
    setShowMoreMenu(false);
    if (typeof onBlockUser === "function") return onBlockUser(username);
    if (window.confirm(`هل تريد حظر @${username}؟`)) {
      console.warn("Block user (no handler wired):", username);
    }
  }, [onBlockUser, username]);
  const handleReport = reactExports.useCallback(() => {
    setShowMoreMenu(false);
    if (typeof onReportUser === "function") return onReportUser(username);
    console.warn("Report user (no handler wired):", username);
    alert("شكراً — تم إرسال البلاغ للمراجعة.");
  }, [onReportUser, username]);
  reactExports.useEffect(() => {
    if (!showMoreMenu) return void 0;
    const onDocClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showMoreMenu]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-profile-wrap", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-cover", children: [
      coverImage && !coverImageError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        OptimizedImage,
        {
          src: resolveMediaUrl(coverImage),
          alt: "غلاف البروفايل",
          className: "ymp-cover-img",
          onError: () => setCoverImageError(true)
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(FallbackCover, {}),
      isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ymp-cover-edit-btn", onClick: () => setShowCoverEditor(true), type: "button", children: "✏️ تعديل الغلاف" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-avatar-holder", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-avatar", children: avatarImage && !avatarImageError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          OptimizedImage,
          {
            src: resolveMediaUrl(avatarImage),
            alt: fullName,
            className: "ymp-avatar-img",
            onError: () => setAvatarImageError(true)
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(FallbackAvatar, { name: fullName }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: `ymp-online-dot ${onlineStatus.isOnline ? "is-online" : "is-offline"}`,
            title: onlineStatus.isOnline ? "متصل الآن" : onlineStatus.lastSeen ? `آخر ظهور: ${formatLastSeen(onlineStatus.lastSeen)}` : "غير متصل",
            "aria-label": onlineStatus.isOnline ? "متصل الآن" : "غير متصل"
          }
        ),
        isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ymp-avatar-edit-btn",
            onClick: () => avatarInputRef.current?.click(),
            "aria-label": "تغيير الصورة الشخصية",
            children: "📷"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: avatarInputRef,
            type: "file",
            accept: "image/*",
            onChange: handleAvatarUpload,
            style: { display: "none" }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-identity", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "ymp-fullname", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fullName }),
        isVerified ? /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedBadge, {}) : null
      ] }),
      onlineStatus.isOnline ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-online-label", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-online-mini-dot" }),
        " متصل الآن"
      ] }) : onlineStatus.lastSeen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-online-label ymp-online-label--muted", children: [
        "آخر ظهور: ",
        formatLastSeen(onlineStatus.lastSeen)
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-stats-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-stat", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCount(followersCount) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: " المتابعون" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-dot", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-stat", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCount(followingCount) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: " يتابع" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-dot", children: "·" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-stat", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatCount(postsCount) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: " المنشورات" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-tagline", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tagline }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "currentColor", d: "M4 4h12v12H8l-4 4z" }) })
      ] }),
      bio ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ymp-bio", children: bio }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(BioLinks, { links: bioLinks })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-actions", children: [
      isOwnProfile ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymp-btn ymp-btn-primary", onClick: onCustomizationClick, children: "✏️ تعديل الملف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "ymp-btn ymp-btn-secondary", onClick: onAnalyticsClick, children: "📊 التحليلات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ymp-btn ymp-btn-icon",
            onClick: handleShareProfile,
            "aria-label": "مشاركة الملف الشخصي",
            title: "مشاركة الملف الشخصي",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "5", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "6", cy: "12", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "19", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15.4", y1: "6.5", x2: "8.6", y2: "10.5" })
            ] })
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymp-btn ymp-btn-secondary", onClick: handleMessage, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مراسلة" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `ymp-btn ${isFollowing ? "ymp-btn-secondary" : "ymp-btn-primary"}`,
            onClick: onFollowClick,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isFollowing ? "✓ تتابعه" : "＋ متابعة" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ymp-btn ymp-btn-icon",
            onClick: handleShareProfile,
            "aria-label": "مشاركة الملف الشخصي",
            title: "مشاركة الملف الشخصي",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "5", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "6", cy: "12", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "18", cy: "19", r: "3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8.6", y1: "13.5", x2: "15.4", y2: "17.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15.4", y1: "6.5", x2: "8.6", y2: "10.5" })
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-more-wrap", ref: moreMenuRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "ymp-btn ymp-btn-icon",
            onClick: () => setShowMoreMenu((v) => !v),
            "aria-label": "خيارات إضافية",
            "aria-expanded": showMoreMenu,
            title: "المزيد",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "currentColor", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "5", cy: "12", r: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "19", cy: "12", r: "2" })
            ] })
          }
        ),
        showMoreMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-more-menu", role: "menu", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymp-more-item", role: "menuitem", onClick: handleCopyLink, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🔗" }),
            " نسخ رابط الملف"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymp-more-item", role: "menuitem", onClick: handleShareProfile, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "📤" }),
            " مشاركة الملف"
          ] }),
          !isOwnProfile && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-more-divider" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymp-more-item ymp-danger", role: "menuitem", onClick: handleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🚫" }),
              " حظر @",
              username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "ymp-more-item ymp-danger", role: "menuitem", onClick: handleReport, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🚩" }),
              " إبلاغ"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      StoryHighlights,
      {
        highlights,
        isOwnProfile,
        onAddHighlight
      }
    ),
    tabs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-tabs", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: `ymp-tab ${activeTab === tab.key ? "active" : ""}`,
        onClick: () => handleTabChange(tab.key),
        children: [
          tab.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-tab-icon", "aria-hidden": "true", children: tab.icon }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tab.label })
        ]
      },
      tab.key
    )) }),
    tabs.some((tab) => tab.key === "tagged") && activeTab === "tagged" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-tagged-hint", role: "status", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🏷️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "المنشورات التي تم تعليمك فيها ستظهر هنا. يمكن التحكم في هذا من إعدادات الخصوصية." })
    ] }),
    (city || gender) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-personal", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "ymp-personal-title", children: "التفاصيل الشخصية" }),
      city ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-personal-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-personal-icon", "aria-hidden": "true", children: "🏠" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: city })
      ] }) : null,
      gender ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ymp-personal-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ymp-personal-icon", "aria-hidden": "true", children: "⚥" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: gender === "male" ? "ذكر" : gender === "female" ? "أنثى" : gender })
      ] }) : null
    ] }),
    copyFlash && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-copy-toast", role: "status", "aria-live": "polite", children: "✅ تم نسخ رابط الملف" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showCoverEditor, onClose: () => setShowCoverEditor(false), title: "تعديل الغلاف", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-cover-preview", children: coverImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(OptimizedImage, { src: resolveMediaUrl(coverImage), alt: "معاينة الغلاف", className: "ymp-cover-img" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FallbackCover, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => fileInputRef.current?.click(), style: { width: "100%", marginBottom: 10 }, children: "اختيار صورة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleCoverUpload, style: { display: "none" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveCoverImage, style: { width: "100%" }, children: "حفظ" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: showAvatarCropper, onClose: () => setShowAvatarCropper(false), title: "تعديل الصورة الشخصية", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ymp-avatar-preview", children: avatarImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(OptimizedImage, { src: resolveMediaUrl(avatarImage), alt: "معاينة الصورة", className: "ymp-avatar-img" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FallbackAvatar, { name: fullName }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: applyCrop, style: { width: "100%" }, children: "تطبيق" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .ymp-profile-wrap {
          font-family: 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          color: #fff;
          background: transparent;
          padding-bottom: 12px;
          position: relative;
        }
        .ymp-cover {
          position: relative;
          height: 200px;
          border-radius: 0 0 18px 18px;
          overflow: visible;
          background: #1a1a1a;
        }
        .ymp-cover-img,
        .ymp-fallback-cover {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 0 0 18px 18px;
          display: block;
        }
        .ymp-fallback-cover {
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%);
        }
        .ymp-cover-edit-btn {
          position: absolute;
          bottom: 12px;
          left: 12px;
          padding: 7px 14px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .ymp-cover-edit-btn:hover { background: rgba(0,0,0,0.85); }

        .ymp-avatar-holder {
          position: absolute;
          left: 50%;
          bottom: -65px;
          transform: translateX(-50%);
          width: 134px;
          height: 134px;
          z-index: 3;
        }
        .ymp-avatar {
          width: 134px;
          height: 134px;
          border-radius: 50%;
          border: 5px solid #0A0D1A;
          background: #1a1a1a;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.5);
          display: grid;
          place-items: center;
        }
        .ymp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .ymp-fallback-avatar {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
          color: #fff; font-size: 36px; font-weight: 800;
        }
        .ymp-avatar-edit-btn {
          position: absolute;
          bottom: 6px; right: 6px;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 3px solid #0A0D1A;
          background: #7C3AED;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          display: grid; place-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          z-index: 2;
        }

        /* 🆕 (5) — Online status indicator */
        .ymp-online-dot {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid #0A0D1A;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          z-index: 2;
          transition: transform .2s ease;
        }
        .ymp-online-dot.is-online {
          background: #22c55e;
          animation: ymp-online-pulse 2s ease-out infinite;
        }
        .ymp-online-dot.is-offline {
          background: #6b7280;
        }
        @keyframes ymp-online-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55), 0 2px 6px rgba(0,0,0,0.35); }
          70%  { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0), 0 2px 6px rgba(0,0,0,0.35); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0), 0 2px 6px rgba(0,0,0,0.35); }
        }
        .ymp-online-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #22c55e;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .ymp-online-label--muted { color: #94a3b8; font-weight: 500; }
        .ymp-online-mini-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.22);
        }

        .ymp-identity {
          text-align: center;
          margin-top: 78px;
          padding: 0 16px;
        }
        .ymp-fullname {
          margin: 0 0 10px;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ymp-verified { display: inline-flex; align-items: center; }

        .ymp-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: stretch;
          justify-content: center;
          gap: 8px;
          color: #cbd5e1;
          font-size: 13px;
          margin: 0 auto 12px;
          max-width: 560px;
          padding: 0 12px;
          width: 100%;
          box-sizing: border-box;
          direction: rtl;
        }
        .ymp-stats-row .ymp-stat {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 10px 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          min-width: 0;
          font-family: 'Noto Sans Arabic', 'Tajawal', sans-serif;
        }
        .ymp-stats-row strong { color: #fff; font-weight: 800; font-size: 18px; margin-bottom: 2px; }
        .ymp-stats-row .ymp-stat span { font-size: 12px; color: #94a3b8; white-space: nowrap; }
        .ymp-dot { display: none; }
        .ymp-tagline {
          display: inline-flex; align-items: center; gap: 6px;
          color: #cbd5e1; font-size: 13px; margin-bottom: 10px;
        }
        .ymp-bio {
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 auto 14px;
          max-width: 560px;
          word-break: break-word;
        }

        /* 🆕 (2) — Bio links */
        .ymp-bio-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 560px;
          margin: 0 auto 14px;
        }
        .ymp-bio-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(24, 119, 242, 0.10);
          border: 1px solid rgba(24, 119, 242, 0.30);
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: background .15s ease, transform .12s ease;
        }
        .ymp-bio-link:hover {
          background: rgba(24, 119, 242, 0.20);
          transform: translateY(-1px);
        }
        .ymp-bio-link-icon { font-size: 14px; line-height: 1; }
        .ymp-bio-link-label { max-width: 170px; overflow: hidden; text-overflow: ellipsis; }

        .ymp-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: center;
          padding: 0 16px 14px;
          flex-wrap: wrap;
          position: relative;
        }
        .ymp-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          min-width: 150px;
          transition: background .15s ease, transform .12s ease, box-shadow .15s ease;
        }
        .ymp-btn-primary {
          background: #1877F2;
          color: #fff;
          box-shadow: 0 4px 14px rgba(24, 119, 242, 0.32);
        }
        .ymp-btn-primary:hover { background: #166fe0; transform: translateY(-1px); }
        .ymp-btn-secondary { background: #2A2F3A; color: #fff; }
        .ymp-btn-secondary:hover { background: #353B47; }

        /* 🆕 (3) — Icon buttons + More menu */
        .ymp-btn-icon {
          min-width: 44px;
          width: 44px;
          height: 44px;
          padding: 0;
          background: #2A2F3A;
          color: #fff;
        }
        .ymp-btn-icon:hover { background: #353B47; }
        .ymp-more-wrap { position: relative; }
        .ymp-more-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 220px;
          background: #111827;
          border: 1px solid #1F2937;
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.55);
          padding: 6px;
          z-index: 40;
        }
        .ymp-more-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #e5e7eb;
          font-size: 14px;
          font-family: inherit;
          text-align: right;
          cursor: pointer;
        }
        .ymp-more-item:hover { background: rgba(255,255,255,0.06); }
        .ymp-more-item.ymp-danger { color: #f87171; }
        .ymp-more-item.ymp-danger:hover { background: rgba(248, 113, 113, 0.10); }
        .ymp-more-divider {
          height: 1px;
          background: #1F2937;
          margin: 6px 4px;
        }

        /* 🆕 (4) — Story Highlights */
        .ymp-highlights {
          padding: 6px 8px 12px;
          border-top: 1px solid #1F2937;
          border-bottom: 1px solid #1F2937;
          margin: 8px 0 4px;
        }
        .ymp-highlights-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 8px 4px 4px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .ymp-highlights-track::-webkit-scrollbar { display: none; }
        .ymp-highlight-item {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          scroll-snap-align: start;
          font-family: inherit;
        }
        .ymp-highlight-ring {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #f59e0b, #ef4444, #7C3AED);
          display: grid;
          place-items: center;
        }
        .ymp-highlight-thumb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          background: #0A0D1A;
          border: 2px solid #0A0D1A;
        }
        .ymp-highlight-fallback {
          display: grid; place-items: center;
          font-size: 24px; color: #94a3b8;
        }
        .ymp-highlight-plus {
          display: grid; place-items: center;
          font-size: 28px; color: #94a3b8; font-weight: 300;
          background: #1a1f2e;
        }
        .ymp-highlight-add .ymp-highlight-ring {
          background: #1F2937;
        }
        .ymp-highlight-title {
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 600;
          max-width: 74px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ymp-tabs {
          display: flex;
          justify-content: center;
          align-items: stretch;
          border-bottom: 1px solid #1F2937;
          padding: 0 16px;
          margin-bottom: 8px;
        }
        .ymp-tab {
          flex: 1;
          max-width: 130px;
          padding: 12px 8px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: color .15s ease, border-color .15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .ymp-tab.active {
          color: #1877F2;
          border-bottom-color: #1877F2;
        }
        .ymp-tab-icon { font-size: 12px; }

        /* 🆕 (1) — Tagged empty hint */
        .ymp-tagged-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          margin: 8px 12px 4px;
          color: #94a3b8;
          font-size: 13px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.10);
          border-radius: 12px;
          text-align: center;
        }

        .ymp-personal { padding: 14px 16px 4px; }
        .ymp-personal-title {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 800;
          color: #e2e8f0;
        }
        .ymp-personal-row {
          display: flex; align-items: center; gap: 10px;
          color: #cbd5e1; font-size: 14px; padding: 8px 0;
        }
        .ymp-personal-icon {
          width: 24px; height: 24px;
          display: grid; place-items: center;
          color: #94a3b8;
        }

        .ymp-cover-preview {
          height: 200px; margin-bottom: 16px;
          border-radius: 12px; overflow: hidden;
          background: #1a1a1a;
        }
        .ymp-avatar-preview {
          width: 200px; height: 200px;
          border-radius: 50%; margin: 0 auto 18px;
          overflow: hidden; background: #1a1a1a;
        }

        .ymp-copy-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #111827;
          color: #22c55e;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(34, 197, 94, 0.35);
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          font-size: 13px;
          font-weight: 700;
          z-index: 200;
          animation: ymp-toast-in .25s ease-out;
        }
        @keyframes ymp-toast-in {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }

        @media (max-width: 480px) {
          .ymp-cover { height: 170px; }
          .ymp-cover-img, .ymp-fallback-cover { height: 170px; }
          .ymp-avatar-holder { width: 118px; height: 118px; bottom: -55px; }
          .ymp-avatar { width: 118px; height: 118px; }
          .ymp-online-dot { width: 18px; height: 18px; }
          .ymp-identity { margin-top: 66px; }
          .ymp-fullname { font-size: 19px; }
          .ymp-btn { min-width: 120px; padding: 10px 14px; }
          .ymp-btn-icon { min-width: 44px; width: 44px; }
          .ymp-stats-row { gap: 6px; padding: 0 8px; }
          .ymp-stats-row .ymp-stat { padding: 8px 4px; }
          .ymp-stats-row strong { font-size: 16px; }
          .ymp-stats-row .ymp-stat span { font-size: 11px; }
          .ymp-highlight-ring { width: 60px; height: 60px; }
          .ymp-highlight-title { font-size: 10px; max-width: 66px; }
        }
        @media (max-width: 360px) {
          .ymp-stats-row { gap: 4px; }
          .ymp-stats-row .ymp-stat { padding: 6px 2px; }
          .ymp-stats-row strong { font-size: 14px; }
          .ymp-stats-row .ymp-stat span { font-size: 10px; }
          .ymp-btn { min-width: 100px; font-size: 13px; }
        }
      ` })
  ] });
}
const TABS = {
  POSTS: "posts",
  ARCHIVE: "archive",
  SAVED: "saved",
  PINNED: "pinned",
  TAGGED: "tagged"
};
const TAB_ITEMS = {
  [TABS.POSTS]: { key: TABS.POSTS, label: "المنشورات" },
  [TABS.ARCHIVE]: { key: TABS.ARCHIVE, label: "الأرشيف" },
  [TABS.SAVED]: { key: TABS.SAVED, label: "المحفوظات" },
  [TABS.PINNED]: { key: TABS.PINNED, label: "المثبتة", icon: "📌" },
  [TABS.TAGGED]: { key: TABS.TAGGED, label: "المُعلَّمة", icon: "🏷️" }
};
const normalizeRequestedTab = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(TABS).includes(normalized) ? normalized : TABS.POSTS;
};
function ProfilePage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;
  const [profile, setProfile] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState(TABS.POSTS);
  const [showAnalytics, setShowAnalytics] = reactExports.useState(false);
  const [showCustomization, setShowCustomization] = reactExports.useState(false);
  const [showFollowersInsights, setShowFollowersInsights] = reactExports.useState(false);
  const [theme, setTheme] = reactExports.useState("midnight");
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [pinnedPosts, setPinnedPosts] = reactExports.useState([]);
  const [analyticsData, setAnalyticsData] = reactExports.useState(null);
  const [followersData, setFollowersData] = reactExports.useState(null);
  const requestedTab = normalizeRequestedTab(searchParams.get("tab"));
  const requestedPanel = String(searchParams.get("panel") || "").trim().toLowerCase();
  const availableTabs = reactExports.useMemo(() => {
    if (!profile) return [TAB_ITEMS[TABS.POSTS]];
    const items = [TAB_ITEMS[TABS.POSTS]];
    if (Array.isArray(pinnedPosts) && pinnedPosts.length > 0) {
      items.push(TAB_ITEMS[TABS.PINNED]);
    }
    if (isOwnProfile && Array.isArray(profile.archived_posts) && profile.archived_posts.length > 0) {
      items.push(TAB_ITEMS[TABS.ARCHIVE]);
    }
    if (isOwnProfile && Array.isArray(profile.saved_posts) && profile.saved_posts.length > 0) {
      items.push(TAB_ITEMS[TABS.SAVED]);
    }
    items.push(TAB_ITEMS[TABS.TAGGED]);
    return items;
  }, [profile, pinnedPosts, isOwnProfile]);
  const loadProfile = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setPinnedPosts(Array.isArray(data.pinned_posts) ? data.pinned_posts : []);
      setAnalyticsData(data.analytics || {});
      setFollowersData(data.followers_insights || {});
      setTheme(
        data?.user?.profile?.profile_theme || data?.user?.profile?.theme || data?.profile_theme || "midnight"
      );
    } catch (err) {
      setError("فشل تحميل الملف الشخصي");
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);
  reactExports.useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  reactExports.useEffect(() => {
    const allowedTabs = availableTabs.map((tab) => tab.key);
    if (allowedTabs.length === 0) return;
    setActiveTab((currentTab) => {
      if (allowedTabs.includes(requestedTab)) return requestedTab;
      if (allowedTabs.includes(currentTab)) return currentTab;
      return allowedTabs[0];
    });
  }, [availableTabs, requestedTab]);
  reactExports.useEffect(() => {
    if (requestedPanel === "themes" && isOwnProfile) {
      setShowCustomization(true);
    }
  }, [requestedPanel, isOwnProfile]);
  const handleThemeChange = reactExports.useCallback(async (newTheme) => {
    setTheme(newTheme);
    try {
      await updateMyProfile({ profile_theme: newTheme });
    } catch (error2) {
      console.error("Failed to update theme:", error2);
    }
  }, []);
  const handleTabChange = reactExports.useCallback((nextTab) => {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === TABS.POSTS) {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }
    setSearchParams(nextParams, { replace: true });
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [searchParams, setSearchParams]);
  const openCustomization = reactExports.useCallback(() => {
    setShowCustomization(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("panel", "themes");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);
  const closeCustomization = reactExports.useCallback(() => {
    setShowCustomization(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("panel");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);
  const handleFollowClick = reactExports.useCallback(async () => {
    const targetUsername = profile?.user?.username || "";
    if (!targetUsername) return;
    try {
      await followUser(targetUsername);
      setProfile((prev) => {
        if (!prev) return prev;
        const isFollowing = Boolean(prev.is_following);
        const currentFollowers = Number(prev.followers_count || 0);
        return {
          ...prev,
          is_following: !isFollowing,
          followers_count: isFollowing ? Math.max(0, currentFollowers - 1) : currentFollowers + 1
        };
      });
    } catch (error2) {
      console.error("Failed to follow user:", error2);
    }
  }, [profile?.user?.username]);
  const getTabContent = reactExports.useCallback(() => {
    if (!profile) return [];
    switch (activeTab) {
      case TABS.POSTS:
        return profile.posts || [];
      case TABS.ARCHIVE:
        return profile.archived_posts || [];
      case TABS.SAVED:
        return profile.saved_posts || [];
      case TABS.PINNED:
        return pinnedPosts;
      case TABS.TAGGED:
        return profile.tagged_posts || [];
      default:
        return [];
    }
  }, [profile, activeTab, pinnedPosts]);
  const tabContent = reactExports.useMemo(() => getTabContent(), [getTabContent]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "page-loader-spinner" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "جارٍ التحميل..." })
    ] }) });
  }
  if (error || !profile) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", padding: "40px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#ff6b6b" }, children: error || "حدث خطأ" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: loadProfile, children: "إعادة محاولة" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { maxWidth: 1e3, margin: "0 auto", padding: "20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ProfileHeader,
        {
          profile,
          isOwnProfile,
          onAnalyticsClick: () => setShowAnalytics(true),
          onCustomizationClick: openCustomization,
          onFollowClick: handleFollowClick,
          activeTab,
          onTabChange: handleTabChange,
          tabs: availableTabs
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-profile-gallery", dir: "rtl", children: tabContent.length > 0 ? tabContent.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "ym-profile-gallery__item",
          role: "button",
          tabIndex: 0,
          onClick: () => navigate(`/post/${post.id}`),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate(`/post/${post.id}`);
            }
          },
          children: [
            post.media_url || post.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: post.media_url || post.image_url,
                alt: "منشور",
                className: "ym-profile-gallery__img",
                loading: "lazy"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-profile-gallery__empty", children: "📝" }),
            activeTab === TABS.ARCHIVE && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ym-profile-gallery__badge ym-profile-gallery__badge--archive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "📦" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مؤرشف" })
            ] }),
            activeTab === TABS.PINNED && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ym-profile-gallery__badge ym-profile-gallery__badge--pinned", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "📌" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مثبت" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ym-profile-gallery__stats", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "❤️" }),
                " ",
                post.likes_count || 0
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "💬" }),
                " ",
                post.comments_count || 0
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "↗️" }),
                " ",
                post.shares_count || 0
              ] })
            ] })
          ]
        },
        post.id
      )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ym-profile-gallery__empty-state", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "لا توجد منشورات في هذا القسم" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: showAnalytics,
        onClose: () => setShowAnalytics(false),
        title: "تحليلات الحساب الشخصي",
        size: "large",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 15,
                marginBottom: 30
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "var(--primary)" }, children: analyticsData?.profile_views || 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "زيارات الملف" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 24, fontWeight: "bold", color: "#44ff44" }, children: [
                    analyticsData?.engagement_rate || 0,
                    "%"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "معدل التفاعل" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "#ff9800" }, children: analyticsData?.total_impressions || 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "الانطباعات" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginBottom: 15 }, children: "أداء المنشورات (آخر 30 يوم)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                height: 200,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                padding: 20
              },
              children: Array.isArray(analyticsData?.daily_stats) && analyticsData.daily_stats.length > 0 ? analyticsData.daily_stats.map((stat, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    flex: 1,
                    height: `${Math.max(5, Number(stat.value || 0))}%`,
                    background: "var(--primary)",
                    borderRadius: "4px 4px 0 0",
                    position: "relative",
                    minHeight: "5px"
                  },
                  title: `${stat.date}: ${stat.value}`
                },
                i
              )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "100%", textAlign: "center", color: "#888" }, children: "لا توجد بيانات متاحة" })
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: showCustomization,
        onClose: closeCustomization,
        title: "تخصيص مظهر الملف الشخصي",
        size: "medium",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginBottom: 15 }, children: "اختر السمة (Theme)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: 10,
                marginBottom: 30
              },
              children: ["midnight", "ocean", "sunset", "forest", "aurora"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  onClick: () => handleThemeChange(t),
                  style: {
                    padding: 15,
                    borderRadius: 12,
                    background: t === "midnight" ? "#0f172a" : t === "ocean" ? "#0c4a6e" : t === "sunset" ? "#7c2d12" : t === "forest" ? "#064e3b" : "#4c1d95",
                    border: theme === t ? "3px solid white" : "3px solid transparent",
                    cursor: "pointer",
                    textAlign: "center",
                    color: "white",
                    fontSize: 11,
                    fontWeight: "bold",
                    transition: "all 0.2s ease"
                  },
                  children: t.toUpperCase()
                },
                t
              ))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginBottom: 15 }, children: "إعدادات متقدمة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 12 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إظهار شارة التحقق" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تخطيط الشبكة المتقدم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إظهار عدد المتابعين" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        open: showFollowersInsights,
        onClose: () => setShowFollowersInsights(false),
        title: "رؤى المتابعين",
        size: "large",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 15,
                marginBottom: 30
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "var(--primary)" }, children: followersData?.total_followers || 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "إجمالي المتابعين" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 24, fontWeight: "bold", color: "#44ff44" }, children: followersData?.new_followers_this_week || 0 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "متابعون جدد هذا الأسبوع" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 24, fontWeight: "bold", color: "#ff9800" }, children: [
                    followersData?.top_follower_engagement || 0,
                    "%"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", fontSize: 12 }, children: "أعلى تفاعل" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { style: { marginBottom: 15 }, children: "أكثر المتابعين تفاعلاً" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 10 }, children: Array.isArray(followersData?.top_followers) && followersData.top_followers.length > 0 ? followersData.top_followers.map((follower) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18
                    },
                    children: String(follower.username || "?")[0].toUpperCase()
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: "bold", fontSize: 14 }, children: follower.username }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#888", fontSize: 12 }, children: [
                    "تفاعل: ",
                    follower.engagement_count
                  ] })
                ] })
              ]
            },
            follower.id
          )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#888", textAlign: "center" }, children: "لا توجد بيانات" }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /* ============================================================
           v86.8 — Professional Mobile Post Gallery (Profile Page)
           - Mobile first: 3 columns like Instagram
           - Tablet: 4 columns
           - Desktop: 5 columns
           - أحجام خط مرنة clamp()
           - حدود دائرية وظل ناعم
           - لا فيضان أبداً
           ============================================================ */
        .ym-profile-gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: clamp(4px, 1.2vw, 8px);
          margin-bottom: 30px;
          font-family: 'Cairo', 'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif;
          max-width: 100%;
          overflow: hidden;
        }
        .ym-profile-gallery__item {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #1a1a1a;
          border-radius: clamp(6px, 1.8vw, 10px);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          border: 1px solid rgba(255, 255, 255, 0.05);
          outline: none;
        }
        .ym-profile-gallery__item:hover,
        .ym-profile-gallery__item:focus-visible {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
          border-color: rgba(139, 92, 246, 0.35);
        }
        .ym-profile-gallery__item:active { transform: scale(0.98); }
        .ym-profile-gallery__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ym-profile-gallery__empty {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(1.4rem, 6vw, 2rem);
          color: rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #1a1a1a, #222);
        }

        /* شارات الأرشفة والتثبيت — حجم موحّد مرن */
        .ym-profile-gallery__badge {
          position: absolute;
          top: clamp(4px, 1.4vw, 8px);
          inset-inline-end: clamp(4px, 1.4vw, 8px);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: clamp(2px, 0.8vw, 4px) clamp(5px, 1.6vw, 8px);
          border-radius: 999px;
          font-size: clamp(0.58rem, 2.4vw, 0.7rem);
          font-weight: 700;
          color: #fff;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          line-height: 1.2;
        }
        .ym-profile-gallery__badge--archive {
          background: rgba(0, 0, 0, 0.65);
        }
        .ym-profile-gallery__badge--pinned {
          background: rgba(59, 130, 246, 0.85);
        }

        /* إحصائيات التفاعل — مخفية افتراضياً، تظهر عند التمرير (ديسكتوب) */
        .ym-profile-gallery__stats {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: clamp(6px, 1.8vw, 10px) clamp(6px, 1.6vw, 10px);
          display: flex;
          justify-content: space-between;
          gap: clamp(4px, 1.4vw, 10px);
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0));
          color: #fff;
          font-size: clamp(0.62rem, 2.5vw, 0.78rem);
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          font-variant-numeric: tabular-nums;
        }
        .ym-profile-gallery__stats span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        /* على الديسكتوب: إظهار الإحصائيات عند التمرير */
        @media (hover: hover) {
          .ym-profile-gallery__item:hover .ym-profile-gallery__stats {
            opacity: 1;
          }
        }

        /* على الجوال (أجهزة اللمس): أظهر الإحصائيات دائماً بشفافية خفيفة حتى يراها المستخدم */
        @media (hover: none) {
          .ym-profile-gallery__stats {
            opacity: 0.95;
          }
        }

        /* حالة فارغة */
        .ym-profile-gallery__empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: clamp(24px, 8vw, 48px) 20px;
          color: #888;
          font-size: clamp(0.85rem, 3.4vw, 1rem);
        }

        /* تدرج الأعمدة حسب الشاشة */
        @media (min-width: 640px) {
          .ym-profile-gallery {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
        }
        @media (min-width: 1024px) {
          .ym-profile-gallery {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px;
          }
        }

        /* شاشات ضيقة جداً (≤ 360px): اختصار الإحصائيات */
        @media (max-width: 360px) {
          .ym-profile-gallery {
            gap: 3px;
          }
          .ym-profile-gallery__stats {
            padding: 4px 5px;
            font-size: 0.6rem;
            gap: 3px;
          }
          .ym-profile-gallery__badge {
            font-size: 0.55rem;
            padding: 2px 5px;
          }
        }
      ` })
  ] });
}
export {
  ProfilePage as default
};
