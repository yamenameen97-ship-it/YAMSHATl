import { LiveKitRoom, VideoConference } from 'livekit-react';
import * as LiveKit from 'livekit-client';

class LiveKitService {
  constructor() {
    this.room = null;
    this.participants = new Map();
    this.connectionState = 'disconnected';
    this.healthCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(serverUrl, token, roomName, userName) {
    try {
      this.room = await LiveKit.Room.create({
        audio: true,
        video: { resolution: LiveKit.VideoPresets.h720 },
        adaptiveStream: true, // Bitrate adaptation
        dynacast: true,
      });

      this.room.on(LiveKit.RoomEvent.ParticipantConnected, (participant) => {
        this.participants.set(participant.sid, participant);
        console.log(`Participant connected: ${participant.name}`);
      });

      this.room.on(LiveKit.RoomEvent.ParticipantDisconnected, (participant) => {
        this.participants.delete(participant.sid);
      });

      this.room.on(LiveKit.RoomEvent.ConnectionStateChanged, (state) => {
        this.connectionState = state;
        if (state === LiveKit.ConnectionState.Disconnected) {
          this.attemptReconnection(serverUrl, token, roomName, userName);
        }
      });

      await this.room.connect(serverUrl, token);
      this.reconnectAttempts = 0;
      this.startHealthCheck();
      return { success: true };
    } catch (error) {
      console.error('LiveKit connection error:', error);
      return { success: false, error: error.message };
    }
  }

  async attemptReconnection(serverUrl, token, roomName, userName) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    console.log(`Attempting reconnection in ${delay}ms...`);

    setTimeout(() => {
      this.connect(serverUrl, token, roomName, userName);
    }, delay);
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      if (this.room?.isConnected) {
        const stats = {
          connectionState: this.connectionState,
          participantCount: this.participants.size,
          timestamp: Date.now(),
        };
        console.log('Stream health check:', stats);
      }
    }, 30000);
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
  }

  // Participant sync
  getParticipants() {
    return Array.from(this.participants.values());
  }

  setMicrophoneEnabled(enabled) {
    if (this.room?.localParticipant) {
      this.room.localParticipant.setMicrophoneEnabled(enabled);
    }
  }

  setCameraEnabled(enabled) {
    if (this.room?.localParticipant) {
      this.room.localParticipant.setCameraEnabled(enabled);
    }
  }

  async disconnect() {
    this.stopHealthCheck();
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }
}

export default new LiveKitService();
