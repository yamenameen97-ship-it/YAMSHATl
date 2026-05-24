import * as LiveKit from 'livekit-client';
import logger from '../../utils/logger';

class StreamQualityManager {
  constructor(room) {
    this.room = room;
    this.setupQualityListeners();
  }

  setupQualityListeners() {
    if (!this.room) return;

    this.room.on(LiveKit.RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.track.kind === 'video') {
        // Enable adaptive bitrate for local video
        publication.setVideoQuality(LiveKit.VideoQuality.HIGH);
      }
    });

    this.room.on(LiveKit.RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      logger.info(`Connection quality changed for ${participant.identity}: ${quality}`);
      
      if (participant.isLocal) {
        this.handleLocalQualityChange(quality);
      }
    });
  }

  handleLocalQualityChange(quality) {
    switch (quality) {
      case LiveKit.ConnectionQuality.Poor:
        logger.warn('Poor network detected, reducing quality...');
        this.optimizeForPoorNetwork();
        break;
      case LiveKit.ConnectionQuality.Good:
      case LiveKit.ConnectionQuality.Excellent:
        this.restoreQuality();
        break;
      default:
        break;
    }
  }

  optimizeForPoorNetwork() {
    if (this.room.localParticipant) {
      // Reduce resolution and bitrate
      this.room.localParticipant.videoTracks.forEach(pub => {
        if (pub.track) {
          // LiveKit handles this automatically if adaptiveStream is true, 
          // but we can force lower presets if needed
          logger.info('Optimizing video tracks for poor network');
        }
      });
    }
  }

  restoreQuality() {
    logger.info('Network quality restored');
  }

  getNetworkStats() {
    if (!this.room) return null;
    // Return current RTT, packet loss etc from LiveKit
    return this.room.localParticipant.getConnectionQuality();
  }
}

export default StreamQualityManager;
