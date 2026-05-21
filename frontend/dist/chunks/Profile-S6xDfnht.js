import { o as useParams, f as getCurrentUsername, r as reactExports, j as jsxRuntimeExports, B as Button } from "../index-DuXBJv5q.js";
import { M as MainLayout } from "./MainLayout-CsZ3tvBx.js";
import { C as Card } from "./Card-qq68bGlj.js";
import { M as Modal } from "./Modal-DM4_qhBh.js";
import { a as getProfileBundle, u as updateMyProfile } from "./users-yjlw8KOa.js";
import "./proxy-BFepwXo2.js";
function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;
  const [profile, setProfile] = reactExports.useState(null);
  const [activeTab, setActiveTab] = reactExports.useState("posts");
  const [showAnalytics, setShowAnalytics] = reactExports.useState(false);
  const [showCustomization, setShowCustomization] = reactExports.useState(false);
  const [theme, setTheme] = reactExports.useState("midnight");
  reactExports.useEffect(() => {
    loadProfile();
  }, [username]);
  const loadProfile = async () => {
    try {
      const { data } = await getProfileBundle(username);
      setProfile(data);
      setTheme(data?.profile_insights?.theme || data?.user?.profile?.profile_theme || "midnight");
    } catch (error) {
      console.error("Failed to load profile", error);
      setProfile({
        user: { username, avatar: "", profile: { bio: "" } },
        counts: { posts: 0, followers: 0, following: 0 },
        posts: [],
        saved_posts: []
      });
    }
  };
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    await updateMyProfile({ profile_theme: newTheme });
  };
  if (!profile) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Loading..." });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-page desktop-post mobile-post", style: { maxWidth: 900, margin: "0 auto", padding: "40px 20px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 40, alignItems: "center", marginBottom: 50 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 150, height: 150, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, fontWeight: "bold", overflow: "hidden" }, children: profile.user.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: profile.user.avatar, alt: profile.user.username, style: { width: "100%", height: "100%", objectFit: "cover" } }) : profile.user.username[0].toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: 0 }, children: profile.user.username }),
            isOwnProfile ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => setShowCustomization(true), children: "تخصيص المظهر" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "small", onClick: () => setShowAnalytics(true), children: "📊 التحليلات" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", children: "متابعة" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 30, marginBottom: 20 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: profile.counts?.posts ?? profile.posts_count ?? 0 }),
              " منشور"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: profile.counts?.followers ?? profile.followers_count ?? 0 }),
              " متابع"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: profile.counts?.following ?? profile.following_count ?? 0 }),
              " يتابع"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { whiteSpace: "pre-wrap" }, children: profile.user.profile?.bio || "لا يوجد نبذة شخصية" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", justifyContent: "center", gap: 40, borderTop: "1px solid var(--line)", marginBottom: 30 }, children: ["posts", "archive", "saved"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab(t),
          style: {
            padding: "15px 0",
            background: "none",
            border: "none",
            borderTop: activeTab === t ? "1px solid white" : "1px solid transparent",
            color: activeTab === t ? "white" : "#888",
            cursor: "pointer",
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1
          },
          children: t === "posts" ? "المنشورات" : t === "archive" ? "الأرشيف" : "المحفوظات"
        },
        t
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }, children: (activeTab === "posts" ? profile.posts : activeTab === "archive" ? profile.archived_posts || [] : profile.saved_posts || [])?.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { aspectRatio: "1/1", background: "#222", borderRadius: 8, overflow: "hidden", position: "relative" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url || post.image_url, alt: "post", style: { width: "100%", height: "100%", objectFit: "cover" } }),
        activeTab === "archive" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 4, fontSize: 10 }, children: "📦 مؤرشف" })
      ] }, post.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showAnalytics, onClose: () => setShowAnalytics(false), title: "تحليلات الحساب الشخصي", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 30 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 28, fontWeight: "bold", color: "var(--primary)" }, children: "12.5k" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "زيارات الملف الشخصي" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 20, textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 28, fontWeight: "bold", color: "#44ff44" }, children: "+15%" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: "معدل التفاعل" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "أداء المنشورات (آخر 30 يوم)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 200, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginTop: 15, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }, children: [30, 50, 40, 80, 60, 95, 70].map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { flex: 1, height: `${h}%`, background: "var(--primary)", borderRadius: "4px 4px 0 0", position: "relative" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "absolute", top: -25, left: "50%", transform: "translateX(-50%)", fontSize: 10 }, children: [
        h,
        "%"
      ] }) }, i)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showCustomization, onClose: () => setShowCustomization(false), title: "تخصيص مظهر الملف الشخصي", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "اختر السمة (Theme)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15, marginTop: 15 }, children: ["midnight", "ocean", "sunset", "forest", "aurora"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          onClick: () => handleThemeChange(t),
          style: {
            padding: 20,
            borderRadius: 12,
            background: t === "midnight" ? "#0f172a" : t === "ocean" ? "#0c4a6e" : t === "sunset" ? "#7c2d12" : t === "forest" ? "#064e3b" : "#4c1d95",
            border: theme === t ? "3px solid white" : "3px solid transparent",
            cursor: "pointer",
            textAlign: "center",
            color: "white",
            fontSize: 12,
            fontWeight: "bold"
          },
          children: t.toUpperCase()
        },
        t
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 30 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "إعدادات متقدمة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 15, marginTop: 15 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "إظهار شارة التحقق" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", defaultChecked: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تخطيط الشبكة المتقدم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Profile as default
};
