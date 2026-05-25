import { motion, useReducedMotion } from 'framer-motion';

export default function Card({ children, className = '', animated = false, ...props }) {
  const prefersReducedMotion = useReducedMotion();
  const classes = `card ${className}`.trim();

  if (!animated || prefersReducedMotion) {
    return (
      <div className={classes} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={classes}
      {...props}
    >
      {children}
    </motion.div>
  );
}
