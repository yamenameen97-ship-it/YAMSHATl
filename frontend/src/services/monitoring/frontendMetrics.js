
class FrontendMetrics {
  captureFPS(fps) {
    console.log("FPS:", fps);
  }

  captureMemory(memory) {
    console.log("Memory:", memory);
  }

  captureNetworkLatency(latency) {
    console.log("Latency:", latency);
  }
}

export const frontendMetrics =
  new FrontendMetrics();
