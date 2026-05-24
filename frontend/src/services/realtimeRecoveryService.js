/**
 * Realtime Recovery Service
 * Handles automatic reconnection and state synchronization after connection loss
 */

class RealtimeRecoveryService {
  constructor() {
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.maxAttempts = 10;
    this.baseDelay = 1000; // 1 second
  }

  /**
   * Initialize recovery listeners
   * @param {Object} socket - The socket.io or websocket instance
   */
  init(socket, onRecovered) {
    this.socket = socket;

    socket.on('disconnect', (reason) => {
      console.warn(`[Recovery] Disconnected: ${reason}`);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.startRecovery(onRecovered);
      }
    });

    socket.on('connect', () => {
      if (this.isReconnecting) {
        console.log('[Recovery] Connection re-established!');
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        if (onRecovered) onRecovered();
      }
    });
  }

  async startRecovery(onRecovered) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    while (this.reconnectAttempts < this.maxAttempts && !this.socket.connected) {
      this.reconnectAttempts++;
      const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`[Recovery] Attempt ${this.reconnectAttempts} in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (this.socket.connected) break;
      
      try {
        this.socket.connect();
      } catch (e) {
        console.error('[Recovery] Connection attempt failed', e);
      }
    }

    if (!this.socket.connected) {
      console.error('[Recovery] Max attempts reached. Manual intervention required.');
      this.isReconnecting = false;
    }
  }

  /**
   * Sync missed data since last connection
   * @param {number} lastSyncTimestamp 
   */
  async syncMissedData(lastSyncTimestamp) {
    if (!this.socket.connected) return;
    
    console.log(`[Recovery] Syncing data since ${new Date(lastSyncTimestamp).toISOString()}`);
    this.socket.emit('sync:request', { since: lastSyncTimestamp });
  }
}

export const realtimeRecoveryService = new RealtimeRecoveryService();
