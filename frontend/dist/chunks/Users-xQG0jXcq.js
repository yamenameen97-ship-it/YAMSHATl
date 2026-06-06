import { aP as reactExports, b9 as useNavigate, a1 as getCurrentUsername, ai as hasPermission, bd as useQuery, am as jsxRuntimeExports, k as MainLayout, d as Card, g as ListSkeleton, c as Button, b1 as unblockUserApi, s as blockUserApi } from "../index-T8PSkq5D.js";
import { M as Modal } from "./Modal-CCxskn1a.js";
import { I as Input } from "./Input-DVtIP6sp.js";
import { a as ErrorState, E as EmptyState } from "./ErrorState-dWkt7DdA.js";
import { f as followUser, b as getUsers } from "./users-DfLSLKsg.js";
import { B as useDebouncedValue, z as updateAdminUser, b as banAdminUser, g as deleteAdminUser } from "./useDebouncedValue-DYGuf0KK.js";
import { r as rankSuggestedUsers } from "./recommendationService-Cs-dvkWj.js";
const emptyEditForm = { username: "", email: "", role: "user", is_active: true };
async function fetchUsers() {
  const { data } = await getUsers();
  return Array.isArray(data) ? data : [];
}
function Users() {
  const [query, setQuery] = reactExports.useState("");
  const [items, setItems] = reactExports.useState([]);
  const [actionError, setActionError] = reactExports.useState("");
  const [busyUser, setBusyUser] = reactExports.useState("");
  const [editingUser, setEditingUser] = reactExports.useState(null);
  const [editForm, setEditForm] = reactExports.useState(emptyEditForm);
  const [confirmAction, setConfirmAction] = reactExports.useState(null);
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
  reactExports.useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);
  const enrichedUsers = reactExports.useMemo(() => rankSuggestedUsers(
    (items || []).filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser).map((user) => ({
      ...user,
      username: user.username || user.name,
      blocked_by_me: Boolean(user.blocked_by_me)
    })),
    currentUser
  ), [currentUser, items]);
  const users = reactExports.useMemo(() => {
    if (!debouncedQuery) return enrichedUsers;
    return enrichedUsers.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, enrichedUsers]);
  const suggestions = reactExports.useMemo(() => enrichedUsers.slice(0, 5).map((user) => user.username), [enrichedUsers]);
  const suggestedUsers = reactExports.useMemo(() => enrichedUsers.slice(0, 6), [enrichedUsers]);
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
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || "تعذر تحديث حالة المتابعة.");
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
      setActionError(err?.response?.data?.message || err?.response?.data?.detail || "تعذر تحديث حالة الحظر.");
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
      setActionError(err?.response?.data?.detail || "تعذر حفظ بيانات المستخدم.");
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
      setActionError(err?.response?.data?.detail || "تعذر تنفيذ العملية المطلوبة.");
    } finally {
      setBusyUser("");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-head", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "section-title", children: "Suggested users + people discovery" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "muted", children: "تمت إضافة ترتيب اقتراح المستخدمين حسب التفاعل، النشاط، والمتابعين المشتركين." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1fr) 320px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "search-panel-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "search-shell large enabled-search-shell", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⌕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "ابحث باسم المستخدم..." })
          ] }),
          suggestions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "search-suggestions", children: suggestions.map((username) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "mini-action", onClick: () => setQuery(username), children: username }, username)) }) : null
        ] }),
        actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert error", children: actionError }) : null,
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, { count: 8 }) : null,
        isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { title: "تعذر تحميل المستخدمين", description: error?.response?.data?.message || error?.message, onRetry: refetch }) : null,
        !isLoading && !isError && users.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: "🧑‍🤝‍🧑", title: "لا يوجد مستخدمون مطابقون", description: "جرّب كلمة بحث مختلفة أو أعد التحديث.", actionLabel: "تحديث", onAction: refetch }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-grid users-rich-grid", children: users.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "user-row responsive-user-row users-rich-row", children: [
          user.avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: user.avatar, alt: user.username, className: "avatar-circle avatar-image" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "avatar-circle", children: user.username.slice(0, 1).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-meta expanded-user-meta", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: user.recommendation_reason }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "profile-mini-stats", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Score ",
                Math.round(user.recommendation_score || 0)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "المتابعون ",
                Number(user.followers_count || 0)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "يتابع ",
                Number(user.following_count || 0)
              ] }),
              user.role ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "الدور ",
                user.role
              ] }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-row-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => navigate(`/profile/${encodeURIComponent(user.username)}`), children: "الملف الشخصي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => navigate(`/chat/${encodeURIComponent(user.username)}`), disabled: user.blocked_by_me, children: "فتح الشات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleBlockToggle(user), disabled: busyUser === `block-${user.username}`, children: busyUser === `block-${user.username}` ? "جارٍ التحديث..." : user.blocked_by_me ? "إلغاء الحظر" : "حظر" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleFollowToggle(user), disabled: busyUser === `follow-${user.username}`, children: busyUser === `follow-${user.username}` ? "جارٍ التحديث..." : user.following ? "إلغاء المتابعة" : "متابعة" }),
            canEditUsers ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => openEdit(user), children: "تعديل" }) : null,
            canBanUsers ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setConfirmAction({ type: "ban", user }), disabled: busyUser === `ban-${user.username}`, children: busyUser === `ban-${user.username}` ? "جارٍ التنفيذ..." : user.is_active ? "حظر" : "استعادة" }) : null,
            canDeleteUsers ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setConfirmAction({ type: "delete", user }), disabled: busyUser === `delete-${user.username}`, children: busyUser === `delete-${user.username}` ? "جارٍ الحذف..." : "حذف" }) : null
          ] })
        ] }, user.username)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 18, alignSelf: "start" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { marginTop: 0 }, children: "Suggested users" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 12 }, children: suggestedUsers.map((user, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.58)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "#",
              index + 1,
              " ",
              user.username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { marginTop: 6 }, children: user.recommendation_reason })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { opacity: 0.75 }, children: Math.round(user.recommendation_score || 0) })
        ] }) }, user.username)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: Boolean(editingUser), title: "تعديل بيانات المستخدم", onClose: () => setEditingUser(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Username", value: editForm.username, onChange: (event) => setEditForm((prev) => ({ ...prev, username: event.target.value })) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Email", value: editForm.email, onChange: (event) => setEditForm((prev) => ({ ...prev, email: event.target.value })) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "field select-field", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "field-label", children: "Role" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: editForm.role, onChange: (event) => setEditForm((prev) => ({ ...prev, role: event.target.value })), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Admin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "moderator", children: "Moderator" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "user", children: "User" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: editForm.is_active, onChange: (event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked })) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الحساب نشط" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setEditingUser(null), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveEdit, loading: busyUser === `edit-${editingUser?.username || ""}`, children: "حفظ التغييرات" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { open: Boolean(confirmAction), title: confirmAction?.type === "delete" ? "تأكيد حذف المستخدم" : "تأكيد تغيير الحالة", onClose: () => setConfirmAction(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-stack", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: confirmAction?.type === "delete" ? `هل تريد حذف المستخدم ${confirmAction?.user?.username} نهائياً؟` : confirmAction?.user?.is_active ? `هل تريد حظر المستخدم ${confirmAction?.user?.username}؟` : `هل تريد استعادة المستخدم ${confirmAction?.user?.username}؟` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setConfirmAction(null), children: "إلغاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleConfirmAction, loading: busyUser === `${confirmAction?.type}-${confirmAction?.user?.username || ""}`, children: confirmAction?.type === "delete" ? "تأكيد الحذف" : "تأكيد العملية" })
      ] })
    ] }) })
  ] });
}
export {
  Users as default
};
