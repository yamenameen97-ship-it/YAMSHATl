import { a as __toESM, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-DuU1KJyR.js";
//#region node_modules/react/cjs/react.production.min.js
/**
* @license React
* react.production.min.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
	var l = Symbol.for("react.element"), n = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z = Symbol.iterator;
	function A(a) {
		if (null === a || "object" !== typeof a) return null;
		a = z && a[z] || a["@@iterator"];
		return "function" === typeof a ? a : null;
	}
	var B = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, C = Object.assign, D = {};
	function E(a, b, e) {
		this.props = a;
		this.context = b;
		this.refs = D;
		this.updater = e || B;
	}
	E.prototype.isReactComponent = {};
	E.prototype.setState = function(a, b) {
		if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, a, b, "setState");
	};
	E.prototype.forceUpdate = function(a) {
		this.updater.enqueueForceUpdate(this, a, "forceUpdate");
	};
	function F() {}
	F.prototype = E.prototype;
	function G(a, b, e) {
		this.props = a;
		this.context = b;
		this.refs = D;
		this.updater = e || B;
	}
	var H = G.prototype = new F();
	H.constructor = G;
	C(H, E.prototype);
	H.isPureReactComponent = !0;
	var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = { current: null }, L = {
		key: !0,
		ref: !0,
		__self: !0,
		__source: !0
	};
	function M(a, b, e) {
		var d, c = {}, k = null, h = null;
		if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
		var g = arguments.length - 2;
		if (1 === g) c.children = e;
		else if (1 < g) {
			for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
			c.children = f;
		}
		if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
		return {
			$$typeof: l,
			type: a,
			key: k,
			ref: h,
			props: c,
			_owner: K.current
		};
	}
	function N(a, b) {
		return {
			$$typeof: l,
			type: a.type,
			key: b,
			ref: a.ref,
			props: a.props,
			_owner: a._owner
		};
	}
	function O(a) {
		return "object" === typeof a && null !== a && a.$$typeof === l;
	}
	function escape(a) {
		var b = {
			"=": "=0",
			":": "=2"
		};
		return "$" + a.replace(/[=:]/g, function(a) {
			return b[a];
		});
	}
	var P = /\/+/g;
	function Q(a, b) {
		return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
	}
	function R(a, b, e, d, c) {
		var k = typeof a;
		if ("undefined" === k || "boolean" === k) a = null;
		var h = !1;
		if (null === a) h = !0;
		else switch (k) {
			case "string":
			case "number":
				h = !0;
				break;
			case "object": switch (a.$$typeof) {
				case l:
				case n: h = !0;
			}
		}
		if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a) {
			return a;
		})) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
		h = 0;
		d = "" === d ? "." : d + ":";
		if (I(a)) for (var g = 0; g < a.length; g++) {
			k = a[g];
			var f = d + Q(k, g);
			h += R(k, b, e, f, c);
		}
		else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done;) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
		else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
		return h;
	}
	function S(a, b, e) {
		if (null == a) return a;
		var d = [], c = 0;
		R(a, d, "", "", function(a) {
			return b.call(e, a, c++);
		});
		return d;
	}
	function T(a) {
		if (-1 === a._status) {
			var b = a._result;
			b = b();
			b.then(function(b) {
				if (0 === a._status || -1 === a._status) a._status = 1, a._result = b;
			}, function(b) {
				if (0 === a._status || -1 === a._status) a._status = 2, a._result = b;
			});
			-1 === a._status && (a._status = 0, a._result = b);
		}
		if (1 === a._status) return a._result.default;
		throw a._result;
	}
	var U = { current: null }, V = { transition: null }, W = {
		ReactCurrentDispatcher: U,
		ReactCurrentBatchConfig: V,
		ReactCurrentOwner: K
	};
	function X() {
		throw Error("act(...) is not supported in production builds of React.");
	}
	exports.Children = {
		map: S,
		forEach: function(a, b, e) {
			S(a, function() {
				b.apply(this, arguments);
			}, e);
		},
		count: function(a) {
			var b = 0;
			S(a, function() {
				b++;
			});
			return b;
		},
		toArray: function(a) {
			return S(a, function(a) {
				return a;
			}) || [];
		},
		only: function(a) {
			if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
			return a;
		}
	};
	exports.Component = E;
	exports.Fragment = p;
	exports.Profiler = r;
	exports.PureComponent = G;
	exports.StrictMode = q;
	exports.Suspense = w;
	exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
	exports.act = X;
	exports.cloneElement = function(a, b, e) {
		if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
		var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
		if (null != b) {
			void 0 !== b.ref && (k = b.ref, h = K.current);
			void 0 !== b.key && (c = "" + b.key);
			if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
			for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
		}
		var f = arguments.length - 2;
		if (1 === f) d.children = e;
		else if (1 < f) {
			g = Array(f);
			for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
			d.children = g;
		}
		return {
			$$typeof: l,
			type: a.type,
			key: c,
			ref: k,
			props: d,
			_owner: h
		};
	};
	exports.createContext = function(a) {
		a = {
			$$typeof: u,
			_currentValue: a,
			_currentValue2: a,
			_threadCount: 0,
			Provider: null,
			Consumer: null,
			_defaultValue: null,
			_globalName: null
		};
		a.Provider = {
			$$typeof: t,
			_context: a
		};
		return a.Consumer = a;
	};
	exports.createElement = M;
	exports.createFactory = function(a) {
		var b = M.bind(null, a);
		b.type = a;
		return b;
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(a) {
		return {
			$$typeof: v,
			render: a
		};
	};
	exports.isValidElement = O;
	exports.lazy = function(a) {
		return {
			$$typeof: y,
			_payload: {
				_status: -1,
				_result: a
			},
			_init: T
		};
	};
	exports.memo = function(a, b) {
		return {
			$$typeof: x,
			type: a,
			compare: void 0 === b ? null : b
		};
	};
	exports.startTransition = function(a) {
		var b = V.transition;
		V.transition = {};
		try {
			a();
		} finally {
			V.transition = b;
		}
	};
	exports.unstable_act = X;
	exports.useCallback = function(a, b) {
		return U.current.useCallback(a, b);
	};
	exports.useContext = function(a) {
		return U.current.useContext(a);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(a) {
		return U.current.useDeferredValue(a);
	};
	exports.useEffect = function(a, b) {
		return U.current.useEffect(a, b);
	};
	exports.useId = function() {
		return U.current.useId();
	};
	exports.useImperativeHandle = function(a, b, e) {
		return U.current.useImperativeHandle(a, b, e);
	};
	exports.useInsertionEffect = function(a, b) {
		return U.current.useInsertionEffect(a, b);
	};
	exports.useLayoutEffect = function(a, b) {
		return U.current.useLayoutEffect(a, b);
	};
	exports.useMemo = function(a, b) {
		return U.current.useMemo(a, b);
	};
	exports.useReducer = function(a, b, e) {
		return U.current.useReducer(a, b, e);
	};
	exports.useRef = function(a) {
		return U.current.useRef(a);
	};
	exports.useState = function(a) {
		return U.current.useState(a);
	};
	exports.useSyncExternalStore = function(a, b, e) {
		return U.current.useSyncExternalStore(a, b, e);
	};
	exports.useTransition = function() {
		return U.current.useTransition();
	};
	exports.version = "18.3.1";
}));
//#endregion
//#region node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production_min();
}));
//#endregion
//#region node_modules/scheduler/cjs/scheduler.production.min.js
/**
* @license React
* scheduler.production.min.js
*
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_scheduler_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
	function f(a, b) {
		var c = a.length;
		a.push(b);
		a: for (; 0 < c;) {
			var d = c - 1 >>> 1, e = a[d];
			if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
			else break a;
		}
	}
	function h(a) {
		return 0 === a.length ? null : a[0];
	}
	function k(a) {
		if (0 === a.length) return null;
		var b = a[0], c = a.pop();
		if (c !== b) {
			a[0] = c;
			a: for (var d = 0, e = a.length, w = e >>> 1; d < w;) {
				var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
				if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
				else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
				else break a;
			}
		}
		return b;
	}
	function g(a, b) {
		var c = a.sortIndex - b.sortIndex;
		return 0 !== c ? c : a.id - b.id;
	}
	if ("object" === typeof performance && "function" === typeof performance.now) {
		var l = performance;
		exports.unstable_now = function() {
			return l.now();
		};
	} else {
		var p = Date, q = p.now();
		exports.unstable_now = function() {
			return p.now() - q;
		};
	}
	var r = [], t = [], u = 1, v = null, y = 3, z = !1, A = !1, B = !1, D = "function" === typeof setTimeout ? setTimeout : null, E = "function" === typeof clearTimeout ? clearTimeout : null, F = "undefined" !== typeof setImmediate ? setImmediate : null;
	"undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
	function G(a) {
		for (var b = h(t); null !== b;) {
			if (null === b.callback) k(t);
			else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
			else break;
			b = h(t);
		}
	}
	function H(a) {
		B = !1;
		G(a);
		if (!A) if (null !== h(r)) A = !0, I(J);
		else {
			var b = h(t);
			null !== b && K(H, b.startTime - a);
		}
	}
	function J(a, b) {
		A = !1;
		B && (B = !1, E(L), L = -1);
		z = !0;
		var c = y;
		try {
			G(b);
			for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M());) {
				var d = v.callback;
				if ("function" === typeof d) {
					v.callback = null;
					y = v.priorityLevel;
					var e = d(v.expirationTime <= b);
					b = exports.unstable_now();
					"function" === typeof e ? v.callback = e : v === h(r) && k(r);
					G(b);
				} else k(r);
				v = h(r);
			}
			if (null !== v) var w = !0;
			else {
				var m = h(t);
				null !== m && K(H, m.startTime - b);
				w = !1;
			}
			return w;
		} finally {
			v = null, y = c, z = !1;
		}
	}
	var N = !1, O = null, L = -1, P = 5, Q = -1;
	function M() {
		return exports.unstable_now() - Q < P ? !1 : !0;
	}
	function R() {
		if (null !== O) {
			var a = exports.unstable_now();
			Q = a;
			var b = !0;
			try {
				b = O(!0, a);
			} finally {
				b ? S() : (N = !1, O = null);
			}
		} else N = !1;
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
	function I(a) {
		O = a;
		N || (N = !0, S());
	}
	function K(a, b) {
		L = D(function() {
			a(exports.unstable_now());
		}, b);
	}
	exports.unstable_IdlePriority = 5;
	exports.unstable_ImmediatePriority = 1;
	exports.unstable_LowPriority = 4;
	exports.unstable_NormalPriority = 3;
	exports.unstable_Profiling = null;
	exports.unstable_UserBlockingPriority = 2;
	exports.unstable_cancelCallback = function(a) {
		a.callback = null;
	};
	exports.unstable_continueExecution = function() {
		A || z || (A = !0, I(J));
	};
	exports.unstable_forceFrameRate = function(a) {
		0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
	};
	exports.unstable_getCurrentPriorityLevel = function() {
		return y;
	};
	exports.unstable_getFirstCallbackNode = function() {
		return h(r);
	};
	exports.unstable_next = function(a) {
		switch (y) {
			case 1:
			case 2:
			case 3:
				var b = 3;
				break;
			default: b = y;
		}
		var c = y;
		y = b;
		try {
			return a();
		} finally {
			y = c;
		}
	};
	exports.unstable_pauseExecution = function() {};
	exports.unstable_requestPaint = function() {};
	exports.unstable_runWithPriority = function(a, b) {
		switch (a) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: a = 3;
		}
		var c = y;
		y = a;
		try {
			return b();
		} finally {
			y = c;
		}
	};
	exports.unstable_scheduleCallback = function(a, b, c) {
		var d = exports.unstable_now();
		"object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
		switch (a) {
			case 1:
				var e = -1;
				break;
			case 2:
				e = 250;
				break;
			case 5:
				e = 1073741823;
				break;
			case 4:
				e = 1e4;
				break;
			default: e = 5e3;
		}
		e = c + e;
		a = {
			id: u++,
			callback: b,
			priorityLevel: a,
			startTime: c,
			expirationTime: e,
			sortIndex: -1
		};
		c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = !0, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = !0, I(J)));
		return a;
	};
	exports.unstable_shouldYield = M;
	exports.unstable_wrapCallback = function(a) {
		var b = y;
		return function() {
			var c = y;
			y = b;
			try {
				return a.apply(this, arguments);
			} finally {
				y = c;
			}
		};
	};
}));
//#endregion
//#region node_modules/scheduler/index.js
var require_scheduler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_scheduler_production_min();
}));
//#endregion
//#region node_modules/@remix-run/router/dist/router.js
var import_react = /* @__PURE__ */ __toESM(require_react());
/**
* @remix-run/router v1.23.2
*
* Copyright (c) Remix Software Inc.
*
* This source code is licensed under the MIT license found in the
* LICENSE.md file in the root directory of this source tree.
*
* @license MIT
*/
function _extends$1() {
	_extends$1 = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends$1.apply(this, arguments);
}
/**
* Actions represent the type of change to a location value.
*/
var Action;
(function(Action) {
	/**
	* A POP indicates a change to an arbitrary index in the history stack, such
	* as a back or forward navigation. It does not describe the direction of the
	* navigation, only that the current index changed.
	*
	* Note: This is the default action for newly created history objects.
	*/
	Action["Pop"] = "POP";
	/**
	* A PUSH indicates a new entry being added to the history stack, such as when
	* a link is clicked and a new page loads. When this happens, all subsequent
	* entries in the stack are lost.
	*/
	Action["Push"] = "PUSH";
	/**
	* A REPLACE indicates the entry at the current index in the history stack
	* being replaced by a new one.
	*/
	Action["Replace"] = "REPLACE";
})(Action || (Action = {}));
var PopStateEventType = "popstate";
/**
* Hash history stores the location in window.location.hash. This makes it ideal
* for situations where you don't want to send the location to the server for
* some reason, either because you do cannot configure it or the URL space is
* reserved for something else.
*
* @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createhashhistory
*/
function createHashHistory(options) {
	if (options === void 0) options = {};
	function createHashLocation(window, globalHistory) {
		let { pathname = "/", search = "", hash = "" } = parsePath(window.location.hash.substr(1));
		if (!pathname.startsWith("/") && !pathname.startsWith(".")) pathname = "/" + pathname;
		return createLocation("", {
			pathname,
			search,
			hash
		}, globalHistory.state && globalHistory.state.usr || null, globalHistory.state && globalHistory.state.key || "default");
	}
	function createHashHref(window, to) {
		let base = window.document.querySelector("base");
		let href = "";
		if (base && base.getAttribute("href")) {
			let url = window.location.href;
			let hashIndex = url.indexOf("#");
			href = hashIndex === -1 ? url : url.slice(0, hashIndex);
		}
		return href + "#" + (typeof to === "string" ? to : createPath(to));
	}
	function validateHashLocation(location, to) {
		warning$1(location.pathname.charAt(0) === "/", "relative pathnames are not supported in hash history.push(" + JSON.stringify(to) + ")");
	}
	return getUrlBasedHistory(createHashLocation, createHashHref, validateHashLocation, options);
}
function invariant$1(value, message) {
	if (value === false || value === null || typeof value === "undefined") throw new Error(message);
}
function warning$1(cond, message) {
	if (!cond) {
		if (typeof console !== "undefined") console.warn(message);
		try {
			throw new Error(message);
		} catch (e) {}
	}
}
function createKey() {
	return Math.random().toString(36).substr(2, 8);
}
/**
* For browser-based histories, we combine the state and key into an object
*/
function getHistoryState(location, index) {
	return {
		usr: location.state,
		key: location.key,
		idx: index
	};
}
/**
* Creates a Location object with a unique key from the given Path
*/
function createLocation(current, to, state, key) {
	if (state === void 0) state = null;
	return _extends$1({
		pathname: typeof current === "string" ? current : current.pathname,
		search: "",
		hash: ""
	}, typeof to === "string" ? parsePath(to) : to, {
		state,
		key: to && to.key || key || createKey()
	});
}
/**
* Creates a string URL path from the given pathname, search, and hash components.
*/
function createPath(_ref) {
	let { pathname = "/", search = "", hash = "" } = _ref;
	if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
	if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
	return pathname;
}
/**
* Parses a string URL path into its separate pathname, search, and hash components.
*/
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
		if (path) parsedPath.pathname = path;
	}
	return parsedPath;
}
function getUrlBasedHistory(getLocation, createHref, validateLocation, options) {
	if (options === void 0) options = {};
	let { window = document.defaultView, v5Compat = false } = options;
	let globalHistory = window.history;
	let action = Action.Pop;
	let listener = null;
	let index = getIndex();
	if (index == null) {
		index = 0;
		globalHistory.replaceState(_extends$1({}, globalHistory.state, { idx: index }), "");
	}
	function getIndex() {
		return (globalHistory.state || { idx: null }).idx;
	}
	function handlePop() {
		action = Action.Pop;
		let nextIndex = getIndex();
		let delta = nextIndex == null ? null : nextIndex - index;
		index = nextIndex;
		if (listener) listener({
			action,
			location: history.location,
			delta
		});
	}
	function push(to, state) {
		action = Action.Push;
		let location = createLocation(history.location, to, state);
		if (validateLocation) validateLocation(location, to);
		index = getIndex() + 1;
		let historyState = getHistoryState(location, index);
		let url = history.createHref(location);
		try {
			globalHistory.pushState(historyState, "", url);
		} catch (error) {
			if (error instanceof DOMException && error.name === "DataCloneError") throw error;
			window.location.assign(url);
		}
		if (v5Compat && listener) listener({
			action,
			location: history.location,
			delta: 1
		});
	}
	function replace(to, state) {
		action = Action.Replace;
		let location = createLocation(history.location, to, state);
		if (validateLocation) validateLocation(location, to);
		index = getIndex();
		let historyState = getHistoryState(location, index);
		let url = history.createHref(location);
		globalHistory.replaceState(historyState, "", url);
		if (v5Compat && listener) listener({
			action,
			location: history.location,
			delta: 0
		});
	}
	function createURL(to) {
		let base = window.location.origin !== "null" ? window.location.origin : window.location.href;
		let href = typeof to === "string" ? to : createPath(to);
		href = href.replace(/ $/, "%20");
		invariant$1(base, "No window.location.(origin|href) available to create URL for href: " + href);
		return new URL(href, base);
	}
	let history = {
		get action() {
			return action;
		},
		get location() {
			return getLocation(window, globalHistory);
		},
		listen(fn) {
			if (listener) throw new Error("A history only accepts one active listener");
			window.addEventListener(PopStateEventType, handlePop);
			listener = fn;
			return () => {
				window.removeEventListener(PopStateEventType, handlePop);
				listener = null;
			};
		},
		createHref(to) {
			return createHref(window, to);
		},
		createURL,
		encodeLocation(to) {
			let url = createURL(to);
			return {
				pathname: url.pathname,
				search: url.search,
				hash: url.hash
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
(function(ResultType) {
	ResultType["data"] = "data";
	ResultType["deferred"] = "deferred";
	ResultType["redirect"] = "redirect";
	ResultType["error"] = "error";
})(ResultType || (ResultType = {}));
/**
* Matches the given routes to a location and returns the match data.
*
* @see https://reactrouter.com/v6/utils/match-routes
*/
function matchRoutes(routes, locationArg, basename) {
	if (basename === void 0) basename = "/";
	return matchRoutesImpl(routes, locationArg, basename, false);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
	let pathname = stripBasename((typeof locationArg === "string" ? parsePath(locationArg) : locationArg).pathname || "/", basename);
	if (pathname == null) return null;
	let branches = flattenRoutes(routes);
	rankRouteBranches(branches);
	let matches = null;
	for (let i = 0; matches == null && i < branches.length; ++i) {
		let decoded = decodePath(pathname);
		matches = matchRouteBranch(branches[i], decoded, allowPartial);
	}
	return matches;
}
function flattenRoutes(routes, branches, parentsMeta, parentPath) {
	if (branches === void 0) branches = [];
	if (parentsMeta === void 0) parentsMeta = [];
	if (parentPath === void 0) parentPath = "";
	let flattenRoute = (route, index, relativePath) => {
		let meta = {
			relativePath: relativePath === void 0 ? route.path || "" : relativePath,
			caseSensitive: route.caseSensitive === true,
			childrenIndex: index,
			route
		};
		if (meta.relativePath.startsWith("/")) {
			invariant$1(meta.relativePath.startsWith(parentPath), "Absolute route path \"" + meta.relativePath + "\" nested under path " + ("\"" + parentPath + "\" is not valid. An absolute child route path ") + "must start with the combined path of all its parent routes.");
			meta.relativePath = meta.relativePath.slice(parentPath.length);
		}
		let path = joinPaths([parentPath, meta.relativePath]);
		let routesMeta = parentsMeta.concat(meta);
		if (route.children && route.children.length > 0) {
			invariant$1(route.index !== true, "Index routes must not have child routes. Please remove " + ("all child routes from route path \"" + path + "\"."));
			flattenRoutes(route.children, branches, routesMeta, path);
		}
		if (route.path == null && !route.index) return;
		branches.push({
			path,
			score: computeScore(path, route.index),
			routesMeta
		});
	};
	routes.forEach((route, index) => {
		var _route$path;
		if (route.path === "" || !((_route$path = route.path) != null && _route$path.includes("?"))) flattenRoute(route, index);
		else for (let exploded of explodeOptionalSegments(route.path)) flattenRoute(route, index, exploded);
	});
	return branches;
}
/**
* Computes all combinations of optional path segments for a given path,
* excluding combinations that are ambiguous and of lower priority.
*
* For example, `/one/:two?/three/:four?/:five?` explodes to:
* - `/one/three`
* - `/one/:two/three`
* - `/one/three/:four`
* - `/one/three/:five`
* - `/one/:two/three/:four`
* - `/one/:two/three/:five`
* - `/one/three/:four/:five`
* - `/one/:two/three/:four/:five`
*/
function explodeOptionalSegments(path) {
	let segments = path.split("/");
	if (segments.length === 0) return [];
	let [first, ...rest] = segments;
	let isOptional = first.endsWith("?");
	let required = first.replace(/\?$/, "");
	if (rest.length === 0) return isOptional ? [required, ""] : [required];
	let restExploded = explodeOptionalSegments(rest.join("/"));
	let result = [];
	result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
	if (isOptional) result.push(...restExploded);
	return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
	branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
var paramRe = /^:[\w-]+$/;
var dynamicSegmentValue = 3;
var indexRouteValue = 2;
var emptySegmentValue = 1;
var staticSegmentValue = 10;
var splatPenalty = -2;
var isSplat = (s) => s === "*";
function computeScore(path, index) {
	let segments = path.split("/");
	let initialScore = segments.length;
	if (segments.some(isSplat)) initialScore += splatPenalty;
	if (index) initialScore += indexRouteValue;
	return segments.filter((s) => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
	return a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]) ? a[a.length - 1] - b[b.length - 1] : 0;
}
function matchRouteBranch(branch, pathname, allowPartial) {
	if (allowPartial === void 0) allowPartial = false;
	let { routesMeta } = branch;
	let matchedParams = {};
	let matchedPathname = "/";
	let matches = [];
	for (let i = 0; i < routesMeta.length; ++i) {
		let meta = routesMeta[i];
		let end = i === routesMeta.length - 1;
		let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
		let match = matchPath({
			path: meta.relativePath,
			caseSensitive: meta.caseSensitive,
			end
		}, remainingPathname);
		let route = meta.route;
		if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) match = matchPath({
			path: meta.relativePath,
			caseSensitive: meta.caseSensitive,
			end: false
		}, remainingPathname);
		if (!match) return null;
		Object.assign(matchedParams, match.params);
		matches.push({
			params: matchedParams,
			pathname: joinPaths([matchedPathname, match.pathname]),
			pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
			route
		});
		if (match.pathnameBase !== "/") matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
	}
	return matches;
}
/**
* Performs pattern matching on a URL pathname and returns information about
* the match.
*
* @see https://reactrouter.com/v6/utils/match-path
*/
function matchPath(pattern, pathname) {
	if (typeof pattern === "string") pattern = {
		path: pattern,
		caseSensitive: false,
		end: true
	};
	let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
	let match = pathname.match(matcher);
	if (!match) return null;
	let matchedPathname = match[0];
	let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
	let captureGroups = match.slice(1);
	return {
		params: compiledParams.reduce((memo, _ref, index) => {
			let { paramName, isOptional } = _ref;
			if (paramName === "*") {
				let splatValue = captureGroups[index] || "";
				pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
			}
			const value = captureGroups[index];
			if (isOptional && !value) memo[paramName] = void 0;
			else memo[paramName] = (value || "").replace(/%2F/g, "/");
			return memo;
		}, {}),
		pathname: matchedPathname,
		pathnameBase,
		pattern
	};
}
function compilePath(path, caseSensitive, end) {
	if (caseSensitive === void 0) caseSensitive = false;
	if (end === void 0) end = true;
	warning$1(path === "*" || !path.endsWith("*") || path.endsWith("/*"), "Route path \"" + path + "\" will be treated as if it were " + ("\"" + path.replace(/\*$/, "/*") + "\" because the `*` character must ") + "always follow a `/` in the pattern. To get rid of this warning, " + ("please change the route path to \"" + path.replace(/\*$/, "/*") + "\"."));
	let params = [];
	let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
		params.push({
			paramName,
			isOptional: isOptional != null
		});
		return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
	});
	if (path.endsWith("*")) {
		params.push({ paramName: "*" });
		regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
	} else if (end) regexpSource += "\\/*$";
	else if (path !== "" && path !== "/") regexpSource += "(?:(?=\\/|$))";
	return [new RegExp(regexpSource, caseSensitive ? void 0 : "i"), params];
}
function decodePath(value) {
	try {
		return value.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
	} catch (error) {
		warning$1(false, "The URL path \"" + value + "\" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent " + ("encoding (" + error + ")."));
		return value;
	}
}
/**
* @private
*/
function stripBasename(pathname, basename) {
	if (basename === "/") return pathname;
	if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) return null;
	let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
	let nextChar = pathname.charAt(startIndex);
	if (nextChar && nextChar !== "/") return null;
	return pathname.slice(startIndex) || "/";
}
var ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var isAbsoluteUrl = (url) => ABSOLUTE_URL_REGEX$1.test(url);
/**
* Returns a resolved path object relative to the given pathname.
*
* @see https://reactrouter.com/v6/utils/resolve-path
*/
function resolvePath(to, fromPathname) {
	if (fromPathname === void 0) fromPathname = "/";
	let { pathname: toPathname, search = "", hash = "" } = typeof to === "string" ? parsePath(to) : to;
	let pathname;
	if (toPathname) if (isAbsoluteUrl(toPathname)) pathname = toPathname;
	else {
		if (toPathname.includes("//")) {
			let oldPathname = toPathname;
			toPathname = toPathname.replace(/\/\/+/g, "/");
			warning$1(false, "Pathnames cannot have embedded double slashes - normalizing " + (oldPathname + " -> " + toPathname));
		}
		if (toPathname.startsWith("/")) pathname = resolvePathname(toPathname.substring(1), "/");
		else pathname = resolvePathname(toPathname, fromPathname);
	}
	else pathname = fromPathname;
	return {
		pathname,
		search: normalizeSearch(search),
		hash: normalizeHash(hash)
	};
}
function resolvePathname(relativePath, fromPathname) {
	let segments = fromPathname.replace(/\/+$/, "").split("/");
	relativePath.split("/").forEach((segment) => {
		if (segment === "..") {
			if (segments.length > 1) segments.pop();
		} else if (segment !== ".") segments.push(segment);
	});
	return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
	return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + "a string in <Link to=\"...\"> and the router will parse it for you.";
}
/**
* @private
*
* When processing relative navigation we want to ignore ancestor routes that
* do not contribute to the path, such that index/pathless layout routes don't
* interfere.
*
* For example, when moving a route element into an index route and/or a
* pathless layout route, relative link behavior contained within should stay
* the same.  Both of the following examples should link back to the root:
*
*   <Route path="/">
*     <Route path="accounts" element={<Link to=".."}>
*   </Route>
*
*   <Route path="/">
*     <Route path="accounts">
*       <Route element={<AccountsLayout />}>       // <-- Does not contribute
*         <Route index element={<Link to=".."} />  // <-- Does not contribute
*       </Route
*     </Route>
*   </Route>
*/
function getPathContributingMatches(matches) {
	return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches, v7_relativeSplatPath) {
	let pathMatches = getPathContributingMatches(matches);
	if (v7_relativeSplatPath) return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
	return pathMatches.map((match) => match.pathnameBase);
}
/**
* @private
*/
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
	if (isPathRelative === void 0) isPathRelative = false;
	let to;
	if (typeof toArg === "string") to = parsePath(toArg);
	else {
		to = _extends$1({}, toArg);
		invariant$1(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
		invariant$1(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
		invariant$1(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
	}
	let isEmptyPath = toArg === "" || to.pathname === "";
	let toPathname = isEmptyPath ? "/" : to.pathname;
	let from;
	if (toPathname == null) from = locationPathname;
	else {
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
	if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) path.pathname += "/";
	return path;
}
/**
* @private
*/
var joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
/**
* @private
*/
var normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
/**
* @private
*/
var normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
/**
* @private
*/
var normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
/**
* Check if the given error is an ErrorResponse generated from a 4xx/5xx
* Response thrown from an action/loader
*/
function isRouteErrorResponse(error) {
	return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
var validMutationMethodsArr = [
	"post",
	"put",
	"patch",
	"delete"
];
new Set(validMutationMethodsArr);
var validRequestMethodsArr = ["get", ...validMutationMethodsArr];
new Set(validRequestMethodsArr);
//#endregion
//#region node_modules/react-router/dist/index.js
/**
* React Router v6.30.3
*
* Copyright (c) Remix Software Inc.
*
* This source code is licensed under the MIT license found in the
* LICENSE.md file in the root directory of this source tree.
*
* @license MIT
*/
function _extends() {
	_extends = Object.assign ? Object.assign.bind() : function(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	};
	return _extends.apply(this, arguments);
}
var DataRouterContext = /* @__PURE__ */ import_react.createContext(null);
var DataRouterStateContext = /* @__PURE__ */ import_react.createContext(null);
/**
* A Navigator is a "location changer"; it's how you get to different locations.
*
* Every history instance conforms to the Navigator interface, but the
* distinction is useful primarily when it comes to the low-level `<Router>` API
* where both the location and a navigator must be provided separately in order
* to avoid "tearing" that may occur in a suspense-enabled app if the action
* and/or location were to be read directly from the history instance.
*/
var NavigationContext = /* @__PURE__ */ import_react.createContext(null);
var LocationContext = /* @__PURE__ */ import_react.createContext(null);
var RouteContext = /* @__PURE__ */ import_react.createContext({
	outlet: null,
	matches: [],
	isDataRoute: false
});
var RouteErrorContext = /* @__PURE__ */ import_react.createContext(null);
/**
* Returns the full href for the given "to" value. This is useful for building
* custom links that are also accessible and preserve right-click behavior.
*
* @see https://reactrouter.com/v6/hooks/use-href
*/
function useHref(to, _temp) {
	let { relative } = _temp === void 0 ? {} : _temp;
	!useInRouterContext() && invariant$1(false);
	let { basename, navigator } = import_react.useContext(NavigationContext);
	let { hash, pathname, search } = useResolvedPath(to, { relative });
	let joinedPathname = pathname;
	if (basename !== "/") joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
	return navigator.createHref({
		pathname: joinedPathname,
		search,
		hash
	});
}
/**
* Returns true if this component is a descendant of a `<Router>`.
*
* @see https://reactrouter.com/v6/hooks/use-in-router-context
*/
function useInRouterContext() {
	return import_react.useContext(LocationContext) != null;
}
/**
* Returns the current location object, which represents the current URL in web
* browsers.
*
* Note: If you're using this it may mean you're doing some of your own
* "routing" in your app, and we'd like to know what your use case is. We may
* be able to provide something higher-level to better suit your needs.
*
* @see https://reactrouter.com/v6/hooks/use-location
*/
function useLocation() {
	!useInRouterContext() && invariant$1(false);
	return import_react.useContext(LocationContext).location;
}
function useIsomorphicLayoutEffect(cb) {
	if (!import_react.useContext(NavigationContext).static) import_react.useLayoutEffect(cb);
}
/**
* Returns an imperative method for changing the location. Used by `<Link>`s, but
* may also be used by other elements to change the location.
*
* @see https://reactrouter.com/v6/hooks/use-navigate
*/
function useNavigate() {
	let { isDataRoute } = import_react.useContext(RouteContext);
	return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
	!useInRouterContext() && invariant$1(false);
	let dataRouterContext = import_react.useContext(DataRouterContext);
	let { basename, future, navigator } = import_react.useContext(NavigationContext);
	let { matches } = import_react.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
	let activeRef = import_react.useRef(false);
	useIsomorphicLayoutEffect(() => {
		activeRef.current = true;
	});
	return import_react.useCallback(function(to, options) {
		if (options === void 0) options = {};
		if (!activeRef.current) return;
		if (typeof to === "number") {
			navigator.go(to);
			return;
		}
		let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
		if (dataRouterContext == null && basename !== "/") path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
		(!!options.replace ? navigator.replace : navigator.push)(path, options.state, options);
	}, [
		basename,
		navigator,
		routePathnamesJson,
		locationPathname,
		dataRouterContext
	]);
}
/**
* Returns an object of key/value pairs of the dynamic params from the current
* URL that were matched by the route path.
*
* @see https://reactrouter.com/v6/hooks/use-params
*/
function useParams() {
	let { matches } = import_react.useContext(RouteContext);
	let routeMatch = matches[matches.length - 1];
	return routeMatch ? routeMatch.params : {};
}
/**
* Resolves the pathname of the given `to` value against the current location.
*
* @see https://reactrouter.com/v6/hooks/use-resolved-path
*/
function useResolvedPath(to, _temp2) {
	let { relative } = _temp2 === void 0 ? {} : _temp2;
	let { future } = import_react.useContext(NavigationContext);
	let { matches } = import_react.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
	return import_react.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [
		to,
		routePathnamesJson,
		locationPathname,
		relative
	]);
}
/**
* Returns the element of the route that matched the current location, prepared
* with the correct context to render the remainder of the route tree. Route
* elements in the tree must render an `<Outlet>` to render their child route's
* element.
*
* @see https://reactrouter.com/v6/hooks/use-routes
*/
function useRoutes(routes, locationArg) {
	return useRoutesImpl(routes, locationArg);
}
function useRoutesImpl(routes, locationArg, dataRouterState, future) {
	!useInRouterContext() && invariant$1(false);
	let { navigator } = import_react.useContext(NavigationContext);
	let { matches: parentMatches } = import_react.useContext(RouteContext);
	let routeMatch = parentMatches[parentMatches.length - 1];
	let parentParams = routeMatch ? routeMatch.params : {};
	routeMatch && routeMatch.pathname;
	let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
	routeMatch && routeMatch.route;
	let locationFromContext = useLocation();
	let location;
	if (locationArg) {
		var _parsedLocationArg$pa;
		let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
		!(parentPathnameBase === "/" || ((_parsedLocationArg$pa = parsedLocationArg.pathname) == null ? void 0 : _parsedLocationArg$pa.startsWith(parentPathnameBase))) && invariant$1(false);
		location = parsedLocationArg;
	} else location = locationFromContext;
	let pathname = location.pathname || "/";
	let remainingPathname = pathname;
	if (parentPathnameBase !== "/") {
		let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
		remainingPathname = "/" + pathname.replace(/^\//, "").split("/").slice(parentSegments.length).join("/");
	}
	let matches = matchRoutes(routes, { pathname: remainingPathname });
	let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
		params: Object.assign({}, parentParams, match.params),
		pathname: joinPaths([parentPathnameBase, navigator.encodeLocation ? navigator.encodeLocation(match.pathname).pathname : match.pathname]),
		pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([parentPathnameBase, navigator.encodeLocation ? navigator.encodeLocation(match.pathnameBase).pathname : match.pathnameBase])
	})), parentMatches, dataRouterState, future);
	if (locationArg && renderedMatches) return /* @__PURE__ */ import_react.createElement(LocationContext.Provider, { value: {
		location: _extends({
			pathname: "/",
			search: "",
			hash: "",
			state: null,
			key: "default"
		}, location),
		navigationType: Action.Pop
	} }, renderedMatches);
	return renderedMatches;
}
function DefaultErrorComponent() {
	let error = useRouteError();
	let message = isRouteErrorResponse(error) ? error.status + " " + error.statusText : error instanceof Error ? error.message : JSON.stringify(error);
	let stack = error instanceof Error ? error.stack : null;
	return /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ import_react.createElement("h3", { style: { fontStyle: "italic" } }, message), stack ? /* @__PURE__ */ import_react.createElement("pre", { style: {
		padding: "0.5rem",
		backgroundColor: "rgba(200,200,200, 0.5)"
	} }, stack) : null, null);
}
var defaultErrorElement = /* @__PURE__ */ import_react.createElement(DefaultErrorComponent, null);
var RenderErrorBoundary = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			location: props.location,
			revalidation: props.revalidation,
			error: props.error
		};
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	static getDerivedStateFromProps(props, state) {
		if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") return {
			error: props.error,
			location: props.location,
			revalidation: props.revalidation
		};
		return {
			error: props.error !== void 0 ? props.error : state.error,
			location: state.location,
			revalidation: props.revalidation || state.revalidation
		};
	}
	componentDidCatch(error, errorInfo) {
		console.error("React Router caught the following error during render", error, errorInfo);
	}
	render() {
		return this.state.error !== void 0 ? /* @__PURE__ */ import_react.createElement(RouteContext.Provider, { value: this.props.routeContext }, /* @__PURE__ */ import_react.createElement(RouteErrorContext.Provider, {
			value: this.state.error,
			children: this.props.component
		})) : this.props.children;
	}
};
function RenderedRoute(_ref) {
	let { routeContext, match, children } = _ref;
	let dataRouterContext = import_react.useContext(DataRouterContext);
	if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
	return /* @__PURE__ */ import_react.createElement(RouteContext.Provider, { value: routeContext }, children);
}
function _renderMatches(matches, parentMatches, dataRouterState, future) {
	var _dataRouterState;
	if (parentMatches === void 0) parentMatches = [];
	if (dataRouterState === void 0) dataRouterState = null;
	if (future === void 0) future = null;
	if (matches == null) {
		var _future;
		if (!dataRouterState) return null;
		if (dataRouterState.errors) matches = dataRouterState.matches;
		else if ((_future = future) != null && _future.v7_partialHydration && parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) matches = dataRouterState.matches;
		else return null;
	}
	let renderedMatches = matches;
	let errors = (_dataRouterState = dataRouterState) == null ? void 0 : _dataRouterState.errors;
	if (errors != null) {
		let errorIndex = renderedMatches.findIndex((m) => m.route.id && (errors == null ? void 0 : errors[m.route.id]) !== void 0);
		!(errorIndex >= 0) && invariant$1(false);
		renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
	}
	let renderFallback = false;
	let fallbackIndex = -1;
	if (dataRouterState && future && future.v7_partialHydration) for (let i = 0; i < renderedMatches.length; i++) {
		let match = renderedMatches[i];
		if (match.route.HydrateFallback || match.route.hydrateFallbackElement) fallbackIndex = i;
		if (match.route.id) {
			let { loaderData, errors } = dataRouterState;
			let needsToRunLoader = match.route.loader && loaderData[match.route.id] === void 0 && (!errors || errors[match.route.id] === void 0);
			if (match.route.lazy || needsToRunLoader) {
				renderFallback = true;
				if (fallbackIndex >= 0) renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
				else renderedMatches = [renderedMatches[0]];
				break;
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
					warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
					shouldRenderHydrateFallback = true;
					hydrateFallbackElement = null;
				} else if (fallbackIndex === index) {
					shouldRenderHydrateFallback = true;
					hydrateFallbackElement = match.route.hydrateFallbackElement || null;
				}
			}
		}
		let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
		let getChildren = () => {
			let children;
			if (error) children = errorElement;
			else if (shouldRenderHydrateFallback) children = hydrateFallbackElement;
			else if (match.route.Component) children = /* @__PURE__ */ import_react.createElement(match.route.Component, null);
			else if (match.route.element) children = match.route.element;
			else children = outlet;
			return /* @__PURE__ */ import_react.createElement(RenderedRoute, {
				match,
				routeContext: {
					outlet,
					matches,
					isDataRoute: dataRouterState != null
				},
				children
			});
		};
		return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ import_react.createElement(RenderErrorBoundary, {
			location: dataRouterState.location,
			revalidation: dataRouterState.revalidation,
			component: errorElement,
			error,
			children: getChildren(),
			routeContext: {
				outlet: null,
				matches,
				isDataRoute: true
			}
		}) : getChildren();
	}, null);
}
var DataRouterHook = /* @__PURE__ */ function(DataRouterHook) {
	DataRouterHook["UseBlocker"] = "useBlocker";
	DataRouterHook["UseRevalidator"] = "useRevalidator";
	DataRouterHook["UseNavigateStable"] = "useNavigate";
	return DataRouterHook;
}(DataRouterHook || {});
var DataRouterStateHook = /* @__PURE__ */ function(DataRouterStateHook) {
	DataRouterStateHook["UseBlocker"] = "useBlocker";
	DataRouterStateHook["UseLoaderData"] = "useLoaderData";
	DataRouterStateHook["UseActionData"] = "useActionData";
	DataRouterStateHook["UseRouteError"] = "useRouteError";
	DataRouterStateHook["UseNavigation"] = "useNavigation";
	DataRouterStateHook["UseRouteLoaderData"] = "useRouteLoaderData";
	DataRouterStateHook["UseMatches"] = "useMatches";
	DataRouterStateHook["UseRevalidator"] = "useRevalidator";
	DataRouterStateHook["UseNavigateStable"] = "useNavigate";
	DataRouterStateHook["UseRouteId"] = "useRouteId";
	return DataRouterStateHook;
}(DataRouterStateHook || {});
function useDataRouterContext(hookName) {
	let ctx = import_react.useContext(DataRouterContext);
	!ctx && invariant$1(false);
	return ctx;
}
function useDataRouterState(hookName) {
	let state = import_react.useContext(DataRouterStateContext);
	!state && invariant$1(false);
	return state;
}
function useRouteContext(hookName) {
	let route = import_react.useContext(RouteContext);
	!route && invariant$1(false);
	return route;
}
function useCurrentRouteId(hookName) {
	let route = useRouteContext(hookName);
	let thisRoute = route.matches[route.matches.length - 1];
	!thisRoute.route.id && invariant$1(false);
	return thisRoute.route.id;
}
/**
* Returns the nearest ancestor Route error, which could be a loader/action
* error or a render error.  This is intended to be called from your
* ErrorBoundary/errorElement to display a proper error message.
*/
function useRouteError() {
	var _state$errors;
	let error = import_react.useContext(RouteErrorContext);
	let state = useDataRouterState(DataRouterStateHook.UseRouteError);
	let routeId = useCurrentRouteId(DataRouterStateHook.UseRouteError);
	if (error !== void 0) return error;
	return (_state$errors = state.errors) == null ? void 0 : _state$errors[routeId];
}
/**
* Stable version of useNavigate that is used when we are in the context of
* a RouterProvider.
*/
function useNavigateStable() {
	let { router } = useDataRouterContext(DataRouterHook.UseNavigateStable);
	let id = useCurrentRouteId(DataRouterStateHook.UseNavigateStable);
	let activeRef = import_react.useRef(false);
	useIsomorphicLayoutEffect(() => {
		activeRef.current = true;
	});
	return import_react.useCallback(function(to, options) {
		if (options === void 0) options = {};
		if (!activeRef.current) return;
		if (typeof to === "number") router.navigate(to);
		else router.navigate(to, _extends({ fromRouteId: id }, options));
	}, [router, id]);
}
var alreadyWarned$1 = {};
function warningOnce(key, cond, message) {
	if (!cond && !alreadyWarned$1[key]) alreadyWarned$1[key] = true;
}
function warnOnce(key, message) {}
var logDeprecation = (flag, msg, link) => warnOnce(flag, "⚠️ React Router Future Flag Warning: " + msg + ". " + ("You can use the `" + flag + "` future flag to opt-in early. ") + ("For more information, see " + link + "."));
function logV6DeprecationWarnings(renderFuture, routerFuture) {
	if ((renderFuture == null ? void 0 : renderFuture.v7_startTransition) === void 0) logDeprecation("v7_startTransition", "React Router will begin wrapping state updates in `React.startTransition` in v7", "https://reactrouter.com/v6/upgrading/future#v7_starttransition");
	if ((renderFuture == null ? void 0 : renderFuture.v7_relativeSplatPath) === void 0 && (!routerFuture || routerFuture.v7_relativeSplatPath === void 0)) logDeprecation("v7_relativeSplatPath", "Relative route resolution within Splat routes is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath");
	if (routerFuture) {
		if (routerFuture.v7_fetcherPersist === void 0) logDeprecation("v7_fetcherPersist", "The persistence behavior of fetchers is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_fetcherpersist");
		if (routerFuture.v7_normalizeFormMethod === void 0) logDeprecation("v7_normalizeFormMethod", "Casing of `formMethod` fields is being normalized to uppercase in v7", "https://reactrouter.com/v6/upgrading/future#v7_normalizeformmethod");
		if (routerFuture.v7_partialHydration === void 0) logDeprecation("v7_partialHydration", "`RouterProvider` hydration behavior is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_partialhydration");
		if (routerFuture.v7_skipActionErrorRevalidation === void 0) logDeprecation("v7_skipActionErrorRevalidation", "The revalidation behavior after 4xx/5xx `action` responses is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_skipactionerrorrevalidation");
	}
}
/**
* Changes the current location.
*
* Note: This API is mostly useful in React.Component subclasses that are not
* able to use hooks. In functional components, we recommend you use the
* `useNavigate` hook instead.
*
* @see https://reactrouter.com/v6/components/navigate
*/
function Navigate(_ref4) {
	let { to, replace, state, relative } = _ref4;
	!useInRouterContext() && invariant$1(false);
	let { future, static: isStatic } = import_react.useContext(NavigationContext);
	let { matches } = import_react.useContext(RouteContext);
	let { pathname: locationPathname } = useLocation();
	let navigate = useNavigate();
	let path = resolveTo(to, getResolveToMatches(matches, future.v7_relativeSplatPath), locationPathname, relative === "path");
	let jsonPath = JSON.stringify(path);
	import_react.useEffect(() => navigate(JSON.parse(jsonPath), {
		replace,
		state,
		relative
	}), [
		navigate,
		jsonPath,
		relative,
		replace,
		state
	]);
	return null;
}
/**
* Declares an element that should be rendered at a certain URL path.
*
* @see https://reactrouter.com/v6/components/route
*/
function Route(_props) {
	invariant$1(false);
}
/**
* Provides location context for the rest of the app.
*
* Note: You usually won't render a `<Router>` directly. Instead, you'll render a
* router that is more specific to your environment such as a `<BrowserRouter>`
* in web browsers or a `<StaticRouter>` for server rendering.
*
* @see https://reactrouter.com/v6/router-components/router
*/
function Router(_ref5) {
	let { basename: basenameProp = "/", children = null, location: locationProp, navigationType = Action.Pop, navigator, static: staticProp = false, future } = _ref5;
	useInRouterContext() && invariant$1(false);
	let basename = basenameProp.replace(/^\/*/, "/");
	let navigationContext = import_react.useMemo(() => ({
		basename,
		navigator,
		static: staticProp,
		future: _extends({ v7_relativeSplatPath: false }, future)
	}), [
		basename,
		future,
		navigator,
		staticProp
	]);
	if (typeof locationProp === "string") locationProp = parsePath(locationProp);
	let { pathname = "/", search = "", hash = "", state = null, key = "default" } = locationProp;
	let locationContext = import_react.useMemo(() => {
		let trailingPathname = stripBasename(pathname, basename);
		if (trailingPathname == null) return null;
		return {
			location: {
				pathname: trailingPathname,
				search,
				hash,
				state,
				key
			},
			navigationType
		};
	}, [
		basename,
		pathname,
		search,
		hash,
		state,
		key,
		navigationType
	]);
	if (locationContext == null) return null;
	return /* @__PURE__ */ import_react.createElement(NavigationContext.Provider, { value: navigationContext }, /* @__PURE__ */ import_react.createElement(LocationContext.Provider, {
		children,
		value: locationContext
	}));
}
/**
* A container for a nested tree of `<Route>` elements that renders the branch
* that best matches the current location.
*
* @see https://reactrouter.com/v6/components/routes
*/
function Routes(_ref6) {
	let { children, location } = _ref6;
	return useRoutes(createRoutesFromChildren(children), location);
}
var AwaitRenderStatus = /* @__PURE__ */ function(AwaitRenderStatus) {
	AwaitRenderStatus[AwaitRenderStatus["pending"] = 0] = "pending";
	AwaitRenderStatus[AwaitRenderStatus["success"] = 1] = "success";
	AwaitRenderStatus[AwaitRenderStatus["error"] = 2] = "error";
	return AwaitRenderStatus;
}(AwaitRenderStatus || {});
new Promise(() => {});
import_react.Component;
/**
* Creates a route config from a React "children" object, which is usually
* either a `<Route>` element or an array of them. Used internally by
* `<Routes>` to create a route config from its children.
*
* @see https://reactrouter.com/v6/utils/create-routes-from-children
*/
function createRoutesFromChildren(children, parentPath) {
	if (parentPath === void 0) parentPath = [];
	let routes = [];
	import_react.Children.forEach(children, (element, index) => {
		if (!/* @__PURE__ */ import_react.isValidElement(element)) return;
		let treePath = [...parentPath, index];
		if (element.type === import_react.Fragment) {
			routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
			return;
		}
		!(element.type === Route) && invariant$1(false);
		!(!element.props.index || !element.props.children) && invariant$1(false);
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
		if (element.props.children) route.children = createRoutesFromChildren(element.props.children, treePath);
		routes.push(route);
	});
	return routes;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/subscribable.js
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
	onSubscribe() {}
	onUnsubscribe() {}
};
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/checkPrivateRedeclaration.js
function _checkPrivateRedeclaration(e, t) {
	if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/classPrivateFieldInitSpec.js
function _classPrivateFieldInitSpec(e, t, a) {
	_checkPrivateRedeclaration(e, t), t.set(e, a);
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/assertClassBrand.js
function _assertClassBrand(e, t, n) {
	if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
	throw new TypeError("Private element is not present on this object");
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/classPrivateFieldSet2.js
function _classPrivateFieldSet2(s, a, r) {
	return s.set(_assertClassBrand(s, a), r), r;
}
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/classPrivateFieldGet2.js
function _classPrivateFieldGet2(s, a) {
	return s.get(_assertClassBrand(s, a));
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/focusManager.js
var _focused, _cleanup$1, _setup$1;
var focusManager = new (_focused = /* @__PURE__ */ new WeakMap(), _cleanup$1 = /* @__PURE__ */ new WeakMap(), _setup$1 = /* @__PURE__ */ new WeakMap(), class extends Subscribable {
	constructor() {
		super();
		_classPrivateFieldInitSpec(this, _focused, void 0);
		_classPrivateFieldInitSpec(this, _cleanup$1, void 0);
		_classPrivateFieldInitSpec(this, _setup$1, void 0);
		_classPrivateFieldSet2(_setup$1, this, (onFocus) => {
			if (typeof window !== "undefined" && window.addEventListener) {
				const listener = () => onFocus();
				window.addEventListener("visibilitychange", listener, false);
				return () => {
					window.removeEventListener("visibilitychange", listener);
				};
			}
		});
	}
	onSubscribe() {
		if (!_classPrivateFieldGet2(_cleanup$1, this)) this.setEventListener(_classPrivateFieldGet2(_setup$1, this));
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			_classPrivateFieldGet2(_cleanup$1, this)?.call(this);
			_classPrivateFieldSet2(_cleanup$1, this, void 0);
		}
	}
	setEventListener(setup) {
		_classPrivateFieldSet2(_setup$1, this, setup);
		_classPrivateFieldGet2(_cleanup$1, this)?.call(this);
		_classPrivateFieldSet2(_cleanup$1, this, setup((focused) => {
			if (typeof focused === "boolean") this.setFocused(focused);
			else this.onFocus();
		}));
	}
	setFocused(focused) {
		if (_classPrivateFieldGet2(_focused, this) !== focused) {
			_classPrivateFieldSet2(_focused, this, focused);
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
		if (typeof _classPrivateFieldGet2(_focused, this) === "boolean") return _classPrivateFieldGet2(_focused, this);
		return globalThis.document?.visibilityState !== "hidden";
	}
})();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/timeoutManager.js
var _provider, _providerCalled;
var defaultTimeoutProvider = {
	setTimeout: (callback, delay) => setTimeout(callback, delay),
	clearTimeout: (timeoutId) => clearTimeout(timeoutId),
	setInterval: (callback, delay) => setInterval(callback, delay),
	clearInterval: (intervalId) => clearInterval(intervalId)
};
var timeoutManager = new (_provider = /* @__PURE__ */ new WeakMap(), _providerCalled = /* @__PURE__ */ new WeakMap(), class {
	constructor() {
		_classPrivateFieldInitSpec(this, _provider, defaultTimeoutProvider);
		_classPrivateFieldInitSpec(this, _providerCalled, false);
	}
	setTimeoutProvider(provider) {
		_classPrivateFieldSet2(_provider, this, provider);
	}
	setTimeout(callback, delay) {
		return _classPrivateFieldGet2(_provider, this).setTimeout(callback, delay);
	}
	clearTimeout(timeoutId) {
		_classPrivateFieldGet2(_provider, this).clearTimeout(timeoutId);
	}
	setInterval(callback, delay) {
		return _classPrivateFieldGet2(_provider, this).setInterval(callback, delay);
	}
	clearInterval(intervalId) {
		_classPrivateFieldGet2(_provider, this).clearInterval(intervalId);
	}
})();
function systemSetTimeoutZero(callback) {
	setTimeout(callback, 0);
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/utils.js
var isServer = typeof window === "undefined" || "Deno" in globalThis;
function noop$1() {}
function functionalUpdate(updater, input) {
	return typeof updater === "function" ? updater(input) : updater;
}
function isValidTimeout(value) {
	return typeof value === "number" && value >= 0 && value !== Infinity;
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
	const { type = "all", exact, fetchStatus, predicate, queryKey, stale } = filters;
	if (queryKey) {
		if (exact) {
			if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) return false;
		} else if (!partialMatchKey(query.queryKey, queryKey)) return false;
	}
	if (type !== "all") {
		const isActive = query.isActive();
		if (type === "active" && !isActive) return false;
		if (type === "inactive" && isActive) return false;
	}
	if (typeof stale === "boolean" && query.isStale() !== stale) return false;
	if (fetchStatus && fetchStatus !== query.state.fetchStatus) return false;
	if (predicate && !predicate(query)) return false;
	return true;
}
function matchMutation(filters, mutation) {
	const { exact, status, predicate, mutationKey } = filters;
	if (mutationKey) {
		if (!mutation.options.mutationKey) return false;
		if (exact) {
			if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) return false;
		} else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) return false;
	}
	if (status && mutation.state.status !== status) return false;
	if (predicate && !predicate(mutation)) return false;
	return true;
}
function hashQueryKeyByOptions(queryKey, options) {
	return (options?.queryKeyHashFn || hashKey)(queryKey);
}
function hashKey(queryKey) {
	return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
		result[key] = val[key];
		return result;
	}, {}) : val);
}
function partialMatchKey(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a && b && typeof a === "object" && typeof b === "object") return Object.keys(b).every((key) => partialMatchKey(a[key], b[key]));
	return false;
}
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(a, b, depth = 0) {
	if (a === b) return a;
	if (depth > 500) return b;
	const array = isPlainArray(a) && isPlainArray(b);
	if (!array && !(isPlainObject(a) && isPlainObject(b))) return b;
	const aSize = (array ? a : Object.keys(a)).length;
	const bItems = array ? b : Object.keys(b);
	const bSize = bItems.length;
	const copy = array ? new Array(bSize) : {};
	let equalItems = 0;
	for (let i = 0; i < bSize; i++) {
		const key = array ? i : bItems[i];
		const aItem = a[key];
		const bItem = b[key];
		if (aItem === bItem) {
			copy[key] = aItem;
			if (array ? i < aSize : hasOwn.call(a, key)) equalItems++;
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
	return aSize === bSize && equalItems === aSize ? a : copy;
}
function shallowEqualObjects(a, b) {
	if (!b || Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) if (a[key] !== b[key]) return false;
	return true;
}
function isPlainArray(value) {
	return Array.isArray(value) && value.length === Object.keys(value).length;
}
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	if (Object.getPrototypeOf(o) !== Object.prototype) return false;
	return true;
}
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
function sleep(timeout) {
	return new Promise((resolve) => {
		timeoutManager.setTimeout(resolve, timeout);
	});
}
function replaceData(prevData, data, options) {
	if (typeof options.structuralSharing === "function") return options.structuralSharing(prevData, data);
	else if (options.structuralSharing !== false) return replaceEqualDeep(prevData, data);
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
	if (!options.queryFn && fetchOptions?.initialPromise) return () => fetchOptions.initialPromise;
	if (!options.queryFn || options.queryFn === skipToken) return () => Promise.reject(/* @__PURE__ */ new Error(`Missing queryFn: '${options.queryHash}'`));
	return options.queryFn;
}
function shouldThrowError(throwOnError, params) {
	if (typeof throwOnError === "function") return throwOnError(...params);
	return !!throwOnError;
}
function addConsumeAwareSignal(object, getSignal, onCancelled) {
	let consumed = false;
	let signal;
	Object.defineProperty(object, "signal", {
		enumerable: true,
		get: () => {
			signal ?? (signal = getSignal());
			if (consumed) return signal;
			consumed = true;
			if (signal.aborted) onCancelled();
			else signal.addEventListener("abort", onCancelled, { once: true });
			return signal;
		}
	});
	return object;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/environmentManager.js
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
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/thenable.js
function pendingThenable() {
	let resolve;
	let reject;
	const thenable = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	thenable.status = "pending";
	thenable.catch(() => {});
	function finalize(data) {
		Object.assign(thenable, data);
		delete thenable.resolve;
		delete thenable.reject;
	}
	thenable.resolve = (value) => {
		finalize({
			status: "fulfilled",
			value
		});
		resolve(value);
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
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/notifyManager.js
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
		if (transactions) queue.push(callback);
		else scheduleFn(() => {
			notifyFn(callback);
		});
	};
	const flush = () => {
		const originalQueue = queue;
		queue = [];
		if (originalQueue.length) scheduleFn(() => {
			batchNotifyFn(() => {
				originalQueue.forEach((callback) => {
					notifyFn(callback);
				});
			});
		});
	};
	return {
		batch: (callback) => {
			let result;
			transactions++;
			try {
				result = callback();
			} finally {
				transactions--;
				if (!transactions) flush();
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
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/onlineManager.js
var _online, _cleanup, _setup;
var onlineManager = new (_online = /* @__PURE__ */ new WeakMap(), _cleanup = /* @__PURE__ */ new WeakMap(), _setup = /* @__PURE__ */ new WeakMap(), class extends Subscribable {
	constructor() {
		super();
		_classPrivateFieldInitSpec(this, _online, true);
		_classPrivateFieldInitSpec(this, _cleanup, void 0);
		_classPrivateFieldInitSpec(this, _setup, void 0);
		_classPrivateFieldSet2(_setup, this, (onOnline) => {
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
		});
	}
	onSubscribe() {
		if (!_classPrivateFieldGet2(_cleanup, this)) this.setEventListener(_classPrivateFieldGet2(_setup, this));
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			_classPrivateFieldGet2(_cleanup, this)?.call(this);
			_classPrivateFieldSet2(_cleanup, this, void 0);
		}
	}
	setEventListener(setup) {
		_classPrivateFieldSet2(_setup, this, setup);
		_classPrivateFieldGet2(_cleanup, this)?.call(this);
		_classPrivateFieldSet2(_cleanup, this, setup(this.setOnline.bind(this)));
	}
	setOnline(online) {
		if (_classPrivateFieldGet2(_online, this) !== online) {
			_classPrivateFieldSet2(_online, this, online);
			this.listeners.forEach((listener) => {
				listener(online);
			});
		}
	}
	isOnline() {
		return _classPrivateFieldGet2(_online, this);
	}
})();
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/retryer.js
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
	const resolve = (value) => {
		if (!isResolved()) {
			continueFn?.();
			thenable.resolve(value);
		}
	};
	const reject = (value) => {
		if (!isResolved()) {
			continueFn?.();
			thenable.reject(value);
		}
	};
	const pause = () => {
		return new Promise((continueResolve) => {
			continueFn = (value) => {
				if (isResolved() || canContinue()) continueResolve(value);
			};
			config.onPause?.();
		}).then(() => {
			continueFn = void 0;
			if (!isResolved()) config.onContinue?.();
		});
	};
	const run = () => {
		if (isResolved()) return;
		let promiseOrValue;
		const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
		try {
			promiseOrValue = initialPromise ?? config.fn();
		} catch (error) {
			promiseOrValue = Promise.reject(error);
		}
		Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
			if (isResolved()) return;
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
			sleep(delay).then(() => {
				return canContinue() ? void 0 : pause();
			}).then(() => {
				if (isRetryCancelled) reject(error);
				else run();
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
			if (canStart()) run();
			else pause().then(run);
			return thenable;
		}
	};
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/removable.js
var _gcTimeout;
var Removable = (_gcTimeout = /* @__PURE__ */ new WeakMap(), class {
	constructor() {
		_classPrivateFieldInitSpec(this, _gcTimeout, void 0);
	}
	destroy() {
		this.clearGcTimeout();
	}
	scheduleGc() {
		this.clearGcTimeout();
		if (isValidTimeout(this.gcTime)) _classPrivateFieldSet2(_gcTimeout, this, timeoutManager.setTimeout(() => {
			this.optionalRemove();
		}, this.gcTime));
	}
	updateGcTime(newGcTime) {
		this.gcTime = Math.max(this.gcTime || 0, newGcTime ?? (environmentManager.isServer() ? Infinity : 300 * 1e3));
	}
	clearGcTimeout() {
		if (_classPrivateFieldGet2(_gcTimeout, this) !== void 0) {
			timeoutManager.clearTimeout(_classPrivateFieldGet2(_gcTimeout, this));
			_classPrivateFieldSet2(_gcTimeout, this, void 0);
		}
	}
});
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
function infiniteQueryBehavior(pages) {
	return { onFetch: (context, query) => {
		const options = context.options;
		const direction = context.fetchOptions?.meta?.fetchMore?.direction;
		const oldPages = context.state.data?.pages || [];
		const oldPageParams = context.state.data?.pageParams || [];
		let result = {
			pages: [],
			pageParams: []
		};
		let currentPage = 0;
		const fetchFn = async () => {
			let cancelled = false;
			const addSignalProperty = (object) => {
				addConsumeAwareSignal(object, () => context.signal, () => cancelled = true);
			};
			const queryFn = ensureQueryFn(context.options, context.fetchOptions);
			const fetchPage = async (data, param, previous) => {
				if (cancelled) return Promise.reject(context.signal.reason);
				if (param == null && data.pages.length) return Promise.resolve(data);
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
				const page = await queryFn(createQueryFnContext());
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
				result = await fetchPage(oldData, pageParamFn(options, oldData), previous);
			} else {
				const remainingPages = pages ?? oldPages.length;
				do {
					const param = currentPage === 0 ? oldPageParams[0] ?? options.initialPageParam : getNextPageParam(options, result);
					if (currentPage > 0 && param == null) break;
					result = await fetchPage(result, param);
					currentPage++;
				} while (currentPage < remainingPages);
			}
			return result;
		};
		if (context.options.persister) context.fetchFn = () => {
			return context.options.persister?.(fetchFn, {
				client: context.client,
				queryKey: context.queryKey,
				meta: context.options.meta,
				signal: context.signal
			}, query);
		};
		else context.fetchFn = fetchFn;
	} };
}
function getNextPageParam(options, { pages, pageParams }) {
	const lastIndex = pages.length - 1;
	return pages.length > 0 ? options.getNextPageParam(pages[lastIndex], pages, pageParams[lastIndex], pageParams) : void 0;
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
//#endregion
//#region \0@oxc-project+runtime@0.127.0/helpers/classPrivateMethodInitSpec.js
function _classPrivateMethodInitSpec(e, a) {
	_checkPrivateRedeclaration(e, a), a.add(e);
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/query.js
var _queryType, _initialState, _revertState, _cache, _client$3, _retryer$1, _defaultOptions$1, _abortSignalConsumed, _Class_brand$3;
var Query = (_queryType = /* @__PURE__ */ new WeakMap(), _initialState = /* @__PURE__ */ new WeakMap(), _revertState = /* @__PURE__ */ new WeakMap(), _cache = /* @__PURE__ */ new WeakMap(), _client$3 = /* @__PURE__ */ new WeakMap(), _retryer$1 = /* @__PURE__ */ new WeakMap(), _defaultOptions$1 = /* @__PURE__ */ new WeakMap(), _abortSignalConsumed = /* @__PURE__ */ new WeakMap(), _Class_brand$3 = /* @__PURE__ */ new WeakSet(), class extends Removable {
	constructor(config) {
		super();
		_classPrivateMethodInitSpec(this, _Class_brand$3);
		_classPrivateFieldInitSpec(this, _queryType, void 0);
		_classPrivateFieldInitSpec(this, _initialState, void 0);
		_classPrivateFieldInitSpec(this, _revertState, void 0);
		_classPrivateFieldInitSpec(this, _cache, void 0);
		_classPrivateFieldInitSpec(this, _client$3, void 0);
		_classPrivateFieldInitSpec(this, _retryer$1, void 0);
		_classPrivateFieldInitSpec(this, _defaultOptions$1, void 0);
		_classPrivateFieldInitSpec(this, _abortSignalConsumed, void 0);
		_classPrivateFieldSet2(_abortSignalConsumed, this, false);
		_classPrivateFieldSet2(_defaultOptions$1, this, config.defaultOptions);
		this.setOptions(config.options);
		this.observers = [];
		_classPrivateFieldSet2(_client$3, this, config.client);
		_classPrivateFieldSet2(_cache, this, _classPrivateFieldGet2(_client$3, this).getQueryCache());
		this.queryKey = config.queryKey;
		this.queryHash = config.queryHash;
		_classPrivateFieldSet2(_initialState, this, getDefaultState$1(this.options));
		this.state = config.state ?? _classPrivateFieldGet2(_initialState, this);
		this.scheduleGc();
	}
	get meta() {
		return this.options.meta;
	}
	get queryType() {
		return _classPrivateFieldGet2(_queryType, this);
	}
	get promise() {
		return _classPrivateFieldGet2(_retryer$1, this)?.promise;
	}
	setOptions(options) {
		this.options = {
			..._classPrivateFieldGet2(_defaultOptions$1, this),
			...options
		};
		if (options?._type) _classPrivateFieldSet2(_queryType, this, options._type);
		this.updateGcTime(this.options.gcTime);
		if (this.state && this.state.data === void 0) {
			const defaultState = getDefaultState$1(this.options);
			if (defaultState.data !== void 0) {
				this.setState(successState(defaultState.data, defaultState.dataUpdatedAt));
				_classPrivateFieldSet2(_initialState, this, defaultState);
			}
		}
	}
	optionalRemove() {
		if (!this.observers.length && this.state.fetchStatus === "idle") _classPrivateFieldGet2(_cache, this).remove(this);
	}
	setData(newData, options) {
		const data = replaceData(this.state.data, newData, this.options);
		_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, {
			data,
			type: "success",
			dataUpdatedAt: options?.updatedAt,
			manual: options?.manual
		});
		return data;
	}
	setState(state) {
		_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, {
			type: "setState",
			state
		});
	}
	cancel(options) {
		const promise = _classPrivateFieldGet2(_retryer$1, this)?.promise;
		_classPrivateFieldGet2(_retryer$1, this)?.cancel(options);
		return promise ? promise.then(noop$1).catch(noop$1) : Promise.resolve();
	}
	destroy() {
		super.destroy();
		this.cancel({ silent: true });
	}
	get resetState() {
		return _classPrivateFieldGet2(_initialState, this);
	}
	reset() {
		this.destroy();
		this.setState(this.resetState);
	}
	isActive() {
		return this.observers.some((observer) => resolveQueryBoolean(observer.options.enabled, this) !== false);
	}
	isDisabled() {
		if (this.getObserversCount() > 0) return !this.isActive();
		return this.options.queryFn === skipToken || !this.isFetched();
	}
	isFetched() {
		return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
	}
	isStatic() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => resolveStaleTime(observer.options.staleTime, this) === "static");
		return false;
	}
	isStale() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => observer.getCurrentResult().isStale);
		return this.state.data === void 0 || this.state.isInvalidated;
	}
	isStaleByTime(staleTime = 0) {
		if (this.state.data === void 0) return true;
		if (staleTime === "static") return false;
		if (this.state.isInvalidated) return true;
		return !timeUntilStale(this.state.dataUpdatedAt, staleTime);
	}
	onFocus() {
		this.observers.find((x) => x.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: false });
		_classPrivateFieldGet2(_retryer$1, this)?.continue();
	}
	onOnline() {
		this.observers.find((x) => x.shouldFetchOnReconnect())?.refetch({ cancelRefetch: false });
		_classPrivateFieldGet2(_retryer$1, this)?.continue();
	}
	addObserver(observer) {
		if (!this.observers.includes(observer)) {
			this.observers.push(observer);
			this.clearGcTimeout();
			_classPrivateFieldGet2(_cache, this).notify({
				type: "observerAdded",
				query: this,
				observer
			});
		}
	}
	removeObserver(observer) {
		if (this.observers.includes(observer)) {
			this.observers = this.observers.filter((x) => x !== observer);
			if (!this.observers.length) {
				if (_classPrivateFieldGet2(_retryer$1, this)) if (_classPrivateFieldGet2(_abortSignalConsumed, this) || _assertClassBrand(_Class_brand$3, this, _isInitialPausedFetch).call(this)) _classPrivateFieldGet2(_retryer$1, this).cancel({ revert: true });
				else _classPrivateFieldGet2(_retryer$1, this).cancelRetry();
				this.scheduleGc();
			}
			_classPrivateFieldGet2(_cache, this).notify({
				type: "observerRemoved",
				query: this,
				observer
			});
		}
	}
	getObserversCount() {
		return this.observers.length;
	}
	invalidate() {
		if (!this.state.isInvalidated) _assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, { type: "invalidate" });
	}
	async fetch(options, fetchOptions) {
		if (this.state.fetchStatus !== "idle" && _classPrivateFieldGet2(_retryer$1, this)?.status() !== "rejected") {
			if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) this.cancel({ silent: true });
			else if (_classPrivateFieldGet2(_retryer$1, this)) {
				_classPrivateFieldGet2(_retryer$1, this).continueRetry();
				return _classPrivateFieldGet2(_retryer$1, this).promise;
			}
		}
		if (options) this.setOptions(options);
		if (!this.options.queryFn) {
			const observer = this.observers.find((x) => x.options.queryFn);
			if (observer) this.setOptions(observer.options);
		}
		const abortController = new AbortController();
		const addSignalProperty = (object) => {
			Object.defineProperty(object, "signal", {
				enumerable: true,
				get: () => {
					_classPrivateFieldSet2(_abortSignalConsumed, this, true);
					return abortController.signal;
				}
			});
		};
		const fetchFn = () => {
			const queryFn = ensureQueryFn(this.options, fetchOptions);
			const createQueryFnContext = () => {
				const queryFnContext2 = {
					client: _classPrivateFieldGet2(_client$3, this),
					queryKey: this.queryKey,
					meta: this.meta
				};
				addSignalProperty(queryFnContext2);
				return queryFnContext2;
			};
			const queryFnContext = createQueryFnContext();
			_classPrivateFieldSet2(_abortSignalConsumed, this, false);
			if (this.options.persister) return this.options.persister(queryFn, queryFnContext, this);
			return queryFn(queryFnContext);
		};
		const createFetchContext = () => {
			const context2 = {
				fetchOptions,
				options: this.options,
				queryKey: this.queryKey,
				client: _classPrivateFieldGet2(_client$3, this),
				state: this.state,
				fetchFn
			};
			addSignalProperty(context2);
			return context2;
		};
		const context = createFetchContext();
		(_classPrivateFieldGet2(_queryType, this) === "infinite" ? infiniteQueryBehavior(this.options.pages) : this.options.behavior)?.onFetch(context, this);
		_classPrivateFieldSet2(_revertState, this, this.state);
		if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== context.fetchOptions?.meta) _assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, {
			type: "fetch",
			meta: context.fetchOptions?.meta
		});
		_classPrivateFieldSet2(_retryer$1, this, createRetryer({
			initialPromise: fetchOptions?.initialPromise,
			fn: context.fetchFn,
			onCancel: (error) => {
				if (error instanceof CancelledError && error.revert) this.setState({
					..._classPrivateFieldGet2(_revertState, this),
					fetchStatus: "idle"
				});
				abortController.abort();
			},
			onFail: (failureCount, error) => {
				_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, {
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, { type: "pause" });
			},
			onContinue: () => {
				_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, { type: "continue" });
			},
			retry: context.options.retry,
			retryDelay: context.options.retryDelay,
			networkMode: context.options.networkMode,
			canRun: () => true
		}));
		try {
			const data = await _classPrivateFieldGet2(_retryer$1, this).start();
			if (data === void 0) throw new Error(`${this.queryHash} data is undefined`);
			this.setData(data);
			_classPrivateFieldGet2(_cache, this).config.onSuccess?.(data, this);
			_classPrivateFieldGet2(_cache, this).config.onSettled?.(data, this.state.error, this);
			return data;
		} catch (error) {
			if (error instanceof CancelledError) {
				if (error.silent) return _classPrivateFieldGet2(_retryer$1, this).promise;
				else if (error.revert) {
					if (this.state.data === void 0) throw error;
					return this.state.data;
				}
			}
			_assertClassBrand(_Class_brand$3, this, _dispatch$1).call(this, {
				type: "error",
				error
			});
			_classPrivateFieldGet2(_cache, this).config.onError?.(error, this);
			_classPrivateFieldGet2(_cache, this).config.onSettled?.(this.state.data, error, this);
			throw error;
		} finally {
			this.scheduleGc();
		}
	}
});
function _isInitialPausedFetch() {
	return this.state.fetchStatus === "paused" && this.state.status === "pending";
}
function _dispatch$1(action) {
	const reducer = (state) => {
		switch (action.type) {
			case "failed": return {
				...state,
				fetchFailureCount: action.failureCount,
				fetchFailureReason: action.error
			};
			case "pause": return {
				...state,
				fetchStatus: "paused"
			};
			case "continue": return {
				...state,
				fetchStatus: "fetching"
			};
			case "fetch": return {
				...state,
				...fetchState(state.data, this.options),
				fetchMeta: action.meta ?? null
			};
			case "success":
				const newState = {
					...state,
					...successState(action.data, action.dataUpdatedAt),
					dataUpdateCount: state.dataUpdateCount + 1,
					...!action.manual && {
						fetchStatus: "idle",
						fetchFailureCount: 0,
						fetchFailureReason: null
					}
				};
				_classPrivateFieldSet2(_revertState, this, action.manual ? newState : void 0);
				return newState;
			case "error":
				const error = action.error;
				return {
					...state,
					error,
					errorUpdateCount: state.errorUpdateCount + 1,
					errorUpdatedAt: Date.now(),
					fetchFailureCount: state.fetchFailureCount + 1,
					fetchFailureReason: error,
					fetchStatus: "idle",
					status: "error",
					isInvalidated: true
				};
			case "invalidate": return {
				...state,
				isInvalidated: true
			};
			case "setState": return {
				...state,
				...action.state
			};
		}
	};
	this.state = reducer(this.state);
	notifyManager.batch(() => {
		this.observers.forEach((observer) => {
			observer.onQueryUpdate();
		});
		_classPrivateFieldGet2(_cache, this).notify({
			query: this,
			type: "updated",
			action
		});
	});
}
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
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryObserver.js
var _client$2, _currentQuery, _currentQueryInitialState, _currentResult$1, _currentResultState, _currentResultOptions, _currentThenable, _selectError, _selectFn, _selectResult, _lastQueryWithDefinedData, _staleTimeoutId, _refetchIntervalId, _currentRefetchInterval, _trackedProps, _Class_brand$2;
var QueryObserver = (_client$2 = /* @__PURE__ */ new WeakMap(), _currentQuery = /* @__PURE__ */ new WeakMap(), _currentQueryInitialState = /* @__PURE__ */ new WeakMap(), _currentResult$1 = /* @__PURE__ */ new WeakMap(), _currentResultState = /* @__PURE__ */ new WeakMap(), _currentResultOptions = /* @__PURE__ */ new WeakMap(), _currentThenable = /* @__PURE__ */ new WeakMap(), _selectError = /* @__PURE__ */ new WeakMap(), _selectFn = /* @__PURE__ */ new WeakMap(), _selectResult = /* @__PURE__ */ new WeakMap(), _lastQueryWithDefinedData = /* @__PURE__ */ new WeakMap(), _staleTimeoutId = /* @__PURE__ */ new WeakMap(), _refetchIntervalId = /* @__PURE__ */ new WeakMap(), _currentRefetchInterval = /* @__PURE__ */ new WeakMap(), _trackedProps = /* @__PURE__ */ new WeakMap(), _Class_brand$2 = /* @__PURE__ */ new WeakSet(), class extends Subscribable {
	constructor(client, options) {
		super();
		_classPrivateMethodInitSpec(this, _Class_brand$2);
		_classPrivateFieldInitSpec(this, _client$2, void 0);
		_classPrivateFieldInitSpec(this, _currentQuery, void 0);
		_classPrivateFieldInitSpec(this, _currentQueryInitialState, void 0);
		_classPrivateFieldInitSpec(this, _currentResult$1, void 0);
		_classPrivateFieldInitSpec(this, _currentResultState, void 0);
		_classPrivateFieldInitSpec(this, _currentResultOptions, void 0);
		_classPrivateFieldInitSpec(this, _currentThenable, void 0);
		_classPrivateFieldInitSpec(this, _selectError, void 0);
		_classPrivateFieldInitSpec(this, _selectFn, void 0);
		_classPrivateFieldInitSpec(this, _selectResult, void 0);
		_classPrivateFieldInitSpec(this, _lastQueryWithDefinedData, void 0);
		_classPrivateFieldInitSpec(this, _staleTimeoutId, void 0);
		_classPrivateFieldInitSpec(this, _refetchIntervalId, void 0);
		_classPrivateFieldInitSpec(this, _currentRefetchInterval, void 0);
		_classPrivateFieldInitSpec(this, _trackedProps, /* @__PURE__ */ new Set());
		this.options = options;
		_classPrivateFieldSet2(_client$2, this, client);
		_classPrivateFieldSet2(_selectError, this, null);
		_classPrivateFieldSet2(_currentThenable, this, pendingThenable());
		this.bindMethods();
		this.setOptions(options);
	}
	bindMethods() {
		this.refetch = this.refetch.bind(this);
	}
	onSubscribe() {
		if (this.listeners.size === 1) {
			_classPrivateFieldGet2(_currentQuery, this).addObserver(this);
			if (shouldFetchOnMount(_classPrivateFieldGet2(_currentQuery, this), this.options)) _assertClassBrand(_Class_brand$2, this, _executeFetch).call(this);
			else this.updateResult();
			_assertClassBrand(_Class_brand$2, this, _updateTimers).call(this);
		}
	}
	onUnsubscribe() {
		if (!this.hasListeners()) this.destroy();
	}
	shouldFetchOnReconnect() {
		return shouldFetchOn(_classPrivateFieldGet2(_currentQuery, this), this.options, this.options.refetchOnReconnect);
	}
	shouldFetchOnWindowFocus() {
		return shouldFetchOn(_classPrivateFieldGet2(_currentQuery, this), this.options, this.options.refetchOnWindowFocus);
	}
	destroy() {
		this.listeners = /* @__PURE__ */ new Set();
		_assertClassBrand(_Class_brand$2, this, _clearStaleTimeout).call(this);
		_assertClassBrand(_Class_brand$2, this, _clearRefetchInterval).call(this);
		_classPrivateFieldGet2(_currentQuery, this).removeObserver(this);
	}
	setOptions(options) {
		const prevOptions = this.options;
		const prevQuery = _classPrivateFieldGet2(_currentQuery, this);
		this.options = _classPrivateFieldGet2(_client$2, this).defaultQueryOptions(options);
		if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveQueryBoolean(this.options.enabled, _classPrivateFieldGet2(_currentQuery, this)) !== "boolean") throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");
		_assertClassBrand(_Class_brand$2, this, _updateQuery).call(this);
		_classPrivateFieldGet2(_currentQuery, this).setOptions(this.options);
		if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) _classPrivateFieldGet2(_client$2, this).getQueryCache().notify({
			type: "observerOptionsUpdated",
			query: _classPrivateFieldGet2(_currentQuery, this),
			observer: this
		});
		const mounted = this.hasListeners();
		if (mounted && shouldFetchOptionally(_classPrivateFieldGet2(_currentQuery, this), prevQuery, this.options, prevOptions)) _assertClassBrand(_Class_brand$2, this, _executeFetch).call(this);
		this.updateResult();
		if (mounted && (_classPrivateFieldGet2(_currentQuery, this) !== prevQuery || resolveQueryBoolean(this.options.enabled, _classPrivateFieldGet2(_currentQuery, this)) !== resolveQueryBoolean(prevOptions.enabled, _classPrivateFieldGet2(_currentQuery, this)) || resolveStaleTime(this.options.staleTime, _classPrivateFieldGet2(_currentQuery, this)) !== resolveStaleTime(prevOptions.staleTime, _classPrivateFieldGet2(_currentQuery, this)))) _assertClassBrand(_Class_brand$2, this, _updateStaleTimeout).call(this);
		const nextRefetchInterval = _assertClassBrand(_Class_brand$2, this, _computeRefetchInterval).call(this);
		if (mounted && (_classPrivateFieldGet2(_currentQuery, this) !== prevQuery || resolveQueryBoolean(this.options.enabled, _classPrivateFieldGet2(_currentQuery, this)) !== resolveQueryBoolean(prevOptions.enabled, _classPrivateFieldGet2(_currentQuery, this)) || nextRefetchInterval !== _classPrivateFieldGet2(_currentRefetchInterval, this))) _assertClassBrand(_Class_brand$2, this, _updateRefetchInterval).call(this, nextRefetchInterval);
	}
	getOptimisticResult(options) {
		const query = _classPrivateFieldGet2(_client$2, this).getQueryCache().build(_classPrivateFieldGet2(_client$2, this), options);
		const result = this.createResult(query, options);
		if (shouldAssignObserverCurrentProperties(this, result)) {
			_classPrivateFieldSet2(_currentResult$1, this, result);
			_classPrivateFieldSet2(_currentResultOptions, this, this.options);
			_classPrivateFieldSet2(_currentResultState, this, _classPrivateFieldGet2(_currentQuery, this).state);
		}
		return result;
	}
	getCurrentResult() {
		return _classPrivateFieldGet2(_currentResult$1, this);
	}
	trackResult(result, onPropTracked) {
		return new Proxy(result, { get: (target, key) => {
			this.trackProp(key);
			onPropTracked?.(key);
			if (key === "promise") {
				this.trackProp("data");
				if (!this.options.experimental_prefetchInRender && _classPrivateFieldGet2(_currentThenable, this).status === "pending") _classPrivateFieldGet2(_currentThenable, this).reject(/* @__PURE__ */ new Error("experimental_prefetchInRender feature flag is not enabled"));
			}
			return Reflect.get(target, key);
		} });
	}
	trackProp(key) {
		_classPrivateFieldGet2(_trackedProps, this).add(key);
	}
	getCurrentQuery() {
		return _classPrivateFieldGet2(_currentQuery, this);
	}
	refetch({ ...options } = {}) {
		return this.fetch({ ...options });
	}
	fetchOptimistic(options) {
		const defaultedOptions = _classPrivateFieldGet2(_client$2, this).defaultQueryOptions(options);
		const query = _classPrivateFieldGet2(_client$2, this).getQueryCache().build(_classPrivateFieldGet2(_client$2, this), defaultedOptions);
		return query.fetch().then(() => this.createResult(query, defaultedOptions));
	}
	fetch(fetchOptions) {
		return _assertClassBrand(_Class_brand$2, this, _executeFetch).call(this, {
			...fetchOptions,
			cancelRefetch: fetchOptions.cancelRefetch ?? true
		}).then(() => {
			this.updateResult();
			return _classPrivateFieldGet2(_currentResult$1, this);
		});
	}
	createResult(query, options) {
		const prevQuery = _classPrivateFieldGet2(_currentQuery, this);
		const prevOptions = this.options;
		const prevResult = _classPrivateFieldGet2(_currentResult$1, this);
		const prevResultState = _classPrivateFieldGet2(_currentResultState, this);
		const prevResultOptions = _classPrivateFieldGet2(_currentResultOptions, this);
		const queryInitialState = query !== prevQuery ? query.state : _classPrivateFieldGet2(_currentQueryInitialState, this);
		const { state } = query;
		let newState = { ...state };
		let isPlaceholderData = false;
		let data;
		if (options._optimisticResults) {
			const mounted = this.hasListeners();
			const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
			const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
			if (fetchOnMount || fetchOptionally) newState = {
				...newState,
				...fetchState(state.data, query.options)
			};
			if (options._optimisticResults === "isRestoring") newState.fetchStatus = "idle";
		}
		let { error, errorUpdatedAt, status } = newState;
		data = newState.data;
		let skipSelect = false;
		if (options.placeholderData !== void 0 && data === void 0 && status === "pending") {
			let placeholderData;
			if (prevResult?.isPlaceholderData && options.placeholderData === prevResultOptions?.placeholderData) {
				placeholderData = prevResult.data;
				skipSelect = true;
			} else placeholderData = typeof options.placeholderData === "function" ? options.placeholderData(_classPrivateFieldGet2(_lastQueryWithDefinedData, this)?.state.data, _classPrivateFieldGet2(_lastQueryWithDefinedData, this)) : options.placeholderData;
			if (placeholderData !== void 0) {
				status = "success";
				data = replaceData(prevResult?.data, placeholderData, options);
				isPlaceholderData = true;
			}
		}
		if (options.select && data !== void 0 && !skipSelect) if (prevResult && data === prevResultState?.data && options.select === _classPrivateFieldGet2(_selectFn, this)) data = _classPrivateFieldGet2(_selectResult, this);
		else try {
			_classPrivateFieldSet2(_selectFn, this, options.select);
			data = options.select(data);
			data = replaceData(prevResult?.data, data, options);
			_classPrivateFieldSet2(_selectResult, this, data);
			_classPrivateFieldSet2(_selectError, this, null);
		} catch (selectError) {
			_classPrivateFieldSet2(_selectError, this, selectError);
		}
		if (_classPrivateFieldGet2(_selectError, this)) {
			error = _classPrivateFieldGet2(_selectError, this);
			data = _classPrivateFieldGet2(_selectResult, this);
			errorUpdatedAt = Date.now();
			status = "error";
		}
		const isFetching = newState.fetchStatus === "fetching";
		const isPending = status === "pending";
		const isError = status === "error";
		const isLoading = isPending && isFetching;
		const hasData = data !== void 0;
		const nextResult = {
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
			promise: _classPrivateFieldGet2(_currentThenable, this),
			isEnabled: resolveQueryBoolean(options.enabled, query) !== false
		};
		if (this.options.experimental_prefetchInRender) {
			const hasResultData = nextResult.data !== void 0;
			const isErrorWithoutData = nextResult.status === "error" && !hasResultData;
			const finalizeThenableIfPossible = (thenable) => {
				if (isErrorWithoutData) thenable.reject(nextResult.error);
				else if (hasResultData) thenable.resolve(nextResult.data);
			};
			const recreateThenable = () => {
				finalizeThenableIfPossible(_classPrivateFieldSet2(_currentThenable, this, nextResult.promise = pendingThenable()));
			};
			const prevThenable = _classPrivateFieldGet2(_currentThenable, this);
			switch (prevThenable.status) {
				case "pending":
					if (query.queryHash === prevQuery.queryHash) finalizeThenableIfPossible(prevThenable);
					break;
				case "fulfilled":
					if (isErrorWithoutData || nextResult.data !== prevThenable.value) recreateThenable();
					break;
				case "rejected":
					if (!isErrorWithoutData || nextResult.error !== prevThenable.reason) recreateThenable();
					break;
			}
		}
		return nextResult;
	}
	updateResult() {
		const prevResult = _classPrivateFieldGet2(_currentResult$1, this);
		const nextResult = this.createResult(_classPrivateFieldGet2(_currentQuery, this), this.options);
		_classPrivateFieldSet2(_currentResultState, this, _classPrivateFieldGet2(_currentQuery, this).state);
		_classPrivateFieldSet2(_currentResultOptions, this, this.options);
		if (_classPrivateFieldGet2(_currentResultState, this).data !== void 0) _classPrivateFieldSet2(_lastQueryWithDefinedData, this, _classPrivateFieldGet2(_currentQuery, this));
		if (shallowEqualObjects(nextResult, prevResult)) return;
		_classPrivateFieldSet2(_currentResult$1, this, nextResult);
		const shouldNotifyListeners = () => {
			if (!prevResult) return true;
			const { notifyOnChangeProps } = this.options;
			const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
			if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !_classPrivateFieldGet2(_trackedProps, this).size) return true;
			const includedProps = new Set(notifyOnChangePropsValue ?? _classPrivateFieldGet2(_trackedProps, this));
			if (this.options.throwOnError) includedProps.add("error");
			return Object.keys(_classPrivateFieldGet2(_currentResult$1, this)).some((key) => {
				const typedKey = key;
				return _classPrivateFieldGet2(_currentResult$1, this)[typedKey] !== prevResult[typedKey] && includedProps.has(typedKey);
			});
		};
		_assertClassBrand(_Class_brand$2, this, _notify$1).call(this, { listeners: shouldNotifyListeners() });
	}
	onQueryUpdate() {
		this.updateResult();
		if (this.hasListeners()) _assertClassBrand(_Class_brand$2, this, _updateTimers).call(this);
	}
});
function _executeFetch(fetchOptions) {
	_assertClassBrand(_Class_brand$2, this, _updateQuery).call(this);
	let promise = _classPrivateFieldGet2(_currentQuery, this).fetch(this.options, fetchOptions);
	if (!fetchOptions?.throwOnError) promise = promise.catch(noop$1);
	return promise;
}
function _updateStaleTimeout() {
	_assertClassBrand(_Class_brand$2, this, _clearStaleTimeout).call(this);
	const staleTime = resolveStaleTime(this.options.staleTime, _classPrivateFieldGet2(_currentQuery, this));
	if (environmentManager.isServer() || _classPrivateFieldGet2(_currentResult$1, this).isStale || !isValidTimeout(staleTime)) return;
	const timeout = timeUntilStale(_classPrivateFieldGet2(_currentResult$1, this).dataUpdatedAt, staleTime) + 1;
	_classPrivateFieldSet2(_staleTimeoutId, this, timeoutManager.setTimeout(() => {
		if (!_classPrivateFieldGet2(_currentResult$1, this).isStale) this.updateResult();
	}, timeout));
}
function _computeRefetchInterval() {
	return (typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(_classPrivateFieldGet2(_currentQuery, this)) : this.options.refetchInterval) ?? false;
}
function _updateRefetchInterval(nextInterval) {
	_assertClassBrand(_Class_brand$2, this, _clearRefetchInterval).call(this);
	_classPrivateFieldSet2(_currentRefetchInterval, this, nextInterval);
	if (environmentManager.isServer() || resolveQueryBoolean(this.options.enabled, _classPrivateFieldGet2(_currentQuery, this)) === false || !isValidTimeout(_classPrivateFieldGet2(_currentRefetchInterval, this)) || _classPrivateFieldGet2(_currentRefetchInterval, this) === 0) return;
	_classPrivateFieldSet2(_refetchIntervalId, this, timeoutManager.setInterval(() => {
		if (this.options.refetchIntervalInBackground || focusManager.isFocused()) _assertClassBrand(_Class_brand$2, this, _executeFetch).call(this);
	}, _classPrivateFieldGet2(_currentRefetchInterval, this)));
}
function _updateTimers() {
	_assertClassBrand(_Class_brand$2, this, _updateStaleTimeout).call(this);
	_assertClassBrand(_Class_brand$2, this, _updateRefetchInterval).call(this, _assertClassBrand(_Class_brand$2, this, _computeRefetchInterval).call(this));
}
function _clearStaleTimeout() {
	if (_classPrivateFieldGet2(_staleTimeoutId, this) !== void 0) {
		timeoutManager.clearTimeout(_classPrivateFieldGet2(_staleTimeoutId, this));
		_classPrivateFieldSet2(_staleTimeoutId, this, void 0);
	}
}
function _clearRefetchInterval() {
	if (_classPrivateFieldGet2(_refetchIntervalId, this) !== void 0) {
		timeoutManager.clearInterval(_classPrivateFieldGet2(_refetchIntervalId, this));
		_classPrivateFieldSet2(_refetchIntervalId, this, void 0);
	}
}
function _updateQuery() {
	const query = _classPrivateFieldGet2(_client$2, this).getQueryCache().build(_classPrivateFieldGet2(_client$2, this), this.options);
	if (query === _classPrivateFieldGet2(_currentQuery, this)) return;
	const prevQuery = _classPrivateFieldGet2(_currentQuery, this);
	_classPrivateFieldSet2(_currentQuery, this, query);
	_classPrivateFieldSet2(_currentQueryInitialState, this, query.state);
	if (this.hasListeners()) {
		prevQuery?.removeObserver(this);
		query.addObserver(this);
	}
}
function _notify$1(notifyOptions) {
	notifyManager.batch(() => {
		if (notifyOptions.listeners) this.listeners.forEach((listener) => {
			listener(_classPrivateFieldGet2(_currentResult$1, this));
		});
		_classPrivateFieldGet2(_client$2, this).getQueryCache().notify({
			query: _classPrivateFieldGet2(_currentQuery, this),
			type: "observerResultsUpdated"
		});
	});
}
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
	if (!shallowEqualObjects(observer.getCurrentResult(), optimisticResult)) return true;
	return false;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/infiniteQueryObserver.js
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
			meta: { fetchMore: { direction: "forward" } }
		});
	}
	fetchPreviousPage(options) {
		return this.fetch({
			...options,
			meta: { fetchMore: { direction: "backward" } }
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
		return {
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
	}
};
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutation.js
var _client$1, _observers, _mutationCache$1, _retryer, _Class_brand$1;
var Mutation = (_client$1 = /* @__PURE__ */ new WeakMap(), _observers = /* @__PURE__ */ new WeakMap(), _mutationCache$1 = /* @__PURE__ */ new WeakMap(), _retryer = /* @__PURE__ */ new WeakMap(), _Class_brand$1 = /* @__PURE__ */ new WeakSet(), class extends Removable {
	constructor(config) {
		super();
		_classPrivateMethodInitSpec(this, _Class_brand$1);
		_classPrivateFieldInitSpec(this, _client$1, void 0);
		_classPrivateFieldInitSpec(this, _observers, void 0);
		_classPrivateFieldInitSpec(this, _mutationCache$1, void 0);
		_classPrivateFieldInitSpec(this, _retryer, void 0);
		_classPrivateFieldSet2(_client$1, this, config.client);
		this.mutationId = config.mutationId;
		_classPrivateFieldSet2(_mutationCache$1, this, config.mutationCache);
		_classPrivateFieldSet2(_observers, this, []);
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
		if (!_classPrivateFieldGet2(_observers, this).includes(observer)) {
			_classPrivateFieldGet2(_observers, this).push(observer);
			this.clearGcTimeout();
			_classPrivateFieldGet2(_mutationCache$1, this).notify({
				type: "observerAdded",
				mutation: this,
				observer
			});
		}
	}
	removeObserver(observer) {
		_classPrivateFieldSet2(_observers, this, _classPrivateFieldGet2(_observers, this).filter((x) => x !== observer));
		this.scheduleGc();
		_classPrivateFieldGet2(_mutationCache$1, this).notify({
			type: "observerRemoved",
			mutation: this,
			observer
		});
	}
	optionalRemove() {
		if (!_classPrivateFieldGet2(_observers, this).length) if (this.state.status === "pending") this.scheduleGc();
		else _classPrivateFieldGet2(_mutationCache$1, this).remove(this);
	}
	continue() {
		return _classPrivateFieldGet2(_retryer, this)?.continue() ?? this.execute(this.state.variables);
	}
	async execute(variables) {
		const onContinue = () => {
			_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, { type: "continue" });
		};
		const mutationFnContext = {
			client: _classPrivateFieldGet2(_client$1, this),
			meta: this.options.meta,
			mutationKey: this.options.mutationKey
		};
		_classPrivateFieldSet2(_retryer, this, createRetryer({
			fn: () => {
				if (!this.options.mutationFn) return Promise.reject(/* @__PURE__ */ new Error("No mutationFn found"));
				return this.options.mutationFn(variables, mutationFnContext);
			},
			onFail: (failureCount, error) => {
				_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, {
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, { type: "pause" });
			},
			onContinue,
			retry: this.options.retry ?? 0,
			retryDelay: this.options.retryDelay,
			networkMode: this.options.networkMode,
			canRun: () => _classPrivateFieldGet2(_mutationCache$1, this).canRun(this)
		}));
		const restored = this.state.status === "pending";
		const isPaused = !_classPrivateFieldGet2(_retryer, this).canStart();
		try {
			if (restored) onContinue();
			else {
				_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, {
					type: "pending",
					variables,
					isPaused
				});
				if (_classPrivateFieldGet2(_mutationCache$1, this).config.onMutate) await _classPrivateFieldGet2(_mutationCache$1, this).config.onMutate(variables, this, mutationFnContext);
				const context = await this.options.onMutate?.(variables, mutationFnContext);
				if (context !== this.state.context) _assertClassBrand(_Class_brand$1, this, _dispatch).call(this, {
					type: "pending",
					context,
					variables,
					isPaused
				});
			}
			const data = await _classPrivateFieldGet2(_retryer, this).start();
			await _classPrivateFieldGet2(_mutationCache$1, this).config.onSuccess?.(data, variables, this.state.context, this, mutationFnContext);
			await this.options.onSuccess?.(data, variables, this.state.context, mutationFnContext);
			await _classPrivateFieldGet2(_mutationCache$1, this).config.onSettled?.(data, null, this.state.variables, this.state.context, this, mutationFnContext);
			await this.options.onSettled?.(data, null, variables, this.state.context, mutationFnContext);
			_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, {
				type: "success",
				data
			});
			return data;
		} catch (error) {
			try {
				await _classPrivateFieldGet2(_mutationCache$1, this).config.onError?.(error, variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onError?.(error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await _classPrivateFieldGet2(_mutationCache$1, this).config.onSettled?.(void 0, error, this.state.variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onSettled?.(void 0, error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			_assertClassBrand(_Class_brand$1, this, _dispatch).call(this, {
				type: "error",
				error
			});
			throw error;
		} finally {
			_classPrivateFieldGet2(_mutationCache$1, this).runNext(this);
		}
	}
});
function _dispatch(action) {
	const reducer = (state) => {
		switch (action.type) {
			case "failed": return {
				...state,
				failureCount: action.failureCount,
				failureReason: action.error
			};
			case "pause": return {
				...state,
				isPaused: true
			};
			case "continue": return {
				...state,
				isPaused: false
			};
			case "pending": return {
				...state,
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
			case "success": return {
				...state,
				data: action.data,
				failureCount: 0,
				failureReason: null,
				error: null,
				status: "success",
				isPaused: false
			};
			case "error": return {
				...state,
				data: void 0,
				error: action.error,
				failureCount: state.failureCount + 1,
				failureReason: action.error,
				isPaused: false,
				status: "error"
			};
		}
	};
	this.state = reducer(this.state);
	notifyManager.batch(() => {
		_classPrivateFieldGet2(_observers, this).forEach((observer) => {
			observer.onMutationUpdate(action);
		});
		_classPrivateFieldGet2(_mutationCache$1, this).notify({
			mutation: this,
			type: "updated",
			action
		});
	});
}
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
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationCache.js
var _mutations, _scopes, _mutationId;
var MutationCache = (_mutations = /* @__PURE__ */ new WeakMap(), _scopes = /* @__PURE__ */ new WeakMap(), _mutationId = /* @__PURE__ */ new WeakMap(), class extends Subscribable {
	constructor(config = {}) {
		super();
		_classPrivateFieldInitSpec(this, _mutations, void 0);
		_classPrivateFieldInitSpec(this, _scopes, void 0);
		_classPrivateFieldInitSpec(this, _mutationId, void 0);
		this.config = config;
		_classPrivateFieldSet2(_mutations, this, /* @__PURE__ */ new Set());
		_classPrivateFieldSet2(_scopes, this, /* @__PURE__ */ new Map());
		_classPrivateFieldSet2(_mutationId, this, 0);
	}
	build(client, options, state) {
		var _this$mutationId;
		const mutation = new Mutation({
			client,
			mutationCache: this,
			mutationId: _classPrivateFieldSet2(_mutationId, this, (_this$mutationId = _classPrivateFieldGet2(_mutationId, this), ++_this$mutationId)),
			options: client.defaultMutationOptions(options),
			state
		});
		this.add(mutation);
		return mutation;
	}
	add(mutation) {
		_classPrivateFieldGet2(_mutations, this).add(mutation);
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const scopedMutations = _classPrivateFieldGet2(_scopes, this).get(scope);
			if (scopedMutations) scopedMutations.push(mutation);
			else _classPrivateFieldGet2(_scopes, this).set(scope, [mutation]);
		}
		this.notify({
			type: "added",
			mutation
		});
	}
	remove(mutation) {
		if (_classPrivateFieldGet2(_mutations, this).delete(mutation)) {
			const scope = scopeFor(mutation);
			if (typeof scope === "string") {
				const scopedMutations = _classPrivateFieldGet2(_scopes, this).get(scope);
				if (scopedMutations) {
					if (scopedMutations.length > 1) {
						const index = scopedMutations.indexOf(mutation);
						if (index !== -1) scopedMutations.splice(index, 1);
					} else if (scopedMutations[0] === mutation) _classPrivateFieldGet2(_scopes, this).delete(scope);
				}
			}
		}
		this.notify({
			type: "removed",
			mutation
		});
	}
	canRun(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const firstPendingMutation = _classPrivateFieldGet2(_scopes, this).get(scope)?.find((m) => m.state.status === "pending");
			return !firstPendingMutation || firstPendingMutation === mutation;
		} else return true;
	}
	runNext(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") return (_classPrivateFieldGet2(_scopes, this).get(scope)?.find((m) => m !== mutation && m.state.isPaused))?.continue() ?? Promise.resolve();
		else return Promise.resolve();
	}
	clear() {
		notifyManager.batch(() => {
			_classPrivateFieldGet2(_mutations, this).forEach((mutation) => {
				this.notify({
					type: "removed",
					mutation
				});
			});
			_classPrivateFieldGet2(_mutations, this).clear();
			_classPrivateFieldGet2(_scopes, this).clear();
		});
	}
	getAll() {
		return Array.from(_classPrivateFieldGet2(_mutations, this));
	}
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((mutation) => matchMutation(defaultedFilters, mutation));
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
		return notifyManager.batch(() => Promise.all(pausedMutations.map((mutation) => mutation.continue().catch(noop$1))));
	}
});
function scopeFor(mutation) {
	return mutation.options.scope?.id;
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/mutationObserver.js
var _client, _currentResult, _currentMutation, _mutateOptions, _Class_brand;
var MutationObserver = (_client = /* @__PURE__ */ new WeakMap(), _currentResult = /* @__PURE__ */ new WeakMap(), _currentMutation = /* @__PURE__ */ new WeakMap(), _mutateOptions = /* @__PURE__ */ new WeakMap(), _Class_brand = /* @__PURE__ */ new WeakSet(), class extends Subscribable {
	constructor(client, options) {
		super();
		_classPrivateMethodInitSpec(this, _Class_brand);
		_classPrivateFieldInitSpec(this, _client, void 0);
		_classPrivateFieldInitSpec(this, _currentResult, void 0);
		_classPrivateFieldInitSpec(this, _currentMutation, void 0);
		_classPrivateFieldInitSpec(this, _mutateOptions, void 0);
		_classPrivateFieldSet2(_client, this, client);
		this.setOptions(options);
		this.bindMethods();
		_assertClassBrand(_Class_brand, this, _updateResult).call(this);
	}
	bindMethods() {
		this.mutate = this.mutate.bind(this);
		this.reset = this.reset.bind(this);
	}
	setOptions(options) {
		const prevOptions = this.options;
		this.options = _classPrivateFieldGet2(_client, this).defaultMutationOptions(options);
		if (!shallowEqualObjects(this.options, prevOptions)) _classPrivateFieldGet2(_client, this).getMutationCache().notify({
			type: "observerOptionsUpdated",
			mutation: _classPrivateFieldGet2(_currentMutation, this),
			observer: this
		});
		if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) this.reset();
		else if (_classPrivateFieldGet2(_currentMutation, this)?.state.status === "pending") _classPrivateFieldGet2(_currentMutation, this).setOptions(this.options);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) _classPrivateFieldGet2(_currentMutation, this)?.removeObserver(this);
	}
	onMutationUpdate(action) {
		_assertClassBrand(_Class_brand, this, _updateResult).call(this);
		_assertClassBrand(_Class_brand, this, _notify).call(this, action);
	}
	getCurrentResult() {
		return _classPrivateFieldGet2(_currentResult, this);
	}
	reset() {
		_classPrivateFieldGet2(_currentMutation, this)?.removeObserver(this);
		_classPrivateFieldSet2(_currentMutation, this, void 0);
		_assertClassBrand(_Class_brand, this, _updateResult).call(this);
		_assertClassBrand(_Class_brand, this, _notify).call(this);
	}
	mutate(variables, options) {
		_classPrivateFieldSet2(_mutateOptions, this, options);
		_classPrivateFieldGet2(_currentMutation, this)?.removeObserver(this);
		_classPrivateFieldSet2(_currentMutation, this, _classPrivateFieldGet2(_client, this).getMutationCache().build(_classPrivateFieldGet2(_client, this), this.options));
		_classPrivateFieldGet2(_currentMutation, this).addObserver(this);
		return _classPrivateFieldGet2(_currentMutation, this).execute(variables);
	}
});
function _updateResult() {
	const state = _classPrivateFieldGet2(_currentMutation, this)?.state ?? getDefaultState();
	_classPrivateFieldSet2(_currentResult, this, {
		...state,
		isPending: state.status === "pending",
		isSuccess: state.status === "success",
		isError: state.status === "error",
		isIdle: state.status === "idle",
		mutate: this.mutate,
		reset: this.reset
	});
}
function _notify(action) {
	notifyManager.batch(() => {
		if (_classPrivateFieldGet2(_mutateOptions, this) && this.hasListeners()) {
			const variables = _classPrivateFieldGet2(_currentResult, this).variables;
			const onMutateResult = _classPrivateFieldGet2(_currentResult, this).context;
			const context = {
				client: _classPrivateFieldGet2(_client, this),
				meta: this.options.meta,
				mutationKey: this.options.mutationKey
			};
			if (action?.type === "success") {
				try {
					_classPrivateFieldGet2(_mutateOptions, this).onSuccess?.(action.data, variables, onMutateResult, context);
				} catch (e) {
					Promise.reject(e);
				}
				try {
					_classPrivateFieldGet2(_mutateOptions, this).onSettled?.(action.data, null, variables, onMutateResult, context);
				} catch (e) {
					Promise.reject(e);
				}
			} else if (action?.type === "error") {
				try {
					_classPrivateFieldGet2(_mutateOptions, this).onError?.(action.error, variables, onMutateResult, context);
				} catch (e) {
					Promise.reject(e);
				}
				try {
					_classPrivateFieldGet2(_mutateOptions, this).onSettled?.(void 0, action.error, variables, onMutateResult, context);
				} catch (e) {
					Promise.reject(e);
				}
			}
		}
		this.listeners.forEach((listener) => {
			listener(_classPrivateFieldGet2(_currentResult, this));
		});
	});
}
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryCache.js
var _queries;
var QueryCache = (_queries = /* @__PURE__ */ new WeakMap(), class extends Subscribable {
	constructor(config = {}) {
		super();
		_classPrivateFieldInitSpec(this, _queries, void 0);
		this.config = config;
		_classPrivateFieldSet2(_queries, this, /* @__PURE__ */ new Map());
	}
	build(client, options, state) {
		const queryKey = options.queryKey;
		const queryHash = options.queryHash ?? hashQueryKeyByOptions(queryKey, options);
		let query = this.get(queryHash);
		if (!query) {
			query = new Query({
				client,
				queryKey,
				queryHash,
				options: client.defaultQueryOptions(options),
				state,
				defaultOptions: client.getQueryDefaults(queryKey)
			});
			this.add(query);
		}
		return query;
	}
	add(query) {
		if (!_classPrivateFieldGet2(_queries, this).has(query.queryHash)) {
			_classPrivateFieldGet2(_queries, this).set(query.queryHash, query);
			this.notify({
				type: "added",
				query
			});
		}
	}
	remove(query) {
		const queryInMap = _classPrivateFieldGet2(_queries, this).get(query.queryHash);
		if (queryInMap) {
			query.destroy();
			if (queryInMap === query) _classPrivateFieldGet2(_queries, this).delete(query.queryHash);
			this.notify({
				type: "removed",
				query
			});
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
		return _classPrivateFieldGet2(_queries, this).get(queryHash);
	}
	getAll() {
		return [..._classPrivateFieldGet2(_queries, this).values()];
	}
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((query) => matchQuery(defaultedFilters, query));
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
});
//#endregion
//#region node_modules/@tanstack/query-core/build/modern/queryClient.js
var _queryCache, _mutationCache, _defaultOptions, _queryDefaults, _mutationDefaults, _mountCount, _unsubscribeFocus, _unsubscribeOnline;
var QueryClient = (_queryCache = /* @__PURE__ */ new WeakMap(), _mutationCache = /* @__PURE__ */ new WeakMap(), _defaultOptions = /* @__PURE__ */ new WeakMap(), _queryDefaults = /* @__PURE__ */ new WeakMap(), _mutationDefaults = /* @__PURE__ */ new WeakMap(), _mountCount = /* @__PURE__ */ new WeakMap(), _unsubscribeFocus = /* @__PURE__ */ new WeakMap(), _unsubscribeOnline = /* @__PURE__ */ new WeakMap(), class {
	constructor(config = {}) {
		_classPrivateFieldInitSpec(this, _queryCache, void 0);
		_classPrivateFieldInitSpec(this, _mutationCache, void 0);
		_classPrivateFieldInitSpec(this, _defaultOptions, void 0);
		_classPrivateFieldInitSpec(this, _queryDefaults, void 0);
		_classPrivateFieldInitSpec(this, _mutationDefaults, void 0);
		_classPrivateFieldInitSpec(this, _mountCount, void 0);
		_classPrivateFieldInitSpec(this, _unsubscribeFocus, void 0);
		_classPrivateFieldInitSpec(this, _unsubscribeOnline, void 0);
		_classPrivateFieldSet2(_queryCache, this, config.queryCache || new QueryCache());
		_classPrivateFieldSet2(_mutationCache, this, config.mutationCache || new MutationCache());
		_classPrivateFieldSet2(_defaultOptions, this, config.defaultOptions || {});
		_classPrivateFieldSet2(_queryDefaults, this, /* @__PURE__ */ new Map());
		_classPrivateFieldSet2(_mutationDefaults, this, /* @__PURE__ */ new Map());
		_classPrivateFieldSet2(_mountCount, this, 0);
	}
	mount() {
		var _this$mountCount;
		_classPrivateFieldSet2(_mountCount, this, (_this$mountCount = _classPrivateFieldGet2(_mountCount, this), _this$mountCount++, _this$mountCount));
		if (_classPrivateFieldGet2(_mountCount, this) !== 1) return;
		_classPrivateFieldSet2(_unsubscribeFocus, this, focusManager.subscribe(async (focused) => {
			if (focused) {
				await this.resumePausedMutations();
				_classPrivateFieldGet2(_queryCache, this).onFocus();
			}
		}));
		_classPrivateFieldSet2(_unsubscribeOnline, this, onlineManager.subscribe(async (online) => {
			if (online) {
				await this.resumePausedMutations();
				_classPrivateFieldGet2(_queryCache, this).onOnline();
			}
		}));
	}
	unmount() {
		var _this$mountCount3;
		_classPrivateFieldSet2(_mountCount, this, (_this$mountCount3 = _classPrivateFieldGet2(_mountCount, this), _this$mountCount3--, _this$mountCount3));
		if (_classPrivateFieldGet2(_mountCount, this) !== 0) return;
		_classPrivateFieldGet2(_unsubscribeFocus, this)?.call(this);
		_classPrivateFieldSet2(_unsubscribeFocus, this, void 0);
		_classPrivateFieldGet2(_unsubscribeOnline, this)?.call(this);
		_classPrivateFieldSet2(_unsubscribeOnline, this, void 0);
	}
	isFetching(filters) {
		return _classPrivateFieldGet2(_queryCache, this).findAll({
			...filters,
			fetchStatus: "fetching"
		}).length;
	}
	isMutating(filters) {
		return _classPrivateFieldGet2(_mutationCache, this).findAll({
			...filters,
			status: "pending"
		}).length;
	}
	/**
	* Imperative (non-reactive) way to retrieve data for a QueryKey.
	* Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
	*
	* Hint: Do not use this function inside a component, because it won't receive updates.
	* Use `useQuery` to create a `QueryObserver` that subscribes to changes.
	*/
	getQueryData(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return _classPrivateFieldGet2(_queryCache, this).get(options.queryHash)?.state.data;
	}
	ensureQueryData(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		const query = _classPrivateFieldGet2(_queryCache, this).build(this, defaultedOptions);
		const cachedData = query.state.data;
		if (cachedData === void 0) return this.fetchQuery(options);
		if (options.revalidateIfStale && query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))) this.prefetchQuery(defaultedOptions);
		return Promise.resolve(cachedData);
	}
	getQueriesData(filters) {
		return _classPrivateFieldGet2(_queryCache, this).findAll(filters).map(({ queryKey, state }) => {
			return [queryKey, state.data];
		});
	}
	setQueryData(queryKey, updater, options) {
		const defaultedOptions = this.defaultQueryOptions({ queryKey });
		const prevData = _classPrivateFieldGet2(_queryCache, this).get(defaultedOptions.queryHash)?.state.data;
		const data = functionalUpdate(updater, prevData);
		if (data === void 0) return;
		return _classPrivateFieldGet2(_queryCache, this).build(this, defaultedOptions).setData(data, {
			...options,
			manual: true
		});
	}
	setQueriesData(filters, updater, options) {
		return notifyManager.batch(() => _classPrivateFieldGet2(_queryCache, this).findAll(filters).map(({ queryKey }) => [queryKey, this.setQueryData(queryKey, updater, options)]));
	}
	getQueryState(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return _classPrivateFieldGet2(_queryCache, this).get(options.queryHash)?.state;
	}
	removeQueries(filters) {
		const queryCache = _classPrivateFieldGet2(_queryCache, this);
		notifyManager.batch(() => {
			queryCache.findAll(filters).forEach((query) => {
				queryCache.remove(query);
			});
		});
	}
	resetQueries(filters, options) {
		const queryCache = _classPrivateFieldGet2(_queryCache, this);
		return notifyManager.batch(() => {
			queryCache.findAll(filters).forEach((query) => {
				query.reset();
			});
			return this.refetchQueries({
				type: "active",
				...filters
			}, options);
		});
	}
	cancelQueries(filters, cancelOptions = {}) {
		const defaultedCancelOptions = {
			revert: true,
			...cancelOptions
		};
		const promises = notifyManager.batch(() => _classPrivateFieldGet2(_queryCache, this).findAll(filters).map((query) => query.cancel(defaultedCancelOptions)));
		return Promise.all(promises).then(noop$1).catch(noop$1);
	}
	invalidateQueries(filters, options = {}) {
		return notifyManager.batch(() => {
			_classPrivateFieldGet2(_queryCache, this).findAll(filters).forEach((query) => {
				query.invalidate();
			});
			if (filters?.refetchType === "none") return Promise.resolve();
			return this.refetchQueries({
				...filters,
				type: filters?.refetchType ?? filters?.type ?? "active"
			}, options);
		});
	}
	refetchQueries(filters, options = {}) {
		const fetchOptions = {
			...options,
			cancelRefetch: options.cancelRefetch ?? true
		};
		const promises = notifyManager.batch(() => _classPrivateFieldGet2(_queryCache, this).findAll(filters).filter((query) => !query.isDisabled() && !query.isStatic()).map((query) => {
			let promise = query.fetch(void 0, fetchOptions);
			if (!fetchOptions.throwOnError) promise = promise.catch(noop$1);
			return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
		}));
		return Promise.all(promises).then(noop$1);
	}
	fetchQuery(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
		const query = _classPrivateFieldGet2(_queryCache, this).build(this, defaultedOptions);
		return query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query)) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
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
		if (onlineManager.isOnline()) return _classPrivateFieldGet2(_mutationCache, this).resumePausedMutations();
		return Promise.resolve();
	}
	getQueryCache() {
		return _classPrivateFieldGet2(_queryCache, this);
	}
	getMutationCache() {
		return _classPrivateFieldGet2(_mutationCache, this);
	}
	getDefaultOptions() {
		return _classPrivateFieldGet2(_defaultOptions, this);
	}
	setDefaultOptions(options) {
		_classPrivateFieldSet2(_defaultOptions, this, options);
	}
	setQueryDefaults(queryKey, options) {
		_classPrivateFieldGet2(_queryDefaults, this).set(hashKey(queryKey), {
			queryKey,
			defaultOptions: options
		});
	}
	getQueryDefaults(queryKey) {
		const defaults = [..._classPrivateFieldGet2(_queryDefaults, this).values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(queryKey, queryDefault.queryKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	setMutationDefaults(mutationKey, options) {
		_classPrivateFieldGet2(_mutationDefaults, this).set(hashKey(mutationKey), {
			mutationKey,
			defaultOptions: options
		});
	}
	getMutationDefaults(mutationKey) {
		const defaults = [..._classPrivateFieldGet2(_mutationDefaults, this).values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(mutationKey, queryDefault.mutationKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	defaultQueryOptions(options) {
		if (options._defaulted) return options;
		const defaultedOptions = {
			..._classPrivateFieldGet2(_defaultOptions, this).queries,
			...this.getQueryDefaults(options.queryKey),
			...options,
			_defaulted: true
		};
		if (!defaultedOptions.queryHash) defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
		if (defaultedOptions.refetchOnReconnect === void 0) defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
		if (defaultedOptions.throwOnError === void 0) defaultedOptions.throwOnError = !!defaultedOptions.suspense;
		if (!defaultedOptions.networkMode && defaultedOptions.persister) defaultedOptions.networkMode = "offlineFirst";
		if (defaultedOptions.queryFn === skipToken) defaultedOptions.enabled = false;
		return defaultedOptions;
	}
	defaultMutationOptions(options) {
		if (options?._defaulted) return options;
		return {
			..._classPrivateFieldGet2(_defaultOptions, this).mutations,
			...options?.mutationKey && this.getMutationDefaults(options.mutationKey),
			...options,
			_defaulted: true
		};
	}
	clear() {
		_classPrivateFieldGet2(_queryCache, this).clear();
		_classPrivateFieldGet2(_mutationCache, this).clear();
	}
});
//#endregion
//#region node_modules/engine.io-parser/build/esm/commons.js
var PACKET_TYPES = Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
var PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
	PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
var ERROR_PACKET = {
	type: "error",
	data: "parser error"
};
//#endregion
//#region node_modules/engine.io-parser/build/esm/encodePacket.browser.js
var withNativeBlob$1 = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
var withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
var isView$1 = (obj) => {
	return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
var encodePacket = ({ type, data }, supportsBinary, callback) => {
	if (withNativeBlob$1 && data instanceof Blob) if (supportsBinary) return callback(data);
	else return encodeBlobAsBase64(data, callback);
	else if (withNativeArrayBuffer$2 && (data instanceof ArrayBuffer || isView$1(data))) if (supportsBinary) return callback(data);
	else return encodeBlobAsBase64(new Blob([data]), callback);
	return callback(PACKET_TYPES[type] + (data || ""));
};
var encodeBlobAsBase64 = (data, callback) => {
	const fileReader = new FileReader();
	fileReader.onload = function() {
		const content = fileReader.result.split(",")[1];
		callback("b" + (content || ""));
	};
	return fileReader.readAsDataURL(data);
};
function toArray(data) {
	if (data instanceof Uint8Array) return data;
	else if (data instanceof ArrayBuffer) return new Uint8Array(data);
	else return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
var TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
	if (withNativeBlob$1 && packet.data instanceof Blob) return packet.data.arrayBuffer().then(toArray).then(callback);
	else if (withNativeArrayBuffer$2 && (packet.data instanceof ArrayBuffer || isView$1(packet.data))) return callback(toArray(packet.data));
	encodePacket(packet, false, (encoded) => {
		if (!TEXT_ENCODER) TEXT_ENCODER = new TextEncoder();
		callback(TEXT_ENCODER.encode(encoded));
	});
}
//#endregion
//#region node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (let i = 0; i < 64; i++) lookup[chars.charCodeAt(i)] = i;
var decode$1 = (base64) => {
	let bufferLength = base64.length * .75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
	if (base64[base64.length - 1] === "=") {
		bufferLength--;
		if (base64[base64.length - 2] === "=") bufferLength--;
	}
	const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
	for (i = 0; i < len; i += 4) {
		encoded1 = lookup[base64.charCodeAt(i)];
		encoded2 = lookup[base64.charCodeAt(i + 1)];
		encoded3 = lookup[base64.charCodeAt(i + 2)];
		encoded4 = lookup[base64.charCodeAt(i + 3)];
		bytes[p++] = encoded1 << 2 | encoded2 >> 4;
		bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
		bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	}
	return arraybuffer;
};
//#endregion
//#region node_modules/engine.io-parser/build/esm/decodePacket.browser.js
var withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
var decodePacket = (encodedPacket, binaryType) => {
	if (typeof encodedPacket !== "string") return {
		type: "message",
		data: mapBinary(encodedPacket, binaryType)
	};
	const type = encodedPacket.charAt(0);
	if (type === "b") return {
		type: "message",
		data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
	};
	if (!PACKET_TYPES_REVERSE[type]) return ERROR_PACKET;
	return encodedPacket.length > 1 ? {
		type: PACKET_TYPES_REVERSE[type],
		data: encodedPacket.substring(1)
	} : { type: PACKET_TYPES_REVERSE[type] };
};
var decodeBase64Packet = (data, binaryType) => {
	if (withNativeArrayBuffer$1) return mapBinary(decode$1(data), binaryType);
	else return {
		base64: true,
		data
	};
};
var mapBinary = (data, binaryType) => {
	switch (binaryType) {
		case "blob": if (data instanceof Blob) return data;
		else return new Blob([data]);
		default: if (data instanceof ArrayBuffer) return data;
		else return data.buffer;
	}
};
//#endregion
//#region node_modules/engine.io-parser/build/esm/index.js
var SEPARATOR = String.fromCharCode(30);
var encodePayload = (packets, callback) => {
	const length = packets.length;
	const encodedPackets = new Array(length);
	let count = 0;
	packets.forEach((packet, i) => {
		encodePacket(packet, false, (encodedPacket) => {
			encodedPackets[i] = encodedPacket;
			if (++count === length) callback(encodedPackets.join(SEPARATOR));
		});
	});
};
var decodePayload = (encodedPayload, binaryType) => {
	const encodedPackets = encodedPayload.split(SEPARATOR);
	const packets = [];
	for (let i = 0; i < encodedPackets.length; i++) {
		const decodedPacket = decodePacket(encodedPackets[i], binaryType);
		packets.push(decodedPacket);
		if (decodedPacket.type === "error") break;
	}
	return packets;
};
function createPacketEncoderStream() {
	return new TransformStream({ transform(packet, controller) {
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
			if (packet.data && typeof packet.data !== "string") header[0] |= 128;
			controller.enqueue(header);
			controller.enqueue(encodedPacket);
		});
	} });
}
var TEXT_DECODER;
function totalLength(chunks) {
	return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
	if (chunks[0].length === size) return chunks.shift();
	const buffer = new Uint8Array(size);
	let j = 0;
	for (let i = 0; i < size; i++) {
		buffer[i] = chunks[0][j++];
		if (j === chunks[0].length) {
			chunks.shift();
			j = 0;
		}
	}
	if (chunks.length && j < chunks[0].length) chunks[0] = chunks[0].slice(j);
	return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
	if (!TEXT_DECODER) TEXT_DECODER = new TextDecoder();
	const chunks = [];
	let state = 0;
	let expectedLength = -1;
	let isBinary = false;
	return new TransformStream({ transform(chunk, controller) {
		chunks.push(chunk);
		while (true) {
			if (state === 0) {
				if (totalLength(chunks) < 1) break;
				const header = concatChunks(chunks, 1);
				isBinary = (header[0] & 128) === 128;
				expectedLength = header[0] & 127;
				if (expectedLength < 126) state = 3;
				else if (expectedLength === 126) state = 1;
				else state = 2;
			} else if (state === 1) {
				if (totalLength(chunks) < 2) break;
				const headerArray = concatChunks(chunks, 2);
				expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
				state = 3;
			} else if (state === 2) {
				if (totalLength(chunks) < 8) break;
				const headerArray = concatChunks(chunks, 8);
				const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
				const n = view.getUint32(0);
				if (n > Math.pow(2, 21) - 1) {
					controller.enqueue(ERROR_PACKET);
					break;
				}
				expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
				state = 3;
			} else {
				if (totalLength(chunks) < expectedLength) break;
				const data = concatChunks(chunks, expectedLength);
				controller.enqueue(decodePacket(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
				state = 0;
			}
			if (expectedLength === 0 || expectedLength > maxPayload) {
				controller.enqueue(ERROR_PACKET);
				break;
			}
		}
	} });
}
//#endregion
//#region node_modules/@socket.io/component-emitter/lib/esm/index.js
/**
* Initialize a new `Emitter`.
*
* @api public
*/
function Emitter(obj) {
	if (obj) return mixin(obj);
}
/**
* Mixin the emitter properties.
*
* @param {Object} obj
* @return {Object}
* @api private
*/
function mixin(obj) {
	for (var key in Emitter.prototype) obj[key] = Emitter.prototype[key];
	return obj;
}
/**
* Listen on the given `event` with `fn`.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
	this._callbacks = this._callbacks || {};
	(this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
	return this;
};
/**
* Adds an `event` listener that will be invoked a single
* time then automatically removed.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
Emitter.prototype.once = function(event, fn) {
	function on() {
		this.off(event, on);
		fn.apply(this, arguments);
	}
	on.fn = fn;
	this.on(event, on);
	return this;
};
/**
* Remove the given callback for `event` or all
* registered callbacks.
*
* @param {String} event
* @param {Function} fn
* @return {Emitter}
* @api public
*/
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
	for (var i = 0; i < callbacks.length; i++) {
		cb = callbacks[i];
		if (cb === fn || cb.fn === fn) {
			callbacks.splice(i, 1);
			break;
		}
	}
	if (callbacks.length === 0) delete this._callbacks["$" + event];
	return this;
};
/**
* Emit `event` with the given args.
*
* @param {String} event
* @param {Mixed} ...
* @return {Emitter}
*/
Emitter.prototype.emit = function(event) {
	this._callbacks = this._callbacks || {};
	var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
	for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
	if (callbacks) {
		callbacks = callbacks.slice(0);
		for (var i = 0, len = callbacks.length; i < len; ++i) callbacks[i].apply(this, args);
	}
	return this;
};
Emitter.prototype.emitReserved = Emitter.prototype.emit;
/**
* Return array of callbacks for `event`.
*
* @param {String} event
* @return {Array}
* @api public
*/
Emitter.prototype.listeners = function(event) {
	this._callbacks = this._callbacks || {};
	return this._callbacks["$" + event] || [];
};
/**
* Check if this emitter has `event` handlers.
*
* @param {String} event
* @return {Boolean}
* @api public
*/
Emitter.prototype.hasListeners = function(event) {
	return !!this.listeners(event).length;
};
//#endregion
//#region node_modules/engine.io-client/build/esm/globals.js
var nextTick = (() => {
	if (typeof Promise === "function" && typeof Promise.resolve === "function") return (cb) => Promise.resolve().then(cb);
	else return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
})();
var globalThisShim = (() => {
	if (typeof self !== "undefined") return self;
	else if (typeof window !== "undefined") return window;
	else return Function("return this")();
})();
var defaultBinaryType = "arraybuffer";
function createCookieJar() {}
//#endregion
//#region node_modules/engine.io-client/build/esm/util.js
function pick(obj, ...attr) {
	return attr.reduce((acc, k) => {
		if (obj.hasOwnProperty(k)) acc[k] = obj[k];
		return acc;
	}, {});
}
var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
	if (opts.useNativeTimers) {
		obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
		obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
	} else {
		obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
		obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
	}
}
var BASE64_OVERHEAD = 1.33;
function byteLength(obj) {
	if (typeof obj === "string") return utf8Length(obj);
	return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
	let c = 0, length = 0;
	for (let i = 0, l = str.length; i < l; i++) {
		c = str.charCodeAt(i);
		if (c < 128) length += 1;
		else if (c < 2048) length += 2;
		else if (c < 55296 || c >= 57344) length += 3;
		else {
			i++;
			length += 4;
		}
	}
	return length;
}
/**
* Generates a random 8-characters string.
*/
function randomString() {
	return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
//#endregion
//#region node_modules/engine.io-client/build/esm/contrib/parseqs.js
/**
* Compiles a querystring
* Returns string representation of the object
*
* @param {Object}
* @api private
*/
function encode(obj) {
	let str = "";
	for (let i in obj) if (obj.hasOwnProperty(i)) {
		if (str.length) str += "&";
		str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
	}
	return str;
}
/**
* Parses a simple querystring into an object
*
* @param {String} qs
* @api private
*/
function decode(qs) {
	let qry = {};
	let pairs = qs.split("&");
	for (let i = 0, l = pairs.length; i < l; i++) {
		let pair = pairs[i].split("=");
		qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	}
	return qry;
}
//#endregion
//#region node_modules/engine.io-client/build/esm/transport.js
var TransportError = class extends Error {
	constructor(reason, description, context) {
		super(reason);
		this.description = description;
		this.context = context;
		this.type = "TransportError";
	}
};
var Transport = class extends Emitter {
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
		if (this.readyState === "open") this.write(packets);
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
	pause(onPause) {}
	createUri(schema, query = {}) {
		return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
	}
	_hostname() {
		const hostname = this.opts.hostname;
		return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
	}
	_port() {
		if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) return ":" + this.opts.port;
		else return "";
	}
	_query(query) {
		const encodedQuery = encode(query);
		return encodedQuery.length ? "?" + encodedQuery : "";
	}
};
//#endregion
//#region node_modules/engine.io-client/build/esm/transports/polling.js
var Polling = class extends Transport {
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
		} else pause();
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
			if ("opening" === this.readyState && packet.type === "open") this.onOpen();
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
			if ("open" === this.readyState) this._poll();
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
		if ("open" === this.readyState) close();
		else this.once("open", close);
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
		if (false !== this.opts.timestampRequests) query[this.opts.timestampParam] = randomString();
		if (!this.supportsBinary && !query.sid) query.b64 = 1;
		return this.createUri(schema, query);
	}
};
//#endregion
//#region node_modules/engine.io-client/build/esm/contrib/has-cors.js
var value = false;
try {
	value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
} catch (err) {}
var hasCORS = value;
//#endregion
//#region node_modules/engine.io-client/build/esm/transports/polling-xhr.js
function empty() {}
var BaseXHR = class extends Polling {
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
			if (!port) port = isSSL ? "443" : "80";
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
};
var Request$1 = class Request$1 extends Emitter {
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
		var _a;
		const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
		opts.xdomain = !!this._opts.xd;
		const xhr = this._xhr = this.createRequest(opts);
		try {
			xhr.open(this._method, this._uri, true);
			try {
				if (this._opts.extraHeaders) {
					xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
					for (let i in this._opts.extraHeaders) if (this._opts.extraHeaders.hasOwnProperty(i)) xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
				}
			} catch (e) {}
			if ("POST" === this._method) try {
				xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
			} catch (e) {}
			try {
				xhr.setRequestHeader("Accept", "*/*");
			} catch (e) {}
			(_a = this._opts.cookieJar) === null || _a === void 0 || _a.addCookies(xhr);
			if ("withCredentials" in xhr) xhr.withCredentials = this._opts.withCredentials;
			if (this._opts.requestTimeout) xhr.timeout = this._opts.requestTimeout;
			xhr.onreadystatechange = () => {
				var _a;
				if (xhr.readyState === 3) (_a = this._opts.cookieJar) === null || _a === void 0 || _a.parseCookies(xhr.getResponseHeader("set-cookie"));
				if (4 !== xhr.readyState) return;
				if (200 === xhr.status || 1223 === xhr.status) this._onLoad();
				else this.setTimeoutFn(() => {
					this._onError(typeof xhr.status === "number" ? xhr.status : 0);
				}, 0);
			};
			xhr.send(this._data);
		} catch (e) {
			this.setTimeoutFn(() => {
				this._onError(e);
			}, 0);
			return;
		}
		if (typeof document !== "undefined") {
			this._index = Request$1.requestsCount++;
			Request$1.requests[this._index] = this;
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
		if ("undefined" === typeof this._xhr || null === this._xhr) return;
		this._xhr.onreadystatechange = empty;
		if (fromError) try {
			this._xhr.abort();
		} catch (e) {}
		if (typeof document !== "undefined") delete Request$1.requests[this._index];
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
};
Request$1.requestsCount = 0;
Request$1.requests = {};
/**
* Aborts pending requests when unloading the window. This is needed to prevent
* memory leaks (e.g. when using IE) and to ensure that no spurious error is
* emitted.
*/
if (typeof document !== "undefined") {
	if (typeof attachEvent === "function") attachEvent("onunload", unloadHandler);
	else if (typeof addEventListener === "function") {
		const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
		addEventListener(terminationEvent, unloadHandler, false);
	}
}
function unloadHandler() {
	for (let i in Request$1.requests) if (Request$1.requests.hasOwnProperty(i)) Request$1.requests[i].abort();
}
var hasXHR2 = (function() {
	const xhr = newRequest({ xdomain: false });
	return xhr && xhr.responseType !== null;
})();
/**
* HTTP long-polling based on the built-in `XMLHttpRequest` object.
*
* Usage: browser
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
*/
var XHR = class extends BaseXHR {
	constructor(opts) {
		super(opts);
		const forceBase64 = opts && opts.forceBase64;
		this.supportsBinary = hasXHR2 && !forceBase64;
	}
	request(opts = {}) {
		Object.assign(opts, { xd: this.xd }, this.opts);
		return new Request$1(newRequest, this.uri(), opts);
	}
};
function newRequest(opts) {
	const xdomain = opts.xdomain;
	try {
		if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) return new XMLHttpRequest();
	} catch (e) {}
	if (!xdomain) try {
		return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
	} catch (e) {}
}
//#endregion
//#region node_modules/engine.io-client/build/esm/transports/websocket.js
var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
var BaseWS = class extends Transport {
	get name() {
		return "websocket";
	}
	doOpen() {
		const uri = this.uri();
		const protocols = this.opts.protocols;
		const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
		if (this.opts.extraHeaders) opts.headers = this.opts.extraHeaders;
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
			if (this.opts.autoUnref) this.ws._socket.unref();
			this.onOpen();
		};
		this.ws.onclose = (closeEvent) => this.onClose({
			description: "websocket connection closed",
			context: closeEvent
		});
		this.ws.onmessage = (ev) => this.onData(ev.data);
		this.ws.onerror = (e) => this.onError("websocket error", e);
	}
	write(packets) {
		this.writable = false;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			const lastPacket = i === packets.length - 1;
			encodePacket(packet, this.supportsBinary, (data) => {
				try {
					this.doWrite(packet, data);
				} catch (e) {}
				if (lastPacket) nextTick(() => {
					this.writable = true;
					this.emitReserved("drain");
				}, this.setTimeoutFn);
			});
		}
	}
	doClose() {
		if (typeof this.ws !== "undefined") {
			this.ws.onerror = () => {};
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
		if (this.opts.timestampRequests) query[this.opts.timestampParam] = randomString();
		if (!this.supportsBinary) query.b64 = 1;
		return this.createUri(schema, query);
	}
};
var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
/**
* WebSocket transport based on the built-in `WebSocket` object.
*
* Usage: browser, Node.js (since v21), Deno, Bun
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
* @see https://caniuse.com/mdn-api_websocket
* @see https://nodejs.org/api/globals.html#websocket
*/
var WS = class extends BaseWS {
	createSocket(uri, protocols, opts) {
		return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
	}
	doWrite(_packet, data) {
		this.ws.send(data);
	}
};
//#endregion
//#region node_modules/engine.io-client/build/esm/transports/webtransport.js
/**
* WebTransport transport based on the built-in `WebTransport` object.
*
* Usage: browser, Node.js (with the `@fails-components/webtransport` package)
*
* @see https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
* @see https://caniuse.com/webtransport
*/
var WT = class extends Transport {
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
					reader.read().then(({ done, value }) => {
						if (done) return;
						this.onPacket(value);
						read();
					}).catch((err) => {});
				};
				read();
				const packet = { type: "open" };
				if (this.query.sid) packet.data = `{"sid":"${this.query.sid}"}`;
				this._writer.write(packet).then(() => this.onOpen());
			});
		});
	}
	write(packets) {
		this.writable = false;
		for (let i = 0; i < packets.length; i++) {
			const packet = packets[i];
			const lastPacket = i === packets.length - 1;
			this._writer.write(packet).then(() => {
				if (lastPacket) nextTick(() => {
					this.writable = true;
					this.emitReserved("drain");
				}, this.setTimeoutFn);
			});
		}
	}
	doClose() {
		var _a;
		(_a = this._transport) === null || _a === void 0 || _a.close();
	}
};
//#endregion
//#region node_modules/engine.io-client/build/esm/transports/index.js
var transports = {
	websocket: WS,
	webtransport: WT,
	polling: XHR
};
//#endregion
//#region node_modules/engine.io-client/build/esm/contrib/parseuri.js
/**
* Parses a URI
*
* Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
*
* See:
* - https://developer.mozilla.org/en-US/docs/Web/API/URL
* - https://caniuse.com/url
* - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
*
* History of the parse() method:
* - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
* - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
* - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
*
* @author Steven Levithan <stevenlevithan.com> (MIT license)
* @api private
*/
var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
var parts = [
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
	if (str.length > 8e3) throw "URI too long";
	const src = str, b = str.indexOf("["), e = str.indexOf("]");
	if (b != -1 && e != -1) str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
	let m = re.exec(str || ""), uri = {}, i = 14;
	while (i--) uri[parts[i]] = m[i] || "";
	if (b != -1 && e != -1) {
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
	const names = path.replace(/\/{2,9}/g, "/").split("/");
	if (path.slice(0, 1) == "/" || path.length === 0) names.splice(0, 1);
	if (path.slice(-1) == "/") names.splice(names.length - 1, 1);
	return names;
}
function queryKey(uri, query) {
	const data = {};
	query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
		if ($1) data[$1] = $2;
	});
	return data;
}
//#endregion
//#region node_modules/engine.io-client/build/esm/socket.js
var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
var OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) addEventListener("offline", () => {
	OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
}, false);
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes without upgrade mechanism, which means that it will keep the first low-level transport that
* successfully establishes the connection.
*
* In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
*
* @example
* import { SocketWithoutUpgrade, WebSocket } from "engine.io-client";
*
* const socket = new SocketWithoutUpgrade({
*   transports: [WebSocket]
* });
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithUpgrade
* @see Socket
*/
var SocketWithoutUpgrade = class SocketWithoutUpgrade extends Emitter {
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
		/**
		* The expiration timestamp of the {@link _pingTimeoutTimer} object is tracked, in case the timer is throttled and the
		* callback is not fired on time. This can happen for example when a laptop is suspended or when a phone is locked.
		*/
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
			if (parsedUri.query) opts.query = parsedUri.query;
		} else if (opts.host) opts.hostname = parse(opts.host).host;
		installTimerFunctions(this, opts);
		this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
		if (opts.hostname && !opts.port) opts.port = this.secure ? "443" : "80";
		this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
		this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
		this.transports = [];
		this._transportsByName = {};
		opts.transports.forEach((t) => {
			const transportName = t.prototype.name;
			this.transports.push(transportName);
			this._transportsByName[transportName] = t;
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
			perMessageDeflate: { threshold: 1024 },
			transportOptions: {},
			closeOnBeforeunload: false
		}, opts);
		this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
		if (typeof this.opts.query === "string") this.opts.query = decode(this.opts.query);
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
					this._onClose("transport close", { description: "network connection lost" });
				};
				OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
			}
		}
		if (this.opts.withCredentials) this._cookieJar = /* @__PURE__ */ createCookieJar();
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
		query.EIO = 4;
		query.transport = name;
		if (this.id) query.sid = this.id;
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
		if (this.transport) this.transport.removeAllListeners();
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
					const err = /* @__PURE__ */ new Error("server error");
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
		if ("closed" === this.readyState) return;
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
		if (this.opts.autoUnref) this._pingTimeoutTimer.unref();
	}
	/**
	* Called on `drain` event
	*
	* @private
	*/
	_onDrain() {
		this.writeBuffer.splice(0, this._prevBufferLen);
		this._prevBufferLen = 0;
		if (0 === this.writeBuffer.length) this.emitReserved("drain");
		else this.flush();
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
		if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1)) return this.writeBuffer;
		let payloadSize = 1;
		for (let i = 0; i < this.writeBuffer.length; i++) {
			const data = this.writeBuffer[i].data;
			if (data) payloadSize += byteLength(data);
			if (i > 0 && payloadSize > this._maxPayload) return this.writeBuffer.slice(0, i);
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
	_hasPingExpired() {
		if (!this._pingTimeoutTime) return true;
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
		if ("closing" === this.readyState || "closed" === this.readyState) return;
		options = options || {};
		options.compress = false !== options.compress;
		const packet = {
			type,
			data,
			options
		};
		this.emitReserved("packetCreate", packet);
		this.writeBuffer.push(packet);
		if (fn) this.once("flush", fn);
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
			if (this.writeBuffer.length) this.once("drain", () => {
				if (this.upgrading) waitForUpgrade();
				else close();
			});
			else if (this.upgrading) waitForUpgrade();
			else close();
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
				if (this._beforeunloadEventListener) removeEventListener("beforeunload", this._beforeunloadEventListener, false);
				if (this._offlineEventListener) {
					const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
					if (i !== -1) OFFLINE_EVENT_LISTENERS.splice(i, 1);
				}
			}
			this.readyState = "closed";
			this.id = null;
			this.emitReserved("close", reason, description);
			this.writeBuffer = [];
			this._prevBufferLen = 0;
		}
	}
};
SocketWithoutUpgrade.protocol = 4;
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes with an upgrade mechanism, which means that once the connection is established with the first
* low-level transport, it will try to upgrade to a better transport.
*
* In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
*
* @example
* import { SocketWithUpgrade, WebSocket } from "engine.io-client";
*
* const socket = new SocketWithUpgrade({
*   transports: [WebSocket]
* });
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithoutUpgrade
* @see Socket
*/
var SocketWithUpgrade = class extends SocketWithoutUpgrade {
	constructor() {
		super(...arguments);
		this._upgrades = [];
	}
	onOpen() {
		super.onOpen();
		if ("open" === this.readyState && this.opts.upgrade) for (let i = 0; i < this._upgrades.length; i++) this._probe(this._upgrades[i]);
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
			if (failed) return;
			transport.send([{
				type: "ping",
				data: "probe"
			}]);
			transport.once("packet", (msg) => {
				if (failed) return;
				if ("pong" === msg.type && "probe" === msg.data) {
					this.upgrading = true;
					this.emitReserved("upgrading", transport);
					if (!transport) return;
					SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
					this.transport.pause(() => {
						if (failed) return;
						if ("closed" === this.readyState) return;
						cleanup();
						this.setTransport(transport);
						transport.send([{ type: "upgrade" }]);
						this.emitReserved("upgrade", transport);
						transport = null;
						this.upgrading = false;
						this.flush();
					});
				} else {
					const err = /* @__PURE__ */ new Error("probe error");
					err.transport = transport.name;
					this.emitReserved("upgradeError", err);
				}
			});
		};
		function freezeTransport() {
			if (failed) return;
			failed = true;
			cleanup();
			transport.close();
			transport = null;
		}
		const onerror = (err) => {
			const error = /* @__PURE__ */ new Error("probe error: " + err);
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
			if (transport && to.name !== transport.name) freezeTransport();
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
		if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") this.setTimeoutFn(() => {
			if (!failed) transport.open();
		}, 200);
		else transport.open();
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
		for (let i = 0; i < upgrades.length; i++) if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
		return filteredUpgrades;
	}
};
/**
* This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
* with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
*
* This class comes with an upgrade mechanism, which means that once the connection is established with the first
* low-level transport, it will try to upgrade to a better transport.
*
* @example
* import { Socket } from "engine.io-client";
*
* const socket = new Socket();
*
* socket.on("open", () => {
*   socket.send("hello");
* });
*
* @see SocketWithoutUpgrade
* @see SocketWithUpgrade
*/
var Socket = class extends SocketWithUpgrade {
	constructor(uri, opts = {}) {
		const o = typeof uri === "object" ? uri : opts;
		if (!o.transports || o.transports && typeof o.transports[0] === "string") o.transports = (o.transports || [
			"polling",
			"websocket",
			"webtransport"
		]).map((transportName) => transports[transportName]).filter((t) => !!t);
		super(uri, o);
	}
};
Socket.protocol;
//#endregion
//#region node_modules/socket.io-parser/build/esm/is-binary.js
var withNativeArrayBuffer = typeof ArrayBuffer === "function";
var isView = (obj) => {
	return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
/**
* Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
*
* @private
*/
function isBinary(obj) {
	return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
}
function hasBinary(obj, toJSON) {
	if (!obj || typeof obj !== "object") return false;
	if (Array.isArray(obj)) {
		for (let i = 0, l = obj.length; i < l; i++) if (hasBinary(obj[i])) return true;
		return false;
	}
	if (isBinary(obj)) return true;
	if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) return hasBinary(obj.toJSON(), true);
	for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) return true;
	return false;
}
//#endregion
//#region node_modules/socket.io-parser/build/esm/binary.js
/**
* Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
*
* @param {Object} packet - socket.io event packet
* @return {Object} with deconstructed packet and list of buffers
* @public
*/
function deconstructPacket(packet) {
	const buffers = [];
	const packetData = packet.data;
	const pack = packet;
	pack.data = _deconstructPacket(packetData, buffers);
	pack.attachments = buffers.length;
	return {
		packet: pack,
		buffers
	};
}
function _deconstructPacket(data, buffers) {
	if (!data) return data;
	if (isBinary(data)) {
		const placeholder = {
			_placeholder: true,
			num: buffers.length
		};
		buffers.push(data);
		return placeholder;
	} else if (Array.isArray(data)) {
		const newData = new Array(data.length);
		for (let i = 0; i < data.length; i++) newData[i] = _deconstructPacket(data[i], buffers);
		return newData;
	} else if (typeof data === "object" && !(data instanceof Date)) {
		const newData = {};
		for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) newData[key] = _deconstructPacket(data[key], buffers);
		return newData;
	}
	return data;
}
/**
* Reconstructs a binary packet from its placeholder packet and buffers
*
* @param {Object} packet - event packet with placeholders
* @param {Array} buffers - binary buffers to put in placeholder positions
* @return {Object} reconstructed packet
* @public
*/
function reconstructPacket(packet, buffers) {
	packet.data = _reconstructPacket(packet.data, buffers);
	delete packet.attachments;
	return packet;
}
function _reconstructPacket(data, buffers) {
	if (!data) return data;
	if (data && data._placeholder === true) if (typeof data.num === "number" && data.num >= 0 && data.num < buffers.length) return buffers[data.num];
	else throw new Error("illegal attachments");
	else if (Array.isArray(data)) for (let i = 0; i < data.length; i++) data[i] = _reconstructPacket(data[i], buffers);
	else if (typeof data === "object") {
		for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) data[key] = _reconstructPacket(data[key], buffers);
	}
	return data;
}
//#endregion
//#region node_modules/socket.io-parser/build/esm/index.js
var esm_exports = /* @__PURE__ */ __exportAll({
	Decoder: () => Decoder,
	Encoder: () => Encoder,
	PacketType: () => PacketType,
	isPacketValid: () => isPacketValid,
	protocol: () => 5
});
/**
* These strings must not be used as event names, as they have a special meaning.
*/
var RESERVED_EVENTS = [
	"connect",
	"connect_error",
	"disconnect",
	"disconnecting",
	"newListener",
	"removeListener"
];
var PacketType;
(function(PacketType) {
	PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
	PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
	PacketType[PacketType["EVENT"] = 2] = "EVENT";
	PacketType[PacketType["ACK"] = 3] = "ACK";
	PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
	PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
	PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
/**
* A socket.io Encoder instance
*/
var Encoder = class {
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
			if (hasBinary(obj)) return this.encodeAsBinary({
				type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
				nsp: obj.nsp,
				data: obj.data,
				id: obj.id
			});
		}
		return [this.encodeAsString(obj)];
	}
	/**
	* Encode packet as string.
	*/
	encodeAsString(obj) {
		let str = "" + obj.type;
		if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) str += obj.attachments + "-";
		if (obj.nsp && "/" !== obj.nsp) str += obj.nsp + ",";
		if (null != obj.id) str += obj.id;
		if (null != obj.data) str += JSON.stringify(obj.data, this.replacer);
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
};
/**
* A socket.io Decoder instance
*
* @return {Object} decoder
*/
var Decoder = class Decoder extends Emitter {
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
			if (this.reconstructor) throw new Error("got plaintext data when reconstructing a packet");
			packet = this.decodeString(obj);
			const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
			if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
				packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
				this.reconstructor = new BinaryReconstructor(packet);
				if (packet.attachments === 0) super.emitReserved("decoded", packet);
			} else super.emitReserved("decoded", packet);
		} else if (isBinary(obj) || obj.base64) if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
		else {
			packet = this.reconstructor.takeBinaryData(obj);
			if (packet) {
				this.reconstructor = null;
				super.emitReserved("decoded", packet);
			}
		}
		else throw new Error("Unknown type: " + obj);
	}
	/**
	* Decode a packet String (JSON data)
	*
	* @param {String} str
	* @return {Object} packet
	*/
	decodeString(str) {
		let i = 0;
		const p = { type: Number(str.charAt(0)) };
		if (PacketType[p.type] === void 0) throw new Error("unknown packet type " + p.type);
		if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
			const start = i + 1;
			while (str.charAt(++i) !== "-" && i != str.length);
			const buf = str.substring(start, i);
			if (buf != Number(buf) || str.charAt(i) !== "-") throw new Error("Illegal attachments");
			const n = Number(buf);
			if (!isInteger(n) || n < 0) throw new Error("Illegal attachments");
			else if (n > this.opts.maxAttachments) throw new Error("too many attachments");
			p.attachments = n;
		}
		if ("/" === str.charAt(i + 1)) {
			const start = i + 1;
			while (++i) {
				if ("," === str.charAt(i)) break;
				if (i === str.length) break;
			}
			p.nsp = str.substring(start, i);
		} else p.nsp = "/";
		const next = str.charAt(i + 1);
		if ("" !== next && Number(next) == next) {
			const start = i + 1;
			while (++i) {
				const c = str.charAt(i);
				if (null == c || Number(c) != c) {
					--i;
					break;
				}
				if (i === str.length) break;
			}
			p.id = Number(str.substring(start, i + 1));
		}
		if (str.charAt(++i)) {
			const payload = this.tryParse(str.substr(i));
			if (Decoder.isPayloadValid(p.type, payload)) p.data = payload;
			else throw new Error("invalid payload");
		}
		return p;
	}
	tryParse(str) {
		try {
			return JSON.parse(str, this.opts.reviver);
		} catch (e) {
			return false;
		}
	}
	static isPayloadValid(type, payload) {
		switch (type) {
			case PacketType.CONNECT: return isObject(payload);
			case PacketType.DISCONNECT: return payload === void 0;
			case PacketType.CONNECT_ERROR: return typeof payload === "string" || isObject(payload);
			case PacketType.EVENT:
			case PacketType.BINARY_EVENT: return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
			case PacketType.ACK:
			case PacketType.BINARY_ACK: return Array.isArray(payload);
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
};
/**
* A manager of a binary event's 'buffer sequence'. Should
* be constructed whenever a packet of type BINARY_EVENT is
* decoded.
*
* @param {Object} packet
* @return {BinaryReconstructor} initialized reconstructor
*/
var BinaryReconstructor = class {
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
};
function isNamespaceValid(nsp) {
	return typeof nsp === "string";
}
var isInteger = Number.isInteger || function(value) {
	return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};
function isAckIdValid(id) {
	return id === void 0 || isInteger(id);
}
function isObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}
function isDataValid(type, payload) {
	switch (type) {
		case PacketType.CONNECT: return payload === void 0 || isObject(payload);
		case PacketType.DISCONNECT: return payload === void 0;
		case PacketType.EVENT: return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
		case PacketType.ACK: return Array.isArray(payload);
		case PacketType.CONNECT_ERROR: return typeof payload === "string" || isObject(payload);
		default: return false;
	}
}
function isPacketValid(packet) {
	return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
}
//#endregion
//#region node_modules/browser-image-compression/dist/browser-image-compression.mjs
/**
* Browser Image Compression
* v2.0.2
* by Donald <donaldcwl@gmail.com>
* https://github.com/Donaldcwl/browser-image-compression
*/
function _mergeNamespaces(e, t) {
	return t.forEach((function(t) {
		t && "string" != typeof t && !Array.isArray(t) && Object.keys(t).forEach((function(r) {
			if ("default" !== r && !(r in e)) {
				var i = Object.getOwnPropertyDescriptor(t, r);
				Object.defineProperty(e, r, i.get ? i : {
					enumerable: !0,
					get: function() {
						return t[r];
					}
				});
			}
		}));
	})), Object.freeze(e);
}
function copyExifWithoutOrientation(e, t) {
	return new Promise((function(r, i) {
		let o;
		return getApp1Segment(e).then((function(e) {
			try {
				return o = e, r(new Blob([
					t.slice(0, 2),
					o,
					t.slice(2)
				], { type: "image/jpeg" }));
			} catch (e) {
				return i(e);
			}
		}), i);
	}));
}
var getApp1Segment = (e) => new Promise(((t, r) => {
	const i = new FileReader();
	i.addEventListener("load", (({ target: { result: e } }) => {
		const i = new DataView(e);
		let o = 0;
		if (65496 !== i.getUint16(o)) return r("not a valid JPEG");
		for (o += 2;;) {
			const a = i.getUint16(o);
			if (65498 === a) break;
			const s = i.getUint16(o + 2);
			if (65505 === a && 1165519206 === i.getUint32(o + 4)) {
				const a = o + 10;
				let f;
				switch (i.getUint16(a)) {
					case 18761:
						f = !0;
						break;
					case 19789:
						f = !1;
						break;
					default: return r("TIFF header contains invalid endian");
				}
				if (42 !== i.getUint16(a + 2, f)) return r("TIFF header contains invalid version");
				const l = i.getUint32(a + 4, f), c = a + l + 2 + 12 * i.getUint16(a + l, f);
				for (let e = a + l + 2; e < c; e += 12) if (274 == i.getUint16(e, f)) {
					if (3 !== i.getUint16(e + 2, f)) return r("Orientation data type is invalid");
					if (1 !== i.getUint32(e + 4, f)) return r("Orientation data count is invalid");
					i.setUint16(e + 8, 1, f);
					break;
				}
				return t(e.slice(o, o + 2 + s));
			}
			o += 2 + s;
		}
		return t(new Blob());
	})), i.readAsArrayBuffer(e);
}));
var e = {}, t = {
	get exports() {
		return e;
	},
	set exports(t) {
		e = t;
	}
};
(function(e) {
	var r, i, UZIP = {};
	t.exports = UZIP, UZIP.parse = function(e, t) {
		for (var r = UZIP.bin.readUshort, i = UZIP.bin.readUint, o = 0, a = {}, s = new Uint8Array(e), f = s.length - 4; 101010256 != i(s, f);) f--;
		o = f;
		o += 4;
		var l = r(s, o += 4);
		r(s, o += 2);
		var c = i(s, o += 2), u = i(s, o += 4);
		o += 4, o = u;
		for (var h = 0; h < l; h++) {
			i(s, o), o += 4, o += 4, o += 4, i(s, o += 4);
			c = i(s, o += 4);
			var d = i(s, o += 4), A = r(s, o += 4), g = r(s, o + 2), p = r(s, o + 4);
			o += 6;
			var m = i(s, o += 8);
			o += 4, o += A + g + p, UZIP._readLocal(s, m, a, c, d, t);
		}
		return a;
	}, UZIP._readLocal = function(e, t, r, i, o, a) {
		var s = UZIP.bin.readUshort, f = UZIP.bin.readUint;
		f(e, t), s(e, t += 4), s(e, t += 2);
		var l = s(e, t += 2);
		f(e, t += 2), f(e, t += 4), t += 4;
		var c = s(e, t += 8), u = s(e, t += 2);
		t += 2;
		var h = UZIP.bin.readUTF8(e, t, c);
		if (t += c, t += u, a) r[h] = {
			size: o,
			csize: i
		};
		else {
			var d = new Uint8Array(e.buffer, t);
			if (0 == l) r[h] = new Uint8Array(d.buffer.slice(t, t + i));
			else {
				if (8 != l) throw "unknown compression method: " + l;
				var A = new Uint8Array(o);
				UZIP.inflateRaw(d, A), r[h] = A;
			}
		}
	}, UZIP.inflateRaw = function(e, t) {
		return UZIP.F.inflate(e, t);
	}, UZIP.inflate = function(e, t) {
		return e[0], e[1], UZIP.inflateRaw(new Uint8Array(e.buffer, e.byteOffset + 2, e.length - 6), t);
	}, UZIP.deflate = function(e, t) {
		t ?? (t = { level: 6 });
		var r = 0, i = new Uint8Array(50 + Math.floor(1.1 * e.length));
		i[r] = 120, i[r + 1] = 156, r += 2, r = UZIP.F.deflateRaw(e, i, r, t.level);
		var o = UZIP.adler(e, 0, e.length);
		return i[r + 0] = o >>> 24 & 255, i[r + 1] = o >>> 16 & 255, i[r + 2] = o >>> 8 & 255, i[r + 3] = o >>> 0 & 255, new Uint8Array(i.buffer, 0, r + 4);
	}, UZIP.deflateRaw = function(e, t) {
		t ?? (t = { level: 6 });
		var r = new Uint8Array(50 + Math.floor(1.1 * e.length)), i = UZIP.F.deflateRaw(e, r, i, t.level);
		return new Uint8Array(r.buffer, 0, i);
	}, UZIP.encode = function(e, t) {
		t ?? (t = !1);
		var r = 0, i = UZIP.bin.writeUint, o = UZIP.bin.writeUshort, a = {};
		for (var s in e) {
			var f = !UZIP._noNeed(s) && !t, l = e[s], c = UZIP.crc.crc(l, 0, l.length);
			a[s] = {
				cpr: f,
				usize: l.length,
				crc: c,
				file: f ? UZIP.deflateRaw(l) : l
			};
		}
		for (var s in a) r += a[s].file.length + 30 + 46 + 2 * UZIP.bin.sizeUTF8(s);
		r += 22;
		var u = new Uint8Array(r), h = 0, d = [];
		for (var s in a) {
			var A = a[s];
			d.push(h), h = UZIP._writeHeader(u, h, s, A, 0);
		}
		var g = 0, p = h;
		for (var s in a) {
			A = a[s];
			d.push(h), h = UZIP._writeHeader(u, h, s, A, 1, d[g++]);
		}
		var m = h - p;
		return i(u, h, 101010256), h += 4, o(u, h += 4, g), o(u, h += 2, g), i(u, h += 2, m), i(u, h += 4, p), h += 4, h += 2, u.buffer;
	}, UZIP._noNeed = function(e) {
		var t = e.split(".").pop().toLowerCase();
		return -1 != "png,jpg,jpeg,zip".indexOf(t);
	}, UZIP._writeHeader = function(e, t, r, i, o, a) {
		var s = UZIP.bin.writeUint, f = UZIP.bin.writeUshort, l = i.file;
		return s(e, t, 0 == o ? 67324752 : 33639248), t += 4, 1 == o && (t += 2), f(e, t, 20), f(e, t += 2, 0), f(e, t += 2, i.cpr ? 8 : 0), s(e, t += 2, 0), s(e, t += 4, i.crc), s(e, t += 4, l.length), s(e, t += 4, i.usize), f(e, t += 4, UZIP.bin.sizeUTF8(r)), f(e, t += 2, 0), t += 2, 1 == o && (t += 2, t += 2, s(e, t += 6, a), t += 4), t += UZIP.bin.writeUTF8(e, t, r), 0 == o && (e.set(l, t), t += l.length), t;
	}, UZIP.crc = {
		table: function() {
			for (var e = new Uint32Array(256), t = 0; t < 256; t++) {
				for (var r = t, i = 0; i < 8; i++) 1 & r ? r = 3988292384 ^ r >>> 1 : r >>>= 1;
				e[t] = r;
			}
			return e;
		}(),
		update: function(e, t, r, i) {
			for (var o = 0; o < i; o++) e = UZIP.crc.table[255 & (e ^ t[r + o])] ^ e >>> 8;
			return e;
		},
		crc: function(e, t, r) {
			return 4294967295 ^ UZIP.crc.update(4294967295, e, t, r);
		}
	}, UZIP.adler = function(e, t, r) {
		for (var i = 1, o = 0, a = t, s = t + r; a < s;) {
			for (var f = Math.min(a + 5552, s); a < f;) o += i += e[a++];
			i %= 65521, o %= 65521;
		}
		return o << 16 | i;
	}, UZIP.bin = {
		readUshort: function(e, t) {
			return e[t] | e[t + 1] << 8;
		},
		writeUshort: function(e, t, r) {
			e[t] = 255 & r, e[t + 1] = r >> 8 & 255;
		},
		readUint: function(e, t) {
			return 16777216 * e[t + 3] + (e[t + 2] << 16 | e[t + 1] << 8 | e[t]);
		},
		writeUint: function(e, t, r) {
			e[t] = 255 & r, e[t + 1] = r >> 8 & 255, e[t + 2] = r >> 16 & 255, e[t + 3] = r >> 24 & 255;
		},
		readASCII: function(e, t, r) {
			for (var i = "", o = 0; o < r; o++) i += String.fromCharCode(e[t + o]);
			return i;
		},
		writeASCII: function(e, t, r) {
			for (var i = 0; i < r.length; i++) e[t + i] = r.charCodeAt(i);
		},
		pad: function(e) {
			return e.length < 2 ? "0" + e : e;
		},
		readUTF8: function(e, t, r) {
			for (var i, o = "", a = 0; a < r; a++) o += "%" + UZIP.bin.pad(e[t + a].toString(16));
			try {
				i = decodeURIComponent(o);
			} catch (i) {
				return UZIP.bin.readASCII(e, t, r);
			}
			return i;
		},
		writeUTF8: function(e, t, r) {
			for (var i = r.length, o = 0, a = 0; a < i; a++) {
				var s = r.charCodeAt(a);
				if (0 == (4294967168 & s)) e[t + o] = s, o++;
				else if (0 == (4294965248 & s)) e[t + o] = 192 | s >> 6, e[t + o + 1] = 128 | s >> 0 & 63, o += 2;
				else if (0 == (4294901760 & s)) e[t + o] = 224 | s >> 12, e[t + o + 1] = 128 | s >> 6 & 63, e[t + o + 2] = 128 | s >> 0 & 63, o += 3;
				else {
					if (0 != (4292870144 & s)) throw "e";
					e[t + o] = 240 | s >> 18, e[t + o + 1] = 128 | s >> 12 & 63, e[t + o + 2] = 128 | s >> 6 & 63, e[t + o + 3] = 128 | s >> 0 & 63, o += 4;
				}
			}
			return o;
		},
		sizeUTF8: function(e) {
			for (var t = e.length, r = 0, i = 0; i < t; i++) {
				var o = e.charCodeAt(i);
				if (0 == (4294967168 & o)) r++;
				else if (0 == (4294965248 & o)) r += 2;
				else if (0 == (4294901760 & o)) r += 3;
				else {
					if (0 != (4292870144 & o)) throw "e";
					r += 4;
				}
			}
			return r;
		}
	}, UZIP.F = {}, UZIP.F.deflateRaw = function(e, t, r, i) {
		var o = [
			[
				0,
				0,
				0,
				0,
				0
			],
			[
				4,
				4,
				8,
				4,
				0
			],
			[
				4,
				5,
				16,
				8,
				0
			],
			[
				4,
				6,
				16,
				16,
				0
			],
			[
				4,
				10,
				16,
				32,
				0
			],
			[
				8,
				16,
				32,
				32,
				0
			],
			[
				8,
				16,
				128,
				128,
				0
			],
			[
				8,
				32,
				128,
				256,
				0
			],
			[
				32,
				128,
				258,
				1024,
				1
			],
			[
				32,
				258,
				258,
				4096,
				1
			]
		][i], a = UZIP.F.U, s = UZIP.F._goodIndex;
		UZIP.F._hash;
		var f = UZIP.F._putsE, l = 0, c = r << 3, u = 0, h = e.length;
		if (0 == i) {
			for (; l < h;) f(t, c, l + (_ = Math.min(65535, h - l)) == h ? 1 : 0), c = UZIP.F._copyExact(e, l, _, t, c + 8), l += _;
			return c >>> 3;
		}
		var d = a.lits, A = a.strt, g = a.prev, p = 0, m = 0, w = 0, v = 0, b = 0, y = 0;
		for (h > 2 && (A[y = UZIP.F._hash(e, 0)] = 0), l = 0; l < h; l++) {
			if (b = y, l + 1 < h - 2) {
				y = UZIP.F._hash(e, l + 1);
				var E = l + 1 & 32767;
				g[E] = A[y], A[y] = E;
			}
			if (u <= l) {
				(p > 14e3 || m > 26697) && h - l > 100 && (u < l && (d[p] = l - u, p += 2, u = l), c = UZIP.F._writeBlock(l == h - 1 || u == h ? 1 : 0, d, p, v, e, w, l - w, t, c), p = m = v = 0, w = l);
				var F = 0;
				l < h - 2 && (F = UZIP.F._bestMatch(e, l, g, b, Math.min(o[2], h - l), o[3]));
				var _ = F >>> 16, B = 65535 & F;
				if (0 != F) {
					B = 65535 & F;
					var U = s(_ = F >>> 16, a.of0);
					a.lhst[257 + U]++;
					var C = s(B, a.df0);
					a.dhst[C]++, v += a.exb[U] + a.dxb[C], d[p] = _ << 23 | l - u, d[p + 1] = B << 16 | U << 8 | C, p += 2, u = l + _;
				} else a.lhst[e[l]]++;
				m++;
			}
		}
		for (w == l && 0 != e.length || (u < l && (d[p] = l - u, p += 2, u = l), c = UZIP.F._writeBlock(1, d, p, v, e, w, l - w, t, c), p = 0, m = 0, p = m = v = 0, w = l); 0 != (7 & c);) c++;
		return c >>> 3;
	}, UZIP.F._bestMatch = function(e, t, r, i, o, a) {
		var s = 32767 & t, f = r[s], l = s - f + 32768 & 32767;
		if (f == s || i != UZIP.F._hash(e, t - l)) return 0;
		for (var c = 0, u = 0, h = Math.min(32767, t); l <= h && 0 != --a && f != s;) {
			if (0 == c || e[t + c] == e[t + c - l]) {
				var d = UZIP.F._howLong(e, t, l);
				if (d > c) {
					if (u = l, (c = d) >= o) break;
					l + 2 < d && (d = l + 2);
					for (var A = 0, g = 0; g < d - 2; g++) {
						var p = t - l + g + 32768 & 32767, m = p - r[p] + 32768 & 32767;
						m > A && (A = m, f = p);
					}
				}
			}
			l += (s = f) - (f = r[s]) + 32768 & 32767;
		}
		return c << 16 | u;
	}, UZIP.F._howLong = function(e, t, r) {
		if (e[t] != e[t - r] || e[t + 1] != e[t + 1 - r] || e[t + 2] != e[t + 2 - r]) return 0;
		var i = t, o = Math.min(e.length, t + 258);
		for (t += 3; t < o && e[t] == e[t - r];) t++;
		return t - i;
	}, UZIP.F._hash = function(e, t) {
		return (e[t] << 8 | e[t + 1]) + (e[t + 2] << 4) & 65535;
	}, UZIP.saved = 0, UZIP.F._writeBlock = function(e, t, r, i, o, a, s, f, l) {
		var c, u, h, d, A, g, p, m, w, v = UZIP.F.U, b = UZIP.F._putsF, y = UZIP.F._putsE;
		v.lhst[256]++, u = (c = UZIP.F.getTrees())[0], h = c[1], d = c[2], A = c[3], g = c[4], p = c[5], m = c[6], w = c[7];
		var E = 32 + (0 == (l + 3 & 7) ? 0 : 8 - (l + 3 & 7)) + (s << 3), F = i + UZIP.F.contSize(v.fltree, v.lhst) + UZIP.F.contSize(v.fdtree, v.dhst), _ = i + UZIP.F.contSize(v.ltree, v.lhst) + UZIP.F.contSize(v.dtree, v.dhst);
		_ += 14 + 3 * p + UZIP.F.contSize(v.itree, v.ihst) + (2 * v.ihst[16] + 3 * v.ihst[17] + 7 * v.ihst[18]);
		for (var B = 0; B < 286; B++) v.lhst[B] = 0;
		for (B = 0; B < 30; B++) v.dhst[B] = 0;
		for (B = 0; B < 19; B++) v.ihst[B] = 0;
		var U = E < F && E < _ ? 0 : F < _ ? 1 : 2;
		if (b(f, l, e), b(f, l + 1, U), l += 3, 0 == U) {
			for (; 0 != (7 & l);) l++;
			l = UZIP.F._copyExact(o, a, s, f, l);
		} else {
			var C, I;
			if (1 == U && (C = v.fltree, I = v.fdtree), 2 == U) {
				UZIP.F.makeCodes(v.ltree, u), UZIP.F.revCodes(v.ltree, u), UZIP.F.makeCodes(v.dtree, h), UZIP.F.revCodes(v.dtree, h), UZIP.F.makeCodes(v.itree, d), UZIP.F.revCodes(v.itree, d), C = v.ltree, I = v.dtree, y(f, l, A - 257), y(f, l += 5, g - 1), y(f, l += 5, p - 4), l += 4;
				for (var Q = 0; Q < p; Q++) y(f, l + 3 * Q, v.itree[1 + (v.ordr[Q] << 1)]);
				l += 3 * p, l = UZIP.F._codeTiny(m, v.itree, f, l), l = UZIP.F._codeTiny(w, v.itree, f, l);
			}
			for (var M = a, x = 0; x < r; x += 2) {
				for (var S = t[x], R = S >>> 23, T = M + (8388607 & S); M < T;) l = UZIP.F._writeLit(o[M++], C, f, l);
				if (0 != R) {
					var O = t[x + 1], P = O >> 16, H = O >> 8 & 255, L = 255 & O;
					y(f, l = UZIP.F._writeLit(257 + H, C, f, l), R - v.of0[H]), l += v.exb[H], b(f, l = UZIP.F._writeLit(L, I, f, l), P - v.df0[L]), l += v.dxb[L], M += R;
				}
			}
			l = UZIP.F._writeLit(256, C, f, l);
		}
		return l;
	}, UZIP.F._copyExact = function(e, t, r, i, o) {
		var a = o >>> 3;
		return i[a] = r, i[a + 1] = r >>> 8, i[a + 2] = 255 - i[a], i[a + 3] = 255 - i[a + 1], a += 4, i.set(new Uint8Array(e.buffer, t, r), a), o + (r + 4 << 3);
	}, UZIP.F.getTrees = function() {
		for (var e = UZIP.F.U, t = UZIP.F._hufTree(e.lhst, e.ltree, 15), r = UZIP.F._hufTree(e.dhst, e.dtree, 15), i = [], o = UZIP.F._lenCodes(e.ltree, i), a = [], s = UZIP.F._lenCodes(e.dtree, a), f = 0; f < i.length; f += 2) e.ihst[i[f]]++;
		for (f = 0; f < a.length; f += 2) e.ihst[a[f]]++;
		for (var l = UZIP.F._hufTree(e.ihst, e.itree, 7), c = 19; c > 4 && 0 == e.itree[1 + (e.ordr[c - 1] << 1)];) c--;
		return [
			t,
			r,
			l,
			o,
			s,
			c,
			i,
			a
		];
	}, UZIP.F.getSecond = function(e) {
		for (var t = [], r = 0; r < e.length; r += 2) t.push(e[r + 1]);
		return t;
	}, UZIP.F.nonZero = function(e) {
		for (var t = "", r = 0; r < e.length; r += 2) 0 != e[r + 1] && (t += (r >> 1) + ",");
		return t;
	}, UZIP.F.contSize = function(e, t) {
		for (var r = 0, i = 0; i < t.length; i++) r += t[i] * e[1 + (i << 1)];
		return r;
	}, UZIP.F._codeTiny = function(e, t, r, i) {
		for (var o = 0; o < e.length; o += 2) {
			var a = e[o], s = e[o + 1];
			i = UZIP.F._writeLit(a, t, r, i);
			var f = 16 == a ? 2 : 17 == a ? 3 : 7;
			a > 15 && (UZIP.F._putsE(r, i, s, f), i += f);
		}
		return i;
	}, UZIP.F._lenCodes = function(e, t) {
		for (var r = e.length; 2 != r && 0 == e[r - 1];) r -= 2;
		for (var i = 0; i < r; i += 2) {
			var o = e[i + 1], a = i + 3 < r ? e[i + 3] : -1, s = i + 5 < r ? e[i + 5] : -1, f = 0 == i ? -1 : e[i - 1];
			if (0 == o && a == o && s == o) {
				for (var l = i + 5; l + 2 < r && e[l + 2] == o;) l += 2;
				(c = Math.min(l + 1 - i >>> 1, 138)) < 11 ? t.push(17, c - 3) : t.push(18, c - 11), i += 2 * c - 2;
			} else if (o == f && a == o && s == o) {
				for (l = i + 5; l + 2 < r && e[l + 2] == o;) l += 2;
				var c = Math.min(l + 1 - i >>> 1, 6);
				t.push(16, c - 3), i += 2 * c - 2;
			} else t.push(o, 0);
		}
		return r >>> 1;
	}, UZIP.F._hufTree = function(e, t, r) {
		var i = [], o = e.length, a = t.length, s = 0;
		for (s = 0; s < a; s += 2) t[s] = 0, t[s + 1] = 0;
		for (s = 0; s < o; s++) 0 != e[s] && i.push({
			lit: s,
			f: e[s]
		});
		var f = i.length, l = i.slice(0);
		if (0 == f) return 0;
		if (1 == f) {
			var c = i[0].lit;
			l = 0 == c ? 1 : 0;
			return t[1 + (c << 1)] = 1, t[1 + (l << 1)] = 1, 1;
		}
		i.sort((function(e, t) {
			return e.f - t.f;
		}));
		var u = i[0], h = i[1], d = 0, A = 1, g = 2;
		for (i[0] = {
			lit: -1,
			f: u.f + h.f,
			l: u,
			r: h,
			d: 0
		}; A != f - 1;) u = d != A && (g == f || i[d].f < i[g].f) ? i[d++] : i[g++], h = d != A && (g == f || i[d].f < i[g].f) ? i[d++] : i[g++], i[A++] = {
			lit: -1,
			f: u.f + h.f,
			l: u,
			r: h
		};
		var p = UZIP.F.setDepth(i[A - 1], 0);
		for (p > r && (UZIP.F.restrictDepth(l, r, p), p = r), s = 0; s < f; s++) t[1 + (l[s].lit << 1)] = l[s].d;
		return p;
	}, UZIP.F.setDepth = function(e, t) {
		return -1 != e.lit ? (e.d = t, t) : Math.max(UZIP.F.setDepth(e.l, t + 1), UZIP.F.setDepth(e.r, t + 1));
	}, UZIP.F.restrictDepth = function(e, t, r) {
		var i = 0, o = 1 << r - t, a = 0;
		for (e.sort((function(e, t) {
			return t.d == e.d ? e.f - t.f : t.d - e.d;
		})), i = 0; i < e.length && e[i].d > t; i++) {
			var s = e[i].d;
			e[i].d = t, a += o - (1 << r - s);
		}
		for (a >>>= r - t; a > 0;) (s = e[i].d) < t ? (e[i].d++, a -= 1 << t - s - 1) : i++;
		for (; i >= 0; i--) e[i].d == t && a < 0 && (e[i].d--, a++);
		0 != a && console.log("debt left");
	}, UZIP.F._goodIndex = function(e, t) {
		var r = 0;
		return t[16 | r] <= e && (r |= 16), t[8 | r] <= e && (r |= 8), t[4 | r] <= e && (r |= 4), t[2 | r] <= e && (r |= 2), t[1 | r] <= e && (r |= 1), r;
	}, UZIP.F._writeLit = function(e, t, r, i) {
		return UZIP.F._putsF(r, i, t[e << 1]), i + t[1 + (e << 1)];
	}, UZIP.F.inflate = function(e, t) {
		var r = Uint8Array;
		if (3 == e[0] && 0 == e[1]) return t || new r(0);
		var i = UZIP.F, o = i._bitsF, a = i._bitsE, s = i._decodeTiny, f = i.makeCodes, l = i.codes2map, c = i._get17, u = i.U, h = null == t;
		h && (t = new r(e.length >>> 2 << 3));
		for (var d, A, g = 0, p = 0, m = 0, w = 0, v = 0, b = 0, y = 0, E = 0, F = 0; 0 == g;) if (g = o(e, F, 1), p = o(e, F + 1, 2), F += 3, 0 != p) {
			if (h && (t = UZIP.F._check(t, E + (1 << 17))), 1 == p && (d = u.flmap, A = u.fdmap, b = 511, y = 31), 2 == p) {
				m = a(e, F, 5) + 257, w = a(e, F + 5, 5) + 1, v = a(e, F + 10, 4) + 4, F += 14;
				for (var _ = 0; _ < 38; _ += 2) u.itree[_] = 0, u.itree[_ + 1] = 0;
				var B = 1;
				for (_ = 0; _ < v; _++) {
					var U = a(e, F + 3 * _, 3);
					u.itree[1 + (u.ordr[_] << 1)] = U, U > B && (B = U);
				}
				F += 3 * v, f(u.itree, B), l(u.itree, B, u.imap), d = u.lmap, A = u.dmap, F = s(u.imap, (1 << B) - 1, m + w, e, F, u.ttree);
				var C = i._copyOut(u.ttree, 0, m, u.ltree);
				b = (1 << C) - 1;
				var I = i._copyOut(u.ttree, m, w, u.dtree);
				y = (1 << I) - 1, f(u.ltree, C), l(u.ltree, C, d), f(u.dtree, I), l(u.dtree, I, A);
			}
			for (;;) {
				var Q = d[c(e, F) & b];
				F += 15 & Q;
				var M = Q >>> 4;
				if (M >>> 8 == 0) t[E++] = M;
				else {
					if (256 == M) break;
					var x = E + M - 254;
					if (M > 264) {
						var S = u.ldef[M - 257];
						x = E + (S >>> 3) + a(e, F, 7 & S), F += 7 & S;
					}
					var R = A[c(e, F) & y];
					F += 15 & R;
					var T = R >>> 4, O = u.ddef[T], P = (O >>> 4) + o(e, F, 15 & O);
					for (F += 15 & O, h && (t = UZIP.F._check(t, E + (1 << 17))); E < x;) t[E] = t[E++ - P], t[E] = t[E++ - P], t[E] = t[E++ - P], t[E] = t[E++ - P];
					E = x;
				}
			}
		} else {
			0 != (7 & F) && (F += 8 - (7 & F));
			var H = 4 + (F >>> 3), L = e[H - 4] | e[H - 3] << 8;
			h && (t = UZIP.F._check(t, E + L)), t.set(new r(e.buffer, e.byteOffset + H, L), E), F = H + L << 3, E += L;
		}
		return t.length == E ? t : t.slice(0, E);
	}, UZIP.F._check = function(e, t) {
		var r = e.length;
		if (t <= r) return e;
		var i = new Uint8Array(Math.max(r << 1, t));
		return i.set(e, 0), i;
	}, UZIP.F._decodeTiny = function(e, t, r, i, o, a) {
		for (var s = UZIP.F._bitsE, f = UZIP.F._get17, l = 0; l < r;) {
			var c = e[f(i, o) & t];
			o += 15 & c;
			var u = c >>> 4;
			if (u <= 15) a[l] = u, l++;
			else {
				var h = 0, d = 0;
				16 == u ? (d = 3 + s(i, o, 2), o += 2, h = a[l - 1]) : 17 == u ? (d = 3 + s(i, o, 3), o += 3) : 18 == u && (d = 11 + s(i, o, 7), o += 7);
				for (var A = l + d; l < A;) a[l] = h, l++;
			}
		}
		return o;
	}, UZIP.F._copyOut = function(e, t, r, i) {
		for (var o = 0, a = 0, s = i.length >>> 1; a < r;) {
			var f = e[a + t];
			i[a << 1] = 0, i[1 + (a << 1)] = f, f > o && (o = f), a++;
		}
		for (; a < s;) i[a << 1] = 0, i[1 + (a << 1)] = 0, a++;
		return o;
	}, UZIP.F.makeCodes = function(e, t) {
		for (var r, i, o, a, s = UZIP.F.U, f = e.length, l = s.bl_count, c = 0; c <= t; c++) l[c] = 0;
		for (c = 1; c < f; c += 2) l[e[c]]++;
		var u = s.next_code;
		for (r = 0, l[0] = 0, i = 1; i <= t; i++) r = r + l[i - 1] << 1, u[i] = r;
		for (o = 0; o < f; o += 2) 0 != (a = e[o + 1]) && (e[o] = u[a], u[a]++);
	}, UZIP.F.codes2map = function(e, t, r) {
		for (var i = e.length, o = UZIP.F.U.rev15, a = 0; a < i; a += 2) if (0 != e[a + 1]) for (var s = a >> 1, f = e[a + 1], l = s << 4 | f, c = t - f, u = e[a] << c, h = u + (1 << c); u != h;) r[o[u] >>> 15 - t] = l, u++;
	}, UZIP.F.revCodes = function(e, t) {
		for (var r = UZIP.F.U.rev15, i = 15 - t, o = 0; o < e.length; o += 2) e[o] = r[e[o] << t - e[o + 1]] >>> i;
	}, UZIP.F._putsE = function(e, t, r) {
		r <<= 7 & t;
		var i = t >>> 3;
		e[i] |= r, e[i + 1] |= r >>> 8;
	}, UZIP.F._putsF = function(e, t, r) {
		r <<= 7 & t;
		var i = t >>> 3;
		e[i] |= r, e[i + 1] |= r >>> 8, e[i + 2] |= r >>> 16;
	}, UZIP.F._bitsE = function(e, t, r) {
		return (e[t >>> 3] | e[1 + (t >>> 3)] << 8) >>> (7 & t) & (1 << r) - 1;
	}, UZIP.F._bitsF = function(e, t, r) {
		return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t) & (1 << r) - 1;
	}, UZIP.F._get17 = function(e, t) {
		return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t);
	}, UZIP.F._get25 = function(e, t) {
		return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16 | e[3 + (t >>> 3)] << 24) >>> (7 & t);
	}, UZIP.F.U = (r = Uint16Array, i = Uint32Array, {
		next_code: new r(16),
		bl_count: new r(16),
		ordr: [
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		],
		of0: [
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10,
			11,
			13,
			15,
			17,
			19,
			23,
			27,
			31,
			35,
			43,
			51,
			59,
			67,
			83,
			99,
			115,
			131,
			163,
			195,
			227,
			258,
			999,
			999,
			999
		],
		exb: [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			2,
			2,
			2,
			2,
			3,
			3,
			3,
			3,
			4,
			4,
			4,
			4,
			5,
			5,
			5,
			5,
			0,
			0,
			0,
			0
		],
		ldef: new r(32),
		df0: [
			1,
			2,
			3,
			4,
			5,
			7,
			9,
			13,
			17,
			25,
			33,
			49,
			65,
			97,
			129,
			193,
			257,
			385,
			513,
			769,
			1025,
			1537,
			2049,
			3073,
			4097,
			6145,
			8193,
			12289,
			16385,
			24577,
			65535,
			65535
		],
		dxb: [
			0,
			0,
			0,
			0,
			1,
			1,
			2,
			2,
			3,
			3,
			4,
			4,
			5,
			5,
			6,
			6,
			7,
			7,
			8,
			8,
			9,
			9,
			10,
			10,
			11,
			11,
			12,
			12,
			13,
			13,
			0,
			0
		],
		ddef: new i(32),
		flmap: new r(512),
		fltree: [],
		fdmap: new r(32),
		fdtree: [],
		lmap: new r(32768),
		ltree: [],
		ttree: [],
		dmap: new r(32768),
		dtree: [],
		imap: new r(512),
		itree: [],
		rev15: new r(32768),
		lhst: new i(286),
		dhst: new i(30),
		ihst: new i(19),
		lits: new i(15e3),
		strt: new r(65536),
		prev: new r(32768)
	}), function() {
		for (var e = UZIP.F.U, t = 0; t < 32768; t++) {
			var r = t;
			r = (4278255360 & (r = (4042322160 & (r = (3435973836 & (r = (2863311530 & r) >>> 1 | (1431655765 & r) << 1)) >>> 2 | (858993459 & r) << 2)) >>> 4 | (252645135 & r) << 4)) >>> 8 | (16711935 & r) << 8, e.rev15[t] = (r >>> 16 | r << 16) >>> 17;
		}
		function pushV(e, t, r) {
			for (; 0 != t--;) e.push(0, r);
		}
		for (t = 0; t < 32; t++) e.ldef[t] = e.of0[t] << 3 | e.exb[t], e.ddef[t] = e.df0[t] << 4 | e.dxb[t];
		pushV(e.fltree, 144, 8), pushV(e.fltree, 112, 9), pushV(e.fltree, 24, 7), pushV(e.fltree, 8, 8), UZIP.F.makeCodes(e.fltree, 9), UZIP.F.codes2map(e.fltree, 9, e.flmap), UZIP.F.revCodes(e.fltree, 9), pushV(e.fdtree, 32, 5), UZIP.F.makeCodes(e.fdtree, 5), UZIP.F.codes2map(e.fdtree, 5, e.fdmap), UZIP.F.revCodes(e.fdtree, 5), pushV(e.itree, 19, 0), pushV(e.ltree, 286, 0), pushV(e.dtree, 30, 0), pushV(e.ttree, 320, 0);
	}();
})();
var UZIP = _mergeNamespaces({
	__proto__: null,
	default: e
}, [e]);
var UPNG = function() {
	var e = {
		nextZero(e, t) {
			for (; 0 != e[t];) t++;
			return t;
		},
		readUshort: (e, t) => e[t] << 8 | e[t + 1],
		writeUshort(e, t, r) {
			e[t] = r >> 8 & 255, e[t + 1] = 255 & r;
		},
		readUint: (e, t) => 16777216 * e[t] + (e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3]),
		writeUint(e, t, r) {
			e[t] = r >> 24 & 255, e[t + 1] = r >> 16 & 255, e[t + 2] = r >> 8 & 255, e[t + 3] = 255 & r;
		},
		readASCII(e, t, r) {
			let i = "";
			for (let o = 0; o < r; o++) i += String.fromCharCode(e[t + o]);
			return i;
		},
		writeASCII(e, t, r) {
			for (let i = 0; i < r.length; i++) e[t + i] = r.charCodeAt(i);
		},
		readBytes(e, t, r) {
			const i = [];
			for (let o = 0; o < r; o++) i.push(e[t + o]);
			return i;
		},
		pad: (e) => e.length < 2 ? `0${e}` : e,
		readUTF8(t, r, i) {
			let o, a = "";
			for (let o = 0; o < i; o++) a += `%${e.pad(t[r + o].toString(16))}`;
			try {
				o = decodeURIComponent(a);
			} catch (o) {
				return e.readASCII(t, r, i);
			}
			return o;
		}
	};
	function decodeImage(t, r, i, o) {
		const a = r * i, s = _getBPP(o), f = Math.ceil(r * s / 8), l = new Uint8Array(4 * a), c = new Uint32Array(l.buffer), { ctype: u } = o, { depth: h } = o, d = e.readUshort;
		if (6 == u) {
			const e = a << 2;
			if (8 == h) for (var A = 0; A < e; A += 4) l[A] = t[A], l[A + 1] = t[A + 1], l[A + 2] = t[A + 2], l[A + 3] = t[A + 3];
			if (16 == h) for (A = 0; A < e; A++) l[A] = t[A << 1];
		} else if (2 == u) {
			const e = o.tabs.tRNS;
			if (null == e) {
				if (8 == h) for (A = 0; A < a; A++) {
					var g = 3 * A;
					c[A] = 255 << 24 | t[g + 2] << 16 | t[g + 1] << 8 | t[g];
				}
				if (16 == h) for (A = 0; A < a; A++) {
					g = 6 * A;
					c[A] = 255 << 24 | t[g + 4] << 16 | t[g + 2] << 8 | t[g];
				}
			} else {
				var p = e[0];
				const r = e[1], i = e[2];
				if (8 == h) for (A = 0; A < a; A++) {
					var m = A << 2;
					g = 3 * A;
					c[A] = 255 << 24 | t[g + 2] << 16 | t[g + 1] << 8 | t[g], t[g] == p && t[g + 1] == r && t[g + 2] == i && (l[m + 3] = 0);
				}
				if (16 == h) for (A = 0; A < a; A++) {
					m = A << 2, g = 6 * A;
					c[A] = 255 << 24 | t[g + 4] << 16 | t[g + 2] << 8 | t[g], d(t, g) == p && d(t, g + 2) == r && d(t, g + 4) == i && (l[m + 3] = 0);
				}
			}
		} else if (3 == u) {
			const e = o.tabs.PLTE, s = o.tabs.tRNS, c = s ? s.length : 0;
			if (1 == h) for (var w = 0; w < i; w++) {
				var v = w * f, b = w * r;
				for (A = 0; A < r; A++) {
					m = b + A << 2;
					var y = 3 * (E = t[v + (A >> 3)] >> 7 - ((7 & A) << 0) & 1);
					l[m] = e[y], l[m + 1] = e[y + 1], l[m + 2] = e[y + 2], l[m + 3] = E < c ? s[E] : 255;
				}
			}
			if (2 == h) for (w = 0; w < i; w++) for (v = w * f, b = w * r, A = 0; A < r; A++) {
				m = b + A << 2, y = 3 * (E = t[v + (A >> 2)] >> 6 - ((3 & A) << 1) & 3);
				l[m] = e[y], l[m + 1] = e[y + 1], l[m + 2] = e[y + 2], l[m + 3] = E < c ? s[E] : 255;
			}
			if (4 == h) for (w = 0; w < i; w++) for (v = w * f, b = w * r, A = 0; A < r; A++) {
				m = b + A << 2, y = 3 * (E = t[v + (A >> 1)] >> 4 - ((1 & A) << 2) & 15);
				l[m] = e[y], l[m + 1] = e[y + 1], l[m + 2] = e[y + 2], l[m + 3] = E < c ? s[E] : 255;
			}
			if (8 == h) for (A = 0; A < a; A++) {
				var E;
				m = A << 2, y = 3 * (E = t[A]);
				l[m] = e[y], l[m + 1] = e[y + 1], l[m + 2] = e[y + 2], l[m + 3] = E < c ? s[E] : 255;
			}
		} else if (4 == u) {
			if (8 == h) for (A = 0; A < a; A++) {
				m = A << 2;
				var F = t[_ = A << 1];
				l[m] = F, l[m + 1] = F, l[m + 2] = F, l[m + 3] = t[_ + 1];
			}
			if (16 == h) for (A = 0; A < a; A++) {
				var _;
				m = A << 2, F = t[_ = A << 2];
				l[m] = F, l[m + 1] = F, l[m + 2] = F, l[m + 3] = t[_ + 2];
			}
		} else if (0 == u) for (p = o.tabs.tRNS ? o.tabs.tRNS : -1, w = 0; w < i; w++) {
			const e = w * f, i = w * r;
			if (1 == h) for (var B = 0; B < r; B++) {
				var U = (F = 255 * (t[e + (B >>> 3)] >>> 7 - (7 & B) & 1)) == 255 * p ? 0 : 255;
				c[i + B] = U << 24 | F << 16 | F << 8 | F;
			}
			else if (2 == h) for (B = 0; B < r; B++) {
				U = (F = 85 * (t[e + (B >>> 2)] >>> 6 - ((3 & B) << 1) & 3)) == 85 * p ? 0 : 255;
				c[i + B] = U << 24 | F << 16 | F << 8 | F;
			}
			else if (4 == h) for (B = 0; B < r; B++) {
				U = (F = 17 * (t[e + (B >>> 1)] >>> 4 - ((1 & B) << 2) & 15)) == 17 * p ? 0 : 255;
				c[i + B] = U << 24 | F << 16 | F << 8 | F;
			}
			else if (8 == h) for (B = 0; B < r; B++) {
				U = (F = t[e + B]) == p ? 0 : 255;
				c[i + B] = U << 24 | F << 16 | F << 8 | F;
			}
			else if (16 == h) for (B = 0; B < r; B++) {
				F = t[e + (B << 1)], U = d(t, e + (B << 1)) == p ? 0 : 255;
				c[i + B] = U << 24 | F << 16 | F << 8 | F;
			}
		}
		return l;
	}
	function _decompress(e, r, i, o) {
		const a = _getBPP(e), s = Math.ceil(i * a / 8), f = new Uint8Array((s + 1 + e.interlace) * o);
		return r = e.tabs.CgBI ? t(r, f) : _inflate(r, f), 0 == e.interlace ? r = _filterZero(r, e, 0, i, o) : 1 == e.interlace && (r = function _readInterlace(e, t) {
			const r = t.width, i = t.height, o = _getBPP(t), a = o >> 3, s = Math.ceil(r * o / 8), f = new Uint8Array(i * s);
			let l = 0;
			const c = [
				0,
				0,
				4,
				0,
				2,
				0,
				1
			], u = [
				0,
				4,
				0,
				2,
				0,
				1,
				0
			], h = [
				8,
				8,
				8,
				4,
				4,
				2,
				2
			], d = [
				8,
				8,
				4,
				4,
				2,
				2,
				1
			];
			let A = 0;
			for (; A < 7;) {
				const p = h[A], m = d[A];
				let w = 0, v = 0, b = c[A];
				for (; b < i;) b += p, v++;
				let y = u[A];
				for (; y < r;) y += m, w++;
				const E = Math.ceil(w * o / 8);
				_filterZero(e, t, l, w, v);
				let F = 0, _ = c[A];
				for (; _ < i;) {
					let t = u[A], i = l + F * E << 3;
					for (; t < r;) {
						var g;
						if (1 == o) g = (g = e[i >> 3]) >> 7 - (7 & i) & 1, f[_ * s + (t >> 3)] |= g << 7 - ((7 & t) << 0);
						if (2 == o) g = (g = e[i >> 3]) >> 6 - (7 & i) & 3, f[_ * s + (t >> 2)] |= g << 6 - ((3 & t) << 1);
						if (4 == o) g = (g = e[i >> 3]) >> 4 - (7 & i) & 15, f[_ * s + (t >> 1)] |= g << 4 - ((1 & t) << 2);
						if (o >= 8) {
							const r = _ * s + t * a;
							for (let t = 0; t < a; t++) f[r + t] = e[(i >> 3) + t];
						}
						i += o, t += m;
					}
					F++, _ += p;
				}
				w * v != 0 && (l += v * (1 + E)), A += 1;
			}
			return f;
		}(r, e)), r;
	}
	function _inflate(e, r) {
		return t(new Uint8Array(e.buffer, 2, e.length - 6), r);
	}
	var t = function() {
		const e = { H: {} };
		return e.H.N = function(t, r) {
			const i = Uint8Array;
			let o, a, s = 0, f = 0, l = 0, c = 0, u = 0, h = 0, d = 0, A = 0, g = 0;
			if (3 == t[0] && 0 == t[1]) return r || new i(0);
			const p = e.H, m = p.b, w = p.e, v = p.R, b = p.n, y = p.A, E = p.Z, F = p.m, _ = null == r;
			for (_ && (r = new i(t.length >>> 2 << 5)); 0 == s;) if (s = m(t, g, 1), f = m(t, g + 1, 2), g += 3, 0 != f) {
				if (_ && (r = e.H.W(r, A + (1 << 17))), 1 == f && (o = F.J, a = F.h, h = 511, d = 31), 2 == f) {
					l = w(t, g, 5) + 257, c = w(t, g + 5, 5) + 1, u = w(t, g + 10, 4) + 4, g += 14;
					let e = 1;
					for (var B = 0; B < 38; B += 2) F.Q[B] = 0, F.Q[B + 1] = 0;
					for (B = 0; B < u; B++) {
						const r = w(t, g + 3 * B, 3);
						F.Q[1 + (F.X[B] << 1)] = r, r > e && (e = r);
					}
					g += 3 * u, b(F.Q, e), y(F.Q, e, F.u), o = F.w, a = F.d, g = v(F.u, (1 << e) - 1, l + c, t, g, F.v);
					const r = p.V(F.v, 0, l, F.C);
					h = (1 << r) - 1;
					const i = p.V(F.v, l, c, F.D);
					d = (1 << i) - 1, b(F.C, r), y(F.C, r, o), b(F.D, i), y(F.D, i, a);
				}
				for (;;) {
					const e = o[E(t, g) & h];
					g += 15 & e;
					const i = e >>> 4;
					if (i >>> 8 == 0) r[A++] = i;
					else {
						if (256 == i) break;
						{
							let e = A + i - 254;
							if (i > 264) {
								const r = F.q[i - 257];
								e = A + (r >>> 3) + w(t, g, 7 & r), g += 7 & r;
							}
							const o = a[E(t, g) & d];
							g += 15 & o;
							const s = o >>> 4, f = F.c[s], l = (f >>> 4) + m(t, g, 15 & f);
							for (g += 15 & f; A < e;) r[A] = r[A++ - l], r[A] = r[A++ - l], r[A] = r[A++ - l], r[A] = r[A++ - l];
							A = e;
						}
					}
				}
			} else {
				0 != (7 & g) && (g += 8 - (7 & g));
				const o = 4 + (g >>> 3), a = t[o - 4] | t[o - 3] << 8;
				_ && (r = e.H.W(r, A + a)), r.set(new i(t.buffer, t.byteOffset + o, a), A), g = o + a << 3, A += a;
			}
			return r.length == A ? r : r.slice(0, A);
		}, e.H.W = function(e, t) {
			const r = e.length;
			if (t <= r) return e;
			const i = new Uint8Array(r << 1);
			return i.set(e, 0), i;
		}, e.H.R = function(t, r, i, o, a, s) {
			const f = e.H.e, l = e.H.Z;
			let c = 0;
			for (; c < i;) {
				const e = t[l(o, a) & r];
				a += 15 & e;
				const i = e >>> 4;
				if (i <= 15) s[c] = i, c++;
				else {
					let e = 0, t = 0;
					16 == i ? (t = 3 + f(o, a, 2), a += 2, e = s[c - 1]) : 17 == i ? (t = 3 + f(o, a, 3), a += 3) : 18 == i && (t = 11 + f(o, a, 7), a += 7);
					const r = c + t;
					for (; c < r;) s[c] = e, c++;
				}
			}
			return a;
		}, e.H.V = function(e, t, r, i) {
			let o = 0, a = 0;
			const s = i.length >>> 1;
			for (; a < r;) {
				const r = e[a + t];
				i[a << 1] = 0, i[1 + (a << 1)] = r, r > o && (o = r), a++;
			}
			for (; a < s;) i[a << 1] = 0, i[1 + (a << 1)] = 0, a++;
			return o;
		}, e.H.n = function(t, r) {
			const i = e.H.m, o = t.length;
			let a, s, f;
			let l;
			const c = i.j;
			for (var u = 0; u <= r; u++) c[u] = 0;
			for (u = 1; u < o; u += 2) c[t[u]]++;
			const h = i.K;
			for (a = 0, c[0] = 0, s = 1; s <= r; s++) a = a + c[s - 1] << 1, h[s] = a;
			for (f = 0; f < o; f += 2) l = t[f + 1], 0 != l && (t[f] = h[l], h[l]++);
		}, e.H.A = function(t, r, i) {
			const o = t.length, a = e.H.m.r;
			for (let e = 0; e < o; e += 2) if (0 != t[e + 1]) {
				const o = e >> 1, s = t[e + 1], f = o << 4 | s, l = r - s;
				let c = t[e] << l;
				const u = c + (1 << l);
				for (; c != u;) i[a[c] >>> 15 - r] = f, c++;
			}
		}, e.H.l = function(t, r) {
			const i = e.H.m.r, o = 15 - r;
			for (let e = 0; e < t.length; e += 2) t[e] = i[t[e] << r - t[e + 1]] >>> o;
		}, e.H.M = function(e, t, r) {
			r <<= 7 & t;
			const i = t >>> 3;
			e[i] |= r, e[i + 1] |= r >>> 8;
		}, e.H.I = function(e, t, r) {
			r <<= 7 & t;
			const i = t >>> 3;
			e[i] |= r, e[i + 1] |= r >>> 8, e[i + 2] |= r >>> 16;
		}, e.H.e = function(e, t, r) {
			return (e[t >>> 3] | e[1 + (t >>> 3)] << 8) >>> (7 & t) & (1 << r) - 1;
		}, e.H.b = function(e, t, r) {
			return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t) & (1 << r) - 1;
		}, e.H.Z = function(e, t) {
			return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t);
		}, e.H.i = function(e, t) {
			return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16 | e[3 + (t >>> 3)] << 24) >>> (7 & t);
		}, e.H.m = function() {
			const e = Uint16Array, t = Uint32Array;
			return {
				K: new e(16),
				j: new e(16),
				X: [
					16,
					17,
					18,
					0,
					8,
					7,
					9,
					6,
					10,
					5,
					11,
					4,
					12,
					3,
					13,
					2,
					14,
					1,
					15
				],
				S: [
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					13,
					15,
					17,
					19,
					23,
					27,
					31,
					35,
					43,
					51,
					59,
					67,
					83,
					99,
					115,
					131,
					163,
					195,
					227,
					258,
					999,
					999,
					999
				],
				T: [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					3,
					3,
					3,
					3,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					0,
					0,
					0,
					0
				],
				q: new e(32),
				p: [
					1,
					2,
					3,
					4,
					5,
					7,
					9,
					13,
					17,
					25,
					33,
					49,
					65,
					97,
					129,
					193,
					257,
					385,
					513,
					769,
					1025,
					1537,
					2049,
					3073,
					4097,
					6145,
					8193,
					12289,
					16385,
					24577,
					65535,
					65535
				],
				z: [
					0,
					0,
					0,
					0,
					1,
					1,
					2,
					2,
					3,
					3,
					4,
					4,
					5,
					5,
					6,
					6,
					7,
					7,
					8,
					8,
					9,
					9,
					10,
					10,
					11,
					11,
					12,
					12,
					13,
					13,
					0,
					0
				],
				c: new t(32),
				J: new e(512),
				_: [],
				h: new e(32),
				$: [],
				w: new e(32768),
				C: [],
				v: [],
				d: new e(32768),
				D: [],
				u: new e(512),
				Q: [],
				r: new e(32768),
				s: new t(286),
				Y: new t(30),
				a: new t(19),
				t: new t(15e3),
				k: new e(65536),
				g: new e(32768)
			};
		}(), function() {
			const t = e.H.m;
			for (var r = 0; r < 32768; r++) {
				let e = r;
				e = (2863311530 & e) >>> 1 | (1431655765 & e) << 1, e = (3435973836 & e) >>> 2 | (858993459 & e) << 2, e = (4042322160 & e) >>> 4 | (252645135 & e) << 4, e = (4278255360 & e) >>> 8 | (16711935 & e) << 8, t.r[r] = (e >>> 16 | e << 16) >>> 17;
			}
			function n(e, t, r) {
				for (; 0 != t--;) e.push(0, r);
			}
			for (r = 0; r < 32; r++) t.q[r] = t.S[r] << 3 | t.T[r], t.c[r] = t.p[r] << 4 | t.z[r];
			n(t._, 144, 8), n(t._, 112, 9), n(t._, 24, 7), n(t._, 8, 8), e.H.n(t._, 9), e.H.A(t._, 9, t.J), e.H.l(t._, 9), n(t.$, 32, 5), e.H.n(t.$, 5), e.H.A(t.$, 5, t.h), e.H.l(t.$, 5), n(t.Q, 19, 0), n(t.C, 286, 0), n(t.D, 30, 0), n(t.v, 320, 0);
		}(), e.H.N;
	}();
	function _getBPP(e) {
		return [
			1,
			null,
			3,
			1,
			2,
			null,
			4
		][e.ctype] * e.depth;
	}
	function _filterZero(e, t, r, i, o) {
		let a = _getBPP(t);
		const s = Math.ceil(i * a / 8);
		let f, l;
		a = Math.ceil(a / 8);
		let c = e[r], u = 0;
		if (c > 1 && (e[r] = [
			0,
			0,
			1
		][c - 2]), 3 == c) for (u = a; u < s; u++) e[u + 1] = e[u + 1] + (e[u + 1 - a] >>> 1) & 255;
		for (let t = 0; t < o; t++) if (f = r + t * s, l = f + t + 1, c = e[l - 1], u = 0, 0 == c) for (; u < s; u++) e[f + u] = e[l + u];
		else if (1 == c) {
			for (; u < a; u++) e[f + u] = e[l + u];
			for (; u < s; u++) e[f + u] = e[l + u] + e[f + u - a];
		} else if (2 == c) for (; u < s; u++) e[f + u] = e[l + u] + e[f + u - s];
		else if (3 == c) {
			for (; u < a; u++) e[f + u] = e[l + u] + (e[f + u - s] >>> 1);
			for (; u < s; u++) e[f + u] = e[l + u] + (e[f + u - s] + e[f + u - a] >>> 1);
		} else {
			for (; u < a; u++) e[f + u] = e[l + u] + _paeth(0, e[f + u - s], 0);
			for (; u < s; u++) e[f + u] = e[l + u] + _paeth(e[f + u - a], e[f + u - s], e[f + u - a - s]);
		}
		return e;
	}
	function _paeth(e, t, r) {
		const i = e + t - r, o = i - e, a = i - t, s = i - r;
		return o * o <= a * a && o * o <= s * s ? e : a * a <= s * s ? t : r;
	}
	function _IHDR(t, r, i) {
		i.width = e.readUint(t, r), r += 4, i.height = e.readUint(t, r), r += 4, i.depth = t[r], r++, i.ctype = t[r], r++, i.compress = t[r], r++, i.filter = t[r], r++, i.interlace = t[r], r++;
	}
	function _copyTile(e, t, r, i, o, a, s, f, l) {
		const c = Math.min(t, o), u = Math.min(r, a);
		let h = 0, d = 0;
		for (let r = 0; r < u; r++) for (let a = 0; a < c; a++) if (s >= 0 && f >= 0 ? (h = r * t + a << 2, d = (f + r) * o + s + a << 2) : (h = (-f + r) * t - s + a << 2, d = r * o + a << 2), 0 == l) i[d] = e[h], i[d + 1] = e[h + 1], i[d + 2] = e[h + 2], i[d + 3] = e[h + 3];
		else if (1 == l) {
			var A = e[h + 3] * (1 / 255), g = e[h] * A, p = e[h + 1] * A, m = e[h + 2] * A, w = i[d + 3] * (1 / 255), v = i[d] * w, b = i[d + 1] * w, y = i[d + 2] * w;
			const t = 1 - A, r = A + w * t, o = 0 == r ? 0 : 1 / r;
			i[d + 3] = 255 * r, i[d + 0] = (g + v * t) * o, i[d + 1] = (p + b * t) * o, i[d + 2] = (m + y * t) * o;
		} else if (2 == l) {
			A = e[h + 3], g = e[h], p = e[h + 1], m = e[h + 2], w = i[d + 3], v = i[d], b = i[d + 1], y = i[d + 2];
			A == w && g == v && p == b && m == y ? (i[d] = 0, i[d + 1] = 0, i[d + 2] = 0, i[d + 3] = 0) : (i[d] = g, i[d + 1] = p, i[d + 2] = m, i[d + 3] = A);
		} else if (3 == l) {
			A = e[h + 3], g = e[h], p = e[h + 1], m = e[h + 2], w = i[d + 3], v = i[d], b = i[d + 1], y = i[d + 2];
			if (A == w && g == v && p == b && m == y) continue;
			if (A < 220 && w > 20) return !1;
		}
		return !0;
	}
	return {
		decode: function decode(r) {
			const i = new Uint8Array(r);
			let o = 8;
			const a = e, s = a.readUshort, f = a.readUint, l = {
				tabs: {},
				frames: []
			}, c = new Uint8Array(i.length);
			let u, h = 0, d = 0;
			const A = [
				137,
				80,
				78,
				71,
				13,
				10,
				26,
				10
			];
			for (var g = 0; g < 8; g++) if (i[g] != A[g]) throw "The input is not a PNG file!";
			for (; o < i.length;) {
				const e = a.readUint(i, o);
				o += 4;
				const r = a.readASCII(i, o, 4);
				if (o += 4, "IHDR" == r) _IHDR(i, o, l);
				else if ("iCCP" == r) {
					for (var p = o; 0 != i[p];) p++;
					a.readASCII(i, o, p - o), i[p + 1];
					const s = i.slice(p + 2, o + e);
					let f = null;
					try {
						f = _inflate(s);
					} catch (e) {
						f = t(s);
					}
					l.tabs[r] = f;
				} else if ("CgBI" == r) l.tabs[r] = i.slice(o, o + 4);
				else if ("IDAT" == r) {
					for (g = 0; g < e; g++) c[h + g] = i[o + g];
					h += e;
				} else if ("acTL" == r) l.tabs[r] = {
					num_frames: f(i, o),
					num_plays: f(i, o + 4)
				}, u = new Uint8Array(i.length);
				else if ("fcTL" == r) {
					if (0 != d) (E = l.frames[l.frames.length - 1]).data = _decompress(l, u.slice(0, d), E.rect.width, E.rect.height), d = 0;
					const e = {
						x: f(i, o + 12),
						y: f(i, o + 16),
						width: f(i, o + 4),
						height: f(i, o + 8)
					};
					let t = s(i, o + 22);
					t = s(i, o + 20) / (0 == t ? 100 : t);
					const r = {
						rect: e,
						delay: Math.round(1e3 * t),
						dispose: i[o + 24],
						blend: i[o + 25]
					};
					l.frames.push(r);
				} else if ("fdAT" == r) {
					for (g = 0; g < e - 4; g++) u[d + g] = i[o + g + 4];
					d += e - 4;
				} else if ("pHYs" == r) l.tabs[r] = [
					a.readUint(i, o),
					a.readUint(i, o + 4),
					i[o + 8]
				];
				else if ("cHRM" == r) {
					l.tabs[r] = [];
					for (g = 0; g < 8; g++) l.tabs[r].push(a.readUint(i, o + 4 * g));
				} else if ("tEXt" == r || "zTXt" == r) {
					l.tabs[r] ?? (l.tabs[r] = {});
					var m = a.nextZero(i, o), w = a.readASCII(i, o, m - o), v = o + e - m - 1;
					if ("tEXt" == r) y = a.readASCII(i, m + 1, v);
					else {
						var b = _inflate(i.slice(m + 2, m + 2 + v));
						y = a.readUTF8(b, 0, b.length);
					}
					l.tabs[r][w] = y;
				} else if ("iTXt" == r) {
					l.tabs[r] ?? (l.tabs[r] = {});
					m = 0, p = o;
					m = a.nextZero(i, p);
					w = a.readASCII(i, p, m - p);
					const t = i[p = m + 1];
					var y;
					i[p + 1], p += 2, m = a.nextZero(i, p), a.readASCII(i, p, m - p), p = m + 1, m = a.nextZero(i, p), a.readUTF8(i, p, m - p);
					v = e - ((p = m + 1) - o);
					if (0 == t) y = a.readUTF8(i, p, v);
					else {
						b = _inflate(i.slice(p, p + v));
						y = a.readUTF8(b, 0, b.length);
					}
					l.tabs[r][w] = y;
				} else if ("PLTE" == r) l.tabs[r] = a.readBytes(i, o, e);
				else if ("hIST" == r) {
					const e = l.tabs.PLTE.length / 3;
					l.tabs[r] = [];
					for (g = 0; g < e; g++) l.tabs[r].push(s(i, o + 2 * g));
				} else if ("tRNS" == r) 3 == l.ctype ? l.tabs[r] = a.readBytes(i, o, e) : 0 == l.ctype ? l.tabs[r] = s(i, o) : 2 == l.ctype && (l.tabs[r] = [
					s(i, o),
					s(i, o + 2),
					s(i, o + 4)
				]);
				else if ("gAMA" == r) l.tabs[r] = a.readUint(i, o) / 1e5;
				else if ("sRGB" == r) l.tabs[r] = i[o];
				else if ("bKGD" == r) 0 == l.ctype || 4 == l.ctype ? l.tabs[r] = [s(i, o)] : 2 == l.ctype || 6 == l.ctype ? l.tabs[r] = [
					s(i, o),
					s(i, o + 2),
					s(i, o + 4)
				] : 3 == l.ctype && (l.tabs[r] = i[o]);
				else if ("IEND" == r) break;
				o += e, a.readUint(i, o), o += 4;
			}
			var E;
			return 0 != d && ((E = l.frames[l.frames.length - 1]).data = _decompress(l, u.slice(0, d), E.rect.width, E.rect.height)), l.data = _decompress(l, c, l.width, l.height), delete l.compress, delete l.interlace, delete l.filter, l;
		},
		toRGBA8: function toRGBA8(e) {
			const t = e.width, r = e.height;
			if (null == e.tabs.acTL) return [decodeImage(e.data, t, r, e).buffer];
			const i = [];
			e.frames[0].data ?? (e.frames[0].data = e.data);
			const o = t * r * 4, a = new Uint8Array(o), s = new Uint8Array(o), f = new Uint8Array(o);
			for (let c = 0; c < e.frames.length; c++) {
				const u = e.frames[c], h = u.rect.x, d = u.rect.y, A = u.rect.width, g = u.rect.height, p = decodeImage(u.data, A, g, e);
				if (0 != c) for (var l = 0; l < o; l++) f[l] = a[l];
				if (0 == u.blend ? _copyTile(p, A, g, a, t, r, h, d, 0) : 1 == u.blend && _copyTile(p, A, g, a, t, r, h, d, 1), i.push(a.buffer.slice(0)), 0 == u.dispose);
				else if (1 == u.dispose) _copyTile(s, A, g, a, t, r, h, d, 0);
				else if (2 == u.dispose) for (l = 0; l < o; l++) a[l] = f[l];
			}
			return i;
		},
		_paeth,
		_copyTile,
		_bin: e
	};
}();
(function() {
	const { _copyTile: e } = UPNG, { _bin: t } = UPNG, r = UPNG._paeth;
	var i = {
		table: function() {
			const e = new Uint32Array(256);
			for (let t = 0; t < 256; t++) {
				let r = t;
				for (let e = 0; e < 8; e++) 1 & r ? r = 3988292384 ^ r >>> 1 : r >>>= 1;
				e[t] = r;
			}
			return e;
		}(),
		update(e, t, r, o) {
			for (let a = 0; a < o; a++) e = i.table[255 & (e ^ t[r + a])] ^ e >>> 8;
			return e;
		},
		crc: (e, t, r) => 4294967295 ^ i.update(4294967295, e, t, r)
	};
	function addErr(e, t, r, i) {
		t[r] += e[0] * i >> 4, t[r + 1] += e[1] * i >> 4, t[r + 2] += e[2] * i >> 4, t[r + 3] += e[3] * i >> 4;
	}
	function N(e) {
		return Math.max(0, Math.min(255, e));
	}
	function D(e, t) {
		const r = e[0] - t[0], i = e[1] - t[1], o = e[2] - t[2], a = e[3] - t[3];
		return r * r + i * i + o * o + a * a;
	}
	function dither(e, t, r, i, o, a, s) {
		s ?? (s = 1);
		const f = i.length, l = [];
		for (var c = 0; c < f; c++) {
			const e = i[c];
			l.push([
				e >>> 0 & 255,
				e >>> 8 & 255,
				e >>> 16 & 255,
				e >>> 24 & 255
			]);
		}
		for (c = 0; c < f; c++) {
			let e = 4294967295;
			for (var u = 0, h = 0; h < f; h++) {
				var d = D(l[c], l[h]);
				h != c && d < e && (e = d, u = h);
			}
		}
		const A = new Uint32Array(o.buffer), g = new Int16Array(t * r * 4), p = [
			0,
			8,
			2,
			10,
			12,
			4,
			14,
			6,
			3,
			11,
			1,
			9,
			15,
			7,
			13,
			5
		];
		for (c = 0; c < p.length; c++) p[c] = 255 * ((p[c] + .5) / 16 - .5);
		for (let o = 0; o < r; o++) for (let w = 0; w < t; w++) {
			var m;
			c = 4 * (o * t + w);
			if (2 != s) m = [
				N(e[c] + g[c]),
				N(e[c + 1] + g[c + 1]),
				N(e[c + 2] + g[c + 2]),
				N(e[c + 3] + g[c + 3])
			];
			else {
				d = p[4 * (3 & o) + (3 & w)];
				m = [
					N(e[c] + d),
					N(e[c + 1] + d),
					N(e[c + 2] + d),
					N(e[c + 3] + d)
				];
			}
			u = 0;
			let v = 16777215;
			for (h = 0; h < f; h++) {
				const e = D(m, l[h]);
				e < v && (v = e, u = h);
			}
			const b = l[u], y = [
				m[0] - b[0],
				m[1] - b[1],
				m[2] - b[2],
				m[3] - b[3]
			];
			1 == s && (w != t - 1 && addErr(y, g, c + 4, 7), o != r - 1 && (0 != w && addErr(y, g, c + 4 * t - 4, 3), addErr(y, g, c + 4 * t, 5), w != t - 1 && addErr(y, g, c + 4 * t + 4, 1))), a[c >> 2] = u, A[c >> 2] = i[u];
		}
	}
	function _main(e, r, o, a, s) {
		s ?? (s = {});
		const { crc: f } = i, l = t.writeUint, c = t.writeUshort, u = t.writeASCII;
		let h = 8;
		const d = e.frames.length > 1;
		let A, g = !1, p = 33 + (d ? 20 : 0);
		if (null != s.sRGB && (p += 13), null != s.pHYs && (p += 21), null != s.iCCP && (A = pako.deflate(s.iCCP), p += 21 + A.length + 4), 3 == e.ctype) {
			for (var m = e.plte.length, w = 0; w < m; w++) e.plte[w] >>> 24 != 255 && (g = !0);
			p += 8 + 3 * m + 4 + (g ? 8 + 1 * m + 4 : 0);
		}
		for (var v = 0; v < e.frames.length; v++) d && (p += 38), p += (F = e.frames[v]).cimg.length + 12, 0 != v && (p += 4);
		p += 12;
		const b = new Uint8Array(p), y = [
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		];
		for (w = 0; w < 8; w++) b[w] = y[w];
		if (l(b, h, 13), h += 4, u(b, h, "IHDR"), h += 4, l(b, h, r), h += 4, l(b, h, o), h += 4, b[h] = e.depth, h++, b[h] = e.ctype, h++, b[h] = 0, h++, b[h] = 0, h++, b[h] = 0, h++, l(b, h, f(b, h - 17, 17)), h += 4, null != s.sRGB && (l(b, h, 1), h += 4, u(b, h, "sRGB"), h += 4, b[h] = s.sRGB, h++, l(b, h, f(b, h - 5, 5)), h += 4), null != s.iCCP) {
			const e = 13 + A.length;
			l(b, h, e), h += 4, u(b, h, "iCCP"), h += 4, u(b, h, "ICC profile"), h += 11, h += 2, b.set(A, h), h += A.length, l(b, h, f(b, h - (e + 4), e + 4)), h += 4;
		}
		if (null != s.pHYs && (l(b, h, 9), h += 4, u(b, h, "pHYs"), h += 4, l(b, h, s.pHYs[0]), h += 4, l(b, h, s.pHYs[1]), h += 4, b[h] = s.pHYs[2], h++, l(b, h, f(b, h - 13, 13)), h += 4), d && (l(b, h, 8), h += 4, u(b, h, "acTL"), h += 4, l(b, h, e.frames.length), h += 4, l(b, h, null != s.loop ? s.loop : 0), h += 4, l(b, h, f(b, h - 12, 12)), h += 4), 3 == e.ctype) {
			l(b, h, 3 * (m = e.plte.length)), h += 4, u(b, h, "PLTE"), h += 4;
			for (w = 0; w < m; w++) {
				const t = 3 * w, r = e.plte[w], i = 255 & r, o = r >>> 8 & 255, a = r >>> 16 & 255;
				b[h + t + 0] = i, b[h + t + 1] = o, b[h + t + 2] = a;
			}
			if (h += 3 * m, l(b, h, f(b, h - 3 * m - 4, 3 * m + 4)), h += 4, g) {
				l(b, h, m), h += 4, u(b, h, "tRNS"), h += 4;
				for (w = 0; w < m; w++) b[h + w] = e.plte[w] >>> 24 & 255;
				h += m, l(b, h, f(b, h - m - 4, m + 4)), h += 4;
			}
		}
		let E = 0;
		for (v = 0; v < e.frames.length; v++) {
			var F = e.frames[v];
			d && (l(b, h, 26), h += 4, u(b, h, "fcTL"), h += 4, l(b, h, E++), h += 4, l(b, h, F.rect.width), h += 4, l(b, h, F.rect.height), h += 4, l(b, h, F.rect.x), h += 4, l(b, h, F.rect.y), h += 4, c(b, h, a[v]), h += 2, c(b, h, 1e3), h += 2, b[h] = F.dispose, h++, b[h] = F.blend, h++, l(b, h, f(b, h - 30, 30)), h += 4);
			const t = F.cimg;
			l(b, h, (m = t.length) + (0 == v ? 0 : 4)), h += 4;
			const r = h;
			u(b, h, 0 == v ? "IDAT" : "fdAT"), h += 4, 0 != v && (l(b, h, E++), h += 4), b.set(t, h), h += m, l(b, h, f(b, r, h - r)), h += 4;
		}
		return l(b, h, 0), h += 4, u(b, h, "IEND"), h += 4, l(b, h, f(b, h - 4, 4)), h += 4, b.buffer;
	}
	function compressPNG(e, t, r) {
		for (let i = 0; i < e.frames.length; i++) {
			const o = e.frames[i];
			o.rect.width;
			const a = o.rect.height, s = new Uint8Array(a * o.bpl + a);
			o.cimg = _filterZero(o.img, a, o.bpp, o.bpl, s, t, r);
		}
	}
	function compress(t, r, i, o, a) {
		const s = a[0], f = a[1], l = a[2], c = a[3], u = a[4], h = a[5];
		let d = 6, A = 8, g = 255;
		for (var p = 0; p < t.length; p++) {
			const e = new Uint8Array(t[p]);
			for (var m = e.length, w = 0; w < m; w += 4) g &= e[w + 3];
		}
		const v = 255 != g, b = function framize(t, r, i, o, a, s) {
			const f = [];
			for (var l = 0; l < t.length; l++) {
				const h = new Uint8Array(t[l]), A = new Uint32Array(h.buffer);
				var c;
				let g = 0, p = 0, m = r, w = i, v = o ? 1 : 0;
				if (0 != l) {
					const b = s || o || 1 == l || 0 != f[l - 2].dispose ? 1 : 2;
					let y = 0, E = 1e9;
					for (let e = 0; e < b; e++) {
						var u = new Uint8Array(t[l - 1 - e]);
						const o = new Uint32Array(t[l - 1 - e]);
						let s = r, f = i, c = -1, h = -1;
						for (let e = 0; e < i; e++) for (let t = 0; t < r; t++) A[d = e * r + t] != o[d] && (t < s && (s = t), t > c && (c = t), e < f && (f = e), e > h && (h = e));
						-1 == c && (s = f = c = h = 0), a && (1 == (1 & s) && s--, 1 == (1 & f) && f--);
						const v = (c - s + 1) * (h - f + 1);
						v < E && (E = v, y = e, g = s, p = f, m = c - s + 1, w = h - f + 1);
					}
					u = new Uint8Array(t[l - 1 - y]);
					1 == y && (f[l - 1].dispose = 2), c = new Uint8Array(m * w * 4), e(u, r, i, c, m, w, -g, -p, 0), v = e(h, r, i, c, m, w, -g, -p, 3) ? 1 : 0, 1 == v ? _prepareDiff(h, r, i, c, {
						x: g,
						y: p,
						width: m,
						height: w
					}) : e(h, r, i, c, m, w, -g, -p, 0);
				} else c = h.slice(0);
				f.push({
					rect: {
						x: g,
						y: p,
						width: m,
						height: w
					},
					img: c,
					blend: v,
					dispose: 0
				});
			}
			if (o) for (l = 0; l < f.length; l++) {
				if (1 == (A = f[l]).blend) continue;
				const e = A.rect, o = f[l - 1].rect, s = Math.min(e.x, o.x), c = Math.min(e.y, o.y), u = {
					x: s,
					y: c,
					width: Math.max(e.x + e.width, o.x + o.width) - s,
					height: Math.max(e.y + e.height, o.y + o.height) - c
				};
				f[l - 1].dispose = 1, l - 1 != 0 && _updateFrame(t, r, i, f, l - 1, u, a), _updateFrame(t, r, i, f, l, u, a);
			}
			let h = 0;
			if (1 != t.length) for (var d = 0; d < f.length; d++) {
				var A;
				h += (A = f[d]).rect.width * A.rect.height;
			}
			return f;
		}(t, r, i, s, f, l), y = {}, E = [], F = [];
		if (0 != o) {
			const e = [];
			for (w = 0; w < b.length; w++) e.push(b[w].img.buffer);
			const r = quantize(function concatRGBA(e) {
				let t = 0;
				for (var r = 0; r < e.length; r++) t += e[r].byteLength;
				const i = new Uint8Array(t);
				let o = 0;
				for (r = 0; r < e.length; r++) {
					const t = new Uint8Array(e[r]), a = t.length;
					for (let e = 0; e < a; e += 4) {
						let r = t[e], a = t[e + 1], s = t[e + 2];
						const f = t[e + 3];
						0 == f && (r = a = s = 0), i[o + e] = r, i[o + e + 1] = a, i[o + e + 2] = s, i[o + e + 3] = f;
					}
					o += a;
				}
				return i.buffer;
			}(e), o);
			for (w = 0; w < r.plte.length; w++) E.push(r.plte[w].est.rgba);
			let i = 0;
			for (w = 0; w < b.length; w++) {
				const e = (B = b[w]).img.length;
				var _ = new Uint8Array(r.inds.buffer, i >> 2, e >> 2);
				F.push(_);
				const t = new Uint8Array(r.abuf, i, e);
				h && dither(B.img, B.rect.width, B.rect.height, E, t, _), B.img.set(t), i += e;
			}
		} else for (p = 0; p < b.length; p++) {
			var B = b[p];
			const e = new Uint32Array(B.img.buffer);
			var U = B.rect.width;
			m = e.length, _ = new Uint8Array(m);
			F.push(_);
			for (w = 0; w < m; w++) {
				const t = e[w];
				if (0 != w && t == e[w - 1]) _[w] = _[w - 1];
				else if (w > U && t == e[w - U]) _[w] = _[w - U];
				else {
					let e = y[t];
					if (null == e && (y[t] = e = E.length, E.push(t), E.length >= 300)) break;
					_[w] = e;
				}
			}
		}
		const C = E.length;
		C <= 256 && 0 == u && (A = C <= 2 ? 1 : C <= 4 ? 2 : C <= 16 ? 4 : 8, A = Math.max(A, c));
		for (p = 0; p < b.length; p++) {
			(B = b[p]).rect.x, B.rect.y;
			U = B.rect.width;
			const e = B.rect.height;
			let t = B.img;
			new Uint32Array(t.buffer);
			let r = 4 * U, i = 4;
			if (C <= 256 && 0 == u) {
				r = Math.ceil(A * U / 8);
				var I = new Uint8Array(r * e);
				const o = F[p];
				for (let t = 0; t < e; t++) {
					w = t * r;
					const e = t * U;
					if (8 == A) for (var Q = 0; Q < U; Q++) I[w + Q] = o[e + Q];
					else if (4 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 1)] |= o[e + Q] << 4 - 4 * (1 & Q);
					else if (2 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 2)] |= o[e + Q] << 6 - 2 * (3 & Q);
					else if (1 == A) for (Q = 0; Q < U; Q++) I[w + (Q >> 3)] |= o[e + Q] << 7 - 1 * (7 & Q);
				}
				t = I, d = 3, i = 1;
			} else if (0 == v && 1 == b.length) {
				I = new Uint8Array(U * e * 3);
				const o = U * e;
				for (w = 0; w < o; w++) {
					const e = 3 * w, r = 4 * w;
					I[e] = t[r], I[e + 1] = t[r + 1], I[e + 2] = t[r + 2];
				}
				t = I, d = 2, i = 3, r = 3 * U;
			}
			B.img = t, B.bpl = r, B.bpp = i;
		}
		return {
			ctype: d,
			depth: A,
			plte: E,
			frames: b
		};
	}
	function _updateFrame(t, r, i, o, a, s, f) {
		const l = Uint8Array, c = Uint32Array, u = new l(t[a - 1]), h = new c(t[a - 1]), d = a + 1 < t.length ? new l(t[a + 1]) : null, A = new l(t[a]), g = new c(A.buffer);
		let p = r, m = i, w = -1, v = -1;
		for (let e = 0; e < s.height; e++) for (let t = 0; t < s.width; t++) {
			const i = s.x + t, f = s.y + e, l = f * r + i, c = g[l];
			0 == c || 0 == o[a - 1].dispose && h[l] == c && (null == d || 0 != d[4 * l + 3]) || (i < p && (p = i), i > w && (w = i), f < m && (m = f), f > v && (v = f));
		}
		-1 == w && (p = m = w = v = 0), f && (1 == (1 & p) && p--, 1 == (1 & m) && m--), s = {
			x: p,
			y: m,
			width: w - p + 1,
			height: v - m + 1
		};
		const b = o[a];
		b.rect = s, b.blend = 1, b.img = new Uint8Array(s.width * s.height * 4), 0 == o[a - 1].dispose ? (e(u, r, i, b.img, s.width, s.height, -s.x, -s.y, 0), _prepareDiff(A, r, i, b.img, s)) : e(A, r, i, b.img, s.width, s.height, -s.x, -s.y, 0);
	}
	function _prepareDiff(t, r, i, o, a) {
		e(t, r, i, o, a.width, a.height, -a.x, -a.y, 2);
	}
	function _filterZero(e, t, r, i, o, a, s) {
		const f = [];
		let l, c = [
			0,
			1,
			2,
			3,
			4
		];
		-1 != a ? c = [a] : (t * i > 5e5 || 1 == r) && (c = [0]), s && (l = { level: 0 });
		const u = UZIP;
		for (var h = 0; h < c.length; h++) {
			for (let a = 0; a < t; a++) _filterLine(o, e, a, i, r, c[h]);
			f.push(u.deflate(o, l));
		}
		let d, A = 1e9;
		for (h = 0; h < f.length; h++) f[h].length < A && (d = h, A = f[h].length);
		return f[d];
	}
	function _filterLine(e, t, i, o, a, s) {
		const f = i * o;
		let l = f + i;
		if (e[l] = s, l++, 0 == s) if (o < 500) for (var c = 0; c < o; c++) e[l + c] = t[f + c];
		else e.set(new Uint8Array(t.buffer, f, o), l);
		else if (1 == s) {
			for (c = 0; c < a; c++) e[l + c] = t[f + c];
			for (c = a; c < o; c++) e[l + c] = t[f + c] - t[f + c - a] + 256 & 255;
		} else if (0 == i) {
			for (c = 0; c < a; c++) e[l + c] = t[f + c];
			if (2 == s) for (c = a; c < o; c++) e[l + c] = t[f + c];
			if (3 == s) for (c = a; c < o; c++) e[l + c] = t[f + c] - (t[f + c - a] >> 1) + 256 & 255;
			if (4 == s) for (c = a; c < o; c++) e[l + c] = t[f + c] - r(t[f + c - a], 0, 0) + 256 & 255;
		} else {
			if (2 == s) for (c = 0; c < o; c++) e[l + c] = t[f + c] + 256 - t[f + c - o] & 255;
			if (3 == s) {
				for (c = 0; c < a; c++) e[l + c] = t[f + c] + 256 - (t[f + c - o] >> 1) & 255;
				for (c = a; c < o; c++) e[l + c] = t[f + c] + 256 - (t[f + c - o] + t[f + c - a] >> 1) & 255;
			}
			if (4 == s) {
				for (c = 0; c < a; c++) e[l + c] = t[f + c] + 256 - r(0, t[f + c - o], 0) & 255;
				for (c = a; c < o; c++) e[l + c] = t[f + c] + 256 - r(t[f + c - a], t[f + c - o], t[f + c - a - o]) & 255;
			}
		}
	}
	function quantize(e, t) {
		const r = new Uint8Array(e), i = r.slice(0), o = new Uint32Array(i.buffer), a = getKDtree(i, t), s = a[0], f = a[1], l = r.length, c = new Uint8Array(l >> 2);
		let u;
		if (r.length < 2e7) for (var h = 0; h < l; h += 4) u = getNearest(s, d = r[h] * (1 / 255), A = r[h + 1] * (1 / 255), g = r[h + 2] * (1 / 255), p = r[h + 3] * (1 / 255)), c[h >> 2] = u.ind, o[h >> 2] = u.est.rgba;
		else for (h = 0; h < l; h += 4) {
			var d = r[h] * (1 / 255), A = r[h + 1] * (1 / 255), g = r[h + 2] * (1 / 255), p = r[h + 3] * (1 / 255);
			for (u = s; u.left;) u = planeDst(u.est, d, A, g, p) <= 0 ? u.left : u.right;
			c[h >> 2] = u.ind, o[h >> 2] = u.est.rgba;
		}
		return {
			abuf: i.buffer,
			inds: c,
			plte: f
		};
	}
	function getKDtree(e, t, r) {
		r ?? (r = 1e-4);
		const i = new Uint32Array(e.buffer), o = {
			i0: 0,
			i1: e.length,
			bst: null,
			est: null,
			tdst: 0,
			left: null,
			right: null
		};
		o.bst = stats(e, o.i0, o.i1), o.est = estats(o.bst);
		const a = [o];
		for (; a.length < t;) {
			let t = 0, o = 0;
			for (var s = 0; s < a.length; s++) a[s].est.L > t && (t = a[s].est.L, o = s);
			if (t < r) break;
			const f = a[o], l = splitPixels(e, i, f.i0, f.i1, f.est.e, f.est.eMq255);
			if (f.i0 >= l || f.i1 <= l) {
				f.est.L = 0;
				continue;
			}
			const c = {
				i0: f.i0,
				i1: l,
				bst: null,
				est: null,
				tdst: 0,
				left: null,
				right: null
			};
			c.bst = stats(e, c.i0, c.i1), c.est = estats(c.bst);
			const u = {
				i0: l,
				i1: f.i1,
				bst: null,
				est: null,
				tdst: 0,
				left: null,
				right: null
			};
			u.bst = {
				R: [],
				m: [],
				N: f.bst.N - c.bst.N
			};
			for (s = 0; s < 16; s++) u.bst.R[s] = f.bst.R[s] - c.bst.R[s];
			for (s = 0; s < 4; s++) u.bst.m[s] = f.bst.m[s] - c.bst.m[s];
			u.est = estats(u.bst), f.left = c, f.right = u, a[o] = c, a.push(u);
		}
		a.sort(((e, t) => t.bst.N - e.bst.N));
		for (s = 0; s < a.length; s++) a[s].ind = s;
		return [o, a];
	}
	function getNearest(e, t, r, i, o) {
		if (null == e.left) return e.tdst = function dist(e, t, r, i, o) {
			const a = t - e[0], s = r - e[1], f = i - e[2], l = o - e[3];
			return a * a + s * s + f * f + l * l;
		}(e.est.q, t, r, i, o), e;
		const a = planeDst(e.est, t, r, i, o);
		let s = e.left, f = e.right;
		a > 0 && (s = e.right, f = e.left);
		const l = getNearest(s, t, r, i, o);
		if (l.tdst <= a * a) return l;
		const c = getNearest(f, t, r, i, o);
		return c.tdst < l.tdst ? c : l;
	}
	function planeDst(e, t, r, i, o) {
		const { e: a } = e;
		return a[0] * t + a[1] * r + a[2] * i + a[3] * o - e.eMq;
	}
	function splitPixels(e, t, r, i, o, a) {
		for (i -= 4; r < i;) {
			for (; vecDot(e, r, o) <= a;) r += 4;
			for (; vecDot(e, i, o) > a;) i -= 4;
			if (r >= i) break;
			const s = t[r >> 2];
			t[r >> 2] = t[i >> 2], t[i >> 2] = s, r += 4, i -= 4;
		}
		for (; vecDot(e, r, o) > a;) r -= 4;
		return r + 4;
	}
	function vecDot(e, t, r) {
		return e[t] * r[0] + e[t + 1] * r[1] + e[t + 2] * r[2] + e[t + 3] * r[3];
	}
	function stats(e, t, r) {
		const i = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		], o = [
			0,
			0,
			0,
			0
		], a = r - t >> 2;
		for (let a = t; a < r; a += 4) {
			const t = e[a] * (1 / 255), r = e[a + 1] * (1 / 255), s = e[a + 2] * (1 / 255), f = e[a + 3] * (1 / 255);
			o[0] += t, o[1] += r, o[2] += s, o[3] += f, i[0] += t * t, i[1] += t * r, i[2] += t * s, i[3] += t * f, i[5] += r * r, i[6] += r * s, i[7] += r * f, i[10] += s * s, i[11] += s * f, i[15] += f * f;
		}
		return i[4] = i[1], i[8] = i[2], i[9] = i[6], i[12] = i[3], i[13] = i[7], i[14] = i[11], {
			R: i,
			m: o,
			N: a
		};
	}
	function estats(e) {
		const { R: t } = e, { m: r } = e, { N: i } = e, a = r[0], s = r[1], f = r[2], l = r[3], c = 0 == i ? 0 : 1 / i, u = [
			t[0] - a * a * c,
			t[1] - a * s * c,
			t[2] - a * f * c,
			t[3] - a * l * c,
			t[4] - s * a * c,
			t[5] - s * s * c,
			t[6] - s * f * c,
			t[7] - s * l * c,
			t[8] - f * a * c,
			t[9] - f * s * c,
			t[10] - f * f * c,
			t[11] - f * l * c,
			t[12] - l * a * c,
			t[13] - l * s * c,
			t[14] - l * f * c,
			t[15] - l * l * c
		], h = u, d = o;
		let A = [
			Math.random(),
			Math.random(),
			Math.random(),
			Math.random()
		], g = 0, p = 0;
		if (0 != i) for (let e = 0; e < 16 && (A = d.multVec(h, A), p = Math.sqrt(d.dot(A, A)), A = d.sml(1 / p, A), !(0 != e && Math.abs(p - g) < 1e-9)); e++) g = p;
		const m = [
			a * c,
			s * c,
			f * c,
			l * c
		];
		return {
			Cov: u,
			q: m,
			e: A,
			L: g,
			eMq255: d.dot(d.sml(255, m), A),
			eMq: d.dot(A, m),
			rgba: (Math.round(255 * m[3]) << 24 | Math.round(255 * m[2]) << 16 | Math.round(255 * m[1]) << 8 | Math.round(255 * m[0]) << 0) >>> 0
		};
	}
	var o = {
		multVec: (e, t) => [
			e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3],
			e[4] * t[0] + e[5] * t[1] + e[6] * t[2] + e[7] * t[3],
			e[8] * t[0] + e[9] * t[1] + e[10] * t[2] + e[11] * t[3],
			e[12] * t[0] + e[13] * t[1] + e[14] * t[2] + e[15] * t[3]
		],
		dot: (e, t) => e[0] * t[0] + e[1] * t[1] + e[2] * t[2] + e[3] * t[3],
		sml: (e, t) => [
			e * t[0],
			e * t[1],
			e * t[2],
			e * t[3]
		]
	};
	UPNG.encode = function encode(e, t, r, i, o, a, s) {
		i ?? (i = 0), s ?? (s = !1);
		const f = compress(e, t, r, i, [
			!1,
			!1,
			!1,
			0,
			s,
			!1
		]);
		return compressPNG(f, -1), _main(f, t, r, o, a);
	}, UPNG.encodeLL = function encodeLL(e, t, r, i, o, a, s, f) {
		const l = {
			ctype: 0 + (1 == i ? 0 : 2) + (0 == o ? 0 : 4),
			depth: a,
			frames: []
		}, c = (i + o) * a, u = c * t;
		for (let i = 0; i < e.length; i++) l.frames.push({
			rect: {
				x: 0,
				y: 0,
				width: t,
				height: r
			},
			img: new Uint8Array(e[i]),
			blend: 0,
			dispose: 1,
			bpp: Math.ceil(c / 8),
			bpl: Math.ceil(u / 8)
		});
		return compressPNG(l, 0, !0), _main(l, t, r, s, f);
	}, UPNG.encode.compress = compress, UPNG.encode.dither = dither, UPNG.quantize = quantize, UPNG.quantize.getKDtree = getKDtree, UPNG.quantize.getNearest = getNearest;
})();
var r = {
	toArrayBuffer(e, t) {
		const i = e.width, o = e.height, a = i << 2, s = e.getContext("2d").getImageData(0, 0, i, o), f = new Uint32Array(s.data.buffer), l = (32 * i + 31) / 32 << 2, c = l * o, u = 122 + c, h = new ArrayBuffer(u), d = new DataView(h), A = 1 << 20;
		let g, p, m, w, v = A, b = 0, y = 0, E = 0;
		function set16(e) {
			d.setUint16(y, e, !0), y += 2;
		}
		function set32(e) {
			d.setUint32(y, e, !0), y += 4;
		}
		function seek(e) {
			y += e;
		}
		set16(19778), set32(u), seek(4), set32(122), set32(108), set32(i), set32(-o >>> 0), set16(1), set16(32), set32(3), set32(c), set32(2835), set32(2835), seek(8), set32(16711680), set32(65280), set32(255), set32(4278190080), set32(1466527264), function convert() {
			for (; b < o && v > 0;) {
				for (w = 122 + b * l, g = 0; g < a;) v--, p = f[E++], m = p >>> 24, d.setUint32(w + g, p << 8 | m), g += 4;
				b++;
			}
			E < f.length ? (v = A, setTimeout(convert, r._dly)) : t(h);
		}();
	},
	toBlob(e, t) {
		this.toArrayBuffer(e, ((e) => {
			t(new Blob([e], { type: "image/bmp" }));
		}));
	},
	_dly: 9
};
var i = {
	CHROME: "CHROME",
	FIREFOX: "FIREFOX",
	DESKTOP_SAFARI: "DESKTOP_SAFARI",
	IE: "IE",
	IOS: "IOS",
	ETC: "ETC"
}, o = {
	[i.CHROME]: 16384,
	[i.FIREFOX]: 11180,
	[i.DESKTOP_SAFARI]: 16384,
	[i.IE]: 8192,
	[i.IOS]: 4096,
	[i.ETC]: 8192
};
var a = "undefined" != typeof window, s = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope, f = a && window.cordova && window.cordova.require && window.cordova.require("cordova/modulemapper"), CustomFile = (a || s) && (f && f.getOriginalSymbol(window, "File") || "undefined" != typeof File && File), CustomFileReader = (a || s) && (f && f.getOriginalSymbol(window, "FileReader") || "undefined" != typeof FileReader && FileReader);
function getFilefromDataUrl(e, t, r = Date.now()) {
	return new Promise(((i) => {
		const o = e.split(","), a = o[0].match(/:(.*?);/)[1], s = globalThis.atob(o[1]);
		let f = s.length;
		const l = new Uint8Array(f);
		for (; f--;) l[f] = s.charCodeAt(f);
		const c = new Blob([l], { type: a });
		c.name = t, c.lastModified = r, i(c);
	}));
}
function getDataUrlFromFile(e) {
	return new Promise(((t, r) => {
		const i = new CustomFileReader();
		i.onload = () => t(i.result), i.onerror = (e) => r(e), i.readAsDataURL(e);
	}));
}
function loadImage(e) {
	return new Promise(((t, r) => {
		const i = new Image();
		i.onload = () => t(i), i.onerror = (e) => r(e), i.src = e;
	}));
}
function getBrowserName() {
	if (void 0 !== getBrowserName.cachedResult) return getBrowserName.cachedResult;
	let e = i.ETC;
	const { userAgent: t } = navigator;
	return /Chrom(e|ium)/i.test(t) ? e = i.CHROME : /iP(ad|od|hone)/i.test(t) && /WebKit/i.test(t) ? e = i.IOS : /Safari/i.test(t) ? e = i.DESKTOP_SAFARI : /Firefox/i.test(t) ? e = i.FIREFOX : (/MSIE/i.test(t) || !0 == !!document.documentMode) && (e = i.IE), getBrowserName.cachedResult = e, getBrowserName.cachedResult;
}
function approximateBelowMaximumCanvasSizeOfBrowser(e, t) {
	const i = o[getBrowserName()];
	let a = e, s = t, f = a * s;
	const l = a > s ? s / a : a / s;
	for (; f > i * i;) {
		const e = (i + a) / 2, t = (i + s) / 2;
		e < t ? (s = t, a = t * l) : (s = e * l, a = e), f = a * s;
	}
	return {
		width: a,
		height: s
	};
}
function getNewCanvasAndCtx(e, t) {
	let r, i;
	try {
		if (r = new OffscreenCanvas(e, t), i = r.getContext("2d"), null === i) throw new Error("getContext of OffscreenCanvas returns null");
	} catch (e) {
		r = document.createElement("canvas"), i = r.getContext("2d");
	}
	return r.width = e, r.height = t, [r, i];
}
function drawImageInCanvas(e, t) {
	const { width: r, height: i } = approximateBelowMaximumCanvasSizeOfBrowser(e.width, e.height), [o, a] = getNewCanvasAndCtx(r, i);
	return t && /jpe?g/.test(t) && (a.fillStyle = "white", a.fillRect(0, 0, o.width, o.height)), a.drawImage(e, 0, 0, o.width, o.height), o;
}
function isIOS() {
	return void 0 !== isIOS.cachedResult || (isIOS.cachedResult = [
		"iPad Simulator",
		"iPhone Simulator",
		"iPod Simulator",
		"iPad",
		"iPhone",
		"iPod"
	].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "undefined" != typeof document && "ontouchend" in document), isIOS.cachedResult;
}
function drawFileInCanvas(e, t = {}) {
	return new Promise((function(r, o) {
		let a, s;
		var $Try_2_Post = function() {
			try {
				return s = drawImageInCanvas(a, t.fileType || e.type), r([a, s]);
			} catch (e) {
				return o(e);
			}
		}, $Try_2_Catch = function(t) {
			try {
				var $Try_3_Catch = function(e) {
					try {
						throw e;
					} catch (e) {
						return o(e);
					}
				};
				try {
					let t;
					return getDataUrlFromFile(e).then((function(e) {
						try {
							return t = e, loadImage(t).then((function(e) {
								try {
									return a = e, function() {
										try {
											return $Try_2_Post();
										} catch (e) {
											return o(e);
										}
									}();
								} catch (e) {
									return $Try_3_Catch(e);
								}
							}), $Try_3_Catch);
						} catch (e) {
							return $Try_3_Catch(e);
						}
					}), $Try_3_Catch);
				} catch (e) {
					$Try_3_Catch(e);
				}
			} catch (e) {
				return o(e);
			}
		};
		try {
			if (isIOS() || [i.DESKTOP_SAFARI, i.MOBILE_SAFARI].includes(getBrowserName())) throw new Error("Skip createImageBitmap on IOS and Safari");
			return createImageBitmap(e).then((function(e) {
				try {
					return a = e, $Try_2_Post();
				} catch (e) {
					return $Try_2_Catch();
				}
			}), $Try_2_Catch);
		} catch (e) {
			$Try_2_Catch();
		}
	}));
}
function canvasToFile(e, t, i, o, a = 1) {
	return new Promise((function(s, f) {
		let l;
		if ("image/png" === t) {
			let c, u, h;
			return c = e.getContext("2d"), {data: u} = c.getImageData(0, 0, e.width, e.height), h = UPNG.encode([u.buffer], e.width, e.height, 4096 * a), l = new Blob([h], { type: t }), l.name = i, l.lastModified = o, $If_4.call(this);
		}
		{
			if ("image/bmp" === t) return new Promise(((t) => r.toBlob(e, t))).then(function(e) {
				try {
					return l = e, l.name = i, l.lastModified = o, $If_5.call(this);
				} catch (e) {
					return f(e);
				}
			}.bind(this), f);
			{
				if ("function" == typeof OffscreenCanvas && e instanceof OffscreenCanvas) return e.convertToBlob({
					type: t,
					quality: a
				}).then(function(e) {
					try {
						return l = e, l.name = i, l.lastModified = o, $If_6.call(this);
					} catch (e) {
						return f(e);
					}
				}.bind(this), f);
				{
					let d;
					return d = e.toDataURL(t, a), getFilefromDataUrl(d, i, o).then(function(e) {
						try {
							return l = e, $If_6.call(this);
						} catch (e) {
							return f(e);
						}
					}.bind(this), f);
				}
				function $If_6() {
					return $If_5.call(this);
				}
			}
			function $If_5() {
				return $If_4.call(this);
			}
		}
		function $If_4() {
			return s(l);
		}
	}));
}
function cleanupCanvasMemory(e) {
	e.width = 0, e.height = 0;
}
function isAutoOrientationInBrowser() {
	return new Promise((function(e, t) {
		let i, o, a, s;
		return void 0 !== isAutoOrientationInBrowser.cachedResult ? e(isAutoOrientationInBrowser.cachedResult) : getFilefromDataUrl("data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/xABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==", "test.jpg", Date.now()).then((function(r) {
			try {
				return i = r, drawFileInCanvas(i).then((function(r) {
					try {
						return o = r[1], canvasToFile(o, i.type, i.name, i.lastModified).then((function(r) {
							try {
								return a = r, cleanupCanvasMemory(o), drawFileInCanvas(a).then((function(r) {
									try {
										return s = r[0], isAutoOrientationInBrowser.cachedResult = 1 === s.width && 2 === s.height, e(isAutoOrientationInBrowser.cachedResult);
									} catch (e) {
										return t(e);
									}
								}), t);
							} catch (e) {
								return t(e);
							}
						}), t);
					} catch (e) {
						return t(e);
					}
				}), t);
			} catch (e) {
				return t(e);
			}
		}), t);
	}));
}
function getExifOrientation(e) {
	return new Promise(((t, r) => {
		const i = new CustomFileReader();
		i.onload = (e) => {
			const r = new DataView(e.target.result);
			if (65496 != r.getUint16(0, !1)) return t(-2);
			const i = r.byteLength;
			let o = 2;
			for (; o < i;) {
				if (r.getUint16(o + 2, !1) <= 8) return t(-1);
				const e = r.getUint16(o, !1);
				if (o += 2, 65505 == e) {
					if (1165519206 != r.getUint32(o += 2, !1)) return t(-1);
					const e = 18761 == r.getUint16(o += 6, !1);
					o += r.getUint32(o + 4, e);
					const i = r.getUint16(o, e);
					o += 2;
					for (let a = 0; a < i; a++) if (274 == r.getUint16(o + 12 * a, e)) return t(r.getUint16(o + 12 * a + 8, e));
				} else {
					if (65280 != (65280 & e)) break;
					o += r.getUint16(o, !1);
				}
			}
			return t(-1);
		}, i.onerror = (e) => r(e), i.readAsArrayBuffer(e);
	}));
}
function handleMaxWidthOrHeight(e, t) {
	const { width: r } = e, { height: i } = e, { maxWidthOrHeight: o } = t;
	let a, s = e;
	return isFinite(o) && (r > o || i > o) && ([s, a] = getNewCanvasAndCtx(r, i), r > i ? (s.width = o, s.height = i / r * o) : (s.width = r / i * o, s.height = o), a.drawImage(e, 0, 0, s.width, s.height), cleanupCanvasMemory(e)), s;
}
function followExifOrientation(e, t) {
	const { width: r } = e, { height: i } = e, [o, a] = getNewCanvasAndCtx(r, i);
	switch (t > 4 && t < 9 ? (o.width = i, o.height = r) : (o.width = r, o.height = i), t) {
		case 2:
			a.transform(-1, 0, 0, 1, r, 0);
			break;
		case 3:
			a.transform(-1, 0, 0, -1, r, i);
			break;
		case 4:
			a.transform(1, 0, 0, -1, 0, i);
			break;
		case 5:
			a.transform(0, 1, 1, 0, 0, 0);
			break;
		case 6:
			a.transform(0, 1, -1, 0, i, 0);
			break;
		case 7:
			a.transform(0, -1, -1, 0, i, r);
			break;
		case 8: a.transform(0, -1, 1, 0, 0, r);
	}
	return a.drawImage(e, 0, 0, r, i), cleanupCanvasMemory(e), o;
}
function compress(e, t, r = 0) {
	return new Promise((function(i, o) {
		let a, s, f, l, c, u, h, d, A, g, p, m, w, v, b, y, E, F, _, B;
		function incProgress(e = 5) {
			if (t.signal && t.signal.aborted) throw t.signal.reason;
			a += e, t.onProgress(Math.min(a, 100));
		}
		function setProgress(e) {
			if (t.signal && t.signal.aborted) throw t.signal.reason;
			a = Math.min(Math.max(e, a), 100), t.onProgress(a);
		}
		return a = r, s = t.maxIteration || 10, f = 1024 * t.maxSizeMB * 1024, incProgress(), drawFileInCanvas(e, t).then(function(r) {
			try {
				return [, l] = r, incProgress(), c = handleMaxWidthOrHeight(l, t), incProgress(), new Promise((function(r, i) {
					var o;
					if (!(o = t.exifOrientation)) return getExifOrientation(e).then(function(e) {
						try {
							return o = e, $If_2.call(this);
						} catch (e) {
							return i(e);
						}
					}.bind(this), i);
					function $If_2() {
						return r(o);
					}
					return $If_2.call(this);
				})).then(function(r) {
					try {
						return u = r, incProgress(), isAutoOrientationInBrowser().then(function(r) {
							try {
								return h = r ? c : followExifOrientation(c, u), incProgress(), d = t.initialQuality || 1, A = t.fileType || e.type, canvasToFile(h, A, e.name, e.lastModified, d).then(function(r) {
									try {
										{
											if (g = r, incProgress(), p = g.size > f, m = g.size > e.size, !p && !m) return setProgress(100), i(g);
											var a;
											function $Loop_3() {
												if (s-- && (b > f || b > w)) {
													let t, r;
													return t = B ? .95 * _.width : _.width, r = B ? .95 * _.height : _.height, [E, F] = getNewCanvasAndCtx(t, r), F.drawImage(_, 0, 0, t, r), d *= "image/png" === A ? .85 : .95, canvasToFile(E, A, e.name, e.lastModified, d).then((function(e) {
														try {
															return y = e, cleanupCanvasMemory(_), _ = E, b = y.size, setProgress(Math.min(99, Math.floor((v - b) / (v - f) * 100))), $Loop_3;
														} catch (e) {
															return o(e);
														}
													}), o);
												}
												return [1];
											}
											return w = e.size, v = g.size, b = v, _ = h, B = !t.alwaysKeepResolution && p, (a = function(e) {
												for (; e;) {
													if (e.then) return void e.then(a, o);
													try {
														if (e.pop) {
															if (e.length) return e.pop() ? $Loop_3_exit.call(this) : e;
															e = $Loop_3;
														} else e = e.call(this);
													} catch (e) {
														return o(e);
													}
												}
											}.bind(this))($Loop_3);
											function $Loop_3_exit() {
												return cleanupCanvasMemory(_), cleanupCanvasMemory(E), cleanupCanvasMemory(c), cleanupCanvasMemory(h), cleanupCanvasMemory(l), setProgress(100), i(y);
											}
										}
									} catch (u) {
										return o(u);
									}
								}.bind(this), o);
							} catch (e) {
								return o(e);
							}
						}.bind(this), o);
					} catch (e) {
						return o(e);
					}
				}.bind(this), o);
			} catch (e) {
				return o(e);
			}
		}.bind(this), o);
	}));
}
var l = "\nlet scriptImported = false\nself.addEventListener('message', async (e) => {\n  const { file, id, imageCompressionLibUrl, options } = e.data\n  options.onProgress = (progress) => self.postMessage({ progress, id })\n  try {\n    if (!scriptImported) {\n      // console.log('[worker] importScripts', imageCompressionLibUrl)\n      self.importScripts(imageCompressionLibUrl)\n      scriptImported = true\n    }\n    // console.log('[worker] self', self)\n    const compressedFile = await imageCompression(file, options)\n    self.postMessage({ file: compressedFile, id })\n  } catch (e) {\n    // console.error('[worker] error', e)\n    self.postMessage({ error: e.message + '\\n' + e.stack, id })\n  }\n})\n";
var c;
function compressOnWebWorker(e, t) {
	return new Promise(((r, i) => {
		c || (c = function createWorkerScriptURL(e) {
			const t = [];
			return "function" == typeof e ? t.push(`(${e})()`) : t.push(e), URL.createObjectURL(new Blob(t));
		}(l));
		const o = new Worker(c);
		o.addEventListener("message", (function handler(e) {
			if (t.signal && t.signal.aborted) o.terminate();
			else if (void 0 === e.data.progress) {
				if (e.data.error) return i(new Error(e.data.error)), void o.terminate();
				r(e.data.file), o.terminate();
			} else t.onProgress(e.data.progress);
		})), o.addEventListener("error", i), t.signal && t.signal.addEventListener("abort", (() => {
			i(t.signal.reason), o.terminate();
		})), o.postMessage({
			file: e,
			imageCompressionLibUrl: t.libURL,
			options: {
				...t,
				onProgress: void 0,
				signal: void 0
			}
		});
	}));
}
function imageCompression(e, t) {
	return new Promise((function(r, i) {
		let o, a, s, f, l, c;
		if (o = { ...t }, s = 0, {onProgress: f} = o, o.maxSizeMB = o.maxSizeMB || Number.POSITIVE_INFINITY, l = "boolean" != typeof o.useWebWorker || o.useWebWorker, delete o.useWebWorker, o.onProgress = (e) => {
			s = e, "function" == typeof f && f(s);
		}, !(e instanceof Blob || e instanceof CustomFile)) return i(/* @__PURE__ */ new Error("The file given is not an instance of Blob or File"));
		if (!/^image/.test(e.type)) return i(/* @__PURE__ */ new Error("The file given is not an image"));
		if (c = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope, !l || "function" != typeof Worker || c) return compress(e, o).then(function(e) {
			try {
				return a = e, $If_4.call(this);
			} catch (e) {
				return i(e);
			}
		}.bind(this), i);
		var u = function() {
			try {
				return $If_4.call(this);
			} catch (e) {
				return i(e);
			}
		}.bind(this), $Try_1_Catch = function(t) {
			try {
				return compress(e, o).then((function(e) {
					try {
						return a = e, u();
					} catch (e) {
						return i(e);
					}
				}), i);
			} catch (e) {
				return i(e);
			}
		};
		try {
			return o.libURL = o.libURL || "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js", compressOnWebWorker(e, o).then((function(e) {
				try {
					return a = e, u();
				} catch (e) {
					return $Try_1_Catch();
				}
			}), $Try_1_Catch);
		} catch (e) {
			$Try_1_Catch();
		}
		function $If_4() {
			try {
				a.name = e.name, a.lastModified = e.lastModified;
			} catch (e) {}
			try {
				o.preserveExif && "image/jpeg" === e.type && (!o.fileType || o.fileType && o.fileType === e.type) && (a = copyExifWithoutOrientation(e, a));
			} catch (e) {}
			return r(a);
		}
	}));
}
imageCompression.getDataUrlFromFile = getDataUrlFromFile, imageCompression.getFilefromDataUrl = getFilefromDataUrl, imageCompression.loadImage = loadImage, imageCompression.drawImageInCanvas = drawImageInCanvas, imageCompression.drawFileInCanvas = drawFileInCanvas, imageCompression.canvasToFile = canvasToFile, imageCompression.getExifOrientation = getExifOrientation, imageCompression.handleMaxWidthOrHeight = handleMaxWidthOrHeight, imageCompression.followExifOrientation = followExifOrientation, imageCompression.cleanupCanvasMemory = cleanupCanvasMemory, imageCompression.isAutoOrientationInBrowser = isAutoOrientationInBrowser, imageCompression.approximateBelowMaximumCanvasSizeOfBrowser = approximateBelowMaximumCanvasSizeOfBrowser, imageCompression.copyExifWithoutOrientation = copyExifWithoutOrientation, imageCompression.getBrowserName = getBrowserName, imageCompression.version = "2.0.2";
//#endregion
//#region node_modules/spark-md5/spark-md5.js
var require_spark_md5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(factory) {
		if (typeof exports === "object") module.exports = factory();
		else if (typeof define === "function" && define.amd) define(factory);
		else {
			var glob;
			try {
				glob = window;
			} catch (e) {
				glob = self;
			}
			glob.SparkMD5 = factory();
		}
	})(function(undefined) {
		"use strict";
		var hex_chr = [
			"0",
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"a",
			"b",
			"c",
			"d",
			"e",
			"f"
		];
		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];
			a += (b & c | ~b & d) + k[0] - 680876936 | 0;
			a = (a << 7 | a >>> 25) + b | 0;
			d += (a & b | ~a & c) + k[1] - 389564586 | 0;
			d = (d << 12 | d >>> 20) + a | 0;
			c += (d & a | ~d & b) + k[2] + 606105819 | 0;
			c = (c << 17 | c >>> 15) + d | 0;
			b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
			b = (b << 22 | b >>> 10) + c | 0;
			a += (b & c | ~b & d) + k[4] - 176418897 | 0;
			a = (a << 7 | a >>> 25) + b | 0;
			d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
			d = (d << 12 | d >>> 20) + a | 0;
			c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
			c = (c << 17 | c >>> 15) + d | 0;
			b += (c & d | ~c & a) + k[7] - 45705983 | 0;
			b = (b << 22 | b >>> 10) + c | 0;
			a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
			a = (a << 7 | a >>> 25) + b | 0;
			d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
			d = (d << 12 | d >>> 20) + a | 0;
			c += (d & a | ~d & b) + k[10] - 42063 | 0;
			c = (c << 17 | c >>> 15) + d | 0;
			b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
			b = (b << 22 | b >>> 10) + c | 0;
			a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
			a = (a << 7 | a >>> 25) + b | 0;
			d += (a & b | ~a & c) + k[13] - 40341101 | 0;
			d = (d << 12 | d >>> 20) + a | 0;
			c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
			c = (c << 17 | c >>> 15) + d | 0;
			b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
			b = (b << 22 | b >>> 10) + c | 0;
			a += (b & d | c & ~d) + k[1] - 165796510 | 0;
			a = (a << 5 | a >>> 27) + b | 0;
			d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
			d = (d << 9 | d >>> 23) + a | 0;
			c += (d & b | a & ~b) + k[11] + 643717713 | 0;
			c = (c << 14 | c >>> 18) + d | 0;
			b += (c & a | d & ~a) + k[0] - 373897302 | 0;
			b = (b << 20 | b >>> 12) + c | 0;
			a += (b & d | c & ~d) + k[5] - 701558691 | 0;
			a = (a << 5 | a >>> 27) + b | 0;
			d += (a & c | b & ~c) + k[10] + 38016083 | 0;
			d = (d << 9 | d >>> 23) + a | 0;
			c += (d & b | a & ~b) + k[15] - 660478335 | 0;
			c = (c << 14 | c >>> 18) + d | 0;
			b += (c & a | d & ~a) + k[4] - 405537848 | 0;
			b = (b << 20 | b >>> 12) + c | 0;
			a += (b & d | c & ~d) + k[9] + 568446438 | 0;
			a = (a << 5 | a >>> 27) + b | 0;
			d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
			d = (d << 9 | d >>> 23) + a | 0;
			c += (d & b | a & ~b) + k[3] - 187363961 | 0;
			c = (c << 14 | c >>> 18) + d | 0;
			b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
			b = (b << 20 | b >>> 12) + c | 0;
			a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
			a = (a << 5 | a >>> 27) + b | 0;
			d += (a & c | b & ~c) + k[2] - 51403784 | 0;
			d = (d << 9 | d >>> 23) + a | 0;
			c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
			c = (c << 14 | c >>> 18) + d | 0;
			b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
			b = (b << 20 | b >>> 12) + c | 0;
			a += (b ^ c ^ d) + k[5] - 378558 | 0;
			a = (a << 4 | a >>> 28) + b | 0;
			d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
			d = (d << 11 | d >>> 21) + a | 0;
			c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
			c = (c << 16 | c >>> 16) + d | 0;
			b += (c ^ d ^ a) + k[14] - 35309556 | 0;
			b = (b << 23 | b >>> 9) + c | 0;
			a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
			a = (a << 4 | a >>> 28) + b | 0;
			d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
			d = (d << 11 | d >>> 21) + a | 0;
			c += (d ^ a ^ b) + k[7] - 155497632 | 0;
			c = (c << 16 | c >>> 16) + d | 0;
			b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
			b = (b << 23 | b >>> 9) + c | 0;
			a += (b ^ c ^ d) + k[13] + 681279174 | 0;
			a = (a << 4 | a >>> 28) + b | 0;
			d += (a ^ b ^ c) + k[0] - 358537222 | 0;
			d = (d << 11 | d >>> 21) + a | 0;
			c += (d ^ a ^ b) + k[3] - 722521979 | 0;
			c = (c << 16 | c >>> 16) + d | 0;
			b += (c ^ d ^ a) + k[6] + 76029189 | 0;
			b = (b << 23 | b >>> 9) + c | 0;
			a += (b ^ c ^ d) + k[9] - 640364487 | 0;
			a = (a << 4 | a >>> 28) + b | 0;
			d += (a ^ b ^ c) + k[12] - 421815835 | 0;
			d = (d << 11 | d >>> 21) + a | 0;
			c += (d ^ a ^ b) + k[15] + 530742520 | 0;
			c = (c << 16 | c >>> 16) + d | 0;
			b += (c ^ d ^ a) + k[2] - 995338651 | 0;
			b = (b << 23 | b >>> 9) + c | 0;
			a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
			a = (a << 6 | a >>> 26) + b | 0;
			d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
			d = (d << 10 | d >>> 22) + a | 0;
			c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
			c = (c << 15 | c >>> 17) + d | 0;
			b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
			b = (b << 21 | b >>> 11) + c | 0;
			a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
			a = (a << 6 | a >>> 26) + b | 0;
			d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
			d = (d << 10 | d >>> 22) + a | 0;
			c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
			c = (c << 15 | c >>> 17) + d | 0;
			b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
			b = (b << 21 | b >>> 11) + c | 0;
			a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
			a = (a << 6 | a >>> 26) + b | 0;
			d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
			d = (d << 10 | d >>> 22) + a | 0;
			c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
			c = (c << 15 | c >>> 17) + d | 0;
			b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
			b = (b << 21 | b >>> 11) + c | 0;
			a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
			a = (a << 6 | a >>> 26) + b | 0;
			d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
			d = (d << 10 | d >>> 22) + a | 0;
			c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
			c = (c << 15 | c >>> 17) + d | 0;
			b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
			b = (b << 21 | b >>> 11) + c | 0;
			x[0] = a + x[0] | 0;
			x[1] = b + x[1] | 0;
			x[2] = c + x[2] | 0;
			x[3] = d + x[3] | 0;
		}
		function md5blk(s) {
			var md5blks = [], i;
			for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
			return md5blks;
		}
		function md5blk_array(a) {
			var md5blks = [], i;
			for (i = 0; i < 64; i += 4) md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
			return md5blks;
		}
		function md51(s) {
			var n = s.length, state = [
				1732584193,
				-271733879,
				-1732584194,
				271733878
			], i, length, tail, tmp, lo, hi;
			for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
			s = s.substring(i - 64);
			length = s.length;
			tail = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (i = 0; i < length; i += 1) tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
			tail[i >> 2] |= 128 << (i % 4 << 3);
			if (i > 55) {
				md5cycle(state, tail);
				for (i = 0; i < 16; i += 1) tail[i] = 0;
			}
			tmp = n * 8;
			tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
			lo = parseInt(tmp[2], 16);
			hi = parseInt(tmp[1], 16) || 0;
			tail[14] = lo;
			tail[15] = hi;
			md5cycle(state, tail);
			return state;
		}
		function md51_array(a) {
			var n = a.length, state = [
				1732584193,
				-271733879,
				-1732584194,
				271733878
			], i, length, tail, tmp, lo, hi;
			for (i = 64; i <= n; i += 64) md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
			a = i - 64 < n ? a.subarray(i - 64) : new Uint8Array(0);
			length = a.length;
			tail = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (i = 0; i < length; i += 1) tail[i >> 2] |= a[i] << (i % 4 << 3);
			tail[i >> 2] |= 128 << (i % 4 << 3);
			if (i > 55) {
				md5cycle(state, tail);
				for (i = 0; i < 16; i += 1) tail[i] = 0;
			}
			tmp = n * 8;
			tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
			lo = parseInt(tmp[2], 16);
			hi = parseInt(tmp[1], 16) || 0;
			tail[14] = lo;
			tail[15] = hi;
			md5cycle(state, tail);
			return state;
		}
		function rhex(n) {
			var s = "", j;
			for (j = 0; j < 4; j += 1) s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
			return s;
		}
		function hex(x) {
			var i;
			for (i = 0; i < x.length; i += 1) x[i] = rhex(x[i]);
			return x.join("");
		}
		if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592");
		/**
		* ArrayBuffer slice polyfill.
		*
		* @see https://github.com/ttaubert/node-arraybuffer-slice
		*/
		if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) (function() {
			function clamp(val, length) {
				val = val | 0 || 0;
				if (val < 0) return Math.max(val + length, 0);
				return Math.min(val, length);
			}
			ArrayBuffer.prototype.slice = function(from, to) {
				var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
				if (to !== undefined) end = clamp(to, length);
				if (begin > end) return /* @__PURE__ */ new ArrayBuffer(0);
				num = end - begin;
				target = new ArrayBuffer(num);
				targetArray = new Uint8Array(target);
				sourceArray = new Uint8Array(this, begin, num);
				targetArray.set(sourceArray);
				return target;
			};
		})();
		/**
		* Helpers.
		*/
		function toUtf8(str) {
			if (/[\u0080-\uFFFF]/.test(str)) str = unescape(encodeURIComponent(str));
			return str;
		}
		function utf8Str2ArrayBuffer(str, returnUInt8Array) {
			var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i;
			for (i = 0; i < length; i += 1) arr[i] = str.charCodeAt(i);
			return returnUInt8Array ? arr : buff;
		}
		function arrayBuffer2Utf8Str(buff) {
			return String.fromCharCode.apply(null, new Uint8Array(buff));
		}
		function concatenateArrayBuffers(first, second, returnUInt8Array) {
			var result = new Uint8Array(first.byteLength + second.byteLength);
			result.set(new Uint8Array(first));
			result.set(new Uint8Array(second), first.byteLength);
			return returnUInt8Array ? result : result.buffer;
		}
		function hexToBinaryString(hex) {
			var bytes = [], length = hex.length, x;
			for (x = 0; x < length - 1; x += 2) bytes.push(parseInt(hex.substr(x, 2), 16));
			return String.fromCharCode.apply(String, bytes);
		}
		/**
		* SparkMD5 OOP implementation.
		*
		* Use this class to perform an incremental md5, otherwise use the
		* static methods instead.
		*/
		function SparkMD5() {
			this.reset();
		}
		/**
		* Appends a string.
		* A conversion will be applied if an utf8 string is detected.
		*
		* @param {String} str The string to be appended
		*
		* @return {SparkMD5} The instance itself
		*/
		SparkMD5.prototype.append = function(str) {
			this.appendBinary(toUtf8(str));
			return this;
		};
		/**
		* Appends a binary string.
		*
		* @param {String} contents The binary string to be appended
		*
		* @return {SparkMD5} The instance itself
		*/
		SparkMD5.prototype.appendBinary = function(contents) {
			this._buff += contents;
			this._length += contents.length;
			var length = this._buff.length, i;
			for (i = 64; i <= length; i += 64) md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
			this._buff = this._buff.substring(i - 64);
			return this;
		};
		/**
		* Finishes the incremental computation, reseting the internal state and
		* returning the result.
		*
		* @param {Boolean} raw True to get the raw string, false to get the hex string
		*
		* @return {String} The result
		*/
		SparkMD5.prototype.end = function(raw) {
			var buff = this._buff, length = buff.length, i, tail = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			], ret;
			for (i = 0; i < length; i += 1) tail[i >> 2] |= buff.charCodeAt(i) << (i % 4 << 3);
			this._finish(tail, length);
			ret = hex(this._hash);
			if (raw) ret = hexToBinaryString(ret);
			this.reset();
			return ret;
		};
		/**
		* Resets the internal state of the computation.
		*
		* @return {SparkMD5} The instance itself
		*/
		SparkMD5.prototype.reset = function() {
			this._buff = "";
			this._length = 0;
			this._hash = [
				1732584193,
				-271733879,
				-1732584194,
				271733878
			];
			return this;
		};
		/**
		* Gets the internal state of the computation.
		*
		* @return {Object} The state
		*/
		SparkMD5.prototype.getState = function() {
			return {
				buff: this._buff,
				length: this._length,
				hash: this._hash.slice()
			};
		};
		/**
		* Gets the internal state of the computation.
		*
		* @param {Object} state The state
		*
		* @return {SparkMD5} The instance itself
		*/
		SparkMD5.prototype.setState = function(state) {
			this._buff = state.buff;
			this._length = state.length;
			this._hash = state.hash;
			return this;
		};
		/**
		* Releases memory used by the incremental buffer and other additional
		* resources. If you plan to use the instance again, use reset instead.
		*/
		SparkMD5.prototype.destroy = function() {
			delete this._hash;
			delete this._buff;
			delete this._length;
		};
		/**
		* Finish the final calculation based on the tail.
		*
		* @param {Array}  tail   The tail (will be modified)
		* @param {Number} length The length of the remaining buffer
		*/
		SparkMD5.prototype._finish = function(tail, length) {
			var i = length, tmp, lo, hi;
			tail[i >> 2] |= 128 << (i % 4 << 3);
			if (i > 55) {
				md5cycle(this._hash, tail);
				for (i = 0; i < 16; i += 1) tail[i] = 0;
			}
			tmp = this._length * 8;
			tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
			lo = parseInt(tmp[2], 16);
			hi = parseInt(tmp[1], 16) || 0;
			tail[14] = lo;
			tail[15] = hi;
			md5cycle(this._hash, tail);
		};
		/**
		* Performs the md5 hash on a string.
		* A conversion will be applied if utf8 string is detected.
		*
		* @param {String}  str The string
		* @param {Boolean} [raw] True to get the raw string, false to get the hex string
		*
		* @return {String} The result
		*/
		SparkMD5.hash = function(str, raw) {
			return SparkMD5.hashBinary(toUtf8(str), raw);
		};
		/**
		* Performs the md5 hash on a binary string.
		*
		* @param {String}  content The binary string
		* @param {Boolean} [raw]     True to get the raw string, false to get the hex string
		*
		* @return {String} The result
		*/
		SparkMD5.hashBinary = function(content, raw) {
			var ret = hex(md51(content));
			return raw ? hexToBinaryString(ret) : ret;
		};
		/**
		* SparkMD5 OOP implementation for array buffers.
		*
		* Use this class to perform an incremental md5 ONLY for array buffers.
		*/
		SparkMD5.ArrayBuffer = function() {
			this.reset();
		};
		/**
		* Appends an array buffer.
		*
		* @param {ArrayBuffer} arr The array to be appended
		*
		* @return {SparkMD5.ArrayBuffer} The instance itself
		*/
		SparkMD5.ArrayBuffer.prototype.append = function(arr) {
			var buff = concatenateArrayBuffers(this._buff.buffer, arr, true), length = buff.length, i;
			this._length += arr.byteLength;
			for (i = 64; i <= length; i += 64) md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
			this._buff = i - 64 < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);
			return this;
		};
		/**
		* Finishes the incremental computation, reseting the internal state and
		* returning the result.
		*
		* @param {Boolean} raw True to get the raw string, false to get the hex string
		*
		* @return {String} The result
		*/
		SparkMD5.ArrayBuffer.prototype.end = function(raw) {
			var buff = this._buff, length = buff.length, tail = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			], i, ret;
			for (i = 0; i < length; i += 1) tail[i >> 2] |= buff[i] << (i % 4 << 3);
			this._finish(tail, length);
			ret = hex(this._hash);
			if (raw) ret = hexToBinaryString(ret);
			this.reset();
			return ret;
		};
		/**
		* Resets the internal state of the computation.
		*
		* @return {SparkMD5.ArrayBuffer} The instance itself
		*/
		SparkMD5.ArrayBuffer.prototype.reset = function() {
			this._buff = new Uint8Array(0);
			this._length = 0;
			this._hash = [
				1732584193,
				-271733879,
				-1732584194,
				271733878
			];
			return this;
		};
		/**
		* Gets the internal state of the computation.
		*
		* @return {Object} The state
		*/
		SparkMD5.ArrayBuffer.prototype.getState = function() {
			var state = SparkMD5.prototype.getState.call(this);
			state.buff = arrayBuffer2Utf8Str(state.buff);
			return state;
		};
		/**
		* Gets the internal state of the computation.
		*
		* @param {Object} state The state
		*
		* @return {SparkMD5.ArrayBuffer} The instance itself
		*/
		SparkMD5.ArrayBuffer.prototype.setState = function(state) {
			state.buff = utf8Str2ArrayBuffer(state.buff, true);
			return SparkMD5.prototype.setState.call(this, state);
		};
		SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;
		SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;
		/**
		* Performs the md5 hash on an array buffer.
		*
		* @param {ArrayBuffer} arr The array buffer
		* @param {Boolean}     [raw] True to get the raw string, false to get the hex one
		*
		* @return {String} The result
		*/
		SparkMD5.ArrayBuffer.hash = function(arr, raw) {
			var ret = hex(md51_array(new Uint8Array(arr)));
			return raw ? hexToBinaryString(ret) : ret;
		};
		return SparkMD5;
	});
}));
//#endregion
//#region node_modules/motion-utils/dist/es/noop.mjs
var noop = /* @__NO_SIDE_EFFECTS__ */ (any) => any;
//#endregion
//#region node_modules/motion-utils/dist/es/errors.mjs
var warning = noop;
var invariant = noop;
//#endregion
//#region node_modules/motion-utils/dist/es/memo.mjs
/* @__NO_SIDE_EFFECTS__ */
function memo(callback) {
	let result;
	return () => {
		if (result === void 0) result = callback();
		return result;
	};
}
//#endregion
//#region node_modules/motion-utils/dist/es/progress.mjs
var progress = /* @__NO_SIDE_EFFECTS__ */ (from, to, value) => {
	const toFromDifference = to - from;
	return toFromDifference === 0 ? 1 : (value - from) / toFromDifference;
};
//#endregion
//#region node_modules/motion-utils/dist/es/time-conversion.mjs
/**
* Converts seconds to milliseconds
*
* @param seconds - Time in seconds.
* @return milliseconds - Converted time in milliseconds.
*/
var secondsToMilliseconds = /* @__NO_SIDE_EFFECTS__ */ (seconds) => seconds * 1e3;
var millisecondsToSeconds = /* @__NO_SIDE_EFFECTS__ */ (milliseconds) => milliseconds / 1e3;
//#endregion
//#region node_modules/motion-dom/dist/es/utils/supports/scroll-timeline.mjs
var supportsScrollTimeline = /* @__PURE__ */ memo(() => window.ScrollTimeline !== void 0);
//#endregion
//#region node_modules/motion-dom/dist/es/animation/controls/BaseGroup.mjs
var BaseGroupPlaybackControls = class {
	constructor(animations) {
		this.stop = () => this.runAll("stop");
		this.animations = animations.filter(Boolean);
	}
	get finished() {
		return Promise.all(this.animations.map((animation) => "finished" in animation ? animation.finished : animation));
	}
	/**
	* TODO: Filter out cancelled or stopped animations before returning
	*/
	getAll(propName) {
		return this.animations[0][propName];
	}
	setAll(propName, newValue) {
		for (let i = 0; i < this.animations.length; i++) this.animations[i][propName] = newValue;
	}
	attachTimeline(timeline, fallback) {
		const subscriptions = this.animations.map((animation) => {
			if (supportsScrollTimeline() && animation.attachTimeline) return animation.attachTimeline(timeline);
			else if (typeof fallback === "function") return fallback(animation);
		});
		return () => {
			subscriptions.forEach((cancel, i) => {
				cancel && cancel();
				this.animations[i].stop();
			});
		};
	}
	get time() {
		return this.getAll("time");
	}
	set time(time) {
		this.setAll("time", time);
	}
	get speed() {
		return this.getAll("speed");
	}
	set speed(speed) {
		this.setAll("speed", speed);
	}
	get startTime() {
		return this.getAll("startTime");
	}
	get duration() {
		let max = 0;
		for (let i = 0; i < this.animations.length; i++) max = Math.max(max, this.animations[i].duration);
		return max;
	}
	runAll(methodName) {
		this.animations.forEach((controls) => controls[methodName]());
	}
	flatten() {
		this.runAll("flatten");
	}
	play() {
		this.runAll("play");
	}
	pause() {
		this.runAll("pause");
	}
	cancel() {
		this.runAll("cancel");
	}
	complete() {
		this.runAll("complete");
	}
};
//#endregion
//#region node_modules/motion-dom/dist/es/animation/controls/Group.mjs
/**
* TODO: This is a temporary class to support the legacy
* thennable API
*/
var GroupPlaybackControls = class extends BaseGroupPlaybackControls {
	then(onResolve, onReject) {
		return Promise.all(this.animations).then(onResolve).catch(onReject);
	}
};
//#endregion
//#region node_modules/motion-dom/dist/es/animation/utils/get-value-transition.mjs
function getValueTransition(transition, key) {
	return transition ? transition[key] || transition["default"] || transition : void 0;
}
//#endregion
//#region node_modules/motion-dom/dist/es/animation/generators/utils/calc-duration.mjs
/**
* Implement a practical max duration for keyframe generation
* to prevent infinite loops
*/
var maxGeneratorDuration = 2e4;
function calcGeneratorDuration(generator) {
	let duration = 0;
	const timeStep = 50;
	let state = generator.next(duration);
	while (!state.done && duration < 2e4) {
		duration += timeStep;
		state = generator.next(duration);
	}
	return duration >= 2e4 ? Infinity : duration;
}
//#endregion
//#region node_modules/motion-dom/dist/es/animation/generators/utils/is-generator.mjs
function isGenerator(type) {
	return typeof type === "function";
}
//#endregion
//#region node_modules/motion-dom/dist/es/animation/waapi/utils/attach-timeline.mjs
function attachTimeline(animation, timeline) {
	animation.timeline = timeline;
	animation.onfinish = null;
}
//#endregion
//#region node_modules/motion-dom/dist/es/utils/is-bezier-definition.mjs
var isBezierDefinition = (easing) => Array.isArray(easing) && typeof easing[0] === "number";
//#endregion
//#region node_modules/motion-dom/dist/es/utils/supports/flags.mjs
/**
* Add the ability for test suites to manually set support flags
* to better test more environments.
*/
var supportsFlags = { linearEasing: void 0 };
//#endregion
//#region node_modules/motion-dom/dist/es/utils/supports/memo.mjs
function memoSupports(callback, supportsFlag) {
	const memoized = /* @__PURE__ */ memo(callback);
	return () => {
		var _a;
		return (_a = supportsFlags[supportsFlag]) !== null && _a !== void 0 ? _a : memoized();
	};
}
//#endregion
//#region node_modules/motion-dom/dist/es/utils/supports/linear-easing.mjs
var supportsLinearEasing = /* @__PURE__ */ memoSupports(() => {
	try {
		document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
	} catch (e) {
		return false;
	}
	return true;
}, "linearEasing");
//#endregion
//#region node_modules/motion-dom/dist/es/animation/waapi/utils/linear.mjs
var generateLinearEasing = (easing, duration, resolution = 10) => {
	let points = "";
	const numPoints = Math.max(Math.round(duration / resolution), 2);
	for (let i = 0; i < numPoints; i++) points += easing(/* @__PURE__ */ progress(0, numPoints - 1, i)) + ", ";
	return `linear(${points.substring(0, points.length - 2)})`;
};
//#endregion
//#region node_modules/motion-dom/dist/es/animation/waapi/utils/easing.mjs
function isWaapiSupportedEasing(easing) {
	return Boolean(typeof easing === "function" && supportsLinearEasing() || !easing || typeof easing === "string" && (easing in supportedWaapiEasing || supportsLinearEasing()) || isBezierDefinition(easing) || Array.isArray(easing) && easing.every(isWaapiSupportedEasing));
}
var cubicBezierAsString = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
var supportedWaapiEasing = {
	linear: "linear",
	ease: "ease",
	easeIn: "ease-in",
	easeOut: "ease-out",
	easeInOut: "ease-in-out",
	circIn: /* @__PURE__ */ cubicBezierAsString([
		0,
		.65,
		.55,
		1
	]),
	circOut: /* @__PURE__ */ cubicBezierAsString([
		.55,
		0,
		1,
		.45
	]),
	backIn: /* @__PURE__ */ cubicBezierAsString([
		.31,
		.01,
		.66,
		-.59
	]),
	backOut: /* @__PURE__ */ cubicBezierAsString([
		.33,
		1.53,
		.69,
		.99
	])
};
function mapEasingToNativeEasing(easing, duration) {
	if (!easing) return;
	else if (typeof easing === "function" && supportsLinearEasing()) return generateLinearEasing(easing, duration);
	else if (isBezierDefinition(easing)) return cubicBezierAsString(easing);
	else if (Array.isArray(easing)) return easing.map((segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) || supportedWaapiEasing.easeOut);
	else return supportedWaapiEasing[easing];
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/drag/state/is-active.mjs
var isDragging = {
	x: false,
	y: false
};
function isDragActive() {
	return isDragging.x || isDragging.y;
}
//#endregion
//#region node_modules/motion-dom/dist/es/utils/resolve-elements.mjs
function resolveElements(elementOrSelector, scope, selectorCache) {
	var _a;
	if (elementOrSelector instanceof Element) return [elementOrSelector];
	else if (typeof elementOrSelector === "string") {
		let root = document;
		if (scope) root = scope.current;
		const elements = (_a = selectorCache === null || selectorCache === void 0 ? void 0 : selectorCache[elementOrSelector]) !== null && _a !== void 0 ? _a : root.querySelectorAll(elementOrSelector);
		return elements ? Array.from(elements) : [];
	}
	return Array.from(elementOrSelector);
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/utils/setup.mjs
function setupGesture(elementOrSelector, options) {
	const elements = resolveElements(elementOrSelector);
	const gestureAbortController = new AbortController();
	const eventOptions = {
		passive: true,
		...options,
		signal: gestureAbortController.signal
	};
	const cancel = () => gestureAbortController.abort();
	return [
		elements,
		eventOptions,
		cancel
	];
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/hover.mjs
/**
* Filter out events that are not pointer events, or are triggering
* while a Motion gesture is active.
*/
function filterEvents$1(callback) {
	return (event) => {
		if (event.pointerType === "touch" || isDragActive()) return;
		callback(event);
	};
}
/**
* Create a hover gesture. hover() is different to .addEventListener("pointerenter")
* in that it has an easier syntax, filters out polyfilled touch events, interoperates
* with drag gestures, and automatically removes the "pointerennd" event listener when the hover ends.
*
* @public
*/
function hover(elementOrSelector, onHoverStart, options = {}) {
	const [elements, eventOptions, cancel] = setupGesture(elementOrSelector, options);
	const onPointerEnter = filterEvents$1((enterEvent) => {
		const { target } = enterEvent;
		const onHoverEnd = onHoverStart(enterEvent);
		if (typeof onHoverEnd !== "function" || !target) return;
		const onPointerLeave = filterEvents$1((leaveEvent) => {
			onHoverEnd(leaveEvent);
			target.removeEventListener("pointerleave", onPointerLeave);
		});
		target.addEventListener("pointerleave", onPointerLeave, eventOptions);
	});
	elements.forEach((element) => {
		element.addEventListener("pointerenter", onPointerEnter, eventOptions);
	});
	return cancel;
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/utils/is-node-or-child.mjs
/**
* Recursively traverse up the tree to check whether the provided child node
* is the parent or a descendant of it.
*
* @param parent - Element to find
* @param child - Element to test against parent
*/
var isNodeOrChild = (parent, child) => {
	if (!child) return false;
	else if (parent === child) return true;
	else return isNodeOrChild(parent, child.parentElement);
};
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/utils/is-primary-pointer.mjs
var isPrimaryPointer = (event) => {
	if (event.pointerType === "mouse") return typeof event.button !== "number" || event.button <= 0;
	else
 /**
	* isPrimary is true for all mice buttons, whereas every touch point
	* is regarded as its own input. So subsequent concurrent touch points
	* will be false.
	*
	* Specifically match against false here as incomplete versions of
	* PointerEvents in very old browser might have it set as undefined.
	*/
	return event.isPrimary !== false;
};
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/press/utils/is-keyboard-accessible.mjs
var focusableElements = new Set([
	"BUTTON",
	"INPUT",
	"SELECT",
	"TEXTAREA",
	"A"
]);
function isElementKeyboardAccessible(element) {
	return focusableElements.has(element.tagName) || element.tabIndex !== -1;
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/press/utils/state.mjs
var isPressing = /* @__PURE__ */ new WeakSet();
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/press/utils/keyboard.mjs
/**
* Filter out events that are not "Enter" keys.
*/
function filterEvents(callback) {
	return (event) => {
		if (event.key !== "Enter") return;
		callback(event);
	};
}
function firePointerEvent(target, type) {
	target.dispatchEvent(new PointerEvent("pointer" + type, {
		isPrimary: true,
		bubbles: true
	}));
}
var enableKeyboardPress = (focusEvent, eventOptions) => {
	const element = focusEvent.currentTarget;
	if (!element) return;
	const handleKeydown = filterEvents(() => {
		if (isPressing.has(element)) return;
		firePointerEvent(element, "down");
		const handleKeyup = filterEvents(() => {
			firePointerEvent(element, "up");
		});
		const handleBlur = () => firePointerEvent(element, "cancel");
		element.addEventListener("keyup", handleKeyup, eventOptions);
		element.addEventListener("blur", handleBlur, eventOptions);
	});
	element.addEventListener("keydown", handleKeydown, eventOptions);
	/**
	* Add an event listener that fires on blur to remove the keydown events.
	*/
	element.addEventListener("blur", () => element.removeEventListener("keydown", handleKeydown), eventOptions);
};
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/press/index.mjs
/**
* Filter out events that are not primary pointer events, or are triggering
* while a Motion gesture is active.
*/
function isValidPressEvent(event) {
	return isPrimaryPointer(event) && !isDragActive();
}
/**
* Create a press gesture.
*
* Press is different to `"pointerdown"`, `"pointerup"` in that it
* automatically filters out secondary pointer events like right
* click and multitouch.
*
* It also adds accessibility support for keyboards, where
* an element with a press gesture will receive focus and
*  trigger on Enter `"keydown"` and `"keyup"` events.
*
* This is different to a browser's `"click"` event, which does
* respond to keyboards but only for the `"click"` itself, rather
* than the press start and end/cancel. The element also needs
* to be focusable for this to work, whereas a press gesture will
* make an element focusable by default.
*
* @public
*/
function press(elementOrSelector, onPressStart, options = {}) {
	const [elements, eventOptions, cancelEvents] = setupGesture(elementOrSelector, options);
	const startPress = (startEvent) => {
		const element = startEvent.currentTarget;
		if (!isValidPressEvent(startEvent) || isPressing.has(element)) return;
		isPressing.add(element);
		const onPressEnd = onPressStart(startEvent);
		const onPointerEnd = (endEvent, success) => {
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerCancel);
			if (!isValidPressEvent(endEvent) || !isPressing.has(element)) return;
			isPressing.delete(element);
			if (typeof onPressEnd === "function") onPressEnd(endEvent, { success });
		};
		const onPointerUp = (upEvent) => {
			onPointerEnd(upEvent, options.useGlobalTarget || isNodeOrChild(element, upEvent.target));
		};
		const onPointerCancel = (cancelEvent) => {
			onPointerEnd(cancelEvent, false);
		};
		window.addEventListener("pointerup", onPointerUp, eventOptions);
		window.addEventListener("pointercancel", onPointerCancel, eventOptions);
	};
	elements.forEach((element) => {
		if (!isElementKeyboardAccessible(element) && element.getAttribute("tabindex") === null) element.tabIndex = 0;
		(options.useGlobalTarget ? window : element).addEventListener("pointerdown", startPress, eventOptions);
		element.addEventListener("focus", (event) => enableKeyboardPress(event, eventOptions), eventOptions);
	});
	return cancelEvents;
}
//#endregion
//#region node_modules/motion-dom/dist/es/gestures/drag/state/set-active.mjs
function setDragLock(axis) {
	if (axis === "x" || axis === "y") if (isDragging[axis]) return null;
	else {
		isDragging[axis] = true;
		return () => {
			isDragging[axis] = false;
		};
	}
	else if (isDragging.x || isDragging.y) return null;
	else {
		isDragging.x = isDragging.y = true;
		return () => {
			isDragging.x = isDragging.y = false;
		};
	}
}
//#endregion
//#region node_modules/dompurify/dist/purify.es.mjs
/*! @license DOMPurify 3.4.2 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.2/LICENSE */
var { entries, setPrototypeOf, isFrozen, getPrototypeOf, getOwnPropertyDescriptor } = Object;
var { freeze, seal, create } = Object;
var { apply, construct } = typeof Reflect !== "undefined" && Reflect;
if (!freeze) freeze = function freeze(x) {
	return x;
};
if (!seal) seal = function seal(x) {
	return x;
};
if (!apply) apply = function apply(func, thisArg) {
	for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
	return func.apply(thisArg, args);
};
if (!construct) construct = function construct(Func) {
	for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
	return new Func(...args);
};
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var arrayIsArray = Array.isArray;
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var numberToString = unapply(Number.prototype.toString);
var booleanToString = unapply(Boolean.prototype.toString);
var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var objectToString = unapply(Object.prototype.toString);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
/**
* Creates a new function that calls the given function with a specified thisArg and arguments.
*
* @param func - The function to be wrapped and called.
* @returns A new function that calls the given function with a specified thisArg and arguments.
*/
function unapply(func) {
	return function(thisArg) {
		if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
		for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
		return apply(func, thisArg, args);
	};
}
/**
* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
*
* @param func - The constructor function to be wrapped and called.
* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
*/
function unconstruct(Func) {
	return function() {
		for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
		return construct(Func, args);
	};
}
/**
* Add properties to a lookup table
*
* @param set - The set to which elements will be added.
* @param array - The array containing elements to be added to the set.
* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
* @returns The modified set with added elements.
*/
function addToSet(set, array) {
	let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
	if (setPrototypeOf) setPrototypeOf(set, null);
	if (!arrayIsArray(array)) return set;
	let l = array.length;
	while (l--) {
		let element = array[l];
		if (typeof element === "string") {
			const lcElement = transformCaseFunc(element);
			if (lcElement !== element) {
				if (!isFrozen(array)) array[l] = lcElement;
				element = lcElement;
			}
		}
		set[element] = true;
	}
	return set;
}
/**
* Clean up an array to harden against CSPP
*
* @param array - The array to be cleaned.
* @returns The cleaned version of the array
*/
function cleanArray(array) {
	for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
	return array;
}
/**
* Shallow clone an object
*
* @param object - The object to be cloned.
* @returns A new object that copies the original.
*/
function clone(object) {
	const newObject = create(null);
	for (const [property, value] of entries(object)) if (objectHasOwnProperty(object, property)) if (arrayIsArray(value)) newObject[property] = cleanArray(value);
	else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
	else newObject[property] = value;
	return newObject;
}
/**
* Convert non-node values into strings without depending on direct property access.
*
* @param value - The value to stringify.
* @returns A string representation of the provided value.
*/
function stringifyValue(value) {
	switch (typeof value) {
		case "string": return value;
		case "number": return numberToString(value);
		case "boolean": return booleanToString(value);
		case "bigint": return bigintToString ? bigintToString(value) : "0";
		case "symbol": return symbolToString ? symbolToString(value) : "Symbol()";
		case "undefined": return objectToString(value);
		case "function":
		case "object": {
			if (value === null) return objectToString(value);
			const valueAsRecord = value;
			const valueToString = lookupGetter(valueAsRecord, "toString");
			if (typeof valueToString === "function") {
				const stringified = valueToString(valueAsRecord);
				return typeof stringified === "string" ? stringified : objectToString(stringified);
			}
			return objectToString(value);
		}
		default: return objectToString(value);
	}
}
/**
* This method automatically checks if the prop is function or getter and behaves accordingly.
*
* @param object - The object to look up the getter function in its prototype chain.
* @param prop - The property name for which to find the getter function.
* @returns The getter function found in the prototype chain or a fallback function.
*/
function lookupGetter(object, prop) {
	while (object !== null) {
		const desc = getOwnPropertyDescriptor(object, prop);
		if (desc) {
			if (desc.get) return unapply(desc.get);
			if (typeof desc.value === "function") return unapply(desc.value);
		}
		object = getPrototypeOf(object);
	}
	function fallbackValue() {
		return null;
	}
	return fallbackValue;
}
function isRegex(value) {
	try {
		regExpTest(value, "");
		return true;
	} catch (_unused) {
		return false;
	}
}
var html$1 = freeze([
	"a",
	"abbr",
	"acronym",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"bdi",
	"bdo",
	"big",
	"blink",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"content",
	"data",
	"datalist",
	"dd",
	"decorator",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"element",
	"em",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"main",
	"map",
	"mark",
	"marquee",
	"menu",
	"menuitem",
	"meter",
	"nav",
	"nobr",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"picture",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"search",
	"section",
	"select",
	"shadow",
	"slot",
	"small",
	"source",
	"spacer",
	"span",
	"strike",
	"strong",
	"style",
	"sub",
	"summary",
	"sup",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr"
]);
var svg$1 = freeze([
	"svg",
	"a",
	"altglyph",
	"altglyphdef",
	"altglyphitem",
	"animatecolor",
	"animatemotion",
	"animatetransform",
	"circle",
	"clippath",
	"defs",
	"desc",
	"ellipse",
	"enterkeyhint",
	"exportparts",
	"filter",
	"font",
	"g",
	"glyph",
	"glyphref",
	"hkern",
	"image",
	"inputmode",
	"line",
	"lineargradient",
	"marker",
	"mask",
	"metadata",
	"mpath",
	"part",
	"path",
	"pattern",
	"polygon",
	"polyline",
	"radialgradient",
	"rect",
	"stop",
	"style",
	"switch",
	"symbol",
	"text",
	"textpath",
	"title",
	"tref",
	"tspan",
	"view",
	"vkern"
]);
var svgFilters = freeze([
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence"
]);
var svgDisallowed = freeze([
	"animate",
	"color-profile",
	"cursor",
	"discard",
	"font-face",
	"font-face-format",
	"font-face-name",
	"font-face-src",
	"font-face-uri",
	"foreignobject",
	"hatch",
	"hatchpath",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"missing-glyph",
	"script",
	"set",
	"solidcolor",
	"unknown",
	"use"
]);
var mathMl$1 = freeze([
	"math",
	"menclose",
	"merror",
	"mfenced",
	"mfrac",
	"mglyph",
	"mi",
	"mlabeledtr",
	"mmultiscripts",
	"mn",
	"mo",
	"mover",
	"mpadded",
	"mphantom",
	"mroot",
	"mrow",
	"ms",
	"mspace",
	"msqrt",
	"mstyle",
	"msub",
	"msup",
	"msubsup",
	"mtable",
	"mtd",
	"mtext",
	"mtr",
	"munder",
	"munderover",
	"mprescripts"
]);
var mathMlDisallowed = freeze([
	"maction",
	"maligngroup",
	"malignmark",
	"mlongdiv",
	"mscarries",
	"mscarry",
	"msgroup",
	"mstack",
	"msline",
	"msrow",
	"semantics",
	"annotation",
	"annotation-xml",
	"mprescripts",
	"none"
]);
var text = freeze(["#text"]);
var html = freeze([
	"accept",
	"action",
	"align",
	"alt",
	"autocapitalize",
	"autocomplete",
	"autopictureinpicture",
	"autoplay",
	"background",
	"bgcolor",
	"border",
	"capture",
	"cellpadding",
	"cellspacing",
	"checked",
	"cite",
	"class",
	"clear",
	"color",
	"cols",
	"colspan",
	"controls",
	"controlslist",
	"coords",
	"crossorigin",
	"datetime",
	"decoding",
	"default",
	"dir",
	"disabled",
	"disablepictureinpicture",
	"disableremoteplayback",
	"download",
	"draggable",
	"enctype",
	"enterkeyhint",
	"exportparts",
	"face",
	"for",
	"headers",
	"height",
	"hidden",
	"high",
	"href",
	"hreflang",
	"id",
	"inert",
	"inputmode",
	"integrity",
	"ismap",
	"kind",
	"label",
	"lang",
	"list",
	"loading",
	"loop",
	"low",
	"max",
	"maxlength",
	"media",
	"method",
	"min",
	"minlength",
	"multiple",
	"muted",
	"name",
	"nonce",
	"noshade",
	"novalidate",
	"nowrap",
	"open",
	"optimum",
	"part",
	"pattern",
	"placeholder",
	"playsinline",
	"popover",
	"popovertarget",
	"popovertargetaction",
	"poster",
	"preload",
	"pubdate",
	"radiogroup",
	"readonly",
	"rel",
	"required",
	"rev",
	"reversed",
	"role",
	"rows",
	"rowspan",
	"spellcheck",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"slot",
	"span",
	"srclang",
	"start",
	"src",
	"srcset",
	"step",
	"style",
	"summary",
	"tabindex",
	"title",
	"translate",
	"type",
	"usemap",
	"valign",
	"value",
	"width",
	"wrap",
	"xmlns"
]);
var svg = freeze([
	"accent-height",
	"accumulate",
	"additive",
	"alignment-baseline",
	"amplitude",
	"ascent",
	"attributename",
	"attributetype",
	"azimuth",
	"basefrequency",
	"baseline-shift",
	"begin",
	"bias",
	"by",
	"class",
	"clip",
	"clippathunits",
	"clip-path",
	"clip-rule",
	"color",
	"color-interpolation",
	"color-interpolation-filters",
	"color-profile",
	"color-rendering",
	"cx",
	"cy",
	"d",
	"dx",
	"dy",
	"diffuseconstant",
	"direction",
	"display",
	"divisor",
	"dur",
	"edgemode",
	"elevation",
	"end",
	"exponent",
	"fill",
	"fill-opacity",
	"fill-rule",
	"filter",
	"filterunits",
	"flood-color",
	"flood-opacity",
	"font-family",
	"font-size",
	"font-size-adjust",
	"font-stretch",
	"font-style",
	"font-variant",
	"font-weight",
	"fx",
	"fy",
	"g1",
	"g2",
	"glyph-name",
	"glyphref",
	"gradientunits",
	"gradienttransform",
	"height",
	"href",
	"id",
	"image-rendering",
	"in",
	"in2",
	"intercept",
	"k",
	"k1",
	"k2",
	"k3",
	"k4",
	"kerning",
	"keypoints",
	"keysplines",
	"keytimes",
	"lang",
	"lengthadjust",
	"letter-spacing",
	"kernelmatrix",
	"kernelunitlength",
	"lighting-color",
	"local",
	"marker-end",
	"marker-mid",
	"marker-start",
	"markerheight",
	"markerunits",
	"markerwidth",
	"maskcontentunits",
	"maskunits",
	"max",
	"mask",
	"mask-type",
	"media",
	"method",
	"mode",
	"min",
	"name",
	"numoctaves",
	"offset",
	"operator",
	"opacity",
	"order",
	"orient",
	"orientation",
	"origin",
	"overflow",
	"paint-order",
	"path",
	"pathlength",
	"patterncontentunits",
	"patterntransform",
	"patternunits",
	"points",
	"preservealpha",
	"preserveaspectratio",
	"primitiveunits",
	"r",
	"rx",
	"ry",
	"radius",
	"refx",
	"refy",
	"repeatcount",
	"repeatdur",
	"restart",
	"result",
	"rotate",
	"scale",
	"seed",
	"shape-rendering",
	"slope",
	"specularconstant",
	"specularexponent",
	"spreadmethod",
	"startoffset",
	"stddeviation",
	"stitchtiles",
	"stop-color",
	"stop-opacity",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"stroke",
	"stroke-width",
	"style",
	"surfacescale",
	"systemlanguage",
	"tabindex",
	"tablevalues",
	"targetx",
	"targety",
	"transform",
	"transform-origin",
	"text-anchor",
	"text-decoration",
	"text-rendering",
	"textlength",
	"type",
	"u1",
	"u2",
	"unicode",
	"values",
	"viewbox",
	"visibility",
	"version",
	"vert-adv-y",
	"vert-origin-x",
	"vert-origin-y",
	"width",
	"word-spacing",
	"wrap",
	"writing-mode",
	"xchannelselector",
	"ychannelselector",
	"x",
	"x1",
	"x2",
	"xmlns",
	"y",
	"y1",
	"y2",
	"z",
	"zoomandpan"
]);
var mathMl = freeze([
	"accent",
	"accentunder",
	"align",
	"bevelled",
	"close",
	"columnalign",
	"columnlines",
	"columnspacing",
	"columnspan",
	"denomalign",
	"depth",
	"dir",
	"display",
	"displaystyle",
	"encoding",
	"fence",
	"frame",
	"height",
	"href",
	"id",
	"largeop",
	"length",
	"linethickness",
	"lquote",
	"lspace",
	"mathbackground",
	"mathcolor",
	"mathsize",
	"mathvariant",
	"maxsize",
	"minsize",
	"movablelimits",
	"notation",
	"numalign",
	"open",
	"rowalign",
	"rowlines",
	"rowspacing",
	"rowspan",
	"rspace",
	"rquote",
	"scriptlevel",
	"scriptminsize",
	"scriptsizemultiplier",
	"selection",
	"separator",
	"separators",
	"stretchy",
	"subscriptshift",
	"supscriptshift",
	"symmetric",
	"voffset",
	"width",
	"xmlns"
]);
var xml = freeze([
	"xlink:href",
	"xml:id",
	"xlink:title",
	"xml:space",
	"xmlns:xlink"
]);
var MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm);
var ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
var TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var EXPRESSIONS = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	ARIA_ATTR,
	ATTR_WHITESPACE,
	CUSTOM_ELEMENT,
	DATA_ATTR,
	DOCTYPE_NAME,
	ERB_EXPR,
	IS_ALLOWED_URI,
	IS_SCRIPT_OR_DATA,
	MUSTACHE_EXPR,
	TMPLIT_EXPR
});
var NODE_TYPE = {
	element: 1,
	text: 3,
	progressingInstruction: 7,
	comment: 8,
	document: 9
};
var getGlobal = function getGlobal() {
	return typeof window === "undefined" ? null : window;
};
/**
* Creates a no-op policy for internal use only.
* Don't export this function outside this module!
* @param trustedTypes The policy factory.
* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
* @return The policy created (or null, if Trusted Types
* are not supported or creating the policy failed).
*/
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
	if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
	let suffix = null;
	const ATTR_NAME = "data-tt-policy-suffix";
	if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
	const policyName = "dompurify" + (suffix ? "#" + suffix : "");
	try {
		return trustedTypes.createPolicy(policyName, {
			createHTML(html) {
				return html;
			},
			createScriptURL(scriptUrl) {
				return scriptUrl;
			}
		});
	} catch (_) {
		console.warn("TrustedTypes policy " + policyName + " could not be created.");
		return null;
	}
};
var _createHooksMap = function _createHooksMap() {
	return {
		afterSanitizeAttributes: [],
		afterSanitizeElements: [],
		afterSanitizeShadowDOM: [],
		beforeSanitizeAttributes: [],
		beforeSanitizeElements: [],
		beforeSanitizeShadowDOM: [],
		uponSanitizeAttribute: [],
		uponSanitizeElement: [],
		uponSanitizeShadowNode: []
	};
};
function createDOMPurify() {
	let window = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
	const DOMPurify = (root) => createDOMPurify(root);
	DOMPurify.version = "3.4.2";
	DOMPurify.removed = [];
	if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
		DOMPurify.isSupported = false;
		return DOMPurify;
	}
	let { document } = window;
	const originalDocument = document;
	const currentScript = originalDocument.currentScript;
	const { DocumentFragment, HTMLTemplateElement, Node, Element, NodeFilter, NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap, HTMLFormElement, DOMParser, trustedTypes } = window;
	const ElementPrototype = Element.prototype;
	const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
	const remove = lookupGetter(ElementPrototype, "remove");
	const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
	const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
	const getParentNode = lookupGetter(ElementPrototype, "parentNode");
	if (typeof HTMLTemplateElement === "function") {
		const template = document.createElement("template");
		if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
	}
	let trustedTypesPolicy;
	let emptyHTML = "";
	const { implementation, createNodeIterator, createDocumentFragment, getElementsByTagName } = document;
	const { importNode } = originalDocument;
	let hooks = _createHooksMap();
	/**
	* Expose whether this browser supports running the full DOMPurify.
	*/
	DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
	const { MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR, DATA_ATTR, ARIA_ATTR, IS_SCRIPT_OR_DATA, ATTR_WHITESPACE, CUSTOM_ELEMENT } = EXPRESSIONS;
	let { IS_ALLOWED_URI: IS_ALLOWED_URI$1 } = EXPRESSIONS;
	/**
	* We consider the elements and attributes below to be safe. Ideally
	* don't add any new ones but feel free to remove unwanted ones.
	*/
	let ALLOWED_TAGS = null;
	const DEFAULT_ALLOWED_TAGS = addToSet({}, [
		...html$1,
		...svg$1,
		...svgFilters,
		...mathMl$1,
		...text
	]);
	let ALLOWED_ATTR = null;
	const DEFAULT_ALLOWED_ATTR = addToSet({}, [
		...html,
		...svg,
		...mathMl,
		...xml
	]);
	let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
		tagNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		allowCustomizedBuiltInElements: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: false
		}
	}));
	let FORBID_TAGS = null;
	let FORBID_ATTR = null;
	const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
		tagCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		}
	}));
	let ALLOW_ARIA_ATTR = true;
	let ALLOW_DATA_ATTR = true;
	let ALLOW_UNKNOWN_PROTOCOLS = false;
	let ALLOW_SELF_CLOSE_IN_ATTR = true;
	let SAFE_FOR_TEMPLATES = false;
	let SAFE_FOR_XML = true;
	let WHOLE_DOCUMENT = false;
	let SET_CONFIG = false;
	let FORCE_BODY = false;
	let RETURN_DOM = false;
	let RETURN_DOM_FRAGMENT = false;
	let RETURN_TRUSTED_TYPE = false;
	let SANITIZE_DOM = true;
	let SANITIZE_NAMED_PROPS = false;
	const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
	let KEEP_CONTENT = true;
	let IN_PLACE = false;
	let USE_PROFILES = {};
	let FORBID_CONTENTS = null;
	const DEFAULT_FORBID_CONTENTS = addToSet({}, [
		"annotation-xml",
		"audio",
		"colgroup",
		"desc",
		"foreignobject",
		"head",
		"iframe",
		"math",
		"mi",
		"mn",
		"mo",
		"ms",
		"mtext",
		"noembed",
		"noframes",
		"noscript",
		"plaintext",
		"script",
		"style",
		"svg",
		"template",
		"thead",
		"title",
		"video",
		"xmp"
	]);
	let DATA_URI_TAGS = null;
	const DEFAULT_DATA_URI_TAGS = addToSet({}, [
		"audio",
		"video",
		"img",
		"source",
		"image",
		"track"
	]);
	let URI_SAFE_ATTRIBUTES = null;
	const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
		"alt",
		"class",
		"for",
		"id",
		"label",
		"name",
		"pattern",
		"placeholder",
		"role",
		"summary",
		"title",
		"value",
		"style",
		"xmlns"
	]);
	const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
	const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
	let NAMESPACE = HTML_NAMESPACE;
	let IS_EMPTY_INPUT = false;
	let ALLOWED_NAMESPACES = null;
	const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
		MATHML_NAMESPACE,
		SVG_NAMESPACE,
		HTML_NAMESPACE
	], stringToString);
	let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, [
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext"
	]);
	let HTML_INTEGRATION_POINTS = addToSet({}, ["annotation-xml"]);
	const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
		"title",
		"style",
		"font",
		"a",
		"script"
	]);
	let PARSER_MEDIA_TYPE = null;
	const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
	const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
	let transformCaseFunc = null;
	let CONFIG = null;
	const formElement = document.createElement("form");
	const isRegexOrFunction = function isRegexOrFunction(testValue) {
		return testValue instanceof RegExp || testValue instanceof Function;
	};
	/**
	* _parseConfig
	*
	* @param cfg optional config literal
	*/
	const _parseConfig = function _parseConfig() {
		let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		if (CONFIG && CONFIG === cfg) return;
		if (!cfg || typeof cfg !== "object") cfg = {};
		cfg = clone(cfg);
		PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
		transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
		ALLOWED_TAGS = objectHasOwnProperty(cfg, "ALLOWED_TAGS") && arrayIsArray(cfg.ALLOWED_TAGS) ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
		ALLOWED_ATTR = objectHasOwnProperty(cfg, "ALLOWED_ATTR") && arrayIsArray(cfg.ALLOWED_ATTR) ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
		ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, "ALLOWED_NAMESPACES") && arrayIsArray(cfg.ALLOWED_NAMESPACES) ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
		URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR) ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
		DATA_URI_TAGS = objectHasOwnProperty(cfg, "ADD_DATA_URI_TAGS") && arrayIsArray(cfg.ADD_DATA_URI_TAGS) ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
		FORBID_CONTENTS = objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS) ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
		FORBID_TAGS = objectHasOwnProperty(cfg, "FORBID_TAGS") && arrayIsArray(cfg.FORBID_TAGS) ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
		FORBID_ATTR = objectHasOwnProperty(cfg, "FORBID_ATTR") && arrayIsArray(cfg.FORBID_ATTR) ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
		USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
		ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
		ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
		ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
		ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
		SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
		SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
		WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
		RETURN_DOM = cfg.RETURN_DOM || false;
		RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
		RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
		FORCE_BODY = cfg.FORCE_BODY || false;
		SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
		SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
		KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
		IN_PLACE = cfg.IN_PLACE || false;
		IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
		NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
		MATHML_TEXT_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "MATHML_TEXT_INTEGRATION_POINTS") && cfg.MATHML_TEXT_INTEGRATION_POINTS && typeof cfg.MATHML_TEXT_INTEGRATION_POINTS === "object" ? clone(cfg.MATHML_TEXT_INTEGRATION_POINTS) : addToSet({}, [
			"mi",
			"mo",
			"mn",
			"ms",
			"mtext"
		]);
		HTML_INTEGRATION_POINTS = objectHasOwnProperty(cfg, "HTML_INTEGRATION_POINTS") && cfg.HTML_INTEGRATION_POINTS && typeof cfg.HTML_INTEGRATION_POINTS === "object" ? clone(cfg.HTML_INTEGRATION_POINTS) : addToSet({}, ["annotation-xml"]);
		const customElementHandling = objectHasOwnProperty(cfg, "CUSTOM_ELEMENT_HANDLING") && cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING === "object" ? clone(cfg.CUSTOM_ELEMENT_HANDLING) : create(null);
		CUSTOM_ELEMENT_HANDLING = create(null);
		if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
		if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
		if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
		if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
		if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
		if (USE_PROFILES) {
			ALLOWED_TAGS = addToSet({}, text);
			ALLOWED_ATTR = create(null);
			if (USE_PROFILES.html === true) {
				addToSet(ALLOWED_TAGS, html$1);
				addToSet(ALLOWED_ATTR, html);
			}
			if (USE_PROFILES.svg === true) {
				addToSet(ALLOWED_TAGS, svg$1);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.svgFilters === true) {
				addToSet(ALLOWED_TAGS, svgFilters);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.mathMl === true) {
				addToSet(ALLOWED_TAGS, mathMl$1);
				addToSet(ALLOWED_ATTR, mathMl);
				addToSet(ALLOWED_ATTR, xml);
			}
		}
		EXTRA_ELEMENT_HANDLING.tagCheck = null;
		EXTRA_ELEMENT_HANDLING.attributeCheck = null;
		if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
			if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
			else if (arrayIsArray(cfg.ADD_TAGS)) {
				if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
				addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
			if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
			else if (arrayIsArray(cfg.ADD_ATTR)) {
				if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
				addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_URI_SAFE_ATTR") && arrayIsArray(cfg.ADD_URI_SAFE_ATTR)) addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
		if (objectHasOwnProperty(cfg, "FORBID_CONTENTS") && arrayIsArray(cfg.FORBID_CONTENTS)) {
			if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
			addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
		}
		if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
			if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
			addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
		}
		if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
		if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
			"html",
			"head",
			"body"
		]);
		if (ALLOWED_TAGS.table) {
			addToSet(ALLOWED_TAGS, ["tbody"]);
			delete FORBID_TAGS.tbody;
		}
		if (cfg.TRUSTED_TYPES_POLICY) {
			if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
			if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
			trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
			emptyHTML = trustedTypesPolicy.createHTML("");
		} else {
			if (trustedTypesPolicy === void 0) trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
			if (trustedTypesPolicy !== null && typeof emptyHTML === "string") emptyHTML = trustedTypesPolicy.createHTML("");
		}
		if (freeze) freeze(cfg);
		CONFIG = cfg;
	};
	const ALL_SVG_TAGS = addToSet({}, [
		...svg$1,
		...svgFilters,
		...svgDisallowed
	]);
	const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
	/**
	* @param element a DOM element whose namespace is being checked
	* @returns Return false if the element has a
	*  namespace that a spec-compliant parser would never
	*  return. Return true otherwise.
	*/
	const _checkValidNamespace = function _checkValidNamespace(element) {
		let parent = getParentNode(element);
		if (!parent || !parent.tagName) parent = {
			namespaceURI: NAMESPACE,
			tagName: "template"
		};
		const tagName = stringToLowerCase(element.tagName);
		const parentTagName = stringToLowerCase(parent.tagName);
		if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
		if (element.namespaceURI === SVG_NAMESPACE) {
			if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
			if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
			return Boolean(ALL_SVG_TAGS[tagName]);
		}
		if (element.namespaceURI === MATHML_NAMESPACE) {
			if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
			if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
			return Boolean(ALL_MATHML_TAGS[tagName]);
		}
		if (element.namespaceURI === HTML_NAMESPACE) {
			if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
			if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
			return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
		}
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
		return false;
	};
	/**
	* _forceRemove
	*
	* @param node a DOM node
	*/
	const _forceRemove = function _forceRemove(node) {
		arrayPush(DOMPurify.removed, { element: node });
		try {
			getParentNode(node).removeChild(node);
		} catch (_) {
			remove(node);
		}
	};
	/**
	* _removeAttribute
	*
	* @param name an Attribute name
	* @param element a DOM node
	*/
	const _removeAttribute = function _removeAttribute(name, element) {
		try {
			arrayPush(DOMPurify.removed, {
				attribute: element.getAttributeNode(name),
				from: element
			});
		} catch (_) {
			arrayPush(DOMPurify.removed, {
				attribute: null,
				from: element
			});
		}
		element.removeAttribute(name);
		if (name === "is") if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
			_forceRemove(element);
		} catch (_) {}
		else try {
			element.setAttribute(name, "");
		} catch (_) {}
	};
	/**
	* _initDocument
	*
	* @param dirty - a string of dirty markup
	* @return a DOM, filled with the dirty markup
	*/
	const _initDocument = function _initDocument(dirty) {
		let doc = null;
		let leadingWhitespace = null;
		if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
		else {
			const matches = stringMatch(dirty, /^[\r\n\t ]+/);
			leadingWhitespace = matches && matches[0];
		}
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
		const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
		if (NAMESPACE === HTML_NAMESPACE) try {
			doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
		} catch (_) {}
		if (!doc || !doc.documentElement) {
			doc = implementation.createDocument(NAMESPACE, "template", null);
			try {
				doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
			} catch (_) {}
		}
		const body = doc.body || doc.documentElement;
		if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
		if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
		return WHOLE_DOCUMENT ? doc.documentElement : body;
	};
	/**
	* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
	*
	* @param root The root element or node to start traversing on.
	* @return The created NodeIterator
	*/
	const _createNodeIterator = function _createNodeIterator(root) {
		return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
	};
	/**
	* _isClobbered
	*
	* @param element element to check for clobbering attacks
	* @return true if clobbered, false if safe
	*/
	const _isClobbered = function _isClobbered(element) {
		return element instanceof HTMLFormElement && (typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function");
	};
	/**
	* Checks whether the given object is a DOM node.
	*
	* @param value object to check whether it's a DOM node
	* @return true is object is a DOM node
	*/
	const _isNode = function _isNode(value) {
		return typeof Node === "function" && value instanceof Node;
	};
	function _executeHooks(hooks, currentNode, data) {
		arrayForEach(hooks, (hook) => {
			hook.call(DOMPurify, currentNode, data, CONFIG);
		});
	}
	/**
	* _sanitizeElements
	*
	* @protect nodeName
	* @protect textContent
	* @protect removeChild
	* @param currentNode to check for permission to exist
	* @return true if node was killed, false if left alive
	*/
	const _sanitizeElements = function _sanitizeElements(currentNode) {
		let content = null;
		_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
		if (_isClobbered(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		const tagName = transformCaseFunc(currentNode.nodeName);
		_executeHooks(hooks.uponSanitizeElement, currentNode, {
			tagName,
			allowedTags: ALLOWED_TAGS
		});
		if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
			_forceRemove(currentNode);
			return true;
		}
		if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && tagName === "style" && _isNode(currentNode.firstElementChild)) {
			_forceRemove(currentNode);
			return true;
		}
		if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
			_forceRemove(currentNode);
			return true;
		}
		if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
			_forceRemove(currentNode);
			return true;
		}
		if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
			if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
				if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
				if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) return false;
			}
			if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
				const parentNode = getParentNode(currentNode) || currentNode.parentNode;
				const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
				if (childNodes && parentNode) {
					const childCount = childNodes.length;
					for (let i = childCount - 1; i >= 0; --i) {
						const childClone = cloneNode(childNodes[i], true);
						parentNode.insertBefore(childClone, getNextSibling(currentNode));
					}
				}
			}
			_forceRemove(currentNode);
			return true;
		}
		if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
			_forceRemove(currentNode);
			return true;
		}
		if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
			content = currentNode.textContent;
			arrayForEach([
				MUSTACHE_EXPR,
				ERB_EXPR,
				TMPLIT_EXPR
			], (expr) => {
				content = stringReplace(content, expr, " ");
			});
			if (currentNode.textContent !== content) {
				arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
				currentNode.textContent = content;
			}
		}
		_executeHooks(hooks.afterSanitizeElements, currentNode, null);
		return false;
	};
	/**
	* _isValidAttribute
	*
	* @param lcTag Lowercase tag name of containing element.
	* @param lcName Lowercase attribute name.
	* @param value Attribute value.
	* @return Returns true if `value` is valid, otherwise false.
	*/
	const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
		if (FORBID_ATTR[lcName]) return false;
		if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
		const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
		if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName));
		else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName));
		else if (!nameIsPermitted || FORBID_ATTR[lcName]) if (_isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value)));
		else return false;
		else if (URI_SAFE_ATTRIBUTES[lcName]);
		else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, "")));
		else if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]);
		else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, "")));
		else if (value) return false;
		return true;
	};
	const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, [
		"annotation-xml",
		"color-profile",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"missing-glyph"
	]);
	/**
	* _isBasicCustomElement
	* checks if at least one dash is included in tagName, and it's not the first char
	* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
	*
	* @param tagName name of the tag of the node to sanitize
	* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
	*/
	const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
		return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT, tagName);
	};
	/**
	* _sanitizeAttributes
	*
	* @protect attributes
	* @protect nodeName
	* @protect removeAttribute
	* @protect setAttribute
	*
	* @param currentNode to sanitize
	*/
	const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
		_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
		const { attributes } = currentNode;
		if (!attributes || _isClobbered(currentNode)) return;
		const hookEvent = {
			attrName: "",
			attrValue: "",
			keepAttr: true,
			allowedAttributes: ALLOWED_ATTR,
			forceKeepAttr: void 0
		};
		let l = attributes.length;
		while (l--) {
			const { name, namespaceURI, value: attrValue } = attributes[l];
			const lcName = transformCaseFunc(name);
			const initValue = attrValue;
			let value = name === "value" ? initValue : stringTrim(initValue);
			hookEvent.attrName = lcName;
			hookEvent.attrValue = value;
			hookEvent.keepAttr = true;
			hookEvent.forceKeepAttr = void 0;
			_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
			value = hookEvent.attrValue;
			if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
				_removeAttribute(name, currentNode);
				value = SANITIZE_NAMED_PROPS_PREFIX + value;
			}
			if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
				_removeAttribute(name, currentNode);
				continue;
			}
			if (lcName === "attributename" && stringMatch(value, "href")) {
				_removeAttribute(name, currentNode);
				continue;
			}
			if (hookEvent.forceKeepAttr) continue;
			if (!hookEvent.keepAttr) {
				_removeAttribute(name, currentNode);
				continue;
			}
			if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
				_removeAttribute(name, currentNode);
				continue;
			}
			if (SAFE_FOR_TEMPLATES) arrayForEach([
				MUSTACHE_EXPR,
				ERB_EXPR,
				TMPLIT_EXPR
			], (expr) => {
				value = stringReplace(value, expr, " ");
			});
			const lcTag = transformCaseFunc(currentNode.nodeName);
			if (!_isValidAttribute(lcTag, lcName, value)) {
				_removeAttribute(name, currentNode);
				continue;
			}
			if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function") if (namespaceURI);
			else switch (trustedTypes.getAttributeType(lcTag, lcName)) {
				case "TrustedHTML":
					value = trustedTypesPolicy.createHTML(value);
					break;
				case "TrustedScriptURL":
					value = trustedTypesPolicy.createScriptURL(value);
					break;
			}
			if (value !== initValue) try {
				if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
				else currentNode.setAttribute(name, value);
				if (_isClobbered(currentNode)) _forceRemove(currentNode);
				else arrayPop(DOMPurify.removed);
			} catch (_) {
				_removeAttribute(name, currentNode);
			}
		}
		_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
	};
	/**
	* _sanitizeShadowDOM
	*
	* @param fragment to iterate over recursively
	*/
	const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
		let shadowNode = null;
		const shadowIterator = _createNodeIterator(fragment);
		_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
		while (shadowNode = shadowIterator.nextNode()) {
			_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
			_sanitizeElements(shadowNode);
			_sanitizeAttributes(shadowNode);
			if (shadowNode.content instanceof DocumentFragment) _sanitizeShadowDOM2(shadowNode.content);
		}
		_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
	};
	DOMPurify.sanitize = function(dirty) {
		let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		let body = null;
		let importedNode = null;
		let currentNode = null;
		let returnNode = null;
		IS_EMPTY_INPUT = !dirty;
		if (IS_EMPTY_INPUT) dirty = "<!-->";
		if (typeof dirty !== "string" && !_isNode(dirty)) {
			dirty = stringifyValue(dirty);
			if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
		}
		if (!DOMPurify.isSupported) return dirty;
		if (!SET_CONFIG) _parseConfig(cfg);
		DOMPurify.removed = [];
		if (typeof dirty === "string") IN_PLACE = false;
		if (IN_PLACE) {
			const nn = dirty.nodeName;
			if (typeof nn === "string") {
				const tagName = transformCaseFunc(nn);
				if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
			}
		} else if (dirty instanceof Node) {
			body = _initDocument("<!---->");
			importedNode = body.ownerDocument.importNode(dirty, true);
			if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
			else if (importedNode.nodeName === "HTML") body = importedNode;
			else body.appendChild(importedNode);
		} else {
			if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
			body = _initDocument(dirty);
			if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
		}
		if (body && FORCE_BODY) _forceRemove(body.firstChild);
		const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
		while (currentNode = nodeIterator.nextNode()) {
			_sanitizeElements(currentNode);
			_sanitizeAttributes(currentNode);
			if (currentNode.content instanceof DocumentFragment) _sanitizeShadowDOM2(currentNode.content);
		}
		if (IN_PLACE) return dirty;
		if (RETURN_DOM) {
			if (SAFE_FOR_TEMPLATES) {
				body.normalize();
				let html = body.innerHTML;
				arrayForEach([
					MUSTACHE_EXPR,
					ERB_EXPR,
					TMPLIT_EXPR
				], (expr) => {
					html = stringReplace(html, expr, " ");
				});
				body.innerHTML = html;
			}
			if (RETURN_DOM_FRAGMENT) {
				returnNode = createDocumentFragment.call(body.ownerDocument);
				while (body.firstChild) returnNode.appendChild(body.firstChild);
			} else returnNode = body;
			if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
			return returnNode;
		}
		let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
		if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
		if (SAFE_FOR_TEMPLATES) arrayForEach([
			MUSTACHE_EXPR,
			ERB_EXPR,
			TMPLIT_EXPR
		], (expr) => {
			serializedHTML = stringReplace(serializedHTML, expr, " ");
		});
		return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
	};
	DOMPurify.setConfig = function() {
		_parseConfig(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {});
		SET_CONFIG = true;
	};
	DOMPurify.clearConfig = function() {
		CONFIG = null;
		SET_CONFIG = false;
	};
	DOMPurify.isValidAttribute = function(tag, attr, value) {
		if (!CONFIG) _parseConfig({});
		return _isValidAttribute(transformCaseFunc(tag), transformCaseFunc(attr), value);
	};
	DOMPurify.addHook = function(entryPoint, hookFunction) {
		if (typeof hookFunction !== "function") return;
		arrayPush(hooks[entryPoint], hookFunction);
	};
	DOMPurify.removeHook = function(entryPoint, hookFunction) {
		if (hookFunction !== void 0) {
			const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
			return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
		}
		return arrayPop(hooks[entryPoint]);
	};
	DOMPurify.removeHooks = function(entryPoint) {
		hooks[entryPoint] = [];
	};
	DOMPurify.removeAllHooks = function() {
		hooks = _createHooksMap();
	};
	return DOMPurify;
}
var purify = createDOMPurify();
//#endregion
export { useResolvedPath as $, installTimerFunctions as A, shouldThrowError as B, noop as C, esm_exports as D, PacketType as E, InfiniteQueryObserver as F, Route as G, DataRouterStateContext as H, QueryObserver as I, logV6DeprecationWarnings as J, Router as K, notifyManager as L, Emitter as M, QueryClient as N, Socket as O, MutationObserver as P, useParams as Q, environmentManager as R, warning as S, imageCompression as T, Navigate as U, DataRouterContext as V, NavigationContext as W, useLocation as X, useHref as Y, useNavigate as Z, millisecondsToSeconds as _, hover as a, require_scheduler as at, memo as b, generateLinearEasing as c, attachTimeline as d, createHashHistory as et, isGenerator as f, GroupPlaybackControls as g, getValueTransition as h, isPrimaryPointer as i, stripBasename as it, nextTick as j, parse as k, supportsLinearEasing as l, maxGeneratorDuration as m, setDragLock as n, invariant$1 as nt, isWaapiSupportedEasing as o, require_react as ot, calcGeneratorDuration as p, Routes as q, press as r, matchPath as rt, mapEasingToNativeEasing as s, purify as t, createPath as tt, isBezierDefinition as u, secondsToMilliseconds as v, require_spark_md5 as w, invariant as x, progress as y, noop$1 as z };
