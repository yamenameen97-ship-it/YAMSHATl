import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { C as useToast, E as getCurrentUsername, S as Button, l as uploadMediaWithResume } from "../index-RNpBu_Fp.js";
import { t as Modal } from "./Modal-DHoVpNfV.js";
import { a as getPosts, c as sharePost, i as getComments, n as createPost, o as likePost, t as addComment } from "./posts-BHSunouz.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
import { t as followUser } from "./users-C1eqSvVi.js";
//#region src/components/upload/VideoUploader.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var MAX_VIDEO_SIZE = 500 * 1024 * 1024;
var ALLOWED_TYPES = [
	"video/mp4",
	"video/webm",
	"video/quicktime"
];
function VideoUploader({ onUploadComplete, onError, label = "رفع فيديو" }) {
	const [videoFile, setVideoFile] = (0, import_react.useState)(null);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const fileInputRef = (0, import_react.useRef)(null);
	const handleFileSelect = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!ALLOWED_TYPES.includes(file.type)) {
			onError?.("نوع الملف غير مدعوم. استخدم MP4 أو WebM أو MOV");
			return;
		}
		if (file.size > MAX_VIDEO_SIZE) {
			onError?.(`حجم الملف كبير جداً. الحد الأقصى: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
			return;
		}
		setVideoFile(file);
		setUploading(true);
		setProgress(0);
		try {
			const payload = (await uploadMediaWithResume(file, (nextProgress) => setProgress(nextProgress)))?.data || {};
			onUploadComplete?.({
				file,
				url: payload.media_url || payload.url || payload.file_url,
				payload
			});
		} catch (error) {
			onError?.(error?.response?.data?.detail || error?.message || "فشل رفع الفيديو");
			setVideoFile(null);
			setProgress(0);
		} finally {
			setUploading(false);
		}
	};
	const handleRemoveVideo = () => {
		setVideoFile(null);
		setProgress(0);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "video-uploader",
		children: [videoFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "video-upload-status",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "video-info",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "video-icon",
						children: "🎬"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: videoFile.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "muted",
						children: [(videoFile.size / (1024 * 1024)).toFixed(2), "MB"]
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "upload-progress",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "progress-bar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "progress-fill",
							style: { width: `${progress}%` }
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "progress-info",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [progress, "%"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "muted",
							children: "رفع واستئناف حقيقي"
						})]
					})]
				}),
				!uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "upload-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: handleRemoveVideo,
						children: "إزالة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => fileInputRef.current?.click(),
						children: "رفع فيديو آخر"
					})]
				}) : null
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "video-upload-area",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "upload-icon",
					children: "🎬"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: label }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "MP4, WebM أو MOV"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "muted",
					children: [
						"الحد الأقصى: ",
						MAX_VIDEO_SIZE / (1024 * 1024),
						"MB"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => fileInputRef.current?.click(),
					loading: uploading,
					children: "اختر فيديو"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileInputRef,
			type: "file",
			accept: ALLOWED_TYPES.join(","),
			onChange: handleFileSelect,
			style: { display: "none" }
		})]
	});
}
//#endregion
//#region src/pages/Reels.jsx
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
function ReelsPage() {
	const { pushToast } = useToast();
	const currentUser = getCurrentUsername();
	const [reels, setReels] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [showUploadModal, setShowUploadModal] = (0, import_react.useState)(false);
	const [showCommentsModal, setShowCommentsModal] = (0, import_react.useState)(false);
	const [commentDraft, setCommentDraft] = (0, import_react.useState)("");
	const [activeReel, setActiveReel] = (0, import_react.useState)(null);
	const [activeComments, setActiveComments] = (0, import_react.useState)([]);
	const [busyId, setBusyId] = (0, import_react.useState)("");
	const [uploadState, setUploadState] = (0, import_react.useState)({
		mediaUrl: "",
		uploading: false,
		content: ""
	});
	const loadReels = async () => {
		setIsLoading(true);
		try {
			const { data } = await getPosts({
				limit: 20,
				page: 1
			});
			setReels((Array.isArray(data) ? data : data?.items || []).filter((post) => /\.(mp4|webm|mov)$/i.test(post?.media_url || "")));
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تحميل الريلز",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setIsLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadReels();
	}, []);
	const refreshComments = async (postId) => {
		const { data } = await getComments(postId);
		setActiveComments(Array.isArray(data) ? data : data?.items || []);
	};
	const openComments = async (reel) => {
		setActiveReel(reel);
		setShowCommentsModal(true);
		try {
			await refreshComments(reel.id);
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تحميل التعليقات",
				description: err?.response?.data?.detail || err?.message
			});
		}
	};
	const updateReel = (reelId, patch) => {
		setReels((prev) => prev.map((item) => item.id === reelId ? {
			...item,
			...patch
		} : item));
	};
	const handleLike = async (reel) => {
		try {
			setBusyId(`like-${reel.id}`);
			const { data } = await likePost(reel.id);
			updateReel(reel.id, {
				is_liked: Boolean(data?.liked ?? !reel.is_liked),
				likes_count: Number(data?.likes_count ?? data?.likes ?? reel.likes_count ?? 0)
			});
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تنفيذ اللايك",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setBusyId("");
		}
	};
	const handleShare = async (reel) => {
		try {
			setBusyId(`share-${reel.id}`);
			await navigator.clipboard.writeText(`${window.location.origin}/post/${reel.id}`);
			await sharePost(reel.id, "copy");
			updateReel(reel.id, { share_count: Number(reel.share_count || 0) + 1 });
			pushToast({
				type: "success",
				title: "تم نسخ رابط الريل"
			});
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر مشاركة الريل",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setBusyId("");
		}
	};
	const handleFollow = async (reel) => {
		try {
			setBusyId(`follow-${reel.id}`);
			const { data } = await followUser(reel.username);
			updateReel(reel.id, { following: Boolean(data?.following) });
			pushToast({
				type: "success",
				title: data?.following ? `أنت تتابع ${reel.username}` : `تم إلغاء متابعة ${reel.username}`
			});
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر تحديث المتابعة",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setBusyId("");
		}
	};
	const handleAddComment = async () => {
		if (!activeReel || !commentDraft.trim()) return;
		try {
			setBusyId(`comment-${activeReel.id}`);
			await addComment(activeReel.id, commentDraft.trim());
			setCommentDraft("");
			await refreshComments(activeReel.id);
			updateReel(activeReel.id, { comments_count: Number(activeReel.comments_count || 0) + 1 });
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر إضافة التعليق",
				description: err?.response?.data?.detail || err?.message
			});
		} finally {
			setBusyId("");
		}
	};
	const renderedReels = (0, import_react.useMemo)(() => reels.map((reel) => {
		const ownReel = reel.username === currentUser;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "reel-item",
			style: {
				minHeight: "calc(100vh - 60px)",
				position: "relative",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#000",
				borderBottom: "1px solid rgba(255,255,255,0.08)"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
					src: reel.media_url,
					loop: true,
					controls: true,
					playsInline: true,
					style: {
						width: "100%",
						height: "100%",
						objectFit: "contain",
						maxHeight: "calc(100vh - 60px)"
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						position: "absolute",
						right: 16,
						bottom: 110,
						display: "flex",
						flexDirection: "column",
						gap: 20,
						alignItems: "center",
						zIndex: 10
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								width: 52,
								height: 52,
								borderRadius: "50%",
								border: "2px solid white",
								overflow: "hidden",
								marginBottom: 6
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "reel-action-btn",
							onClick: () => handleLike(reel),
							disabled: busyId === `like-${reel.id}`,
							children: reel.is_liked ? "❤️" : "🤍"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "white",
								fontSize: 12
							},
							children: reel.likes_count || 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "reel-action-btn",
							onClick: () => openComments(reel),
							children: "💬"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								color: "white",
								fontSize: 12
							},
							children: reel.comments_count || 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "reel-action-btn",
							onClick: () => handleShare(reel),
							disabled: busyId === `share-${reel.id}`,
							children: "📤"
						}),
						!ownReel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "reel-action-btn",
							onClick: () => handleFollow(reel),
							disabled: busyId === `follow-${reel.id}`,
							children: reel.following ? "✓" : "➕"
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						position: "absolute",
						bottom: 30,
						left: 20,
						right: 90,
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
							!ownReel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleFollow(reel),
								style: {
									background: "rgba(255,255,255,0.18)",
									border: "1px solid white",
									color: "white",
									padding: "4px 12px",
									borderRadius: 20,
									fontSize: 12
								},
								children: reel.following ? "إلغاء المتابعة" : "متابعة"
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 14,
							opacity: .92,
							maxWidth: "80%"
						},
						children: reel.content
					})]
				})
			]
		}, reel.id);
	}), [
		busyId,
		currentUser,
		reels
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				height: "calc(100vh - 60px)",
				background: "#000",
				position: "relative",
				overflow: "hidden"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					top: 14,
					left: 14,
					zIndex: 20,
					display: "flex",
					gap: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setShowUploadModal(true),
					children: "رفع ريلز"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: loadReels,
					loading: isLoading,
					children: "تحديث"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					height: "100%",
					overflowY: "scroll",
					scrollSnapType: "y mandatory",
					scrollbarWidth: "none"
				},
				className: "reels-scroll-container",
				children: [
					isLoading && reels.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReelSkeleton, {}) : null,
					!isLoading && reels.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white"
						},
						children: "لا يوجد ريلز حالياً"
					}) : null,
					renderedReels
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: showUploadModal,
			onClose: () => setShowUploadModal(false),
			title: "رفع ريلز جديد",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: 14
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: uploadState.content,
						onChange: (event) => setUploadState((prev) => ({
							...prev,
							content: event.target.value
						})),
						rows: 4,
						placeholder: "اكتب وصف الريل",
						style: {
							width: "100%",
							borderRadius: 12,
							padding: 12
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoUploader, {
						label: "رفع فيديو الريلز",
						onUploadComplete: ({ url }) => setUploadState((prev) => ({
							...prev,
							mediaUrl: url
						})),
						onError: (message) => pushToast({
							type: "error",
							title: "تعذر رفع الفيديو",
							description: message
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						loading: uploadState.uploading,
						disabled: !uploadState.mediaUrl,
						onClick: async () => {
							try {
								setUploadState((prev) => ({
									...prev,
									uploading: true
								}));
								await createPost({
									content: uploadState.content || "ريل جديد",
									media_url: uploadState.mediaUrl
								});
								pushToast({
									type: "success",
									title: "تم نشر الريل"
								});
								setShowUploadModal(false);
								setUploadState({
									mediaUrl: "",
									uploading: false,
									content: ""
								});
								await loadReels();
							} catch (err) {
								pushToast({
									type: "error",
									title: "تعذر نشر الريل",
									description: err?.response?.data?.detail || err?.message
								});
								setUploadState((prev) => ({
									...prev,
									uploading: false
								}));
							}
						},
						children: "نشر الريل"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
			open: showCommentsModal,
			onClose: () => setShowCommentsModal(false),
			title: "التعليقات",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: 12
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							maxHeight: 320,
							overflowY: "auto",
							display: "grid",
							gap: 10
						},
						children: activeComments.length ? activeComments.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								background: "rgba(255,255,255,0.05)",
								borderRadius: 12,
								padding: 12
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									fontWeight: "bold",
									marginBottom: 6
								},
								children: comment.username || comment.user
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: comment.content || comment.text || comment.comment })]
						}, comment.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "لا توجد تعليقات بعد." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: commentDraft,
						onChange: (event) => setCommentDraft(event.target.value),
						rows: 3,
						placeholder: "اكتب تعليقك",
						style: {
							width: "100%",
							borderRadius: 12,
							padding: 12
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleAddComment,
						loading: busyId === `comment-${activeReel?.id || ""}`,
						children: "إرسال التعليق"
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
        .reel-action-btn:hover { transform: scale(1.08); background: rgba(255,255,255,0.25); }
      ` })
	] });
}
//#endregion
export { ReelsPage as default };
