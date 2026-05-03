import { io } from 'socket.io-client';
import { SOCKET_URL } from './config.js';
import { getAuthToken } from '../utils/auth.js';

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: (cb) => cb({ token: getAuthToken() }),
});

socket.on('connect_error', () => {
  // keep silent in UI, pages already have API fallbacks
});

export default socket;
