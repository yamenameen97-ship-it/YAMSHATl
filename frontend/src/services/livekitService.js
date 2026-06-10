/**
 * 🎥 LiveKit Service — يقتصر على إدارة الاتصال والكاميرا/المايك فقط.
 * ===================================================================
 * المعمارية الجديدة (وفق متطلبات المالك):
 *   connect()              - يربط الغرفة عبر LiveKit
 *   disconnect()           - يقطع الاتصال
 *   enableCamera() / disableCamera()
 *   enableMicrophone() / disableMicrophone()
 *
 * ✅ النشر يتم عبر LiveKit نفسه (room.localParticipant.setCameraEnabled)
 *    ولا نستخدم navigator.getUserMedia() أبداً هنا — هذا هو سبب فشل البث
 *    في النسخة السابقة.
 */

import * as LiveKit from 'livekit-client';
import logger from '../utils/logger.js';

class LiveKitService {
  constructor() {
    this.room = null;
    this.connectionState = 'disconnected';
    this.connectionConfig = null;
    this.listeners = new Set();
    this.remoteTracks = new Map(); // participantIdentity -> { video, audio }
  }

  // ─────────────────────────── State / subscribe ──────────────────────────
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    try { listener(this.getState()); } catch (_) {}
    return () => this.listeners.delete(listener);
  }

  emit(extra = {}) {
    const snapshot = { ...this.getState(), ...extra };
    this.listeners.forEach((fn) => {
      try { fn(snapshot); } catch (e) { logger.warn?.('listener error', { msg: e?.message }); }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamshat:livekit-state', { detail: snapshot }));
    }
  }

  getState() {
    return {
      room: this.room,
      connectionState: this.connectionState,
      isConnected: this.connectionState === 'connected',
      participants: this.getRemoteParticipants(),
      mediaState: this.getMediaState(),
    };
  }

  getRemoteParticipants() {
    if (!this.room) return [];
    const list = [];
    const parts = this.room.remoteParticipants || this.room.participants;
    if (parts && typeof parts.forEach === 'function') {
      parts.forEach((p) => list.push(p));
    }
    return list;
  }

  // ─────────────────────────── connect / disconnect ───────────────────────
  /**
   * يتصل بغرفة LiveKit. إن كان role='host' فسيتم تفعيل الكاميرا والمايك.
   * إن كان role='viewer' فلن نطلب الكاميرا (المشاهد لا يبث).
   */
  async connect({ url, token, role = 'viewer', enableCamera = false, enableMicrophone = false }) {
    if (!url || !token) {
      return { success: false, error: 'missing url or token' };
    }
    try {
      // إذا كنا متصلين سابقاً، نفصل أولاً
      if (this.room) {
        try { await this.room.disconnect(); } catch (_) {}
        this.room = null;
      }
      this.remoteTracks.clear();

      this.connectionConfig = { url, token, role };
      this.connectionState = 'connecting';
      this.emit({ event: 'connecting' });

      this.room = new LiveKit.Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [
            LiveKit.VideoPresets.h180,
            LiveKit.VideoPresets.h360,
            LiveKit.VideoPresets.h720,
          ],
        },
      });

      this.bindRoomEvents();

      // الاتصال الفعلي بـ LiveKit
      await this.room.connect(url, token, { autoSubscribe: true });
      this.connectionState = 'connected';

      // 🔑 host فقط ينشر — LiveKit يفتح الكاميرا/المايك بنفسه (لا getUserMedia يدوي)
      if (role === 'host') {
        if (enableCamera) {
          await this.room.localParticipant.setCameraEnabled(true).catch((e) => {
            logger.warn?.('setCameraEnabled failed', { msg: e?.message });
          });
        }
        if (enableMicrophone) {
          await this.room.localParticipant.setMicrophoneEnabled(true).catch((e) => {
            logger.warn?.('setMicrophoneEnabled failed', { msg: e?.message });
          });
        }
      }

      this.emit({ event: 'connected', role });
      return { success: true, room: this.room };
    } catch (error) {
      logger.error?.('LiveKit connect error', { msg: error?.message });
      this.connectionState = 'disconnected';
      this.emit({ event: 'connect_error', error: error?.message });
      return { success: false, error: error?.message || 'connect_error' };
    }
  }

  async disconnect() {
    try {
      if (this.room) {
        try { await this.room.localParticipant?.setCameraEnabled(false); } catch (_) {}
        try { await this.room.localParticipant?.setMicrophoneEnabled(false); } catch (_) {}
        await this.room.disconnect();
      }
    } catch (e) {
      logger.warn?.('disconnect error', { msg: e?.message });
    } finally {
      this.room = null;
      this.remoteTracks.clear();
      this.connectionState = 'disconnected';
      this.connectionConfig = null;
      this.emit({ event: 'disconnected' });
    }
  }

  // ─────────────────────────── Room events ────────────────────────────────
  bindRoomEvents() {
    if (!this.room) return;

    this.room.on(LiveKit.RoomEvent.ConnectionStateChanged, (state) => {
      this.connectionState = state;
      this.emit({ event: 'state_changed', state });
    });

    this.room.on(LiveKit.RoomEvent.Reconnecting, () => this.emit({ event: 'reconnecting' }));
    this.room.on(LiveKit.RoomEvent.Reconnected, () => this.emit({ event: 'reconnected' }));

    this.room.on(LiveKit.RoomEvent.ParticipantConnected, (p) => {
      this.emit({ event: 'participant_connected', identity: p.identity });
    });
    this.room.on(LiveKit.RoomEvent.ParticipantDisconnected, (p) => {
      this.remoteTracks.delete(p.identity);
      this.emit({ event: 'participant_disconnected', identity: p.identity });
    });

    // 🔑 عند وصول track من المضيف → نخزنه ونُطلق حدث
    this.room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const identity = participant?.identity || '';
      const entry = this.remoteTracks.get(identity) || {};
      if (track.kind === 'video') entry.video = track;
      if (track.kind === 'audio') entry.audio = track;
      this.remoteTracks.set(identity, entry);
      this.emit({
        event: 'track_subscribed',
        identity,
        kind: track.kind,
        track,
      });
    });

    this.room.on(LiveKit.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      const identity = participant?.identity || '';
      const entry = this.remoteTracks.get(identity);
      if (entry) {
        if (track.kind === 'video') delete entry.video;
        if (track.kind === 'audio') delete entry.audio;
      }
      this.emit({ event: 'track_unsubscribed', identity, kind: track.kind });
    });

    this.room.on(LiveKit.RoomEvent.LocalTrackPublished, (publication) => {
      this.emit({ event: 'local_track_published', kind: publication?.kind });
    });

    this.room.on(LiveKit.RoomEvent.Disconnected, () => {
      this.connectionState = 'disconnected';
      this.emit({ event: 'disconnected' });
    });
  }

  // ─────────────────────────── Camera / Mic ───────────────────────────────
  getMediaState() {
    const lp = this.room?.localParticipant;
    if (!lp) return { cameraEnabled: false, microphoneEnabled: false };
    return {
      cameraEnabled: !!lp.isCameraEnabled,
      microphoneEnabled: !!lp.isMicrophoneEnabled,
    };
  }

  async enableCamera() {
    if (!this.room?.localParticipant) return false;
    await this.room.localParticipant.setCameraEnabled(true);
    this.emit({ event: 'camera_enabled' });
    return true;
  }

  async disableCamera() {
    if (!this.room?.localParticipant) return false;
    await this.room.localParticipant.setCameraEnabled(false);
    this.emit({ event: 'camera_disabled' });
    return true;
  }

  async enableMicrophone() {
    if (!this.room?.localParticipant) return false;
    await this.room.localParticipant.setMicrophoneEnabled(true);
    this.emit({ event: 'mic_enabled' });
    return true;
  }

  async disableMicrophone() {
    if (!this.room?.localParticipant) return false;
    await this.room.localParticipant.setMicrophoneEnabled(false);
    this.emit({ event: 'mic_disabled' });
    return true;
  }

  // ─────────────────────────── Local video element (host preview) ─────────
  /**
   * ربط معاينة الكاميرا الخاصة بالمضيف بعنصر <video>.
   * استدعِها بعد connect(role='host', enableCamera=true).
   */
  attachLocalVideo(videoElement) {
    if (!videoElement || !this.room?.localParticipant) return false;
    const pubs = this.room.localParticipant.videoTrackPublications;
    if (!pubs) return false;
    for (const pub of pubs.values()) {
      if (pub?.track && pub.kind === 'video') {
        pub.track.attach(videoElement);
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        return true;
      }
    }
    return false;
  }

  /**
   * ربط فيديو مشارك بعيد (المضيف من جهة المشاهد).
   * تُستدعى عادة من معالج 'track_subscribed'.
   */
  attachRemoteVideo(videoElement, identity = null) {
    if (!videoElement || !this.room) return false;
    // إن لم يُحدد identity، نستخدم أول مشارك عنده فيديو
    const tryAttach = (entry) => {
      if (entry?.video) {
        entry.video.attach(videoElement);
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        return true;
      }
      return false;
    };

    if (identity) {
      return tryAttach(this.remoteTracks.get(identity));
    }
    for (const entry of this.remoteTracks.values()) {
      if (tryAttach(entry)) return true;
    }
    return false;
  }

  /** ربط الصوت البعيد (audio track). */
  attachRemoteAudio(audioElement, identity = null) {
    if (!audioElement || !this.room) return false;
    const tryAttach = (entry) => {
      if (entry?.audio) {
        entry.audio.attach(audioElement);
        return true;
      }
      return false;
    };
    if (identity) return tryAttach(this.remoteTracks.get(identity));
    for (const entry of this.remoteTracks.values()) {
      if (tryAttach(entry)) return true;
    }
    return false;
  }
}

export default new LiveKitService();
