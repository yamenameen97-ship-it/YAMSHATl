export function enableBottomNavigation() {
  return true;
}

export function enablePullToRefresh() {
  return true;
}

export function enableGestureNavigation() {
  return true;
}

export function enableHaptics() {
  return navigator?.vibrate ? navigator.vibrate(10) : false;
}

export function enableKeyboardSafeAreas() {
  return {
    safeAreaInsets: true,
  };
}

export function enableNativeTransitions() {
  return true;
}

export function enableSwipeGestures() {
  return true;
}

export function enableFullscreenMode() {
  return document?.documentElement?.requestFullscreen?.();
}

export function optimizeMobileMedia(media = {}) {
  return {
    ...media,
    compressed: true,
    mobileOptimized: true,
  };
}