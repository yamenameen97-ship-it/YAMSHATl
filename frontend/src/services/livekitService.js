import * as LiveKit from 'livekit-client';
import logger from '../utils/logger.js';
import StreamQualityManager from './live/streamQuality.js';

class LiveKitService {
  constructor() {
    this.room = null;
    this.participants = new Map();
    this.connectionState = 'disconnected';
    this.healthCheckInterval = null;
    this.connectionConfig = null;
    this.listeners = new Set();
    this.qualityManager = null;
    // ✅ FIX (2026-06-10): cache آخر MediaStream مرفق لتمكين إعادة الإرفاق التلقائي
    this.remoteMediaStream = null;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  emit(extra = {}) {
    const snapshot = { ...this.getState(), ...extra };
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        logger.warn('LiveKitService listener failed', { message: error?.message });
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:livekit-state', { detail: snapshot }));
    }
  }

  getState() {
    return {
      room: this.room,
      connectionState: this.connectionState,
      participantCount: this.participants.size,
      participants: this.getParticipants(),
      session: this.snapshotSession(),
      quality: this.qualityManager?.getState?.() || null,
      hasRemoteTracks: this.hasRemoteTracks(),
    };
  }

  /**
   * ✅ FIX (2026-06-10): فحص ما إذا كان هناك مسارات وسائط بعيدة فعلياً
   * يُستخدم في `LiveViewer` لمعرفة متى يجب إرفاق الـ <video>.
   */
  hasRemoteTracks() {
    if (!this.room) return false;
    let count = 0;
    this.room.remoteParticipants?.forEach?.((participant) => {
      participant?.trackPublications?.forEach?.((publication) => {
        if (publication?.track?.mediaStreamTrack) count += 1;
      });
    });
    return count > 0;
  }

  /**
   * ✅ FIX (2026-06-10): بناء MediaStream من المسارات البعيدة
   * تُستدعى من LiveViewer لإرفاق الفيديو والصوت معاً.
   */
  buildRemoteMediaStream() {
    if (!this.room) return null;
    const mediaTracks = [];
    this.room.remoteParticipants?.forEach?.((participant) => {
      participant?.trackPublications?.forEach?.((publication) => {
        const mediaTrack = publication?.track?.mediaStreamTrack;
        if (!mediaTrack) return;
        if (!mediaTracks.some((track) => track.id === mediaTrack.id)) {
          mediaTracks.push(mediaTrack);
        }
      });
    });
    if (!mediaTracks.length) {
      this.remoteMediaStream = null;
      return null;
    }
    try {
      const stream = new MediaStream(mediaTracks);
      this.remoteMediaStream = stream;
      return stream;
    } catch (err) {
      logger.warn('Failed to build MediaStream from remote tracks', { message: err?.message });
      return null;
    }
  }

  async connect(serverUrl, token, roomName, userName, options = {}) {
    try {
      // ✅ FIX (2026-06-10): تحقق صارم من المعطيات قبل المتابعة
      if (!serverUrl || !token || !roomName) {
        const missing = [
          !serverUrl && 'serverUrl',
          !token && 'token',
          !roomName && 'roomName',
        ].filter(Boolean).join(', ');
        const errMsg = `LiveKit connect missing: ${missing}. تأكد من تهيئة LIVEKIT_URL/API_KEY/API_SECRET في الخادم.`;
        logger.error(errMsg);
        this.connectionState = 'disconnected';
        this.emit({ error: errMsg });
        return { success: false, error: errMsg };
      }

      const sameSession = this.connectionConfig
        && this.connectionConfig.serverUrl === serverUrl
        && this.connectionConfig.roomName === roomName
        && this.room?.state === LiveKit.ConnectionState.Connected;
      if (sameSession) {
        return { success: true, room: this.room, reused: true, snapshot: this.snapshotSession() };
      }

      await this.disconnect({ preserveConfig: true });

      this.connectionConfig = {
        serverUrl,
        token,
        roomName,
        userName,
        mediaState: options.mediaState || null,
        autoSubscribe: options.autoSubscribe !== false,
      };

      this.room = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: false,
        publishDefaults: {
          audioPreset: options.audioPreset,
          videoSimulcastLayers: [
            LiveKit.VideoPresets.h180,
            LiveKit.VideoPresets.h360,
            LiveKit.VideoPresets.h720,
          ],
        },
      });

      this.qualityManager = new StreamQualityManager(this.room, {
        initialProfile: options.mediaState?.cameraEnabled === false ? 'audioOnly' : 'hd',
      });

      this.bindRoomEvents();
      await this.room.prepareConnection?.(serverUrl, token).catch(() => {});
      await this.room.connect(serverUrl, token, { autoSubscribe: options.autoSubscribe !== false });

      if (options.mediaState) {
        await this.restoreState(options.mediaState).catch(() => {});
      }

      this.connectionState = this.room.state || 'connected';
      this.startHealthCheck(options.healthIntervalMs || 10_000);
      this.emit({ connectedAt: Date.now() });
      return { success: true, room: this.room, qualityManager: this.qualityManager, snapshot: this.snapshotSession() };
    } catch (error) {
      logger.error('LiveKit connection error', { message: error?.message });
      this.connectionState = 'disconnected';
      this.emit({ error: error?.message || 'livekit_connect_error' });
      return { success: false, error: error?.message || 'livekit_connect_error' };
    }
  }

  bindRoomEvents() {
    if (!this.room?.on) return;

    // ✅ FIX (2026-06-10): تسجيل المشاركين الموجودين مسبقاً في الغرفة
    // (المشاهد ينضم بعد المضيف فيجب التقاطه)
    this.room.remoteParticipants?.forEach?.((p) => {
      this.participants.set(p.sid || p.identity, p);
    });

    this.room.on(LiveKit.RoomEvent.ParticipantConnected, (participant) => {
      this.participants.set(participant.sid || participant.identity, participant);
      this.emit({ event: 'participant_connected', participantId: participant.identity || participant.sid });
    });

    this.room.on(LiveKit.RoomEvent.ParticipantDisconnected, (participant) => {
      this.participants.delete(participant.sid || participant.identity);
      this.emit({ event: 'participant_disconnected', participantId: participant.identity || participant.sid });
    });

    this.room.on(LiveKit.RoomEvent.ConnectionStateChanged, (state) => {
      this.connectionState = state;
      this.emit({ event: 'connection_state_changed', state });
    });

    this.room.on(LiveKit.RoomEvent.Reconnecting, () => {
      this.connectionState = 'reconnecting';
      this.emit({ event: 'reconnecting' });
    });

    this.room.on(LiveKit.RoomEvent.Reconnected, async () => {
      this.connectionState = 'connected';
      await this.qualityManager?.collectStats?.().catch(() => {});
      this.emit({ event: 'reconnected' });
    });

    this.room.on(LiveKit.RoomEvent.LocalTrackPublished, async () => {
      await this.qualityManager?.applyProfile?.(this.qualityManager.profile).catch(() => {});
      this.emit({ event: 'local_track_published' });
    });

    // ✅ FIX (2026-06-10): إصدار event عند ظهور كل مسار بعيد جديد
    // مما يسمح لـ LiveViewer بإعادة إرفاق الفيديو فوراً
    this.room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
      this.buildRemoteMediaStream();
      this.emit({
        event: 'track_subscribed',
        trackKind: publication?.kind || track?.kind || '',
        participantId: participant?.identity || participant?.sid || '',
        hasRemoteTracks: true,
      });
    });

    this.room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      this.buildRemoteMediaStream();
      this.emit({
        event: 'track_unsubscribed',
        trackKind: publication?.kind || track?.kind || '',
        participantId: participant?.identity || participant?.sid || '',
      });
    });

    // ✅ FIX (2026-06-10): التقاط حدث نشر المسار البعيد قبل الاشتراك
    if (LiveKit.RoomEvent.TrackPublished) {
      this.room.on(LiveKit.RoomEvent.TrackPublished, (publication, participant) => {
        this.emit({
          event: 'remote_track_published',
          trackKind: publication?.kind || '',
          participantId: participant?.identity || participant?.sid || '',
        });
      });
    }
  }

  startHealthCheck(intervalMs = 10_000) {
    this.stopHealthCheck();
    this.healthCheckInterval = setInterval(async () => {
      if (!this.room) return;
      const quality = await this.qualityManager?.collectStats?.().catch(() => this.qualityManager?.getState?.() || null);
      this.emit({ event: 'health_check', quality });
    }, intervalMs);
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

  snapshotSession() {
    if (!this.connectionConfig) return null;
    return {
      ...this.connectionConfig,
      connectionState: this.connectionState,
      mediaState: this.getMediaState(),
      participantCount: this.participants.size,
      timestamp: Date.now(),
    };
  }

  getMediaState() {
    const localParticipant = this.room?.localParticipant;
    const microphonePublication = Array.from(localParticipant?.audioTrackPublications?.values?.() || [])[0];
    const cameraPublication = Array.from(localParticipant?.videoTrackPublications?.values?.() || [])[0];
    return {
      microphoneEnabled: Boolean(microphonePublication?.track && !microphonePublication?.isMuted),
      cameraEnabled: Boolean(cameraPublication?.track && !cameraPublication?.isMuted),
    };
  }

  async restoreState(mediaState = {}) {
    const tasks = [];
    if (typeof mediaState.microphoneEnabled === 'boolean') {
      tasks.push(this.setMicrophoneEnabled(mediaState.microphoneEnabled));
    }
    if (typeof mediaState.cameraEnabled === 'boolean') {
      tasks.push(this.setCameraEnabled(mediaState.cameraEnabled));
    }
    await Promise.all(tasks);
    return this.getMediaState();
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.room?.localParticipant?.setMicrophoneEnabled) return false;
    await this.room.localParticipant.setMicrophoneEnabled(Boolean(enabled));
    this.emit({ event: 'microphone_toggled', enabled: Boolean(enabled) });
    return true;
  }

  async setCameraEnabled(enabled) {
    if (!this.room?.localParticipant?.setCameraEnabled) return false;
    await this.room.localParticipant.setCameraEnabled(Boolean(enabled));
    this.emit({ event: 'camera_toggled', enabled: Boolean(enabled) });
    return true;
  }

  async disconnect({ preserveConfig = false } = {}) {
    this.stopHealthCheck();
    this.qualityManager?.destroy?.();
    this.qualityManager = null;
    this.participants.clear();
    this.remoteMediaStream = null;

    if (this.room) {
      try {
        await this.room.disconnect();
      } catch (error) {
        logger.warn('LiveKit disconnect failed', { message: error?.message });
      }
      this.room = null;
    }

    this.connectionState = 'disconnected';
    if (!preserveConfig) this.connectionConfig = null;
    this.emit({ event: 'disconnected' });
  }
}

export default new LiveKitService();
