import { io } from 'socket.io-client';
import { SOCKET_URL } from './config.js';
import { getAuthToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getBackoffDelayMs } from '../utils/retry.js';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 20000,
  randomizationFactor: 0.75,
  timeout: 15000,
  auth: (cb) => cb({ token: getAuthToken() }),
});

socket.io.on('reconnect_attempt', (attempt) => {
  const delay = getBackoffDelayMs(Math.max(0, Number(attempt || 1) - 1), {
    baseDelayMs: 800,
    maxDelayMs: 20000,
    jitterRatio: 0.45,
  });
  socket.io.opts.reconnectionDelay = delay;
  logger.info('socket reconnect attempt scheduled', { attempt, delay });
});

socket.on('connect', () => {
  logger.info('socket connected', { id: socket.id });
});

socket.on('disconnect', (reason) => {
  logger.warn('socket disconnected', { reason });
});

socket.on('connect_error', (error) => {
  logger.warn('socket connection error', { message: error?.message || 'unknown socket error' });
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
