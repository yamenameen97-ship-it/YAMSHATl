const memoryStore = new Map();

export function secureGet(key) {
  return memoryStore.get(String(key)) || '';
}

export function secureSet(key, value) {
  memoryStore.set(String(key), String(value ?? ''));
}

export function secureRemove(key) {
  memoryStore.delete(String(key));
}
