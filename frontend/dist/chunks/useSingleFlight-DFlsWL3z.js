import { r as reactExports } from "../index-D6u1FUhW.js";
function useSingleFlight(asyncFn, options = {}) {
  const fnRef = reactExports.useRef(null);
  const inflightRef = reactExports.useRef(null);
  const [loading, setLoading] = reactExports.useState(false);
  const cooldownMs = Number(options.cooldownMs || 0);
  fnRef.current = fnRef.current;
  const run = reactExports.useCallback(async (...args) => {
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
  useSingleFlight as u
};
