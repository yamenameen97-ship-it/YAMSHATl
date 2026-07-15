import { E as reactExports, an as getUsers, I as jsxRuntimeExports, ah as resolveMediaUrl } from "../index-DRmq1dbV.js";
function UserPickerModal({ open, title, excludedUsernames = [], onPick, onClose }) {
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [q, setQ] = reactExports.useState("");
  const [busyUser, setBusyUser] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getUsers({ limit: 100 });
        if (cancelled) return;
        const arr = Array.isArray(res?.data) ? res.data : [];
        setUsers(arr);
      } catch (e) {
        if (!cancelled) setError("تعذّر تحميل قائمة المستخدمين");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);
  const excluded = reactExports.useMemo(() => new Set(excludedUsernames.map((u) => String(u || "").toLowerCase())), [excludedUsernames]);
  const filtered = reactExports.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => u && u.username && !excluded.has(String(u.username).toLowerCase())).filter((u) => !needle || String(u.username || "").toLowerCase().includes(needle) || String(u.fullName || u.full_name || "").toLowerCase().includes(needle));
  }, [users, q, excluded]);
  if (!open) return null;
  const handlePick = async (user) => {
    if (!user?.username || busyUser) return;
    setBusyUser(user.username);
    try {
      await onPick(user);
    } catch (e) {
    } finally {
      setBusyUser("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-backdrop", role: "dialog", "aria-modal": "true", onClick: onClose, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-card", dir: "rtl", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: title || "اختيار مستخدم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "upm-close", onClick: onClose, "aria-label": "إغلاق", children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          value: q,
          onChange: (e) => setQ(e.target.value),
          placeholder: "ابحث بالاسم أو اسم المستخدم…",
          autoFocus: true
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-body", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-empty", children: "جارٍ التحميل…" }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-empty upm-error", children: error }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-empty", children: "لا توجد نتائج مطابقة." }) : filtered.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-user", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: resolveMediaUrl(u.avatar || u.avatar_url || "") || "/default-avatar.png",
              alt: "",
              onError: (e) => {
                e.currentTarget.src = "/default-avatar.png";
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-user-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "upm-name", children: u.fullName || u.full_name || u.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "upm-username", children: [
              "@",
              u.username
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "upm-add",
            onClick: () => handlePick(u),
            disabled: busyUser === u.username,
            children: busyUser === u.username ? "…" : "إضافة"
          }
        )
      ] }, u.username)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .upm-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index: 9999; padding: 12px; }
        .upm-card { width: min(520px, 100%); max-height: 82vh; display:flex; flex-direction:column; background: var(--surface, #1a1c22); color: var(--text, #e7e9ee); border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,0.5); overflow: hidden; }
        .upm-head { display:flex; align-items:center; justify-content:space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .upm-head h3 { font-size: 15px; margin: 0; }
        .upm-close { background: transparent; border: 0; color: inherit; font-size: 22px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
        .upm-close:hover { background: rgba(255,255,255,0.08); }
        .upm-search { padding: 10px 12px; }
        .upm-search input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: inherit; font-size: 13px; }
        .upm-body { flex: 1 1 auto; overflow-y: auto; padding: 4px 10px 12px; }
        .upm-row { display:flex; align-items:center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; }
        .upm-row:hover { background: rgba(255,255,255,0.04); }
        .upm-user { display:flex; align-items:center; gap: 10px; min-width: 0; }
        .upm-user img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.08); }
        .upm-user-info { min-width: 0; }
        .upm-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .upm-username { font-size: 12px; opacity: 0.7; }
        .upm-add { padding: 6px 14px; border-radius: 8px; border: 0; background: linear-gradient(135deg, #4f9cff, #6b7cff); color: #fff; font-weight: 600; cursor: pointer; font-size: 12px; }
        .upm-add:disabled { opacity: 0.6; cursor: default; }
        .upm-empty { padding: 30px 20px; text-align: center; opacity: 0.7; font-size: 13px; }
        .upm-empty.upm-error { color: #ff8a8a; }
      ` })
  ] });
}
export {
  UserPickerModal as U
};
