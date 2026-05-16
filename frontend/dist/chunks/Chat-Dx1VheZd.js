import { j as jsxRuntimeExports, r as reactExports, Q as logger, R as DISAPPEARING_MESSAGE_OPTIONS, B as Button, h as socketManager, T as mediaUploadService, o as useParams, u as useNavigate, f as getCurrentUsername, e as useToast, U as useChatStore, p as getChatThreads, V as getMessages, W as markMessagesSeen, X as getPresence, Y as getBlockStatus, L as Link, Z as sendMessageApi, _ as deleteMessageApi, m as unblockUserApi, n as blockUserApi } from "../index-D6u1FUhW.js";
import { M as MainLayout, p as formatLastSeen, f as formatTimeAgo, i as initialsFromName, d as avatarGradient$1, q as statusTicks, r as statusColor } from "./MainLayout-Ca2z1jDa.js";
import { C as Card } from "./Card-r3PaFA5D.js";
import "./proxy-npyH2_t3.js";
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
function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot }) {
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
  reactExports.useMemo(
    () => attachments.filter((item) => item.status === "queued" || item.status === "uploading").length,
    [attachments]
  );
  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (peer) {
      socketManager.emit("chat_typing", { receiver: peer, is_typing: false });
    }
  };
  const emitRecordingState = (value) => {
    setIsRecording(value === "recording" || value === "paused");
    if (peer) {
      socketManager.emit("chat_recording", { receiver: peer, is_recording: value === "recording" || value === "paused" });
    }
  };
  const handleTyping = (nextValue) => {
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
    if (sending || !text.trim() && attachments.length === 0) return;
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { padding: 12, background: "#111827", borderTop: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 10 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, color: "var(--muted)" }, children: [
        "🔐 ",
        signalSummary
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: { fontSize: 12, color: "var(--muted)" }, children: "الرسائل المختفية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: messageTimer, onChange: (event) => setMessageTimer(Number(event.target.value || 0)), style: { background: "#0f172a", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 10px" }, children: DISAPPEARING_MESSAGE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 12, color: "var(--muted)" }, children: [
          "⏱ ",
          timerLabel(messageTimer)
        ] })
      ] })
    ] }),
    replyTo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 12, gap: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 12, borderRight: "2px solid var(--primary)", paddingRight: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontWeight: "bold" }, children: [
          "الرد على ",
          replyTo.sender
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { opacity: 0.75 }, children: replyTo.content || replyTo.message })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onCancelReply, style: { background: "none", border: "none", color: "white" }, children: "×" })
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => removeAttachment(entry.id), style: { background: "none", border: "none", color: "#fca5a5" }, children: "حذف" })
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", style: { background: "none", border: "none", fontSize: 20 }, onClick: () => emitToast({ type: "info", title: "الإيموجي", description: "استخدم لوحة الإيموجي في جهازك أو لوحة المفاتيح." }), children: "😊" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { cursor: "pointer" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", hidden: true, multiple: true, onChange: (event) => handleFilesAdded(event.target.files) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 20 }, children: "📎" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowVoiceRecorder((prev) => !prev),
          style: {
            background: showVoiceRecorder || isRecording ? "#8b5cf6" : "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            width: 40,
            height: 40,
            borderRadius: "50%",
            color: "white"
          },
          children: "🎤"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          placeholder: peer ? `اكتب رسالة إلى ${peer}...` : "اكتب رسالة...",
          value: text,
          onChange: (event) => handleTyping(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          },
          style: { flex: 1, background: "#1f2937", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 14px", borderRadius: 18, color: "white", outline: "none" }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSend, loading: sending, disabled: sending || !text.trim() && attachments.length === 0, children: "إرسال" })
    ] })
  ] });
}
const CALL_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:global.stun.twilio.com:3478"
    ]
  },
  null
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
function Avatar({ name = "", src, size = 44, ring = false, live = false }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: ring ? "2px solid rgba(139,92,246,0.88)" : "none",
    boxShadow: ring ? "0 0 0 4px rgba(139,92,246,0.14)" : "none"
  };
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: name, style }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { ...style, display: "grid", placeItems: "center", color: "white", fontWeight: 900, background: avatarGradient$1(name), fontSize: size * 0.38 }, children: initialsFromName(name).slice(0, 1) });
}
function PresenceDot({ isOnline }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: isOnline ? "#22c55e" : "#64748b",
    boxShadow: isOnline ? "0 0 0 3px rgba(34,197,94,0.22)" : "none"
  } });
}
function ThreadRow({ thread, active, presence, onClick }) {
  const isOnline = presence?.is_online;
  const isTyping = presence?.is_typing;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => onClick(thread.username),
      className: `yam-thread-row ${active ? "active" : ""}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", flexShrink: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: thread.username, src: thread.avatar, size: 50 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `thread-online-dot ${isOnline ? "on" : "off"}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thread-meta", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thread-top-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: thread.username }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "thread-time", children: formatTimeAgo(thread.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thread-preview-line", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "thread-preview-text", children: isTyping ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "typing-indicator", children: "✏ يكتب..." }) : thread.last_message || "لا توجد رسائل بعد" }),
            thread.unread_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "unread-badge", children: thread.unread_count })
          ] })
        ] })
      ]
    }
  );
}
function MessageBubble({ message, isMe, onReply, onDelete }) {
  const hasMedia = Boolean(message.media_url);
  const isVoice = message.type === "voice";
  const isImage = message.type === "image" || hasMedia && /\.(jpg|jpeg|png|gif|webp)/i.test(message.media_url || "");
  const isVideo = message.type === "video" || hasMedia && /\.(mp4|webm|mov)/i.test(message.media_url || "");
  const content = message.content || message.message || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-bubble-wrap ${isMe ? "me" : "them"}`, children: [
    !isMe && /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: message.sender, size: 32 }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-bubble ${isMe ? "bubble-me" : "bubble-them"}`, children: [
      message.reply_to && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-reply-banner", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "↩ الرد على:" }),
        " ",
        message.reply_to?.content || "..."
      ] }),
      isVoice && message.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: message.media_url, controls: true, style: { maxWidth: 260, display: "block" } }),
      isImage && message.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: message.media_url, alt: "media", style: { maxWidth: 260, borderRadius: 12, display: "block" } }),
      isVideo && message.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: message.media_url, controls: true, style: { maxWidth: 260, borderRadius: 12, display: "block" } }),
      content && !message.deleted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-text", children: content }),
      message.deleted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bubble-deleted", children: "🗑 تم حذف الرسالة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bubble-time", children: new Date(message.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) }),
        isMe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: statusColor(message.status), fontSize: 13, fontWeight: 700 }, children: statusTicks(message.status) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bubble-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onReply(message), children: "↩" }),
        isMe && !message.deleted && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onDelete(message.id), children: "🗑" })
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
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [flyingHearts, setFlyingHearts] = reactExports.useState([]);
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
    loadMessages();
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
    const onMsg = (msg) => {
      const participants = [msg?.sender, msg?.receiver];
      if (!participants.includes(currentUser)) return;
      setMessages((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === msg.id || item.client_id && item.client_id === msg.client_id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...msg };
          return next;
        }
        return [...prev, msg];
      });
      setThreads((prev) => prev.map((t) => t.username === msg.sender || t.username === msg.receiver ? { ...t, last_message: msg.content || msg.message, created_at: msg.created_at } : t));
      if (msg.sender === peer) markMessagesSeen(peer).catch(() => {
      });
    };
    const onDelivered = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((m) => payload.message_ids?.includes(m.id) ? { ...m, status: "delivered" } : m));
    };
    const onSeen = (payload) => {
      if (payload?.sender !== currentUser) return;
      setMessages((prev) => prev.map((m) => payload.message_ids?.includes(m.id) ? { ...m, status: "seen" } : m));
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
    return () => {
      socketManager.off("new_private_message", onMsg);
      socketManager.off("messages_delivered", onDelivered);
      socketManager.off("messages_seen", onSeen);
      socketManager.off("presence_update", onPresence);
      socketManager.off("typing_update", onTyping);
    };
  }, [currentUser, peer]);
  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || "";
    const mediaUrl = payload?.media_url || "";
    if (!text && !mediaUrl) return;
    const tempId = `tmp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
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
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, ...data || {}, status: (data || {}).status || "sent" } : m));
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      pushToast({ type: "error", title: "خطأ", description: "فشل إرسال الرسالة" });
    }
  };
  const handleDelete = async (msgId) => {
    try {
      await deleteMessageApi(msgId);
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, deleted: true, content: "", message: "" } : m));
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
  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((h) => h !== id)), 1800);
  };
  const peerPresence = presence[peer] || {};
  const isOnline = peerPresence.is_online;
  const isTyping = peerPresence.is_typing;
  const lastSeen = peerPresence.last_seen;
  const filteredThreads = reactExports.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return threads.filter((t) => !q || t.username.toLowerCase().includes(q));
  }, [threads, searchQuery]);
  const peerThread = threads.find((t) => t.username === peer) || {};
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-shell desktop-post mobile-post", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-chat-sidebar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-sidebar-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "المحادثات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/users", className: "yam-new-chat-btn", children: "＋ جديد" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-thread-search", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            placeholder: "بحث في المحادثات...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-thread-list", children: [
          threadsLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ التحميل..." }),
          !threadsLoading && !filteredThreads.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "لا توجد محادثات" }),
          filteredThreads.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            ThreadRow,
            {
              thread: t,
              active: t.username === peer,
              presence: presence[t.username],
              onClick: (u) => navigate(`/chat/${encodeURIComponent(u)}`)
            },
            t.username
          ))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-pro-promo", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-pro-mark", children: "🜲" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "YAMSHAT PRO" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "ترقية لتجربة أفضل بدون إعلانات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-pro-btn", children: "ترقية الآن" })
          ] })
        ] })
      ] }),
      !peer ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-no-peer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "no-peer-icon", children: "💬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "اختر محادثة للبدء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اختر من القائمة الجانبية أو ابدأ محادثة جديدة" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-conversation", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-conv-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-conv-peer-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerThread.avatar, size: 46 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-conv-peer-name", children: [
                peer,
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "verify-badge", children: "✓" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-conv-peer-status", children: isTyping ? /* @__PURE__ */ jsxRuntimeExports.jsx("em", { className: "typing-pulse", children: "✏ يكتب..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PresenceDot, { isOnline }),
                " ",
                formatLastSeen(lastSeen, isOnline)
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-conv-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-ghost", onClick: () => setCallMode("video"), title: "مكالمة فيديو", children: "📹" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-ghost", onClick: () => setCallMode("voice"), title: "مكالمة صوتية", children: "📞" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-ghost", title: "بحث", children: "⌕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-ghost", onClick: spawnHeart, title: "قلب طائر", children: "💜" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flying-hearts-layer", "aria-hidden": true, children: flyingHearts.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flying-heart", children: "💜" }, id)) }),
        callMode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-call-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
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
        ) }),
        !blockStatus.can_chat && blockStatus.blocked_by_me && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-block-banner", children: [
          "لقد حظرت هذا المستخدم. ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleBlock, children: "رفع الحظر" })
        ] }),
        !blockStatus.can_chat && blockStatus.blocked_me && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-block-banner blocked", children: "هذا المستخدم حظرك." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-messages-area", children: [
          msgLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ تحميل الرسائل..." }),
          !msgLoading && !messages.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "لا توجد رسائل بعد. أرسل الأولى!" }),
          messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            MessageBubble,
            {
              message: msg,
              isMe: msg.sender === currentUser,
              onReply: (m) => setReplyTo(m),
              onDelete: handleDelete
            },
            msg.id
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-chat-input-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChatInput,
          {
            peer,
            currentUser,
            replyTo,
            onCancelReply: () => setReplyTo(null),
            onSend: handleSend,
            disabled: !blockStatus.can_chat
          }
        ) })
      ] }),
      peer && /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-chat-info-panel", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-avatar-block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerThread.avatar, size: 80, ring: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { children: [
            peer,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "verify-badge", children: "✓" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: isTyping ? "✏ يكتب..." : formatLastSeen(lastSeen, isOnline) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-info-action-btn", title: "بحث", children: "⌕ بحث" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-info-action-btn", title: "كتم", children: "🔔 كتم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: `yam-info-action-btn ${blockStatus.blocked_by_me ? "danger" : ""}`,
              onClick: handleBlock,
              children: blockStatus.blocked_by_me ? "🚫 رفع الحظر" : "🚫 حظر"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-info-section-head", children: "الوسائط المشتركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-grid", children: [
            messages.filter((m) => m.media_url && m.type === "image").slice(-6).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: m.media_url, alt: "media", className: "yam-media-thumb" }, m.id)),
            !messages.some((m) => m.media_url) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "muted", children: "لا توجد وسائط" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-info-section-head", children: "الروابط المشتركة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "muted", style: { fontSize: 13 }, children: "لا توجد روابط" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-delete-conv-btn", children: "🗑 حذف المحادثة" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        /* ── Layout ──────────────────────────────────────────────────── */
        .yam-chat-shell {
          display: grid;
          grid-template-columns: 320px minmax(0,1fr) 300px;
          height: calc(100vh - 66px);
          background: #060e1e;
          overflow: hidden;
          direction: rtl;
        }
        @media (max-width: 1100px) {
          .yam-chat-shell { grid-template-columns: 280px minmax(0,1fr); }
          .yam-chat-info-panel { display: none; }
        }
        @media (max-width: 1023px) {
          .yam-chat-shell { 
            grid-template-columns: 1fr; 
            height: calc(100vh - 100px);
            border-radius: 0;
          }
          .yam-chat-sidebar { 
            display: ${peer ? "none" : "flex"}; 
            width: 100% !important;
          }
          .yam-chat-info-panel { display: none; }
          .yam-chat-conversation {
            display: ${peer ? "flex" : "none"};
          }
        }

        /* ── Left sidebar ──────────────────────────────────────────── */
        .yam-chat-sidebar {
          display: flex;
          flex-direction: column;
          border-inline-end: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.96);
          overflow: hidden;
        }
        .yam-chat-sidebar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px 10px;
          flex-shrink: 0;
        }
        .yam-chat-sidebar-head h2 { margin: 0; font-size: 20px; font-weight: 900; }
        .yam-new-chat-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }
        .yam-thread-search {
          padding: 8px 16px;
          flex-shrink: 0;
        }
        .yam-thread-search input {
          width: 100%;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 10px 14px;
          color: white;
          font-size: 14px;
        }
        .yam-thread-list {
          flex: 1;
          overflow-y: auto;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .yam-thread-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px;
          border-radius: 16px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          text-align: start;
          transition: background 0.2s;
        }
        .yam-thread-row:hover { background: rgba(139,92,246,0.1); }
        .yam-thread-row.active { background: rgba(139,92,246,0.18); border: 1px solid rgba(139,92,246,0.3); }
        .thread-online-dot {
          position: absolute;
          bottom: 1px;
          inset-inline-end: 1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(5,10,22,0.96);
        }
        .thread-online-dot.on { background: #22c55e; }
        .thread-online-dot.off { background: #475569; }
        .thread-meta { flex: 1; min-width: 0; }
        .thread-top-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .thread-top-line strong { font-weight: 800; font-size: 14px; }
        .thread-time { font-size: 11px; color: #64748b; flex-shrink: 0; }
        .thread-preview-line { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .thread-preview-text { font-size: 13px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .typing-indicator { color: #22c55e; font-style: italic; font-size: 12px; }
        .unread-badge {
          min-width: 20px; height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: #7c3aed;
          color: white;
          font-size: 11px;
          font-weight: 800;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .yam-pro-promo {
          margin: 8px;
          padding: 14px;
          border-radius: 20px;
          background: radial-gradient(circle at top, rgba(139,92,246,0.25), transparent 70%), rgba(12,18,34,0.9);
          border: 1px solid rgba(139,92,246,0.2);
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex-shrink: 0;
        }
        .yam-pro-mark {
          width: 46px; height: 46px;
          border-radius: 14px;
          display: grid; place-items: center;
          background: rgba(139,92,246,0.2);
          font-size: 22px;
          color: #d8b4fe;
          flex-shrink: 0;
        }
        .yam-pro-promo strong { font-size: 15px; font-weight: 900; }
        .yam-pro-promo p { margin: 4px 0 10px; font-size: 12px; color: #94a3b8; }
        .yam-pro-btn {
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 8px 14px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
        }
        .yam-empty-state { color: #64748b; font-size: 14px; padding: 20px; text-align: center; }

        /* ── Center conversation ──────────────────────────────────── */
        .yam-chat-no-peer {
          display: grid;
          place-items: center;
          text-align: center;
          color: #64748b;
        }
        .no-peer-icon { font-size: 72px; margin-bottom: 18px; }
        .yam-chat-conversation {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        .yam-conv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.96);
          flex-shrink: 0;
        }
        .yam-conv-peer-info { display: flex; align-items: center; gap: 12px; }
        .yam-conv-peer-name { font-size: 16px; font-weight: 900; display: flex; align-items: center; gap: 6px; }
        .verify-badge { color: #3b82f6; font-size: 12px; }
        .yam-conv-peer-status { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .typing-pulse { color: #22c55e; font-style: italic; animation: pulse-text 1s ease-in-out infinite; }
        @keyframes pulse-text { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .yam-conv-actions { display: flex; align-items: center; gap: 8px; }
        .yam-icon-ghost {
          width: 38px; height: 38px;
          border-radius: 12px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.06);
          color: white;
          font-size: 16px;
          display: grid; place-items: center;
          cursor: pointer;
        }
        .yam-icon-ghost:hover { background: rgba(139,92,246,0.18); }

        .flying-hearts-layer {
          position: absolute;
          bottom: 80px;
          right: 18px;
          pointer-events: none;
          z-index: 10;
        }
        .flying-heart {
          position: absolute;
          font-size: 28px;
          animation: fly-up 1.8s ease-out forwards;
          right: 0;
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
          padding: 12px 18px;
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

        .yam-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .yam-messages-area::-webkit-scrollbar { width: 4px; }
        .yam-messages-area::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.22); border-radius: 999px; }

        /* ── Bubbles ─────────────────────────────────────────────── */
        .yam-bubble-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .yam-bubble-wrap.me { flex-direction: row-reverse; }
        .yam-bubble {
          max-width: 72%;
          padding: 10px 14px;
          border-radius: 20px;
          position: relative;
          line-height: 1.5;
        }
        .bubble-me {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          border-bottom-right-radius: 6px;
        }
        .bubble-them {
          background: rgba(30,41,59,0.88);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 6px;
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
          margin-top: 5px;
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
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Right info panel ─────────────────────────────────────── */
        .yam-chat-info-panel {
          border-inline-start: 1px solid rgba(255,255,255,0.06);
          background: rgba(5,10,22,0.94);
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          padding: 24px 16px;
        }
        .yam-info-avatar-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 16px;
          gap: 8px;
        }
        .yam-info-avatar-block h3 { margin: 0; font-size: 18px; font-weight: 900; }
        .yam-info-avatar-block p { margin: 0; font-size: 13px; color: #94a3b8; }
        .yam-info-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .yam-info-action-btn {
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(15,23,42,0.78);
          border: 1px solid rgba(255,255,255,0.06);
          color: #cbd5e1;
          text-align: start;
          font-size: 14px;
          cursor: pointer;
        }
        .yam-info-action-btn.danger { color: #fca5a5; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.07); }
        .yam-info-section { margin-bottom: 20px; }
        .yam-info-section-head { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; }
        .yam-media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .yam-media-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
        .yam-delete-conv-btn {
          margin-top: auto;
          padding: 12px;
          border-radius: 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          cursor: pointer;
          font-weight: 700;
        }
      ` })
  ] });
}
export {
  Chat as default
};
