import { j as jsxRuntimeExports } from "../index-DuXBJv5q.js";
import { m as motion } from "./proxy-BFepwXo2.js";
function Card({ children, className = "", ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25 },
      className: `card ${className}`.trim(),
      ...props,
      children
    }
  );
}
export {
  Card as C
};
