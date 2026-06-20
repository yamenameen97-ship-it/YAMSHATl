const state = {
  streams: {},
  viewers: {},
  reactions: {},
  reports: [],
  reconnectQueue: [],
};

export function createLiveRoom(roomId, hostId) {
  state.streams[roomId] = {
    roomId,
    hostId,
    createdAt: Date.now(),
    status: 'live',
    bitrate: 'adaptive',
    quality: 'auto',
  };

  return state.streams[roomId];
}

export function addGuest(roomId, guestId) {
  state.streams[roomId] ??= {};
  state.streams[roomId].guestId = guestId;
  return true;
}

export function addReaction(roomId, reaction) {
  state.reactions[roomId] ??= [];
  state.reactions[roomId].push({
    reaction,
    createdAt: Date.now(),
  });

  return state.reactions[roomId].length;
}

export function updateViewerCount(roomId, count) {
  state.viewers[roomId] = count;
  return count;
}

export function monitorHealth(roomId, stats = {}) {
  return {
    roomId,
    bitrate: stats.bitrate || 'adaptive',
    fps: stats.fps || 30,
    latency: stats.latency || 0,
    droppedFrames: stats.droppedFrames || 0,
    stable: true,
  };
}

export function reconnectStream(roomId) {
  state.reconnectQueue.push({
    roomId,
    recoveredAt: Date.now(),
  });

  return true;
}

export function generateClip(roomId, start, end) {
  return {
    roomId,
    clipStart: start,
    clipEnd: end,
    generated: true,
  };
}

export function recordStream(roomId) {
  return {
    roomId,
    recording: true,
  };
}

export function reportStream(roomId, reason) {
  state.reports.push({
    roomId,
    reason,
    createdAt: Date.now(),
  });

  return true;
}

export function antiRaidProtection(events = []) {
  return events.filter((event) => event.rate < 50);
}

export function optimizeMobileStreaming(network = '4g') {
  return {
    network,
    codec: 'h264',
    bitrate: network === '3g' ? 'low' : 'adaptive',
    lowLatency: true,
  };
}

export default {
  createLiveRoom,
  addGuest,
  addReaction,
  updateViewerCount,
  monitorHealth,
  reconnectStream,
  generateClip,
  recordStream,
  reportStream,
  antiRaidProtection,
  optimizeMobileStreaming,
};