import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { S as Button } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { n as getNotifications, t as MainLayout } from "./MainLayout-DmJHsj7d.js";
//#region src/pages/Notifications.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CATEGORIES = [
	{
		id: "all",
		label: "الكل",
		icon: "🔔"
	},
	{
		id: "chat",
		label: "الرسائل",
		icon: "💬"
	},
	{
		id: "interaction",
		label: "التفاعلات",
		icon: "❤️"
	},
	{
		id: "system",
		label: "النظام",
		icon: "⚙️"
	}
];
function Notifications() {
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [showSettings, setShowSettings] = (0, import_react.useState)(false);
	const [settings, setSettings] = (0, import_react.useState)({
		push_enabled: true,
		email_summary: false,
		chat_alerts: true,
		interaction_alerts: true,
		segmentation: "personalized"
	});
	(0, import_react.useEffect)(() => {
		loadNotifications();
	}, []);
	const loadNotifications = async () => {
		const { data } = await getNotifications();
		setNotifications(data || []);
	};
	const filtered = notifications.filter((n) => {
		if (activeTab === "all") return true;
		return n.category === activeTab;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 700,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					style: { margin: 0 },
					children: "الإشعارات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "small",
					onClick: () => setShowSettings(true),
					children: "⚙️ الإعدادات المتقدمة"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "flex",
					gap: 10,
					marginBottom: 20,
					overflowX: "auto",
					paddingBottom: 8
				},
				children: CATEGORIES.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setActiveTab(cat.id),
					style: {
						padding: "8px 16px",
						borderRadius: 20,
						background: activeTab === cat.id ? "var(--primary)" : "rgba(255,255,255,0.05)",
						color: "white",
						border: "none",
						whiteSpace: "nowrap",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.icon }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.label })]
				}, cat.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gap: 12
				},
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					style: {
						padding: 40,
						textAlign: "center"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 40,
							marginBottom: 10
						},
						children: "📭"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "muted",
						children: "لا توجد إشعارات حالياً"
					})]
				}) : filtered.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					style: {
						padding: 16,
						display: "flex",
						gap: 15,
						alignItems: "flex-start",
						opacity: n.seen ? .7 : 1
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								width: 40,
								height: 40,
								borderRadius: "50%",
								background: "var(--primary)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 20
							},
							children: n.category === "chat" ? "💬" : n.category === "interaction" ? "❤️" : "⚙️"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { flex: 1 },
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										fontWeight: "bold",
										marginBottom: 4
									},
									children: n.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: { fontSize: 14 },
									children: n.body
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: {
										fontSize: 11,
										marginTop: 8
									},
									children: new Date(n.created_at).toLocaleString("ar-EG")
								})
							]
						}),
						!n.seen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							width: 8,
							height: 8,
							background: "var(--primary)",
							borderRadius: "50%",
							marginTop: 6
						} })
					]
				}, n.id))
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
		isOpen: showSettings,
		onClose: () => setShowSettings(false),
		title: "إعدادات الإشعارات المتقدمة",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: { padding: 20 },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					style: { marginBottom: 30 },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						style: { marginBottom: 15 },
						children: "تقسيم الإشعارات (Push Segmentation)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "grid",
							gap: 10
						},
						children: [
							{
								id: "personalized",
								title: "مخصص (Personalized)",
								desc: "إشعارات بناءً على اهتماماتك وتفاعلاتك فقط"
							},
							{
								id: "essential",
								title: "الأساسي فقط (Essential)",
								desc: "الرسائل والتحذيرات الأمنية فقط"
							},
							{
								id: "all",
								title: "الكل (All)",
								desc: "استلام كافة التنبيهات دون استثناء"
							}
						].map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onClick: () => setSettings({
								...settings,
								segmentation: seg.id
							}),
							style: {
								padding: 15,
								borderRadius: 12,
								background: "rgba(255,255,255,0.05)",
								border: settings.segmentation === seg.id ? "2px solid var(--primary)" : "2px solid transparent",
								cursor: "pointer"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontWeight: "bold",
									marginBottom: 4
								},
								children: seg.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								style: { fontSize: 12 },
								children: seg.desc
							})]
						}, seg.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					style: { marginBottom: 15 },
					children: "تفضيلات القنوات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "grid",
						gap: 15
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "إشعارات الدفع (Push)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "muted",
							style: { fontSize: 12 },
							children: "تنبيهات فورية على المتصفح/الجهاز"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: settings.push_enabled,
							onChange: (e) => setSettings({
								...settings,
								push_enabled: e.target.checked
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "ملخص البريد الإلكتروني" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "muted",
							style: { fontSize: 12 },
							children: "إرسال ملخص يومي للنشاط الفائت"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: settings.email_summary,
							onChange: (e) => setSettings({
								...settings,
								email_summary: e.target.checked
							})
						})]
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					style: {
						width: "100%",
						marginTop: 30
					},
					onClick: () => setShowSettings(false),
					children: "حفظ الإعدادات"
				})
			]
		})
	})] });
}
//#endregion
export { Notifications };
