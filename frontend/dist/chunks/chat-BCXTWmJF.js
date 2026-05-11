import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { X as useParams, Y as useNavigate, it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { i as useQuery } from "./vendor-network-DXq8mL6N.js";
import { _ as getCurrentUsername, d as ListSkeleton, m as useToast, n as getChatThreads, p as Button } from "../index-dyGfSAus.js";
import { t as Card } from "./Card-zay_4qAf.js";
import { t as EmptyState } from "./EmptyState-D0_Il69q.js";
import { t as MainLayout } from "./MainLayout-mNh2-kKS.js";
//#region src/pages/Chat.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var REACTIONS = [
	"❤️",
	"🔥",
	"😂",
	"👏",
	"👍",
	"😮",
	"😢"
];
function Chat() {
	const { userId } = useParams();
	const { pushToast } = useToast();
	const currentUser = getCurrentUsername();
	const otherUser = userId || "User";
	const [messages, setMessages] = (0, import_react.useState)([{
		id: 1,
		sender: otherUser,
		text: "أهلاً بك في يمشات!",
		time: "10:00 ص",
		type: "text"
	}, {
		id: 2,
		sender: currentUser,
		text: "شكراً لك، التطبيق رائع.",
		time: "10:01 ص",
		type: "text"
	}]);
	const [inputText, setInputText] = (0, import_react.useState)("");
	const [isE2EEnabled, setIsE2EEnabled] = (0, import_react.useState)(true);
	const [forwardingMessage, setForwardingMessage] = (0, import_react.useState)(null);
	const [showForwardModal, setShowForwardModal] = (0, import_react.useState)(false);
	const handleSendMessage = () => {
		if (!inputText.trim()) return;
		const newMessage = {
			id: Date.now(),
			sender: currentUser,
			text: isE2EEnabled ? `🔒 ${inputText}` : inputText,
			time: (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG", {
				hour: "2-digit",
				minute: "2-digit"
			}),
			type: "text",
			isE2E: isE2EEnabled
		};
		setMessages([...messages, newMessage]);
		setInputText("");
	};
	const handleDeleteForEveryone = (messageId) => {
		setMessages(messages.map((msg) => msg.id === messageId ? {
			...msg,
			text: "🚫 تم حذف هذه الرسالة للجميع",
			isDeleted: true
		} : msg));
		pushToast({
			type: "info",
			message: "تم حذف الرسالة للجميع"
		});
	};
	const handleForward = (message) => {
		setForwardingMessage(message);
		setShowForwardModal(true);
	};
	const confirmForward = (targetUser) => {
		pushToast({
			type: "success",
			message: `تم إعادة توجيه الرسالة إلى ${targetUser}`
		});
		setShowForwardModal(false);
		setForwardingMessage(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "calc(100vh - 80px)",
			maxWidth: 800,
			margin: "0 auto",
			padding: 10
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				style: {
					padding: "12px 20px",
					marginBottom: 10,
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
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 40,
							height: 40,
							borderRadius: "50%",
							background: "var(--primary)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontWeight: "bold"
						},
						children: otherUser[0].toUpperCase()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { fontWeight: "bold" },
						children: otherUser
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 12,
							color: "#44ff44"
						},
						children: "متصل الآن"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8,
						alignItems: "center"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontSize: 12,
							color: isE2EEnabled ? "#44ff44" : "#888"
						},
						children: isE2EEnabled ? "🔒 مشفر تماماً" : "🔓 غير مشفر"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setIsE2EEnabled(!isE2EEnabled),
						style: {
							background: "none",
							border: "none",
							cursor: "pointer",
							fontSize: 20
						},
						title: "تبديل التشفير",
						children: isE2EEnabled ? "🛡️" : "🔓"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					flex: 1,
					overflowY: "auto",
					padding: "10px 0",
					display: "flex",
					flexDirection: "column",
					gap: 12
				},
				children: messages.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						alignSelf: msg.sender === currentUser ? "flex-end" : "flex-start",
						maxWidth: "75%",
						position: "relative"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							background: msg.sender === currentUser ? "var(--primary)" : "rgba(255,255,255,0.05)",
							padding: "10px 14px",
							borderRadius: msg.sender === currentUser ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
							color: "white",
							boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
						},
						children: [msg.type === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 10,
								minWidth: 150
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "▶️" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										flex: 1,
										height: 20,
										display: "flex",
										alignItems: "center",
										gap: 2
									},
									children: [
										2,
										5,
										8,
										4,
										6,
										9,
										3,
										7,
										5,
										8
									].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
										width: 3,
										height: `${h * 2}px`,
										background: "white",
										borderRadius: 2
									} }, i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { fontSize: 10 },
									children: "0:12"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { fontSize: 15 },
							children: msg.text
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								fontSize: 10,
								textAlign: "left",
								marginTop: 4,
								opacity: .7
							},
							children: [
								msg.time,
								" ",
								msg.isE2E && "🔒"
							]
						})]
					}), !msg.isDeleted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							marginTop: 4,
							justifyContent: msg.sender === currentUser ? "flex-end" : "flex-start"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									display: "flex",
									gap: 4
								},
								children: REACTIONS.slice(0, 3).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									style: {
										background: "none",
										border: "none",
										fontSize: 12,
										cursor: "pointer"
									},
									children: r
								}, r))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleForward(msg),
								style: {
									background: "none",
									border: "none",
									color: "#888",
									fontSize: 11,
									cursor: "pointer"
								},
								children: "توجيه"
							}),
							msg.sender === currentUser && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleDeleteForEveryone(msg.id),
								style: {
									background: "none",
									border: "none",
									color: "#ff4444",
									fontSize: 11,
									cursor: "pointer"
								},
								children: "حذف للكل"
							})
						]
					})]
				}, msg.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				style: {
					padding: 10,
					display: "flex",
					alignItems: "center",
					gap: 10
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						style: {
							background: "none",
							border: "none",
							fontSize: 20,
							cursor: "pointer"
						},
						children: "📎"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "اكتب رسالة مشفرة...",
						value: inputText,
						onChange: (e) => setInputText(e.target.value),
						onKeyPress: (e) => e.key === "Enter" && handleSendMessage(),
						style: {
							flex: 1,
							background: "rgba(255,255,255,0.05)",
							border: "none",
							padding: "10px 15px",
							borderRadius: 20,
							color: "white",
							outline: "none"
						}
					}),
					inputText ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleSendMessage,
						children: "إرسال"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						style: {
							background: "var(--primary)",
							border: "none",
							width: 40,
							height: 40,
							borderRadius: "50%",
							color: "white",
							cursor: "pointer"
						},
						children: "🎤"
					})
				]
			})
		]
	}), showForwardModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: "rgba(0,0,0,0.8)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			zIndex: 1e3
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			style: {
				width: 300,
				padding: 20
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "إعادة توجيه الرسالة" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gap: 10,
						marginTop: 15
					},
					children: [
						"أحمد",
						"سارة",
						"خالد"
					].map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => confirmForward(user),
						style: {
							padding: 10,
							background: "rgba(255,255,255,0.05)",
							border: "1px solid #333",
							borderRadius: 8,
							color: "white",
							cursor: "pointer",
							textAlign: "right"
						},
						children: user
					}, user))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => setShowForwardModal(false),
					style: {
						marginTop: 15,
						width: "100%"
					},
					children: "إلغاء"
				})
			]
		})
	})] });
}
//#endregion
//#region src/pages/Inbox.jsx
function Inbox() {
	const navigate = useNavigate();
	const currentUser = getCurrentUsername();
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [pinnedChats, setPinnedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [archivedChats, setArchivedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [mutedChats, setMutedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const { data: threads = [], isLoading, refetch } = useQuery({
		queryKey: ["chat-threads", currentUser],
		queryFn: async () => {
			const { data } = await getChatThreads();
			return data || [];
		}
	});
	const filteredThreads = (0, import_react.useMemo)(() => {
		return threads.filter((thread) => {
			const isArchived = archivedChats.has(thread.username);
			const isPinned = pinnedChats.has(thread.username);
			const matchesSearch = thread.username.toLowerCase().includes(searchQuery.toLowerCase());
			if (activeTab === "archived") return isArchived && matchesSearch;
			if (activeTab === "pinned") return isPinned && matchesSearch;
			return !isArchived && matchesSearch;
		}).sort((a, b) => {
			const aPinned = pinnedChats.has(a.username);
			const bPinned = pinnedChats.has(b.username);
			if (aPinned && !bPinned) return -1;
			if (!aPinned && bPinned) return 1;
			return new Date(b.last_message_at) - new Date(a.last_message_at);
		});
	}, [
		threads,
		activeTab,
		searchQuery,
		archivedChats,
		pinnedChats
	]);
	const togglePin = (username, e) => {
		e.stopPropagation();
		const next = new Set(pinnedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setPinnedChats(next);
	};
	const toggleArchive = (username, e) => {
		e.stopPropagation();
		const next = new Set(archivedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setArchivedChats(next);
	};
	const toggleMute = (username, e) => {
		e.stopPropagation();
		const next = new Set(mutedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setMutedChats(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 600,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 20
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					style: { margin: 0 },
					children: "الرسائل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("all"),
							style: { background: activeTab === "all" ? "var(--primary)" : "" },
							children: "الكل"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("pinned"),
							style: { background: activeTab === "pinned" ? "var(--primary)" : "" },
							children: "📌 المثبتة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("archived"),
							style: { background: activeTab === "archived" ? "var(--primary)" : "" },
							children: "📦 مؤرشف"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: { marginBottom: 20 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "ابحث في المحادثات...",
					value: searchQuery,
					onChange: (e) => setSearchQuery(e.target.value),
					style: {
						width: "100%",
						background: "rgba(255,255,255,0.05)",
						border: "1px solid #333",
						padding: "12px 16px",
						borderRadius: 12,
						color: "white"
					}
				})
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : filteredThreads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "لا توجد محادثات",
				description: "ابدأ دردشة جديدة مع أصدقائك الآن."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gap: 10
				},
				children: filteredThreads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					onClick: () => navigate(`/chat/${thread.username}`),
					style: {
						padding: 16,
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 16,
						border: pinnedChats.has(thread.username) ? "1px solid var(--primary)" : "1px solid transparent",
						background: thread.unread_count > 0 ? "rgba(139, 92, 246, 0.05)" : ""
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { position: "relative" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: 50,
									height: 50,
									borderRadius: "50%",
									background: "var(--primary)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontWeight: "bold",
									fontSize: 20
								},
								children: thread.username[0].toUpperCase()
							}), thread.presence?.is_online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
								position: "absolute",
								bottom: 2,
								right: 2,
								width: 12,
								height: 12,
								background: "#44ff44",
								borderRadius: "50%",
								border: "2px solid #111"
							} })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								flex: 1,
								minWidth: 0
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										fontWeight: "bold",
										display: "flex",
										alignItems: "center",
										gap: 6
									},
									children: [
										thread.username,
										mutedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { fontSize: 12 },
											children: "🔇"
										}),
										pinnedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { fontSize: 12 },
											children: "📌"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: { fontSize: 11 },
									children: new Date(thread.last_message_at).toLocaleTimeString("ar-EG", {
										hour: "2-digit",
										minute: "2-digit"
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: {
										fontSize: 13,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis"
									},
									children: thread.last_message || "لا توجد رسائل بعد"
								}), thread.unread_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										background: "var(--primary)",
										color: "white",
										fontSize: 10,
										padding: "2px 6px",
										borderRadius: 10,
										fontWeight: "bold"
									},
									children: thread.unread_count
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 4
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => togglePin(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "تثبيت",
									children: pinnedChats.has(thread.username) ? "📍" : "📌"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => toggleMute(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "كتم",
									children: mutedChats.has(thread.username) ? "🔊" : "🔇"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => toggleArchive(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "أرشفة",
									children: archivedChats.has(thread.username) ? "📤" : "📦"
								})
							]
						})
					]
				}, thread.username))
			})
		]
	}) });
}
//#endregion
export { Chat, Inbox };
