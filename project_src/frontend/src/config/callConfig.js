const parseEnvUrls = (...values) => values
  .flatMap((value) => String(value || '').split(','))
  .map((value) => value.trim())
  .filter(Boolean);

const stunUrls = parseEnvUrls(
  import.meta.env.VITE_STUN_URL,
  import.meta.env.VITE_STUN_URL_FALLBACK,
  import.meta.env.VITE_STUN_URLS,
);

const turnUrls = parseEnvUrls(
  import.meta.env.VITE_TURN_URL,
  import.meta.env.VITE_TURN_URL_FALLBACK,
  import.meta.env.VITE_TURN_URL_TCP,
  import.meta.env.VITE_TURN_URLS,
);

export const CALL_ICE_SERVERS = [
  {
    urls: stunUrls.length ? stunUrls : [
      'stun:stun.l.google.com:19302',
      'stun:global.stun.twilio.com:3478',
    ],
  },
  ...(turnUrls.length
    ? [{
        urls: turnUrls,
        username: import.meta.env.VITE_TURN_USERNAME || '',
        credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
      }]
    : []),
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
