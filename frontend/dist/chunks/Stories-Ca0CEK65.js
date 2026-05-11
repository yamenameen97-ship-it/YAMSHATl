import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { p as Button } from "../index-DMsnM20S.js";
import { t as Card } from "./Card-zay_4qAf.js";
import "./Modal-jj08kzCG.js";
import { o as uploadStory, r as getStoryArchive, t as getStories } from "./stories-JgE-MDnX.js";
import { t as MainLayout } from "./MainLayout-oc_Nbmmv.js";
//#region src/pages/Stories.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		name: "الأصلي",
		class: ""
	},
	{
		name: "ذهبي",
		class: "sepia(0.5) contrast(1.2)"
	},
	{
		name: "بارد",
		class: "hue-rotate(180deg) brightness(1.1)"
	},
	{
		name: "درامي",
		class: "grayscale(1) contrast(1.5)"
	},
	{
		name: "ناعم",
		class: "blur(1px) brightness(1.2)"
	}
];
function Stories() {
	const [activeTab, setActiveTab] = (0, import_react.useState)("feed");
	const [stories, setStories] = (0, import_react.useState)([]);
	const [archive, setArchive] = (0, import_react.useState)([]);
	const [selectedFile, setSelectedFile] = (0, import_react.useState)(null);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)("");
	const [isCloseFriends, setIsCloseFriends] = (0, import_react.useState)(false);
	const [activeFilter, setActiveFilter] = (0, import_react.useState)(FILTERS[0]);
	const [isDrawing, setIsDrawing] = (0, import_react.useState)(false);
	const canvasRef = (0, import_react.useRef)(null);
	const ctxRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		loadData();
	}, []);
	const loadData = async () => {
		const [sRes, aRes] = await Promise.all([getStories(), getStoryArchive()]);
		setStories(sRes.data || []);
		setArchive(aRes.data || []);
	};
	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		if (file) {
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
			setActiveTab("create");
		}
	};
	(0, import_react.useEffect)(() => {
		if (activeTab === "create" && canvasRef.current) {
			const canvas = canvasRef.current;
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			const ctx = canvas.getContext("2d");
			ctx.lineCap = "round";
			ctx.strokeStyle = "white";
			ctx.lineWidth = 5;
			ctxRef.current = ctx;
		}
	}, [activeTab]);
	const startDrawing = (e) => {
		setIsDrawing(true);
		const { offsetX, offsetY } = e.nativeEvent;
		ctxRef.current.beginPath();
		ctxRef.current.moveTo(offsetX, offsetY);
	};
	const draw = (e) => {
		if (!isDrawing) return;
		const { offsetX, offsetY } = e.nativeEvent;
		ctxRef.current.lineTo(offsetX, offsetY);
		ctxRef.current.stroke();
	};
	const stopDrawing = () => {
		setIsDrawing(false);
	};
	const handleUpload = async () => {
		await uploadStory({
			file: selectedFile,
			is_close_friends: isCloseFriends,
			filter: activeFilter.name
		});
		setActiveTab("feed");
		loadData();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 500,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 12,
					marginBottom: 20
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setActiveTab("feed"),
						style: { background: activeTab === "feed" ? "var(--primary)" : "" },
						children: "القصص"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => setActiveTab("archive"),
						style: { background: activeTab === "archive" ? "var(--primary)" : "" },
						children: "🗄️ الأرشيف"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						style: { marginLeft: "auto" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							hidden: true,
							onChange: handleFileSelect,
							accept: "image/*,video/*"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							as: "span",
							style: { cursor: "pointer" },
							children: "➕ قصة جديدة"
						})]
					})
				]
			}),
			activeTab === "feed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 12
				},
				children: stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					style: {
						height: 250,
						position: "relative",
						overflow: "hidden",
						border: story.is_close_friends ? "3px solid #44ff44" : "1px solid var(--line)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: story.media_url,
						alt: "story",
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							padding: 10,
							background: "linear-gradient(transparent, rgba(0,0,0,0.8))"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontWeight: "bold",
								fontSize: 12
							},
							children: story.username
						}), story.is_close_friends && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "#44ff44",
								fontSize: 10
							},
							children: "⭐ الأصدقاء المقربون"
						})]
					})]
				}, story.id))
			}),
			activeTab === "archive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 8
				},
				children: archive.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						aspectRatio: "9/16",
						background: "#222",
						borderRadius: 8,
						overflow: "hidden"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: story.media_url,
						alt: "archived",
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: .6
						}
					})
				}, story.id))
			}),
			activeTab === "create" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 16
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							position: "relative",
							aspectRatio: "9/16",
							background: "#000",
							borderRadius: 16,
							overflow: "hidden"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: previewUrl,
								alt: "preview",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									filter: activeFilter.class
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
								ref: canvasRef,
								onMouseDown: startDrawing,
								onMouseMove: draw,
								onMouseUp: stopDrawing,
								onMouseLeave: stopDrawing,
								style: {
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									cursor: "crosshair"
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									position: "absolute",
									top: 20,
									right: 20,
									display: "flex",
									flexDirection: "column",
									gap: 12
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height),
									style: {
										background: "rgba(0,0,0,0.5)",
										border: "none",
										color: "white",
										padding: 8,
										borderRadius: "50%"
									},
									children: "🔄"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setIsCloseFriends(!isCloseFriends),
									style: {
										background: isCloseFriends ? "#44ff44" : "rgba(0,0,0,0.5)",
										border: "none",
										color: "white",
										padding: 8,
										borderRadius: "50%"
									},
									children: "⭐"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							gap: 8,
							overflowX: "auto",
							paddingBottom: 8
						},
						children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setActiveFilter(f),
							style: {
								padding: "6px 12px",
								borderRadius: 20,
								background: activeFilter.name === f.name ? "var(--primary)" : "#222",
								color: "white",
								border: "none",
								whiteSpace: "nowrap"
							},
							children: f.name
						}, f.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 12
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("feed"),
							style: { flex: 1 },
							children: "إلغاء"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: handleUpload,
							style: { flex: 2 },
							children: ["نشر القصة ", isCloseFriends ? "(المقربون)" : ""]
						})]
					})
				]
			})
		]
	}) });
}
//#endregion
export { Stories as default };
