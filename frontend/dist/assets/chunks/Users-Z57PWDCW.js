import {
  rankSuggestedUsers
} from "./chunk-LADVLV2U.js";
import {
  MainLayout,
  followUser,
  getUsers
} from "./chunk-ZOZSORVL.js";
import {
  useQuery
} from "./chunk-AB4CHF2R.js";
import {
  banAdminUser,
  deleteAdminUser,
  updateAdminUser,
  useDebouncedValue
} from "./chunk-AMXAPOO5.js";
import {
  ErrorState
} from "./chunk-X4EAIF56.js";
import {
  EmptyState
} from "./chunk-I2PPYNN4.js";
import {
  Modal
} from "./chunk-ERP4JHH7.js";
import {
  Card
} from "./chunk-WNGLVHI2.js";
import {
  ListSkeleton
} from "./chunk-4ZQ5VGKF.js";
import {
  blockUserApi,
  unblockUserApi
} from "./chunk-HHMVNFXU.js";
import "./chunk-JSOE33EX.js";
import {
  Input
} from "./chunk-RYTW2TDG.js";
import "./chunk-BDBRQ2OX.js";
import {
  Button
} from "./chunk-EHD43N2I.js";
import {
  getCurrentUsername,
  hasPermission,
  useNavigate
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/pages/Users.jsx
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var emptyEditForm = { username: "", email: "", role: "user", is_active: true };
async function fetchUsers() {
  const { data } = await getUsers();
  return Array.isArray(data) ? data : [];
}
function Users() {
  const [query, setQuery] = (0, import_react.useState)("");
  const [items, setItems] = (0, import_react.useState)([]);
  const [actionError, setActionError] = (0, import_react.useState)("");
  const [busyUser, setBusyUser] = (0, import_react.useState)("");
  const [editingUser, setEditingUser] = (0, import_react.useState)(null);
  const [editForm, setEditForm] = (0, import_react.useState)(emptyEditForm);
  const [confirmAction, setConfirmAction] = (0, import_react.useState)(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);
  const canEditUsers = hasPermission("users.edit");
  const canBanUsers = hasPermission("users.ban");
  const canDeleteUsers = hasPermission("users.delete");
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers
  });
  (0, import_react.useEffect)(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);
  const enrichedUsers = (0, import_react.useMemo)(() => rankSuggestedUsers(
    (items || []).filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser).map((user) => ({
      ...user,
      username: user.username || user.name,
      blocked_by_me: Boolean(user.blocked_by_me)
    })),
    currentUser
  ), [currentUser, items]);
  const users = (0, import_react.useMemo)(() => {
    if (!debouncedQuery) return enrichedUsers;
    return enrichedUsers.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, enrichedUsers]);
  const suggestions = (0, import_react.useMemo)(() => enrichedUsers.slice(0, 5).map((user) => user.username), [enrichedUsers]);
  const suggestedUsers = (0, import_react.useMemo)(() => enrichedUsers.slice(0, 6), [enrichedUsers]);
  const syncUser = (username, updater) => {
    setItems((prev) => prev.map((item) => {
      const itemUsername = item.username || item.name;
      if (itemUsername !== username) return item;
      return typeof updater === "function" ? updater(item) : { ...item, ...updater };
    }));
  };
  const handleFollowToggle = async (user) => {
    try {
      setBusyUser(`follow-${user.username}`);
      setActionError("");
      const { data: response } = await followUser(user.username);
      syncUser(user.username, (item) => ({
        ...item,
        following: Boolean(response?.following),
        followers_count: Number(response?.followers ?? item.followers_count ?? 0)
      }));
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629.");
    } finally {
      setBusyUser("");
    }
  };
  const handleBlockToggle = async (user) => {
    try {
      setBusyUser(`block-${user.username}`);
      setActionError("");
      const response = user.blocked_by_me ? await unblockUserApi(user.username) : await blockUserApi(user.username);
      syncUser(user.username, { blocked_by_me: Boolean(response?.data?.blocked_by_me) });
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u062D\u0638\u0631.");
    } finally {
      setBusyUser("");
    }
  };
  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email || "",
      role: user.role || "user",
      is_active: Boolean(user.is_active ?? true)
    });
  };
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setBusyUser(`edit-${editingUser.username}`);
      setActionError("");
      const { data: updated } = await updateAdminUser(editingUser.id, editForm);
      syncUser(editingUser.username, updated || {});
      setEditingUser(null);
    } catch (err) {
      setActionError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.");
    } finally {
      setBusyUser("");
    }
  };
  const handleConfirmAction = async () => {
    if (!confirmAction?.user) return;
    const user = confirmAction.user;
    try {
      setBusyUser(`${confirmAction.type}-${user.username}`);
      setActionError("");
      if (confirmAction.type === "ban") {
        const { data: updated } = await banAdminUser(user.id, !user.is_active);
        syncUser(user.username, updated || {});
      } else if (confirmAction.type === "delete") {
        await deleteAdminUser(user.id);
        setItems((prev) => prev.filter((item) => item.id !== user.id));
      }
      setConfirmAction(null);
    } catch (err) {
      setActionError(err?.response?.data?.detail || "\u062A\u0639\u0630\u0631 \u062A\u0646\u0641\u064A\u0630 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.");
    } finally {
      setBusyUser("");
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "section-head", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "section-title", children: "Suggested users + people discovery" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "muted", children: "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 \u062A\u0631\u062A\u064A\u0628 \u0627\u0642\u062A\u0631\u0627\u062D \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u062D\u0633\u0628 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u060C \u0627\u0644\u0646\u0634\u0627\u0637\u060C \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u064A\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u0643\u064A\u0646." })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1fr) 320px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "search-panel-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "search-shell large enabled-search-shell", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2315" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645..." })
          ] }),
          suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "search-suggestions", children: suggestions.map((username) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "mini-action", onClick: () => setQuery(username), children: username }, username)) }) : null
        ] }),
        actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "alert error", children: actionError }) : null,
        isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, { count: 8 }) : null,
        isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { title: "\u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646", description: error?.response?.data?.message || error?.message, onRetry: refetch }) : null,
        !isLoading && !isError && users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { icon: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}", title: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0645\u0637\u0627\u0628\u0642\u0648\u0646", description: "\u062C\u0631\u0651\u0628 \u0643\u0644\u0645\u0629 \u0628\u062D\u062B \u0645\u062E\u062A\u0644\u0641\u0629 \u0623\u0648 \u0623\u0639\u062F \u0627\u0644\u062A\u062D\u062F\u064A\u062B.", actionLabel: "\u062A\u062D\u062F\u064A\u062B", onAction: refetch }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "list-grid users-rich-grid", children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { className: "user-row responsive-user-row users-rich-row", children: [
          user.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: user.avatar, alt: user.username, className: "avatar-circle avatar-image" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "avatar-circle", children: user.username.slice(0, 1).toUpperCase() }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-meta expanded-user-meta", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user.username }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "muted", children: user.recommendation_reason }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "profile-mini-stats", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "Score ",
                Math.round(user.recommendation_score || 0)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0648\u0646 ",
                Number(user.followers_count || 0)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "\u064A\u062A\u0627\u0628\u0639 ",
                Number(user.following_count || 0)
              ] }),
              user.role ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "\u0627\u0644\u062F\u0648\u0631 ",
                user.role
              ] }) : null
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "user-row-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => navigate(`/profile/${encodeURIComponent(user.username)}`), children: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => navigate(`/chat/${encodeURIComponent(user.username)}`), disabled: user.blocked_by_me, children: "\u0641\u062A\u062D \u0627\u0644\u0634\u0627\u062A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => handleBlockToggle(user), disabled: busyUser === `block-${user.username}`, children: busyUser === `block-${user.username}` ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B..." : user.blocked_by_me ? "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0638\u0631" : "\u062D\u0638\u0631" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: () => handleFollowToggle(user), disabled: busyUser === `follow-${user.username}`, children: busyUser === `follow-${user.username}` ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u062F\u064A\u062B..." : user.following ? "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629" : "\u0645\u062A\u0627\u0628\u0639\u0629" }),
            canEditUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => openEdit(user), children: "\u062A\u0639\u062F\u064A\u0644" }) : null,
            canBanUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setConfirmAction({ type: "ban", user }), disabled: busyUser === `ban-${user.username}`, children: busyUser === `ban-${user.username}` ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u0646\u0641\u064A\u0630..." : user.is_active ? "\u062D\u0638\u0631" : "\u0627\u0633\u062A\u0639\u0627\u062F\u0629" }) : null,
            canDeleteUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setConfirmAction({ type: "delete", user }), disabled: busyUser === `delete-${user.username}`, children: busyUser === `delete-${user.username}` ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0630\u0641..." : "\u062D\u0630\u0641" }) : null
          ] })
        ] }, user.username)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { style: { padding: 18, alignSelf: "start" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { marginTop: 0 }, children: "Suggested users" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 12 }, children: suggestedUsers.map((user, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.58)" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", gap: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
              "#",
              index + 1,
              " ",
              user.username
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "muted", style: { marginTop: 6 }, children: user.recommendation_reason })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { opacity: 0.75 }, children: Math.round(user.recommendation_score || 0) })
        ] }) }, user.username)) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { open: Boolean(editingUser), title: "\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", onClose: () => setEditingUser(null), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "modal-stack", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { label: "Username", value: editForm.username, onChange: (event) => setEditForm((prev) => ({ ...prev, username: event.target.value })) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { label: "Email", value: editForm.email, onChange: (event) => setEditForm((prev) => ({ ...prev, email: event.target.value })) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "field select-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "field-label", children: "Role" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { className: "input", value: editForm.role, onChange: (event) => setEditForm((prev) => ({ ...prev, role: event.target.value })), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "admin", children: "Admin" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "moderator", children: "Moderator" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "user", children: "User" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: editForm.is_active, onChange: (event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked })) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0646\u0634\u0637" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setEditingUser(null), children: "\u0625\u0644\u063A\u0627\u0621" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: handleSaveEdit, loading: busyUser === `edit-${editingUser?.username || ""}`, children: "\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A" })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, { open: Boolean(confirmAction), title: confirmAction?.type === "delete" ? "\u062A\u0623\u0643\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645" : "\u062A\u0623\u0643\u064A\u062F \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629", onClose: () => setConfirmAction(null), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "modal-stack", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: confirmAction?.type === "delete" ? `\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${confirmAction?.user?.username} \u0646\u0647\u0627\u0626\u064A\u0627\u064B\u061F` : confirmAction?.user?.is_active ? `\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0638\u0631 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${confirmAction?.user?.username}\u061F` : `\u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${confirmAction?.user?.username}\u061F` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "secondary", onClick: () => setConfirmAction(null), children: "\u0625\u0644\u063A\u0627\u0621" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { onClick: handleConfirmAction, loading: busyUser === `${confirmAction?.type}-${confirmAction?.user?.username || ""}`, children: confirmAction?.type === "delete" ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641" : "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0639\u0645\u0644\u064A\u0629" })
      ] })
    ] }) })
  ] });
}
export {
  Users as default
};
