
export async function apiRetry(fn, retries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
