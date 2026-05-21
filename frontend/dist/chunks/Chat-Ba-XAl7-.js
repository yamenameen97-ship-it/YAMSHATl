import { j as jsxRuntimeExports, r as reactExports, x as logger, W as DISAPPEARING_MESSAGE_OPTIONS, B as Button, h as socketManager, V as mediaUploadService, o as useParams, u as useNavigate, f as getCurrentUsername, e as useToast, v as useChatStore, q as getChatThreads, X as getMessages, Y as markMessagesSeen, Z as getPresence, $ as getBlockStatus, a0 as Navigate, a1 as sendMessageApi, a2 as deleteMessageApi, m as unblockUserApi, n as blockUserApi } from "../index-DuXBJv5q.js";
import { M as MainLayout } from "./MainLayout-CsZ3tvBx.js";
import { C as Card } from "./Card-qq68bGlj.js";
import { c as formatLastSeen, i as initialsFromName, a as avatarGradient$1, s as statusTicks, d as statusColor } from "./YamshatDesign-C0ca_MnA.js";
import "./proxy-BFepwXo2.js";
function seededBars(seed = "") {
  const source = String(seed || "audio");
  const bars = [];
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let i = 0; i < 24; i += 1) {
    hash ^= i + 31;
    hash = Math.imul(hash, 16777619);
    const height = 20 + Math.abs(hash % 75);
    bars.push(height);
  }
  return bars;
}
function AudioWaveform({ seed, compact = false }) {
  const bars = seededBars(seed);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `audio-waveform ${compact ? "compact" : ""}`, "aria-hidden": "true", children: bars.map((height, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { height: `${height}%` } }, `${seed}-${index}`)) });
}
const CODEC_PRIORITY = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || "";
}
function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function VoiceRecorder({ onSend, onCancel, onStateChange }) {
  const [recordingState, setRecordingState] = reactExports.useState("idle");
  const [duration, setDuration] = reactExports.useState(0);
  const [waveSeed, setWaveSeed] = reactExports.useState(`voice-${Date.now()}`);
  const [previewUrl, setPreviewUrl] = reactExports.useState("");
  const [previewBlob, setPreviewBlob] = reactExports.useState(null);
  const [playbackSpeed, setPlaybackSpeed] = reactExports.useState(1);
  const mediaRecorderRef = reactExports.useRef(null);
  const mediaStreamRef = reactExports.useRef(null);
  const audioChunksRef = reactExports.useRef([]);
  const durationRef = reactExports.useRef(0);
  const timerRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onStateChange?.(recordingState);
  }, [onStateChange, recordingState]);
  reactExports.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (timerRef.current) window.clearInterval(timerRef.current);
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
  }, [previewUrl]);
  const mimeType = reactExports.useMemo(() => pickSupportedMimeType(), []);
  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPreviewBlob(null);
    setPlaybackSpeed(1);
  };
  const startTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1e3);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const startRecording = async () => {
    try {
      clearPreview();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      durationRef.current = 0;
      setDuration(0);
      setWaveSeed(`voice-${Date.now()}`);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : void 0);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stopTimer();
        const blob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        if (!blob.size) {
          setRecordingState("idle");
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(url);
        setRecordingState("preview");
        mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
      };
      recorder.start(250);
      setRecordingState("recording");
      startTimer();
    } catch (error) {
      console.error(error);
      window.alert("لا يمكن الوصول إلى الميكروفون أو المتصفح لا يدعم التسجيل الصوتي.");
    }
  };
  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      setRecordingState("paused");
    }
  };
  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setRecordingState("recording");
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };
  const cancelRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    clearPreview();
    setDuration(0);
    durationRef.current = 0;
    setRecordingState("idle");
    onCancel?.();
  };
  const handleSend = () => {
    if (!previewBlob) return;
    const file = new File([previewBlob], `voice-note-${Date.now()}.${mimeType.includes("ogg") ? "ogg" : "webm"}`, {
      type: mimeType || previewBlob.type || "audio/webm",
      lastModified: Date.now()
    });
    onSend?.({
      blob: previewBlob,
      file,
      durationSeconds: durationRef.current,
      mimeType: file.type,
      waveformSeed: waveSeed
    });
    clearPreview();
    setDuration(0);
    durationRef.current = 0;
    setRecordingState("idle");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 12 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700 }, children: "رسالة صوتية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "var(--muted)" }, children: [
          recordingState === "idle" ? "Opus codec + waveform + playback controls" : null,
          recordingState === "recording" ? "جارٍ التسجيل..." : null,
          recordingState === "paused" ? "التسجيل متوقف مؤقتًا" : null,
          recordingState === "preview" ? "راجع التسجيل قبل الإرسال" : null
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 14, fontWeight: 700, color: recordingState === "recording" ? "#ff7b7b" : "var(--text)" }, children: formatTime(duration) })
    ] }),
    recordingState === "recording" || recordingState === "paused" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AudioWaveform, { seed: waveSeed }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
        recordingState === "recording" ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: pauseRecording, style: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#2e3350", color: "#fff" }, children: "إيقاف مؤقت" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: resumeRecording, style: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#2e3350", color: "#fff" }, children: "استكمال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: stopRecording, style: { padding: "8px 14px", borderRadius: 999, border: "none", background: "#8b5cf6", color: "#fff" }, children: "إنهاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: cancelRecording, style: { padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff" }, children: "إلغاء" })
      ] })
    ] }) : null,
    recordingState === "idle" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: startRecording, style: { padding: "10px 16px", borderRadius: 999, border: "none", background: "#8b5cf6", color: "#fff", fontWeight: 700 }, children: "ابدأ التسجيل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onCancel?.(), style: { padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff" }, children: "رجوع" })
    ] }) : null,
    recordingState === "preview" && previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AudioWaveform, { seed: waveSeed }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { ref: audioRef, src: previewUrl, controls: true, preload: "metadata", style: { width: "100%" }, onLoadedMetadata: () => {
        const mediaDuration = clamp(audioRef.current?.duration || durationRef.current || 0, 0, 3600);
        if (mediaDuration) {
          durationRef.current = Math.round(mediaDuration);
          setDuration(Math.round(mediaDuration));
        }
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: 12, color: "var(--muted)" }, children: "السرعة" }),
        [1, 1.5, 2].map((speed) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setPlaybackSpeed(speed);
              if (audioRef.current) audioRef.current.playbackRate = speed;
            },
            style: {
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: playbackSpeed === speed ? "rgba(139,92,246,0.2)" : "transparent",
              color: "#fff"
            },
            children: [
              "×",
              speed
            ]
          },
          speed
        ))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleSend, style: { padding: "10px 16px", borderRadius: 999, border: "none", background: "#22c55e", color: "#06110a", fontWeight: 700 }, children: "إرسال" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: startRecording, style: { padding: "10px 16px", borderRadius: 999, border: "none", background: "#2e3350", color: "#fff" }, children: "إعادة تسجيل" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: cancelRecording, style: { padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff" }, children: "إلغاء" })
      ] })
    ] }) : null
  ] });
}
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function encodeUtf8(value = "") {
  return textEncoder.encode(String(value ?? ""));
}
function decodeUtf8(value) {
  if (!value) return "";
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return textDecoder.decode(bytes);
}
function bytesToBase64(value) {
  if (!value) return "";
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  const chunkSize = 32768;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
}
function base64ToBytes(value = "") {
  if (!value) return new Uint8Array();
  const binary = window.atob(String(value));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
function randomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}
function bytesToHex(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  return Array.from(bytes, (item) => item.toString(16).padStart(2, "0")).join("");
}
function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
const STORAGE_PREFIX = "yamshat-signal-protocol";
const DEFAULT_DEVICE_ID = 1;
const PREKEY_BATCH_SIZE = 24;
const CURVE = "P-256";
function storageKey(username) {
  return `${STORAGE_PREFIX}:${String(username || "guest").trim().toLowerCase()}`;
}
function readState(username) {
  if (typeof window === "undefined") return null;
  return safeJsonParse(window.localStorage.getItem(storageKey(username)), null);
}
function writeState(username, state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(username), JSON.stringify(state));
}
function currentTimestamp() {
  return Date.now();
}
function randomId() {
  return Math.floor(1e3 + Math.random() * 9e5);
}
function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}
function numberToBytes(value = 0) {
  const view = new DataView(new ArrayBuffer(4));
  view.setUint32(0, Number(value) >>> 0);
  return new Uint8Array(view.buffer);
}
async function exportPublicKey(key, format = "raw") {
  return bytesToBase64(new Uint8Array(await crypto.subtle.exportKey(format, key)));
}
async function exportPrivateKey(key) {
  return bytesToBase64(new Uint8Array(await crypto.subtle.exportKey("pkcs8", key)));
}
async function importAgreementPublicKey(value) {
  return crypto.subtle.importKey("raw", base64ToBytes(value), { name: "ECDH", namedCurve: CURVE }, true, []);
}
async function importAgreementPrivateKey(value) {
  return crypto.subtle.importKey("pkcs8", base64ToBytes(value), { name: "ECDH", namedCurve: CURVE }, true, ["deriveBits"]);
}
async function importSigningPrivateKey(value) {
  return crypto.subtle.importKey("pkcs8", base64ToBytes(value), { name: "ECDSA", namedCurve: CURVE }, true, ["sign"]);
}
async function sha256Bytes(...buffers) {
  const parts = buffers.map((item) => item instanceof Uint8Array ? item : new Uint8Array(item || []));
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((part) => {
    merged.set(part, offset);
    offset += part.length;
  });
  return new Uint8Array(await crypto.subtle.digest("SHA-256", merged));
}
async function deriveSecret(privateKey, publicKey) {
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: publicKey }, privateKey, 256);
  return new Uint8Array(bits);
}
async function hkdf(inputKeyMaterial, label, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey("raw", inputKeyMaterial, "HKDF", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits({
    name: "HKDF",
    hash: "SHA-256",
    salt: saltBytes,
    info: encodeUtf8(label)
  }, keyMaterial, 256);
  return new Uint8Array(derivedBits);
}
async function encryptAesGcm(rawKey, iv, plaintext, additionalData) {
  const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData }, key, plaintext);
  return new Uint8Array(ciphertext);
}
async function decryptAesGcm(rawKey, iv, ciphertext, additionalData) {
  const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData }, key, ciphertext);
  return new Uint8Array(plaintext);
}
function pickOnePreKey(state) {
  return ensureArray(state?.preKeys).find((item) => !item.usedAt) || ensureArray(state?.preKeys)[0] || null;
}
class SignalProtocolService {
  async generateAgreementKeyPair() {
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: CURVE }, true, ["deriveBits"]);
    return {
      publicKey: await exportPublicKey(pair.publicKey),
      privateKey: await exportPrivateKey(pair.privateKey)
    };
  }
  async generateSigningKeyPair() {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: CURVE }, true, ["sign", "verify"]);
    return {
      publicKey: await exportPublicKey(pair.publicKey),
      privateKey: await exportPrivateKey(pair.privateKey)
    };
  }
  async signBytes(privateKeyB64, payloadBytes) {
    const privateKey = await importSigningPrivateKey(privateKeyB64);
    const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, payloadBytes);
    return bytesToBase64(new Uint8Array(signature));
  }
  async createSignedPreKeyRecord(identity, id = randomId()) {
    const agreement = await this.generateAgreementKeyPair();
    const signature = await this.signBytes(identity.signing.privateKey, base64ToBytes(agreement.publicKey));
    return {
      id,
      publicKey: agreement.publicKey,
      privateKey: agreement.privateKey,
      signature,
      createdAt: currentTimestamp()
    };
  }
  async createPreKeys(count = PREKEY_BATCH_SIZE) {
    const results = [];
    for (let index = 0; index < count; index += 1) {
      const agreement = await this.generateAgreementKeyPair();
      results.push({
        id: randomId() + index,
        publicKey: agreement.publicKey,
        privateKey: agreement.privateKey,
        createdAt: currentTimestamp(),
        usedAt: null
      });
    }
    return results;
  }
  async initializeIdentity(username) {
    if (!username) return null;
    const existing = readState(username);
    if (existing?.identity?.agreement?.publicKey && existing?.identity?.signing?.publicKey && existing?.signedPreKey?.publicKey) {
      return existing;
    }
    const identity = {
      agreement: await this.generateAgreementKeyPair(),
      signing: await this.generateSigningKeyPair()
    };
    const signedPreKey = await this.createSignedPreKeyRecord(identity);
    const preKeys = await this.createPreKeys();
    const state = {
      version: 1,
      username,
      deviceId: DEFAULT_DEVICE_ID,
      registrationId: randomId(),
      createdAt: currentTimestamp(),
      protocol: "signal-style-ratchet",
      identity,
      signedPreKey,
      preKeys,
      peerBundles: {},
      sessions: {},
      serverSupport: Boolean(typeof window !== "undefined" && window.APP_SIGNAL_SERVER_SUPPORT || false)
    };
    writeState(username, state);
    return state;
  }
  async topUpPreKeys(username, minimum = 8) {
    const state = await this.initializeIdentity(username);
    if (!state) return null;
    const available = ensureArray(state.preKeys).filter((item) => !item.usedAt).length;
    if (available >= minimum) return state;
    const additional = await this.createPreKeys(PREKEY_BATCH_SIZE - available);
    const nextState = { ...state, preKeys: [...ensureArray(state.preKeys), ...additional] };
    writeState(username, nextState);
    return nextState;
  }
  async rotateSignedPreKey(username) {
    const state = await this.initializeIdentity(username);
    if (!state) return null;
    const signedPreKey = await this.createSignedPreKeyRecord(state.identity);
    const nextState = { ...state, signedPreKey, signedPreKeyRotatedAt: currentTimestamp() };
    writeState(username, nextState);
    return nextState;
  }
  async exportPublicBundle(username) {
    const state = await this.topUpPreKeys(username);
    if (!state) return null;
    return {
      username,
      registrationId: state.registrationId,
      deviceId: state.deviceId,
      identityKey: state.identity.agreement.publicKey,
      identitySigningKey: state.identity.signing.publicKey,
      signedPreKey: {
        id: state.signedPreKey.id,
        publicKey: state.signedPreKey.publicKey,
        signature: state.signedPreKey.signature,
        createdAt: state.signedPreKey.createdAt
      },
      preKeys: ensureArray(state.preKeys).filter((item) => !item.usedAt).slice(0, 10).map(({ id, publicKey, createdAt }) => ({ id, publicKey, createdAt })),
      protocol: state.protocol,
      ratchet: "hkdf-chain-key",
      createdAt: state.createdAt
    };
  }
  async registerPeerBundle(username, peer, bundle) {
    if (!username || !peer || !bundle?.identityKey || !bundle?.signedPreKey?.publicKey) return null;
    const state = await this.initializeIdentity(username);
    if (!state) return null;
    const nextState = {
      ...state,
      peerBundles: {
        ...state.peerBundles || {},
        [peer]: {
          ...bundle || {},
          registeredAt: currentTimestamp()
        }
      }
    };
    writeState(username, nextState);
    return nextState.peerBundles[peer];
  }
  async generateFingerprint(username, peer) {
    const state = await this.initializeIdentity(username);
    const peerBundle = state?.peerBundles?.[peer];
    if (!peerBundle?.identityKey) return "";
    const digest = await sha256Bytes(base64ToBytes(state.identity.agreement.publicKey), base64ToBytes(peerBundle.identityKey));
    const display = bytesToHex(digest).toUpperCase();
    return display.match(/.{1,5}/g)?.slice(0, 12).join(" ") || display;
  }
  async deriveSessionMaterial(username, peer) {
    const state = await this.initializeIdentity(username);
    const peerBundle = state?.peerBundles?.[peer];
    if (!state || !peerBundle?.identityKey || !peerBundle?.signedPreKey?.publicKey) {
      return { state, session: null, reason: "missing-peer-bundle" };
    }
    const existing = state.sessions?.[peer];
    if (existing?.chainKey) {
      const fingerprint2 = await this.generateFingerprint(username, peer);
      return { state, session: existing, fingerprint: fingerprint2 };
    }
    const localIdentityPrivate = await importAgreementPrivateKey(state.identity.agreement.privateKey);
    const localSignedPreKeyPrivate = await importAgreementPrivateKey(state.signedPreKey.privateKey);
    const remoteIdentityPublic = await importAgreementPublicKey(peerBundle.identityKey);
    const remoteSignedPreKeyPublic = await importAgreementPublicKey(peerBundle.signedPreKey.publicKey);
    const secretA = await deriveSecret(localIdentityPrivate, remoteSignedPreKeyPublic);
    const secretB = await deriveSecret(localSignedPreKeyPrivate, remoteIdentityPublic);
    const secretC = await sha256Bytes(secretA, secretB, encodeUtf8(`${username}:${peer}:double-ratchet`));
    const salt = await sha256Bytes(base64ToBytes(state.identity.agreement.publicKey), base64ToBytes(peerBundle.identityKey));
    const rootKey = await hkdf(secretC, "yamshat-root-key", salt);
    const chainKey = await hkdf(rootKey, "yamshat-chain-key", salt);
    const preKey = pickOnePreKey(state);
    const fingerprint = await this.generateFingerprint(username, peer);
    const session = {
      sessionId: `${username}:${peer}:${currentTimestamp()}`,
      protocol: state.protocol,
      status: "established",
      fingerprint,
      preKeyId: preKey?.id || null,
      rootKey: bytesToBase64(rootKey),
      chainKey: bytesToBase64(chainKey),
      sendingCounter: 0,
      receivingCounter: 0,
      createdAt: currentTimestamp(),
      lastRotateAt: currentTimestamp()
    };
    const nextState = {
      ...state,
      preKeys: ensureArray(state.preKeys).map((item) => item.id === preKey?.id ? { ...item, usedAt: currentTimestamp() } : item),
      sessions: {
        ...state.sessions || {},
        [peer]: session
      }
    };
    writeState(username, nextState);
    return { state: nextState, session, fingerprint };
  }
  async encryptMessage({ username, peer, plaintext }) {
    if (!plaintext) {
      return { enabled: false, plaintext, reason: "empty-message" };
    }
    const { state, session, fingerprint, reason } = await this.deriveSessionMaterial(username, peer);
    if (!session) {
      return {
        enabled: false,
        plaintext,
        reason,
        publicBundle: await this.exportPublicBundle(username)
      };
    }
    const nextCounter = Number(session.sendingCounter || 0) + 1;
    const seed = base64ToBytes(session.chainKey);
    const salt = await sha256Bytes(numberToBytes(nextCounter), encodeUtf8(`${username}:${peer}:ratchet`));
    const ratchetKey = await hkdf(seed, "yamshat-ratchet-key", salt);
    const nextChainKey = await hkdf(ratchetKey, "yamshat-next-chain", salt);
    const iv = randomBytes(12);
    const additionalData = encodeUtf8(`${username}|${peer}|${nextCounter}`);
    const ciphertext = await encryptAesGcm(ratchetKey, iv, encodeUtf8(plaintext), additionalData);
    const nextState = {
      ...state,
      sessions: {
        ...state.sessions || {},
        [peer]: {
          ...session,
          chainKey: bytesToBase64(nextChainKey),
          sendingCounter: nextCounter,
          lastRotateAt: currentTimestamp()
        }
      }
    };
    writeState(username, nextState);
    return {
      enabled: true,
      algorithm: "WebCrypto ECDH + HKDF + AES-GCM",
      counter: nextCounter,
      sessionId: session.sessionId,
      fingerprint,
      ciphertext: bytesToBase64(ciphertext),
      nonce: bytesToBase64(iv),
      associatedData: bytesToBase64(additionalData),
      publicBundle: await this.exportPublicBundle(username)
    };
  }
  async decryptMessage({ username, peer, payload }) {
    const { state, session } = await this.deriveSessionMaterial(username, peer);
    if (!session || !payload?.ciphertext) return payload?.plaintext || "";
    const nextCounter = Number(payload?.counter || session.receivingCounter || 0);
    const seed = base64ToBytes(session.chainKey);
    const salt = await sha256Bytes(numberToBytes(nextCounter), encodeUtf8(`${username}:${peer}:ratchet`));
    const ratchetKey = await hkdf(seed, "yamshat-ratchet-key", salt);
    const nextChainKey = await hkdf(ratchetKey, "yamshat-next-chain", salt);
    const plaintext = await decryptAesGcm(
      ratchetKey,
      base64ToBytes(payload.nonce),
      base64ToBytes(payload.ciphertext),
      base64ToBytes(payload.associatedData)
    );
    const nextState = {
      ...state,
      sessions: {
        ...state.sessions || {},
        [peer]: {
          ...session,
          chainKey: bytesToBase64(nextChainKey),
          receivingCounter: nextCounter,
          lastRotateAt: currentTimestamp()
        }
      }
    };
    writeState(username, nextState);
    return decodeUtf8(plaintext);
  }
  async getSecuritySnapshot(username, peer) {
    try {
      const state = await this.initializeIdentity(username);
      if (!state) {
        return { enabled: false, status: "disabled", reason: "missing-user" };
      }
      const session = state.sessions?.[peer] || null;
      const peerBundle = state.peerBundles?.[peer] || null;
      const fingerprint = peerBundle ? await this.generateFingerprint(username, peer) : "";
      return {
        enabled: true,
        status: session?.status || (peerBundle ? "bundle-ready" : "waiting-peer-bundle"),
        protocol: state.protocol,
        registrationId: state.registrationId,
        deviceId: state.deviceId,
        availablePreKeys: ensureArray(state.preKeys).filter((item) => !item.usedAt).length,
        signedPreKeyId: state.signedPreKey?.id || null,
        fingerprint,
        serverSupport: Boolean(state.serverSupport),
        sessionId: session?.sessionId || null,
        lastRotateAt: session?.lastRotateAt || state.signedPreKey?.createdAt || state.createdAt
      };
    } catch (error) {
      logger.warn("Failed to compute security snapshot", { message: error?.message });
      return { enabled: false, status: "failed", reason: error?.message || "security-error" };
    }
  }
}
const signalProtocolService = new SignalProtocolService();
function emitToast(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("yamshat:toast", { detail }));
}
function attachmentKind(file) {
  if (file?.type?.startsWith("image/")) return "image";
  if (file?.type?.startsWith("video/")) return "video";
  if (file?.type?.startsWith("audio/")) return "audio";
  return "file";
}
function createAttachmentEntry(file) {
  const kind = attachmentKind(file);
  const previewUrl = ["image", "video", "audio"].includes(kind) ? URL.createObjectURL(file) : "";
  return {
    id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    kind,
    previewUrl,
    status: "queued",
    progress: 0,
    stage: "queued",
    error: "",
    uploadResult: null
  };
}
function revokeAttachments(entries = []) {
  entries.forEach((entry) => {
    if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  });
}
function timerLabel(value) {
  const option = DISAPPEARING_MESSAGE_OPTIONS.find((item) => Number(item.value) === Number(value));
  return option?.label || "بدون";
}
function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot, disabled = false, compact = false }) {
  const [text, setText] = reactExports.useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = reactExports.useState(false);
  const [attachments, setAttachments] = reactExports.useState([]);
  const [sending, setSending] = reactExports.useState(false);
  const [isRecording, setIsRecording] = reactExports.useState(false);
  const [messageTimer, setMessageTimer] = reactExports.useState(0);
  const typingTimeoutRef = reactExports.useRef(null);
  const isTypingRef = reactExports.useRef(false);
  const fileInputRef = reactExports.useRef(null);
  const attachmentsRef = reactExports.useRef([]);
  reactExports.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  reactExports.useEffect(() => () => {
    revokeAttachments(attachmentsRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);
  const pendingAttachmentCount = reactExports.useMemo(
    () => attachments.filter((item) => item.status === "queued" || item.status === "uploading").length,
    [attachments]
  );
  const composerDisabled = disabled || !peer;
  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (peer) {
      socketManager.emit("chat_typing", { receiver: peer, is_typing: false });
    }
  };
  const emitRecordingState = (value) => {
    if (composerDisabled) return;
    setIsRecording(value === "recording" || value === "paused");
    if (peer) {
      socketManager.emit("chat_recording", { receiver: peer, is_recording: value === "recording" || value === "paused" });
    }
  };
  const handleTyping = (nextValue) => {
    if (composerDisabled) return;
    setText(nextValue);
    if (!peer) return;
    if (!isTypingRef.current && nextValue.trim()) {
      isTypingRef.current = true;
      socketManager.emit("chat_typing", { receiver: peer, is_typing: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 1800);
  };
  const updateAttachment = (attachmentId, patch) => {
    setAttachments((prev) => prev.map((item) => item.id === attachmentId ? { ...item, ...patch || {} } : item));
  };
  const resetComposer = () => {
    revokeAttachments(attachments);
    setText("");
    setAttachments([]);
    setSending(false);
    setShowVoiceRecorder(false);
    setIsRecording(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onCancelReply) onCancelReply();
    stopTyping();
    if (peer) socketManager.emit("chat_recording", { receiver: peer, is_recording: false });
  };
  const handleFilesAdded = (fileList) => {
    if (composerDisabled) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const accepted = [];
    const rejected = [];
    files.forEach((file) => {
      try {
        mediaUploadService.validate(file);
        accepted.push(createAttachmentEntry(file));
      } catch (error) {
        rejected.push({ file, error: error?.message || "ملف غير صالح" });
      }
    });
    if (accepted.length) {
      setAttachments((prev) => [...prev, ...accepted]);
      setShowVoiceRecorder(false);
    }
    if (rejected.length) {
      emitToast({
        type: "error",
        title: "بعض الملفات مرفوضة",
        description: rejected.map((item) => `${item.file.name}: ${item.error}`).join(" | ")
      });
    }
  };
  const removeAttachment = (attachmentId) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === attachmentId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== attachmentId);
    });
  };
  const uploadAttachment = async (entry) => {
    updateAttachment(entry.id, { status: "uploading", progress: 0, stage: "preparing", error: "" });
    try {
      const uploadResult = await mediaUploadService.uploadFile(entry.file, {
        onProgress: (payload) => {
          updateAttachment(entry.id, {
            status: payload?.percent >= 100 ? "uploaded" : "uploading",
            progress: Number(payload?.percent || 0),
            stage: payload?.stage || "uploading"
          });
        }
      });
      updateAttachment(entry.id, { status: "uploaded", progress: 100, stage: "done", uploadResult });
      return uploadResult;
    } catch (error) {
      updateAttachment(entry.id, { status: "failed", error: error?.message || "فشل الرفع", stage: "failed" });
      throw error;
    }
  };
  const buildMessageSecurityPayload = async (plainText) => {
    if (!currentUser || !peer || !plainText.trim()) return null;
    try {
      return await signalProtocolService.encryptMessage({
        username: currentUser,
        peer,
        plaintext: plainText.trim()
      });
    } catch (error) {
      emitToast({ type: "warning", title: "تعذر تجهيز طبقة التشفير", description: error?.message || "سيتم الإرسال بتوافقية مؤقتة." });
      return null;
    }
  };
  const handleSend = async () => {
    if (composerDisabled || sending || !text.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const uploadResults = await Promise.all(attachments.map((entry) => uploadAttachment(entry)));
      const securityPayload = await buildMessageSecurityPayload(text);
      await onSend?.({
        text: text.trim(),
        media_url: uploadResults[0]?.mediaUrl || "",
        media_urls: uploadResults.map((item) => item.mediaUrl).filter(Boolean),
        attachments: uploadResults,
        type: uploadResults.length ? uploadResults[0]?.mediaType || "media" : "text",
        replyTo,
        securityPayload,
        disappearing_in_seconds: Number(messageTimer || 0),
        message_status: {
          sent: false,
          delivered: false,
          seen: false,
          typing: false,
          recording: false
        }
      });
      resetComposer();
    } catch (error) {
      emitToast({
        type: "error",
        title: "تعذر إرسال الرسالة",
        description: error?.response?.data?.detail || error?.message || "حاول مرة تانية."
      });
      setSending(false);
    }
  };
  const handleVoiceSend = async (voicePayload) => {
    if (composerDisabled) return;
    setSending(true);
    try {
      const upload = await mediaUploadService.uploadVoiceNote(voicePayload.file, {
        fileName: voicePayload.file.name,
        onProgress: () => {
        }
      });
      await onSend?.({
        text: "",
        media_url: upload.mediaUrl,
        media_urls: [upload.mediaUrl],
        attachments: [upload],
        type: "voice",
        waveform_seed: voicePayload.waveformSeed,
        audio_duration_seconds: voicePayload.durationSeconds,
        replyTo,
        securityPayload: null,
        disappearing_in_seconds: Number(messageTimer || 0),
        message_status: {
          sent: false,
          delivered: false,
          seen: false,
          typing: false,
          recording: false
        }
      });
      resetComposer();
    } catch (error) {
      emitToast({ type: "error", title: "فشل إرسال التسجيل", description: error?.message || "جرّب مرة تانية." });
      setSending(false);
    }
  };
  const signalSummary = securitySnapshot?.enabled ? `${securitySnapshot.protocol || "Signal"} • ${securitySnapshot.status || "ready"}` : "Signal bootstrap pending";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        padding: compact ? 10 : 12,
        background: compact ? "rgba(8,15,29,0.96)" : "#111827",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "grid",
        gap: 10
      },
      children: [
        !compact ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "var(--muted)" }, children: [
            "🔐 ",
            signalSummary
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: 12, color: "var(--muted)" }, children: "الرسائل المختفية" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: messageTimer, disabled: composerDisabled, onChange: (event) => setMessageTimer(Number(event.target.value || 0)), style: { background: "#0f172a", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 10px" }, children: DISAPPEARING_MESSAGE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 12, color: "var(--muted)" }, children: [
              "⏱ ",
              timerLabel(messageTimer)
            ] })
          ] })
        ] }) : null,
        replyTo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: compact ? "8px 10px" : "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 14, gap: 10 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, borderRight: "2px solid var(--primary)", paddingRight: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: "bold" }, children: [
              "الرد على ",
              replyTo.sender
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { opacity: 0.75 }, children: replyTo.content || replyTo.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onCancelReply, disabled: composerDisabled, style: { background: "none", border: "none", color: "white" }, children: "×" })
        ] }) : null,
        attachments.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: 8 }, children: attachments.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 8, padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }, children: [
              entry.previewUrl && entry.kind === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: entry.previewUrl, alt: entry.file.name, style: { width: 56, height: 56, borderRadius: 12, objectFit: "cover" } }) : null,
              entry.previewUrl && entry.kind === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: entry.previewUrl, style: { width: 56, height: 56, borderRadius: 12, objectFit: "cover" } }) : null,
              entry.kind === "audio" && entry.previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: entry.previewUrl, controls: true, style: { maxWidth: 220 } }) : null,
              !entry.previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 56, height: 56, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(139,92,246,0.15)" }, children: "📄" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: entry.file.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "var(--muted)" }, children: [
                  entry.stage,
                  " • ",
                  entry.progress,
                  "%"
                ] }),
                entry.error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, color: "#fca5a5" }, children: entry.error }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => removeAttachment(entry.id), disabled: composerDisabled, style: { background: "none", border: "none", color: "#fca5a5" }, children: "حذف" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: `${entry.progress}%`, height: "100%", background: entry.status === "failed" ? "#ef4444" : "#8b5cf6", transition: "width 0.2s ease" } }) })
        ] }, entry.id)) }) : null,
        showVoiceRecorder ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          VoiceRecorder,
          {
            onStateChange: emitRecordingState,
            onSend: handleVoiceSend,
            onCancel: () => {
              emitRecordingState("idle");
              setShowVoiceRecorder(false);
            }
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, direction: "rtl" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: composerDisabled, style: { background: "none", border: "none", fontSize: 20 }, onClick: () => emitToast({ type: "info", title: "الإيموجي", description: "استخدم لوحة الإيموجي في جهازك أو لوحة المفاتيح." }), children: "😊" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { cursor: composerDisabled ? "not-allowed" : "pointer", opacity: composerDisabled ? 0.55 : 1 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", hidden: true, multiple: true, disabled: composerDisabled, onChange: (event) => handleFilesAdded(event.target.files) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 20 }, children: "📎" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              disabled: composerDisabled,
              onClick: () => setShowVoiceRecorder((prev) => !prev),
              style: {
                background: showVoiceRecorder || isRecording ? "#8b5cf6" : "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                width: compact ? 46 : 40,
                height: compact ? 46 : 40,
                borderRadius: compact ? 16 : "50%",
                color: "white",
                flexShrink: 0
              },
              children: "🎤"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              disabled: composerDisabled,
              placeholder: disabled ? "المحادثة معطلة حالياً" : peer ? `اكتب رسالة إلى ${peer}...` : "اكتب رسالة...",
              value: text,
              onChange: (event) => handleTyping(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              },
              style: {
                flex: 1,
                minWidth: 0,
                background: "#1f2937",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: compact ? "15px 18px" : "12px 14px",
                borderRadius: compact ? 20 : 18,
                color: "white",
                outline: "none",
                minHeight: compact ? 54 : 48
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSend, loading: sending, disabled: composerDisabled || sending || !text.trim() && attachments.length === 0, children: "إرسال" })
        ] }),
        compact ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, color: "#94a3b8", fontSize: 11 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: pendingAttachmentCount > 0 ? `مرفقات قيد الإرسال: ${pendingAttachmentCount}` : "مساحة كتابة واسعة بدون هيدر جانبي" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: messageTimer ? `الاختفاء: ${timerLabel(messageTimer)}` : "الرسائل العادية مفعلة" })
        ] }) : null
      ]
    }
  );
}
const parseEnvUrls = (...values) => values.flatMap((value) => String(value || "").split(",")).map((value) => value.trim()).filter(Boolean);
const stunUrls = parseEnvUrls(
  "stun:stun.relay.metered.ca:80",
  "stun:stun.l.google.com:19302",
  "stun:stun.relay.metered.ca:80,stun:stun.l.google.com:19302"
);
const turnUrls = parseEnvUrls(
  "turn:global.relay.metered.ca:80",
  "turn:global.relay.metered.ca:443",
  "turns:global.relay.metered.ca:443?transport=tcp",
  "turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp"
);
const CALL_ICE_SERVERS = [
  {
    urls: stunUrls.length ? stunUrls : [
      "stun:stun.l.google.com:19302",
      "stun:global.stun.twilio.com:3478"
    ]
  },
  ...turnUrls.length ? [{
    urls: turnUrls,
    username: "9c8091d507540c2e0ca3f43a",
    credential: "sdvCML1r6UIbnKpv"
  }] : []
].filter(Boolean);
const CALL_DEFAULT_SETTINGS = {
  speaker: true,
  muted: false,
  cameraFacingMode: "user"
};
function getCallNetworkSummary() {
  return {
    transport: "WebRTC",
    stun: CALL_ICE_SERVERS.filter((entry) => String(entry.urls).includes("stun")).flatMap((entry) => entry.urls || []),
    turn: CALL_ICE_SERVERS.filter((entry) => String(entry.urls).includes("turn")).flatMap((entry) => entry.urls || []),
    adaptiveReconnect: true
  };
}
const MOCK_PARTICIPANTS = [
  { id: "host", name: "أنت", role: "host" },
  { id: "guest-1", name: "ضيف 1", role: "guest" },
  { id: "guest-2", name: "ضيف 2", role: "guest" },
  { id: "guest-3", name: "ضيف 3", role: "guest" }
];
function avatarGradient(index = 0) {
  const gradients = [
    "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    "linear-gradient(135deg, #f97316, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #eab308, #f97316)"
  ];
  return gradients[index % gradients.length];
}
function CallExperience({
  open,
  mode = "voice",
  callType = "direct",
  participantName = "المستخدم",
  onClose,
  onStatusChange
}) {
  const network = reactExports.useMemo(() => getCallNetworkSummary(), []);
  const localVideoRef = reactExports.useRef(null);
  const [status, setStatus] = reactExports.useState("idle");
  const [muted, setMuted] = reactExports.useState(CALL_DEFAULT_SETTINGS.muted);
  const [speakerEnabled, setSpeakerEnabled] = reactExports.useState(CALL_DEFAULT_SETTINGS.speaker);
  const [cameraEnabled, setCameraEnabled] = reactExports.useState(mode === "video");
  const [cameraFacingMode, setCameraFacingMode] = reactExports.useState(CALL_DEFAULT_SETTINGS.cameraFacingMode);
  const [reconnectCount, setReconnectCount] = reactExports.useState(0);
  const [connectionQuality, setConnectionQuality] = reactExports.useState("excellent");
  const [startedAt, setStartedAt] = reactExports.useState(null);
  const [streamError, setStreamError] = reactExports.useState("");
  const [localStream, setLocalStream] = reactExports.useState(null);
  const [participants, setParticipants] = reactExports.useState(callType === "group" ? MOCK_PARTICIPANTS : [{ id: "peer", name: participantName, role: "peer" }]);
  reactExports.useEffect(() => {
    if (!open) return void 0;
    let cancelled = false;
    const requestMedia = async () => {
      setStatus("connecting");
      setStreamError("");
      onStatusChange?.("connecting");
      try {
        const shouldUseVideo = mode === "video";
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: shouldUseVideo ? {
            facingMode: cameraFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } : false
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatus("connected");
        setStartedAt(Date.now());
        onStatusChange?.("connected");
      } catch (error) {
        setStatus("fallback");
        setStreamError(error?.message || "تعذر الوصول للميكروفون أو الكاميرا.");
        onStatusChange?.("fallback");
      }
    };
    requestMedia();
    const qualityTimer = window.setInterval(() => {
      setConnectionQuality((prev) => {
        if (prev === "excellent") return "good";
        if (prev === "good") return "stable";
        return "excellent";
      });
    }, 6e3);
    return () => {
      cancelled = true;
      window.clearInterval(qualityTimer);
    };
  }, [cameraFacingMode, mode, onStatusChange, open]);
  reactExports.useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  reactExports.useEffect(() => () => {
    localStream?.getTracks?.().forEach((track) => track.stop());
  }, [localStream]);
  const durationLabel = reactExports.useMemo(() => {
    if (!startedAt) return "00:00";
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1e3));
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [startedAt, reconnectCount, status]);
  const toggleMute = () => {
    const nextValue = !muted;
    setMuted(nextValue);
    localStream?.getAudioTracks?.().forEach((track) => {
      track.enabled = !nextValue;
    });
  };
  const toggleCamera = async () => {
    if (mode !== "video") return;
    const nextValue = !cameraEnabled;
    setCameraEnabled(nextValue);
    localStream?.getVideoTracks?.().forEach((track) => {
      track.enabled = nextValue;
    });
  };
  const switchCamera = async () => {
    const nextFacing = cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextFacing);
    setReconnectCount((prev) => prev + 1);
  };
  const reconnect = async () => {
    localStream?.getTracks?.().forEach((track) => track.stop());
    setLocalStream(null);
    setStatus("reconnecting");
    setReconnectCount((prev) => prev + 1);
    onStatusChange?.("reconnecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video" ? { facingMode: cameraFacingMode } : false
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setStatus("connected");
      onStatusChange?.("connected");
    } catch (error) {
      setStatus("fallback");
      setStreamError(error?.message || "تعذر استعادة الاتصال.");
      onStatusChange?.("fallback");
    }
  };
  const toggleSpeaker = async () => {
    setSpeakerEnabled((prev) => !prev);
    const video = localVideoRef.current;
    if (video && typeof video.setSinkId === "function") {
      try {
        await video.setSinkId(speakerEnabled ? "default" : "communications");
      } catch {
      }
    }
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 16 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 16, background: "linear-gradient(160deg, rgba(15,23,42,0.95), rgba(30,41,59,0.96))", color: "white" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 13, opacity: 0.72, marginBottom: 4 }, children: callType === "group" ? "Group call" : mode === "video" ? "Video call" : "Voice call" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { style: { margin: 0, fontSize: 24 }, children: callType === "group" ? "غرفة مكالمة جماعية" : participantName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "call-chip", children: network.transport }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "call-chip", children: status === "connected" ? "Connected" : status === "reconnecting" ? "Reconnecting" : status === "fallback" ? "Fallback mode" : "Connecting" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "call-chip", children: connectionQuality }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "call-chip", children: durationLabel })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "end" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, opacity: 0.7 }, children: "TURN/STUN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 13 }, children: [
            network.turn.length ? `${network.turn.length} TURN` : "TURN pending",
            " · ",
            network.stun.length,
            " STUN"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, opacity: 0.7, marginTop: 4 }, children: [
            "Reconnect #",
            reconnectCount
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: callType === "group" ? "repeat(auto-fit, minmax(160px, 1fr))" : "1fr", gap: 12 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minHeight: 220, borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }, children: [
          mode === "video" && cameraEnabled && localStream ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { ref: localVideoRef, autoPlay: true, muted: true, playsInline: true, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minHeight: 220, display: "grid", placeItems: "center", background: "radial-gradient(circle at top, rgba(59,130,246,0.35), rgba(15,23,42,0.95))" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 84, height: 84, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 12px", fontSize: 30, fontWeight: 700, background: "rgba(255,255,255,0.15)" }, children: String(participantName || "Y").slice(0, 1).toUpperCase() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700 }, children: "أنت" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { opacity: 0.75, fontSize: 12 }, children: mode === "video" ? "الكاميرا مغلقة أو غير متاحة" : "مكالمة صوتية فقط" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "absolute", insetInlineStart: 12, bottom: 12, background: "rgba(15,23,42,0.78)", padding: "6px 10px", borderRadius: 999, fontSize: 12 }, children: muted ? "الميكروفون مكتوم" : "الميكروفون شغال" })
        ] }),
        callType === "group" ? participants.map((participant, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { minHeight: 220, borderRadius: 20, overflow: "hidden", background: avatarGradient(index), position: "relative", display: "grid", placeItems: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "white" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", margin: "0 auto 10px", fontSize: 26, fontWeight: 700 }, children: participant.name.slice(0, 1).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700 }, children: participant.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 12, opacity: 0.85 }, children: participant.role === "host" ? "Host" : "Participant" })
        ] }) }, participant.id)) : null
      ] }),
      streamError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 14, borderRadius: 14, padding: 12, background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.25)", fontSize: 13 }, children: streamError }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: muted ? "warning" : "secondary", onClick: toggleMute, children: muted ? "إلغاء كتم" : "كتم الميك" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: speakerEnabled ? "secondary" : "warning", onClick: toggleSpeaker, children: speakerEnabled ? "السماعة الخارجية" : "سماعة المكالمة" }),
      mode === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: cameraEnabled ? "secondary" : "warning", onClick: toggleCamera, children: cameraEnabled ? "قفل الكاميرا" : "فتح الكاميرا" }) : null,
      mode === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: switchCamera, children: "تبديل الكاميرا" }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: reconnect, children: "إعادة الاتصال" }),
      callType === "group" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "success", onClick: () => setParticipants((prev) => [...prev, { id: `guest-${Date.now()}`, name: `ضيف ${prev.length + 1}`, role: "guest" }]), children: "إضافة مشارك" }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", onClick: onClose, children: "إنهاء" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { style: { padding: 16 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, marginBottom: 10 }, children: "جاهزية المكالمات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "grid", gap: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "call-info-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Voice / Video / Group" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: callType === "group" ? "جاهز" : mode === "video" ? "فيديو + صوت" : "صوت فقط" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "call-info-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "WebRTC" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "مفعل على الواجهة مع ICE config" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "call-info-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "STUN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: network.stun.join(" • ") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "call-info-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "TURN" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: network.turn.length ? network.turn.join(" • ") : "أضف VITE_TURN_URL / USERNAME / CREDENTIAL" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "call-info-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Reconnect strategy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Exponential retry + manual reconnect" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .call-chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
        }
        .call-info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(15,23,42,0.04);
          border: 1px solid rgba(15,23,42,0.08);
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .call-info-row {
            flex-direction: column;
          }
        }
      ` })
  ] });
}
const STORAGE_KEY = "yamshat-chat-preferences";
function readRaw() {
  if (typeof window === "undefined") return { muted: [], archived: [], pinned: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      muted: Array.isArray(parsed.muted) ? parsed.muted : [],
      archived: Array.isArray(parsed.archived) ? parsed.archived : [],
      pinned: Array.isArray(parsed.pinned) ? parsed.pinned : []
    };
  } catch {
    return { muted: [], archived: [], pinned: [] };
  }
}
function writeRaw(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getChatPreferences() {
  const raw = readRaw();
  return {
    muted: new Set(raw.muted),
    archived: new Set(raw.archived),
    pinned: new Set(raw.pinned)
  };
}
function toggleChatPreference(type, username) {
  const raw = readRaw();
  const next = new Set(raw[type] || []);
  if (next.has(username)) next.delete(username);
  else next.add(username);
  raw[type] = [...next];
  writeRaw(raw);
  return new Set(raw[type]);
}
function Avatar({ name = "", src, size = 44, ring = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: ring ? 18 : "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: ring ? "1px solid rgba(139,92,246,0.42)" : "none",
    boxShadow: ring ? "0 0 0 4px rgba(139,92,246,0.12)" : "none"
  };
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient$1(name), fontSize: size * 0.34 }, children: initialsFromName(name).slice(0, 1) });
}
function MessageBubble({ message, isMe, onReply, onDelete }) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = message.type === "voice";
  const isImage = message.type === "image" || hasMedia && /\.(jpg|jpeg|png|gif|webp)/i.test(message.media_url || "");
  const isVideo = message.type === "video" || hasMedia && /\.(mp4|webm|mov)/i.test(message.media_url || "");
  const content = message.content || message.message || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-bubble-wrap ${isMe ? "me" : "them"}`, children: [
    !isMe && /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: message.sender, size: 34 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-bubble ${isMe ? "bubble-me" : "bubble-them"}`, children: [
      message.reply_to ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-reply-banner", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "↩ الرد على:" }),
        " ",
        message.reply_to?.content || "..."
      ] }) : null,
      isVoice && message.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: message.media_url, controls: true, style: { width: "100%", maxWidth: 320, display: "block" } }) : null,
      isImage && message.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: message.media_url, alt: "media", style: { maxWidth: 320, width: "100%", borderRadius: 16, display: "block" } }) : null,
      isVideo && message.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: message.media_url, controls: true, style: { maxWidth: 320, width: "100%", borderRadius: 16, display: "block" } }) : null,
      content && !message.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-text", children: content }) : null,
      message.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-deleted", children: "🗑 تم حذف الرسالة" }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bubble-time", children: new Date(message.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) }),
        isMe ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: statusColor(message.status), fontSize: 13, fontWeight: 700 }, children: statusTicks(message.status) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onReply(message), children: "↩" }),
        isMe && !message.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onDelete(message.id, false), children: "🗑" }) : null,
        isMe && !message.deleted ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onDelete(message.id, true), children: "🧹" }) : null
      ] })
    ] })
  ] });
}
function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const peer = decodeURIComponent(userId || "").trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();
  const [threads, setThreads] = reactExports.useState([]);
  const [threadsLoading, setThreadsLoading] = reactExports.useState(true);
  const [messages, setMessages] = reactExports.useState([]);
  const [msgLoading, setMsgLoading] = reactExports.useState(false);
  const [presence, setPresence] = reactExports.useState({});
  const [blockStatus, setBlockStatus] = reactExports.useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [callMode, setCallMode] = reactExports.useState(null);
  const [flyingHearts, setFlyingHearts] = reactExports.useState([]);
  const initialChatPrefs = reactExports.useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = reactExports.useState(initialChatPrefs.muted.has(peer));
  const [showDetailsDrawer, setShowDetailsDrawer] = reactExports.useState(false);
  const messagesEndRef = reactExports.useRef(null);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  reactExports.useEffect(() => {
    let active = true;
    setThreadsLoading(true);
    getChatThreads().then(({ data }) => {
      if (active) setThreads(Array.isArray(data) ? data : []);
    }).catch(() => {
    }).finally(() => {
      if (active) setThreadsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const loadMessages = reactExports.useCallback(async () => {
    if (!peer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 50);
      setMessages(data?.items || []);
      await markMessagesSeen(peer);
    } catch {
      pushToast({ type: "error", title: "خطأ", description: "تعذر تحميل الرسائل" });
    } finally {
      setMsgLoading(false);
    }
  }, [peer, pushToast]);
  reactExports.useEffect(() => {
    if (!peer) return;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    loadMessages();
    setShowDetailsDrawer(false);
    setActivePeer(peer);
    getPresence(peer).then(({ data }) => {
      setPresence((prev) => ({ ...prev, [peer]: { ...prev[peer] || {}, ...data || {} } }));
    }).catch(() => {
    });
    getBlockStatus(peer).then(({ data }) => {
      setBlockStatus(data || {});
    }).catch(() => {
    });
    return () => setActivePeer(null);
  }, [peer, loadMessages, setActivePeer]);
  reactExports.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  reactExports.useEffect(() => {
    if (!currentUser) return;
    socketManager.connect();
    socketManager.emit("register_user", { user: currentUser }, { skipSignature: true });
    if (peer) {
      socketManager.emit("join_chat", { peer });
      socketManager.emit("sync_chat_state", { peer });
    }
    const onMsg = (msg) => {
      const participants = [msg?.sender, msg?.receiver];
      if (!participants.includes(currentUser)) return;
      setMessages((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === msg.id || item.client_id && item.client_id === msg.client_id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...msg };
          return next.filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || candidate.client_id && candidate.client_id === item.client_id));
        }
        return [...prev, msg].filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || candidate.client_id && candidate.client_id === item.client_id));
      });
      setThreads((prev) => prev.map((item) => item.username === msg.sender || item.username === msg.receiver ? { ...item, last_message: msg.content || msg.message, created_at: msg.created_at } : item));
      if (msg.sender === peer) markMessagesSeen(peer).catch(() => {
      });
    };
    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: "delivered" } : item));
    };
    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((item) => payload.message_ids?.includes(item.id) ? { ...item, status: "seen" } : item));
    };
    const onPresence = (payload) => {
      if (!payload?.user) return;
      setPresence((prev) => ({ ...prev, [payload.user]: { ...prev[payload.user] || {}, ...payload } }));
    };
    const onTyping = (payload) => {
      if (!payload?.sender) return;
      setPresence((prev) => ({
        ...prev,
        [payload.sender]: { ...prev[payload.sender] || {}, is_typing: payload.is_typing }
      }));
      if (payload.is_typing) {
        setTimeout(() => setPresence((prev) => ({
          ...prev,
          [payload.sender]: { ...prev[payload.sender] || {}, is_typing: false }
        })), 3200);
      }
    };
    socketManager.on("new_private_message", onMsg);
    socketManager.on("messages_delivered", onDelivered);
    socketManager.on("messages_seen", onSeen);
    socketManager.on("presence_update", onPresence);
    socketManager.on("typing_update", onTyping);
    const onDeleted = (payload) => {
      if (!payload?.id) return;
      setMessages((prev) => prev.map((item) => String(item.id) === String(payload.id) ? { ...item, ...payload, deleted: true } : item));
    };
    socketManager.on("message_deleted", onDeleted);
    return () => {
      if (peer) socketManager.emit("leave_chat", { peer });
      socketManager.off("new_private_message", onMsg);
      socketManager.off("messages_delivered", onDelivered);
      socketManager.off("messages_seen", onSeen);
      socketManager.off("presence_update", onPresence);
      socketManager.off("typing_update", onTyping);
      socketManager.off("message_deleted", onDeleted);
    };
  }, [currentUser, peer]);
  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || "";
    const mediaUrl = payload?.media_url || "";
    if (!text && !mediaUrl) return;
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      client_id: tempId,
      sender: currentUser,
      receiver: peer,
      content: text,
      message: text,
      media_url: mediaUrl,
      type: mediaUrl ? payload.type || "media" : "text",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "sending",
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyTo(null);
    try {
      const { data } = await sendMessageApi({
        receiver: peer,
        message: text,
        media_url: mediaUrl,
        type: tempMsg.type,
        reply_to_id: replyTo?.id || null,
        client_id: tempId
      });
      setMessages((prev) => {
        const merged = prev.map((item) => item.id === tempId || item.client_id === tempId ? { ...item, ...data || {}, status: (data || {}).status || "sent" } : item);
        return merged.filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id || candidate.client_id && candidate.client_id === item.client_id));
      });
    } catch {
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      pushToast({ type: "error", title: "خطأ", description: "فشل إرسال الرسالة" });
    }
  };
  const handleDelete = async (msgId, deleteForEveryone = false) => {
    try {
      await deleteMessageApi(msgId, { delete_for_everyone: deleteForEveryone });
      setMessages((prev) => prev.map((item) => item.id === msgId ? { ...item, deleted: true, deleted_for_everyone: deleteForEveryone, content: "", message: "" } : item));
      pushToast({ type: "success", title: deleteForEveryone ? "تم الحذف للجميع" : "تم الحذف عندك" });
    } catch {
      pushToast({ type: "error", title: "تعذر الحذف" });
    }
  };
  const handleBlock = async () => {
    try {
      if (blockStatus.blocked_by_me) {
        await unblockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: false, can_chat: true }));
        pushToast({ type: "success", title: "تم رفع الحظر" });
      } else {
        await blockUserApi(peer);
        setBlockStatus((prev) => ({ ...prev, blocked_by_me: true, can_chat: false }));
        pushToast({ type: "success", title: "تم الحظر" });
      }
    } catch {
      pushToast({ type: "error", title: "تعذرت العملية" });
    }
  };
  const handleMuteConversation = () => {
    const nextSet = toggleChatPreference("muted", peer);
    const next = nextSet.has(peer);
    setIsMutedConversation(next);
    pushToast({ type: "success", title: next ? "تم كتم المحادثة" : "تم إلغاء كتم المحادثة" });
  };
  const handleDeleteConversation = () => {
    const nextSet = toggleChatPreference("archived", peer);
    setMessages([]);
    pushToast({ type: "success", title: nextSet.has(peer) ? "تمت أرشفة المحادثة" : "تم إلغاء الأرشفة", description: "تقدر تلاقيها من تبويب المؤرشفة." });
  };
  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((item) => item !== id)), 1800);
  };
  const peerPresence = presence[peer] || {};
  const isOnline = peerPresence.is_online;
  const isTyping = peerPresence.is_typing;
  const lastSeen = peerPresence.last_seen;
  const peerThread = reactExports.useMemo(() => threads.find((item) => item.username === peer) || {}, [threads, peer]);
  const mediaMessages = reactExports.useMemo(() => messages.filter((item) => item.media_url), [messages]);
  if (!peer) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/inbox", replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MainLayout, { hideNav: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-chat-screen", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-chat-sidebar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #7c3aed, #c026d3)", display: "grid", placeItems: "center", color: "white", fontWeight: "bold", fontSize: "20px" }, children: "Y" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "white", fontWeight: "bold", fontSize: "18px", letterSpacing: "2px" }, children: "YAMSHAT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { style: { display: "grid", gap: "8px" }, children: ["الدردشات", "المجموعات", "الأصدقاء", "الإشعارات", "الإعدادات"].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", background: idx === 0 ? "rgba(124,58,237,0.15)" : "transparent", color: idx === 0 ? "#a78bfa" : "#94a3b8", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "18px" }, children: ["💬", "👥", "👤", "🔔", "⚙️"][idx] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "bold" }, children: item })
        ] }, item)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, overflowY: "auto", padding: "16px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", color: "white" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontWeight: "bold" }, children: "جهات الاتصال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { cursor: "pointer", fontSize: "20px" }, children: "+" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "grid", gap: "12px" }, children: threads.map((thread) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => navigate(`/chat/${thread.username}`), style: { display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "12px", background: thread.username === peer ? "rgba(124,58,237,0.1)" : "transparent", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: thread.username, src: thread.avatar, size: 42 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "white", fontWeight: "bold", fontSize: "14px" }, children: thread.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: thread.last_message || "متصل الآن" })
          ] })
        ] }, thread.username)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-chat-stage-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage-peer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerThread.avatar, size: 48, ring: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage-peer-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { color: "white" }, children: peer }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#64748b" }, children: isTyping ? "يكتب الآن..." : formatLastSeen(lastSeen, isOnline) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", style: { background: "transparent", border: "none", fontSize: "20px" }, onClick: () => setCallMode("voice"), children: "📞" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", style: { background: "transparent", border: "none", fontSize: "20px" }, onClick: () => setCallMode("video"), children: "📹" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", style: { background: "transparent", border: "none", fontSize: "20px" }, children: "⋮" })
        ] })
      ] }),
      showDetailsDrawer ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-details-drawer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-details-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: handleMuteConversation, children: isMutedConversation ? "🔔 إلغاء الكتم" : "🔕 كتم المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: spawnHeart, children: "💜 تفاعل سريع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `yam-detail-action ${blockStatus.blocked_by_me ? "danger" : ""}`, onClick: handleBlock, children: blockStatus.blocked_by_me ? "رفع الحظر" : "حظر المستخدم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action danger", onClick: handleDeleteConversation, children: "تنظيف الشاشة" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-details-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-details-head", children: "الوسائط المشتركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-strip", children: [
            mediaMessages.filter((item) => item.type === "image").slice(-5).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.media_url, alt: "media", className: "yam-media-thumb" }, item.id)),
            !mediaMessages.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-muted-note", children: "لا توجد وسائط مشتركة بعد" }) : null
          ] })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flying-hearts-layer", "aria-hidden": true, children: flyingHearts.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flying-heart", children: "💜" }, id)) }),
      callMode ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-call-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        CallExperience,
        {
          open: Boolean(callMode),
          mode: callMode,
          callType: "direct",
          participantName: peer,
          onClose: () => setCallMode(null),
          onStatusChange: () => {
          }
        }
      ) }) : null,
      !blockStatus.can_chat && blockStatus.blocked_by_me ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-block-banner", children: [
        "لقد حظرت هذا المستخدم. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleBlock, children: "رفع الحظر" })
      ] }) : null,
      !blockStatus.can_chat && blockStatus.blocked_me ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-block-banner blocked", children: "هذا المستخدم حظرك." }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-messages-area", children: [
        threadsLoading && !peerThread.username ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ تجهيز بيانات المحادثة..." }) : null,
        msgLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ تحميل الرسائل..." }) : null,
        !msgLoading && !messages.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "لا توجد رسائل بعد. ابدأ المحادثة الآن." }) : null,
        messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          MessageBubble,
          {
            message: msg,
            isMe: msg.sender === currentUser,
            onReply: (message) => setReplyTo(message),
            onDelete: handleDelete
          },
          msg.id
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-chat-input-wrap", style: { padding: "16px 24px", background: "#050816" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ChatInput,
        {
          peer,
          currentUser,
          replyTo,
          onCancelReply: () => setReplyTo(null),
          onSend: handleSend,
          disabled: !blockStatus.can_chat,
          compact: true
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { style: { background: "#0b0f1a", borderInlineStart: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerThread.avatar, size: 120, ring: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "white", fontWeight: "bold", fontSize: "20px", marginBottom: "4px" }, children: peer }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: "14px" }, children: formatLastSeen(lastSeen, isOnline) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: "16px", width: "100%", justifyContent: "center" }, children: ["📞", "📹", "🔍", "⋮"].map((icon, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", display: "grid", placeItems: "center", color: "white", cursor: "pointer" }, children: icon }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", marginTop: "24px", display: "grid", gap: "20px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: "12px", marginBottom: "8px" }, children: "اسم المستخدم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#a78bfa", fontWeight: "bold" }, children: [
            "@",
            peer.toLowerCase()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#64748b", fontSize: "12px", marginBottom: "8px" }, children: "البريد الإلكتروني" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "white" }, children: [
            peer.toLowerCase(),
            "@example.com"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { borderTop: "1px solid rgba(255,255,255,0.05)", pt: "20px", display: "grid", gap: "16px" }, children: ["الوسائط المشتركة", "الملفات", "الروابط", "المحادثات المثبتة"].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", color: "white", cursor: "pointer" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ["🖼️", "📁", "🔗", "📌"][i] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#64748b" }, children: "›" })
        ] }, item)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { style: { marginTop: "20px", padding: "12px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "none", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🚫" }),
          " حظر المستخدم"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-chat-screen {
            min-height: 100vh;
            height: 100vh;
            padding: 0;
            background: #050816;
            display: grid;
            grid-template-columns: 320px 1fr 340px;
            overflow: hidden;
          }

          .yam-chat-sidebar {
            background: #0b0f1a;
            border-inline-end: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .yam-chat-stage {
            position: relative;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #050816;
          }

          .yam-chat-stage-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: #050816;
            flex-shrink: 0;
          }

          .yam-chat-stage-peer {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .yam-chat-stage-peer-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }

          .yam-chat-stage-peer-copy strong {
            font-size: 17px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-peer-copy span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-chat-stage-actions {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .yam-stage-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.78);
            color: white;
            display: grid;
            place-items: center;
            font-size: 17px;
          }

          .yam-stage-icon.active,
          .yam-stage-icon:hover {
            background: rgba(124,58,237,0.18);
            border-color: rgba(167,139,250,0.24);
          }

          .yam-chat-details-drawer {
            padding: 12px 16px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(7,12,24,0.92);
            display: grid;
            gap: 12px;
            flex-shrink: 0;
          }

          .yam-details-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .yam-detail-action {
            min-height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(15,23,42,0.72);
            color: white;
            font-weight: 800;
            padding: 0 12px;
          }

          .yam-detail-action.danger {
            color: #fecaca;
            border-color: rgba(239,68,68,0.18);
            background: rgba(127,29,29,0.2);
          }

          .yam-details-section {
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.03);
            padding: 12px;
          }

          .yam-details-head {
            font-weight: 900;
            margin-bottom: 10px;
          }

          .yam-media-strip {
            display: flex;
            gap: 8px;
            overflow-x: auto;
          }

          .yam-media-thumb {
            width: 72px;
            height: 72px;
            border-radius: 16px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .yam-muted-note {
            color: #94a3b8;
            font-size: 13px;
          }

          .flying-hearts-layer {
            position: absolute;
            bottom: 96px;
            left: 22px;
            pointer-events: none;
            z-index: 6;
          }

          .flying-heart {
            position: absolute;
            font-size: 28px;
            animation: fly-up 1.8s ease-out forwards;
            left: 0;
          }

          @keyframes fly-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            60% { transform: translateY(-120px) scale(1.4); opacity: 0.9; }
            100% { transform: translateY(-240px) scale(0.5); opacity: 0; }
          }

          .yam-call-overlay {
            position: absolute;
            inset: 0;
            background: rgba(4,8,18,0.92);
            backdrop-filter: blur(8px);
            z-index: 20;
            overflow-y: auto;
            padding: 20px;
          }

          .yam-block-banner {
            padding: 10px 16px;
            background: rgba(239,68,68,0.12);
            border-bottom: 1px solid rgba(239,68,68,0.22);
            color: #fca5a5;
            font-size: 13px;
            text-align: center;
            flex-shrink: 0;
          }

          .yam-block-banner button {
            background: none;
            border: none;
            color: #f97316;
            cursor: pointer;
            font-weight: 700;
            margin-inline-start: 8px;
          }

          .yam-block-banner.blocked {
            background: rgba(127,29,29,0.24);
          }

          .yam-messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px 14px 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .yam-messages-area::-webkit-scrollbar { width: 5px; }
          .yam-messages-area::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.22); border-radius: 999px; }

          .yam-empty-state {
            color: #64748b;
            font-size: 14px;
            padding: 20px;
            text-align: center;
          }

          .yam-bubble-wrap {
            display: flex;
            align-items: flex-end;
            gap: 8px;
          }

          .yam-bubble-wrap.me { flex-direction: row-reverse; }

          .yam-bubble {
            max-width: min(74%, 560px);
            padding: 12px 15px;
            border-radius: 22px;
            position: relative;
            line-height: 1.6;
          }

          .bubble-me {
            background: #3b22a1;
            color: white;
            border-bottom-right-radius: 4px;
          }

          .bubble-them {
            background: #1a1f2e;
            color: #e2e8f0;
            border: none;
            border-bottom-left-radius: 4px;
          }

          .bubble-reply-banner {
            font-size: 12px;
            padding: 6px 8px;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            margin-bottom: 8px;
            border-inline-start: 2px solid rgba(255,255,255,0.4);
          }

          .bubble-text { font-size: 14px; word-break: break-word; }
          .bubble-deleted { font-size: 13px; opacity: 0.5; font-style: italic; }

          .bubble-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 5px;
            margin-top: 6px;
          }

          .bubble-time { font-size: 11px; opacity: 0.65; }

          .bubble-actions {
            display: none;
            gap: 6px;
            position: absolute;
            top: -28px;
            inset-inline-end: 0;
            background: rgba(15,23,42,0.92);
            border-radius: 10px;
            padding: 4px 8px;
            border: 1px solid rgba(255,255,255,0.08);
          }

          .yam-bubble:hover .bubble-actions { display: flex; }

          .bubble-actions button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 4px;
          }

          .yam-chat-input-wrap {
            flex-shrink: 0;
          }

          @media (max-width: 920px) {
            .yam-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 768px) {
            .yam-chat-stage-header {
              padding: 10px 12px;
            }

            .yam-chat-stage-peer-copy strong {
              font-size: 15px;
            }

            .yam-stage-icon {
              width: 40px;
              height: 40px;
              border-radius: 12px;
            }

            .yam-messages-area {
              padding: 16px 10px 10px;
            }

            .yam-bubble {
              max-width: 86%;
            }

            .yam-details-grid {
              grid-template-columns: 1fr;
            }
          }
        ` })
  ] }) });
}
export {
  Chat as default
};
