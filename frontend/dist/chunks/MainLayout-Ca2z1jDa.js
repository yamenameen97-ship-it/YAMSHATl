const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/Feed-DnhYpNfW.js","index-D6u1FUhW.js","chunks/Card-r3PaFA5D.js","chunks/proxy-npyH2_t3.js","chunks/posts-Q6IL2Y7w.js","chunks/Dashboard-DjWiGdkB.js","chunks/Stories-KZm9_56B.js","chunks/Modal-TdtOGZ1q.js","chunks/stories-D_IGhHok.js","chunks/Reels-Csl1JpSV.js","chunks/react-virtualized-auto-sizer.esm-DZJRkXMU.js","chunks/deviceProfile-DTy4urT5.js","chunks/recommendationService-CVn5JDS5.js","chunks/Groups-CYNEIWz0.js","chunks/EmptyState-ClJjbgqU.js","chunks/groups-D2AEuPFy.js","chunks/Live-PLzwwDMU.js","chunks/Inbox-BSOgUfEG.js","chunks/Users-D4qV0VSP.js","chunks/Input-seVNQLEe.js","chunks/ErrorState-BLxz9IXV.js","chunks/useDebouncedValue-BcUj6oW-.js","chunks/Profile-Bxc0Uj1D.js","chunks/index-DXGZkA71.js","chunks/Search-D1Ykb3cy.js","chunks/Settings-BDsVhfkJ.js","chunks/Chat-Dx1VheZd.js"])))=>i.map(i=>d[i]);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _currentQuery, _currentQueryInitialState, _currentResult, _currentResultState, _currentResultOptions, _currentThenable, _selectError, _selectFn, _selectResult, _lastQueryWithDefinedData, _staleTimeoutId, _refetchIntervalId, _currentRefetchInterval, _trackedProps, _QueryObserver_instances, executeFetch_fn, updateStaleTimeout_fn, computeRefetchInterval_fn, updateRefetchInterval_fn, updateTimers_fn, clearStaleTimeout_fn, clearRefetchInterval_fn, updateQuery_fn, notify_fn, _a;
import { F as Subscribable, $ as pendingThenable, a0 as resolveQueryBoolean, G as shallowEqualObjects, a1 as resolveStaleTime, N as noop, a2 as environmentManager, a3 as isValidTimeout, a4 as timeUntilStale, a5 as timeoutManager, a6 as focusManager, a7 as fetchState, a8 as replaceData, J as notifyManager, r as reactExports, O as shouldThrowError, K as useQueryClient, A as API, U as useChatStore, a9 as selectUnreadTotal, d as useAppStore, j as jsxRuntimeExports, aa as NavLink, a as useLocation, u as useNavigate, f as getCurrentUsername, ab as getStoredUserSnapshot, L as Link, ac as __vitePreload } from "../index-D6u1FUhW.js";
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
const getUsers = () => API.get("/users");
const getProfileBundle = (username) => API.get(`/users/profile/${encodeURIComponent(username)}`, { cache: false, forceRefresh: true });
const followUser = (username) => API.post("/users/follow", { following: username });
const updateMyProfile = (payload) => API.patch("/users/me", payload);
const getLiveRooms = () => API.get("/live_rooms", { cache: false, forceRefresh: true });
const getLiveRoom = (roomId) => API.get(`/live_room/${roomId}`, { cache: false, forceRefresh: true });
const createLiveRoom = (data) => API.post("/create_live", data);
const getLiveComments = (roomId) => API.get(`/live_comments/${roomId}`, { cache: false, forceRefresh: true });
const endLiveRoom = (roomId) => API.post(`/end_live/${roomId}`);
const sendLiveGift = ({ room_id, ...payload }) => API.post(`/live/${room_id}/gift`, payload);
const updateLiveRecording = ({ room_id, action }) => API.post(`/live/${room_id}/recording/${action}`);
function initialsFromName(value = "") {
  const clean = String(value || "").trim();
  if (!clean) return "Y";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
function avatarGradient(seed = "") {
  const palette = [
    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #22c55e, #14b8a6)",
    "linear-gradient(135deg, #f97316, #ef4444)",
    "linear-gradient(135deg, #f59e0b, #eab308)"
  ];
  const text = String(seed || "yamshat");
  let total = 0;
  for (const char of text) total += char.charCodeAt(0);
  return palette[total % palette.length];
}
function formatCompactNumber(value = 0) {
  const number = Number(value || 0);
  if (number >= 1e6) return `${(number / 1e6).toFixed(number >= 1e7 ? 0 : 1)}M`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(number >= 1e4 ? 0 : 1)}K`;
  return `${number}`;
}
function formatTimeAgo(value) {
  if (!value) return "الآن";
  try {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 6e4));
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  } catch {
    return "الآن";
  }
}
function formatLastSeen(value, isOnline = false) {
  if (isOnline) return "متصل الآن";
  if (!value) return "آخر ظهور غير متاح";
  try {
    const date = new Date(value);
    return `آخر ظهور ${date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "آخر ظهور غير متاح";
  }
}
function statusTicks(status = "sent") {
  if (status === "seen") return "✓✓";
  if (status === "delivered") return "✓✓";
  if (status === "sending") return "◌";
  return "✓";
}
function statusColor(status = "sent") {
  if (status === "seen") return "#60a5fa";
  if (status === "delivered") return "rgba(255,255,255,0.82)";
  if (status === "sending") return "rgba(255,255,255,0.5)";
  return "rgba(255,255,255,0.68)";
}
const NAV_ITEMS = [
  { to: "/", label: "الصفحة الرئيسية", icon: "⌂" },
  { to: "/search", label: "اكتشف", icon: "⌕" },
  { to: "/users", label: "المتابعون", icon: "◌" },
  { to: "/notifications", label: "الإشعارات", icon: "◔", badgeType: "notifications" },
  { to: "/inbox", label: "الرسائل", icon: "✉", badgeType: "messages" },
  { to: "/profile", label: "العلامات المحفوظة", icon: "▣" }
];
function Avatar$1({ name, src, size = 42 }) {
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src,
      alt: name,
      style: { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 800,
        background: avatarGradient(name),
        flexShrink: 0
      },
      children: initialsFromName(name).slice(0, 1)
    }
  );
}
function Sidebar() {
  const notificationCount = 0;
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const language = useAppStore((state) => state.language);
  const { data: usersData = [] } = useQuery({
    queryKey: ["sidebar-users"],
    queryFn: async () => (await getUsers()).data || [],
    staleTime: 6e4
  });
  const { data: liveData = [] } = useQuery({
    queryKey: ["sidebar-live-rooms"],
    queryFn: async () => (await getLiveRooms()).data || [],
    staleTime: 2e4,
    refetchInterval: 25e3
  });
  const liveUsers = Array.isArray(liveData) ? liveData.slice(0, 5) : [];
  const suggestedUsers = Array.isArray(usersData) ? usersData.slice(0, 3) : [];
  const suggestedGroups = [
    { name: "Gamers Hub", members: "12.5K عضو" },
    { name: "Tech Talk", members: "5.2K عضو" },
    { name: "Music Vibes", members: "8.2K عضو" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yamshat-side-rail", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yamshat-side-section yam-brand-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-brand-mark", children: "🜲" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-brand-title", children: "YAMSHAT PRO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "yam-brand-copy", children: language === "en" ? "Upgrade for an ad-free gaming social experience." : "ترقية لحسابك لتجربة يامشات الخاصة بك بمميزات حصرية وإشعارات خاصة والمزيد." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-primary-btn", children: "ترقية الآن" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yamshat-side-section yam-side-nav", children: NAV_ITEMS.map((item) => {
      const badge = item.badgeType === "messages" ? unreadInboxCount : item.badgeType === "notifications" ? notificationCount : 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: ({ isActive }) => `yam-side-link ${isActive ? "active" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-side-icon", children: item.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label }),
        badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-side-badge", children: badge }) : null
      ] }, item.to);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "القنوات التي تتابعها" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-stack-list", children: liveUsers.length ? liveUsers.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar$1, { name: room.host || room.username || "Live", src: room.avatar }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: room.host || room.username || "PlayerOne" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: room.title || "Gaming" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-metric", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
          formatCompactNumber(room.viewer_count || 0)
        ] })
      ] }, room.id)) : ["PlayerOne", "Ahmed_King", "ShadowGirl"].map((name, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar$1, { name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: ["Just Chatting", "VALORANT", "Fortnite"][index] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-live-metric", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "dot" }),
          ["1.2K", "980", "756"][index]
        ] })
      ] }, name)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اقتراحات للمتابعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-stack-list", children: suggestedUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-row compact", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar$1, { name: user.username || "User", src: user.avatar, size: 40 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: user.username }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: user.profile?.activity_tagline || user.email || "Gaming Creator" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-follow-btn", children: "متابعة" })
      ] }, user.username || user.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yamshat-side-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-section-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "المجموعات الموصى بها" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "عرض الكل" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-stack-list", children: suggestedGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-row compact", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-group-badge", children: "🎮" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-entity-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: group.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: group.members })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-join-btn", children: "انضمام" })
      ] }, group.name)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yamshat-side-rail {
          width: 330px;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          padding: 22px 18px 32px;
          background: rgba(5, 10, 22, 0.94);
          border-inline-end: 1px solid rgba(148, 163, 184, 0.08);
          display: grid;
          gap: 16px;
          backdrop-filter: blur(16px);
        }
        .yamshat-side-rail::-webkit-scrollbar { width: 6px; }
        .yamshat-side-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        .yamshat-side-section {
          border-radius: 24px;
          background: rgba(12, 18, 34, 0.88);
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 40px rgba(2,6,23,0.24);
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .yam-brand-card {
          background: radial-gradient(circle at top, rgba(139,92,246,0.28), transparent 65%), linear-gradient(180deg, rgba(20, 13, 48, 0.98), rgba(12,18,34,0.96));
          grid-template-columns: 72px 1fr;
          align-items: start;
        }
        .yam-brand-mark {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 28px;
          background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.18));
          color: #d8b4fe;
          border: 1px solid rgba(167,139,250,0.24);
        }
        .yam-brand-title { font-size: 20px; font-weight: 900; letter-spacing: 0.04em; }
        .yam-brand-copy { margin: 6px 0 14px; color: #94a3b8; font-size: 13px; line-height: 1.8; }
        .yam-primary-btn, .yam-follow-btn, .yam-join-btn {
          border: none;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          box-shadow: 0 16px 30px rgba(124,58,237,0.24);
        }
        .yam-follow-btn, .yam-join-btn {
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: none;
        }
        .yam-side-nav { padding: 10px; gap: 8px; }
        .yam-side-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          color: #dbe4ff;
          background: transparent;
          transition: 0.2s ease;
          font-weight: 700;
        }
        .yam-side-link.active,
        .yam-side-link:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.14));
          color: white;
        }
        .yam-side-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          font-size: 16px;
        }
        .yam-side-badge {
          margin-inline-start: auto;
          min-width: 24px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #7c3aed;
          color: white;
          font-size: 12px;
          font-weight: 800;
        }
        .yam-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .yam-section-head h3 {
          margin: 0;
          font-size: 17px;
        }
        .yam-section-head span {
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 700;
        }
        .yam-stack-list { display: grid; gap: 12px; }
        .yam-entity-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .yam-entity-row.compact { gap: 10px; }
        .yam-entity-copy { min-width: 0; display: grid; gap: 2px; }
        .yam-entity-copy strong {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 15px;
        }
        .yam-entity-copy small {
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yam-live-metric {
          margin-inline-start: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #fda4af;
          font-size: 13px;
          font-weight: 700;
        }
        .yam-live-metric .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,0.14);
        }
        .yam-group-badge {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(99,102,241,0.26), rgba(139,92,246,0.18));
        }
        @media (max-width: 1180px) {
          .yamshat-side-rail { width: 290px; }
        }
        @media (max-width: 1024px) {
          .yamshat-side-rail { display: none; }
        }
      ` })
  ] });
}
const getNotifications = (limit = 50) => API.get("/notifications", {
  params: { limit },
  cache: true,
  cacheTtlMs: 2e4
});
const MAIN_TABS = [
  { to: "/", label: "الرئيسية" },
  { to: "/live", label: "البث المباشر" },
  { to: "/groups", label: "المجموعات" },
  { to: "/reels", label: "المقاطع" },
  { to: "/stories", label: "القصص" }
];
function Avatar({ username, avatar }) {
  return avatar ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: avatar, alt: username, style: { width: 42, height: 42, borderRadius: "50%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient(username) }, children: initialsFromName(username).slice(0, 1) });
}
function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = reactExports.useRef(null);
  const unreadInboxCount = useChatStore(selectUnreadTotal);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const theme = useAppStore((state) => state.theme);
  const isOnline = useAppStore((state) => state.isOnline);
  const currentUsername = getCurrentUsername();
  const session = getStoredUserSnapshot();
  const [searchOpen, setSearchOpen] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const { data: notifications = [] } = useQuery({
    queryKey: ["topbar-notifications-count"],
    queryFn: async () => (await getNotifications(20)).data || [],
    staleTime: 15e3,
    refetchInterval: 2e4
  });
  const unreadNotificationCount = reactExports.useMemo(
    () => Array.isArray(notifications) ? notifications.filter((item) => !item.is_read).length : 0,
    [notifications]
  );
  const pageTitle = reactExports.useMemo(() => {
    if (location.pathname.startsWith("/live")) return "البث المباشر";
    if (location.pathname.startsWith("/inbox") || location.pathname.startsWith("/chat")) return "الدردشات";
    if (location.pathname.startsWith("/notifications")) return "الإشعارات";
    if (location.pathname.startsWith("/groups")) return "المجموعات";
    if (location.pathname.startsWith("/dashboard")) return "القائمة";
    return "YAMSHAT";
  }, [location.pathname]);
  reactExports.useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [searchOpen]);
  const handleSearchSubmit = (event) => {
    event?.preventDefault?.();
    const value = searchQuery.trim();
    if (typeof window !== "undefined") {
      if (value) window.sessionStorage.setItem("yamshat.topbarSearch", value);
      else window.sessionStorage.removeItem("yamshat.topbarSearch");
    }
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
    setSearchOpen(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-topbar-shell", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-topbar-left", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "yam-logo-lockup", "aria-label": "YAMSHAT", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-mark", children: "👑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-logo-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-title", children: "YAMSHAT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-logo-subtitle", children: pageTitle })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-main-tabs", children: MAIN_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(NavLink, { to: tab.to, className: ({ isActive }) => `yam-main-tab ${isActive ? "active" : ""}`, children: tab.label }, tab.to)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-topbar-center yam-desktop-only", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "yam-search-box", onSubmit: handleSearchSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "yam-search-trigger", "aria-label": "ابحث في يامشات", children: "⌕" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "search",
          placeholder: "ابحث في يامشات",
          "aria-label": "ابحث في يامشات",
          value: searchQuery,
          onChange: (event) => setSearchQuery(event.target.value)
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-topbar-right", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-btn yam-mobile-only", onClick: () => setSearchOpen((prev) => !prev), title: "البحث", children: "⌕" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-btn", onClick: toggleTheme, title: "تبديل النمط", children: theme === "dark" ? "☾" : "☀" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/notifications", className: "yam-icon-btn with-badge", title: "الإشعارات", children: [
        "🔔",
        unreadNotificationCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-count-badge", children: unreadNotificationCount }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", className: "yam-icon-btn", title: "القائمة", children: "☰" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/inbox", className: "yam-icon-btn with-badge", title: "الرسائل", children: [
        "💬",
        unreadInboxCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-count-badge", children: unreadInboxCount }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-presence-pill", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `presence-dot ${isOnline ? "online" : "offline"}` }),
        isOnline ? "متصل" : "غير متصل"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "yam-profile-pill", title: "الملف الشخصي", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { username: currentUsername || session?.username || "Y", avatar: session?.avatar || session?.profile?.avatar }) })
    ] }),
    searchOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "yam-mobile-search-sheet yam-mobile-only", onSubmit: handleSearchSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: searchInputRef,
          type: "search",
          placeholder: "ابحث في يامشات",
          "aria-label": "ابحث في يامشات",
          value: searchQuery,
          onChange: (event) => setSearchQuery(event.target.value)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "yam-mobile-search-btn", children: "بحث" })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-topbar-shell {
          position: sticky;
          top: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: auto minmax(280px, 1fr) auto;
          align-items: center;
          gap: 18px;
          padding: 14px 22px;
          background: rgba(4, 8, 18, 0.88);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
        }
        .yam-topbar-left,
        .yam-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .yam-topbar-left {
          min-width: 0;
        }
        .yam-logo-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }
        .yam-logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.36), rgba(99,102,241,0.2));
          color: #f5d0fe;
          font-size: 20px;
          border: 1px solid rgba(167,139,250,0.22);
        }
        .yam-logo-copy {
          display: grid;
          gap: 2px;
        }
        .yam-logo-title { font-weight: 900; letter-spacing: 0.08em; }
        .yam-logo-subtitle { color: #64748b; font-size: 12px; }
        .yam-main-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .yam-main-tab {
          padding: 10px 14px;
          border-radius: 14px;
          color: #94a3b8;
          font-weight: 700;
          transition: 0.2s ease;
        }
        .yam-main-tab.active,
        .yam-main-tab:hover {
          color: white;
          background: rgba(124,58,237,0.18);
        }
        .yam-topbar-center { display: flex; justify-content: center; }
        .yam-search-box {
          width: min(620px, 100%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 18px;
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
        }
        .yam-search-trigger {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
          display: grid;
          place-items: center;
          font-size: 18px;
        }
        .yam-search-box input {
          width: 100%;
          border: none;
          outline: none;
          color: white;
          background: transparent;
        }
        .yam-icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(15,23,42,0.72);
          color: white;
          display: grid;
          place-items: center;
          font-size: 17px;
          position: relative;
        }
        .yam-count-badge {
          position: absolute;
          top: -4px;
          inset-inline-end: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #ef4444;
          color: white;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid rgba(4,8,18,0.92);
        }
        .yam-presence-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 700;
        }
        .presence-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #64748b;
        }
        .presence-dot.online { background: #22c55e; box-shadow: 0 0 0 5px rgba(34,197,94,0.12); }
        .presence-dot.offline { background: #f97316; }
        .yam-profile-pill { display: flex; align-items: center; }
        .yam-mobile-only { display: none; }
        .yam-mobile-search-sheet {
          display: none;
        }
        @media (max-width: 1180px) {
          .yam-topbar-shell {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .yam-topbar-left,
          .yam-topbar-right { justify-content: space-between; flex-wrap: wrap; }
          .yam-topbar-center { order: 3; }
        }
        @media (max-width: 768px) {
          .yam-main-tabs,
          .yam-presence-pill,
          .yam-desktop-only {
            display: none;
          }
          .yam-mobile-only {
            display: inline-grid;
          }
          .yam-topbar-shell {
            grid-template-columns: 1fr auto;
            gap: 10px;
            padding: 12px 14px;
          }
          .yam-topbar-left {
            justify-content: flex-start;
          }
          .yam-topbar-right {
            gap: 8px;
            flex-wrap: nowrap;
            justify-content: flex-end;
          }
          .yam-logo-copy {
            display: none;
          }
          .yam-logo-mark {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 18px;
          }
          .yam-icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
          .yam-mobile-search-sheet {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 8px;
            padding-top: 4px;
          }
          .yam-mobile-search-sheet input {
            min-height: 42px;
            border-radius: 14px;
            padding: 0 14px;
            background: rgba(15,23,42,0.82);
            border: 1px solid rgba(255,255,255,0.06);
            color: white;
          }
          .yam-mobile-search-btn {
            min-width: 72px;
            border: 1px solid rgba(167,139,250,0.22);
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(124,58,237,0.36), rgba(99,102,241,0.22));
            color: white;
            font-weight: 700;
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
  "/": () => __vitePreload(() => import("./Feed-DnhYpNfW.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0),
  "/dashboard": () => __vitePreload(() => import("./Dashboard-DjWiGdkB.js"), true ? __vite__mapDeps([5,1,2,3]) : void 0),
  "/stories": () => __vitePreload(() => import("./Stories-KZm9_56B.js"), true ? __vite__mapDeps([6,1,2,3,7,8]) : void 0),
  "/reels": () => __vitePreload(() => import("./Reels-Csl1JpSV.js"), true ? __vite__mapDeps([9,1,7,10,4,11,12]) : void 0),
  "/groups": () => __vitePreload(() => import("./Groups-CYNEIWz0.js"), true ? __vite__mapDeps([13,1,2,3,7,14,15]) : void 0),
  "/live": () => __vitePreload(() => import("./Live-PLzwwDMU.js"), true ? __vite__mapDeps([16,1]) : void 0),
  "/inbox": () => __vitePreload(() => import("./Inbox-BSOgUfEG.js"), true ? __vite__mapDeps([17,1,2,3,14]) : void 0),
  "/users": () => __vitePreload(() => import("./Users-D4qV0VSP.js"), true ? __vite__mapDeps([18,1,2,3,7,19,14,20,21,12]) : void 0),
  "/profile": () => __vitePreload(() => import("./Profile-Bxc0Uj1D.js"), true ? __vite__mapDeps([22,1,2,3,7]) : void 0),
  "/notifications": () => __vitePreload(() => import("./index-DXGZkA71.js").then((n) => n.N), true ? __vite__mapDeps([23,1,2,3,7,10]) : void 0),
  "/search": () => __vitePreload(() => import("./Search-D1Ykb3cy.js"), true ? __vite__mapDeps([24,1,2,3,19,14,20,4,12,10]) : void 0),
  "/settings": () => __vitePreload(() => import("./Settings-BDsVhfkJ.js"), true ? __vite__mapDeps([25,1,2,3]) : void 0),
  "/chat": () => __vitePreload(() => import("./Chat-Dx1VheZd.js"), true ? __vite__mapDeps([26,1,2,3]) : void 0)
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
    { to: "/", label: ui.nav.home, icon: "⌂", badge: 0 },
    { to: "/reels", label: ui.nav.reels, icon: "▣", badge: 0 },
    { to: "/live", label: ui.nav.live, icon: "◉", badge: isOnline ? "live" : 0 },
    { to: "/inbox", label: ui.nav.inbox, icon: "✉", badge: unreadInboxCount }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "mobile-dock mobile-dock-professional", "aria-label": language === "en" ? "Quick navigation" : "التنقل السريع", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mobile-dock-inner mobile-dock-grid-5 mobile-dock-balanced-grid", children: [
      dockLinks.slice(0, 2).map((link) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        NavLink,
        {
          to: link.to,
          className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
          ...getPrefetchHandlers(link.to),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-dock-icon", children: link.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: link.label }),
            typeof link.badge === "number" && link.badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "topbar-badge", children: link.badge }) : null
          ]
        },
        link.to
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: { pathname: "/", search: "?compose=1", hash: "#composer" }, className: "mobile-dock-link mobile-dock-center", "aria-label": ui.nav.publish, ...getPrefetchHandlers("/"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-dock-icon", children: "＋" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.nav.publish })
      ] }),
      dockLinks.slice(2).map((link) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        NavLink,
        {
          to: link.to,
          className: ({ isActive }) => `mobile-dock-link ${isActive ? "active" : ""}`,
          ...getPrefetchHandlers(link.to),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-dock-icon", children: link.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: link.label }),
            link.badge === "live" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mobile-live-dot", "aria-hidden": "true" }) : null,
            typeof link.badge === "number" && link.badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "topbar-badge", children: link.badge }) : null
          ]
        },
        link.to
      ))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .mobile-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 5px rgba(34,197,94,0.18);
          animation: mobile-live-pulse 1.6s infinite;
        }
        @keyframes mobile-live-pulse {
          0% { transform: scale(0.9); opacity: 0.75; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.75; }
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
function MainLayout({ children }) {
  const nativeShell = isNativeShell();
  const location = useLocation();
  const mainRef = reactExports.useRef(null);
  const frameRef = reactExports.useRef(0);
  const [isTransitioning, setIsTransitioning] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const container = mainRef.current;
    if (!container) return void 0;
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
  }, [location.pathname]);
  reactExports.useEffect(() => {
    const container = mainRef.current;
    if (!container) return void 0;
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
  }, [location.pathname]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `app-shell yamshat-shell ${nativeShell ? "native-shell" : ""}`, children: [
    !nativeShell && /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `main-shell ${nativeShell ? "native-shell" : ""}`, children: [
      !nativeShell && /* @__PURE__ */ jsxRuntimeExports.jsx(Topbar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "main",
        {
          className: `page-content ${nativeShell ? "native-shell" : ""} ${isTransitioning ? "is-transitioning" : ""}`,
          ref: mainRef,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "page-shell-glow", children }, location.pathname)
        }
      )
    ] }),
    !nativeShell && /* @__PURE__ */ jsxRuntimeExports.jsx(MobileDock, {}),
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

          .app-shell.native-shell {
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

            .page-content {
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
  getLiveRoom as a,
  getLiveComments as b,
  createLiveRoom as c,
  avatarGradient as d,
  endLiveRoom as e,
  formatTimeAgo as f,
  getLiveRooms as g,
  useQuery as h,
  initialsFromName as i,
  followUser as j,
  getUsers as k,
  getProfileBundle as l,
  updateMyProfile as m,
  useBaseQuery as n,
  formatCompactNumber as o,
  formatLastSeen as p,
  statusTicks as q,
  statusColor as r,
  sendLiveGift as s,
  getNotifications as t,
  updateLiveRecording as u
};
