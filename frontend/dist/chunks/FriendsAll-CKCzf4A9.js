import { bz as useNavigate, bF as useSearchParams, b0 as reactExports, ar as jsxRuntimeExports, h as MainLayout, f as Link, g as ListSkeleton, d as Card, c as Button } from "../index-TztUfWYS.js";
import { a as ErrorState, E as EmptyState } from "./ErrorState-Cbxu6__N.js";
import { u as useDebouncedValue } from "./useDebouncedValue-BiF-nRr9.js";
import { b as getFriends, e as getReceivedRequests, f as getSentRequests, g as getFriendSuggestions, a as acceptFriendRequest, r as removeFriendship, h as sendFriendRequest, d as dismissSuggestion } from "./friends-DjGVsYRP.js";
const SUB_TABS = [
  { key: "friends", label: "الأصدقاء" },
  { key: "requests", label: "الطلبات الواردة" },
  { key: "sent", label: "الطلبات المرسلة" },
  { key: "suggestions", label: "الاقتراحات" }
];
function Avatar({ user, size = 52 }) {
  if (user?.avatar) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: user.avatar,
        alt: user.username,
        style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(167,139,250,0.18)" }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    color: "#f5f3ff",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: size * 0.4,
    flexShrink: 0
  }, children: (user?.username || "?").slice(0, 1).toUpperCase() });
}
function FriendsAll() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = SUB_TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "friends";
  const [tab, setTab] = reactExports.useState(initialTab);
  const [items, setItems] = reactExports.useState([]);
  const [page, setPage] = reactExports.useState(1);
  const [hasMore, setHasMore] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState("");
  const [actionError, setActionError] = reactExports.useState("");
  const [confirmUnfriend, setConfirmUnfriend] = reactExports.useState(null);
  const [query, setQuery] = reactExports.useState("");
  const debounced = useDebouncedValue(query, 280);
  const mountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => () => {
    mountedRef.current = false;
  }, []);
  const load = reactExports.useCallback(async (nextPage = 1, append = false) => {
    try {
      setLoading(true);
      setError("");
      let res;
      if (tab === "friends") {
        res = await getFriends({ limit: 30, page: nextPage, q: debounced || void 0 });
        const total = res?.data?.total || 0;
        setHasMore(nextPage * 30 < total);
      } else if (tab === "requests") {
        res = await getReceivedRequests();
        setHasMore(false);
      } else if (tab === "sent") {
        res = await getSentRequests();
        setHasMore(false);
      } else {
        res = await getFriendSuggestions(60);
        setHasMore(false);
      }
      if (!mountedRef.current) return;
      const next = res?.data?.items || [];
      setItems((prev) => append ? [...prev, ...next] : next);
      setPage(nextPage);
    } catch (err) {
      if (mountedRef.current) setError(err?.response?.data?.detail || err?.message || "تعذر تحميل القائمة.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tab, debounced]);
  reactExports.useEffect(() => {
    load(1, false);
  }, [load]);
  const switchTab = (key) => {
    setTab(key);
    setItems([]);
    setPage(1);
    setQuery("");
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };
  const handleAction = async (type, target) => {
    if (type === "unfriend") {
      setConfirmUnfriend(target);
      return;
    }
    setActionError("");
    try {
      if (type === "accept") {
        setBusy(`accept-${target}`);
        await acceptFriendRequest(target);
        if (!mountedRef.current) return;
        setItems((p) => p.filter((u) => u.friendship?.friendship_id !== target));
      } else if (type === "decline" || type === "cancel" || type === "unfriend-confirmed") {
        const busyKey = type === "unfriend-confirmed" ? "unfriend" : type;
        setBusy(`${busyKey}-${target}`);
        await removeFriendship(target);
        if (!mountedRef.current) return;
        setItems((p) => p.filter((u) => u.friendship?.friendship_id !== target));
      } else if (type === "add") {
        setBusy(`add-${target}`);
        const { data } = await sendFriendRequest(target);
        if (!mountedRef.current) return;
        const fr = data?.friendship;
        setItems((p) => p.map((u) => u.username === target ? { ...u, friendship: { status: fr?.status, friendship_id: fr?.id, direction: fr?.direction || "outgoing" } } : u));
      } else if (type === "dismiss") {
        setBusy(`dismiss-${target}`);
        await dismissSuggestion(target);
        if (!mountedRef.current) return;
        setItems((p) => p.filter((u) => u.username !== target));
      }
    } catch (err) {
      if (mountedRef.current) {
        setActionError(err?.response?.data?.detail || "فشلت العملية.");
      }
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const filtered = reactExports.useMemo(() => {
    if (!debounced) return items;
    const term = debounced.toLowerCase();
    return items.filter((u) => (u.username || "").toLowerCase().includes(term));
  }, [items, debounced]);
  const renderCardActions = (user) => {
    const fid = user?.friendship?.friendship_id;
    const status = user?.friendship?.status;
    const direction = user?.friendship?.direction;
    if (tab === "requests") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleAction("accept", fid), loading: busy === `accept-${fid}`, disabled: busy === `accept-${fid}`, children: "تأكيد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleAction("decline", fid), loading: busy === `decline-${fid}`, disabled: busy === `decline-${fid}`, children: "حذف" })
      ] });
    }
    if (tab === "sent") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleAction("cancel", fid), loading: busy === `cancel-${fid}`, disabled: busy === `cancel-${fid}`, children: "إلغاء الطلب" });
    }
    if (tab === "friends") {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => navigate(`/chat/${encodeURIComponent(user.username)}`), children: "رسالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleAction("unfriend", fid), loading: busy === `unfriend-${fid}`, disabled: busy === `unfriend-${fid}`, children: "إزالة" })
      ] });
    }
    const pendingOut = status === "pending" && direction === "outgoing";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      pendingOut ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleAction("cancel", fid), loading: busy === `cancel-${fid}`, disabled: busy === `cancel-${fid}`, children: "إلغاء الطلب" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleAction("add", user.username), loading: busy === `add-${user.username}`, disabled: busy === `add-${user.username}`, children: "إضافة صديق" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleAction("dismiss", user.username), loading: busy === `dismiss-${user.username}`, disabled: busy === `dismiss-${user.username}`, children: "إزالة" })
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-all-page", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fa-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "fa-back", onClick: () => navigate("/friends"), "aria-label": "رجوع", children: "‹" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "fa-title", children: [
          "الكل · ",
          SUB_TABS.find((t) => t.key === tab)?.label
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/friends", className: "fa-link", children: "العودة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fa-search", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🔍" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "بحث ضمن القائمة..."
          }
        ),
        query ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setQuery(""), "aria-label": "مسح", className: "fa-clear", children: "×" }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fa-tabs", role: "tablist", children: SUB_TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          role: "tab",
          type: "button",
          "aria-selected": tab === t.key,
          className: `fa-tab ${tab === t.key ? "active" : ""}`,
          onClick: () => switchTab(t.key),
          children: t.label
        },
        t.key
      )) }),
      actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: actionError }) : null,
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل القائمة", description: error, onRetry: () => load(1, false) }) : loading && items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 6 }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        EmptyState,
        {
          icon: "🪶",
          title: "القائمة فارغة",
          description: query ? `لا توجد نتائج لكلمة "${query}".` : "لا توجد عناصر لعرضها هنا حالياً."
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fa-list", children: filtered.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "fa-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { user }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fa-meta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/profile/${encodeURIComponent(user.username)}`, className: "fa-name", children: user.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fa-sub", children: user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : user.reason || "" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fa-actions", children: renderCardActions(user) })
      ] }, `${tab}-${user.friendship?.friendship_id || user.id}`)) }),
      tab === "friends" && hasMore && !loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fa-load-more", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => load(page + 1, true), children: "تحميل المزيد" }) }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .friends-all-page { padding: 12px 4px 28px; max-width: 760px; margin: 0 auto; }
        .fa-header { display: flex; align-items: center; gap: 10px; padding: 6px 4px 10px; }
        .fa-back {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          font-size: 1.4rem; line-height: 1; cursor: pointer;
        }
        .fa-title { margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 800; flex: 1; }
        .fa-link { color: #60a5fa; font-size: 0.85rem; text-decoration: none; font-weight: 700; }
        .fa-search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; margin: 6px 4px 10px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 14px;
        }
        .fa-search input { flex: 1; background: transparent; border: 0; outline: none; color: #e2e8f0; }
        .fa-search input::placeholder { color: #64748b; }
        .fa-clear { border: 0; background: rgba(148,163,184,0.18); color: #e2e8f0;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer; }
        .fa-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 4px 10px; }
        .fa-tab {
          padding: 8px 12px; border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.62); color: #cbd5e1;
          font-weight: 700; cursor: pointer; font-size: 0.85rem;
        }
        .fa-tab.active {
          background: linear-gradient(135deg, #7c3aed, #4c1d95);
          color: #f5f3ff; border-color: rgba(167,139,250,0.55);
        }
        .fa-list { display: grid; gap: 10px; padding: 0 4px; }
        .fa-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 16px;
        }
        .fa-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .fa-name {
          color: #f8fafc; font-weight: 800; text-decoration: none;
          font-size: 0.98rem; max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .fa-name:hover { color: #c4b5fd; }
        .fa-sub { color: #94a3b8; font-size: 0.8rem; }
        .fa-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .fa-actions button { padding: 7px 14px !important; font-size: 0.85rem !important; }
        .fa-load-more { display: grid; place-items: center; padding: 14px; }
        .alert.error {
          padding: 10px 14px; border-radius: 12px; margin: 0 4px 12px;
          background: rgba(248,113,113,0.14); color: #fecaca;
          border: 1px solid rgba(248,113,113,0.32);
        }
        @media (max-width: 560px) {
          .fa-row { flex-wrap: wrap; }
          .fa-actions { width: 100%; justify-content: stretch; }
          .fa-actions button { flex: 1; }
        }
      ` }),
    confirmUnfriend ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "yam-unfriend-title",
        dir: "rtl",
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif"
        },
        onClick: (e) => {
          if (e.target === e.currentTarget) setConfirmUnfriend(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          background: "#1f2233",
          color: "#f8fafc",
          borderRadius: 14,
          width: "100%",
          maxWidth: 380,
          padding: 20,
          boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.08)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: "yam-unfriend-title", style: { margin: "0 0 8px", fontSize: 17, fontWeight: 700 }, children: "❌ إزالة صديق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { margin: "0 0 18px", color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 }, children: "هل تريد إزالة هذا الصديق؟ يمكنك إعادة إرسال طلب صداقة لاحقاً." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setConfirmUnfriend(null),
                style: {
                  padding: "9px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "transparent",
                  color: "inherit",
                  border: "1px solid rgba(255,255,255,0.16)",
                  fontWeight: 600
                },
                children: "إلغاء"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                autoFocus: true,
                onClick: () => {
                  const t = confirmUnfriend;
                  setConfirmUnfriend(null);
                  handleAction("unfriend-confirmed", t);
                },
                style: {
                  padding: "9px 18px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700
                },
                children: "نعم، أزل"
              }
            )
          ] })
        ] })
      }
    ) : null
  ] });
}
export {
  FriendsAll as default
};
