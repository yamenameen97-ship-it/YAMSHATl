// Pure livekit-client implementation. Avoids the unavailable `livekit-react`
// package (which is not declared in package.json) and the build/runtime error
// it produced. Exposes a singleton service used by the LiveKitRoom components
// in the live experience.

import {
  Room,
  RoomEvent,
  ConnectionState,
  VideoPresets,
} from 'livekit-client';
import logger from '../utils/logger.js';

const HEALTH_CHECK_INTERVAL_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 6;

class LiveKitService {
  constructor() {
    this.room = null;
    this.participants = new Map();
    this.connectionState = ConnectionState.Disconnected;
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.lastContext = null;
    this.listeners = new Set();
  }

  isConnected() {
    return this.room?.state === ConnectionState.Connected;
  }

  onStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitState(extra = {}) {
    const snapshot = {
      connectionState: this.connectionState,
      participantCount: this.participants.size,
      reconnectAttempts: this.reconnectAttempts,
      ...extra,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        logger.warn?.('livekit listener failure', err);
      }
    });
  }

  async connect(serverUrl, token, roomName = '', userName = '') {
    if (!serverUrl || !token) {
      return { success: false, error: 'Missing LiveKit server URL or access token' };
    }

    this.lastContext = { serverUrl, token, roomName, userName };

    try {
      // Clean any previous room before creating a new one to avoid leaks.
      if (this.room) {
        try { await this.room.disconnect(); } catch { /* ignore */ }
      }

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360, VideoPresets.h720],
        },
      });

      this.room.on(RoomEvent.ParticipantConnected, (participant) => {
        this.participants.set(participant.sid, participant);
        this.emitState({ event: 'participant_connected', participant: participant.identity });
      });

      this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        this.participants.delete(participant.sid);
        this.emitState({ event: 'participant_disconnected', participant: participant.identity });
      });

      this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
        this.connectionState = state;
        this.emitState({ event: 'connection_state' });
        if (state === ConnectionState.Disconnected) {
          this.attemptReconnection();
        } else if (state === ConnectionState.Connected) {
          this.reconnectAttempts = 0;
        }
      });

      this.room.on(RoomEvent.Reconnecting, () => {
        this.emitState({ event: 'reconnecting' });
      });

      this.room.on(RoomEvent.Reconnected, () => {
        this.reconnectAttempts = 0;
        this.emitState({ event: 'reconnected' });
      });

      this.room.on(RoomEvent.MediaDevicesError, (err) => {
        logger.warn?.('livekit media devices error', err);
        this.emitState({ event: 'media_devices_error', error: String(err?.message || err) });
      });

      await this.room.connect(serverUrl, token, { autoSubscribe: true });
      this.reconnectAttempts = 0;
      this.startHealthCheck();
      this.emitState({ event: 'connected' });
      return { success: true };
    } catch (error) {
      logger.error?.('LiveKit connection error', error);
      this.emitState({ event: 'error', error: String(error?.message || error) });
      // Try to reconnect using exponential backoff if we have context.
      this.attemptReconnection();
      return { success: false, error: error?.message || 'LiveKit connection failed' };
    }
  }

  attemptReconnection() {
    if (!this.lastContext) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error?.('LiveKit: max reconnection attempts reached');
      this.emitState({ event: 'reconnect_exhausted' });
      return;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(MAX_RECONNECT_DELAY_MS, BASE_RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempts - 1));
    const jitter = Math.floor(Math.random() * 500);
    const wait = delay + jitter;
    this.emitState({ event: 'reconnect_scheduled', delayMs: wait });

    setTimeout(() => {
      if (!this.lastContext) return;
      const { serverUrl, token, roomName, userName } = this.lastContext;
      this.connect(serverUrl, token, roomName, userName).catch((err) => {
        logger.warn?.('LiveKit reconnect attempt failed', err);
      });
    }, wait);
  }

  startHealthCheck() {
    this.stopHealthCheck();
    this.healthCheckInterval = setInterval(() => {
      if (!this.isConnected()) return;
      this.emitState({
        event: 'health_check',
        timestamp: Date.now(),
      });
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  getParticipants() {
    return Array.from(this.participants.values());
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.room?.localParticipant) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(Boolean(enabled));
    } catch (err) {
      logger.warn?.('setMicrophoneEnabled failed', err);
    }
  }

  async setCameraEnabled(enabled) {
    if (!this.room?.localParticipant) return;
    try {
      await this.room.localParticipant.setCameraEnabled(Boolean(enabled));
    } catch (err) {
      logger.warn?.('setCameraEnabled failed', err);
    }
  }

  async disconnect() {
    this.stopHealthCheck();
    this.lastContext = null;
    this.reconnectAttempts = 0;
    if (this.room) {
      try { await this.room.disconnect(); } catch { /* ignore */ }
      this.room = null;
    }
    this.participants.clear();
    this.connectionState = ConnectionState.Disconnected;
    this.emitState({ event: 'disconnected' });
  }
}

const liveKitService = new LiveKitService();
export default liveKitService;
