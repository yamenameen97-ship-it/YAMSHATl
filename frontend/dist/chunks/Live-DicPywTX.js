import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { C as useToast, E as getCurrentUsername, S as Button, _ as socketManager, m as API } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
//#region src/api/live.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var getLiveRooms = () => API.get("/live_rooms", {
	cache: false,
	forceRefresh: true
});
var getLiveRoom = (roomId) => API.get(`/live_room/${roomId}`, {
	cache: false,
	forceRefresh: true
});
var createLiveRoom = (data) => API.post("/create_live", data);
var getLiveComments = (roomId) => API.get(`/live_comments/${roomId}`, {
	cache: false,
	forceRefresh: true
});
var endLiveRoom = (roomId) => API.post(`/end_live/${roomId}`);
var sendLiveGift = ({ room_id, ...payload }) => API.post(`/live/${room_id}/gift`, payload);
var updateLiveRecording = ({ room_id, action }) => API.post(`/live/${room_id}/recording/${action}`);
//#endregion
//#region src/pages/Live.jsx
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
	const currentUser = getCurrentUsername();
	const [rooms, setRooms] = (0, import_react.useState)([]);
	const [activeRoom, setActiveRoom] = (0, import_react.useState)(null);
	const [comments, setComments] = (0, import_react.useState)([]);
	const [commentText, setCommentText] = (0, import_react.useState)("");
	const [showGifts, setShowGifts] = (0, import_react.useState)(false);
	const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [busy, setBusy] = (0, import_react.useState)("");
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const loadRooms = async () => {
		setLoading(true);
		try {
			const { data } = await getLiveRooms();
			const nextRooms = Array.isArray(data) ? data : [];
			setRooms(nextRooms);
			if (!activeRoom && nextRooms.length) setActiveRoom(nextRooms[0]);
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تحميل البثوث",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setLoading(false);
		}
	};
	const loadRoomDetails = async (roomId) => {
		if (!roomId) return;
		try {
			const [{ data: room }, { data: roomComments }] = await Promise.all([getLiveRoom(roomId), getLiveComments(roomId)]);
			setActiveRoom(room);
			setComments(Array.isArray(roomComments) ? roomComments : []);
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تحميل تفاصيل البث",
				description: err?.response?.data?.detail || err?.message
			});
		}
	};
	(0, import_react.useEffect)(() => {
		loadRooms();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!activeRoom?.id) return void 0;
		loadRoomDetails(activeRoom.id);
		socketManager.connect();
		socketManager.emit("join_live", {
			room_id: activeRoom.id,
			role: activeRoom.username === currentUser ? "host" : "viewer"
		});
		const handleComment = (payload) => {
			if (!payload || payload.room_id !== activeRoom.id) return;
			setComments((prev) => [...prev, payload]);
		};
		const handleStats = (payload) => {
			if (payload?.room_id !== activeRoom.id) return;
			setActiveRoom((prev) => prev ? {
				...prev,
				viewer_count: payload.viewer_count,
				hearts_count: payload.hearts_count
			} : prev);
		};
		socketManager.on("new_comment", handleComment);
		socketManager.on("room_stats", handleStats);
		return () => {
			socketManager.emit("leave_live", { room_id: activeRoom.id });
			socketManager.off("new_comment", handleComment);
			socketManager.off("room_stats", handleStats);
		};
	}, [activeRoom?.id, currentUser]);
	const isHost = activeRoom?.username === currentUser;
	const analytics = (0, import_react.useMemo)(() => {
		const stream = activeRoom?.stream_analytics || {};
		const economy = activeRoom?.economy || {};
		return {
			views: Number(activeRoom?.viewer_count || 0),
			hearts: Number(activeRoom?.hearts_count || 0),
			bitrate: Number(stream?.bitrate_kbps || 0),
			packetLoss: Number(stream?.packet_loss_percent || 0),
			coins: Number(economy?.total_coins || 0)
		};
	}, [activeRoom]);
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
					justifyContent: "center",
					background: "#161616"
				},
				children: [
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { color: "white" },
						children: "جارٍ تحميل البث..."
					}) : null,
					!loading && !activeRoom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { color: "white" },
						children: "لا يوجد بث مباشر حالياً."
					}) : null,
					activeRoom ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							width: "100%",
							height: "100%",
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
									display: "grid",
									placeItems: "center",
									background: "linear-gradient(160deg, #222, #111)"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										textAlign: "center",
										color: "white"
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: { fontSize: 80 },
											children: "🎥"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontWeight: "bold",
												fontSize: 24
											},
											children: activeRoom.title || "بث مباشر"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											style: { opacity: .8 },
											children: ["المضيف: ", activeRoom.username]
										})
									]
								})
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
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: {
											background: "rgba(0,0,0,0.5)",
											padding: "4px 12px",
											borderRadius: 4,
											fontSize: 12
										},
										children: ["👁️ ", activeRoom.viewer_count || 0]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: {
											background: "rgba(0,0,0,0.5)",
											padding: "4px 12px",
											borderRadius: 4,
											fontSize: 12,
											color: "#44ff44"
										},
										children: ["❤️ ", activeRoom.hearts_count || 0]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									position: "absolute",
									top: 20,
									right: 20,
									display: "flex",
									gap: 10,
									flexWrap: "wrap",
									justifyContent: "flex-end"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										size: "small",
										onClick: loadRooms,
										loading,
										children: "تحديث"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										size: "small",
										onClick: () => setShowAnalytics(true),
										disabled: !activeRoom,
										children: "التحليلات"
									}),
									isHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										size: "small",
										onClick: async () => {
											try {
												setBusy("recording");
												const action = isRecording ? "stop" : "start";
												await updateLiveRecording({
													room_id: activeRoom.id,
													action
												});
												setIsRecording((prev) => !prev);
											} catch (err) {
												pushToast({
													type: "error",
													title: "تعذر تحديث التسجيل",
													description: err?.response?.data?.detail || err?.message
												});
											} finally {
												setBusy("");
											}
										},
										loading: busy === "recording",
										children: isRecording ? "إيقاف التسجيل" : "بدء التسجيل"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "danger",
										size: "small",
										onClick: async () => {
											try {
												setBusy("end-live");
												await endLiveRoom(activeRoom.id);
												pushToast({
													type: "success",
													title: "تم إنهاء البث"
												});
												setActiveRoom(null);
												setComments([]);
												await loadRooms();
											} catch (err) {
												pushToast({
													type: "error",
													title: "تعذر إنهاء البث",
													description: err?.response?.data?.detail || err?.message
												});
											} finally {
												setBusy("");
											}
										},
										loading: busy === "end-live",
										children: "إنهاء البث"
									})] }) : null
								]
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
										onClick: () => activeRoom && socketManager.emit("send_heart", { room_id: activeRoom.id }),
										style: {
											background: "#ff4d6d",
											border: "none",
											width: 50,
											height: 50,
											borderRadius: "50%",
											fontSize: 24,
											cursor: "pointer",
											color: "#fff"
										},
										children: "❤️"
									}),
									!isHost ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: async () => {
											try {
												setBusy("create-live");
												const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
												setActiveRoom(data);
												await loadRooms();
											} catch (err) {
												pushToast({
													type: "error",
													title: "تعذر إنشاء البث",
													description: err?.response?.data?.detail || err?.message
												});
											} finally {
												setBusy("");
											}
										},
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
										children: "➕"
									})
								]
							})
						]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					width: 360,
					background: "rgba(0,0,0,0.86)",
					borderLeft: "1px solid #333",
					display: "flex",
					flexDirection: "column"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							padding: 15,
							borderBottom: "1px solid #333",
							fontWeight: "bold",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "الدردشة المباشرة" }), !activeRoom && currentUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "small",
							onClick: async () => {
								try {
									setBusy("create-live");
									const { data } = await createLiveRoom({ title: `بث ${currentUser}` });
									setActiveRoom(data);
									pushToast({
										type: "success",
										title: "تم إنشاء غرفة البث"
									});
									await loadRooms();
								} catch (err) {
									pushToast({
										type: "error",
										title: "تعذر إنشاء غرفة البث",
										description: err?.response?.data?.detail || err?.message
									});
								} finally {
									setBusy("");
								}
							},
							loading: busy === "create-live",
							children: "بدء بث"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							padding: 12,
							borderBottom: "1px solid #222",
							display: "grid",
							gap: 8
						},
						children: rooms.length ? rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 12,
								cursor: "pointer",
								border: activeRoom?.id === room.id ? "1px solid var(--primary)" : void 0
							},
							onClick: () => setActiveRoom(room),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { fontWeight: "bold" },
								children: room.title || "بث مباشر"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "muted",
								children: [
									room.username,
									" · ",
									room.viewer_count || 0,
									" مشاهد"
								]
							})]
						}, room.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { color: "#bbb" },
							children: "لا توجد غرف متاحة الآن."
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							flex: 1,
							overflowY: "auto",
							padding: 15,
							display: "flex",
							flexDirection: "column",
							gap: 10
						},
						children: [comments.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { fontSize: 14 },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								style: {
									fontWeight: "bold",
									color: "var(--primary)",
									marginLeft: 8
								},
								children: [comment.user || comment.username, ":"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: comment.text })]
						}, comment.id || `${comment.user}-${comment.text}-${Math.random()}`)), !comments.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { color: "#999" },
							children: "ابدأ التفاعل داخل البث."
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							padding: 15,
							borderTop: "1px solid #333",
							display: "grid",
							gap: 10
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: commentText,
							onChange: (event) => setCommentText(event.target.value),
							placeholder: "اكتب تعليقاً...",
							style: {
								width: "100%",
								background: "#222",
								border: "none",
								padding: "10px 15px",
								borderRadius: 20,
								color: "white"
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => {
								if (!activeRoom?.id || !commentText.trim()) return;
								socketManager.emit("send_comment", {
									room_id: activeRoom.id,
									text: commentText.trim()
								});
								setCommentText("");
							},
							disabled: !activeRoom || !commentText.trim(),
							children: "إرسال التعليق"
						})]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: showGifts,
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
					onClick: async () => {
						if (!activeRoom?.id) return;
						try {
							await sendLiveGift({
								room_id: activeRoom.id,
								gift_name: gift.name,
								coins: gift.price
							});
							pushToast({
								type: "success",
								title: `تم إرسال ${gift.name} ${gift.icon}`
							});
							setShowGifts(false);
						} catch (err) {
							pushToast({
								type: "error",
								title: "تعذر إرسال الهدية",
								description: err?.response?.data?.detail || err?.message
							});
						}
					},
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
			open: showAnalytics,
			onClose: () => setShowAnalytics(false),
			title: "إحصائيات البث المباشر",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: 20 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 15,
						marginBottom: 20
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
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
								children: analytics.views
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "المشاهدات الحالية"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
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
								children: analytics.coins
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "إجمالي العملات"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 15,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 24,
									fontWeight: "bold",
									color: "#ff4d6d"
								},
								children: analytics.hearts
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "القلوب"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 15,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 24,
									fontWeight: "bold",
									color: "#7dd3fc"
								},
								children: analytics.bitrate
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "Bitrate kbps"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "muted",
					children: [
						"Packet loss: ",
						analytics.packetLoss,
						"%"
					]
				})]
			})
		})
	] });
}
//#endregion
export { Live as default };
