import { useCallback, useRef, useState } from 'react';

export default function useSingleFlight(asyncFn, options = {}) {
  const fnRef = useRef(asyncFn);
  const inflightRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const cooldownMs = Number(options.cooldownMs || 0);

  fnRef.current = asyncFn;

  const run = useCallback(async (...args) => {
    if (inflightRef.current) return inflightRef.current;

    const promise = (async () => {
      setLoading(true);
      try {
        return await fnRef.current(...args);
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
