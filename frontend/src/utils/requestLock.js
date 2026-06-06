const activeRequests = new Set();

export function preventDuplicate(key) {
  if (activeRequests.has(key)) return false;

  activeRequests.add(key);

  setTimeout(() => {
    activeRequests.delete(key);
  }, 1500);

  return true;
}