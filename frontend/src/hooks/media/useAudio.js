import { useCallback, useEffect, useState } from 'react';
import audioService from '../../services/audio/audioService.js';

export default function useAudio() {
  const [settings, setSettings] = useState(() => audioService.getSettings());

  useEffect(() => {
    setSettings(audioService.getSettings());
    audioService.preload();
    const unsubscribe = audioService.subscribe((nextSettings) => {
      setSettings(nextSettings);
    });
    return () => unsubscribe();
  }, []);

  const update = useCallback((patch = {}) => {
    audioService.updateSettings(patch);
  }, []);

  const setVolume = useCallback((value) => {
    audioService.setVolume(value);
  }, []);

  const setEnabled = useCallback((flag) => {
    audioService.setEnabled(flag);
  }, []);

  const setCategory = useCallback((category, enabled) => {
    audioService.setCategory(category, enabled);
  }, []);

  const play = useCallback((key, options = {}) => audioService.play(key, options), []);
  const stop = useCallback((key) => audioService.stop(key), []);

  return {
    settings,
    update,
    setVolume,
    setEnabled,
    setCategory,
    play,
    stop,
    onMessageReceived: () => audioService.onMessageReceived(),
    onMessageSent: () => audioService.onMessageSent(),
    onMessageSeen: () => audioService.onMessageSeen(),
    onMessageFailed: () => audioService.onMessageFailed(),
    onTyping: () => audioService.onTyping(),
    onNotification: (type) => audioService.onNotification(type),
    startIncomingCall: (video = false) => audioService.startIncomingCall(video),
    stopIncomingCall: () => audioService.stopIncomingCall(),
    endCall: () => audioService.endCall(),
    liveStarted: () => audioService.liveStarted(),
    liveEnded: () => audioService.liveEnded(),
  };
}
