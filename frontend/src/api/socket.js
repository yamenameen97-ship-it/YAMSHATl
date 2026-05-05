import { io } from 'socket.io-client';
import { SOCKET_URL } from './config.js';
import { getAuthToken } from '../utils/auth.js';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1200,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,
  timeout: 15000,
  auth: (cb) => cb({ token: getAuthToken() }),
});

socket.on('connect_error', () => {
  // keep silent in UI, pages already have API fallbacks
});

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!socket.connected) socket.connect();
  });
  window.addEventListener('offline', () => {
    if (socket.connected) socket.disconnect();
  });
}

export default socket;
