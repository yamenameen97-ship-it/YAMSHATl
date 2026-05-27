
export const accessibilityConfig = {
  enableKeyboardNavigation: true,
  announceRouteChanges: true,
  focusVisible: true,
};

export function focusElement(element) {
  if (element && typeof element.focus === "function") {
    element.focus();
  }
}
