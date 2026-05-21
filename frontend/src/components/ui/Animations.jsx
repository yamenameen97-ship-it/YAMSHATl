import { motion } from 'framer-motion';

/**
 * Animation Components using Framer Motion
 * 
 * مكونات الحركات والانتقالات المتقدمة
 */

/**
 * FadeIn Animation
 */
export function FadeIn({ children, delay = 0, duration = 0.3 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
}

/**
 * SlideIn Animation
 */
export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.3,
}) {
  const variants = {
    up: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    down: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
    },
    left: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
    },
    right: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
  };

  return (
    <motion.div
      initial={variants[direction].initial}
      animate={variants[direction].animate}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn Animation
 */
export function ScaleIn({ children, delay = 0, duration = 0.3 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bounce Animation
 */
export function Bounce({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{
        delay,
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse Animation
 */
export function Pulse({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{
        delay,
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Rotate Animation
 */
export function Rotate({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        delay,
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Flip Animation
 */
export function Flip({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ rotateY: 360 }}
      transition={{
        delay,
        duration: 0.6,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shake Animation
 */
export function Shake({ children, delay = 0 }) {
  return (
    <motion.div
      animate={{ x: [-5, 5, -5, 5, 0] }}
      transition={{
        delay,
        duration: 0.4,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Container
 * 
 * حاوية لتطبيق حركات متتالية على الأطفال
 */
export function StaggerContainer({ children, delay = 0 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * Hover Scale
 * 
 * تكبير عند الـ hover
 */
export function HoverScale({ children, scale = 1.05 }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tap Animation
 * 
 * حركة عند الضغط
 */
export function TapAnimation({ children, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Micro Interactions
 * 
 * تفاعلات صغيرة محسّنة
 */

export function LikeButton({ isLiked, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '24px',
      }}
    >
      {isLiked ? '❤️' : '🤍'}
    </motion.button>
  );
}

export function FollowButton({ isFollowing, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        background: isFollowing ? 'var(--bg-soft)' : 'var(--primary)',
        color: isFollowing ? 'var(--text)' : 'white',
        fontWeight: 'bold',
      }}
    >
      {isFollowing ? 'متابع' : 'متابعة'}
    </motion.button>
  );
}

/**
 * Success Animation
 */
export function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        fontSize: '48px',
        textAlign: 'center',
      }}
    >
      ✅
    </motion.div>
  );
}

/**
 * Error Animation
 */
export function ErrorAnimation() {
  return (
    <motion.div
      animate={{ x: [-5, 5, -5, 5, 0] }}
      transition={{ duration: 0.4 }}
      style={{
        fontSize: '48px',
        textAlign: 'center',
      }}
    >
      ❌
    </motion.div>
  );
}

/**
 * Loading Spinner Animation
 */
export function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop',
      }}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid var(--line)',
        borderTopColor: 'var(--primary)',
      }}
    />
  );
}

/**
 * Page Transition
 */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Modal Animation
 */
export function ModalAnimation({ children, isOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Notification Animation
 */
export function NotificationAnimation({ children, type = 'info' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
