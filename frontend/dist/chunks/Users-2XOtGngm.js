import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { Z as useNavigate, ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { i as useQuery } from "./vendor-network-H7MgKIFL.js";
import { E as getCurrentUsername, O as hasPermission, S as Button, b as ListSkeleton, c as unblockUserApi, t as blockUserApi } from "../index-RNpBu_Fp.js";
import { n as banAdminUser, o as deleteAdminUser, t as useDebouncedValue, y as updateAdminUser } from "./useDebouncedValue-Bbubz4pq.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { t as Input } from "./Input-BNYQZD5U.js";
import { t as EmptyState } from "./EmptyState-Co07m3O6.js";
import { t as ErrorState } from "./ErrorState-Xz3LP_u1.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
import { r as getUsers, t as followUser } from "./users-C1eqSvVi.js";
//#region src/pages/Users.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var emptyEditForm = {
	username: "",
	email: "",
	role: "user",
	is_active: true
};
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
	const users = (0, import_react.useMemo)(() => {
		const list = (items || []).filter((user) => (user?.username || user?.name) && (user.username || user.name) !== currentUser).map((user) => ({
			...user,
			username: user.username || user.name,
			blocked_by_me: Boolean(user.blocked_by_me)
		}));
		if (!debouncedQuery) return list;
		return list.filter((user) => user.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
	}, [
		currentUser,
		items,
		debouncedQuery
	]);
	const suggestions = (0, import_react.useMemo)(() => users.slice(0, 5).map((user) => user.username), [users]);
	const syncUser = (username, updater) => {
		setItems((prev) => prev.map((item) => {
			if ((item.username || item.name) !== username) return item;
			return typeof updater === "function" ? updater(item) : {
				...item,
				...updater
			};
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
			if (updated?.username && updated.username !== editingUser.username) setItems((prev) => prev.map((item) => item.id === editingUser.id ? {
				...item,
				...updated || {}
			} : item));
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "section-head",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "section-title",
				children: "Users"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted",
				children: "بحث مباشر، فتح الملف الشخصي، بدء الشات، متابعة، حظر، ومع أدوات إدارة للمشرفين حسب الصلاحيات."
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "search-panel-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "search-shell large enabled-search-shell",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⌕" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: "ابحث باسم المستخدم..."
				})]
			}), suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "search-suggestions",
				children: suggestions.map((username) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mini-action",
					onClick: () => setQuery(username),
					children: username
				}, username))
			}) : null]
		}),
		actionError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "alert error",
			children: actionError
		}) : null,
		isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, { count: 8 }) : null,
		isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, {
			title: "تعذر تحميل المستخدمين",
			description: error?.response?.data?.message || error?.message,
			onRetry: refetch
		}) : null,
		!isLoading && !isError && users.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: "🧑‍🤝‍🧑",
			title: "لا يوجد مستخدمون مطابقون",
			description: "جرّب كلمة بحث مختلفة أو أعد التحديث.",
			actionLabel: "تحديث",
			onAction: refetch
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "list-grid users-rich-grid",
			children: users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "user-row responsive-user-row users-rich-row",
				children: [
					user.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: user.avatar,
						alt: user.username,
						className: "avatar-circle avatar-image"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "avatar-circle",
						children: user.username.slice(0, 1).toUpperCase()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "user-meta expanded-user-meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: user.username }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "muted",
								children: user.blocked_by_me ? "تم حظر هذا الحساب من جهتك." : user.following ? "أنت متابع الحساب ده" : "جاهز للدردشة والمتابعة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "profile-mini-stats",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["المتابعون ", Number(user.followers_count || 0)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["يتابع ", Number(user.following_count || 0)] }),
									user.role ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["الدور ", user.role] }) : null
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "user-row-actions",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => navigate(`/profile/${encodeURIComponent(user.username)}`),
								children: "الملف الشخصي"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => navigate(`/chat/${encodeURIComponent(user.username)}`),
								disabled: user.blocked_by_me,
								children: "فتح الشات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => handleBlockToggle(user),
								disabled: busyUser === `block-${user.username}`,
								children: busyUser === `block-${user.username}` ? "جارٍ التحديث..." : user.blocked_by_me ? "إلغاء الحظر" : "حظر"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => handleFollowToggle(user),
								disabled: busyUser === `follow-${user.username}`,
								children: busyUser === `follow-${user.username}` ? "جارٍ التحديث..." : user.following ? "إلغاء المتابعة" : "متابعة"
							}),
							canEditUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => openEdit(user),
								children: "تعديل"
							}) : null,
							canBanUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => setConfirmAction({
									type: "ban",
									user
								}),
								disabled: busyUser === `ban-${user.username}`,
								children: busyUser === `ban-${user.username}` ? "جارٍ التنفيذ..." : user.is_active ? "حظر" : "استعادة"
							}) : null,
							canDeleteUsers ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => setConfirmAction({
									type: "delete",
									user
								}),
								disabled: busyUser === `delete-${user.username}`,
								children: busyUser === `delete-${user.username}` ? "جارٍ الحذف..." : "حذف"
							}) : null
						]
					})
				]
			}, user.username))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: Boolean(editingUser),
			title: "تعديل بيانات المستخدم",
			onClose: () => setEditingUser(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "Username",
						value: editForm.username,
						onChange: (event) => setEditForm((prev) => ({
							...prev,
							username: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						label: "Email",
						value: editForm.email,
						onChange: (event) => setEditForm((prev) => ({
							...prev,
							email: event.target.value
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field select-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "input",
							value: editForm.role,
							onChange: (event) => setEditForm((prev) => ({
								...prev,
								role: event.target.value
							})),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "admin",
									children: "Admin"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "moderator",
									children: "Moderator"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "user",
									children: "User"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "checkbox-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: editForm.is_active,
							onChange: (event) => setEditForm((prev) => ({
								...prev,
								is_active: event.target.checked
							}))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "الحساب نشط" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setEditingUser(null),
							children: "إلغاء"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleSaveEdit,
							loading: busyUser === `edit-${editingUser?.username || ""}`,
							children: "حفظ التغييرات"
						})]
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: Boolean(confirmAction),
			title: confirmAction?.type === "delete" ? "تأكيد حذف المستخدم" : "تأكيد تغيير الحالة",
			onClose: () => setConfirmAction(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "modal-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: confirmAction?.type === "delete" ? `هل تريد حذف المستخدم ${confirmAction?.user?.username} نهائياً؟` : confirmAction?.user?.is_active ? `هل تريد حظر المستخدم ${confirmAction?.user?.username}؟` : `هل تريد استعادة المستخدم ${confirmAction?.user?.username}؟` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setConfirmAction(null),
						children: "إلغاء"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleConfirmAction,
						loading: busyUser === `${confirmAction?.type}-${confirmAction?.user?.username || ""}`,
						children: confirmAction?.type === "delete" ? "تأكيد الحذف" : "تأكيد العملية"
					})]
				})]
			})
		})
	] });
}
//#endregion
export { Users as default };
