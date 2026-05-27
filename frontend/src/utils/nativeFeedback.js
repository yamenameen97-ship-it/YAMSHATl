const FEEDBACK_PATTERNS = {
  soft: 8,
  light: 12,
  medium: [14],
  selection: [8, 24, 10],
  success: [12, 28, 16],
  warning: [18, 40, 24],
};

const SPRING_BASE = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.72,
};

export const YAM_MOTION = {
  spring: SPRING_BASE,
  gentleSpring: {
    type: 'spring',
    stiffness: 210,
    damping: 26,
    mass: 0.8,
  },
  press: {
    scale: 0.96,
    y: 1,
    transition: {
      type: 'spring',
      stiffness: 480,
      damping: 28,
      mass: 0.62,
    },
  },
  softPress: {
    scale: 0.985,
    y: 0.5,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 30,
      mass: 0.66,
    },
  },
  hoverLift: {
    y: -2,
    scale: 1.015,
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function triggerNativeFeedback(kind = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(FEEDBACK_PATTERNS[kind] || FEEDBACK_PATTERNS.light);
}

export function getPressMotion(reduceMotion, intensity = 'medium') {
  if (reduceMotion) return undefined;
  return intensity === 'soft' ? YAM_MOTION.softPress : YAM_MOTION.press;
}

export function getHoverLift(reduceMotion, distance = 2) {
  if (reduceMotion) return undefined;
  return {
    ...YAM_MOTION.hoverLift,
    y: -Math.abs(distance),
  };
}

export function getMessageEntrance(isMe, reduceMotion) {
  if (reduceMotion) return { initial: false, animate: { opacity: 1 } };
  return {
    initial: { opacity: 0, x: isMe ? 20 : -20, y: 14, scale: 0.985 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1],
    },
  };
}

export function getPopMotion(reduceMotion) {
  if (reduceMotion) return { initial: false, animate: { opacity: 1, scale: 1 } };
  return {
    initial: { opacity: 0, scale: 0.9, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.92, y: 6 },
    transition: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
  };
}

export function getReelCardMotion({ reduceMotion, isActive, navDirection }) {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1, scale: 1, x: 0 },
      transition: { duration: 0.2 },
    };
  }

  return {
    initial: { opacity: 0.72, scale: 0.972, x: navDirection > 0 ? 16 : -16, y: 10 },
    animate: {
      opacity: isActive ? 1 : 0.92,
      scale: isActive ? 1 : 0.986,
      x: 0,
      y: 0,
    },
    transition: {
      type: 'spring',
      stiffness: isActive ? 260 : 220,
      damping: 28,
      mass: 0.82,
    },
  };
}

export function getOverlayMotion(reduceMotion) {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.16 },
    };
  }

  return {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.985 },
    transition: YAM_MOTION.gentleSpring,
  };
}
