const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["chunks/index-Dd6_3oiF.js","chunks/useDebouncedValue-D3V-N9aL.js","chunks/auth-BuYaukiy.js","chunks/Card-qq68bGlj.js","chunks/proxy-BFepwXo2.js","chunks/deviceProfile-DTy4urT5.js","chunks/Input-B86JccIb.js","chunks/Modal-DM4_qhBh.js","chunks/EmptyState-CdKtrcN-.js","chunks/ErrorState-E6_7voYz.js","chunks/stories-CAECkPR9.js","chunks/posts-1f9mZwS7.js","chunks/groups-DONR23VT.js","chunks/Login-NlrOaCh5.js","chunks/authValidation-C9DebCcL.js","chunks/sanitize-wjAo3Zg-.js","chunks/TwoFactorChallengeModal-3BTBUGV0.js","chunks/useSingleFlight-BZ92gu-c.js","chunks/AdminLogin-BI1RUisz.js","chunks/Register-9ko6f4fs.js","chunks/VerifyEmail-DUuLrovR.js","chunks/OtpCodeInput-DKcQTAXJ.js","chunks/ForgotPassword-DztpGEuA.js","chunks/PasswordRecoveryFlow-QIR499D_.js","chunks/ResetPassword-DE1xZhOJ.js","chunks/Dashboard-DTqWQDR8.js","chunks/MainLayout-CsZ3tvBx.js","chunks/FeedEnhanced-CQai_Bwi.js","chunks/useFeed-D74BbOte.js","chunks/users-yjlw8KOa.js","chunks/live-b1Kum3Sy.js","chunks/recommendationService-CaN6KIfu.js","chunks/YamshatDesign-C0ca_MnA.js","chunks/Stories-Zjs-i32I.js","chunks/Reels-IJ25LLrB.js","chunks/react-virtualized-auto-sizer.esm-DKGCxiTv.js","chunks/Groups-B0zWdCBA.js","chunks/Live-CZJY28ex.js","chunks/index-0yg0Tg4W.js","chunks/Chat-Ba-XAl7-.js","chunks/Inbox-CqHN00ds.js","chunks/Users-D9DSbSbV.js","chunks/Profile-S6xDfnht.js","chunks/index-DTYjTy3_.js","chunks/Search-BoqShEOu.js","chunks/Settings-CJD-CfKa.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
var __publicField = (obj, key, value2) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value2);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value2) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
var __privateSet = (obj, member, value2, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value2) : member.set(obj, value2), value2);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value2) {
    __privateSet(obj, member, value2, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});
var _focused, _cleanup, _setup, _a, _provider, _providerCalled, _b, _online, _cleanup2, _setup2, _c, _gcTimeout, _d, _queryType, _initialState, _revertState, _cache, _client, _retryer, _defaultOptions, _abortSignalConsumed, _Query_instances, isInitialPausedFetch_fn, dispatch_fn, _e, _client2, _observers, _mutationCache, _retryer2, _Mutation_instances, dispatch_fn2, _f, _mutations, _scopes, _mutationId, _g, _queries, _h, _queryCache, _mutationCache2, _defaultOptions2, _queryDefaults, _mutationDefaults, _mountCount, _unsubscribeFocus, _unsubscribeOnline, _i;
function _mergeNamespaces(n, m) {
  for (var i2 = 0; i2 < m.length; i2++) {
    const e2 = m[i2];
    if (typeof e2 !== "string" && !Array.isArray(e2)) {
      for (const k in e2) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e2, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e2[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
var hasRequiredReact_production_min;
function requireReact_production_min() {
  if (hasRequiredReact_production_min) return react_production_min;
  hasRequiredReact_production_min = 1;
  var l2 = /* @__PURE__ */ Symbol.for("react.element"), n = /* @__PURE__ */ Symbol.for("react.portal"), p = /* @__PURE__ */ Symbol.for("react.fragment"), q = /* @__PURE__ */ Symbol.for("react.strict_mode"), r2 = /* @__PURE__ */ Symbol.for("react.profiler"), t2 = /* @__PURE__ */ Symbol.for("react.provider"), u = /* @__PURE__ */ Symbol.for("react.context"), v = /* @__PURE__ */ Symbol.for("react.forward_ref"), w = /* @__PURE__ */ Symbol.for("react.suspense"), x = /* @__PURE__ */ Symbol.for("react.memo"), y = /* @__PURE__ */ Symbol.for("react.lazy"), z = Symbol.iterator;
  function A(a2) {
    if (null === a2 || "object" !== typeof a2) return null;
    a2 = z && a2[z] || a2["@@iterator"];
    return "function" === typeof a2 ? a2 : null;
  }
  var B = { isMounted: function() {
    return false;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, C = Object.assign, D = {};
  function E(a2, b, e2) {
    this.props = a2;
    this.context = b;
    this.refs = D;
    this.updater = e2 || B;
  }
  E.prototype.isReactComponent = {};
  E.prototype.setState = function(a2, b) {
    if ("object" !== typeof a2 && "function" !== typeof a2 && null != a2) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a2, b, "setState");
  };
  E.prototype.forceUpdate = function(a2) {
    this.updater.enqueueForceUpdate(this, a2, "forceUpdate");
  };
  function F() {
  }
  F.prototype = E.prototype;
  function G2(a2, b, e2) {
    this.props = a2;
    this.context = b;
    this.refs = D;
    this.updater = e2 || B;
  }
  var H = G2.prototype = new F();
  H.constructor = G2;
  C(H, E.prototype);
  H.isPureReactComponent = true;
  var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = { current: null }, L = { key: true, ref: true, __self: true, __source: true };
  function M(a2, b, e2) {
    var d, c2 = {}, k = null, h = null;
    if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c2[d] = b[d]);
    var g = arguments.length - 2;
    if (1 === g) c2.children = e2;
    else if (1 < g) {
      for (var f2 = Array(g), m = 0; m < g; m++) f2[m] = arguments[m + 2];
      c2.children = f2;
    }
    if (a2 && a2.defaultProps) for (d in g = a2.defaultProps, g) void 0 === c2[d] && (c2[d] = g[d]);
    return { $$typeof: l2, type: a2, key: k, ref: h, props: c2, _owner: K.current };
  }
  function N(a2, b) {
    return { $$typeof: l2, type: a2.type, key: b, ref: a2.ref, props: a2.props, _owner: a2._owner };
  }
  function O(a2) {
    return "object" === typeof a2 && null !== a2 && a2.$$typeof === l2;
  }
  function escape(a2) {
    var b = { "=": "=0", ":": "=2" };
    return "$" + a2.replace(/[=:]/g, function(a3) {
      return b[a3];
    });
  }
  var P = /\/+/g;
  function Q(a2, b) {
    return "object" === typeof a2 && null !== a2 && null != a2.key ? escape("" + a2.key) : b.toString(36);
  }
  function R(a2, b, e2, d, c2) {
    var k = typeof a2;
    if ("undefined" === k || "boolean" === k) a2 = null;
    var h = false;
    if (null === a2) h = true;
    else switch (k) {
      case "string":
      case "number":
        h = true;
        break;
      case "object":
        switch (a2.$$typeof) {
          case l2:
          case n:
            h = true;
        }
    }
    if (h) return h = a2, c2 = c2(h), a2 = "" === d ? "." + Q(h, 0) : d, I(c2) ? (e2 = "", null != a2 && (e2 = a2.replace(P, "$&/") + "/"), R(c2, b, e2, "", function(a3) {
      return a3;
    })) : null != c2 && (O(c2) && (c2 = N(c2, e2 + (!c2.key || h && h.key === c2.key ? "" : ("" + c2.key).replace(P, "$&/") + "/") + a2)), b.push(c2)), 1;
    h = 0;
    d = "" === d ? "." : d + ":";
    if (I(a2)) for (var g = 0; g < a2.length; g++) {
      k = a2[g];
      var f2 = d + Q(k, g);
      h += R(k, b, e2, f2, c2);
    }
    else if (f2 = A(a2), "function" === typeof f2) for (a2 = f2.call(a2), g = 0; !(k = a2.next()).done; ) k = k.value, f2 = d + Q(k, g++), h += R(k, b, e2, f2, c2);
    else if ("object" === k) throw b = String(a2), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a2).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
    return h;
  }
  function S(a2, b, e2) {
    if (null == a2) return a2;
    var d = [], c2 = 0;
    R(a2, d, "", "", function(a3) {
      return b.call(e2, a3, c2++);
    });
    return d;
  }
  function T(a2) {
    if (-1 === a2._status) {
      var b = a2._result;
      b = b();
      b.then(function(b2) {
        if (0 === a2._status || -1 === a2._status) a2._status = 1, a2._result = b2;
      }, function(b2) {
        if (0 === a2._status || -1 === a2._status) a2._status = 2, a2._result = b2;
      });
      -1 === a2._status && (a2._status = 0, a2._result = b);
    }
    if (1 === a2._status) return a2._result.default;
    throw a2._result;
  }
  var U = { current: null }, V = { transition: null }, W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
  function X() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  react_production_min.Children = { map: S, forEach: function(a2, b, e2) {
    S(a2, function() {
      b.apply(this, arguments);
    }, e2);
  }, count: function(a2) {
    var b = 0;
    S(a2, function() {
      b++;
    });
    return b;
  }, toArray: function(a2) {
    return S(a2, function(a3) {
      return a3;
    }) || [];
  }, only: function(a2) {
    if (!O(a2)) throw Error("React.Children.only expected to receive a single React element child.");
    return a2;
  } };
  react_production_min.Component = E;
  react_production_min.Fragment = p;
  react_production_min.Profiler = r2;
  react_production_min.PureComponent = G2;
  react_production_min.StrictMode = q;
  react_production_min.Suspense = w;
  react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
  react_production_min.act = X;
  react_production_min.cloneElement = function(a2, b, e2) {
    if (null === a2 || void 0 === a2) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a2 + ".");
    var d = C({}, a2.props), c2 = a2.key, k = a2.ref, h = a2._owner;
    if (null != b) {
      void 0 !== b.ref && (k = b.ref, h = K.current);
      void 0 !== b.key && (c2 = "" + b.key);
      if (a2.type && a2.type.defaultProps) var g = a2.type.defaultProps;
      for (f2 in b) J.call(b, f2) && !L.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
    }
    var f2 = arguments.length - 2;
    if (1 === f2) d.children = e2;
    else if (1 < f2) {
      g = Array(f2);
      for (var m = 0; m < f2; m++) g[m] = arguments[m + 2];
      d.children = g;
    }
    return { $$typeof: l2, type: a2.type, key: c2, ref: k, props: d, _owner: h };
  };
  react_production_min.createContext = function(a2) {
    a2 = { $$typeof: u, _currentValue: a2, _currentValue2: a2, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
    a2.Provider = { $$typeof: t2, _context: a2 };
    return a2.Consumer = a2;
  };
  react_production_min.createElement = M;
  react_production_min.createFactory = function(a2) {
    var b = M.bind(null, a2);
    b.type = a2;
    return b;
  };
  react_production_min.createRef = function() {
    return { current: null };
  };
  react_production_min.forwardRef = function(a2) {
    return { $$typeof: v, render: a2 };
  };
  react_production_min.isValidElement = O;
  react_production_min.lazy = function(a2) {
    return { $$typeof: y, _payload: { _status: -1, _result: a2 }, _init: T };
  };
  react_production_min.memo = function(a2, b) {
    return { $$typeof: x, type: a2, compare: void 0 === b ? null : b };
  };
  react_production_min.startTransition = function(a2) {
    var b = V.transition;
    V.transition = {};
    try {
      a2();
    } finally {
      V.transition = b;
    }
  };
  react_production_min.unstable_act = X;
  react_production_min.useCallback = function(a2, b) {
    return U.current.useCallback(a2, b);
  };
  react_production_min.useContext = function(a2) {
    return U.current.useContext(a2);
  };
  react_production_min.useDebugValue = function() {
  };
  react_production_min.useDeferredValue = function(a2) {
    return U.current.useDeferredValue(a2);
  };
  react_production_min.useEffect = function(a2, b) {
    return U.current.useEffect(a2, b);
  };
  react_production_min.useId = function() {
    return U.current.useId();
  };
  react_production_min.useImperativeHandle = function(a2, b, e2) {
    return U.current.useImperativeHandle(a2, b, e2);
  };
  react_production_min.useInsertionEffect = function(a2, b) {
    return U.current.useInsertionEffect(a2, b);
  };
  react_production_min.useLayoutEffect = function(a2, b) {
    return U.current.useLayoutEffect(a2, b);
  };
  react_production_min.useMemo = function(a2, b) {
    return U.current.useMemo(a2, b);
  };
  react_production_min.useReducer = function(a2, b, e2) {
    return U.current.useReducer(a2, b, e2);
  };
  react_production_min.useRef = function(a2) {
    return U.current.useRef(a2);
  };
  react_production_min.useState = function(a2) {
    return U.current.useState(a2);
  };
  react_production_min.useSyncExternalStore = function(a2, b, e2) {
    return U.current.useSyncExternalStore(a2, b, e2);
  };
  react_production_min.useTransition = function() {
    return U.current.useTransition();
  };
  react_production_min.version = "18.3.1";
  return react_production_min;
}
var hasRequiredReact;
function requireReact() {
  if (hasRequiredReact) return react.exports;
  hasRequiredReact = 1;
  {
    react.exports = requireReact_production_min();
  }
  return react.exports;
}
var hasRequiredReactJsxRuntime_production_min;
function requireReactJsxRuntime_production_min() {
  if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
  hasRequiredReactJsxRuntime_production_min = 1;
  var f2 = requireReact(), k = /* @__PURE__ */ Symbol.for("react.element"), l2 = /* @__PURE__ */ Symbol.for("react.fragment"), m = Object.prototype.hasOwnProperty, n = f2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p = { key: true, ref: true, __self: true, __source: true };
  function q(c2, a2, g) {
    var b, d = {}, e2 = null, h = null;
    void 0 !== g && (e2 = "" + g);
    void 0 !== a2.key && (e2 = "" + a2.key);
    void 0 !== a2.ref && (h = a2.ref);
    for (b in a2) m.call(a2, b) && !p.hasOwnProperty(b) && (d[b] = a2[b]);
    if (c2 && c2.defaultProps) for (b in a2 = c2.defaultProps, a2) void 0 === d[b] && (d[b] = a2[b]);
    return { $$typeof: k, type: c2, key: e2, ref: h, props: d, _owner: n.current };
  }
  reactJsxRuntime_production_min.Fragment = l2;
  reactJsxRuntime_production_min.jsx = q;
  reactJsxRuntime_production_min.jsxs = q;
  return reactJsxRuntime_production_min;
}
var hasRequiredJsxRuntime;
function requireJsxRuntime() {
  if (hasRequiredJsxRuntime) return jsxRuntime.exports;
  hasRequiredJsxRuntime = 1;
  {
    jsxRuntime.exports = requireReactJsxRuntime_production_min();
  }
  return jsxRuntime.exports;
}
var jsxRuntimeExports = requireJsxRuntime();
var reactExports = requireReact();
const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
const React$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: React
}, [reactExports]);
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
var hasRequiredScheduler_production_min;
function requireScheduler_production_min() {
  if (hasRequiredScheduler_production_min) return scheduler_production_min;
  hasRequiredScheduler_production_min = 1;
  (function(exports) {
    function f2(a2, b) {
      var c2 = a2.length;
      a2.push(b);
      a: for (; 0 < c2; ) {
        var d = c2 - 1 >>> 1, e2 = a2[d];
        if (0 < g(e2, b)) a2[d] = b, a2[c2] = e2, c2 = d;
        else break a;
      }
    }
    function h(a2) {
      return 0 === a2.length ? null : a2[0];
    }
    function k(a2) {
      if (0 === a2.length) return null;
      var b = a2[0], c2 = a2.pop();
      if (c2 !== b) {
        a2[0] = c2;
        a: for (var d = 0, e2 = a2.length, w = e2 >>> 1; d < w; ) {
          var m = 2 * (d + 1) - 1, C = a2[m], n = m + 1, x = a2[n];
          if (0 > g(C, c2)) n < e2 && 0 > g(x, C) ? (a2[d] = x, a2[n] = c2, d = n) : (a2[d] = C, a2[m] = c2, d = m);
          else if (n < e2 && 0 > g(x, c2)) a2[d] = x, a2[n] = c2, d = n;
          else break a;
        }
      }
      return b;
    }
    function g(a2, b) {
      var c2 = a2.sortIndex - b.sortIndex;
      return 0 !== c2 ? c2 : a2.id - b.id;
    }
    if ("object" === typeof performance && "function" === typeof performance.now) {
      var l2 = performance;
      exports.unstable_now = function() {
        return l2.now();
      };
    } else {
      var p = Date, q = p.now();
      exports.unstable_now = function() {
        return p.now() - q;
      };
    }
    var r2 = [], t2 = [], u = 1, v = null, y = 3, z = false, A = false, B = false, D = "function" === typeof setTimeout ? setTimeout : null, E = "function" === typeof clearTimeout ? clearTimeout : null, F = "undefined" !== typeof setImmediate ? setImmediate : null;
    "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function G2(a2) {
      for (var b = h(t2); null !== b; ) {
        if (null === b.callback) k(t2);
        else if (b.startTime <= a2) k(t2), b.sortIndex = b.expirationTime, f2(r2, b);
        else break;
        b = h(t2);
      }
    }
    function H(a2) {
      B = false;
      G2(a2);
      if (!A) if (null !== h(r2)) A = true, I(J);
      else {
        var b = h(t2);
        null !== b && K(H, b.startTime - a2);
      }
    }
    function J(a2, b) {
      A = false;
      B && (B = false, E(L), L = -1);
      z = true;
      var c2 = y;
      try {
        G2(b);
        for (v = h(r2); null !== v && (!(v.expirationTime > b) || a2 && !M()); ) {
          var d = v.callback;
          if ("function" === typeof d) {
            v.callback = null;
            y = v.priorityLevel;
            var e2 = d(v.expirationTime <= b);
            b = exports.unstable_now();
            "function" === typeof e2 ? v.callback = e2 : v === h(r2) && k(r2);
            G2(b);
          } else k(r2);
          v = h(r2);
        }
        if (null !== v) var w = true;
        else {
          var m = h(t2);
          null !== m && K(H, m.startTime - b);
          w = false;
        }
        return w;
      } finally {
        v = null, y = c2, z = false;
      }
    }
    var N = false, O = null, L = -1, P = 5, Q = -1;
    function M() {
      return exports.unstable_now() - Q < P ? false : true;
    }
    function R() {
      if (null !== O) {
        var a2 = exports.unstable_now();
        Q = a2;
        var b = true;
        try {
          b = O(true, a2);
        } finally {
          b ? S() : (N = false, O = null);
        }
      } else N = false;
    }
    var S;
    if ("function" === typeof F) S = function() {
      F(R);
    };
    else if ("undefined" !== typeof MessageChannel) {
      var T = new MessageChannel(), U = T.port2;
      T.port1.onmessage = R;
      S = function() {
        U.postMessage(null);
      };
    } else S = function() {
      D(R, 0);
    };
    function I(a2) {
      O = a2;
      N || (N = true, S());
    }
    function K(a2, b) {
      L = D(function() {
        a2(exports.unstable_now());
      }, b);
    }
    exports.unstable_IdlePriority = 5;
    exports.unstable_ImmediatePriority = 1;
    exports.unstable_LowPriority = 4;
    exports.unstable_NormalPriority = 3;
    exports.unstable_Profiling = null;
    exports.unstable_UserBlockingPriority = 2;
    exports.unstable_cancelCallback = function(a2) {
      a2.callback = null;
    };
    exports.unstable_continueExecution = function() {
      A || z || (A = true, I(J));
    };
    exports.unstable_forceFrameRate = function(a2) {
      0 > a2 || 125 < a2 ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a2 ? Math.floor(1e3 / a2) : 5;
    };
    exports.unstable_getCurrentPriorityLevel = function() {
      return y;
    };
    exports.unstable_getFirstCallbackNode = function() {
      return h(r2);
    };
    exports.unstable_next = function(a2) {
      switch (y) {
        case 1:
        case 2:
        case 3:
          var b = 3;
          break;
        default:
          b = y;
      }
      var c2 = y;
      y = b;
      try {
        return a2();
      } finally {
        y = c2;
      }
    };
    exports.unstable_pauseExecution = function() {
    };
    exports.unstable_requestPaint = function() {
    };
    exports.unstable_runWithPriority = function(a2, b) {
      switch (a2) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          a2 = 3;
      }
      var c2 = y;
      y = a2;
      try {
        return b();
      } finally {
        y = c2;
      }
    };
    exports.unstable_scheduleCallback = function(a2, b, c2) {
      var d = exports.unstable_now();
      "object" === typeof c2 && null !== c2 ? (c2 = c2.delay, c2 = "number" === typeof c2 && 0 < c2 ? d + c2 : d) : c2 = d;
      switch (a2) {
        case 1:
          var e2 = -1;
          break;
        case 2:
          e2 = 250;
          break;
        case 5:
          e2 = 1073741823;
          break;
        case 4:
          e2 = 1e4;
          break;
        default:
          e2 = 5e3;
      }
      e2 = c2 + e2;
      a2 = { id: u++, callback: b, priorityLevel: a2, startTime: c2, expirationTime: e2, sortIndex: -1 };
      c2 > d ? (a2.sortIndex = c2, f2(t2, a2), null === h(r2) && a2 === h(t2) && (B ? (E(L), L = -1) : B = true, K(H, c2 - d))) : (a2.sortIndex = e2, f2(r2, a2), A || z || (A = true, I(J)));
      return a2;
    };
    exports.unstable_shouldYield = M;
    exports.unstable_wrapCallback = function(a2) {
      var b = y;
      return function() {
        var c2 = y;
        y = b;
        try {
          return a2.apply(this, arguments);
        } finally {
          y = c2;
        }
      };
    };
  })(scheduler_production_min);
  return scheduler_production_min;
}
var hasRequiredScheduler;
function requireScheduler() {
  if (hasRequiredScheduler) return scheduler.exports;
  hasRequiredScheduler = 1;
  {
    scheduler.exports = requireScheduler_production_min();
  }
  return scheduler.exports;
}
var hasRequiredReactDom_production_min;
function requireReactDom_production_min() {
  if (hasRequiredReactDom_production_min) return reactDom_production_min;
  hasRequiredReactDom_production_min = 1;
  var aa = requireReact(), ca = requireScheduler();
  function p(a2) {
    for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a2, c2 = 1; c2 < arguments.length; c2++) b += "&args[]=" + encodeURIComponent(arguments[c2]);
    return "Minified React error #" + a2 + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var da = /* @__PURE__ */ new Set(), ea = {};
  function fa(a2, b) {
    ha(a2, b);
    ha(a2 + "Capture", b);
  }
  function ha(a2, b) {
    ea[a2] = b;
    for (a2 = 0; a2 < b.length; a2++) da.add(b[a2]);
  }
  var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
  function oa(a2) {
    if (ja.call(ma, a2)) return true;
    if (ja.call(la, a2)) return false;
    if (ka.test(a2)) return ma[a2] = true;
    la[a2] = true;
    return false;
  }
  function pa(a2, b, c2, d) {
    if (null !== c2 && 0 === c2.type) return false;
    switch (typeof b) {
      case "function":
      case "symbol":
        return true;
      case "boolean":
        if (d) return false;
        if (null !== c2) return !c2.acceptsBooleans;
        a2 = a2.toLowerCase().slice(0, 5);
        return "data-" !== a2 && "aria-" !== a2;
      default:
        return false;
    }
  }
  function qa(a2, b, c2, d) {
    if (null === b || "undefined" === typeof b || pa(a2, b, c2, d)) return true;
    if (d) return false;
    if (null !== c2) switch (c2.type) {
      case 3:
        return !b;
      case 4:
        return false === b;
      case 5:
        return isNaN(b);
      case 6:
        return isNaN(b) || 1 > b;
    }
    return false;
  }
  function v(a2, b, c2, d, e2, f2, g) {
    this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
    this.attributeName = d;
    this.attributeNamespace = e2;
    this.mustUseProperty = c2;
    this.propertyName = a2;
    this.type = b;
    this.sanitizeURL = f2;
    this.removeEmptyString = g;
  }
  var z = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a2) {
    z[a2] = new v(a2, 0, false, a2, null, false, false);
  });
  [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a2) {
    var b = a2[0];
    z[b] = new v(b, 1, false, a2[1], null, false, false);
  });
  ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a2) {
    z[a2] = new v(a2, 2, false, a2.toLowerCase(), null, false, false);
  });
  ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a2) {
    z[a2] = new v(a2, 2, false, a2, null, false, false);
  });
  "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a2) {
    z[a2] = new v(a2, 3, false, a2.toLowerCase(), null, false, false);
  });
  ["checked", "multiple", "muted", "selected"].forEach(function(a2) {
    z[a2] = new v(a2, 3, true, a2, null, false, false);
  });
  ["capture", "download"].forEach(function(a2) {
    z[a2] = new v(a2, 4, false, a2, null, false, false);
  });
  ["cols", "rows", "size", "span"].forEach(function(a2) {
    z[a2] = new v(a2, 6, false, a2, null, false, false);
  });
  ["rowSpan", "start"].forEach(function(a2) {
    z[a2] = new v(a2, 5, false, a2.toLowerCase(), null, false, false);
  });
  var ra = /[\-:]([a-z])/g;
  function sa(a2) {
    return a2[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a2) {
    var b = a2.replace(
      ra,
      sa
    );
    z[b] = new v(b, 1, false, a2, null, false, false);
  });
  "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a2) {
    var b = a2.replace(ra, sa);
    z[b] = new v(b, 1, false, a2, "http://www.w3.org/1999/xlink", false, false);
  });
  ["xml:base", "xml:lang", "xml:space"].forEach(function(a2) {
    var b = a2.replace(ra, sa);
    z[b] = new v(b, 1, false, a2, "http://www.w3.org/XML/1998/namespace", false, false);
  });
  ["tabIndex", "crossOrigin"].forEach(function(a2) {
    z[a2] = new v(a2, 1, false, a2.toLowerCase(), null, false, false);
  });
  z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
  ["src", "href", "action", "formAction"].forEach(function(a2) {
    z[a2] = new v(a2, 1, false, a2.toLowerCase(), null, true, true);
  });
  function ta(a2, b, c2, d) {
    var e2 = z.hasOwnProperty(b) ? z[b] : null;
    if (null !== e2 ? 0 !== e2.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c2, e2, d) && (c2 = null), d || null === e2 ? oa(b) && (null === c2 ? a2.removeAttribute(b) : a2.setAttribute(b, "" + c2)) : e2.mustUseProperty ? a2[e2.propertyName] = null === c2 ? 3 === e2.type ? false : "" : c2 : (b = e2.attributeName, d = e2.attributeNamespace, null === c2 ? a2.removeAttribute(b) : (e2 = e2.type, c2 = 3 === e2 || 4 === e2 && true === c2 ? "" : "" + c2, d ? a2.setAttributeNS(d, b, c2) : a2.setAttribute(b, c2)));
  }
  var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = /* @__PURE__ */ Symbol.for("react.element"), wa = /* @__PURE__ */ Symbol.for("react.portal"), ya = /* @__PURE__ */ Symbol.for("react.fragment"), za = /* @__PURE__ */ Symbol.for("react.strict_mode"), Aa = /* @__PURE__ */ Symbol.for("react.profiler"), Ba = /* @__PURE__ */ Symbol.for("react.provider"), Ca = /* @__PURE__ */ Symbol.for("react.context"), Da = /* @__PURE__ */ Symbol.for("react.forward_ref"), Ea = /* @__PURE__ */ Symbol.for("react.suspense"), Fa = /* @__PURE__ */ Symbol.for("react.suspense_list"), Ga = /* @__PURE__ */ Symbol.for("react.memo"), Ha = /* @__PURE__ */ Symbol.for("react.lazy");
  var Ia = /* @__PURE__ */ Symbol.for("react.offscreen");
  var Ja = Symbol.iterator;
  function Ka(a2) {
    if (null === a2 || "object" !== typeof a2) return null;
    a2 = Ja && a2[Ja] || a2["@@iterator"];
    return "function" === typeof a2 ? a2 : null;
  }
  var A = Object.assign, La;
  function Ma(a2) {
    if (void 0 === La) try {
      throw Error();
    } catch (c2) {
      var b = c2.stack.trim().match(/\n( *(at )?)/);
      La = b && b[1] || "";
    }
    return "\n" + La + a2;
  }
  var Na = false;
  function Oa(a2, b) {
    if (!a2 || Na) return "";
    Na = true;
    var c2 = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (b) if (b = function() {
        throw Error();
      }, Object.defineProperty(b.prototype, "props", { set: function() {
        throw Error();
      } }), "object" === typeof Reflect && Reflect.construct) {
        try {
          Reflect.construct(b, []);
        } catch (l2) {
          var d = l2;
        }
        Reflect.construct(a2, [], b);
      } else {
        try {
          b.call();
        } catch (l2) {
          d = l2;
        }
        a2.call(b.prototype);
      }
      else {
        try {
          throw Error();
        } catch (l2) {
          d = l2;
        }
        a2();
      }
    } catch (l2) {
      if (l2 && d && "string" === typeof l2.stack) {
        for (var e2 = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e2.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e2[g] !== f2[h]; ) h--;
        for (; 1 <= g && 0 <= h; g--, h--) if (e2[g] !== f2[h]) {
          if (1 !== g || 1 !== h) {
            do
              if (g--, h--, 0 > h || e2[g] !== f2[h]) {
                var k = "\n" + e2[g].replace(" at new ", " at ");
                a2.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a2.displayName));
                return k;
              }
            while (1 <= g && 0 <= h);
          }
          break;
        }
      }
    } finally {
      Na = false, Error.prepareStackTrace = c2;
    }
    return (a2 = a2 ? a2.displayName || a2.name : "") ? Ma(a2) : "";
  }
  function Pa(a2) {
    switch (a2.tag) {
      case 5:
        return Ma(a2.type);
      case 16:
        return Ma("Lazy");
      case 13:
        return Ma("Suspense");
      case 19:
        return Ma("SuspenseList");
      case 0:
      case 2:
      case 15:
        return a2 = Oa(a2.type, false), a2;
      case 11:
        return a2 = Oa(a2.type.render, false), a2;
      case 1:
        return a2 = Oa(a2.type, true), a2;
      default:
        return "";
    }
  }
  function Qa(a2) {
    if (null == a2) return null;
    if ("function" === typeof a2) return a2.displayName || a2.name || null;
    if ("string" === typeof a2) return a2;
    switch (a2) {
      case ya:
        return "Fragment";
      case wa:
        return "Portal";
      case Aa:
        return "Profiler";
      case za:
        return "StrictMode";
      case Ea:
        return "Suspense";
      case Fa:
        return "SuspenseList";
    }
    if ("object" === typeof a2) switch (a2.$$typeof) {
      case Ca:
        return (a2.displayName || "Context") + ".Consumer";
      case Ba:
        return (a2._context.displayName || "Context") + ".Provider";
      case Da:
        var b = a2.render;
        a2 = a2.displayName;
        a2 || (a2 = b.displayName || b.name || "", a2 = "" !== a2 ? "ForwardRef(" + a2 + ")" : "ForwardRef");
        return a2;
      case Ga:
        return b = a2.displayName || null, null !== b ? b : Qa(a2.type) || "Memo";
      case Ha:
        b = a2._payload;
        a2 = a2._init;
        try {
          return Qa(a2(b));
        } catch (c2) {
        }
    }
    return null;
  }
  function Ra(a2) {
    var b = a2.type;
    switch (a2.tag) {
      case 24:
        return "Cache";
      case 9:
        return (b.displayName || "Context") + ".Consumer";
      case 10:
        return (b._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return a2 = b.render, a2 = a2.displayName || a2.name || "", b.displayName || ("" !== a2 ? "ForwardRef(" + a2 + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return b;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return Qa(b);
      case 8:
        return b === za ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if ("function" === typeof b) return b.displayName || b.name || null;
        if ("string" === typeof b) return b;
    }
    return null;
  }
  function Sa(a2) {
    switch (typeof a2) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return a2;
      case "object":
        return a2;
      default:
        return "";
    }
  }
  function Ta(a2) {
    var b = a2.type;
    return (a2 = a2.nodeName) && "input" === a2.toLowerCase() && ("checkbox" === b || "radio" === b);
  }
  function Ua(a2) {
    var b = Ta(a2) ? "checked" : "value", c2 = Object.getOwnPropertyDescriptor(a2.constructor.prototype, b), d = "" + a2[b];
    if (!a2.hasOwnProperty(b) && "undefined" !== typeof c2 && "function" === typeof c2.get && "function" === typeof c2.set) {
      var e2 = c2.get, f2 = c2.set;
      Object.defineProperty(a2, b, { configurable: true, get: function() {
        return e2.call(this);
      }, set: function(a3) {
        d = "" + a3;
        f2.call(this, a3);
      } });
      Object.defineProperty(a2, b, { enumerable: c2.enumerable });
      return { getValue: function() {
        return d;
      }, setValue: function(a3) {
        d = "" + a3;
      }, stopTracking: function() {
        a2._valueTracker = null;
        delete a2[b];
      } };
    }
  }
  function Va(a2) {
    a2._valueTracker || (a2._valueTracker = Ua(a2));
  }
  function Wa(a2) {
    if (!a2) return false;
    var b = a2._valueTracker;
    if (!b) return true;
    var c2 = b.getValue();
    var d = "";
    a2 && (d = Ta(a2) ? a2.checked ? "true" : "false" : a2.value);
    a2 = d;
    return a2 !== c2 ? (b.setValue(a2), true) : false;
  }
  function Xa(a2) {
    a2 = a2 || ("undefined" !== typeof document ? document : void 0);
    if ("undefined" === typeof a2) return null;
    try {
      return a2.activeElement || a2.body;
    } catch (b) {
      return a2.body;
    }
  }
  function Ya(a2, b) {
    var c2 = b.checked;
    return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c2 ? c2 : a2._wrapperState.initialChecked });
  }
  function Za(a2, b) {
    var c2 = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
    c2 = Sa(null != b.value ? b.value : c2);
    a2._wrapperState = { initialChecked: d, initialValue: c2, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
  }
  function ab(a2, b) {
    b = b.checked;
    null != b && ta(a2, "checked", b, false);
  }
  function bb(a2, b) {
    ab(a2, b);
    var c2 = Sa(b.value), d = b.type;
    if (null != c2) if ("number" === d) {
      if (0 === c2 && "" === a2.value || a2.value != c2) a2.value = "" + c2;
    } else a2.value !== "" + c2 && (a2.value = "" + c2);
    else if ("submit" === d || "reset" === d) {
      a2.removeAttribute("value");
      return;
    }
    b.hasOwnProperty("value") ? cb(a2, b.type, c2) : b.hasOwnProperty("defaultValue") && cb(a2, b.type, Sa(b.defaultValue));
    null == b.checked && null != b.defaultChecked && (a2.defaultChecked = !!b.defaultChecked);
  }
  function db(a2, b, c2) {
    if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
      var d = b.type;
      if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
      b = "" + a2._wrapperState.initialValue;
      c2 || b === a2.value || (a2.value = b);
      a2.defaultValue = b;
    }
    c2 = a2.name;
    "" !== c2 && (a2.name = "");
    a2.defaultChecked = !!a2._wrapperState.initialChecked;
    "" !== c2 && (a2.name = c2);
  }
  function cb(a2, b, c2) {
    if ("number" !== b || Xa(a2.ownerDocument) !== a2) null == c2 ? a2.defaultValue = "" + a2._wrapperState.initialValue : a2.defaultValue !== "" + c2 && (a2.defaultValue = "" + c2);
  }
  var eb = Array.isArray;
  function fb(a2, b, c2, d) {
    a2 = a2.options;
    if (b) {
      b = {};
      for (var e2 = 0; e2 < c2.length; e2++) b["$" + c2[e2]] = true;
      for (c2 = 0; c2 < a2.length; c2++) e2 = b.hasOwnProperty("$" + a2[c2].value), a2[c2].selected !== e2 && (a2[c2].selected = e2), e2 && d && (a2[c2].defaultSelected = true);
    } else {
      c2 = "" + Sa(c2);
      b = null;
      for (e2 = 0; e2 < a2.length; e2++) {
        if (a2[e2].value === c2) {
          a2[e2].selected = true;
          d && (a2[e2].defaultSelected = true);
          return;
        }
        null !== b || a2[e2].disabled || (b = a2[e2]);
      }
      null !== b && (b.selected = true);
    }
  }
  function gb(a2, b) {
    if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
    return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a2._wrapperState.initialValue });
  }
  function hb(a2, b) {
    var c2 = b.value;
    if (null == c2) {
      c2 = b.children;
      b = b.defaultValue;
      if (null != c2) {
        if (null != b) throw Error(p(92));
        if (eb(c2)) {
          if (1 < c2.length) throw Error(p(93));
          c2 = c2[0];
        }
        b = c2;
      }
      null == b && (b = "");
      c2 = b;
    }
    a2._wrapperState = { initialValue: Sa(c2) };
  }
  function ib(a2, b) {
    var c2 = Sa(b.value), d = Sa(b.defaultValue);
    null != c2 && (c2 = "" + c2, c2 !== a2.value && (a2.value = c2), null == b.defaultValue && a2.defaultValue !== c2 && (a2.defaultValue = c2));
    null != d && (a2.defaultValue = "" + d);
  }
  function jb(a2) {
    var b = a2.textContent;
    b === a2._wrapperState.initialValue && "" !== b && null !== b && (a2.value = b);
  }
  function kb(a2) {
    switch (a2) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function lb(a2, b) {
    return null == a2 || "http://www.w3.org/1999/xhtml" === a2 ? kb(b) : "http://www.w3.org/2000/svg" === a2 && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a2;
  }
  var mb, nb = (function(a2) {
    return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c2, d, e2) {
      MSApp.execUnsafeLocalFunction(function() {
        return a2(b, c2, d, e2);
      });
    } : a2;
  })(function(a2, b) {
    if ("http://www.w3.org/2000/svg" !== a2.namespaceURI || "innerHTML" in a2) a2.innerHTML = b;
    else {
      mb = mb || document.createElement("div");
      mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
      for (b = mb.firstChild; a2.firstChild; ) a2.removeChild(a2.firstChild);
      for (; b.firstChild; ) a2.appendChild(b.firstChild);
    }
  });
  function ob(a2, b) {
    if (b) {
      var c2 = a2.firstChild;
      if (c2 && c2 === a2.lastChild && 3 === c2.nodeType) {
        c2.nodeValue = b;
        return;
      }
    }
    a2.textContent = b;
  }
  var pb = {
    animationIterationCount: true,
    aspectRatio: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
  }, qb = ["Webkit", "ms", "Moz", "O"];
  Object.keys(pb).forEach(function(a2) {
    qb.forEach(function(b) {
      b = b + a2.charAt(0).toUpperCase() + a2.substring(1);
      pb[b] = pb[a2];
    });
  });
  function rb(a2, b, c2) {
    return null == b || "boolean" === typeof b || "" === b ? "" : c2 || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a2) && pb[a2] ? ("" + b).trim() : b + "px";
  }
  function sb(a2, b) {
    a2 = a2.style;
    for (var c2 in b) if (b.hasOwnProperty(c2)) {
      var d = 0 === c2.indexOf("--"), e2 = rb(c2, b[c2], d);
      "float" === c2 && (c2 = "cssFloat");
      d ? a2.setProperty(c2, e2) : a2[c2] = e2;
    }
  }
  var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
  function ub(a2, b) {
    if (b) {
      if (tb[a2] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a2));
      if (null != b.dangerouslySetInnerHTML) {
        if (null != b.children) throw Error(p(60));
        if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
      }
      if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
    }
  }
  function vb(a2, b) {
    if (-1 === a2.indexOf("-")) return "string" === typeof b.is;
    switch (a2) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return false;
      default:
        return true;
    }
  }
  var wb = null;
  function xb(a2) {
    a2 = a2.target || a2.srcElement || window;
    a2.correspondingUseElement && (a2 = a2.correspondingUseElement);
    return 3 === a2.nodeType ? a2.parentNode : a2;
  }
  var yb = null, zb = null, Ab = null;
  function Bb(a2) {
    if (a2 = Cb(a2)) {
      if ("function" !== typeof yb) throw Error(p(280));
      var b = a2.stateNode;
      b && (b = Db(b), yb(a2.stateNode, a2.type, b));
    }
  }
  function Eb(a2) {
    zb ? Ab ? Ab.push(a2) : Ab = [a2] : zb = a2;
  }
  function Fb() {
    if (zb) {
      var a2 = zb, b = Ab;
      Ab = zb = null;
      Bb(a2);
      if (b) for (a2 = 0; a2 < b.length; a2++) Bb(b[a2]);
    }
  }
  function Gb(a2, b) {
    return a2(b);
  }
  function Hb() {
  }
  var Ib = false;
  function Jb(a2, b, c2) {
    if (Ib) return a2(b, c2);
    Ib = true;
    try {
      return Gb(a2, b, c2);
    } finally {
      if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
    }
  }
  function Kb(a2, b) {
    var c2 = a2.stateNode;
    if (null === c2) return null;
    var d = Db(c2);
    if (null === d) return null;
    c2 = d[b];
    a: switch (b) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (d = !d.disabled) || (a2 = a2.type, d = !("button" === a2 || "input" === a2 || "select" === a2 || "textarea" === a2));
        a2 = !d;
        break a;
      default:
        a2 = false;
    }
    if (a2) return null;
    if (c2 && "function" !== typeof c2) throw Error(p(231, b, typeof c2));
    return c2;
  }
  var Lb = false;
  if (ia) try {
    var Mb = {};
    Object.defineProperty(Mb, "passive", { get: function() {
      Lb = true;
    } });
    window.addEventListener("test", Mb, Mb);
    window.removeEventListener("test", Mb, Mb);
  } catch (a2) {
    Lb = false;
  }
  function Nb(a2, b, c2, d, e2, f2, g, h, k) {
    var l2 = Array.prototype.slice.call(arguments, 3);
    try {
      b.apply(c2, l2);
    } catch (m) {
      this.onError(m);
    }
  }
  var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a2) {
    Ob = true;
    Pb = a2;
  } };
  function Tb(a2, b, c2, d, e2, f2, g, h, k) {
    Ob = false;
    Pb = null;
    Nb.apply(Sb, arguments);
  }
  function Ub(a2, b, c2, d, e2, f2, g, h, k) {
    Tb.apply(this, arguments);
    if (Ob) {
      if (Ob) {
        var l2 = Pb;
        Ob = false;
        Pb = null;
      } else throw Error(p(198));
      Qb || (Qb = true, Rb = l2);
    }
  }
  function Vb(a2) {
    var b = a2, c2 = a2;
    if (a2.alternate) for (; b.return; ) b = b.return;
    else {
      a2 = b;
      do
        b = a2, 0 !== (b.flags & 4098) && (c2 = b.return), a2 = b.return;
      while (a2);
    }
    return 3 === b.tag ? c2 : null;
  }
  function Wb(a2) {
    if (13 === a2.tag) {
      var b = a2.memoizedState;
      null === b && (a2 = a2.alternate, null !== a2 && (b = a2.memoizedState));
      if (null !== b) return b.dehydrated;
    }
    return null;
  }
  function Xb(a2) {
    if (Vb(a2) !== a2) throw Error(p(188));
  }
  function Yb(a2) {
    var b = a2.alternate;
    if (!b) {
      b = Vb(a2);
      if (null === b) throw Error(p(188));
      return b !== a2 ? null : a2;
    }
    for (var c2 = a2, d = b; ; ) {
      var e2 = c2.return;
      if (null === e2) break;
      var f2 = e2.alternate;
      if (null === f2) {
        d = e2.return;
        if (null !== d) {
          c2 = d;
          continue;
        }
        break;
      }
      if (e2.child === f2.child) {
        for (f2 = e2.child; f2; ) {
          if (f2 === c2) return Xb(e2), a2;
          if (f2 === d) return Xb(e2), b;
          f2 = f2.sibling;
        }
        throw Error(p(188));
      }
      if (c2.return !== d.return) c2 = e2, d = f2;
      else {
        for (var g = false, h = e2.child; h; ) {
          if (h === c2) {
            g = true;
            c2 = e2;
            d = f2;
            break;
          }
          if (h === d) {
            g = true;
            d = e2;
            c2 = f2;
            break;
          }
          h = h.sibling;
        }
        if (!g) {
          for (h = f2.child; h; ) {
            if (h === c2) {
              g = true;
              c2 = f2;
              d = e2;
              break;
            }
            if (h === d) {
              g = true;
              d = f2;
              c2 = e2;
              break;
            }
            h = h.sibling;
          }
          if (!g) throw Error(p(189));
        }
      }
      if (c2.alternate !== d) throw Error(p(190));
    }
    if (3 !== c2.tag) throw Error(p(188));
    return c2.stateNode.current === c2 ? a2 : b;
  }
  function Zb(a2) {
    a2 = Yb(a2);
    return null !== a2 ? $b(a2) : null;
  }
  function $b(a2) {
    if (5 === a2.tag || 6 === a2.tag) return a2;
    for (a2 = a2.child; null !== a2; ) {
      var b = $b(a2);
      if (null !== b) return b;
      a2 = a2.sibling;
    }
    return null;
  }
  var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
  function mc(a2) {
    if (lc && "function" === typeof lc.onCommitFiberRoot) try {
      lc.onCommitFiberRoot(kc, a2, void 0, 128 === (a2.current.flags & 128));
    } catch (b) {
    }
  }
  var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
  function nc(a2) {
    a2 >>>= 0;
    return 0 === a2 ? 32 : 31 - (pc(a2) / qc | 0) | 0;
  }
  var rc = 64, sc = 4194304;
  function tc(a2) {
    switch (a2 & -a2) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return a2 & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return a2 & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return a2;
    }
  }
  function uc(a2, b) {
    var c2 = a2.pendingLanes;
    if (0 === c2) return 0;
    var d = 0, e2 = a2.suspendedLanes, f2 = a2.pingedLanes, g = c2 & 268435455;
    if (0 !== g) {
      var h = g & ~e2;
      0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
    } else g = c2 & ~e2, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
    if (0 === d) return 0;
    if (0 !== b && b !== d && 0 === (b & e2) && (e2 = d & -d, f2 = b & -b, e2 >= f2 || 16 === e2 && 0 !== (f2 & 4194240))) return b;
    0 !== (d & 4) && (d |= c2 & 16);
    b = a2.entangledLanes;
    if (0 !== b) for (a2 = a2.entanglements, b &= d; 0 < b; ) c2 = 31 - oc(b), e2 = 1 << c2, d |= a2[c2], b &= ~e2;
    return d;
  }
  function vc(a2, b) {
    switch (a2) {
      case 1:
      case 2:
      case 4:
        return b + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return b + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function wc(a2, b) {
    for (var c2 = a2.suspendedLanes, d = a2.pingedLanes, e2 = a2.expirationTimes, f2 = a2.pendingLanes; 0 < f2; ) {
      var g = 31 - oc(f2), h = 1 << g, k = e2[g];
      if (-1 === k) {
        if (0 === (h & c2) || 0 !== (h & d)) e2[g] = vc(h, b);
      } else k <= b && (a2.expiredLanes |= h);
      f2 &= ~h;
    }
  }
  function xc(a2) {
    a2 = a2.pendingLanes & -1073741825;
    return 0 !== a2 ? a2 : a2 & 1073741824 ? 1073741824 : 0;
  }
  function yc() {
    var a2 = rc;
    rc <<= 1;
    0 === (rc & 4194240) && (rc = 64);
    return a2;
  }
  function zc(a2) {
    for (var b = [], c2 = 0; 31 > c2; c2++) b.push(a2);
    return b;
  }
  function Ac(a2, b, c2) {
    a2.pendingLanes |= b;
    536870912 !== b && (a2.suspendedLanes = 0, a2.pingedLanes = 0);
    a2 = a2.eventTimes;
    b = 31 - oc(b);
    a2[b] = c2;
  }
  function Bc(a2, b) {
    var c2 = a2.pendingLanes & ~b;
    a2.pendingLanes = b;
    a2.suspendedLanes = 0;
    a2.pingedLanes = 0;
    a2.expiredLanes &= b;
    a2.mutableReadLanes &= b;
    a2.entangledLanes &= b;
    b = a2.entanglements;
    var d = a2.eventTimes;
    for (a2 = a2.expirationTimes; 0 < c2; ) {
      var e2 = 31 - oc(c2), f2 = 1 << e2;
      b[e2] = 0;
      d[e2] = -1;
      a2[e2] = -1;
      c2 &= ~f2;
    }
  }
  function Cc(a2, b) {
    var c2 = a2.entangledLanes |= b;
    for (a2 = a2.entanglements; c2; ) {
      var d = 31 - oc(c2), e2 = 1 << d;
      e2 & b | a2[d] & b && (a2[d] |= b);
      c2 &= ~e2;
    }
  }
  var C = 0;
  function Dc(a2) {
    a2 &= -a2;
    return 1 < a2 ? 4 < a2 ? 0 !== (a2 & 268435455) ? 16 : 536870912 : 4 : 1;
  }
  var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function Sc(a2, b) {
    switch (a2) {
      case "focusin":
      case "focusout":
        Lc = null;
        break;
      case "dragenter":
      case "dragleave":
        Mc = null;
        break;
      case "mouseover":
      case "mouseout":
        Nc = null;
        break;
      case "pointerover":
      case "pointerout":
        Oc.delete(b.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Pc.delete(b.pointerId);
    }
  }
  function Tc(a2, b, c2, d, e2, f2) {
    if (null === a2 || a2.nativeEvent !== f2) return a2 = { blockedOn: b, domEventName: c2, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e2] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a2;
    a2.eventSystemFlags |= d;
    b = a2.targetContainers;
    null !== e2 && -1 === b.indexOf(e2) && b.push(e2);
    return a2;
  }
  function Uc(a2, b, c2, d, e2) {
    switch (b) {
      case "focusin":
        return Lc = Tc(Lc, a2, b, c2, d, e2), true;
      case "dragenter":
        return Mc = Tc(Mc, a2, b, c2, d, e2), true;
      case "mouseover":
        return Nc = Tc(Nc, a2, b, c2, d, e2), true;
      case "pointerover":
        var f2 = e2.pointerId;
        Oc.set(f2, Tc(Oc.get(f2) || null, a2, b, c2, d, e2));
        return true;
      case "gotpointercapture":
        return f2 = e2.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a2, b, c2, d, e2)), true;
    }
    return false;
  }
  function Vc(a2) {
    var b = Wc(a2.target);
    if (null !== b) {
      var c2 = Vb(b);
      if (null !== c2) {
        if (b = c2.tag, 13 === b) {
          if (b = Wb(c2), null !== b) {
            a2.blockedOn = b;
            Ic(a2.priority, function() {
              Gc(c2);
            });
            return;
          }
        } else if (3 === b && c2.stateNode.current.memoizedState.isDehydrated) {
          a2.blockedOn = 3 === c2.tag ? c2.stateNode.containerInfo : null;
          return;
        }
      }
    }
    a2.blockedOn = null;
  }
  function Xc(a2) {
    if (null !== a2.blockedOn) return false;
    for (var b = a2.targetContainers; 0 < b.length; ) {
      var c2 = Yc(a2.domEventName, a2.eventSystemFlags, b[0], a2.nativeEvent);
      if (null === c2) {
        c2 = a2.nativeEvent;
        var d = new c2.constructor(c2.type, c2);
        wb = d;
        c2.target.dispatchEvent(d);
        wb = null;
      } else return b = Cb(c2), null !== b && Fc(b), a2.blockedOn = c2, false;
      b.shift();
    }
    return true;
  }
  function Zc(a2, b, c2) {
    Xc(a2) && c2.delete(b);
  }
  function $c() {
    Jc = false;
    null !== Lc && Xc(Lc) && (Lc = null);
    null !== Mc && Xc(Mc) && (Mc = null);
    null !== Nc && Xc(Nc) && (Nc = null);
    Oc.forEach(Zc);
    Pc.forEach(Zc);
  }
  function ad(a2, b) {
    a2.blockedOn === b && (a2.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
  }
  function bd(a2) {
    function b(b2) {
      return ad(b2, a2);
    }
    if (0 < Kc.length) {
      ad(Kc[0], a2);
      for (var c2 = 1; c2 < Kc.length; c2++) {
        var d = Kc[c2];
        d.blockedOn === a2 && (d.blockedOn = null);
      }
    }
    null !== Lc && ad(Lc, a2);
    null !== Mc && ad(Mc, a2);
    null !== Nc && ad(Nc, a2);
    Oc.forEach(b);
    Pc.forEach(b);
    for (c2 = 0; c2 < Qc.length; c2++) d = Qc[c2], d.blockedOn === a2 && (d.blockedOn = null);
    for (; 0 < Qc.length && (c2 = Qc[0], null === c2.blockedOn); ) Vc(c2), null === c2.blockedOn && Qc.shift();
  }
  var cd = ua.ReactCurrentBatchConfig, dd = true;
  function ed(a2, b, c2, d) {
    var e2 = C, f2 = cd.transition;
    cd.transition = null;
    try {
      C = 1, fd(a2, b, c2, d);
    } finally {
      C = e2, cd.transition = f2;
    }
  }
  function gd(a2, b, c2, d) {
    var e2 = C, f2 = cd.transition;
    cd.transition = null;
    try {
      C = 4, fd(a2, b, c2, d);
    } finally {
      C = e2, cd.transition = f2;
    }
  }
  function fd(a2, b, c2, d) {
    if (dd) {
      var e2 = Yc(a2, b, c2, d);
      if (null === e2) hd(a2, b, d, id, c2), Sc(a2, d);
      else if (Uc(e2, a2, b, c2, d)) d.stopPropagation();
      else if (Sc(a2, d), b & 4 && -1 < Rc.indexOf(a2)) {
        for (; null !== e2; ) {
          var f2 = Cb(e2);
          null !== f2 && Ec(f2);
          f2 = Yc(a2, b, c2, d);
          null === f2 && hd(a2, b, d, id, c2);
          if (f2 === e2) break;
          e2 = f2;
        }
        null !== e2 && d.stopPropagation();
      } else hd(a2, b, d, null, c2);
    }
  }
  var id = null;
  function Yc(a2, b, c2, d) {
    id = null;
    a2 = xb(d);
    a2 = Wc(a2);
    if (null !== a2) if (b = Vb(a2), null === b) a2 = null;
    else if (c2 = b.tag, 13 === c2) {
      a2 = Wb(b);
      if (null !== a2) return a2;
      a2 = null;
    } else if (3 === c2) {
      if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
      a2 = null;
    } else b !== a2 && (a2 = null);
    id = a2;
    return null;
  }
  function jd(a2) {
    switch (a2) {
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 1;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "toggle":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 4;
      case "message":
        switch (ec()) {
          case fc:
            return 1;
          case gc:
            return 4;
          case hc:
          case ic:
            return 16;
          case jc:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var kd = null, ld = null, md = null;
  function nd() {
    if (md) return md;
    var a2, b = ld, c2 = b.length, d, e2 = "value" in kd ? kd.value : kd.textContent, f2 = e2.length;
    for (a2 = 0; a2 < c2 && b[a2] === e2[a2]; a2++) ;
    var g = c2 - a2;
    for (d = 1; d <= g && b[c2 - d] === e2[f2 - d]; d++) ;
    return md = e2.slice(a2, 1 < d ? 1 - d : void 0);
  }
  function od(a2) {
    var b = a2.keyCode;
    "charCode" in a2 ? (a2 = a2.charCode, 0 === a2 && 13 === b && (a2 = 13)) : a2 = b;
    10 === a2 && (a2 = 13);
    return 32 <= a2 || 13 === a2 ? a2 : 0;
  }
  function pd() {
    return true;
  }
  function qd() {
    return false;
  }
  function rd(a2) {
    function b(b2, d, e2, f2, g) {
      this._reactName = b2;
      this._targetInst = e2;
      this.type = d;
      this.nativeEvent = f2;
      this.target = g;
      this.currentTarget = null;
      for (var c2 in a2) a2.hasOwnProperty(c2) && (b2 = a2[c2], this[c2] = b2 ? b2(f2) : f2[c2]);
      this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
      this.isPropagationStopped = qd;
      return this;
    }
    A(b.prototype, { preventDefault: function() {
      this.defaultPrevented = true;
      var a3 = this.nativeEvent;
      a3 && (a3.preventDefault ? a3.preventDefault() : "unknown" !== typeof a3.returnValue && (a3.returnValue = false), this.isDefaultPrevented = pd);
    }, stopPropagation: function() {
      var a3 = this.nativeEvent;
      a3 && (a3.stopPropagation ? a3.stopPropagation() : "unknown" !== typeof a3.cancelBubble && (a3.cancelBubble = true), this.isPropagationStopped = pd);
    }, persist: function() {
    }, isPersistent: pd });
    return b;
  }
  var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a2) {
    return a2.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a2) {
    return void 0 === a2.relatedTarget ? a2.fromElement === a2.srcElement ? a2.toElement : a2.fromElement : a2.relatedTarget;
  }, movementX: function(a2) {
    if ("movementX" in a2) return a2.movementX;
    a2 !== yd && (yd && "mousemove" === a2.type ? (wd = a2.screenX - yd.screenX, xd = a2.screenY - yd.screenY) : xd = wd = 0, yd = a2);
    return wd;
  }, movementY: function(a2) {
    return "movementY" in a2 ? a2.movementY : xd;
  } }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a2) {
    return "clipboardData" in a2 ? a2.clipboardData : window.clipboardData;
  } }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Nd = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Pd(a2) {
    var b = this.nativeEvent;
    return b.getModifierState ? b.getModifierState(a2) : (a2 = Od[a2]) ? !!b[a2] : false;
  }
  function zd() {
    return Pd;
  }
  var Qd = A({}, ud, { key: function(a2) {
    if (a2.key) {
      var b = Md[a2.key] || a2.key;
      if ("Unidentified" !== b) return b;
    }
    return "keypress" === a2.type ? (a2 = od(a2), 13 === a2 ? "Enter" : String.fromCharCode(a2)) : "keydown" === a2.type || "keyup" === a2.type ? Nd[a2.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a2) {
    return "keypress" === a2.type ? od(a2) : 0;
  }, keyCode: function(a2) {
    return "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
  }, which: function(a2) {
    return "keypress" === a2.type ? od(a2) : "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
  } }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
    deltaX: function(a2) {
      return "deltaX" in a2 ? a2.deltaX : "wheelDeltaX" in a2 ? -a2.wheelDeltaX : 0;
    },
    deltaY: function(a2) {
      return "deltaY" in a2 ? a2.deltaY : "wheelDeltaY" in a2 ? -a2.wheelDeltaY : "wheelDelta" in a2 ? -a2.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
  ia && "documentMode" in document && (be = document.documentMode);
  var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
  function ge(a2, b) {
    switch (a2) {
      case "keyup":
        return -1 !== $d.indexOf(b.keyCode);
      case "keydown":
        return 229 !== b.keyCode;
      case "keypress":
      case "mousedown":
      case "focusout":
        return true;
      default:
        return false;
    }
  }
  function he(a2) {
    a2 = a2.detail;
    return "object" === typeof a2 && "data" in a2 ? a2.data : null;
  }
  var ie = false;
  function je(a2, b) {
    switch (a2) {
      case "compositionend":
        return he(b);
      case "keypress":
        if (32 !== b.which) return null;
        fe = true;
        return ee;
      case "textInput":
        return a2 = b.data, a2 === ee && fe ? null : a2;
      default:
        return null;
    }
  }
  function ke(a2, b) {
    if (ie) return "compositionend" === a2 || !ae && ge(a2, b) ? (a2 = nd(), md = ld = kd = null, ie = false, a2) : null;
    switch (a2) {
      case "paste":
        return null;
      case "keypress":
        if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
          if (b.char && 1 < b.char.length) return b.char;
          if (b.which) return String.fromCharCode(b.which);
        }
        return null;
      case "compositionend":
        return de && "ko" !== b.locale ? null : b.data;
      default:
        return null;
    }
  }
  var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
  function me(a2) {
    var b = a2 && a2.nodeName && a2.nodeName.toLowerCase();
    return "input" === b ? !!le[a2.type] : "textarea" === b ? true : false;
  }
  function ne(a2, b, c2, d) {
    Eb(d);
    b = oe(b, "onChange");
    0 < b.length && (c2 = new td("onChange", "change", null, c2, d), a2.push({ event: c2, listeners: b }));
  }
  var pe = null, qe = null;
  function re2(a2) {
    se(a2, 0);
  }
  function te(a2) {
    var b = ue(a2);
    if (Wa(b)) return a2;
  }
  function ve(a2, b) {
    if ("change" === a2) return b;
  }
  var we = false;
  if (ia) {
    var xe;
    if (ia) {
      var ye = "oninput" in document;
      if (!ye) {
        var ze = document.createElement("div");
        ze.setAttribute("oninput", "return;");
        ye = "function" === typeof ze.oninput;
      }
      xe = ye;
    } else xe = false;
    we = xe && (!document.documentMode || 9 < document.documentMode);
  }
  function Ae() {
    pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
  }
  function Be(a2) {
    if ("value" === a2.propertyName && te(qe)) {
      var b = [];
      ne(b, qe, a2, xb(a2));
      Jb(re2, b);
    }
  }
  function Ce(a2, b, c2) {
    "focusin" === a2 ? (Ae(), pe = b, qe = c2, pe.attachEvent("onpropertychange", Be)) : "focusout" === a2 && Ae();
  }
  function De(a2) {
    if ("selectionchange" === a2 || "keyup" === a2 || "keydown" === a2) return te(qe);
  }
  function Ee(a2, b) {
    if ("click" === a2) return te(b);
  }
  function Fe(a2, b) {
    if ("input" === a2 || "change" === a2) return te(b);
  }
  function Ge(a2, b) {
    return a2 === b && (0 !== a2 || 1 / a2 === 1 / b) || a2 !== a2 && b !== b;
  }
  var He = "function" === typeof Object.is ? Object.is : Ge;
  function Ie(a2, b) {
    if (He(a2, b)) return true;
    if ("object" !== typeof a2 || null === a2 || "object" !== typeof b || null === b) return false;
    var c2 = Object.keys(a2), d = Object.keys(b);
    if (c2.length !== d.length) return false;
    for (d = 0; d < c2.length; d++) {
      var e2 = c2[d];
      if (!ja.call(b, e2) || !He(a2[e2], b[e2])) return false;
    }
    return true;
  }
  function Je(a2) {
    for (; a2 && a2.firstChild; ) a2 = a2.firstChild;
    return a2;
  }
  function Ke(a2, b) {
    var c2 = Je(a2);
    a2 = 0;
    for (var d; c2; ) {
      if (3 === c2.nodeType) {
        d = a2 + c2.textContent.length;
        if (a2 <= b && d >= b) return { node: c2, offset: b - a2 };
        a2 = d;
      }
      a: {
        for (; c2; ) {
          if (c2.nextSibling) {
            c2 = c2.nextSibling;
            break a;
          }
          c2 = c2.parentNode;
        }
        c2 = void 0;
      }
      c2 = Je(c2);
    }
  }
  function Le(a2, b) {
    return a2 && b ? a2 === b ? true : a2 && 3 === a2.nodeType ? false : b && 3 === b.nodeType ? Le(a2, b.parentNode) : "contains" in a2 ? a2.contains(b) : a2.compareDocumentPosition ? !!(a2.compareDocumentPosition(b) & 16) : false : false;
  }
  function Me() {
    for (var a2 = window, b = Xa(); b instanceof a2.HTMLIFrameElement; ) {
      try {
        var c2 = "string" === typeof b.contentWindow.location.href;
      } catch (d) {
        c2 = false;
      }
      if (c2) a2 = b.contentWindow;
      else break;
      b = Xa(a2.document);
    }
    return b;
  }
  function Ne(a2) {
    var b = a2 && a2.nodeName && a2.nodeName.toLowerCase();
    return b && ("input" === b && ("text" === a2.type || "search" === a2.type || "tel" === a2.type || "url" === a2.type || "password" === a2.type) || "textarea" === b || "true" === a2.contentEditable);
  }
  function Oe(a2) {
    var b = Me(), c2 = a2.focusedElem, d = a2.selectionRange;
    if (b !== c2 && c2 && c2.ownerDocument && Le(c2.ownerDocument.documentElement, c2)) {
      if (null !== d && Ne(c2)) {
        if (b = d.start, a2 = d.end, void 0 === a2 && (a2 = b), "selectionStart" in c2) c2.selectionStart = b, c2.selectionEnd = Math.min(a2, c2.value.length);
        else if (a2 = (b = c2.ownerDocument || document) && b.defaultView || window, a2.getSelection) {
          a2 = a2.getSelection();
          var e2 = c2.textContent.length, f2 = Math.min(d.start, e2);
          d = void 0 === d.end ? f2 : Math.min(d.end, e2);
          !a2.extend && f2 > d && (e2 = d, d = f2, f2 = e2);
          e2 = Ke(c2, f2);
          var g = Ke(
            c2,
            d
          );
          e2 && g && (1 !== a2.rangeCount || a2.anchorNode !== e2.node || a2.anchorOffset !== e2.offset || a2.focusNode !== g.node || a2.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e2.node, e2.offset), a2.removeAllRanges(), f2 > d ? (a2.addRange(b), a2.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a2.addRange(b)));
        }
      }
      b = [];
      for (a2 = c2; a2 = a2.parentNode; ) 1 === a2.nodeType && b.push({ element: a2, left: a2.scrollLeft, top: a2.scrollTop });
      "function" === typeof c2.focus && c2.focus();
      for (c2 = 0; c2 < b.length; c2++) a2 = b[c2], a2.element.scrollLeft = a2.left, a2.element.scrollTop = a2.top;
    }
  }
  var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
  function Ue(a2, b, c2) {
    var d = c2.window === c2 ? c2.document : 9 === c2.nodeType ? c2 : c2.ownerDocument;
    Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c2), a2.push({ event: b, listeners: d }), b.target = Qe)));
  }
  function Ve(a2, b) {
    var c2 = {};
    c2[a2.toLowerCase()] = b.toLowerCase();
    c2["Webkit" + a2] = "webkit" + b;
    c2["Moz" + a2] = "moz" + b;
    return c2;
  }
  var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
  ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
  function Ze(a2) {
    if (Xe[a2]) return Xe[a2];
    if (!We[a2]) return a2;
    var b = We[a2], c2;
    for (c2 in b) if (b.hasOwnProperty(c2) && c2 in Ye) return Xe[a2] = b[c2];
    return a2;
  }
  var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function ff(a2, b) {
    df.set(a2, b);
    fa(b, [a2]);
  }
  for (var gf = 0; gf < ef.length; gf++) {
    var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
    ff(jf, "on" + kf);
  }
  ff($e, "onAnimationEnd");
  ff(af, "onAnimationIteration");
  ff(bf, "onAnimationStart");
  ff("dblclick", "onDoubleClick");
  ff("focusin", "onFocus");
  ff("focusout", "onBlur");
  ff(cf, "onTransitionEnd");
  ha("onMouseEnter", ["mouseout", "mouseover"]);
  ha("onMouseLeave", ["mouseout", "mouseover"]);
  ha("onPointerEnter", ["pointerout", "pointerover"]);
  ha("onPointerLeave", ["pointerout", "pointerover"]);
  fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
  fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
  fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
  fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
  fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
  fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
  function nf(a2, b, c2) {
    var d = a2.type || "unknown-event";
    a2.currentTarget = c2;
    Ub(d, b, void 0, a2);
    a2.currentTarget = null;
  }
  function se(a2, b) {
    b = 0 !== (b & 4);
    for (var c2 = 0; c2 < a2.length; c2++) {
      var d = a2[c2], e2 = d.event;
      d = d.listeners;
      a: {
        var f2 = void 0;
        if (b) for (var g = d.length - 1; 0 <= g; g--) {
          var h = d[g], k = h.instance, l2 = h.currentTarget;
          h = h.listener;
          if (k !== f2 && e2.isPropagationStopped()) break a;
          nf(e2, h, l2);
          f2 = k;
        }
        else for (g = 0; g < d.length; g++) {
          h = d[g];
          k = h.instance;
          l2 = h.currentTarget;
          h = h.listener;
          if (k !== f2 && e2.isPropagationStopped()) break a;
          nf(e2, h, l2);
          f2 = k;
        }
      }
    }
    if (Qb) throw a2 = Rb, Qb = false, Rb = null, a2;
  }
  function D(a2, b) {
    var c2 = b[of];
    void 0 === c2 && (c2 = b[of] = /* @__PURE__ */ new Set());
    var d = a2 + "__bubble";
    c2.has(d) || (pf(b, a2, 2, false), c2.add(d));
  }
  function qf(a2, b, c2) {
    var d = 0;
    b && (d |= 4);
    pf(c2, a2, d, b);
  }
  var rf = "_reactListening" + Math.random().toString(36).slice(2);
  function sf(a2) {
    if (!a2[rf]) {
      a2[rf] = true;
      da.forEach(function(b2) {
        "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a2), qf(b2, true, a2));
      });
      var b = 9 === a2.nodeType ? a2 : a2.ownerDocument;
      null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
    }
  }
  function pf(a2, b, c2, d) {
    switch (jd(b)) {
      case 1:
        var e2 = ed;
        break;
      case 4:
        e2 = gd;
        break;
      default:
        e2 = fd;
    }
    c2 = e2.bind(null, b, c2, a2);
    e2 = void 0;
    !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e2 = true);
    d ? void 0 !== e2 ? a2.addEventListener(b, c2, { capture: true, passive: e2 }) : a2.addEventListener(b, c2, true) : void 0 !== e2 ? a2.addEventListener(b, c2, { passive: e2 }) : a2.addEventListener(b, c2, false);
  }
  function hd(a2, b, c2, d, e2) {
    var f2 = d;
    if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
      if (null === d) return;
      var g = d.tag;
      if (3 === g || 4 === g) {
        var h = d.stateNode.containerInfo;
        if (h === e2 || 8 === h.nodeType && h.parentNode === e2) break;
        if (4 === g) for (g = d.return; null !== g; ) {
          var k = g.tag;
          if (3 === k || 4 === k) {
            if (k = g.stateNode.containerInfo, k === e2 || 8 === k.nodeType && k.parentNode === e2) return;
          }
          g = g.return;
        }
        for (; null !== h; ) {
          g = Wc(h);
          if (null === g) return;
          k = g.tag;
          if (5 === k || 6 === k) {
            d = f2 = g;
            continue a;
          }
          h = h.parentNode;
        }
      }
      d = d.return;
    }
    Jb(function() {
      var d2 = f2, e3 = xb(c2), g2 = [];
      a: {
        var h2 = df.get(a2);
        if (void 0 !== h2) {
          var k2 = td, n = a2;
          switch (a2) {
            case "keypress":
              if (0 === od(c2)) break a;
            case "keydown":
            case "keyup":
              k2 = Rd;
              break;
            case "focusin":
              n = "focus";
              k2 = Fd;
              break;
            case "focusout":
              n = "blur";
              k2 = Fd;
              break;
            case "beforeblur":
            case "afterblur":
              k2 = Fd;
              break;
            case "click":
              if (2 === c2.button) break a;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              k2 = Bd;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              k2 = Dd;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              k2 = Vd;
              break;
            case $e:
            case af:
            case bf:
              k2 = Hd;
              break;
            case cf:
              k2 = Xd;
              break;
            case "scroll":
              k2 = vd;
              break;
            case "wheel":
              k2 = Zd;
              break;
            case "copy":
            case "cut":
            case "paste":
              k2 = Jd;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              k2 = Td;
          }
          var t2 = 0 !== (b & 4), J = !t2 && "scroll" === a2, x = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
          t2 = [];
          for (var w = d2, u; null !== w; ) {
            u = w;
            var F = u.stateNode;
            5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t2.push(tf(w, F, u))));
            if (J) break;
            w = w.return;
          }
          0 < t2.length && (h2 = new k2(h2, n, null, c2, e3), g2.push({ event: h2, listeners: t2 }));
        }
      }
      if (0 === (b & 7)) {
        a: {
          h2 = "mouseover" === a2 || "pointerover" === a2;
          k2 = "mouseout" === a2 || "pointerout" === a2;
          if (h2 && c2 !== wb && (n = c2.relatedTarget || c2.fromElement) && (Wc(n) || n[uf])) break a;
          if (k2 || h2) {
            h2 = e3.window === e3 ? e3 : (h2 = e3.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
            if (k2) {
              if (n = c2.relatedTarget || c2.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
            } else k2 = null, n = d2;
            if (k2 !== n) {
              t2 = Bd;
              F = "onMouseLeave";
              x = "onMouseEnter";
              w = "mouse";
              if ("pointerout" === a2 || "pointerover" === a2) t2 = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
              J = null == k2 ? h2 : ue(k2);
              u = null == n ? h2 : ue(n);
              h2 = new t2(F, w + "leave", k2, c2, e3);
              h2.target = J;
              h2.relatedTarget = u;
              F = null;
              Wc(e3) === d2 && (t2 = new t2(x, w + "enter", n, c2, e3), t2.target = u, t2.relatedTarget = J, F = t2);
              J = F;
              if (k2 && n) b: {
                t2 = k2;
                x = n;
                w = 0;
                for (u = t2; u; u = vf(u)) w++;
                u = 0;
                for (F = x; F; F = vf(F)) u++;
                for (; 0 < w - u; ) t2 = vf(t2), w--;
                for (; 0 < u - w; ) x = vf(x), u--;
                for (; w--; ) {
                  if (t2 === x || null !== x && t2 === x.alternate) break b;
                  t2 = vf(t2);
                  x = vf(x);
                }
                t2 = null;
              }
              else t2 = null;
              null !== k2 && wf(g2, h2, k2, t2, false);
              null !== n && null !== J && wf(g2, J, n, t2, true);
            }
          }
        }
        a: {
          h2 = d2 ? ue(d2) : window;
          k2 = h2.nodeName && h2.nodeName.toLowerCase();
          if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
          else if (me(h2)) if (we) na = Fe;
          else {
            na = De;
            var xa = Ce;
          }
          else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
          if (na && (na = na(a2, d2))) {
            ne(g2, na, c2, e3);
            break a;
          }
          xa && xa(a2, h2, d2);
          "focusout" === a2 && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
        }
        xa = d2 ? ue(d2) : window;
        switch (a2) {
          case "focusin":
            if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
            break;
          case "focusout":
            Se = Re = Qe = null;
            break;
          case "mousedown":
            Te = true;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Te = false;
            Ue(g2, c2, e3);
            break;
          case "selectionchange":
            if (Pe) break;
          case "keydown":
          case "keyup":
            Ue(g2, c2, e3);
        }
        var $a;
        if (ae) b: {
          switch (a2) {
            case "compositionstart":
              var ba = "onCompositionStart";
              break b;
            case "compositionend":
              ba = "onCompositionEnd";
              break b;
            case "compositionupdate":
              ba = "onCompositionUpdate";
              break b;
          }
          ba = void 0;
        }
        else ie ? ge(a2, c2) && (ba = "onCompositionEnd") : "keydown" === a2 && 229 === c2.keyCode && (ba = "onCompositionStart");
        ba && (de && "ko" !== c2.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e3, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a2, null, c2, e3), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c2), null !== $a && (ba.data = $a))));
        if ($a = ce ? je(a2, c2) : ke(a2, c2)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e3 = new Ld("onBeforeInput", "beforeinput", null, c2, e3), g2.push({ event: e3, listeners: d2 }), e3.data = $a);
      }
      se(g2, b);
    });
  }
  function tf(a2, b, c2) {
    return { instance: a2, listener: b, currentTarget: c2 };
  }
  function oe(a2, b) {
    for (var c2 = b + "Capture", d = []; null !== a2; ) {
      var e2 = a2, f2 = e2.stateNode;
      5 === e2.tag && null !== f2 && (e2 = f2, f2 = Kb(a2, c2), null != f2 && d.unshift(tf(a2, f2, e2)), f2 = Kb(a2, b), null != f2 && d.push(tf(a2, f2, e2)));
      a2 = a2.return;
    }
    return d;
  }
  function vf(a2) {
    if (null === a2) return null;
    do
      a2 = a2.return;
    while (a2 && 5 !== a2.tag);
    return a2 ? a2 : null;
  }
  function wf(a2, b, c2, d, e2) {
    for (var f2 = b._reactName, g = []; null !== c2 && c2 !== d; ) {
      var h = c2, k = h.alternate, l2 = h.stateNode;
      if (null !== k && k === d) break;
      5 === h.tag && null !== l2 && (h = l2, e2 ? (k = Kb(c2, f2), null != k && g.unshift(tf(c2, k, h))) : e2 || (k = Kb(c2, f2), null != k && g.push(tf(c2, k, h))));
      c2 = c2.return;
    }
    0 !== g.length && a2.push({ event: b, listeners: g });
  }
  var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
  function zf(a2) {
    return ("string" === typeof a2 ? a2 : "" + a2).replace(xf, "\n").replace(yf, "");
  }
  function Af(a2, b, c2) {
    b = zf(b);
    if (zf(a2) !== b && c2) throw Error(p(425));
  }
  function Bf() {
  }
  var Cf = null, Df = null;
  function Ef(a2, b) {
    return "textarea" === a2 || "noscript" === a2 || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
  }
  var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a2) {
    return Hf.resolve(null).then(a2).catch(If);
  } : Ff;
  function If(a2) {
    setTimeout(function() {
      throw a2;
    });
  }
  function Kf(a2, b) {
    var c2 = b, d = 0;
    do {
      var e2 = c2.nextSibling;
      a2.removeChild(c2);
      if (e2 && 8 === e2.nodeType) if (c2 = e2.data, "/$" === c2) {
        if (0 === d) {
          a2.removeChild(e2);
          bd(b);
          return;
        }
        d--;
      } else "$" !== c2 && "$?" !== c2 && "$!" !== c2 || d++;
      c2 = e2;
    } while (c2);
    bd(b);
  }
  function Lf(a2) {
    for (; null != a2; a2 = a2.nextSibling) {
      var b = a2.nodeType;
      if (1 === b || 3 === b) break;
      if (8 === b) {
        b = a2.data;
        if ("$" === b || "$!" === b || "$?" === b) break;
        if ("/$" === b) return null;
      }
    }
    return a2;
  }
  function Mf(a2) {
    a2 = a2.previousSibling;
    for (var b = 0; a2; ) {
      if (8 === a2.nodeType) {
        var c2 = a2.data;
        if ("$" === c2 || "$!" === c2 || "$?" === c2) {
          if (0 === b) return a2;
          b--;
        } else "/$" === c2 && b++;
      }
      a2 = a2.previousSibling;
    }
    return null;
  }
  var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
  function Wc(a2) {
    var b = a2[Of];
    if (b) return b;
    for (var c2 = a2.parentNode; c2; ) {
      if (b = c2[uf] || c2[Of]) {
        c2 = b.alternate;
        if (null !== b.child || null !== c2 && null !== c2.child) for (a2 = Mf(a2); null !== a2; ) {
          if (c2 = a2[Of]) return c2;
          a2 = Mf(a2);
        }
        return b;
      }
      a2 = c2;
      c2 = a2.parentNode;
    }
    return null;
  }
  function Cb(a2) {
    a2 = a2[Of] || a2[uf];
    return !a2 || 5 !== a2.tag && 6 !== a2.tag && 13 !== a2.tag && 3 !== a2.tag ? null : a2;
  }
  function ue(a2) {
    if (5 === a2.tag || 6 === a2.tag) return a2.stateNode;
    throw Error(p(33));
  }
  function Db(a2) {
    return a2[Pf] || null;
  }
  var Sf = [], Tf = -1;
  function Uf(a2) {
    return { current: a2 };
  }
  function E(a2) {
    0 > Tf || (a2.current = Sf[Tf], Sf[Tf] = null, Tf--);
  }
  function G2(a2, b) {
    Tf++;
    Sf[Tf] = a2.current;
    a2.current = b;
  }
  var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
  function Yf(a2, b) {
    var c2 = a2.type.contextTypes;
    if (!c2) return Vf;
    var d = a2.stateNode;
    if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
    var e2 = {}, f2;
    for (f2 in c2) e2[f2] = b[f2];
    d && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = b, a2.__reactInternalMemoizedMaskedChildContext = e2);
    return e2;
  }
  function Zf(a2) {
    a2 = a2.childContextTypes;
    return null !== a2 && void 0 !== a2;
  }
  function $f() {
    E(Wf);
    E(H);
  }
  function ag(a2, b, c2) {
    if (H.current !== Vf) throw Error(p(168));
    G2(H, b);
    G2(Wf, c2);
  }
  function bg(a2, b, c2) {
    var d = a2.stateNode;
    b = b.childContextTypes;
    if ("function" !== typeof d.getChildContext) return c2;
    d = d.getChildContext();
    for (var e2 in d) if (!(e2 in b)) throw Error(p(108, Ra(a2) || "Unknown", e2));
    return A({}, c2, d);
  }
  function cg(a2) {
    a2 = (a2 = a2.stateNode) && a2.__reactInternalMemoizedMergedChildContext || Vf;
    Xf = H.current;
    G2(H, a2);
    G2(Wf, Wf.current);
    return true;
  }
  function dg(a2, b, c2) {
    var d = a2.stateNode;
    if (!d) throw Error(p(169));
    c2 ? (a2 = bg(a2, b, Xf), d.__reactInternalMemoizedMergedChildContext = a2, E(Wf), E(H), G2(H, a2)) : E(Wf);
    G2(Wf, c2);
  }
  var eg = null, fg = false, gg = false;
  function hg(a2) {
    null === eg ? eg = [a2] : eg.push(a2);
  }
  function ig(a2) {
    fg = true;
    hg(a2);
  }
  function jg() {
    if (!gg && null !== eg) {
      gg = true;
      var a2 = 0, b = C;
      try {
        var c2 = eg;
        for (C = 1; a2 < c2.length; a2++) {
          var d = c2[a2];
          do
            d = d(true);
          while (null !== d);
        }
        eg = null;
        fg = false;
      } catch (e2) {
        throw null !== eg && (eg = eg.slice(a2 + 1)), ac(fc, jg), e2;
      } finally {
        C = b, gg = false;
      }
    }
    return null;
  }
  var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
  function tg(a2, b) {
    kg[lg++] = ng;
    kg[lg++] = mg;
    mg = a2;
    ng = b;
  }
  function ug(a2, b, c2) {
    og[pg++] = rg;
    og[pg++] = sg;
    og[pg++] = qg;
    qg = a2;
    var d = rg;
    a2 = sg;
    var e2 = 32 - oc(d) - 1;
    d &= ~(1 << e2);
    c2 += 1;
    var f2 = 32 - oc(b) + e2;
    if (30 < f2) {
      var g = e2 - e2 % 5;
      f2 = (d & (1 << g) - 1).toString(32);
      d >>= g;
      e2 -= g;
      rg = 1 << 32 - oc(b) + e2 | c2 << e2 | d;
      sg = f2 + a2;
    } else rg = 1 << f2 | c2 << e2 | d, sg = a2;
  }
  function vg(a2) {
    null !== a2.return && (tg(a2, 1), ug(a2, 1, 0));
  }
  function wg(a2) {
    for (; a2 === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
    for (; a2 === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
  }
  var xg = null, yg = null, I = false, zg = null;
  function Ag(a2, b) {
    var c2 = Bg(5, null, null, 0);
    c2.elementType = "DELETED";
    c2.stateNode = b;
    c2.return = a2;
    b = a2.deletions;
    null === b ? (a2.deletions = [c2], a2.flags |= 16) : b.push(c2);
  }
  function Cg(a2, b) {
    switch (a2.tag) {
      case 5:
        var c2 = a2.type;
        b = 1 !== b.nodeType || c2.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
        return null !== b ? (a2.stateNode = b, xg = a2, yg = Lf(b.firstChild), true) : false;
      case 6:
        return b = "" === a2.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a2.stateNode = b, xg = a2, yg = null, true) : false;
      case 13:
        return b = 8 !== b.nodeType ? null : b, null !== b ? (c2 = null !== qg ? { id: rg, overflow: sg } : null, a2.memoizedState = { dehydrated: b, treeContext: c2, retryLane: 1073741824 }, c2 = Bg(18, null, null, 0), c2.stateNode = b, c2.return = a2, a2.child = c2, xg = a2, yg = null, true) : false;
      default:
        return false;
    }
  }
  function Dg(a2) {
    return 0 !== (a2.mode & 1) && 0 === (a2.flags & 128);
  }
  function Eg(a2) {
    if (I) {
      var b = yg;
      if (b) {
        var c2 = b;
        if (!Cg(a2, b)) {
          if (Dg(a2)) throw Error(p(418));
          b = Lf(c2.nextSibling);
          var d = xg;
          b && Cg(a2, b) ? Ag(d, c2) : (a2.flags = a2.flags & -4097 | 2, I = false, xg = a2);
        }
      } else {
        if (Dg(a2)) throw Error(p(418));
        a2.flags = a2.flags & -4097 | 2;
        I = false;
        xg = a2;
      }
    }
  }
  function Fg(a2) {
    for (a2 = a2.return; null !== a2 && 5 !== a2.tag && 3 !== a2.tag && 13 !== a2.tag; ) a2 = a2.return;
    xg = a2;
  }
  function Gg(a2) {
    if (a2 !== xg) return false;
    if (!I) return Fg(a2), I = true, false;
    var b;
    (b = 3 !== a2.tag) && !(b = 5 !== a2.tag) && (b = a2.type, b = "head" !== b && "body" !== b && !Ef(a2.type, a2.memoizedProps));
    if (b && (b = yg)) {
      if (Dg(a2)) throw Hg(), Error(p(418));
      for (; b; ) Ag(a2, b), b = Lf(b.nextSibling);
    }
    Fg(a2);
    if (13 === a2.tag) {
      a2 = a2.memoizedState;
      a2 = null !== a2 ? a2.dehydrated : null;
      if (!a2) throw Error(p(317));
      a: {
        a2 = a2.nextSibling;
        for (b = 0; a2; ) {
          if (8 === a2.nodeType) {
            var c2 = a2.data;
            if ("/$" === c2) {
              if (0 === b) {
                yg = Lf(a2.nextSibling);
                break a;
              }
              b--;
            } else "$" !== c2 && "$!" !== c2 && "$?" !== c2 || b++;
          }
          a2 = a2.nextSibling;
        }
        yg = null;
      }
    } else yg = xg ? Lf(a2.stateNode.nextSibling) : null;
    return true;
  }
  function Hg() {
    for (var a2 = yg; a2; ) a2 = Lf(a2.nextSibling);
  }
  function Ig() {
    yg = xg = null;
    I = false;
  }
  function Jg(a2) {
    null === zg ? zg = [a2] : zg.push(a2);
  }
  var Kg = ua.ReactCurrentBatchConfig;
  function Lg(a2, b, c2) {
    a2 = c2.ref;
    if (null !== a2 && "function" !== typeof a2 && "object" !== typeof a2) {
      if (c2._owner) {
        c2 = c2._owner;
        if (c2) {
          if (1 !== c2.tag) throw Error(p(309));
          var d = c2.stateNode;
        }
        if (!d) throw Error(p(147, a2));
        var e2 = d, f2 = "" + a2;
        if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
        b = function(a3) {
          var b2 = e2.refs;
          null === a3 ? delete b2[f2] : b2[f2] = a3;
        };
        b._stringRef = f2;
        return b;
      }
      if ("string" !== typeof a2) throw Error(p(284));
      if (!c2._owner) throw Error(p(290, a2));
    }
    return a2;
  }
  function Mg(a2, b) {
    a2 = Object.prototype.toString.call(b);
    throw Error(p(31, "[object Object]" === a2 ? "object with keys {" + Object.keys(b).join(", ") + "}" : a2));
  }
  function Ng(a2) {
    var b = a2._init;
    return b(a2._payload);
  }
  function Og(a2) {
    function b(b2, c3) {
      if (a2) {
        var d2 = b2.deletions;
        null === d2 ? (b2.deletions = [c3], b2.flags |= 16) : d2.push(c3);
      }
    }
    function c2(c3, d2) {
      if (!a2) return null;
      for (; null !== d2; ) b(c3, d2), d2 = d2.sibling;
      return null;
    }
    function d(a3, b2) {
      for (a3 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a3.set(b2.key, b2) : a3.set(b2.index, b2), b2 = b2.sibling;
      return a3;
    }
    function e2(a3, b2) {
      a3 = Pg(a3, b2);
      a3.index = 0;
      a3.sibling = null;
      return a3;
    }
    function f2(b2, c3, d2) {
      b2.index = d2;
      if (!a2) return b2.flags |= 1048576, c3;
      d2 = b2.alternate;
      if (null !== d2) return d2 = d2.index, d2 < c3 ? (b2.flags |= 2, c3) : d2;
      b2.flags |= 2;
      return c3;
    }
    function g(b2) {
      a2 && null === b2.alternate && (b2.flags |= 2);
      return b2;
    }
    function h(a3, b2, c3, d2) {
      if (null === b2 || 6 !== b2.tag) return b2 = Qg(c3, a3.mode, d2), b2.return = a3, b2;
      b2 = e2(b2, c3);
      b2.return = a3;
      return b2;
    }
    function k(a3, b2, c3, d2) {
      var f3 = c3.type;
      if (f3 === ya) return m(a3, b2, c3.props.children, d2, c3.key);
      if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e2(b2, c3.props), d2.ref = Lg(a3, b2, c3), d2.return = a3, d2;
      d2 = Rg(c3.type, c3.key, c3.props, null, a3.mode, d2);
      d2.ref = Lg(a3, b2, c3);
      d2.return = a3;
      return d2;
    }
    function l2(a3, b2, c3, d2) {
      if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c3.containerInfo || b2.stateNode.implementation !== c3.implementation) return b2 = Sg(c3, a3.mode, d2), b2.return = a3, b2;
      b2 = e2(b2, c3.children || []);
      b2.return = a3;
      return b2;
    }
    function m(a3, b2, c3, d2, f3) {
      if (null === b2 || 7 !== b2.tag) return b2 = Tg(c3, a3.mode, d2, f3), b2.return = a3, b2;
      b2 = e2(b2, c3);
      b2.return = a3;
      return b2;
    }
    function q(a3, b2, c3) {
      if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a3.mode, c3), b2.return = a3, b2;
      if ("object" === typeof b2 && null !== b2) {
        switch (b2.$$typeof) {
          case va:
            return c3 = Rg(b2.type, b2.key, b2.props, null, a3.mode, c3), c3.ref = Lg(a3, null, b2), c3.return = a3, c3;
          case wa:
            return b2 = Sg(b2, a3.mode, c3), b2.return = a3, b2;
          case Ha:
            var d2 = b2._init;
            return q(a3, d2(b2._payload), c3);
        }
        if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a3.mode, c3, null), b2.return = a3, b2;
        Mg(a3, b2);
      }
      return null;
    }
    function r2(a3, b2, c3, d2) {
      var e3 = null !== b2 ? b2.key : null;
      if ("string" === typeof c3 && "" !== c3 || "number" === typeof c3) return null !== e3 ? null : h(a3, b2, "" + c3, d2);
      if ("object" === typeof c3 && null !== c3) {
        switch (c3.$$typeof) {
          case va:
            return c3.key === e3 ? k(a3, b2, c3, d2) : null;
          case wa:
            return c3.key === e3 ? l2(a3, b2, c3, d2) : null;
          case Ha:
            return e3 = c3._init, r2(
              a3,
              b2,
              e3(c3._payload),
              d2
            );
        }
        if (eb(c3) || Ka(c3)) return null !== e3 ? null : m(a3, b2, c3, d2, null);
        Mg(a3, c3);
      }
      return null;
    }
    function y(a3, b2, c3, d2, e3) {
      if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a3 = a3.get(c3) || null, h(b2, a3, "" + d2, e3);
      if ("object" === typeof d2 && null !== d2) {
        switch (d2.$$typeof) {
          case va:
            return a3 = a3.get(null === d2.key ? c3 : d2.key) || null, k(b2, a3, d2, e3);
          case wa:
            return a3 = a3.get(null === d2.key ? c3 : d2.key) || null, l2(b2, a3, d2, e3);
          case Ha:
            var f3 = d2._init;
            return y(a3, b2, c3, f3(d2._payload), e3);
        }
        if (eb(d2) || Ka(d2)) return a3 = a3.get(c3) || null, m(b2, a3, d2, e3, null);
        Mg(b2, d2);
      }
      return null;
    }
    function n(e3, g2, h2, k2) {
      for (var l3 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
        u.index > w ? (x = u, u = null) : x = u.sibling;
        var n2 = r2(e3, u, h2[w], k2);
        if (null === n2) {
          null === u && (u = x);
          break;
        }
        a2 && u && null === n2.alternate && b(e3, u);
        g2 = f2(n2, g2, w);
        null === m2 ? l3 = n2 : m2.sibling = n2;
        m2 = n2;
        u = x;
      }
      if (w === h2.length) return c2(e3, u), I && tg(e3, w), l3;
      if (null === u) {
        for (; w < h2.length; w++) u = q(e3, h2[w], k2), null !== u && (g2 = f2(u, g2, w), null === m2 ? l3 = u : m2.sibling = u, m2 = u);
        I && tg(e3, w);
        return l3;
      }
      for (u = d(e3, u); w < h2.length; w++) x = y(u, e3, w, h2[w], k2), null !== x && (a2 && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f2(x, g2, w), null === m2 ? l3 = x : m2.sibling = x, m2 = x);
      a2 && u.forEach(function(a3) {
        return b(e3, a3);
      });
      I && tg(e3, w);
      return l3;
    }
    function t2(e3, g2, h2, k2) {
      var l3 = Ka(h2);
      if ("function" !== typeof l3) throw Error(p(150));
      h2 = l3.call(h2);
      if (null == h2) throw Error(p(151));
      for (var u = l3 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
        m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
        var t3 = r2(e3, m2, n2.value, k2);
        if (null === t3) {
          null === m2 && (m2 = x);
          break;
        }
        a2 && m2 && null === t3.alternate && b(e3, m2);
        g2 = f2(t3, g2, w);
        null === u ? l3 = t3 : u.sibling = t3;
        u = t3;
        m2 = x;
      }
      if (n2.done) return c2(
        e3,
        m2
      ), I && tg(e3, w), l3;
      if (null === m2) {
        for (; !n2.done; w++, n2 = h2.next()) n2 = q(e3, n2.value, k2), null !== n2 && (g2 = f2(n2, g2, w), null === u ? l3 = n2 : u.sibling = n2, u = n2);
        I && tg(e3, w);
        return l3;
      }
      for (m2 = d(e3, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e3, w, n2.value, k2), null !== n2 && (a2 && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f2(n2, g2, w), null === u ? l3 = n2 : u.sibling = n2, u = n2);
      a2 && m2.forEach(function(a3) {
        return b(e3, a3);
      });
      I && tg(e3, w);
      return l3;
    }
    function J(a3, d2, f3, h2) {
      "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
      if ("object" === typeof f3 && null !== f3) {
        switch (f3.$$typeof) {
          case va:
            a: {
              for (var k2 = f3.key, l3 = d2; null !== l3; ) {
                if (l3.key === k2) {
                  k2 = f3.type;
                  if (k2 === ya) {
                    if (7 === l3.tag) {
                      c2(a3, l3.sibling);
                      d2 = e2(l3, f3.props.children);
                      d2.return = a3;
                      a3 = d2;
                      break a;
                    }
                  } else if (l3.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l3.type) {
                    c2(a3, l3.sibling);
                    d2 = e2(l3, f3.props);
                    d2.ref = Lg(a3, l3, f3);
                    d2.return = a3;
                    a3 = d2;
                    break a;
                  }
                  c2(a3, l3);
                  break;
                } else b(a3, l3);
                l3 = l3.sibling;
              }
              f3.type === ya ? (d2 = Tg(f3.props.children, a3.mode, h2, f3.key), d2.return = a3, a3 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a3.mode, h2), h2.ref = Lg(a3, d2, f3), h2.return = a3, a3 = h2);
            }
            return g(a3);
          case wa:
            a: {
              for (l3 = f3.key; null !== d2; ) {
                if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                  c2(a3, d2.sibling);
                  d2 = e2(d2, f3.children || []);
                  d2.return = a3;
                  a3 = d2;
                  break a;
                } else {
                  c2(a3, d2);
                  break;
                }
                else b(a3, d2);
                d2 = d2.sibling;
              }
              d2 = Sg(f3, a3.mode, h2);
              d2.return = a3;
              a3 = d2;
            }
            return g(a3);
          case Ha:
            return l3 = f3._init, J(a3, d2, l3(f3._payload), h2);
        }
        if (eb(f3)) return n(a3, d2, f3, h2);
        if (Ka(f3)) return t2(a3, d2, f3, h2);
        Mg(a3, f3);
      }
      return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c2(a3, d2.sibling), d2 = e2(d2, f3), d2.return = a3, a3 = d2) : (c2(a3, d2), d2 = Qg(f3, a3.mode, h2), d2.return = a3, a3 = d2), g(a3)) : c2(a3, d2);
    }
    return J;
  }
  var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
  function $g() {
    Zg = Yg = Xg = null;
  }
  function ah(a2) {
    var b = Wg.current;
    E(Wg);
    a2._currentValue = b;
  }
  function bh(a2, b, c2) {
    for (; null !== a2; ) {
      var d = a2.alternate;
      (a2.childLanes & b) !== b ? (a2.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
      if (a2 === c2) break;
      a2 = a2.return;
    }
  }
  function ch(a2, b) {
    Xg = a2;
    Zg = Yg = null;
    a2 = a2.dependencies;
    null !== a2 && null !== a2.firstContext && (0 !== (a2.lanes & b) && (dh = true), a2.firstContext = null);
  }
  function eh(a2) {
    var b = a2._currentValue;
    if (Zg !== a2) if (a2 = { context: a2, memoizedValue: b, next: null }, null === Yg) {
      if (null === Xg) throw Error(p(308));
      Yg = a2;
      Xg.dependencies = { lanes: 0, firstContext: a2 };
    } else Yg = Yg.next = a2;
    return b;
  }
  var fh = null;
  function gh(a2) {
    null === fh ? fh = [a2] : fh.push(a2);
  }
  function hh(a2, b, c2, d) {
    var e2 = b.interleaved;
    null === e2 ? (c2.next = c2, gh(b)) : (c2.next = e2.next, e2.next = c2);
    b.interleaved = c2;
    return ih(a2, d);
  }
  function ih(a2, b) {
    a2.lanes |= b;
    var c2 = a2.alternate;
    null !== c2 && (c2.lanes |= b);
    c2 = a2;
    for (a2 = a2.return; null !== a2; ) a2.childLanes |= b, c2 = a2.alternate, null !== c2 && (c2.childLanes |= b), c2 = a2, a2 = a2.return;
    return 3 === c2.tag ? c2.stateNode : null;
  }
  var jh = false;
  function kh(a2) {
    a2.updateQueue = { baseState: a2.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function lh(a2, b) {
    a2 = a2.updateQueue;
    b.updateQueue === a2 && (b.updateQueue = { baseState: a2.baseState, firstBaseUpdate: a2.firstBaseUpdate, lastBaseUpdate: a2.lastBaseUpdate, shared: a2.shared, effects: a2.effects });
  }
  function mh(a2, b) {
    return { eventTime: a2, lane: b, tag: 0, payload: null, callback: null, next: null };
  }
  function nh(a2, b, c2) {
    var d = a2.updateQueue;
    if (null === d) return null;
    d = d.shared;
    if (0 !== (K & 2)) {
      var e2 = d.pending;
      null === e2 ? b.next = b : (b.next = e2.next, e2.next = b);
      d.pending = b;
      return ih(a2, c2);
    }
    e2 = d.interleaved;
    null === e2 ? (b.next = b, gh(d)) : (b.next = e2.next, e2.next = b);
    d.interleaved = b;
    return ih(a2, c2);
  }
  function oh(a2, b, c2) {
    b = b.updateQueue;
    if (null !== b && (b = b.shared, 0 !== (c2 & 4194240))) {
      var d = b.lanes;
      d &= a2.pendingLanes;
      c2 |= d;
      b.lanes = c2;
      Cc(a2, c2);
    }
  }
  function ph(a2, b) {
    var c2 = a2.updateQueue, d = a2.alternate;
    if (null !== d && (d = d.updateQueue, c2 === d)) {
      var e2 = null, f2 = null;
      c2 = c2.firstBaseUpdate;
      if (null !== c2) {
        do {
          var g = { eventTime: c2.eventTime, lane: c2.lane, tag: c2.tag, payload: c2.payload, callback: c2.callback, next: null };
          null === f2 ? e2 = f2 = g : f2 = f2.next = g;
          c2 = c2.next;
        } while (null !== c2);
        null === f2 ? e2 = f2 = b : f2 = f2.next = b;
      } else e2 = f2 = b;
      c2 = { baseState: d.baseState, firstBaseUpdate: e2, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
      a2.updateQueue = c2;
      return;
    }
    a2 = c2.lastBaseUpdate;
    null === a2 ? c2.firstBaseUpdate = b : a2.next = b;
    c2.lastBaseUpdate = b;
  }
  function qh(a2, b, c2, d) {
    var e2 = a2.updateQueue;
    jh = false;
    var f2 = e2.firstBaseUpdate, g = e2.lastBaseUpdate, h = e2.shared.pending;
    if (null !== h) {
      e2.shared.pending = null;
      var k = h, l2 = k.next;
      k.next = null;
      null === g ? f2 = l2 : g.next = l2;
      g = k;
      var m = a2.alternate;
      null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l2 : h.next = l2, m.lastBaseUpdate = k));
    }
    if (null !== f2) {
      var q = e2.baseState;
      g = 0;
      m = l2 = k = null;
      h = f2;
      do {
        var r2 = h.lane, y = h.eventTime;
        if ((d & r2) === r2) {
          null !== m && (m = m.next = {
            eventTime: y,
            lane: 0,
            tag: h.tag,
            payload: h.payload,
            callback: h.callback,
            next: null
          });
          a: {
            var n = a2, t2 = h;
            r2 = b;
            y = c2;
            switch (t2.tag) {
              case 1:
                n = t2.payload;
                if ("function" === typeof n) {
                  q = n.call(y, q, r2);
                  break a;
                }
                q = n;
                break a;
              case 3:
                n.flags = n.flags & -65537 | 128;
              case 0:
                n = t2.payload;
                r2 = "function" === typeof n ? n.call(y, q, r2) : n;
                if (null === r2 || void 0 === r2) break a;
                q = A({}, q, r2);
                break a;
              case 2:
                jh = true;
            }
          }
          null !== h.callback && 0 !== h.lane && (a2.flags |= 64, r2 = e2.effects, null === r2 ? e2.effects = [h] : r2.push(h));
        } else y = { eventTime: y, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l2 = m = y, k = q) : m = m.next = y, g |= r2;
        h = h.next;
        if (null === h) if (h = e2.shared.pending, null === h) break;
        else r2 = h, h = r2.next, r2.next = null, e2.lastBaseUpdate = r2, e2.shared.pending = null;
      } while (1);
      null === m && (k = q);
      e2.baseState = k;
      e2.firstBaseUpdate = l2;
      e2.lastBaseUpdate = m;
      b = e2.shared.interleaved;
      if (null !== b) {
        e2 = b;
        do
          g |= e2.lane, e2 = e2.next;
        while (e2 !== b);
      } else null === f2 && (e2.shared.lanes = 0);
      rh |= g;
      a2.lanes = g;
      a2.memoizedState = q;
    }
  }
  function sh(a2, b, c2) {
    a2 = b.effects;
    b.effects = null;
    if (null !== a2) for (b = 0; b < a2.length; b++) {
      var d = a2[b], e2 = d.callback;
      if (null !== e2) {
        d.callback = null;
        d = c2;
        if ("function" !== typeof e2) throw Error(p(191, e2));
        e2.call(d);
      }
    }
  }
  var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
  function xh(a2) {
    if (a2 === th) throw Error(p(174));
    return a2;
  }
  function yh(a2, b) {
    G2(wh, b);
    G2(vh, a2);
    G2(uh, th);
    a2 = b.nodeType;
    switch (a2) {
      case 9:
      case 11:
        b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
        break;
      default:
        a2 = 8 === a2 ? b.parentNode : b, b = a2.namespaceURI || null, a2 = a2.tagName, b = lb(b, a2);
    }
    E(uh);
    G2(uh, b);
  }
  function zh() {
    E(uh);
    E(vh);
    E(wh);
  }
  function Ah(a2) {
    xh(wh.current);
    var b = xh(uh.current);
    var c2 = lb(b, a2.type);
    b !== c2 && (G2(vh, a2), G2(uh, c2));
  }
  function Bh(a2) {
    vh.current === a2 && (E(uh), E(vh));
  }
  var L = Uf(0);
  function Ch(a2) {
    for (var b = a2; null !== b; ) {
      if (13 === b.tag) {
        var c2 = b.memoizedState;
        if (null !== c2 && (c2 = c2.dehydrated, null === c2 || "$?" === c2.data || "$!" === c2.data)) return b;
      } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
        if (0 !== (b.flags & 128)) return b;
      } else if (null !== b.child) {
        b.child.return = b;
        b = b.child;
        continue;
      }
      if (b === a2) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a2) return null;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
    return null;
  }
  var Dh = [];
  function Eh() {
    for (var a2 = 0; a2 < Dh.length; a2++) Dh[a2]._workInProgressVersionPrimary = null;
    Dh.length = 0;
  }
  var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
  function P() {
    throw Error(p(321));
  }
  function Mh(a2, b) {
    if (null === b) return false;
    for (var c2 = 0; c2 < b.length && c2 < a2.length; c2++) if (!He(a2[c2], b[c2])) return false;
    return true;
  }
  function Nh(a2, b, c2, d, e2, f2) {
    Hh = f2;
    M = b;
    b.memoizedState = null;
    b.updateQueue = null;
    b.lanes = 0;
    Fh.current = null === a2 || null === a2.memoizedState ? Oh : Ph;
    a2 = c2(d, e2);
    if (Jh) {
      f2 = 0;
      do {
        Jh = false;
        Kh = 0;
        if (25 <= f2) throw Error(p(301));
        f2 += 1;
        O = N = null;
        b.updateQueue = null;
        Fh.current = Qh;
        a2 = c2(d, e2);
      } while (Jh);
    }
    Fh.current = Rh;
    b = null !== N && null !== N.next;
    Hh = 0;
    O = N = M = null;
    Ih = false;
    if (b) throw Error(p(300));
    return a2;
  }
  function Sh() {
    var a2 = 0 !== Kh;
    Kh = 0;
    return a2;
  }
  function Th() {
    var a2 = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    null === O ? M.memoizedState = O = a2 : O = O.next = a2;
    return O;
  }
  function Uh() {
    if (null === N) {
      var a2 = M.alternate;
      a2 = null !== a2 ? a2.memoizedState : null;
    } else a2 = N.next;
    var b = null === O ? M.memoizedState : O.next;
    if (null !== b) O = b, N = a2;
    else {
      if (null === a2) throw Error(p(310));
      N = a2;
      a2 = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
      null === O ? M.memoizedState = O = a2 : O = O.next = a2;
    }
    return O;
  }
  function Vh(a2, b) {
    return "function" === typeof b ? b(a2) : b;
  }
  function Wh(a2) {
    var b = Uh(), c2 = b.queue;
    if (null === c2) throw Error(p(311));
    c2.lastRenderedReducer = a2;
    var d = N, e2 = d.baseQueue, f2 = c2.pending;
    if (null !== f2) {
      if (null !== e2) {
        var g = e2.next;
        e2.next = f2.next;
        f2.next = g;
      }
      d.baseQueue = e2 = f2;
      c2.pending = null;
    }
    if (null !== e2) {
      f2 = e2.next;
      d = d.baseState;
      var h = g = null, k = null, l2 = f2;
      do {
        var m = l2.lane;
        if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a2(d, l2.action);
        else {
          var q = {
            lane: m,
            action: l2.action,
            hasEagerState: l2.hasEagerState,
            eagerState: l2.eagerState,
            next: null
          };
          null === k ? (h = k = q, g = d) : k = k.next = q;
          M.lanes |= m;
          rh |= m;
        }
        l2 = l2.next;
      } while (null !== l2 && l2 !== f2);
      null === k ? g = d : k.next = h;
      He(d, b.memoizedState) || (dh = true);
      b.memoizedState = d;
      b.baseState = g;
      b.baseQueue = k;
      c2.lastRenderedState = d;
    }
    a2 = c2.interleaved;
    if (null !== a2) {
      e2 = a2;
      do
        f2 = e2.lane, M.lanes |= f2, rh |= f2, e2 = e2.next;
      while (e2 !== a2);
    } else null === e2 && (c2.lanes = 0);
    return [b.memoizedState, c2.dispatch];
  }
  function Xh(a2) {
    var b = Uh(), c2 = b.queue;
    if (null === c2) throw Error(p(311));
    c2.lastRenderedReducer = a2;
    var d = c2.dispatch, e2 = c2.pending, f2 = b.memoizedState;
    if (null !== e2) {
      c2.pending = null;
      var g = e2 = e2.next;
      do
        f2 = a2(f2, g.action), g = g.next;
      while (g !== e2);
      He(f2, b.memoizedState) || (dh = true);
      b.memoizedState = f2;
      null === b.baseQueue && (b.baseState = f2);
      c2.lastRenderedState = f2;
    }
    return [f2, d];
  }
  function Yh() {
  }
  function Zh(a2, b) {
    var c2 = M, d = Uh(), e2 = b(), f2 = !He(d.memoizedState, e2);
    f2 && (d.memoizedState = e2, dh = true);
    d = d.queue;
    $h(ai.bind(null, c2, d, a2), [a2]);
    if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
      c2.flags |= 2048;
      bi(9, ci.bind(null, c2, d, e2, b), void 0, null);
      if (null === Q) throw Error(p(349));
      0 !== (Hh & 30) || di(c2, b, e2);
    }
    return e2;
  }
  function di(a2, b, c2) {
    a2.flags |= 16384;
    a2 = { getSnapshot: b, value: c2 };
    b = M.updateQueue;
    null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a2]) : (c2 = b.stores, null === c2 ? b.stores = [a2] : c2.push(a2));
  }
  function ci(a2, b, c2, d) {
    b.value = c2;
    b.getSnapshot = d;
    ei(b) && fi(a2);
  }
  function ai(a2, b, c2) {
    return c2(function() {
      ei(b) && fi(a2);
    });
  }
  function ei(a2) {
    var b = a2.getSnapshot;
    a2 = a2.value;
    try {
      var c2 = b();
      return !He(a2, c2);
    } catch (d) {
      return true;
    }
  }
  function fi(a2) {
    var b = ih(a2, 1);
    null !== b && gi(b, a2, 1, -1);
  }
  function hi(a2) {
    var b = Th();
    "function" === typeof a2 && (a2 = a2());
    b.memoizedState = b.baseState = a2;
    a2 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a2 };
    b.queue = a2;
    a2 = a2.dispatch = ii.bind(null, M, a2);
    return [b.memoizedState, a2];
  }
  function bi(a2, b, c2, d) {
    a2 = { tag: a2, create: b, destroy: c2, deps: d, next: null };
    b = M.updateQueue;
    null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a2.next = a2) : (c2 = b.lastEffect, null === c2 ? b.lastEffect = a2.next = a2 : (d = c2.next, c2.next = a2, a2.next = d, b.lastEffect = a2));
    return a2;
  }
  function ji() {
    return Uh().memoizedState;
  }
  function ki(a2, b, c2, d) {
    var e2 = Th();
    M.flags |= a2;
    e2.memoizedState = bi(1 | b, c2, void 0, void 0 === d ? null : d);
  }
  function li(a2, b, c2, d) {
    var e2 = Uh();
    d = void 0 === d ? null : d;
    var f2 = void 0;
    if (null !== N) {
      var g = N.memoizedState;
      f2 = g.destroy;
      if (null !== d && Mh(d, g.deps)) {
        e2.memoizedState = bi(b, c2, f2, d);
        return;
      }
    }
    M.flags |= a2;
    e2.memoizedState = bi(1 | b, c2, f2, d);
  }
  function mi(a2, b) {
    return ki(8390656, 8, a2, b);
  }
  function $h(a2, b) {
    return li(2048, 8, a2, b);
  }
  function ni(a2, b) {
    return li(4, 2, a2, b);
  }
  function oi(a2, b) {
    return li(4, 4, a2, b);
  }
  function pi(a2, b) {
    if ("function" === typeof b) return a2 = a2(), b(a2), function() {
      b(null);
    };
    if (null !== b && void 0 !== b) return a2 = a2(), b.current = a2, function() {
      b.current = null;
    };
  }
  function qi(a2, b, c2) {
    c2 = null !== c2 && void 0 !== c2 ? c2.concat([a2]) : null;
    return li(4, 4, pi.bind(null, b, a2), c2);
  }
  function ri() {
  }
  function si(a2, b) {
    var c2 = Uh();
    b = void 0 === b ? null : b;
    var d = c2.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    c2.memoizedState = [a2, b];
    return a2;
  }
  function ti(a2, b) {
    var c2 = Uh();
    b = void 0 === b ? null : b;
    var d = c2.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    a2 = a2();
    c2.memoizedState = [a2, b];
    return a2;
  }
  function ui(a2, b, c2) {
    if (0 === (Hh & 21)) return a2.baseState && (a2.baseState = false, dh = true), a2.memoizedState = c2;
    He(c2, b) || (c2 = yc(), M.lanes |= c2, rh |= c2, a2.baseState = true);
    return b;
  }
  function vi(a2, b) {
    var c2 = C;
    C = 0 !== c2 && 4 > c2 ? c2 : 4;
    a2(true);
    var d = Gh.transition;
    Gh.transition = {};
    try {
      a2(false), b();
    } finally {
      C = c2, Gh.transition = d;
    }
  }
  function wi() {
    return Uh().memoizedState;
  }
  function xi(a2, b, c2) {
    var d = yi(a2);
    c2 = { lane: d, action: c2, hasEagerState: false, eagerState: null, next: null };
    if (zi(a2)) Ai(b, c2);
    else if (c2 = hh(a2, b, c2, d), null !== c2) {
      var e2 = R();
      gi(c2, a2, d, e2);
      Bi(c2, b, d);
    }
  }
  function ii(a2, b, c2) {
    var d = yi(a2), e2 = { lane: d, action: c2, hasEagerState: false, eagerState: null, next: null };
    if (zi(a2)) Ai(b, e2);
    else {
      var f2 = a2.alternate;
      if (0 === a2.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
        var g = b.lastRenderedState, h = f2(g, c2);
        e2.hasEagerState = true;
        e2.eagerState = h;
        if (He(h, g)) {
          var k = b.interleaved;
          null === k ? (e2.next = e2, gh(b)) : (e2.next = k.next, k.next = e2);
          b.interleaved = e2;
          return;
        }
      } catch (l2) {
      } finally {
      }
      c2 = hh(a2, b, e2, d);
      null !== c2 && (e2 = R(), gi(c2, a2, d, e2), Bi(c2, b, d));
    }
  }
  function zi(a2) {
    var b = a2.alternate;
    return a2 === M || null !== b && b === M;
  }
  function Ai(a2, b) {
    Jh = Ih = true;
    var c2 = a2.pending;
    null === c2 ? b.next = b : (b.next = c2.next, c2.next = b);
    a2.pending = b;
  }
  function Bi(a2, b, c2) {
    if (0 !== (c2 & 4194240)) {
      var d = b.lanes;
      d &= a2.pendingLanes;
      c2 |= d;
      b.lanes = c2;
      Cc(a2, c2);
    }
  }
  var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a2, b) {
    Th().memoizedState = [a2, void 0 === b ? null : b];
    return a2;
  }, useContext: eh, useEffect: mi, useImperativeHandle: function(a2, b, c2) {
    c2 = null !== c2 && void 0 !== c2 ? c2.concat([a2]) : null;
    return ki(
      4194308,
      4,
      pi.bind(null, b, a2),
      c2
    );
  }, useLayoutEffect: function(a2, b) {
    return ki(4194308, 4, a2, b);
  }, useInsertionEffect: function(a2, b) {
    return ki(4, 2, a2, b);
  }, useMemo: function(a2, b) {
    var c2 = Th();
    b = void 0 === b ? null : b;
    a2 = a2();
    c2.memoizedState = [a2, b];
    return a2;
  }, useReducer: function(a2, b, c2) {
    var d = Th();
    b = void 0 !== c2 ? c2(b) : b;
    d.memoizedState = d.baseState = b;
    a2 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a2, lastRenderedState: b };
    d.queue = a2;
    a2 = a2.dispatch = xi.bind(null, M, a2);
    return [d.memoizedState, a2];
  }, useRef: function(a2) {
    var b = Th();
    a2 = { current: a2 };
    return b.memoizedState = a2;
  }, useState: hi, useDebugValue: ri, useDeferredValue: function(a2) {
    return Th().memoizedState = a2;
  }, useTransition: function() {
    var a2 = hi(false), b = a2[0];
    a2 = vi.bind(null, a2[1]);
    Th().memoizedState = a2;
    return [b, a2];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(a2, b, c2) {
    var d = M, e2 = Th();
    if (I) {
      if (void 0 === c2) throw Error(p(407));
      c2 = c2();
    } else {
      c2 = b();
      if (null === Q) throw Error(p(349));
      0 !== (Hh & 30) || di(d, b, c2);
    }
    e2.memoizedState = c2;
    var f2 = { value: c2, getSnapshot: b };
    e2.queue = f2;
    mi(ai.bind(
      null,
      d,
      f2,
      a2
    ), [a2]);
    d.flags |= 2048;
    bi(9, ci.bind(null, d, f2, c2, b), void 0, null);
    return c2;
  }, useId: function() {
    var a2 = Th(), b = Q.identifierPrefix;
    if (I) {
      var c2 = sg;
      var d = rg;
      c2 = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c2;
      b = ":" + b + "R" + c2;
      c2 = Kh++;
      0 < c2 && (b += "H" + c2.toString(32));
      b += ":";
    } else c2 = Lh++, b = ":" + b + "r" + c2.toString(32) + ":";
    return a2.memoizedState = b;
  }, unstable_isNewReconciler: false }, Ph = {
    readContext: eh,
    useCallback: si,
    useContext: eh,
    useEffect: $h,
    useImperativeHandle: qi,
    useInsertionEffect: ni,
    useLayoutEffect: oi,
    useMemo: ti,
    useReducer: Wh,
    useRef: ji,
    useState: function() {
      return Wh(Vh);
    },
    useDebugValue: ri,
    useDeferredValue: function(a2) {
      var b = Uh();
      return ui(b, N.memoizedState, a2);
    },
    useTransition: function() {
      var a2 = Wh(Vh)[0], b = Uh().memoizedState;
      return [a2, b];
    },
    useMutableSource: Yh,
    useSyncExternalStore: Zh,
    useId: wi,
    unstable_isNewReconciler: false
  }, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
    return Xh(Vh);
  }, useDebugValue: ri, useDeferredValue: function(a2) {
    var b = Uh();
    return null === N ? b.memoizedState = a2 : ui(b, N.memoizedState, a2);
  }, useTransition: function() {
    var a2 = Xh(Vh)[0], b = Uh().memoizedState;
    return [a2, b];
  }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
  function Ci(a2, b) {
    if (a2 && a2.defaultProps) {
      b = A({}, b);
      a2 = a2.defaultProps;
      for (var c2 in a2) void 0 === b[c2] && (b[c2] = a2[c2]);
      return b;
    }
    return b;
  }
  function Di(a2, b, c2, d) {
    b = a2.memoizedState;
    c2 = c2(d, b);
    c2 = null === c2 || void 0 === c2 ? b : A({}, b, c2);
    a2.memoizedState = c2;
    0 === a2.lanes && (a2.updateQueue.baseState = c2);
  }
  var Ei = { isMounted: function(a2) {
    return (a2 = a2._reactInternals) ? Vb(a2) === a2 : false;
  }, enqueueSetState: function(a2, b, c2) {
    a2 = a2._reactInternals;
    var d = R(), e2 = yi(a2), f2 = mh(d, e2);
    f2.payload = b;
    void 0 !== c2 && null !== c2 && (f2.callback = c2);
    b = nh(a2, f2, e2);
    null !== b && (gi(b, a2, e2, d), oh(b, a2, e2));
  }, enqueueReplaceState: function(a2, b, c2) {
    a2 = a2._reactInternals;
    var d = R(), e2 = yi(a2), f2 = mh(d, e2);
    f2.tag = 1;
    f2.payload = b;
    void 0 !== c2 && null !== c2 && (f2.callback = c2);
    b = nh(a2, f2, e2);
    null !== b && (gi(b, a2, e2, d), oh(b, a2, e2));
  }, enqueueForceUpdate: function(a2, b) {
    a2 = a2._reactInternals;
    var c2 = R(), d = yi(a2), e2 = mh(c2, d);
    e2.tag = 2;
    void 0 !== b && null !== b && (e2.callback = b);
    b = nh(a2, e2, d);
    null !== b && (gi(b, a2, d, c2), oh(b, a2, d));
  } };
  function Fi(a2, b, c2, d, e2, f2, g) {
    a2 = a2.stateNode;
    return "function" === typeof a2.shouldComponentUpdate ? a2.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c2, d) || !Ie(e2, f2) : true;
  }
  function Gi(a2, b, c2) {
    var d = false, e2 = Vf;
    var f2 = b.contextType;
    "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e2 = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a2, e2) : Vf);
    b = new b(c2, f2);
    a2.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
    b.updater = Ei;
    a2.stateNode = b;
    b._reactInternals = a2;
    d && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = e2, a2.__reactInternalMemoizedMaskedChildContext = f2);
    return b;
  }
  function Hi(a2, b, c2, d) {
    a2 = b.state;
    "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c2, d);
    "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c2, d);
    b.state !== a2 && Ei.enqueueReplaceState(b, b.state, null);
  }
  function Ii(a2, b, c2, d) {
    var e2 = a2.stateNode;
    e2.props = c2;
    e2.state = a2.memoizedState;
    e2.refs = {};
    kh(a2);
    var f2 = b.contextType;
    "object" === typeof f2 && null !== f2 ? e2.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e2.context = Yf(a2, f2));
    e2.state = a2.memoizedState;
    f2 = b.getDerivedStateFromProps;
    "function" === typeof f2 && (Di(a2, b, f2, c2), e2.state = a2.memoizedState);
    "function" === typeof b.getDerivedStateFromProps || "function" === typeof e2.getSnapshotBeforeUpdate || "function" !== typeof e2.UNSAFE_componentWillMount && "function" !== typeof e2.componentWillMount || (b = e2.state, "function" === typeof e2.componentWillMount && e2.componentWillMount(), "function" === typeof e2.UNSAFE_componentWillMount && e2.UNSAFE_componentWillMount(), b !== e2.state && Ei.enqueueReplaceState(e2, e2.state, null), qh(a2, c2, e2, d), e2.state = a2.memoizedState);
    "function" === typeof e2.componentDidMount && (a2.flags |= 4194308);
  }
  function Ji(a2, b) {
    try {
      var c2 = "", d = b;
      do
        c2 += Pa(d), d = d.return;
      while (d);
      var e2 = c2;
    } catch (f2) {
      e2 = "\nError generating stack: " + f2.message + "\n" + f2.stack;
    }
    return { value: a2, source: b, stack: e2, digest: null };
  }
  function Ki(a2, b, c2) {
    return { value: a2, source: null, stack: null != c2 ? c2 : null, digest: null != b ? b : null };
  }
  function Li(a2, b) {
    try {
      console.error(b.value);
    } catch (c2) {
      setTimeout(function() {
        throw c2;
      });
    }
  }
  var Mi = "function" === typeof WeakMap ? WeakMap : Map;
  function Ni(a2, b, c2) {
    c2 = mh(-1, c2);
    c2.tag = 3;
    c2.payload = { element: null };
    var d = b.value;
    c2.callback = function() {
      Oi || (Oi = true, Pi = d);
      Li(a2, b);
    };
    return c2;
  }
  function Qi(a2, b, c2) {
    c2 = mh(-1, c2);
    c2.tag = 3;
    var d = a2.type.getDerivedStateFromError;
    if ("function" === typeof d) {
      var e2 = b.value;
      c2.payload = function() {
        return d(e2);
      };
      c2.callback = function() {
        Li(a2, b);
      };
    }
    var f2 = a2.stateNode;
    null !== f2 && "function" === typeof f2.componentDidCatch && (c2.callback = function() {
      Li(a2, b);
      "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
      var c3 = b.stack;
      this.componentDidCatch(b.value, { componentStack: null !== c3 ? c3 : "" });
    });
    return c2;
  }
  function Si(a2, b, c2) {
    var d = a2.pingCache;
    if (null === d) {
      d = a2.pingCache = new Mi();
      var e2 = /* @__PURE__ */ new Set();
      d.set(b, e2);
    } else e2 = d.get(b), void 0 === e2 && (e2 = /* @__PURE__ */ new Set(), d.set(b, e2));
    e2.has(c2) || (e2.add(c2), a2 = Ti.bind(null, a2, b, c2), b.then(a2, a2));
  }
  function Ui(a2) {
    do {
      var b;
      if (b = 13 === a2.tag) b = a2.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
      if (b) return a2;
      a2 = a2.return;
    } while (null !== a2);
    return null;
  }
  function Vi(a2, b, c2, d, e2) {
    if (0 === (a2.mode & 1)) return a2 === b ? a2.flags |= 65536 : (a2.flags |= 128, c2.flags |= 131072, c2.flags &= -52805, 1 === c2.tag && (null === c2.alternate ? c2.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c2, b, 1))), c2.lanes |= 1), a2;
    a2.flags |= 65536;
    a2.lanes = e2;
    return a2;
  }
  var Wi = ua.ReactCurrentOwner, dh = false;
  function Xi(a2, b, c2, d) {
    b.child = null === a2 ? Vg(b, null, c2, d) : Ug(b, a2.child, c2, d);
  }
  function Yi(a2, b, c2, d, e2) {
    c2 = c2.render;
    var f2 = b.ref;
    ch(b, e2);
    d = Nh(a2, b, c2, d, f2, e2);
    c2 = Sh();
    if (null !== a2 && !dh) return b.updateQueue = a2.updateQueue, b.flags &= -2053, a2.lanes &= ~e2, Zi(a2, b, e2);
    I && c2 && vg(b);
    b.flags |= 1;
    Xi(a2, b, d, e2);
    return b.child;
  }
  function $i(a2, b, c2, d, e2) {
    if (null === a2) {
      var f2 = c2.type;
      if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c2.compare && void 0 === c2.defaultProps) return b.tag = 15, b.type = f2, bj(a2, b, f2, d, e2);
      a2 = Rg(c2.type, null, d, b, b.mode, e2);
      a2.ref = b.ref;
      a2.return = b;
      return b.child = a2;
    }
    f2 = a2.child;
    if (0 === (a2.lanes & e2)) {
      var g = f2.memoizedProps;
      c2 = c2.compare;
      c2 = null !== c2 ? c2 : Ie;
      if (c2(g, d) && a2.ref === b.ref) return Zi(a2, b, e2);
    }
    b.flags |= 1;
    a2 = Pg(f2, d);
    a2.ref = b.ref;
    a2.return = b;
    return b.child = a2;
  }
  function bj(a2, b, c2, d, e2) {
    if (null !== a2) {
      var f2 = a2.memoizedProps;
      if (Ie(f2, d) && a2.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a2.lanes & e2)) 0 !== (a2.flags & 131072) && (dh = true);
      else return b.lanes = a2.lanes, Zi(a2, b, e2);
    }
    return cj(a2, b, c2, d, e2);
  }
  function dj(a2, b, c2) {
    var d = b.pendingProps, e2 = d.children, f2 = null !== a2 ? a2.memoizedState : null;
    if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G2(ej, fj), fj |= c2;
    else {
      if (0 === (c2 & 1073741824)) return a2 = null !== f2 ? f2.baseLanes | c2 : c2, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a2, cachePool: null, transitions: null }, b.updateQueue = null, G2(ej, fj), fj |= a2, null;
      b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
      d = null !== f2 ? f2.baseLanes : c2;
      G2(ej, fj);
      fj |= d;
    }
    else null !== f2 ? (d = f2.baseLanes | c2, b.memoizedState = null) : d = c2, G2(ej, fj), fj |= d;
    Xi(a2, b, e2, c2);
    return b.child;
  }
  function gj(a2, b) {
    var c2 = b.ref;
    if (null === a2 && null !== c2 || null !== a2 && a2.ref !== c2) b.flags |= 512, b.flags |= 2097152;
  }
  function cj(a2, b, c2, d, e2) {
    var f2 = Zf(c2) ? Xf : H.current;
    f2 = Yf(b, f2);
    ch(b, e2);
    c2 = Nh(a2, b, c2, d, f2, e2);
    d = Sh();
    if (null !== a2 && !dh) return b.updateQueue = a2.updateQueue, b.flags &= -2053, a2.lanes &= ~e2, Zi(a2, b, e2);
    I && d && vg(b);
    b.flags |= 1;
    Xi(a2, b, c2, e2);
    return b.child;
  }
  function hj(a2, b, c2, d, e2) {
    if (Zf(c2)) {
      var f2 = true;
      cg(b);
    } else f2 = false;
    ch(b, e2);
    if (null === b.stateNode) ij(a2, b), Gi(b, c2, d), Ii(b, c2, d, e2), d = true;
    else if (null === a2) {
      var g = b.stateNode, h = b.memoizedProps;
      g.props = h;
      var k = g.context, l2 = c2.contextType;
      "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c2) ? Xf : H.current, l2 = Yf(b, l2));
      var m = c2.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
      q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l2) && Hi(b, g, d, l2);
      jh = false;
      var r2 = b.memoizedState;
      g.state = r2;
      qh(b, d, g, e2);
      k = b.memoizedState;
      h !== d || r2 !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c2, m, d), k = b.memoizedState), (h = jh || Fi(b, c2, h, d, r2, k, l2)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
    } else {
      g = b.stateNode;
      lh(a2, b);
      h = b.memoizedProps;
      l2 = b.type === b.elementType ? h : Ci(b.type, h);
      g.props = l2;
      q = b.pendingProps;
      r2 = g.context;
      k = c2.contextType;
      "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c2) ? Xf : H.current, k = Yf(b, k));
      var y = c2.getDerivedStateFromProps;
      (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r2 !== k) && Hi(b, g, d, k);
      jh = false;
      r2 = b.memoizedState;
      g.state = r2;
      qh(b, d, g, e2);
      var n = b.memoizedState;
      h !== q || r2 !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c2, y, d), n = b.memoizedState), (l2 = jh || Fi(b, c2, l2, d, r2, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 1024), d = false);
    }
    return jj(a2, b, c2, d, f2, e2);
  }
  function jj(a2, b, c2, d, e2, f2) {
    gj(a2, b);
    var g = 0 !== (b.flags & 128);
    if (!d && !g) return e2 && dg(b, c2, false), Zi(a2, b, f2);
    d = b.stateNode;
    Wi.current = b;
    var h = g && "function" !== typeof c2.getDerivedStateFromError ? null : d.render();
    b.flags |= 1;
    null !== a2 && g ? (b.child = Ug(b, a2.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a2, b, h, f2);
    b.memoizedState = d.state;
    e2 && dg(b, c2, true);
    return b.child;
  }
  function kj(a2) {
    var b = a2.stateNode;
    b.pendingContext ? ag(a2, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a2, b.context, false);
    yh(a2, b.containerInfo);
  }
  function lj(a2, b, c2, d, e2) {
    Ig();
    Jg(e2);
    b.flags |= 256;
    Xi(a2, b, c2, d);
    return b.child;
  }
  var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
  function nj(a2) {
    return { baseLanes: a2, cachePool: null, transitions: null };
  }
  function oj(a2, b, c2) {
    var d = b.pendingProps, e2 = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
    (h = g) || (h = null !== a2 && null === a2.memoizedState ? false : 0 !== (e2 & 2));
    if (h) f2 = true, b.flags &= -129;
    else if (null === a2 || null !== a2.memoizedState) e2 |= 1;
    G2(L, e2 & 1);
    if (null === a2) {
      Eg(b);
      a2 = b.memoizedState;
      if (null !== a2 && (a2 = a2.dehydrated, null !== a2)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a2.data ? b.lanes = 8 : b.lanes = 1073741824, null;
      g = d.children;
      a2 = d.fallback;
      return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a2 = Tg(a2, d, c2, null), f2.return = b, a2.return = b, f2.sibling = a2, b.child = f2, b.child.memoizedState = nj(c2), b.memoizedState = mj, a2) : qj(b, g);
    }
    e2 = a2.memoizedState;
    if (null !== e2 && (h = e2.dehydrated, null !== h)) return rj(a2, b, g, d, h, e2, c2);
    if (f2) {
      f2 = d.fallback;
      g = b.mode;
      e2 = a2.child;
      h = e2.sibling;
      var k = { mode: "hidden", children: d.children };
      0 === (g & 1) && b.child !== e2 ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e2, k), d.subtreeFlags = e2.subtreeFlags & 14680064);
      null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c2, null), f2.flags |= 2);
      f2.return = b;
      d.return = b;
      d.sibling = f2;
      b.child = d;
      d = f2;
      f2 = b.child;
      g = a2.child.memoizedState;
      g = null === g ? nj(c2) : { baseLanes: g.baseLanes | c2, cachePool: null, transitions: g.transitions };
      f2.memoizedState = g;
      f2.childLanes = a2.childLanes & ~c2;
      b.memoizedState = mj;
      return d;
    }
    f2 = a2.child;
    a2 = f2.sibling;
    d = Pg(f2, { mode: "visible", children: d.children });
    0 === (b.mode & 1) && (d.lanes = c2);
    d.return = b;
    d.sibling = null;
    null !== a2 && (c2 = b.deletions, null === c2 ? (b.deletions = [a2], b.flags |= 16) : c2.push(a2));
    b.child = d;
    b.memoizedState = null;
    return d;
  }
  function qj(a2, b) {
    b = pj({ mode: "visible", children: b }, a2.mode, 0, null);
    b.return = a2;
    return a2.child = b;
  }
  function sj(a2, b, c2, d) {
    null !== d && Jg(d);
    Ug(b, a2.child, null, c2);
    a2 = qj(b, b.pendingProps.children);
    a2.flags |= 2;
    b.memoizedState = null;
    return a2;
  }
  function rj(a2, b, c2, d, e2, f2, g) {
    if (c2) {
      if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a2, b, g, d);
      if (null !== b.memoizedState) return b.child = a2.child, b.flags |= 128, null;
      f2 = d.fallback;
      e2 = b.mode;
      d = pj({ mode: "visible", children: d.children }, e2, 0, null);
      f2 = Tg(f2, e2, g, null);
      f2.flags |= 2;
      d.return = b;
      f2.return = b;
      d.sibling = f2;
      b.child = d;
      0 !== (b.mode & 1) && Ug(b, a2.child, null, g);
      b.child.memoizedState = nj(g);
      b.memoizedState = mj;
      return f2;
    }
    if (0 === (b.mode & 1)) return sj(a2, b, g, null);
    if ("$!" === e2.data) {
      d = e2.nextSibling && e2.nextSibling.dataset;
      if (d) var h = d.dgst;
      d = h;
      f2 = Error(p(419));
      d = Ki(f2, d, void 0);
      return sj(a2, b, g, d);
    }
    h = 0 !== (g & a2.childLanes);
    if (dh || h) {
      d = Q;
      if (null !== d) {
        switch (g & -g) {
          case 4:
            e2 = 2;
            break;
          case 16:
            e2 = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            e2 = 32;
            break;
          case 536870912:
            e2 = 268435456;
            break;
          default:
            e2 = 0;
        }
        e2 = 0 !== (e2 & (d.suspendedLanes | g)) ? 0 : e2;
        0 !== e2 && e2 !== f2.retryLane && (f2.retryLane = e2, ih(a2, e2), gi(d, a2, e2, -1));
      }
      tj();
      d = Ki(Error(p(421)));
      return sj(a2, b, g, d);
    }
    if ("$?" === e2.data) return b.flags |= 128, b.child = a2.child, b = uj.bind(null, a2), e2._reactRetry = b, null;
    a2 = f2.treeContext;
    yg = Lf(e2.nextSibling);
    xg = b;
    I = true;
    zg = null;
    null !== a2 && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a2.id, sg = a2.overflow, qg = b);
    b = qj(b, d.children);
    b.flags |= 4096;
    return b;
  }
  function vj(a2, b, c2) {
    a2.lanes |= b;
    var d = a2.alternate;
    null !== d && (d.lanes |= b);
    bh(a2.return, b, c2);
  }
  function wj(a2, b, c2, d, e2) {
    var f2 = a2.memoizedState;
    null === f2 ? a2.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c2, tailMode: e2 } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c2, f2.tailMode = e2);
  }
  function xj(a2, b, c2) {
    var d = b.pendingProps, e2 = d.revealOrder, f2 = d.tail;
    Xi(a2, b, d.children, c2);
    d = L.current;
    if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
    else {
      if (null !== a2 && 0 !== (a2.flags & 128)) a: for (a2 = b.child; null !== a2; ) {
        if (13 === a2.tag) null !== a2.memoizedState && vj(a2, c2, b);
        else if (19 === a2.tag) vj(a2, c2, b);
        else if (null !== a2.child) {
          a2.child.return = a2;
          a2 = a2.child;
          continue;
        }
        if (a2 === b) break a;
        for (; null === a2.sibling; ) {
          if (null === a2.return || a2.return === b) break a;
          a2 = a2.return;
        }
        a2.sibling.return = a2.return;
        a2 = a2.sibling;
      }
      d &= 1;
    }
    G2(L, d);
    if (0 === (b.mode & 1)) b.memoizedState = null;
    else switch (e2) {
      case "forwards":
        c2 = b.child;
        for (e2 = null; null !== c2; ) a2 = c2.alternate, null !== a2 && null === Ch(a2) && (e2 = c2), c2 = c2.sibling;
        c2 = e2;
        null === c2 ? (e2 = b.child, b.child = null) : (e2 = c2.sibling, c2.sibling = null);
        wj(b, false, e2, c2, f2);
        break;
      case "backwards":
        c2 = null;
        e2 = b.child;
        for (b.child = null; null !== e2; ) {
          a2 = e2.alternate;
          if (null !== a2 && null === Ch(a2)) {
            b.child = e2;
            break;
          }
          a2 = e2.sibling;
          e2.sibling = c2;
          c2 = e2;
          e2 = a2;
        }
        wj(b, true, c2, null, f2);
        break;
      case "together":
        wj(b, false, null, null, void 0);
        break;
      default:
        b.memoizedState = null;
    }
    return b.child;
  }
  function ij(a2, b) {
    0 === (b.mode & 1) && null !== a2 && (a2.alternate = null, b.alternate = null, b.flags |= 2);
  }
  function Zi(a2, b, c2) {
    null !== a2 && (b.dependencies = a2.dependencies);
    rh |= b.lanes;
    if (0 === (c2 & b.childLanes)) return null;
    if (null !== a2 && b.child !== a2.child) throw Error(p(153));
    if (null !== b.child) {
      a2 = b.child;
      c2 = Pg(a2, a2.pendingProps);
      b.child = c2;
      for (c2.return = b; null !== a2.sibling; ) a2 = a2.sibling, c2 = c2.sibling = Pg(a2, a2.pendingProps), c2.return = b;
      c2.sibling = null;
    }
    return b.child;
  }
  function yj(a2, b, c2) {
    switch (b.tag) {
      case 3:
        kj(b);
        Ig();
        break;
      case 5:
        Ah(b);
        break;
      case 1:
        Zf(b.type) && cg(b);
        break;
      case 4:
        yh(b, b.stateNode.containerInfo);
        break;
      case 10:
        var d = b.type._context, e2 = b.memoizedProps.value;
        G2(Wg, d._currentValue);
        d._currentValue = e2;
        break;
      case 13:
        d = b.memoizedState;
        if (null !== d) {
          if (null !== d.dehydrated) return G2(L, L.current & 1), b.flags |= 128, null;
          if (0 !== (c2 & b.child.childLanes)) return oj(a2, b, c2);
          G2(L, L.current & 1);
          a2 = Zi(a2, b, c2);
          return null !== a2 ? a2.sibling : null;
        }
        G2(L, L.current & 1);
        break;
      case 19:
        d = 0 !== (c2 & b.childLanes);
        if (0 !== (a2.flags & 128)) {
          if (d) return xj(a2, b, c2);
          b.flags |= 128;
        }
        e2 = b.memoizedState;
        null !== e2 && (e2.rendering = null, e2.tail = null, e2.lastEffect = null);
        G2(L, L.current);
        if (d) break;
        else return null;
      case 22:
      case 23:
        return b.lanes = 0, dj(a2, b, c2);
    }
    return Zi(a2, b, c2);
  }
  var zj, Aj, Bj, Cj;
  zj = function(a2, b) {
    for (var c2 = b.child; null !== c2; ) {
      if (5 === c2.tag || 6 === c2.tag) a2.appendChild(c2.stateNode);
      else if (4 !== c2.tag && null !== c2.child) {
        c2.child.return = c2;
        c2 = c2.child;
        continue;
      }
      if (c2 === b) break;
      for (; null === c2.sibling; ) {
        if (null === c2.return || c2.return === b) return;
        c2 = c2.return;
      }
      c2.sibling.return = c2.return;
      c2 = c2.sibling;
    }
  };
  Aj = function() {
  };
  Bj = function(a2, b, c2, d) {
    var e2 = a2.memoizedProps;
    if (e2 !== d) {
      a2 = b.stateNode;
      xh(uh.current);
      var f2 = null;
      switch (c2) {
        case "input":
          e2 = Ya(a2, e2);
          d = Ya(a2, d);
          f2 = [];
          break;
        case "select":
          e2 = A({}, e2, { value: void 0 });
          d = A({}, d, { value: void 0 });
          f2 = [];
          break;
        case "textarea":
          e2 = gb(a2, e2);
          d = gb(a2, d);
          f2 = [];
          break;
        default:
          "function" !== typeof e2.onClick && "function" === typeof d.onClick && (a2.onclick = Bf);
      }
      ub(c2, d);
      var g;
      c2 = null;
      for (l2 in e2) if (!d.hasOwnProperty(l2) && e2.hasOwnProperty(l2) && null != e2[l2]) if ("style" === l2) {
        var h = e2[l2];
        for (g in h) h.hasOwnProperty(g) && (c2 || (c2 = {}), c2[g] = "");
      } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
      for (l2 in d) {
        var k = d[l2];
        h = null != e2 ? e2[l2] : void 0;
        if (d.hasOwnProperty(l2) && k !== h && (null != k || null != h)) if ("style" === l2) if (h) {
          for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c2 || (c2 = {}), c2[g] = "");
          for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c2 || (c2 = {}), c2[g] = k[g]);
        } else c2 || (f2 || (f2 = []), f2.push(
          l2,
          c2
        )), c2 = k;
        else "dangerouslySetInnerHTML" === l2 ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f2 = f2 || []).push(l2, k)) : "children" === l2 ? "string" !== typeof k && "number" !== typeof k || (f2 = f2 || []).push(l2, "" + k) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k && "onScroll" === l2 && D("scroll", a2), f2 || h === k || (f2 = [])) : (f2 = f2 || []).push(l2, k));
      }
      c2 && (f2 = f2 || []).push("style", c2);
      var l2 = f2;
      if (b.updateQueue = l2) b.flags |= 4;
    }
  };
  Cj = function(a2, b, c2, d) {
    c2 !== d && (b.flags |= 4);
  };
  function Dj(a2, b) {
    if (!I) switch (a2.tailMode) {
      case "hidden":
        b = a2.tail;
        for (var c2 = null; null !== b; ) null !== b.alternate && (c2 = b), b = b.sibling;
        null === c2 ? a2.tail = null : c2.sibling = null;
        break;
      case "collapsed":
        c2 = a2.tail;
        for (var d = null; null !== c2; ) null !== c2.alternate && (d = c2), c2 = c2.sibling;
        null === d ? b || null === a2.tail ? a2.tail = null : a2.tail.sibling = null : d.sibling = null;
    }
  }
  function S(a2) {
    var b = null !== a2.alternate && a2.alternate.child === a2.child, c2 = 0, d = 0;
    if (b) for (var e2 = a2.child; null !== e2; ) c2 |= e2.lanes | e2.childLanes, d |= e2.subtreeFlags & 14680064, d |= e2.flags & 14680064, e2.return = a2, e2 = e2.sibling;
    else for (e2 = a2.child; null !== e2; ) c2 |= e2.lanes | e2.childLanes, d |= e2.subtreeFlags, d |= e2.flags, e2.return = a2, e2 = e2.sibling;
    a2.subtreeFlags |= d;
    a2.childLanes = c2;
    return b;
  }
  function Ej(a2, b, c2) {
    var d = b.pendingProps;
    wg(b);
    switch (b.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return S(b), null;
      case 1:
        return Zf(b.type) && $f(), S(b), null;
      case 3:
        d = b.stateNode;
        zh();
        E(Wf);
        E(H);
        Eh();
        d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
        if (null === a2 || null === a2.child) Gg(b) ? b.flags |= 4 : null === a2 || a2.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
        Aj(a2, b);
        S(b);
        return null;
      case 5:
        Bh(b);
        var e2 = xh(wh.current);
        c2 = b.type;
        if (null !== a2 && null != b.stateNode) Bj(a2, b, c2, d, e2), a2.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
        else {
          if (!d) {
            if (null === b.stateNode) throw Error(p(166));
            S(b);
            return null;
          }
          a2 = xh(uh.current);
          if (Gg(b)) {
            d = b.stateNode;
            c2 = b.type;
            var f2 = b.memoizedProps;
            d[Of] = b;
            d[Pf] = f2;
            a2 = 0 !== (b.mode & 1);
            switch (c2) {
              case "dialog":
                D("cancel", d);
                D("close", d);
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", d);
                break;
              case "video":
              case "audio":
                for (e2 = 0; e2 < lf.length; e2++) D(lf[e2], d);
                break;
              case "source":
                D("error", d);
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  d
                );
                D("load", d);
                break;
              case "details":
                D("toggle", d);
                break;
              case "input":
                Za(d, f2);
                D("invalid", d);
                break;
              case "select":
                d._wrapperState = { wasMultiple: !!f2.multiple };
                D("invalid", d);
                break;
              case "textarea":
                hb(d, f2), D("invalid", d);
            }
            ub(c2, f2);
            e2 = null;
            for (var g in f2) if (f2.hasOwnProperty(g)) {
              var h = f2[g];
              "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a2), e2 = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
                d.textContent,
                h,
                a2
              ), e2 = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
            }
            switch (c2) {
              case "input":
                Va(d);
                db(d, f2, true);
                break;
              case "textarea":
                Va(d);
                jb(d);
                break;
              case "select":
              case "option":
                break;
              default:
                "function" === typeof f2.onClick && (d.onclick = Bf);
            }
            d = e2;
            b.updateQueue = d;
            null !== d && (b.flags |= 4);
          } else {
            g = 9 === e2.nodeType ? e2 : e2.ownerDocument;
            "http://www.w3.org/1999/xhtml" === a2 && (a2 = kb(c2));
            "http://www.w3.org/1999/xhtml" === a2 ? "script" === c2 ? (a2 = g.createElement("div"), a2.innerHTML = "<script><\/script>", a2 = a2.removeChild(a2.firstChild)) : "string" === typeof d.is ? a2 = g.createElement(c2, { is: d.is }) : (a2 = g.createElement(c2), "select" === c2 && (g = a2, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a2 = g.createElementNS(a2, c2);
            a2[Of] = b;
            a2[Pf] = d;
            zj(a2, b, false, false);
            b.stateNode = a2;
            a: {
              g = vb(c2, d);
              switch (c2) {
                case "dialog":
                  D("cancel", a2);
                  D("close", a2);
                  e2 = d;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  D("load", a2);
                  e2 = d;
                  break;
                case "video":
                case "audio":
                  for (e2 = 0; e2 < lf.length; e2++) D(lf[e2], a2);
                  e2 = d;
                  break;
                case "source":
                  D("error", a2);
                  e2 = d;
                  break;
                case "img":
                case "image":
                case "link":
                  D(
                    "error",
                    a2
                  );
                  D("load", a2);
                  e2 = d;
                  break;
                case "details":
                  D("toggle", a2);
                  e2 = d;
                  break;
                case "input":
                  Za(a2, d);
                  e2 = Ya(a2, d);
                  D("invalid", a2);
                  break;
                case "option":
                  e2 = d;
                  break;
                case "select":
                  a2._wrapperState = { wasMultiple: !!d.multiple };
                  e2 = A({}, d, { value: void 0 });
                  D("invalid", a2);
                  break;
                case "textarea":
                  hb(a2, d);
                  e2 = gb(a2, d);
                  D("invalid", a2);
                  break;
                default:
                  e2 = d;
              }
              ub(c2, e2);
              h = e2;
              for (f2 in h) if (h.hasOwnProperty(f2)) {
                var k = h[f2];
                "style" === f2 ? sb(a2, k) : "dangerouslySetInnerHTML" === f2 ? (k = k ? k.__html : void 0, null != k && nb(a2, k)) : "children" === f2 ? "string" === typeof k ? ("textarea" !== c2 || "" !== k) && ob(a2, k) : "number" === typeof k && ob(a2, "" + k) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k && "onScroll" === f2 && D("scroll", a2) : null != k && ta(a2, f2, k, g));
              }
              switch (c2) {
                case "input":
                  Va(a2);
                  db(a2, d, false);
                  break;
                case "textarea":
                  Va(a2);
                  jb(a2);
                  break;
                case "option":
                  null != d.value && a2.setAttribute("value", "" + Sa(d.value));
                  break;
                case "select":
                  a2.multiple = !!d.multiple;
                  f2 = d.value;
                  null != f2 ? fb(a2, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                    a2,
                    !!d.multiple,
                    d.defaultValue,
                    true
                  );
                  break;
                default:
                  "function" === typeof e2.onClick && (a2.onclick = Bf);
              }
              switch (c2) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  d = !!d.autoFocus;
                  break a;
                case "img":
                  d = true;
                  break a;
                default:
                  d = false;
              }
            }
            d && (b.flags |= 4);
          }
          null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
        }
        S(b);
        return null;
      case 6:
        if (a2 && null != b.stateNode) Cj(a2, b, a2.memoizedProps, d);
        else {
          if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
          c2 = xh(wh.current);
          xh(uh.current);
          if (Gg(b)) {
            d = b.stateNode;
            c2 = b.memoizedProps;
            d[Of] = b;
            if (f2 = d.nodeValue !== c2) {
              if (a2 = xg, null !== a2) switch (a2.tag) {
                case 3:
                  Af(d.nodeValue, c2, 0 !== (a2.mode & 1));
                  break;
                case 5:
                  true !== a2.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c2, 0 !== (a2.mode & 1));
              }
            }
            f2 && (b.flags |= 4);
          } else d = (9 === c2.nodeType ? c2 : c2.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
        }
        S(b);
        return null;
      case 13:
        E(L);
        d = b.memoizedState;
        if (null === a2 || null !== a2.memoizedState && null !== a2.memoizedState.dehydrated) {
          if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
          else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
            if (null === a2) {
              if (!f2) throw Error(p(318));
              f2 = b.memoizedState;
              f2 = null !== f2 ? f2.dehydrated : null;
              if (!f2) throw Error(p(317));
              f2[Of] = b;
            } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
            S(b);
            f2 = false;
          } else null !== zg && (Fj(zg), zg = null), f2 = true;
          if (!f2) return b.flags & 65536 ? b : null;
        }
        if (0 !== (b.flags & 128)) return b.lanes = c2, b;
        d = null !== d;
        d !== (null !== a2 && null !== a2.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a2 || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
        null !== b.updateQueue && (b.flags |= 4);
        S(b);
        return null;
      case 4:
        return zh(), Aj(a2, b), null === a2 && sf(b.stateNode.containerInfo), S(b), null;
      case 10:
        return ah(b.type._context), S(b), null;
      case 17:
        return Zf(b.type) && $f(), S(b), null;
      case 19:
        E(L);
        f2 = b.memoizedState;
        if (null === f2) return S(b), null;
        d = 0 !== (b.flags & 128);
        g = f2.rendering;
        if (null === g) if (d) Dj(f2, false);
        else {
          if (0 !== T || null !== a2 && 0 !== (a2.flags & 128)) for (a2 = b.child; null !== a2; ) {
            g = Ch(a2);
            if (null !== g) {
              b.flags |= 128;
              Dj(f2, false);
              d = g.updateQueue;
              null !== d && (b.updateQueue = d, b.flags |= 4);
              b.subtreeFlags = 0;
              d = c2;
              for (c2 = b.child; null !== c2; ) f2 = c2, a2 = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a2, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a2 = g.dependencies, f2.dependencies = null === a2 ? null : { lanes: a2.lanes, firstContext: a2.firstContext }), c2 = c2.sibling;
              G2(L, L.current & 1 | 2);
              return b.child;
            }
            a2 = a2.sibling;
          }
          null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        }
        else {
          if (!d) if (a2 = Ch(g), null !== a2) {
            if (b.flags |= 128, d = true, c2 = a2.updateQueue, null !== c2 && (b.updateQueue = c2, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
          } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c2 && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
          f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c2 = f2.last, null !== c2 ? c2.sibling = g : b.child = g, f2.last = g);
        }
        if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c2 = L.current, G2(L, d ? c2 & 1 | 2 : c2 & 1), b;
        S(b);
        return null;
      case 22:
      case 23:
        return Hj(), d = null !== b.memoizedState, null !== a2 && null !== a2.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(p(156, b.tag));
  }
  function Ij(a2, b) {
    wg(b);
    switch (b.tag) {
      case 1:
        return Zf(b.type) && $f(), a2 = b.flags, a2 & 65536 ? (b.flags = a2 & -65537 | 128, b) : null;
      case 3:
        return zh(), E(Wf), E(H), Eh(), a2 = b.flags, 0 !== (a2 & 65536) && 0 === (a2 & 128) ? (b.flags = a2 & -65537 | 128, b) : null;
      case 5:
        return Bh(b), null;
      case 13:
        E(L);
        a2 = b.memoizedState;
        if (null !== a2 && null !== a2.dehydrated) {
          if (null === b.alternate) throw Error(p(340));
          Ig();
        }
        a2 = b.flags;
        return a2 & 65536 ? (b.flags = a2 & -65537 | 128, b) : null;
      case 19:
        return E(L), null;
      case 4:
        return zh(), null;
      case 10:
        return ah(b.type._context), null;
      case 22:
      case 23:
        return Hj(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
  function Lj(a2, b) {
    var c2 = a2.ref;
    if (null !== c2) if ("function" === typeof c2) try {
      c2(null);
    } catch (d) {
      W(a2, b, d);
    }
    else c2.current = null;
  }
  function Mj(a2, b, c2) {
    try {
      c2();
    } catch (d) {
      W(a2, b, d);
    }
  }
  var Nj = false;
  function Oj(a2, b) {
    Cf = dd;
    a2 = Me();
    if (Ne(a2)) {
      if ("selectionStart" in a2) var c2 = { start: a2.selectionStart, end: a2.selectionEnd };
      else a: {
        c2 = (c2 = a2.ownerDocument) && c2.defaultView || window;
        var d = c2.getSelection && c2.getSelection();
        if (d && 0 !== d.rangeCount) {
          c2 = d.anchorNode;
          var e2 = d.anchorOffset, f2 = d.focusNode;
          d = d.focusOffset;
          try {
            c2.nodeType, f2.nodeType;
          } catch (F) {
            c2 = null;
            break a;
          }
          var g = 0, h = -1, k = -1, l2 = 0, m = 0, q = a2, r2 = null;
          b: for (; ; ) {
            for (var y; ; ) {
              q !== c2 || 0 !== e2 && 3 !== q.nodeType || (h = g + e2);
              q !== f2 || 0 !== d && 3 !== q.nodeType || (k = g + d);
              3 === q.nodeType && (g += q.nodeValue.length);
              if (null === (y = q.firstChild)) break;
              r2 = q;
              q = y;
            }
            for (; ; ) {
              if (q === a2) break b;
              r2 === c2 && ++l2 === e2 && (h = g);
              r2 === f2 && ++m === d && (k = g);
              if (null !== (y = q.nextSibling)) break;
              q = r2;
              r2 = q.parentNode;
            }
            q = y;
          }
          c2 = -1 === h || -1 === k ? null : { start: h, end: k };
        } else c2 = null;
      }
      c2 = c2 || { start: 0, end: 0 };
    } else c2 = null;
    Df = { focusedElem: a2, selectionRange: c2 };
    dd = false;
    for (V = b; null !== V; ) if (b = V, a2 = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a2) a2.return = b, V = a2;
    else for (; null !== V; ) {
      b = V;
      try {
        var n = b.alternate;
        if (0 !== (b.flags & 1024)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (null !== n) {
              var t2 = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J);
              x.__reactInternalSnapshotBeforeUpdate = w;
            }
            break;
          case 3:
            var u = b.stateNode.containerInfo;
            1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(p(163));
        }
      } catch (F) {
        W(b, b.return, F);
      }
      a2 = b.sibling;
      if (null !== a2) {
        a2.return = b.return;
        V = a2;
        break;
      }
      V = b.return;
    }
    n = Nj;
    Nj = false;
    return n;
  }
  function Pj(a2, b, c2) {
    var d = b.updateQueue;
    d = null !== d ? d.lastEffect : null;
    if (null !== d) {
      var e2 = d = d.next;
      do {
        if ((e2.tag & a2) === a2) {
          var f2 = e2.destroy;
          e2.destroy = void 0;
          void 0 !== f2 && Mj(b, c2, f2);
        }
        e2 = e2.next;
      } while (e2 !== d);
    }
  }
  function Qj(a2, b) {
    b = b.updateQueue;
    b = null !== b ? b.lastEffect : null;
    if (null !== b) {
      var c2 = b = b.next;
      do {
        if ((c2.tag & a2) === a2) {
          var d = c2.create;
          c2.destroy = d();
        }
        c2 = c2.next;
      } while (c2 !== b);
    }
  }
  function Rj(a2) {
    var b = a2.ref;
    if (null !== b) {
      var c2 = a2.stateNode;
      switch (a2.tag) {
        case 5:
          a2 = c2;
          break;
        default:
          a2 = c2;
      }
      "function" === typeof b ? b(a2) : b.current = a2;
    }
  }
  function Sj(a2) {
    var b = a2.alternate;
    null !== b && (a2.alternate = null, Sj(b));
    a2.child = null;
    a2.deletions = null;
    a2.sibling = null;
    5 === a2.tag && (b = a2.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
    a2.stateNode = null;
    a2.return = null;
    a2.dependencies = null;
    a2.memoizedProps = null;
    a2.memoizedState = null;
    a2.pendingProps = null;
    a2.stateNode = null;
    a2.updateQueue = null;
  }
  function Tj(a2) {
    return 5 === a2.tag || 3 === a2.tag || 4 === a2.tag;
  }
  function Uj(a2) {
    a: for (; ; ) {
      for (; null === a2.sibling; ) {
        if (null === a2.return || Tj(a2.return)) return null;
        a2 = a2.return;
      }
      a2.sibling.return = a2.return;
      for (a2 = a2.sibling; 5 !== a2.tag && 6 !== a2.tag && 18 !== a2.tag; ) {
        if (a2.flags & 2) continue a;
        if (null === a2.child || 4 === a2.tag) continue a;
        else a2.child.return = a2, a2 = a2.child;
      }
      if (!(a2.flags & 2)) return a2.stateNode;
    }
  }
  function Vj(a2, b, c2) {
    var d = a2.tag;
    if (5 === d || 6 === d) a2 = a2.stateNode, b ? 8 === c2.nodeType ? c2.parentNode.insertBefore(a2, b) : c2.insertBefore(a2, b) : (8 === c2.nodeType ? (b = c2.parentNode, b.insertBefore(a2, c2)) : (b = c2, b.appendChild(a2)), c2 = c2._reactRootContainer, null !== c2 && void 0 !== c2 || null !== b.onclick || (b.onclick = Bf));
    else if (4 !== d && (a2 = a2.child, null !== a2)) for (Vj(a2, b, c2), a2 = a2.sibling; null !== a2; ) Vj(a2, b, c2), a2 = a2.sibling;
  }
  function Wj(a2, b, c2) {
    var d = a2.tag;
    if (5 === d || 6 === d) a2 = a2.stateNode, b ? c2.insertBefore(a2, b) : c2.appendChild(a2);
    else if (4 !== d && (a2 = a2.child, null !== a2)) for (Wj(a2, b, c2), a2 = a2.sibling; null !== a2; ) Wj(a2, b, c2), a2 = a2.sibling;
  }
  var X = null, Xj = false;
  function Yj(a2, b, c2) {
    for (c2 = c2.child; null !== c2; ) Zj(a2, b, c2), c2 = c2.sibling;
  }
  function Zj(a2, b, c2) {
    if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
      lc.onCommitFiberUnmount(kc, c2);
    } catch (h) {
    }
    switch (c2.tag) {
      case 5:
        U || Lj(c2, b);
      case 6:
        var d = X, e2 = Xj;
        X = null;
        Yj(a2, b, c2);
        X = d;
        Xj = e2;
        null !== X && (Xj ? (a2 = X, c2 = c2.stateNode, 8 === a2.nodeType ? a2.parentNode.removeChild(c2) : a2.removeChild(c2)) : X.removeChild(c2.stateNode));
        break;
      case 18:
        null !== X && (Xj ? (a2 = X, c2 = c2.stateNode, 8 === a2.nodeType ? Kf(a2.parentNode, c2) : 1 === a2.nodeType && Kf(a2, c2), bd(a2)) : Kf(X, c2.stateNode));
        break;
      case 4:
        d = X;
        e2 = Xj;
        X = c2.stateNode.containerInfo;
        Xj = true;
        Yj(a2, b, c2);
        X = d;
        Xj = e2;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!U && (d = c2.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
          e2 = d = d.next;
          do {
            var f2 = e2, g = f2.destroy;
            f2 = f2.tag;
            void 0 !== g && (0 !== (f2 & 2) ? Mj(c2, b, g) : 0 !== (f2 & 4) && Mj(c2, b, g));
            e2 = e2.next;
          } while (e2 !== d);
        }
        Yj(a2, b, c2);
        break;
      case 1:
        if (!U && (Lj(c2, b), d = c2.stateNode, "function" === typeof d.componentWillUnmount)) try {
          d.props = c2.memoizedProps, d.state = c2.memoizedState, d.componentWillUnmount();
        } catch (h) {
          W(c2, b, h);
        }
        Yj(a2, b, c2);
        break;
      case 21:
        Yj(a2, b, c2);
        break;
      case 22:
        c2.mode & 1 ? (U = (d = U) || null !== c2.memoizedState, Yj(a2, b, c2), U = d) : Yj(a2, b, c2);
        break;
      default:
        Yj(a2, b, c2);
    }
  }
  function ak(a2) {
    var b = a2.updateQueue;
    if (null !== b) {
      a2.updateQueue = null;
      var c2 = a2.stateNode;
      null === c2 && (c2 = a2.stateNode = new Kj());
      b.forEach(function(b2) {
        var d = bk.bind(null, a2, b2);
        c2.has(b2) || (c2.add(b2), b2.then(d, d));
      });
    }
  }
  function ck(a2, b) {
    var c2 = b.deletions;
    if (null !== c2) for (var d = 0; d < c2.length; d++) {
      var e2 = c2[d];
      try {
        var f2 = a2, g = b, h = g;
        a: for (; null !== h; ) {
          switch (h.tag) {
            case 5:
              X = h.stateNode;
              Xj = false;
              break a;
            case 3:
              X = h.stateNode.containerInfo;
              Xj = true;
              break a;
            case 4:
              X = h.stateNode.containerInfo;
              Xj = true;
              break a;
          }
          h = h.return;
        }
        if (null === X) throw Error(p(160));
        Zj(f2, g, e2);
        X = null;
        Xj = false;
        var k = e2.alternate;
        null !== k && (k.return = null);
        e2.return = null;
      } catch (l2) {
        W(e2, b, l2);
      }
    }
    if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a2), b = b.sibling;
  }
  function dk(a2, b) {
    var c2 = a2.alternate, d = a2.flags;
    switch (a2.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ck(b, a2);
        ek(a2);
        if (d & 4) {
          try {
            Pj(3, a2, a2.return), Qj(3, a2);
          } catch (t2) {
            W(a2, a2.return, t2);
          }
          try {
            Pj(5, a2, a2.return);
          } catch (t2) {
            W(a2, a2.return, t2);
          }
        }
        break;
      case 1:
        ck(b, a2);
        ek(a2);
        d & 512 && null !== c2 && Lj(c2, c2.return);
        break;
      case 5:
        ck(b, a2);
        ek(a2);
        d & 512 && null !== c2 && Lj(c2, c2.return);
        if (a2.flags & 32) {
          var e2 = a2.stateNode;
          try {
            ob(e2, "");
          } catch (t2) {
            W(a2, a2.return, t2);
          }
        }
        if (d & 4 && (e2 = a2.stateNode, null != e2)) {
          var f2 = a2.memoizedProps, g = null !== c2 ? c2.memoizedProps : f2, h = a2.type, k = a2.updateQueue;
          a2.updateQueue = null;
          if (null !== k) try {
            "input" === h && "radio" === f2.type && null != f2.name && ab(e2, f2);
            vb(h, g);
            var l2 = vb(h, f2);
            for (g = 0; g < k.length; g += 2) {
              var m = k[g], q = k[g + 1];
              "style" === m ? sb(e2, q) : "dangerouslySetInnerHTML" === m ? nb(e2, q) : "children" === m ? ob(e2, q) : ta(e2, m, q, l2);
            }
            switch (h) {
              case "input":
                bb(e2, f2);
                break;
              case "textarea":
                ib(e2, f2);
                break;
              case "select":
                var r2 = e2._wrapperState.wasMultiple;
                e2._wrapperState.wasMultiple = !!f2.multiple;
                var y = f2.value;
                null != y ? fb(e2, !!f2.multiple, y, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                  e2,
                  !!f2.multiple,
                  f2.defaultValue,
                  true
                ) : fb(e2, !!f2.multiple, f2.multiple ? [] : "", false));
            }
            e2[Pf] = f2;
          } catch (t2) {
            W(a2, a2.return, t2);
          }
        }
        break;
      case 6:
        ck(b, a2);
        ek(a2);
        if (d & 4) {
          if (null === a2.stateNode) throw Error(p(162));
          e2 = a2.stateNode;
          f2 = a2.memoizedProps;
          try {
            e2.nodeValue = f2;
          } catch (t2) {
            W(a2, a2.return, t2);
          }
        }
        break;
      case 3:
        ck(b, a2);
        ek(a2);
        if (d & 4 && null !== c2 && c2.memoizedState.isDehydrated) try {
          bd(b.containerInfo);
        } catch (t2) {
          W(a2, a2.return, t2);
        }
        break;
      case 4:
        ck(b, a2);
        ek(a2);
        break;
      case 13:
        ck(b, a2);
        ek(a2);
        e2 = a2.child;
        e2.flags & 8192 && (f2 = null !== e2.memoizedState, e2.stateNode.isHidden = f2, !f2 || null !== e2.alternate && null !== e2.alternate.memoizedState || (fk = B()));
        d & 4 && ak(a2);
        break;
      case 22:
        m = null !== c2 && null !== c2.memoizedState;
        a2.mode & 1 ? (U = (l2 = U) || m, ck(b, a2), U = l2) : ck(b, a2);
        ek(a2);
        if (d & 8192) {
          l2 = null !== a2.memoizedState;
          if ((a2.stateNode.isHidden = l2) && !m && 0 !== (a2.mode & 1)) for (V = a2, m = a2.child; null !== m; ) {
            for (q = V = m; null !== V; ) {
              r2 = V;
              y = r2.child;
              switch (r2.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  Pj(4, r2, r2.return);
                  break;
                case 1:
                  Lj(r2, r2.return);
                  var n = r2.stateNode;
                  if ("function" === typeof n.componentWillUnmount) {
                    d = r2;
                    c2 = r2.return;
                    try {
                      b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                    } catch (t2) {
                      W(d, c2, t2);
                    }
                  }
                  break;
                case 5:
                  Lj(r2, r2.return);
                  break;
                case 22:
                  if (null !== r2.memoizedState) {
                    gk(q);
                    continue;
                  }
              }
              null !== y ? (y.return = r2, V = y) : gk(q);
            }
            m = m.sibling;
          }
          a: for (m = null, q = a2; ; ) {
            if (5 === q.tag) {
              if (null === m) {
                m = q;
                try {
                  e2 = q.stateNode, l2 ? (f2 = e2.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                } catch (t2) {
                  W(a2, a2.return, t2);
                }
              }
            } else if (6 === q.tag) {
              if (null === m) try {
                q.stateNode.nodeValue = l2 ? "" : q.memoizedProps;
              } catch (t2) {
                W(a2, a2.return, t2);
              }
            } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a2) && null !== q.child) {
              q.child.return = q;
              q = q.child;
              continue;
            }
            if (q === a2) break a;
            for (; null === q.sibling; ) {
              if (null === q.return || q.return === a2) break a;
              m === q && (m = null);
              q = q.return;
            }
            m === q && (m = null);
            q.sibling.return = q.return;
            q = q.sibling;
          }
        }
        break;
      case 19:
        ck(b, a2);
        ek(a2);
        d & 4 && ak(a2);
        break;
      case 21:
        break;
      default:
        ck(
          b,
          a2
        ), ek(a2);
    }
  }
  function ek(a2) {
    var b = a2.flags;
    if (b & 2) {
      try {
        a: {
          for (var c2 = a2.return; null !== c2; ) {
            if (Tj(c2)) {
              var d = c2;
              break a;
            }
            c2 = c2.return;
          }
          throw Error(p(160));
        }
        switch (d.tag) {
          case 5:
            var e2 = d.stateNode;
            d.flags & 32 && (ob(e2, ""), d.flags &= -33);
            var f2 = Uj(a2);
            Wj(a2, f2, e2);
            break;
          case 3:
          case 4:
            var g = d.stateNode.containerInfo, h = Uj(a2);
            Vj(a2, h, g);
            break;
          default:
            throw Error(p(161));
        }
      } catch (k) {
        W(a2, a2.return, k);
      }
      a2.flags &= -3;
    }
    b & 4096 && (a2.flags &= -4097);
  }
  function hk(a2, b, c2) {
    V = a2;
    ik(a2);
  }
  function ik(a2, b, c2) {
    for (var d = 0 !== (a2.mode & 1); null !== V; ) {
      var e2 = V, f2 = e2.child;
      if (22 === e2.tag && d) {
        var g = null !== e2.memoizedState || Jj;
        if (!g) {
          var h = e2.alternate, k = null !== h && null !== h.memoizedState || U;
          h = Jj;
          var l2 = U;
          Jj = g;
          if ((U = k) && !l2) for (V = e2; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e2) : null !== k ? (k.return = g, V = k) : jk(e2);
          for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
          V = e2;
          Jj = h;
          U = l2;
        }
        kk(a2);
      } else 0 !== (e2.subtreeFlags & 8772) && null !== f2 ? (f2.return = e2, V = f2) : kk(a2);
    }
  }
  function kk(a2) {
    for (; null !== V; ) {
      var b = V;
      if (0 !== (b.flags & 8772)) {
        var c2 = b.alternate;
        try {
          if (0 !== (b.flags & 8772)) switch (b.tag) {
            case 0:
            case 11:
            case 15:
              U || Qj(5, b);
              break;
            case 1:
              var d = b.stateNode;
              if (b.flags & 4 && !U) if (null === c2) d.componentDidMount();
              else {
                var e2 = b.elementType === b.type ? c2.memoizedProps : Ci(b.type, c2.memoizedProps);
                d.componentDidUpdate(e2, c2.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
              }
              var f2 = b.updateQueue;
              null !== f2 && sh(b, f2, d);
              break;
            case 3:
              var g = b.updateQueue;
              if (null !== g) {
                c2 = null;
                if (null !== b.child) switch (b.child.tag) {
                  case 5:
                    c2 = b.child.stateNode;
                    break;
                  case 1:
                    c2 = b.child.stateNode;
                }
                sh(b, g, c2);
              }
              break;
            case 5:
              var h = b.stateNode;
              if (null === c2 && b.flags & 4) {
                c2 = h;
                var k = b.memoizedProps;
                switch (b.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    k.autoFocus && c2.focus();
                    break;
                  case "img":
                    k.src && (c2.src = k.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (null === b.memoizedState) {
                var l2 = b.alternate;
                if (null !== l2) {
                  var m = l2.memoizedState;
                  if (null !== m) {
                    var q = m.dehydrated;
                    null !== q && bd(q);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(p(163));
          }
          U || b.flags & 512 && Rj(b);
        } catch (r2) {
          W(b, b.return, r2);
        }
      }
      if (b === a2) {
        V = null;
        break;
      }
      c2 = b.sibling;
      if (null !== c2) {
        c2.return = b.return;
        V = c2;
        break;
      }
      V = b.return;
    }
  }
  function gk(a2) {
    for (; null !== V; ) {
      var b = V;
      if (b === a2) {
        V = null;
        break;
      }
      var c2 = b.sibling;
      if (null !== c2) {
        c2.return = b.return;
        V = c2;
        break;
      }
      V = b.return;
    }
  }
  function jk(a2) {
    for (; null !== V; ) {
      var b = V;
      try {
        switch (b.tag) {
          case 0:
          case 11:
          case 15:
            var c2 = b.return;
            try {
              Qj(4, b);
            } catch (k) {
              W(b, c2, k);
            }
            break;
          case 1:
            var d = b.stateNode;
            if ("function" === typeof d.componentDidMount) {
              var e2 = b.return;
              try {
                d.componentDidMount();
              } catch (k) {
                W(b, e2, k);
              }
            }
            var f2 = b.return;
            try {
              Rj(b);
            } catch (k) {
              W(b, f2, k);
            }
            break;
          case 5:
            var g = b.return;
            try {
              Rj(b);
            } catch (k) {
              W(b, g, k);
            }
        }
      } catch (k) {
        W(b, b.return, k);
      }
      if (b === a2) {
        V = null;
        break;
      }
      var h = b.sibling;
      if (null !== h) {
        h.return = b.return;
        V = h;
        break;
      }
      V = b.return;
    }
  }
  var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
  function R() {
    return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
  }
  function yi(a2) {
    if (0 === (a2.mode & 1)) return 1;
    if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
    if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
    a2 = C;
    if (0 !== a2) return a2;
    a2 = window.event;
    a2 = void 0 === a2 ? 16 : jd(a2.type);
    return a2;
  }
  function gi(a2, b, c2, d) {
    if (50 < yk) throw yk = 0, zk = null, Error(p(185));
    Ac(a2, c2, d);
    if (0 === (K & 2) || a2 !== Q) a2 === Q && (0 === (K & 2) && (qk |= c2), 4 === T && Ck(a2, Z)), Dk(a2, d), 1 === c2 && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
  }
  function Dk(a2, b) {
    var c2 = a2.callbackNode;
    wc(a2, b);
    var d = uc(a2, a2 === Q ? Z : 0);
    if (0 === d) null !== c2 && bc(c2), a2.callbackNode = null, a2.callbackPriority = 0;
    else if (b = d & -d, a2.callbackPriority !== b) {
      null != c2 && bc(c2);
      if (1 === b) 0 === a2.tag ? ig(Ek.bind(null, a2)) : hg(Ek.bind(null, a2)), Jf(function() {
        0 === (K & 6) && jg();
      }), c2 = null;
      else {
        switch (Dc(d)) {
          case 1:
            c2 = fc;
            break;
          case 4:
            c2 = gc;
            break;
          case 16:
            c2 = hc;
            break;
          case 536870912:
            c2 = jc;
            break;
          default:
            c2 = hc;
        }
        c2 = Fk(c2, Gk.bind(null, a2));
      }
      a2.callbackPriority = b;
      a2.callbackNode = c2;
    }
  }
  function Gk(a2, b) {
    Ak = -1;
    Bk = 0;
    if (0 !== (K & 6)) throw Error(p(327));
    var c2 = a2.callbackNode;
    if (Hk() && a2.callbackNode !== c2) return null;
    var d = uc(a2, a2 === Q ? Z : 0);
    if (0 === d) return null;
    if (0 !== (d & 30) || 0 !== (d & a2.expiredLanes) || b) b = Ik(a2, d);
    else {
      b = d;
      var e2 = K;
      K |= 2;
      var f2 = Jk();
      if (Q !== a2 || Z !== b) uk = null, Gj = B() + 500, Kk(a2, b);
      do
        try {
          Lk();
          break;
        } catch (h) {
          Mk(a2, h);
        }
      while (1);
      $g();
      mk.current = f2;
      K = e2;
      null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
    }
    if (0 !== b) {
      2 === b && (e2 = xc(a2), 0 !== e2 && (d = e2, b = Nk(a2, e2)));
      if (1 === b) throw c2 = pk, Kk(a2, 0), Ck(a2, d), Dk(a2, B()), c2;
      if (6 === b) Ck(a2, d);
      else {
        e2 = a2.current.alternate;
        if (0 === (d & 30) && !Ok(e2) && (b = Ik(a2, d), 2 === b && (f2 = xc(a2), 0 !== f2 && (d = f2, b = Nk(a2, f2))), 1 === b)) throw c2 = pk, Kk(a2, 0), Ck(a2, d), Dk(a2, B()), c2;
        a2.finishedWork = e2;
        a2.finishedLanes = d;
        switch (b) {
          case 0:
          case 1:
            throw Error(p(345));
          case 2:
            Pk(a2, tk, uk);
            break;
          case 3:
            Ck(a2, d);
            if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
              if (0 !== uc(a2, 0)) break;
              e2 = a2.suspendedLanes;
              if ((e2 & d) !== d) {
                R();
                a2.pingedLanes |= a2.suspendedLanes & e2;
                break;
              }
              a2.timeoutHandle = Ff(Pk.bind(null, a2, tk, uk), b);
              break;
            }
            Pk(a2, tk, uk);
            break;
          case 4:
            Ck(a2, d);
            if ((d & 4194240) === d) break;
            b = a2.eventTimes;
            for (e2 = -1; 0 < d; ) {
              var g = 31 - oc(d);
              f2 = 1 << g;
              g = b[g];
              g > e2 && (e2 = g);
              d &= ~f2;
            }
            d = e2;
            d = B() - d;
            d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
            if (10 < d) {
              a2.timeoutHandle = Ff(Pk.bind(null, a2, tk, uk), d);
              break;
            }
            Pk(a2, tk, uk);
            break;
          case 5:
            Pk(a2, tk, uk);
            break;
          default:
            throw Error(p(329));
        }
      }
    }
    Dk(a2, B());
    return a2.callbackNode === c2 ? Gk.bind(null, a2) : null;
  }
  function Nk(a2, b) {
    var c2 = sk;
    a2.current.memoizedState.isDehydrated && (Kk(a2, b).flags |= 256);
    a2 = Ik(a2, b);
    2 !== a2 && (b = tk, tk = c2, null !== b && Fj(b));
    return a2;
  }
  function Fj(a2) {
    null === tk ? tk = a2 : tk.push.apply(tk, a2);
  }
  function Ok(a2) {
    for (var b = a2; ; ) {
      if (b.flags & 16384) {
        var c2 = b.updateQueue;
        if (null !== c2 && (c2 = c2.stores, null !== c2)) for (var d = 0; d < c2.length; d++) {
          var e2 = c2[d], f2 = e2.getSnapshot;
          e2 = e2.value;
          try {
            if (!He(f2(), e2)) return false;
          } catch (g) {
            return false;
          }
        }
      }
      c2 = b.child;
      if (b.subtreeFlags & 16384 && null !== c2) c2.return = b, b = c2;
      else {
        if (b === a2) break;
        for (; null === b.sibling; ) {
          if (null === b.return || b.return === a2) return true;
          b = b.return;
        }
        b.sibling.return = b.return;
        b = b.sibling;
      }
    }
    return true;
  }
  function Ck(a2, b) {
    b &= ~rk;
    b &= ~qk;
    a2.suspendedLanes |= b;
    a2.pingedLanes &= ~b;
    for (a2 = a2.expirationTimes; 0 < b; ) {
      var c2 = 31 - oc(b), d = 1 << c2;
      a2[c2] = -1;
      b &= ~d;
    }
  }
  function Ek(a2) {
    if (0 !== (K & 6)) throw Error(p(327));
    Hk();
    var b = uc(a2, 0);
    if (0 === (b & 1)) return Dk(a2, B()), null;
    var c2 = Ik(a2, b);
    if (0 !== a2.tag && 2 === c2) {
      var d = xc(a2);
      0 !== d && (b = d, c2 = Nk(a2, d));
    }
    if (1 === c2) throw c2 = pk, Kk(a2, 0), Ck(a2, b), Dk(a2, B()), c2;
    if (6 === c2) throw Error(p(345));
    a2.finishedWork = a2.current.alternate;
    a2.finishedLanes = b;
    Pk(a2, tk, uk);
    Dk(a2, B());
    return null;
  }
  function Qk(a2, b) {
    var c2 = K;
    K |= 1;
    try {
      return a2(b);
    } finally {
      K = c2, 0 === K && (Gj = B() + 500, fg && jg());
    }
  }
  function Rk(a2) {
    null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
    var b = K;
    K |= 1;
    var c2 = ok.transition, d = C;
    try {
      if (ok.transition = null, C = 1, a2) return a2();
    } finally {
      C = d, ok.transition = c2, K = b, 0 === (K & 6) && jg();
    }
  }
  function Hj() {
    fj = ej.current;
    E(ej);
  }
  function Kk(a2, b) {
    a2.finishedWork = null;
    a2.finishedLanes = 0;
    var c2 = a2.timeoutHandle;
    -1 !== c2 && (a2.timeoutHandle = -1, Gf(c2));
    if (null !== Y) for (c2 = Y.return; null !== c2; ) {
      var d = c2;
      wg(d);
      switch (d.tag) {
        case 1:
          d = d.type.childContextTypes;
          null !== d && void 0 !== d && $f();
          break;
        case 3:
          zh();
          E(Wf);
          E(H);
          Eh();
          break;
        case 5:
          Bh(d);
          break;
        case 4:
          zh();
          break;
        case 13:
          E(L);
          break;
        case 19:
          E(L);
          break;
        case 10:
          ah(d.type._context);
          break;
        case 22:
        case 23:
          Hj();
      }
      c2 = c2.return;
    }
    Q = a2;
    Y = a2 = Pg(a2.current, null);
    Z = fj = b;
    T = 0;
    pk = null;
    rk = qk = rh = 0;
    tk = sk = null;
    if (null !== fh) {
      for (b = 0; b < fh.length; b++) if (c2 = fh[b], d = c2.interleaved, null !== d) {
        c2.interleaved = null;
        var e2 = d.next, f2 = c2.pending;
        if (null !== f2) {
          var g = f2.next;
          f2.next = e2;
          d.next = g;
        }
        c2.pending = d;
      }
      fh = null;
    }
    return a2;
  }
  function Mk(a2, b) {
    do {
      var c2 = Y;
      try {
        $g();
        Fh.current = Rh;
        if (Ih) {
          for (var d = M.memoizedState; null !== d; ) {
            var e2 = d.queue;
            null !== e2 && (e2.pending = null);
            d = d.next;
          }
          Ih = false;
        }
        Hh = 0;
        O = N = M = null;
        Jh = false;
        Kh = 0;
        nk.current = null;
        if (null === c2 || null === c2.return) {
          T = 1;
          pk = b;
          Y = null;
          break;
        }
        a: {
          var f2 = a2, g = c2.return, h = c2, k = b;
          b = Z;
          h.flags |= 32768;
          if (null !== k && "object" === typeof k && "function" === typeof k.then) {
            var l2 = k, m = h, q = m.tag;
            if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
              var r2 = m.alternate;
              r2 ? (m.updateQueue = r2.updateQueue, m.memoizedState = r2.memoizedState, m.lanes = r2.lanes) : (m.updateQueue = null, m.memoizedState = null);
            }
            var y = Ui(g);
            if (null !== y) {
              y.flags &= -257;
              Vi(y, g, h, f2, b);
              y.mode & 1 && Si(f2, l2, b);
              b = y;
              k = l2;
              var n = b.updateQueue;
              if (null === n) {
                var t2 = /* @__PURE__ */ new Set();
                t2.add(k);
                b.updateQueue = t2;
              } else n.add(k);
              break a;
            } else {
              if (0 === (b & 1)) {
                Si(f2, l2, b);
                tj();
                break a;
              }
              k = Error(p(426));
            }
          } else if (I && h.mode & 1) {
            var J = Ui(g);
            if (null !== J) {
              0 === (J.flags & 65536) && (J.flags |= 256);
              Vi(J, g, h, f2, b);
              Jg(Ji(k, h));
              break a;
            }
          }
          f2 = k = Ji(k, h);
          4 !== T && (T = 2);
          null === sk ? sk = [f2] : sk.push(f2);
          f2 = g;
          do {
            switch (f2.tag) {
              case 3:
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var x = Ni(f2, k, b);
                ph(f2, x);
                break a;
              case 1:
                h = k;
                var w = f2.type, u = f2.stateNode;
                if (0 === (f2.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                  f2.flags |= 65536;
                  b &= -b;
                  f2.lanes |= b;
                  var F = Qi(f2, h, b);
                  ph(f2, F);
                  break a;
                }
            }
            f2 = f2.return;
          } while (null !== f2);
        }
        Sk(c2);
      } catch (na) {
        b = na;
        Y === c2 && null !== c2 && (Y = c2 = c2.return);
        continue;
      }
      break;
    } while (1);
  }
  function Jk() {
    var a2 = mk.current;
    mk.current = Rh;
    return null === a2 ? Rh : a2;
  }
  function tj() {
    if (0 === T || 3 === T || 2 === T) T = 4;
    null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
  }
  function Ik(a2, b) {
    var c2 = K;
    K |= 2;
    var d = Jk();
    if (Q !== a2 || Z !== b) uk = null, Kk(a2, b);
    do
      try {
        Tk();
        break;
      } catch (e2) {
        Mk(a2, e2);
      }
    while (1);
    $g();
    K = c2;
    mk.current = d;
    if (null !== Y) throw Error(p(261));
    Q = null;
    Z = 0;
    return T;
  }
  function Tk() {
    for (; null !== Y; ) Uk(Y);
  }
  function Lk() {
    for (; null !== Y && !cc(); ) Uk(Y);
  }
  function Uk(a2) {
    var b = Vk(a2.alternate, a2, fj);
    a2.memoizedProps = a2.pendingProps;
    null === b ? Sk(a2) : Y = b;
    nk.current = null;
  }
  function Sk(a2) {
    var b = a2;
    do {
      var c2 = b.alternate;
      a2 = b.return;
      if (0 === (b.flags & 32768)) {
        if (c2 = Ej(c2, b, fj), null !== c2) {
          Y = c2;
          return;
        }
      } else {
        c2 = Ij(c2, b);
        if (null !== c2) {
          c2.flags &= 32767;
          Y = c2;
          return;
        }
        if (null !== a2) a2.flags |= 32768, a2.subtreeFlags = 0, a2.deletions = null;
        else {
          T = 6;
          Y = null;
          return;
        }
      }
      b = b.sibling;
      if (null !== b) {
        Y = b;
        return;
      }
      Y = b = a2;
    } while (null !== b);
    0 === T && (T = 5);
  }
  function Pk(a2, b, c2) {
    var d = C, e2 = ok.transition;
    try {
      ok.transition = null, C = 1, Wk(a2, b, c2, d);
    } finally {
      ok.transition = e2, C = d;
    }
    return null;
  }
  function Wk(a2, b, c2, d) {
    do
      Hk();
    while (null !== wk);
    if (0 !== (K & 6)) throw Error(p(327));
    c2 = a2.finishedWork;
    var e2 = a2.finishedLanes;
    if (null === c2) return null;
    a2.finishedWork = null;
    a2.finishedLanes = 0;
    if (c2 === a2.current) throw Error(p(177));
    a2.callbackNode = null;
    a2.callbackPriority = 0;
    var f2 = c2.lanes | c2.childLanes;
    Bc(a2, f2);
    a2 === Q && (Y = Q = null, Z = 0);
    0 === (c2.subtreeFlags & 2064) && 0 === (c2.flags & 2064) || vk || (vk = true, Fk(hc, function() {
      Hk();
      return null;
    }));
    f2 = 0 !== (c2.flags & 15990);
    if (0 !== (c2.subtreeFlags & 15990) || f2) {
      f2 = ok.transition;
      ok.transition = null;
      var g = C;
      C = 1;
      var h = K;
      K |= 4;
      nk.current = null;
      Oj(a2, c2);
      dk(c2, a2);
      Oe(Df);
      dd = !!Cf;
      Df = Cf = null;
      a2.current = c2;
      hk(c2);
      dc();
      K = h;
      C = g;
      ok.transition = f2;
    } else a2.current = c2;
    vk && (vk = false, wk = a2, xk = e2);
    f2 = a2.pendingLanes;
    0 === f2 && (Ri = null);
    mc(c2.stateNode);
    Dk(a2, B());
    if (null !== b) for (d = a2.onRecoverableError, c2 = 0; c2 < b.length; c2++) e2 = b[c2], d(e2.value, { componentStack: e2.stack, digest: e2.digest });
    if (Oi) throw Oi = false, a2 = Pi, Pi = null, a2;
    0 !== (xk & 1) && 0 !== a2.tag && Hk();
    f2 = a2.pendingLanes;
    0 !== (f2 & 1) ? a2 === zk ? yk++ : (yk = 0, zk = a2) : yk = 0;
    jg();
    return null;
  }
  function Hk() {
    if (null !== wk) {
      var a2 = Dc(xk), b = ok.transition, c2 = C;
      try {
        ok.transition = null;
        C = 16 > a2 ? 16 : a2;
        if (null === wk) var d = false;
        else {
          a2 = wk;
          wk = null;
          xk = 0;
          if (0 !== (K & 6)) throw Error(p(331));
          var e2 = K;
          K |= 4;
          for (V = a2.current; null !== V; ) {
            var f2 = V, g = f2.child;
            if (0 !== (V.flags & 16)) {
              var h = f2.deletions;
              if (null !== h) {
                for (var k = 0; k < h.length; k++) {
                  var l2 = h[k];
                  for (V = l2; null !== V; ) {
                    var m = V;
                    switch (m.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Pj(8, m, f2);
                    }
                    var q = m.child;
                    if (null !== q) q.return = m, V = q;
                    else for (; null !== V; ) {
                      m = V;
                      var r2 = m.sibling, y = m.return;
                      Sj(m);
                      if (m === l2) {
                        V = null;
                        break;
                      }
                      if (null !== r2) {
                        r2.return = y;
                        V = r2;
                        break;
                      }
                      V = y;
                    }
                  }
                }
                var n = f2.alternate;
                if (null !== n) {
                  var t2 = n.child;
                  if (null !== t2) {
                    n.child = null;
                    do {
                      var J = t2.sibling;
                      t2.sibling = null;
                      t2 = J;
                    } while (null !== t2);
                  }
                }
                V = f2;
              }
            }
            if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
            else b: for (; null !== V; ) {
              f2 = V;
              if (0 !== (f2.flags & 2048)) switch (f2.tag) {
                case 0:
                case 11:
                case 15:
                  Pj(9, f2, f2.return);
              }
              var x = f2.sibling;
              if (null !== x) {
                x.return = f2.return;
                V = x;
                break b;
              }
              V = f2.return;
            }
          }
          var w = a2.current;
          for (V = w; null !== V; ) {
            g = V;
            var u = g.child;
            if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
            else b: for (g = w; null !== V; ) {
              h = V;
              if (0 !== (h.flags & 2048)) try {
                switch (h.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Qj(9, h);
                }
              } catch (na) {
                W(h, h.return, na);
              }
              if (h === g) {
                V = null;
                break b;
              }
              var F = h.sibling;
              if (null !== F) {
                F.return = h.return;
                V = F;
                break b;
              }
              V = h.return;
            }
          }
          K = e2;
          jg();
          if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
            lc.onPostCommitFiberRoot(kc, a2);
          } catch (na) {
          }
          d = true;
        }
        return d;
      } finally {
        C = c2, ok.transition = b;
      }
    }
    return false;
  }
  function Xk(a2, b, c2) {
    b = Ji(c2, b);
    b = Ni(a2, b, 1);
    a2 = nh(a2, b, 1);
    b = R();
    null !== a2 && (Ac(a2, 1, b), Dk(a2, b));
  }
  function W(a2, b, c2) {
    if (3 === a2.tag) Xk(a2, a2, c2);
    else for (; null !== b; ) {
      if (3 === b.tag) {
        Xk(b, a2, c2);
        break;
      } else if (1 === b.tag) {
        var d = b.stateNode;
        if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
          a2 = Ji(c2, a2);
          a2 = Qi(b, a2, 1);
          b = nh(b, a2, 1);
          a2 = R();
          null !== b && (Ac(b, 1, a2), Dk(b, a2));
          break;
        }
      }
      b = b.return;
    }
  }
  function Ti(a2, b, c2) {
    var d = a2.pingCache;
    null !== d && d.delete(b);
    b = R();
    a2.pingedLanes |= a2.suspendedLanes & c2;
    Q === a2 && (Z & c2) === c2 && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a2, 0) : rk |= c2);
    Dk(a2, b);
  }
  function Yk(a2, b) {
    0 === b && (0 === (a2.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
    var c2 = R();
    a2 = ih(a2, b);
    null !== a2 && (Ac(a2, b, c2), Dk(a2, c2));
  }
  function uj(a2) {
    var b = a2.memoizedState, c2 = 0;
    null !== b && (c2 = b.retryLane);
    Yk(a2, c2);
  }
  function bk(a2, b) {
    var c2 = 0;
    switch (a2.tag) {
      case 13:
        var d = a2.stateNode;
        var e2 = a2.memoizedState;
        null !== e2 && (c2 = e2.retryLane);
        break;
      case 19:
        d = a2.stateNode;
        break;
      default:
        throw Error(p(314));
    }
    null !== d && d.delete(b);
    Yk(a2, c2);
  }
  var Vk;
  Vk = function(a2, b, c2) {
    if (null !== a2) if (a2.memoizedProps !== b.pendingProps || Wf.current) dh = true;
    else {
      if (0 === (a2.lanes & c2) && 0 === (b.flags & 128)) return dh = false, yj(a2, b, c2);
      dh = 0 !== (a2.flags & 131072) ? true : false;
    }
    else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
    b.lanes = 0;
    switch (b.tag) {
      case 2:
        var d = b.type;
        ij(a2, b);
        a2 = b.pendingProps;
        var e2 = Yf(b, H.current);
        ch(b, c2);
        e2 = Nh(null, b, d, a2, e2, c2);
        var f2 = Sh();
        b.flags |= 1;
        "object" === typeof e2 && null !== e2 && "function" === typeof e2.render && void 0 === e2.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e2.state && void 0 !== e2.state ? e2.state : null, kh(b), e2.updater = Ei, b.stateNode = e2, e2._reactInternals = b, Ii(b, d, a2, c2), b = jj(null, b, d, true, f2, c2)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e2, c2), b = b.child);
        return b;
      case 16:
        d = b.elementType;
        a: {
          ij(a2, b);
          a2 = b.pendingProps;
          e2 = d._init;
          d = e2(d._payload);
          b.type = d;
          e2 = b.tag = Zk(d);
          a2 = Ci(d, a2);
          switch (e2) {
            case 0:
              b = cj(null, b, d, a2, c2);
              break a;
            case 1:
              b = hj(null, b, d, a2, c2);
              break a;
            case 11:
              b = Yi(null, b, d, a2, c2);
              break a;
            case 14:
              b = $i(null, b, d, Ci(d.type, a2), c2);
              break a;
          }
          throw Error(p(
            306,
            d,
            ""
          ));
        }
        return b;
      case 0:
        return d = b.type, e2 = b.pendingProps, e2 = b.elementType === d ? e2 : Ci(d, e2), cj(a2, b, d, e2, c2);
      case 1:
        return d = b.type, e2 = b.pendingProps, e2 = b.elementType === d ? e2 : Ci(d, e2), hj(a2, b, d, e2, c2);
      case 3:
        a: {
          kj(b);
          if (null === a2) throw Error(p(387));
          d = b.pendingProps;
          f2 = b.memoizedState;
          e2 = f2.element;
          lh(a2, b);
          qh(b, d, null, c2);
          var g = b.memoizedState;
          d = g.element;
          if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
            e2 = Ji(Error(p(423)), b);
            b = lj(a2, b, d, c2, e2);
            break a;
          } else if (d !== e2) {
            e2 = Ji(Error(p(424)), b);
            b = lj(a2, b, d, c2, e2);
            break a;
          } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c2 = Vg(b, null, d, c2), b.child = c2; c2; ) c2.flags = c2.flags & -3 | 4096, c2 = c2.sibling;
          else {
            Ig();
            if (d === e2) {
              b = Zi(a2, b, c2);
              break a;
            }
            Xi(a2, b, d, c2);
          }
          b = b.child;
        }
        return b;
      case 5:
        return Ah(b), null === a2 && Eg(b), d = b.type, e2 = b.pendingProps, f2 = null !== a2 ? a2.memoizedProps : null, g = e2.children, Ef(d, e2) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a2, b), Xi(a2, b, g, c2), b.child;
      case 6:
        return null === a2 && Eg(b), null;
      case 13:
        return oj(a2, b, c2);
      case 4:
        return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a2 ? b.child = Ug(b, null, d, c2) : Xi(a2, b, d, c2), b.child;
      case 11:
        return d = b.type, e2 = b.pendingProps, e2 = b.elementType === d ? e2 : Ci(d, e2), Yi(a2, b, d, e2, c2);
      case 7:
        return Xi(a2, b, b.pendingProps, c2), b.child;
      case 8:
        return Xi(a2, b, b.pendingProps.children, c2), b.child;
      case 12:
        return Xi(a2, b, b.pendingProps.children, c2), b.child;
      case 10:
        a: {
          d = b.type._context;
          e2 = b.pendingProps;
          f2 = b.memoizedProps;
          g = e2.value;
          G2(Wg, d._currentValue);
          d._currentValue = g;
          if (null !== f2) if (He(f2.value, g)) {
            if (f2.children === e2.children && !Wf.current) {
              b = Zi(a2, b, c2);
              break a;
            }
          } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
            var h = f2.dependencies;
            if (null !== h) {
              g = f2.child;
              for (var k = h.firstContext; null !== k; ) {
                if (k.context === d) {
                  if (1 === f2.tag) {
                    k = mh(-1, c2 & -c2);
                    k.tag = 2;
                    var l2 = f2.updateQueue;
                    if (null !== l2) {
                      l2 = l2.shared;
                      var m = l2.pending;
                      null === m ? k.next = k : (k.next = m.next, m.next = k);
                      l2.pending = k;
                    }
                  }
                  f2.lanes |= c2;
                  k = f2.alternate;
                  null !== k && (k.lanes |= c2);
                  bh(
                    f2.return,
                    c2,
                    b
                  );
                  h.lanes |= c2;
                  break;
                }
                k = k.next;
              }
            } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
            else if (18 === f2.tag) {
              g = f2.return;
              if (null === g) throw Error(p(341));
              g.lanes |= c2;
              h = g.alternate;
              null !== h && (h.lanes |= c2);
              bh(g, c2, b);
              g = f2.sibling;
            } else g = f2.child;
            if (null !== g) g.return = f2;
            else for (g = f2; null !== g; ) {
              if (g === b) {
                g = null;
                break;
              }
              f2 = g.sibling;
              if (null !== f2) {
                f2.return = g.return;
                g = f2;
                break;
              }
              g = g.return;
            }
            f2 = g;
          }
          Xi(a2, b, e2.children, c2);
          b = b.child;
        }
        return b;
      case 9:
        return e2 = b.type, d = b.pendingProps.children, ch(b, c2), e2 = eh(e2), d = d(e2), b.flags |= 1, Xi(a2, b, d, c2), b.child;
      case 14:
        return d = b.type, e2 = Ci(d, b.pendingProps), e2 = Ci(d.type, e2), $i(a2, b, d, e2, c2);
      case 15:
        return bj(a2, b, b.type, b.pendingProps, c2);
      case 17:
        return d = b.type, e2 = b.pendingProps, e2 = b.elementType === d ? e2 : Ci(d, e2), ij(a2, b), b.tag = 1, Zf(d) ? (a2 = true, cg(b)) : a2 = false, ch(b, c2), Gi(b, d, e2), Ii(b, d, e2, c2), jj(null, b, d, true, a2, c2);
      case 19:
        return xj(a2, b, c2);
      case 22:
        return dj(a2, b, c2);
    }
    throw Error(p(156, b.tag));
  };
  function Fk(a2, b) {
    return ac(a2, b);
  }
  function $k(a2, b, c2, d) {
    this.tag = a2;
    this.key = c2;
    this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = b;
    this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
    this.mode = d;
    this.subtreeFlags = this.flags = 0;
    this.deletions = null;
    this.childLanes = this.lanes = 0;
    this.alternate = null;
  }
  function Bg(a2, b, c2, d) {
    return new $k(a2, b, c2, d);
  }
  function aj(a2) {
    a2 = a2.prototype;
    return !(!a2 || !a2.isReactComponent);
  }
  function Zk(a2) {
    if ("function" === typeof a2) return aj(a2) ? 1 : 0;
    if (void 0 !== a2 && null !== a2) {
      a2 = a2.$$typeof;
      if (a2 === Da) return 11;
      if (a2 === Ga) return 14;
    }
    return 2;
  }
  function Pg(a2, b) {
    var c2 = a2.alternate;
    null === c2 ? (c2 = Bg(a2.tag, b, a2.key, a2.mode), c2.elementType = a2.elementType, c2.type = a2.type, c2.stateNode = a2.stateNode, c2.alternate = a2, a2.alternate = c2) : (c2.pendingProps = b, c2.type = a2.type, c2.flags = 0, c2.subtreeFlags = 0, c2.deletions = null);
    c2.flags = a2.flags & 14680064;
    c2.childLanes = a2.childLanes;
    c2.lanes = a2.lanes;
    c2.child = a2.child;
    c2.memoizedProps = a2.memoizedProps;
    c2.memoizedState = a2.memoizedState;
    c2.updateQueue = a2.updateQueue;
    b = a2.dependencies;
    c2.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
    c2.sibling = a2.sibling;
    c2.index = a2.index;
    c2.ref = a2.ref;
    return c2;
  }
  function Rg(a2, b, c2, d, e2, f2) {
    var g = 2;
    d = a2;
    if ("function" === typeof a2) aj(a2) && (g = 1);
    else if ("string" === typeof a2) g = 5;
    else a: switch (a2) {
      case ya:
        return Tg(c2.children, e2, f2, b);
      case za:
        g = 8;
        e2 |= 8;
        break;
      case Aa:
        return a2 = Bg(12, c2, b, e2 | 2), a2.elementType = Aa, a2.lanes = f2, a2;
      case Ea:
        return a2 = Bg(13, c2, b, e2), a2.elementType = Ea, a2.lanes = f2, a2;
      case Fa:
        return a2 = Bg(19, c2, b, e2), a2.elementType = Fa, a2.lanes = f2, a2;
      case Ia:
        return pj(c2, e2, f2, b);
      default:
        if ("object" === typeof a2 && null !== a2) switch (a2.$$typeof) {
          case Ba:
            g = 10;
            break a;
          case Ca:
            g = 9;
            break a;
          case Da:
            g = 11;
            break a;
          case Ga:
            g = 14;
            break a;
          case Ha:
            g = 16;
            d = null;
            break a;
        }
        throw Error(p(130, null == a2 ? a2 : typeof a2, ""));
    }
    b = Bg(g, c2, b, e2);
    b.elementType = a2;
    b.type = d;
    b.lanes = f2;
    return b;
  }
  function Tg(a2, b, c2, d) {
    a2 = Bg(7, a2, d, b);
    a2.lanes = c2;
    return a2;
  }
  function pj(a2, b, c2, d) {
    a2 = Bg(22, a2, d, b);
    a2.elementType = Ia;
    a2.lanes = c2;
    a2.stateNode = { isHidden: false };
    return a2;
  }
  function Qg(a2, b, c2) {
    a2 = Bg(6, a2, null, b);
    a2.lanes = c2;
    return a2;
  }
  function Sg(a2, b, c2) {
    b = Bg(4, null !== a2.children ? a2.children : [], a2.key, b);
    b.lanes = c2;
    b.stateNode = { containerInfo: a2.containerInfo, pendingChildren: null, implementation: a2.implementation };
    return b;
  }
  function al(a2, b, c2, d, e2) {
    this.tag = b;
    this.containerInfo = a2;
    this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
    this.timeoutHandle = -1;
    this.callbackNode = this.pendingContext = this.context = null;
    this.callbackPriority = 0;
    this.eventTimes = zc(0);
    this.expirationTimes = zc(-1);
    this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
    this.entanglements = zc(0);
    this.identifierPrefix = d;
    this.onRecoverableError = e2;
    this.mutableSourceEagerHydrationData = null;
  }
  function bl(a2, b, c2, d, e2, f2, g, h, k) {
    a2 = new al(a2, b, c2, h, k);
    1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
    f2 = Bg(3, null, null, b);
    a2.current = f2;
    f2.stateNode = a2;
    f2.memoizedState = { element: d, isDehydrated: c2, cache: null, transitions: null, pendingSuspenseBoundaries: null };
    kh(f2);
    return a2;
  }
  function cl(a2, b, c2) {
    var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
    return { $$typeof: wa, key: null == d ? null : "" + d, children: a2, containerInfo: b, implementation: c2 };
  }
  function dl(a2) {
    if (!a2) return Vf;
    a2 = a2._reactInternals;
    a: {
      if (Vb(a2) !== a2 || 1 !== a2.tag) throw Error(p(170));
      var b = a2;
      do {
        switch (b.tag) {
          case 3:
            b = b.stateNode.context;
            break a;
          case 1:
            if (Zf(b.type)) {
              b = b.stateNode.__reactInternalMemoizedMergedChildContext;
              break a;
            }
        }
        b = b.return;
      } while (null !== b);
      throw Error(p(171));
    }
    if (1 === a2.tag) {
      var c2 = a2.type;
      if (Zf(c2)) return bg(a2, c2, b);
    }
    return b;
  }
  function el(a2, b, c2, d, e2, f2, g, h, k) {
    a2 = bl(c2, d, true, a2, e2, f2, g, h, k);
    a2.context = dl(null);
    c2 = a2.current;
    d = R();
    e2 = yi(c2);
    f2 = mh(d, e2);
    f2.callback = void 0 !== b && null !== b ? b : null;
    nh(c2, f2, e2);
    a2.current.lanes = e2;
    Ac(a2, e2, d);
    Dk(a2, d);
    return a2;
  }
  function fl(a2, b, c2, d) {
    var e2 = b.current, f2 = R(), g = yi(e2);
    c2 = dl(c2);
    null === b.context ? b.context = c2 : b.pendingContext = c2;
    b = mh(f2, g);
    b.payload = { element: a2 };
    d = void 0 === d ? null : d;
    null !== d && (b.callback = d);
    a2 = nh(e2, b, g);
    null !== a2 && (gi(a2, e2, g, f2), oh(a2, e2, g));
    return g;
  }
  function gl(a2) {
    a2 = a2.current;
    if (!a2.child) return null;
    switch (a2.child.tag) {
      case 5:
        return a2.child.stateNode;
      default:
        return a2.child.stateNode;
    }
  }
  function hl(a2, b) {
    a2 = a2.memoizedState;
    if (null !== a2 && null !== a2.dehydrated) {
      var c2 = a2.retryLane;
      a2.retryLane = 0 !== c2 && c2 < b ? c2 : b;
    }
  }
  function il(a2, b) {
    hl(a2, b);
    (a2 = a2.alternate) && hl(a2, b);
  }
  function jl() {
    return null;
  }
  var kl = "function" === typeof reportError ? reportError : function(a2) {
    console.error(a2);
  };
  function ll(a2) {
    this._internalRoot = a2;
  }
  ml.prototype.render = ll.prototype.render = function(a2) {
    var b = this._internalRoot;
    if (null === b) throw Error(p(409));
    fl(a2, b, null, null);
  };
  ml.prototype.unmount = ll.prototype.unmount = function() {
    var a2 = this._internalRoot;
    if (null !== a2) {
      this._internalRoot = null;
      var b = a2.containerInfo;
      Rk(function() {
        fl(null, a2, null, null);
      });
      b[uf] = null;
    }
  };
  function ml(a2) {
    this._internalRoot = a2;
  }
  ml.prototype.unstable_scheduleHydration = function(a2) {
    if (a2) {
      var b = Hc();
      a2 = { blockedOn: null, target: a2, priority: b };
      for (var c2 = 0; c2 < Qc.length && 0 !== b && b < Qc[c2].priority; c2++) ;
      Qc.splice(c2, 0, a2);
      0 === c2 && Vc(a2);
    }
  };
  function nl(a2) {
    return !(!a2 || 1 !== a2.nodeType && 9 !== a2.nodeType && 11 !== a2.nodeType);
  }
  function ol(a2) {
    return !(!a2 || 1 !== a2.nodeType && 9 !== a2.nodeType && 11 !== a2.nodeType && (8 !== a2.nodeType || " react-mount-point-unstable " !== a2.nodeValue));
  }
  function pl() {
  }
  function ql(a2, b, c2, d, e2) {
    if (e2) {
      if ("function" === typeof d) {
        var f2 = d;
        d = function() {
          var a3 = gl(g);
          f2.call(a3);
        };
      }
      var g = el(b, d, a2, 0, null, false, false, "", pl);
      a2._reactRootContainer = g;
      a2[uf] = g.current;
      sf(8 === a2.nodeType ? a2.parentNode : a2);
      Rk();
      return g;
    }
    for (; e2 = a2.lastChild; ) a2.removeChild(e2);
    if ("function" === typeof d) {
      var h = d;
      d = function() {
        var a3 = gl(k);
        h.call(a3);
      };
    }
    var k = bl(a2, 0, false, null, null, false, false, "", pl);
    a2._reactRootContainer = k;
    a2[uf] = k.current;
    sf(8 === a2.nodeType ? a2.parentNode : a2);
    Rk(function() {
      fl(b, k, c2, d);
    });
    return k;
  }
  function rl(a2, b, c2, d, e2) {
    var f2 = c2._reactRootContainer;
    if (f2) {
      var g = f2;
      if ("function" === typeof e2) {
        var h = e2;
        e2 = function() {
          var a3 = gl(g);
          h.call(a3);
        };
      }
      fl(b, g, a2, e2);
    } else g = ql(c2, b, a2, e2, d);
    return gl(g);
  }
  Ec = function(a2) {
    switch (a2.tag) {
      case 3:
        var b = a2.stateNode;
        if (b.current.memoizedState.isDehydrated) {
          var c2 = tc(b.pendingLanes);
          0 !== c2 && (Cc(b, c2 | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
        }
        break;
      case 13:
        Rk(function() {
          var b2 = ih(a2, 1);
          if (null !== b2) {
            var c3 = R();
            gi(b2, a2, 1, c3);
          }
        }), il(a2, 1);
    }
  };
  Fc = function(a2) {
    if (13 === a2.tag) {
      var b = ih(a2, 134217728);
      if (null !== b) {
        var c2 = R();
        gi(b, a2, 134217728, c2);
      }
      il(a2, 134217728);
    }
  };
  Gc = function(a2) {
    if (13 === a2.tag) {
      var b = yi(a2), c2 = ih(a2, b);
      if (null !== c2) {
        var d = R();
        gi(c2, a2, b, d);
      }
      il(a2, b);
    }
  };
  Hc = function() {
    return C;
  };
  Ic = function(a2, b) {
    var c2 = C;
    try {
      return C = a2, b();
    } finally {
      C = c2;
    }
  };
  yb = function(a2, b, c2) {
    switch (b) {
      case "input":
        bb(a2, c2);
        b = c2.name;
        if ("radio" === c2.type && null != b) {
          for (c2 = a2; c2.parentNode; ) c2 = c2.parentNode;
          c2 = c2.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
          for (b = 0; b < c2.length; b++) {
            var d = c2[b];
            if (d !== a2 && d.form === a2.form) {
              var e2 = Db(d);
              if (!e2) throw Error(p(90));
              Wa(d);
              bb(d, e2);
            }
          }
        }
        break;
      case "textarea":
        ib(a2, c2);
        break;
      case "select":
        b = c2.value, null != b && fb(a2, !!c2.multiple, b, false);
    }
  };
  Gb = Qk;
  Hb = Rk;
  var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
  var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a2) {
    a2 = Zb(a2);
    return null === a2 ? null : a2.stateNode;
  }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
    var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!vl.isDisabled && vl.supportsFiber) try {
      kc = vl.inject(ul), lc = vl;
    } catch (a2) {
    }
  }
  reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
  reactDom_production_min.createPortal = function(a2, b) {
    var c2 = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
    if (!nl(b)) throw Error(p(200));
    return cl(a2, b, null, c2);
  };
  reactDom_production_min.createRoot = function(a2, b) {
    if (!nl(a2)) throw Error(p(299));
    var c2 = false, d = "", e2 = kl;
    null !== b && void 0 !== b && (true === b.unstable_strictMode && (c2 = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e2 = b.onRecoverableError));
    b = bl(a2, 1, false, null, null, c2, false, d, e2);
    a2[uf] = b.current;
    sf(8 === a2.nodeType ? a2.parentNode : a2);
    return new ll(b);
  };
  reactDom_production_min.findDOMNode = function(a2) {
    if (null == a2) return null;
    if (1 === a2.nodeType) return a2;
    var b = a2._reactInternals;
    if (void 0 === b) {
      if ("function" === typeof a2.render) throw Error(p(188));
      a2 = Object.keys(a2).join(",");
      throw Error(p(268, a2));
    }
    a2 = Zb(b);
    a2 = null === a2 ? null : a2.stateNode;
    return a2;
  };
  reactDom_production_min.flushSync = function(a2) {
    return Rk(a2);
  };
  reactDom_production_min.hydrate = function(a2, b, c2) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a2, b, true, c2);
  };
  reactDom_production_min.hydrateRoot = function(a2, b, c2) {
    if (!nl(a2)) throw Error(p(405));
    var d = null != c2 && c2.hydratedSources || null, e2 = false, f2 = "", g = kl;
    null !== c2 && void 0 !== c2 && (true === c2.unstable_strictMode && (e2 = true), void 0 !== c2.identifierPrefix && (f2 = c2.identifierPrefix), void 0 !== c2.onRecoverableError && (g = c2.onRecoverableError));
    b = el(b, null, a2, 1, null != c2 ? c2 : null, e2, false, f2, g);
    a2[uf] = b.current;
    sf(a2);
    if (d) for (a2 = 0; a2 < d.length; a2++) c2 = d[a2], e2 = c2._getVersion, e2 = e2(c2._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c2, e2] : b.mutableSourceEagerHydrationData.push(
      c2,
      e2
    );
    return new ml(b);
  };
  reactDom_production_min.render = function(a2, b, c2) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a2, b, false, c2);
  };
  reactDom_production_min.unmountComponentAtNode = function(a2) {
    if (!ol(a2)) throw Error(p(40));
    return a2._reactRootContainer ? (Rk(function() {
      rl(null, null, a2, false, function() {
        a2._reactRootContainer = null;
        a2[uf] = null;
      });
    }), true) : false;
  };
  reactDom_production_min.unstable_batchedUpdates = Qk;
  reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a2, b, c2, d) {
    if (!ol(c2)) throw Error(p(200));
    if (null == a2 || void 0 === a2._reactInternals) throw Error(p(38));
    return rl(a2, b, c2, false, d);
  };
  reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
  return reactDom_production_min;
}
var hasRequiredReactDom;
function requireReactDom() {
  if (hasRequiredReactDom) return reactDom.exports;
  hasRequiredReactDom = 1;
  function checkDCE() {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
    } catch (err) {
      console.error(err);
    }
  }
  {
    checkDCE();
    reactDom.exports = requireReactDom_production_min();
  }
  return reactDom.exports;
}
var hasRequiredClient;
function requireClient() {
  if (hasRequiredClient) return client;
  hasRequiredClient = 1;
  var m = requireReactDom();
  {
    client.createRoot = m.createRoot;
    client.hydrateRoot = m.hydrateRoot;
  }
  return client;
}
var clientExports = requireClient();
const ReactDOM = /* @__PURE__ */ getDefaultExportFromCjs(clientExports);
var reactDomExports = requireReactDom();
function _extends$2() {
  _extends$2 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends$2.apply(this, arguments);
}
var Action;
(function(Action2) {
  Action2["Pop"] = "POP";
  Action2["Push"] = "PUSH";
  Action2["Replace"] = "REPLACE";
})(Action || (Action = {}));
const PopStateEventType = "popstate";
function createHashHistory(options) {
  if (options === void 0) {
    options = {};
  }
  function createHashLocation(window2, globalHistory) {
    let {
      pathname = "/",
      search = "",
      hash = ""
    } = parsePath(window2.location.hash.substr(1));
    if (!pathname.startsWith("/") && !pathname.startsWith(".")) {
      pathname = "/" + pathname;
    }
    return createLocation(
      "",
      {
        pathname,
        search,
        hash
      },
      // state defaults to `null` because `window.history.state` does
      globalHistory.state && globalHistory.state.usr || null,
      globalHistory.state && globalHistory.state.key || "default"
    );
  }
  function createHashHref(window2, to) {
    let base = window2.document.querySelector("base");
    let href = "";
    if (base && base.getAttribute("href")) {
      let url2 = window2.location.href;
      let hashIndex = url2.indexOf("#");
      href = hashIndex === -1 ? url2 : url2.slice(0, hashIndex);
    }
    return href + "#" + (typeof to === "string" ? to : createPath(to));
  }
  function validateHashLocation(location2, to) {
    warning(location2.pathname.charAt(0) === "/", "relative pathnames are not supported in hash history.push(" + JSON.stringify(to) + ")");
  }
  return getUrlBasedHistory(createHashLocation, createHashHref, validateHashLocation, options);
}
function invariant(value2, message) {
  if (value2 === false || value2 === null || typeof value2 === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined") console.warn(message);
    try {
      throw new Error(message);
    } catch (e2) {
    }
  }
}
function createKey() {
  return Math.random().toString(36).substr(2, 8);
}
function getHistoryState(location2, index) {
  return {
    usr: location2.state,
    key: location2.key,
    idx: index
  };
}
function createLocation(current, to, state2, key) {
  if (state2 === void 0) {
    state2 = null;
  }
  let location2 = _extends$2({
    pathname: typeof current === "string" ? current : current.pathname,
    search: "",
    hash: ""
  }, typeof to === "string" ? parsePath(to) : to, {
    state: state2,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: to && to.key || key || createKey()
  });
  return location2;
}
function createPath(_ref) {
  let {
    pathname = "/",
    search = "",
    hash = ""
  } = _ref;
  if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
function getUrlBasedHistory(getLocation, createHref, validateLocation, options) {
  if (options === void 0) {
    options = {};
  }
  let {
    window: window2 = document.defaultView,
    v5Compat = false
  } = options;
  let globalHistory = window2.history;
  let action = Action.Pop;
  let listener = null;
  let index = getIndex();
  if (index == null) {
    index = 0;
    globalHistory.replaceState(_extends$2({}, globalHistory.state, {
      idx: index
    }), "");
  }
  function getIndex() {
    let state2 = globalHistory.state || {
      idx: null
    };
    return state2.idx;
  }
  function handlePop() {
    action = Action.Pop;
    let nextIndex = getIndex();
    let delta = nextIndex == null ? null : nextIndex - index;
    index = nextIndex;
    if (listener) {
      listener({
        action,
        location: history.location,
        delta
      });
    }
  }
  function push(to, state2) {
    action = Action.Push;
    let location2 = createLocation(history.location, to, state2);
    if (validateLocation) validateLocation(location2, to);
    index = getIndex() + 1;
    let historyState = getHistoryState(location2, index);
    let url2 = history.createHref(location2);
    try {
      globalHistory.pushState(historyState, "", url2);
    } catch (error) {
      if (error instanceof DOMException && error.name === "DataCloneError") {
        throw error;
      }
      window2.location.assign(url2);
    }
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 1
      });
    }
  }
  function replace(to, state2) {
    action = Action.Replace;
    let location2 = createLocation(history.location, to, state2);
    if (validateLocation) validateLocation(location2, to);
    index = getIndex();
    let historyState = getHistoryState(location2, index);
    let url2 = history.createHref(location2);
    globalHistory.replaceState(historyState, "", url2);
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 0
      });
    }
  }
  function createURL(to) {
    let base = window2.location.origin !== "null" ? window2.location.origin : window2.location.href;
    let href = typeof to === "string" ? to : createPath(to);
    href = href.replace(/ $/, "%20");
    invariant(base, "No window.location.(origin|href) available to create URL for href: " + href);
    return new URL(href, base);
  }
  let history = {
    get action() {
      return action;
    },
    get location() {
      return getLocation(window2, globalHistory);
    },
    listen(fn) {
      if (listener) {
        throw new Error("A history only accepts one active listener");
      }
      window2.addEventListener(PopStateEventType, handlePop);
      listener = fn;
      return () => {
        window2.removeEventListener(PopStateEventType, handlePop);
        listener = null;
      };
    },
    createHref(to) {
      return createHref(window2, to);
    },
    createURL,
    encodeLocation(to) {
      let url2 = createURL(to);
      return {
        pathname: url2.pathname,
        search: url2.search,
        hash: url2.hash
      };
    },
    push,
    replace,
    go(n) {
      return globalHistory.go(n);
    }
  };
  return history;
}
var ResultType;
(function(ResultType2) {
  ResultType2["data"] = "data";
  ResultType2["deferred"] = "deferred";
  ResultType2["redirect"] = "redirect";
  ResultType2["error"] = "error";
})(ResultType || (ResultType = {}));
function matchRoutes(routes, locationArg, basename) {
  if (basename === void 0) {
    basename = "/";
  }
  return matchRoutesImpl(routes, locationArg, basename);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
  let location2 = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
  let pathname = stripBasename(location2.pathname || "/", basename);
  if (pathname == null) {
    return null;
  }
  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  let matches = null;
  for (let i2 = 0; matches == null && i2 < branches.length; ++i2) {
    let decoded = decodePath(pathname);
    matches = matchRouteBranch(branches[i2], decoded);
  }
  return matches;
}
function flattenRoutes(routes, branches, parentsMeta, parentPath) {
  if (branches === void 0) {
    branches = [];
  }
  if (parentsMeta === void 0) {
    parentsMeta = [];
  }
  if (parentPath === void 0) {
    parentPath = "";
  }
  let flattenRoute = (route, index, relativePath) => {
    let meta = {
      relativePath: relativePath === void 0 ? route.path || "" : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };
    if (meta.relativePath.startsWith("/")) {
      invariant(meta.relativePath.startsWith(parentPath), 'Absolute route path "' + meta.relativePath + '" nested under path ' + ('"' + parentPath + '" is not valid. An absolute child route path ') + "must start with the combined path of all its parent routes.");
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        "Index routes must not have child routes. Please remove " + ('all child routes from route path "' + path + '".')
      );
      flattenRoutes(route.children, branches, routesMeta, path);
    }
    if (route.path == null && !route.index) {
      return;
    }
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta
    });
  };
  routes.forEach((route, index) => {
    var _route$path;
    if (route.path === "" || !((_route$path = route.path) != null && _route$path.includes("?"))) {
      flattenRoute(route, index);
    } else {
      for (let exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, exploded);
      }
    }
  });
  return branches;
}
function explodeOptionalSegments(path) {
  let segments = path.split("/");
  if (segments.length === 0) return [];
  let [first, ...rest] = segments;
  let isOptional = first.endsWith("?");
  let required = first.replace(/\?$/, "");
  if (rest.length === 0) {
    return isOptional ? [required, ""] : [required];
  }
  let restExploded = explodeOptionalSegments(rest.join("/"));
  let result = [];
  result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
  if (isOptional) {
    result.push(...restExploded);
  }
  return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
  branches.sort((a2, b) => a2.score !== b.score ? b.score - a2.score : compareIndexes(a2.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s2) => s2 === "*";
function computeScore(path, index) {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }
  if (index) {
    initialScore += indexRouteValue;
  }
  return segments.filter((s2) => !isSplat(s2)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a2, b) {
  let siblings = a2.length === b.length && a2.slice(0, -1).every((n, i2) => n === b[i2]);
  return siblings ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    a2[a2.length - 1] - b[b.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function matchRouteBranch(branch, pathname, allowPartial) {
  let {
    routesMeta
  } = branch;
  let matchedParams = {};
  let matchedPathname = "/";
  let matches = [];
  for (let i2 = 0; i2 < routesMeta.length; ++i2) {
    let meta = routesMeta[i2];
    let end = i2 === routesMeta.length - 1;
    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath({
      path: meta.relativePath,
      caseSensitive: meta.caseSensitive,
      end
    }, remainingPathname);
    let route = meta.route;
    if (!match) {
      return null;
    }
    Object.assign(matchedParams, match.params);
    matches.push({
      // TODO: Can this as be avoided?
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
      route
    });
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = {
      path: pattern,
      caseSensitive: false,
      end: true
    };
  }
  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
  let match = pathname.match(matcher);
  if (!match) return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params2 = compiledParams.reduce((memo, _ref, index) => {
    let {
      paramName,
      isOptional
    } = _ref;
    if (paramName === "*") {
      let splatValue = captureGroups[index] || "";
      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
    }
    const value2 = captureGroups[index];
    if (isOptional && !value2) {
      memo[paramName] = void 0;
    } else {
      memo[paramName] = (value2 || "").replace(/%2F/g, "/");
    }
    return memo;
  }, {});
  return {
    params: params2,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive, end) {
  if (caseSensitive === void 0) {
    caseSensitive = false;
  }
  if (end === void 0) {
    end = true;
  }
  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), 'Route path "' + path + '" will be treated as if it were ' + ('"' + path.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + path.replace(/\*$/, "/*") + '".'));
  let params2 = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
    params2.push({
      paramName,
      isOptional: isOptional != null
    });
    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
  });
  if (path.endsWith("*")) {
    params2.push({
      paramName: "*"
    });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else ;
  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
  return [matcher, params2];
}
function decodePath(value2) {
  try {
    return value2.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
  } catch (error) {
    warning(false, 'The URL path "' + value2 + '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' + ("encoding (" + error + ")."));
    return value2;
  }
}
function stripBasename(pathname, basename) {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
const ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const isAbsoluteUrl$1 = (url2) => ABSOLUTE_URL_REGEX$1.test(url2);
function resolvePath(to, fromPathname) {
  if (fromPathname === void 0) {
    fromPathname = "/";
  }
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname;
  if (toPathname) {
    if (isAbsoluteUrl$1(toPathname)) {
      pathname = toPathname;
    } else {
      if (toPathname.includes("//")) {
        let oldPathname = toPathname;
        toPathname = toPathname.replace(/\/\/+/g, "/");
        warning(false, "Pathnames cannot have embedded double slashes - normalizing " + (oldPathname + " -> " + toPathname));
      }
      if (toPathname.startsWith("/")) {
        pathname = resolvePathname(toPathname.substring(1), "/");
      } else {
        pathname = resolvePathname(toPathname, fromPathname);
      }
    }
  } else {
    pathname = fromPathname;
  }
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + 'a string in <Link to="..."> and the router will parse it for you.';
}
function getPathContributingMatches(matches) {
  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches, v7_relativeSplatPath) {
  let pathMatches = getPathContributingMatches(matches);
  if (v7_relativeSplatPath) {
    return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
  }
  return pathMatches.map((match) => match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
  if (isPathRelative === void 0) {
    isPathRelative = false;
  }
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = _extends$2({}, toArg);
    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
const joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
const normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
const normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
const normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
function isRouteErrorResponse(error) {
  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
const validMutationMethodsArr = ["post", "put", "patch", "delete"];
new Set(validMutationMethodsArr);
const validRequestMethodsArr = ["get", ...validMutationMethodsArr];
new Set(validRequestMethodsArr);
function _extends$1() {
  _extends$1 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends$1.apply(this, arguments);
}
const DataRouterContext = /* @__PURE__ */ reactExports.createContext(null);
const DataRouterStateContext = /* @__PURE__ */ reactExports.createContext(null);
const NavigationContext = /* @__PURE__ */ reactExports.createContext(null);
const LocationContext = /* @__PURE__ */ reactExports.createContext(null);
const RouteContext = /* @__PURE__ */ reactExports.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
const RouteErrorContext = /* @__PURE__ */ reactExports.createContext(null);
function useHref(to, _temp) {
  let {
    relative
  } = _temp === void 0 ? {} : _temp;
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    basename,
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    hash,
    pathname,
    search
  } = useResolvedPath(to, {
    relative
  });
  let joinedPathname = pathname;
  if (basename !== "/") {
    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
  }
  return navigator2.createHref({
    pathname: joinedPathname,
    search,
    hash
  });
}
function useInRouterContext() {
  return reactExports.useContext(LocationContext) != null;
}
function useLocation() {
  !useInRouterContext() ? invariant(false) : void 0;
  return reactExports.useContext(LocationContext).location;
}
function useIsomorphicLayoutEffect(cb) {
  let isStatic = reactExports.useContext(NavigationContext).static;
  if (!isStatic) {
    reactExports.useLayoutEffect(cb);
  }
}
function useNavigate() {
  let {
    isDataRoute
  } = reactExports.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  !useInRouterContext() ? invariant(false) : void 0;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  let {
    basename,
    future,
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      navigator2.go(to);
      return;
    }
    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
    if (dataRouterContext == null && basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    (!!options.replace ? navigator2.replace : navigator2.push)(path, options.state, options);
  }, [basename, navigator2, routePathnamesJson, locationPathname, dataRouterContext]);
  return navigate;
}
function useParams() {
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? routeMatch.params : {};
}
function useResolvedPath(to, _temp2) {
  let {
    relative
  } = _temp2 === void 0 ? {} : _temp2;
  let {
    future
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  return reactExports.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
}
function useRoutes(routes, locationArg) {
  return useRoutesImpl(routes, locationArg);
}
function useRoutesImpl(routes, locationArg, dataRouterState, future) {
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches: parentMatches
  } = reactExports.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  routeMatch && routeMatch.route;
  let locationFromContext = useLocation();
  let location2;
  if (locationArg) {
    var _parsedLocationArg$pa;
    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    !(parentPathnameBase === "/" || ((_parsedLocationArg$pa = parsedLocationArg.pathname) == null ? void 0 : _parsedLocationArg$pa.startsWith(parentPathnameBase))) ? invariant(false) : void 0;
    location2 = parsedLocationArg;
  } else {
    location2 = locationFromContext;
  }
  let pathname = location2.pathname || "/";
  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }
  let matches = matchRoutes(routes, {
    pathname: remainingPathname
  });
  let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
    params: Object.assign({}, parentParams, match.params),
    pathname: joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathname).pathname : match.pathname
    ]),
    pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathnameBase).pathname : match.pathnameBase
    ])
  })), parentMatches, dataRouterState, future);
  if (locationArg && renderedMatches) {
    return /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
      value: {
        location: _extends$1({
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default"
        }, location2),
        navigationType: Action.Pop
      }
    }, renderedMatches);
  }
  return renderedMatches;
}
function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error) ? error.status + " " + error.statusText : error instanceof Error ? error.message : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = {
    padding: "0.5rem",
    backgroundColor: lightgrey
  };
  let devInfo = null;
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ reactExports.createElement("h3", {
    style: {
      fontStyle: "italic"
    }
  }, message), stack ? /* @__PURE__ */ reactExports.createElement("pre", {
    style: preStyles
  }, stack) : null, devInfo);
}
const defaultErrorElement = /* @__PURE__ */ reactExports.createElement(DefaultErrorComponent, null);
class RenderErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  static getDerivedStateFromProps(props, state2) {
    if (state2.location !== props.location || state2.revalidation !== "idle" && props.revalidation === "idle") {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation
      };
    }
    return {
      error: props.error !== void 0 ? props.error : state2.error,
      location: state2.location,
      revalidation: props.revalidation || state2.revalidation
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Router caught the following error during render", error, errorInfo);
  }
  render() {
    return this.state.error !== void 0 ? /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
      value: this.props.routeContext
    }, /* @__PURE__ */ reactExports.createElement(RouteErrorContext.Provider, {
      value: this.state.error,
      children: this.props.component
    })) : this.props.children;
  }
}
function RenderedRoute(_ref) {
  let {
    routeContext,
    match,
    children
  } = _ref;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
    value: routeContext
  }, children);
}
function _renderMatches(matches, parentMatches, dataRouterState, future) {
  var _dataRouterState;
  if (parentMatches === void 0) {
    parentMatches = [];
  }
  if (dataRouterState === void 0) {
    dataRouterState = null;
  }
  if (future === void 0) {
    future = null;
  }
  if (matches == null) {
    var _future;
    if (!dataRouterState) {
      return null;
    }
    if (dataRouterState.errors) {
      matches = dataRouterState.matches;
    } else if ((_future = future) != null && _future.v7_partialHydration && parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
      matches = dataRouterState.matches;
    } else {
      return null;
    }
  }
  let renderedMatches = matches;
  let errors = (_dataRouterState = dataRouterState) == null ? void 0 : _dataRouterState.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex((m) => m.route.id && (errors == null ? void 0 : errors[m.route.id]) !== void 0);
    !(errorIndex >= 0) ? invariant(false) : void 0;
    renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
  }
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterState && future && future.v7_partialHydration) {
    for (let i2 = 0; i2 < renderedMatches.length; i2++) {
      let match = renderedMatches[i2];
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i2;
      }
      if (match.route.id) {
        let {
          loaderData,
          errors: errors2
        } = dataRouterState;
        let needsToRunLoader = match.route.loader && loaderData[match.route.id] === void 0 && (!errors2 || errors2[match.route.id] === void 0);
        if (match.route.lazy || needsToRunLoader) {
          renderFallback = true;
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }
  return renderedMatches.reduceRight((outlet, match, index) => {
    let error;
    let shouldRenderHydrateFallback = false;
    let errorElement = null;
    let hydrateFallbackElement = null;
    if (dataRouterState) {
      error = errors && match.route.id ? errors[match.route.id] : void 0;
      errorElement = match.route.errorElement || defaultErrorElement;
      if (renderFallback) {
        if (fallbackIndex < 0 && index === 0) {
          warningOnce("route-fallback");
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = null;
        } else if (fallbackIndex === index) {
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = match.route.hydrateFallbackElement || null;
        }
      }
    }
    let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
    let getChildren = () => {
      let children;
      if (error) {
        children = errorElement;
      } else if (shouldRenderHydrateFallback) {
        children = hydrateFallbackElement;
      } else if (match.route.Component) {
        children = /* @__PURE__ */ reactExports.createElement(match.route.Component, null);
      } else if (match.route.element) {
        children = match.route.element;
      } else {
        children = outlet;
      }
      return /* @__PURE__ */ reactExports.createElement(RenderedRoute, {
        match,
        routeContext: {
          outlet,
          matches: matches2,
          isDataRoute: dataRouterState != null
        },
        children
      });
    };
    return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ reactExports.createElement(RenderErrorBoundary, {
      location: dataRouterState.location,
      revalidation: dataRouterState.revalidation,
      component: errorElement,
      error,
      children: getChildren(),
      routeContext: {
        outlet: null,
        matches: matches2,
        isDataRoute: true
      }
    }) : getChildren();
  }, null);
}
var DataRouterHook$1 = /* @__PURE__ */ (function(DataRouterHook2) {
  DataRouterHook2["UseBlocker"] = "useBlocker";
  DataRouterHook2["UseRevalidator"] = "useRevalidator";
  DataRouterHook2["UseNavigateStable"] = "useNavigate";
  return DataRouterHook2;
})(DataRouterHook$1 || {});
var DataRouterStateHook$1 = /* @__PURE__ */ (function(DataRouterStateHook2) {
  DataRouterStateHook2["UseBlocker"] = "useBlocker";
  DataRouterStateHook2["UseLoaderData"] = "useLoaderData";
  DataRouterStateHook2["UseActionData"] = "useActionData";
  DataRouterStateHook2["UseRouteError"] = "useRouteError";
  DataRouterStateHook2["UseNavigation"] = "useNavigation";
  DataRouterStateHook2["UseRouteLoaderData"] = "useRouteLoaderData";
  DataRouterStateHook2["UseMatches"] = "useMatches";
  DataRouterStateHook2["UseRevalidator"] = "useRevalidator";
  DataRouterStateHook2["UseNavigateStable"] = "useNavigate";
  DataRouterStateHook2["UseRouteId"] = "useRouteId";
  return DataRouterStateHook2;
})(DataRouterStateHook$1 || {});
function useDataRouterContext$1(hookName) {
  let ctx = reactExports.useContext(DataRouterContext);
  !ctx ? invariant(false) : void 0;
  return ctx;
}
function useDataRouterState(hookName) {
  let state2 = reactExports.useContext(DataRouterStateContext);
  !state2 ? invariant(false) : void 0;
  return state2;
}
function useRouteContext(hookName) {
  let route = reactExports.useContext(RouteContext);
  !route ? invariant(false) : void 0;
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext();
  let thisRoute = route.matches[route.matches.length - 1];
  !thisRoute.route.id ? invariant(false) : void 0;
  return thisRoute.route.id;
}
function useRouteError() {
  var _state$errors;
  let error = reactExports.useContext(RouteErrorContext);
  let state2 = useDataRouterState();
  let routeId = useCurrentRouteId();
  if (error !== void 0) {
    return error;
  }
  return (_state$errors = state2.errors) == null ? void 0 : _state$errors[routeId];
}
function useNavigateStable() {
  let {
    router
  } = useDataRouterContext$1(DataRouterHook$1.UseNavigateStable);
  let id = useCurrentRouteId(DataRouterStateHook$1.UseNavigateStable);
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      router.navigate(to);
    } else {
      router.navigate(to, _extends$1({
        fromRouteId: id
      }, options));
    }
  }, [router, id]);
  return navigate;
}
const alreadyWarned$1 = {};
function warningOnce(key, cond, message) {
  if (!alreadyWarned$1[key]) {
    alreadyWarned$1[key] = true;
  }
}
function logV6DeprecationWarnings(renderFuture, routerFuture) {
  if ((renderFuture == null ? void 0 : renderFuture.v7_startTransition) === void 0) ;
  if ((renderFuture == null ? void 0 : renderFuture.v7_relativeSplatPath) === void 0 && true) ;
}
function Navigate(_ref4) {
  let {
    to,
    replace: replace2,
    state: state2,
    relative
  } = _ref4;
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    future,
    static: isStatic
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let navigate = useNavigate();
  let path = resolveTo(to, getResolveToMatches(matches, future.v7_relativeSplatPath), locationPathname, relative === "path");
  let jsonPath = JSON.stringify(path);
  reactExports.useEffect(() => navigate(JSON.parse(jsonPath), {
    replace: replace2,
    state: state2,
    relative
  }), [navigate, jsonPath, relative, replace2, state2]);
  return null;
}
function Route(_props) {
  invariant(false);
}
function Router(_ref5) {
  let {
    basename: basenameProp = "/",
    children = null,
    location: locationProp,
    navigationType = Action.Pop,
    navigator: navigator2,
    static: staticProp = false,
    future
  } = _ref5;
  !!useInRouterContext() ? invariant(false) : void 0;
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = reactExports.useMemo(() => ({
    basename,
    navigator: navigator2,
    static: staticProp,
    future: _extends$1({
      v7_relativeSplatPath: false
    }, future)
  }), [basename, future, navigator2, staticProp]);
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state: state2 = null,
    key = "default"
  } = locationProp;
  let locationContext = reactExports.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state: state2,
        key
      },
      navigationType
    };
  }, [basename, pathname, search, hash, state2, key, navigationType]);
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(NavigationContext.Provider, {
    value: navigationContext
  }, /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
    children,
    value: locationContext
  }));
}
function Routes(_ref6) {
  let {
    children,
    location: location2
  } = _ref6;
  return useRoutes(createRoutesFromChildren(children), location2);
}
new Promise(() => {
});
function createRoutesFromChildren(children, parentPath) {
  if (parentPath === void 0) {
    parentPath = [];
  }
  let routes = [];
  reactExports.Children.forEach(children, (element, index) => {
    if (!/* @__PURE__ */ reactExports.isValidElement(element)) {
      return;
    }
    let treePath = [...parentPath, index];
    if (element.type === reactExports.Fragment) {
      routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
      return;
    }
    !(element.type === Route) ? invariant(false) : void 0;
    !(!element.props.index || !element.props.children) ? invariant(false) : void 0;
    let route = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      Component: element.props.Component,
      index: element.props.index,
      path: element.props.path,
      loader: element.props.loader,
      action: element.props.action,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary: element.props.ErrorBoundary != null || element.props.errorElement != null,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
      lazy: element.props.lazy
    };
    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children, treePath);
    }
    routes.push(route);
  });
  return routes;
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i2;
  for (i2 = 0; i2 < sourceKeys.length; i2++) {
    key = sourceKeys[i2];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && // Ignore everything but left clicks
  (!target || target === "_self") && // Let browser handle "target=_blank" etc.
  !isModifiedEvent(event);
}
const _excluded = ["onClick", "relative", "reloadDocument", "replace", "state", "target", "to", "preventScrollReset", "viewTransition"], _excluded2 = ["aria-current", "caseSensitive", "className", "end", "style", "to", "viewTransition", "children"];
const REACT_ROUTER_VERSION = "6";
try {
  window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e2) {
}
const ViewTransitionContext = /* @__PURE__ */ reactExports.createContext({
  isTransitioning: false
});
const START_TRANSITION = "startTransition";
const startTransitionImpl = React$1[START_TRANSITION];
function HashRouter(_ref5) {
  let {
    basename,
    children,
    future,
    window: window2
  } = _ref5;
  let historyRef = reactExports.useRef();
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({
      window: window2,
      v5Compat: true
    });
  }
  let history = historyRef.current;
  let [state2, setStateImpl] = reactExports.useState({
    action: history.action,
    location: history.location
  });
  let {
    v7_startTransition
  } = future || {};
  let setState = reactExports.useCallback((newState) => {
    v7_startTransition && startTransitionImpl ? startTransitionImpl(() => setStateImpl(newState)) : setStateImpl(newState);
  }, [setStateImpl, v7_startTransition]);
  reactExports.useLayoutEffect(() => history.listen(setState), [history, setState]);
  reactExports.useEffect(() => logV6DeprecationWarnings(future), [future]);
  return /* @__PURE__ */ reactExports.createElement(Router, {
    basename,
    children,
    location: state2.location,
    navigationType: state2.action,
    navigator: history,
    future
  });
}
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const Link = /* @__PURE__ */ reactExports.forwardRef(function LinkWithRef(_ref7, ref) {
  let {
    onClick,
    relative,
    reloadDocument,
    replace: replace2,
    state: state2,
    target,
    to,
    preventScrollReset,
    viewTransition
  } = _ref7, rest = _objectWithoutPropertiesLoose(_ref7, _excluded);
  let {
    basename
  } = reactExports.useContext(NavigationContext);
  let absoluteHref;
  let isExternal = false;
  if (typeof to === "string" && ABSOLUTE_URL_REGEX.test(to)) {
    absoluteHref = to;
    if (isBrowser) {
      try {
        let currentUrl = new URL(window.location.href);
        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
        let path = stripBasename(targetUrl.pathname, basename);
        if (targetUrl.origin === currentUrl.origin && path != null) {
          to = path + targetUrl.search + targetUrl.hash;
        } else {
          isExternal = true;
        }
      } catch (e2) {
      }
    }
  }
  let href = useHref(to, {
    relative
  });
  let internalOnClick = useLinkClickHandler(to, {
    replace: replace2,
    state: state2,
    target,
    preventScrollReset,
    relative,
    viewTransition
  });
  function handleClick(event) {
    if (onClick) onClick(event);
    if (!event.defaultPrevented) {
      internalOnClick(event);
    }
  }
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    /* @__PURE__ */ reactExports.createElement("a", _extends({}, rest, {
      href: absoluteHref || href,
      onClick: isExternal || reloadDocument ? onClick : handleClick,
      ref,
      target
    }))
  );
});
const NavLink = /* @__PURE__ */ reactExports.forwardRef(function NavLinkWithRef(_ref8, ref) {
  let {
    "aria-current": ariaCurrentProp = "page",
    caseSensitive = false,
    className: classNameProp = "",
    end = false,
    style: styleProp,
    to,
    viewTransition,
    children
  } = _ref8, rest = _objectWithoutPropertiesLoose(_ref8, _excluded2);
  let path = useResolvedPath(to, {
    relative: rest.relative
  });
  let location2 = useLocation();
  let routerState = reactExports.useContext(DataRouterStateContext);
  let {
    navigator: navigator2,
    basename
  } = reactExports.useContext(NavigationContext);
  let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useViewTransitionState(path) && viewTransition === true;
  let toPathname = navigator2.encodeLocation ? navigator2.encodeLocation(path).pathname : path.pathname;
  let locationPathname = location2.pathname;
  let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
  if (!caseSensitive) {
    locationPathname = locationPathname.toLowerCase();
    nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
    toPathname = toPathname.toLowerCase();
  }
  if (nextLocationPathname && basename) {
    nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
  }
  const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
  let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
  let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
  let renderProps = {
    isActive,
    isPending,
    isTransitioning
  };
  let ariaCurrent = isActive ? ariaCurrentProp : void 0;
  let className;
  if (typeof classNameProp === "function") {
    className = classNameProp(renderProps);
  } else {
    className = [classNameProp, isActive ? "active" : null, isPending ? "pending" : null, isTransitioning ? "transitioning" : null].filter(Boolean).join(" ");
  }
  let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
  return /* @__PURE__ */ reactExports.createElement(Link, _extends({}, rest, {
    "aria-current": ariaCurrent,
    className,
    ref,
    style,
    to,
    viewTransition
  }), typeof children === "function" ? children(renderProps) : children);
});
var DataRouterHook;
(function(DataRouterHook2) {
  DataRouterHook2["UseScrollRestoration"] = "useScrollRestoration";
  DataRouterHook2["UseSubmit"] = "useSubmit";
  DataRouterHook2["UseSubmitFetcher"] = "useSubmitFetcher";
  DataRouterHook2["UseFetcher"] = "useFetcher";
  DataRouterHook2["useViewTransitionState"] = "useViewTransitionState";
})(DataRouterHook || (DataRouterHook = {}));
var DataRouterStateHook;
(function(DataRouterStateHook2) {
  DataRouterStateHook2["UseFetcher"] = "useFetcher";
  DataRouterStateHook2["UseFetchers"] = "useFetchers";
  DataRouterStateHook2["UseScrollRestoration"] = "useScrollRestoration";
})(DataRouterStateHook || (DataRouterStateHook = {}));
function useDataRouterContext(hookName) {
  let ctx = reactExports.useContext(DataRouterContext);
  !ctx ? invariant(false) : void 0;
  return ctx;
}
function useLinkClickHandler(to, _temp) {
  let {
    target,
    replace: replaceProp,
    state: state2,
    preventScrollReset,
    relative,
    viewTransition
  } = _temp === void 0 ? {} : _temp;
  let navigate = useNavigate();
  let location2 = useLocation();
  let path = useResolvedPath(to, {
    relative
  });
  return reactExports.useCallback((event) => {
    if (shouldProcessLinkClick(event, target)) {
      event.preventDefault();
      let replace2 = replaceProp !== void 0 ? replaceProp : createPath(location2) === createPath(path);
      navigate(to, {
        replace: replace2,
        state: state2,
        preventScrollReset,
        relative,
        viewTransition
      });
    }
  }, [location2, navigate, path, replaceProp, state2, target, to, preventScrollReset, relative, viewTransition]);
}
function useViewTransitionState(to, opts) {
  if (opts === void 0) {
    opts = {};
  }
  let vtContext = reactExports.useContext(ViewTransitionContext);
  !(vtContext != null) ? invariant(false) : void 0;
  let {
    basename
  } = useDataRouterContext(DataRouterHook.useViewTransitionState);
  let path = useResolvedPath(to, {
    relative: opts.relative
  });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}
var Subscribable = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
    this.subscribe = this.subscribe.bind(this);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    this.onSubscribe();
    return () => {
      this.listeners.delete(listener);
      this.onUnsubscribe();
    };
  }
  hasListeners() {
    return this.listeners.size > 0;
  }
  onSubscribe() {
  }
  onUnsubscribe() {
  }
};
var FocusManager = (_a = class extends Subscribable {
  constructor() {
    super();
    __privateAdd(this, _focused);
    __privateAdd(this, _cleanup);
    __privateAdd(this, _setup);
    __privateSet(this, _setup, (onFocus) => {
      if (typeof window !== "undefined" && window.addEventListener) {
        const listener = () => onFocus();
        window.addEventListener("visibilitychange", listener, false);
        return () => {
          window.removeEventListener("visibilitychange", listener);
        };
      }
      return;
    });
  }
  onSubscribe() {
    if (!__privateGet(this, _cleanup)) {
      this.setEventListener(__privateGet(this, _setup));
    }
  }
  onUnsubscribe() {
    var _a2;
    if (!this.hasListeners()) {
      (_a2 = __privateGet(this, _cleanup)) == null ? void 0 : _a2.call(this);
      __privateSet(this, _cleanup, void 0);
    }
  }
  setEventListener(setup) {
    var _a2;
    __privateSet(this, _setup, setup);
    (_a2 = __privateGet(this, _cleanup)) == null ? void 0 : _a2.call(this);
    __privateSet(this, _cleanup, setup((focused) => {
      if (typeof focused === "boolean") {
        this.setFocused(focused);
      } else {
        this.onFocus();
      }
    }));
  }
  setFocused(focused) {
    const changed = __privateGet(this, _focused) !== focused;
    if (changed) {
      __privateSet(this, _focused, focused);
      this.onFocus();
    }
  }
  onFocus() {
    const isFocused = this.isFocused();
    this.listeners.forEach((listener) => {
      listener(isFocused);
    });
  }
  isFocused() {
    if (typeof __privateGet(this, _focused) === "boolean") {
      return __privateGet(this, _focused);
    }
    return globalThis.document?.visibilityState !== "hidden";
  }
}, _focused = new WeakMap(), _cleanup = new WeakMap(), _setup = new WeakMap(), _a);
var focusManager = new FocusManager();
var defaultTimeoutProvider = {
  // We need the wrapper function syntax below instead of direct references to
  // global setTimeout etc.
  //
  // BAD: `setTimeout: setTimeout`
  // GOOD: `setTimeout: (cb, delay) => setTimeout(cb, delay)`
  //
  // If we use direct references here, then anything that wants to spy on or
  // replace the global setTimeout (like tests) won't work since we'll already
  // have a hard reference to the original implementation at the time when this
  // file was imported.
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timeoutId) => clearTimeout(timeoutId),
  setInterval: (callback, delay) => setInterval(callback, delay),
  clearInterval: (intervalId) => clearInterval(intervalId)
};
var TimeoutManager = (_b = class {
  constructor() {
    // We cannot have TimeoutManager<T> as we must instantiate it with a concrete
    // type at app boot; and if we leave that type, then any new timer provider
    // would need to support the default provider's concrete timer ID, which is
    // infeasible across environments.
    //
    // We settle for type safety for the TimeoutProvider type, and accept that
    // this class is unsafe internally to allow for extension.
    __privateAdd(this, _provider, defaultTimeoutProvider);
    __privateAdd(this, _providerCalled, false);
  }
  setTimeoutProvider(provider) {
    __privateSet(this, _provider, provider);
  }
  setTimeout(callback, delay) {
    return __privateGet(this, _provider).setTimeout(callback, delay);
  }
  clearTimeout(timeoutId) {
    __privateGet(this, _provider).clearTimeout(timeoutId);
  }
  setInterval(callback, delay) {
    return __privateGet(this, _provider).setInterval(callback, delay);
  }
  clearInterval(intervalId) {
    __privateGet(this, _provider).clearInterval(intervalId);
  }
}, _provider = new WeakMap(), _providerCalled = new WeakMap(), _b);
var timeoutManager = new TimeoutManager();
function systemSetTimeoutZero(callback) {
  setTimeout(callback, 0);
}
var isServer = typeof window === "undefined" || "Deno" in globalThis;
function noop$1() {
}
function functionalUpdate(updater, input) {
  return typeof updater === "function" ? updater(input) : updater;
}
function isValidTimeout(value2) {
  return typeof value2 === "number" && value2 >= 0 && value2 !== Infinity;
}
function timeUntilStale(updatedAt, staleTime) {
  return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
function resolveStaleTime(staleTime, query) {
  return typeof staleTime === "function" ? staleTime(query) : staleTime;
}
function resolveQueryBoolean(option, query) {
  return typeof option === "function" ? option(query) : option;
}
function matchQuery(filters, query) {
  const {
    type = "all",
    exact,
    fetchStatus,
    predicate,
    queryKey: queryKey2,
    stale
  } = filters;
  if (queryKey2) {
    if (exact) {
      if (query.queryHash !== hashQueryKeyByOptions(queryKey2, query.options)) {
        return false;
      }
    } else if (!partialMatchKey(query.queryKey, queryKey2)) {
      return false;
    }
  }
  if (type !== "all") {
    const isActive = query.isActive();
    if (type === "active" && !isActive) {
      return false;
    }
    if (type === "inactive" && isActive) {
      return false;
    }
  }
  if (typeof stale === "boolean" && query.isStale() !== stale) {
    return false;
  }
  if (fetchStatus && fetchStatus !== query.state.fetchStatus) {
    return false;
  }
  if (predicate && !predicate(query)) {
    return false;
  }
  return true;
}
function matchMutation(filters, mutation) {
  const { exact, status, predicate, mutationKey } = filters;
  if (mutationKey) {
    if (!mutation.options.mutationKey) {
      return false;
    }
    if (exact) {
      if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) {
        return false;
      }
    } else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
      return false;
    }
  }
  if (status && mutation.state.status !== status) {
    return false;
  }
  if (predicate && !predicate(mutation)) {
    return false;
  }
  return true;
}
function hashQueryKeyByOptions(queryKey2, options) {
  const hashFn = options?.queryKeyHashFn || hashKey;
  return hashFn(queryKey2);
}
function hashKey(queryKey2) {
  return JSON.stringify(
    queryKey2,
    (_, val) => isPlainObject$1(val) ? Object.keys(val).sort().reduce((result, key) => {
      result[key] = val[key];
      return result;
    }, {}) : val
  );
}
function partialMatchKey(a2, b) {
  if (a2 === b) {
    return true;
  }
  if (typeof a2 !== typeof b) {
    return false;
  }
  if (a2 && b && typeof a2 === "object" && typeof b === "object") {
    return Object.keys(b).every((key) => partialMatchKey(a2[key], b[key]));
  }
  return false;
}
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(a2, b, depth = 0) {
  if (a2 === b) {
    return a2;
  }
  if (depth > 500) return b;
  const array = isPlainArray(a2) && isPlainArray(b);
  if (!array && !(isPlainObject$1(a2) && isPlainObject$1(b))) return b;
  const aItems = array ? a2 : Object.keys(a2);
  const aSize = aItems.length;
  const bItems = array ? b : Object.keys(b);
  const bSize = bItems.length;
  const copy = array ? new Array(bSize) : {};
  let equalItems = 0;
  for (let i2 = 0; i2 < bSize; i2++) {
    const key = array ? i2 : bItems[i2];
    const aItem = a2[key];
    const bItem = b[key];
    if (aItem === bItem) {
      copy[key] = aItem;
      if (array ? i2 < aSize : hasOwn.call(a2, key)) equalItems++;
      continue;
    }
    if (aItem === null || bItem === null || typeof aItem !== "object" || typeof bItem !== "object") {
      copy[key] = bItem;
      continue;
    }
    const v = replaceEqualDeep(aItem, bItem, depth + 1);
    copy[key] = v;
    if (v === aItem) equalItems++;
  }
  return aSize === bSize && equalItems === aSize ? a2 : copy;
}
function shallowEqualObjects(a2, b) {
  if (!b || Object.keys(a2).length !== Object.keys(b).length) {
    return false;
  }
  for (const key in a2) {
    if (a2[key] !== b[key]) {
      return false;
    }
  }
  return true;
}
function isPlainArray(value2) {
  return Array.isArray(value2) && value2.length === Object.keys(value2).length;
}
function isPlainObject$1(o2) {
  if (!hasObjectPrototype(o2)) {
    return false;
  }
  const ctor = o2.constructor;
  if (ctor === void 0) {
    return true;
  }
  const prot = ctor.prototype;
  if (!hasObjectPrototype(prot)) {
    return false;
  }
  if (!prot.hasOwnProperty("isPrototypeOf")) {
    return false;
  }
  if (Object.getPrototypeOf(o2) !== Object.prototype) {
    return false;
  }
  return true;
}
function hasObjectPrototype(o2) {
  return Object.prototype.toString.call(o2) === "[object Object]";
}
function sleep$1(timeout) {
  return new Promise((resolve) => {
    timeoutManager.setTimeout(resolve, timeout);
  });
}
function replaceData(prevData, data, options) {
  if (typeof options.structuralSharing === "function") {
    return options.structuralSharing(prevData, data);
  } else if (options.structuralSharing !== false) {
    return replaceEqualDeep(prevData, data);
  }
  return data;
}
function addToEnd(items, item, max = 0) {
  const newItems = [...items, item];
  return max && newItems.length > max ? newItems.slice(1) : newItems;
}
function addToStart(items, item, max = 0) {
  const newItems = [item, ...items];
  return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
}
var skipToken = /* @__PURE__ */ Symbol();
function ensureQueryFn(options, fetchOptions) {
  if (!options.queryFn && fetchOptions?.initialPromise) {
    return () => fetchOptions.initialPromise;
  }
  if (!options.queryFn || options.queryFn === skipToken) {
    return () => Promise.reject(new Error(`Missing queryFn: '${options.queryHash}'`));
  }
  return options.queryFn;
}
function shouldThrowError(throwOnError, params2) {
  if (typeof throwOnError === "function") {
    return throwOnError(...params2);
  }
  return !!throwOnError;
}
function addConsumeAwareSignal(object, getSignal, onCancelled) {
  let consumed = false;
  let signal;
  Object.defineProperty(object, "signal", {
    enumerable: true,
    get: () => {
      signal ?? (signal = getSignal());
      if (consumed) {
        return signal;
      }
      consumed = true;
      if (signal.aborted) {
        onCancelled();
      } else {
        signal.addEventListener("abort", onCancelled, { once: true });
      }
      return signal;
    }
  });
  return object;
}
var environmentManager = /* @__PURE__ */ (() => {
  let isServerFn = () => isServer;
  return {
    /**
     * Returns whether the current runtime should be treated as a server environment.
     */
    isServer() {
      return isServerFn();
    },
    /**
     * Overrides the server check globally.
     */
    setIsServer(isServerValue) {
      isServerFn = isServerValue;
    }
  };
})();
function pendingThenable() {
  let resolve;
  let reject;
  const thenable = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  thenable.status = "pending";
  thenable.catch(() => {
  });
  function finalize(data) {
    Object.assign(thenable, data);
    delete thenable.resolve;
    delete thenable.reject;
  }
  thenable.resolve = (value2) => {
    finalize({
      status: "fulfilled",
      value: value2
    });
    resolve(value2);
  };
  thenable.reject = (reason) => {
    finalize({
      status: "rejected",
      reason
    });
    reject(reason);
  };
  return thenable;
}
var defaultScheduler = systemSetTimeoutZero;
function createNotifyManager() {
  let queue = [];
  let transactions = 0;
  let notifyFn = (callback) => {
    callback();
  };
  let batchNotifyFn = (callback) => {
    callback();
  };
  let scheduleFn = defaultScheduler;
  const schedule = (callback) => {
    if (transactions) {
      queue.push(callback);
    } else {
      scheduleFn(() => {
        notifyFn(callback);
      });
    }
  };
  const flush = () => {
    const originalQueue = queue;
    queue = [];
    if (originalQueue.length) {
      scheduleFn(() => {
        batchNotifyFn(() => {
          originalQueue.forEach((callback) => {
            notifyFn(callback);
          });
        });
      });
    }
  };
  return {
    batch: (callback) => {
      let result;
      transactions++;
      try {
        result = callback();
      } finally {
        transactions--;
        if (!transactions) {
          flush();
        }
      }
      return result;
    },
    /**
     * All calls to the wrapped function will be batched.
     */
    batchCalls: (callback) => {
      return (...args) => {
        schedule(() => {
          callback(...args);
        });
      };
    },
    schedule,
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     */
    setNotifyFunction: (fn) => {
      notifyFn = fn;
    },
    /**
     * Use this method to set a custom function to batch notifications together into a single tick.
     * By default React Query will use the batch function provided by ReactDOM or React Native.
     */
    setBatchNotifyFunction: (fn) => {
      batchNotifyFn = fn;
    },
    setScheduler: (fn) => {
      scheduleFn = fn;
    }
  };
}
var notifyManager = createNotifyManager();
var OnlineManager = (_c = class extends Subscribable {
  constructor() {
    super();
    __privateAdd(this, _online, true);
    __privateAdd(this, _cleanup2);
    __privateAdd(this, _setup2);
    __privateSet(this, _setup2, (onOnline) => {
      if (typeof window !== "undefined" && window.addEventListener) {
        const onlineListener = () => onOnline(true);
        const offlineListener = () => onOnline(false);
        window.addEventListener("online", onlineListener, false);
        window.addEventListener("offline", offlineListener, false);
        return () => {
          window.removeEventListener("online", onlineListener);
          window.removeEventListener("offline", offlineListener);
        };
      }
      return;
    });
  }
  onSubscribe() {
    if (!__privateGet(this, _cleanup2)) {
      this.setEventListener(__privateGet(this, _setup2));
    }
  }
  onUnsubscribe() {
    var _a2;
    if (!this.hasListeners()) {
      (_a2 = __privateGet(this, _cleanup2)) == null ? void 0 : _a2.call(this);
      __privateSet(this, _cleanup2, void 0);
    }
  }
  setEventListener(setup) {
    var _a2;
    __privateSet(this, _setup2, setup);
    (_a2 = __privateGet(this, _cleanup2)) == null ? void 0 : _a2.call(this);
    __privateSet(this, _cleanup2, setup(this.setOnline.bind(this)));
  }
  setOnline(online) {
    const changed = __privateGet(this, _online) !== online;
    if (changed) {
      __privateSet(this, _online, online);
      this.listeners.forEach((listener) => {
        listener(online);
      });
    }
  }
  isOnline() {
    return __privateGet(this, _online);
  }
}, _online = new WeakMap(), _cleanup2 = new WeakMap(), _setup2 = new WeakMap(), _c);
var onlineManager = new OnlineManager();
function defaultRetryDelay(failureCount) {
  return Math.min(1e3 * 2 ** failureCount, 3e4);
}
function canFetch(networkMode) {
  return (networkMode ?? "online") === "online" ? onlineManager.isOnline() : true;
}
var CancelledError = class extends Error {
  constructor(options) {
    super("CancelledError");
    this.revert = options?.revert;
    this.silent = options?.silent;
  }
};
function createRetryer(config) {
  let isRetryCancelled = false;
  let failureCount = 0;
  let continueFn;
  const thenable = pendingThenable();
  const isResolved = () => thenable.status !== "pending";
  const cancel = (cancelOptions) => {
    if (!isResolved()) {
      const error = new CancelledError(cancelOptions);
      reject(error);
      config.onCancel?.(error);
    }
  };
  const cancelRetry = () => {
    isRetryCancelled = true;
  };
  const continueRetry = () => {
    isRetryCancelled = false;
  };
  const canContinue = () => focusManager.isFocused() && (config.networkMode === "always" || onlineManager.isOnline()) && config.canRun();
  const canStart = () => canFetch(config.networkMode) && config.canRun();
  const resolve = (value2) => {
    if (!isResolved()) {
      continueFn?.();
      thenable.resolve(value2);
    }
  };
  const reject = (value2) => {
    if (!isResolved()) {
      continueFn?.();
      thenable.reject(value2);
    }
  };
  const pause = () => {
    return new Promise((continueResolve) => {
      continueFn = (value2) => {
        if (isResolved() || canContinue()) {
          continueResolve(value2);
        }
      };
      config.onPause?.();
    }).then(() => {
      continueFn = void 0;
      if (!isResolved()) {
        config.onContinue?.();
      }
    });
  };
  const run = () => {
    if (isResolved()) {
      return;
    }
    let promiseOrValue;
    const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
    try {
      promiseOrValue = initialPromise ?? config.fn();
    } catch (error) {
      promiseOrValue = Promise.reject(error);
    }
    Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
      if (isResolved()) {
        return;
      }
      const retry = config.retry ?? (environmentManager.isServer() ? 0 : 3);
      const retryDelay = config.retryDelay ?? defaultRetryDelay;
      const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
      const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
      if (isRetryCancelled || !shouldRetry) {
        reject(error);
        return;
      }
      failureCount++;
      config.onFail?.(failureCount, error);
      sleep$1(delay).then(() => {
        return canContinue() ? void 0 : pause();
      }).then(() => {
        if (isRetryCancelled) {
          reject(error);
        } else {
          run();
        }
      });
    });
  };
  return {
    promise: thenable,
    status: () => thenable.status,
    cancel,
    continue: () => {
      continueFn?.();
      return thenable;
    },
    cancelRetry,
    continueRetry,
    canStart,
    start: () => {
      if (canStart()) {
        run();
      } else {
        pause().then(run);
      }
      return thenable;
    }
  };
}
var Removable = (_d = class {
  constructor() {
    __privateAdd(this, _gcTimeout);
  }
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    this.clearGcTimeout();
    if (isValidTimeout(this.gcTime)) {
      __privateSet(this, _gcTimeout, timeoutManager.setTimeout(() => {
        this.optionalRemove();
      }, this.gcTime));
    }
  }
  updateGcTime(newGcTime) {
    this.gcTime = Math.max(
      this.gcTime || 0,
      newGcTime ?? (environmentManager.isServer() ? Infinity : 5 * 60 * 1e3)
    );
  }
  clearGcTimeout() {
    if (__privateGet(this, _gcTimeout) !== void 0) {
      timeoutManager.clearTimeout(__privateGet(this, _gcTimeout));
      __privateSet(this, _gcTimeout, void 0);
    }
  }
}, _gcTimeout = new WeakMap(), _d);
function infiniteQueryBehavior(pages) {
  return {
    onFetch: (context, query) => {
      const options = context.options;
      const direction = context.fetchOptions?.meta?.fetchMore?.direction;
      const oldPages = context.state.data?.pages || [];
      const oldPageParams = context.state.data?.pageParams || [];
      let result = { pages: [], pageParams: [] };
      let currentPage = 0;
      const fetchFn = async () => {
        let cancelled = false;
        const addSignalProperty = (object) => {
          addConsumeAwareSignal(
            object,
            () => context.signal,
            () => cancelled = true
          );
        };
        const queryFn = ensureQueryFn(context.options, context.fetchOptions);
        const fetchPage = async (data, param, previous) => {
          if (cancelled) {
            return Promise.reject(context.signal.reason);
          }
          if (param == null && data.pages.length) {
            return Promise.resolve(data);
          }
          const createQueryFnContext = () => {
            const queryFnContext2 = {
              client: context.client,
              queryKey: context.queryKey,
              pageParam: param,
              direction: previous ? "backward" : "forward",
              meta: context.options.meta
            };
            addSignalProperty(queryFnContext2);
            return queryFnContext2;
          };
          const queryFnContext = createQueryFnContext();
          const page = await queryFn(queryFnContext);
          const { maxPages } = context.options;
          const addTo = previous ? addToStart : addToEnd;
          return {
            pages: addTo(data.pages, page, maxPages),
            pageParams: addTo(data.pageParams, param, maxPages)
          };
        };
        if (direction && oldPages.length) {
          const previous = direction === "backward";
          const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
          const oldData = {
            pages: oldPages,
            pageParams: oldPageParams
          };
          const param = pageParamFn(options, oldData);
          result = await fetchPage(oldData, param, previous);
        } else {
          const remainingPages = pages ?? oldPages.length;
          do {
            const param = currentPage === 0 ? oldPageParams[0] ?? options.initialPageParam : getNextPageParam(options, result);
            if (currentPage > 0 && param == null) {
              break;
            }
            result = await fetchPage(result, param);
            currentPage++;
          } while (currentPage < remainingPages);
        }
        return result;
      };
      if (context.options.persister) {
        context.fetchFn = () => {
          return context.options.persister?.(
            fetchFn,
            {
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal
            },
            query
          );
        };
      } else {
        context.fetchFn = fetchFn;
      }
    }
  };
}
function getNextPageParam(options, { pages, pageParams }) {
  const lastIndex = pages.length - 1;
  return pages.length > 0 ? options.getNextPageParam(
    pages[lastIndex],
    pages,
    pageParams[lastIndex],
    pageParams
  ) : void 0;
}
function getPreviousPageParam(options, { pages, pageParams }) {
  return pages.length > 0 ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams) : void 0;
}
function hasNextPage(options, data) {
  if (!data) return false;
  return getNextPageParam(options, data) != null;
}
function hasPreviousPage(options, data) {
  if (!data || !options.getPreviousPageParam) return false;
  return getPreviousPageParam(options, data) != null;
}
var Query = (_e = class extends Removable {
  constructor(config) {
    super();
    __privateAdd(this, _Query_instances);
    __privateAdd(this, _queryType);
    __privateAdd(this, _initialState);
    __privateAdd(this, _revertState);
    __privateAdd(this, _cache);
    __privateAdd(this, _client);
    __privateAdd(this, _retryer);
    __privateAdd(this, _defaultOptions);
    __privateAdd(this, _abortSignalConsumed);
    __privateSet(this, _abortSignalConsumed, false);
    __privateSet(this, _defaultOptions, config.defaultOptions);
    this.setOptions(config.options);
    this.observers = [];
    __privateSet(this, _client, config.client);
    __privateSet(this, _cache, __privateGet(this, _client).getQueryCache());
    this.queryKey = config.queryKey;
    this.queryHash = config.queryHash;
    __privateSet(this, _initialState, getDefaultState$1(this.options));
    this.state = config.state ?? __privateGet(this, _initialState);
    this.scheduleGc();
  }
  get meta() {
    return this.options.meta;
  }
  get queryType() {
    return __privateGet(this, _queryType);
  }
  get promise() {
    return __privateGet(this, _retryer)?.promise;
  }
  setOptions(options) {
    this.options = { ...__privateGet(this, _defaultOptions), ...options };
    if (options?._type) {
      __privateSet(this, _queryType, options._type);
    }
    this.updateGcTime(this.options.gcTime);
    if (this.state && this.state.data === void 0) {
      const defaultState = getDefaultState$1(this.options);
      if (defaultState.data !== void 0) {
        this.setState(
          successState(defaultState.data, defaultState.dataUpdatedAt)
        );
        __privateSet(this, _initialState, defaultState);
      }
    }
  }
  optionalRemove() {
    if (!this.observers.length && this.state.fetchStatus === "idle") {
      __privateGet(this, _cache).remove(this);
    }
  }
  setData(newData, options) {
    const data = replaceData(this.state.data, newData, this.options);
    __privateMethod(this, _Query_instances, dispatch_fn).call(this, {
      data,
      type: "success",
      dataUpdatedAt: options?.updatedAt,
      manual: options?.manual
    });
    return data;
  }
  setState(state2) {
    __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "setState", state: state2 });
  }
  cancel(options) {
    const promise = __privateGet(this, _retryer)?.promise;
    __privateGet(this, _retryer)?.cancel(options);
    return promise ? promise.then(noop$1).catch(noop$1) : Promise.resolve();
  }
  destroy() {
    super.destroy();
    this.cancel({ silent: true });
  }
  get resetState() {
    return __privateGet(this, _initialState);
  }
  reset() {
    this.destroy();
    this.setState(this.resetState);
  }
  isActive() {
    return this.observers.some(
      (observer) => resolveQueryBoolean(observer.options.enabled, this) !== false
    );
  }
  isDisabled() {
    if (this.getObserversCount() > 0) {
      return !this.isActive();
    }
    return this.options.queryFn === skipToken || !this.isFetched();
  }
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
  }
  isStatic() {
    if (this.getObserversCount() > 0) {
      return this.observers.some(
        (observer) => resolveStaleTime(observer.options.staleTime, this) === "static"
      );
    }
    return false;
  }
  isStale() {
    if (this.getObserversCount() > 0) {
      return this.observers.some(
        (observer) => observer.getCurrentResult().isStale
      );
    }
    return this.state.data === void 0 || this.state.isInvalidated;
  }
  isStaleByTime(staleTime = 0) {
    if (this.state.data === void 0) {
      return true;
    }
    if (staleTime === "static") {
      return false;
    }
    if (this.state.isInvalidated) {
      return true;
    }
    return !timeUntilStale(this.state.dataUpdatedAt, staleTime);
  }
  onFocus() {
    const observer = this.observers.find((x) => x.shouldFetchOnWindowFocus());
    observer?.refetch({ cancelRefetch: false });
    __privateGet(this, _retryer)?.continue();
  }
  onOnline() {
    const observer = this.observers.find((x) => x.shouldFetchOnReconnect());
    observer?.refetch({ cancelRefetch: false });
    __privateGet(this, _retryer)?.continue();
  }
  addObserver(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      this.clearGcTimeout();
      __privateGet(this, _cache).notify({ type: "observerAdded", query: this, observer });
    }
  }
  removeObserver(observer) {
    if (this.observers.includes(observer)) {
      this.observers = this.observers.filter((x) => x !== observer);
      if (!this.observers.length) {
        if (__privateGet(this, _retryer)) {
          if (__privateGet(this, _abortSignalConsumed) || __privateMethod(this, _Query_instances, isInitialPausedFetch_fn).call(this)) {
            __privateGet(this, _retryer).cancel({ revert: true });
          } else {
            __privateGet(this, _retryer).cancelRetry();
          }
        }
        this.scheduleGc();
      }
      __privateGet(this, _cache).notify({ type: "observerRemoved", query: this, observer });
    }
  }
  getObserversCount() {
    return this.observers.length;
  }
  invalidate() {
    if (!this.state.isInvalidated) {
      __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "invalidate" });
    }
  }
  async fetch(options, fetchOptions) {
    if (this.state.fetchStatus !== "idle" && // If the promise in the retryer is already rejected, we have to definitely
    // re-start the fetch; there is a chance that the query is still in a
    // pending state when that happens
    __privateGet(this, _retryer)?.status() !== "rejected") {
      if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) {
        this.cancel({ silent: true });
      } else if (__privateGet(this, _retryer)) {
        __privateGet(this, _retryer).continueRetry();
        return __privateGet(this, _retryer).promise;
      }
    }
    if (options) {
      this.setOptions(options);
    }
    if (!this.options.queryFn) {
      const observer = this.observers.find((x) => x.options.queryFn);
      if (observer) {
        this.setOptions(observer.options);
      }
    }
    const abortController = new AbortController();
    const addSignalProperty = (object) => {
      Object.defineProperty(object, "signal", {
        enumerable: true,
        get: () => {
          __privateSet(this, _abortSignalConsumed, true);
          return abortController.signal;
        }
      });
    };
    const fetchFn = () => {
      const queryFn = ensureQueryFn(this.options, fetchOptions);
      const createQueryFnContext = () => {
        const queryFnContext2 = {
          client: __privateGet(this, _client),
          queryKey: this.queryKey,
          meta: this.meta
        };
        addSignalProperty(queryFnContext2);
        return queryFnContext2;
      };
      const queryFnContext = createQueryFnContext();
      __privateSet(this, _abortSignalConsumed, false);
      if (this.options.persister) {
        return this.options.persister(
          queryFn,
          queryFnContext,
          this
        );
      }
      return queryFn(queryFnContext);
    };
    const createFetchContext = () => {
      const context2 = {
        fetchOptions,
        options: this.options,
        queryKey: this.queryKey,
        client: __privateGet(this, _client),
        state: this.state,
        fetchFn
      };
      addSignalProperty(context2);
      return context2;
    };
    const context = createFetchContext();
    const behavior = __privateGet(this, _queryType) === "infinite" ? infiniteQueryBehavior(
      this.options.pages
    ) : this.options.behavior;
    behavior?.onFetch(context, this);
    __privateSet(this, _revertState, this.state);
    if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== context.fetchOptions?.meta) {
      __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "fetch", meta: context.fetchOptions?.meta });
    }
    __privateSet(this, _retryer, createRetryer({
      initialPromise: fetchOptions?.initialPromise,
      fn: context.fetchFn,
      onCancel: (error) => {
        if (error instanceof CancelledError && error.revert) {
          this.setState({
            ...__privateGet(this, _revertState),
            fetchStatus: "idle"
          });
        }
        abortController.abort();
      },
      onFail: (failureCount, error) => {
        __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "failed", failureCount, error });
      },
      onPause: () => {
        __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "pause" });
      },
      onContinue: () => {
        __privateMethod(this, _Query_instances, dispatch_fn).call(this, { type: "continue" });
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
      networkMode: context.options.networkMode,
      canRun: () => true
    }));
    try {
      const data = await __privateGet(this, _retryer).start();
      if (data === void 0) {
        if (false) ;
        throw new Error(`${this.queryHash} data is undefined`);
      }
      this.setData(data);
      __privateGet(this, _cache).config.onSuccess?.(data, this);
      __privateGet(this, _cache).config.onSettled?.(
        data,
        this.state.error,
        this
      );
      return data;
    } catch (error) {
      if (error instanceof CancelledError) {
        if (error.silent) {
          return __privateGet(this, _retryer).promise;
        } else if (error.revert) {
          if (this.state.data === void 0) {
            throw error;
          }
          return this.state.data;
        }
      }
      __privateMethod(this, _Query_instances, dispatch_fn).call(this, {
        type: "error",
        error
      });
      __privateGet(this, _cache).config.onError?.(
        error,
        this
      );
      __privateGet(this, _cache).config.onSettled?.(
        this.state.data,
        error,
        this
      );
      throw error;
    } finally {
      this.scheduleGc();
    }
  }
}, _queryType = new WeakMap(), _initialState = new WeakMap(), _revertState = new WeakMap(), _cache = new WeakMap(), _client = new WeakMap(), _retryer = new WeakMap(), _defaultOptions = new WeakMap(), _abortSignalConsumed = new WeakMap(), _Query_instances = new WeakSet(), isInitialPausedFetch_fn = function() {
  return this.state.fetchStatus === "paused" && this.state.status === "pending";
}, dispatch_fn = function(action) {
  const reducer = (state2) => {
    switch (action.type) {
      case "failed":
        return {
          ...state2,
          fetchFailureCount: action.failureCount,
          fetchFailureReason: action.error
        };
      case "pause":
        return {
          ...state2,
          fetchStatus: "paused"
        };
      case "continue":
        return {
          ...state2,
          fetchStatus: "fetching"
        };
      case "fetch":
        return {
          ...state2,
          ...fetchState(state2.data, this.options),
          fetchMeta: action.meta ?? null
        };
      case "success":
        const newState = {
          ...state2,
          ...successState(action.data, action.dataUpdatedAt),
          dataUpdateCount: state2.dataUpdateCount + 1,
          ...!action.manual && {
            fetchStatus: "idle",
            fetchFailureCount: 0,
            fetchFailureReason: null
          }
        };
        __privateSet(this, _revertState, action.manual ? newState : void 0);
        return newState;
      case "error":
        const error = action.error;
        return {
          ...state2,
          error,
          errorUpdateCount: state2.errorUpdateCount + 1,
          errorUpdatedAt: Date.now(),
          fetchFailureCount: state2.fetchFailureCount + 1,
          fetchFailureReason: error,
          fetchStatus: "idle",
          status: "error",
          // flag existing data as invalidated if we get a background error
          // note that "no data" always means stale so we can set unconditionally here
          isInvalidated: true
        };
      case "invalidate":
        return {
          ...state2,
          isInvalidated: true
        };
      case "setState":
        return {
          ...state2,
          ...action.state
        };
    }
  };
  this.state = reducer(this.state);
  notifyManager.batch(() => {
    this.observers.forEach((observer) => {
      observer.onQueryUpdate();
    });
    __privateGet(this, _cache).notify({ query: this, type: "updated", action });
  });
}, _e);
function fetchState(data, options) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: canFetch(options.networkMode) ? "fetching" : "paused",
    ...data === void 0 && {
      error: null,
      status: "pending"
    }
  };
}
function successState(data, dataUpdatedAt) {
  return {
    data,
    dataUpdatedAt: dataUpdatedAt ?? Date.now(),
    error: null,
    isInvalidated: false,
    status: "success"
  };
}
function getDefaultState$1(options) {
  const data = typeof options.initialData === "function" ? options.initialData() : options.initialData;
  const hasData = data !== void 0;
  const initialDataUpdatedAt = hasData ? typeof options.initialDataUpdatedAt === "function" ? options.initialDataUpdatedAt() : options.initialDataUpdatedAt : 0;
  return {
    data,
    dataUpdateCount: 0,
    dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: hasData ? "success" : "pending",
    fetchStatus: "idle"
  };
}
var Mutation = (_f = class extends Removable {
  constructor(config) {
    super();
    __privateAdd(this, _Mutation_instances);
    __privateAdd(this, _client2);
    __privateAdd(this, _observers);
    __privateAdd(this, _mutationCache);
    __privateAdd(this, _retryer2);
    __privateSet(this, _client2, config.client);
    this.mutationId = config.mutationId;
    __privateSet(this, _mutationCache, config.mutationCache);
    __privateSet(this, _observers, []);
    this.state = config.state || getDefaultState();
    this.setOptions(config.options);
    this.scheduleGc();
  }
  setOptions(options) {
    this.options = options;
    this.updateGcTime(this.options.gcTime);
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(observer) {
    if (!__privateGet(this, _observers).includes(observer)) {
      __privateGet(this, _observers).push(observer);
      this.clearGcTimeout();
      __privateGet(this, _mutationCache).notify({
        type: "observerAdded",
        mutation: this,
        observer
      });
    }
  }
  removeObserver(observer) {
    __privateSet(this, _observers, __privateGet(this, _observers).filter((x) => x !== observer));
    this.scheduleGc();
    __privateGet(this, _mutationCache).notify({
      type: "observerRemoved",
      mutation: this,
      observer
    });
  }
  optionalRemove() {
    if (!__privateGet(this, _observers).length) {
      if (this.state.status === "pending") {
        this.scheduleGc();
      } else {
        __privateGet(this, _mutationCache).remove(this);
      }
    }
  }
  continue() {
    return __privateGet(this, _retryer2)?.continue() ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
    this.execute(this.state.variables);
  }
  async execute(variables) {
    const onContinue = () => {
      __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "continue" });
    };
    const mutationFnContext = {
      client: __privateGet(this, _client2),
      meta: this.options.meta,
      mutationKey: this.options.mutationKey
    };
    __privateSet(this, _retryer2, createRetryer({
      fn: () => {
        if (!this.options.mutationFn) {
          return Promise.reject(new Error("No mutationFn found"));
        }
        return this.options.mutationFn(variables, mutationFnContext);
      },
      onFail: (failureCount, error) => {
        __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "failed", failureCount, error });
      },
      onPause: () => {
        __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "pause" });
      },
      onContinue,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => __privateGet(this, _mutationCache).canRun(this)
    }));
    const restored = this.state.status === "pending";
    const isPaused = !__privateGet(this, _retryer2).canStart();
    try {
      if (restored) {
        onContinue();
      } else {
        __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "pending", variables, isPaused });
        if (__privateGet(this, _mutationCache).config.onMutate) {
          await __privateGet(this, _mutationCache).config.onMutate(
            variables,
            this,
            mutationFnContext
          );
        }
        const context = await this.options.onMutate?.(
          variables,
          mutationFnContext
        );
        if (context !== this.state.context) {
          __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, {
            type: "pending",
            context,
            variables,
            isPaused
          });
        }
      }
      const data = await __privateGet(this, _retryer2).start();
      await __privateGet(this, _mutationCache).config.onSuccess?.(
        data,
        variables,
        this.state.context,
        this,
        mutationFnContext
      );
      await this.options.onSuccess?.(
        data,
        variables,
        this.state.context,
        mutationFnContext
      );
      await __privateGet(this, _mutationCache).config.onSettled?.(
        data,
        null,
        this.state.variables,
        this.state.context,
        this,
        mutationFnContext
      );
      await this.options.onSettled?.(
        data,
        null,
        variables,
        this.state.context,
        mutationFnContext
      );
      __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "success", data });
      return data;
    } catch (error) {
      try {
        await __privateGet(this, _mutationCache).config.onError?.(
          error,
          variables,
          this.state.context,
          this,
          mutationFnContext
        );
      } catch (e2) {
        void Promise.reject(e2);
      }
      try {
        await this.options.onError?.(
          error,
          variables,
          this.state.context,
          mutationFnContext
        );
      } catch (e2) {
        void Promise.reject(e2);
      }
      try {
        await __privateGet(this, _mutationCache).config.onSettled?.(
          void 0,
          error,
          this.state.variables,
          this.state.context,
          this,
          mutationFnContext
        );
      } catch (e2) {
        void Promise.reject(e2);
      }
      try {
        await this.options.onSettled?.(
          void 0,
          error,
          variables,
          this.state.context,
          mutationFnContext
        );
      } catch (e2) {
        void Promise.reject(e2);
      }
      __privateMethod(this, _Mutation_instances, dispatch_fn2).call(this, { type: "error", error });
      throw error;
    } finally {
      __privateGet(this, _mutationCache).runNext(this);
    }
  }
}, _client2 = new WeakMap(), _observers = new WeakMap(), _mutationCache = new WeakMap(), _retryer2 = new WeakMap(), _Mutation_instances = new WeakSet(), dispatch_fn2 = function(action) {
  const reducer = (state2) => {
    switch (action.type) {
      case "failed":
        return {
          ...state2,
          failureCount: action.failureCount,
          failureReason: action.error
        };
      case "pause":
        return {
          ...state2,
          isPaused: true
        };
      case "continue":
        return {
          ...state2,
          isPaused: false
        };
      case "pending":
        return {
          ...state2,
          context: action.context,
          data: void 0,
          failureCount: 0,
          failureReason: null,
          error: null,
          isPaused: action.isPaused,
          status: "pending",
          variables: action.variables,
          submittedAt: Date.now()
        };
      case "success":
        return {
          ...state2,
          data: action.data,
          failureCount: 0,
          failureReason: null,
          error: null,
          status: "success",
          isPaused: false
        };
      case "error":
        return {
          ...state2,
          data: void 0,
          error: action.error,
          failureCount: state2.failureCount + 1,
          failureReason: action.error,
          isPaused: false,
          status: "error"
        };
    }
  };
  this.state = reducer(this.state);
  notifyManager.batch(() => {
    __privateGet(this, _observers).forEach((observer) => {
      observer.onMutationUpdate(action);
    });
    __privateGet(this, _mutationCache).notify({
      mutation: this,
      type: "updated",
      action
    });
  });
}, _f);
function getDefaultState() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: "idle",
    variables: void 0,
    submittedAt: 0
  };
}
var MutationCache = (_g = class extends Subscribable {
  constructor(config = {}) {
    super();
    __privateAdd(this, _mutations);
    __privateAdd(this, _scopes);
    __privateAdd(this, _mutationId);
    this.config = config;
    __privateSet(this, _mutations, /* @__PURE__ */ new Set());
    __privateSet(this, _scopes, /* @__PURE__ */ new Map());
    __privateSet(this, _mutationId, 0);
  }
  build(client2, options, state2) {
    const mutation = new Mutation({
      client: client2,
      mutationCache: this,
      mutationId: ++__privateWrapper(this, _mutationId)._,
      options: client2.defaultMutationOptions(options),
      state: state2
    });
    this.add(mutation);
    return mutation;
  }
  add(mutation) {
    __privateGet(this, _mutations).add(mutation);
    const scope = scopeFor(mutation);
    if (typeof scope === "string") {
      const scopedMutations = __privateGet(this, _scopes).get(scope);
      if (scopedMutations) {
        scopedMutations.push(mutation);
      } else {
        __privateGet(this, _scopes).set(scope, [mutation]);
      }
    }
    this.notify({ type: "added", mutation });
  }
  remove(mutation) {
    if (__privateGet(this, _mutations).delete(mutation)) {
      const scope = scopeFor(mutation);
      if (typeof scope === "string") {
        const scopedMutations = __privateGet(this, _scopes).get(scope);
        if (scopedMutations) {
          if (scopedMutations.length > 1) {
            const index = scopedMutations.indexOf(mutation);
            if (index !== -1) {
              scopedMutations.splice(index, 1);
            }
          } else if (scopedMutations[0] === mutation) {
            __privateGet(this, _scopes).delete(scope);
          }
        }
      }
    }
    this.notify({ type: "removed", mutation });
  }
  canRun(mutation) {
    const scope = scopeFor(mutation);
    if (typeof scope === "string") {
      const mutationsWithSameScope = __privateGet(this, _scopes).get(scope);
      const firstPendingMutation = mutationsWithSameScope?.find(
        (m) => m.state.status === "pending"
      );
      return !firstPendingMutation || firstPendingMutation === mutation;
    } else {
      return true;
    }
  }
  runNext(mutation) {
    const scope = scopeFor(mutation);
    if (typeof scope === "string") {
      const foundMutation = __privateGet(this, _scopes).get(scope)?.find((m) => m !== mutation && m.state.isPaused);
      return foundMutation?.continue() ?? Promise.resolve();
    } else {
      return Promise.resolve();
    }
  }
  clear() {
    notifyManager.batch(() => {
      __privateGet(this, _mutations).forEach((mutation) => {
        this.notify({ type: "removed", mutation });
      });
      __privateGet(this, _mutations).clear();
      __privateGet(this, _scopes).clear();
    });
  }
  getAll() {
    return Array.from(__privateGet(this, _mutations));
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return this.getAll().find(
      (mutation) => matchMutation(defaultedFilters, mutation)
    );
  }
  findAll(filters = {}) {
    return this.getAll().filter((mutation) => matchMutation(filters, mutation));
  }
  notify(event) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  resumePausedMutations() {
    const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
    return notifyManager.batch(
      () => Promise.all(
        pausedMutations.map((mutation) => mutation.continue().catch(noop$1))
      )
    );
  }
}, _mutations = new WeakMap(), _scopes = new WeakMap(), _mutationId = new WeakMap(), _g);
function scopeFor(mutation) {
  return mutation.options.scope?.id;
}
var QueryCache = (_h = class extends Subscribable {
  constructor(config = {}) {
    super();
    __privateAdd(this, _queries);
    this.config = config;
    __privateSet(this, _queries, /* @__PURE__ */ new Map());
  }
  build(client2, options, state2) {
    const queryKey2 = options.queryKey;
    const queryHash = options.queryHash ?? hashQueryKeyByOptions(queryKey2, options);
    let query = this.get(queryHash);
    if (!query) {
      query = new Query({
        client: client2,
        queryKey: queryKey2,
        queryHash,
        options: client2.defaultQueryOptions(options),
        state: state2,
        defaultOptions: client2.getQueryDefaults(queryKey2)
      });
      this.add(query);
    }
    return query;
  }
  add(query) {
    if (!__privateGet(this, _queries).has(query.queryHash)) {
      __privateGet(this, _queries).set(query.queryHash, query);
      this.notify({
        type: "added",
        query
      });
    }
  }
  remove(query) {
    const queryInMap = __privateGet(this, _queries).get(query.queryHash);
    if (queryInMap) {
      query.destroy();
      if (queryInMap === query) {
        __privateGet(this, _queries).delete(query.queryHash);
      }
      this.notify({ type: "removed", query });
    }
  }
  clear() {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        this.remove(query);
      });
    });
  }
  get(queryHash) {
    return __privateGet(this, _queries).get(queryHash);
  }
  getAll() {
    return [...__privateGet(this, _queries).values()];
  }
  find(filters) {
    const defaultedFilters = { exact: true, ...filters };
    return this.getAll().find(
      (query) => matchQuery(defaultedFilters, query)
    );
  }
  findAll(filters = {}) {
    const queries = this.getAll();
    return Object.keys(filters).length > 0 ? queries.filter((query) => matchQuery(filters, query)) : queries;
  }
  notify(event) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event);
      });
    });
  }
  onFocus() {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onFocus();
      });
    });
  }
  onOnline() {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onOnline();
      });
    });
  }
}, _queries = new WeakMap(), _h);
var QueryClient = (_i = class {
  constructor(config = {}) {
    __privateAdd(this, _queryCache);
    __privateAdd(this, _mutationCache2);
    __privateAdd(this, _defaultOptions2);
    __privateAdd(this, _queryDefaults);
    __privateAdd(this, _mutationDefaults);
    __privateAdd(this, _mountCount);
    __privateAdd(this, _unsubscribeFocus);
    __privateAdd(this, _unsubscribeOnline);
    __privateSet(this, _queryCache, config.queryCache || new QueryCache());
    __privateSet(this, _mutationCache2, config.mutationCache || new MutationCache());
    __privateSet(this, _defaultOptions2, config.defaultOptions || {});
    __privateSet(this, _queryDefaults, /* @__PURE__ */ new Map());
    __privateSet(this, _mutationDefaults, /* @__PURE__ */ new Map());
    __privateSet(this, _mountCount, 0);
  }
  mount() {
    __privateWrapper(this, _mountCount)._++;
    if (__privateGet(this, _mountCount) !== 1) return;
    __privateSet(this, _unsubscribeFocus, focusManager.subscribe(async (focused) => {
      if (focused) {
        await this.resumePausedMutations();
        __privateGet(this, _queryCache).onFocus();
      }
    }));
    __privateSet(this, _unsubscribeOnline, onlineManager.subscribe(async (online) => {
      if (online) {
        await this.resumePausedMutations();
        __privateGet(this, _queryCache).onOnline();
      }
    }));
  }
  unmount() {
    var _a2, _b2;
    __privateWrapper(this, _mountCount)._--;
    if (__privateGet(this, _mountCount) !== 0) return;
    (_a2 = __privateGet(this, _unsubscribeFocus)) == null ? void 0 : _a2.call(this);
    __privateSet(this, _unsubscribeFocus, void 0);
    (_b2 = __privateGet(this, _unsubscribeOnline)) == null ? void 0 : _b2.call(this);
    __privateSet(this, _unsubscribeOnline, void 0);
  }
  isFetching(filters) {
    return __privateGet(this, _queryCache).findAll({ ...filters, fetchStatus: "fetching" }).length;
  }
  isMutating(filters) {
    return __privateGet(this, _mutationCache2).findAll({ ...filters, status: "pending" }).length;
  }
  /**
   * Imperative (non-reactive) way to retrieve data for a QueryKey.
   * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
   *
   * Hint: Do not use this function inside a component, because it won't receive updates.
   * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
   */
  getQueryData(queryKey2) {
    const options = this.defaultQueryOptions({ queryKey: queryKey2 });
    return __privateGet(this, _queryCache).get(options.queryHash)?.state.data;
  }
  ensureQueryData(options) {
    const defaultedOptions = this.defaultQueryOptions(options);
    const query = __privateGet(this, _queryCache).build(this, defaultedOptions);
    const cachedData = query.state.data;
    if (cachedData === void 0) {
      return this.fetchQuery(options);
    }
    if (options.revalidateIfStale && query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))) {
      void this.prefetchQuery(defaultedOptions);
    }
    return Promise.resolve(cachedData);
  }
  getQueriesData(filters) {
    return __privateGet(this, _queryCache).findAll(filters).map(({ queryKey: queryKey2, state: state2 }) => {
      const data = state2.data;
      return [queryKey2, data];
    });
  }
  setQueryData(queryKey2, updater, options) {
    const defaultedOptions = this.defaultQueryOptions({ queryKey: queryKey2 });
    const query = __privateGet(this, _queryCache).get(
      defaultedOptions.queryHash
    );
    const prevData = query?.state.data;
    const data = functionalUpdate(updater, prevData);
    if (data === void 0) {
      return void 0;
    }
    return __privateGet(this, _queryCache).build(this, defaultedOptions).setData(data, { ...options, manual: true });
  }
  setQueriesData(filters, updater, options) {
    return notifyManager.batch(
      () => __privateGet(this, _queryCache).findAll(filters).map(({ queryKey: queryKey2 }) => [
        queryKey2,
        this.setQueryData(queryKey2, updater, options)
      ])
    );
  }
  getQueryState(queryKey2) {
    const options = this.defaultQueryOptions({ queryKey: queryKey2 });
    return __privateGet(this, _queryCache).get(
      options.queryHash
    )?.state;
  }
  removeQueries(filters) {
    const queryCache = __privateGet(this, _queryCache);
    notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        queryCache.remove(query);
      });
    });
  }
  resetQueries(filters, options) {
    const queryCache = __privateGet(this, _queryCache);
    return notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        query.reset();
      });
      return this.refetchQueries(
        {
          type: "active",
          ...filters
        },
        options
      );
    });
  }
  cancelQueries(filters, cancelOptions = {}) {
    const defaultedCancelOptions = { revert: true, ...cancelOptions };
    const promises = notifyManager.batch(
      () => __privateGet(this, _queryCache).findAll(filters).map((query) => query.cancel(defaultedCancelOptions))
    );
    return Promise.all(promises).then(noop$1).catch(noop$1);
  }
  invalidateQueries(filters, options = {}) {
    return notifyManager.batch(() => {
      __privateGet(this, _queryCache).findAll(filters).forEach((query) => {
        query.invalidate();
      });
      if (filters?.refetchType === "none") {
        return Promise.resolve();
      }
      return this.refetchQueries(
        {
          ...filters,
          type: filters?.refetchType ?? filters?.type ?? "active"
        },
        options
      );
    });
  }
  refetchQueries(filters, options = {}) {
    const fetchOptions = {
      ...options,
      cancelRefetch: options.cancelRefetch ?? true
    };
    const promises = notifyManager.batch(
      () => __privateGet(this, _queryCache).findAll(filters).filter((query) => !query.isDisabled() && !query.isStatic()).map((query) => {
        let promise = query.fetch(void 0, fetchOptions);
        if (!fetchOptions.throwOnError) {
          promise = promise.catch(noop$1);
        }
        return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
      })
    );
    return Promise.all(promises).then(noop$1);
  }
  fetchQuery(options) {
    const defaultedOptions = this.defaultQueryOptions(options);
    if (defaultedOptions.retry === void 0) {
      defaultedOptions.retry = false;
    }
    const query = __privateGet(this, _queryCache).build(this, defaultedOptions);
    return query.isStaleByTime(
      resolveStaleTime(defaultedOptions.staleTime, query)
    ) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
  }
  prefetchQuery(options) {
    return this.fetchQuery(options).then(noop$1).catch(noop$1);
  }
  fetchInfiniteQuery(options) {
    options._type = "infinite";
    return this.fetchQuery(options);
  }
  prefetchInfiniteQuery(options) {
    return this.fetchInfiniteQuery(options).then(noop$1).catch(noop$1);
  }
  ensureInfiniteQueryData(options) {
    options._type = "infinite";
    return this.ensureQueryData(options);
  }
  resumePausedMutations() {
    if (onlineManager.isOnline()) {
      return __privateGet(this, _mutationCache2).resumePausedMutations();
    }
    return Promise.resolve();
  }
  getQueryCache() {
    return __privateGet(this, _queryCache);
  }
  getMutationCache() {
    return __privateGet(this, _mutationCache2);
  }
  getDefaultOptions() {
    return __privateGet(this, _defaultOptions2);
  }
  setDefaultOptions(options) {
    __privateSet(this, _defaultOptions2, options);
  }
  setQueryDefaults(queryKey2, options) {
    __privateGet(this, _queryDefaults).set(hashKey(queryKey2), {
      queryKey: queryKey2,
      defaultOptions: options
    });
  }
  getQueryDefaults(queryKey2) {
    const defaults2 = [...__privateGet(this, _queryDefaults).values()];
    const result = {};
    defaults2.forEach((queryDefault) => {
      if (partialMatchKey(queryKey2, queryDefault.queryKey)) {
        Object.assign(result, queryDefault.defaultOptions);
      }
    });
    return result;
  }
  setMutationDefaults(mutationKey, options) {
    __privateGet(this, _mutationDefaults).set(hashKey(mutationKey), {
      mutationKey,
      defaultOptions: options
    });
  }
  getMutationDefaults(mutationKey) {
    const defaults2 = [...__privateGet(this, _mutationDefaults).values()];
    const result = {};
    defaults2.forEach((queryDefault) => {
      if (partialMatchKey(mutationKey, queryDefault.mutationKey)) {
        Object.assign(result, queryDefault.defaultOptions);
      }
    });
    return result;
  }
  defaultQueryOptions(options) {
    if (options._defaulted) {
      return options;
    }
    const defaultedOptions = {
      ...__privateGet(this, _defaultOptions2).queries,
      ...this.getQueryDefaults(options.queryKey),
      ...options,
      _defaulted: true
    };
    if (!defaultedOptions.queryHash) {
      defaultedOptions.queryHash = hashQueryKeyByOptions(
        defaultedOptions.queryKey,
        defaultedOptions
      );
    }
    if (defaultedOptions.refetchOnReconnect === void 0) {
      defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
    }
    if (defaultedOptions.throwOnError === void 0) {
      defaultedOptions.throwOnError = !!defaultedOptions.suspense;
    }
    if (!defaultedOptions.networkMode && defaultedOptions.persister) {
      defaultedOptions.networkMode = "offlineFirst";
    }
    if (defaultedOptions.queryFn === skipToken) {
      defaultedOptions.enabled = false;
    }
    return defaultedOptions;
  }
  defaultMutationOptions(options) {
    if (options?._defaulted) {
      return options;
    }
    return {
      ...__privateGet(this, _defaultOptions2).mutations,
      ...options?.mutationKey && this.getMutationDefaults(options.mutationKey),
      ...options,
      _defaulted: true
    };
  }
  clear() {
    __privateGet(this, _queryCache).clear();
    __privateGet(this, _mutationCache2).clear();
  }
}, _queryCache = new WeakMap(), _mutationCache2 = new WeakMap(), _defaultOptions2 = new WeakMap(), _queryDefaults = new WeakMap(), _mutationDefaults = new WeakMap(), _mountCount = new WeakMap(), _unsubscribeFocus = new WeakMap(), _unsubscribeOnline = new WeakMap(), _i);
var QueryClientContext = reactExports.createContext(
  void 0
);
var useQueryClient = (queryClient2) => {
  const client2 = reactExports.useContext(QueryClientContext);
  if (!client2) {
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  }
  return client2;
};
var QueryClientProvider = ({
  client: client2,
  children
}) => {
  reactExports.useEffect(() => {
    client2.mount();
    return () => {
      client2.unmount();
    };
  }, [client2]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientContext.Provider, { value: client2, children });
};
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
function PageLoader({ label = "جارٍ التحميل..." }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-loader", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "page-loader-spinner" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-loader-copy", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "بنجهز لك الواجهة بشكل أسرع وأكثر سلاسة." })
    ] })
  ] });
}
const DEFAULT_PRIMARY_ADMIN_EMAIL = "yamenameen97@gmail.com";
const PLACEHOLDER_ADMIN_EMAILS = /* @__PURE__ */ new Set(["", "admin@example.com", "your-admin@example.com"]);
const normalizeEmail = (value2) => String(value2 || "").trim().toLowerCase();
const configuredPrimaryAdminEmail = normalizeEmail("");
const PRIMARY_ADMIN_EMAIL = PLACEHOLDER_ADMIN_EMAILS.has(configuredPrimaryAdminEmail) ? DEFAULT_PRIMARY_ADMIN_EMAIL : configuredPrimaryAdminEmail;
const isPrimaryAdminEmail = (value2) => normalizeEmail(value2) === PRIMARY_ADMIN_EMAIL;
const isPrimaryAdminSession = (session) => {
  if (!session || typeof session !== "object") return false;
  const email = session.email || session?.profile?.email || "";
  const role = String(session.role || session?.profile?.role || "user").trim().toLowerCase();
  return isPrimaryAdminEmail(email) && role === "admin";
};
const getDefaultPostLoginPath = (session) => isPrimaryAdminSession(session) ? "/admin/dashboard" : "/";
function encode$3(value2) {
  return btoa(JSON.stringify(value2));
}
function decode$2(raw) {
  return JSON.parse(atob(raw));
}
function secureSet(key, value2, options = {}) {
  const persist = Boolean(options?.persist);
  const storage = persist ? localStorage : sessionStorage;
  const fallbackStorage = persist ? sessionStorage : localStorage;
  const encoded = encode$3(value2);
  storage.setItem(key, encoded);
  fallbackStorage.removeItem(key);
}
function secureGet(key) {
  const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
  if (!raw) return null;
  return decode$2(raw);
}
function secureRemove(key) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}
const CSRF_COOKIE_NAME = "yamshat_csrf_token";
const CSRF_STORAGE_KEY$1 = "yamshat_csrf_token";
function canUseDocument() {
  return typeof document !== "undefined";
}
function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function readCookie(name) {
  if (!canUseDocument()) return "";
  const prefix = `${name}=`;
  const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return raw ? decodeURIComponent(raw.slice(prefix.length)) : "";
}
function readStoredToken() {
  if (!canUseStorage()) return "";
  try {
    return String(window.localStorage.getItem(CSRF_STORAGE_KEY$1) || window.sessionStorage.getItem(CSRF_STORAGE_KEY$1) || "").trim();
  } catch {
    return "";
  }
}
function getCsrfToken() {
  return readStoredToken() || readCookie(CSRF_COOKIE_NAME);
}
function setCsrfToken(value2 = "") {
  if (!canUseStorage()) return;
  const token = String(value2 || "").trim();
  try {
    if (token) {
      window.localStorage.setItem(CSRF_STORAGE_KEY$1, token);
      window.sessionStorage.setItem(CSRF_STORAGE_KEY$1, token);
      return;
    }
    window.localStorage.removeItem(CSRF_STORAGE_KEY$1);
    window.sessionStorage.removeItem(CSRF_STORAGE_KEY$1);
  } catch {
  }
}
function clearCsrfToken() {
  setCsrfToken("");
}
const createStoreImpl = (createState) => {
  let state2;
  const listeners2 = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state2) : partial;
    if (!Object.is(nextState, state2)) {
      const previousState = state2;
      state2 = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state2, nextState);
      listeners2.forEach((listener) => listener(state2, previousState));
    }
  };
  const getState = () => state2;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners2.add(listener);
    return () => listeners2.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state2 = createState(setState, getState, api);
  return api;
};
const createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);
const identity = (arg) => arg;
function useStore(api, selector = identity) {
  const slice = React.useSyncExternalStore(
    api.subscribe,
    React.useCallback(() => selector(api.getState()), [api, selector]),
    React.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  React.useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create$1 = ((createState) => createState ? createImpl(createState) : createImpl);
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}
const { toString: toString$1 } = Object.prototype;
const { getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;
const kindOf = /* @__PURE__ */ ((cache2) => (thing) => {
  const str = toString$1.call(thing);
  return cache2[str] || (cache2[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
const typeOfTest = (type) => (thing) => typeof thing === type;
const { isArray } = Array;
const isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
const isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
const isString = typeOfTest("string");
const isFunction$1 = typeOfTest("function");
const isNumber = typeOfTest("number");
const isObject$1 = (thing) => thing !== null && typeof thing === "object";
const isBoolean = (thing) => thing === true || thing === false;
const isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag in val) && !(iterator in val);
};
const isEmptyObject = (val) => {
  if (!isObject$1(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e2) {
    return false;
  }
};
const isDate = kindOfTest("Date");
const isFile = kindOfTest("File");
const isReactNativeBlob = (value2) => {
  return !!(value2 && typeof value2.uri !== "undefined");
};
const isReactNative$1 = (formData) => formData && typeof formData.getParts !== "undefined";
const isBlob = kindOfTest("Blob");
const isFileList = kindOfTest("FileList");
const isStream = (val) => isObject$1(val) && isFunction$1(val.pipe);
function getGlobal() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}
const G = getGlobal();
const FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
const isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction$1(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction$1(thing.toString) && thing.toString() === "[object FormData]";
};
const isURLSearchParams = kindOfTest("URLSearchParams");
const [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
const trim$2 = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i2;
  let l2;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i2 = 0, l2 = obj.length; i2 < l2; i2++) {
      fn.call(null, obj[i2], i2, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i2 = 0; i2 < len; i2++) {
      key = keys[i2];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i2 = keys.length;
  let _key;
  while (i2-- > 0) {
    _key = keys[i2];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
const _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
const isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge(...objs) {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && findKey(result, key) || key;
    const existing = hasOwnProperty(result, targetKey) ? result[targetKey] : void 0;
    if (isPlainObject(existing) && isPlainObject(val)) {
      result[targetKey] = merge(existing, val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i2 = 0, l2 = objs.length; i2 < l2; i2++) {
    objs[i2] && forEach(objs[i2], assignValue);
  }
  return result;
}
const extend = (a2, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction$1(val)) {
        Object.defineProperty(a2, key, {
          // Null-proto descriptor so a polluted Object.prototype.get cannot
          // hijack defineProperty's accessor-vs-data resolution.
          __proto__: null,
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a2, key, {
          __proto__: null,
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a2;
};
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    __proto__: null,
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    __proto__: null,
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
const toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i2;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i2 = props.length;
    while (i2-- > 0) {
      prop = props[i2];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
const toArray$1 = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i2 = thing.length;
  if (!isNumber(i2)) return null;
  const arr = new Array(i2);
  while (i2-- > 0) {
    arr[i2] = thing[i2];
  }
  return arr;
};
const isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
const isHTMLForm = kindOfTest("HTMLFormElement");
const toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
const isRegExp = kindOfTest("RegExp");
const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction$1(obj) && ["arguments", "caller", "callee"].includes(name)) {
      return false;
    }
    const value2 = obj[name];
    if (!isFunction$1(value2)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value2) => {
      obj[value2] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
const noop = () => {
};
const toFiniteNumber = (value2, defaultValue) => {
  return value2 != null && Number.isFinite(value2 = +value2) ? value2 : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
const toJSONObject = (obj) => {
  const stack = new Array(10);
  const visit = (source, i2) => {
    if (isObject$1(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        stack[i2] = source;
        const target = isArray(source) ? [] : {};
        forEach(source, (value2, key) => {
          const reducedValue = visit(value2, i2 + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack[i2] = void 0;
        return target;
      }
    }
    return source;
  };
  return visit(obj, 0);
};
const isAsyncFn = kindOfTest("AsyncFunction");
const isThenable = (thing) => thing && (isObject$1(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);
const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction$1(_global.postMessage));
const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
const isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);
const utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject: isObject$1,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative: isReactNative$1,
  isBlob,
  isRegExp,
  isFunction: isFunction$1,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim: trim$2,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray: toArray$1,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable
};
const ignoreDuplicateOf = utils$1.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
const parseHeaders = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i2;
  rawHeaders && rawHeaders.split("\n").forEach(function parser2(line) {
    i2 = line.indexOf(":");
    key = line.substring(0, i2).trim().toLowerCase();
    val = line.substring(i2 + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};
const $internals = /* @__PURE__ */ Symbol("internals");
const INVALID_HEADER_VALUE_CHARS_RE = /[^\x09\x20-\x7E\x80-\xFF]/g;
function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;
  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function sanitizeHeaderValue(str) {
  return trimSPorHTAB(str.replace(INVALID_HEADER_VALUE_CHARS_RE, ""));
}
function normalizeValue(value2) {
  if (value2 === false || value2 == null) {
    return value2;
  }
  return utils$1.isArray(value2) ? value2.map(normalizeValue) : sanitizeHeaderValue(String(value2));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value2, header, filter2, isHeaderNameFilter) {
  if (utils$1.isFunction(filter2)) {
    return filter2.call(this, value2, header);
  }
  if (isHeaderNameFilter) {
    value2 = header;
  }
  if (!utils$1.isString(value2)) return;
  if (utils$1.isString(filter2)) {
    return value2.indexOf(filter2) !== -1;
  }
  if (utils$1.isRegExp(filter2)) {
    return filter2.test(value2);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
let AxiosHeaders$1 = class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils$1.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
      let obj = {}, dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw TypeError("Object iterator must return a key-value pair");
        }
        obj[key = entry[0]] = (dest = obj[key]) ? utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser2) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      if (key) {
        const value2 = this[key];
        if (!parser2) {
          return value2;
        }
        if (parser2 === true) {
          return parseTokens(value2);
        }
        if (utils$1.isFunction(parser2)) {
          return parser2.call(this, value2, key);
        }
        if (utils$1.isRegExp(parser2)) {
          return parser2.exec(value2);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils$1.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i2 = keys.length;
    let deleted = false;
    while (i2--) {
      const key = keys[i2];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils$1.forEach(this, (value2, header) => {
      const key = utils$1.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value2);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value2);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils$1.forEach(this, (value2, header) => {
      value2 != null && value2 !== false && (obj[header] = asStrings && utils$1.isArray(value2) ? value2.join(", ") : value2);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value2]) => header + ": " + value2).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders$1.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({ value: value2 }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value2,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils$1.freezeMethods(AxiosHeaders$1);
const REDACTED = "[REDACTED ****]";
function hasOwnOrPrototypeToJSON(source) {
  if (utils$1.hasOwnProp(source, "toJSON")) {
    return true;
  }
  let prototype2 = Object.getPrototypeOf(source);
  while (prototype2 && prototype2 !== Object.prototype) {
    if (utils$1.hasOwnProp(prototype2, "toJSON")) {
      return true;
    }
    prototype2 = Object.getPrototypeOf(prototype2);
  }
  return false;
}
function redactConfig(config, redactKeys) {
  const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
  const seen2 = [];
  const visit = (source) => {
    if (source === null || typeof source !== "object") return source;
    if (utils$1.isBuffer(source)) return source;
    if (seen2.indexOf(source) !== -1) return void 0;
    if (source instanceof AxiosHeaders$1) {
      source = source.toJSON();
    }
    seen2.push(source);
    let result;
    if (utils$1.isArray(source)) {
      result = [];
      source.forEach((v, i2) => {
        const reducedValue = visit(v);
        if (!utils$1.isUndefined(reducedValue)) {
          result[i2] = reducedValue;
        }
      });
    } else {
      if (!utils$1.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen2.pop();
        return source;
      }
      result = /* @__PURE__ */ Object.create(null);
      for (const [key, value2] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value2);
        if (!utils$1.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }
    seen2.pop();
    return result;
  };
  return visit(config);
}
let AxiosError$1 = class AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    const axiosError = new AxiosError(error.message, code || error.code, config, request, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);
    Object.defineProperty(this, "message", {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    const config = this.config;
    const redactKeys = config && utils$1.hasOwnProp(config, "redact") ? config.redact : void 0;
    const serializedConfig = utils$1.isArray(redactKeys) && redactKeys.length > 0 ? redactConfig(config, redactKeys) : utils$1.toJSONObject(config);
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: serializedConfig,
      code: this.code,
      status: this.status
    };
  }
};
AxiosError$1.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError$1.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError$1.ECONNABORTED = "ECONNABORTED";
AxiosError$1.ETIMEDOUT = "ETIMEDOUT";
AxiosError$1.ECONNREFUSED = "ECONNREFUSED";
AxiosError$1.ERR_NETWORK = "ERR_NETWORK";
AxiosError$1.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError$1.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError$1.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError$1.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError$1.ERR_CANCELED = "ERR_CANCELED";
AxiosError$1.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError$1.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
const httpAdapter = null;
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}
function removeBrackets(key) {
  return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i2) {
    token = removeBrackets(token);
    return !dots && i2 ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}
const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData$1(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new FormData();
  options = utils$1.toFlatObject(
    options,
    {
      metaTokens: true,
      dots: false,
      indexes: false
    },
    false,
    function defined(option, source) {
      return !utils$1.isUndefined(source[option]);
    }
  );
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const maxDepth = options.maxDepth === void 0 ? 100 : options.maxDepth;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
  if (!utils$1.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value2) {
    if (value2 === null) return "";
    if (utils$1.isDate(value2)) {
      return value2.toISOString();
    }
    if (utils$1.isBoolean(value2)) {
      return value2.toString();
    }
    if (!useBlob && utils$1.isBlob(value2)) {
      throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
    }
    if (utils$1.isArrayBuffer(value2) || utils$1.isTypedArray(value2)) {
      return useBlob && typeof Blob === "function" ? new Blob([value2]) : Buffer.from(value2);
    }
    return value2;
  }
  function defaultVisitor(value2, key, path) {
    let arr = value2;
    if (utils$1.isReactNative(formData) && utils$1.isReactNativeBlob(value2)) {
      formData.append(renderKey(path, key, dots), convertValue(value2));
      return false;
    }
    if (value2 && !path && typeof value2 === "object") {
      if (utils$1.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value2 = JSON.stringify(value2);
      } else if (utils$1.isArray(value2) && isFlatArray(value2) || (utils$1.isFileList(value2) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value2))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils$1.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        });
        return false;
      }
    }
    if (isVisitable(value2)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value2));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value2, path, depth = 0) {
    if (utils$1.isUndefined(value2)) return;
    if (depth > maxDepth) {
      throw new AxiosError$1(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
    if (stack.indexOf(value2) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value2);
    utils$1.forEach(value2, function each(el, key) {
      const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers);
      if (result === true) {
        build(el, path ? path.concat(key) : [key], depth + 1);
      }
    });
    stack.pop();
  }
  if (!utils$1.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
function encode$2(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params2, options) {
  this._pairs = [];
  params2 && toFormData$1(params2, this, options);
}
const prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value2) {
  this._pairs.push([name, value2]);
};
prototype.toString = function toString(encoder) {
  const _encode = encoder ? function(value2) {
    return encoder.call(this, value2, encode$2);
  } : encode$2;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
function encode$1(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url2, params2, options) {
  if (!params2) {
    return url2;
  }
  const _encode = options && options.encode || encode$1;
  const _options = utils$1.isFunction(options) ? {
    serialize: options
  } : options;
  const serializeFn = _options && _options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params2, _options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params2) ? params2.toString() : new AxiosURLSearchParams(params2, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url2.indexOf("#");
    if (hashmarkIndex !== -1) {
      url2 = url2.slice(0, hashmarkIndex);
    }
    url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url2;
}
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true
};
const URLSearchParams$1 = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams;
const FormData$1 = typeof FormData !== "undefined" ? FormData : null;
const Blob$1 = typeof Blob !== "undefined" ? Blob : null;
const platform$1 = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams$1,
    FormData: FormData$1,
    Blob: Blob$1
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};
const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
const _navigator = typeof navigator === "object" && navigator || void 0;
const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
const hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
const origin = hasBrowserEnv && window.location.href || "http://localhost";
const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv,
  hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv,
  navigator: _navigator,
  origin
}, Symbol.toStringTag, { value: "Module" }));
const platform = {
  ...utils,
  ...platform$1
};
function toURLEncodedForm(data, options) {
  return toFormData$1(data, new platform.classes.URLSearchParams(), {
    visitor: function(value2, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value2)) {
        this.append(key, value2.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}
function parsePropPath(name) {
  return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i2;
  const len = keys.length;
  let key;
  for (i2 = 0; i2 < len; i2++) {
    key = keys[i2];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value2, target, index) {
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = utils$1.isArray(target[name]) ? target[name].concat(value2) : [target[name], value2];
      } else {
        target[name] = value2;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils$1.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value2, target[name], index);
    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};
    utils$1.forEachEntry(formData, (name, value2) => {
      buildPath(parsePropPath(name), value2, obj, 0);
    });
    return obj;
  }
  return null;
}
const own = (obj, key) => obj != null && utils$1.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely(rawValue, parser2, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser2 || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e2) {
      if (e2.name !== "SyntaxError") {
        throw e2;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
const defaults = {
  transitional: transitionalDefaults,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils$1.isObject(data);
      if (isObjectPayload && utils$1.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils$1.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }
      if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (utils$1.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils$1.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env = own(this, "env");
          const _FormData = env && env.FormData;
          return toFormData$1(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (data && utils$1.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e2) {
          if (strictJSONParsing) {
            if (e2.name === "SyntaxError") {
              throw AxiosError$1.from(e2, AxiosError$1.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e2;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "query"], (method) => {
  defaults.headers[method] = {};
});
function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;
  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
function isCancel$1(value2) {
  return !!(value2 && value2.__CANCEL__);
}
let CanceledError$1 = class CanceledError extends AxiosError$1 {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError$1(
      "Request failed with status code " + response.status,
      response.status >= 400 && response.status < 500 ? AxiosError$1.ERR_BAD_REQUEST : AxiosError$1.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response
    ));
  }
}
function parseProtocol(url2) {
  const match = /^([-+\w]{1,25}):(?:\/\/)?/.exec(url2);
  return match && match[1] || "";
}
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i2 = tail;
    let bytesCount = 0;
    while (i2 !== head) {
      bytesCount += bytes[i2++];
      i2 = i2 % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);
  return throttle((e2) => {
    const rawLoaded = e2.loaded;
    const total = e2.lengthComputable ? e2.total : void 0;
    const loaded = total != null ? Math.min(rawLoaded, total) : rawLoaded;
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e2,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
const isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url2) => {
  url2 = new URL(url2, platform.origin);
  return origin2.protocol === url2.protocol && origin2.host === url2.host && (isMSIE || origin2.port === url2.port);
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;
const cookies = platform.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value2, expires, path, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value2)}`];
      if (utils$1.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils$1.isString(path)) {
        cookie.push(`path=${path}`);
      }
      if (utils$1.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils$1.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const cookies2 = document.cookie.split(";");
      for (let i2 = 0; i2 < cookies2.length; i2++) {
        const cookie = cookies2[i2].replace(/^\s+/, "");
        const eq = cookie.indexOf("=");
        if (eq !== -1 && cookie.slice(0, eq) === name) {
          return decodeURIComponent(cookie.slice(eq + 1));
        }
      }
      return null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function isAbsoluteURL(url2) {
  if (typeof url2 !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
}
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
function mergeConfig$1(config1, config2) {
  config2 = config2 || {};
  const config = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config, "hasOwnProperty", {
    // Null-proto descriptor so a polluted Object.prototype.get cannot turn
    // this data descriptor into an accessor descriptor on the way in.
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({ caseless }, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a2, b, prop, caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a2, b, prop, caseless);
    } else if (!utils$1.isUndefined(a2)) {
      return getMergedValue(void 0, a2, prop, caseless);
    }
  }
  function valueFromConfig2(a2, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a2, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils$1.isUndefined(a2)) {
      return getMergedValue(void 0, a2);
    }
  }
  function mergeDirectKeys(a2, b, prop) {
    if (utils$1.hasOwnProp(config2, prop)) {
      return getMergedValue(a2, b);
    } else if (utils$1.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a2);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a2, b, prop) => mergeDeepProperties(headersToObject(a2), headersToObject(b), prop, true)
  };
  utils$1.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils$1.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a2 = utils$1.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils$1.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a2, b, prop);
    utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}
const FORM_DATA_CONTENT_HEADERS = ["content-type", "content-length"];
function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== "content-only") {
    headers.set(formHeaders);
    return;
  }
  Object.entries(formHeaders).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}
const encodeUTF8 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex) => String.fromCharCode(parseInt(hex, 16))
);
const resolveConfig = (config) => {
  const newConfig = mergeConfig$1({}, config);
  const own2 = (key) => utils$1.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url2 = own2("url");
  newConfig.headers = headers = AxiosHeaders$1.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url2, allowAbsoluteUrls),
    config.params,
    config.paramsSerializer
  );
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa((auth.username || "") + ":" + (auth.password ? encodeUTF8(auth.password) : ""))
    );
  }
  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if (utils$1.isFunction(data.getHeaders)) {
      setFormDataHeaders(headers, data.getHeaders(), own2("formDataHeaderPolicy"));
    }
  }
  if (platform.hasStandardBrowserEnv) {
    if (utils$1.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
};
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
const xhrAdapter = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders$1.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(
        function _resolve(value2) {
          resolve(value2);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.startsWith("file:"))) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
      done();
      request = null;
    };
    request.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError$1(msg, AxiosError$1.ERR_NETWORK, config, request);
      err.event = event || null;
      reject(err);
      done();
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError$1(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
          config,
          request
        )
      );
      done();
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
        request.abort();
        done();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol2 = parseProtocol(_config.url);
    if (protocol2 && !platform.protocols.includes(protocol2)) {
      reject(
        new AxiosError$1(
          "Unsupported protocol " + protocol2 + ":",
          AxiosError$1.ERR_BAD_REQUEST,
          config
        )
      );
      return;
    }
    request.send(requestData || null);
  });
};
const composeSignals = (signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(
          err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err)
        );
      }
    };
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError$1(`timeout of ${timeout}ms exceeded`, AxiosError$1.ETIMEDOUT));
    }, timeout);
    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    };
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils$1.asap(unsubscribe);
    return signal;
  }
};
const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value: value2 } = await reader.read();
      if (done) {
        break;
      }
      yield value2;
    }
  } finally {
    await reader.cancel();
  }
};
const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e2) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e2);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value: value2 } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value2.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value2));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};
function estimateDataURLDecodedBytes(url2) {
  if (!url2 || typeof url2 !== "string") return 0;
  if (!url2.startsWith("data:")) return 0;
  const comma = url2.indexOf(",");
  if (comma < 0) return 0;
  const meta = url2.slice(5, comma);
  const body = url2.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    let effectiveLen = body.length;
    const len = body.length;
    for (let i2 = 0; i2 < len; i2++) {
      if (body.charCodeAt(i2) === 37 && i2 + 2 < len) {
        const a2 = body.charCodeAt(i2 + 1);
        const b = body.charCodeAt(i2 + 2);
        const isHex = (a2 >= 48 && a2 <= 57 || a2 >= 65 && a2 <= 70 || a2 >= 97 && a2 <= 102) && (b >= 48 && b <= 57 || b >= 65 && b <= 70 || b >= 97 && b <= 102);
        if (isHex) {
          effectiveLen -= 2;
          i2 += 2;
        }
      }
    }
    let pad = 0;
    let idx = len - 1;
    const tailIsPct3D = (j) => j >= 2 && body.charCodeAt(j - 2) === 37 && // '%'
    body.charCodeAt(j - 1) === 51 && // '3'
    (body.charCodeAt(j) === 68 || body.charCodeAt(j) === 100);
    if (idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
        idx--;
      } else if (tailIsPct3D(idx)) {
        pad++;
        idx -= 3;
      }
    }
    if (pad === 1 && idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
      } else if (tailIsPct3D(idx)) {
        pad++;
      }
    }
    const groups = Math.floor(effectiveLen / 4);
    const bytes2 = groups * 3 - (pad || 0);
    return bytes2 > 0 ? bytes2 : 0;
  }
  if (typeof Buffer !== "undefined" && typeof Buffer.byteLength === "function") {
    return Buffer.byteLength(body, "utf8");
  }
  let bytes = 0;
  for (let i2 = 0, len = body.length; i2 < len; i2++) {
    const c2 = body.charCodeAt(i2);
    if (c2 < 128) {
      bytes += 1;
    } else if (c2 < 2048) {
      bytes += 2;
    } else if (c2 >= 55296 && c2 <= 56319 && i2 + 1 < len) {
      const next = body.charCodeAt(i2 + 1);
      if (next >= 56320 && next <= 57343) {
        bytes += 4;
        i2++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
const VERSION$1 = "1.16.0";
const DEFAULT_CHUNK_SIZE$1 = 64 * 1024;
const { isFunction } = utils$1;
const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e2) {
    return false;
  }
};
const factory = (env) => {
  const globalObject = utils$1.global ?? globalThis;
  const { ReadableStream: ReadableStream2, TextEncoder: TextEncoder2 } = globalObject;
  env = utils$1.merge.call(
    {
      skipUndefined: true
    },
    {
      Request: globalObject.Request,
      Response: globalObject.Response
    },
    env
  );
  const { fetch: envFetch, Request: Request2, Response } = env;
  const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction(Request2);
  const isResponseSupported = isFunction(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream2);
  const encodeText = isFetchSupported && (typeof TextEncoder2 === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder2()) : async (str) => new Uint8Array(await new Request2(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request = new Request2(platform.origin, {
      body: new ReadableStream2(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request.headers.has("Content-Type");
    if (request.body != null) {
      request.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError$1(
          `Response type '${type}' is not supported`,
          AxiosError$1.ERR_NOT_SUPPORT,
          config
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils$1.isBlob(body)) {
      return body.size;
    }
    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request2(platform.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils$1.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config) => {
    let {
      url: url2,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions,
      maxContentLength,
      maxBodyLength
    } = resolveConfig(config);
    const hasMaxContentLength = utils$1.isNumber(maxContentLength) && maxContentLength > -1;
    const hasMaxBodyLength = utils$1.isNumber(maxBodyLength) && maxBodyLength > -1;
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    try {
      if (hasMaxContentLength && typeof url2 === "string" && url2.startsWith("data:")) {
        const estimated = estimateDataURLDecodedBytes(url2);
        if (estimated > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      if (hasMaxBodyLength && method !== "get" && method !== "head") {
        const outboundLength = await resolveBodyLength(headers, data);
        if (typeof outboundLength === "number" && isFinite(outboundLength) && outboundLength > maxBodyLength) {
          throw new AxiosError$1(
            "Request body larger than maxBodyLength limit",
            AxiosError$1.ERR_BAD_REQUEST,
            config,
            request
          );
        }
      }
      if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
        let _request = new Request2(url2, {
          method: "POST",
          body: data,
          duplex: "half"
        });
        let contentTypeHeader;
        if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
          headers.setContentType(contentTypeHeader);
        }
        if (_request.body) {
          const [onProgress, flush] = progressEventDecorator(
            requestContentLength,
            progressEventReducer(asyncDecorator(onUploadProgress))
          );
          data = trackStream(_request.body, DEFAULT_CHUNK_SIZE$1, onProgress, flush);
        }
      }
      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request2.prototype;
      if (utils$1.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      headers.set("User-Agent", "axios/" + VERSION$1, false);
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request2(url2, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url2, resolvedOptions));
      if (hasMaxContentLength) {
        const declaredLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
        if (declaredLength != null && declaredLength > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && response.body && (onDownloadProgress || hasMaxContentLength || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        let bytesRead = 0;
        const onChunkProgress = (loadedBytes) => {
          if (hasMaxContentLength) {
            bytesRead = loadedBytes;
            if (bytesRead > maxContentLength) {
              throw new AxiosError$1(
                "maxContentLength size of " + maxContentLength + " exceeded",
                AxiosError$1.ERR_BAD_RESPONSE,
                config,
                request
              );
            }
          }
          onProgress && onProgress(loadedBytes);
        };
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE$1, onChunkProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](
        response,
        config
      );
      if (hasMaxContentLength && !supportsResponseStream && !isStreamResponse) {
        let materializedSize;
        if (responseData != null) {
          if (typeof responseData.byteLength === "number") {
            materializedSize = responseData.byteLength;
          } else if (typeof responseData.size === "number") {
            materializedSize = responseData.size;
          } else if (typeof responseData === "string") {
            materializedSize = typeof TextEncoder2 === "function" ? new TextEncoder2().encode(responseData).byteLength : responseData.length;
          }
        }
        if (typeof materializedSize === "number" && materializedSize > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (composedSignal && composedSignal.aborted && composedSignal.reason instanceof AxiosError$1) {
        const canceledError = composedSignal.reason;
        canceledError.config = config;
        request && (canceledError.request = request);
        err !== canceledError && (canceledError.cause = err);
        throw canceledError;
      }
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError$1(
            "Network Error",
            AxiosError$1.ERR_NETWORK,
            config,
            request,
            err && err.response
          ),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError$1.from(err, err && err.code, config, request, err && err.response);
    }
  };
};
const seedCache = /* @__PURE__ */ new Map();
const getFetch = (config) => {
  let env = config && config.env || {};
  const { fetch: fetch2, Request: Request2, Response } = env;
  const seeds = [Request2, Response, fetch2];
  let len = seeds.length, i2 = len, seed, target, map = seedCache;
  while (i2--) {
    seed = seeds[i2];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i2 ? /* @__PURE__ */ new Map() : factory(env));
    map = target;
  }
  return target;
};
getFetch();
const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: {
    get: getFetch
  }
};
utils$1.forEach(knownAdapters, (fn, value2) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { __proto__: null, value: value2 });
    } catch (e2) {
    }
    Object.defineProperty(fn, "adapterName", { __proto__: null, value: value2 });
  }
});
const renderReason = (reason) => `- ${reason}`;
const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
function getAdapter$1(adapters2, config) {
  adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
  const { length } = adapters2;
  let nameOrAdapter;
  let adapter;
  const rejectedReasons = {};
  for (let i2 = 0; i2 < length; i2++) {
    nameOrAdapter = adapters2[i2];
    let id;
    adapter = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
      if (adapter === void 0) {
        throw new AxiosError$1(`Unknown adapter '${id}'`);
      }
    }
    if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
      break;
    }
    rejectedReasons[id || "#" + i2] = adapter;
  }
  if (!adapter) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id, state2]) => `adapter ${id} ` + (state2 === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s2 = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError$1(
      `There is no suitable adapter to dispatch the request ` + s2,
      "ERR_NOT_SUPPORT"
    );
  }
  return adapter;
}
const adapters = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: getAdapter$1,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError$1(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders$1.from(config.headers);
  config.data = transformData.call(config, config.transformRequest);
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);
  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      config.response = response;
      try {
        response.data = transformData.call(config, config.transformResponse, response);
      } finally {
        delete config.response;
      }
      response.headers = AxiosHeaders$1.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel$1(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          config.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
          } finally {
            delete config.response;
          }
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}
const validators$1 = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i2) => {
  validators$1[type] = function validator2(thing) {
    return typeof thing === type || "a" + (i2 < 1 ? "n " : " ") + type;
  };
});
const deprecatedWarnings = {};
validators$1.transitional = function transitional(validator2, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value2, opt, opts) => {
    if (validator2 === false) {
      throw new AxiosError$1(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError$1.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator2 ? validator2(value2, opt, opts) : true;
  };
};
validators$1.spelling = function spelling(correctSpelling) {
  return (value2, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i2 = keys.length;
  while (i2-- > 0) {
    const opt = keys[i2];
    const validator2 = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator2) {
      const value2 = options[opt];
      const result = value2 === void 0 || validator2(value2, opt, options);
      if (result !== true) {
        throw new AxiosError$1(
          "option " + opt + " must be " + result,
          AxiosError$1.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
    }
  }
}
const validator = {
  assertOptions,
  validators: validators$1
};
const validators = validator.validators;
let Axios$1 = class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = (() => {
          if (!dummy.stack) {
            return "";
          }
          const firstNewlineIndex = dummy.stack.indexOf("\n");
          return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
        })();
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack;
            }
          }
        } catch (e2) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig$1(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean),
          legacyInterceptorReqResOrdering: validators.transitional(validators.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(
          paramsSerializer,
          {
            encode: validators.function,
            serialize: validators.function
          },
          true
        );
      }
    }
    if (config.allowAbsoluteUrls !== void 0) ;
    else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator.assertOptions(
      config,
      {
        baseUrl: validators.spelling("baseURL"),
        withXsrfToken: validators.spelling("withXSRFToken")
      },
      true
    );
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils$1.merge(headers.common, headers[config.method]);
    headers && utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "query", "common"], (method) => {
      delete headers[method];
    });
    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitionalDefaults;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i2 = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i2 < len) {
        promise = promise.then(chain[i2++], chain[i2++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i2 < len) {
      const onFulfilled = requestInterceptorChain[i2++];
      const onRejected = requestInterceptorChain[i2++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i2 = 0;
    len = responseInterceptorChain.length;
    while (i2 < len) {
      promise = promise.then(responseInterceptorChain[i2++], responseInterceptorChain[i2++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig$1(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios$1.prototype[method] = function(url2, config) {
    return this.request(
      mergeConfig$1(config || {}, {
        method,
        url: url2,
        data: (config || {}).data
      })
    );
  };
});
utils$1.forEach(["post", "put", "patch", "query"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url2, data, config) {
      return this.request(
        mergeConfig$1(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: url2,
          data
        })
      );
    };
  }
  Axios$1.prototype[method] = generateHTTPMethod();
  if (method !== "query") {
    Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
  }
});
let CancelToken$1 = class CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i2 = token._listeners.length;
      while (i2-- > 0) {
        token._listeners[i2](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError$1(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c2) {
      cancel = c2;
    });
    return {
      token,
      cancel
    };
  }
};
function spread$1(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}
function isAxiosError$1(payload) {
  return utils$1.isObject(payload) && payload.isAxiosError === true;
}
const HttpStatusCode$1 = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode$1).forEach(([key, value2]) => {
  HttpStatusCode$1[value2] = key;
});
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind(Axios$1.prototype.request, context);
  utils$1.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
  utils$1.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create2(instanceConfig) {
    return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
  };
  return instance;
}
const axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
const {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel,
  CancelToken: CancelToken2,
  VERSION,
  all: all2,
  Cancel,
  isAxiosError,
  spread,
  toFormData,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode,
  formToJSON,
  getAdapter,
  mergeConfig,
  create
} = axios;
const trim$1 = (value2) => String(value2 || "").trim().replace(/\/+$/, "");
const toApiBase = (value2) => {
  const cleaned = trim$1(value2);
  if (!cleaned) return "";
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
};
const apiToOrigin = (value2) => trim$1(toApiBase(value2).replace(/\/api$/, ""));
const currentOrigin = trim$1(window.location.origin);
const safeOrigin = (value2) => {
  try {
    return trim$1(new URL(String(value2 || "").trim()).origin);
  } catch {
    return "";
  }
};
const inferBackendOrigin = () => {
  try {
    const links = Array.from(document.querySelectorAll('link[rel="preconnect"][href], link[rel="dns-prefetch"][href]'));
    for (const link of links) {
      const origin2 = safeOrigin(link.getAttribute("href"));
      if (origin2 && origin2 !== currentOrigin) return origin2;
    }
  } catch {
  }
  return currentOrigin;
};
const readStored = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};
const params = new URLSearchParams(window.location.search);
const queryApi = toApiBase(params.get("api"));
const queryBackend = trim$1(params.get("backend"));
const storedApi = toApiBase(readStored("apiBase"));
const storedBackend = trim$1(readStored("backendOrigin"));
const runtimeApi = toApiBase(window.APP_API_BASE || "");
const runtimeBackendOrigin = trim$1(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);
const envApi = toApiBase("https://yamshatl.onrender.com/api");
const envBackendOrigin = trim$1("https://yamshatl.onrender.com");
const envSocketUrl = trim$1("https://yamshatl.onrender.com");
const envCdnBase = trim$1("");
const inferredBackendOrigin = inferBackendOrigin();
const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : "";
const SESSION_STORAGE_KEY = "yamshat_user_session";
const CSRF_STORAGE_KEY = "yamshat_csrf_token";
const isRenderHost = (value2) => /\.onrender\.com$/i.test(trim$1(value2));
const originLooksCurrent = (value2) => {
  const candidate = trim$1(value2);
  if (!candidate || !inferredBackendOrigin) return false;
  return candidate === inferredBackendOrigin || candidate === currentOrigin;
};
const apiLooksCurrent = (value2) => {
  const candidate = toApiBase(value2);
  if (!candidate) return false;
  return candidate === toApiBase(inferredApi) || candidate === toApiBase(`${currentOrigin}/api`);
};
const safeStoredBackend = originLooksCurrent(storedBackend) || !isRenderHost(storedBackend) ? storedBackend : "";
const safeStoredApi = apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi)) ? storedApi : "";
const runtimeBackendIsFrontendOrigin = Boolean(runtimeBackendOrigin && runtimeBackendOrigin === currentOrigin && inferredBackendOrigin !== currentOrigin);
const runtimeApiIsFrontendOrigin = Boolean(runtimeApi && runtimeApi === toApiBase(`${currentOrigin}/api`) && inferredBackendOrigin !== currentOrigin);
const safeRuntimeBackendOrigin = runtimeBackendIsFrontendOrigin ? "" : runtimeBackendOrigin;
const runtimeApiMatchesRuntimeBackend = Boolean(!safeRuntimeBackendOrigin || !runtimeApi || apiToOrigin(runtimeApi) === safeRuntimeBackendOrigin);
const safeRuntimeApi = runtimeApiIsFrontendOrigin || !runtimeApiMatchesRuntimeBackend ? "" : runtimeApi;
const queryBackendApi = queryBackend ? `${queryBackend}/api` : "";
const runtimeBackendApi = safeRuntimeBackendOrigin ? `${safeRuntimeBackendOrigin}/api` : "";
const BACKEND_ORIGIN = trim$1(
  queryBackend || apiToOrigin(queryApi) || safeRuntimeBackendOrigin || envBackendOrigin || safeStoredBackend || apiToOrigin(safeRuntimeApi || safeStoredApi) || inferredBackendOrigin || currentOrigin
);
const API_BASE = toApiBase(
  queryApi || queryBackendApi || safeRuntimeApi || runtimeBackendApi || envApi || safeStoredApi || (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${currentOrigin}/api`)
);
const CDN_BASE = trim$1(window.YAMSHAT_CDN_BASE || window.APP_CDN_BASE || envCdnBase || "");
const SOCKET_URL = trim$1(
  queryBackend || apiToOrigin(queryApi) || safeRuntimeBackendOrigin || envSocketUrl || window.YAMSHAT_SOCKET_URL || safeStoredBackend || BACKEND_ORIGIN || currentOrigin
);
try {
  const previousBackendOrigin = trim$1(localStorage.getItem("backendOrigin"));
  const backendOriginChanged = Boolean(previousBackendOrigin && previousBackendOrigin !== BACKEND_ORIGIN);
  if (backendOriginChanged) {
    localStorage.removeItem(CSRF_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  localStorage.setItem("backendOrigin", BACKEND_ORIGIN);
  localStorage.setItem("apiBase", API_BASE);
} catch {
}
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const JWT_PATTERN = /\b[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/g;
const SENSITIVE_KEYS = /* @__PURE__ */ new Set([
  "authorization",
  "token",
  "access_token",
  "refresh_token",
  "csrf_token",
  "password",
  "secret",
  "cookie",
  "set-cookie"
]);
function currentLevel() {
  const raw = String("info").toLowerCase();
  return LEVELS[raw] || LEVELS.info;
}
function canLog(level) {
  return LEVELS[level] >= currentLevel();
}
function redactString(value2) {
  return String(value2 || "").replace(JWT_PATTERN, "[REDACTED_JWT]");
}
function redactMeta(value2) {
  if (Array.isArray(value2)) return value2.map((item) => redactMeta(item));
  if (!value2 || typeof value2 !== "object") return typeof value2 === "string" ? redactString(value2) : value2;
  return Object.fromEntries(
    Object.entries(value2).map(([key, entry]) => {
      if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return [key, "[REDACTED]"];
      return [key, redactMeta(entry)];
    })
  );
}
function emit(level, message, meta = {}) {
  if (!canLog(level)) return;
  const safeMeta = redactMeta(meta);
  const safeMessage = redactString(message);
  const payload = {
    level,
    message: safeMessage,
    meta: safeMeta,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  const method = level === "debug" ? "debug" : level === "info" ? "info" : level === "warn" ? "warn" : "error";
  if (typeof console !== "undefined" && typeof console[method] === "function") {
    console[method](`[yamshat:${level}] ${safeMessage}`, safeMeta);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yamshat:log", { detail: payload }));
  }
}
const logger = {
  debug: (message, meta) => emit("debug", message, meta),
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta)
};
function getBackoffDelayMs(attempt = 0, options = {}) {
  const {
    baseDelayMs = 900,
    maxDelayMs = 3e4,
    jitterRatio = 0.35
  } = options;
  const safeAttempt = Math.max(0, Number(attempt) || 0);
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** safeAttempt);
  const jitterWindow = Math.max(0, Math.round(exponential * jitterRatio));
  const jitter = jitterWindow ? Math.round((Math.random() * 2 - 1) * jitterWindow) : 0;
  return Math.max(baseDelayMs, Math.min(maxDelayMs, exponential + jitter));
}
function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
const plainHttp = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "X-Yamshat-Client": "web"
  }
});
const listeners = /* @__PURE__ */ new Set();
const state = {
  refreshPromise: null,
  consecutiveFailures: 0,
  lastSuccessAt: 0,
  cooldownUntil: 0,
  circuitOpenUntil: 0,
  lastFailureReason: ""
};
function notify() {
  const snapshot = getRefreshState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
    }
  });
}
function createRefreshError(message, code = "REFRESH_BLOCKED", status = 0) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}
function currentTime() {
  return Date.now();
}
function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
function resetFailureState() {
  state.consecutiveFailures = 0;
  state.cooldownUntil = 0;
  state.circuitOpenUntil = 0;
  state.lastFailureReason = "";
}
function registerFailure(error) {
  state.consecutiveFailures += 1;
  state.lastFailureReason = error?.response?.data?.detail || error?.message || "refresh_failed";
  const cooldownDelay = getBackoffDelayMs(state.consecutiveFailures - 1, {
    baseDelayMs: 1200,
    maxDelayMs: 3e4,
    jitterRatio: 0.35
  });
  state.cooldownUntil = currentTime() + cooldownDelay;
  if (state.consecutiveFailures >= 3) {
    state.circuitOpenUntil = currentTime() + Math.max(15e3, cooldownDelay);
  }
}
function csrfHeaders() {
  const csrfToken = getCsrfToken();
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}
function normalizeAuthError(error) {
  if (!error.response) {
    return {
      message: "تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.",
      type: "NETWORK_ERROR",
      status: 0
    };
  }
  const status = error.response.status;
  const detail = error.response.data?.detail;
  let message = "حدث خطأ غير متوقع في المصادقة.";
  if (typeof detail === "string") message = detail;
  else if (detail?.message) message = detail.message;
  return {
    message,
    status,
    type: status >= 500 ? "SERVER_ERROR" : "CLIENT_ERROR",
    original: error
  };
}
function getRefreshState() {
  return {
    inFlight: Boolean(state.refreshPromise),
    consecutiveFailures: state.consecutiveFailures,
    cooldownUntil: state.cooldownUntil,
    circuitOpenUntil: state.circuitOpenUntil,
    lastSuccessAt: state.lastSuccessAt,
    lastFailureReason: state.lastFailureReason
  };
}
function subscribeToRefreshState(listener) {
  if (typeof listener !== "function") return () => {
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function shouldRefreshSoon(windowMs = 6e4) {
  const ttl = getSessionTtlMs();
  return ttl !== null && ttl <= windowMs;
}
function initMultiTabSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (event) => {
    if (event.key === "yamshat_auth_user" || event.key === "yamshat_session_active") {
      logger.info("Auth storage changed in another tab, syncing state...");
      if (!event.newValue) {
        window.location.reload();
      }
    }
  });
}
async function refreshSession(options = {}) {
  const { reason = "manual", force = false, retryCount = 0 } = options;
  if (state.refreshPromise) return state.refreshPromise;
  if (isOffline()) throw createRefreshError("لا يمكن التحديث أثناء عدم الاتصال بالإنترنت", "OFFLINE");
  const now = currentTime();
  if (!force && state.circuitOpenUntil > now) {
    throw createRefreshError("نظام الحماية مفعل حالياً، حاول مجدداً لاحقاً", "CIRCUIT_OPEN");
  }
  if (!force && state.cooldownUntil > now) {
    throw createRefreshError("يرجى الانتظار قليلاً قبل المحاولة مجدداً", "COOLDOWN_ACTIVE");
  }
  logger.info("refresh session requested", { reason, retryCount });
  state.refreshPromise = (async () => {
    try {
      const response = await plainHttp.post("/auth/refresh", {}, { headers: csrfHeaders() });
      mergeStoredUser(response.data);
      resetFailureState();
      state.lastSuccessAt = currentTime();
      return response;
    } catch (error) {
      const normalized = normalizeAuthError(error);
      if (retryCount < 2 && (normalized.type === "NETWORK_ERROR" || normalized.status >= 500)) {
        const delay = getBackoffDelayMs(retryCount);
        await sleep(delay);
        state.refreshPromise = null;
        return refreshSession({ ...options, retryCount: retryCount + 1, force: true });
      }
      registerFailure(error);
      const status = Number(error?.response?.status || 0);
      if ([400, 401, 403, 404].includes(status)) {
        clearStoredUser();
      }
      throw normalized;
    } finally {
      state.refreshPromise = null;
      notify();
    }
  })();
  notify();
  return state.refreshPromise;
}
const sessionManager = {
  refreshSession,
  shouldRefreshSoon,
  subscribeToRefreshState,
  getRefreshState,
  normalizeAuthError,
  initMultiTabSync
};
function toIsoDate(value2) {
  if (!value2) return null;
  try {
    return new Date(value2).toISOString();
  } catch {
    return null;
  }
}
function normalizeThread(rawThread = {}) {
  const timestamp = toIsoDate(rawThread.last_message_at || rawThread.created_at) || (/* @__PURE__ */ new Date()).toISOString();
  return {
    username: rawThread.username || rawThread.name || rawThread.peer || "",
    unread_count: Number(rawThread.unread_count || 0),
    last_message: rawThread.last_message || rawThread.message || "ابدأ المحادثة الآن",
    last_message_at: timestamp,
    presence: rawThread.presence || { is_online: false }
  };
}
function upsertThread(state2, peer, patch = {}) {
  const current = state2.threadsByUsername[peer] || normalizeThread({ username: peer });
  return {
    ...state2.threadsByUsername,
    [peer]: {
      ...current,
      ...patch,
      username: peer
    }
  };
}
const useChatStore = create$1((set, get) => ({
  threadsByUsername: {},
  conversationsByPeer: {},
  isSyncing: false,
  initialized: false,
  loadingThreads: false,
  activePeer: null,
  setLoadingThreads: (loadingThreads = false) => set({ loadingThreads: Boolean(loadingThreads) }),
  setActivePeer: (activePeer = null) => set({ activePeer }),
  hydrateThreads: (threads = [], options = {}) => set((state2) => {
    const replace = options?.replace !== false;
    const nextThreads = replace ? {} : { ...state2.threadsByUsername };
    (Array.isArray(threads) ? threads : []).forEach((thread) => {
      const normalized = normalizeThread(thread);
      if (!normalized.username) return;
      nextThreads[normalized.username] = {
        ...nextThreads[normalized.username] || {},
        ...normalized
      };
    });
    return {
      threadsByUsername: nextThreads,
      initialized: true
    };
  }),
  setThreads: (threads = []) => get().hydrateThreads(threads, { replace: true }),
  applyIncomingMessage: (message, currentUser, options = {}) => set((state2) => {
    const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
    if (!peer) return state2;
    const prevConversation = state2.conversationsByPeer[peer] || { messages: [], lastUpdate: null };
    const prevMessages = Array.isArray(prevConversation.messages) ? prevConversation.messages : [];
    const nextMessages = [...prevMessages, message].slice(-100);
    const shouldIncrementUnread = message?.sender !== currentUser && !options?.skipUnreadIncrement;
    const previousThread = state2.threadsByUsername[peer] || normalizeThread({ username: peer });
    return {
      conversationsByPeer: {
        ...state2.conversationsByPeer,
        [peer]: {
          ...prevConversation,
          messages: nextMessages,
          lastUpdate: Date.now()
        }
      },
      threadsByUsername: {
        ...state2.threadsByUsername,
        [peer]: {
          ...previousThread,
          username: peer,
          last_message: message?.body || message?.content || previousThread.last_message,
          last_message_at: toIsoDate(message?.created_at) || (/* @__PURE__ */ new Date()).toISOString(),
          unread_count: shouldIncrementUnread ? Number(previousThread.unread_count || 0) + 1 : Number(previousThread.unread_count || 0)
        }
      },
      initialized: true
    };
  }),
  updateMessageStatus: (peer, messageIds = [], status = "sent") => set((state2) => {
    if (!peer || !state2.conversationsByPeer[peer]) return state2;
    const ids = new Set((Array.isArray(messageIds) ? messageIds : []).map(String));
    if (!ids.size) return state2;
    return {
      conversationsByPeer: {
        ...state2.conversationsByPeer,
        [peer]: {
          ...state2.conversationsByPeer[peer],
          messages: (state2.conversationsByPeer[peer].messages || []).map((message) => {
            const messageId = message?.id ?? message?.message_id;
            if (!ids.has(String(messageId))) return message;
            return { ...message, status };
          })
        }
      }
    };
  }),
  setPresence: (peer, presence = {}) => set((state2) => ({
    threadsByUsername: upsertThread(state2, peer, {
      presence: {
        ...state2.threadsByUsername[peer]?.presence || {},
        ...presence || {}
      }
    })
  })),
  markThreadRead: (peer) => set((state2) => ({
    threadsByUsername: upsertThread(state2, peer, { unread_count: 0 })
  })),
  invalidateCache: () => set({
    threadsByUsername: {},
    conversationsByPeer: {},
    initialized: false,
    activePeer: null
  }),
  syncOfflineMessages: async () => {
    set({ isSyncing: true });
    set({ isSyncing: false });
  }
}));
const selectUnreadTotal = (state2) => Object.values(state2?.threadsByUsername || {}).reduce(
  (total, thread) => total + Number(thread?.unread_count || 0),
  0
);
const THEME_KEY = "yamshat-theme";
const LANGUAGE_KEY = "yamshat-language";
const TRANSLATION_KEY = "yamshat-chat-translation";
const QUEUE_KEY$1 = "yamshat-offline-queue";
const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_KEY) || "dark";
};
const getInitialLanguage = () => {
  if (typeof window === "undefined") return "ar";
  return window.localStorage.getItem(LANGUAGE_KEY) || "ar";
};
const getInitialTranslationSetting = () => {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(TRANSLATION_KEY);
  if (raw === null) return true;
  return raw === "1";
};
const loadQueuedActions = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY$1);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const persistQueuedActions = (actions) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY$1, JSON.stringify(actions));
  } catch {
  }
};
const useAppStore = create$1((set, get) => ({
  session: null,
  authHydrated: false,
  authLoading: false,
  isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
  isReconnecting: false,
  lastOfflineAt: null,
  activeRequests: 0,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  chatTranslationEnabled: getInitialTranslationSetting(),
  installPrompt: null,
  uploadProgress: {},
  queuedActions: loadQueuedActions(),
  setSession: (session) => set({ session, authHydrated: true }),
  clearSession: () => set({ session: null, authHydrated: true }),
  setAuthHydrated: (authHydrated = true) => set({ authHydrated: Boolean(authHydrated) }),
  setAuthLoading: (authLoading = false) => set({ authLoading: Boolean(authLoading) }),
  setOnlineStatus: (isOnline) => {
    const wasOffline = !get().isOnline;
    set({
      isOnline,
      lastOfflineAt: isOnline ? null : (/* @__PURE__ */ new Date()).toISOString()
    });
    if (wasOffline && isOnline) {
      get().recoverSession();
    }
  },
  recoverSession: async () => {
    if (get().isReconnecting) return;
    set({ isReconnecting: true });
    try {
      console.log("[AppStore] Connection restored, attempting session recovery...");
      await sessionManager.refreshSession({ reason: "reconnect" });
    } catch (err) {
      console.warn("[AppStore] Session recovery failed after reconnect.");
    } finally {
      set({ isReconnecting: false });
    }
  },
  syncFromStorage: (userData) => {
    if (JSON.stringify(userData) !== JSON.stringify(get().session)) {
      set({ session: userData, authHydrated: true });
    }
  },
  startRequest: () => set((state2) => ({ activeRequests: state2.activeRequests + 1 })),
  finishRequest: () => set((state2) => ({ activeRequests: Math.max(0, state2.activeRequests - 1) })),
  setTheme: (theme) => {
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark";
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, nextTheme);
    set({ theme: nextTheme });
  },
  setLanguage: (language) => {
    const nextLanguage = language === "en" ? "en" : "ar";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
      document.documentElement.setAttribute("lang", nextLanguage);
      document.documentElement.setAttribute("dir", nextLanguage === "ar" ? "rtl" : "ltr");
    }
    set({ language: nextLanguage });
  },
  setChatTranslationEnabled: (enabled) => {
    if (typeof window !== "undefined") window.localStorage.setItem(TRANSLATION_KEY, enabled ? "1" : "0");
    set({ chatTranslationEnabled: Boolean(enabled) });
  },
  setInstallPrompt: (installPrompt) => set({ installPrompt }),
  clearInstallPrompt: () => set({ installPrompt: null }),
  setUploadProgress: (key, value2) => set((state2) => ({ uploadProgress: { ...state2.uploadProgress, [key]: value2 } })),
  clearUploadProgress: (key) => set((state2) => {
    const next = { ...state2.uploadProgress };
    delete next[key];
    return { uploadProgress: next };
  }),
  queueAction: (action) => set((state2) => {
    const next = [
      ...state2.queuedActions,
      {
        id: action?.id || `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: action?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        attempts: Number(action?.attempts || 0),
        lastAttemptAt: action?.lastAttemptAt || null,
        nextRetryAt: action?.nextRetryAt || null,
        ...action
      }
    ];
    persistQueuedActions(next);
    return { queuedActions: next };
  }),
  dequeueAction: (actionId) => set((state2) => {
    const next = state2.queuedActions.filter((item) => item.id !== actionId);
    persistQueuedActions(next);
    return { queuedActions: next };
  }),
  updateQueuedAction: (actionId, patch) => set((state2) => {
    const next = state2.queuedActions.map((item) => item.id === actionId ? { ...item, ...patch || {} } : item);
    persistQueuedActions(next);
    return { queuedActions: next };
  }),
  replaceQueuedActions: (actions) => {
    const safe = Array.isArray(actions) ? actions : [];
    persistQueuedActions(safe);
    set({ queuedActions: safe });
  },
  flushQueue: () => {
    persistQueuedActions([]);
    set({ queuedActions: [] });
  }
}));
if (typeof window !== "undefined") {
  window.addEventListener("online", () => useAppStore.getState().setOnlineStatus(true));
  window.addEventListener("offline", () => useAppStore.getState().setOnlineStatus(false));
  window.addEventListener("storage", (event) => {
    if (["yamshat_user_session", "yamshatAuth", "user"].includes(event.key)) {
      try {
        const userData = event.newValue ? JSON.parse(event.newValue) : null;
        useAppStore.getState().syncFromStorage(userData);
      } catch (e2) {
      }
    }
  });
}
const STORAGE_KEY$1 = "yamshat_user_session";
const EXPIRY_LEEWAY_SECONDS = 30;
function normalizeUserShape(user) {
  if (!user || typeof user !== "object") return null;
  const token = user.token || user.access_token || user?.profile?.token || "";
  const username = user.username || user.user || user?.profile?.username || "";
  const role = user.role || user?.profile?.role || "user";
  const permissions = Array.isArray(user.permissions) ? user.permissions : Array.isArray(user?.profile?.permissions) ? user.profile.permissions : [];
  const csrf_token = user.csrf_token || user?.profile?.csrf_token || "";
  const remember_me = Boolean(user.remember_me ?? user?.profile?.remember_me ?? true);
  const session_id = user.session_id || user?.profile?.session_id || "";
  return {
    ...user,
    token,
    access_token: token || user.access_token || "",
    refresh_token: "",
    username,
    user: username,
    role,
    permissions,
    csrf_token,
    remember_me,
    session_id,
    email_verified: Boolean(user.email_verified ?? user?.profile?.email_verified),
    profile: user.profile || null
  };
}
function decodeJwtPayload$1(token) {
  if (!token || typeof token !== "string" || token.split(".").length < 2) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = typeof window !== "undefined" && typeof window.atob === "function" ? window.atob(normalized) : Buffer.from(normalized, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
function syncStore(user) {
  const state2 = useAppStore.getState();
  if (user) state2.setSession?.(user);
  else state2.clearSession?.();
}
function readStoredSession() {
  try {
    const raw = secureGet(STORAGE_KEY$1) || secureGet("yamshatAuth") || secureGet("user");
    return normalizeUserShape(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}
function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload$1(token);
  if (!payload?.exp) return null;
  const exp = Number(payload.exp);
  return Number.isFinite(exp) ? exp * 1e3 : null;
}
function isTokenExpired(token, leewaySeconds = EXPIRY_LEEWAY_SECONDS) {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return false;
  return expiryMs <= Date.now() + leewaySeconds * 1e3;
}
function getStoredUser() {
  const parsed = readStoredSession();
  syncStore(parsed);
  return parsed;
}
function getStoredUserSnapshot() {
  return readStoredSession();
}
function hasStoredSession() {
  const user = readStoredSession();
  return Boolean(user?.id || user?.username || user?.user || user?.email);
}
function setStoredUser(user) {
  const normalized = normalizeUserShape(user);
  if (!normalized) {
    secureRemove(STORAGE_KEY$1);
    clearCsrfToken();
    syncStore(null);
    return;
  }
  const raw = JSON.stringify(normalized);
  secureSet(STORAGE_KEY$1, raw, { persist: Boolean(normalized.remember_me) });
  secureSet("yamshatAuth", raw, { persist: Boolean(normalized.remember_me) });
  secureSet("user", raw, { persist: Boolean(normalized.remember_me) });
  setCsrfToken(normalized.csrf_token || "");
  syncStore(normalized);
}
function mergeStoredUser(nextValues) {
  const current = readStoredSession() || {};
  const merged = {
    ...current,
    ...nextValues,
    remember_me: Boolean(nextValues?.remember_me ?? current?.remember_me ?? true),
    refresh_token: "",
    profile: {
      ...current.profile || {},
      ...nextValues?.profile || {}
    }
  };
  setStoredUser(merged);
}
function clearStoredUser() {
  secureRemove(STORAGE_KEY$1);
  secureRemove("yamshatAuth");
  secureRemove("user");
  clearCsrfToken();
  syncStore(null);
}
function getAuthToken() {
  const user = readStoredSession();
  const token = user?.token || user?.access_token || "";
  if (!token || isTokenExpired(token)) return "";
  return token;
}
function getCurrentUsername() {
  const user = readStoredSession();
  return user?.user || user?.username || "";
}
function getSessionTtlMs() {
  const user = readStoredSession();
  const token = user?.token || user?.access_token || "";
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return null;
  return Math.max(expiryMs - Date.now(), 0);
}
function shouldRefreshSessionSoon(windowMs = 6e4) {
  const ttl = getSessionTtlMs();
  return ttl !== null && ttl <= windowMs;
}
function hasPermission(permission) {
  const user = readStoredSession();
  if (!user) return false;
  if (isPrimaryAdminSession(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
function ProtectedRoute({ children, requiredPermission = "" }) {
  const location2 = useLocation();
  const user = useAppStore((state2) => state2.session);
  const authHydrated = useAppStore((state2) => state2.authHydrated);
  const authLoading = useAppStore((state2) => state2.authLoading);
  if (!authHydrated || authLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PageLoader, { label: "جارٍ التحقق من الجلسة..." });
  }
  if (!user?.username && !user?.user && !user?.email) {
    const loginPath = location2.pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: loginPath, state: { from: location2 }, replace: true });
  }
  if (location2.pathname.startsWith("/admin") && !isPrimaryAdminSession(user)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/admin/login", state: { from: location2 }, replace: true });
  }
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
  }
  return children;
}
const ToastContext = reactExports.createContext({ pushToast: () => {
} });
function normalizeToast(toast = {}) {
  const title = toast.title || toast.message || toast.label || (toast.type === "error" ? "حدث خطأ" : toast.type === "success" ? "تم بنجاح" : "تنبيه");
  const description = toast.description || (toast.title && toast.message && toast.title !== toast.message ? toast.message : "") || "";
  return {
    id: toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: toast.type || "info",
    title,
    description,
    duration: Number(toast.duration || 4200),
    actionLabel: toast.actionLabel || "",
    onAction: typeof toast.onAction === "function" ? toast.onAction : null
  };
}
function ToastProvider({ children }) {
  const [toasts, setToasts] = reactExports.useState([]);
  const dismissToast = reactExports.useCallback((toastId) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);
  const pushToast = reactExports.useCallback((toast) => {
    const nextToast = normalizeToast(toast);
    setToasts((prev) => [...prev.filter((item) => item.title !== nextToast.title || item.description !== nextToast.description), nextToast].slice(-4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== nextToast.id));
    }, nextToast.duration);
  }, []);
  reactExports.useEffect(() => {
    const handleToast = (event) => pushToast(event.detail || {});
    window.addEventListener("yamshat:toast", handleToast);
    return () => window.removeEventListener("yamshat:toast", handleToast);
  }, [pushToast]);
  const value2 = reactExports.useMemo(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastContext.Provider, { value: value2, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toast-stack", "aria-live": "polite", "aria-atomic": "true", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `toast toast-${toast.type}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "toast-head-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: toast.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "toast-close-btn", onClick: () => dismissToast(toast.id), "aria-label": "إغلاق الإشعار", children: "×" })
      ] }),
      toast.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: toast.description }) : null,
      toast.actionLabel ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "toast-action-btn",
          onClick: () => {
            toast.onAction?.();
            dismissToast(toast.id);
          },
          children: toast.actionLabel
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toast-progress", style: { animationDuration: `${toast.duration}ms` } })
    ] }, toast.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .toast-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .toast-close-btn,
        .toast-action-btn {
          border: none;
          cursor: pointer;
          font: inherit;
        }
        .toast-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: inherit;
        }
        .toast-action-btn {
          justify-self: start;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(59,130,246,0.14);
          color: #bfdbfe;
          font-weight: 700;
        }
        .toast {
          overflow: hidden;
          position: relative;
        }
        .toast-progress {
          position: absolute;
          inset-inline-start: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          transform-origin: left;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee);
          animation-name: toast-progress-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes toast-progress-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      ` })
  ] });
}
function useToast() {
  return reactExports.useContext(ToastContext);
}
function formatRemaining(ms) {
  const minutes = Math.max(Math.ceil(ms / 6e4), 1);
  return `${minutes} دقيقة`;
}
function AppStatusBanner() {
  const isOnline = useAppStore((state2) => state2.isOnline);
  const queuedActions = useAppStore((state2) => state2.queuedActions);
  const ttl = getSessionTtlMs();
  const [syncNote, setSyncNote] = reactExports.useState("");
  reactExports.useEffect(() => {
    const handleSent = () => setSyncNote("تمت مزامنة عنصر مؤجل بنجاح.");
    const handleFailed = () => setSyncNote("بعض العناصر ما زالت بانتظار المحاولة.");
    window.addEventListener("yamshat:queued-message-sent", handleSent);
    window.addEventListener("yamshat:queued-message-failed", handleFailed);
    return () => {
      window.removeEventListener("yamshat:queued-message-sent", handleSent);
      window.removeEventListener("yamshat:queued-message-failed", handleFailed);
    };
  }, []);
  const banner = reactExports.useMemo(() => {
    if (!isOnline) {
      return {
        type: "warning",
        text: queuedActions.length ? `أنت بدون إنترنت حالياً. لدينا ${queuedActions.length} إجراء محفوظ وسيتم إرساله تلقائياً عند عودة الشبكة.` : "أنت بدون إنترنت حالياً. سيتم استكمال المزامنة تلقائياً بعد رجوع الشبكة."
      };
    }
    if (queuedActions.length > 0) {
      return {
        type: "info",
        text: `تجري مزامنة ${queuedActions.length} إجراء مؤجل الآن.${syncNote ? ` ${syncNote}` : ""}`
      };
    }
    if (ttl !== null && ttl > 0 && ttl <= 5 * 60 * 1e3) {
      return {
        type: "info",
        text: `تنبيه الجلسة: ستنتهي خلال ${formatRemaining(ttl)} ما لم يتم التجديد تلقائياً.`
      };
    }
    return null;
  }, [isOnline, queuedActions.length, syncNote, ttl]);
  if (!banner) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `app-status-banner slim ${banner.type}`, dir: "rtl", children: [
    banner.text,
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .app-status-banner.slim {
          position: sticky;
          top: 0;
          z-index: 45;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .app-status-banner.slim.info {
          background: rgba(15, 23, 42, 0.88);
          color: #cbd5e1;
        }

        .app-status-banner.slim.warning {
          background: rgba(120, 53, 15, 0.88);
          color: #ffedd5;
        }
      ` })
  ] });
}
function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function triggerHapticFeedback(type = "light") {
  if (navigator.vibrate) {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(30);
        break;
      default:
        navigator.vibrate(10);
    }
  }
}
function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  className = "",
  disabled = false,
  loading = false,
  preventRepeat = true,
  cooldownMs = 500,
  hapticFeedback = true,
  icon = null,
  fullWidth = false,
  onClick,
  ...props
}) {
  const [internalBusy, setInternalBusy] = reactExports.useState(false);
  const mountedRef = reactExports.useRef(true);
  const busy = loading || internalBusy;
  const locked = disabled || busy;
  reactExports.useEffect(() => () => {
    mountedRef.current = false;
  }, []);
  const handleClick = async (event) => {
    if (!onClick) return;
    if (locked) {
      event.preventDefault();
      return;
    }
    if (hapticFeedback) {
      triggerHapticFeedback("light");
    }
    if (!preventRepeat) {
      onClick(event);
      return;
    }
    setInternalBusy(true);
    try {
      await Promise.resolve(onClick(event));
      if (cooldownMs > 0) await wait(cooldownMs);
    } finally {
      if (mountedRef.current) setInternalBusy(false);
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick(event);
    }
  };
  const buttonClasses = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    busy ? "is-busy" : "",
    locked ? "is-disabled" : "",
    fullWidth ? "is-full-width" : "",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type,
        disabled: locked,
        "aria-busy": busy,
        "data-busy": busy ? "true" : "false",
        className: buttonClasses,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        ...props,
        children: [
          icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: icon }),
          busy && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-spinner", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-label", children })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: `
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
          }

          /* Size variants */
          .btn-small {
            padding: 6px 12px;
            font-size: 0.875rem;
          }

          .btn-medium {
            padding: 10px 16px;
            font-size: 1rem;
          }

          .btn-large {
            padding: 14px 24px;
            font-size: 1.125rem;
          }

          /* Color variants */
          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.4);
            transform: translateY(-2px);
          }

          .btn-primary:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: 0 2px 4px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-primary:focus:not(:disabled) {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 6px -1px rgba(59, 130, 246, 0.3);
          }

          .btn-secondary {
            background: #e5e7eb;
            color: #111827;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }

          .btn-secondary:hover:not(:disabled) {
            background: #d1d5db;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }

          .btn-secondary:active:not(:disabled) {
            transform: translateY(0);
          }

          .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
          }

          .btn-success:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            box-shadow: 0 6px 12px -1px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
          }

          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
          }

          .btn-danger:hover:not(:disabled) {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 6px 12px -1px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }

          .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
          }

          .btn-warning:hover:not(:disabled) {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            box-shadow: 0 6px 12px -1px rgba(245, 158, 11, 0.4);
            transform: translateY(-2px);
          }

          /* Full width */
          .btn.is-full-width {
            width: 100%;
          }

          /* Loading state */
          .btn.is-busy {
            opacity: 0.8;
          }

          .btn-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          .btn-small .btn-spinner {
            width: 12px;
            height: 12px;
            border-width: 2px;
          }

          .btn-large .btn-spinner {
            width: 20px;
            height: 20px;
            border-width: 2px;
          }

          /* Icon */
          .btn-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          /* Disabled state */
          .btn:disabled,
          .btn.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Focus visible for accessibility */
          .btn:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* Ripple effect on click */
          .btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            pointer-events: none;
          }

          .btn:active:not(:disabled)::after {
            animation: ripple 0.6s ease-out;
          }

          @keyframes ripple {
            to {
              width: 300px;
              height: 300px;
              opacity: 0;
            }
          }
        `
        }
      }
    )
  ] });
}
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    __publicField(this, "handleReload", () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("last_chunk_error_reload");
        window.location.reload();
      }
    });
    this.state = { hasError: false, message: "", isChunkError: false };
  }
  static getDerivedStateFromError(error) {
    const isChunkError = error?.message?.includes("Failed to fetch dynamically imported module") || error?.name === "ChunkLoadError" || error?.message?.includes("Loading chunk");
    return {
      hasError: true,
      message: error?.message || "حدث خطأ غير متوقع.",
      isChunkError
    };
  }
  componentDidCatch(error, errorInfo) {
    logger.error("app error boundary caught an error", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack
    });
    if (this.state.isChunkError) {
      const lastReload = sessionStorage.getItem("last_chunk_error_reload");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 1e4) {
        sessionStorage.setItem("last_chunk_error_reload", now.toString());
        logger.info("Chunk load error detected, attempting auto-reload...");
        setTimeout(() => {
          window.location.reload();
        }, 1e3);
      }
    }
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "page-loader-shell", style: { minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "empty-state", style: { maxWidth: 560, textAlign: "center", color: "#fff" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-icon", style: { fontSize: "48px", marginBottom: "16px" }, children: "⚠️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { fontSize: "24px", marginBottom: "12px" }, children: this.state.isChunkError ? "تحديث مطلوب للتطبيق" : "حصل خطأ غير متوقع" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { opacity: 0.8, marginBottom: "24px" }, children: this.state.isChunkError ? "نواجه مشكلة في تحميل بعض أجزاء التطبيق، قد يكون ذلك بسبب تحديث جديد. يرجى إعادة تحميل الصفحة." : this.state.message || "تم إيقاف الجزء المتأثر لحماية الجلسة والبيانات." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: this.handleReload, variant: "primary", children: "إعادة تحميل التطبيق" })
    ] }) });
  }
}
function InstallPrompt() {
  const installPrompt = useAppStore((state2) => state2.installPrompt);
  const clearInstallPrompt = useAppStore((state2) => state2.clearInstallPrompt);
  if (!installPrompt) return null;
  const handleInstall = async () => {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    clearInstallPrompt();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "install-banner slim-install-banner", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "slim-install-copy", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "تثبيت التطبيق" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "نسخة PWA أسرع وأخف مع إشعارات أفضل عند ضعف الشبكة." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "slim-install-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "slim-install-btn primary", onClick: handleInstall, children: "تثبيت الآن" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "slim-install-btn", onClick: clearInstallPrompt, children: "لاحقاً" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .slim-install-banner {
          position: sticky;
          top: 58px;
          z-index: 35;
          margin: 6px auto 0;
          width: min(1100px, calc(100% - 20px));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 16px;
          background: rgba(11, 18, 32, 0.9);
          border: 1px solid rgba(167,139,250,0.16);
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 28px rgba(2, 6, 23, 0.18);
        }

        .slim-install-copy {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          color: #e2e8f0;
          font-size: 13px;
          flex-wrap: wrap;
        }

        .slim-install-copy strong {
          color: #fff;
          flex-shrink: 0;
        }

        .slim-install-copy span {
          color: #94a3b8;
        }

        .slim-install-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .slim-install-btn {
          min-height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #fff;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .slim-install-btn.primary {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border-color: transparent;
        }

        @media (max-width: 768px) {
          .slim-install-banner {
            top: 54px;
            width: calc(100% - 16px);
            padding: 8px 10px;
            flex-wrap: wrap;
          }

          .slim-install-copy {
            font-size: 12px;
          }
        }
      ` })
  ] });
}
function OfflineExperience() {
  const isOnline = useAppStore((state2) => state2.isOnline);
  const queuedActions = useAppStore((state2) => state2.queuedActions);
  const [syncMessage, setSyncMessage] = reactExports.useState("جاهز");
  reactExports.useEffect(() => {
    const handleSent = () => setSyncMessage("تمت مزامنة عنصر من الطابور");
    const handleFailed = () => setSyncMessage("لا يزال هناك عناصر بانتظار الإرسال");
    window.addEventListener("yamshat:queued-message-sent", handleSent);
    window.addEventListener("yamshat:queued-message-failed", handleFailed);
    return () => {
      window.removeEventListener("yamshat:queued-message-sent", handleSent);
      window.removeEventListener("yamshat:queued-message-failed", handleFailed);
    };
  }, []);
  if (isOnline && queuedActions.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "offline-experience-shell card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 6 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: isOnline ? "Background sync يعمل" : "وضع عدم الاتصال مفعّل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", children: isOnline ? `يوجد ${queuedActions.length} عنصر بانتظار المزامنة. ${syncMessage}` : "يمكنك متابعة التصفح، وسنرسل الرسائل والطلبات المؤجلة عند رجوع الشبكة." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "offline-actions-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "offline-quick-link", children: "الصفحة الرئيسية" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/notifications", className: "offline-quick-link", children: "الإشعارات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/inbox", className: "offline-quick-link", children: "الرسائل" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .offline-experience-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin: 12px 16px 0;
          border: 1px solid rgba(245,158,11,0.22);
          background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95));
        }
        .offline-actions-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .offline-quick-link {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
      ` })
  ] });
}
function SkeletonBlock({ className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `skeleton-block ${className}`.trim(), "aria-hidden": "true" });
}
function FeedSkeleton({ count = 3 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "feed-stack", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card post-card skeleton-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "post-head", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-row compact-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-avatar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-meta", style: { minWidth: 180 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line tiny" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-media" })
  ] }, index)) });
}
function ListSkeleton({ count = 6 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-grid", children: Array.from({ length: count }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card user-row skeleton-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-avatar" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "user-meta", style: { minWidth: 180 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line tiny" })
    ] })
  ] }, index)) });
}
function TableSkeleton({ rows = 6, columns = 6 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "table-skeleton-card card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-skeleton-head", children: Array.from({ length: columns }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line table-head-cell" }, `head-${index}`)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-skeleton-body", children: Array.from({ length: rows }).map((_, rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-skeleton-row", children: Array.from({ length: columns }).map((__, cellIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line table-cell" }, `cell-${rowIndex}-${cellIndex}`)) }, `row-${rowIndex}`)) })
  ] });
}
function DashboardSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-state-stack", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stats-skeleton-grid", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-title-md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-media short-media" })
    ] }, index)) })
  ] });
}
function AdminOverviewSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-state-stack", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" })
    ] }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stats-skeleton-grid", children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "list-grid two-column-grid-skeleton", children: Array.from({ length: 2 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-title-md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-media short-media" })
    ] }, index)) })
  ] });
}
function RoutePageSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-state-stack route-page-skeleton", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card skeleton-hero-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-pill" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-title-xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line long" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line medium" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stats-skeleton-grid", children: Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card skeleton-card stat-skeleton-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line tiny" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-value" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonBlock, { className: "skeleton-line short" })
    ] }, index)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeedSkeleton, { count: 2 })
  ] });
}
function useNetworkStatus() {
  const [isOnline, setIsOnline] = reactExports.useState(navigator.onLine);
  reactExports.useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  return isOnline;
}
function normalizeHashPath(value2 = "") {
  const raw = String(value2 || "").replace(/^#/, "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}
function splitPath(value2 = "") {
  const normalized = normalizeHashPath(value2);
  const [pathAndSearch, hash = ""] = normalized.split("#");
  const [pathname = "/", search = ""] = pathAndSearch.split("?");
  return {
    pathname: pathname || "/",
    search: search ? `?${search}` : "",
    hash: hash ? `#${hash}` : ""
  };
}
function getCurrentAppLocation() {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "", hash: "" };
  }
  if (window.location.hash) {
    return splitPath(window.location.hash);
  }
  return {
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || ""
  };
}
function getCurrentAppPathname() {
  return getCurrentAppLocation().pathname;
}
function buildAppUrl(target = "/") {
  if (typeof window === "undefined") return String(target || "/");
  const { pathname, search, hash } = splitPath(target);
  return `${window.location.origin}/#${pathname}${search}${hash}`;
}
function redirectToAppPath(target = "/", { replace = true } = {}) {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = splitPath(target);
  const current = getCurrentAppLocation();
  if (current.pathname === pathname && current.search === search && current.hash === hash) {
    return;
  }
  const nextUrl = buildAppUrl(`${pathname}${search}${hash}`);
  if (replace && typeof window.location.replace === "function") {
    window.location.replace(nextUrl);
    return;
  }
  window.location.assign(nextUrl);
}
const DEFAULT_TIMEOUT_MS = 2e4;
const RETRYABLE_STATUSES = /* @__PURE__ */ new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const cache$1 = /* @__PURE__ */ new Map();
const CACHE_TTL = 5 * 60 * 1e3;
function getCacheOptions(config = {}) {
  const useCache = Boolean(config.useCache ?? config.cache);
  const forceRefresh = Boolean(config.forceRefresh);
  const cacheTtlMs = Number(config.cacheTtlMs) > 0 ? Number(config.cacheTtlMs) : CACHE_TTL;
  const cacheKey = `${config.baseURL || ""}${config.url}${JSON.stringify(config.params || {})}`;
  return { useCache, forceRefresh, cacheTtlMs, cacheKey };
}
const API = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true
});
API.interceptors.request.use(async (config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  const { useCache, forceRefresh, cacheTtlMs, cacheKey } = getCacheOptions(config);
  config.metadata = { ...config.metadata || {}, cacheKey, cacheTtlMs, useCache };
  if (config.method === "get" && useCache && !forceRefresh) {
    const cachedResponse = cache$1.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTtlMs) {
      config.adapter = () => Promise.resolve({
        data: cachedResponse.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {}
      });
    }
  }
  return config;
});
API.interceptors.response.use(
  (response) => {
    const { cacheKey, useCache } = response.config.metadata || {};
    if (response.config.method === "get" && useCache && cacheKey) {
      cache$1.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && config && !config._retry) {
      config._retry = true;
      try {
        const { data } = await sessionManager.refreshSession();
        const newToken = data.access_token;
        config.headers.Authorization = `Bearer ${newToken}`;
        return API(config);
      } catch (refreshError) {
        clearStoredUser();
        redirectToAppPath("/login");
        return Promise.reject(refreshError);
      }
    }
    const retryCount = config?._retryCount || 0;
    if (config && RETRYABLE_STATUSES.has(response?.status) && retryCount < 3) {
      config._retryCount = retryCount + 1;
      const delay = Math.pow(2, retryCount) * 1e3 + Math.random() * 1e3;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return API(config);
    }
    return Promise.reject(error);
  }
);
function _mergeNamespaces$1(e2, t2) {
  return t2.forEach((function(t3) {
    t3 && "string" != typeof t3 && !Array.isArray(t3) && Object.keys(t3).forEach((function(r2) {
      if ("default" !== r2 && !(r2 in e2)) {
        var i2 = Object.getOwnPropertyDescriptor(t3, r2);
        Object.defineProperty(e2, r2, i2.get ? i2 : { enumerable: true, get: function() {
          return t3[r2];
        } });
      }
    }));
  })), Object.freeze(e2);
}
function copyExifWithoutOrientation(e2, t2) {
  return new Promise((function(r2, i2) {
    let o2;
    return getApp1Segment(e2).then((function(e3) {
      try {
        return o2 = e3, r2(new Blob([t2.slice(0, 2), o2, t2.slice(2)], { type: "image/jpeg" }));
      } catch (e4) {
        return i2(e4);
      }
    }), i2);
  }));
}
const getApp1Segment = (e2) => new Promise(((t2, r2) => {
  const i2 = new FileReader();
  i2.addEventListener("load", (({ target: { result: e3 } }) => {
    const i3 = new DataView(e3);
    let o2 = 0;
    if (65496 !== i3.getUint16(o2)) return r2("not a valid JPEG");
    for (o2 += 2; ; ) {
      const a2 = i3.getUint16(o2);
      if (65498 === a2) break;
      const s2 = i3.getUint16(o2 + 2);
      if (65505 === a2 && 1165519206 === i3.getUint32(o2 + 4)) {
        const a3 = o2 + 10;
        let f2;
        switch (i3.getUint16(a3)) {
          case 18761:
            f2 = true;
            break;
          case 19789:
            f2 = false;
            break;
          default:
            return r2("TIFF header contains invalid endian");
        }
        if (42 !== i3.getUint16(a3 + 2, f2)) return r2("TIFF header contains invalid version");
        const l2 = i3.getUint32(a3 + 4, f2), c2 = a3 + l2 + 2 + 12 * i3.getUint16(a3 + l2, f2);
        for (let e4 = a3 + l2 + 2; e4 < c2; e4 += 12) {
          if (274 == i3.getUint16(e4, f2)) {
            if (3 !== i3.getUint16(e4 + 2, f2)) return r2("Orientation data type is invalid");
            if (1 !== i3.getUint32(e4 + 4, f2)) return r2("Orientation data count is invalid");
            i3.setUint16(e4 + 8, 1, f2);
            break;
          }
        }
        return t2(e3.slice(o2, o2 + 2 + s2));
      }
      o2 += 2 + s2;
    }
    return t2(new Blob());
  })), i2.readAsArrayBuffer(e2);
}));
var e = {}, t = { get exports() {
  return e;
}, set exports(t2) {
  e = t2;
} };
!(function(e2) {
  var r2, i2, UZIP2 = {};
  t.exports = UZIP2, UZIP2.parse = function(e3, t2) {
    for (var r3 = UZIP2.bin.readUshort, i3 = UZIP2.bin.readUint, o2 = 0, a2 = {}, s2 = new Uint8Array(e3), f2 = s2.length - 4; 101010256 != i3(s2, f2); ) f2--;
    o2 = f2;
    o2 += 4;
    var l2 = r3(s2, o2 += 4);
    r3(s2, o2 += 2);
    var c2 = i3(s2, o2 += 2), u = i3(s2, o2 += 4);
    o2 += 4, o2 = u;
    for (var h = 0; h < l2; h++) {
      i3(s2, o2), o2 += 4, o2 += 4, o2 += 4, i3(s2, o2 += 4);
      c2 = i3(s2, o2 += 4);
      var d = i3(s2, o2 += 4), A = r3(s2, o2 += 4), g = r3(s2, o2 + 2), p = r3(s2, o2 + 4);
      o2 += 6;
      var m = i3(s2, o2 += 8);
      o2 += 4, o2 += A + g + p, UZIP2._readLocal(s2, m, a2, c2, d, t2);
    }
    return a2;
  }, UZIP2._readLocal = function(e3, t2, r3, i3, o2, a2) {
    var s2 = UZIP2.bin.readUshort, f2 = UZIP2.bin.readUint;
    f2(e3, t2), s2(e3, t2 += 4), s2(e3, t2 += 2);
    var l2 = s2(e3, t2 += 2);
    f2(e3, t2 += 2), f2(e3, t2 += 4), t2 += 4;
    var c2 = s2(e3, t2 += 8), u = s2(e3, t2 += 2);
    t2 += 2;
    var h = UZIP2.bin.readUTF8(e3, t2, c2);
    if (t2 += c2, t2 += u, a2) r3[h] = { size: o2, csize: i3 };
    else {
      var d = new Uint8Array(e3.buffer, t2);
      if (0 == l2) r3[h] = new Uint8Array(d.buffer.slice(t2, t2 + i3));
      else {
        if (8 != l2) throw "unknown compression method: " + l2;
        var A = new Uint8Array(o2);
        UZIP2.inflateRaw(d, A), r3[h] = A;
      }
    }
  }, UZIP2.inflateRaw = function(e3, t2) {
    return UZIP2.F.inflate(e3, t2);
  }, UZIP2.inflate = function(e3, t2) {
    return e3[0], e3[1], UZIP2.inflateRaw(new Uint8Array(e3.buffer, e3.byteOffset + 2, e3.length - 6), t2);
  }, UZIP2.deflate = function(e3, t2) {
    null == t2 && (t2 = { level: 6 });
    var r3 = 0, i3 = new Uint8Array(50 + Math.floor(1.1 * e3.length));
    i3[r3] = 120, i3[r3 + 1] = 156, r3 += 2, r3 = UZIP2.F.deflateRaw(e3, i3, r3, t2.level);
    var o2 = UZIP2.adler(e3, 0, e3.length);
    return i3[r3 + 0] = o2 >>> 24 & 255, i3[r3 + 1] = o2 >>> 16 & 255, i3[r3 + 2] = o2 >>> 8 & 255, i3[r3 + 3] = o2 >>> 0 & 255, new Uint8Array(i3.buffer, 0, r3 + 4);
  }, UZIP2.deflateRaw = function(e3, t2) {
    null == t2 && (t2 = { level: 6 });
    var r3 = new Uint8Array(50 + Math.floor(1.1 * e3.length)), i3 = UZIP2.F.deflateRaw(e3, r3, i3, t2.level);
    return new Uint8Array(r3.buffer, 0, i3);
  }, UZIP2.encode = function(e3, t2) {
    null == t2 && (t2 = false);
    var r3 = 0, i3 = UZIP2.bin.writeUint, o2 = UZIP2.bin.writeUshort, a2 = {};
    for (var s2 in e3) {
      var f2 = !UZIP2._noNeed(s2) && !t2, l2 = e3[s2], c2 = UZIP2.crc.crc(l2, 0, l2.length);
      a2[s2] = { cpr: f2, usize: l2.length, crc: c2, file: f2 ? UZIP2.deflateRaw(l2) : l2 };
    }
    for (var s2 in a2) r3 += a2[s2].file.length + 30 + 46 + 2 * UZIP2.bin.sizeUTF8(s2);
    r3 += 22;
    var u = new Uint8Array(r3), h = 0, d = [];
    for (var s2 in a2) {
      var A = a2[s2];
      d.push(h), h = UZIP2._writeHeader(u, h, s2, A, 0);
    }
    var g = 0, p = h;
    for (var s2 in a2) {
      A = a2[s2];
      d.push(h), h = UZIP2._writeHeader(u, h, s2, A, 1, d[g++]);
    }
    var m = h - p;
    return i3(u, h, 101010256), h += 4, o2(u, h += 4, g), o2(u, h += 2, g), i3(u, h += 2, m), i3(u, h += 4, p), h += 4, h += 2, u.buffer;
  }, UZIP2._noNeed = function(e3) {
    var t2 = e3.split(".").pop().toLowerCase();
    return -1 != "png,jpg,jpeg,zip".indexOf(t2);
  }, UZIP2._writeHeader = function(e3, t2, r3, i3, o2, a2) {
    var s2 = UZIP2.bin.writeUint, f2 = UZIP2.bin.writeUshort, l2 = i3.file;
    return s2(e3, t2, 0 == o2 ? 67324752 : 33639248), t2 += 4, 1 == o2 && (t2 += 2), f2(e3, t2, 20), f2(e3, t2 += 2, 0), f2(e3, t2 += 2, i3.cpr ? 8 : 0), s2(e3, t2 += 2, 0), s2(e3, t2 += 4, i3.crc), s2(e3, t2 += 4, l2.length), s2(e3, t2 += 4, i3.usize), f2(e3, t2 += 4, UZIP2.bin.sizeUTF8(r3)), f2(e3, t2 += 2, 0), t2 += 2, 1 == o2 && (t2 += 2, t2 += 2, s2(e3, t2 += 6, a2), t2 += 4), t2 += UZIP2.bin.writeUTF8(e3, t2, r3), 0 == o2 && (e3.set(l2, t2), t2 += l2.length), t2;
  }, UZIP2.crc = { table: (function() {
    for (var e3 = new Uint32Array(256), t2 = 0; t2 < 256; t2++) {
      for (var r3 = t2, i3 = 0; i3 < 8; i3++) 1 & r3 ? r3 = 3988292384 ^ r3 >>> 1 : r3 >>>= 1;
      e3[t2] = r3;
    }
    return e3;
  })(), update: function(e3, t2, r3, i3) {
    for (var o2 = 0; o2 < i3; o2++) e3 = UZIP2.crc.table[255 & (e3 ^ t2[r3 + o2])] ^ e3 >>> 8;
    return e3;
  }, crc: function(e3, t2, r3) {
    return 4294967295 ^ UZIP2.crc.update(4294967295, e3, t2, r3);
  } }, UZIP2.adler = function(e3, t2, r3) {
    for (var i3 = 1, o2 = 0, a2 = t2, s2 = t2 + r3; a2 < s2; ) {
      for (var f2 = Math.min(a2 + 5552, s2); a2 < f2; ) o2 += i3 += e3[a2++];
      i3 %= 65521, o2 %= 65521;
    }
    return o2 << 16 | i3;
  }, UZIP2.bin = { readUshort: function(e3, t2) {
    return e3[t2] | e3[t2 + 1] << 8;
  }, writeUshort: function(e3, t2, r3) {
    e3[t2] = 255 & r3, e3[t2 + 1] = r3 >> 8 & 255;
  }, readUint: function(e3, t2) {
    return 16777216 * e3[t2 + 3] + (e3[t2 + 2] << 16 | e3[t2 + 1] << 8 | e3[t2]);
  }, writeUint: function(e3, t2, r3) {
    e3[t2] = 255 & r3, e3[t2 + 1] = r3 >> 8 & 255, e3[t2 + 2] = r3 >> 16 & 255, e3[t2 + 3] = r3 >> 24 & 255;
  }, readASCII: function(e3, t2, r3) {
    for (var i3 = "", o2 = 0; o2 < r3; o2++) i3 += String.fromCharCode(e3[t2 + o2]);
    return i3;
  }, writeASCII: function(e3, t2, r3) {
    for (var i3 = 0; i3 < r3.length; i3++) e3[t2 + i3] = r3.charCodeAt(i3);
  }, pad: function(e3) {
    return e3.length < 2 ? "0" + e3 : e3;
  }, readUTF8: function(e3, t2, r3) {
    for (var i3, o2 = "", a2 = 0; a2 < r3; a2++) o2 += "%" + UZIP2.bin.pad(e3[t2 + a2].toString(16));
    try {
      i3 = decodeURIComponent(o2);
    } catch (i4) {
      return UZIP2.bin.readASCII(e3, t2, r3);
    }
    return i3;
  }, writeUTF8: function(e3, t2, r3) {
    for (var i3 = r3.length, o2 = 0, a2 = 0; a2 < i3; a2++) {
      var s2 = r3.charCodeAt(a2);
      if (0 == (4294967168 & s2)) e3[t2 + o2] = s2, o2++;
      else if (0 == (4294965248 & s2)) e3[t2 + o2] = 192 | s2 >> 6, e3[t2 + o2 + 1] = 128 | s2 >> 0 & 63, o2 += 2;
      else if (0 == (4294901760 & s2)) e3[t2 + o2] = 224 | s2 >> 12, e3[t2 + o2 + 1] = 128 | s2 >> 6 & 63, e3[t2 + o2 + 2] = 128 | s2 >> 0 & 63, o2 += 3;
      else {
        if (0 != (4292870144 & s2)) throw "e";
        e3[t2 + o2] = 240 | s2 >> 18, e3[t2 + o2 + 1] = 128 | s2 >> 12 & 63, e3[t2 + o2 + 2] = 128 | s2 >> 6 & 63, e3[t2 + o2 + 3] = 128 | s2 >> 0 & 63, o2 += 4;
      }
    }
    return o2;
  }, sizeUTF8: function(e3) {
    for (var t2 = e3.length, r3 = 0, i3 = 0; i3 < t2; i3++) {
      var o2 = e3.charCodeAt(i3);
      if (0 == (4294967168 & o2)) r3++;
      else if (0 == (4294965248 & o2)) r3 += 2;
      else if (0 == (4294901760 & o2)) r3 += 3;
      else {
        if (0 != (4292870144 & o2)) throw "e";
        r3 += 4;
      }
    }
    return r3;
  } }, UZIP2.F = {}, UZIP2.F.deflateRaw = function(e3, t2, r3, i3) {
    var o2 = [[0, 0, 0, 0, 0], [4, 4, 8, 4, 0], [4, 5, 16, 8, 0], [4, 6, 16, 16, 0], [4, 10, 16, 32, 0], [8, 16, 32, 32, 0], [8, 16, 128, 128, 0], [8, 32, 128, 256, 0], [32, 128, 258, 1024, 1], [32, 258, 258, 4096, 1]][i3], a2 = UZIP2.F.U, s2 = UZIP2.F._goodIndex;
    UZIP2.F._hash;
    var f2 = UZIP2.F._putsE, l2 = 0, c2 = r3 << 3, u = 0, h = e3.length;
    if (0 == i3) {
      for (; l2 < h; ) {
        f2(t2, c2, l2 + (_ = Math.min(65535, h - l2)) == h ? 1 : 0), c2 = UZIP2.F._copyExact(e3, l2, _, t2, c2 + 8), l2 += _;
      }
      return c2 >>> 3;
    }
    var d = a2.lits, A = a2.strt, g = a2.prev, p = 0, m = 0, w = 0, v = 0, b = 0, y = 0;
    for (h > 2 && (A[y = UZIP2.F._hash(e3, 0)] = 0), l2 = 0; l2 < h; l2++) {
      if (b = y, l2 + 1 < h - 2) {
        y = UZIP2.F._hash(e3, l2 + 1);
        var E = l2 + 1 & 32767;
        g[E] = A[y], A[y] = E;
      }
      if (u <= l2) {
        (p > 14e3 || m > 26697) && h - l2 > 100 && (u < l2 && (d[p] = l2 - u, p += 2, u = l2), c2 = UZIP2.F._writeBlock(l2 == h - 1 || u == h ? 1 : 0, d, p, v, e3, w, l2 - w, t2, c2), p = m = v = 0, w = l2);
        var F = 0;
        l2 < h - 2 && (F = UZIP2.F._bestMatch(e3, l2, g, b, Math.min(o2[2], h - l2), o2[3]));
        var _ = F >>> 16, B = 65535 & F;
        if (0 != F) {
          B = 65535 & F;
          var U = s2(_ = F >>> 16, a2.of0);
          a2.lhst[257 + U]++;
          var C = s2(B, a2.df0);
          a2.dhst[C]++, v += a2.exb[U] + a2.dxb[C], d[p] = _ << 23 | l2 - u, d[p + 1] = B << 16 | U << 8 | C, p += 2, u = l2 + _;
        } else a2.lhst[e3[l2]]++;
        m++;
      }
    }
    for (w == l2 && 0 != e3.length || (u < l2 && (d[p] = l2 - u, p += 2, u = l2), c2 = UZIP2.F._writeBlock(1, d, p, v, e3, w, l2 - w, t2, c2), p = 0, m = 0, p = m = v = 0, w = l2); 0 != (7 & c2); ) c2++;
    return c2 >>> 3;
  }, UZIP2.F._bestMatch = function(e3, t2, r3, i3, o2, a2) {
    var s2 = 32767 & t2, f2 = r3[s2], l2 = s2 - f2 + 32768 & 32767;
    if (f2 == s2 || i3 != UZIP2.F._hash(e3, t2 - l2)) return 0;
    for (var c2 = 0, u = 0, h = Math.min(32767, t2); l2 <= h && 0 != --a2 && f2 != s2; ) {
      if (0 == c2 || e3[t2 + c2] == e3[t2 + c2 - l2]) {
        var d = UZIP2.F._howLong(e3, t2, l2);
        if (d > c2) {
          if (u = l2, (c2 = d) >= o2) break;
          l2 + 2 < d && (d = l2 + 2);
          for (var A = 0, g = 0; g < d - 2; g++) {
            var p = t2 - l2 + g + 32768 & 32767, m = p - r3[p] + 32768 & 32767;
            m > A && (A = m, f2 = p);
          }
        }
      }
      l2 += (s2 = f2) - (f2 = r3[s2]) + 32768 & 32767;
    }
    return c2 << 16 | u;
  }, UZIP2.F._howLong = function(e3, t2, r3) {
    if (e3[t2] != e3[t2 - r3] || e3[t2 + 1] != e3[t2 + 1 - r3] || e3[t2 + 2] != e3[t2 + 2 - r3]) return 0;
    var i3 = t2, o2 = Math.min(e3.length, t2 + 258);
    for (t2 += 3; t2 < o2 && e3[t2] == e3[t2 - r3]; ) t2++;
    return t2 - i3;
  }, UZIP2.F._hash = function(e3, t2) {
    return (e3[t2] << 8 | e3[t2 + 1]) + (e3[t2 + 2] << 4) & 65535;
  }, UZIP2.saved = 0, UZIP2.F._writeBlock = function(e3, t2, r3, i3, o2, a2, s2, f2, l2) {
    var c2, u, h, d, A, g, p, m, w, v = UZIP2.F.U, b = UZIP2.F._putsF, y = UZIP2.F._putsE;
    v.lhst[256]++, u = (c2 = UZIP2.F.getTrees())[0], h = c2[1], d = c2[2], A = c2[3], g = c2[4], p = c2[5], m = c2[6], w = c2[7];
    var E = 32 + (0 == (l2 + 3 & 7) ? 0 : 8 - (l2 + 3 & 7)) + (s2 << 3), F = i3 + UZIP2.F.contSize(v.fltree, v.lhst) + UZIP2.F.contSize(v.fdtree, v.dhst), _ = i3 + UZIP2.F.contSize(v.ltree, v.lhst) + UZIP2.F.contSize(v.dtree, v.dhst);
    _ += 14 + 3 * p + UZIP2.F.contSize(v.itree, v.ihst) + (2 * v.ihst[16] + 3 * v.ihst[17] + 7 * v.ihst[18]);
    for (var B = 0; B < 286; B++) v.lhst[B] = 0;
    for (B = 0; B < 30; B++) v.dhst[B] = 0;
    for (B = 0; B < 19; B++) v.ihst[B] = 0;
    var U = E < F && E < _ ? 0 : F < _ ? 1 : 2;
    if (b(f2, l2, e3), b(f2, l2 + 1, U), l2 += 3, 0 == U) {
      for (; 0 != (7 & l2); ) l2++;
      l2 = UZIP2.F._copyExact(o2, a2, s2, f2, l2);
    } else {
      var C, I;
      if (1 == U && (C = v.fltree, I = v.fdtree), 2 == U) {
        UZIP2.F.makeCodes(v.ltree, u), UZIP2.F.revCodes(v.ltree, u), UZIP2.F.makeCodes(v.dtree, h), UZIP2.F.revCodes(v.dtree, h), UZIP2.F.makeCodes(v.itree, d), UZIP2.F.revCodes(v.itree, d), C = v.ltree, I = v.dtree, y(f2, l2, A - 257), y(f2, l2 += 5, g - 1), y(f2, l2 += 5, p - 4), l2 += 4;
        for (var Q = 0; Q < p; Q++) y(f2, l2 + 3 * Q, v.itree[1 + (v.ordr[Q] << 1)]);
        l2 += 3 * p, l2 = UZIP2.F._codeTiny(m, v.itree, f2, l2), l2 = UZIP2.F._codeTiny(w, v.itree, f2, l2);
      }
      for (var M = a2, x = 0; x < r3; x += 2) {
        for (var S = t2[x], R = S >>> 23, T = M + (8388607 & S); M < T; ) l2 = UZIP2.F._writeLit(o2[M++], C, f2, l2);
        if (0 != R) {
          var O = t2[x + 1], P = O >> 16, H = O >> 8 & 255, L = 255 & O;
          y(f2, l2 = UZIP2.F._writeLit(257 + H, C, f2, l2), R - v.of0[H]), l2 += v.exb[H], b(f2, l2 = UZIP2.F._writeLit(L, I, f2, l2), P - v.df0[L]), l2 += v.dxb[L], M += R;
        }
      }
      l2 = UZIP2.F._writeLit(256, C, f2, l2);
    }
    return l2;
  }, UZIP2.F._copyExact = function(e3, t2, r3, i3, o2) {
    var a2 = o2 >>> 3;
    return i3[a2] = r3, i3[a2 + 1] = r3 >>> 8, i3[a2 + 2] = 255 - i3[a2], i3[a2 + 3] = 255 - i3[a2 + 1], a2 += 4, i3.set(new Uint8Array(e3.buffer, t2, r3), a2), o2 + (r3 + 4 << 3);
  }, UZIP2.F.getTrees = function() {
    for (var e3 = UZIP2.F.U, t2 = UZIP2.F._hufTree(e3.lhst, e3.ltree, 15), r3 = UZIP2.F._hufTree(e3.dhst, e3.dtree, 15), i3 = [], o2 = UZIP2.F._lenCodes(e3.ltree, i3), a2 = [], s2 = UZIP2.F._lenCodes(e3.dtree, a2), f2 = 0; f2 < i3.length; f2 += 2) e3.ihst[i3[f2]]++;
    for (f2 = 0; f2 < a2.length; f2 += 2) e3.ihst[a2[f2]]++;
    for (var l2 = UZIP2.F._hufTree(e3.ihst, e3.itree, 7), c2 = 19; c2 > 4 && 0 == e3.itree[1 + (e3.ordr[c2 - 1] << 1)]; ) c2--;
    return [t2, r3, l2, o2, s2, c2, i3, a2];
  }, UZIP2.F.getSecond = function(e3) {
    for (var t2 = [], r3 = 0; r3 < e3.length; r3 += 2) t2.push(e3[r3 + 1]);
    return t2;
  }, UZIP2.F.nonZero = function(e3) {
    for (var t2 = "", r3 = 0; r3 < e3.length; r3 += 2) 0 != e3[r3 + 1] && (t2 += (r3 >> 1) + ",");
    return t2;
  }, UZIP2.F.contSize = function(e3, t2) {
    for (var r3 = 0, i3 = 0; i3 < t2.length; i3++) r3 += t2[i3] * e3[1 + (i3 << 1)];
    return r3;
  }, UZIP2.F._codeTiny = function(e3, t2, r3, i3) {
    for (var o2 = 0; o2 < e3.length; o2 += 2) {
      var a2 = e3[o2], s2 = e3[o2 + 1];
      i3 = UZIP2.F._writeLit(a2, t2, r3, i3);
      var f2 = 16 == a2 ? 2 : 17 == a2 ? 3 : 7;
      a2 > 15 && (UZIP2.F._putsE(r3, i3, s2, f2), i3 += f2);
    }
    return i3;
  }, UZIP2.F._lenCodes = function(e3, t2) {
    for (var r3 = e3.length; 2 != r3 && 0 == e3[r3 - 1]; ) r3 -= 2;
    for (var i3 = 0; i3 < r3; i3 += 2) {
      var o2 = e3[i3 + 1], a2 = i3 + 3 < r3 ? e3[i3 + 3] : -1, s2 = i3 + 5 < r3 ? e3[i3 + 5] : -1, f2 = 0 == i3 ? -1 : e3[i3 - 1];
      if (0 == o2 && a2 == o2 && s2 == o2) {
        for (var l2 = i3 + 5; l2 + 2 < r3 && e3[l2 + 2] == o2; ) l2 += 2;
        (c2 = Math.min(l2 + 1 - i3 >>> 1, 138)) < 11 ? t2.push(17, c2 - 3) : t2.push(18, c2 - 11), i3 += 2 * c2 - 2;
      } else if (o2 == f2 && a2 == o2 && s2 == o2) {
        for (l2 = i3 + 5; l2 + 2 < r3 && e3[l2 + 2] == o2; ) l2 += 2;
        var c2 = Math.min(l2 + 1 - i3 >>> 1, 6);
        t2.push(16, c2 - 3), i3 += 2 * c2 - 2;
      } else t2.push(o2, 0);
    }
    return r3 >>> 1;
  }, UZIP2.F._hufTree = function(e3, t2, r3) {
    var i3 = [], o2 = e3.length, a2 = t2.length, s2 = 0;
    for (s2 = 0; s2 < a2; s2 += 2) t2[s2] = 0, t2[s2 + 1] = 0;
    for (s2 = 0; s2 < o2; s2++) 0 != e3[s2] && i3.push({ lit: s2, f: e3[s2] });
    var f2 = i3.length, l2 = i3.slice(0);
    if (0 == f2) return 0;
    if (1 == f2) {
      var c2 = i3[0].lit;
      l2 = 0 == c2 ? 1 : 0;
      return t2[1 + (c2 << 1)] = 1, t2[1 + (l2 << 1)] = 1, 1;
    }
    i3.sort((function(e4, t3) {
      return e4.f - t3.f;
    }));
    var u = i3[0], h = i3[1], d = 0, A = 1, g = 2;
    for (i3[0] = { lit: -1, f: u.f + h.f, l: u, r: h, d: 0 }; A != f2 - 1; ) u = d != A && (g == f2 || i3[d].f < i3[g].f) ? i3[d++] : i3[g++], h = d != A && (g == f2 || i3[d].f < i3[g].f) ? i3[d++] : i3[g++], i3[A++] = { lit: -1, f: u.f + h.f, l: u, r: h };
    var p = UZIP2.F.setDepth(i3[A - 1], 0);
    for (p > r3 && (UZIP2.F.restrictDepth(l2, r3, p), p = r3), s2 = 0; s2 < f2; s2++) t2[1 + (l2[s2].lit << 1)] = l2[s2].d;
    return p;
  }, UZIP2.F.setDepth = function(e3, t2) {
    return -1 != e3.lit ? (e3.d = t2, t2) : Math.max(UZIP2.F.setDepth(e3.l, t2 + 1), UZIP2.F.setDepth(e3.r, t2 + 1));
  }, UZIP2.F.restrictDepth = function(e3, t2, r3) {
    var i3 = 0, o2 = 1 << r3 - t2, a2 = 0;
    for (e3.sort((function(e4, t3) {
      return t3.d == e4.d ? e4.f - t3.f : t3.d - e4.d;
    })), i3 = 0; i3 < e3.length && e3[i3].d > t2; i3++) {
      var s2 = e3[i3].d;
      e3[i3].d = t2, a2 += o2 - (1 << r3 - s2);
    }
    for (a2 >>>= r3 - t2; a2 > 0; ) {
      (s2 = e3[i3].d) < t2 ? (e3[i3].d++, a2 -= 1 << t2 - s2 - 1) : i3++;
    }
    for (; i3 >= 0; i3--) e3[i3].d == t2 && a2 < 0 && (e3[i3].d--, a2++);
    0 != a2 && console.log("debt left");
  }, UZIP2.F._goodIndex = function(e3, t2) {
    var r3 = 0;
    return t2[16 | r3] <= e3 && (r3 |= 16), t2[8 | r3] <= e3 && (r3 |= 8), t2[4 | r3] <= e3 && (r3 |= 4), t2[2 | r3] <= e3 && (r3 |= 2), t2[1 | r3] <= e3 && (r3 |= 1), r3;
  }, UZIP2.F._writeLit = function(e3, t2, r3, i3) {
    return UZIP2.F._putsF(r3, i3, t2[e3 << 1]), i3 + t2[1 + (e3 << 1)];
  }, UZIP2.F.inflate = function(e3, t2) {
    var r3 = Uint8Array;
    if (3 == e3[0] && 0 == e3[1]) return t2 || new r3(0);
    var i3 = UZIP2.F, o2 = i3._bitsF, a2 = i3._bitsE, s2 = i3._decodeTiny, f2 = i3.makeCodes, l2 = i3.codes2map, c2 = i3._get17, u = i3.U, h = null == t2;
    h && (t2 = new r3(e3.length >>> 2 << 3));
    for (var d, A, g = 0, p = 0, m = 0, w = 0, v = 0, b = 0, y = 0, E = 0, F = 0; 0 == g; ) if (g = o2(e3, F, 1), p = o2(e3, F + 1, 2), F += 3, 0 != p) {
      if (h && (t2 = UZIP2.F._check(t2, E + (1 << 17))), 1 == p && (d = u.flmap, A = u.fdmap, b = 511, y = 31), 2 == p) {
        m = a2(e3, F, 5) + 257, w = a2(e3, F + 5, 5) + 1, v = a2(e3, F + 10, 4) + 4, F += 14;
        for (var _ = 0; _ < 38; _ += 2) u.itree[_] = 0, u.itree[_ + 1] = 0;
        var B = 1;
        for (_ = 0; _ < v; _++) {
          var U = a2(e3, F + 3 * _, 3);
          u.itree[1 + (u.ordr[_] << 1)] = U, U > B && (B = U);
        }
        F += 3 * v, f2(u.itree, B), l2(u.itree, B, u.imap), d = u.lmap, A = u.dmap, F = s2(u.imap, (1 << B) - 1, m + w, e3, F, u.ttree);
        var C = i3._copyOut(u.ttree, 0, m, u.ltree);
        b = (1 << C) - 1;
        var I = i3._copyOut(u.ttree, m, w, u.dtree);
        y = (1 << I) - 1, f2(u.ltree, C), l2(u.ltree, C, d), f2(u.dtree, I), l2(u.dtree, I, A);
      }
      for (; ; ) {
        var Q = d[c2(e3, F) & b];
        F += 15 & Q;
        var M = Q >>> 4;
        if (M >>> 8 == 0) t2[E++] = M;
        else {
          if (256 == M) break;
          var x = E + M - 254;
          if (M > 264) {
            var S = u.ldef[M - 257];
            x = E + (S >>> 3) + a2(e3, F, 7 & S), F += 7 & S;
          }
          var R = A[c2(e3, F) & y];
          F += 15 & R;
          var T = R >>> 4, O = u.ddef[T], P = (O >>> 4) + o2(e3, F, 15 & O);
          for (F += 15 & O, h && (t2 = UZIP2.F._check(t2, E + (1 << 17))); E < x; ) t2[E] = t2[E++ - P], t2[E] = t2[E++ - P], t2[E] = t2[E++ - P], t2[E] = t2[E++ - P];
          E = x;
        }
      }
    } else {
      0 != (7 & F) && (F += 8 - (7 & F));
      var H = 4 + (F >>> 3), L = e3[H - 4] | e3[H - 3] << 8;
      h && (t2 = UZIP2.F._check(t2, E + L)), t2.set(new r3(e3.buffer, e3.byteOffset + H, L), E), F = H + L << 3, E += L;
    }
    return t2.length == E ? t2 : t2.slice(0, E);
  }, UZIP2.F._check = function(e3, t2) {
    var r3 = e3.length;
    if (t2 <= r3) return e3;
    var i3 = new Uint8Array(Math.max(r3 << 1, t2));
    return i3.set(e3, 0), i3;
  }, UZIP2.F._decodeTiny = function(e3, t2, r3, i3, o2, a2) {
    for (var s2 = UZIP2.F._bitsE, f2 = UZIP2.F._get17, l2 = 0; l2 < r3; ) {
      var c2 = e3[f2(i3, o2) & t2];
      o2 += 15 & c2;
      var u = c2 >>> 4;
      if (u <= 15) a2[l2] = u, l2++;
      else {
        var h = 0, d = 0;
        16 == u ? (d = 3 + s2(i3, o2, 2), o2 += 2, h = a2[l2 - 1]) : 17 == u ? (d = 3 + s2(i3, o2, 3), o2 += 3) : 18 == u && (d = 11 + s2(i3, o2, 7), o2 += 7);
        for (var A = l2 + d; l2 < A; ) a2[l2] = h, l2++;
      }
    }
    return o2;
  }, UZIP2.F._copyOut = function(e3, t2, r3, i3) {
    for (var o2 = 0, a2 = 0, s2 = i3.length >>> 1; a2 < r3; ) {
      var f2 = e3[a2 + t2];
      i3[a2 << 1] = 0, i3[1 + (a2 << 1)] = f2, f2 > o2 && (o2 = f2), a2++;
    }
    for (; a2 < s2; ) i3[a2 << 1] = 0, i3[1 + (a2 << 1)] = 0, a2++;
    return o2;
  }, UZIP2.F.makeCodes = function(e3, t2) {
    for (var r3, i3, o2, a2, s2 = UZIP2.F.U, f2 = e3.length, l2 = s2.bl_count, c2 = 0; c2 <= t2; c2++) l2[c2] = 0;
    for (c2 = 1; c2 < f2; c2 += 2) l2[e3[c2]]++;
    var u = s2.next_code;
    for (r3 = 0, l2[0] = 0, i3 = 1; i3 <= t2; i3++) r3 = r3 + l2[i3 - 1] << 1, u[i3] = r3;
    for (o2 = 0; o2 < f2; o2 += 2) 0 != (a2 = e3[o2 + 1]) && (e3[o2] = u[a2], u[a2]++);
  }, UZIP2.F.codes2map = function(e3, t2, r3) {
    for (var i3 = e3.length, o2 = UZIP2.F.U.rev15, a2 = 0; a2 < i3; a2 += 2) if (0 != e3[a2 + 1]) for (var s2 = a2 >> 1, f2 = e3[a2 + 1], l2 = s2 << 4 | f2, c2 = t2 - f2, u = e3[a2] << c2, h = u + (1 << c2); u != h; ) {
      r3[o2[u] >>> 15 - t2] = l2, u++;
    }
  }, UZIP2.F.revCodes = function(e3, t2) {
    for (var r3 = UZIP2.F.U.rev15, i3 = 15 - t2, o2 = 0; o2 < e3.length; o2 += 2) {
      var a2 = e3[o2] << t2 - e3[o2 + 1];
      e3[o2] = r3[a2] >>> i3;
    }
  }, UZIP2.F._putsE = function(e3, t2, r3) {
    r3 <<= 7 & t2;
    var i3 = t2 >>> 3;
    e3[i3] |= r3, e3[i3 + 1] |= r3 >>> 8;
  }, UZIP2.F._putsF = function(e3, t2, r3) {
    r3 <<= 7 & t2;
    var i3 = t2 >>> 3;
    e3[i3] |= r3, e3[i3 + 1] |= r3 >>> 8, e3[i3 + 2] |= r3 >>> 16;
  }, UZIP2.F._bitsE = function(e3, t2, r3) {
    return (e3[t2 >>> 3] | e3[1 + (t2 >>> 3)] << 8) >>> (7 & t2) & (1 << r3) - 1;
  }, UZIP2.F._bitsF = function(e3, t2, r3) {
    return (e3[t2 >>> 3] | e3[1 + (t2 >>> 3)] << 8 | e3[2 + (t2 >>> 3)] << 16) >>> (7 & t2) & (1 << r3) - 1;
  }, UZIP2.F._get17 = function(e3, t2) {
    return (e3[t2 >>> 3] | e3[1 + (t2 >>> 3)] << 8 | e3[2 + (t2 >>> 3)] << 16) >>> (7 & t2);
  }, UZIP2.F._get25 = function(e3, t2) {
    return (e3[t2 >>> 3] | e3[1 + (t2 >>> 3)] << 8 | e3[2 + (t2 >>> 3)] << 16 | e3[3 + (t2 >>> 3)] << 24) >>> (7 & t2);
  }, UZIP2.F.U = (r2 = Uint16Array, i2 = Uint32Array, { next_code: new r2(16), bl_count: new r2(16), ordr: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], of0: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 999, 999, 999], exb: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0], ldef: new r2(32), df0: [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535], dxb: [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0], ddef: new i2(32), flmap: new r2(512), fltree: [], fdmap: new r2(32), fdtree: [], lmap: new r2(32768), ltree: [], ttree: [], dmap: new r2(32768), dtree: [], imap: new r2(512), itree: [], rev15: new r2(32768), lhst: new i2(286), dhst: new i2(30), ihst: new i2(19), lits: new i2(15e3), strt: new r2(65536), prev: new r2(32768) }), (function() {
    for (var e3 = UZIP2.F.U, t2 = 0; t2 < 32768; t2++) {
      var r3 = t2;
      r3 = (4278255360 & (r3 = (4042322160 & (r3 = (3435973836 & (r3 = (2863311530 & r3) >>> 1 | (1431655765 & r3) << 1)) >>> 2 | (858993459 & r3) << 2)) >>> 4 | (252645135 & r3) << 4)) >>> 8 | (16711935 & r3) << 8, e3.rev15[t2] = (r3 >>> 16 | r3 << 16) >>> 17;
    }
    function pushV(e4, t3, r4) {
      for (; 0 != t3--; ) e4.push(0, r4);
    }
    for (t2 = 0; t2 < 32; t2++) e3.ldef[t2] = e3.of0[t2] << 3 | e3.exb[t2], e3.ddef[t2] = e3.df0[t2] << 4 | e3.dxb[t2];
    pushV(e3.fltree, 144, 8), pushV(e3.fltree, 112, 9), pushV(e3.fltree, 24, 7), pushV(e3.fltree, 8, 8), UZIP2.F.makeCodes(e3.fltree, 9), UZIP2.F.codes2map(e3.fltree, 9, e3.flmap), UZIP2.F.revCodes(e3.fltree, 9), pushV(e3.fdtree, 32, 5), UZIP2.F.makeCodes(e3.fdtree, 5), UZIP2.F.codes2map(e3.fdtree, 5, e3.fdmap), UZIP2.F.revCodes(e3.fdtree, 5), pushV(e3.itree, 19, 0), pushV(e3.ltree, 286, 0), pushV(e3.dtree, 30, 0), pushV(e3.ttree, 320, 0);
  })();
})();
var UZIP = _mergeNamespaces$1({ __proto__: null, default: e }, [e]);
const UPNG = (function() {
  var e2 = { nextZero(e3, t3) {
    for (; 0 != e3[t3]; ) t3++;
    return t3;
  }, readUshort: (e3, t3) => e3[t3] << 8 | e3[t3 + 1], writeUshort(e3, t3, r2) {
    e3[t3] = r2 >> 8 & 255, e3[t3 + 1] = 255 & r2;
  }, readUint: (e3, t3) => 16777216 * e3[t3] + (e3[t3 + 1] << 16 | e3[t3 + 2] << 8 | e3[t3 + 3]), writeUint(e3, t3, r2) {
    e3[t3] = r2 >> 24 & 255, e3[t3 + 1] = r2 >> 16 & 255, e3[t3 + 2] = r2 >> 8 & 255, e3[t3 + 3] = 255 & r2;
  }, readASCII(e3, t3, r2) {
    let i2 = "";
    for (let o2 = 0; o2 < r2; o2++) i2 += String.fromCharCode(e3[t3 + o2]);
    return i2;
  }, writeASCII(e3, t3, r2) {
    for (let i2 = 0; i2 < r2.length; i2++) e3[t3 + i2] = r2.charCodeAt(i2);
  }, readBytes(e3, t3, r2) {
    const i2 = [];
    for (let o2 = 0; o2 < r2; o2++) i2.push(e3[t3 + o2]);
    return i2;
  }, pad: (e3) => e3.length < 2 ? `0${e3}` : e3, readUTF8(t3, r2, i2) {
    let o2, a2 = "";
    for (let o3 = 0; o3 < i2; o3++) a2 += `%${e2.pad(t3[r2 + o3].toString(16))}`;
    try {
      o2 = decodeURIComponent(a2);
    } catch (o3) {
      return e2.readASCII(t3, r2, i2);
    }
    return o2;
  } };
  function decodeImage(t3, r2, i2, o2) {
    const a2 = r2 * i2, s2 = _getBPP(o2), f2 = Math.ceil(r2 * s2 / 8), l2 = new Uint8Array(4 * a2), c2 = new Uint32Array(l2.buffer), { ctype: u } = o2, { depth: h } = o2, d = e2.readUshort;
    if (6 == u) {
      const e3 = a2 << 2;
      if (8 == h) for (var A = 0; A < e3; A += 4) l2[A] = t3[A], l2[A + 1] = t3[A + 1], l2[A + 2] = t3[A + 2], l2[A + 3] = t3[A + 3];
      if (16 == h) for (A = 0; A < e3; A++) l2[A] = t3[A << 1];
    } else if (2 == u) {
      const e3 = o2.tabs.tRNS;
      if (null == e3) {
        if (8 == h) for (A = 0; A < a2; A++) {
          var g = 3 * A;
          c2[A] = 255 << 24 | t3[g + 2] << 16 | t3[g + 1] << 8 | t3[g];
        }
        if (16 == h) for (A = 0; A < a2; A++) {
          g = 6 * A;
          c2[A] = 255 << 24 | t3[g + 4] << 16 | t3[g + 2] << 8 | t3[g];
        }
      } else {
        var p = e3[0];
        const r3 = e3[1], i3 = e3[2];
        if (8 == h) for (A = 0; A < a2; A++) {
          var m = A << 2;
          g = 3 * A;
          c2[A] = 255 << 24 | t3[g + 2] << 16 | t3[g + 1] << 8 | t3[g], t3[g] == p && t3[g + 1] == r3 && t3[g + 2] == i3 && (l2[m + 3] = 0);
        }
        if (16 == h) for (A = 0; A < a2; A++) {
          m = A << 2, g = 6 * A;
          c2[A] = 255 << 24 | t3[g + 4] << 16 | t3[g + 2] << 8 | t3[g], d(t3, g) == p && d(t3, g + 2) == r3 && d(t3, g + 4) == i3 && (l2[m + 3] = 0);
        }
      }
    } else if (3 == u) {
      const e3 = o2.tabs.PLTE, s3 = o2.tabs.tRNS, c3 = s3 ? s3.length : 0;
      if (1 == h) for (var w = 0; w < i2; w++) {
        var v = w * f2, b = w * r2;
        for (A = 0; A < r2; A++) {
          m = b + A << 2;
          var y = 3 * (E = t3[v + (A >> 3)] >> 7 - ((7 & A) << 0) & 1);
          l2[m] = e3[y], l2[m + 1] = e3[y + 1], l2[m + 2] = e3[y + 2], l2[m + 3] = E < c3 ? s3[E] : 255;
        }
      }
      if (2 == h) for (w = 0; w < i2; w++) for (v = w * f2, b = w * r2, A = 0; A < r2; A++) {
        m = b + A << 2, y = 3 * (E = t3[v + (A >> 2)] >> 6 - ((3 & A) << 1) & 3);
        l2[m] = e3[y], l2[m + 1] = e3[y + 1], l2[m + 2] = e3[y + 2], l2[m + 3] = E < c3 ? s3[E] : 255;
      }
      if (4 == h) for (w = 0; w < i2; w++) for (v = w * f2, b = w * r2, A = 0; A < r2; A++) {
        m = b + A << 2, y = 3 * (E = t3[v + (A >> 1)] >> 4 - ((1 & A) << 2) & 15);
        l2[m] = e3[y], l2[m + 1] = e3[y + 1], l2[m + 2] = e3[y + 2], l2[m + 3] = E < c3 ? s3[E] : 255;
      }
      if (8 == h) for (A = 0; A < a2; A++) {
        var E;
        m = A << 2, y = 3 * (E = t3[A]);
        l2[m] = e3[y], l2[m + 1] = e3[y + 1], l2[m + 2] = e3[y + 2], l2[m + 3] = E < c3 ? s3[E] : 255;
      }
    } else if (4 == u) {
      if (8 == h) for (A = 0; A < a2; A++) {
        m = A << 2;
        var F = t3[_ = A << 1];
        l2[m] = F, l2[m + 1] = F, l2[m + 2] = F, l2[m + 3] = t3[_ + 1];
      }
      if (16 == h) for (A = 0; A < a2; A++) {
        var _;
        m = A << 2, F = t3[_ = A << 2];
        l2[m] = F, l2[m + 1] = F, l2[m + 2] = F, l2[m + 3] = t3[_ + 2];
      }
    } else if (0 == u) for (p = o2.tabs.tRNS ? o2.tabs.tRNS : -1, w = 0; w < i2; w++) {
      const e3 = w * f2, i3 = w * r2;
      if (1 == h) for (var B = 0; B < r2; B++) {
        var U = (F = 255 * (t3[e3 + (B >>> 3)] >>> 7 - (7 & B) & 1)) == 255 * p ? 0 : 255;
        c2[i3 + B] = U << 24 | F << 16 | F << 8 | F;
      }
      else if (2 == h) for (B = 0; B < r2; B++) {
        U = (F = 85 * (t3[e3 + (B >>> 2)] >>> 6 - ((3 & B) << 1) & 3)) == 85 * p ? 0 : 255;
        c2[i3 + B] = U << 24 | F << 16 | F << 8 | F;
      }
      else if (4 == h) for (B = 0; B < r2; B++) {
        U = (F = 17 * (t3[e3 + (B >>> 1)] >>> 4 - ((1 & B) << 2) & 15)) == 17 * p ? 0 : 255;
        c2[i3 + B] = U << 24 | F << 16 | F << 8 | F;
      }
      else if (8 == h) for (B = 0; B < r2; B++) {
        U = (F = t3[e3 + B]) == p ? 0 : 255;
        c2[i3 + B] = U << 24 | F << 16 | F << 8 | F;
      }
      else if (16 == h) for (B = 0; B < r2; B++) {
        F = t3[e3 + (B << 1)], U = d(t3, e3 + (B << 1)) == p ? 0 : 255;
        c2[i3 + B] = U << 24 | F << 16 | F << 8 | F;
      }
    }
    return l2;
  }
  function _decompress(e3, r2, i2, o2) {
    const a2 = _getBPP(e3), s2 = Math.ceil(i2 * a2 / 8), f2 = new Uint8Array((s2 + 1 + e3.interlace) * o2);
    return r2 = e3.tabs.CgBI ? t2(r2, f2) : _inflate(r2, f2), 0 == e3.interlace ? r2 = _filterZero(r2, e3, 0, i2, o2) : 1 == e3.interlace && (r2 = (function _readInterlace(e4, t3) {
      const r3 = t3.width, i3 = t3.height, o3 = _getBPP(t3), a3 = o3 >> 3, s3 = Math.ceil(r3 * o3 / 8), f3 = new Uint8Array(i3 * s3);
      let l2 = 0;
      const c2 = [0, 0, 4, 0, 2, 0, 1], u = [0, 4, 0, 2, 0, 1, 0], h = [8, 8, 8, 4, 4, 2, 2], d = [8, 8, 4, 4, 2, 2, 1];
      let A = 0;
      for (; A < 7; ) {
        const p = h[A], m = d[A];
        let w = 0, v = 0, b = c2[A];
        for (; b < i3; ) b += p, v++;
        let y = u[A];
        for (; y < r3; ) y += m, w++;
        const E = Math.ceil(w * o3 / 8);
        _filterZero(e4, t3, l2, w, v);
        let F = 0, _ = c2[A];
        for (; _ < i3; ) {
          let t4 = u[A], i4 = l2 + F * E << 3;
          for (; t4 < r3; ) {
            var g;
            if (1 == o3) g = (g = e4[i4 >> 3]) >> 7 - (7 & i4) & 1, f3[_ * s3 + (t4 >> 3)] |= g << 7 - ((7 & t4) << 0);
            if (2 == o3) g = (g = e4[i4 >> 3]) >> 6 - (7 & i4) & 3, f3[_ * s3 + (t4 >> 2)] |= g << 6 - ((3 & t4) << 1);
            if (4 == o3) g = (g = e4[i4 >> 3]) >> 4 - (7 & i4) & 15, f3[_ * s3 + (t4 >> 1)] |= g << 4 - ((1 & t4) << 2);
            if (o3 >= 8) {
              const r4 = _ * s3 + t4 * a3;
              for (let t5 = 0; t5 < a3; t5++) f3[r4 + t5] = e4[(i4 >> 3) + t5];
            }
            i4 += o3, t4 += m;
          }
          F++, _ += p;
        }
        w * v != 0 && (l2 += v * (1 + E)), A += 1;
      }
      return f3;
    })(r2, e3)), r2;
  }
  function _inflate(e3, r2) {
    return t2(new Uint8Array(e3.buffer, 2, e3.length - 6), r2);
  }
  var t2 = (function() {
    const e3 = { H: {} };
    return e3.H.N = function(t3, r2) {
      const i2 = Uint8Array;
      let o2, a2, s2 = 0, f2 = 0, l2 = 0, c2 = 0, u = 0, h = 0, d = 0, A = 0, g = 0;
      if (3 == t3[0] && 0 == t3[1]) return r2 || new i2(0);
      const p = e3.H, m = p.b, w = p.e, v = p.R, b = p.n, y = p.A, E = p.Z, F = p.m, _ = null == r2;
      for (_ && (r2 = new i2(t3.length >>> 2 << 5)); 0 == s2; ) if (s2 = m(t3, g, 1), f2 = m(t3, g + 1, 2), g += 3, 0 != f2) {
        if (_ && (r2 = e3.H.W(r2, A + (1 << 17))), 1 == f2 && (o2 = F.J, a2 = F.h, h = 511, d = 31), 2 == f2) {
          l2 = w(t3, g, 5) + 257, c2 = w(t3, g + 5, 5) + 1, u = w(t3, g + 10, 4) + 4, g += 14;
          let e4 = 1;
          for (var B = 0; B < 38; B += 2) F.Q[B] = 0, F.Q[B + 1] = 0;
          for (B = 0; B < u; B++) {
            const r4 = w(t3, g + 3 * B, 3);
            F.Q[1 + (F.X[B] << 1)] = r4, r4 > e4 && (e4 = r4);
          }
          g += 3 * u, b(F.Q, e4), y(F.Q, e4, F.u), o2 = F.w, a2 = F.d, g = v(F.u, (1 << e4) - 1, l2 + c2, t3, g, F.v);
          const r3 = p.V(F.v, 0, l2, F.C);
          h = (1 << r3) - 1;
          const i3 = p.V(F.v, l2, c2, F.D);
          d = (1 << i3) - 1, b(F.C, r3), y(F.C, r3, o2), b(F.D, i3), y(F.D, i3, a2);
        }
        for (; ; ) {
          const e4 = o2[E(t3, g) & h];
          g += 15 & e4;
          const i3 = e4 >>> 4;
          if (i3 >>> 8 == 0) r2[A++] = i3;
          else {
            if (256 == i3) break;
            {
              let e5 = A + i3 - 254;
              if (i3 > 264) {
                const r3 = F.q[i3 - 257];
                e5 = A + (r3 >>> 3) + w(t3, g, 7 & r3), g += 7 & r3;
              }
              const o3 = a2[E(t3, g) & d];
              g += 15 & o3;
              const s3 = o3 >>> 4, f3 = F.c[s3], l3 = (f3 >>> 4) + m(t3, g, 15 & f3);
              for (g += 15 & f3; A < e5; ) r2[A] = r2[A++ - l3], r2[A] = r2[A++ - l3], r2[A] = r2[A++ - l3], r2[A] = r2[A++ - l3];
              A = e5;
            }
          }
        }
      } else {
        0 != (7 & g) && (g += 8 - (7 & g));
        const o3 = 4 + (g >>> 3), a3 = t3[o3 - 4] | t3[o3 - 3] << 8;
        _ && (r2 = e3.H.W(r2, A + a3)), r2.set(new i2(t3.buffer, t3.byteOffset + o3, a3), A), g = o3 + a3 << 3, A += a3;
      }
      return r2.length == A ? r2 : r2.slice(0, A);
    }, e3.H.W = function(e4, t3) {
      const r2 = e4.length;
      if (t3 <= r2) return e4;
      const i2 = new Uint8Array(r2 << 1);
      return i2.set(e4, 0), i2;
    }, e3.H.R = function(t3, r2, i2, o2, a2, s2) {
      const f2 = e3.H.e, l2 = e3.H.Z;
      let c2 = 0;
      for (; c2 < i2; ) {
        const e4 = t3[l2(o2, a2) & r2];
        a2 += 15 & e4;
        const i3 = e4 >>> 4;
        if (i3 <= 15) s2[c2] = i3, c2++;
        else {
          let e5 = 0, t4 = 0;
          16 == i3 ? (t4 = 3 + f2(o2, a2, 2), a2 += 2, e5 = s2[c2 - 1]) : 17 == i3 ? (t4 = 3 + f2(o2, a2, 3), a2 += 3) : 18 == i3 && (t4 = 11 + f2(o2, a2, 7), a2 += 7);
          const r3 = c2 + t4;
          for (; c2 < r3; ) s2[c2] = e5, c2++;
        }
      }
      return a2;
    }, e3.H.V = function(e4, t3, r2, i2) {
      let o2 = 0, a2 = 0;
      const s2 = i2.length >>> 1;
      for (; a2 < r2; ) {
        const r3 = e4[a2 + t3];
        i2[a2 << 1] = 0, i2[1 + (a2 << 1)] = r3, r3 > o2 && (o2 = r3), a2++;
      }
      for (; a2 < s2; ) i2[a2 << 1] = 0, i2[1 + (a2 << 1)] = 0, a2++;
      return o2;
    }, e3.H.n = function(t3, r2) {
      const i2 = e3.H.m, o2 = t3.length;
      let a2, s2, f2;
      let l2;
      const c2 = i2.j;
      for (var u = 0; u <= r2; u++) c2[u] = 0;
      for (u = 1; u < o2; u += 2) c2[t3[u]]++;
      const h = i2.K;
      for (a2 = 0, c2[0] = 0, s2 = 1; s2 <= r2; s2++) a2 = a2 + c2[s2 - 1] << 1, h[s2] = a2;
      for (f2 = 0; f2 < o2; f2 += 2) l2 = t3[f2 + 1], 0 != l2 && (t3[f2] = h[l2], h[l2]++);
    }, e3.H.A = function(t3, r2, i2) {
      const o2 = t3.length, a2 = e3.H.m.r;
      for (let e4 = 0; e4 < o2; e4 += 2) if (0 != t3[e4 + 1]) {
        const o3 = e4 >> 1, s2 = t3[e4 + 1], f2 = o3 << 4 | s2, l2 = r2 - s2;
        let c2 = t3[e4] << l2;
        const u = c2 + (1 << l2);
        for (; c2 != u; ) {
          i2[a2[c2] >>> 15 - r2] = f2, c2++;
        }
      }
    }, e3.H.l = function(t3, r2) {
      const i2 = e3.H.m.r, o2 = 15 - r2;
      for (let e4 = 0; e4 < t3.length; e4 += 2) {
        const a2 = t3[e4] << r2 - t3[e4 + 1];
        t3[e4] = i2[a2] >>> o2;
      }
    }, e3.H.M = function(e4, t3, r2) {
      r2 <<= 7 & t3;
      const i2 = t3 >>> 3;
      e4[i2] |= r2, e4[i2 + 1] |= r2 >>> 8;
    }, e3.H.I = function(e4, t3, r2) {
      r2 <<= 7 & t3;
      const i2 = t3 >>> 3;
      e4[i2] |= r2, e4[i2 + 1] |= r2 >>> 8, e4[i2 + 2] |= r2 >>> 16;
    }, e3.H.e = function(e4, t3, r2) {
      return (e4[t3 >>> 3] | e4[1 + (t3 >>> 3)] << 8) >>> (7 & t3) & (1 << r2) - 1;
    }, e3.H.b = function(e4, t3, r2) {
      return (e4[t3 >>> 3] | e4[1 + (t3 >>> 3)] << 8 | e4[2 + (t3 >>> 3)] << 16) >>> (7 & t3) & (1 << r2) - 1;
    }, e3.H.Z = function(e4, t3) {
      return (e4[t3 >>> 3] | e4[1 + (t3 >>> 3)] << 8 | e4[2 + (t3 >>> 3)] << 16) >>> (7 & t3);
    }, e3.H.i = function(e4, t3) {
      return (e4[t3 >>> 3] | e4[1 + (t3 >>> 3)] << 8 | e4[2 + (t3 >>> 3)] << 16 | e4[3 + (t3 >>> 3)] << 24) >>> (7 & t3);
    }, e3.H.m = (function() {
      const e4 = Uint16Array, t3 = Uint32Array;
      return { K: new e4(16), j: new e4(16), X: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], S: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 999, 999, 999], T: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0], q: new e4(32), p: [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535], z: [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0], c: new t3(32), J: new e4(512), _: [], h: new e4(32), $: [], w: new e4(32768), C: [], v: [], d: new e4(32768), D: [], u: new e4(512), Q: [], r: new e4(32768), s: new t3(286), Y: new t3(30), a: new t3(19), t: new t3(15e3), k: new e4(65536), g: new e4(32768) };
    })(), (function() {
      const t3 = e3.H.m;
      for (var r2 = 0; r2 < 32768; r2++) {
        let e4 = r2;
        e4 = (2863311530 & e4) >>> 1 | (1431655765 & e4) << 1, e4 = (3435973836 & e4) >>> 2 | (858993459 & e4) << 2, e4 = (4042322160 & e4) >>> 4 | (252645135 & e4) << 4, e4 = (4278255360 & e4) >>> 8 | (16711935 & e4) << 8, t3.r[r2] = (e4 >>> 16 | e4 << 16) >>> 17;
      }
      function n(e4, t4, r3) {
        for (; 0 != t4--; ) e4.push(0, r3);
      }
      for (r2 = 0; r2 < 32; r2++) t3.q[r2] = t3.S[r2] << 3 | t3.T[r2], t3.c[r2] = t3.p[r2] << 4 | t3.z[r2];
      n(t3._, 144, 8), n(t3._, 112, 9), n(t3._, 24, 7), n(t3._, 8, 8), e3.H.n(t3._, 9), e3.H.A(t3._, 9, t3.J), e3.H.l(t3._, 9), n(t3.$, 32, 5), e3.H.n(t3.$, 5), e3.H.A(t3.$, 5, t3.h), e3.H.l(t3.$, 5), n(t3.Q, 19, 0), n(t3.C, 286, 0), n(t3.D, 30, 0), n(t3.v, 320, 0);
    })(), e3.H.N;
  })();
  function _getBPP(e3) {
    return [1, null, 3, 1, 2, null, 4][e3.ctype] * e3.depth;
  }
  function _filterZero(e3, t3, r2, i2, o2) {
    let a2 = _getBPP(t3);
    const s2 = Math.ceil(i2 * a2 / 8);
    let f2, l2;
    a2 = Math.ceil(a2 / 8);
    let c2 = e3[r2], u = 0;
    if (c2 > 1 && (e3[r2] = [0, 0, 1][c2 - 2]), 3 == c2) for (u = a2; u < s2; u++) e3[u + 1] = e3[u + 1] + (e3[u + 1 - a2] >>> 1) & 255;
    for (let t4 = 0; t4 < o2; t4++) if (f2 = r2 + t4 * s2, l2 = f2 + t4 + 1, c2 = e3[l2 - 1], u = 0, 0 == c2) for (; u < s2; u++) e3[f2 + u] = e3[l2 + u];
    else if (1 == c2) {
      for (; u < a2; u++) e3[f2 + u] = e3[l2 + u];
      for (; u < s2; u++) e3[f2 + u] = e3[l2 + u] + e3[f2 + u - a2];
    } else if (2 == c2) for (; u < s2; u++) e3[f2 + u] = e3[l2 + u] + e3[f2 + u - s2];
    else if (3 == c2) {
      for (; u < a2; u++) e3[f2 + u] = e3[l2 + u] + (e3[f2 + u - s2] >>> 1);
      for (; u < s2; u++) e3[f2 + u] = e3[l2 + u] + (e3[f2 + u - s2] + e3[f2 + u - a2] >>> 1);
    } else {
      for (; u < a2; u++) e3[f2 + u] = e3[l2 + u] + _paeth(0, e3[f2 + u - s2], 0);
      for (; u < s2; u++) e3[f2 + u] = e3[l2 + u] + _paeth(e3[f2 + u - a2], e3[f2 + u - s2], e3[f2 + u - a2 - s2]);
    }
    return e3;
  }
  function _paeth(e3, t3, r2) {
    const i2 = e3 + t3 - r2, o2 = i2 - e3, a2 = i2 - t3, s2 = i2 - r2;
    return o2 * o2 <= a2 * a2 && o2 * o2 <= s2 * s2 ? e3 : a2 * a2 <= s2 * s2 ? t3 : r2;
  }
  function _IHDR(t3, r2, i2) {
    i2.width = e2.readUint(t3, r2), r2 += 4, i2.height = e2.readUint(t3, r2), r2 += 4, i2.depth = t3[r2], r2++, i2.ctype = t3[r2], r2++, i2.compress = t3[r2], r2++, i2.filter = t3[r2], r2++, i2.interlace = t3[r2], r2++;
  }
  function _copyTile(e3, t3, r2, i2, o2, a2, s2, f2, l2) {
    const c2 = Math.min(t3, o2), u = Math.min(r2, a2);
    let h = 0, d = 0;
    for (let r3 = 0; r3 < u; r3++) for (let a3 = 0; a3 < c2; a3++) if (s2 >= 0 && f2 >= 0 ? (h = r3 * t3 + a3 << 2, d = (f2 + r3) * o2 + s2 + a3 << 2) : (h = (-f2 + r3) * t3 - s2 + a3 << 2, d = r3 * o2 + a3 << 2), 0 == l2) i2[d] = e3[h], i2[d + 1] = e3[h + 1], i2[d + 2] = e3[h + 2], i2[d + 3] = e3[h + 3];
    else if (1 == l2) {
      var A = e3[h + 3] * (1 / 255), g = e3[h] * A, p = e3[h + 1] * A, m = e3[h + 2] * A, w = i2[d + 3] * (1 / 255), v = i2[d] * w, b = i2[d + 1] * w, y = i2[d + 2] * w;
      const t4 = 1 - A, r4 = A + w * t4, o3 = 0 == r4 ? 0 : 1 / r4;
      i2[d + 3] = 255 * r4, i2[d + 0] = (g + v * t4) * o3, i2[d + 1] = (p + b * t4) * o3, i2[d + 2] = (m + y * t4) * o3;
    } else if (2 == l2) {
      A = e3[h + 3], g = e3[h], p = e3[h + 1], m = e3[h + 2], w = i2[d + 3], v = i2[d], b = i2[d + 1], y = i2[d + 2];
      A == w && g == v && p == b && m == y ? (i2[d] = 0, i2[d + 1] = 0, i2[d + 2] = 0, i2[d + 3] = 0) : (i2[d] = g, i2[d + 1] = p, i2[d + 2] = m, i2[d + 3] = A);
    } else if (3 == l2) {
      A = e3[h + 3], g = e3[h], p = e3[h + 1], m = e3[h + 2], w = i2[d + 3], v = i2[d], b = i2[d + 1], y = i2[d + 2];
      if (A == w && g == v && p == b && m == y) continue;
      if (A < 220 && w > 20) return false;
    }
    return true;
  }
  return { decode: function decode2(r2) {
    const i2 = new Uint8Array(r2);
    let o2 = 8;
    const a2 = e2, s2 = a2.readUshort, f2 = a2.readUint, l2 = { tabs: {}, frames: [] }, c2 = new Uint8Array(i2.length);
    let u, h = 0, d = 0;
    const A = [137, 80, 78, 71, 13, 10, 26, 10];
    for (var g = 0; g < 8; g++) if (i2[g] != A[g]) throw "The input is not a PNG file!";
    for (; o2 < i2.length; ) {
      const e3 = a2.readUint(i2, o2);
      o2 += 4;
      const r3 = a2.readASCII(i2, o2, 4);
      if (o2 += 4, "IHDR" == r3) _IHDR(i2, o2, l2);
      else if ("iCCP" == r3) {
        for (var p = o2; 0 != i2[p]; ) p++;
        a2.readASCII(i2, o2, p - o2), i2[p + 1];
        const s3 = i2.slice(p + 2, o2 + e3);
        let f3 = null;
        try {
          f3 = _inflate(s3);
        } catch (e4) {
          f3 = t2(s3);
        }
        l2.tabs[r3] = f3;
      } else if ("CgBI" == r3) l2.tabs[r3] = i2.slice(o2, o2 + 4);
      else if ("IDAT" == r3) {
        for (g = 0; g < e3; g++) c2[h + g] = i2[o2 + g];
        h += e3;
      } else if ("acTL" == r3) l2.tabs[r3] = { num_frames: f2(i2, o2), num_plays: f2(i2, o2 + 4) }, u = new Uint8Array(i2.length);
      else if ("fcTL" == r3) {
        if (0 != d) (E = l2.frames[l2.frames.length - 1]).data = _decompress(l2, u.slice(0, d), E.rect.width, E.rect.height), d = 0;
        const e4 = { x: f2(i2, o2 + 12), y: f2(i2, o2 + 16), width: f2(i2, o2 + 4), height: f2(i2, o2 + 8) };
        let t3 = s2(i2, o2 + 22);
        t3 = s2(i2, o2 + 20) / (0 == t3 ? 100 : t3);
        const r4 = { rect: e4, delay: Math.round(1e3 * t3), dispose: i2[o2 + 24], blend: i2[o2 + 25] };
        l2.frames.push(r4);
      } else if ("fdAT" == r3) {
        for (g = 0; g < e3 - 4; g++) u[d + g] = i2[o2 + g + 4];
        d += e3 - 4;
      } else if ("pHYs" == r3) l2.tabs[r3] = [a2.readUint(i2, o2), a2.readUint(i2, o2 + 4), i2[o2 + 8]];
      else if ("cHRM" == r3) {
        l2.tabs[r3] = [];
        for (g = 0; g < 8; g++) l2.tabs[r3].push(a2.readUint(i2, o2 + 4 * g));
      } else if ("tEXt" == r3 || "zTXt" == r3) {
        null == l2.tabs[r3] && (l2.tabs[r3] = {});
        var m = a2.nextZero(i2, o2), w = a2.readASCII(i2, o2, m - o2), v = o2 + e3 - m - 1;
        if ("tEXt" == r3) y = a2.readASCII(i2, m + 1, v);
        else {
          var b = _inflate(i2.slice(m + 2, m + 2 + v));
          y = a2.readUTF8(b, 0, b.length);
        }
        l2.tabs[r3][w] = y;
      } else if ("iTXt" == r3) {
        null == l2.tabs[r3] && (l2.tabs[r3] = {});
        m = 0, p = o2;
        m = a2.nextZero(i2, p);
        w = a2.readASCII(i2, p, m - p);
        const t3 = i2[p = m + 1];
        var y;
        i2[p + 1], p += 2, m = a2.nextZero(i2, p), a2.readASCII(i2, p, m - p), p = m + 1, m = a2.nextZero(i2, p), a2.readUTF8(i2, p, m - p);
        v = e3 - ((p = m + 1) - o2);
        if (0 == t3) y = a2.readUTF8(i2, p, v);
        else {
          b = _inflate(i2.slice(p, p + v));
          y = a2.readUTF8(b, 0, b.length);
        }
        l2.tabs[r3][w] = y;
      } else if ("PLTE" == r3) l2.tabs[r3] = a2.readBytes(i2, o2, e3);
      else if ("hIST" == r3) {
        const e4 = l2.tabs.PLTE.length / 3;
        l2.tabs[r3] = [];
        for (g = 0; g < e4; g++) l2.tabs[r3].push(s2(i2, o2 + 2 * g));
      } else if ("tRNS" == r3) 3 == l2.ctype ? l2.tabs[r3] = a2.readBytes(i2, o2, e3) : 0 == l2.ctype ? l2.tabs[r3] = s2(i2, o2) : 2 == l2.ctype && (l2.tabs[r3] = [s2(i2, o2), s2(i2, o2 + 2), s2(i2, o2 + 4)]);
      else if ("gAMA" == r3) l2.tabs[r3] = a2.readUint(i2, o2) / 1e5;
      else if ("sRGB" == r3) l2.tabs[r3] = i2[o2];
      else if ("bKGD" == r3) 0 == l2.ctype || 4 == l2.ctype ? l2.tabs[r3] = [s2(i2, o2)] : 2 == l2.ctype || 6 == l2.ctype ? l2.tabs[r3] = [s2(i2, o2), s2(i2, o2 + 2), s2(i2, o2 + 4)] : 3 == l2.ctype && (l2.tabs[r3] = i2[o2]);
      else if ("IEND" == r3) break;
      o2 += e3, a2.readUint(i2, o2), o2 += 4;
    }
    var E;
    return 0 != d && ((E = l2.frames[l2.frames.length - 1]).data = _decompress(l2, u.slice(0, d), E.rect.width, E.rect.height)), l2.data = _decompress(l2, c2, l2.width, l2.height), delete l2.compress, delete l2.interlace, delete l2.filter, l2;
  }, toRGBA8: function toRGBA8(e3) {
    const t3 = e3.width, r2 = e3.height;
    if (null == e3.tabs.acTL) return [decodeImage(e3.data, t3, r2, e3).buffer];
    const i2 = [];
    null == e3.frames[0].data && (e3.frames[0].data = e3.data);
    const o2 = t3 * r2 * 4, a2 = new Uint8Array(o2), s2 = new Uint8Array(o2), f2 = new Uint8Array(o2);
    for (let c2 = 0; c2 < e3.frames.length; c2++) {
      const u = e3.frames[c2], h = u.rect.x, d = u.rect.y, A = u.rect.width, g = u.rect.height, p = decodeImage(u.data, A, g, e3);
      if (0 != c2) for (var l2 = 0; l2 < o2; l2++) f2[l2] = a2[l2];
      if (0 == u.blend ? _copyTile(p, A, g, a2, t3, r2, h, d, 0) : 1 == u.blend && _copyTile(p, A, g, a2, t3, r2, h, d, 1), i2.push(a2.buffer.slice(0)), 0 == u.dispose) ;
      else if (1 == u.dispose) _copyTile(s2, A, g, a2, t3, r2, h, d, 0);
      else if (2 == u.dispose) for (l2 = 0; l2 < o2; l2++) a2[l2] = f2[l2];
    }
    return i2;
  }, _paeth, _copyTile, _bin: e2 };
})();
!(function() {
  const { _copyTile: e2 } = UPNG, { _bin: t2 } = UPNG, r2 = UPNG._paeth;
  var i2 = { table: (function() {
    const e3 = new Uint32Array(256);
    for (let t3 = 0; t3 < 256; t3++) {
      let r3 = t3;
      for (let e4 = 0; e4 < 8; e4++) 1 & r3 ? r3 = 3988292384 ^ r3 >>> 1 : r3 >>>= 1;
      e3[t3] = r3;
    }
    return e3;
  })(), update(e3, t3, r3, o3) {
    for (let a2 = 0; a2 < o3; a2++) e3 = i2.table[255 & (e3 ^ t3[r3 + a2])] ^ e3 >>> 8;
    return e3;
  }, crc: (e3, t3, r3) => 4294967295 ^ i2.update(4294967295, e3, t3, r3) };
  function addErr(e3, t3, r3, i3) {
    t3[r3] += e3[0] * i3 >> 4, t3[r3 + 1] += e3[1] * i3 >> 4, t3[r3 + 2] += e3[2] * i3 >> 4, t3[r3 + 3] += e3[3] * i3 >> 4;
  }
  function N(e3) {
    return Math.max(0, Math.min(255, e3));
  }
  function D(e3, t3) {
    const r3 = e3[0] - t3[0], i3 = e3[1] - t3[1], o3 = e3[2] - t3[2], a2 = e3[3] - t3[3];
    return r3 * r3 + i3 * i3 + o3 * o3 + a2 * a2;
  }
  function dither(e3, t3, r3, i3, o3, a2, s2) {
    null == s2 && (s2 = 1);
    const f2 = i3.length, l2 = [];
    for (var c2 = 0; c2 < f2; c2++) {
      const e4 = i3[c2];
      l2.push([e4 >>> 0 & 255, e4 >>> 8 & 255, e4 >>> 16 & 255, e4 >>> 24 & 255]);
    }
    for (c2 = 0; c2 < f2; c2++) {
      let e4 = 4294967295;
      for (var u = 0, h = 0; h < f2; h++) {
        var d = D(l2[c2], l2[h]);
        h != c2 && d < e4 && (e4 = d, u = h);
      }
    }
    const A = new Uint32Array(o3.buffer), g = new Int16Array(t3 * r3 * 4), p = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (c2 = 0; c2 < p.length; c2++) p[c2] = 255 * ((p[c2] + 0.5) / 16 - 0.5);
    for (let o4 = 0; o4 < r3; o4++) for (let w = 0; w < t3; w++) {
      var m;
      c2 = 4 * (o4 * t3 + w);
      if (2 != s2) m = [N(e3[c2] + g[c2]), N(e3[c2 + 1] + g[c2 + 1]), N(e3[c2 + 2] + g[c2 + 2]), N(e3[c2 + 3] + g[c2 + 3])];
      else {
        d = p[4 * (3 & o4) + (3 & w)];
        m = [N(e3[c2] + d), N(e3[c2 + 1] + d), N(e3[c2 + 2] + d), N(e3[c2 + 3] + d)];
      }
      u = 0;
      let v = 16777215;
      for (h = 0; h < f2; h++) {
        const e4 = D(m, l2[h]);
        e4 < v && (v = e4, u = h);
      }
      const b = l2[u], y = [m[0] - b[0], m[1] - b[1], m[2] - b[2], m[3] - b[3]];
      1 == s2 && (w != t3 - 1 && addErr(y, g, c2 + 4, 7), o4 != r3 - 1 && (0 != w && addErr(y, g, c2 + 4 * t3 - 4, 3), addErr(y, g, c2 + 4 * t3, 5), w != t3 - 1 && addErr(y, g, c2 + 4 * t3 + 4, 1))), a2[c2 >> 2] = u, A[c2 >> 2] = i3[u];
    }
  }
  function _main(e3, r3, o3, a2, s2) {
    null == s2 && (s2 = {});
    const { crc: f2 } = i2, l2 = t2.writeUint, c2 = t2.writeUshort, u = t2.writeASCII;
    let h = 8;
    const d = e3.frames.length > 1;
    let A, g = false, p = 33 + (d ? 20 : 0);
    if (null != s2.sRGB && (p += 13), null != s2.pHYs && (p += 21), null != s2.iCCP && (A = pako.deflate(s2.iCCP), p += 21 + A.length + 4), 3 == e3.ctype) {
      for (var m = e3.plte.length, w = 0; w < m; w++) e3.plte[w] >>> 24 != 255 && (g = true);
      p += 8 + 3 * m + 4 + (g ? 8 + 1 * m + 4 : 0);
    }
    for (var v = 0; v < e3.frames.length; v++) {
      d && (p += 38), p += (F = e3.frames[v]).cimg.length + 12, 0 != v && (p += 4);
    }
    p += 12;
    const b = new Uint8Array(p), y = [137, 80, 78, 71, 13, 10, 26, 10];
    for (w = 0; w < 8; w++) b[w] = y[w];
    if (l2(b, h, 13), h += 4, u(b, h, "IHDR"), h += 4, l2(b, h, r3), h += 4, l2(b, h, o3), h += 4, b[h] = e3.depth, h++, b[h] = e3.ctype, h++, b[h] = 0, h++, b[h] = 0, h++, b[h] = 0, h++, l2(b, h, f2(b, h - 17, 17)), h += 4, null != s2.sRGB && (l2(b, h, 1), h += 4, u(b, h, "sRGB"), h += 4, b[h] = s2.sRGB, h++, l2(b, h, f2(b, h - 5, 5)), h += 4), null != s2.iCCP) {
      const e4 = 13 + A.length;
      l2(b, h, e4), h += 4, u(b, h, "iCCP"), h += 4, u(b, h, "ICC profile"), h += 11, h += 2, b.set(A, h), h += A.length, l2(b, h, f2(b, h - (e4 + 4), e4 + 4)), h += 4;
    }
    if (null != s2.pHYs && (l2(b, h, 9), h += 4, u(b, h, "pHYs"), h += 4, l2(b, h, s2.pHYs[0]), h += 4, l2(b, h, s2.pHYs[1]), h += 4, b[h] = s2.pHYs[2], h++, l2(b, h, f2(b, h - 13, 13)), h += 4), d && (l2(b, h, 8), h += 4, u(b, h, "acTL"), h += 4, l2(b, h, e3.frames.length), h += 4, l2(b, h, null != s2.loop ? s2.loop : 0), h += 4, l2(b, h, f2(b, h - 12, 12)), h += 4), 3 == e3.ctype) {
      l2(b, h, 3 * (m = e3.plte.length)), h += 4, u(b, h, "PLTE"), h += 4;
      for (w = 0; w < m; w++) {
        const t3 = 3 * w, r4 = e3.plte[w], i3 = 255 & r4, o4 = r4 >>> 8 & 255, a3 = r4 >>> 16 & 255;
        b[h + t3 + 0] = i3, b[h + t3 + 1] = o4, b[h + t3 + 2] = a3;
      }
      if (h += 3 * m, l2(b, h, f2(b, h - 3 * m - 4, 3 * m + 4)), h += 4, g) {
        l2(b, h, m), h += 4, u(b, h, "tRNS"), h += 4;
        for (w = 0; w < m; w++) b[h + w] = e3.plte[w] >>> 24 & 255;
        h += m, l2(b, h, f2(b, h - m - 4, m + 4)), h += 4;
      }
    }
    let E = 0;
    for (v = 0; v < e3.frames.length; v++) {
      var F = e3.frames[v];
      d && (l2(b, h, 26), h += 4, u(b, h, "fcTL"), h += 4, l2(b, h, E++), h += 4, l2(b, h, F.rect.width), h += 4, l2(b, h, F.rect.height), h += 4, l2(b, h, F.rect.x), h += 4, l2(b, h, F.rect.y), h += 4, c2(b, h, a2[v]), h += 2, c2(b, h, 1e3), h += 2, b[h] = F.dispose, h++, b[h] = F.blend, h++, l2(b, h, f2(b, h - 30, 30)), h += 4);
      const t3 = F.cimg;
      l2(b, h, (m = t3.length) + (0 == v ? 0 : 4)), h += 4;
      const r4 = h;
      u(b, h, 0 == v ? "IDAT" : "fdAT"), h += 4, 0 != v && (l2(b, h, E++), h += 4), b.set(t3, h), h += m, l2(b, h, f2(b, r4, h - r4)), h += 4;
    }
    return l2(b, h, 0), h += 4, u(b, h, "IEND"), h += 4, l2(b, h, f2(b, h - 4, 4)), h += 4, b.buffer;
  }
  function compressPNG(e3, t3, r3) {
    for (let i3 = 0; i3 < e3.frames.length; i3++) {
      const o3 = e3.frames[i3];
      o3.rect.width;
      const a2 = o3.rect.height, s2 = new Uint8Array(a2 * o3.bpl + a2);
      o3.cimg = _filterZero(o3.img, a2, o3.bpp, o3.bpl, s2, t3, r3);
    }
  }
  function compress2(t3, r3, i3, o3, a2) {
    const s2 = a2[0], f2 = a2[1], l2 = a2[2], c2 = a2[3], u = a2[4], h = a2[5];
    let d = 6, A = 8, g = 255;
    for (var p = 0; p < t3.length; p++) {
      const e3 = new Uint8Array(t3[p]);
      for (var m = e3.length, w = 0; w < m; w += 4) g &= e3[w + 3];
    }
    const v = 255 != g, b = (function framize(t4, r4, i4, o4, a3, s3) {
      const f3 = [];
      for (var l3 = 0; l3 < t4.length; l3++) {
        const h3 = new Uint8Array(t4[l3]), A3 = new Uint32Array(h3.buffer);
        var c3;
        let g2 = 0, p2 = 0, m2 = r4, w2 = i4, v2 = o4 ? 1 : 0;
        if (0 != l3) {
          const b2 = s3 || o4 || 1 == l3 || 0 != f3[l3 - 2].dispose ? 1 : 2;
          let y2 = 0, E2 = 1e9;
          for (let e3 = 0; e3 < b2; e3++) {
            var u2 = new Uint8Array(t4[l3 - 1 - e3]);
            const o5 = new Uint32Array(t4[l3 - 1 - e3]);
            let s4 = r4, f4 = i4, c4 = -1, h4 = -1;
            for (let e4 = 0; e4 < i4; e4++) for (let t5 = 0; t5 < r4; t5++) {
              A3[d2 = e4 * r4 + t5] != o5[d2] && (t5 < s4 && (s4 = t5), t5 > c4 && (c4 = t5), e4 < f4 && (f4 = e4), e4 > h4 && (h4 = e4));
            }
            -1 == c4 && (s4 = f4 = c4 = h4 = 0), a3 && (1 == (1 & s4) && s4--, 1 == (1 & f4) && f4--);
            const v3 = (c4 - s4 + 1) * (h4 - f4 + 1);
            v3 < E2 && (E2 = v3, y2 = e3, g2 = s4, p2 = f4, m2 = c4 - s4 + 1, w2 = h4 - f4 + 1);
          }
          u2 = new Uint8Array(t4[l3 - 1 - y2]);
          1 == y2 && (f3[l3 - 1].dispose = 2), c3 = new Uint8Array(m2 * w2 * 4), e2(u2, r4, i4, c3, m2, w2, -g2, -p2, 0), v2 = e2(h3, r4, i4, c3, m2, w2, -g2, -p2, 3) ? 1 : 0, 1 == v2 ? _prepareDiff(h3, r4, i4, c3, { x: g2, y: p2, width: m2, height: w2 }) : e2(h3, r4, i4, c3, m2, w2, -g2, -p2, 0);
        } else c3 = h3.slice(0);
        f3.push({ rect: { x: g2, y: p2, width: m2, height: w2 }, img: c3, blend: v2, dispose: 0 });
      }
      if (o4) for (l3 = 0; l3 < f3.length; l3++) {
        if (1 == (A2 = f3[l3]).blend) continue;
        const e3 = A2.rect, o5 = f3[l3 - 1].rect, s4 = Math.min(e3.x, o5.x), c4 = Math.min(e3.y, o5.y), u3 = { x: s4, y: c4, width: Math.max(e3.x + e3.width, o5.x + o5.width) - s4, height: Math.max(e3.y + e3.height, o5.y + o5.height) - c4 };
        f3[l3 - 1].dispose = 1, l3 - 1 != 0 && _updateFrame(t4, r4, i4, f3, l3 - 1, u3, a3), _updateFrame(t4, r4, i4, f3, l3, u3, a3);
      }
      let h2 = 0;
      if (1 != t4.length) for (var d2 = 0; d2 < f3.length; d2++) {
        var A2;
        h2 += (A2 = f3[d2]).rect.width * A2.rect.height;
      }
      return f3;
    })(t3, r3, i3, s2, f2, l2), y = {}, E = [], F = [];
    if (0 != o3) {
      const e3 = [];
      for (w = 0; w < b.length; w++) e3.push(b[w].img.buffer);
      const t4 = (function concatRGBA(e4) {
        let t5 = 0;
        for (var r5 = 0; r5 < e4.length; r5++) t5 += e4[r5].byteLength;
        const i5 = new Uint8Array(t5);
        let o4 = 0;
        for (r5 = 0; r5 < e4.length; r5++) {
          const t6 = new Uint8Array(e4[r5]), a3 = t6.length;
          for (let e5 = 0; e5 < a3; e5 += 4) {
            let r6 = t6[e5], a4 = t6[e5 + 1], s3 = t6[e5 + 2];
            const f3 = t6[e5 + 3];
            0 == f3 && (r6 = a4 = s3 = 0), i5[o4 + e5] = r6, i5[o4 + e5 + 1] = a4, i5[o4 + e5 + 2] = s3, i5[o4 + e5 + 3] = f3;
          }
          o4 += a3;
        }
        return i5.buffer;
      })(e3), r4 = quantize(t4, o3);
      for (w = 0; w < r4.plte.length; w++) E.push(r4.plte[w].est.rgba);
      let i4 = 0;
      for (w = 0; w < b.length; w++) {
        const e4 = (B = b[w]).img.length;
        var _ = new Uint8Array(r4.inds.buffer, i4 >> 2, e4 >> 2);
        F.push(_);
        const t5 = new Uint8Array(r4.abuf, i4, e4);
        h && dither(B.img, B.rect.width, B.rect.height, E, t5, _), B.img.set(t5), i4 += e4;
      }
    } else for (p = 0; p < b.length; p++) {
      var B = b[p];
      const e3 = new Uint32Array(B.img.buffer);
      var U = B.rect.width;
      m = e3.length, _ = new Uint8Array(m);
      F.push(_);
      for (w = 0; w < m; w++) {
        const t4 = e3[w];
        if (0 != w && t4 == e3[w - 1]) _[w] = _[w - 1];
        else if (w > U && t4 == e3[w - U]) _[w] = _[w - U];
        else {
          let e4 = y[t4];
          if (null == e4 && (y[t4] = e4 = E.length, E.push(t4), E.length >= 300)) break;
          _[w] = e4;
        }
      }
    }
    const C = E.length;
    C <= 256 && 0 == u && (A = C <= 2 ? 1 : C <= 4 ? 2 : C <= 16 ? 4 : 8, A = Math.max(A, c2));
    for (p = 0; p < b.length; p++) {
      (B = b[p]).rect.x, B.rect.y;
      U = B.rect.width;
      const e3 = B.rect.height;
      let t4 = B.img;
      new Uint32Array(t4.buffer);
      let r4 = 4 * U, i4 = 4;
      if (C <= 256 && 0 == u) {
        r4 = Math.ceil(A * U / 8);
        var I = new Uint8Array(r4 * e3);
        const o4 = F[p];
        for (let t5 = 0; t5 < e3; t5++) {
          w = t5 * r4;
          const e4 = t5 * U;
          if (8 == A) for (var Q = 0; Q < U; Q++) I[w + Q] = o4[e4 + Q];
          else if (4 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 1)] |= o4[e4 + Q] << 4 - 4 * (1 & Q);
          else if (2 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 2)] |= o4[e4 + Q] << 6 - 2 * (3 & Q);
          else if (1 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 3)] |= o4[e4 + Q] << 7 - 1 * (7 & Q);
        }
        t4 = I, d = 3, i4 = 1;
      } else if (0 == v && 1 == b.length) {
        I = new Uint8Array(U * e3 * 3);
        const o4 = U * e3;
        for (w = 0; w < o4; w++) {
          const e4 = 3 * w, r5 = 4 * w;
          I[e4] = t4[r5], I[e4 + 1] = t4[r5 + 1], I[e4 + 2] = t4[r5 + 2];
        }
        t4 = I, d = 2, i4 = 3, r4 = 3 * U;
      }
      B.img = t4, B.bpl = r4, B.bpp = i4;
    }
    return { ctype: d, depth: A, plte: E, frames: b };
  }
  function _updateFrame(t3, r3, i3, o3, a2, s2, f2) {
    const l2 = Uint8Array, c2 = Uint32Array, u = new l2(t3[a2 - 1]), h = new c2(t3[a2 - 1]), d = a2 + 1 < t3.length ? new l2(t3[a2 + 1]) : null, A = new l2(t3[a2]), g = new c2(A.buffer);
    let p = r3, m = i3, w = -1, v = -1;
    for (let e3 = 0; e3 < s2.height; e3++) for (let t4 = 0; t4 < s2.width; t4++) {
      const i4 = s2.x + t4, f3 = s2.y + e3, l3 = f3 * r3 + i4, c3 = g[l3];
      0 == c3 || 0 == o3[a2 - 1].dispose && h[l3] == c3 && (null == d || 0 != d[4 * l3 + 3]) || (i4 < p && (p = i4), i4 > w && (w = i4), f3 < m && (m = f3), f3 > v && (v = f3));
    }
    -1 == w && (p = m = w = v = 0), f2 && (1 == (1 & p) && p--, 1 == (1 & m) && m--), s2 = { x: p, y: m, width: w - p + 1, height: v - m + 1 };
    const b = o3[a2];
    b.rect = s2, b.blend = 1, b.img = new Uint8Array(s2.width * s2.height * 4), 0 == o3[a2 - 1].dispose ? (e2(u, r3, i3, b.img, s2.width, s2.height, -s2.x, -s2.y, 0), _prepareDiff(A, r3, i3, b.img, s2)) : e2(A, r3, i3, b.img, s2.width, s2.height, -s2.x, -s2.y, 0);
  }
  function _prepareDiff(t3, r3, i3, o3, a2) {
    e2(t3, r3, i3, o3, a2.width, a2.height, -a2.x, -a2.y, 2);
  }
  function _filterZero(e3, t3, r3, i3, o3, a2, s2) {
    const f2 = [];
    let l2, c2 = [0, 1, 2, 3, 4];
    -1 != a2 ? c2 = [a2] : (t3 * i3 > 5e5 || 1 == r3) && (c2 = [0]), s2 && (l2 = { level: 0 });
    const u = UZIP;
    for (var h = 0; h < c2.length; h++) {
      for (let a3 = 0; a3 < t3; a3++) _filterLine(o3, e3, a3, i3, r3, c2[h]);
      f2.push(u.deflate(o3, l2));
    }
    let d, A = 1e9;
    for (h = 0; h < f2.length; h++) f2[h].length < A && (d = h, A = f2[h].length);
    return f2[d];
  }
  function _filterLine(e3, t3, i3, o3, a2, s2) {
    const f2 = i3 * o3;
    let l2 = f2 + i3;
    if (e3[l2] = s2, l2++, 0 == s2) if (o3 < 500) for (var c2 = 0; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2];
    else e3.set(new Uint8Array(t3.buffer, f2, o3), l2);
    else if (1 == s2) {
      for (c2 = 0; c2 < a2; c2++) e3[l2 + c2] = t3[f2 + c2];
      for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] - t3[f2 + c2 - a2] + 256 & 255;
    } else if (0 == i3) {
      for (c2 = 0; c2 < a2; c2++) e3[l2 + c2] = t3[f2 + c2];
      if (2 == s2) for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2];
      if (3 == s2) for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] - (t3[f2 + c2 - a2] >> 1) + 256 & 255;
      if (4 == s2) for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] - r2(t3[f2 + c2 - a2], 0, 0) + 256 & 255;
    } else {
      if (2 == s2) for (c2 = 0; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] + 256 - t3[f2 + c2 - o3] & 255;
      if (3 == s2) {
        for (c2 = 0; c2 < a2; c2++) e3[l2 + c2] = t3[f2 + c2] + 256 - (t3[f2 + c2 - o3] >> 1) & 255;
        for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] + 256 - (t3[f2 + c2 - o3] + t3[f2 + c2 - a2] >> 1) & 255;
      }
      if (4 == s2) {
        for (c2 = 0; c2 < a2; c2++) e3[l2 + c2] = t3[f2 + c2] + 256 - r2(0, t3[f2 + c2 - o3], 0) & 255;
        for (c2 = a2; c2 < o3; c2++) e3[l2 + c2] = t3[f2 + c2] + 256 - r2(t3[f2 + c2 - a2], t3[f2 + c2 - o3], t3[f2 + c2 - a2 - o3]) & 255;
      }
    }
  }
  function quantize(e3, t3) {
    const r3 = new Uint8Array(e3), i3 = r3.slice(0), o3 = new Uint32Array(i3.buffer), a2 = getKDtree(i3, t3), s2 = a2[0], f2 = a2[1], l2 = r3.length, c2 = new Uint8Array(l2 >> 2);
    let u;
    if (r3.length < 2e7) for (var h = 0; h < l2; h += 4) {
      u = getNearest(s2, d = r3[h] * (1 / 255), A = r3[h + 1] * (1 / 255), g = r3[h + 2] * (1 / 255), p = r3[h + 3] * (1 / 255)), c2[h >> 2] = u.ind, o3[h >> 2] = u.est.rgba;
    }
    else for (h = 0; h < l2; h += 4) {
      var d = r3[h] * (1 / 255), A = r3[h + 1] * (1 / 255), g = r3[h + 2] * (1 / 255), p = r3[h + 3] * (1 / 255);
      for (u = s2; u.left; ) u = planeDst(u.est, d, A, g, p) <= 0 ? u.left : u.right;
      c2[h >> 2] = u.ind, o3[h >> 2] = u.est.rgba;
    }
    return { abuf: i3.buffer, inds: c2, plte: f2 };
  }
  function getKDtree(e3, t3, r3) {
    null == r3 && (r3 = 1e-4);
    const i3 = new Uint32Array(e3.buffer), o3 = { i0: 0, i1: e3.length, bst: null, est: null, tdst: 0, left: null, right: null };
    o3.bst = stats(e3, o3.i0, o3.i1), o3.est = estats(o3.bst);
    const a2 = [o3];
    for (; a2.length < t3; ) {
      let t4 = 0, o4 = 0;
      for (var s2 = 0; s2 < a2.length; s2++) a2[s2].est.L > t4 && (t4 = a2[s2].est.L, o4 = s2);
      if (t4 < r3) break;
      const f2 = a2[o4], l2 = splitPixels(e3, i3, f2.i0, f2.i1, f2.est.e, f2.est.eMq255);
      if (f2.i0 >= l2 || f2.i1 <= l2) {
        f2.est.L = 0;
        continue;
      }
      const c2 = { i0: f2.i0, i1: l2, bst: null, est: null, tdst: 0, left: null, right: null };
      c2.bst = stats(e3, c2.i0, c2.i1), c2.est = estats(c2.bst);
      const u = { i0: l2, i1: f2.i1, bst: null, est: null, tdst: 0, left: null, right: null };
      u.bst = { R: [], m: [], N: f2.bst.N - c2.bst.N };
      for (s2 = 0; s2 < 16; s2++) u.bst.R[s2] = f2.bst.R[s2] - c2.bst.R[s2];
      for (s2 = 0; s2 < 4; s2++) u.bst.m[s2] = f2.bst.m[s2] - c2.bst.m[s2];
      u.est = estats(u.bst), f2.left = c2, f2.right = u, a2[o4] = c2, a2.push(u);
    }
    a2.sort(((e4, t4) => t4.bst.N - e4.bst.N));
    for (s2 = 0; s2 < a2.length; s2++) a2[s2].ind = s2;
    return [o3, a2];
  }
  function getNearest(e3, t3, r3, i3, o3) {
    if (null == e3.left) return e3.tdst = (function dist(e4, t4, r4, i4, o4) {
      const a3 = t4 - e4[0], s3 = r4 - e4[1], f3 = i4 - e4[2], l3 = o4 - e4[3];
      return a3 * a3 + s3 * s3 + f3 * f3 + l3 * l3;
    })(e3.est.q, t3, r3, i3, o3), e3;
    const a2 = planeDst(e3.est, t3, r3, i3, o3);
    let s2 = e3.left, f2 = e3.right;
    a2 > 0 && (s2 = e3.right, f2 = e3.left);
    const l2 = getNearest(s2, t3, r3, i3, o3);
    if (l2.tdst <= a2 * a2) return l2;
    const c2 = getNearest(f2, t3, r3, i3, o3);
    return c2.tdst < l2.tdst ? c2 : l2;
  }
  function planeDst(e3, t3, r3, i3, o3) {
    const { e: a2 } = e3;
    return a2[0] * t3 + a2[1] * r3 + a2[2] * i3 + a2[3] * o3 - e3.eMq;
  }
  function splitPixels(e3, t3, r3, i3, o3, a2) {
    for (i3 -= 4; r3 < i3; ) {
      for (; vecDot(e3, r3, o3) <= a2; ) r3 += 4;
      for (; vecDot(e3, i3, o3) > a2; ) i3 -= 4;
      if (r3 >= i3) break;
      const s2 = t3[r3 >> 2];
      t3[r3 >> 2] = t3[i3 >> 2], t3[i3 >> 2] = s2, r3 += 4, i3 -= 4;
    }
    for (; vecDot(e3, r3, o3) > a2; ) r3 -= 4;
    return r3 + 4;
  }
  function vecDot(e3, t3, r3) {
    return e3[t3] * r3[0] + e3[t3 + 1] * r3[1] + e3[t3 + 2] * r3[2] + e3[t3 + 3] * r3[3];
  }
  function stats(e3, t3, r3) {
    const i3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], o3 = [0, 0, 0, 0], a2 = r3 - t3 >> 2;
    for (let a3 = t3; a3 < r3; a3 += 4) {
      const t4 = e3[a3] * (1 / 255), r4 = e3[a3 + 1] * (1 / 255), s2 = e3[a3 + 2] * (1 / 255), f2 = e3[a3 + 3] * (1 / 255);
      o3[0] += t4, o3[1] += r4, o3[2] += s2, o3[3] += f2, i3[0] += t4 * t4, i3[1] += t4 * r4, i3[2] += t4 * s2, i3[3] += t4 * f2, i3[5] += r4 * r4, i3[6] += r4 * s2, i3[7] += r4 * f2, i3[10] += s2 * s2, i3[11] += s2 * f2, i3[15] += f2 * f2;
    }
    return i3[4] = i3[1], i3[8] = i3[2], i3[9] = i3[6], i3[12] = i3[3], i3[13] = i3[7], i3[14] = i3[11], { R: i3, m: o3, N: a2 };
  }
  function estats(e3) {
    const { R: t3 } = e3, { m: r3 } = e3, { N: i3 } = e3, a2 = r3[0], s2 = r3[1], f2 = r3[2], l2 = r3[3], c2 = 0 == i3 ? 0 : 1 / i3, u = [t3[0] - a2 * a2 * c2, t3[1] - a2 * s2 * c2, t3[2] - a2 * f2 * c2, t3[3] - a2 * l2 * c2, t3[4] - s2 * a2 * c2, t3[5] - s2 * s2 * c2, t3[6] - s2 * f2 * c2, t3[7] - s2 * l2 * c2, t3[8] - f2 * a2 * c2, t3[9] - f2 * s2 * c2, t3[10] - f2 * f2 * c2, t3[11] - f2 * l2 * c2, t3[12] - l2 * a2 * c2, t3[13] - l2 * s2 * c2, t3[14] - l2 * f2 * c2, t3[15] - l2 * l2 * c2], h = u, d = o2;
    let A = [Math.random(), Math.random(), Math.random(), Math.random()], g = 0, p = 0;
    if (0 != i3) for (let e4 = 0; e4 < 16 && (A = d.multVec(h, A), p = Math.sqrt(d.dot(A, A)), A = d.sml(1 / p, A), !(0 != e4 && Math.abs(p - g) < 1e-9)); e4++) g = p;
    const m = [a2 * c2, s2 * c2, f2 * c2, l2 * c2];
    return { Cov: u, q: m, e: A, L: g, eMq255: d.dot(d.sml(255, m), A), eMq: d.dot(A, m), rgba: (Math.round(255 * m[3]) << 24 | Math.round(255 * m[2]) << 16 | Math.round(255 * m[1]) << 8 | Math.round(255 * m[0]) << 0) >>> 0 };
  }
  var o2 = { multVec: (e3, t3) => [e3[0] * t3[0] + e3[1] * t3[1] + e3[2] * t3[2] + e3[3] * t3[3], e3[4] * t3[0] + e3[5] * t3[1] + e3[6] * t3[2] + e3[7] * t3[3], e3[8] * t3[0] + e3[9] * t3[1] + e3[10] * t3[2] + e3[11] * t3[3], e3[12] * t3[0] + e3[13] * t3[1] + e3[14] * t3[2] + e3[15] * t3[3]], dot: (e3, t3) => e3[0] * t3[0] + e3[1] * t3[1] + e3[2] * t3[2] + e3[3] * t3[3], sml: (e3, t3) => [e3 * t3[0], e3 * t3[1], e3 * t3[2], e3 * t3[3]] };
  UPNG.encode = function encode2(e3, t3, r3, i3, o3, a2, s2) {
    null == i3 && (i3 = 0), null == s2 && (s2 = false);
    const f2 = compress2(e3, t3, r3, i3, [false, false, false, 0, s2, false]);
    return compressPNG(f2, -1), _main(f2, t3, r3, o3, a2);
  }, UPNG.encodeLL = function encodeLL(e3, t3, r3, i3, o3, a2, s2, f2) {
    const l2 = { ctype: 0 + (1 == i3 ? 0 : 2) + (0 == o3 ? 0 : 4), depth: a2, frames: [] }, c2 = (i3 + o3) * a2, u = c2 * t3;
    for (let i4 = 0; i4 < e3.length; i4++) l2.frames.push({ rect: { x: 0, y: 0, width: t3, height: r3 }, img: new Uint8Array(e3[i4]), blend: 0, dispose: 1, bpp: Math.ceil(c2 / 8), bpl: Math.ceil(u / 8) });
    return compressPNG(l2, 0, true), _main(l2, t3, r3, s2, f2);
  }, UPNG.encode.compress = compress2, UPNG.encode.dither = dither, UPNG.quantize = quantize, UPNG.quantize.getKDtree = getKDtree, UPNG.quantize.getNearest = getNearest;
})();
const r = { toArrayBuffer(e2, t2) {
  const i2 = e2.width, o2 = e2.height, a2 = i2 << 2, s2 = e2.getContext("2d").getImageData(0, 0, i2, o2), f2 = new Uint32Array(s2.data.buffer), l2 = (32 * i2 + 31) / 32 << 2, c2 = l2 * o2, u = 122 + c2, h = new ArrayBuffer(u), d = new DataView(h), A = 1 << 20;
  let g, p, m, w, v = A, b = 0, y = 0, E = 0;
  function set16(e3) {
    d.setUint16(y, e3, true), y += 2;
  }
  function set32(e3) {
    d.setUint32(y, e3, true), y += 4;
  }
  function seek(e3) {
    y += e3;
  }
  set16(19778), set32(u), seek(4), set32(122), set32(108), set32(i2), set32(-o2 >>> 0), set16(1), set16(32), set32(3), set32(c2), set32(2835), set32(2835), seek(8), set32(16711680), set32(65280), set32(255), set32(4278190080), set32(1466527264), (function convert() {
    for (; b < o2 && v > 0; ) {
      for (w = 122 + b * l2, g = 0; g < a2; ) v--, p = f2[E++], m = p >>> 24, d.setUint32(w + g, p << 8 | m), g += 4;
      b++;
    }
    E < f2.length ? (v = A, setTimeout(convert, r._dly)) : t2(h);
  })();
}, toBlob(e2, t2) {
  this.toArrayBuffer(e2, ((e3) => {
    t2(new Blob([e3], { type: "image/bmp" }));
  }));
}, _dly: 9 };
var i = { CHROME: "CHROME", FIREFOX: "FIREFOX", DESKTOP_SAFARI: "DESKTOP_SAFARI", IE: "IE", IOS: "IOS", ETC: "ETC" }, o = { [i.CHROME]: 16384, [i.FIREFOX]: 11180, [i.DESKTOP_SAFARI]: 16384, [i.IE]: 8192, [i.IOS]: 4096, [i.ETC]: 8192 };
const a = "undefined" != typeof window, s = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope, f = a && window.cordova && window.cordova.require && window.cordova.require("cordova/modulemapper"), CustomFile = (a || s) && (f && f.getOriginalSymbol(window, "File") || "undefined" != typeof File && File), CustomFileReader = (a || s) && (f && f.getOriginalSymbol(window, "FileReader") || "undefined" != typeof FileReader && FileReader);
function getFilefromDataUrl(e2, t2, r2 = Date.now()) {
  return new Promise(((i2) => {
    const o2 = e2.split(","), a2 = o2[0].match(/:(.*?);/)[1], s2 = globalThis.atob(o2[1]);
    let f2 = s2.length;
    const l2 = new Uint8Array(f2);
    for (; f2--; ) l2[f2] = s2.charCodeAt(f2);
    const c2 = new Blob([l2], { type: a2 });
    c2.name = t2, c2.lastModified = r2, i2(c2);
  }));
}
function getDataUrlFromFile(e2) {
  return new Promise(((t2, r2) => {
    const i2 = new CustomFileReader();
    i2.onload = () => t2(i2.result), i2.onerror = (e3) => r2(e3), i2.readAsDataURL(e2);
  }));
}
function loadImage(e2) {
  return new Promise(((t2, r2) => {
    const i2 = new Image();
    i2.onload = () => t2(i2), i2.onerror = (e3) => r2(e3), i2.src = e2;
  }));
}
function getBrowserName() {
  if (void 0 !== getBrowserName.cachedResult) return getBrowserName.cachedResult;
  let e2 = i.ETC;
  const { userAgent: t2 } = navigator;
  return /Chrom(e|ium)/i.test(t2) ? e2 = i.CHROME : /iP(ad|od|hone)/i.test(t2) && /WebKit/i.test(t2) ? e2 = i.IOS : /Safari/i.test(t2) ? e2 = i.DESKTOP_SAFARI : /Firefox/i.test(t2) ? e2 = i.FIREFOX : (/MSIE/i.test(t2) || true == !!document.documentMode) && (e2 = i.IE), getBrowserName.cachedResult = e2, getBrowserName.cachedResult;
}
function approximateBelowMaximumCanvasSizeOfBrowser(e2, t2) {
  const r2 = getBrowserName(), i2 = o[r2];
  let a2 = e2, s2 = t2, f2 = a2 * s2;
  const l2 = a2 > s2 ? s2 / a2 : a2 / s2;
  for (; f2 > i2 * i2; ) {
    const e3 = (i2 + a2) / 2, t3 = (i2 + s2) / 2;
    e3 < t3 ? (s2 = t3, a2 = t3 * l2) : (s2 = e3 * l2, a2 = e3), f2 = a2 * s2;
  }
  return { width: a2, height: s2 };
}
function getNewCanvasAndCtx(e2, t2) {
  let r2, i2;
  try {
    if (r2 = new OffscreenCanvas(e2, t2), i2 = r2.getContext("2d"), null === i2) throw new Error("getContext of OffscreenCanvas returns null");
  } catch (e3) {
    r2 = document.createElement("canvas"), i2 = r2.getContext("2d");
  }
  return r2.width = e2, r2.height = t2, [r2, i2];
}
function drawImageInCanvas(e2, t2) {
  const { width: r2, height: i2 } = approximateBelowMaximumCanvasSizeOfBrowser(e2.width, e2.height), [o2, a2] = getNewCanvasAndCtx(r2, i2);
  return t2 && /jpe?g/.test(t2) && (a2.fillStyle = "white", a2.fillRect(0, 0, o2.width, o2.height)), a2.drawImage(e2, 0, 0, o2.width, o2.height), o2;
}
function isIOS() {
  return void 0 !== isIOS.cachedResult || (isIOS.cachedResult = ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "undefined" != typeof document && "ontouchend" in document), isIOS.cachedResult;
}
function drawFileInCanvas(e2, t2 = {}) {
  return new Promise((function(r2, o2) {
    let a2, s2;
    var $Try_2_Post = function() {
      try {
        return s2 = drawImageInCanvas(a2, t2.fileType || e2.type), r2([a2, s2]);
      } catch (e3) {
        return o2(e3);
      }
    }, $Try_2_Catch = function(t3) {
      try {
        0;
        var $Try_3_Catch = function(e3) {
          try {
            throw e3;
          } catch (e4) {
            return o2(e4);
          }
        };
        try {
          let t4;
          return getDataUrlFromFile(e2).then((function(e3) {
            try {
              return t4 = e3, loadImage(t4).then((function(e4) {
                try {
                  return a2 = e4, (function() {
                    try {
                      return $Try_2_Post();
                    } catch (e5) {
                      return o2(e5);
                    }
                  })();
                } catch (e5) {
                  return $Try_3_Catch(e5);
                }
              }), $Try_3_Catch);
            } catch (e4) {
              return $Try_3_Catch(e4);
            }
          }), $Try_3_Catch);
        } catch (e3) {
          $Try_3_Catch(e3);
        }
      } catch (e3) {
        return o2(e3);
      }
    };
    try {
      if (isIOS() || [i.DESKTOP_SAFARI, i.MOBILE_SAFARI].includes(getBrowserName())) throw new Error("Skip createImageBitmap on IOS and Safari");
      return createImageBitmap(e2).then((function(e3) {
        try {
          return a2 = e3, $Try_2_Post();
        } catch (e4) {
          return $Try_2_Catch();
        }
      }), $Try_2_Catch);
    } catch (e3) {
      $Try_2_Catch();
    }
  }));
}
function canvasToFile(e2, t2, i2, o2, a2 = 1) {
  return new Promise((function(s2, f2) {
    let l2;
    if ("image/png" === t2) {
      let c2, u, h;
      return c2 = e2.getContext("2d"), { data: u } = c2.getImageData(0, 0, e2.width, e2.height), h = UPNG.encode([u.buffer], e2.width, e2.height, 4096 * a2), l2 = new Blob([h], { type: t2 }), l2.name = i2, l2.lastModified = o2, $If_4.call(this);
    }
    {
      let $If_5 = function() {
        return $If_4.call(this);
      };
      if ("image/bmp" === t2) return new Promise(((t3) => r.toBlob(e2, t3))).then(function(e3) {
        try {
          return l2 = e3, l2.name = i2, l2.lastModified = o2, $If_5.call(this);
        } catch (e4) {
          return f2(e4);
        }
      }.bind(this), f2);
      {
        let $If_6 = function() {
          return $If_5.call(this);
        };
        if ("function" == typeof OffscreenCanvas && e2 instanceof OffscreenCanvas) return e2.convertToBlob({ type: t2, quality: a2 }).then(function(e3) {
          try {
            return l2 = e3, l2.name = i2, l2.lastModified = o2, $If_6.call(this);
          } catch (e4) {
            return f2(e4);
          }
        }.bind(this), f2);
        {
          let d;
          return d = e2.toDataURL(t2, a2), getFilefromDataUrl(d, i2, o2).then(function(e3) {
            try {
              return l2 = e3, $If_6.call(this);
            } catch (e4) {
              return f2(e4);
            }
          }.bind(this), f2);
        }
      }
    }
    function $If_4() {
      return s2(l2);
    }
  }));
}
function cleanupCanvasMemory(e2) {
  e2.width = 0, e2.height = 0;
}
function isAutoOrientationInBrowser() {
  return new Promise((function(e2, t2) {
    let i2, o2, a2, s2;
    return void 0 !== isAutoOrientationInBrowser.cachedResult ? e2(isAutoOrientationInBrowser.cachedResult) : getFilefromDataUrl("data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/xABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==", "test.jpg", Date.now()).then((function(r2) {
      try {
        return i2 = r2, drawFileInCanvas(i2).then((function(r3) {
          try {
            return o2 = r3[1], canvasToFile(o2, i2.type, i2.name, i2.lastModified).then((function(r4) {
              try {
                return a2 = r4, cleanupCanvasMemory(o2), drawFileInCanvas(a2).then((function(r5) {
                  try {
                    return s2 = r5[0], isAutoOrientationInBrowser.cachedResult = 1 === s2.width && 2 === s2.height, e2(isAutoOrientationInBrowser.cachedResult);
                  } catch (e3) {
                    return t2(e3);
                  }
                }), t2);
              } catch (e3) {
                return t2(e3);
              }
            }), t2);
          } catch (e3) {
            return t2(e3);
          }
        }), t2);
      } catch (e3) {
        return t2(e3);
      }
    }), t2);
  }));
}
function getExifOrientation(e2) {
  return new Promise(((t2, r2) => {
    const i2 = new CustomFileReader();
    i2.onload = (e3) => {
      const r3 = new DataView(e3.target.result);
      if (65496 != r3.getUint16(0, false)) return t2(-2);
      const i3 = r3.byteLength;
      let o2 = 2;
      for (; o2 < i3; ) {
        if (r3.getUint16(o2 + 2, false) <= 8) return t2(-1);
        const e4 = r3.getUint16(o2, false);
        if (o2 += 2, 65505 == e4) {
          if (1165519206 != r3.getUint32(o2 += 2, false)) return t2(-1);
          const e5 = 18761 == r3.getUint16(o2 += 6, false);
          o2 += r3.getUint32(o2 + 4, e5);
          const i4 = r3.getUint16(o2, e5);
          o2 += 2;
          for (let a2 = 0; a2 < i4; a2++) if (274 == r3.getUint16(o2 + 12 * a2, e5)) return t2(r3.getUint16(o2 + 12 * a2 + 8, e5));
        } else {
          if (65280 != (65280 & e4)) break;
          o2 += r3.getUint16(o2, false);
        }
      }
      return t2(-1);
    }, i2.onerror = (e3) => r2(e3), i2.readAsArrayBuffer(e2);
  }));
}
function handleMaxWidthOrHeight(e2, t2) {
  const { width: r2 } = e2, { height: i2 } = e2, { maxWidthOrHeight: o2 } = t2;
  let a2, s2 = e2;
  return isFinite(o2) && (r2 > o2 || i2 > o2) && ([s2, a2] = getNewCanvasAndCtx(r2, i2), r2 > i2 ? (s2.width = o2, s2.height = i2 / r2 * o2) : (s2.width = r2 / i2 * o2, s2.height = o2), a2.drawImage(e2, 0, 0, s2.width, s2.height), cleanupCanvasMemory(e2)), s2;
}
function followExifOrientation(e2, t2) {
  const { width: r2 } = e2, { height: i2 } = e2, [o2, a2] = getNewCanvasAndCtx(r2, i2);
  switch (t2 > 4 && t2 < 9 ? (o2.width = i2, o2.height = r2) : (o2.width = r2, o2.height = i2), t2) {
    case 2:
      a2.transform(-1, 0, 0, 1, r2, 0);
      break;
    case 3:
      a2.transform(-1, 0, 0, -1, r2, i2);
      break;
    case 4:
      a2.transform(1, 0, 0, -1, 0, i2);
      break;
    case 5:
      a2.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      a2.transform(0, 1, -1, 0, i2, 0);
      break;
    case 7:
      a2.transform(0, -1, -1, 0, i2, r2);
      break;
    case 8:
      a2.transform(0, -1, 1, 0, 0, r2);
  }
  return a2.drawImage(e2, 0, 0, r2, i2), cleanupCanvasMemory(e2), o2;
}
function compress(e2, t2, r2 = 0) {
  return new Promise((function(i2, o2) {
    let a2, s2, f2, l2, c2, u, h, d, A, g, p, m, w, v, b, y, E, F, _, B;
    function incProgress(e3 = 5) {
      if (t2.signal && t2.signal.aborted) throw t2.signal.reason;
      a2 += e3, t2.onProgress(Math.min(a2, 100));
    }
    function setProgress(e3) {
      if (t2.signal && t2.signal.aborted) throw t2.signal.reason;
      a2 = Math.min(Math.max(e3, a2), 100), t2.onProgress(a2);
    }
    return a2 = r2, s2 = t2.maxIteration || 10, f2 = 1024 * t2.maxSizeMB * 1024, incProgress(), drawFileInCanvas(e2, t2).then(function(r3) {
      try {
        return [, l2] = r3, incProgress(), c2 = handleMaxWidthOrHeight(l2, t2), incProgress(), new Promise((function(r4, i3) {
          var o3;
          if (!(o3 = t2.exifOrientation)) return getExifOrientation(e2).then(function(e3) {
            try {
              return o3 = e3, $If_2.call(this);
            } catch (e4) {
              return i3(e4);
            }
          }.bind(this), i3);
          function $If_2() {
            return r4(o3);
          }
          return $If_2.call(this);
        })).then(function(r4) {
          try {
            return u = r4, incProgress(), isAutoOrientationInBrowser().then(function(r5) {
              try {
                return h = r5 ? c2 : followExifOrientation(c2, u), incProgress(), d = t2.initialQuality || 1, A = t2.fileType || e2.type, canvasToFile(h, A, e2.name, e2.lastModified, d).then(function(r6) {
                  try {
                    {
                      let $Loop_3 = function() {
                        if (s2-- && (b > f2 || b > w)) {
                          let t3, r7;
                          return t3 = B ? 0.95 * _.width : _.width, r7 = B ? 0.95 * _.height : _.height, [E, F] = getNewCanvasAndCtx(t3, r7), F.drawImage(_, 0, 0, t3, r7), d *= "image/png" === A ? 0.85 : 0.95, canvasToFile(E, A, e2.name, e2.lastModified, d).then((function(e3) {
                            try {
                              return y = e3, cleanupCanvasMemory(_), _ = E, b = y.size, setProgress(Math.min(99, Math.floor((v - b) / (v - f2) * 100))), $Loop_3;
                            } catch (e4) {
                              return o2(e4);
                            }
                          }), o2);
                        }
                        return [1];
                      }, $Loop_3_exit = function() {
                        return cleanupCanvasMemory(_), cleanupCanvasMemory(E), cleanupCanvasMemory(c2), cleanupCanvasMemory(h), cleanupCanvasMemory(l2), setProgress(100), i2(y);
                      };
                      if (g = r6, incProgress(), p = g.size > f2, m = g.size > e2.size, !p && !m) return setProgress(100), i2(g);
                      var a3;
                      return w = e2.size, v = g.size, b = v, _ = h, B = !t2.alwaysKeepResolution && p, (a3 = function(e3) {
                        for (; e3; ) {
                          if (e3.then) return void e3.then(a3, o2);
                          try {
                            if (e3.pop) {
                              if (e3.length) return e3.pop() ? $Loop_3_exit.call(this) : e3;
                              e3 = $Loop_3;
                            } else e3 = e3.call(this);
                          } catch (e4) {
                            return o2(e4);
                          }
                        }
                      }.bind(this))($Loop_3);
                    }
                  } catch (u2) {
                    return o2(u2);
                  }
                }.bind(this), o2);
              } catch (e3) {
                return o2(e3);
              }
            }.bind(this), o2);
          } catch (e3) {
            return o2(e3);
          }
        }.bind(this), o2);
      } catch (e3) {
        return o2(e3);
      }
    }.bind(this), o2);
  }));
}
const l = "\nlet scriptImported = false\nself.addEventListener('message', async (e) => {\n  const { file, id, imageCompressionLibUrl, options } = e.data\n  options.onProgress = (progress) => self.postMessage({ progress, id })\n  try {\n    if (!scriptImported) {\n      // console.log('[worker] importScripts', imageCompressionLibUrl)\n      self.importScripts(imageCompressionLibUrl)\n      scriptImported = true\n    }\n    // console.log('[worker] self', self)\n    const compressedFile = await imageCompression(file, options)\n    self.postMessage({ file: compressedFile, id })\n  } catch (e) {\n    // console.error('[worker] error', e)\n    self.postMessage({ error: e.message + '\\n' + e.stack, id })\n  }\n})\n";
let c;
function compressOnWebWorker(e2, t2) {
  return new Promise(((r2, i2) => {
    c || (c = (function createWorkerScriptURL(e3) {
      const t3 = [];
      return t3.push(e3), URL.createObjectURL(new Blob(t3));
    })(l));
    const o2 = new Worker(c);
    o2.addEventListener("message", (function handler(e3) {
      if (t2.signal && t2.signal.aborted) o2.terminate();
      else if (void 0 === e3.data.progress) {
        if (e3.data.error) return i2(new Error(e3.data.error)), void o2.terminate();
        r2(e3.data.file), o2.terminate();
      } else t2.onProgress(e3.data.progress);
    })), o2.addEventListener("error", i2), t2.signal && t2.signal.addEventListener("abort", (() => {
      i2(t2.signal.reason), o2.terminate();
    })), o2.postMessage({ file: e2, imageCompressionLibUrl: t2.libURL, options: { ...t2, onProgress: void 0, signal: void 0 } });
  }));
}
function imageCompression(e2, t2) {
  return new Promise((function(r2, i2) {
    let o2, a2, s2, f2, l2, c2;
    if (o2 = { ...t2 }, s2 = 0, { onProgress: f2 } = o2, o2.maxSizeMB = o2.maxSizeMB || Number.POSITIVE_INFINITY, l2 = "boolean" != typeof o2.useWebWorker || o2.useWebWorker, delete o2.useWebWorker, o2.onProgress = (e3) => {
      s2 = e3, "function" == typeof f2 && f2(s2);
    }, !(e2 instanceof Blob || e2 instanceof CustomFile)) return i2(new Error("The file given is not an instance of Blob or File"));
    if (!/^image/.test(e2.type)) return i2(new Error("The file given is not an image"));
    if (c2 = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope, !l2 || "function" != typeof Worker || c2) return compress(e2, o2).then(function(e3) {
      try {
        return a2 = e3, $If_4.call(this);
      } catch (e4) {
        return i2(e4);
      }
    }.bind(this), i2);
    var u = function() {
      try {
        return $If_4.call(this);
      } catch (e3) {
        return i2(e3);
      }
    }.bind(this), $Try_1_Catch = function(t3) {
      try {
        return compress(e2, o2).then((function(e3) {
          try {
            return a2 = e3, u();
          } catch (e4) {
            return i2(e4);
          }
        }), i2);
      } catch (e3) {
        return i2(e3);
      }
    };
    try {
      return o2.libURL = o2.libURL || "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js", compressOnWebWorker(e2, o2).then((function(e3) {
        try {
          return a2 = e3, u();
        } catch (e4) {
          return $Try_1_Catch();
        }
      }), $Try_1_Catch);
    } catch (e3) {
      $Try_1_Catch();
    }
    function $If_4() {
      try {
        a2.name = e2.name, a2.lastModified = e2.lastModified;
      } catch (e3) {
      }
      try {
        o2.preserveExif && "image/jpeg" === e2.type && (!o2.fileType || o2.fileType && o2.fileType === e2.type) && (a2 = copyExifWithoutOrientation(e2, a2));
      } catch (e3) {
      }
      return r2(a2);
    }
  }));
}
imageCompression.getDataUrlFromFile = getDataUrlFromFile, imageCompression.getFilefromDataUrl = getFilefromDataUrl, imageCompression.loadImage = loadImage, imageCompression.drawImageInCanvas = drawImageInCanvas, imageCompression.drawFileInCanvas = drawFileInCanvas, imageCompression.canvasToFile = canvasToFile, imageCompression.getExifOrientation = getExifOrientation, imageCompression.handleMaxWidthOrHeight = handleMaxWidthOrHeight, imageCompression.followExifOrientation = followExifOrientation, imageCompression.cleanupCanvasMemory = cleanupCanvasMemory, imageCompression.isAutoOrientationInBrowser = isAutoOrientationInBrowser, imageCompression.approximateBelowMaximumCanvasSizeOfBrowser = approximateBelowMaximumCanvasSizeOfBrowser, imageCompression.copyExifWithoutOrientation = copyExifWithoutOrientation, imageCompression.getBrowserName = getBrowserName, imageCompression.version = "2.0.2";
var sparkMd5 = { exports: {} };
var hasRequiredSparkMd5;
function requireSparkMd5() {
  if (hasRequiredSparkMd5) return sparkMd5.exports;
  hasRequiredSparkMd5 = 1;
  (function(module, exports) {
    (function(factory2) {
      {
        module.exports = factory2();
      }
    })(function(undefined$1) {
      var hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
      function md5cycle(x, k) {
        var a2 = x[0], b = x[1], c2 = x[2], d = x[3];
        a2 += (b & c2 | ~b & d) + k[0] - 680876936 | 0;
        a2 = (a2 << 7 | a2 >>> 25) + b | 0;
        d += (a2 & b | ~a2 & c2) + k[1] - 389564586 | 0;
        d = (d << 12 | d >>> 20) + a2 | 0;
        c2 += (d & a2 | ~d & b) + k[2] + 606105819 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d | 0;
        b += (c2 & d | ~c2 & a2) + k[3] - 1044525330 | 0;
        b = (b << 22 | b >>> 10) + c2 | 0;
        a2 += (b & c2 | ~b & d) + k[4] - 176418897 | 0;
        a2 = (a2 << 7 | a2 >>> 25) + b | 0;
        d += (a2 & b | ~a2 & c2) + k[5] + 1200080426 | 0;
        d = (d << 12 | d >>> 20) + a2 | 0;
        c2 += (d & a2 | ~d & b) + k[6] - 1473231341 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d | 0;
        b += (c2 & d | ~c2 & a2) + k[7] - 45705983 | 0;
        b = (b << 22 | b >>> 10) + c2 | 0;
        a2 += (b & c2 | ~b & d) + k[8] + 1770035416 | 0;
        a2 = (a2 << 7 | a2 >>> 25) + b | 0;
        d += (a2 & b | ~a2 & c2) + k[9] - 1958414417 | 0;
        d = (d << 12 | d >>> 20) + a2 | 0;
        c2 += (d & a2 | ~d & b) + k[10] - 42063 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d | 0;
        b += (c2 & d | ~c2 & a2) + k[11] - 1990404162 | 0;
        b = (b << 22 | b >>> 10) + c2 | 0;
        a2 += (b & c2 | ~b & d) + k[12] + 1804603682 | 0;
        a2 = (a2 << 7 | a2 >>> 25) + b | 0;
        d += (a2 & b | ~a2 & c2) + k[13] - 40341101 | 0;
        d = (d << 12 | d >>> 20) + a2 | 0;
        c2 += (d & a2 | ~d & b) + k[14] - 1502002290 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d | 0;
        b += (c2 & d | ~c2 & a2) + k[15] + 1236535329 | 0;
        b = (b << 22 | b >>> 10) + c2 | 0;
        a2 += (b & d | c2 & ~d) + k[1] - 165796510 | 0;
        a2 = (a2 << 5 | a2 >>> 27) + b | 0;
        d += (a2 & c2 | b & ~c2) + k[6] - 1069501632 | 0;
        d = (d << 9 | d >>> 23) + a2 | 0;
        c2 += (d & b | a2 & ~b) + k[11] + 643717713 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d | 0;
        b += (c2 & a2 | d & ~a2) + k[0] - 373897302 | 0;
        b = (b << 20 | b >>> 12) + c2 | 0;
        a2 += (b & d | c2 & ~d) + k[5] - 701558691 | 0;
        a2 = (a2 << 5 | a2 >>> 27) + b | 0;
        d += (a2 & c2 | b & ~c2) + k[10] + 38016083 | 0;
        d = (d << 9 | d >>> 23) + a2 | 0;
        c2 += (d & b | a2 & ~b) + k[15] - 660478335 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d | 0;
        b += (c2 & a2 | d & ~a2) + k[4] - 405537848 | 0;
        b = (b << 20 | b >>> 12) + c2 | 0;
        a2 += (b & d | c2 & ~d) + k[9] + 568446438 | 0;
        a2 = (a2 << 5 | a2 >>> 27) + b | 0;
        d += (a2 & c2 | b & ~c2) + k[14] - 1019803690 | 0;
        d = (d << 9 | d >>> 23) + a2 | 0;
        c2 += (d & b | a2 & ~b) + k[3] - 187363961 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d | 0;
        b += (c2 & a2 | d & ~a2) + k[8] + 1163531501 | 0;
        b = (b << 20 | b >>> 12) + c2 | 0;
        a2 += (b & d | c2 & ~d) + k[13] - 1444681467 | 0;
        a2 = (a2 << 5 | a2 >>> 27) + b | 0;
        d += (a2 & c2 | b & ~c2) + k[2] - 51403784 | 0;
        d = (d << 9 | d >>> 23) + a2 | 0;
        c2 += (d & b | a2 & ~b) + k[7] + 1735328473 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d | 0;
        b += (c2 & a2 | d & ~a2) + k[12] - 1926607734 | 0;
        b = (b << 20 | b >>> 12) + c2 | 0;
        a2 += (b ^ c2 ^ d) + k[5] - 378558 | 0;
        a2 = (a2 << 4 | a2 >>> 28) + b | 0;
        d += (a2 ^ b ^ c2) + k[8] - 2022574463 | 0;
        d = (d << 11 | d >>> 21) + a2 | 0;
        c2 += (d ^ a2 ^ b) + k[11] + 1839030562 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d | 0;
        b += (c2 ^ d ^ a2) + k[14] - 35309556 | 0;
        b = (b << 23 | b >>> 9) + c2 | 0;
        a2 += (b ^ c2 ^ d) + k[1] - 1530992060 | 0;
        a2 = (a2 << 4 | a2 >>> 28) + b | 0;
        d += (a2 ^ b ^ c2) + k[4] + 1272893353 | 0;
        d = (d << 11 | d >>> 21) + a2 | 0;
        c2 += (d ^ a2 ^ b) + k[7] - 155497632 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d | 0;
        b += (c2 ^ d ^ a2) + k[10] - 1094730640 | 0;
        b = (b << 23 | b >>> 9) + c2 | 0;
        a2 += (b ^ c2 ^ d) + k[13] + 681279174 | 0;
        a2 = (a2 << 4 | a2 >>> 28) + b | 0;
        d += (a2 ^ b ^ c2) + k[0] - 358537222 | 0;
        d = (d << 11 | d >>> 21) + a2 | 0;
        c2 += (d ^ a2 ^ b) + k[3] - 722521979 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d | 0;
        b += (c2 ^ d ^ a2) + k[6] + 76029189 | 0;
        b = (b << 23 | b >>> 9) + c2 | 0;
        a2 += (b ^ c2 ^ d) + k[9] - 640364487 | 0;
        a2 = (a2 << 4 | a2 >>> 28) + b | 0;
        d += (a2 ^ b ^ c2) + k[12] - 421815835 | 0;
        d = (d << 11 | d >>> 21) + a2 | 0;
        c2 += (d ^ a2 ^ b) + k[15] + 530742520 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d | 0;
        b += (c2 ^ d ^ a2) + k[2] - 995338651 | 0;
        b = (b << 23 | b >>> 9) + c2 | 0;
        a2 += (c2 ^ (b | ~d)) + k[0] - 198630844 | 0;
        a2 = (a2 << 6 | a2 >>> 26) + b | 0;
        d += (b ^ (a2 | ~c2)) + k[7] + 1126891415 | 0;
        d = (d << 10 | d >>> 22) + a2 | 0;
        c2 += (a2 ^ (d | ~b)) + k[14] - 1416354905 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d | 0;
        b += (d ^ (c2 | ~a2)) + k[5] - 57434055 | 0;
        b = (b << 21 | b >>> 11) + c2 | 0;
        a2 += (c2 ^ (b | ~d)) + k[12] + 1700485571 | 0;
        a2 = (a2 << 6 | a2 >>> 26) + b | 0;
        d += (b ^ (a2 | ~c2)) + k[3] - 1894986606 | 0;
        d = (d << 10 | d >>> 22) + a2 | 0;
        c2 += (a2 ^ (d | ~b)) + k[10] - 1051523 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d | 0;
        b += (d ^ (c2 | ~a2)) + k[1] - 2054922799 | 0;
        b = (b << 21 | b >>> 11) + c2 | 0;
        a2 += (c2 ^ (b | ~d)) + k[8] + 1873313359 | 0;
        a2 = (a2 << 6 | a2 >>> 26) + b | 0;
        d += (b ^ (a2 | ~c2)) + k[15] - 30611744 | 0;
        d = (d << 10 | d >>> 22) + a2 | 0;
        c2 += (a2 ^ (d | ~b)) + k[6] - 1560198380 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d | 0;
        b += (d ^ (c2 | ~a2)) + k[13] + 1309151649 | 0;
        b = (b << 21 | b >>> 11) + c2 | 0;
        a2 += (c2 ^ (b | ~d)) + k[4] - 145523070 | 0;
        a2 = (a2 << 6 | a2 >>> 26) + b | 0;
        d += (b ^ (a2 | ~c2)) + k[11] - 1120210379 | 0;
        d = (d << 10 | d >>> 22) + a2 | 0;
        c2 += (a2 ^ (d | ~b)) + k[2] + 718787259 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d | 0;
        b += (d ^ (c2 | ~a2)) + k[9] - 343485551 | 0;
        b = (b << 21 | b >>> 11) + c2 | 0;
        x[0] = a2 + x[0] | 0;
        x[1] = b + x[1] | 0;
        x[2] = c2 + x[2] | 0;
        x[3] = d + x[3] | 0;
      }
      function md5blk(s2) {
        var md5blks = [], i2;
        for (i2 = 0; i2 < 64; i2 += 4) {
          md5blks[i2 >> 2] = s2.charCodeAt(i2) + (s2.charCodeAt(i2 + 1) << 8) + (s2.charCodeAt(i2 + 2) << 16) + (s2.charCodeAt(i2 + 3) << 24);
        }
        return md5blks;
      }
      function md5blk_array(a2) {
        var md5blks = [], i2;
        for (i2 = 0; i2 < 64; i2 += 4) {
          md5blks[i2 >> 2] = a2[i2] + (a2[i2 + 1] << 8) + (a2[i2 + 2] << 16) + (a2[i2 + 3] << 24);
        }
        return md5blks;
      }
      function md51(s2) {
        var n = s2.length, state2 = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi;
        for (i2 = 64; i2 <= n; i2 += 64) {
          md5cycle(state2, md5blk(s2.substring(i2 - 64, i2)));
        }
        s2 = s2.substring(i2 - 64);
        length = s2.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= s2.charCodeAt(i2) << (i2 % 4 << 3);
        }
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(state2, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state2, tail);
        return state2;
      }
      function md51_array(a2) {
        var n = a2.length, state2 = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi;
        for (i2 = 64; i2 <= n; i2 += 64) {
          md5cycle(state2, md5blk_array(a2.subarray(i2 - 64, i2)));
        }
        a2 = i2 - 64 < n ? a2.subarray(i2 - 64) : new Uint8Array(0);
        length = a2.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= a2[i2] << (i2 % 4 << 3);
        }
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(state2, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state2, tail);
        return state2;
      }
      function rhex(n) {
        var s2 = "", j;
        for (j = 0; j < 4; j += 1) {
          s2 += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
        }
        return s2;
      }
      function hex(x) {
        var i2;
        for (i2 = 0; i2 < x.length; i2 += 1) {
          x[i2] = rhex(x[i2]);
        }
        return x.join("");
      }
      if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592") ;
      if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
        (function() {
          function clamp(val, length) {
            val = val | 0 || 0;
            if (val < 0) {
              return Math.max(val + length, 0);
            }
            return Math.min(val, length);
          }
          ArrayBuffer.prototype.slice = function(from, to) {
            var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
            if (to !== undefined$1) {
              end = clamp(to, length);
            }
            if (begin > end) {
              return new ArrayBuffer(0);
            }
            num = end - begin;
            target = new ArrayBuffer(num);
            targetArray = new Uint8Array(target);
            sourceArray = new Uint8Array(this, begin, num);
            targetArray.set(sourceArray);
            return target;
          };
        })();
      }
      function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
          str = unescape(encodeURIComponent(str));
        }
        return str;
      }
      function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i2;
        for (i2 = 0; i2 < length; i2 += 1) {
          arr[i2] = str.charCodeAt(i2);
        }
        return returnUInt8Array ? arr : buff;
      }
      function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
      }
      function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);
        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);
        return result;
      }
      function hexToBinaryString(hex2) {
        var bytes = [], length = hex2.length, x;
        for (x = 0; x < length - 1; x += 2) {
          bytes.push(parseInt(hex2.substr(x, 2), 16));
        }
        return String.fromCharCode.apply(String, bytes);
      }
      function SparkMD52() {
        this.reset();
      }
      SparkMD52.prototype.append = function(str) {
        this.appendBinary(toUtf8(str));
        return this;
      };
      SparkMD52.prototype.appendBinary = function(contents) {
        this._buff += contents;
        this._length += contents.length;
        var length = this._buff.length, i2;
        for (i2 = 64; i2 <= length; i2 += 64) {
          md5cycle(this._hash, md5blk(this._buff.substring(i2 - 64, i2)));
        }
        this._buff = this._buff.substring(i2 - 64);
        return this;
      };
      SparkMD52.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, i2, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= buff.charCodeAt(i2) << (i2 % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.prototype.reset = function() {
        this._buff = "";
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.prototype.getState = function() {
        return {
          buff: this._buff,
          length: this._length,
          hash: this._hash.slice()
        };
      };
      SparkMD52.prototype.setState = function(state2) {
        this._buff = state2.buff;
        this._length = state2.length;
        this._hash = state2.hash;
        return this;
      };
      SparkMD52.prototype.destroy = function() {
        delete this._hash;
        delete this._buff;
        delete this._length;
      };
      SparkMD52.prototype._finish = function(tail, length) {
        var i2 = length, tmp, lo, hi;
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(this._hash, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
      };
      SparkMD52.hash = function(str, raw) {
        return SparkMD52.hashBinary(toUtf8(str), raw);
      };
      SparkMD52.hashBinary = function(content, raw) {
        var hash = md51(content), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      SparkMD52.ArrayBuffer = function() {
        this.reset();
      };
      SparkMD52.ArrayBuffer.prototype.append = function(arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr), length = buff.length, i2;
        this._length += arr.byteLength;
        for (i2 = 64; i2 <= length; i2 += 64) {
          md5cycle(this._hash, md5blk_array(buff.subarray(i2 - 64, i2)));
        }
        this._buff = i2 - 64 < length ? new Uint8Array(buff.buffer.slice(i2 - 64)) : new Uint8Array(0);
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i2, ret;
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= buff[i2] << (i2 % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.ArrayBuffer.prototype.reset = function() {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.getState = function() {
        var state2 = SparkMD52.prototype.getState.call(this);
        state2.buff = arrayBuffer2Utf8Str(state2.buff);
        return state2;
      };
      SparkMD52.ArrayBuffer.prototype.setState = function(state2) {
        state2.buff = utf8Str2ArrayBuffer(state2.buff, true);
        return SparkMD52.prototype.setState.call(this, state2);
      };
      SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
      SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
      SparkMD52.ArrayBuffer.hash = function(arr, raw) {
        var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      return SparkMD52;
    });
  })(sparkMd5);
  return sparkMd5.exports;
}
var sparkMd5Exports = requireSparkMd5();
const SparkMD5 = /* @__PURE__ */ getDefaultExportFromCjs(sparkMd5Exports);
const __vite_import_meta_env__$1 = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": false, "VITE_API_BASE": "https://yamshatl.onrender.com/api", "VITE_API_URL": "https://yamshatl.onrender.com", "VITE_BACKEND_ORIGIN": "https://yamshatl.onrender.com", "VITE_BRUTE_FORCE_MAX_ATTEMPTS": "5", "VITE_CLOUDINARY_PRESET": "yamshat_preset", "VITE_CLOUDINARY_URL": "https://api.cloudinary.com/v1_1/dux8i95wr/image/upload", "VITE_ENABLE_ANALYTICS": "false", "VITE_ENABLE_E2E_ENCRYPTION": "true", "VITE_ENABLE_IMAGE_OPTIMIZATION": "true", "VITE_FIREBASE_API_KEY": "AIzaSyBZ2DLJ5NHXxf2pEdHL4O4mxXGQOuI4ehI", "VITE_FIREBASE_APP_ID": "1:165115090621:android:1da57af5e4a905998dc9d4", "VITE_FIREBASE_AUTH_DOMAIN": "yamshat-8a74b.firebaseapp.com", "VITE_FIREBASE_MESSAGING_SENDER_ID": "165115090621", "VITE_FIREBASE_PROJECT_ID": "yamshat-8a74b", "VITE_FIREBASE_STORAGE_BUCKET": "yamshat-8a74b.firebasestorage.app", "VITE_LIVEKIT_URL": "wss://yamshat-enqr8c2d.livekit.cloud", "VITE_SOCKET_URL": "https://yamshatl.onrender.com", "VITE_STUN_URL": "stun:stun.relay.metered.ca:80", "VITE_STUN_URLS": "stun:stun.relay.metered.ca:80,stun:stun.l.google.com:19302", "VITE_STUN_URL_FALLBACK": "stun:stun.l.google.com:19302", "VITE_TURN_CREDENTIAL": "sdvCML1r6UIbnKpv", "VITE_TURN_URL": "turn:global.relay.metered.ca:80", "VITE_TURN_URLS": "turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp", "VITE_TURN_URL_FALLBACK": "turn:global.relay.metered.ca:443", "VITE_TURN_URL_TCP": "turns:global.relay.metered.ca:443?transport=tcp", "VITE_TURN_USERNAME": "9c8091d507540c2e0ca3f43a", "VITE_VAPID_PUBLIC_KEY": "m0z2g5XsMfU7d6O5bHNSA4LZX8sSmshWj6MDtZZ7Mqo" };
const trim = (value2) => String(value2 || "").trim();
const trimSlash = (value2) => trim(value2).replace(/\/+$/, "");
const isAbsoluteUrl = (value2 = "") => /^(blob:|data:|https?:)/i.test(trim(value2));
const toAbsoluteMediaUrl = (value2 = "") => {
  const cleaned = trim(value2);
  if (!cleaned) return "";
  if (isAbsoluteUrl(cleaned)) return cleaned;
  const normalizedPath = `/${cleaned.replace(/^\/+/, "")}`;
  if (MEDIA_CDN_BASE) return `${MEDIA_CDN_BASE}${normalizedPath}`;
  if (BACKEND_ORIGIN) return `${trimSlash(BACKEND_ORIGIN)}${normalizedPath}`;
  return normalizedPath;
};
const runtime = typeof window === "undefined" ? {} : window;
const readRuntime = (key, fallback = "") => trim(runtime?.[key] || fallback);
const readEnv = (key, fallback = "") => trim(__vite_import_meta_env__$1[key] || fallback);
const MEDIA_PROVIDER = (readRuntime("APP_MEDIA_PROVIDER") || readRuntime("YAMSHAT_MEDIA_PROVIDER") || readEnv("VITE_MEDIA_PROVIDER") || "cloudflare-r2").toLowerCase();
const MEDIA_CDN_BASE = trimSlash(
  readRuntime("APP_CDN_BASE") || readRuntime("YAMSHAT_CDN_BASE") || readEnv("VITE_CDN_BASE") || ""
);
const SIGNED_URL_TTL_SECONDS = Number(
  readRuntime("APP_SIGNED_URL_TTL_SECONDS") || readRuntime("YAMSHAT_SIGNED_URL_TTL_SECONDS") || readEnv("VITE_SIGNED_URL_TTL_SECONDS") || 900
);
const MEDIA_SECURITY = {
  signedUrls: (readRuntime("APP_MEDIA_SIGNED_URLS") || readEnv("VITE_MEDIA_SIGNED_URLS") || "false") === "true",
  expiringLinks: (readRuntime("APP_MEDIA_EXPIRING_LINKS") || readEnv("VITE_MEDIA_EXPIRING_LINKS") || "false") === "true",
  encryptedUploads: (readRuntime("APP_MEDIA_ENCRYPT_UPLOADS") || readEnv("VITE_MEDIA_ENCRYPT_UPLOADS") || "false") === "true",
  signatureKeyId: readRuntime("APP_MEDIA_KEY_ID") || readEnv("VITE_MEDIA_KEY_ID") || ""
};
const MEDIA_ENDPOINTS = {
  simpleUpload: readRuntime("APP_MEDIA_UPLOAD_URL") || readEnv("VITE_MEDIA_UPLOAD_URL") || "/upload",
  resumableStart: readRuntime("APP_MEDIA_RESUMABLE_START_URL") || readEnv("VITE_MEDIA_RESUMABLE_START_URL") || "/upload/resumable/start",
  resumableStatus: readRuntime("APP_MEDIA_RESUMABLE_STATUS_URL") || readEnv("VITE_MEDIA_RESUMABLE_STATUS_URL") || "/upload/resumable",
  resumableChunk: readRuntime("APP_MEDIA_RESUMABLE_CHUNK_URL") || readEnv("VITE_MEDIA_RESUMABLE_CHUNK_URL") || "/upload/resumable",
  resumableComplete: readRuntime("APP_MEDIA_RESUMABLE_COMPLETE_URL") || readEnv("VITE_MEDIA_RESUMABLE_COMPLETE_URL") || "/upload/resumable",
  signedUrl: readRuntime("APP_MEDIA_SIGNED_URL_ENDPOINT") || readEnv("VITE_MEDIA_SIGNED_URL_ENDPOINT") || "/media/sign-url"
};
const IMAGE_PRESET = {
  format: "image/webp",
  quality: Number(readRuntime("APP_IMAGE_QUALITY") || readEnv("VITE_IMAGE_QUALITY") || 0.82),
  maxWidthOrHeight: Number(readRuntime("APP_IMAGE_MAX_DIMENSION") || readEnv("VITE_IMAGE_MAX_DIMENSION") || 1920),
  maxSizeMB: Number(readRuntime("APP_IMAGE_MAX_SIZE_MB") || readEnv("VITE_IMAGE_MAX_SIZE_MB") || 4)
};
const VIDEO_PRESET = {
  chunkSizeBytes: Number(readRuntime("APP_VIDEO_CHUNK_SIZE") || readEnv("VITE_VIDEO_CHUNK_SIZE") || 5 * 1024 * 1024),
  qualities: (readRuntime("APP_VIDEO_QUALITIES") || readEnv("VITE_VIDEO_QUALITIES") || "1080,720,480").split(",").map((item) => Number(item.trim())).filter(Boolean),
  streamingProfiles: ["hls", "mp4-fallback"],
  thumbnailCount: Number(readRuntime("APP_VIDEO_THUMBNAIL_COUNT") || readEnv("VITE_VIDEO_THUMBNAIL_COUNT") || 1)
};
const FILE_RULES = {
  resumableThresholdBytes: Number(readRuntime("APP_MEDIA_RESUMABLE_THRESHOLD") || readEnv("VITE_MEDIA_RESUMABLE_THRESHOLD") || 5 * 1024 * 1024),
  maxFileSizeBytes: Number(readRuntime("APP_MEDIA_MAX_SIZE") || readEnv("VITE_MEDIA_MAX_SIZE") || 250 * 1024 * 1024),
  allowedMimeTypes: (readRuntime("APP_MEDIA_ALLOWED_TYPES") || readEnv("VITE_MEDIA_ALLOWED_TYPES") || "").split(",").map((item) => item.trim()).filter(Boolean)
};
const PROVIDER_OPTIONS = {
  "cloudflare-r2": {
    label: "Cloudflare R2",
    strengths: ["Storage", "Signed URLs", "S3 compatible API"]
  },
  "aws-s3": {
    label: "AWS S3",
    strengths: ["Multipart upload", "Lifecycle policies", "Transcoding integrations"]
  },
  "bunny-cdn": {
    label: "Bunny CDN",
    strengths: ["Global CDN", "Video streaming edge delivery", "Image optimizer"]
  }
};
const DISAPPEARING_MESSAGE_OPTIONS = [
  { value: 0, label: "بدون" },
  { value: 30, label: "30 ثانية" },
  { value: 300, label: "5 دقائق" },
  { value: 3600, label: "ساعة" },
  { value: 86400, label: "24 ساعة" }
];
function buildSignedMediaUrl(candidate = "", options = {}) {
  const value2 = trim(candidate);
  if (!value2 || /^(blob:|data:)/i.test(value2)) return value2;
  const absolute = toAbsoluteMediaUrl(value2);
  if (!MEDIA_SECURITY.signedUrls) return absolute;
  const ttl = Number(options.expiresIn || SIGNED_URL_TTL_SECONDS);
  const expiresAt = Number(options.expiresAt || Math.floor(Date.now() / 1e3) + ttl);
  const signature = encodeURIComponent(options.signature || `edge-${MEDIA_SECURITY.signatureKeyId}`);
  const separator = absolute.includes("?") ? "&" : "?";
  if (/([?&])(sig|signature|token)=/i.test(absolute)) return absolute;
  return `${absolute}${separator}expires=${expiresAt}&sig=${signature}`;
}
function resolveMediaUrl(candidate = "", options = {}) {
  const value2 = trim(candidate);
  if (!value2) return "";
  if (isAbsoluteUrl(value2)) {
    return MEDIA_SECURITY.signedUrls ? buildSignedMediaUrl(value2, options) : value2;
  }
  const absolute = toAbsoluteMediaUrl(value2);
  return MEDIA_SECURITY.signedUrls ? buildSignedMediaUrl(absolute, options) : absolute;
}
function createUploadSecurityManifest(file, purpose = "chat-attachment") {
  return {
    purpose,
    signed_urls: MEDIA_SECURITY.signedUrls,
    expiring_links: MEDIA_SECURITY.expiringLinks,
    encrypted_uploads: MEDIA_SECURITY.encryptedUploads,
    expires_in_seconds: SIGNED_URL_TTL_SECONDS,
    original_name: file?.name || "",
    original_type: file?.type || "application/octet-stream",
    original_size: Number(file?.size || 0)
  };
}
function currentMediaProviderLabel() {
  return PROVIDER_OPTIONS[MEDIA_PROVIDER]?.label || MEDIA_PROVIDER;
}
const SESSION_PREFIX = "yamshat-media-upload";
const DEFAULT_CHUNK_SIZE = VIDEO_PRESET.chunkSizeBytes || 5 * 1024 * 1024;
const stagePercent = {
  validating: 5,
  optimizing: 20,
  preparing: 35,
  finalizing: 95,
  done: 100
};
function isImage(file) {
  return Boolean(file?.type?.startsWith("image/"));
}
function isVideo(file) {
  return Boolean(file?.type?.startsWith("video/"));
}
function isAudio(file) {
  return Boolean(file?.type?.startsWith("audio/"));
}
function extensionFor(type = "") {
  if (type === "image/webp") return "webp";
  if (type === "audio/ogg") return "ogg";
  if (type === "audio/webm") return "webm";
  return "";
}
function withExtension(name = "upload", ext = "") {
  if (!ext) return name;
  const sanitized = String(name).replace(/\.[^/.]+$/, "");
  return `${sanitized}.${ext}`;
}
function sessionKey(fingerprint = "") {
  return `${SESSION_PREFIX}:${fingerprint}`;
}
function persistSession(fingerprint, payload) {
  if (typeof window === "undefined" || !fingerprint) return;
  window.localStorage.setItem(sessionKey(fingerprint), JSON.stringify(payload));
}
function readSession(fingerprint) {
  if (typeof window === "undefined" || !fingerprint) return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(fingerprint));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearSession(fingerprint) {
  if (typeof window === "undefined" || !fingerprint) return;
  window.localStorage.removeItem(sessionKey(fingerprint));
}
function emitProgress(onProgress, payload) {
  if (typeof onProgress !== "function") return;
  onProgress(payload);
}
async function readChunkAsArrayBuffer(blob) {
  return blob.arrayBuffer();
}
async function computeFingerprint(file, onProgress = () => {
}) {
  const chunkSize = 2 * 1024 * 1024;
  const chunks = Math.max(1, Math.ceil(file.size / chunkSize));
  const spark = new SparkMD5.ArrayBuffer();
  for (let index = 0; index < chunks; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const buffer = await readChunkAsArrayBuffer(file.slice(start, end));
    spark.append(buffer);
    emitProgress(onProgress, {
      stage: "hashing",
      percent: Math.min(35, 25 + Math.round((index + 1) / chunks * 10)),
      chunkIndex: index,
      totalChunks: chunks
    });
  }
  return spark.end();
}
async function extractVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const source = URL.createObjectURL(file);
    video.src = source;
    video.playsInline = true;
    const cleanup = () => {
      URL.revokeObjectURL(source);
    };
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(video.videoWidth || 640, 640);
      canvas.height = Math.max(1, Math.round(canvas.width / Math.max(video.videoWidth || 1, 1) * Math.max(video.videoHeight || 1, 1)));
      const context = canvas.getContext("2d");
      if (!context) {
        cleanup();
        resolve(null);
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        cleanup();
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], withExtension(file.name, "jpg"), { type: "image/jpeg" }));
      }, "image/jpeg", 0.82);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}
function validateFile(file) {
  if (!file) {
    throw new Error("الملف غير صالح.");
  }
  if (FILE_RULES.allowedMimeTypes.length && !FILE_RULES.allowedMimeTypes.includes(file.type)) {
    throw new Error(`نوع الملف ${file.type || "غير معروف"} غير مسموح.`);
  }
  if (file.size > FILE_RULES.maxFileSizeBytes) {
    throw new Error(`حجم الملف أكبر من الحد المسموح (${Math.round(FILE_RULES.maxFileSizeBytes / (1024 * 1024))}MB).`);
  }
}
async function prepareImage(file, onProgress) {
  emitProgress(onProgress, { stage: "optimizing", percent: stagePercent.optimizing, fileName: file.name });
  const optimized = await imageCompression(file, {
    maxSizeMB: IMAGE_PRESET.maxSizeMB,
    maxWidthOrHeight: IMAGE_PRESET.maxWidthOrHeight,
    useWebWorker: false,
    fileType: IMAGE_PRESET.format,
    initialQuality: IMAGE_PRESET.quality,
    alwaysKeepResolution: false,
    onProgress: (value2) => {
      emitProgress(onProgress, {
        stage: "optimizing",
        percent: Math.min(35, 10 + Math.round(value2 * 0.2)),
        fileName: file.name
      });
    }
  });
  const renamed = new File([optimized], withExtension(file.name, extensionFor(IMAGE_PRESET.format)), {
    type: IMAGE_PRESET.format,
    lastModified: Date.now()
  });
  return {
    file: renamed,
    manifest: {
      category: "image",
      provider: MEDIA_PROVIDER,
      optimize: true,
      webp: true,
      resize: IMAGE_PRESET.maxWidthOrHeight,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, "image-upload")
    }
  };
}
async function prepareVideo(file, onProgress) {
  emitProgress(onProgress, { stage: "preparing", percent: stagePercent.preparing, fileName: file.name });
  const thumbnail = await extractVideoThumbnail(file);
  return {
    file,
    thumbnail,
    manifest: {
      category: "video",
      provider: MEDIA_PROVIDER,
      requestedQualities: VIDEO_PRESET.qualities,
      thumbnails: VIDEO_PRESET.thumbnailCount,
      streaming: VIDEO_PRESET.streamingProfiles,
      chunkUpload: true,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, "video-upload")
    }
  };
}
async function prepareAudio(file, onProgress) {
  emitProgress(onProgress, { stage: "preparing", percent: stagePercent.preparing, fileName: file.name });
  return {
    file,
    manifest: {
      category: "audio",
      codec: file.type || "audio/ogg",
      streamingUpload: true,
      cdn: Boolean(MEDIA_CDN_BASE),
      security: createUploadSecurityManifest(file, "audio-upload")
    }
  };
}
async function prepareGenericFile(file, onProgress) {
  emitProgress(onProgress, { stage: "preparing", percent: stagePercent.preparing, fileName: file.name });
  return {
    file,
    manifest: {
      category: "file",
      provider: MEDIA_PROVIDER,
      resumable: file.size >= FILE_RULES.resumableThresholdBytes,
      validation: true,
      progressBar: true,
      resumeUpload: true,
      security: createUploadSecurityManifest(file, "file-upload")
    }
  };
}
function normalizeUploadResponse(response, extra = {}) {
  const data = response?.data?.upload || response?.data || {};
  const rawUrl = data.media_url || data.url || data.file_url || data.path || "";
  const url2 = resolveMediaUrl(rawUrl);
  return {
    ...data,
    ...extra,
    url: url2,
    mediaUrl: url2,
    cdnUrl: url2,
    provider: MEDIA_PROVIDER,
    cdnBase: MEDIA_CDN_BASE,
    secureDelivery: {
      signed: MEDIA_SECURITY.signedUrls,
      expiring: MEDIA_SECURITY.expiringLinks,
      encryptedUpload: MEDIA_SECURITY.encryptedUploads
    }
  };
}
async function uploadSimple(file, manifest, onProgress, extraFields = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("provider", MEDIA_PROVIDER);
  formData.append("manifest", JSON.stringify(manifest));
  Object.entries(extraFields || {}).forEach(([key, value2]) => {
    if (value2 === void 0 || value2 === null) return;
    formData.append(key, typeof value2 === "object" ? JSON.stringify(value2) : value2);
  });
  const response = await API.post(MEDIA_ENDPOINTS.simpleUpload, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      const progress = event.total ? Math.round(event.loaded / event.total * 100) : 0;
      emitProgress(onProgress, {
        stage: "uploading",
        percent: Math.max(stagePercent.preparing, progress),
        loadedBytes: event.loaded,
        totalBytes: event.total || file.size
      });
    }
  });
  emitProgress(onProgress, { stage: "done", percent: stagePercent.done });
  return normalizeUploadResponse(response, { manifest });
}
async function uploadResumable(file, fingerprint, manifest, onProgress, extraFields = {}) {
  const chunkSize = DEFAULT_CHUNK_SIZE;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
  let cached = readSession(fingerprint);
  let sessionId = cached?.sessionId || "";
  let uploadedChunks = cached?.uploadedChunks || [];
  if (!sessionId) {
    try {
      const response2 = await API.post(MEDIA_ENDPOINTS.resumableStart, {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        total_size: file.size,
        total_chunks: totalChunks,
        chunk_size: chunkSize,
        file_hash: fingerprint,
        provider: MEDIA_PROVIDER,
        manifest,
        ...extraFields
      });
      sessionId = response2?.data?.session_id;
      uploadedChunks = response2?.data?.uploaded_chunks || [];
      persistSession(fingerprint, { sessionId, uploadedChunks, fileName: file.name, totalChunks, updatedAt: Date.now() });
    } catch (error) {
      logger.warn("Resumable start failed, falling back to single upload", { message: error?.message, endpoint: MEDIA_ENDPOINTS.resumableStart });
      return uploadSimple(file, manifest, onProgress, extraFields);
    }
  } else {
    try {
      const status = await API.get(`${MEDIA_ENDPOINTS.resumableStatus}/${sessionId}`);
      uploadedChunks = status?.data?.uploaded_chunks || uploadedChunks;
    } catch {
    }
  }
  const uploadedSet = new Set(uploadedChunks);
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    if (uploadedSet.has(chunkIndex)) {
      emitProgress(onProgress, {
        stage: "uploading",
        percent: Math.round((chunkIndex + 1) / totalChunks * 100),
        chunkIndex,
        totalChunks,
        resumed: true
      });
      continue;
    }
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);
    await API.put(`${MEDIA_ENDPOINTS.resumableChunk}/${sessionId}/chunk/${chunkIndex}`, chunk, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Chunk-Start": String(start),
        "X-Chunk-End": String(end),
        "X-File-Hash": fingerprint
      }
    });
    uploadedSet.add(chunkIndex);
    persistSession(fingerprint, {
      sessionId,
      uploadedChunks: Array.from(uploadedSet),
      fileName: file.name,
      totalChunks,
      updatedAt: Date.now()
    });
    emitProgress(onProgress, {
      stage: "uploading",
      percent: Math.round((chunkIndex + 1) / totalChunks * 100),
      chunkIndex,
      totalChunks,
      resumed: Boolean(cached?.sessionId),
      loadedBytes: end,
      totalBytes: file.size
    });
  }
  emitProgress(onProgress, { stage: "finalizing", percent: stagePercent.finalizing });
  const response = await API.post(`${MEDIA_ENDPOINTS.resumableComplete}/${sessionId}/complete`, {
    file_hash: fingerprint,
    manifest,
    ...extraFields
  });
  clearSession(fingerprint);
  emitProgress(onProgress, { stage: "done", percent: stagePercent.done });
  return normalizeUploadResponse(response, { manifest, resumed: Boolean(cached?.sessionId) });
}
class MediaUploadService {
  async prepareFile(file, onProgress = () => {
  }) {
    validateFile(file);
    emitProgress(onProgress, { stage: "validating", percent: stagePercent.validating, fileName: file.name });
    if (isImage(file)) return prepareImage(file, onProgress);
    if (isVideo(file)) return prepareVideo(file, onProgress);
    if (isAudio(file)) return prepareAudio(file, onProgress);
    return prepareGenericFile(file, onProgress);
  }
  async uploadFile(file, options = {}) {
    const onProgress = options?.onProgress || (() => {
    });
    const prepared = await this.prepareFile(file, onProgress);
    const fingerprint = await computeFingerprint(prepared.file, onProgress);
    const extraFields = {
      purpose: options?.purpose || "chat-attachment",
      original_filename: file.name,
      original_size: file.size,
      thumbnail_count: prepared.thumbnail ? 1 : 0,
      attachment_kind: isImage(file) ? "image" : isVideo(file) ? "video" : isAudio(file) ? "audio" : "file",
      upload_security: prepared.manifest?.security || createUploadSecurityManifest(file, options?.purpose || "chat-attachment")
    };
    if (prepared.thumbnail) {
      extraFields.thumbnail_manifest = {
        name: prepared.thumbnail.name,
        type: prepared.thumbnail.type,
        size: prepared.thumbnail.size
      };
    }
    const requiresResumable = prepared.file.size >= FILE_RULES.resumableThresholdBytes || isVideo(prepared.file);
    const upload = requiresResumable ? await uploadResumable(prepared.file, fingerprint, prepared.manifest, onProgress, extraFields) : await uploadSimple(prepared.file, prepared.manifest, onProgress, extraFields);
    return {
      ...upload,
      fingerprint,
      preparedFile: prepared.file,
      thumbnailFile: prepared.thumbnail || null,
      manifest: prepared.manifest,
      optimized: prepared.file !== file,
      mediaType: extraFields.attachment_kind,
      originalName: file.name,
      originalSize: file.size
    };
  }
  async uploadVoiceNote(blob, options = {}) {
    const fileName = options?.fileName || `voice-note-${Date.now()}.ogg`;
    const file = blob instanceof File ? blob : new File([blob], fileName, { type: blob?.type || "audio/ogg" });
    return this.uploadFile(file, {
      ...options,
      purpose: "voice-note"
    });
  }
  validate(file) {
    validateFile(file);
    return true;
  }
}
const mediaUploadService = new MediaUploadService();
const RESUME_KEY_PREFIX = "yamshat-upload-session";
const sessionStorageKey = (file) => `${RESUME_KEY_PREFIX}:${file.name}:${file.size}:${file.lastModified}`;
const getMessages = (receiver, limit = 40, before_id, options = {}) => API.get("/messages", {
  params: { receiver, limit, before_id },
  signal: options.signal,
  cache: Boolean(before_id),
  cacheTtlMs: 8e3
});
const sendMessageApi = (payload) => API.post("/send_message", payload);
const markMessagesSeen = (sender) => API.post("/message_seen", { sender });
const getChatThreads = (options = {}) => API.get("/chat_threads", { signal: options.signal, cache: true, cacheTtlMs: 1e4 });
const getPresence = (username, options = {}) => API.get(`/presence/${encodeURIComponent(username)}`, { signal: options.signal, cache: true, cacheTtlMs: 5e3 });
const getBlockStatus = (username, options = {}) => API.get(`/chat_block_status/${encodeURIComponent(username)}`, { signal: options.signal, cache: true, cacheTtlMs: 15e3 });
const blockUserApi = (username) => API.post("/block_user", { username });
const unblockUserApi = (username) => API.post("/unblock_user", { username });
const deleteMessageApi = (message_id, options = {}) => API.post("/delete_message", { message_id, delete_for_everyone: Boolean(options.delete_for_everyone) });
async function uploadMediaWithResume(file, onProgress = () => {
}) {
  const upload = await mediaUploadService.uploadFile(file, {
    onProgress: (payload) => {
      const percent = typeof payload === "number" ? payload : Number(payload?.percent || 0);
      onProgress(percent);
    }
  });
  const responseShape = {
    upload,
    media_url: upload.mediaUrl,
    url: upload.url,
    cdn_url: upload.cdnUrl,
    manifest: upload.manifest,
    provider: upload.provider
  };
  try {
    window.localStorage.removeItem(sessionStorageKey(file));
  } catch {
  }
  return {
    data: responseShape
  };
}
const restoreMessage = (message_id) => API.post("/restore_message", { message_id });
const __vite_import_meta_env__ = { "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": false, "VITE_API_BASE": "https://yamshatl.onrender.com/api", "VITE_API_URL": "https://yamshatl.onrender.com", "VITE_BACKEND_ORIGIN": "https://yamshatl.onrender.com", "VITE_BRUTE_FORCE_MAX_ATTEMPTS": "5", "VITE_CLOUDINARY_PRESET": "yamshat_preset", "VITE_CLOUDINARY_URL": "https://api.cloudinary.com/v1_1/dux8i95wr/image/upload", "VITE_ENABLE_ANALYTICS": "false", "VITE_ENABLE_E2E_ENCRYPTION": "true", "VITE_ENABLE_IMAGE_OPTIMIZATION": "true", "VITE_FIREBASE_API_KEY": "AIzaSyBZ2DLJ5NHXxf2pEdHL4O4mxXGQOuI4ehI", "VITE_FIREBASE_APP_ID": "1:165115090621:android:1da57af5e4a905998dc9d4", "VITE_FIREBASE_AUTH_DOMAIN": "yamshat-8a74b.firebaseapp.com", "VITE_FIREBASE_MESSAGING_SENDER_ID": "165115090621", "VITE_FIREBASE_PROJECT_ID": "yamshat-8a74b", "VITE_FIREBASE_STORAGE_BUCKET": "yamshat-8a74b.firebasestorage.app", "VITE_LIVEKIT_URL": "wss://yamshat-enqr8c2d.livekit.cloud", "VITE_SOCKET_URL": "https://yamshatl.onrender.com", "VITE_STUN_URL": "stun:stun.relay.metered.ca:80", "VITE_STUN_URLS": "stun:stun.relay.metered.ca:80,stun:stun.l.google.com:19302", "VITE_STUN_URL_FALLBACK": "stun:stun.l.google.com:19302", "VITE_TURN_CREDENTIAL": "sdvCML1r6UIbnKpv", "VITE_TURN_URL": "turn:global.relay.metered.ca:80", "VITE_TURN_URLS": "turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp", "VITE_TURN_URL_FALLBACK": "turn:global.relay.metered.ca:443", "VITE_TURN_URL_TCP": "turns:global.relay.metered.ca:443?transport=tcp", "VITE_TURN_USERNAME": "9c8091d507540c2e0ca3f43a", "VITE_VAPID_PUBLIC_KEY": "m0z2g5XsMfU7d6O5bHNSA4LZX8sSmshWj6MDtZZ7Mqo" };
function readFlag(name, fallback = true) {
  const value2 = __vite_import_meta_env__[name];
  if (value2 === void 0) return fallback;
  return String(value2).trim().toLowerCase() !== "false";
}
const featureFlags = {
  offlineQueue: readFlag("VITE_ENABLE_OFFLINE_QUEUE", true),
  chatCache: readFlag("VITE_ENABLE_CHAT_CACHE", true),
  frontendLogging: readFlag("VITE_ENABLE_FRONTEND_LOGGING", true),
  performanceMetrics: readFlag("VITE_ENABLE_PERFORMANCE_METRICS", true)
};
function fireQueueEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
function useOfflineQueue() {
  const isOnline = useAppStore((state2) => state2.isOnline);
  const queuedActions = useAppStore((state2) => state2.queuedActions);
  const dequeueAction = useAppStore((state2) => state2.dequeueAction);
  const updateQueuedAction = useAppStore((state2) => state2.updateQueuedAction);
  const replaceQueuedActions = useAppStore((state2) => state2.replaceQueuedActions);
  const runningRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!featureFlags.offlineQueue || !isOnline || runningRef.current || queuedActions.length === 0) return;
    window.__YAMSHAT_SW_READY__?.then((registration) => registration?.active?.postMessage?.({ type: "yamshat:queue-sync" })).catch(() => null);
    let cancelled = false;
    runningRef.current = true;
    const flushQueue = async () => {
      logger.info("offline queue flush started", { size: queuedActions.length });
      for (const action of queuedActions) {
        if (cancelled) break;
        if (action?.type !== "chat:send_message" || !action?.payload) {
          dequeueAction(action?.id);
          continue;
        }
        const retryAtMs = action?.nextRetryAt ? new Date(action.nextRetryAt).getTime() : 0;
        if (retryAtMs && retryAtMs > Date.now()) {
          continue;
        }
        try {
          updateQueuedAction(action.id, { lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString() });
          const { data } = await sendMessageApi(action.payload);
          dequeueAction(action.id);
          fireQueueEvent("yamshat:queued-message-sent", {
            queuedId: action.id,
            client_id: action.payload.client_id,
            payload: action.payload,
            response: data?.data || data
          });
          await sleep(120);
        } catch (error) {
          const status = error?.response?.status;
          const attempts = Number(action?.attempts || 0) + 1;
          logger.warn("offline queue item failed", { actionId: action.id, status, attempts });
          if (status && status < 500 && status !== 429) {
            dequeueAction(action.id);
            fireQueueEvent("yamshat:queued-message-failed", {
              queuedId: action.id,
              client_id: action.payload.client_id,
              payload: action.payload,
              error: error?.response?.data?.detail || error?.message || "Queue item failed"
            });
            continue;
          }
          const delayMs = getBackoffDelayMs(attempts - 1, {
            baseDelayMs: status === 429 ? 1400 : 900,
            maxDelayMs: 45e3,
            jitterRatio: 0.4
          });
          updateQueuedAction(action.id, {
            attempts,
            lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString(),
            nextRetryAt: new Date(Date.now() + delayMs).toISOString()
          });
          break;
        }
      }
      runningRef.current = false;
    };
    flushQueue();
    const handleSyncNow = () => {
      replaceQueuedActions([...useAppStore.getState().queuedActions]);
    };
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "yamshat:sync-now") handleSyncNow();
    };
    window.addEventListener("yamshat:sync-now", handleSyncNow);
    navigator.serviceWorker?.addEventListener?.("message", handleServiceWorkerMessage);
    const pendingRetryAt = queuedActions.map((item) => item?.nextRetryAt ? new Date(item.nextRetryAt).getTime() : 0).filter((value2) => value2 > Date.now()).sort((a2, b) => a2 - b)[0];
    const timer = pendingRetryAt ? window.setTimeout(() => {
      replaceQueuedActions([...useAppStore.getState().queuedActions]);
    }, Math.max(250, pendingRetryAt - Date.now() + 50)) : null;
    return () => {
      cancelled = true;
      runningRef.current = false;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("yamshat:sync-now", handleSyncNow);
      navigator.serviceWorker?.removeEventListener?.("message", handleServiceWorkerMessage);
    };
  }, [dequeueAction, isOnline, queuedActions, replaceQueuedActions, updateQueuedAction]);
}
const PUBLIC_PATHS = /* @__PURE__ */ new Set(["/login", "/register", "/verify-email", "/forgot-password", "/reset-password", "/admin", "/admin/login"]);
const REFRESH_EARLY_WINDOW_MS = 6e4;
function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return pathname.startsWith("/reset-password");
}
function redirectToLogin$1(pathname) {
  if (typeof window === "undefined") return;
  const currentPath = getCurrentAppPathname();
  const loginPath = pathname.startsWith("/admin") || currentPath.startsWith("/admin") ? "/admin/login" : "/login";
  redirectToAppPath(loginPath);
}
function useSessionGuard() {
  const location2 = useLocation();
  const setAuthHydrated = useAppStore((state2) => state2.setAuthHydrated);
  const setAuthLoading = useAppStore((state2) => state2.setAuthLoading);
  reactExports.useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setAuthLoading(true);
      try {
        const pathname = location2.pathname;
        const publicPath = isPublicPath(pathname);
        const stored = getStoredUser();
        const token = getAuthToken();
        const shouldAttemptRestore = !publicPath || hasStoredSession();
        if (stored && token && !shouldRefreshSessionSoon(REFRESH_EARLY_WINDOW_MS)) return;
        if (!shouldAttemptRestore) return;
        await sessionManager.refreshSession({
          reason: publicPath ? "public-bootstrap" : "protected-bootstrap",
          force: !publicPath
        });
      } catch {
        if (cancelled) return;
        clearStoredUser();
        if (!isPublicPath(location2.pathname)) redirectToLogin$1(location2.pathname);
      } finally {
        if (!cancelled) {
          setAuthHydrated(true);
          setAuthLoading(false);
        }
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [location2.pathname, setAuthHydrated, setAuthLoading]);
  reactExports.useEffect(() => {
    if (!hasStoredSession()) return void 0;
    const ttl = getSessionTtlMs();
    if (ttl === null) return void 0;
    const refreshIn = Math.max(ttl - REFRESH_EARLY_WINDOW_MS, 5e3);
    const timer = window.setTimeout(async () => {
      try {
        setAuthLoading(true);
        await sessionManager.refreshSession({ reason: "scheduled" });
      } catch {
        clearStoredUser();
        if (!isPublicPath(location2.pathname)) redirectToLogin$1(location2.pathname);
      } finally {
        setAuthHydrated(true);
        setAuthLoading(false);
      }
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [location2.pathname, setAuthHydrated, setAuthLoading]);
}
const ANALYTICS_ENABLED = String("false").toLowerCase() === "true";
const QUEUE_KEY = "yamshat-analytics-queue";
function readQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeQueue(queue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
  }
}
function getAnonymousId() {
  if (typeof window === "undefined") return "server";
  try {
    const key = "yamshat-anonymous-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}
function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "X-Yamshat-Client": "web",
    "X-Session-Id": typeof window === "undefined" ? "server" : window.sessionStorage.getItem("yamshat-session-id") || getAnonymousId(),
    "X-Anonymous-Id": getAnonymousId()
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  return headers;
}
async function sendPayload(payload) {
  if (!ANALYTICS_ENABLED) return false;
  const token = getAuthToken();
  if (!token) return false;
  const endpoint = `${API_BASE}/analytics/events`;
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return true;
    } catch {
    }
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: buildHeaders(),
    body,
    keepalive: true,
    credentials: "include"
  });
  if (!response.ok) throw new Error(`Analytics failed: ${response.status}`);
  return true;
}
async function flushAnalyticsQueue() {
  if (!ANALYTICS_ENABLED || !getAuthToken()) return;
  const queued = readQueue();
  if (!queued.length) return;
  const pending = [...queued];
  writeQueue([]);
  for (const item of pending) {
    try {
      await sendPayload(item);
    } catch {
      writeQueue([...readQueue(), item]);
    }
  }
}
async function trackEvent(eventName, properties = {}, context = {}) {
  if (!ANALYTICS_ENABLED || !getAuthToken()) return false;
  const payload = {
    event_name: eventName,
    category: context.category || "ui",
    route: context.route || (typeof window !== "undefined" ? window.location.pathname : "/"),
    platform: "web",
    anonymous_id: getAnonymousId(),
    properties,
    context
  };
  try {
    await sendPayload(payload);
  } catch {
    writeQueue([...readQueue(), payload]);
  }
}
function trackPageView(route, title = "") {
  return trackEvent("page_view", { title: title || (typeof document !== "undefined" ? document.title : "") }, { category: "navigation", route });
}
function usePageAnalytics() {
  const location2 = useLocation();
  reactExports.useEffect(() => {
    const route = `${location2.pathname}${location2.search || ""}`;
    trackPageView(route).catch(() => null);
  }, [location2.pathname, location2.search]);
  reactExports.useEffect(() => {
    flushAnalyticsQueue().catch(() => null);
    const handleOnline = () => {
      flushAnalyticsQueue().catch(() => null);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
const PACKET_TYPES = /* @__PURE__ */ Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = { type: "error", data: "parser error" };
const withNativeBlob$1 = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
const isView$1 = (obj) => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
const encodePacket = ({ type, data }, supportsBinary, callback) => {
  if (withNativeBlob$1 && data instanceof Blob) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(data, callback);
    }
  } else if (withNativeArrayBuffer$2 && (data instanceof ArrayBuffer || isView$1(data))) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(new Blob([data]), callback);
    }
  }
  return callback(PACKET_TYPES[type] + (data || ""));
};
const encodeBlobAsBase64 = (data, callback) => {
  const fileReader = new FileReader();
  fileReader.onload = function() {
    const content = fileReader.result.split(",")[1];
    callback("b" + (content || ""));
  };
  return fileReader.readAsDataURL(data);
};
function toArray(data) {
  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
}
let TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
  if (withNativeBlob$1 && packet.data instanceof Blob) {
    return packet.data.arrayBuffer().then(toArray).then(callback);
  } else if (withNativeArrayBuffer$2 && (packet.data instanceof ArrayBuffer || isView$1(packet.data))) {
    return callback(toArray(packet.data));
  }
  encodePacket(packet, false, (encoded) => {
    if (!TEXT_ENCODER) {
      TEXT_ENCODER = new TextEncoder();
    }
    callback(TEXT_ENCODER.encode(encoded));
  });
}
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const lookup$1 = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (let i2 = 0; i2 < chars.length; i2++) {
  lookup$1[chars.charCodeAt(i2)] = i2;
}
const decode$1 = (base64) => {
  let bufferLength = base64.length * 0.75, len = base64.length, i2, p = 0, encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
  for (i2 = 0; i2 < len; i2 += 4) {
    encoded1 = lookup$1[base64.charCodeAt(i2)];
    encoded2 = lookup$1[base64.charCodeAt(i2 + 1)];
    encoded3 = lookup$1[base64.charCodeAt(i2 + 2)];
    encoded4 = lookup$1[base64.charCodeAt(i2 + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
};
const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
const decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    return {
      type: "message",
      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
    };
  }
  const packetType = PACKET_TYPES_REVERSE[type];
  if (!packetType) {
    return ERROR_PACKET;
  }
  return encodedPacket.length > 1 ? {
    type: PACKET_TYPES_REVERSE[type],
    data: encodedPacket.substring(1)
  } : {
    type: PACKET_TYPES_REVERSE[type]
  };
};
const decodeBase64Packet = (data, binaryType) => {
  if (withNativeArrayBuffer$1) {
    const decoded = decode$1(data);
    return mapBinary(decoded, binaryType);
  } else {
    return { base64: true, data };
  }
};
const mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "blob":
      if (data instanceof Blob) {
        return data;
      } else {
        return new Blob([data]);
      }
    case "arraybuffer":
    default:
      if (data instanceof ArrayBuffer) {
        return data;
      } else {
        return data.buffer;
      }
  }
};
const SEPARATOR = String.fromCharCode(30);
const encodePayload = (packets, callback) => {
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;
  packets.forEach((packet, i2) => {
    encodePacket(packet, false, (encodedPacket) => {
      encodedPackets[i2] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};
const decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i2 = 0; i2 < encodedPackets.length; i2++) {
    const decodedPacket = decodePacket(encodedPackets[i2], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};
function createPacketEncoderStream() {
  return new TransformStream({
    transform(packet, controller) {
      encodePacketToBinary(packet, (encodedPacket) => {
        const payloadLength = encodedPacket.length;
        let header;
        if (payloadLength < 126) {
          header = new Uint8Array(1);
          new DataView(header.buffer).setUint8(0, payloadLength);
        } else if (payloadLength < 65536) {
          header = new Uint8Array(3);
          const view = new DataView(header.buffer);
          view.setUint8(0, 126);
          view.setUint16(1, payloadLength);
        } else {
          header = new Uint8Array(9);
          const view = new DataView(header.buffer);
          view.setUint8(0, 127);
          view.setBigUint64(1, BigInt(payloadLength));
        }
        if (packet.data && typeof packet.data !== "string") {
          header[0] |= 128;
        }
        controller.enqueue(header);
        controller.enqueue(encodedPacket);
      });
    }
  });
}
let TEXT_DECODER;
function totalLength(chunks) {
  return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
  if (chunks[0].length === size) {
    return chunks.shift();
  }
  const buffer = new Uint8Array(size);
  let j = 0;
  for (let i2 = 0; i2 < size; i2++) {
    buffer[i2] = chunks[0][j++];
    if (j === chunks[0].length) {
      chunks.shift();
      j = 0;
    }
  }
  if (chunks.length && j < chunks[0].length) {
    chunks[0] = chunks[0].slice(j);
  }
  return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
  if (!TEXT_DECODER) {
    TEXT_DECODER = new TextDecoder();
  }
  const chunks = [];
  let state2 = 0;
  let expectedLength = -1;
  let isBinary2 = false;
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
      while (true) {
        if (state2 === 0) {
          if (totalLength(chunks) < 1) {
            break;
          }
          const header = concatChunks(chunks, 1);
          isBinary2 = (header[0] & 128) === 128;
          expectedLength = header[0] & 127;
          if (expectedLength < 126) {
            state2 = 3;
          } else if (expectedLength === 126) {
            state2 = 1;
          } else {
            state2 = 2;
          }
        } else if (state2 === 1) {
          if (totalLength(chunks) < 2) {
            break;
          }
          const headerArray = concatChunks(chunks, 2);
          expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
          state2 = 3;
        } else if (state2 === 2) {
          if (totalLength(chunks) < 8) {
            break;
          }
          const headerArray = concatChunks(chunks, 8);
          const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
          const n = view.getUint32(0);
          if (n > Math.pow(2, 53 - 32) - 1) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
          expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
          state2 = 3;
        } else {
          if (totalLength(chunks) < expectedLength) {
            break;
          }
          const data = concatChunks(chunks, expectedLength);
          controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
          state2 = 0;
        }
        if (expectedLength === 0 || expectedLength > maxPayload) {
          controller.enqueue(ERROR_PACKET);
          break;
        }
      }
    }
  });
}
const protocol = 4;
function Emitter(obj) {
  if (obj) return mixin(obj);
}
function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}
Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
  return this;
};
Emitter.prototype.once = function(event, fn) {
  function on2() {
    this.off(event, on2);
    fn.apply(this, arguments);
  }
  on2.fn = fn;
  this.on(event, on2);
  return this;
};
Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
  this._callbacks = this._callbacks || {};
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }
  var callbacks = this._callbacks["$" + event];
  if (!callbacks) return this;
  if (1 == arguments.length) {
    delete this._callbacks["$" + event];
    return this;
  }
  var cb;
  for (var i2 = 0; i2 < callbacks.length; i2++) {
    cb = callbacks[i2];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i2, 1);
      break;
    }
  }
  if (callbacks.length === 0) {
    delete this._callbacks["$" + event];
  }
  return this;
};
Emitter.prototype.emit = function(event) {
  this._callbacks = this._callbacks || {};
  var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
  for (var i2 = 1; i2 < arguments.length; i2++) {
    args[i2 - 1] = arguments[i2];
  }
  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i2 = 0, len = callbacks.length; i2 < len; ++i2) {
      callbacks[i2].apply(this, args);
    }
  }
  return this;
};
Emitter.prototype.emitReserved = Emitter.prototype.emit;
Emitter.prototype.listeners = function(event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks["$" + event] || [];
};
Emitter.prototype.hasListeners = function(event) {
  return !!this.listeners(event).length;
};
const nextTick = (() => {
  const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
  if (isPromiseAvailable) {
    return (cb) => Promise.resolve().then(cb);
  } else {
    return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
  }
})();
const globalThisShim = (() => {
  if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();
const defaultBinaryType = "arraybuffer";
function createCookieJar() {
}
function pick(obj, ...attr) {
  return attr.reduce((acc, k) => {
    if (obj.hasOwnProperty(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}
const NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
const NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
  if (opts.useNativeTimers) {
    obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
    obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
  } else {
    obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
    obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
  }
}
const BASE64_OVERHEAD = 1.33;
function byteLength(obj) {
  if (typeof obj === "string") {
    return utf8Length(obj);
  }
  return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
  let c2 = 0, length = 0;
  for (let i2 = 0, l2 = str.length; i2 < l2; i2++) {
    c2 = str.charCodeAt(i2);
    if (c2 < 128) {
      length += 1;
    } else if (c2 < 2048) {
      length += 2;
    } else if (c2 < 55296 || c2 >= 57344) {
      length += 3;
    } else {
      i2++;
      length += 4;
    }
  }
  return length;
}
function randomString() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function encode(obj) {
  let str = "";
  for (let i2 in obj) {
    if (obj.hasOwnProperty(i2)) {
      if (str.length)
        str += "&";
      str += encodeURIComponent(i2) + "=" + encodeURIComponent(obj[i2]);
    }
  }
  return str;
}
function decode(qs) {
  let qry = {};
  let pairs = qs.split("&");
  for (let i2 = 0, l2 = pairs.length; i2 < l2; i2++) {
    let pair = pairs[i2].split("=");
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
}
class TransportError extends Error {
  constructor(reason, description, context) {
    super(reason);
    this.description = description;
    this.context = context;
    this.type = "TransportError";
  }
}
class Transport extends Emitter {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(opts) {
    super();
    this.writable = false;
    installTimerFunctions(this, opts);
    this.opts = opts;
    this.query = opts.query;
    this.socket = opts.socket;
    this.supportsBinary = !opts.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(reason, description, context) {
    super.emitReserved("error", new TransportError(reason, description, context));
    return this;
  }
  /**
   * Opens the transport.
   */
  open() {
    this.readyState = "opening";
    this.doOpen();
    return this;
  }
  /**
   * Closes the transport.
   */
  close() {
    if (this.readyState === "opening" || this.readyState === "open") {
      this.doClose();
      this.onClose();
    }
    return this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(packets) {
    if (this.readyState === "open") {
      this.write(packets);
    }
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open";
    this.writable = true;
    super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(data) {
    const packet = decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(packet) {
    super.emitReserved("packet", packet);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(details) {
    this.readyState = "closed";
    super.emitReserved("close", details);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(onPause) {
  }
  createUri(schema, query = {}) {
    return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
  }
  _hostname() {
    const hostname = this.opts.hostname;
    return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
  }
  _port() {
    if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) {
      return ":" + this.opts.port;
    } else {
      return "";
    }
  }
  _query(query) {
    const encodedQuery = encode(query);
    return encodedQuery.length ? "?" + encodedQuery : "";
  }
}
class Polling extends Transport {
  constructor() {
    super(...arguments);
    this._polling = false;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(onPause) {
    this.readyState = "pausing";
    const pause = () => {
      this.readyState = "paused";
      onPause();
    };
    if (this._polling || !this.writable) {
      let total = 0;
      if (this._polling) {
        total++;
        this.once("pollComplete", function() {
          --total || pause();
        });
      }
      if (!this.writable) {
        total++;
        this.once("drain", function() {
          --total || pause();
        });
      }
    } else {
      pause();
    }
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = true;
    this.doPoll();
    this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(data) {
    const callback = (packet) => {
      if ("opening" === this.readyState && packet.type === "open") {
        this.onOpen();
      }
      if ("close" === packet.type) {
        this.onClose({ description: "transport closed by the server" });
        return false;
      }
      this.onPacket(packet);
    };
    decodePayload(data, this.socket.binaryType).forEach(callback);
    if ("closed" !== this.readyState) {
      this._polling = false;
      this.emitReserved("pollComplete");
      if ("open" === this.readyState) {
        this._poll();
      }
    }
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const close = () => {
      this.write([{ type: "close" }]);
    };
    if ("open" === this.readyState) {
      close();
    } else {
      this.once("open", close);
    }
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(packets) {
    this.writable = false;
    encodePayload(packets, (data) => {
      this.doWrite(data, () => {
        this.writable = true;
        this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "https" : "http";
    const query = this.query || {};
    if (false !== this.opts.timestampRequests) {
      query[this.opts.timestampParam] = randomString();
    }
    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
}
let value = false;
try {
  value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
} catch (err) {
}
const hasCORS = value;
function empty() {
}
class BaseXHR extends Polling {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(opts) {
    super(opts);
    if (typeof location !== "undefined") {
      const isSSL = "https:" === location.protocol;
      let port = location.port;
      if (!port) {
        port = isSSL ? "443" : "80";
      }
      this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(data, fn) {
    const req = this.request({
      method: "POST",
      data
    });
    req.on("success", fn);
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr post error", xhrStatus, context);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const req = this.request();
    req.on("data", this.onData.bind(this));
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr poll error", xhrStatus, context);
    });
    this.pollXhr = req;
  }
}
class Request extends Emitter {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(createRequest, uri, opts) {
    super();
    this.createRequest = createRequest;
    installTimerFunctions(this, opts);
    this._opts = opts;
    this._method = opts.method || "GET";
    this._uri = uri;
    this._data = void 0 !== opts.data ? opts.data : null;
    this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var _a2;
    const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    opts.xdomain = !!this._opts.xd;
    const xhr = this._xhr = this.createRequest(opts);
    try {
      xhr.open(this._method, this._uri, true);
      try {
        if (this._opts.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (let i2 in this._opts.extraHeaders) {
            if (this._opts.extraHeaders.hasOwnProperty(i2)) {
              xhr.setRequestHeader(i2, this._opts.extraHeaders[i2]);
            }
          }
        }
      } catch (e2) {
      }
      if ("POST" === this._method) {
        try {
          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (e2) {
        }
      }
      try {
        xhr.setRequestHeader("Accept", "*/*");
      } catch (e2) {
      }
      (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.addCookies(xhr);
      if ("withCredentials" in xhr) {
        xhr.withCredentials = this._opts.withCredentials;
      }
      if (this._opts.requestTimeout) {
        xhr.timeout = this._opts.requestTimeout;
      }
      xhr.onreadystatechange = () => {
        var _a3;
        if (xhr.readyState === 3) {
          (_a3 = this._opts.cookieJar) === null || _a3 === void 0 ? void 0 : _a3.parseCookies(
            // @ts-ignore
            xhr.getResponseHeader("set-cookie")
          );
        }
        if (4 !== xhr.readyState)
          return;
        if (200 === xhr.status || 1223 === xhr.status) {
          this._onLoad();
        } else {
          this.setTimeoutFn(() => {
            this._onError(typeof xhr.status === "number" ? xhr.status : 0);
          }, 0);
        }
      };
      xhr.send(this._data);
    } catch (e2) {
      this.setTimeoutFn(() => {
        this._onError(e2);
      }, 0);
      return;
    }
    if (typeof document !== "undefined") {
      this._index = Request.requestsCount++;
      Request.requests[this._index] = this;
    }
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(err) {
    this.emitReserved("error", err, this._xhr);
    this._cleanup(true);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(fromError) {
    if ("undefined" === typeof this._xhr || null === this._xhr) {
      return;
    }
    this._xhr.onreadystatechange = empty;
    if (fromError) {
      try {
        this._xhr.abort();
      } catch (e2) {
      }
    }
    if (typeof document !== "undefined") {
      delete Request.requests[this._index];
    }
    this._xhr = null;
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const data = this._xhr.responseText;
    if (data !== null) {
      this.emitReserved("data", data);
      this.emitReserved("success");
      this._cleanup();
    }
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
Request.requestsCount = 0;
Request.requests = {};
if (typeof document !== "undefined") {
  if (typeof attachEvent === "function") {
    attachEvent("onunload", unloadHandler);
  } else if (typeof addEventListener === "function") {
    const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
    addEventListener(terminationEvent, unloadHandler, false);
  }
}
function unloadHandler() {
  for (let i2 in Request.requests) {
    if (Request.requests.hasOwnProperty(i2)) {
      Request.requests[i2].abort();
    }
  }
}
const hasXHR2 = (function() {
  const xhr = newRequest({
    xdomain: false
  });
  return xhr && xhr.responseType !== null;
})();
class XHR extends BaseXHR {
  constructor(opts) {
    super(opts);
    const forceBase64 = opts && opts.forceBase64;
    this.supportsBinary = hasXHR2 && !forceBase64;
  }
  request(opts = {}) {
    Object.assign(opts, { xd: this.xd }, this.opts);
    return new Request(newRequest, this.uri(), opts);
  }
}
function newRequest(opts) {
  const xdomain = opts.xdomain;
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e2) {
  }
  if (!xdomain) {
    try {
      return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (e2) {
    }
  }
}
const isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
class BaseWS extends Transport {
  get name() {
    return "websocket";
  }
  doOpen() {
    const uri = this.uri();
    const protocols = this.opts.protocols;
    const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    if (this.opts.extraHeaders) {
      opts.headers = this.opts.extraHeaders;
    }
    try {
      this.ws = this.createSocket(uri, protocols, opts);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this.ws.binaryType = this.socket.binaryType;
    this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      if (this.opts.autoUnref) {
        this.ws._socket.unref();
      }
      this.onOpen();
    };
    this.ws.onclose = (closeEvent) => this.onClose({
      description: "websocket connection closed",
      context: closeEvent
    });
    this.ws.onmessage = (ev) => this.onData(ev.data);
    this.ws.onerror = (e2) => this.onError("websocket error", e2);
  }
  write(packets) {
    this.writable = false;
    for (let i2 = 0; i2 < packets.length; i2++) {
      const packet = packets[i2];
      const lastPacket = i2 === packets.length - 1;
      encodePacket(packet, this.supportsBinary, (data) => {
        try {
          this.doWrite(packet, data);
        } catch (e2) {
        }
        if (lastPacket) {
          nextTick(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    if (typeof this.ws !== "undefined") {
      this.ws.onerror = () => {
      };
      this.ws.close();
      this.ws = null;
    }
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "wss" : "ws";
    const query = this.query || {};
    if (this.opts.timestampRequests) {
      query[this.opts.timestampParam] = randomString();
    }
    if (!this.supportsBinary) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
}
const WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
class WS extends BaseWS {
  createSocket(uri, protocols, opts) {
    return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
  }
  doWrite(_packet, data) {
    this.ws.send(data);
  }
}
class WT extends Transport {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((err) => {
      this.onError("webtransport error", err);
    });
    this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((stream) => {
        const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
        const reader = stream.readable.pipeThrough(decoderStream).getReader();
        const encoderStream = createPacketEncoderStream();
        encoderStream.readable.pipeTo(stream.writable);
        this._writer = encoderStream.writable.getWriter();
        const read = () => {
          reader.read().then(({ done, value: value2 }) => {
            if (done) {
              return;
            }
            this.onPacket(value2);
            read();
          }).catch((err) => {
          });
        };
        read();
        const packet = { type: "open" };
        if (this.query.sid) {
          packet.data = `{"sid":"${this.query.sid}"}`;
        }
        this._writer.write(packet).then(() => this.onOpen());
      });
    });
  }
  write(packets) {
    this.writable = false;
    for (let i2 = 0; i2 < packets.length; i2++) {
      const packet = packets[i2];
      const lastPacket = i2 === packets.length - 1;
      this._writer.write(packet).then(() => {
        if (lastPacket) {
          nextTick(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    var _a2;
    (_a2 = this._transport) === null || _a2 === void 0 ? void 0 : _a2.close();
  }
}
const transports = {
  websocket: WS,
  webtransport: WT,
  polling: XHR
};
const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
const parts = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function parse(str) {
  if (str.length > 8e3) {
    throw "URI too long";
  }
  const src = str, b = str.indexOf("["), e2 = str.indexOf("]");
  if (b != -1 && e2 != -1) {
    str = str.substring(0, b) + str.substring(b, e2).replace(/:/g, ";") + str.substring(e2, str.length);
  }
  let m = re.exec(str || ""), uri = {}, i2 = 14;
  while (i2--) {
    uri[parts[i2]] = m[i2] || "";
  }
  if (b != -1 && e2 != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
    uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
    uri.ipv6uri = true;
  }
  uri.pathNames = pathNames(uri, uri["path"]);
  uri.queryKey = queryKey(uri, uri["query"]);
  return uri;
}
function pathNames(obj, path) {
  const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
  if (path.slice(0, 1) == "/" || path.length === 0) {
    names.splice(0, 1);
  }
  if (path.slice(-1) == "/") {
    names.splice(names.length - 1, 1);
  }
  return names;
}
function queryKey(uri, query) {
  const data = {};
  query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
    if ($1) {
      data[$1] = $2;
    }
  });
  return data;
}
const withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
const OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) {
  addEventListener("offline", () => {
    OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
  }, false);
}
class SocketWithoutUpgrade extends Emitter {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(uri, opts) {
    super();
    this.binaryType = defaultBinaryType;
    this.writeBuffer = [];
    this._prevBufferLen = 0;
    this._pingInterval = -1;
    this._pingTimeout = -1;
    this._maxPayload = -1;
    this._pingTimeoutTime = Infinity;
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = null;
    }
    if (uri) {
      const parsedUri = parse(uri);
      opts.hostname = parsedUri.host;
      opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
      opts.port = parsedUri.port;
      if (parsedUri.query)
        opts.query = parsedUri.query;
    } else if (opts.host) {
      opts.hostname = parse(opts.host).host;
    }
    installTimerFunctions(this, opts);
    this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
    if (opts.hostname && !opts.port) {
      opts.port = this.secure ? "443" : "80";
    }
    this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
    this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
    this.transports = [];
    this._transportsByName = {};
    opts.transports.forEach((t2) => {
      const transportName = t2.prototype.name;
      this.transports.push(transportName);
      this._transportsByName[transportName] = t2;
    });
    this.opts = Object.assign({
      path: "/engine.io",
      agent: false,
      withCredentials: false,
      upgrade: true,
      timestampParam: "t",
      rememberUpgrade: false,
      addTrailingSlash: true,
      rejectUnauthorized: true,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: false
    }, opts);
    this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
    if (typeof this.opts.query === "string") {
      this.opts.query = decode(this.opts.query);
    }
    if (withEventListeners) {
      if (this.opts.closeOnBeforeunload) {
        this._beforeunloadEventListener = () => {
          if (this.transport) {
            this.transport.removeAllListeners();
            this.transport.close();
          }
        };
        addEventListener("beforeunload", this._beforeunloadEventListener, false);
      }
      if (this.hostname !== "localhost") {
        this._offlineEventListener = () => {
          this._onClose("transport close", {
            description: "network connection lost"
          });
        };
        OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
      }
    }
    if (this.opts.withCredentials) {
      this._cookieJar = createCookieJar();
    }
    this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(name) {
    const query = Object.assign({}, this.opts.query);
    query.EIO = protocol;
    query.transport = name;
    if (this.id)
      query.sid = this.id;
    const opts = Object.assign({}, this.opts, {
      query,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[name]);
    return new this._transportsByName[name](opts);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const transportName = this.opts.rememberUpgrade && SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const transport = this.createTransport(transportName);
    transport.open();
    this.setTransport(transport);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(transport) {
    if (this.transport) {
      this.transport.removeAllListeners();
    }
    this.transport = transport;
    transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open";
    SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
    this.emitReserved("open");
    this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(packet) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      this.emitReserved("packet", packet);
      this.emitReserved("heartbeat");
      switch (packet.type) {
        case "open":
          this.onHandshake(JSON.parse(packet.data));
          break;
        case "ping":
          this._sendPacket("pong");
          this.emitReserved("ping");
          this.emitReserved("pong");
          this._resetPingTimeout();
          break;
        case "error":
          const err = new Error("server error");
          err.code = packet.data;
          this._onError(err);
          break;
        case "message":
          this.emitReserved("data", packet.data);
          this.emitReserved("message", packet.data);
          break;
      }
    }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(data) {
    this.emitReserved("handshake", data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this._pingInterval = data.pingInterval;
    this._pingTimeout = data.pingTimeout;
    this._maxPayload = data.maxPayload;
    this.onOpen();
    if ("closed" === this.readyState)
      return;
    this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const delay = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + delay;
    this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, delay);
    if (this.opts.autoUnref) {
      this._pingTimeoutTimer.unref();
    }
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen);
    this._prevBufferLen = 0;
    if (0 === this.writeBuffer.length) {
      this.emitReserved("drain");
    } else {
      this.flush();
    }
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const packets = this._getWritablePackets();
      this.transport.send(packets);
      this._prevBufferLen = packets.length;
      this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
    if (!shouldCheckPayloadSize) {
      return this.writeBuffer;
    }
    let payloadSize = 1;
    for (let i2 = 0; i2 < this.writeBuffer.length; i2++) {
      const data = this.writeBuffer[i2].data;
      if (data) {
        payloadSize += byteLength(data);
      }
      if (i2 > 0 && payloadSize > this._maxPayload) {
        return this.writeBuffer.slice(0, i2);
      }
      payloadSize += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return true;
    const hasExpired = Date.now() > this._pingTimeoutTime;
    if (hasExpired) {
      this._pingTimeoutTime = 0;
      nextTick(() => {
        this._onClose("ping timeout");
      }, this.setTimeoutFn);
    }
    return hasExpired;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(msg, options, fn) {
    this._sendPacket("message", msg, options, fn);
    return this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(msg, options, fn) {
    this._sendPacket("message", msg, options, fn);
    return this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(type, data, options, fn) {
    if ("function" === typeof data) {
      fn = data;
      data = void 0;
    }
    if ("function" === typeof options) {
      fn = options;
      options = null;
    }
    if ("closing" === this.readyState || "closed" === this.readyState) {
      return;
    }
    options = options || {};
    options.compress = false !== options.compress;
    const packet = {
      type,
      data,
      options
    };
    this.emitReserved("packetCreate", packet);
    this.writeBuffer.push(packet);
    if (fn)
      this.once("flush", fn);
    this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const close = () => {
      this._onClose("forced close");
      this.transport.close();
    };
    const cleanupAndClose = () => {
      this.off("upgrade", cleanupAndClose);
      this.off("upgradeError", cleanupAndClose);
      close();
    };
    const waitForUpgrade = () => {
      this.once("upgrade", cleanupAndClose);
      this.once("upgradeError", cleanupAndClose);
    };
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.readyState = "closing";
      if (this.writeBuffer.length) {
        this.once("drain", () => {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }
    return this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(err) {
    SocketWithoutUpgrade.priorWebsocketSuccess = false;
    if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
      this.transports.shift();
      return this._open();
    }
    this.emitReserved("error", err);
    this._onClose("transport error", err);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(reason, description) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      this.transport.removeAllListeners("close");
      this.transport.close();
      this.transport.removeAllListeners();
      if (withEventListeners) {
        if (this._beforeunloadEventListener) {
          removeEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this._offlineEventListener) {
          const i2 = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
          if (i2 !== -1) {
            OFFLINE_EVENT_LISTENERS.splice(i2, 1);
          }
        }
      }
      this.readyState = "closed";
      this.id = null;
      this.emitReserved("close", reason, description);
      this.writeBuffer = [];
      this._prevBufferLen = 0;
    }
  }
}
SocketWithoutUpgrade.protocol = protocol;
class SocketWithUpgrade extends SocketWithoutUpgrade {
  constructor() {
    super(...arguments);
    this._upgrades = [];
  }
  onOpen() {
    super.onOpen();
    if ("open" === this.readyState && this.opts.upgrade) {
      for (let i2 = 0; i2 < this._upgrades.length; i2++) {
        this._probe(this._upgrades[i2]);
      }
    }
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(name) {
    let transport = this.createTransport(name);
    let failed = false;
    SocketWithoutUpgrade.priorWebsocketSuccess = false;
    const onTransportOpen = () => {
      if (failed)
        return;
      transport.send([{ type: "ping", data: "probe" }]);
      transport.once("packet", (msg) => {
        if (failed)
          return;
        if ("pong" === msg.type && "probe" === msg.data) {
          this.upgrading = true;
          this.emitReserved("upgrading", transport);
          if (!transport)
            return;
          SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
          this.transport.pause(() => {
            if (failed)
              return;
            if ("closed" === this.readyState)
              return;
            cleanup();
            this.setTransport(transport);
            transport.send([{ type: "upgrade" }]);
            this.emitReserved("upgrade", transport);
            transport = null;
            this.upgrading = false;
            this.flush();
          });
        } else {
          const err = new Error("probe error");
          err.transport = transport.name;
          this.emitReserved("upgradeError", err);
        }
      });
    };
    function freezeTransport() {
      if (failed)
        return;
      failed = true;
      cleanup();
      transport.close();
      transport = null;
    }
    const onerror = (err) => {
      const error = new Error("probe error: " + err);
      error.transport = transport.name;
      freezeTransport();
      this.emitReserved("upgradeError", error);
    };
    function onTransportClose() {
      onerror("transport closed");
    }
    function onclose() {
      onerror("socket closed");
    }
    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        freezeTransport();
      }
    }
    const cleanup = () => {
      transport.removeListener("open", onTransportOpen);
      transport.removeListener("error", onerror);
      transport.removeListener("close", onTransportClose);
      this.off("close", onclose);
      this.off("upgrading", onupgrade);
    };
    transport.once("open", onTransportOpen);
    transport.once("error", onerror);
    transport.once("close", onTransportClose);
    this.once("close", onclose);
    this.once("upgrading", onupgrade);
    if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
      this.setTimeoutFn(() => {
        if (!failed) {
          transport.open();
        }
      }, 200);
    } else {
      transport.open();
    }
  }
  onHandshake(data) {
    this._upgrades = this._filterUpgrades(data.upgrades);
    super.onHandshake(data);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(upgrades) {
    const filteredUpgrades = [];
    for (let i2 = 0; i2 < upgrades.length; i2++) {
      if (~this.transports.indexOf(upgrades[i2]))
        filteredUpgrades.push(upgrades[i2]);
    }
    return filteredUpgrades;
  }
}
let Socket$1 = class Socket extends SocketWithUpgrade {
  constructor(uri, opts = {}) {
    const o2 = typeof uri === "object" ? uri : opts;
    if (!o2.transports || o2.transports && typeof o2.transports[0] === "string") {
      o2.transports = (o2.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t2) => !!t2);
    }
    super(uri, o2);
  }
};
function url(uri, path = "", loc) {
  let obj = uri;
  loc = loc || typeof location !== "undefined" && location;
  if (null == uri)
    uri = loc.protocol + "//" + loc.host;
  if (typeof uri === "string") {
    if ("/" === uri.charAt(0)) {
      if ("/" === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }
    if (!/^(https?|wss?):\/\//.test(uri)) {
      if ("undefined" !== typeof loc) {
        uri = loc.protocol + "//" + uri;
      } else {
        uri = "https://" + uri;
      }
    }
    obj = parse(uri);
  }
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = "80";
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = "443";
    }
  }
  obj.path = obj.path || "/";
  const ipv6 = obj.host.indexOf(":") !== -1;
  const host = ipv6 ? "[" + obj.host + "]" : obj.host;
  obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
  obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
  return obj;
}
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = (obj) => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
const toString2 = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString2.call(Blob) === "[object BlobConstructor]";
const withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString2.call(File) === "[object FileConstructor]";
function isBinary(obj) {
  return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
}
function hasBinary(obj, toJSON) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i2 = 0, l2 = obj.length; i2 < l2; i2++) {
      if (hasBinary(obj[i2])) {
        return true;
      }
    }
    return false;
  }
  if (isBinary(obj)) {
    return true;
  }
  if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }
  return false;
}
function deconstructPacket(packet) {
  const buffers = [];
  const packetData = packet.data;
  const pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length;
  return { packet: pack, buffers };
}
function _deconstructPacket(data, buffers) {
  if (!data)
    return data;
  if (isBinary(data)) {
    const placeholder = { _placeholder: true, num: buffers.length };
    buffers.push(data);
    return placeholder;
  } else if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i2 = 0; i2 < data.length; i2++) {
      newData[i2] = _deconstructPacket(data[i2], buffers);
    }
    return newData;
  } else if (typeof data === "object" && !(data instanceof Date)) {
    const newData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
    }
    return newData;
  }
  return data;
}
function reconstructPacket(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  delete packet.attachments;
  return packet;
}
function _reconstructPacket(data, buffers) {
  if (!data)
    return data;
  if (data && data._placeholder === true) {
    const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
    if (isIndexValid) {
      return buffers[data.num];
    } else {
      throw new Error("illegal attachments");
    }
  } else if (Array.isArray(data)) {
    for (let i2 = 0; i2 < data.length; i2++) {
      data[i2] = _reconstructPacket(data[i2], buffers);
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }
  }
  return data;
}
const RESERVED_EVENTS$1 = [
  "connect",
  // used on the client side
  "connect_error",
  // used on the client side
  "disconnect",
  // used on both sides
  "disconnecting",
  // used on the server side
  "newListener",
  // used by the Node.js EventEmitter
  "removeListener"
  // used by the Node.js EventEmitter
];
var PacketType;
(function(PacketType2) {
  PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
  PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
  PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
  PacketType2[PacketType2["ACK"] = 3] = "ACK";
  PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
  PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
  PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
class Encoder {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(replacer) {
    this.replacer = replacer;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(obj) {
    if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
      if (hasBinary(obj)) {
        return this.encodeAsBinary({
          type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
          nsp: obj.nsp,
          data: obj.data,
          id: obj.id
        });
      }
    }
    return [this.encodeAsString(obj)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(obj) {
    let str = "" + obj.type;
    if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
      str += obj.attachments + "-";
    }
    if (obj.nsp && "/" !== obj.nsp) {
      str += obj.nsp + ",";
    }
    if (null != obj.id) {
      str += obj.id;
    }
    if (null != obj.data) {
      str += JSON.stringify(obj.data, this.replacer);
    }
    return str;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(obj) {
    const deconstruction = deconstructPacket(obj);
    const pack = this.encodeAsString(deconstruction.packet);
    const buffers = deconstruction.buffers;
    buffers.unshift(pack);
    return buffers;
  }
}
class Decoder extends Emitter {
  /**
   * Decoder constructor
   */
  constructor(opts) {
    super();
    this.opts = Object.assign({
      reviver: void 0,
      maxAttachments: 10
    }, typeof opts === "function" ? { reviver: opts } : opts);
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(obj) {
    let packet;
    if (typeof obj === "string") {
      if (this.reconstructor) {
        throw new Error("got plaintext data when reconstructing a packet");
      }
      packet = this.decodeString(obj);
      const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
      if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
        packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
        this.reconstructor = new BinaryReconstructor(packet);
        if (packet.attachments === 0) {
          super.emitReserved("decoded", packet);
        }
      } else {
        super.emitReserved("decoded", packet);
      }
    } else if (isBinary(obj) || obj.base64) {
      if (!this.reconstructor) {
        throw new Error("got binary data when not reconstructing a packet");
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) {
          this.reconstructor = null;
          super.emitReserved("decoded", packet);
        }
      }
    } else {
      throw new Error("Unknown type: " + obj);
    }
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(str) {
    let i2 = 0;
    const p = {
      type: Number(str.charAt(0))
    };
    if (PacketType[p.type] === void 0) {
      throw new Error("unknown packet type " + p.type);
    }
    if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
      const start = i2 + 1;
      while (str.charAt(++i2) !== "-" && i2 != str.length) {
      }
      const buf = str.substring(start, i2);
      if (buf != Number(buf) || str.charAt(i2) !== "-") {
        throw new Error("Illegal attachments");
      }
      const n = Number(buf);
      if (!isInteger(n) || n < 0) {
        throw new Error("Illegal attachments");
      } else if (n > this.opts.maxAttachments) {
        throw new Error("too many attachments");
      }
      p.attachments = n;
    }
    if ("/" === str.charAt(i2 + 1)) {
      const start = i2 + 1;
      while (++i2) {
        const c2 = str.charAt(i2);
        if ("," === c2)
          break;
        if (i2 === str.length)
          break;
      }
      p.nsp = str.substring(start, i2);
    } else {
      p.nsp = "/";
    }
    const next = str.charAt(i2 + 1);
    if ("" !== next && Number(next) == next) {
      const start = i2 + 1;
      while (++i2) {
        const c2 = str.charAt(i2);
        if (null == c2 || Number(c2) != c2) {
          --i2;
          break;
        }
        if (i2 === str.length)
          break;
      }
      p.id = Number(str.substring(start, i2 + 1));
    }
    if (str.charAt(++i2)) {
      const payload = this.tryParse(str.substr(i2));
      if (Decoder.isPayloadValid(p.type, payload)) {
        p.data = payload;
      } else {
        throw new Error("invalid payload");
      }
    }
    return p;
  }
  tryParse(str) {
    try {
      return JSON.parse(str, this.opts.reviver);
    } catch (e2) {
      return false;
    }
  }
  static isPayloadValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return isObject(payload);
      case PacketType.DISCONNECT:
        return payload === void 0;
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS$1.indexOf(payload[0]) === -1);
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        return Array.isArray(payload);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
      this.reconstructor = null;
    }
  }
}
class BinaryReconstructor {
  constructor(packet) {
    this.packet = packet;
    this.buffers = [];
    this.reconPack = packet;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(binData) {
    this.buffers.push(binData);
    if (this.buffers.length === this.reconPack.attachments) {
      const packet = reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null;
    this.buffers = [];
  }
}
const isInteger = Number.isInteger || function(value2) {
  return typeof value2 === "number" && isFinite(value2) && Math.floor(value2) === value2;
};
function isObject(value2) {
  return Object.prototype.toString.call(value2) === "[object Object]";
}
const parser = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder,
  Encoder,
  get PacketType() {
    return PacketType;
  }
}, Symbol.toStringTag, { value: "Module" }));
function on(obj, ev, fn) {
  obj.on(ev, fn);
  return function subDestroy() {
    obj.off(ev, fn);
  };
}
const RESERVED_EVENTS = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class Socket2 extends Emitter {
  /**
   * `Socket` constructor.
   */
  constructor(io, nsp, opts) {
    super();
    this.connected = false;
    this.recovered = false;
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this._queue = [];
    this._queueSeq = 0;
    this.ids = 0;
    this.acks = {};
    this.flags = {};
    this.io = io;
    this.nsp = nsp;
    if (opts && opts.auth) {
      this.auth = opts.auth;
    }
    this._opts = Object.assign({}, opts);
    if (this.io._autoConnect)
      this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const io = this.io;
    this.subs = [
      on(io, "open", this.onopen.bind(this)),
      on(io, "packet", this.onpacket.bind(this)),
      on(io, "error", this.onerror.bind(this)),
      on(io, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    if (this.connected)
      return this;
    this.subEvents();
    if (!this.io["_reconnecting"])
      this.io.open();
    if ("open" === this.io._readyState)
      this.onopen();
    return this;
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...args) {
    args.unshift("message");
    this.emit.apply(this, args);
    return this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(ev, ...args) {
    var _a2, _b2, _c2;
    if (RESERVED_EVENTS.hasOwnProperty(ev)) {
      throw new Error('"' + ev.toString() + '" is a reserved event name');
    }
    args.unshift(ev);
    if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
      this._addToQueue(args);
      return this;
    }
    const packet = {
      type: PacketType.EVENT,
      data: args
    };
    packet.options = {};
    packet.options.compress = this.flags.compress !== false;
    if ("function" === typeof args[args.length - 1]) {
      const id = this.ids++;
      const ack = args.pop();
      this._registerAckCallback(id, ack);
      packet.id = id;
    }
    const isTransportWritable = (_b2 = (_a2 = this.io.engine) === null || _a2 === void 0 ? void 0 : _a2.transport) === null || _b2 === void 0 ? void 0 : _b2.writable;
    const isConnected = this.connected && !((_c2 = this.io.engine) === null || _c2 === void 0 ? void 0 : _c2._hasPingExpired());
    const discardPacket = this.flags.volatile && !isTransportWritable;
    if (discardPacket) ;
    else if (isConnected) {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }
    this.flags = {};
    return this;
  }
  /**
   * @private
   */
  _registerAckCallback(id, ack) {
    var _a2;
    const timeout = (_a2 = this.flags.timeout) !== null && _a2 !== void 0 ? _a2 : this._opts.ackTimeout;
    if (timeout === void 0) {
      this.acks[id] = ack;
      return;
    }
    const timer = this.io.setTimeoutFn(() => {
      delete this.acks[id];
      for (let i2 = 0; i2 < this.sendBuffer.length; i2++) {
        if (this.sendBuffer[i2].id === id) {
          this.sendBuffer.splice(i2, 1);
        }
      }
      ack.call(this, new Error("operation has timed out"));
    }, timeout);
    const fn = (...args) => {
      this.io.clearTimeoutFn(timer);
      ack.apply(this, args);
    };
    fn.withError = true;
    this.acks[id] = fn;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(ev, ...args) {
    return new Promise((resolve, reject) => {
      const fn = (arg1, arg2) => {
        return arg1 ? reject(arg1) : resolve(arg2);
      };
      fn.withError = true;
      args.push(fn);
      this.emit(ev, ...args);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(args) {
    let ack;
    if (typeof args[args.length - 1] === "function") {
      ack = args.pop();
    }
    const packet = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: false,
      args,
      flags: Object.assign({ fromQueue: true }, this.flags)
    };
    args.push((err, ...responseArgs) => {
      if (packet !== this._queue[0]) ;
      const hasError = err !== null;
      if (hasError) {
        if (packet.tryCount > this._opts.retries) {
          this._queue.shift();
          if (ack) {
            ack(err);
          }
        }
      } else {
        this._queue.shift();
        if (ack) {
          ack(null, ...responseArgs);
        }
      }
      packet.pending = false;
      return this._drainQueue();
    });
    this._queue.push(packet);
    this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(force = false) {
    if (!this.connected || this._queue.length === 0) {
      return;
    }
    const packet = this._queue[0];
    if (packet.pending && !force) {
      return;
    }
    packet.pending = true;
    packet.tryCount++;
    this.flags = packet.flags;
    this.emit.apply(this, packet.args);
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(packet) {
    packet.nsp = this.nsp;
    this.io._packet(packet);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    if (typeof this.auth == "function") {
      this.auth((data) => {
        this._sendConnectPacket(data);
      });
    } else {
      this._sendConnectPacket(this.auth);
    }
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(data) {
    this.packet({
      type: PacketType.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(err) {
    if (!this.connected) {
      this.emitReserved("connect_error", err);
    }
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(reason, description) {
    this.connected = false;
    delete this.id;
    this.emitReserved("disconnect", reason, description);
    this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((id) => {
      const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
      if (!isBuffered) {
        const ack = this.acks[id];
        delete this.acks[id];
        if (ack.withError) {
          ack.call(this, new Error("socket has been disconnected"));
        }
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(packet) {
    const sameNamespace = packet.nsp === this.nsp;
    if (!sameNamespace)
      return;
    switch (packet.type) {
      case PacketType.CONNECT:
        if (packet.data && packet.data.sid) {
          this.onconnect(packet.data.sid, packet.data.pid);
        } else {
          this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
        }
        break;
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        this.onevent(packet);
        break;
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        this.onack(packet);
        break;
      case PacketType.DISCONNECT:
        this.ondisconnect();
        break;
      case PacketType.CONNECT_ERROR:
        this.destroy();
        const err = new Error(packet.data.message);
        err.data = packet.data.data;
        this.emitReserved("connect_error", err);
        break;
    }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(packet) {
    const args = packet.data || [];
    if (null != packet.id) {
      args.push(this.ack(packet.id));
    }
    if (this.connected) {
      this.emitEvent(args);
    } else {
      this.receiveBuffer.push(Object.freeze(args));
    }
  }
  emitEvent(args) {
    if (this._anyListeners && this._anyListeners.length) {
      const listeners2 = this._anyListeners.slice();
      for (const listener of listeners2) {
        listener.apply(this, args);
      }
    }
    super.emit.apply(this, args);
    if (this._pid && args.length && typeof args[args.length - 1] === "string") {
      this._lastOffset = args[args.length - 1];
    }
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(id) {
    const self2 = this;
    let sent = false;
    return function(...args) {
      if (sent)
        return;
      sent = true;
      self2.packet({
        type: PacketType.ACK,
        id,
        data: args
      });
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(packet) {
    const ack = this.acks[packet.id];
    if (typeof ack !== "function") {
      return;
    }
    delete this.acks[packet.id];
    if (ack.withError) {
      packet.data.unshift(null);
    }
    ack.apply(this, packet.data);
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(id, pid) {
    this.id = id;
    this.recovered = pid && this._pid === pid;
    this._pid = pid;
    this.connected = true;
    this.emitBuffered();
    this._drainQueue(true);
    this.emitReserved("connect");
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((args) => this.emitEvent(args));
    this.receiveBuffer = [];
    this.sendBuffer.forEach((packet) => {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    });
    this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy();
    this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    if (this.subs) {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs = void 0;
    }
    this.io["_destroy"](this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    if (this.connected) {
      this.packet({ type: PacketType.DISCONNECT });
    }
    this.destroy();
    if (this.connected) {
      this.onclose("io client disconnect");
    }
    return this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(compress2) {
    this.flags.compress = compress2;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    this.flags.volatile = true;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(timeout) {
    this.flags.timeout = timeout;
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(listener) {
    if (!this._anyListeners) {
      return this;
    }
    if (listener) {
      const listeners2 = this._anyListeners;
      for (let i2 = 0; i2 < listeners2.length; i2++) {
        if (listener === listeners2[i2]) {
          listeners2.splice(i2, 1);
          return this;
        }
      }
    } else {
      this._anyListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(listener) {
    if (!this._anyOutgoingListeners) {
      return this;
    }
    if (listener) {
      const listeners2 = this._anyOutgoingListeners;
      for (let i2 = 0; i2 < listeners2.length; i2++) {
        if (listener === listeners2[i2]) {
          listeners2.splice(i2, 1);
          return this;
        }
      }
    } else {
      this._anyOutgoingListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(packet) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const listeners2 = this._anyOutgoingListeners.slice();
      for (const listener of listeners2) {
        listener.apply(this, packet.data);
      }
    }
  }
}
function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 1e4;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
Backoff.prototype.duration = function() {
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand = Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};
Backoff.prototype.reset = function() {
  this.attempts = 0;
};
Backoff.prototype.setMin = function(min) {
  this.ms = min;
};
Backoff.prototype.setMax = function(max) {
  this.max = max;
};
Backoff.prototype.setJitter = function(jitter) {
  this.jitter = jitter;
};
class Manager extends Emitter {
  constructor(uri, opts) {
    var _a2;
    super();
    this.nsps = {};
    this.subs = [];
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    opts.path = opts.path || "/socket.io";
    this.opts = opts;
    installTimerFunctions(this, opts);
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1e3);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
    this.randomizationFactor((_a2 = opts.randomizationFactor) !== null && _a2 !== void 0 ? _a2 : 0.5);
    this.backoff = new Backoff({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
    this._readyState = "closed";
    this.uri = uri;
    const _parser = opts.parser || parser;
    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this._autoConnect = opts.autoConnect !== false;
    if (this._autoConnect)
      this.open();
  }
  reconnection(v) {
    if (!arguments.length)
      return this._reconnection;
    this._reconnection = !!v;
    if (!v) {
      this.skipReconnect = true;
    }
    return this;
  }
  reconnectionAttempts(v) {
    if (v === void 0)
      return this._reconnectionAttempts;
    this._reconnectionAttempts = v;
    return this;
  }
  reconnectionDelay(v) {
    var _a2;
    if (v === void 0)
      return this._reconnectionDelay;
    this._reconnectionDelay = v;
    (_a2 = this.backoff) === null || _a2 === void 0 ? void 0 : _a2.setMin(v);
    return this;
  }
  randomizationFactor(v) {
    var _a2;
    if (v === void 0)
      return this._randomizationFactor;
    this._randomizationFactor = v;
    (_a2 = this.backoff) === null || _a2 === void 0 ? void 0 : _a2.setJitter(v);
    return this;
  }
  reconnectionDelayMax(v) {
    var _a2;
    if (v === void 0)
      return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v;
    (_a2 = this.backoff) === null || _a2 === void 0 ? void 0 : _a2.setMax(v);
    return this;
  }
  timeout(v) {
    if (!arguments.length)
      return this._timeout;
    this._timeout = v;
    return this;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
      this.reconnect();
    }
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(fn) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new Socket$1(this.uri, this.opts);
    const socket = this.engine;
    const self2 = this;
    this._readyState = "opening";
    this.skipReconnect = false;
    const openSubDestroy = on(socket, "open", function() {
      self2.onopen();
      fn && fn();
    });
    const onError = (err) => {
      this.cleanup();
      this._readyState = "closed";
      this.emitReserved("error", err);
      if (fn) {
        fn(err);
      } else {
        this.maybeReconnectOnOpen();
      }
    };
    const errorSub = on(socket, "error", onError);
    if (false !== this._timeout) {
      const timeout = this._timeout;
      const timer = this.setTimeoutFn(() => {
        openSubDestroy();
        onError(new Error("timeout"));
        socket.close();
      }, timeout);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
    this.subs.push(openSubDestroy);
    this.subs.push(errorSub);
    return this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(fn) {
    return this.open(fn);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup();
    this._readyState = "open";
    this.emitReserved("open");
    const socket = this.engine;
    this.subs.push(
      on(socket, "ping", this.onping.bind(this)),
      on(socket, "data", this.ondata.bind(this)),
      on(socket, "error", this.onerror.bind(this)),
      on(socket, "close", this.onclose.bind(this)),
      // @ts-ignore
      on(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(data) {
    try {
      this.decoder.add(data);
    } catch (e2) {
      this.onclose("parse error", e2);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(packet) {
    nextTick(() => {
      this.emitReserved("packet", packet);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(err) {
    this.emitReserved("error", err);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(nsp, opts) {
    let socket = this.nsps[nsp];
    if (!socket) {
      socket = new Socket2(this, nsp, opts);
      this.nsps[nsp] = socket;
    } else if (this._autoConnect && !socket.active) {
      socket.connect();
    }
    return socket;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(socket) {
    const nsps = Object.keys(this.nsps);
    for (const nsp of nsps) {
      const socket2 = this.nsps[nsp];
      if (socket2.active) {
        return;
      }
    }
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(packet) {
    const encodedPackets = this.encoder.encode(packet);
    for (let i2 = 0; i2 < encodedPackets.length; i2++) {
      this.engine.write(encodedPackets[i2], packet.options);
    }
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((subDestroy) => subDestroy());
    this.subs.length = 0;
    this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = true;
    this._reconnecting = false;
    this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(reason, description) {
    var _a2;
    this.cleanup();
    (_a2 = this.engine) === null || _a2 === void 0 ? void 0 : _a2.close();
    this.backoff.reset();
    this._readyState = "closed";
    this.emitReserved("close", reason, description);
    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const self2 = this;
    if (this.backoff.attempts >= this._reconnectionAttempts) {
      this.backoff.reset();
      this.emitReserved("reconnect_failed");
      this._reconnecting = false;
    } else {
      const delay = this.backoff.duration();
      this._reconnecting = true;
      const timer = this.setTimeoutFn(() => {
        if (self2.skipReconnect)
          return;
        this.emitReserved("reconnect_attempt", self2.backoff.attempts);
        if (self2.skipReconnect)
          return;
        self2.open((err) => {
          if (err) {
            self2._reconnecting = false;
            self2.reconnect();
            this.emitReserved("reconnect_error", err);
          } else {
            self2.onreconnect();
          }
        });
      }, delay);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const attempt = this.backoff.attempts;
    this._reconnecting = false;
    this.backoff.reset();
    this.emitReserved("reconnect", attempt);
  }
}
const cache = {};
function lookup(uri, opts) {
  if (typeof uri === "object") {
    opts = uri;
    uri = void 0;
  }
  opts = opts || {};
  const parsed = url(uri, opts.path || "/socket.io");
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = cache[id] && path in cache[id]["nsps"];
  const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
  let io;
  if (newConnection) {
    io = new Manager(source, opts);
  } else {
    if (!cache[id]) {
      cache[id] = new Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io.socket(parsed.path, opts);
}
Object.assign(lookup, {
  Manager,
  Socket: Socket2,
  io: lookup,
  connect: lookup
});
function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts2 = token.split(".");
  if (parts2.length < 2) return null;
  try {
    const base64 = parts2[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = typeof window !== "undefined" && typeof window.atob === "function" ? window.atob(normalized) : Buffer.from(normalized, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
function randomNonce() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function eventSignature(eventName, nonce, timestamp, tokenJti) {
  const value2 = `${eventName}|${nonce}|${timestamp}|${tokenJti}`;
  let hashed = 2166136261;
  for (const char of value2) {
    hashed ^= char.charCodeAt(0);
    hashed = Math.imul(hashed, 16777619) >>> 0;
  }
  return hashed.toString(16).padStart(8, "0");
}
class SocketManager {
  constructor() {
    this.socket = lookup(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1e3,
      reconnectionDelayMax: 3e4,
      timeout: 2e4,
      auth: this.buildAuthPayload()
    });
    this.offlineQueue = this.readOfflineQueue();
    this.heartbeatInterval = null;
    this.lastHeartbeatAt = 0;
    this.lastPongAt = 0;
    this.lastLatencyMs = null;
    this.eventDeduper = /* @__PURE__ */ new Set();
    this.activeListeners = /* @__PURE__ */ new Map();
    this.setupRobustListeners();
  }
  get connected() {
    return Boolean(this.socket?.connected);
  }
  get id() {
    return this.socket?.id || "";
  }
  readOfflineQueue() {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("socket_offline_queue") || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  persistOfflineQueue() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("socket_offline_queue", JSON.stringify(this.offlineQueue));
    } catch {
    }
  }
  emitBrowserEvent(name, detail = {}) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
  setupRobustListeners() {
    this.socket.on("connect", () => {
      logger.info("Socket connected", { id: this.socket.id });
      this.emitBrowserEvent("yamshat:socket-state", { connected: true, id: this.socket.id, latencyMs: this.lastLatencyMs });
      this.processOfflineQueue();
      this.startHeartbeat();
    });
    this.socket.on("disconnect", (reason) => {
      logger.warn("Socket disconnected", { reason });
      this.emitBrowserEvent("yamshat:socket-state", { connected: false, reason, latencyMs: this.lastLatencyMs });
      this.stopHeartbeat();
      if (reason === "io server disconnect") this.socket.connect();
    });
    this.socket.io.on("reconnect_attempt", (attempt) => {
      const delay = getBackoffDelayMs(attempt, { baseDelayMs: 1e3, maxDelayMs: 3e4 });
      this.socket.io.opts.reconnectionDelay = delay;
      this.emitBrowserEvent("yamshat:socket-state", { connected: false, reconnecting: true, attempt, nextDelayMs: delay });
    });
    this.socket.io.on("reconnect", (attempt) => {
      this.emitBrowserEvent("yamshat:socket-state", { connected: true, reconnecting: false, attempt, latencyMs: this.lastLatencyMs });
    });
    this.socket.on("pong", (payload = {}) => {
      this.lastPongAt = Date.now();
      const serverTs = Number(payload.server_ts || 0);
      this.lastLatencyMs = this.lastHeartbeatAt ? Math.max(Date.now() - this.lastHeartbeatAt, 0) : null;
      this.emitBrowserEvent("yamshat:socket-heartbeat", {
        latencyMs: this.lastLatencyMs,
        lastPongAt: this.lastPongAt,
        serverTs: Number.isFinite(serverTs) ? serverTs : null
      });
    });
    this.socket.on("auth_expired", (payload = {}) => {
      this.emitBrowserEvent("yamshat:toast", { type: "error", title: "انتهت الجلسة", description: payload.detail || "سجّل الدخول مرة تانية." });
    });
  }
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket.connected) return;
      this.lastHeartbeatAt = Date.now();
      this.socket.emit("ping", this.decoratePayload("ping", { ts: this.lastHeartbeatAt }));
    }, 25e3);
  }
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  buildAuthPayload() {
    const token = getAuthToken();
    return token ? { token } : {};
  }
  syncAuth() {
    const authPayload = this.buildAuthPayload();
    this.socket.auth = authPayload;
    if (this.socket.io?.opts) {
      this.socket.io.opts.auth = authPayload;
    }
    return authPayload;
  }
  decoratePayload(eventName, payload = {}) {
    const token = getAuthToken();
    const basePayload = { ...payload || {} };
    if (token && !basePayload.token) basePayload.token = token;
    const jwtPayload = decodeJwtPayload(token);
    const tokenJti = String(jwtPayload?.jti || "").trim();
    if (!tokenJti) return basePayload;
    const timestamp = Date.now();
    const nonce = randomNonce();
    return {
      ...basePayload,
      _ts: timestamp,
      _nonce: nonce,
      _sig: eventSignature(eventName, nonce, timestamp, tokenJti)
    };
  }
  connect() {
    if (!getAuthToken()) return;
    this.syncAuth();
    if (!this.socket.connected) this.socket.connect();
  }
  disconnect() {
    this.stopHeartbeat();
    if (this.socket.connected) this.socket.disconnect();
  }
  cleanup() {
    this.stopHeartbeat();
    this.activeListeners.forEach((listeners2, event) => {
      listeners2.forEach((wrappedHandler) => this.socket.off(event, wrappedHandler));
    });
    this.activeListeners.clear();
    this.eventDeduper.clear();
    if (this.socket.connected) this.socket.disconnect();
  }
  emit(eventName, payload = {}, options = {}) {
    const signedPayload = options?.skipSignature ? payload : this.decoratePayload(eventName, payload);
    if (this.socket.connected) {
      this.socket.emit(eventName, signedPayload);
    } else {
      this.offlineQueue.push({ eventName, payload: signedPayload, ts: Date.now() });
      if (this.offlineQueue.length > 100) this.offlineQueue.shift();
      this.persistOfflineQueue();
    }
  }
  processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    logger.info(`Processing ${this.offlineQueue.length} offline messages`);
    this.offlineQueue.forEach((item) => {
      this.socket.emit(item.eventName, item.payload || {});
    });
    this.offlineQueue = [];
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("socket_offline_queue");
      } catch {
      }
    }
  }
  // Enhanced event subscription with deduplication
  on(event, handler) {
    if (!this.activeListeners.has(event)) {
      this.activeListeners.set(event, /* @__PURE__ */ new Map());
    }
    const listeners2 = this.activeListeners.get(event);
    if (listeners2.has(handler)) {
      return () => this.off(event, handler);
    }
    const wrappedHandler = (data) => {
      const eventId = `${event}-${JSON.stringify(data)}`;
      if (this.eventDeduper.has(eventId)) return;
      this.eventDeduper.add(eventId);
      setTimeout(() => this.eventDeduper.delete(eventId), 1e3);
      handler(data);
    };
    listeners2.set(handler, wrappedHandler);
    this.socket.on(event, wrappedHandler);
    return () => this.off(event, handler);
  }
  off(event, handler) {
    const listeners2 = this.activeListeners.get(event);
    const wrappedHandler = listeners2?.get(handler);
    if (wrappedHandler) {
      this.socket.off(event, wrappedHandler);
      listeners2.delete(handler);
      if (listeners2.size === 0) this.activeListeners.delete(event);
      return;
    }
    this.socket.off(event, handler);
  }
}
const socketManager = new SocketManager();
function useChatRealtime() {
  const currentUser = getCurrentUsername();
  const token = getAuthToken();
  const initialized2 = useChatStore((state2) => state2.initialized);
  const activePeer = useChatStore((state2) => state2.activePeer);
  const hydrateThreads = useChatStore((state2) => state2.hydrateThreads);
  const applyIncomingMessage = useChatStore((state2) => state2.applyIncomingMessage);
  const updateMessageStatus = useChatStore((state2) => state2.updateMessageStatus);
  const setPresence = useChatStore((state2) => state2.setPresence);
  const markThreadRead = useChatStore((state2) => state2.markThreadRead);
  const setLoadingThreads = useChatStore((state2) => state2.setLoadingThreads);
  const activePeerRef = reactExports.useRef(activePeer);
  reactExports.useEffect(() => {
    activePeerRef.current = activePeer;
  }, [activePeer]);
  reactExports.useEffect(() => {
    if (!currentUser || initialized2) return void 0;
    let active = true;
    const bootstrap = async () => {
      setLoadingThreads(true);
      try {
        const { data } = await getChatThreads({});
        if (!active) return;
        hydrateThreads(Array.isArray(data) ? data : [], { replace: true });
      } catch (error) {
        logger.warn("chat threads bootstrap failed", { detail: error?.response?.data?.detail || error?.message });
      } finally {
        if (active) setLoadingThreads(false);
      }
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, [currentUser, hydrateThreads, initialized2, setLoadingThreads]);
  reactExports.useEffect(() => {
    if (!currentUser) return void 0;
    const emitRegister = () => {
      socketManager.emit("register_user", { token, user: currentUser }, { skipSignature: true });
      socketManager.emit("sync_chat_state", { peer: activePeerRef.current || void 0 });
    };
    socketManager.connect();
    emitRegister();
    const handleConnect = () => emitRegister();
    const handleNewMessage = (message) => {
      const participants = [message?.sender, message?.receiver];
      if (!participants.includes(currentUser)) return;
      const peer = message?.sender === currentUser ? message?.receiver : message?.sender;
      applyIncomingMessage(message, currentUser, {
        skipUnreadIncrement: message?.sender !== currentUser && activePeerRef.current === peer
      });
      if (message?.sender !== currentUser && activePeerRef.current === peer) {
        markThreadRead(peer);
      }
    };
    const handleDelivered = (payload) => {
      if (payload?.sender !== currentUser || !payload?.viewer) return;
      updateMessageStatus(payload.viewer, payload.message_ids || [], "delivered");
    };
    const handleSeen = (payload) => {
      if (payload?.sender === currentUser && payload?.viewer) {
        updateMessageStatus(payload.viewer, payload.message_ids || [], "seen");
      }
      if (payload?.viewer === currentUser && payload?.sender) {
        markThreadRead(payload.sender);
      }
    };
    const handlePresence = (payload) => {
      if (!payload?.user) return;
      setPresence(payload.user, payload);
    };
    const handleTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence(payload.sender, {
        is_typing: Boolean(payload?.is_typing),
        typing_updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    socketManager.on("connect", handleConnect);
    socketManager.on("new_private_message", handleNewMessage);
    socketManager.on("messages_delivered", handleDelivered);
    socketManager.on("messages_seen", handleSeen);
    socketManager.on("presence_update", handlePresence);
    socketManager.on("typing_update", handleTyping);
    return () => {
      socketManager.off("connect", handleConnect);
      socketManager.off("new_private_message", handleNewMessage);
      socketManager.off("messages_delivered", handleDelivered);
      socketManager.off("messages_seen", handleSeen);
      socketManager.off("presence_update", handlePresence);
      socketManager.off("typing_update", handleTyping);
    };
  }, [activePeer, applyIncomingMessage, currentUser, markThreadRead, setPresence, token, updateMessageStatus]);
}
const AdminDashboard = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminDashboard })));
const AdminUsers = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminUsers })));
const AdminPosts = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminPosts })));
const AdminNotifications = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminNotifications })));
const AdminLive = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminLive })));
const AdminReports = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminReports })));
const AdminAudit = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminAudit })));
const AdminSettings = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminSettings })));
const AdminRbac = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminRbac })));
const AdminChat = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminChat })));
const AdminStories = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminStories })));
const AdminReels = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminReels })));
const AdminGroups = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-Dd6_3oiF.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0).then((mod) => ({ default: mod.AdminGroups })));
const Login = reactExports.lazy(() => __vitePreload(() => import("./chunks/Login-NlrOaCh5.js"), true ? __vite__mapDeps([13,6,14,4,15,16,2,17]) : void 0));
const AdminLogin = reactExports.lazy(() => __vitePreload(() => import("./chunks/AdminLogin-BI1RUisz.js"), true ? __vite__mapDeps([18,6,14,4,15,16,2]) : void 0));
const Register = reactExports.lazy(() => __vitePreload(() => import("./chunks/Register-9ko6f4fs.js"), true ? __vite__mapDeps([19,6,14,4,15,2,17]) : void 0));
const VerifyEmail = reactExports.lazy(() => __vitePreload(() => import("./chunks/VerifyEmail-DUuLrovR.js"), true ? __vite__mapDeps([20,14,4,21,2,17]) : void 0));
const ForgotPassword = reactExports.lazy(() => __vitePreload(() => import("./chunks/ForgotPassword-DztpGEuA.js"), true ? __vite__mapDeps([22,23,6,14,4,21,2]) : void 0));
const ResetPassword = reactExports.lazy(() => __vitePreload(() => import("./chunks/ResetPassword-DE1xZhOJ.js"), true ? __vite__mapDeps([24,23,6,14,4,21,2]) : void 0));
const Dashboard = reactExports.lazy(() => __vitePreload(() => import("./chunks/Dashboard-DTqWQDR8.js"), true ? __vite__mapDeps([25,26,3,4]) : void 0));
const LiveStreamDashboard = reactExports.lazy(() => __vitePreload(() => import("./chunks/LiveStreamDashboard-bWZ8vle4.js"), true ? [] : void 0));
const Feed = reactExports.lazy(() => __vitePreload(() => import("./chunks/FeedEnhanced-CQai_Bwi.js"), true ? __vite__mapDeps([27,26,28,3,4,11,9,8,29,30,31,32]) : void 0));
const Stories = reactExports.lazy(() => __vitePreload(() => import("./chunks/Stories-Zjs-i32I.js"), true ? __vite__mapDeps([33,26,3,4,7,10]) : void 0));
const Reels = reactExports.lazy(() => __vitePreload(() => import("./chunks/Reels-IJ25LLrB.js"), true ? __vite__mapDeps([34,26,7,35,11,5,31]) : void 0));
const Groups = reactExports.lazy(() => __vitePreload(() => import("./chunks/Groups-B0zWdCBA.js"), true ? __vite__mapDeps([36,26,3,4,7,8,12]) : void 0));
const Live = reactExports.lazy(() => __vitePreload(() => import("./chunks/Live-CZJY28ex.js"), true ? __vite__mapDeps([37,26,30,32]) : void 0));
const Inbox = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-0yg0Tg4W.js"), true ? __vite__mapDeps([38,39,26,3,4,32,40]) : void 0).then((mod) => ({ default: mod.Inbox })));
const Users = reactExports.lazy(() => __vitePreload(() => import("./chunks/Users-D9DSbSbV.js"), true ? __vite__mapDeps([41,26,3,4,7,6,8,9,29,1,31]) : void 0));
const Profile = reactExports.lazy(() => __vitePreload(() => import("./chunks/Profile-S6xDfnht.js"), true ? __vite__mapDeps([42,26,3,4,7,29]) : void 0));
const Chat = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-0yg0Tg4W.js"), true ? __vite__mapDeps([38,39,26,3,4,32,40]) : void 0).then((mod) => ({ default: mod.Chat })));
const Notifications = reactExports.lazy(() => __vitePreload(() => import("./chunks/index-DTYjTy3_.js").then((n) => n.i), true ? __vite__mapDeps([43,26,3,4,7,35]) : void 0).then((mod) => ({ default: mod.Notifications })));
const Search = reactExports.lazy(() => __vitePreload(() => import("./chunks/Search-BoqShEOu.js"), true ? __vite__mapDeps([44,26,3,4,6,8,9,11,29,31,35]) : void 0));
const Settings = reactExports.lazy(() => __vitePreload(() => import("./chunks/Settings-CJD-CfKa.js"), true ? __vite__mapDeps([45,26,3,4]) : void 0));
function AppGuards() {
  useNetworkStatus();
  useSessionGuard();
  useOfflineQueue();
  usePageAnalytics();
  useChatRealtime();
  const theme = useAppStore((state2) => state2.theme);
  const language = useAppStore((state2) => state2.language);
  const activeRequests = useAppStore((state2) => state2.activeRequests);
  reactExports.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  reactExports.useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  }, [language]);
  reactExports.useEffect(() => {
    const timers = /* @__PURE__ */ new WeakMap();
    const clickableSelector = "button, a.btn, .mini-action, .ghost-btn, .reaction-btn, .table-link, .story-user-card";
    const handlePointerFeedback = (event) => {
      const target = event.target instanceof Element ? event.target.closest(clickableSelector) : null;
      if (!target) return;
      const isDisabled = target.matches?.(":disabled") || target.getAttribute("aria-disabled") === "true";
      if (isDisabled || target.getAttribute("aria-busy") === "true" || target.dataset.busy === "true") return;
      target.dataset.autoBusy = "true";
      const activeTimer = timers.get(target);
      if (activeTimer) window.clearTimeout(activeTimer);
      const nextTimer = window.setTimeout(() => {
        delete target.dataset.autoBusy;
      }, 650);
      timers.set(target, nextTimer);
    };
    document.addEventListener("click", handlePointerFeedback, true);
    return () => {
      document.removeEventListener("click", handlePointerFeedback, true);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppStatusBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(InstallPrompt, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OfflineExperience, {}),
    activeRequests > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "global-progress-bar" }) : null
  ] });
}
function RouteFallback() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RoutePageSkeleton, {});
}
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ToastProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AppErrorBoundary, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppGuards, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(RouteFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Login, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/register", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Register, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/verify-email", element: /* @__PURE__ */ jsxRuntimeExports.jsx(VerifyEmail, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/forgot-password", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ForgotPassword, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/reset-password", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ResetPassword, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/admin/login", replace: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLogin, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/register", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/register", replace: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Feed, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/livestream-dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LiveStreamDashboard, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/stories", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Stories, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/reels", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Reels, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/groups", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Groups, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/live", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Live, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/inbox", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/users", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/profile", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Profile, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/notifications", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Notifications, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/search", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/settings", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/profile/:username", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Profile, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chat, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat/:userId", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chat, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "dashboard.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminDashboard, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/users", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "users.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminUsers, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/rbac", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "rbac.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminRbac, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/posts", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "posts.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminPosts, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/content", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/admin/posts", replace: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/notifications", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "notifications.manage", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminNotifications, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/live", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "live.manage", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLive, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/reports", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "reports.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminReports, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/audit", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "dashboard.view", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminAudit, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/settings", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredPermission: "settings.manage", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminSettings, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminChat, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/stories", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminStories, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/reels", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminReels, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/groups", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminGroups, {}) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true }) })
    ] }) })
  ] }) });
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 6e4,
      gcTime: 10 * 6e4,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if ([400, 401, 403, 404, 422].includes(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: false,
      networkMode: "offlineFirst",
      structuralSharing: true
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst"
    }
  }
});
const RealtimeContext = reactExports.createContext({
  socket: socketManager,
  connected: false,
  socketId: ""
});
function redirectToLogin() {
  if (typeof window === "undefined") return;
  const currentPath = getCurrentAppPathname();
  const loginPath = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
  redirectToAppPath(loginPath);
}
function RealtimeProvider({ children }) {
  const session = useAppStore((state2) => state2.session);
  const [connected, setConnected] = reactExports.useState(socketManager.connected);
  const [socketId, setSocketId] = reactExports.useState(socketManager.id || "");
  reactExports.useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setSocketId(socketManager.id || "");
    };
    const handleDisconnect = () => {
      setConnected(false);
      setSocketId("");
    };
    const handleAuthExpired = () => {
      logger.warn("realtime auth expired, clearing session");
      clearStoredUser();
      redirectToLogin();
    };
    const disposeConnect = socketManager.on("connect", handleConnect);
    const disposeDisconnect = socketManager.on("disconnect", handleDisconnect);
    const disposeAuthExpired = socketManager.on("auth_expired", handleAuthExpired);
    return () => {
      disposeConnect?.();
      disposeDisconnect?.();
      disposeAuthExpired?.();
    };
  }, []);
  reactExports.useEffect(() => {
    if (session?.access_token || session?.token) {
      socketManager.syncAuth();
      socketManager.connect();
      return void 0;
    }
    socketManager.disconnect();
    return void 0;
  }, [session?.access_token, session?.token, session?.username, session?.role]);
  const value2 = reactExports.useMemo(() => ({ socket: socketManager, connected, socketId }), [connected, socketId]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RealtimeContext.Provider, { value: value2, children });
}
let initialized$1 = false;
function canUseWindow() {
  return typeof window !== "undefined";
}
function perfStore() {
  if (!canUseWindow()) return null;
  if (!window.__YAMSHAT_PERF__) {
    window.__YAMSHAT_PERF__ = {
      metrics: [],
      longTasks: 0,
      cdnHits: 0,
      lastMemorySample: null,
      startedAt: Date.now()
    };
  }
  return window.__YAMSHAT_PERF__;
}
function pushMetric(metric) {
  const store = perfStore();
  if (!store || !featureFlags.performanceMetrics) return;
  store.metrics.push({ ...metric, recordedAt: (/* @__PURE__ */ new Date()).toISOString() });
  if (store.metrics.length > 60) store.metrics.splice(0, store.metrics.length - 60);
  window.dispatchEvent(new CustomEvent("yamshat:performance-metric", { detail: metric }));
}
const getOptimizedImageUrl = (url2, width = 800, quality = 80, format = "webp") => {
  if (!url2) return "";
  const target = String(url2);
  if (!CDN_BASE && !target.includes("cdn.")) return target;
  const separator = target.includes("?") ? "&" : "?";
  if (/[?&](w|width)=/i.test(target)) return target;
  return `${target}${separator}w=${width}&q=${quality}&fmt=${format}`;
};
const getMediaDeliveryProfile = (kind = "image") => {
  if (kind === "video") {
    return {
      preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
      ttl: "7d",
      strategy: "edge-cache + adaptive bitrate + signed playback URLs"
    };
  }
  if (kind === "file") {
    return {
      preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
      ttl: "24h",
      strategy: "download acceleration + regional edge caching"
    };
  }
  return {
    preferredCdn: CDN_BASE || "https://cdn.yamshat.com",
    ttl: "30d",
    strategy: "image resize on edge + webp/avif negotiation"
  };
};
const getCDNConfig = () => ({
  baseUrl: CDN_BASE || "https://cdn.yamshat.com",
  regions: ["mea", "eu", "us", "apac"],
  cacheControl: "public, max-age=31536000, stale-while-revalidate=86400, immutable",
  acceleration: ["images", "video segments", "downloads"],
  signedDelivery: true
});
function observePerformanceEntries() {
  if (!canUseWindow() || typeof PerformanceObserver === "undefined" || !featureFlags.performanceMetrics) return;
  const safeObserve = (type, handler) => {
    try {
      const observer = new PerformanceObserver((list) => handler(list.getEntries()));
      observer.observe({ type, buffered: true });
    } catch {
    }
  };
  safeObserve("largest-contentful-paint", (entries) => {
    const entry = entries.at(-1);
    if (entry) pushMetric({ type: "lcp", value: Math.round(entry.startTime) });
  });
  safeObserve("layout-shift", (entries) => {
    let score = 0;
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) score += entry.value || 0;
    });
    if (score > 0) pushMetric({ type: "cls", value: Number(score.toFixed(4)) });
  });
  safeObserve("resource", (entries) => {
    const cdnEntries = entries.filter((entry) => String(entry.name || "").includes(CDN_BASE || "cdn."));
    const store = perfStore();
    if (store) store.cdnHits += cdnEntries.length;
    if (cdnEntries.length) pushMetric({ type: "cdn-hit", count: cdnEntries.length });
  });
}
function sampleMemory() {
  if (!canUseWindow() || !featureFlags.performanceMetrics) return;
  const store = perfStore();
  const memory = window.performance?.memory;
  if (!store || !memory) return;
  store.lastMemorySample = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
    window.dispatchEvent(new CustomEvent("yamshat:memory-critical"));
  }
}
function ensurePreconnect(url2) {
  if (!canUseWindow()) return;
  const value2 = String(url2 || "").trim();
  if (!/^https?:\/\//i.test(value2)) return;
  if (document.head.querySelector(`link[data-preconnect="${value2}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = value2;
  link.crossOrigin = "anonymous";
  link.dataset.preconnect = value2;
  document.head.appendChild(link);
}
function initializePerformanceToolkit({ registration = null } = {}) {
  if (initialized$1 || !canUseWindow()) return;
  initialized$1 = true;
  ensurePreconnect(BACKEND_ORIGIN);
  ensurePreconnect(CDN_BASE || "https://cdn.yamshat.com");
  observePerformanceEntries();
  sampleMemory();
  if (registration?.active) {
    pushMetric({ type: "sw-active", value: 1 });
  }
  window.setInterval(sampleMemory, 6e4);
}
let initialized = false;
function report(kind, payload = {}) {
  if (!featureFlags.frontendLogging) return;
  logger.error(`frontend runtime ${kind}`, payload);
}
function initializeRuntimeErrorCapture() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("error", (event) => {
    report("error", {
      message: event?.message,
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
      stack: event?.error?.stack
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    report("unhandledrejection", {
      reason: event?.reason?.message || String(event?.reason || ""),
      stack: event?.reason?.stack
    });
  });
}
const shownNotificationIds = /* @__PURE__ */ new Set();
function resolveNotificationPath(notification) {
  const payload = notification?.payload || notification?.data || {};
  if (typeof payload?.path === "string" && payload.path.trim()) return payload.path.trim();
  if (typeof notification?.path === "string" && notification.path.trim()) return notification.path.trim();
  const screen = String(payload?.screen || notification?.screen || "").toLowerCase();
  if (screen === "chat") return "/inbox";
  if (screen === "notifications") return "/notifications";
  if (screen === "live") return "/live";
  if (screen === "groups") return "/groups";
  if (screen === "users") return "/users";
  if (screen === "profile") {
    const username = payload?.username || payload?.target_username || notification?.username;
    return username ? `/profile/${encodeURIComponent(username)}` : "/profile";
  }
  return "/notifications";
}
function normalizeNotification(item) {
  if (!item) {
    return {
      id: "temp-empty",
      title: "إشعار",
      body: "لا توجد بيانات متاحة.",
      seen: true,
      created_at: null,
      payload: {},
      path: "/notifications"
    };
  }
  const payload = item?.payload || item?.data || {};
  const title = item?.title || payload?.title || "إشعار جديد";
  const body = item?.body || item?.message || item?.text || payload?.body || "وصلك تحديث جديد داخل يمشات.";
  const seen2 = Boolean(item?.seen ?? item?.is_read ?? item?.read);
  return {
    ...item,
    id: item?.id || `${title}-${body}-${item?.created_at || Date.now()}`,
    title,
    body,
    seen: seen2,
    payload,
    path: resolveNotificationPath({ ...item, payload })
  };
}
function browserNotificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}
async function serviceWorkerNotification(notification) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(notification.title, {
    body: notification.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: `yamshat:${notification.id}`,
    data: {
      path: notification.path,
      notification
    }
  });
  return true;
}
async function maybeShowBrowserNotification(item) {
  if (!browserNotificationsSupported()) return false;
  if (document.visibilityState === "visible") return false;
  if (window.Notification.permission !== "granted") return false;
  const notification = normalizeNotification(item);
  if (shownNotificationIds.has(String(notification.id))) return false;
  shownNotificationIds.add(String(notification.id));
  try {
    await serviceWorkerNotification(notification);
    return true;
  } catch {
    const native = new window.Notification(notification.title, {
      body: notification.body,
      icon: "/icons/icon-192.png",
      tag: `yamshat:${notification.id}`,
      data: { path: notification.path }
    });
    native.onclick = () => {
      window.focus();
      redirectToAppPath(notification.path || "/notifications", { replace: false });
      native.close();
    };
    return true;
  }
}
const STORAGE_KEY = "yamshat_notifications";
const BATCH_DELAY_MS = 300;
const CACHE_TTL_MS = 5 * 60 * 1e3;
const MAX_STORED_NOTIFICATIONS = 500;
function sortNotifications(items = []) {
  return [...items].sort((a2, b) => new Date(b?.created_at || 0) - new Date(a2?.created_at || 0));
}
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const { items, timestamp } = JSON.parse(stored);
    const age = Date.now() - timestamp;
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return items || [];
  } catch (error) {
    console.warn("Failed to load notifications from storage:", error);
    return null;
  }
}
function saveToStorage(items) {
  try {
    const limited = items.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: limited,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn("Failed to save notifications to storage:", error);
  }
}
function deduplicateNotifications(items = []) {
  const map = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const normalized = normalizeNotification(item);
    const key = String(normalized.id);
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        ...normalized,
        // Preserve seen status if already marked as seen
        seen: existing.seen || normalized.seen,
        is_read: existing.is_read || normalized.is_read
      });
    } else {
      map.set(key, normalized);
    }
  });
  return [...map.values()];
}
const useNotificationStore = create$1((set, get) => {
  let batchTimer = null;
  let pendingBatch = [];
  const processBatch = () => {
    if (pendingBatch.length === 0) return;
    set((state2) => {
      const allItems = [...state2.items, ...pendingBatch];
      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);
      saveToStorage(sorted);
      return {
        items: sorted,
        initialized: true,
        error: ""
      };
    });
    pendingBatch = [];
  };
  const scheduleBatch = () => {
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = setTimeout(processBatch, BATCH_DELAY_MS);
  };
  return {
    initialized: false,
    loading: false,
    error: "",
    items: [],
    cacheTimestamp: null,
    /**
     * Sets loading state
     */
    setLoading: (loading) => set({ loading: Boolean(loading) }),
    /**
     * Sets error state
     */
    setError: (error = "") => set({ error }),
    /**
     * Hydrates notifications from API with deduplication and persistence
     */
    hydrateNotifications: (items = [], options = {}) => set((state2) => {
      const replace = options.replace !== false;
      let allItems = [];
      if (!replace) {
        allItems = [...state2.items, ...items];
      } else {
        allItems = items;
      }
      const deduplicated = deduplicateNotifications(allItems);
      const sorted = sortNotifications(deduplicated);
      saveToStorage(sorted);
      return {
        items: sorted,
        initialized: true,
        error: "",
        cacheTimestamp: Date.now()
      };
    }),
    /**
     * Adds a single notification with batching
     */
    upsertNotification: (item) => {
      pendingBatch.push(item);
      scheduleBatch();
    },
    /**
     * Adds multiple notifications with batching
     */
    upsertNotifications: (items = []) => {
      pendingBatch.push(...items);
      scheduleBatch();
    },
    /**
     * Marks a single notification as read
     */
    markRead: (notificationId, nextValues = {}) => set((state2) => {
      const updated = state2.items.map((item) => String(item.id) === String(notificationId) ? normalizeNotification({ ...item, ...nextValues, seen: true, is_read: true }) : item);
      saveToStorage(updated);
      return { items: updated };
    }),
    /**
     * Marks all notifications as read
     */
    markAllRead: () => set((state2) => {
      const updated = state2.items.map(
        (item) => normalizeNotification({ ...item, seen: true, is_read: true })
      );
      saveToStorage(updated);
      return { items: updated };
    }),
    /**
     * Removes a notification
     */
    removeNotification: (notificationId) => set((state2) => {
      const updated = state2.items.filter((item) => String(item.id) !== String(notificationId));
      saveToStorage(updated);
      return { items: updated };
    }),
    /**
     * Clears all notifications
     */
    clearAll: () => set(() => {
      localStorage.removeItem(STORAGE_KEY);
      return { items: [], initialized: true };
    }),
    /**
     * Restores notifications from storage
     */
    restoreFromStorage: () => set(() => {
      const stored = loadFromStorage();
      return {
        items: stored || [],
        initialized: true,
        cacheTimestamp: Date.now()
      };
    }),
    /**
     * Gets cache validity status
     */
    isCacheValid: () => {
      const state2 = get();
      if (!state2.cacheTimestamp) return false;
      return Date.now() - state2.cacheTimestamp < CACHE_TTL_MS;
    },
    /**
     * Invalidates cache
     */
    invalidateCache: () => set({ cacheTimestamp: null })
  };
});
const DEVICE_ID_KEY = "yamshat_device_id";
const OFFLINE_QUEUE_KEY = "yamshat_offline_queue";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1e3;
const OFFLINE_QUEUE_MAX_SIZE = 100;
const VAPID_PUBLIC_KEY = "m0z2g5XsMfU7d6O5bHNSA4LZX8sSmshWj6MDtZZ7Mqo";
function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
function loadOfflineQueue() {
  return safeJsonParse(localStorage.getItem(OFFLINE_QUEUE_KEY), []);
}
function saveOfflineQueue(queue) {
  const limited = Array.isArray(queue) ? queue.slice(0, OFFLINE_QUEUE_MAX_SIZE) : [];
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(limited));
}
function addToOfflineQueue(action, payload) {
  const queue = loadOfflineQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    payload,
    timestamp: Date.now(),
    retries: 0
  });
  saveOfflineQueue(queue);
  return queue;
}
function removeFromOfflineQueue(itemId) {
  const filtered = loadOfflineQueue().filter((item) => item.id !== itemId);
  saveOfflineQueue(filtered);
  return filtered;
}
async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * 2 ** attempt));
      }
    }
  }
  throw lastError;
}
function getPlatform() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows/i.test(ua)) return "windows";
  if (/mac/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "web";
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
const notificationService = {
  async initialize() {
    try {
      if (getAuthToken()) {
        await this.registerDevice();
      }
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      await this.processOfflineQueue();
      window.addEventListener("online", () => this.processOfflineQueue());
      return true;
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return false;
    }
  },
  getCapabilities() {
    const platform2 = getPlatform();
    return {
      platform: platform2,
      supportsBrowserNotifications: "Notification" in window,
      supportsServiceWorker: "serviceWorker" in navigator,
      supportsPushManager: "PushManager" in window,
      supportsBackgroundSync: "serviceWorker" in navigator && "SyncManager" in window,
      supportsForeground: true,
      supportsBackground: "serviceWorker" in navigator,
      androidReady: platform2 === "android" && "serviceWorker" in navigator,
      pwaReady: window.matchMedia?.("(display-mode: standalone)")?.matches || false,
      permission: "Notification" in window ? Notification.permission : "unsupported"
    };
  },
  getPushReadiness() {
    const capabilities = this.getCapabilities();
    return {
      ...capabilities,
      subscribed: Boolean(localStorage.getItem("yamshat_push_subscription")),
      deviceId: getOrCreateDeviceId(),
      queueSize: loadOfflineQueue().length
    };
  },
  async requestPermission() {
    if (!("Notification" in window)) return "unsupported";
    const permission = await Notification.requestPermission();
    if (getAuthToken()) {
      await this.registerDevice();
    }
    return permission;
  },
  async registerDevice() {
    if (!getAuthToken()) return null;
    const payload = {
      device_id: getOrCreateDeviceId(),
      platform: getPlatform(),
      user_agent: navigator.userAgent,
      notification_enabled: "Notification" in window && Notification.permission === "granted",
      pwa_installed: window.matchMedia?.("(display-mode: standalone)")?.matches || false,
      service_worker_ready: "serviceWorker" in navigator
    };
    try {
      await retryWithBackoff(() => API.post("/notifications/register-device", payload));
    } catch {
      localStorage.setItem("yamshat_device_registration", JSON.stringify({ ...payload, fallback: true, registered_at: (/* @__PURE__ */ new Date()).toISOString() }));
    }
    return payload.device_id;
  },
  async unregisterDevice() {
    try {
      await retryWithBackoff(() => API.post("/notifications/unregister-device", { device_id: getOrCreateDeviceId() }));
    } catch (error) {
      console.error("Failed to unregister device:", error);
    }
  },
  async subscribeToPushNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      localStorage.setItem("yamshat_push_subscription", JSON.stringify(existing.toJSON()));
      return existing;
    }
    const permission = await this.requestPermission();
    if (permission !== "granted") throw new Error("لم يتم منح إذن الإشعارات.");
    const subscribeOptions = {
      userVisibleOnly: true
    };
    subscribeOptions.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    localStorage.setItem("yamshat_push_subscription", JSON.stringify(subscription.toJSON()));
    try {
      await API.post("/notifications/subscribe-push", {
        device_id: getOrCreateDeviceId(),
        subscription: subscription.toJSON()
      });
    } catch {
    }
    return subscription;
  },
  async unsubscribePushNotifications() {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;
    await subscription.unsubscribe();
    localStorage.removeItem("yamshat_push_subscription");
    try {
      await API.post("/notifications/unsubscribe-push", { device_id: getOrCreateDeviceId() });
    } catch {
    }
    return true;
  },
  async fetchNotifications(limit = 50) {
    const store = useNotificationStore.getState();
    store.setLoading(true);
    try {
      const response = await retryWithBackoff(() => API.get("/notifications", { params: { limit }, cache: true, cacheTtlMs: 2e4 }));
      store.hydrateNotifications(response.data || []);
      store.setError("");
      return response.data;
    } catch (error) {
      store.setError("Failed to load notifications");
      store.restoreFromStorage();
      throw error;
    } finally {
      store.setLoading(false);
    }
  },
  async markNotificationRead(notificationId) {
    const store = useNotificationStore.getState();
    store.markRead(notificationId);
    try {
      await retryWithBackoff(() => API.post(`/notifications/${encodeURIComponent(notificationId)}/read`));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue("markRead", { notificationId });
      throw error;
    }
  },
  async markAllNotificationsRead() {
    const store = useNotificationStore.getState();
    store.markAllRead();
    try {
      await retryWithBackoff(() => API.put("/notifications/read"));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue("markAllRead", {});
      throw error;
    }
  },
  async deleteNotification(notificationId) {
    const store = useNotificationStore.getState();
    store.removeNotification(notificationId);
    try {
      await retryWithBackoff(() => API.delete(`/notifications/${encodeURIComponent(notificationId)}`));
    } catch (error) {
      if (!navigator.onLine) addToOfflineQueue("deleteNotification", { notificationId });
      throw error;
    }
  },
  async processOfflineQueue() {
    if (!navigator.onLine) return;
    const queue = loadOfflineQueue();
    for (const item of queue) {
      try {
        await this.processOfflineQueueItem(item);
        removeFromOfflineQueue(item.id);
      } catch {
        const next = loadOfflineQueue().map((queued) => queued.id === item.id ? { ...queued, retries: Number(queued.retries || 0) + 1 } : queued).filter((queued) => Number(queued.retries || 0) < MAX_RETRY_ATTEMPTS);
        saveOfflineQueue(next);
      }
    }
  },
  async processOfflineQueueItem(item) {
    switch (item.action) {
      case "markRead":
        return this.markNotificationRead(item.payload.notificationId);
      case "markAllRead":
        return this.markAllNotificationsRead();
      case "deleteNotification":
        return this.deleteNotification(item.payload.notificationId);
      default:
        return null;
    }
  },
  async sendPushNotification(title, options = {}) {
    const readiness = this.getPushReadiness();
    if (readiness.permission === "granted") {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.showNotification(title, {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: options.tag || "yamshat-local-push",
          data: { url: options.url || "/" },
          ...options
        });
      }
      return new Notification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        ...options
      });
    }
    return null;
  },
  getOfflineQueueStatus() {
    return {
      size: loadOfflineQueue().length,
      items: loadOfflineQueue(),
      isOnline: navigator.onLine
    };
  },
  clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
};
const BUILD_ID = "yamshat-hotfix-20260520-r3";
const BUILD_STORAGE_KEY = "yamshat_build_id";
async function hardResetIfBuildChanged() {
  if (typeof window === "undefined") return false;
  try {
    const previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
    if (previousBuild === BUILD_ID) return false;
    localStorage.setItem(BUILD_STORAGE_KEY, BUILD_ID);
    localStorage.removeItem("backendOrigin");
    localStorage.removeItem("apiBase");
    localStorage.removeItem("yamshat_post_draft");
    localStorage.removeItem("yamshat_quote_draft");
    localStorage.removeItem("yamshat_user_session");
    localStorage.removeItem("yamshatAuth");
    localStorage.removeItem("user");
    localStorage.removeItem("yamshat_csrf_token");
    try {
      sessionStorage.removeItem("yamshat_user_session");
      sessionStorage.removeItem("yamshatAuth");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("yamshat_csrf_token");
    } catch {
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
    }
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key).catch(() => false)));
    }
    const reloadFlag = `yamshat_build_reload:${BUILD_ID}`;
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, "1");
      window.location.replace(window.location.href);
      return true;
    }
  } catch {
  }
  return false;
}
if (typeof window !== "undefined") {
  window.__YAMSHAT_BUILD__ = BUILD_ID;
  window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
  initializePerformanceToolkit();
  initializeRuntimeErrorCapture();
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useAppStore.getState().setInstallPrompt(event);
  });
  window.addEventListener("appinstalled", () => {
    useAppStore.getState().clearInstallPrompt();
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      const resetTriggeredReload = await hardResetIfBuildChanged();
      if (resetTriggeredReload) return;
      window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.register("/sw.js").then((registration) => {
        initializePerformanceToolkit({ registration });
        notificationService.initialize().catch(() => null);
        return registration;
      }).catch(() => null);
    });
  }
}
ReactDOM.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HashRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RealtimeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) }) }) })
);
export {
  getBlockStatus as $,
  API as A,
  Button as B,
  notificationService as C,
  DashboardSkeleton as D,
  getCDNConfig as E,
  getMediaDeliveryProfile as F,
  currentMediaProviderLabel as G,
  hasPreviousPage as H,
  hasNextPage as I,
  Subscribable as J,
  shallowEqualObjects as K,
  Link as L,
  MEDIA_SECURITY as M,
  NavLink as N,
  hashKey as O,
  PRIMARY_ADMIN_EMAIL as P,
  getDefaultState as Q,
  notifyManager as R,
  SIGNED_URL_TTL_SECONDS as S,
  noop$1 as T,
  shouldThrowError as U,
  mediaUploadService as V,
  DISAPPEARING_MESSAGE_OPTIONS as W,
  getMessages as X,
  markMessagesSeen as Y,
  getPresence as Z,
  __vitePreload as _,
  useLocation as a,
  Navigate as a0,
  sendMessageApi as a1,
  deleteMessageApi as a2,
  pendingThenable as a3,
  resolveQueryBoolean as a4,
  resolveStaleTime as a5,
  environmentManager as a6,
  isValidTimeout as a7,
  timeUntilStale as a8,
  timeoutManager as a9,
  focusManager as aa,
  fetchState as ab,
  replaceData as ac,
  getStoredUserSnapshot as ad,
  getAuthToken as ae,
  getCsrfToken as af,
  BACKEND_ORIGIN as ag,
  redirectToAppPath as ah,
  TableSkeleton as ai,
  AdminOverviewSkeleton as aj,
  restoreMessage as ak,
  commonjsGlobal as al,
  getDefaultExportFromCjs as am,
  React as an,
  useNotificationStore as ao,
  normalizeNotification as ap,
  maybeShowBrowserNotification as aq,
  getStoredUser as b,
  clearStoredUser as c,
  useAppStore as d,
  useToast as e,
  getCurrentUsername as f,
  getDefaultPostLoginPath as g,
  socketManager as h,
  isPrimaryAdminSession as i,
  jsxRuntimeExports as j,
  hasPermission as k,
  ListSkeleton as l,
  unblockUserApi as m,
  blockUserApi as n,
  useParams as o,
  useQueryClient as p,
  getChatThreads as q,
  reactExports as r,
  setStoredUser as s,
  reactDomExports as t,
  useNavigate as u,
  useChatStore as v,
  selectUnreadTotal as w,
  logger as x,
  uploadMediaWithResume as y,
  getOptimizedImageUrl as z
};
