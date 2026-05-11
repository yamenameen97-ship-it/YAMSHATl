import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { n as require_jsx_runtime } from "./vendor-motion-BBlFOFzY.js";
import { n as useInfiniteQuery, o as useQueryClient, r as useMutation } from "./vendor-network-DXq8mL6N.js";
import { m as useToast, p as Button } from "../index-DMsnM20S.js";
import { t as Card } from "./Card-zay_4qAf.js";
import { t as Modal } from "./Modal-jj08kzCG.js";
import { t as EmptyState } from "./EmptyState-qJDF7G8m.js";
import { t as ErrorState } from "./ErrorState-BLrJlDOh.js";
import { a as sharePost, i as savePost, n as getPosts, o as uploadPostMedia, r as likePost, t as createPost } from "./posts-CTCKju0i.js";
import { t as MainLayout } from "./MainLayout-oc_Nbmmv.js";
//#region src/components/feed/PostCard.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ADVANCED_REACTIONS = [
	{
		emoji: "❤️",
		label: "حب"
	},
	{
		emoji: "😂",
		label: "ضحك"
	},
	{
		emoji: "😮",
		label: "مندهش"
	},
	{
		emoji: "😢",
		label: "حزين"
	},
	{
		emoji: "🔥",
		label: "حماس"
	},
	{
		emoji: "👏",
		label: "تصفيق"
	},
	{
		emoji: "💡",
		label: "فكرة"
	},
	{
		emoji: "🤔",
		label: "تفكير"
	}
];
/**
* Enhanced Content Parser for Mentions and Hashtags
*/
var parseContent = (content) => {
	if (!content) return "";
	return content.split(/(\s+)/).map((part, i) => {
		if (part.startsWith("@")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				color: "var(--accent)",
				cursor: "pointer",
				fontWeight: "600"
			},
			children: part
		}, i);
		if (part.startsWith("#")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: {
				color: "var(--primary)",
				cursor: "pointer",
				fontWeight: "500"
			},
			children: part
		}, i);
		return part;
	});
};
function PostCard({ post, onShowAnalytics, onLike }) {
	const [showReactions, setShowReactions] = (0, import_react.useState)(false);
	const [showShareModal, setShowShareModal] = (0, import_react.useState)(false);
	const [showMediaModal, setShowMediaModal] = (0, import_react.useState)(false);
	const [isTranslated, setIsTranslated] = (0, import_react.useState)(false);
	const [translation, setTranslation] = (0, import_react.useState)("");
	const [myReaction, setMyReaction] = (0, import_react.useState)(post?.my_reaction || null);
	const queryClient = useQueryClient();
	const saveMutation = useMutation({
		mutationFn: () => savePost(post.id),
		onSuccess: () => {
			queryClient.invalidateQueries(["feed-data"]);
		}
	});
	const shareMutation = useMutation({ mutationFn: (platform) => sharePost(post.id, { platform }) });
	const handleTranslate = async () => {
		if (isTranslated) {
			setIsTranslated(false);
			return;
		}
		setTranslation("هذه ترجمة تجريبية للمحتوى باستخدام الذكاء الاصطناعي لتسهيل التواصل العالمي.");
		setIsTranslated(true);
	};
	const handleShare = (platform) => {
		const url = `${window.location.origin}/post/${post.id}`;
		const text = post.content;
		if (platform === "copy") {
			navigator.clipboard.writeText(url);
			alert("تم نسخ الرابط!");
		} else {
			const shares = {
				whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
				twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
			};
			window.open(shares[platform], "_blank");
		}
		shareMutation.mutate(platform);
		setShowShareModal(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: `post-card ${post.is_pinned ? "pinned" : ""}`,
		style: {
			padding: 16,
			position: "relative",
			border: post.is_pinned ? "1px solid var(--accent)" : "1px solid var(--line)",
			background: post.is_pinned ? "rgba(var(--accent-rgb), 0.02)" : "var(--bg-card)"
		},
		children: [
			post.is_pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "absolute",
					top: 12,
					left: 16,
					display: "flex",
					alignItems: "center",
					gap: 4,
					color: "var(--accent)",
					fontSize: 12,
					fontWeight: "bold"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
					width: "14",
					height: "14",
					viewBox: "0 0 24 24",
					fill: "currentColor",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" })
				}), "منشور مثبت"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 12
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							width: 44,
							height: 44,
							borderRadius: "50%",
							background: "var(--bg-soft)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							overflow: "hidden",
							border: "2px solid var(--line)"
						},
						children: post.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: post.avatar,
							alt: post.username,
							style: {
								width: "100%",
								height: "100%",
								objectFit: "cover"
							}
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: post.username?.[0]?.toUpperCase() })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							fontWeight: "bold",
							display: "flex",
							alignItems: "center",
							gap: 4
						},
						children: [post.username, post.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							width: "14",
							height: "14",
							viewBox: "0 0 24 24",
							fill: "var(--accent)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "muted",
						style: { fontSize: 11 },
						children: new Date(post.created_at).toLocaleString("ar-EG")
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						display: "flex",
						gap: 8
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onShowAnalytics,
						style: {
							padding: "4px 8px",
							fontSize: 14
						},
						children: "📊"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					fontSize: 16,
					lineHeight: 1.6,
					marginBottom: 16,
					whiteSpace: "pre-wrap"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: isTranslated ? translation : parseContent(post.content) }),
					post.media_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: () => setShowMediaModal(true),
						style: {
							marginTop: 12,
							borderRadius: 12,
							overflow: "hidden",
							cursor: "pointer",
							background: "#000",
							maxHeight: 400,
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						},
						children: post.media_url.match(/\.(mp4|webm)$/i) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							src: post.media_url,
							style: {
								width: "100%",
								maxHeight: 400
							},
							muted: true,
							loop: true,
							autoPlay: true
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: post.media_url,
							alt: "Post Media",
							style: {
								width: "100%",
								height: "auto",
								objectFit: "contain"
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleTranslate,
						style: {
							background: "none",
							border: "none",
							color: "var(--primary)",
							cursor: "pointer",
							fontSize: 12,
							padding: 0,
							marginTop: 12,
							display: "block"
						},
						children: isTranslated ? "عرض النص الأصلي" : "🌐 ترجمة ذكية"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					borderTop: "1px solid var(--line)",
					paddingTop: 12
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 12
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { position: "relative" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: onLike,
							onContextMenu: (e) => {
								e.preventDefault();
								setShowReactions(!showReactions);
							},
							style: {
								background: "none",
								border: "none",
								color: post.is_liked ? "var(--accent)" : "var(--text)",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: 6,
								fontSize: 14
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { fontSize: 18 },
								children: post.is_liked ? "❤️" : "🤍"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: post.likes_count || 0 })]
						}), showReactions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "reactions-popup",
							style: {
								position: "absolute",
								bottom: "100%",
								left: 0,
								background: "var(--bg-card)",
								border: "1px solid var(--line)",
								borderRadius: 30,
								padding: "6px 10px",
								display: "flex",
								gap: 6,
								boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
								zIndex: 100,
								marginBottom: 10
							},
							children: ADVANCED_REACTIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setMyReaction(r.emoji);
									setShowReactions(false);
								},
								style: {
									background: "none",
									border: "none",
									fontSize: 20,
									cursor: "pointer",
									transition: "0.2s"
								},
								onMouseEnter: (e) => e.target.style.transform = "scale(1.3)",
								onMouseLeave: (e) => e.target.style.transform = "scale(1)",
								children: r.emoji
							}, r.emoji))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						style: {
							background: "none",
							border: "none",
							color: "var(--text)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 14
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: { fontSize: 18 },
							children: "💬"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: post.comments_count || 0 })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 16
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowShareModal(true),
						style: {
							background: "none",
							border: "none",
							color: "var(--text)",
							cursor: "pointer",
							fontSize: 18
						},
						title: "مشاركة",
						children: "📤"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => saveMutation.mutate(),
						style: {
							background: "none",
							border: "none",
							color: post.is_saved ? "var(--primary)" : "var(--text)",
							cursor: "pointer",
							fontSize: 18
						},
						title: post.is_saved ? "إلغاء الحفظ" : "حفظ",
						children: post.is_saved ? "🔖" : "📑"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				isOpen: showMediaModal,
				onClose: () => setShowMediaModal(false),
				fullScreen: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "#000"
					},
					children: post.media_url?.match(/\.(mp4|webm)$/i) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: post.media_url,
						controls: true,
						autoPlay: true,
						style: {
							maxWidth: "100%",
							maxHeight: "100%"
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: post.media_url,
						alt: "Full Media",
						style: {
							maxWidth: "100%",
							maxHeight: "100%",
							objectFit: "contain"
						}
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
				isOpen: showShareModal,
				onClose: () => setShowShareModal(false),
				title: "مشاركة المنشور",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						padding: 20,
						display: "grid",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => handleShare("whatsapp"),
							style: {
								background: "#25D366",
								color: "white"
							},
							children: "WhatsApp"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => handleShare("twitter"),
							style: {
								background: "#000",
								color: "white"
							},
							children: "X (Twitter)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => handleShare("copy"),
							children: "نسخ الرابط"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .post-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .post-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .reactions-popup { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { from { opacity: 0; transform: translateY(10px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
      ` })
		]
	});
}
//#endregion
//#region src/components/feed/PostComposer.jsx
function PostComposer() {
	const [content, setContent] = (0, import_react.useState)("");
	const [media, setMedia] = (0, import_react.useState)(null);
	const [mediaPreview, setMediaPreview] = (0, import_react.useState)(null);
	const [uploadProgress, setUploadProgress] = (0, import_react.useState)(0);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const [showScheduler, setShowScheduler] = (0, import_react.useState)(false);
	const [scheduledDate, setScheduledDate] = (0, import_react.useState)("");
	const [isDrafting, setIsDrafting] = (0, import_react.useState)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	const queryClient = useQueryClient();
	const { pushToast } = useToast();
	(0, import_react.useEffect)(() => {
		const savedDraft = localStorage.getItem("yamshat_post_draft");
		if (savedDraft) {
			setContent(savedDraft);
			pushToast({
				type: "info",
				message: "تم استعادة المسودة المحفوظة"
			});
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const timer = setTimeout(() => {
			if (content.trim()) localStorage.setItem("yamshat_post_draft", content);
		}, 2e3);
		return () => clearTimeout(timer);
	}, [content]);
	const handleMediaSelect = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 50 * 1024 * 1024) {
				pushToast({
					type: "error",
					message: "حجم الملف كبير جداً (الحد الأقصى 50 ميجابايت)"
				});
				return;
			}
			setMedia(file);
			const reader = new FileReader();
			reader.onload = (e) => setMediaPreview(e.target.result);
			reader.readAsDataURL(file);
		}
	};
	const clearComposer = () => {
		setContent("");
		setMedia(null);
		setMediaPreview(null);
		setUploadProgress(0);
		setScheduledDate("");
		setShowScheduler(false);
		localStorage.removeItem("yamshat_post_draft");
	};
	const handleSubmit = async (status = "published") => {
		if (!content.trim() && !media) return;
		setIsUploading(true);
		try {
			let mediaUrl = "";
			if (media) {
				const formData = new FormData();
				formData.append("file", media);
				for (let i = 0; i <= 100; i += 10) {
					setUploadProgress(i);
					await new Promise((r) => setTimeout(r, 100));
				}
				mediaUrl = (await uploadPostMedia(formData)).data.url;
			}
			await createPost({
				content,
				media_url: mediaUrl,
				status,
				scheduled_at: status === "scheduled" ? scheduledDate : null
			});
			pushToast({
				type: "success",
				message: status === "published" ? "تم النشر بنجاح!" : status === "draft" ? "تم حفظ المسودة" : "تم جدولة المنشور"
			});
			clearComposer();
			queryClient.invalidateQueries(["feed-data"]);
		} catch (err) {
			pushToast({
				type: "error",
				message: "فشل النشر، يمكنك المحاولة مرة أخرى"
			});
		} finally {
			setIsUploading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		style: {
			marginBottom: 24,
			padding: 20,
			border: "1px solid var(--line)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 12
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: 40,
					height: 40,
					borderRadius: "50%",
					background: "var(--primary)",
					flexShrink: 0
				} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					placeholder: "بماذا تفكر اليوم؟",
					value: content,
					onChange: (e) => setContent(e.target.value),
					style: {
						width: "100%",
						minHeight: 80,
						background: "transparent",
						border: "none",
						color: "var(--text)",
						fontSize: 16,
						resize: "none",
						outline: "none",
						paddingTop: 8
					}
				})]
			}),
			mediaPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					position: "relative",
					marginTop: 12,
					borderRadius: 12,
					overflow: "hidden",
					maxHeight: 300
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							setMedia(null);
							setMediaPreview(null);
						},
						style: {
							position: "absolute",
							top: 10,
							right: 10,
							background: "rgba(0,0,0,0.5)",
							color: "white",
							border: "none",
							borderRadius: "50%",
							width: 30,
							height: 30,
							cursor: "pointer",
							zIndex: 1
						},
						children: "✕"
					}),
					media?.type.startsWith("video") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						src: mediaPreview,
						style: {
							width: "100%",
							display: "block"
						},
						controls: true
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: mediaPreview,
						style: {
							width: "100%",
							objectFit: "cover"
						},
						alt: "Preview"
					}),
					isUploading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: 4,
							background: "rgba(255,255,255,0.2)"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							height: "100%",
							background: "var(--accent)",
							width: `${uploadProgress}%`,
							transition: "width 0.2s"
						} })
					})
				]
			}),
			showScheduler && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					marginTop: 16,
					padding: 12,
					background: "var(--bg-soft)",
					borderRadius: 12,
					border: "1px solid var(--line)"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					style: {
						display: "block",
						marginBottom: 8,
						fontSize: 13,
						fontWeight: "bold"
					},
					children: "تحديد وقت النشر التلقائي:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "datetime-local",
					value: scheduledDate,
					onChange: (e) => setScheduledDate(e.target.value),
					style: {
						width: "100%",
						background: "var(--bg-input)",
						color: "var(--text)",
						border: "1px solid var(--line)",
						padding: 10,
						borderRadius: 8
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					marginTop: 16,
					alignItems: "center",
					borderTop: "1px solid var(--line)",
					paddingTop: 16
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fileInputRef.current?.click(),
							style: {
								background: "none",
								border: "none",
								cursor: "pointer",
								fontSize: 20,
								opacity: .8
							},
							title: "إضافة وسائط",
							children: "🖼️"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowScheduler(!showScheduler),
							style: {
								background: "none",
								border: "none",
								cursor: "pointer",
								fontSize: 20,
								opacity: showScheduler ? 1 : .8,
								color: showScheduler ? "var(--accent)" : "inherit"
							},
							title: "جدولة المنشور",
							children: "📅"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							ref: fileInputRef,
							hidden: true,
							accept: "image/*,video/*",
							onChange: handleMediaSelect
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 10
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => handleSubmit("draft"),
						disabled: isUploading || !content.trim(),
						children: "حفظ مسودة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => handleSubmit(showScheduler ? "scheduled" : "published"),
						loading: isUploading,
						disabled: isUploading || !content.trim() && !media,
						children: showScheduler ? "تأكيد الجدولة" : "نشر"
					})]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/feed/FeedSkeleton.jsx
var PostSkeleton = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "post-skeleton",
	style: {
		background: "var(--bg-card)",
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		border: "1px solid var(--line)",
		animation: "pulse 1.5s infinite ease-in-out"
	},
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "flex",
				gap: 12,
				marginBottom: 16
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
				width: 48,
				height: 48,
				borderRadius: "50%",
				background: "var(--line)"
			} }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { flex: 1 },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: "40%",
					height: 14,
					background: "var(--line)",
					borderRadius: 4,
					marginBottom: 8
				} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
					width: "20%",
					height: 10,
					background: "var(--line)",
					borderRadius: 4
				} })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			width: "100%",
			height: 12,
			background: "var(--line)",
			borderRadius: 4,
			marginBottom: 8
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			width: "90%",
			height: 12,
			background: "var(--line)",
			borderRadius: 4,
			marginBottom: 8
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			width: "60%",
			height: 12,
			background: "var(--line)",
			borderRadius: 4,
			marginBottom: 16
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
			width: "100%",
			height: 300,
			background: "var(--line)",
			borderRadius: 12
		} }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    ` })
	]
});
function FeedSkeleton({ count = 3 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "feed-skeleton",
		children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostSkeleton, {}, i))
	});
}
//#endregion
//#region src/hooks/useFeed.js
/**
* Advanced Feed Hook with Caching, Polling, and Stale Data Handling
*/
function useFeed(options = {}) {
	const { tab = "all", filter = "latest", limit = 10, pollingInterval = 3e4 } = options;
	const lastFetchRef = (0, import_react.useRef)(Date.now());
	const query = useInfiniteQuery({
		queryKey: [
			"feed-data",
			tab,
			filter
		],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await getPosts({
				tab,
				filter,
				page: pageParam,
				limit
			});
			lastFetchRef.current = Date.now();
			return response.data;
		},
		getNextPageParam: (lastPage, allPages) => {
			return lastPage.length === limit ? allPages.length + 1 : void 0;
		},
		staleTime: 300 * 1e3,
		cacheTime: 1800 * 1e3,
		refetchOnWindowFocus: true,
		refetchInterval: (data) => {
			return data?.pages.length === 1 && document.visibilityState === "visible" ? pollingInterval : false;
		}
	});
	return {
		posts: query.data?.pages.flatMap((page) => page) || [],
		...query,
		lastFetched: lastFetchRef.current
	};
}
//#endregion
//#region src/pages/Feed.jsx
function Feed() {
	const queryClient = useQueryClient();
	const observerTarget = (0, import_react.useRef)(null);
	const { posts, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useFeed({ limit: 10 });
	(0, import_react.useEffect)(() => {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
		}, {
			threshold: .1,
			rootMargin: "200px"
		});
		if (observerTarget.current) observer.observe(observerTarget.current);
		return () => observer.disconnect();
	}, [
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage
	]);
	const likeMutation = useMutation({
		mutationFn: likePost,
		onMutate: async (postId) => {
			await queryClient.cancelQueries(["feed-data"]);
			const previousData = queryClient.getQueryData(["feed-data"]);
			queryClient.setQueryData(["feed-data"], (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => page.map((post) => post.id === postId ? {
						...post,
						is_liked: !post.is_liked,
						likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
					} : post))
				};
			});
			return { previousData };
		},
		onError: (err, postId, context) => {
			queryClient.setQueryData(["feed-data"], context.previousData);
		},
		onSettled: () => {
			queryClient.invalidateQueries(["feed-data"]);
		}
	});
	const renderedPosts = (0, import_react.useMemo)(() => {
		return posts.map((post) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostCard, {
			post,
			onLike: () => likeMutation.mutate(post.id)
		}, post.id));
	}, [posts, likeMutation]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MainLayout, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 700,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PostComposer, {}), isLoading && !isFetchingNextPage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedSkeleton, { count: 3 }) : isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: refetch }) : posts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: "لا توجد منشورات حالياً" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				display: "grid",
				gap: 20
			},
			children: [renderedPosts, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: observerTarget,
				style: {
					height: 100,
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				},
				children: [isFetchingNextPage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "spinner-small" }), !hasNextPage && posts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					style: { fontSize: 13 },
					children: "لقد وصلت إلى نهاية المنشورات"
				})]
			})]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .spinner-small { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .muted { color: var(--text-muted); }
      ` })] });
}
//#endregion
export { Feed as default };
