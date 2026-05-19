var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _currentResult, _currentMutation, _mutateOptions, _MutationObserver_instances, updateResult_fn, notify_fn, _a;
import { F as hasPreviousPage, G as hasNextPage, H as Subscribable, I as shallowEqualObjects, J as hashKey, K as getDefaultState, N as notifyManager, p as useQueryClient, r as reactExports, O as noop, Q as shouldThrowError, e as useToast, j as jsxRuntimeExports, B as Button, R as mediaUploadService } from "../index-BAMQT-m6.js";
import { C as Card } from "./Card-BJoniTPs.js";
import { d as createPost, g as getPosts } from "./posts-IFBCXYyQ.js";
import { Q as QueryObserver, a as useBaseQuery } from "./MainLayout-R4-pAMZD.js";
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
        const uploadRes = await mediaUploadService.uploadFile(media, {
          purpose: media?.type?.startsWith("video/") ? "post-video" : "post-image",
          onProgress: (payload) => {
            const percent = typeof payload === "number" ? Number(payload || 0) : Number(payload?.percent || 0);
            setUploadProgress(percent);
          }
        });
        mediaUrl = uploadRes?.mediaUrl || uploadRes?.url || uploadRes?.file_url || "";
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
    tab,
    filter,
    filterType,
    sort,
    sortBy,
    limit = 10,
    includeDrafts = false,
    pollingInterval = 3e4
  } = options;
  const effectiveFilter = String(filterType || tab || filter || "all").trim().toLowerCase();
  const effectiveSort = String(sortBy || sort || (filter === "latest" ? "recent" : "recent")).trim().toLowerCase();
  const pageSize = Math.max(Number(limit) || 10, 1);
  const lastFetchRef = reactExports.useRef(Date.now());
  const query = useInfiniteQuery({
    queryKey: ["feed-data", effectiveFilter, effectiveSort, pageSize, Boolean(includeDrafts)],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getPosts({
        page: pageParam,
        limit: pageSize,
        filterType: effectiveFilter,
        sortBy: effectiveSort,
        include_drafts: includeDrafts
      });
      lastFetchRef.current = Date.now();
      return {
        items: response.data || [],
        meta: response.meta || {}
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = Boolean(
        lastPage?.meta?.pagination?.has_more ?? lastPage?.meta?.has_more ?? (Array.isArray(lastPage?.items) && lastPage.items.length === pageSize)
      );
      return hasMore ? allPages.length + 1 : void 0;
    },
    staleTime: 5 * 60 * 1e3,
    cacheTime: 30 * 60 * 1e3,
    refetchOnWindowFocus: true,
    refetchInterval: (data) => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
      return data?.pages?.length === 1 ? pollingInterval : false;
    }
  });
  const posts = query.data?.pages.flatMap((page) => page.items || []) || [];
  const meta = query.data?.pages?.[0]?.meta || {};
  return {
    posts,
    meta,
    ...query,
    lastFetched: lastFetchRef.current
  };
}
export {
  PostComposer as P,
  useMutation as a,
  useFeed as u
};
