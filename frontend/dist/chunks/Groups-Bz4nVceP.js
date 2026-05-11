import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { p as Button } from "../index-dyGfSAus.js";
import { t as Card } from "./Card-zay_4qAf.js";
import { t as Modal } from "./Modal-jj08kzCG.js";
import { n as getGroups } from "./groups-aTe0iIur.js";
import { t as MainLayout } from "./MainLayout-mNh2-kKS.js";
//#region src/pages/Groups.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ROLES = [
	{
		id: "admin",
		label: "مدير",
		color: "#ff4444"
	},
	{
		id: "moderator",
		label: "مشرف",
		color: "#ffaa00"
	},
	{
		id: "member",
		label: "عضو",
		color: "#44ff44"
	}
];
function Groups() {
	const [groups, setGroups] = (0, import_react.useState)([]);
	const [selectedGroup, setSelectedGroup] = (0, import_react.useState)(null);
	const [showInviteModal, setShowInviteModal] = (0, import_react.useState)(false);
	const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("members");
	(0, import_react.useEffect)(() => {
		loadGroups();
	}, []);
	const loadGroups = async () => {
		const { data } = await getGroups();
		setGroups(data || []);
		if (data?.length > 0) setSelectedGroup(data[0]);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				height: "calc(100vh - 70px)",
				maxWidth: 1200,
				margin: "0 auto"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					width: 300,
					borderLeft: "1px solid var(--line)",
					padding: 20,
					overflowY: "auto"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 20
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						style: { margin: 0 },
						children: "مجموعاتي"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "small",
						children: "➕"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gap: 10
					},
					children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						onClick: () => setSelectedGroup(g),
						style: {
							padding: 12,
							cursor: "pointer",
							background: selectedGroup?.id === g.id ? "rgba(139, 92, 246, 0.1)" : "",
							border: selectedGroup?.id === g.id ? "1px solid var(--primary)" : "1px solid transparent"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { fontWeight: "bold" },
							children: g.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "muted",
							style: { fontSize: 12 },
							children: [g.members_count, " عضو"]
						})]
					}, g.id))
				})]
			}), selectedGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					padding: 30,
					overflowY: "auto"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							marginBottom: 30
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							style: { margin: "0 0 8px 0" },
							children: selectedGroup.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted",
							children: selectedGroup.description
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 10
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								onClick: () => setShowInviteModal(true),
								children: "➕ دعوة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => setShowAnalytics(true),
								children: "📊 التحليلات"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							gap: 20,
							borderBottom: "1px solid var(--line)",
							marginBottom: 24
						},
						children: [
							"members",
							"moderation",
							"settings"
						].map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setActiveTab(tab),
							style: {
								padding: "12px 0",
								background: "none",
								border: "none",
								borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
								color: activeTab === tab ? "white" : "#888",
								cursor: "pointer",
								fontWeight: activeTab === tab ? "bold" : "normal"
							},
							children: tab === "members" ? "الأعضاء" : tab === "moderation" ? "الرقابة" : "الإعدادات"
						}, tab))
					}),
					activeTab === "members" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "grid",
							gap: 12
						},
						children: [
							{
								id: 1,
								name: "أحمد محمد",
								role: "admin"
							},
							{
								id: 2,
								name: "سارة خالد",
								role: "moderator"
							},
							{
								id: 3,
								name: "ياسين علي",
								role: "member"
							}
						].map((member) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: "12px 20px",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 12
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
									width: 35,
									height: 35,
									borderRadius: "50%",
									background: "#444"
								} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: { fontWeight: "bold" },
									children: member.name
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 15
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: {
										fontSize: 11,
										padding: "2px 8px",
										borderRadius: 10,
										background: ROLES.find((r) => r.id === member.role).color + "33",
										color: ROLES.find((r) => r.id === member.role).color
									},
									children: ROLES.find((r) => r.id === member.role).label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									style: {
										background: "none",
										border: "none",
										color: "#888",
										cursor: "pointer"
									},
									children: "⚙️"
								})]
							})]
						}, member.id))
					}),
					activeTab === "moderation" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gap: 20
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: { padding: 20 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "المنشورات المعلقة (Pending)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								style: {
									textAlign: "center",
									padding: "20px 0"
								},
								children: "لا توجد منشورات بانتظار المراجعة"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: { padding: 20 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "قواعد المجموعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "grid",
									gap: 10,
									marginTop: 15
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										padding: 10,
										background: "rgba(255,255,255,0.05)",
										borderRadius: 8
									},
									children: "1. الاحترام المتبادل بين الأعضاء"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										padding: 10,
										background: "rgba(255,255,255,0.05)",
										borderRadius: 8
									},
									children: "2. يمنع نشر الروابط الخارجية دون إذن"
								})]
							})]
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: "اختر مجموعة لعرض تفاصيلها" })
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showInviteModal,
			onClose: () => setShowInviteModal(false),
			title: "دعوة أعضاء للمجموعة",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: 20 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "شارك رابط الدعوة مع أصدقائك:" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 10,
							marginBottom: 20
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							readOnly: true,
							value: `https://yamshat.com/join/${selectedGroup?.id}`,
							style: {
								flex: 1,
								background: "#222",
								border: "1px solid #444",
								padding: 10,
								borderRadius: 8,
								color: "white"
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => alert("تم النسخ!"),
							children: "نسخ"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "divider",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "أو ابحث عن صديق" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						placeholder: "ابحث بالاسم أو البريد...",
						style: {
							width: "100%",
							background: "#222",
							border: "1px solid #444",
							padding: 10,
							borderRadius: 8,
							color: "white",
							marginTop: 15
						}
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showAnalytics,
			onClose: () => setShowAnalytics(false),
			title: "تحليلات المجموعة",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: 20 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 15,
							marginBottom: 20
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 15,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 24,
									fontWeight: "bold",
									color: "var(--primary)"
								},
								children: "+12%"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "نمو الأعضاء (هذا الشهر)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 15,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 24,
									fontWeight: "bold",
									color: "#44ff44"
								},
								children: "850"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "عضو نشط يومياً"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "أكثر الأعضاء تفاعلاً" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							height: 150,
							background: "rgba(255,255,255,0.05)",
							borderRadius: 12,
							marginTop: 10,
							display: "flex",
							alignItems: "flex-end",
							gap: 10,
							padding: 15
						},
						children: [
							40,
							70,
							50,
							90,
							60
						].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							flex: 1,
							height: `${h}%`,
							background: "var(--primary)",
							borderRadius: "4px 4px 0 0"
						} }, i))
					})
				]
			})
		})
	] });
}
//#endregion
export { Groups as default };
