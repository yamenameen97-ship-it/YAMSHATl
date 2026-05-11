import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { m as useToast, p as Button } from "../index-dyGfSAus.js";
import { t as Card } from "./Card-zay_4qAf.js";
import { t as Modal } from "./Modal-jj08kzCG.js";
import { t as MainLayout } from "./MainLayout-mNh2-kKS.js";
//#region src/pages/Live.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var GIFTS = [
	{
		id: 1,
		name: "وردة",
		icon: "🌹",
		price: 10
	},
	{
		id: 2,
		name: "قهوة",
		icon: "☕",
		price: 50
	},
	{
		id: 3,
		name: "قلب",
		icon: "❤️",
		price: 100
	},
	{
		id: 4,
		name: "سيارة",
		icon: "🚗",
		price: 1e3
	},
	{
		id: 5,
		name: "تاج",
		icon: "👑",
		price: 5e3
	}
];
function Live() {
	const { pushToast } = useToast();
	const [isLive, setIsLive] = (0, import_react.useState)(false);
	const [showGifts, setShowGifts] = (0, import_react.useState)(false);
	const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const [hosts, setHosts] = (0, import_react.useState)([{
		id: 1,
		name: "أنت",
		isMain: true
	}]);
	const [comments, setComments] = (0, import_react.useState)([{
		id: 1,
		user: "خالد",
		text: "بث رائع!"
	}, {
		id: 2,
		user: "سارة",
		text: "كيف حالك؟"
	}]);
	const toggleLive = () => {
		setIsLive(!isLive);
		if (!isLive) pushToast({
			type: "success",
			message: "أنت الآن على الهواء مباشرة!"
		});
	};
	const handleSendGift = (gift) => {
		pushToast({
			type: "info",
			message: `تم إرسال ${gift.name} ${gift.icon}`
		});
		setShowGifts(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				height: "calc(100vh - 70px)",
				background: "#000",
				position: "relative"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: "100%",
							height: "100%",
							background: "#1a1a1a",
							display: "flex",
							flexWrap: "wrap",
							gap: 2,
							padding: 2
						},
						children: hosts.map((host) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								flex: hosts.length === 1 ? "1 1 100%" : "1 1 48%",
								background: "#333",
								borderRadius: 8,
								position: "relative",
								display: "flex",
								alignItems: "center",
								justifyContent: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { fontSize: 40 },
								children: "👤"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									position: "absolute",
									bottom: 10,
									left: 10,
									background: "rgba(0,0,0,0.5)",
									padding: "2px 8px",
									borderRadius: 4,
									fontSize: 12
								},
								children: host.name
							})]
						}, host.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							top: 20,
							left: 20,
							display: "flex",
							gap: 10,
							alignItems: "center"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									background: "#ff4444",
									padding: "4px 12px",
									borderRadius: 4,
									fontWeight: "bold",
									fontSize: 12
								},
								children: "LIVE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									background: "rgba(0,0,0,0.5)",
									padding: "4px 12px",
									borderRadius: 4,
									fontSize: 12
								},
								children: "👁️ 1.2k"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									background: "rgba(0,0,0,0.5)",
									padding: "4px 12px",
									borderRadius: 4,
									fontSize: 12,
									color: "#44ff44"
								},
								children: "Excellent Connection"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							top: 20,
							right: 20,
							display: "flex",
							gap: 10
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							size: "small",
							onClick: () => setShowAnalytics(true),
							children: "📊 التحليلات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							size: "small",
							onClick: toggleLive,
							children: isLive ? "إنهاء البث" : "بدء البث"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							bottom: 30,
							left: "50%",
							transform: "translateX(-50%)",
							display: "flex",
							gap: 15
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowGifts(true),
								style: {
									background: "gold",
									border: "none",
									width: 50,
									height: 50,
									borderRadius: "50%",
									fontSize: 24,
									cursor: "pointer"
								},
								children: "🎁"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setIsRecording(!isRecording),
								style: {
									background: isRecording ? "#ff4444" : "white",
									border: "none",
									width: 50,
									height: 50,
									borderRadius: "50%",
									fontSize: 24,
									cursor: "pointer"
								},
								children: "⏺️"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setHosts([...hosts, {
									id: Date.now(),
									name: "ضيف جديد"
								}]),
								style: {
									background: "var(--primary)",
									border: "none",
									width: 50,
									height: 50,
									borderRadius: "50%",
									fontSize: 24,
									color: "white",
									cursor: "pointer"
								},
								children: "👥"
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					width: 350,
					background: "rgba(0,0,0,0.8)",
					borderLeft: "1px solid #333",
					display: "flex",
					flexDirection: "column"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							padding: 15,
							borderBottom: "1px solid #333",
							fontWeight: "bold"
						},
						children: "الدردشة المباشرة"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							flex: 1,
							overflowY: "auto",
							padding: 15,
							display: "flex",
							flexDirection: "column",
							gap: 10
						},
						children: comments.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { fontSize: 14 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: {
									fontWeight: "bold",
									color: "var(--primary)",
									marginLeft: 8
								},
								children: [c.user, ":"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.text })]
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							padding: 15,
							borderTop: "1px solid #333"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							placeholder: "اكتب تعليقاً...",
							style: {
								width: "100%",
								background: "#222",
								border: "none",
								padding: "10px 15px",
								borderRadius: 20,
								color: "white"
							}
						})
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showGifts,
			onClose: () => setShowGifts(false),
			title: "أرسل هدية للمضيف",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					padding: 20,
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 15
				},
				children: GIFTS.map((gift) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => handleSendGift(gift),
					style: {
						textAlign: "center",
						padding: 15,
						background: "rgba(255,255,255,0.05)",
						borderRadius: 12,
						cursor: "pointer"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 30,
								marginBottom: 8
							},
							children: gift.icon
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontWeight: "bold",
								fontSize: 14
							},
							children: gift.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								color: "gold",
								fontSize: 12
							},
							children: [gift.price, " عملة"]
						})
					]
				}, gift.id))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showAnalytics,
			onClose: () => setShowAnalytics(false),
			title: "إحصائيات البث المباشر",
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
								children: "2,450"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "إجمالي المشاهدات"
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
									color: "gold"
								},
								children: "15,200"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "إجمالي العملات"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "مخطط التفاعل" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							height: 150,
							background: "rgba(255,255,255,0.05)",
							borderRadius: 12,
							marginTop: 10,
							display: "flex",
							alignItems: "flex-end",
							gap: 5,
							padding: 10
						},
						children: [
							20,
							45,
							30,
							80,
							60,
							90,
							40,
							55,
							70,
							85
						].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							flex: 1,
							height: `${h}%`,
							background: "var(--primary)",
							borderRadius: 2
						} }, i))
					})
				]
			})
		})
	] });
}
//#endregion
export { Live as default };
