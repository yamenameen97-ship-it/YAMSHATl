import { b0 as reactExports, a9 as getHiddenStoryUsers, ar as jsxRuntimeExports, bb as resolveMediaUrl, q as addHiddenStoryUser, b5 as removeHiddenStoryUser } from "../index-TztUfWYS.js";
import { b as SettingsShell, a as SettingsSection } from "./SettingsShell-Hmy2dSGe.js";
import { U as UserPickerModal } from "./UserPickerModal-sU3J9G9C.js";
function HideStoryFromPage() {
  const [list, setList] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [msg, setMsg] = reactExports.useState("");
  const [pickerOpen, setPickerOpen] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState("");
  const load = reactExports.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHiddenStoryUsers();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError("تعذّر تحميل قائمة المُخفاة");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  const flash = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 1600);
  };
  const handleAdd = async (user) => {
    try {
      await addHiddenStoryUser(user.username);
      await load();
      flash(`لن يرى @${user.username} قصصك بعد الآن.`);
    } catch {
      flash("تعذّر إضافة المستخدم.");
    }
  };
  const handleRemove = async (username) => {
    if (busy) return;
    setBusy(username);
    try {
      await removeHiddenStoryUser(username);
      setList((prev) => prev.filter((u) => u.username !== username));
      flash(`سيتمكن @${username} من رؤية قصصك مجدداً.`);
    } catch {
      flash("تعذّر إزالة المستخدم.");
    } finally {
      setBusy("");
    }
  };
  const excluded = list.map((u) => u.username);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    SettingsShell,
    {
      title: "إخفاء القصة من",
      subtitle: "لن يرى المستخدمون في هذه القائمة أياً من قصصك، حتى لو كانوا أصدقاء لك.",
      icon: "🙈",
      backTo: "/settings/stories",
      message: msg,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ملاحظة:" }),
            " هذا الإجراء يخصّ القصص فقط. المستخدم المُخفَى عنه يظل قادراً على رؤية بقية محتواك (المنشورات، الريلز، الملف التعريفي). إن أردت إخفاء كل شيء، استخدم ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "الحظر" }),
            " من إعدادات الخصوصية."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "القائمة", description: `العدد الحالي: ${list.length}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-toolbar", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "hsf-add-btn", onClick: () => setPickerOpen(true), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "＋" }),
                " إخفاء القصة من مستخدم"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "hsf-refresh", onClick: load, disabled: loading, children: loading ? "…" : "تحديث" })
            ] }),
            error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hsf-empty hsf-error", children: error }) : null,
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hsf-empty", children: "جارٍ التحميل…" }) : list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-empty", children: [
              "لا يوجد أي مستخدم في هذه القائمة حالياً.",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              "كل أصدقائك يمكنهم رؤية قصصك."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hsf-list", children: list.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-user", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "img",
                  {
                    src: resolveMediaUrl(u.avatar || "") || "/default-avatar.png",
                    alt: "",
                    onError: (e) => {
                      e.currentTarget.src = "/default-avatar.png";
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-name", children: [
                    "@",
                    u.username
                  ] }),
                  u.created_at ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hsf-since", children: [
                    "مخفي منذ ",
                    new Date(u.created_at).toLocaleDateString("ar-EG")
                  ] }) : null
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "hsf-remove",
                  onClick: () => handleRemove(u.username),
                  disabled: busy === u.username,
                  children: busy === u.username ? "…" : "إظهار"
                }
              )
            ] }, u.username)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          UserPickerModal,
          {
            open: pickerOpen,
            title: "إخفاء القصة من",
            excludedUsernames: excluded,
            onPick: async (user) => {
              await handleAdd(user);
              setPickerOpen(false);
            },
            onClose: () => setPickerOpen(false)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .hsf-info { background: rgba(255,193,7,0.08); border: 1px solid rgba(255,193,7,0.25); color: #ffd479; padding: 10px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.8; margin-bottom: 12px; }
        .hsf-info em { font-style: normal; font-weight: 700; }
        .hsf-toolbar { display:flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .hsf-add-btn { padding: 8px 14px; border-radius: 10px; border: 0; background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; font-weight: 700; cursor: pointer; font-size: 13px; }
        .hsf-refresh { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: inherit; cursor: pointer; font-size: 13px; }
        .hsf-refresh:disabled { opacity: 0.5; cursor: default; }
        .hsf-empty { padding: 26px 12px; text-align: center; opacity: 0.72; font-size: 13px; line-height: 1.7; }
        .hsf-empty.hsf-error { color: #ff8a8a; opacity: 1; }
        .hsf-list { display: flex; flex-direction: column; gap: 6px; }
        .hsf-row { display:flex; align-items:center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .hsf-row:hover { background: rgba(255,255,255,0.06); }
        .hsf-user { display:flex; align-items:center; gap: 10px; min-width: 0; }
        .hsf-user img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .hsf-name { font-size: 13px; font-weight: 700; }
        .hsf-since { font-size: 11px; opacity: 0.6; margin-top: 2px; }
        .hsf-remove { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(80,200,120,0.4); background: transparent; color: #4ade80; cursor: pointer; font-weight: 600; font-size: 12px; }
        .hsf-remove:hover { background: rgba(80,200,120,0.1); }
        .hsf-remove:disabled { opacity: 0.5; cursor: default; }
      ` })
      ]
    }
  );
}
export {
  HideStoryFromPage as default
};
