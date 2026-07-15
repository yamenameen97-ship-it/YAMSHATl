const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/stories-CE2jHqiL.js","index-D_Nx8mZz.js"])))=>i.map(i=>d[i]);
import { b0 as reactExports, as as jsxRuntimeExports, _ as __vitePreload } from "../index-D_Nx8mZz.js";
import { b as SettingsShell, a as SettingsSection, S as SettingsRow } from "./SettingsShell-BgR7wfkG.js";
import { getMutedStoryUsers, unmuteUserStories } from "./stories-CE2jHqiL.js";
import { U as UserPickerModal } from "./UserPickerModal-DD9GsAvW.js";
function MutedStoriesPage() {
  const [mutedUsers, setMutedUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showPicker, setShowPicker] = reactExports.useState(false);
  const [msg, setMsg] = reactExports.useState("");
  const load = reactExports.useCallback(async () => {
    try {
      const res = await getMutedStoryUsers();
      setMutedUsers(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setMutedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  const handleUnmute = async (username) => {
    try {
      await unmuteUserStories(username);
      setMutedUsers((prev) => prev.filter((u) => u.username !== username));
      setMsg("تم إلغاء الكتم ✓");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("تعذّر التحديث");
      setTimeout(() => setMsg(""), 1500);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    SettingsShell,
    {
      title: "قصص مكتومة",
      subtitle: "المستخدمون الذين كتمت قصصهم — لن تظهر قصصهم في شريط الستوري.",
      icon: "🔕",
      backTo: "/settings/stories",
      message: msg,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "قائمة القصص المكتومة", description: `${mutedUsers.length} مستخدم مكتوم`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsRow, { icon: "➕", title: "كتم قصص مستخدم", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "settings-link-btn",
                onClick: () => setShowPicker(true),
                children: "فتح"
              }
            ) }),
            loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: 24, color: "rgba(255,255,255,0.5)", fontSize: 13 }, children: "جاري التحميل…" }),
            !loading && mutedUsers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center", padding: 32, color: "rgba(255,255,255,0.4)", fontSize: 13 }, children: "لا يوجد مستخدمون مكتومون بعد" }),
            !loading && mutedUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-muted-story-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=8b5cf6&color=fff`,
                  alt: "",
                  className: "yam-muted-story-avatar",
                  loading: "lazy"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-muted-story-info", children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "yam-muted-story-unmute",
                  onClick: () => handleUnmute(user.username),
                  children: "إلغاء الكتم"
                }
              )
            ] }, user.username))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "0 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "📌 الكتم يخفي قصص المستخدم من شريط الستوري فقط — يبقى بإمكانك رؤية بوستاته وريلزه وبروفايله." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "📌 الفرق عن الحظر: الحظر يمنع كل التفاعل. الكتم يخفي القصص فقط دون إشعار الطرف الآخر." })
          ] })
        ] }),
        showPicker && /* @__PURE__ */ jsxRuntimeExports.jsx(
          UserPickerModal,
          {
            open: showPicker,
            title: "كتم قصص مستخدم",
            excludedUsernames: mutedUsers.map((u) => u.username),
            onPick: async (pickedUser) => {
              const username = pickedUser?.username;
              if (!username) return;
              const { muteUserStories } = await __vitePreload(async () => {
                const { muteUserStories: muteUserStories2 } = await import("./stories-CE2jHqiL.js");
                return { muteUserStories: muteUserStories2 };
              }, true ? __vite__mapDeps([0,1]) : void 0);
              try {
                await muteUserStories(username);
                setShowPicker(false);
                setMsg("تم كتم القصص ✓");
                setTimeout(() => setMsg(""), 1500);
                load();
              } catch {
                setMsg("تعذّر الكتم");
                setTimeout(() => setMsg(""), 1500);
              }
            },
            onClose: () => setShowPicker(false)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-muted-story-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .yam-muted-story-row:hover { background: rgba(255,255,255,0.03); }
        .yam-muted-story-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          object-fit: cover; background: #1a1a22;
        }
        .yam-muted-story-info { flex: 1; display: flex; flex-direction: column; }
        .yam-muted-story-info strong { font-size: 14px; color: #fff; }
        .yam-muted-story-unmute {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
        }
        .settings-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 10px;
          background: linear-gradient(135deg, #4f9cff, #6b7cff);
          color: #fff; font-weight: 700; font-size: 12px;
          text-decoration: none; cursor: pointer;
        }
      ` })
      ]
    }
  );
}
export {
  MutedStoriesPage as default
};
