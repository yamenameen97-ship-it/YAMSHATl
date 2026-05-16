import { useCallback, useRef, useState } from 'react';

export default function useSingleFlight(asyncFn, options = {}) {
  const fnRef = useRef(typeof asyncFn === 'function' ? asyncFn : null);
  const inflightRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const cooldownMs = Number(options.cooldownMs || 0);

  fnRef.current = typeof asyncFn === 'function' ? asyncFn : fnRef.current;

  const run = useCallback(async (...args) => {
    if (inflightRef.current) return inflightRef.current;

    const runtimeFn = typeof args[0] === 'function' ? args.shift() : fnRef.current;

    if (typeof runtimeFn !== 'function') {
      throw new TypeError('useSingleFlight requires an async function either in the hook or in run().');
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
