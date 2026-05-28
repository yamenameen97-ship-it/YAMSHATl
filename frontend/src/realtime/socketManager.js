class SocketManager {
  constructor() {
    this.connected = false;
    this.queue = [];
    this.listeners = {};
  }

  connect() {
    this.connected = true;
    console.log("Realtime socket connected");
  }

  reconnect() {
    console.log("Socket reconnect recovery");
    this.connect();
  }

  emit(event, payload) {
    if (!this.connected) {
      this.queue.push({ event, payload });
      return;
    }

    console.log("Emit:", event, payload);
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }
}

export const socketManager = new SocketManager();