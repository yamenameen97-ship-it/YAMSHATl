var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _currentResult, _currentMutation, _mutateOptions, _MutationObserver_instances, updateResult_fn, notify_fn, _a;
import { C as hasPreviousPage, E as hasNextPage, F as Subscribable, G as shallowEqualObjects, H as hashKey, I as getDefaultState, J as notifyManager, K as useQueryClient, r as reactExports, N as noop, O as shouldThrowError, e as useToast, j as jsxRuntimeExports, B as Button, f as getCurrentUsername } from "../index-D6u1FUhW.js";
import { Q as QueryObserver, n as useBaseQuery, h as useQuery, M as MainLayout, o as formatCompactNumber, i as initialsFromName, d as avatarGradient, f as formatTimeAgo, j as followUser, k as getUsers, g as getLiveRooms } from "./MainLayout-Ca2z1jDa.js";
import { C as Card } from "./Card-r3PaFA5D.js";
import { u as uploadPostMedia, c as createPost, g as getPosts, l as likePost } from "./posts-Q6IL2Y7w.js";
import "./proxy-npyH2_t3.js";
var InfiniteQueryObserver = class extends QueryObserver {
  constructor(client, options) {
    super(client, options);
  }
  bindMethods() {
    super.bindMethods();
    this.fetchNextPage = this.fetchNextPage.bind(this);
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
  }
  setOptions(options) {
    options._type = "infinite";
    super.setOptions(options);
  }
  getOptimisticResult(options) {
    options._type = "infinite";
    return super.getOptimisticResult(options);
  }
  fetchNextPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "forward" }
      }
    });
  }
  fetchPreviousPage(options) {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: "backward" }
      }
    });
  }
  createResult(query, options) {
    const { state } = query;
    const parentResult = super.createResult(query, options);
    const { isFetching, isRefetching, isError, isRefetchError } = parentResult;
    const fetchDirection = state.fetchMeta?.fetchMore?.direction;
    const isFetchNextPageError = isError && fetchDirection === "forward";
    const isFetchingNextPage = isFetching && fetchDirection === "forward";
    const isFetchPreviousPageError = isError && fetchDirection === "backward";
    const isFetchingPreviousPage = isFetching && fetchDirection === "backward";
    const result = {
      ...parentResult,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchNextPageError,
      isFetchingNextPage,
      isFetchPreviousPageError,
      isFetchingPreviousPage,
      isRefetchError: isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
      isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
    };
    return result;
  }
};
var MutationObserver = (_a = class extends Subscribable {
  constructor(client, options) {
    super();
    __privateAdd(this, _MutationObserver_instances);
    __privateAdd(this, _client);
    __privateAdd(this, _currentResult);
    __privateAdd(this, _currentMutation);
    __privateAdd(this, _mutateOptions);
    __privateSet(this, _client, client);
    this.setOptions(options);
    this.bindMethods();
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
  }
  bindMethods() {
    this.mutate = this.mutate.bind(this);
    this.reset = this.reset.bind(this);
  }
  setOptions(options) {
    const prevOptions = this.options;
    this.options = __privateGet(this, _client).defaultMutationOptions(options);
    if (!shallowEqualObjects(this.options, prevOptions)) {
      __privateGet(this, _client).getMutationCache().notify({
        type: "observerOptionsUpdated",
        mutation: __privateGet(this, _currentMutation),
        observer: this
      });
    }
    if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) {
      this.reset();
    } else if (__privateGet(this, _currentMutation)?.state.status === "pending") {
      __privateGet(this, _currentMutation).setOptions(this.options);
    }
  }
  onUnsubscribe() {
    if (!this.hasListeners()) {
      __privateGet(this, _currentMutation)?.removeObserver(this);
    }
  }
  onMutationUpdate(action) {
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
    __privateMethod(this, _MutationObserver_instances, notify_fn).call(this, action);
  }
  getCurrentResult() {
    return __privateGet(this, _currentResult);
  }
  reset() {
    __privateGet(this, _currentMutation)?.removeObserver(this);
    __privateSet(this, _currentMutation, void 0);
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
    __privateMethod(this, _MutationObserver_instances, notify_fn).call(this);
  }
  mutate(variables, options) {
    __privateSet(this, _mutateOptions, options);
    __privateGet(this, _currentMutation)?.removeObserver(this);
    __privateSet(this, _currentMutation, __privateGet(this, _client).getMutationCache().build(__privateGet(this, _client), this.options));
    __privateGet(this, _currentMutation).addObserver(this);
    return __privateGet(this, _currentMutation).execute(variables);
  }
}, _client = new WeakMap(), _currentResult = new WeakMap(), _currentMutation = new WeakMap(), _mutateOptions = new WeakMap(), _MutationObserver_instances = new WeakSet(), updateResult_fn = function() {
  const state = __privateGet(this, _currentMutation)?.state ?? getDefaultState();
  __privateSet(this, _currentResult, {
    ...state,
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    isIdle: state.status === "idle",
    mutate: this.mutate,
    reset: this.reset
  });
}, notify_fn = function(action) {
  notifyManager.batch(() => {
    if (__privateGet(this, _mutateOptions) && this.hasListeners()) {
      const variables = __privateGet(this, _currentResult).variables;
      const onMutateResult = __privateGet(this, _currentResult).context;
      const context = {
        client: __privateGet(this, _client),
        meta: this.options.meta,
        mutationKey: this.options.mutationKey
      };
      if (action?.type === "success") {
        try {
          __privateGet(this, _mutateOptions).onSuccess?.(
            action.data,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
        try {
          __privateGet(this, _mutateOptions).onSettled?.(
            action.data,
            null,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
      } else if (action?.type === "error") {
        try {
          __privateGet(this, _mutateOptions).onError?.(
            action.error,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
        try {
          __privateGet(this, _mutateOptions).onSettled?.(
            void 0,
            action.error,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
      }
    }
    this.listeners.forEach((listener) => {
      listener(__privateGet(this, _currentResult));
    });
  });
}, _a);
function useMutation(options, queryClient) {
  const client = useQueryClient();
  const [observer] = reactExports.useState(
    () => new MutationObserver(
      client,
      options
    )
  );
  reactExports.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  const mutate = reactExports.useCallback(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );
  if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) {
    throw result.error;
  }
  return { ...result, mutate, mutateAsync: result.mutate };
}
function useInfiniteQuery(options, queryClient) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver
  );
}
const DRAFT_KEY = "yamshat_post_draft";
const QUOTE_KEY = "yamshat_quote_draft";
function extractTags(text = "") {
  const hashtags = Array.from(new Set((text.match(/#[\p{L}\p{N}_-]+/gu) || []).map((item) => item.replace("#", ""))));
  const mentions = Array.from(new Set((text.match(/@[\p{L}\p{N}_.-]+/gu) || []).map((item) => item.replace("@", ""))));
  return { hashtags, mentions };
}
function PostComposer() {
  const [content, setContent] = reactExports.useState("");
  const [media, setMedia] = reactExports.useState(null);
  const [mediaPreview, setMediaPreview] = reactExports.useState(null);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [showScheduler, setShowScheduler] = reactExports.useState(false);
  const [scheduledDate, setScheduledDate] = reactExports.useState("");
  const [isPinned, setIsPinned] = reactExports.useState(false);
  const [quoteDraft, setQuoteDraft] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  reactExports.useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    const savedQuote = localStorage.getItem(QUOTE_KEY);
    if (savedDraft) setContent(savedDraft);
    if (savedQuote) {
      try {
        setQuoteDraft(JSON.parse(savedQuote));
      } catch {
        localStorage.removeItem(QUOTE_KEY);
      }
    }
    const handleQuotedPost = () => {
      try {
        const nextValue = JSON.parse(localStorage.getItem(QUOTE_KEY) || "null");
        setQuoteDraft(nextValue);
      } catch {
        setQuoteDraft(null);
      }
    };
    window.addEventListener("yamshat:quote-post", handleQuotedPost);
    return () => window.removeEventListener("yamshat:quote-post", handleQuotedPost);
  }, []);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (content.trim()) localStorage.setItem(DRAFT_KEY, content);
      else localStorage.removeItem(DRAFT_KEY);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [content]);
  const tagsPreview = reactExports.useMemo(() => extractTags(content), [content]);
  const clearComposer = () => {
    setContent("");
    setMedia(null);
    setMediaPreview(null);
    setUploadProgress(0);
    setScheduledDate("");
    setShowScheduler(false);
    setIsPinned(false);
    setQuoteDraft(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(QUOTE_KEY);
  };
  const addSnippet = (value) => {
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${value}`);
  };
  const handleMediaSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      pushToast({ type: "error", title: "الملف كبير جدًا", description: "الحد الأقصى 200 ميجا." });
      return;
    }
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };
  const handleSubmit = async (status = "published") => {
    if (isUploading || !content.trim() && !media && !quoteDraft) return;
    setIsUploading(true);
    try {
      let mediaUrl = "";
      if (media) {
        const uploadRes = await uploadPostMedia(media, (event) => {
          const percent = event.total ? Math.round(event.loaded / event.total * 100) : 0;
          setUploadProgress(percent);
        });
        mediaUrl = uploadRes?.data?.media_url || uploadRes?.data?.url || uploadRes?.data?.file_url || "";
      }
      const { hashtags, mentions } = extractTags(content);
      await createPost({
        content,
        media_url: mediaUrl,
        status,
        scheduled_at: status === "scheduled" ? scheduledDate : null,
        is_pinned: isPinned,
        hashtags,
        mentions,
        quote_source_id: quoteDraft?.id || null
      });
      pushToast({
        type: "success",
        title: status === "draft" ? "تم حفظ المسودة" : status === "scheduled" ? "تمت جدولة المنشور" : "تم نشر المنشور",
        description: isPinned ? "المنشور متجهز كمنشور مثبت." : void 0
      });
      clearComposer();
      queryClient.invalidateQueries(["feed-data"]);
    } catch (error) {
      pushToast({ type: "error", title: "فشل نشر المنشور", description: error?.response?.data?.detail || error?.message || "حاول مرة تانية." });
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { marginBottom: 24, padding: 20, border: "1px solid var(--line)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", flexShrink: 0 } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
        quoteDraft ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { borderRadius: 16, padding: 12, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", marginBottom: 12 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: 700, marginBottom: 4 }, children: [
              "اقتباس من @",
              quoteDraft.username
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 13, lineHeight: 1.6 }, children: quoteDraft.content })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
            setQuoteDraft(null);
            localStorage.removeItem(QUOTE_KEY);
          }, style: { background: "none", border: "none", cursor: "pointer", fontSize: 18 }, children: "✕" })
        ] }) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            placeholder: "اكتب منشورك... استخدم #هاشتاج و @منشن لو حابب",
            value: content,
            onChange: (event) => setContent(event.target.value),
            style: { width: "100%", minHeight: 96, background: "transparent", border: "none", color: "var(--text)", fontSize: 16, resize: "none", outline: "none", paddingTop: 8, lineHeight: 1.7 }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("#ترند"), children: "#هاشتاج" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("@username"), children: "@منشن" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "composer-chip", onClick: () => addSnippet("اقتباس: "), children: "اقتباس" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `composer-chip ${isPinned ? "active" : ""}`, onClick: () => setIsPinned((prev) => !prev), children: "تثبيت المنشور" })
    ] }),
    tagsPreview.hashtags.length || tagsPreview.mentions.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8, marginTop: 12 }, children: [
      tagsPreview.hashtags.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 13 }, children: [
        "هاشتاج: ",
        tagsPreview.hashtags.map((item) => `#${item}`).join(" · ")
      ] }) : null,
      tagsPreview.mentions.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "muted", style: { fontSize: 13 }, children: [
        "منشن: ",
        tagsPreview.mentions.map((item) => `@${item}`).join(" · ")
      ] }) : null
    ] }) : null,
    mediaPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", marginTop: 12, borderRadius: 12, overflow: "hidden", maxHeight: 320 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
        setMedia(null);
        setMediaPreview(null);
      }, style: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", zIndex: 1 }, children: "✕" }),
      media?.type?.startsWith("video") ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: mediaPreview, style: { width: "100%", display: "block" }, controls: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: mediaPreview, style: { width: "100%", objectFit: "cover" }, alt: "Preview" }),
      isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.2)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: "100%", background: "var(--accent)", width: `${uploadProgress}%`, transition: "width 0.2s" } }) }) : null
    ] }) : null,
    showScheduler ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginTop: 16, padding: 12, background: "var(--bg-soft)", borderRadius: 12, border: "1px solid var(--line)" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { display: "block", marginBottom: 8, fontSize: 13, fontWeight: "bold" }, children: "تحديد وقت النشر" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "datetime-local", value: scheduledDate, onChange: (event) => setScheduledDate(event.target.value), style: { width: "100%", background: "var(--bg-input)", color: "var(--text)", border: "1px solid var(--line)", padding: 10, borderRadius: 8 } })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 16, gap: 12, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), style: { background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: 0.8 }, title: "رفع صورة أو فيديو", children: "🖼️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowScheduler((prev) => !prev), style: { background: "none", border: "none", cursor: "pointer", fontSize: 20, opacity: showScheduler ? 1 : 0.8, color: showScheduler ? "var(--accent)" : "inherit" }, title: "جدولة", children: "📅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", style: { fontSize: 13 }, children: isPinned ? "هيتثبت بعد النشر" : "منشور عادي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileInputRef, hidden: true, accept: "image/*,video/*", onChange: handleMediaSelect })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => handleSubmit("draft"), disabled: isUploading || !content.trim() && !quoteDraft, children: "حفظ مسودة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => handleSubmit(showScheduler ? "scheduled" : "published"), loading: isUploading, disabled: isUploading || !content.trim() && !media && !quoteDraft, children: showScheduler ? "تأكيد الجدولة" : "نشر" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .composer-chip {
          border: 1px solid rgba(59,130,246,0.15);
          background: rgba(59,130,246,0.06);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
        }
        .composer-chip.active {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
          color: #059669;
        }
      ` })
  ] });
}
function useFeed(options = {}) {
  const {
    tab = "all",
    filter = "latest",
    limit = 10,
    pollingInterval = 3e4
    // 30 seconds polling
  } = options;
  const lastFetchRef = reactExports.useRef(Date.now());
  const query = useInfiniteQuery({
    queryKey: ["feed-data", tab, filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({ tab, filter, page: pageParam, limit });
      lastFetchRef.current = Date.now();
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.length === limit ? allPages.length + 1 : void 0;
    },
    // Stale data handling
    staleTime: 5 * 60 * 1e3,
    // 5 minutes
    cacheTime: 30 * 60 * 1e3,
    // 30 minutes
    refetchOnWindowFocus: true,
    // Polling fallback for real-time updates
    refetchInterval: (data) => {
      return data?.pages?.length === 1 && document.visibilityState === "visible" ? pollingInterval : false;
    }
  });
  const posts = query.data?.pages.flatMap((page) => page) || [];
  return {
    posts,
    ...query,
    lastFetched: lastFetchRef.current
  };
}
function Avatar({ name, src, size = 46, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    border: ring ? "2px solid rgba(139,92,246,0.8)" : "none",
    boxShadow: ring ? "0 0 0 4px rgba(139,92,246,0.14)" : "none",
    flexShrink: 0
  };
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(name) }, children: initialsFromName(name).slice(0, 1) });
}
function mediaListFromPost(post) {
  if (Array.isArray(post?.media_urls) && post.media_urls.length) return post.media_urls;
  if (Array.isArray(post?.images) && post.images.length) return post.images;
  if (post?.image_url) return [post.image_url];
  if (post?.media) return [post.media];
  return [];
}
function PostGallery({ media, title }) {
  const items = media.slice(0, 3);
  if (!items.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-fallback-media", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: title || "Gaming vibes" })
    ] });
  }
  if (items.length === 1) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: items[0], alt: title, className: "yam-feed-main-media" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-feed-media-grid ${items.length === 2 ? "two" : "three"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: items[0], alt: title, className: "primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "secondary-stack", children: items.slice(1).map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "secondary-cell", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item, alt: `${title}-${index}` }),
      index === 1 && media.length > 3 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "media-overlay", children: [
        "+",
        media.length - 3
      ] }) : null
    ] }, `${item}-${index}`)) })
  ] });
}
function FeedPostCard({ post, onLike }) {
  const media = mediaListFromPost(post);
  const likes = post.likes_count ?? post.like_count ?? post.likes ?? 0;
  const comments = post.comments_count ?? post.comment_count ?? Math.max(12, Math.floor(likes / 9));
  const shares = post.share_count ?? post.shares ?? Math.max(6, Math.floor(likes / 18));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "yam-feed-post-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: post.username || "User", src: post.avatar }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-author-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.username || "Creator" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "verify-dot", children: "✓" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: formatTimeAgo(post.created_at) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-ghost", children: "⋯" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-post-copy", children: post.content || "جلسة ممتعة اليوم مع المتابعين! شكراً لكل من كان موجود." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PostGallery, { media, title: post.content || post.username }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-post-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-react-btn", onClick: () => onLike(post.id), children: [
        "❤ ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(likes) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-react-btn", children: [
        "💬 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(comments) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-react-btn", children: [
        "⤴ ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCompactNumber(shares) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-react-btn save", children: "⌑" })
    ] })
  ] });
}
function Feed() {
  const queryClient = useQueryClient();
  const currentUsername = getCurrentUsername();
  const { posts = [], isLoading, refetch } = useFeed({ limit: 10, pollingInterval: 25e3 });
  const { data: users = [] } = useQuery({
    queryKey: ["feed-users-sidebar"],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 6e4
  });
  const { data: liveRooms = [] } = useQuery({
    queryKey: ["feed-live-sidebar"],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const likeMutation = useMutation({
    mutationFn: likePost,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-data"] })
  });
  const followMutation = useMutation({
    mutationFn: followUser,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed-users-sidebar"] })
  });
  const stories = reactExports.useMemo(() => {
    const liveStories = Array.isArray(liveRooms) ? liveRooms.slice(0, 2).map((room) => ({
      id: `live-${room.id}`,
      username: room.host || room.username || "PlayerOne",
      avatar: room.avatar,
      live: true
    })) : [];
    const userStories = Array.isArray(users) ? users.slice(0, 4).map((user) => ({
      id: user.username,
      username: user.username,
      avatar: user.avatar,
      live: false
    })) : [];
    return [...liveStories, ...userStories].slice(0, 5);
  }, [liveRooms, users]);
  const trendingPosts = reactExports.useMemo(
    () => [...posts].sort((a, b) => Number(b.likes_count ?? b.like_count ?? b.likes ?? 0) - Number(a.likes_count ?? a.like_count ?? a.likes ?? 0)).slice(0, 3),
    [posts]
  );
  const onlineFriends = reactExports.useMemo(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 5),
    [users, currentUsername]
  );
  const suggestedUsers = reactExports.useMemo(
    () => users.filter((user) => user.username !== currentUsername).slice(0, 3),
    [users, currentUsername]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-page desktop-post mobile-post", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-main-column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-feed-composer-shell", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-composer-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: currentUsername || "You", size: 54, ring: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-composer-prompt", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "بم تفكر اليوم؟" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نص • صورة • مقطع قصير • لايف مباشر" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PostComposer, {})
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-sort-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض حسب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "أحدث المنشورات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-refresh-btn", onClick: () => refetch(), children: "تحديث" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-feed-posts-stack", children: [
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-block", children: "جارٍ تحميل المنشورات..." }) : null,
          !isLoading && !posts.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-block", children: "لا توجد منشورات حالياً." }) : null,
          posts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(FeedPostCard, { post, onLike: (postId) => likeMutation.mutate(postId) }, post.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-feed-right-column", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "القصص" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-add-story", children: [
              "＋",
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "إضافة قصة" })
            ] }),
            stories.map((story) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-story-user", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `yam-story-ring ${story.live ? "live" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: story.username, src: story.avatar, size: 58 }) }),
              story.live ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-story-live", children: "LIVE" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: story.username })
            ] }, story.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "المنشورات الرائجة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض المزيد" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-trending-list", children: trendingPosts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-trending-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: post.username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: (post.content || "منشور مميز").slice(0, 70) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-trending-stats", children: [
                "❤ ",
                formatCompactNumber(post.likes_count ?? post.like_count ?? post.likes ?? 0),
                " · 💬 ",
                formatCompactNumber(post.comments_count ?? 0)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-trending-thumb", children: mediaListFromPost(post)[0] ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: mediaListFromPost(post)[0], alt: post.username }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🎮" }) })
          ] }, post.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "الأصدقاء المتصلون" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-online-list", children: onlineFriends.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-online-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-online-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-online-avatar-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: user.username, src: user.avatar, size: 42 }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "online-indicator" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user.profile?.activity_tagline || "متصل الآن" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-chat-shortcut", children: "💬" })
          ] }, user.username)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-side-card promo", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "promo-visual", children: "🎮" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "انضم إلى مجتمع يامشات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اكتشف محتوى جديد وتعرّف على أصدقاء جدد واستمتع بتجربة تفاعلية فريدة." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-primary-wide", children: "استكشف الآن" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-side-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اقتراحات للمتابعة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-suggest-list", children: suggestedUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-suggest-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-online-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: user.username, src: user.avatar, size: 42 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user.email || "Gaming creator" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-follow-inline", onClick: () => followMutation.mutate(user.username), children: "متابعة" })
          ] }, user.username)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-feed-page {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 18px;
          padding: 18px;
        }
        @media (max-width: 1023px) {
          .yam-feed-page {
            grid-template-columns: 1fr;
            padding: 10px;
          }
          .yam-feed-right-column {
            display: none;
          }
        }
        .yam-feed-main-column { min-width: 0; display: grid; gap: 16px; }
        .yam-feed-right-column { display: grid; gap: 16px; align-content: start; }
        .yam-feed-composer-shell,
        .yam-side-card,
        .yam-feed-post-card {
          border-radius: 28px;
          background: rgba(7, 12, 24, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 24px 50px rgba(2,6,23,0.24);
          overflow: hidden;
        }
        .yam-feed-composer-shell { padding: 18px; }
        .yam-feed-composer-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .yam-feed-composer-prompt strong { display: block; font-size: 18px; }
        .yam-feed-composer-prompt span { color: #94a3b8; font-size: 13px; }
        .yam-feed-sort-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          padding: 0 8px;
          font-size: 14px;
        }
        .yam-refresh-btn {
          margin-inline-start: auto;
          border: none;
          background: rgba(124,58,237,0.18);
          color: white;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 700;
        }
        .yam-feed-posts-stack { display: grid; gap: 16px; }
        .yam-feed-post-card { padding: 18px; display: grid; gap: 16px; }
        .yam-post-header,
        .yam-post-actions,
        .yam-side-card-head,
        .yam-online-item,
        .yam-suggest-row,
        .yam-trending-item,
        .yam-post-author,
        .yam-online-meta { display: flex; align-items: center; gap: 12px; }
        .yam-post-header, .yam-side-card-head, .yam-trending-item, .yam-suggest-row, .yam-online-item {
          justify-content: space-between;
        }
        .yam-post-author-line { display: flex; align-items: center; gap: 6px; font-size: 16px; }
        .verify-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #3b82f6;
          color: white;
          font-size: 11px;
          font-weight: 900;
        }
        .yam-post-copy {
          color: #dbe4ff;
          line-height: 1.9;
          white-space: pre-wrap;
        }
        .yam-feed-main-media {
          width: 100%;
          max-height: 430px;
          object-fit: cover;
          border-radius: 24px;
          display: block;
        }
        .yam-feed-media-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.9fr);
          gap: 10px;
          min-height: 320px;
        }
        .yam-feed-media-grid.two .secondary-stack { grid-template-rows: 1fr; }
        .yam-feed-media-grid img,
        .yam-feed-media-grid video,
        .yam-trending-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .yam-feed-media-grid .primary,
        .yam-feed-fallback-media { border-radius: 22px; min-height: 320px; }
        .secondary-stack { display: grid; gap: 10px; }
        .secondary-cell { position: relative; border-radius: 22px; overflow: hidden; min-height: 155px; }
        .media-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(6,10,18,0.46);
          color: white;
          font-size: 30px;
          font-weight: 900;
          backdrop-filter: blur(4px);
        }
        .yam-feed-fallback-media {
          padding: 28px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.26), transparent 50%), linear-gradient(135deg, rgba(10,18,38,0.96), rgba(7,12,24,1));
          display: grid;
          align-content: center;
          gap: 18px;
          color: white;
        }
        .monitor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .monitor-grid div { min-height: 110px; border-radius: 18px; background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.34)); border: 1px solid rgba(255,255,255,0.08); }
        .yam-post-actions { justify-content: flex-start; flex-wrap: wrap; }
        .yam-react-btn, .yam-icon-ghost, .yam-chat-shortcut, .yam-follow-inline {
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: white;
          border-radius: 14px;
          padding: 10px 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
        }
        .yam-icon-ghost, .yam-chat-shortcut { width: 42px; height: 42px; padding: 0; justify-content: center; }
        .yam-react-btn.save { margin-inline-start: auto; }
        .yam-side-card { padding: 18px; display: grid; gap: 14px; }
        .yam-side-card-head h3 { margin: 0; font-size: 18px; }
        .yam-side-card-head span { color: #8b5cf6; font-size: 13px; font-weight: 700; }
        .yam-story-row { display: flex; align-items: flex-start; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
        .yam-story-row::-webkit-scrollbar { height: 5px; }
        .yam-story-user { display: grid; justify-items: center; gap: 8px; min-width: 72px; }
        .yam-story-user small { color: #cbd5e1; }
        .yam-story-ring {
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(236,72,153,0.88), rgba(124,58,237,0.88));
        }
        .yam-story-ring.live { background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(168,85,247,0.88)); }
        .yam-story-live {
          padding: 4px 8px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 900;
          margin-top: -16px;
          z-index: 1;
        }
        .yam-add-story {
          min-width: 72px;
          min-height: 72px;
          border-radius: 50%;
          border: 1px dashed rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.02);
          color: white;
          display: grid;
          place-items: center;
          gap: 4px;
          padding: 0;
          font-size: 26px;
        }
        .yam-add-story small { font-size: 12px; color: #94a3b8; }
        .yam-trending-list, .yam-online-list, .yam-suggest-list { display: grid; gap: 12px; }
        .yam-trending-item, .yam-online-item, .yam-suggest-row {
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,0.03);
          gap: 12px;
        }
        .yam-trending-item p { margin: 6px 0 8px; color: #cbd5e1; line-height: 1.7; }
        .yam-trending-thumb {
          width: 92px;
          height: 92px;
          border-radius: 18px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.24), rgba(139,92,246,0.22));
          display: grid;
          place-items: center;
          font-size: 24px;
        }
        .yam-trending-stats, .yam-online-item small, .yam-suggest-row small { color: #94a3b8; font-size: 13px; }
        .yam-online-avatar-wrap { position: relative; }
        .online-indicator {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid rgba(7,12,24,0.94);
        }
        .promo { text-align: center; }
        .promo-visual {
          width: 92px;
          height: 92px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          margin: 0 auto 8px;
          font-size: 42px;
          background: linear-gradient(135deg, rgba(124,58,237,0.26), rgba(99,102,241,0.14));
        }
        .promo p { margin: 0; color: #94a3b8; line-height: 1.8; }
        .yam-primary-wide, .yam-follow-inline {
          border: none;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
        }
        .yam-follow-inline { padding: 10px 14px; }
        .yam-empty-block {
          border-radius: 24px;
          background: rgba(7,12,24,0.88);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px;
          text-align: center;
          color: #94a3b8;
        }
        @media (max-width: 1280px) {
          .yam-feed-page { grid-template-columns: minmax(0, 1fr) 320px; }
        }
        @media (max-width: 1024px) {
          .yam-feed-page { grid-template-columns: 1fr; }
          .yam-feed-right-column { order: -1; }
        }
        @media (max-width: 680px) {
          .yam-feed-page { padding: 12px; }
          .yam-feed-media-grid { grid-template-columns: 1fr; }
          .yam-react-btn.save { margin-inline-start: 0; }
          .yam-trending-thumb { width: 74px; height: 74px; }
        }
      ` })
  ] });
}
export {
  Feed as default
};
