import {
  motion
} from "./chunk-BDBRQ2OX.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_jsx_runtime
} from "./chunk-SOYW6UE7.js";

// src/components/ui/Card.jsx
init_define_import_meta_env();
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Card({ children, className = "", ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
  Card
};
