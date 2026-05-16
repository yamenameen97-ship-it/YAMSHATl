import {
  __toESM,
  init_define_import_meta_env,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/hooks/useSingleFlight.js
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
function useSingleFlight(asyncFn, options = {}) {
  const fnRef = (0, import_react.useRef)(typeof asyncFn === "function" ? asyncFn : null);
  const inflightRef = (0, import_react.useRef)(null);
  const [loading, setLoading] = (0, import_react.useState)(false);
  const cooldownMs = Number(options.cooldownMs || 0);
  fnRef.current = typeof asyncFn === "function" ? asyncFn : fnRef.current;
  const run = (0, import_react.useCallback)(async (...args) => {
    if (inflightRef.current) return inflightRef.current;
    const runtimeFn = typeof args[0] === "function" ? args.shift() : fnRef.current;
    if (typeof runtimeFn !== "function") {
      throw new TypeError("useSingleFlight requires an async function either in the hook or in run().");
    }
    const promise = (async () => {
      setLoading(true);
      try {
        return await runtimeFn(...args);
      } finally {
        if (cooldownMs > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, cooldownMs));
        }
        inflightRef.current = null;
        setLoading(false);
      }
    })();
    inflightRef.current = promise;
    return promise;
  }, [cooldownMs]);
  return { run, loading, busy: loading };
}

export {
  useSingleFlight
};
