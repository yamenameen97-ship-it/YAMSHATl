import {
  MainLayout,
  getProfileBundle,
  updateMyProfile
} from "./chunk-ZOZSORVL.js";
import "./chunk-AB4CHF2R.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  getCurrentUsername,
  useParams
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Profile.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Profile() {
  const { username: routeUsername } = useParams();
  const currentUser = getCurrentUsername();
  const username = routeUsername || currentUser;
  const isOwnProfile = username === currentUser;
  const [profile, setProfile] = (0, import_react.useState)(null);
  const [activeTab, setActiveTab] = (0, import_react.useState)("posts");
  const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
  const [showCustomization, setShowCustomization] = (0, import_react.useState)(false);
  const [theme, setTheme] = (0, import_react.useState)("midnight");
  (0, import_react.useEffect)(() => {
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
  if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Loading..." });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "profile-page desktop-post mobile-post", style: { maxWidth: 900, margin: "0 auto", padding: "40px 20px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 40, alignItems: "center", marginBottom: 50 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { width: 150, height: 150, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, fontWeight: "bold", overflow: "hidden" }, children: profile.user.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: profile.user.avatar, alt: profile.user.username, style: { width: "100%", height: "100%", objectFit: "cover" } }) : profile.user.username[0].toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: { margin: 0 }, children: profile.user.username }),
            isOwnProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "small", onClick: () => setShowCustomization(true), children: "\u062A\u062E\u0635\u064A\u0635 \u0627\u0644\u0645\u0638\u0647\u0631" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", size: "small", onClick: () => setShowAnalytics(true), children: "\u{1F4CA} \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A" })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { size: "small", children: "\u0645\u062A\u0627\u0628\u0639\u0629" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 30, marginBottom: 20 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.counts?.posts ?? profile.posts_count ?? 0 }),
              " \u0645\u0646\u0634\u0648\u0631"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.counts?.followers ?? profile.followers_count ?? 0 }),
              " \u0645\u062A\u0627\u0628\u0639"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.counts?.following ?? profile.following_count ?? 0 }),
              " \u064A\u062A\u0627\u0628\u0639"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { whiteSpace: "pre-wrap" }, children: profile.user.profile?.bio || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0646\u0628\u0630\u0629 \u0634\u062E\u0635\u064A\u0629" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", justifyContent: "center", gap: 40, borderTop: "1px solid var(--line)", marginBottom: 30 }, children: ["posts", "archive", "saved"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
          children: t === "posts" ? "\u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A" : t === "archive" ? "\u0627\u0644\u0623\u0631\u0634\u064A\u0641" : "\u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0627\u062A"
        },
        t
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }, children: (activeTab === "posts" ? profile.posts : activeTab === "archive" ? profile.archived_posts || [] : profile.saved_posts || [])?.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { aspectRatio: "1/1", background: "#222", borderRadius: 8, overflow: "hidden", position: "relative" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: post.media_url || post.image_url, alt: "post", style: { width: "100%", height: "100%", objectFit: "cover" } }),
        activeTab === "archive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", padding: "2px 8px", borderRadius: 4, fontSize: 10 }, children: "\u{1F4E6} \u0645\u0624\u0631\u0634\u0641" })
      ] }, post.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { isOpen: showAnalytics, onClose: () => setShowAnalytics(false), title: "\u062A\u062D\u0644\u064A\u0644\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0634\u062E\u0635\u064A", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 30 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 20, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 28, fontWeight: "bold", color: "var(--primary)" }, children: "12.5k" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0632\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 20, textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 28, fontWeight: "bold", color: "#44ff44" }, children: "+15%" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", children: "\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u0641\u0627\u0639\u0644" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A (\u0622\u062E\u0631 30 \u064A\u0648\u0645)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 200, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginTop: 15, display: "flex", alignItems: "flex-end", gap: 8, padding: 20 }, children: [30, 50, 40, 80, 60, 95, 70].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { flex: 1, height: `${h}%`, background: "var(--primary)", borderRadius: "4px 4px 0 0", position: "relative" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "absolute", top: -25, left: "50%", transform: "translateX(-50%)", fontSize: 10 }, children: [
        h,
        "%"
      ] }) }, i)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { isOpen: showCustomization, onClose: () => setShowCustomization(false), title: "\u062A\u062E\u0635\u064A\u0635 \u0645\u0638\u0647\u0631 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 20 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0633\u0645\u0629 (Theme)" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15, marginTop: 15 }, children: ["midnight", "ocean", "sunset", "forest", "aurora"].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 30 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u062A\u0642\u062F\u0645\u0629" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 15, marginTop: 15 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0625\u0638\u0647\u0627\u0631 \u0634\u0627\u0631\u0629 \u0627\u0644\u062A\u062D\u0642\u0642" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", defaultChecked: true })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u062A\u0642\u062F\u0645" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox" })
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Profile as default
};
