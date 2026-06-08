// callService.js
// Lightweight, browser-side WebRTC + signaling glue for 1:1 voice & video calls.
// Pairs with the backend Socket.IO events: call_invite / call_accepted /
// call_rejected / call_ended / call_signal / incoming_call / call_ringing.
//
// Design goals:
// - Allow ChatWindow / CallExperience to start an outgoing call.
// - Allow ANY page (via a global listener) to receive `incoming_call` and
//   display the call sheet — fixes the bug where the callee never saw the call.
// - Survive missing TURN credentials (will still work over the LAN / public STUN).

import socketManager from './socketManager.js';
import { CALL_ICE_SERVERS } from '../config/callConfig.js';

const listeners = new Set();
let activeCall = null; // { callId, peer, mode, role, pc, localStream, remoteStream }
let bootstrapped = false;

function emitState() {
  const snapshot = activeCall
    ? {
        callId: activeCall.callId,
        peer: activeCall.peer,
        mode: activeCall.mode,
        role: activeCall.role,
        status: activeCall.status,
        startedAt: activeCall.startedAt,
        remoteStream: activeCall.remoteStream,
      }
    : null;
  listeners.forEach((listener) => {
    try { listener(snapshot); } catch (_) { /* noop */ }
  });
}

function buildPeerConnection() {
  const pc = new RTCPeerConnection({ iceServers: CALL_ICE_SERVERS });
  pc.onicecandidate = (event) => {
    if (!event.candidate || !activeCall?.peer) return;
    socketManager.emit('call_signal', {
      call_id: activeCall.callId,
      to: activeCall.peer,
      kind: 'ice',
      signal: { candidate: event.candidate },
    }, { queue: false });
  };
  pc.ontrack = (event) => {
    if (!activeCall) return;
    const [remoteStream] = event.streams;
    activeCall.remoteStream = remoteStream || new MediaStream([event.track]);
    emitState();
  };
  pc.onconnectionstatechange = () => {
    if (!activeCall) return;
    if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
      // Let the UI know but don't auto-teardown — user can hit reconnect.
      activeCall.status = pc.connectionState;
      emitState();
    }
  };
  return pc;
}

async function attachLocalMedia(mode) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: mode === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  });
  stream.getTracks().forEach((track) => activeCall.pc.addTrack(track, stream));
  activeCall.localStream = stream;
  return stream;
}

export function subscribe(listener) {
  listeners.add(listener);
  // Push current snapshot synchronously so new subscribers don't miss the
  // active state.
  try {
    listener(activeCall ? {
      callId: activeCall.callId,
      peer: activeCall.peer,
      mode: activeCall.mode,
      role: activeCall.role,
      status: activeCall.status,
      startedAt: activeCall.startedAt,
      remoteStream: activeCall.remoteStream,
    } : null);
  } catch (_) { /* noop */ }
  return () => listeners.delete(listener);
}

export function getActiveCall() {
  return activeCall;
}

export function getLocalStream() {
  return activeCall?.localStream || null;
}

export async function startCall({ peer, mode = 'voice' }) {
  if (activeCall) return activeCall;
  const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  activeCall = {
    callId,
    peer,
    mode,
    role: 'caller',
    status: 'ringing',
    startedAt: Date.now(),
    pc: buildPeerConnection(),
    localStream: null,
    remoteStream: null,
  };
  emitState();
  try {
    await attachLocalMedia(mode);
  } catch (err) {
    // Continue anyway — UI shows the error chip and user can retry.
    activeCall.mediaError = err?.message || 'media_unavailable';
  }
  // Create + send SDP offer up-front so the callee can answer immediately.
  let offer = null;
  try {
    offer = await activeCall.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: mode === 'video' });
    await activeCall.pc.setLocalDescription(offer);
  } catch (err) {
    offer = null;
  }
  socketManager.emit('call_invite', {
    call_id: callId,
    callee: peer,
    mode,
    offer: offer ? { sdp: offer.sdp, type: offer.type } : null,
  }, { queue: false });
  emitState();
  return activeCall;
}

export async function acceptIncomingCall(invite) {
  // `invite` comes from `incoming_call` event payload.
  if (activeCall) return activeCall;
  activeCall = {
    callId: invite.call_id,
    peer: invite.caller,
    mode: invite.mode || 'voice',
    role: 'callee',
    status: 'connecting',
    startedAt: Date.now(),
    pc: buildPeerConnection(),
    localStream: null,
    remoteStream: null,
    pendingOffer: invite.offer || null,
  };
  emitState();
  try {
    await attachLocalMedia(activeCall.mode);
  } catch (err) {
    activeCall.mediaError = err?.message || 'media_unavailable';
  }
  let answer = null;
  try {
    if (activeCall.pendingOffer?.sdp) {
      await activeCall.pc.setRemoteDescription({
        type: activeCall.pendingOffer.type || 'offer',
        sdp: activeCall.pendingOffer.sdp,
      });
      answer = await activeCall.pc.createAnswer();
      await activeCall.pc.setLocalDescription(answer);
    }
  } catch (err) {
    answer = null;
  }
  socketManager.emit('call_answer', {
    call_id: activeCall.callId,
    caller: activeCall.peer,
    mode: activeCall.mode,
    answer: answer ? { sdp: answer.sdp, type: answer.type } : null,
  }, { queue: false });
  activeCall.status = 'connected';
  emitState();
  return activeCall;
}

export function rejectIncomingCall(invite, reason = 'rejected') {
  socketManager.emit('call_reject', {
    call_id: invite.call_id,
    caller: invite.caller,
    reason,
  }, { queue: false });
}

export function endCall(reason = 'hangup') {
  if (!activeCall) return;
  try {
    socketManager.emit('call_end', {
      call_id: activeCall.callId,
      peer: activeCall.peer,
      reason,
    }, { queue: false });
  } catch (_) { /* noop */ }
  try { activeCall.localStream?.getTracks?.().forEach((t) => t.stop()); } catch (_) {}
  try { activeCall.pc?.close?.(); } catch (_) {}
  activeCall = null;
  emitState();
}

export function toggleMute(muted) {
  if (!activeCall?.localStream) return;
  activeCall.localStream.getAudioTracks().forEach((track) => { track.enabled = !muted; });
}

export function toggleCamera(enabled) {
  if (!activeCall?.localStream) return;
  activeCall.localStream.getVideoTracks().forEach((track) => { track.enabled = enabled; });
}

// ---------------------------------------------------------------------------
// Global socket bootstrap: must be called once when the user logs in so that
// `incoming_call` from the backend pops a ringing screen anywhere in the app.
// ---------------------------------------------------------------------------

let incomingInviteHandler = null;
const incomingListeners = new Set();

export function onIncomingCall(listener) {
  incomingListeners.add(listener);
  return () => incomingListeners.delete(listener);
}

function fanoutIncoming(invite) {
  incomingListeners.forEach((listener) => {
    try { listener(invite); } catch (_) { /* noop */ }
  });
}

export function bootstrapCallService() {
  if (bootstrapped) return;
  bootstrapped = true;

  socketManager.on('incoming_call', (payload) => {
    if (!payload) return;
    // If we already have a call, auto-reject the new one to avoid double-call
    // collisions. The remote side will see `call_rejected` with reason 'busy'.
    if (activeCall) {
      rejectIncomingCall(payload, 'busy');
      return;
    }
    incomingInviteHandler = payload;
    fanoutIncoming(payload);
  });

  socketManager.on('call_ringing', (payload) => {
    if (!activeCall || activeCall.callId !== payload?.call_id) return;
    activeCall.status = 'ringing';
    emitState();
  });

  socketManager.on('call_accepted', async (payload) => {
    if (!activeCall || activeCall.callId !== payload?.call_id) return;
    activeCall.status = 'connected';
    if (payload?.answer?.sdp && activeCall.pc) {
      try {
        await activeCall.pc.setRemoteDescription({
          type: payload.answer.type || 'answer',
          sdp: payload.answer.sdp,
        });
      } catch (_) { /* noop */ }
    }
    emitState();
  });

  socketManager.on('call_rejected', (payload) => {
    if (!activeCall || activeCall.callId !== payload?.call_id) return;
    endCall('rejected');
  });

  socketManager.on('call_ended', (payload) => {
    if (!activeCall || activeCall.callId !== payload?.call_id) return;
    try { activeCall.localStream?.getTracks?.().forEach((t) => t.stop()); } catch (_) {}
    try { activeCall.pc?.close?.(); } catch (_) {}
    activeCall = null;
    emitState();
  });

  socketManager.on('call_signal', async (payload) => {
    if (!activeCall || activeCall.callId !== payload?.call_id || !activeCall.pc) return;
    const sig = payload?.signal || {};
    try {
      if (sig.candidate) {
        await activeCall.pc.addIceCandidate(sig.candidate);
      } else if (sig.sdp) {
        await activeCall.pc.setRemoteDescription({
          type: sig.type || (activeCall.role === 'caller' ? 'answer' : 'offer'),
          sdp: sig.sdp,
        });
      }
    } catch (_) { /* noop */ }
  });
}

export function getPendingInvite() {
  return incomingInviteHandler;
}

export function clearPendingInvite() {
  incomingInviteHandler = null;
}

export default {
  bootstrapCallService,
  startCall,
  acceptIncomingCall,
  rejectIncomingCall,
  endCall,
  subscribe,
  onIncomingCall,
  toggleMute,
  toggleCamera,
  getActiveCall,
  getLocalStream,
  getPendingInvite,
  clearPendingInvite,
};
