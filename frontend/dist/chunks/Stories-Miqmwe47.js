import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { C as useToast, S as Button } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { o as uploadStory, r as getStoryArchive, t as getStories } from "./stories-CYBJZ-UE.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
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
	const { pushToast } = useToast();
	const [activeTab, setActiveTab] = (0, import_react.useState)("feed");
	const [stories, setStories] = (0, import_react.useState)([]);
	const [archive, setArchive] = (0, import_react.useState)([]);
	const [selectedFile, setSelectedFile] = (0, import_react.useState)(null);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)("");
	const [isCloseFriends, setIsCloseFriends] = (0, import_react.useState)(false);
	const [activeFilter, setActiveFilter] = (0, import_react.useState)(FILTERS[0]);
	const [isDrawing, setIsDrawing] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const canvasRef = (0, import_react.useRef)(null);
	const ctxRef = (0, import_react.useRef)(null);
	const loadData = async () => {
		setLoading(true);
		setError("");
		try {
			const [storiesRes, archiveRes] = await Promise.all([getStories(), getStoryArchive()]);
			setStories(Array.isArray(storiesRes?.data) ? storiesRes.data : []);
			setArchive(Array.isArray(archiveRes?.data) ? archiveRes.data : []);
		} catch (err) {
			const detail = err?.response?.data?.detail || err?.message || "تعذر تحميل القصص";
			setError(detail);
			pushToast({
				type: "error",
				title: "فشل تحميل القصص",
				description: detail
			});
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadData();
	}, []);
	const handleFileSelect = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 150 * 1024 * 1024) {
			pushToast({
				type: "error",
				title: "الملف كبير جدًا",
				description: "الحد الأقصى لرفع الستوري هو 150 ميجا."
			});
			return;
		}
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
		setActiveTab("create");
	};
	(0, import_react.useEffect)(() => {
		if (activeTab !== "create" || !canvasRef.current) return;
		const canvas = canvasRef.current;
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		const ctx = canvas.getContext("2d");
		ctx.lineCap = "round";
		ctx.strokeStyle = "white";
		ctx.lineWidth = 5;
		ctxRef.current = ctx;
	}, [activeTab, previewUrl]);
	const handleUpload = async () => {
		if (!selectedFile) return;
		setUploading(true);
		try {
			const drawingData = canvasRef.current?.toDataURL?.("image/png") || "";
			await uploadStory(selectedFile, {
				is_close_friends: isCloseFriends,
				filter_name: activeFilter.name,
				drawing_data: drawingData
			});
			pushToast({
				type: "success",
				title: "تم نشر الستوري"
			});
			setSelectedFile(null);
			setPreviewUrl("");
			setIsCloseFriends(false);
			setActiveFilter(FILTERS[0]);
			setActiveTab("feed");
			await loadData();
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر رفع الستوري",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setUploading(false);
		}
	};
	const storyCards = (0, import_react.useMemo)(() => stories.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		style: {
			height: 260,
			position: "relative",
			overflow: "hidden",
			border: story.is_close_friends ? "3px solid #44ff44" : "1px solid var(--line)"
		},
		children: [story.media_url?.match(/\.(mp4|webm|mov)$/i) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
			src: story.media_url,
			style: {
				width: "100%",
				height: "100%",
				objectFit: "cover"
			},
			muted: true,
			autoPlay: true,
			loop: true
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
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
				insetInline: 0,
				padding: 10,
				background: "linear-gradient(transparent, rgba(0,0,0,0.8))"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					fontWeight: "bold",
					fontSize: 12
				},
				children: story.username
			}), story.is_close_friends ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					color: "#44ff44",
					fontSize: 10
				},
				children: "⭐ الأصدقاء المقربون"
			}) : null]
		})]
	}, story.id)), [stories]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 560,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 12,
					marginBottom: 20,
					flexWrap: "wrap"
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
						children: "الأرشيف"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						style: { marginInlineStart: "auto" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							hidden: true,
							onChange: handleFileSelect,
							accept: "image/*,video/*"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							as: "span",
							style: { cursor: "pointer" },
							children: "رفع ستوري"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: loadData,
						loading,
						children: "تحديث"
					})
				]
			}),
			loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				style: { padding: 24 },
				children: "جارٍ تحميل الستوري..."
			}) : null,
			!loading && error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				style: { padding: 24 },
				children: error
			}) : null,
			!loading && !error && activeTab === "feed" ? stories.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 12
				},
				children: storyCards
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				style: { padding: 24 },
				children: "لا توجد قصص حالياً."
			}) : null,
			!loading && !error && activeTab === "archive" ? archive.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
					children: story.media_url?.match(/\.(mp4|webm|mov)$/i) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: story.media_url,
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: .7
						},
						muted: true
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: story.media_url,
						alt: "archived",
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover",
							opacity: .7
						}
					})
				}, story.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				style: { padding: 24 },
				children: "الأرشيف فارغ."
			}) : null,
			activeTab === "create" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
							selectedFile?.type?.startsWith("video/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: previewUrl,
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									filter: activeFilter.class
								},
								controls: true
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: previewUrl,
								alt: "preview",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain",
									filter: activeFilter.class
								}
							}),
							!selectedFile?.type?.startsWith("video/") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
								ref: canvasRef,
								onMouseDown: (event) => {
									setIsDrawing(true);
									const { offsetX, offsetY } = event.nativeEvent;
									ctxRef.current.beginPath();
									ctxRef.current.moveTo(offsetX, offsetY);
								},
								onMouseMove: (event) => {
									if (!isDrawing || !ctxRef.current) return;
									const { offsetX, offsetY } = event.nativeEvent;
									ctxRef.current.lineTo(offsetX, offsetY);
									ctxRef.current.stroke();
								},
								onMouseUp: () => setIsDrawing(false),
								onMouseLeave: () => setIsDrawing(false),
								style: {
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									cursor: "crosshair"
								}
							}) : null,
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
									type: "button",
									onClick: () => ctxRef.current?.clearRect?.(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0),
									style: {
										background: "rgba(0,0,0,0.5)",
										border: "none",
										color: "white",
										padding: 8,
										borderRadius: "50%"
									},
									children: "🔄"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIsCloseFriends((prev) => !prev),
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
						children: FILTERS.map((filter) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setActiveFilter(filter),
							style: {
								padding: "6px 12px",
								borderRadius: 20,
								background: activeFilter.name === filter.name ? "var(--primary)" : "#222",
								color: "white",
								border: "none",
								whiteSpace: "nowrap"
							},
							children: filter.name
						}, filter.name))
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
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: handleUpload,
							style: { flex: 2 },
							loading: uploading,
							disabled: uploading || !selectedFile,
							children: isCloseFriends ? "نشر للأصدقاء المقربين" : "نشر الستوري"
						})]
					})
				]
			}) : null
		]
	}) });
}
//#endregion
export { Stories as default };
