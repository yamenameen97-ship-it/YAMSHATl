const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/Feed-Dmk2v4Po.js","index-DuXBJv5q.js","chunks/useFeed-D74BbOte.js","chunks/Card-qq68bGlj.js","chunks/proxy-BFepwXo2.js","chunks/posts-1f9mZwS7.js","chunks/users-yjlw8KOa.js","chunks/live-b1Kum3Sy.js","chunks/YamshatDesign-C0ca_MnA.js","chunks/Dashboard-DTqWQDR8.js","chunks/Stories-Zjs-i32I.js","chunks/Modal-DM4_qhBh.js","chunks/stories-CAECkPR9.js","chunks/Reels-IJ25LLrB.js","chunks/react-virtualized-auto-sizer.esm-DKGCxiTv.js","chunks/deviceProfile-DTy4urT5.js","chunks/recommendationService-CaN6KIfu.js","chunks/Groups-B0zWdCBA.js","chunks/EmptyState-CdKtrcN-.js","chunks/groups-DONR23VT.js","chunks/Live-CZJY28ex.js","chunks/Inbox-CqHN00ds.js","chunks/Users-D9DSbSbV.js","chunks/Input-B86JccIb.js","chunks/ErrorState-E6_7voYz.js","chunks/useDebouncedValue-D3V-N9aL.js","chunks/Profile-S6xDfnht.js","chunks/index-DTYjTy3_.js","chunks/Search-BoqShEOu.js","chunks/Settings-CJD-CfKa.js","chunks/Chat-Ba-XAl7-.js"])))=>i.map(i=>d[i]);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _currentQuery, _currentQueryInitialState, _currentResult, _currentResultState, _currentResultOptions, _currentThenable, _selectError, _selectFn, _selectResult, _lastQueryWithDefinedData, _staleTimeoutId, _refetchIntervalId, _currentRefetchInterval, _trackedProps, _QueryObserver_instances, executeFetch_fn, updateStaleTimeout_fn, computeRefetchInterval_fn, updateRefetchInterval_fn, updateTimers_fn, clearStaleTimeout_fn, clearRefetchInterval_fn, updateQuery_fn, notify_fn, _a;
import { J as Subscribable, a3 as pendingThenable, a4 as resolveQueryBoolean, K as shallowEqualObjects, a5 as resolveStaleTime, T as noop, a6 as environmentManager, a7 as isValidTimeout, a8 as timeUntilStale, a9 as timeoutManager, aa as focusManager, ab as fetchState, ac as replaceData, R as notifyManager, r as reactExports, U as shouldThrowError, p as useQueryClient, A as API, a as useLocation, v as useChatStore, w as selectUnreadTotal, d as useAppStore, f as getCurrentUsername, ad as getStoredUserSnapshot, j as jsxRuntimeExports, L as Link, N as NavLink, ae as getAuthToken, af as getCsrfToken, ag as BACKEND_ORIGIN, c as clearStoredUser, ah as redirectToAppPath, _ as __vitePreload } from "../index-DuXBJv5q.js";
var QueryObserver = (_a = class extends Subscribable {
  constructor(client, options) {
    super();
    __privateAdd(this, _QueryObserver_instances);
    __privateAdd(this, _client);
    __privateAdd(this, _currentQuery);
    __privateAdd(this, _currentQueryInitialState);
    __privateAdd(this, _currentResult);
    __privateAdd(this, _currentResultState);
    __privateAdd(this, _currentResultOptions);
    __privateAdd(this, _currentThenable);
    __privateAdd(this, _selectError);
    __privateAdd(this, _selectFn);
    __privateAdd(this, _selectResult);
    // This property keeps track of the last query with defined data.
    // It will be used to pass the previous data and query to the placeholder function between renders.
    __privateAdd(this, _lastQueryWithDefinedData);
    __privateAdd(this, _staleTimeoutId);
    __privateAdd(this, _refetchIntervalId);
    __privateAdd(this, _currentRefetchInterval);
    __privateAdd(this, _trackedProps, /* @__PURE__ */ new Set());
    this.options = options;
    __privateSet(this, _client, client);
    __privateSet(this, _selectError, null);
    __privateSet(this, _currentThenable, pendingThenable());
    this.bindMethods();
    this.setOptions(options);
  }
  bindMethods() {
    this.refetch = this.refetch.bind(this);
  }
  onSubscribe() {
    if (this.listeners.size === 1) {
      __privateGet(this, _currentQuery).addObserver(this);
      if (shouldFetchOnMount(__privateGet(this, _currentQuery), this.options)) {
        __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
      } else {
        this.updateResult();
      }
      __privateMethod(this, _QueryObserver_instances, updateTimers_fn).call(this);
    }
  }
  onUnsubscribe() {
    if (!this.hasListeners()) {
      this.destroy();
    }
  }
  shouldFetchOnReconnect() {
    return shouldFetchOn(
      __privateGet(this, _currentQuery),
      this.options,
      this.options.refetchOnReconnect
    );
  }
  shouldFetchOnWindowFocus() {
    return shouldFetchOn(
      __privateGet(this, _currentQuery),
      this.options,
      this.options.refetchOnWindowFocus
    );
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set();
    __privateMethod(this, _QueryObserver_instances, clearStaleTimeout_fn).call(this);
    __privateMethod(this, _QueryObserver_instances, clearRefetchInterval_fn).call(this);
    __privateGet(this, _currentQuery).removeObserver(this);
  }
  setOptions(options) {
    const prevOptions = this.options;
    const prevQuery = __privateGet(this, _currentQuery);
    this.options = __privateGet(this, _client).defaultQueryOptions(options);
    if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveQueryBoolean(this.options.enabled, __privateGet(this, _currentQuery)) !== "boolean") {
      throw new Error(
        "Expected enabled to be a boolean or a callback that returns a boolean"
      );
    }
    __privateMethod(this, _QueryObserver_instances, updateQuery_fn).call(this);
    __privateGet(this, _currentQuery).setOptions(this.options);
    if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) {
      __privateGet(this, _client).getQueryCache().notify({
        type: "observerOptionsUpdated",
        query: __privateGet(this, _currentQuery),
        observer: this
      });
    }
    const mounted = this.hasListeners();
    if (mounted && shouldFetchOptionally(
      __privateGet(this, _currentQuery),
      prevQuery,
      this.options,
      prevOptions
    )) {
      __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
    }
    this.updateResult();
    if (mounted && (__privateGet(this, _currentQuery) !== prevQuery || resolveQueryBoolean(this.options.enabled, __privateGet(this, _currentQuery)) !== resolveQueryBoolean(prevOptions.enabled, __privateGet(this, _currentQuery)) || resolveStaleTime(this.options.staleTime, __privateGet(this, _currentQuery)) !== resolveStaleTime(prevOptions.staleTime, __privateGet(this, _currentQuery)))) {
      __privateMethod(this, _QueryObserver_instances, updateStaleTimeout_fn).call(this);
    }
    const nextRefetchInterval = __privateMethod(this, _QueryObserver_instances, computeRefetchInterval_fn).call(this);
    if (mounted && (__privateGet(this, _currentQuery) !== prevQuery || resolveQueryBoolean(this.options.enabled, __privateGet(this, _currentQuery)) !== resolveQueryBoolean(prevOptions.enabled, __privateGet(this, _currentQuery)) || nextRefetchInterval !== __privateGet(this, _currentRefetchInterval))) {
      __privateMethod(this, _QueryObserver_instances, updateRefetchInterval_fn).call(this, nextRefetchInterval);
    }
  }
  getOptimisticResult(options) {
    const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), options);
    const result = this.createResult(query, options);
    if (shouldAssignObserverCurrentProperties(this, result)) {
      __privateSet(this, _currentResult, result);
      __privateSet(this, _currentResultOptions, this.options);
      __privateSet(this, _currentResultState, __privateGet(this, _currentQuery).state);
    }
    return result;
  }
  getCurrentResult() {
    return __privateGet(this, _currentResult);
  }
  trackResult(result, onPropTracked) {
    return new Proxy(result, {
      get: (target, key) => {
        this.trackProp(key);
        onPropTracked?.(key);
        if (key === "promise") {
          this.trackProp("data");
          if (!this.options.experimental_prefetchInRender && __privateGet(this, _currentThenable).status === "pending") {
            __privateGet(this, _currentThenable).reject(
              new Error(
                "experimental_prefetchInRender feature flag is not enabled"
              )
            );
          }
        }
        return Reflect.get(target, key);
      }
    });
  }
  trackProp(key) {
    __privateGet(this, _trackedProps).add(key);
  }
  getCurrentQuery() {
    return __privateGet(this, _currentQuery);
  }
  refetch({ ...options } = {}) {
    return this.fetch({
      ...options
    });
  }
  fetchOptimistic(options) {
    const defaultedOptions = __privateGet(this, _client).defaultQueryOptions(options);
    const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), defaultedOptions);
    return query.fetch().then(() => this.createResult(query, defaultedOptions));
  }
  fetch(fetchOptions) {
    return __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this, {
      ...fetchOptions,
      cancelRefetch: fetchOptions.cancelRefetch ?? true
    }).then(() => {
      this.updateResult();
      return __privateGet(this, _currentResult);
    });
  }
  createResult(query, options) {
    const prevQuery = __privateGet(this, _currentQuery);
    const prevOptions = this.options;
    const prevResult = __privateGet(this, _currentResult);
    const prevResultState = __privateGet(this, _currentResultState);
    const prevResultOptions = __privateGet(this, _currentResultOptions);
    const queryChange = query !== prevQuery;
    const queryInitialState = queryChange ? query.state : __privateGet(this, _currentQueryInitialState);
    const { state } = query;
    let newState = { ...state };
    let isPlaceholderData = false;
    let data;
    if (options._optimisticResults) {
      const mounted = this.hasListeners();
      const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
      const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
      if (fetchOnMount || fetchOptionally) {
        newState = {
          ...newState,
          ...fetchState(state.data, query.options)
        };
      }
      if (options._optimisticResults === "isRestoring") {
        newState.fetchStatus = "idle";
      }
    }
    let { error, errorUpdatedAt, status } = newState;
    data = newState.data;
    let skipSelect = false;
    if (options.placeholderData !== void 0 && data === void 0 && status === "pending") {
      let placeholderData;
      if (prevResult?.isPlaceholderData && options.placeholderData === prevResultOptions?.placeholderData) {
        placeholderData = prevResult.data;
        skipSelect = true;
      } else {
        placeholderData = typeof options.placeholderData === "function" ? options.placeholderData(
          __privateGet(this, _lastQueryWithDefinedData)?.state.data,
          __privateGet(this, _lastQueryWithDefinedData)
        ) : options.placeholderData;
      }
      if (placeholderData !== void 0) {
        status = "success";
        data = replaceData(
          prevResult?.data,
          placeholderData,
          options
        );
        isPlaceholderData = true;
      }
    }
    if (options.select && data !== void 0 && !skipSelect) {
      if (prevResult && data === prevResultState?.data && options.select === __privateGet(this, _selectFn)) {
        data = __privateGet(this, _selectResult);
      } else {
        try {
          __privateSet(this, _selectFn, options.select);
          data = options.select(data);
          data = replaceData(prevResult?.data, data, options);
          __privateSet(this, _selectResult, data);
          __privateSet(this, _selectError, null);
        } catch (selectError) {
          __privateSet(this, _selectError, selectError);
        }
      }
    }
    if (__privateGet(this, _selectError)) {
      error = __privateGet(this, _selectError);
      data = __privateGet(this, _selectResult);
      errorUpdatedAt = Date.now();
      status = "error";
    }
    const isFetching = newState.fetchStatus === "fetching";
    const isPending = status === "pending";
    const isError = status === "error";
    const isLoading = isPending && isFetching;
    const hasData = data !== void 0;
    const result = {
      status,
      fetchStatus: newState.fetchStatus,
      isPending,
      isSuccess: status === "success",
      isError,
      isInitialLoading: isLoading,
      isLoading,
      data,
      dataUpdatedAt: newState.dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: newState.fetchFailureCount,
      failureReason: newState.fetchFailureReason,
      errorUpdateCount: newState.errorUpdateCount,
      isFetched: query.isFetched(),
      isFetchedAfterMount: newState.dataUpdateCount > queryInitialState.dataUpdateCount || newState.errorUpdateCount > queryInitialState.errorUpdateCount,
      isFetching,
      isRefetching: isFetching && !isPending,
      isLoadingError: isError && !hasData,
      isPaused: newState.fetchStatus === "paused",
      isPlaceholderData,
      isRefetchError: isError && hasData,
      isStale: isStale(query, options),
      refetch: this.refetch,
      promise: __privateGet(this, _currentThenable),
      isEnabled: resolveQueryBoolean(options.enabled, query) !== false
    };
    const nextResult = result;
    if (this.options.experimental_prefetchInRender) {
      const hasResultData = nextResult.data !== void 0;
      const isErrorWithoutData = nextResult.status === "error" && !hasResultData;
      const finalizeThenableIfPossible = (thenable) => {
        if (isErrorWithoutData) {
          thenable.reject(nextResult.error);
        } else if (hasResultData) {
          thenable.resolve(nextResult.data);
        }
      };
      const recreateThenable = () => {
        const pending = __privateSet(this, _currentThenable, nextResult.promise = pendingThenable());
        finalizeThenableIfPossible(pending);
      };
      const prevThenable = __privateGet(this, _currentThenable);
      switch (prevThenable.status) {
        case "pending":
          if (query.queryHash === prevQuery.queryHash) {
            finalizeThenableIfPossible(prevThenable);
          }
          break;
        case "fulfilled":
          if (isErrorWithoutData || nextResult.data !== prevThenable.value) {
            recreateThenable();
          }
          break;
        case "rejected":
          if (!isErrorWithoutData || nextResult.error !== prevThenable.reason) {
            recreateThenable();
          }
          break;
      }
    }
    return nextResult;
  }
  updateResult() {
    const prevResult = __privateGet(this, _currentResult);
    const nextResult = this.createResult(__privateGet(this, _currentQuery), this.options);
    __privateSet(this, _currentResultState, __privateGet(this, _currentQuery).state);
    __privateSet(this, _currentResultOptions, this.options);
    if (__privateGet(this, _currentResultState).data !== void 0) {
      __privateSet(this, _lastQueryWithDefinedData, __privateGet(this, _currentQuery));
    }
    if (shallowEqualObjects(nextResult, prevResult)) {
      return;
    }
    __privateSet(this, _currentResult, nextResult);
    const shouldNotifyListeners = () => {
      if (!prevResult) {
        return true;
      }
      const { notifyOnChangeProps } = this.options;
      const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
      if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !__privateGet(this, _trackedProps).size) {
        return true;
      }
      const includedProps = new Set(
        notifyOnChangePropsValue ?? __privateGet(this, _trackedProps)
      );
      if (this.options.throwOnError) {
        includedProps.add("error");
      }
      return Object.keys(__privateGet(this, _currentResult)).some((key) => {
        const typedKey = key;
        const changed = __privateGet(this, _currentResult)[typedKey] !== prevResult[typedKey];
        return changed && includedProps.has(typedKey);
      });
    };
    __privateMethod(this, _QueryObserver_instances, notify_fn).call(this, { listeners: shouldNotifyListeners() });
  }
  onQueryUpdate() {
    this.updateResult();
    if (this.hasListeners()) {
      __privateMethod(this, _QueryObserver_instances, updateTimers_fn).call(this);
    }
  }
}, _client = new WeakMap(), _currentQuery = new WeakMap(), _currentQueryInitialState = new WeakMap(), _currentResult = new WeakMap(), _currentResultState = new WeakMap(), _currentResultOptions = new WeakMap(), _currentThenable = new WeakMap(), _selectError = new WeakMap(), _selectFn = new WeakMap(), _selectResult = new WeakMap(), _lastQueryWithDefinedData = new WeakMap(), _staleTimeoutId = new WeakMap(), _refetchIntervalId = new WeakMap(), _currentRefetchInterval = new WeakMap(), _trackedProps = new WeakMap(), _QueryObserver_instances = new WeakSet(), executeFetch_fn = function(fetchOptions) {
  __privateMethod(this, _QueryObserver_instances, updateQuery_fn).call(this);
  let promise = __privateGet(this, _currentQuery).fetch(
    this.options,
    fetchOptions
  );
  if (!fetchOptions?.throwOnError) {
    promise = promise.catch(noop);
  }
  return promise;
}, updateStaleTimeout_fn = function() {
  __privateMethod(this, _QueryObserver_instances, clearStaleTimeout_fn).call(this);
  const staleTime = resolveStaleTime(
    this.options.staleTime,
    __privateGet(this, _currentQuery)
  );
  if (environmentManager.isServer() || __privateGet(this, _currentResult).isStale || !isValidTimeout(staleTime)) {
    return;
  }
  const time = timeUntilStale(__privateGet(this, _currentResult).dataUpdatedAt, staleTime);
  const timeout = time + 1;
  __privateSet(this, _staleTimeoutId, timeoutManager.setTimeout(() => {
    if (!__privateGet(this, _currentResult).isStale) {
      this.updateResult();
    }
  }, timeout));
}, computeRefetchInterval_fn = function() {
  return (typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(__privateGet(this, _currentQuery)) : this.options.refetchInterval) ?? false;
}, updateRefetchInterval_fn = function(nextInterval) {
  __privateMethod(this, _QueryObserver_instances, clearRefetchInterval_fn).call(this);
  __privateSet(this, _currentRefetchInterval, nextInterval);
  if (environmentManager.isServer() || resolveQueryBoolean(this.options.enabled, __privateGet(this, _currentQuery)) === false || !isValidTimeout(__privateGet(this, _currentRefetchInterval)) || __privateGet(this, _currentRefetchInterval) === 0) {
    return;
  }
  __privateSet(this, _refetchIntervalId, timeoutManager.setInterval(() => {
    if (this.options.refetchIntervalInBackground || focusManager.isFocused()) {
      __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
    }
  }, __privateGet(this, _currentRefetchInterval)));
}, updateTimers_fn = function() {
  __privateMethod(this, _QueryObserver_instances, updateStaleTimeout_fn).call(this);
  __privateMethod(this, _QueryObserver_instances, updateRefetchInterval_fn).call(this, __privateMethod(this, _QueryObserver_instances, computeRefetchInterval_fn).call(this));
}, clearStaleTimeout_fn = function() {
  if (__privateGet(this, _staleTimeoutId) !== void 0) {
    timeoutManager.clearTimeout(__privateGet(this, _staleTimeoutId));
    __privateSet(this, _staleTimeoutId, void 0);
  }
}, clearRefetchInterval_fn = function() {
  if (__privateGet(this, _refetchIntervalId) !== void 0) {
    timeoutManager.clearInterval(__privateGet(this, _refetchIntervalId));
    __privateSet(this, _refetchIntervalId, void 0);
  }
}, updateQuery_fn = function() {
  const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), this.options);
  if (query === __privateGet(this, _currentQuery)) {
    return;
  }
  const prevQuery = __privateGet(this, _currentQuery);
  __privateSet(this, _currentQuery, query);
  __privateSet(this, _currentQueryInitialState, query.state);
  if (this.hasListeners()) {
    prevQuery?.removeObserver(this);
    query.addObserver(this);
  }
}, notify_fn = function(notifyOptions) {
  notifyManager.batch(() => {
    if (notifyOptions.listeners) {
      this.listeners.forEach((listener) => {
        listener(__privateGet(this, _currentResult));
      });
    }
    __privateGet(this, _client).getQueryCache().notify({
      query: __privateGet(this, _currentQuery),
      type: "observerResultsUpdated"
    });
  });
}, _a);
function shouldLoadOnMount(query, options) {
  return resolveQueryBoolean(options.enabled, query) !== false && query.state.data === void 0 && !(query.state.status === "error" && resolveQueryBoolean(options.retryOnMount, query) === false);
}
function shouldFetchOnMount(query, options) {
  return shouldLoadOnMount(query, options) || query.state.data !== void 0 && shouldFetchOn(query, options, options.refetchOnMount);
}
function shouldFetchOn(query, options, field) {
  if (resolveQueryBoolean(options.enabled, query) !== false && resolveStaleTime(options.staleTime, query) !== "static") {
    const value = typeof field === "function" ? field(query) : field;
    return value === "always" || value !== false && isStale(query, options);
  }
  return false;
}
function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
  return (query !== prevQuery || resolveQueryBoolean(prevOptions.enabled, query) === false) && (!options.suspense || query.state.status !== "error") && isStale(query, options);
}
function isStale(query, options) {
  return resolveQueryBoolean(options.enabled, query) !== false && query.isStaleByTime(resolveStaleTime(options.staleTime, query));
}
function shouldAssignObserverCurrentProperties(observer, optimisticResult) {
  if (!shallowEqualObjects(observer.getCurrentResult(), optimisticResult)) {
    return true;
  }
  return false;
}
var IsRestoringContext = reactExports.createContext(false);
var useIsRestoring = () => reactExports.useContext(IsRestoringContext);
IsRestoringContext.Provider;
function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}
var QueryErrorResetBoundaryContext = reactExports.createContext(createValue());
var useQueryErrorResetBoundary = () => reactExports.useContext(QueryErrorResetBoundaryContext);
var ensurePreventErrorBoundaryRetry = (options, errorResetBoundary, query) => {
  const throwOnError = query?.state.error && typeof options.throwOnError === "function" ? shouldThrowError(options.throwOnError, [query.state.error, query]) : options.throwOnError;
  if (options.suspense || options.experimental_prefetchInRender || throwOnError) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
var useClearResetErrorBoundary = (errorResetBoundary) => {
  reactExports.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
var getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query,
  suspense
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && (suspense && result.data === void 0 || shouldThrowError(throwOnError, [result.error, query]));
};
var ensureSuspenseTimers = (defaultedOptions) => {
  if (defaultedOptions.suspense) {
    const MIN_SUSPENSE_TIME_MS = 1e3;
    const clamp = (value) => value === "static" ? value : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS);
    const originalStaleTime = defaultedOptions.staleTime;
    defaultedOptions.staleTime = typeof originalStaleTime === "function" ? (...args) => clamp(originalStaleTime(...args)) : clamp(originalStaleTime);
    if (typeof defaultedOptions.gcTime === "number") {
      defaultedOptions.gcTime = Math.max(
        defaultedOptions.gcTime,
        MIN_SUSPENSE_TIME_MS
      );
    }
  }
};
var willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
var shouldSuspend = (defaultedOptions, result) => defaultedOptions?.suspense && result.isPending;
var fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
  errorResetBoundary.clearReset();
});
function useBaseQuery(options, Observer, queryClient) {
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const client = useQueryClient();
  const defaultedOptions = client.defaultQueryOptions(options);
  client.getDefaultOptions().queries?._experimental_beforeQuery?.(
    defaultedOptions
  );
  const query = client.getQueryCache().get(defaultedOptions.queryHash);
  defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
  ensureSuspenseTimers(defaultedOptions);
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query);
  useClearResetErrorBoundary(errorResetBoundary);
  const isNewCacheEntry = !client.getQueryCache().get(defaultedOptions.queryHash);
  const [observer] = reactExports.useState(
    () => new Observer(
      client,
      defaultedOptions
    )
  );
  const result = observer.getOptimisticResult(defaultedOptions);
  const shouldSubscribe = !isRestoring && options.subscribed !== false;
  reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => {
        const unsubscribe = shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop;
        observer.updateResult();
        return unsubscribe;
      },
      [observer, shouldSubscribe]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  reactExports.useEffect(() => {
    observer.setOptions(defaultedOptions);
  }, [defaultedOptions, observer]);
  if (shouldSuspend(defaultedOptions, result)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  }
  if (getHasError({
    result,
    errorResetBoundary,
    throwOnError: defaultedOptions.throwOnError,
    query,
    suspense: defaultedOptions.suspense
  })) {
    throw result.error;
  }
  client.getDefaultOptions().queries?._experimental_afterQuery?.(
    defaultedOptions,
    result
  );
  if (defaultedOptions.experimental_prefetchInRender && !environmentManager.isServer() && willFetch(result, isRestoring)) {
    const promise = isNewCacheEntry ? (
      // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
      fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
    ) : (
      // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
      query?.promise
    );
    promise?.catch(noop).finally(() => {
      observer.updateResult();
    });
  }
  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
function useQuery(options, queryClient) {
  return useBaseQuery(options, QueryObserver);
}
const getNotifications = (limit = 50) => API.get("/notifications", {
  params: { limit },
  cache: true,
  cacheTtlMs: 2e4
});
const PRIMARY_ITEMS = [
  { to: "/", label: "الرئيسية", match: (path) => path === "/" },
  { to: "/search", label: "البحث", match: (path) => path.startsWith("/search"), icon: "🔍" },
  { to: "/live", label: "البث", match: (path) => path.startsWith("/live") },
  { to: "/groups", label: "المجموعات", match: (path) => path.startsWith("/groups") },
  { to: "/reels", label: "الريلز", match: (path) => path.startsWith("/reels") },
  { to: "/stories", label: "الستوري", match: (path) => path.startsWith("/stories") },
  { to: "/inbox", label: "الدردشة", match: (path) => path.startsWith("/inbox") || path.startsWith("/chat"), badgeType: "inbox" },
  { to: "/notifications", label: "الإشعارات", match: (path) => path.startsWith("/notifications"), badgeType: "notifications" },
  { to: "/users", label: "الأشخاص", match: (path) => path.startsWith("/users"), icon: "👥" },
  { to: "/dashboard", label: "التحليلات", match: (path) => path.startsWith("/dashboard"), icon: "📊" },
  { to: "/settings", label: "الإعدادات", match: (path) => path.startsWith("/settings") }
];
const ACCOUNT_MENU_ITEMS = [
  { to: "/profile", label: "الملف الشخصي", icon: "👤" },
  { to: "/", label: "الرئيسية", icon: "🏠" },
  { to: "/search", label: "البحث", icon: "🔍" },
  { to: "/users", label: "اكتشاف أشخاص", icon: "👥" },
  { to: "/inbox", label: "الدردشة", icon: "💬" },
  { to: "/groups", label: "المجموعات", icon: "👫" },
  { to: "/reels", label: "الريلز", icon: "🎬" },
  { to: "/stories", label: "القصص", icon: "📖" },
  { to: "/live", label: "البث المباشر", icon: "📡" },
  { to: "/dashboard", label: "التحليلات", icon: "📊" },
  { to: "/livestream-dashboard", label: "لوحة البث", icon: "🎥" },
  { to: "/notifications", label: "الإشعارات", icon: "🔔" },
  { to: "/settings", label: "الإعدادات", icon: "⚙️" }
];
function Topbar() {
  const location = useLocation();
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const [loggingOut, setLoggingOut] = reactExports.useState(false);
  const closeTimerRef = reactExports.useRef(null);
  const { data: notifications = [] } = useQuery({
    queryKey: ["topbar-notifications-count"],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const { data: liveRooms = [] } = useQuery({
    queryKey: ["topbar-live-rooms"],
    queryFn: async () => {
      try {
        const response = await fetch(`${BACKEND_ORIGIN}/api/live/rooms`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        return response.ok ? response.json() : [];
      } catch {
        return [];
      }
    },
    staleTime: 3e4,
    refetchInterval: 3e4
  });
  const unreadNotificationCount = reactExports.useMemo(
    () => Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0,
    [notifications]
  );
  reactExports.useMemo(
    () => Array.isArray(liveRooms) ? liveRooms.filter((room) => room.is_active).length : 0,
    [liveRooms]
  );
  const username = currentUsername || session?.username || "Y";
  const profileInitial = String(username).trim().charAt(0).toUpperCase() || "Y";
  reactExports.useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);
  const openMenu = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setMenuOpen(true);
  };
  const closeMenuSoon = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setMenuOpen(false), 120);
  };
  const closeMenuNow = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setMenuOpen(false);
  };
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = getAuthToken();
      const csrfToken = getCsrfToken();
      await fetch(`${BACKEND_ORIGIN}/api/auth/logout`, {
        method: "POST",
        headers: {
          ...token ? { Authorization: `Bearer ${token}` } : {},
          ...csrfToken ? { "X-CSRF-Token": csrfToken } : {}
        },
        credentials: "include"
      });
    } catch {
    } finally {
      clearStoredUser();
      closeMenuNow();
      setLoggingOut(false);
      redirectToAppPath("/login");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-topbar-shell", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-topbar-track", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "yam-brand-pill", "aria-label": "YAMSHAT", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-brand-mark", children: "👑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-brand-name", children: "YAMSHAT" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-topbar-nav", "aria-label": "التنقل الرئيسي", children: PRIMARY_ITEMS.map((item) => {
        const isActive = item.match(location.pathname);
        let badge = 0;
        if (item.badgeType === "notifications") badge = unreadNotificationCount;
        else if (item.badgeType === "inbox") badge = unreadInboxCount;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: `yam-topbar-pill ${isActive ? "active" : ""}`, title: item.label, children: [
          item.icon ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.icon }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
          badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "yam-topbar-badge", children: badge }) : null
        ] }, item.to);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `yam-topbar-pill yam-theme-pill ${theme === "dark" ? "active" : ""}`, onClick: toggleTheme, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: theme === "dark" ? "الوضع الليلي" : "الوضع النهاري" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-account-menu-wrap", onMouseEnter: openMenu, onMouseLeave: closeMenuSoon, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: `yam-account-pill ${menuOpen ? "open" : ""}`,
            title: username,
            "aria-haspopup": "menu",
            "aria-expanded": menuOpen,
            onClick: () => setMenuOpen((prev) => !prev),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-account-chevron", "aria-hidden": "true", children: "☰" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-account-avatar", children: profileInitial }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-account-chevron", children: "▾" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-account-dropdown ${menuOpen ? "open" : ""}`, role: "menu", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-account-dropdown-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-account-dropdown-avatar", children: profileInitial }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: username }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "القائمة السريعة" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-account-dropdown-list", children: [
            ACCOUNT_MENU_ITEMS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "yam-account-link", role: "menuitem", onClick: closeMenuNow, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
            ] }, item.to)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-account-link logout", role: "menuitem", onClick: handleLogout, disabled: loggingOut, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🚪" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 8px 12px 6px;
          background: rgba(4, 8, 18, 0.86);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }

        .yam-topbar-track {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.28) transparent;
          white-space: nowrap;
        }

        .yam-topbar-track::-webkit-scrollbar { height: 4px; }
        .yam-topbar-track::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.28);
          border-radius: 999px;
        }

        .yam-topbar-nav {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .yam-brand-pill,
        .yam-topbar-pill,
        .yam-account-pill {
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,23,42,0.74);
          color: #dbe4ff;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .yam-brand-pill {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(59,130,246,0.12));
          color: #fff;
        }

        .yam-brand-mark,
        .yam-account-avatar,
        .yam-account-dropdown-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: inline-grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: white;
          font-size: 13px;
          font-weight: 900;
        }

        .yam-topbar-pill {
          position: relative;
          transition: 0.18s ease;
        }

        .yam-topbar-pill:hover,
        .yam-topbar-pill.active,
        .yam-account-pill:hover,
        .yam-account-pill.open {
          color: #fff;
          background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(99,102,241,0.14));
          border-color: rgba(167,139,250,0.24);
        }

        .yam-theme-pill,
        .yam-account-pill {
          cursor: pointer;
        }

        .yam-topbar-badge {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          line-height: 1;
        }

        .yam-account-menu-wrap {
          position: relative;
          margin-inline-start: auto;
          flex-shrink: 0;
        }

        .yam-account-pill {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.82);
          padding: 0 12px;
        }

        .yam-account-chevron {
          font-size: 12px;
          opacity: 0.88;
        }

        .yam-account-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          inset-inline-end: 0;
          width: min(280px, 90vw);
          background: rgba(10,16,31,0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 28px 60px rgba(2,6,23,0.46);
          padding: 12px;
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          pointer-events: none;
          transition: opacity 160ms ease, transform 180ms ease;
          backdrop-filter: blur(20px);
        }

        .yam-account-dropdown.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .yam-account-dropdown-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
        }

        .yam-account-dropdown-head strong {
          display: block;
          color: #fff;
          font-size: 15px;
        }

        .yam-account-dropdown-head p {
          margin: 2px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .yam-account-dropdown-list {
          display: grid;
          gap: 4px;
        }

        .yam-account-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: transparent;
          color: #e2e8f0;
          padding: 11px 12px;
          border-radius: 14px;
          text-decoration: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          text-align: start;
        }

        .yam-account-link:hover {
          background: rgba(124,58,237,0.14);
          color: #fff;
        }

        .yam-account-link.logout {
          color: #fca5a5;
        }

        .yam-account-link.logout:hover {
          background: rgba(239,68,68,0.12);
        }

        @media (max-width: 768px) {
          .yam-topbar-shell {
            padding: 8px 10px 6px;
          }

          .yam-brand-pill,
          .yam-topbar-pill,
          .yam-account-pill {
            min-height: 38px;
            border-radius: 12px;
            padding: 0 12px;
            font-size: 13px;
          }

          .yam-account-dropdown {
            width: min(240px, 88vw);
          }
        }
      ` })
  ] });
}
const UI_TEXT = {
  ar: {
    brandSubtitle: "واجهة اجتماعية منظمة مع شريط علوي وسفلي متناسق وربط حي بالخدمات.",
    routeMeta: {
      "/": { title: "الرئيسية", note: "المنشورات فقط مع مساحة أوسع للمحتوى وتنقل أوضح." },
      "/dashboard": { title: "القائمة والإعدادات", note: "اللغة، السمات، الاختبارات، وروابط الخدمات." },
      "/users": { title: "المستخدمون", note: "اكتشف المستخدمين وابدأ دردشة أو متابعة مباشرة." },
      "/profile": { title: "الملف الشخصي", note: "إعدادات الحساب، اللغة، والمنشورات الشخصية." },
      "/inbox": { title: "المحادثات", note: "صندوق وارد منظم للمحادثات الخاصة." },
      "/stories": { title: "القصص", note: "ستوري منفصل سريع وخفيف." },
      "/reels": { title: "الريلز", note: "فيديوهات قصيرة في صفحة مستقلة." },
      "/groups": { title: "المجموعات", note: "المجتمعات والنقاشات في شاشة مستقلة." },
      "/live": { title: "البث المباشر", note: "البث والتفاعل المباشر وغرف المشاهدة." },
      "/notifications": { title: "الإشعارات", note: "تنبيهات مرتبة حسب النوع والزمن." }
    },
    topbarFallback: { title: "YAMSHAT", note: "منصة اجتماعية عربية بواجهة أكثر احترافية." },
    nav: {
      home: "الرئيسية",
      reels: "الريلز",
      live: "مباشر",
      inbox: "الدردشة",
      notifications: "الإشعارات",
      users: "المستخدمون",
      groups: "المجموعات",
      stories: "القصص",
      profile: "الملف الشخصي",
      dashboard: "القائمة",
      publish: "نشر"
    },
    navMeta: {
      home: "المنشورات",
      reels: "فيديوهات قصيرة",
      live: "غرف مباشرة",
      inbox: "الرسائل",
      notifications: "تنبيهات",
      users: "متابعة وتواصل",
      groups: "مجتمعات",
      stories: "لحظات سريعة",
      profile: "حسابك",
      dashboard: "إعدادات"
    },
    dashboard: {
      title: "إعدادات + اختبارات + روابط سريعة",
      description: "مركز موحد للإعدادات السريعة وتخصيص اللغة والتنقل الاحترافي.",
      languageLabel: "لغة الواجهة",
      languageHint: "تمت إضافة الإنجليزية إلى إعدادات الويب وحفظها في قاعدة البيانات.",
      translationLabel: "ترجمة الرسائل",
      translationHint: "تفعيل ترجمة سريعة داخل الدردشة للرسائل النصية.",
      save: "حفظ الإعدادات",
      saving: "جارٍ الحفظ...",
      languageSaved: "تم حفظ اللغة والإعدادات بنجاح."
    },
    chat: {
      audioCall: "مكالمة صوتية",
      videoCall: "مكالمة مرئية",
      block: "حظر",
      unblock: "إلغاء الحظر",
      translate: "ترجمة",
      translatedToEnglish: "مترجمة إلى الإنجليزية",
      translatedToArabic: "مترجمة إلى العربية",
      incomingAudio: "مكالمة صوتية واردة",
      incomingVideo: "مكالمة مرئية واردة",
      accept: "رد",
      decline: "رفض",
      hangup: "إنهاء المكالمة",
      preparingCall: "جارٍ تجهيز المكالمة...",
      blockedByMe: "تم حظر هذا المستخدم. يمكنك إلغاء الحظر لاستكمال الدردشة والمكالمات.",
      blockedMe: "هذا المستخدم قام بحظرك. تم تعطيل الإرسال والمكالمات.",
      translatorOff: "فعّل ترجمة الرسائل من صفحة الإعدادات أولاً.",
      callFallback: "تم إنشاء جلسة المكالمة لكن خدمة الصوت/الفيديو غير مفعلة حالياً على الخادم."
    }
  },
  en: {
    brandSubtitle: "Organized social interface with polished top and bottom navigation.",
    routeMeta: {
      "/": { title: "Home", note: "Posts only with wider content space and cleaner navigation." },
      "/dashboard": { title: "Menu & Settings", note: "Language, theme, readiness checks, and service links." },
      "/users": { title: "Users", note: "Discover people and start chats or follows quickly." },
      "/profile": { title: "Profile", note: "Account settings, language, and personal posts." },
      "/inbox": { title: "Inbox", note: "A cleaner private messaging hub." },
      "/stories": { title: "Stories", note: "A standalone fast stories page." },
      "/reels": { title: "Reels", note: "Short-form videos in a dedicated page." },
      "/groups": { title: "Groups", note: "Communities and discussions in their own screen." },
      "/live": { title: "Live", note: "Live rooms, audience activity, and streaming tools." },
      "/notifications": { title: "Notifications", note: "Alerts organized by type and time." }
    },
    topbarFallback: { title: "YAMSHAT", note: "A more professional social experience." },
    nav: {
      home: "Home",
      reels: "Reels",
      live: "Live",
      inbox: "Chat",
      notifications: "Alerts",
      users: "Users",
      groups: "Groups",
      stories: "Stories",
      profile: "Profile",
      dashboard: "Menu",
      publish: "Post"
    },
    navMeta: {
      home: "Posts",
      reels: "Short videos",
      live: "Live rooms",
      inbox: "Messages",
      notifications: "Updates",
      users: "People",
      groups: "Communities",
      stories: "Moments",
      profile: "Your account",
      dashboard: "Settings"
    },
    dashboard: {
      title: "Settings + checks + quick links",
      description: "A unified settings center with language control and cleaner navigation.",
      languageLabel: "Interface language",
      languageHint: "English is now available in web settings and saved to the database.",
      translationLabel: "Message translation",
      translationHint: "Enable quick in-chat translation for text messages.",
      save: "Save settings",
      saving: "Saving...",
      languageSaved: "Language and preferences saved successfully."
    },
    chat: {
      audioCall: "Audio call",
      videoCall: "Video call",
      block: "Block",
      unblock: "Unblock",
      translate: "Translate",
      translatedToEnglish: "Translated to English",
      translatedToArabic: "Translated to Arabic",
      incomingAudio: "Incoming audio call",
      incomingVideo: "Incoming video call",
      accept: "Answer",
      decline: "Decline",
      hangup: "End call",
      preparingCall: "Preparing call...",
      blockedByMe: "You blocked this user. Unblock to continue chat and calls.",
      blockedMe: "This user blocked you. Messaging and calls are disabled.",
      translatorOff: "Enable message translation first from settings.",
      callFallback: "The call session was created but realtime media is not enabled on the server."
    }
  }
};
function getUiText(language = "ar") {
  return UI_TEXT[language] || UI_TEXT.ar;
}
const SCROLL_CACHE_KEY = "yamshat-scroll-cache-v1";
const prefetchedRoutes = /* @__PURE__ */ new Set();
const routePrefetchers = {
  "/": () => __vitePreload(() => import("./Feed-Dmk2v4Po.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8]) : void 0),
  "/dashboard": () => __vitePreload(() => import("./Dashboard-DTqWQDR8.js"), true ? __vite__mapDeps([9,1,3,4]) : void 0),
  "/stories": () => __vitePreload(() => import("./Stories-Zjs-i32I.js"), true ? __vite__mapDeps([10,1,3,4,11,12]) : void 0),
  "/reels": () => __vitePreload(() => import("./Reels-IJ25LLrB.js"), true ? __vite__mapDeps([13,1,11,14,5,15,16]) : void 0),
  "/groups": () => __vitePreload(() => import("./Groups-B0zWdCBA.js"), true ? __vite__mapDeps([17,1,3,4,11,18,19]) : void 0),
  "/live": () => __vitePreload(() => import("./Live-CZJY28ex.js"), true ? __vite__mapDeps([20,1,7,8]) : void 0),
  "/inbox": () => __vitePreload(() => import("./Inbox-CqHN00ds.js"), true ? __vite__mapDeps([21,1]) : void 0),
  "/users": () => __vitePreload(() => import("./Users-D9DSbSbV.js"), true ? __vite__mapDeps([22,1,3,4,11,23,18,24,6,25,16]) : void 0),
  "/profile": () => __vitePreload(() => import("./Profile-S6xDfnht.js"), true ? __vite__mapDeps([26,1,3,4,11,6]) : void 0),
  "/notifications": () => __vitePreload(() => import("./index-DTYjTy3_.js").then((n) => n.N), true ? __vite__mapDeps([27,1,3,4,11,14]) : void 0),
  "/search": () => __vitePreload(() => import("./Search-BoqShEOu.js"), true ? __vite__mapDeps([28,1,3,4,23,18,24,5,6,16,14]) : void 0),
  "/settings": () => __vitePreload(() => import("./Settings-CJD-CfKa.js"), true ? __vite__mapDeps([29,1,3,4]) : void 0),
  "/chat": () => __vitePreload(() => import("./Chat-Ba-XAl7-.js"), true ? __vite__mapDeps([30,1,3,4,8]) : void 0)
};
function normalizePath(pathname = "/") {
  if (!pathname) return "/";
  if (pathname.startsWith("/profile/")) return "/profile";
  if (pathname.startsWith("/chat/")) return "/chat";
  return pathname;
}
function readScrollCache() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SCROLL_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeScrollCache(cache) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}
function saveScrollPosition(pathname, position = 0) {
  if (typeof window === "undefined") return;
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  cache[key] = Math.max(0, Number(position || 0));
  writeScrollCache(cache);
}
function getScrollPosition(pathname) {
  const key = normalizePath(pathname);
  const cache = readScrollCache();
  return Math.max(0, Number(cache[key] || 0));
}
async function prefetchRoute(pathname) {
  const key = normalizePath(pathname);
  if (prefetchedRoutes.has(key)) return;
  const prefetcher = routePrefetchers[key];
  if (!prefetcher) return;
  prefetchedRoutes.add(key);
  try {
    await prefetcher();
  } catch {
    prefetchedRoutes.delete(key);
  }
}
function prefetchCriticalRoutes(currentPathname = "/") {
  const current = normalizePath(currentPathname);
  const neighbors = {
    "/": ["/reels", "/stories", "/inbox"],
    "/reels": ["/", "/stories", "/live"],
    "/stories": ["/", "/reels", "/profile"],
    "/inbox": ["/chat", "/notifications", "/"],
    "/chat": ["/inbox", "/profile"],
    "/profile": ["/", "/stories"]
  };
  (neighbors[current] || ["/reels", "/stories"]).forEach((route) => {
    const idle = typeof window !== "undefined" && "requestIdleCallback" in window ? window.requestIdleCallback(() => prefetchRoute(route), { timeout: 1200 }) : window.setTimeout(() => prefetchRoute(route), 180);
    return idle;
  });
}
function getPrefetchHandlers(pathname) {
  return {
    onMouseEnter: () => prefetchRoute(pathname),
    onFocus: () => prefetchRoute(pathname),
    onTouchStart: () => prefetchRoute(pathname)
  };
}
function MobileDock() {
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const dockLinks = [
    { to: "/", label: ui.nav.home || "الرئيسية", icon: "⌂", badge: 0 },
    { to: "/search", label: "بحث", icon: "🔍", badge: 0 },
    { to: "/stories", label: "قصص", icon: "📖", badge: 0 },
    { to: "/reels", label: ui.nav.reels || "ريلز", icon: "▣", badge: 0 },
    { to: "/groups", label: "مجموعات", icon: "👥", badge: 0 },
    { to: "/live", label: ui.nav.live || "بث", icon: "◉", badge: isOnline ? "live" : 0 },
    { to: "/inbox", label: ui.nav.inbox || "دردشة", icon: "✉", badge: unreadInboxCount },
    { to: "/notifications", label: "إشعارات", icon: "🔔", badge: 0 },
    { to: "/users", label: "أشخاص", icon: "👤", badge: 0 },
    { to: "/profile", label: "ملفي", icon: "⚙", badge: 0 }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "mobile-dock mobile-dock-professional", "aria-label": language === "en" ? "Quick navigation" : "التنقل السريع", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mobile-dock-inner mobile-dock-scrollable", children: dockLinks.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      NavLink,
      {
        to: link.to,
        className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
        ...getPrefetchHandlers(link.to),
        title: link.label,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-dock-icon", children: link.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-dock-label", children: link.label }),
          link.badge === "live" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-live-dot", "aria-hidden": "true" }) : null,
          typeof link.badge === "number" && link.badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "topbar-badge", children: link.badge }) : null
        ]
      },
      link.to
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .mobile-dock {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 40;
          background: rgba(4, 8, 18, 0.94);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          padding: 8px 0;
        }

        .mobile-dock-inner {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .mobile-dock-inner::-webkit-scrollbar {
          display: none;
        }

        .mobile-dock-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 60px;
          height: 60px;
          padding: 6px 8px;
          border-radius: 12px;
          background: transparent;
          color: #94a3b8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          position: relative;
          flex-shrink: 0;
        }

        .mobile-dock-link:hover {
          background: rgba(124, 58, 237, 0.12);
          color: #dbe4ff;
        }

        .mobile-dock-link.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(99, 102, 241, 0.14));
          color: #fff;
          border: 1px solid rgba(167, 139, 250, 0.24);
        }

        .mobile-dock-icon {
          font-size: 20px;
          display: block;
          line-height: 1;
        }

        .mobile-dock-label {
          display: block;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.18);
          animation: mobile-live-pulse 1.6s infinite;
          position: absolute;
          top: 2px;
          right: 2px;
        }

        .topbar-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          line-height: 1;
          position: absolute;
          top: 0;
          right: 0;
        }

        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
        }

        @media (min-width: 1024px) {
          .mobile-dock {
            display: none;
          }
        }
      ` })
  ] });
}
function isNativeShell() {
  try {
    return localStorage.getItem("yamshatNativeShell") === "1";
  } catch {
    return false;
  }
}
function MainLayout({ children, hideNav = false }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = reactExports.useRef(null);
  const frameRef = reactExports.useRef(0);
  const [isTransitioning, setIsTransitioning] = reactExports.useState(false);
  const isConversationRoute = /^\/chat\/[^/]+/.test(location.pathname);
  const showTopbar = !hideNav && !nativeShell && !isConversationRoute;
  const showDock = !hideNav && !nativeShell && !isConversationRoute;
  reactExports.useEffect(() => {
    const container = mainRef.current;
    if (!container || isConversationRoute) return void 0;
    const restore = () => {
      const cachedPosition = getScrollPosition(location.pathname);
      container.scrollTo({ top: cachedPosition, behavior: "auto" });
      setIsTransitioning(true);
      window.clearTimeout(container.__yamshatTransitionTimer__);
      container.__yamshatTransitionTimer__ = window.setTimeout(() => setIsTransitioning(false), 260);
    };
    const rafId = window.requestAnimationFrame(restore);
    prefetchCriticalRoutes(location.pathname);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(container.__yamshatTransitionTimer__);
    };
  }, [isConversationRoute, location.pathname]);
  reactExports.useEffect(() => {
    const container = mainRef.current;
    if (!container || isConversationRoute) return void 0;
    const handleScroll = () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = window.requestAnimationFrame(() => {
        saveScrollPosition(location.pathname, container.scrollTop);
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [isConversationRoute, location.pathname]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `app-shell yamshat-shell ${nativeShell ? "native-shell" : ""} ${isConversationRoute ? "conversation-shell" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `main-shell ${nativeShell ? "native-shell" : ""}`, children: [
      showTopbar ? /* @__PURE__ */ jsxRuntimeExports.jsx(Topbar, {}) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "main",
        {
          className: `page-content ${nativeShell ? "native-shell" : ""} ${isTransitioning ? "is-transitioning" : ""} ${isConversationRoute ? "conversation-mode" : ""}`,
          ref: mainRef,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `page-shell-glow ${isConversationRoute ? "conversation-mode" : ""}`, children }, location.pathname)
        }
      )
    ] }),
    showDock ? /* @__PURE__ */ jsxRuntimeExports.jsx(MobileDock, {}) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: {
      __html: `
          .app-shell {
            display: flex;
            min-height: 100vh;
            height: 100vh;
            background:
              radial-gradient(circle at top, rgba(59,130,246,0.08), transparent 34%),
              linear-gradient(180deg, #07111f 0%, #0f172a 34%, #08101d 100%);
            overflow: hidden;
          }

          .app-shell.native-shell,
          .app-shell.conversation-shell {
            flex-direction: column;
          }

          .main-shell {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-width: 0;
          }

          .main-shell.native-shell {
            width: 100%;
          }

          .page-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease;
            will-change: transform, opacity;
          }

          .page-content.conversation-mode {
            overflow: hidden;
            padding-bottom: 0;
          }

          .page-content.is-transitioning {
            opacity: 0.96;
            transform: translate3d(0, 8px, 0);
            filter: saturate(0.95);
          }

          .page-content.native-shell {
            padding-bottom: 68px;
          }

          .page-shell-glow {
            min-height: 100%;
            animation: pageFadeIn 260ms cubic-bezier(0.22, 1, 0.36, 1);
            content-visibility: auto;
            contain-intrinsic-size: 900px;
          }

          .page-shell-glow.conversation-mode {
            min-height: 100vh;
          }

          .page-content::-webkit-scrollbar {
            width: 8px;
          }

          .page-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .page-content::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 999px;
          }

          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.55);
          }

          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translate3d(0, 12px, 0) scale(0.995);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }

            .page-content:not(.conversation-mode) {
              padding-bottom: 78px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .page-content,
            .page-shell-glow {
              animation: none;
              transition: none;
              scroll-behavior: auto;
            }
          }
        `
    } })
  ] });
}
export {
  MainLayout as M,
  QueryObserver as Q,
  useBaseQuery as a,
  getNotifications as g,
  useQuery as u
};
