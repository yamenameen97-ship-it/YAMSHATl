
export function optimizeForMobile() {
  const isMobile =
    /Android|iPhone|iPad/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    document.body.classList.add("mobile-optimized");
  }
}

export function reduceHeavyAnimations() {
  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (prefersReducedMotion) {
    document.body.classList.add(
      "reduced-motion"
    );
  }
}
