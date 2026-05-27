
class MemoryLeakWatcher {
  start() {
    if (!performance.memory) return;

    setInterval(() => {
      console.log(
        "Used JS Heap:",
        performance.memory.usedJSHeapSize
      );
    }, 10000);
  }
}

export const memoryLeakWatcher =
  new MemoryLeakWatcher();
