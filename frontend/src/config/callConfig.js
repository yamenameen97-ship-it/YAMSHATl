export const CALL_ICE_SERVERS = [
  {
    urls: [
      import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302',
      import.meta.env.VITE_STUN_URL_FALLBACK || 'stun:global.stun.twilio.com:3478',
    ],
  },
  import.meta.env.VITE_TURN_URL
    ? {
        urls: [import.meta.env.VITE_TURN_URL],
        username: import.meta.env.VITE_TURN_USERNAME || '',
        credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
      }
    : null,
].filter(Boolean);

export const CALL_DEFAULT_SETTINGS = {
  mode: 'voice',
  speaker: true,
  muted: false,
  cameraEnabled: true,
  cameraFacingMode: 'user',
};

export function getCallNetworkSummary() {
  return {
    transport: 'WebRTC',
    stun: CALL_ICE_SERVERS.filter((entry) => String(entry.urls).includes('stun')).flatMap((entry) => entry.urls || []),
    turn: CALL_ICE_SERVERS.filter((entry) => String(entry.urls).includes('turn')).flatMap((entry) => entry.urls || []),
    adaptiveReconnect: true,
  };
}
