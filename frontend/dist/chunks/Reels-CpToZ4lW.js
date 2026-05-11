import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { p as Button } from "../index-dyGfSAus.js";
import { t as Modal } from "./Modal-jj08kzCG.js";
import { n as getPosts } from "./posts-DVggXrmM.js";
import { t as MainLayout } from "./MainLayout-mNh2-kKS.js";
//#region src/pages/Reels.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ReelSkeleton = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	style: {
		height: "100%",
		width: "100%",
		background: "#111",
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "spinner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
      .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
    ` })]
});
/**
* Advanced Reels Component
* Features: 
* - Video Preloading & Autoplay Optimization
* - Adaptive Quality based on Network
* - Memory Management (Pause/Unload offscreen)
* - Prevent Rerenders & Memory Leaks
*/
function ReelsPage() {
	const [reels, setReels] = (0, import_react.useState)([]);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [showMonetization, setShowMonetization] = (0, import_react.useState)(false);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [hasNextPage, setHasNextPage] = (0, import_react.useState)(true);
	const [page, setPage] = (0, import_react.useState)(1);
	const videoRefs = (0, import_react.useRef)([]);
	const containerRef = (0, import_react.useRef)(null);
	const observerRef = (0, import_react.useRef)(null);
	const getAdaptiveUrl = (0, import_react.useCallback)((url) => {
		const connection = navigator.connection || {};
		const type = connection.effectiveType || "4g";
		if ([
			"slow-2g",
			"2g",
			"3g"
		].includes(type) || connection.saveData) return `${url}?quality=low`;
		return url;
	}, []);
	const loadReels = (0, import_react.useCallback)(async (pageNum) => {
		try {
			setIsLoading(true);
			const { data } = await getPosts({
				limit: 5,
				filter: "trending",
				page: pageNum
			});
			const videoPosts = (data || []).filter((p) => p.media_url?.match(/\.(mp4|webm|mov)$/i));
			if (videoPosts.length === 0) setHasNextPage(false);
			else {
				const enhancedPosts = videoPosts.map((post) => ({
					...post,
					adaptiveUrl: getAdaptiveUrl(post.media_url)
				}));
				setReels((prev) => pageNum === 1 ? enhancedPosts : [...prev, ...enhancedPosts]);
			}
		} catch (err) {
			console.error("Failed to load reels:", err);
		} finally {
			setIsLoading(false);
		}
	}, [getAdaptiveUrl]);
	(0, import_react.useEffect)(() => {
		loadReels(1);
	}, [loadReels]);
	(0, import_react.useEffect)(() => {
		if (activeIndex >= reels.length - 2 && hasNextPage && !isLoading) setPage((prev) => {
			const next = prev + 1;
			loadReels(next);
			return next;
		});
	}, [
		activeIndex,
		reels.length,
		hasNextPage,
		isLoading,
		loadReels
	]);
	(0, import_react.useEffect)(() => {
		if (observerRef.current) observerRef.current.disconnect();
		observerRef.current = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const index = parseInt(entry.target.dataset.index);
				const video = videoRefs.current[index];
				if (entry.isIntersecting) {
					setActiveIndex(index);
					if (video) {
						video.play().catch(() => {
							video.muted = true;
							video.play();
						});
						for (let i = 1; i <= 2; i++) {
							const nextVideo = videoRefs.current[index + i];
							if (nextVideo) nextVideo.preload = "auto";
						}
					}
				} else if (video) {
					video.pause();
					if (Math.abs(index - activeIndex) > 3) {
						video.preload = "none";
						const currentSrc = video.src;
						video.src = "";
						video.load();
						video.dataset.src = currentSrc;
					}
				}
			});
		}, { threshold: .7 });
		document.querySelectorAll(".reel-item").forEach((el) => observerRef.current.observe(el));
		return () => {
			if (observerRef.current) observerRef.current.disconnect();
		};
	}, [reels, activeIndex]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			style: {
				height: "calc(100vh - 60px)",
				background: "#000",
				position: "relative",
				overflow: "hidden"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: containerRef,
				style: {
					height: "100%",
					overflowY: "scroll",
					scrollSnapType: "y mandatory",
					scrollbarWidth: "none",
					msOverflowStyle: "none"
				},
				className: "reels-scroll-container",
				children: [(0, import_react.useMemo)(() => {
					return reels.map((reel, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-index": i,
						className: "reel-item",
						style: {
							height: "100%",
							scrollSnapAlign: "start",
							position: "relative",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "#000"
						},
						children: [
							Math.abs(i - activeIndex) <= 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								ref: (el) => videoRefs.current[i] = el,
								src: reel.adaptiveUrl,
								loop: true,
								playsInline: true,
								preload: Math.abs(i - activeIndex) <= 1 ? "auto" : "metadata",
								style: {
									width: "100%",
									height: "100%",
									objectFit: "contain"
								}
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelSkeleton, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									position: "absolute",
									right: 16,
									bottom: 100,
									display: "flex",
									flexDirection: "column",
									gap: 24,
									alignItems: "center",
									zIndex: 10
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											width: 50,
											height: 50,
											borderRadius: "50%",
											border: "2px solid white",
											overflow: "hidden",
											marginBottom: 10
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: reel.avatar || `https://ui-avatars.com/api/?name=${reel.username}`,
											alt: "User",
											style: {
												width: "100%",
												height: "100%"
											}
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: { textAlign: "center" },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "reel-action-btn",
											children: "❤️"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontSize: 12,
												color: "white",
												marginTop: 4
											},
											children: reel.likes_count || "0"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: { textAlign: "center" },
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "reel-action-btn",
											children: "💬"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontSize: 12,
												color: "white",
												marginTop: 4
											},
											children: reel.comments_count || "0"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "reel-action-btn",
										children: "📤"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setShowMonetization(true),
										style: {
											background: "linear-gradient(45deg, #FFD700, #FFA500)",
											border: "none",
											width: 45,
											height: 45,
											borderRadius: "50%",
											color: "black",
											fontSize: 20,
											boxShadow: "0 0 15px rgba(255,215,0,0.5)"
										},
										children: "💰"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									position: "absolute",
									bottom: 30,
									left: 20,
									right: 80,
									zIndex: 10,
									color: "white",
									textShadow: "0 2px 4px rgba(0,0,0,0.5)"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										fontWeight: "bold",
										fontSize: 18,
										marginBottom: 8,
										display: "flex",
										alignItems: "center",
										gap: 8
									},
									children: [
										"@",
										reel.username,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											style: {
												background: "rgba(255,255,255,0.2)",
												border: "1px solid white",
												color: "white",
												padding: "4px 12px",
												borderRadius: 20,
												fontSize: 12
											},
											children: "متابعة"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										fontSize: 14,
										opacity: .9,
										maxWidth: "80%"
									},
									children: reel.content
								})]
							})
						]
					}, `${reel.id}-${i}`));
				}, [reels, activeIndex]), isLoading && reels.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "white"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelSkeleton, {})
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			isOpen: showMonetization,
			onClose: () => setShowMonetization(false),
			title: "نظام الأرباح",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					padding: 24,
					textAlign: "center"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 48,
							marginBottom: 16
						},
						children: "💰"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "أرباح المحتوى" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 36,
							fontWeight: "bold",
							color: "#FFD700",
							margin: "20px 0"
						},
						children: "$124.50"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						style: {
							marginTop: 24,
							width: "100%",
							height: 50
						},
						children: "سحب الأرباح للمحفظة"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .reels-scroll-container::-webkit-scrollbar { display: none; }
        .reel-action-btn { 
          background: rgba(255,255,255,0.15); 
          backdrop-filter: blur(5px);
          border: none; 
          width: 48px; 
          height: 48px; 
          border-radius: 50%; 
          color: white; 
          font-size: 22px;
          cursor: pointer;
          transition: 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reel-action-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.25); }
      ` })
	] });
}
//#endregion
export { ReelsPage as default };
