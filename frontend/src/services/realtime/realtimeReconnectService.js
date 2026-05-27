
class RealtimeReconnectService {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 10;
  }

  async reconnect(connectFn) {
    while (this.retryCount < this.maxRetries) {
      try {
        await connectFn();
        this.retryCount = 0;
        return true;
      } catch (error) {
        this.retryCount++;

        const delay = Math.min(
          1000 * this.retryCount,
          10000
        );

        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return false;
  }
}

export const realtimeReconnectService =
  new RealtimeReconnectService();
