import { b0 as reactExports, a5 as getCloseFriends, ar as jsxRuntimeExports, bb as resolveMediaUrl, p as addCloseFriend, b4 as removeCloseFriend } from "../index-D5NOBPt4.js";
import { b as SettingsShell, a as SettingsSection } from "./SettingsShell-N5oYZ67U.js";
import { U as UserPickerModal } from "./UserPickerModal-C96_q8gU.js";
function CloseFriendsManagerPage() {
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
      const res = await getCloseFriends();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setError("تعذّر تحميل قائمة المقربين");
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
      await addCloseFriend(user.username);
      await load();
      flash(`تمت إضافة @${user.username} إلى المقربين.`);
    } catch (e) {
      flash("تعذّر إضافة المستخدم.");
    }
  };
  const handleRemove = async (username) => {
    if (busy) return;
    setBusy(username);
    try {
      await removeCloseFriend(username);
      setList((prev) => prev.filter((u) => u.username !== username));
      flash(`تمت إزالة @${username} من المقربين.`);
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
      title: "الأصدقاء المقربون",
      subtitle: "أعضاء هذه القائمة يرون قصصك المنشورة بخصوصية «المقربون فقط».",
      icon: "💚",
      backTo: "/settings/stories",
      message: msg,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", style: { fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SettingsSection, { title: "الأعضاء", description: `العدد الحالي: ${list.length}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-toolbar", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "cfm-add-btn", onClick: () => setPickerOpen(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: "＋" }),
              " إضافة صديق مقرّب"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "cfm-refresh", onClick: load, disabled: loading, children: loading ? "…" : "تحديث" })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cfm-empty cfm-error", children: error }) : null,
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cfm-empty", children: "جارٍ التحميل…" }) : list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-empty", children: [
            "لا يوجد أصدقاء مقربون بعد.",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "اضغط «إضافة صديق مقرّب» لبناء قائمتك."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cfm-list", children: list.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-user", children: [
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
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-name", children: [
                  "@",
                  u.username
                ] }),
                u.created_at ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cfm-since", children: [
                  "مضاف منذ ",
                  new Date(u.created_at).toLocaleDateString("ar-EG")
                ] }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "cfm-remove",
                onClick: () => handleRemove(u.username),
                disabled: busy === u.username,
                children: busy === u.username ? "…" : "إزالة"
              }
            )
          ] }, u.username)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          UserPickerModal,
          {
            open: pickerOpen,
            title: "إضافة صديق مقرّب",
            excludedUsernames: excluded,
            onPick: async (user) => {
              await handleAdd(user);
              setPickerOpen(false);
            },
            onClose: () => setPickerOpen(false)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .cfm-toolbar { display:flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .cfm-add-btn { padding: 8px 14px; border-radius: 10px; border: 0; background: linear-gradient(135deg, #22c55e, #4ade80); color: #fff; font-weight: 700; cursor: pointer; font-size: 13px; }
        .cfm-refresh { padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); background: transparent; color: inherit; cursor: pointer; font-size: 13px; }
        .cfm-refresh:disabled { opacity: 0.5; cursor: default; }
        .cfm-empty { padding: 26px 12px; text-align: center; opacity: 0.72; font-size: 13px; line-height: 1.7; }
        .cfm-empty.cfm-error { color: #ff8a8a; opacity: 1; }
        .cfm-list { display: flex; flex-direction: column; gap: 6px; }
        .cfm-row { display:flex; align-items:center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); }
        .cfm-row:hover { background: rgba(255,255,255,0.06); }
        .cfm-user { display:flex; align-items:center; gap: 10px; min-width: 0; }
        .cfm-user img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .cfm-name { font-size: 13px; font-weight: 700; }
        .cfm-since { font-size: 11px; opacity: 0.6; margin-top: 2px; }
        .cfm-remove { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,68,68,0.4); background: transparent; color: #ff6b6b; cursor: pointer; font-weight: 600; font-size: 12px; }
        .cfm-remove:hover { background: rgba(255,68,68,0.1); }
        .cfm-remove:disabled { opacity: 0.5; cursor: default; }
      ` })
      ]
    }
  );
}
export {
  CloseFriendsManagerPage as default
};
