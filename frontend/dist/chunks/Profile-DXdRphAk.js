import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { Q as useParams, ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { E as getCurrentUsername, S as Button } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
import { i as updateMyProfile, n as getProfileBundle } from "./users-C1eqSvVi.js";
//#region src/pages/Profile.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function Profile() {
	const { username: routeUsername } = useParams();
	const currentUser = getCurrentUsername();
	const username = routeUsername || currentUser;
	const isOwnProfile = username === currentUser;
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [activeTab, setActiveTab] = (0, import_react.useState)("posts");
	const [showAnalytics, setShowAnalytics] = (0, import_react.useState)(false);
	const [showCustomization, setShowCustomization] = (0, import_react.useState)(false);
	const [theme, setTheme] = (0, import_react.useState)("midnight");
	(0, import_react.useEffect)(() => {
		loadProfile();
	}, [username]);
	const loadProfile = async () => {
		const { data } = await getProfileBundle(username);
		setProfile(data);
	};
	const handleThemeChange = async (newTheme) => {
		setTheme(newTheme);
		await updateMyProfile({ profile_theme: newTheme });
	};
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Loading..." }) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				maxWidth: 900,
				margin: "0 auto",
				padding: "40px 20px"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 40,
						alignItems: "center",
						marginBottom: 50
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 150,
							height: 150,
							borderRadius: "50%",
							background: "var(--primary)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 60,
							fontWeight: "bold"
						},
						children: profile.user.username[0].toUpperCase()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { flex: 1 },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 20,
									alignItems: "center",
									marginBottom: 20
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									style: { margin: 0 },
									children: profile.user.username
								}), isOwnProfile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										gap: 10
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										size: "small",
										onClick: () => setShowCustomization(true),
										children: "تخصيص المظهر"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										size: "small",
										onClick: () => setShowAnalytics(true),
										children: "📊 التحليلات"
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "small",
									children: "متابعة"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 30,
									marginBottom: 20
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.posts_count || 0 }), " منشور"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.followers_count || 0 }), " متابع"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.following_count || 0 }), " يتابع"] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: { whiteSpace: "pre-wrap" },
								children: profile.user.profile?.bio || "لا يوجد نبذة شخصية"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						justifyContent: "center",
						gap: 40,
						borderTop: "1px solid var(--line)",
						marginBottom: 30
					},
					children: [
						"posts",
						"archive",
						"saved"
					].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setActiveTab(t),
						style: {
							padding: "15px 0",
							background: "none",
							border: "none",
							borderTop: activeTab === t ? "1px solid white" : "1px solid transparent",
							color: activeTab === t ? "white" : "#888",
							cursor: "pointer",
							fontSize: 13,
							textTransform: "uppercase",
							letterSpacing: 1
						},
						children: t === "posts" ? "المنشورات" : t === "archive" ? "الأرشيف" : "المحفوظات"
					}, t))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: 20
					},
					children: (activeTab === "posts" ? profile.posts : activeTab === "archive" ? profile.archived_posts : profile.saved_posts)?.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							aspectRatio: "1/1",
							background: "#222",
							borderRadius: 8,
							overflow: "hidden",
							position: "relative"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: post.media_url || post.image_url,
							alt: "post",
							style: {
								width: "100%",
								height: "100%",
								objectFit: "cover"
							}
						}), activeTab === "archive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								position: "absolute",
								top: 10,
								right: 10,
								background: "rgba(0,0,0,0.6)",
								padding: "2px 8px",
								borderRadius: 4,
								fontSize: 10
							},
							children: "📦 مؤرشف"
						})]
					}, post.id))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showAnalytics,
			onClose: () => setShowAnalytics(false),
			title: "تحليلات الحساب الشخصي",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: 20 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 15,
							marginBottom: 30
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 20,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 28,
									fontWeight: "bold",
									color: "var(--primary)"
								},
								children: "12.5k"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "زيارات الملف الشخصي"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							style: {
								padding: 20,
								textAlign: "center"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontSize: 28,
									fontWeight: "bold",
									color: "#44ff44"
								},
								children: "+15%"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "muted",
								children: "معدل التفاعل"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "أداء المنشورات (آخر 30 يوم)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							height: 200,
							background: "rgba(255,255,255,0.05)",
							borderRadius: 12,
							marginTop: 15,
							display: "flex",
							alignItems: "flex-end",
							gap: 8,
							padding: 20
						},
						children: [
							30,
							50,
							40,
							80,
							60,
							95,
							70
						].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								flex: 1,
								height: `${h}%`,
								background: "var(--primary)",
								borderRadius: "4px 4px 0 0",
								position: "relative"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									position: "absolute",
									top: -25,
									left: "50%",
									transform: "translateX(-50%)",
									fontSize: 10
								},
								children: [h, "%"]
							})
						}, i))
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showCustomization,
			onClose: () => setShowCustomization(false),
			title: "تخصيص مظهر الملف الشخصي",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { padding: 20 },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "اختر السمة (Theme)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: 15,
							marginTop: 15
						},
						children: [
							"midnight",
							"ocean",
							"sunset",
							"forest",
							"aurora"
						].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							onClick: () => handleThemeChange(t),
							style: {
								padding: 20,
								borderRadius: 12,
								background: t === "midnight" ? "#0f172a" : t === "ocean" ? "#0c4a6e" : t === "sunset" ? "#7c2d12" : t === "forest" ? "#064e3b" : "#4c1d95",
								border: theme === t ? "3px solid white" : "3px solid transparent",
								cursor: "pointer",
								textAlign: "center",
								color: "white",
								fontSize: 12,
								fontWeight: "bold"
							},
							children: t.toUpperCase()
						}, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { marginTop: 30 },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "إعدادات متقدمة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "grid",
								gap: 15,
								marginTop: 15
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "إظهار شارة التحقق" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									defaultChecked: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تخطيط الشبكة المتقدم" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox" })]
							})]
						})]
					})
				]
			})
		})
	] });
}
//#endregion
export { Profile as default };
