import { motion } from 'framer-motion';

export default function Card({ children, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`card ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.div>
  );
}
