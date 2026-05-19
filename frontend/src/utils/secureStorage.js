export const secureStorage = {
  set(key, value) {
    localStorage.setItem(key, btoa(JSON.stringify(value)));
  },

  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(atob(raw));
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};