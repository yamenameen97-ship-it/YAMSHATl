import { motion, useReducedMotion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  animated = false,
  padding = 'md',
  elevation = 'sm',
  tone = 'default',
  as: Tag = 'div',
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();
  const classes = `card card-padding-${padding} card-elevation-${elevation} card-tone-${tone} ${className}`.trim();

  if (!animated || prefersReducedMotion) {
    return (
      <Tag className={classes} {...props}>
        {children}
      </Tag>
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
