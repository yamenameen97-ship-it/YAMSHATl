import { useEffect, useState, useCallback } from 'react';
import audioService from '../../services/audio/audioService.js';

/**
 * useAudio() — React hook for the centralized audio engine.
 * Returns reactive settings and convenience play helpers.
 */
export default function useAudio() {
  const [settings, setSettings] = useState(audioService.getSettings());

  useEffect(() => {
    const unsub = audioService.subscribe((s) => setSettings(s));
    return unsub;
  }, []);

  const play = useCallback((key, opts) => audioService.play(key, opts), []);
  const stop = useCallback((key) => audioService.stop(key), []);

  return {
    settings,
    update: (patch) => audioService.updateSettings(patch),
    setVolume: (v) => audioService.setVolume(v),
    setEnabled: (b) => audioService.setEnabled(b),
    setCategory: (cat, b) => audioService.setCategory(cat, b),
    play,
    stop,
    // shortcuts
    onMessageReceived: () => audioService.onMessageReceived(),
    onMessageSent: () => audioService.onMessageSent(),
    onMessageSeen: () => audioService.onMessageSeen(),
    onMessageFailed: () => audioService.onMessageFailed(),
    onTyping: () => audioService.onTyping(),
    onNotification: (t) => audioService.onNotification(t),
    startIncomingCall: (v) => audioService.startIncomingCall(v),
    stopIncomingCall: () => audioService.stopIncomingCall(),
    endCall: () => audioService.endCall(),
    liveStarted: () => audioService.liveStarted(),
    liveEnded: () => audioService.liveEnded(),
  };
}
