import { aK as reactExports } from "../index-BtxTC4_g.js";
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t2, e2) {
    return t2.__proto__ = e2, t2;
  }, _setPrototypeOf(t, e);
}
function _inheritsLoose(t, o) {
  t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
}
var safeIsNaN = Number.isNaN || function ponyfill(value) {
  return typeof value === "number" && value !== value;
};
function isEqual(first, second) {
  if (first === second) {
    return true;
  }
  if (safeIsNaN(first) && safeIsNaN(second)) {
    return true;
  }
  return false;
}
function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (var i = 0; i < newInputs.length; i++) {
    if (!isEqual(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}
function memoizeOne(resultFn, isEqual2) {
  if (isEqual2 === void 0) {
    isEqual2 = areInputsEqual;
  }
  var lastThis;
  var lastArgs = [];
  var lastResult;
  var calledOnce = false;
  function memoized() {
    var newArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      newArgs[_i] = arguments[_i];
    }
    if (calledOnce && lastThis === this && isEqual2(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  }
  return memoized;
}
var hasNativePerformanceNow = typeof performance === "object" && typeof performance.now === "function";
var now = hasNativePerformanceNow ? function() {
  return performance.now();
} : function() {
  return Date.now();
};
function cancelTimeout(timeoutID) {
  cancelAnimationFrame(timeoutID.id);
}
function requestTimeout(callback, delay) {
  var start = now();
  function tick() {
    if (now() - start >= delay) {
      callback.call(null);
    } else {
      timeoutID.id = requestAnimationFrame(tick);
    }
  }
  var timeoutID = {
    id: requestAnimationFrame(tick)
  };
  return timeoutID;
}
var size = -1;
function getScrollbarSize(recalculate) {
  if (recalculate === void 0) {
    recalculate = false;
  }
  if (size === -1 || recalculate) {
    var div = document.createElement("div");
    var style = div.style;
    style.width = "50px";
    style.height = "50px";
    style.overflow = "scroll";
    document.body.appendChild(div);
    size = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
  }
  return size;
}
var cachedRTLResult = null;
function getRTLOffsetType(recalculate) {
  if (recalculate === void 0) {
    recalculate = false;
  }
  if (cachedRTLResult === null || recalculate) {
    var outerDiv = document.createElement("div");
    var outerStyle = outerDiv.style;
    outerStyle.width = "50px";
    outerStyle.height = "50px";
    outerStyle.overflow = "scroll";
    outerStyle.direction = "rtl";
    var innerDiv = document.createElement("div");
    var innerStyle = innerDiv.style;
    innerStyle.width = "100px";
    innerStyle.height = "100px";
    outerDiv.appendChild(innerDiv);
    document.body.appendChild(outerDiv);
    if (outerDiv.scrollLeft > 0) {
      cachedRTLResult = "positive-descending";
    } else {
      outerDiv.scrollLeft = 1;
      if (outerDiv.scrollLeft === 0) {
        cachedRTLResult = "negative";
      } else {
        cachedRTLResult = "positive-ascending";
      }
    }
    document.body.removeChild(outerDiv);
    return cachedRTLResult;
  }
  return cachedRTLResult;
}
var IS_SCROLLING_DEBOUNCE_INTERVAL$1 = 150;
var defaultItemKey$1 = function defaultItemKey3(index, data) {
  return index;
};
function createListComponent(_ref) {
  var _class;
  var getItemOffset3 = _ref.getItemOffset, getEstimatedTotalSize4 = _ref.getEstimatedTotalSize, getItemSize3 = _ref.getItemSize, getOffsetForIndexAndAlignment5 = _ref.getOffsetForIndexAndAlignment, getStartIndexForOffset3 = _ref.getStartIndexForOffset, getStopIndexForStartIndex3 = _ref.getStopIndexForStartIndex, initInstanceProps5 = _ref.initInstanceProps, shouldResetStyleCacheOnItemSizeChange = _ref.shouldResetStyleCacheOnItemSizeChange, validateProps5 = _ref.validateProps;
  return _class = /* @__PURE__ */ (function(_PureComponent) {
    _inheritsLoose(List, _PureComponent);
    function List(props) {
      var _this;
      _this = _PureComponent.call(this, props) || this;
      _this._instanceProps = initInstanceProps5(_this.props, _assertThisInitialized(_this));
      _this._outerRef = void 0;
      _this._resetIsScrollingTimeoutId = null;
      _this.state = {
        instance: _assertThisInitialized(_this),
        isScrolling: false,
        scrollDirection: "forward",
        scrollOffset: typeof _this.props.initialScrollOffset === "number" ? _this.props.initialScrollOffset : 0,
        scrollUpdateWasRequested: false
      };
      _this._callOnItemsRendered = void 0;
      _this._callOnItemsRendered = memoizeOne(function(overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex) {
        return _this.props.onItemsRendered({
          overscanStartIndex,
          overscanStopIndex,
          visibleStartIndex,
          visibleStopIndex
        });
      });
      _this._callOnScroll = void 0;
      _this._callOnScroll = memoizeOne(function(scrollDirection, scrollOffset, scrollUpdateWasRequested) {
        return _this.props.onScroll({
          scrollDirection,
          scrollOffset,
          scrollUpdateWasRequested
        });
      });
      _this._getItemStyle = void 0;
      _this._getItemStyle = function(index) {
        var _this$props = _this.props, direction = _this$props.direction, itemSize = _this$props.itemSize, layout = _this$props.layout;
        var itemStyleCache = _this._getItemStyleCache(shouldResetStyleCacheOnItemSizeChange && itemSize, shouldResetStyleCacheOnItemSizeChange && layout, shouldResetStyleCacheOnItemSizeChange && direction);
        var style;
        if (itemStyleCache.hasOwnProperty(index)) {
          style = itemStyleCache[index];
        } else {
          var _offset = getItemOffset3(_this.props, index, _this._instanceProps);
          var size2 = getItemSize3(_this.props, index, _this._instanceProps);
          var isHorizontal = direction === "horizontal" || layout === "horizontal";
          var isRtl = direction === "rtl";
          var offsetHorizontal = isHorizontal ? _offset : 0;
          itemStyleCache[index] = style = {
            position: "absolute",
            left: isRtl ? void 0 : offsetHorizontal,
            right: isRtl ? offsetHorizontal : void 0,
            top: !isHorizontal ? _offset : 0,
            height: !isHorizontal ? size2 : "100%",
            width: isHorizontal ? size2 : "100%"
          };
        }
        return style;
      };
      _this._getItemStyleCache = void 0;
      _this._getItemStyleCache = memoizeOne(function(_, __, ___) {
        return {};
      });
      _this._onScrollHorizontal = function(event) {
        var _event$currentTarget = event.currentTarget, clientWidth = _event$currentTarget.clientWidth, scrollLeft = _event$currentTarget.scrollLeft, scrollWidth = _event$currentTarget.scrollWidth;
        _this.setState(function(prevState) {
          if (prevState.scrollOffset === scrollLeft) {
            return null;
          }
          var direction = _this.props.direction;
          var scrollOffset = scrollLeft;
          if (direction === "rtl") {
            switch (getRTLOffsetType()) {
              case "negative":
                scrollOffset = -scrollLeft;
                break;
              case "positive-descending":
                scrollOffset = scrollWidth - clientWidth - scrollLeft;
                break;
            }
          }
          scrollOffset = Math.max(0, Math.min(scrollOffset, scrollWidth - clientWidth));
          return {
            isScrolling: true,
            scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
            scrollOffset,
            scrollUpdateWasRequested: false
          };
        }, _this._resetIsScrollingDebounced);
      };
      _this._onScrollVertical = function(event) {
        var _event$currentTarget2 = event.currentTarget, clientHeight = _event$currentTarget2.clientHeight, scrollHeight = _event$currentTarget2.scrollHeight, scrollTop = _event$currentTarget2.scrollTop;
        _this.setState(function(prevState) {
          if (prevState.scrollOffset === scrollTop) {
            return null;
          }
          var scrollOffset = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight));
          return {
            isScrolling: true,
            scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
            scrollOffset,
            scrollUpdateWasRequested: false
          };
        }, _this._resetIsScrollingDebounced);
      };
      _this._outerRefSetter = function(ref) {
        var outerRef = _this.props.outerRef;
        _this._outerRef = ref;
        if (typeof outerRef === "function") {
          outerRef(ref);
        } else if (outerRef != null && typeof outerRef === "object" && outerRef.hasOwnProperty("current")) {
          outerRef.current = ref;
        }
      };
      _this._resetIsScrollingDebounced = function() {
        if (_this._resetIsScrollingTimeoutId !== null) {
          cancelTimeout(_this._resetIsScrollingTimeoutId);
        }
        _this._resetIsScrollingTimeoutId = requestTimeout(_this._resetIsScrolling, IS_SCROLLING_DEBOUNCE_INTERVAL$1);
      };
      _this._resetIsScrolling = function() {
        _this._resetIsScrollingTimeoutId = null;
        _this.setState({
          isScrolling: false
        }, function() {
          _this._getItemStyleCache(-1, null);
        });
      };
      return _this;
    }
    List.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, prevState) {
      validateSharedProps$1(nextProps, prevState);
      validateProps5(nextProps);
      return null;
    };
    var _proto = List.prototype;
    _proto.scrollTo = function scrollTo(scrollOffset) {
      scrollOffset = Math.max(0, scrollOffset);
      this.setState(function(prevState) {
        if (prevState.scrollOffset === scrollOffset) {
          return null;
        }
        return {
          scrollDirection: prevState.scrollOffset < scrollOffset ? "forward" : "backward",
          scrollOffset,
          scrollUpdateWasRequested: true
        };
      }, this._resetIsScrollingDebounced);
    };
    _proto.scrollToItem = function scrollToItem(index, align) {
      if (align === void 0) {
        align = "auto";
      }
      var _this$props2 = this.props, itemCount = _this$props2.itemCount, layout = _this$props2.layout;
      var scrollOffset = this.state.scrollOffset;
      index = Math.max(0, Math.min(index, itemCount - 1));
      var scrollbarSize = 0;
      if (this._outerRef) {
        var outerRef = this._outerRef;
        if (layout === "vertical") {
          scrollbarSize = outerRef.scrollWidth > outerRef.clientWidth ? getScrollbarSize() : 0;
        } else {
          scrollbarSize = outerRef.scrollHeight > outerRef.clientHeight ? getScrollbarSize() : 0;
        }
      }
      this.scrollTo(getOffsetForIndexAndAlignment5(this.props, index, align, scrollOffset, this._instanceProps, scrollbarSize));
    };
    _proto.componentDidMount = function componentDidMount() {
      var _this$props3 = this.props, direction = _this$props3.direction, initialScrollOffset = _this$props3.initialScrollOffset, layout = _this$props3.layout;
      if (typeof initialScrollOffset === "number" && this._outerRef != null) {
        var outerRef = this._outerRef;
        if (direction === "horizontal" || layout === "horizontal") {
          outerRef.scrollLeft = initialScrollOffset;
        } else {
          outerRef.scrollTop = initialScrollOffset;
        }
      }
      this._callPropsCallbacks();
    };
    _proto.componentDidUpdate = function componentDidUpdate() {
      var _this$props4 = this.props, direction = _this$props4.direction, layout = _this$props4.layout;
      var _this$state = this.state, scrollOffset = _this$state.scrollOffset, scrollUpdateWasRequested = _this$state.scrollUpdateWasRequested;
      if (scrollUpdateWasRequested && this._outerRef != null) {
        var outerRef = this._outerRef;
        if (direction === "horizontal" || layout === "horizontal") {
          if (direction === "rtl") {
            switch (getRTLOffsetType()) {
              case "negative":
                outerRef.scrollLeft = -scrollOffset;
                break;
              case "positive-ascending":
                outerRef.scrollLeft = scrollOffset;
                break;
              default:
                var clientWidth = outerRef.clientWidth, scrollWidth = outerRef.scrollWidth;
                outerRef.scrollLeft = scrollWidth - clientWidth - scrollOffset;
                break;
            }
          } else {
            outerRef.scrollLeft = scrollOffset;
          }
        } else {
          outerRef.scrollTop = scrollOffset;
        }
      }
      this._callPropsCallbacks();
    };
    _proto.componentWillUnmount = function componentWillUnmount() {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }
    };
    _proto.render = function render() {
      var _this$props5 = this.props, children = _this$props5.children, className = _this$props5.className, direction = _this$props5.direction, height = _this$props5.height, innerRef = _this$props5.innerRef, innerElementType = _this$props5.innerElementType, innerTagName = _this$props5.innerTagName, itemCount = _this$props5.itemCount, itemData = _this$props5.itemData, _this$props5$itemKey = _this$props5.itemKey, itemKey = _this$props5$itemKey === void 0 ? defaultItemKey$1 : _this$props5$itemKey, layout = _this$props5.layout, outerElementType = _this$props5.outerElementType, outerTagName = _this$props5.outerTagName, style = _this$props5.style, useIsScrolling = _this$props5.useIsScrolling, width = _this$props5.width;
      var isScrolling = this.state.isScrolling;
      var isHorizontal = direction === "horizontal" || layout === "horizontal";
      var onScroll = isHorizontal ? this._onScrollHorizontal : this._onScrollVertical;
      var _this$_getRangeToRend = this._getRangeToRender(), startIndex = _this$_getRangeToRend[0], stopIndex = _this$_getRangeToRend[1];
      var items = [];
      if (itemCount > 0) {
        for (var _index = startIndex; _index <= stopIndex; _index++) {
          items.push(reactExports.createElement(children, {
            data: itemData,
            key: itemKey(_index, itemData),
            index: _index,
            isScrolling: useIsScrolling ? isScrolling : void 0,
            style: this._getItemStyle(_index)
          }));
        }
      }
      var estimatedTotalSize = getEstimatedTotalSize4(this.props, this._instanceProps);
      return reactExports.createElement(outerElementType || outerTagName || "div", {
        className,
        onScroll,
        ref: this._outerRefSetter,
        style: _extends({
          position: "relative",
          height,
          width,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          willChange: "transform",
          direction
        }, style)
      }, reactExports.createElement(innerElementType || innerTagName || "div", {
        children: items,
        ref: innerRef,
        style: {
          height: isHorizontal ? "100%" : estimatedTotalSize,
          pointerEvents: isScrolling ? "none" : void 0,
          width: isHorizontal ? estimatedTotalSize : "100%"
        }
      }));
    };
    _proto._callPropsCallbacks = function _callPropsCallbacks() {
      if (typeof this.props.onItemsRendered === "function") {
        var itemCount = this.props.itemCount;
        if (itemCount > 0) {
          var _this$_getRangeToRend2 = this._getRangeToRender(), _overscanStartIndex = _this$_getRangeToRend2[0], _overscanStopIndex = _this$_getRangeToRend2[1], _visibleStartIndex = _this$_getRangeToRend2[2], _visibleStopIndex = _this$_getRangeToRend2[3];
          this._callOnItemsRendered(_overscanStartIndex, _overscanStopIndex, _visibleStartIndex, _visibleStopIndex);
        }
      }
      if (typeof this.props.onScroll === "function") {
        var _this$state2 = this.state, _scrollDirection = _this$state2.scrollDirection, _scrollOffset = _this$state2.scrollOffset, _scrollUpdateWasRequested = _this$state2.scrollUpdateWasRequested;
        this._callOnScroll(_scrollDirection, _scrollOffset, _scrollUpdateWasRequested);
      }
    };
    _proto._getRangeToRender = function _getRangeToRender() {
      var _this$props6 = this.props, itemCount = _this$props6.itemCount, overscanCount = _this$props6.overscanCount;
      var _this$state3 = this.state, isScrolling = _this$state3.isScrolling, scrollDirection = _this$state3.scrollDirection, scrollOffset = _this$state3.scrollOffset;
      if (itemCount === 0) {
        return [0, 0, 0, 0];
      }
      var startIndex = getStartIndexForOffset3(this.props, scrollOffset, this._instanceProps);
      var stopIndex = getStopIndexForStartIndex3(this.props, startIndex, scrollOffset, this._instanceProps);
      var overscanBackward = !isScrolling || scrollDirection === "backward" ? Math.max(1, overscanCount) : 1;
      var overscanForward = !isScrolling || scrollDirection === "forward" ? Math.max(1, overscanCount) : 1;
      return [Math.max(0, startIndex - overscanBackward), Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)), startIndex, stopIndex];
    };
    return List;
  })(reactExports.PureComponent), _class.defaultProps = {
    direction: "ltr",
    itemData: void 0,
    layout: "vertical",
    overscanCount: 2,
    useIsScrolling: false
  }, _class;
}
var validateSharedProps$1 = function validateSharedProps3(_ref2, _ref3) {
  _ref2.children;
  _ref2.direction;
  _ref2.height;
  _ref2.layout;
  _ref2.innerTagName;
  _ref2.outerTagName;
  _ref2.width;
  _ref3.instance;
};
var FixedSizeList = /* @__PURE__ */ createListComponent({
  getItemOffset: function getItemOffset2(_ref, index) {
    var itemSize = _ref.itemSize;
    return index * itemSize;
  },
  getItemSize: function getItemSize2(_ref2, index) {
    var itemSize = _ref2.itemSize;
    return itemSize;
  },
  getEstimatedTotalSize: function getEstimatedTotalSize3(_ref3) {
    var itemCount = _ref3.itemCount, itemSize = _ref3.itemSize;
    return itemSize * itemCount;
  },
  getOffsetForIndexAndAlignment: function getOffsetForIndexAndAlignment4(_ref4, index, align, scrollOffset, instanceProps, scrollbarSize) {
    var direction = _ref4.direction, height = _ref4.height, itemCount = _ref4.itemCount, itemSize = _ref4.itemSize, layout = _ref4.layout, width = _ref4.width;
    var isHorizontal = direction === "horizontal" || layout === "horizontal";
    var size2 = isHorizontal ? width : height;
    var lastItemOffset = Math.max(0, itemCount * itemSize - size2);
    var maxOffset = Math.min(lastItemOffset, index * itemSize);
    var minOffset = Math.max(0, index * itemSize - size2 + itemSize + scrollbarSize);
    if (align === "smart") {
      if (scrollOffset >= minOffset - size2 && scrollOffset <= maxOffset + size2) {
        align = "auto";
      } else {
        align = "center";
      }
    }
    switch (align) {
      case "start":
        return maxOffset;
      case "end":
        return minOffset;
      case "center": {
        var middleOffset = Math.round(minOffset + (maxOffset - minOffset) / 2);
        if (middleOffset < Math.ceil(size2 / 2)) {
          return 0;
        } else if (middleOffset > lastItemOffset + Math.floor(size2 / 2)) {
          return lastItemOffset;
        } else {
          return middleOffset;
        }
      }
      case "auto":
      default:
        if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
          return scrollOffset;
        } else if (scrollOffset < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },
  getStartIndexForOffset: function getStartIndexForOffset2(_ref5, offset) {
    var itemCount = _ref5.itemCount, itemSize = _ref5.itemSize;
    return Math.max(0, Math.min(itemCount - 1, Math.floor(offset / itemSize)));
  },
  getStopIndexForStartIndex: function getStopIndexForStartIndex2(_ref6, startIndex, scrollOffset) {
    var direction = _ref6.direction, height = _ref6.height, itemCount = _ref6.itemCount, itemSize = _ref6.itemSize, layout = _ref6.layout, width = _ref6.width;
    var isHorizontal = direction === "horizontal" || layout === "horizontal";
    var offset = startIndex * itemSize;
    var size2 = isHorizontal ? width : height;
    var numVisibleItems = Math.ceil((size2 + scrollOffset - offset) / itemSize);
    return Math.max(0, Math.min(
      itemCount - 1,
      startIndex + numVisibleItems - 1
      // -1 is because stop index is inclusive
    ));
  },
  initInstanceProps: function initInstanceProps4(props) {
  },
  shouldResetStyleCacheOnItemSizeChange: true,
  validateProps: function validateProps4(_ref7) {
    _ref7.itemSize;
  }
});
let windowObject;
if (typeof window !== "undefined") {
  windowObject = window;
} else if (typeof self !== "undefined") {
  windowObject = self;
} else {
  windowObject = global;
}
let cancelFrame = null;
let requestFrame = null;
const TIMEOUT_DURATION = 20;
const clearTimeoutFn = windowObject.clearTimeout;
const setTimeoutFn = windowObject.setTimeout;
const cancelAnimationFrameFn = windowObject.cancelAnimationFrame || windowObject.mozCancelAnimationFrame || windowObject.webkitCancelAnimationFrame;
const requestAnimationFrameFn = windowObject.requestAnimationFrame || windowObject.mozRequestAnimationFrame || windowObject.webkitRequestAnimationFrame;
if (cancelAnimationFrameFn == null || requestAnimationFrameFn == null) {
  cancelFrame = clearTimeoutFn;
  requestFrame = function requestAnimationFrameViaSetTimeout(callback) {
    return setTimeoutFn(callback, TIMEOUT_DURATION);
  };
} else {
  cancelFrame = function cancelFrame2([animationFrameID, timeoutID]) {
    cancelAnimationFrameFn(animationFrameID);
    clearTimeoutFn(timeoutID);
  };
  requestFrame = function requestAnimationFrameWithSetTimeoutFallback(callback) {
    const animationFrameID = requestAnimationFrameFn(function animationFrameCallback() {
      clearTimeoutFn(timeoutID);
      callback();
    });
    const timeoutID = setTimeoutFn(function timeoutCallback() {
      cancelAnimationFrameFn(animationFrameID);
      callback();
    }, TIMEOUT_DURATION);
    return [animationFrameID, timeoutID];
  };
}
function createDetectElementResize(nonce) {
  let animationKeyframes;
  let animationName;
  let animationStartEvent;
  let animationStyle;
  let checkTriggers;
  let resetTriggers;
  let scrollListener;
  const attachEvent = typeof document !== "undefined" && document.attachEvent;
  if (!attachEvent) {
    resetTriggers = function(element) {
      const triggers = element.__resizeTriggers__, expand = triggers.firstElementChild, contract = triggers.lastElementChild, expandChild = expand.firstElementChild;
      contract.scrollLeft = contract.scrollWidth;
      contract.scrollTop = contract.scrollHeight;
      expandChild.style.width = expand.offsetWidth + 1 + "px";
      expandChild.style.height = expand.offsetHeight + 1 + "px";
      expand.scrollLeft = expand.scrollWidth;
      expand.scrollTop = expand.scrollHeight;
    };
    checkTriggers = function(element) {
      return element.offsetWidth !== element.__resizeLast__.width || element.offsetHeight !== element.__resizeLast__.height;
    };
    scrollListener = function(e) {
      if (e.target.className && typeof e.target.className.indexOf === "function" && e.target.className.indexOf("contract-trigger") < 0 && e.target.className.indexOf("expand-trigger") < 0) {
        return;
      }
      const element = this;
      resetTriggers(this);
      if (this.__resizeRAF__) {
        cancelFrame(this.__resizeRAF__);
      }
      this.__resizeRAF__ = requestFrame(function animationFrame() {
        if (checkTriggers(element)) {
          element.__resizeLast__.width = element.offsetWidth;
          element.__resizeLast__.height = element.offsetHeight;
          element.__resizeListeners__.forEach(function forEachResizeListener(fn) {
            fn.call(element, e);
          });
        }
      });
    };
    let animation = false;
    let keyframeprefix = "";
    animationStartEvent = "animationstart";
    const domPrefixes = "Webkit Moz O ms".split(" ");
    let startEvents = "webkitAnimationStart animationstart oAnimationStart MSAnimationStart".split(" ");
    let pfx = "";
    {
      const elm = document.createElement("fakeelement");
      if (elm.style.animationName !== void 0) {
        animation = true;
      }
      if (animation === false) {
        for (let i = 0; i < domPrefixes.length; i++) {
          if (elm.style[domPrefixes[i] + "AnimationName"] !== void 0) {
            pfx = domPrefixes[i];
            keyframeprefix = "-" + pfx.toLowerCase() + "-";
            animationStartEvent = startEvents[i];
            animation = true;
            break;
          }
        }
      }
    }
    animationName = "resizeanim";
    animationKeyframes = "@" + keyframeprefix + "keyframes " + animationName + " { from { opacity: 0; } to { opacity: 0; } } ";
    animationStyle = keyframeprefix + "animation: 1ms " + animationName + "; ";
  }
  const createStyles = function(doc) {
    if (!doc.getElementById("detectElementResize")) {
      const css = (animationKeyframes ? animationKeyframes : "") + ".resize-triggers { " + (animationStyle ? animationStyle : "") + 'visibility: hidden; opacity: 0; } .resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }', head = doc.head || doc.getElementsByTagName("head")[0], style = doc.createElement("style");
      style.id = "detectElementResize";
      style.type = "text/css";
      if (nonce != null) {
        style.setAttribute("nonce", nonce);
      }
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(doc.createTextNode(css));
      }
      head.appendChild(style);
    }
  };
  const addResizeListener = function(element, fn) {
    if (attachEvent) {
      element.attachEvent("onresize", fn);
    } else {
      if (!element.__resizeTriggers__) {
        const doc = element.ownerDocument;
        const elementStyle = windowObject.getComputedStyle(element);
        if (elementStyle && elementStyle.position === "static") {
          element.style.position = "relative";
        }
        createStyles(doc);
        element.__resizeLast__ = {};
        element.__resizeListeners__ = [];
        (element.__resizeTriggers__ = doc.createElement("div")).className = "resize-triggers";
        const expandTrigger = doc.createElement("div");
        expandTrigger.className = "expand-trigger";
        expandTrigger.appendChild(doc.createElement("div"));
        const contractTrigger = doc.createElement("div");
        contractTrigger.className = "contract-trigger";
        element.__resizeTriggers__.appendChild(expandTrigger);
        element.__resizeTriggers__.appendChild(contractTrigger);
        element.appendChild(element.__resizeTriggers__);
        resetTriggers(element);
        element.addEventListener("scroll", scrollListener, true);
        if (animationStartEvent) {
          element.__resizeTriggers__.__animationListener__ = function animationListener(e) {
            if (e.animationName === animationName) {
              resetTriggers(element);
            }
          };
          element.__resizeTriggers__.addEventListener(animationStartEvent, element.__resizeTriggers__.__animationListener__);
        }
      }
      element.__resizeListeners__.push(fn);
    }
  };
  const removeResizeListener = function(element, fn) {
    if (attachEvent) {
      element.detachEvent("onresize", fn);
    } else {
      element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
      if (!element.__resizeListeners__.length) {
        element.removeEventListener("scroll", scrollListener, true);
        if (element.__resizeTriggers__.__animationListener__) {
          element.__resizeTriggers__.removeEventListener(animationStartEvent, element.__resizeTriggers__.__animationListener__);
          element.__resizeTriggers__.__animationListener__ = null;
        }
        try {
          element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
        } catch (e) {
        }
      }
    }
  };
  return {
    addResizeListener,
    removeResizeListener
  };
}
class AutoSizer extends reactExports.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      height: this.props.defaultHeight || 0,
      width: this.props.defaultWidth || 0
    };
    this._autoSizer = null;
    this._detectElementResize = null;
    this._didLogDeprecationWarning = false;
    this._parentNode = null;
    this._resizeObserver = null;
    this._timeoutId = null;
    this._onResize = () => {
      this._timeoutId = null;
      const {
        disableHeight,
        disableWidth,
        onResize
      } = this.props;
      if (this._parentNode) {
        const style = window.getComputedStyle(this._parentNode) || {};
        const paddingLeft = parseFloat(style.paddingLeft || "0");
        const paddingRight = parseFloat(style.paddingRight || "0");
        const paddingTop = parseFloat(style.paddingTop || "0");
        const paddingBottom = parseFloat(style.paddingBottom || "0");
        const rect = this._parentNode.getBoundingClientRect();
        const height = rect.height - paddingTop - paddingBottom;
        const width = rect.width - paddingLeft - paddingRight;
        if (!disableHeight && this.state.height !== height || !disableWidth && this.state.width !== width) {
          this.setState({
            height,
            width
          });
          const maybeLogDeprecationWarning = () => {
            if (!this._didLogDeprecationWarning) {
              this._didLogDeprecationWarning = true;
              console.warn("scaledWidth and scaledHeight parameters have been deprecated; use width and height instead");
            }
          };
          if (typeof onResize === "function") {
            onResize({
              height,
              width,
              // TODO Remove these params in the next major release
              get scaledHeight() {
                maybeLogDeprecationWarning();
                return height;
              },
              get scaledWidth() {
                maybeLogDeprecationWarning();
                return width;
              }
            });
          }
        }
      }
    };
    this._setRef = (autoSizer) => {
      this._autoSizer = autoSizer;
    };
  }
  componentDidMount() {
    const {
      nonce
    } = this.props;
    const parentNode = this._autoSizer ? this._autoSizer.parentNode : null;
    if (parentNode != null && parentNode.ownerDocument && parentNode.ownerDocument.defaultView && parentNode instanceof parentNode.ownerDocument.defaultView.HTMLElement) {
      this._parentNode = parentNode;
      const ResizeObserverInstance = parentNode.ownerDocument.defaultView.ResizeObserver;
      if (ResizeObserverInstance != null) {
        this._resizeObserver = new ResizeObserverInstance(() => {
          this._timeoutId = setTimeout(this._onResize, 0);
        });
        this._resizeObserver.observe(parentNode);
      } else {
        this._detectElementResize = createDetectElementResize(nonce);
        this._detectElementResize.addResizeListener(parentNode, this._onResize);
      }
      this._onResize();
    }
  }
  componentWillUnmount() {
    if (this._parentNode) {
      if (this._detectElementResize) {
        this._detectElementResize.removeResizeListener(this._parentNode, this._onResize);
      }
      if (this._timeoutId !== null) {
        clearTimeout(this._timeoutId);
      }
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
      }
    }
  }
  render() {
    const {
      children,
      defaultHeight,
      defaultWidth,
      disableHeight = false,
      disableWidth = false,
      doNotBailOutOnEmptyChildren = false,
      nonce,
      onResize,
      style = {},
      tagName = "div",
      ...rest
    } = this.props;
    const {
      height,
      width
    } = this.state;
    const outerStyle = {
      overflow: "visible"
    };
    const childParams = {};
    let bailoutOnChildren = false;
    if (!disableHeight) {
      if (height === 0) {
        bailoutOnChildren = true;
      }
      outerStyle.height = 0;
      childParams.height = height;
      childParams.scaledHeight = height;
    }
    if (!disableWidth) {
      if (width === 0) {
        bailoutOnChildren = true;
      }
      outerStyle.width = 0;
      childParams.width = width;
      childParams.scaledWidth = width;
    }
    if (doNotBailOutOnEmptyChildren) {
      bailoutOnChildren = false;
    }
    return reactExports.createElement(tagName, {
      ref: this._setRef,
      style: {
        ...outerStyle,
        ...style
      },
      ...rest
    }, !bailoutOnChildren && children(childParams));
  }
}
export {
  AutoSizer as A,
  FixedSizeList as F
};
