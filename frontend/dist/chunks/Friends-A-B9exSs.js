import { bx as useNavigate, bD as useSearchParams, b0 as reactExports, as as jsxRuntimeExports, h as MainLayout, g as ListSkeleton, f as Link, d as Card, c as Button } from "../index-D_Nx8mZz.js";
import { a as ErrorState, E as EmptyState } from "./ErrorState-DH0i98l0.js";
import { u as useDebouncedValue } from "./useDebouncedValue-CYVuzFq4.js";
import { b as getFriends, e as getReceivedRequests, f as getSentRequests, g as getFriendSuggestions, c as getFriendsStats, s as searchFriendsCandidates, a as acceptFriendRequest, r as removeFriendship, h as sendFriendRequest, d as dismissSuggestion } from "./friends-ZQaJzsuy.js";
const TABS = [
  { key: "friends", label: "أصدقاؤك" },
  { key: "suggestions", label: "الاقتراحات" }
];
function Avatar({ user, size = 56 }) {
  if (user?.avatar) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: user.avatar,
        alt: user.username,
        style: {
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid rgba(167,139,250,0.18)"
        }
      }
    );
  }
  const letter = (user?.username || "?").slice(0, 1).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
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
      },
      children: letter
    }
  );
}
function RequestRow({ user, busy, onAccept, onDecline }) {
  const friendshipId = user?.friendship?.friendship_id;
  const isBusyAccept = busy === `accept-${friendshipId}`;
  const isBusyDecline = busy === `decline-${friendshipId}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "friend-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { user }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-meta", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/profile/${encodeURIComponent(user.username)}`, className: "friend-row-name", children: user.username }),
      user.mutual_friends ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "friend-row-sub", children: [
        user.mutual_friends,
        " صديق مشترك"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "friend-row-sub", children: "طلب صداقة جديد" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => onAccept(friendshipId), loading: isBusyAccept, disabled: isBusyAccept || isBusyDecline, children: "تأكيد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => onDecline(friendshipId), loading: isBusyDecline, disabled: isBusyAccept || isBusyDecline, children: "حذف" })
    ] })
  ] });
}
function SuggestionRow({ user, busy, onSend, onCancel, onDismiss }) {
  const status = user?.friendship?.status || "none";
  const direction = user?.friendship?.direction;
  const friendshipId = user?.friendship?.friendship_id;
  const isBusyAdd = busy === `add-${user.username}`;
  const isBusyCancel = busy === `cancel-${friendshipId}`;
  const isBusyDismiss = busy === `dismiss-${user.username}`;
  const pendingOutgoing = status === "pending" && direction === "outgoing";
  const accepted = status === "accepted";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "friend-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { user }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-meta", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/profile/${encodeURIComponent(user.username)}`, className: "friend-row-name", children: user.username }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "friend-row-sub", children: pendingOutgoing ? "تم إرسال الطلب" : accepted ? "صديق بالفعل" : user.reason || (user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : "مقترح لك") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-actions", children: [
      accepted ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", disabled: true, children: "صديقك" }) : pendingOutgoing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => onCancel(friendshipId), loading: isBusyCancel, disabled: isBusyCancel, children: "إلغاء الطلب" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => onSend(user.username), loading: isBusyAdd, disabled: isBusyAdd, children: "إضافة صديق" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => onDismiss(user.username), loading: isBusyDismiss, disabled: isBusyDismiss, children: "إزالة" })
    ] })
  ] });
}
function ConfirmDialog({ dialog, onClose }) {
  const cancelRef = reactExports.useRef(null);
  const cardRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!dialog) return void 0;
    const t = window.setTimeout(() => {
      try {
        cancelRef.current?.focus();
      } catch {
      }
    }, 30);
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const root = cardRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll("button:not([disabled])");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          try {
            last.focus();
          } catch {
          }
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          try {
            first.focus();
          } catch {
          }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [dialog, onClose]);
  if (!dialog) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "presentation",
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          ref: cardRef,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "yam-confirm-msg",
          dir: "rtl",
          onClick: (e) => e.stopPropagation(),
          style: {
            width: "100%",
            maxWidth: 380,
            background: "linear-gradient(180deg,#1e1b3a,#14122a)",
            borderRadius: 16,
            padding: "20px 18px",
            border: "1px solid rgba(124,58,237,0.35)",
            color: "#fff",
            fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "yam-confirm-msg", style: { margin: "0 0 18px", fontSize: 15, lineHeight: 1.7 }, children: dialog.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  ref: cancelRef,
                  type: "button",
                  onClick: onClose,
                  style: {
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  },
                  children: "إلغاء"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => dialog.onConfirm?.(),
                  style: {
                    flex: 1.2,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: dialog.danger ? "linear-gradient(90deg,#ef4444,#b91c1c)" : "linear-gradient(90deg,#7c3aed,#a855f7)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit"
                  },
                  children: dialog.confirmLabel || "موافق"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function FriendRow({ user, busy, onUnfriend, onMessage }) {
  const friendshipId = user?.friendship?.friendship_id;
  const isBusyRemove = busy === `unfriend-${friendshipId}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "friend-row", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { user }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-meta", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/profile/${encodeURIComponent(user.username)}`, className: "friend-row-name", children: user.username }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "friend-row-sub", children: user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : "صديق" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => onMessage(user.username), children: "رسالة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => onUnfriend(friendshipId), loading: isBusyRemove, disabled: isBusyRemove, children: "إزالة من الأصدقاء" })
    ] })
  ] });
}
function Friends() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "friends";
  const [activeTab, setActiveTab] = reactExports.useState(initialTab);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 280);
  const [friends, setFriends] = reactExports.useState([]);
  const [requests, setRequests] = reactExports.useState([]);
  const [sentRequests, setSentRequests] = reactExports.useState([]);
  const [suggestions, setSuggestions] = reactExports.useState([]);
  const [stats, setStats] = reactExports.useState({ friends: 0, requests_received: 0, requests_sent: 0 });
  const [searchResults, setSearchResults] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchLoading, setSearchLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [actionError, setActionError] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState("");
  const [confirmDialog, setConfirmDialog] = reactExports.useState(null);
  const mountedRef = reactExports.useRef(true);
  reactExports.useEffect(() => () => {
    mountedRef.current = false;
  }, []);
  const safeSet = reactExports.useCallback((setter) => (value) => {
    if (mountedRef.current) setter(value);
  }, []);
  const loadAll = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [friendsRes, requestsRes, sentRes, suggestionsRes, statsRes] = await Promise.all([
        getFriends({ limit: 50, page: 1 }).catch(() => ({ data: { items: [] } })),
        getReceivedRequests().catch(() => ({ data: { items: [] } })),
        getSentRequests().catch(() => ({ data: { items: [] } })),
        getFriendSuggestions(20).catch(() => ({ data: { items: [] } })),
        getFriendsStats().catch(() => ({ data: { friends: 0, requests_received: 0, requests_sent: 0 } }))
      ]);
      if (!mountedRef.current) return;
      setFriends(friendsRes?.data?.items || []);
      setRequests(requestsRes?.data?.items || []);
      setSentRequests(sentRes?.data?.items || []);
      setSuggestions(suggestionsRes?.data?.items || []);
      setStats(statsRes?.data || { friends: 0, requests_received: 0, requests_sent: 0 });
    } catch (err) {
      safeSet(setError)(err?.response?.data?.detail || err?.message || "تعذر تحميل بيانات الأصدقاء.");
    } finally {
      safeSet(setLoading)(false);
    }
  }, [safeSet]);
  reactExports.useEffect(() => {
    loadAll();
  }, [loadAll]);
  reactExports.useEffect(() => {
    let cancelled = false;
    const q = (debouncedSearch || "").trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return void 0;
    }
    setSearchLoading(true);
    searchFriendsCandidates(q, 25).then((res) => {
      if (cancelled || !mountedRef.current) return;
      setSearchResults(res?.data?.items || []);
    }).catch(() => {
      if (!cancelled && mountedRef.current) setSearchResults([]);
    }).finally(() => {
      if (!cancelled && mountedRef.current) setSearchLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);
  const switchTab = (key) => {
    setActiveTab(key);
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };
  const handleAccept = async (friendshipId) => {
    try {
      setBusy(`accept-${friendshipId}`);
      setActionError("");
      await acceptFriendRequest(friendshipId);
      if (!mountedRef.current) return;
      const accepted = requests.find((u) => u.friendship?.friendship_id === friendshipId);
      setRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      if (accepted) {
        setFriends((prev) => [
          { ...accepted, friendship: { ...accepted.friendship, status: "accepted" } },
          ...prev.filter((u) => u.id !== accepted.id)
        ]);
        const markAccepted = (list) => list.map((u) => u.username === accepted.username ? { ...u, friendship: { status: "accepted", friendship_id: friendshipId, direction: null } } : u);
        setSuggestions(markAccepted);
        setSearchResults(markAccepted);
      }
      setStats((s) => ({ ...s, friends: s.friends + 1, requests_received: Math.max(0, s.requests_received - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر قبول الطلب.");
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleDeclineIncoming = async (friendshipId) => {
    try {
      setBusy(`decline-${friendshipId}`);
      setActionError("");
      await removeFriendship(friendshipId);
      if (!mountedRef.current) return;
      setRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      setStats((s) => ({ ...s, requests_received: Math.max(0, s.requests_received - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر حذف الطلب.");
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleSendRequest = async (username) => {
    try {
      setBusy(`add-${username}`);
      setActionError("");
      const { data } = await sendFriendRequest(username);
      if (!mountedRef.current) return;
      const friendship = data?.friendship;
      const updater = (list) => list.map((u) => u.username === username ? { ...u, friendship: { status: friendship?.status || "pending", friendship_id: friendship?.id, direction: friendship?.direction || "outgoing" } } : u);
      setSuggestions(updater);
      setSearchResults(updater);
      if (friendship?.status === "pending") {
        setStats((s) => ({ ...s, requests_sent: s.requests_sent + 1 }));
      } else if (friendship?.status === "accepted") {
        setStats((s) => ({ ...s, friends: s.friends + 1 }));
      }
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر إرسال الطلب.");
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleCancelOutgoing = async (friendshipId) => {
    try {
      setBusy(`cancel-${friendshipId}`);
      setActionError("");
      await removeFriendship(friendshipId);
      if (!mountedRef.current) return;
      const updater = (list) => list.map((u) => u.friendship?.friendship_id === friendshipId ? { ...u, friendship: { status: "none", friendship_id: null, direction: null } } : u);
      setSuggestions(updater);
      setSearchResults(updater);
      setSentRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      setStats((s) => ({ ...s, requests_sent: Math.max(0, s.requests_sent - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر إلغاء الطلب.");
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleDismiss = async (username) => {
    try {
      setBusy(`dismiss-${username}`);
      setActionError("");
      await dismissSuggestion(username);
      if (!mountedRef.current) return;
      setSuggestions((prev) => prev.filter((u) => u.username !== username));
      setSearchResults((prev) => prev.filter((u) => u.username !== username));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر إزالة المقترح.");
    } finally {
      if (mountedRef.current) setBusy("");
    }
  };
  const handleUnfriend = (friendshipId) => {
    setConfirmDialog({
      message: "هل تريد إزالة هذا الصديق من قائمتك؟",
      confirmLabel: "إزالة",
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setBusy(`unfriend-${friendshipId}`);
          setActionError("");
          await removeFriendship(friendshipId);
          if (!mountedRef.current) return;
          setFriends((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
          setStats((s) => ({ ...s, friends: Math.max(0, s.friends - 1) }));
        } catch (err) {
          if (mountedRef.current) setActionError(err?.response?.data?.detail || "تعذر إزالة الصديق.");
        } finally {
          if (mountedRef.current) setBusy("");
        }
      }
    });
  };
  const handleMessage = (username) => navigate(`/chat/${encodeURIComponent(username)}`);
  const visibleFriends = reactExports.useMemo(() => {
    if (!debouncedSearch || activeTab !== "friends") return friends.slice(0, 6);
    const term = debouncedSearch.toLowerCase();
    return friends.filter((u) => (u.username || "").toLowerCase().includes(term));
  }, [friends, debouncedSearch, activeTab]);
  const previewSuggestions = reactExports.useMemo(() => suggestions.slice(0, 8), [suggestions]);
  const hasSearch = (debouncedSearch || "").trim().length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-page", dir: "rtl", "data-page": "friends", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-header-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "friends-back", onClick: () => navigate(-1), "aria-label": "رجوع", children: "‹" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "friends-title", children: "الأصدقاء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-stats", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "stat-pill", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: stats.friends }),
              " صديق"
            ] }),
            stats.requests_received > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "stat-pill warn", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: stats.requests_received }),
              " طلب جديد"
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friends-search", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "🔍" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "search",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              placeholder: "ابحث عن صديق بالاسم...",
              "aria-label": "بحث عن صديق"
            }
          ),
          searchQuery ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "friends-search-clear", onClick: () => setSearchQuery(""), "aria-label": "مسح البحث", children: "×" }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-tabs", role: "tablist", children: TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": activeTab === tab.key,
            className: `friends-tab ${activeTab === tab.key ? "active" : ""}`,
            onClick: () => switchTab(tab.key),
            children: [
              tab.label,
              tab.key === "friends" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tab-count", children: stats.friends }) : null
            ]
          },
          tab.key
        )) })
      ] }),
      actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", role: "alert", children: actionError }) : null,
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل البيانات", description: error, onRetry: loadAll }) : null,
      hasSearch ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "section-h", children: "نتائج البحث" }),
          searchLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted small", children: "جارٍ البحث..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted small", children: [
            searchResults.length,
            " نتيجة"
          ] })
        ] }),
        searchLoading && !searchResults.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 3 }) : searchResults.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🔎", title: "لا توجد نتائج", description: `لم نعثر على مستخدمين باسم "${debouncedSearch}".` }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: searchResults.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          SuggestionRow,
          {
            user,
            busy,
            onSend: handleSendRequest,
            onCancel: handleCancelOutgoing,
            onDismiss: handleDismiss
          },
          `search-${user.id}`
        )) })
      ] }) : null,
      activeTab === "friends" && !hasSearch ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "section-h", children: [
              "طلبات الصداقة ",
              requests.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge", children: requests.length }) : null
            ] }),
            requests.length > 3 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/friends/all?tab=requests", className: "see-all", children: "عرض الكل" }) : null
          ] }),
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 2 }) : requests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "📭", title: "لا توجد طلبات جديدة", description: "عندما يرسل لك شخص طلب صداقة سيظهر هنا." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: requests.slice(0, 3).map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            RequestRow,
            {
              user,
              busy,
              onAccept: handleAccept,
              onDecline: handleDeclineIncoming
            },
            user.friendship.friendship_id
          )) })
        ] }),
        sentRequests.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "section-h", children: [
              "الطلبات المرسلة ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge muted", children: sentRequests.length })
            ] }),
            sentRequests.length > 3 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/friends/all?tab=sent", className: "see-all", children: "عرض الكل" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: sentRequests.slice(0, 3).map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "friend-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { user }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "friend-row-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/profile/${encodeURIComponent(user.username)}`, className: "friend-row-name", children: user.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "friend-row-sub", children: "في انتظار الموافقة" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friend-row-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "secondary",
                onClick: () => handleCancelOutgoing(user.friendship.friendship_id),
                loading: busy === `cancel-${user.friendship.friendship_id}`,
                disabled: busy === `cancel-${user.friendship.friendship_id}`,
                children: "إلغاء الطلب"
              }
            ) })
          ] }, user.friendship.friendship_id)) })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "section-h", children: "أشخاص قد تعرفهم" }),
            suggestions.length > 8 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/friends/all?tab=suggestions", className: "see-all", children: "عرض الكل" }) : null
          ] }),
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 4 }) : previewSuggestions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "✨", title: "لا توجد اقتراحات حالياً", description: "جرّب لاحقاً أو ابحث عن صديق بالاسم." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: previewSuggestions.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            SuggestionRow,
            {
              user,
              busy,
              onSend: handleSendRequest,
              onCancel: handleCancelOutgoing,
              onDismiss: handleDismiss
            },
            `sug-${user.id}`
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "section-h", children: [
              "أصدقاؤك ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge muted", children: friends.length })
            ] }),
            friends.length > 6 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/friends/all?tab=friends", className: "see-all", children: "عرض الكل" }) : null
          ] }),
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 3 }) : visibleFriends.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            EmptyState,
            {
              icon: "🧑‍🤝‍🧑",
              title: "لا أصدقاء بعد",
              description: "ابدأ بإضافة أصدقاء من قسم الاقتراحات أو ابحث بالاسم.",
              actionLabel: "استعراض الاقتراحات",
              onAction: () => switchTab("suggestions")
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: visibleFriends.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            FriendRow,
            {
              user,
              busy,
              onUnfriend: handleUnfriend,
              onMessage: handleMessage
            },
            user.friendship?.friendship_id || user.id
          )) })
        ] })
      ] }) : null,
      activeTab === "suggestions" && !hasSearch ? /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "friends-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-head-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "section-h", children: "جميع الاقتراحات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "muted small", children: [
            suggestions.length,
            " مقترح"
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 6 }) : suggestions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "✨", title: "لا توجد اقتراحات حالياً", description: "عاود الزيارة لاحقاً أو ابحث عن صديق بالاسم." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "friends-list", children: suggestions.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          SuggestionRow,
          {
            user,
            busy,
            onSend: handleSendRequest,
            onCancel: handleCancelOutgoing,
            onDismiss: handleDismiss
          },
          `s-${user.id}`
        )) })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(ConfirmDialog, { dialog: confirmDialog, onClose: () => setConfirmDialog(null) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .friends-page { padding: 12px 4px 28px; max-width: 760px; margin: 0 auto; }
        .friends-header {
          position: sticky; top: 0; z-index: 30;
          background: linear-gradient(180deg, rgba(8,10,22,0.96), rgba(8,10,22,0.86));
          backdrop-filter: blur(8px);
          padding: 10px 8px 6px; margin-bottom: 14px;
          border-bottom: 1px solid rgba(148,163,184,0.12);
          border-radius: 0 0 18px 18px;
        }
        .friends-header-row {
          display: flex; align-items: center; gap: 10px; padding: 4px 4px 8px;
        }
        .friends-back {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          font-size: 1.4rem; line-height: 1; cursor: pointer;
        }
        .friends-title {
          margin: 0; font-size: 1.18rem; color: #f8fafc; font-weight: 800; flex: 1;
        }
        .friends-stats { display: flex; gap: 6px; flex-wrap: wrap; }
        .stat-pill {
          padding: 4px 10px; border-radius: 999px;
          background: rgba(124,58,237,0.18);
          color: #ddd6fe; font-size: 0.78rem; border: 1px solid rgba(167,139,250,0.25);
        }
        .stat-pill strong { color: #fff; margin-left: 4px; }
        .stat-pill.warn {
          background: rgba(248,113,113,0.16); color: #fecaca;
          border-color: rgba(248,113,113,0.32);
        }
        .friends-search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; margin: 6px 4px 10px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 14px;
        }
        .friends-search input {
          flex: 1; background: transparent; border: 0; outline: none;
          color: #e2e8f0; font-size: 0.95rem;
        }
        .friends-search input::placeholder { color: #64748b; }
        .friends-search-clear {
          border: 0; background: rgba(148,163,184,0.18); color: #e2e8f0;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          font-size: 1rem; line-height: 1;
        }
        .friends-tabs {
          display: flex; gap: 8px; padding: 0 4px 4px;
        }
        .friends-tab {
          flex: 1; padding: 10px 14px; border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.62); color: #cbd5e1;
          font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: all .18s ease;
        }
        .friends-tab.active {
          background: linear-gradient(135deg, #7c3aed, #4c1d95);
          color: #f5f3ff; border-color: rgba(167,139,250,0.55);
          box-shadow: 0 4px 16px rgba(124,58,237,0.32);
        }
        .friends-tab .tab-count {
          background: rgba(255,255,255,0.18); color: #fff;
          padding: 1px 8px; border-radius: 999px; font-size: 0.75rem;
        }
        .friends-section { padding: 6px 6px 18px; }
        .section-head-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 4px 10px;
        }
        .section-h {
          margin: 0; font-size: 1rem; color: #f8fafc; font-weight: 800;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .badge {
          background: #7c3aed; color: #fff; padding: 2px 8px;
          border-radius: 999px; font-size: 0.78rem;
        }
        .badge.muted {
          background: rgba(148,163,184,0.22); color: #cbd5e1;
        }
        .see-all {
          color: #60a5fa; font-size: 0.86rem; font-weight: 700;
          text-decoration: none;
        }
        .see-all:hover { text-decoration: underline; }
        .muted.small { color: #94a3b8; font-size: 0.82rem; }
        .friends-list { display: grid; gap: 10px; }
        .friend-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 16px;
        }
        .friend-row-meta {
          flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;
        }
        .friend-row-name {
          color: #f8fafc; font-weight: 800; text-decoration: none;
          font-size: 0.98rem; max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .friend-row-name:hover { color: #c4b5fd; }
        .friend-row-sub { color: #94a3b8; font-size: 0.8rem; }
        .friend-row-actions {
          display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;
        }
        .friend-row-actions button { padding: 7px 14px !important; font-size: 0.85rem !important; }
        .alert.error {
          padding: 10px 14px; border-radius: 12px; margin: 0 4px 12px;
          background: rgba(248,113,113,0.14); color: #fecaca;
          border: 1px solid rgba(248,113,113,0.32);
        }
        @media (max-width: 560px) {
          .friend-row { flex-wrap: wrap; }
          .friend-row-actions { width: 100%; justify-content: stretch; }
          .friend-row-actions button { flex: 1; }
        }
      ` })
  ] });
}
export {
  Friends as default
};
