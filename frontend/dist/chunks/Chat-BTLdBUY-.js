import { aK as reactExports, ah as jsxRuntimeExports, am as logger, D as DISAPPEARING_MESSAGE_OPTIONS, aT as socketManager, aJ as reactDomExports, b2 as useParams, b0 as useNavigate, Z as getCurrentUsername, b8 as useToast, aY as useChatStore, aW as useAppStore, b9 as useViewportHeight, X as getChatThreads, a4 as getMessages, an as markMessagesSeen, a8 as getPresence, O as getBlockStatus, m as Navigate, k as MainLayout, b as Avatar, C as CallExperience, aR as sendMessageApi, H as deleteMessageApi, aU as unblockUserApi, r as blockUserApi } from "../index-Dz8FA2T4.js";
import { A as AudioWaveform, V as VoiceMessagePlayer, g as getChatPreferences, C as ChatBubble, t as toggleChatPreference } from "./chatPreferences-Bmfbafxa.js";
import { m as mediaUploadService } from "./mediaUploadService-CZ2Dj9RA.js";
import { a as avatarGradient, b as formatLastSeen } from "./YamshatDesign-BB_OE-D7.js";
import { B as BrandLogo } from "./BrandLogo-ChpT5I0m.js";
const CODEC_PRIORITY = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];
function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || "";
}
function normalizeMime(rawType = "") {
  return String(rawType || "").split(";")[0].trim().toLowerCase();
}
function extensionForMime(mime = "") {
  const base = normalizeMime(mime);
  if (base.includes("ogg")) return "ogg";
  if (base.includes("mpeg")) return "mp3";
  if (base.includes("mp4") || base.includes("m4a") || base.includes("aac")) return "m4a";
  if (base.includes("wav")) return "wav";
  return "webm";
}
function formatTime(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function clamp$1(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function VoiceRecorder({ onSend, onCancel, onStateChange }) {
  const [recordingState, setRecordingState] = reactExports.useState("idle");
  const [duration, setDuration] = reactExports.useState(0);
  const [waveSeed, setWaveSeed] = reactExports.useState(`voice-${Date.now()}`);
  const [previewUrl, setPreviewUrl] = reactExports.useState("");
  const [previewBlob, setPreviewBlob] = reactExports.useState(null);
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
    const rawType = mimeType || previewBlob.type || "audio/webm";
    const cleanType = normalizeMime(rawType) || "audio/webm";
    const ext = extensionForMime(cleanType);
    const file = new File([previewBlob], `voice-note-${Date.now()}.${ext}`, {
      type: cleanType,
      lastModified: Date.now()
    });
    onSend?.({
      blob: previewBlob,
      file,
      durationSeconds: durationRef.current,
      mimeType: cleanType,
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
      /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { ref: audioRef, src: previewUrl, preload: "metadata", style: { display: "none" }, onLoadedMetadata: () => {
        const mediaDuration = clamp$1(audioRef.current?.duration || durationRef.current || 0, 0, 3600);
        if (mediaDuration) {
          durationRef.current = Math.round(mediaDuration);
          setDuration(Math.round(mediaDuration));
        }
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceMessagePlayer, { src: previewUrl, seed: waveSeed, title: "معاينة الرسالة الصوتية" }),
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
const DRAFT_STORAGE_PREFIX = "yamshat-chat-draft-v1";
function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}
function stableKey(value = "") {
  return String(value || "").trim().toLowerCase();
}
function buildStorageKey(currentUser = "", peer = "") {
  return `${DRAFT_STORAGE_PREFIX}:${stableKey(currentUser) || "guest"}:${stableKey(peer) || "unknown"}`;
}
function loadChatDraft(currentUser = "", peer = "") {
  if (!canUseStorage() || !peer) return "";
  try {
    return window.localStorage.getItem(buildStorageKey(currentUser, peer)) || "";
  } catch {
    return "";
  }
}
function persistChatDraft(currentUser = "", peer = "", value = "") {
  if (!canUseStorage() || !peer) return;
  const nextValue = String(value || "");
  try {
    if (!nextValue.trim()) {
      window.localStorage.removeItem(buildStorageKey(currentUser, peer));
      return;
    }
    window.localStorage.setItem(buildStorageKey(currentUser, peer), nextValue);
  } catch {
  }
}
function clearChatDraft(currentUser = "", peer = "") {
  if (!canUseStorage() || !peer) return;
  try {
    window.localStorage.removeItem(buildStorageKey(currentUser, peer));
  } catch {
  }
}
const MESSAGE_LIFECYCLE = Object.freeze({
  DRAFT: "draft",
  QUEUED: "queued",
  PENDING_UPLOAD: "pending_upload",
  UPLOADING: "uploading",
  SYNCING: "syncing",
  SENT: "sent",
  DELIVERED: "delivered",
  SEEN: "seen",
  RETRYING: "retrying",
  FAILED: "failed",
  FAILED_PERMANENT: "failed_permanent",
  EDITED: "edited",
  RECALLED: "recalled",
  DELETED: "deleted"
});
const STATUS_ALIASES = {
  sending: MESSAGE_LIFECYCLE.SYNCING,
  uploaded: MESSAGE_LIFECYCLE.SYNCING,
  upload_failed: MESSAGE_LIFECYCLE.FAILED,
  failed_permanent: MESSAGE_LIFECYCLE.FAILED_PERMANENT,
  deleted: MESSAGE_LIFECYCLE.DELETED,
  recalled: MESSAGE_LIFECYCLE.RECALLED,
  edited: MESSAGE_LIFECYCLE.EDITED
};
const STATUS_ORDER = {
  [MESSAGE_LIFECYCLE.DRAFT]: 0,
  [MESSAGE_LIFECYCLE.QUEUED]: 1,
  [MESSAGE_LIFECYCLE.PENDING_UPLOAD]: 2,
  [MESSAGE_LIFECYCLE.UPLOADING]: 3,
  [MESSAGE_LIFECYCLE.SYNCING]: 4,
  [MESSAGE_LIFECYCLE.SENT]: 5,
  [MESSAGE_LIFECYCLE.DELIVERED]: 6,
  [MESSAGE_LIFECYCLE.SEEN]: 7,
  [MESSAGE_LIFECYCLE.EDITED]: 8,
  [MESSAGE_LIFECYCLE.RECALLED]: 9,
  [MESSAGE_LIFECYCLE.DELETED]: 10,
  [MESSAGE_LIFECYCLE.FAILED]: 11,
  [MESSAGE_LIFECYCLE.FAILED_PERMANENT]: 12
};
function normalizeMessageStatus(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return MESSAGE_LIFECYCLE.SENT;
  return STATUS_ALIASES[raw] || raw;
}
function isFailureStatus(value = "") {
  const normalized = normalizeMessageStatus(value);
  return normalized === MESSAGE_LIFECYCLE.FAILED || normalized === MESSAGE_LIFECYCLE.FAILED_PERMANENT;
}
function getMessageStatusWeight(value = "") {
  return STATUS_ORDER[normalizeMessageStatus(value)] ?? STATUS_ORDER[MESSAGE_LIFECYCLE.SENT];
}
function pickStrongerStatus(...statuses) {
  return statuses.map((status) => normalizeMessageStatus(status)).sort((left, right) => getMessageStatusWeight(right) - getMessageStatusWeight(left))[0] || MESSAGE_LIFECYCLE.SENT;
}
function buildLifecycleState(status = MESSAGE_LIFECYCLE.SENT, patch = {}) {
  const normalized = normalizeMessageStatus(status);
  return {
    status: normalized,
    queued: normalized === MESSAGE_LIFECYCLE.QUEUED,
    syncing: [MESSAGE_LIFECYCLE.SYNCING, MESSAGE_LIFECYCLE.PENDING_UPLOAD, MESSAGE_LIFECYCLE.UPLOADING, MESSAGE_LIFECYCLE.RETRYING].includes(normalized),
    failed: isFailureStatus(normalized),
    isTerminalFailure: normalized === MESSAGE_LIFECYCLE.FAILED_PERMANENT,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...patch
  };
}
function withLifecycle(message = {}, status = message?.status || MESSAGE_LIFECYCLE.SENT, patch = {}) {
  const normalized = normalizeMessageStatus(status);
  return {
    ...message,
    status: normalized,
    lifecycle: buildLifecycleState(normalized, patch)
  };
}
const EMOJI_SET = ["😀", "😂", "😍", "🥹", "👍", "👏", "🔥", "❤️", "💜", "😮", "🤝", "🎉"];
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
    status: MESSAGE_LIFECYCLE.QUEUED,
    progress: 0,
    stage: MESSAGE_LIFECYCLE.QUEUED,
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
function getAttachmentAccent(kind) {
  if (kind === "image") return "linear-gradient(135deg, rgba(34,197,94,0.26), rgba(16,185,129,0.12))";
  if (kind === "video") return "linear-gradient(135deg, rgba(59,130,246,0.24), rgba(14,165,233,0.12))";
  if (kind === "audio") return "linear-gradient(135deg, rgba(236,72,153,0.24), rgba(168,85,247,0.14))";
  return "linear-gradient(135deg, rgba(148,163,184,0.2), rgba(71,85,105,0.1))";
}
function formatAttachmentMeta(entry) {
  const sizeMb = (Number(entry?.file?.size || 0) / (1024 * 1024)).toFixed(1);
  const sizeLabel = Number.isFinite(Number(sizeMb)) ? `${sizeMb} م.ب` : "";
  const stageLabel = entry?.error ? "فشل" : entry?.stage || "جاهز";
  return [stageLabel, sizeLabel].filter(Boolean).join(" • ");
}
function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot, disabled = false, compact = false }) {
  const [text, setText] = reactExports.useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = reactExports.useState(false);
  const [attachments, setAttachments] = reactExports.useState([]);
  const [sending, setSending] = reactExports.useState(false);
  const [isRecording, setIsRecording] = reactExports.useState(false);
  const [messageTimer, setMessageTimer] = reactExports.useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = reactExports.useState(false);
  const [inputExpanded, setInputExpanded] = reactExports.useState(false);
  const typingTimeoutRef = reactExports.useRef(null);
  const isTypingRef = reactExports.useRef(false);
  const fileInputRef = reactExports.useRef(null);
  const attachmentsRef = reactExports.useRef([]);
  const textareaRef = reactExports.useRef(null);
  const emojiPickerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  reactExports.useEffect(() => {
    if (!peer) {
      setText("");
      return;
    }
    setText(loadChatDraft(currentUser, peer));
  }, [currentUser, peer]);
  reactExports.useEffect(() => () => {
    revokeAttachments(attachmentsRef.current);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);
  reactExports.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, compact ? 180 : 220);
    textarea.style.height = `${Math.max(compact ? 52 : 56, nextHeight)}px`;
    setInputExpanded(nextHeight > (compact ? 72 : 86));
  }, [compact, text]);
  reactExports.useEffect(() => {
    if (!showEmojiPicker) return void 0;
    const handlePointerDown = (event) => {
      if (emojiPickerRef.current?.contains(event.target)) return;
      setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showEmojiPicker]);
  const pendingAttachmentCount = reactExports.useMemo(
    () => attachments.filter((item) => item.status === MESSAGE_LIFECYCLE.QUEUED || item.status === MESSAGE_LIFECYCLE.UPLOADING || item.status === MESSAGE_LIFECYCLE.PENDING_UPLOAD).length,
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
    persistChatDraft(currentUser, peer, nextValue);
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
    clearChatDraft(currentUser, peer);
    setAttachments([]);
    setSending(false);
    setShowVoiceRecorder(false);
    setIsRecording(false);
    setShowEmojiPicker(false);
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
    updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.PENDING_UPLOAD, progress: 0, stage: "preparing", error: "" });
    try {
      const uploadResult = await mediaUploadService.uploadFile(entry.file, {
        onProgress: (payload) => {
          updateAttachment(entry.id, {
            status: payload?.percent >= 100 ? MESSAGE_LIFECYCLE.SYNCING : MESSAGE_LIFECYCLE.UPLOADING,
            progress: Number(payload?.percent || 0),
            stage: payload?.stage || "uploading"
          });
        }
      });
      updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.SYNCING, progress: 100, stage: "done", uploadResult });
      return uploadResult;
    } catch (error) {
      updateAttachment(entry.id, { status: MESSAGE_LIFECYCLE.FAILED, error: error?.message || "فشل الرفع", stage: "failed" });
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
  const appendEmoji = (emoji) => {
    const nextValue = `${text}${emoji}`;
    handleTyping(nextValue);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };
  const signalSummary = securitySnapshot?.enabled ? `${securitySnapshot.protocol || "Signal"} • ${securitySnapshot.status || "ready"}` : "Signal bootstrap pending";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `yam-composer-shell ${compact ? "compact" : ""} ${inputExpanded ? "expanded" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-composer-shell {
          position: relative;
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(180deg, rgba(6,10,23,0.96), rgba(10,15,31,0.98));
          box-shadow: 0 24px 50px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }
        .yam-composer-shell.compact {
          border-radius: 26px;
          padding: 12px;
        }
        .yam-composer-shell.expanded {
          border-color: rgba(167,139,250,0.28);
          box-shadow: 0 24px 60px rgba(79,70,229,0.18), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .yam-composer-top,
        .yam-composer-footer,
        .yam-reply-banner,
        .yam-attachments-grid,
        .yam-composer-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .yam-composer-top,
        .yam-composer-footer {
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .yam-composer-chip,
        .yam-timer-select,
        .yam-emoji-btn,
        .yam-action-btn,
        .yam-send-btn,
        .yam-ghost-btn {
          transition: all 180ms ease;
        }
        .yam-composer-chip {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: #dbe4ff;
          padding: 8px 12px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .yam-timer-select {
          min-height: 38px;
          border-radius: 999px;
          padding: 0 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.94);
          color: #fff;
          outline: none;
        }
        .yam-reply-banner {
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 20px;
          border: 1px solid rgba(167,139,250,0.18);
          background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.08));
        }
        .yam-reply-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
          border-right: 3px solid rgba(196,181,253,0.9);
          padding-right: 10px;
        }
        .yam-reply-copy strong,
        .yam-reply-copy span,
        .yam-attachment-copy strong,
        .yam-attachment-copy span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .yam-reply-copy span {
          color: #dbe4ff;
          opacity: 0.78;
          font-size: 13px;
        }
        .yam-attachments-grid {
          flex-wrap: wrap;
          align-items: stretch;
          max-height: 220px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-inline-end: 4px;
        }
        .yam-attachments-grid::-webkit-scrollbar {
          width: 6px;
        }
        .yam-attachments-grid::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.35);
          border-radius: 999px;
        }
        .yam-attachment-card {
          position: relative;
          min-width: 0;
          flex: 1 1 220px;
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          overflow: hidden;
        }
        .yam-attachment-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.9;
          pointer-events: none;
        }
        .yam-attachment-preview {
          width: 100%;
          height: 110px;
          border-radius: 16px;
          object-fit: cover;
          background: rgba(255,255,255,0.04);
        }
        .yam-attachment-head,
        .yam-attachment-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .yam-attachment-head {
          align-items: flex-start;
        }
        .yam-attachment-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .yam-attachment-copy span {
          color: #94a3b8;
          font-size: 12px;
        }
        .yam-progress-track {
          height: 6px;
          width: 100%;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
        }
        .yam-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8b5cf6, #4f46e5);
        }
        .yam-composer-row {
          align-items: flex-end;
          flex-wrap: nowrap;
          min-width: 0;
        }
        .yam-composer-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          flex-shrink: 0;
        }
        .yam-action-btn,
        .yam-emoji-btn,
        .yam-ghost-btn {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          width: 46px;
          height: 46px;
          border-radius: 16px;
          display: inline-grid;
          place-items: center;
          font-size: 18px;
        }
        .yam-action-btn:hover,
        .yam-emoji-btn:hover,
        .yam-ghost-btn:hover,
        .yam-send-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(167,139,250,0.28);
          background: rgba(124,58,237,0.14);
        }
        .yam-action-btn.active,
        .yam-emoji-btn.active {
          background: linear-gradient(135deg, rgba(124,58,237,0.28), rgba(79,70,229,0.22));
          border-color: rgba(167,139,250,0.34);
        }
        .yam-input-frame {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.92);
          padding: 8px 10px 8px 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .yam-input-frame textarea {
          flex: 1;
          min-width: 0;
          resize: none;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          line-height: 1.55;
          font-size: 15px;
          font-family: inherit;
          overflow-y: auto;
        }
        .yam-input-frame textarea::placeholder {
          color: #94a3b8;
        }
        .yam-send-btn {
          border: none;
          min-width: 54px;
          height: 54px;
          border-radius: 20px;
          background: linear-gradient(135deg, #8b5cf6, #4f46e5);
          color: #fff;
          font-weight: 800;
          padding: 0 16px;
          box-shadow: 0 14px 28px rgba(79,70,229,0.28);
          flex: 0 0 auto;
        }
        .yam-send-btn:disabled,
        .yam-action-btn:disabled,
        .yam-emoji-btn:disabled,
        .yam-ghost-btn:disabled,
        .yam-timer-select:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .yam-emoji-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          width: min(320px, calc(100vw - 32px));
          border-radius: 22px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(8,13,27,0.98);
          box-shadow: 0 24px 60px rgba(0,0,0,0.32);
          z-index: 30;
          display: grid;
          gap: 10px;
        }
        .yam-emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
        }
        .yam-emoji-tile {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          height: 42px;
          font-size: 20px;
        }
        .yam-composer-footer {
          color: #94a3b8;
          font-size: 11px;
        }
        @media (max-width: 980px) {
          .yam-composer-shell {
            border-radius: 22px;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 -6px 18px rgba(0,0,0,0.18);
          }
          .yam-attachments-grid {
            max-height: 156px;
          }
          .yam-composer-row {
            gap: 6px;
            flex-wrap: nowrap !important;
            align-items: center;
            min-width: 0;
            width: 100%;
          }
          .yam-composer-actions {
            width: auto;
            justify-content: flex-end;
            flex-shrink: 0;
            gap: 4px;
          }
          .yam-input-frame {
            width: auto;
            flex: 1 1 0%;
            min-width: 0;
            padding: 4px 10px;
            border-radius: 22px;
            align-items: center;
          }
          .yam-input-frame textarea {
            min-width: 0;
            width: 100%;
            font-size: 14px;
            line-height: 1.4;
            min-height: 36px;
            max-height: 110px;
            padding: 6px 0;
            word-break: break-word;
            overflow-wrap: anywhere;
          }
          .yam-action-btn,
          .yam-emoji-btn,
          .yam-ghost-btn {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 16px;
          }
          .yam-send-btn {
            min-width: 42px;
            width: 42px;
            height: 42px;
            border-radius: 14px;
            padding: 0;
            font-size: 16px;
            flex-shrink: 0;
          }
          .yam-emoji-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .yam-composer-footer {
            display: none !important;
          }
          .yam-composer-top {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .yam-action-btn,
          .yam-emoji-btn,
          .yam-ghost-btn {
            width: 36px;
            height: 36px;
            border-radius: 12px;
          }
          .yam-composer-actions {
            gap: 2px;
          }
          .yam-input-frame {
            padding: 4px 8px;
          }
        }
      ` }),
    !compact ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-top", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-chip", children: [
        "🔐 ",
        signalSummary
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-top", style: { gap: 8 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "yam-composer-chip", style: { paddingInline: 10 }, children: "الرسائل المختفية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            value: messageTimer,
            disabled: composerDisabled,
            onChange: (event) => setMessageTimer(Number(event.target.value || 0)),
            className: "yam-timer-select",
            children: DISAPPEARING_MESSAGE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-chip", children: [
          "⏱ ",
          timerLabel(messageTimer)
        ] })
      ] })
    ] }) : null,
    replyTo ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-reply-banner", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-reply-copy", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          "رد على ",
          replyTo.sender || peer
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: replyTo.content || replyTo.message || "رسالة بدون نص" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-ghost-btn", onClick: onCancelReply, disabled: composerDisabled, "aria-label": "إلغاء الرد", children: "×" })
    ] }) : null,
    attachments.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-attachments-grid", children: attachments.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-attachment-card", style: { background: getAttachmentAccent(entry.kind) }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-attachment-head", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-attachment-copy", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: entry.file.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatAttachmentMeta(entry) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-ghost-btn", onClick: () => removeAttachment(entry.id), disabled: composerDisabled, "aria-label": "حذف المرفق", children: "×" })
      ] }),
      entry.previewUrl && entry.kind === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: entry.previewUrl, alt: entry.file.name, className: "yam-attachment-preview" }) : null,
      entry.previewUrl && entry.kind === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: entry.previewUrl, className: "yam-attachment-preview", muted: true }) : null,
      entry.kind === "audio" && entry.previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceMessagePlayer, { src: entry.previewUrl, seed: entry.id, bubbleless: true, title: "معاينة صوت" }) : null,
      entry.kind !== "image" && entry.kind !== "video" && entry.kind !== "audio" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-attachment-preview", style: { display: "grid", placeItems: "center", fontSize: 30 }, children: "📄" }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-attachment-meta", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { fontSize: 12, color: "#dbe4ff" }, children: [
          entry.progress,
          "%"
        ] }),
        entry.error ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: 12, color: "#fecaca" }, children: entry.error }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-progress-track", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "yam-progress-fill",
          style: {
            width: `${entry.progress}%`,
            background: entry.status === MESSAGE_LIFECYCLE.FAILED ? "#ef4444" : "linear-gradient(90deg, #8b5cf6, #4f46e5)"
          }
        }
      ) })
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-actions", ref: emojiPickerRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `yam-emoji-btn ${showEmojiPicker ? "active" : ""}`,
            disabled: composerDisabled,
            onClick: () => setShowEmojiPicker((prev) => !prev),
            "aria-label": "إيموجي",
            children: "😊"
          }
        ),
        showEmojiPicker ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-emoji-popover", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: { fontSize: 13 }, children: "ردود سريعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-emoji-grid", children: EMOJI_SET.map((emoji) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-emoji-tile", onClick: () => appendEmoji(emoji), children: emoji }, emoji)) })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "yam-action-btn", style: { cursor: composerDisabled ? "not-allowed" : "pointer" }, "aria-label": "إرفاق ملف", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", hidden: true, multiple: true, disabled: composerDisabled, onChange: (event) => handleFilesAdded(event.target.files) }),
          "📎"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `yam-action-btn ${showVoiceRecorder || isRecording ? "active" : ""}`,
            disabled: composerDisabled,
            onClick: () => {
              setShowVoiceRecorder((prev) => !prev);
              setShowEmojiPicker(false);
            },
            "aria-label": "رسالة صوتية",
            children: "🎤"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-input-frame", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            ref: textareaRef,
            disabled: composerDisabled,
            placeholder: disabled ? "المحادثة معطلة حالياً" : peer ? `اكتب رسالة إلى ${peer}...` : "اكتب رسالة...",
            value: text,
            rows: 1,
            onChange: (event) => handleTyping(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "yam-send-btn",
            onClick: handleSend,
            disabled: composerDisabled || sending || !text.trim() && attachments.length === 0,
            children: sending ? "..." : compact ? "➤" : "إرسال"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-composer-footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: pendingAttachmentCount > 0 ? `مرفقات قيد الإرسال: ${pendingAttachmentCount}` : inputExpanded ? "مساحة كتابة ممتدة مع Shift + Enter لسطر جديد" : "إدخال قابل للتمدد + معاينة مرفقات + تسجيل صوتي + إيموجي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: messageTimer ? `الاختفاء: ${timerLabel(messageTimer)}` : "وضع الرسائل العادية" })
    ] })
  ] });
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeItems(items, item) {
  if (Array.isArray(items) && items.length) {
    return items.map((entry, index) => ({
      id: entry.id || `${entry.url || "media"}-${index}`,
      title: entry.title || "الوسائط",
      type: entry.type || "image",
      url: entry.url,
      caption: entry.caption || ""
    })).filter((entry) => Boolean(entry.url));
  }
  if (item?.url) {
    return [{
      id: item.id || item.url,
      title: item.title || "الوسائط",
      type: item.type || "image",
      url: item.url,
      caption: item.caption || ""
    }];
  }
  return [];
}
function MediaViewerModal({ item, items = [], initialIndex = 0, onClose }) {
  const mediaItems = reactExports.useMemo(() => normalizeItems(items, item), [item, items]);
  const [currentIndex, setCurrentIndex] = reactExports.useState(clamp(initialIndex, 0, Math.max(0, mediaItems.length - 1)));
  const [zoom, setZoom] = reactExports.useState(1);
  const [offset, setOffset] = reactExports.useState({ x: 0, y: 0 });
  const [isEntering, setIsEntering] = reactExports.useState(true);
  const [gestureState, setGestureState] = reactExports.useState({ mode: "idle", startX: 0, startY: 0, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0, pinchDistance: 0, pinchZoom: 1 });
  const overlayRef = reactExports.useRef(null);
  const mediaRef = reactExports.useRef(null);
  const open = mediaItems.length > 0;
  const currentItem = mediaItems[currentIndex] || null;
  const hasNavigation = mediaItems.length > 1;
  const resetTransform = reactExports.useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);
  const goNext = reactExports.useCallback(() => {
    if (!hasNavigation) return;
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    resetTransform();
  }, [hasNavigation, mediaItems.length, resetTransform]);
  const goPrevious = reactExports.useCallback(() => {
    if (!hasNavigation) return;
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    resetTransform();
  }, [hasNavigation, mediaItems.length, resetTransform]);
  const closeViewer = reactExports.useCallback(() => {
    setIsEntering(false);
    window.setTimeout(() => onClose?.(), 180);
  }, [onClose]);
  reactExports.useEffect(() => {
    if (!open) return void 0;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "+") setZoom((prev) => clamp(prev + 0.2, 1, 4));
      if (event.key === "-") setZoom((prev) => clamp(prev - 0.2, 1, 4));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeViewer, goNext, goPrevious, open]);
  reactExports.useEffect(() => {
    setCurrentIndex(clamp(initialIndex, 0, Math.max(0, mediaItems.length - 1)));
    resetTransform();
  }, [initialIndex, mediaItems.length, resetTransform]);
  reactExports.useEffect(() => {
    if (!open) return void 0;
    const timer = window.setTimeout(() => setIsEntering(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, currentIndex]);
  const handleWheel = reactExports.useCallback((event) => {
    if (currentItem?.type !== "image") return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 0.2 : -0.2;
    setZoom((prev) => clamp(prev + direction, 1, 4));
  }, [currentItem?.type]);
  const handleTouchStart = reactExports.useCallback((event) => {
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      setGestureState({
        mode: "pinch",
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        deltaX: 0,
        deltaY: 0,
        pinchDistance: distance,
        pinchZoom: zoom
      });
      return;
    }
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setGestureState({
        mode: zoom > 1 ? "pan" : "swipe",
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        pinchDistance: 0,
        pinchZoom: zoom
      });
    }
  }, [zoom]);
  const handleTouchMove = reactExports.useCallback((event) => {
    if (gestureState.mode === "pinch" && event.touches.length === 2) {
      const [first, second] = event.touches;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const scale = gestureState.pinchDistance ? distance / gestureState.pinchDistance : 1;
      setZoom(clamp(gestureState.pinchZoom * scale, 1, 4));
      return;
    }
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - gestureState.startX;
    const deltaY = touch.clientY - gestureState.startY;
    if (gestureState.mode === "pan") {
      event.preventDefault();
      setOffset({ x: deltaX, y: deltaY });
      return;
    }
    setGestureState((prev) => ({ ...prev, lastX: touch.clientX, lastY: touch.clientY, deltaX, deltaY }));
  }, [gestureState]);
  const handleTouchEnd = reactExports.useCallback(() => {
    if (gestureState.mode === "swipe" && Math.abs(gestureState.deltaX) > 70 && Math.abs(gestureState.deltaX) > Math.abs(gestureState.deltaY)) {
      if (gestureState.deltaX < 0) goNext();
      else goPrevious();
    }
    if (gestureState.mode === "pan") {
      setOffset((prev) => ({ x: prev.x * 0.6, y: prev.y * 0.6 }));
    }
    setGestureState({ mode: "idle", startX: 0, startY: 0, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0, pinchDistance: 0, pinchZoom: zoom });
  }, [gestureState, goNext, goPrevious, zoom]);
  const requestFullscreen = reactExports.useCallback(() => {
    const target = overlayRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    target.requestFullscreen?.().catch(() => {
    });
  }, []);
  if (!open || !currentItem) return null;
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: overlayRef,
        className: `yam-media-viewer ${isEntering ? "entering" : ""}`,
        onClick: (event) => {
          if (event.target === overlayRef.current) closeViewer();
        },
        onWheel: handleWheel,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        role: "dialog",
        "aria-modal": "true",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-topbar", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-counter", children: [
              currentIndex + 1,
              " / ",
              mediaItems.length
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-actions", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setZoom((prev) => clamp(prev - 0.2, 1, 4)), children: "−" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setZoom((prev) => clamp(prev + 0.2, 1, 4)), children: "+" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: requestFullscreen, children: "⤢" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: closeViewer, children: "✕" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-stage", children: [
            hasNavigation ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-media-nav prev", onClick: goPrevious, children: "←" }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-media-frame", style: { transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }, children: currentItem.type === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "video",
              {
                ref: mediaRef,
                src: currentItem.url,
                className: "yam-media-asset",
                controls: true,
                autoPlay: true,
                playsInline: true,
                preload: "metadata"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { ref: mediaRef, src: currentItem.url, alt: currentItem.title || "media", className: "yam-media-asset" }) }),
            hasNavigation ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-media-nav next", onClick: goNext, children: "→" }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-media-caption", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentItem.title }),
            currentItem.caption ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: currentItem.caption }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اسحب يمين/شمال للتنقل، pinch للزووم، ودبل كليك من الفقاعة يفتح العرض الكامل." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        .yam-media-viewer {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(1, 4, 14, 0.98);
          display: grid;
          grid-template-rows: auto 1fr auto;
          backdrop-filter: blur(18px);
          animation: yamMediaFade 180ms ease;
        }
        .yam-media-viewer.entering .yam-media-frame {
          transform: translate3d(0, 18px, 0) scale(0.98) !important;
          opacity: 0.92;
        }
        .yam-media-topbar,
        .yam-media-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px;
          color: #fff;
        }
        .yam-media-caption {
          align-items: flex-start;
          flex-direction: column;
          justify-content: flex-start;
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,0.38));
        }
        .yam-media-actions {
          display: inline-flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .yam-media-actions button,
        .yam-media-nav,
        .yam-media-counter {
          min-height: 44px;
          min-width: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.08);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 32px rgba(0,0,0,0.24);
          backdrop-filter: blur(18px);
        }
        .yam-media-counter {
          padding: 0 14px;
          font-weight: 800;
        }
        .yam-media-stage {
          position: relative;
          min-height: 0;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 20px 72px;
        }
        .yam-media-frame {
          max-width: min(94vw, 1240px);
          max-height: calc(100vh - 180px);
          transition: transform 200ms ease, opacity 200ms ease;
          will-change: transform;
        }
        .yam-media-asset {
          display: block;
          max-width: min(94vw, 1240px);
          max-height: calc(100vh - 180px);
          object-fit: contain;
          border-radius: 28px;
          box-shadow: 0 28px 70px rgba(0,0,0,0.45);
          background: rgba(255,255,255,0.02);
        }
        .yam-media-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          font-size: 20px;
        }
        .yam-media-nav.prev { left: 20px; }
        .yam-media-nav.next { right: 20px; }
        @keyframes yamMediaFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 720px) {
          .yam-media-topbar,
          .yam-media-caption {
            padding: 14px;
          }
          .yam-media-stage {
            padding: 14px 12px 20px;
          }
          .yam-media-nav {
            bottom: 76px;
            top: auto;
            transform: none;
          }
          .yam-media-nav.prev { left: 14px; }
          .yam-media-nav.next { right: 14px; }
        }
      ` })
        ]
      }
    ),
    document.body
  );
}
const CHAT_NAV_ITEMS = [
  { key: "chats", label: "الدردشات", icon: "💬" },
  { key: "groups", label: "المجموعات", icon: "👥" },
  { key: "friends", label: "الأصدقاء", icon: "👤" },
  { key: "notifications", label: "الإشعارات", icon: "🔔" },
  { key: "settings", label: "الإعدادات", icon: "⚙️" }
];
const CHAT_FIXTURE_CONTACTS = [];
function fallbackHandle(name = "") {
  const value = String(name || "").trim().replace(/\s+/g, "_").replace(/^@+/, "").toLowerCase();
  return value ? `@${value}` : "";
}
function formatThreadTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = /* @__PURE__ */ new Date();
  const sameDay = today.toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  }
  const startOfToday = /* @__PURE__ */ new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 864e5);
  if (diffDays === 1) return "أمس";
  return date.toLocaleDateString("ar-EG", { weekday: "long" });
}
function getPreviewByType(source = {}) {
  const messageType = String(source?.last_message_type || source?.type || "").toLowerCase();
  const content = source?.last_message || source?.preview || source?.message || "";
  if (content && String(content).trim()) {
    if (messageType === "voice") return `🎤 ${content}`;
    if (["image", "photo"].includes(messageType)) return `🖼️ ${content}`;
    if (["video"].includes(messageType)) return `🎬 ${content}`;
    if (["file", "document"].includes(messageType)) return `📎 ${content}`;
    return content;
  }
  if (messageType === "voice") return "🎤 رسالة صوتية";
  if (["image", "photo"].includes(messageType)) return "🖼️ صورة";
  if (["video"].includes(messageType)) return "🎬 فيديو";
  if (["file", "document"].includes(messageType)) return "📎 ملف";
  return "ابدأ المحادثة الآن";
}
function buildPresenceLabels(source = {}) {
  const presence = source?.presence || {};
  const isOnline = Boolean(source?.is_online ?? source?.isOnline ?? presence?.is_online ?? false);
  const lastSeenValue = source?.last_seen || presence?.last_seen || source?.updated_at || source?.created_at || null;
  const lastSeenLabel = isOnline ? "متصل الآن" : lastSeenValue ? `آخر ظهور ${formatThreadTime(lastSeenValue)}` : "آخر ظهور مؤخراً";
  return {
    isOnline,
    statusText: source?.statusText || lastSeenLabel,
    lastSeenLabel: source?.lastSeenLabel || lastSeenLabel
  };
}
function normalizeUsername(source = {}, index = 0) {
  return String(
    source?.username || source?.user || source?.peer_username || source?.participant_username || source?.name || `محادثة ${index + 1}`
  ).trim();
}
function normalizeContact(source, index = 0) {
  const username = normalizeUsername(source, index);
  const preview = getPreviewByType(source);
  const unreadCount = Number(source?.unread_count ?? source?.unreadCount ?? 0);
  const avatar = source?.avatar || source?.avatar_url || source?.image || "";
  const timeLabel = formatThreadTime(source?.last_message_at || source?.updated_at || source?.created_at) || source?.timeLabel || "";
  const presenceLabels = buildPresenceLabels(source);
  return {
    id: String(source?.id || username || `contact-${index + 1}`),
    username,
    avatar,
    preview,
    unreadCount,
    timeLabel,
    isOnline: presenceLabels.isOnline,
    statusText: presenceLabels.statusText,
    lastSeenLabel: presenceLabels.lastSeenLabel,
    handle: source?.handle || fallbackHandle(username),
    email: source?.email || "",
    phone: source?.phone || "",
    sharedMedia: Array.isArray(source?.sharedMedia) ? source.sharedMedia : [],
    avatarGradient: avatarGradient(username),
    raw: source || {}
  };
}
function dedupeContacts(items = []) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    const key = String(item?.username || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function buildContacts(threads = [], activeUsername = "") {
  const normalizedThreads = Array.isArray(threads) ? dedupeContacts(threads.map((thread, index) => normalizeContact(thread, index))) : [];
  if (activeUsername && !normalizedThreads.find((item) => item.username === activeUsername)) {
    normalizedThreads.unshift(normalizeContact({ username: activeUsername }, normalizedThreads.length));
  }
  return normalizedThreads.sort(
    (left, right) => Number(right.unreadCount || 0) - Number(left.unreadCount || 0) || String(right.timeLabel || "").localeCompare(String(left.timeLabel || ""))
  );
}
function getContactDetails(threads = [], username = "") {
  if (!username) {
    return normalizeContact({
      username: "",
      preview: "",
      handle: "",
      email: "",
      phone: "",
      statusText: "لا توجد محادثة محددة",
      lastSeenLabel: "لا توجد بيانات"
    }, 0);
  }
  const contacts = buildContacts(threads, username);
  return contacts.find((item) => item.username === username) || normalizeContact({ username }, 0);
}
const EMPTY_MESSAGES = [];
const REACTION_STORAGE_KEY = "yamshat-message-reactions-v2";
function formatDayKey(value) {
  if (!value) return "unknown";
  try {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  } catch {
    return "unknown";
  }
}
function formatDayLabel(value) {
  if (!value) return "اليوم";
  try {
    const date = new Date(value);
    const today = /* @__PURE__ */ new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfDate) / 864e5);
    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "أمس";
    return date.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return "اليوم";
  }
}
function extractFileName(message) {
  if (message.attachment_name) return message.attachment_name;
  if (Array.isArray(message.attachments) && message.attachments[0]?.fileName) return message.attachments[0].fileName;
  const mediaUrl = message.media_url || "";
  if (!mediaUrl) return "ملف مرفق";
  try {
    const clean = mediaUrl.split("?")[0];
    return decodeURIComponent(clean.split("/").pop() || "ملف مرفق");
  } catch {
    return "ملف مرفق";
  }
}
function messageMatchesSearch(message, query) {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return true;
  return [
    message.content,
    message.message,
    message.sender,
    extractFileName(message)
  ].some((value) => String(value || "").toLowerCase().includes(lowered));
}
function normalizeChatMessage(message = {}) {
  return withLifecycle({
    ...message,
    id: message?.id ?? message?.message_id ?? message?.client_id,
    client_id: message?.client_id ?? message?.id ?? message?.message_id
  }, message?.status || message?.lifecycle?.status || MESSAGE_LIFECYCLE.SENT);
}
function normalizeMessages(messages = []) {
  const merged = /* @__PURE__ */ new Map();
  (Array.isArray(messages) ? messages : []).forEach((entry) => {
    const message = normalizeChatMessage(entry);
    const key = String(message?.id || message?.client_id || `${message?.sender}:${message?.receiver}:${message?.created_at}`);
    const previous = merged.get(key);
    merged.set(
      key,
      previous ? normalizeChatMessage({
        ...previous,
        ...message,
        status: normalizeMessageStatus(message?.status || previous?.status)
      }) : message
    );
  });
  return Array.from(merged.values()).sort(
    (left, right) => new Date(left?.created_at || 0).getTime() - new Date(right?.created_at || 0).getTime()
  );
}
function resolveMediaType(message = {}) {
  const mediaUrl = String(message?.media_url || "");
  if (message?.type === "video" || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(mediaUrl)) return "video";
  return "image";
}
function readReactionStore() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REACTION_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeReactionStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(store || {}));
}
function loadPeerReactions(peer) {
  const store = readReactionStore();
  return store?.[peer] || {};
}
function savePeerReactions(peer, reactions) {
  const store = readReactionStore();
  store[peer] = reactions || {};
  writeReactionStore(store);
}
function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const peer = decodeURIComponent(userId || "").trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();
  const threadsMap = useChatStore((state) => state.threadsByUsername);
  const conversationState = useChatStore((state) => peer ? state.conversationsByPeer[peer] : null);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const hydrateThreads = useChatStore((state) => state.hydrateThreads);
  const replaceConversationMessages = useChatStore((state) => state.replaceConversationMessages);
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage);
  const reconcileOptimisticMessage = useChatStore((state) => state.reconcileOptimisticMessage);
  const applyMessagePatch = useChatStore((state) => state.applyMessagePatch);
  const setPresenceStore = useChatStore((state) => state.setPresence);
  const markThreadRead = useChatStore((state) => state.markThreadRead);
  const queueAction = useAppStore((state) => state.queueAction);
  const [threadsLoading, setThreadsLoading] = reactExports.useState(true);
  const [msgLoading, setMsgLoading] = reactExports.useState(false);
  const [blockStatus, setBlockStatus] = reactExports.useState({ can_chat: true, blocked_by_me: false, blocked_me: false });
  const [replyTo, setReplyTo] = reactExports.useState(null);
  const [callMode, setCallMode] = reactExports.useState(null);
  const [flyingHearts, setFlyingHearts] = reactExports.useState([]);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showDetailsDrawer, setShowDetailsDrawer] = reactExports.useState(false);
  const [mediaViewerState, setMediaViewerState] = reactExports.useState({ open: false, index: 0 });
  const initialChatPrefs = reactExports.useMemo(() => getChatPreferences(), []);
  const [isMutedConversation, setIsMutedConversation] = reactExports.useState(initialChatPrefs.muted.has(peer));
  const [isPinnedConversation, setIsPinnedConversation] = reactExports.useState(initialChatPrefs.pinned.has(peer));
  const [reactionsByMessage, setReactionsByMessage] = reactExports.useState(() => loadPeerReactions(peer));
  const [showJumpToBottom, setShowJumpToBottom] = reactExports.useState(false);
  const messagesEndRef = reactExports.useRef(null);
  const messagesAreaRef = reactExports.useRef(null);
  const searchInputRef = reactExports.useRef(null);
  const messageNodesRef = reactExports.useRef({});
  const shouldAutoScrollRef = reactExports.useRef(true);
  const scrollMetricsRef = reactExports.useRef({ height: 0, lastMessageId: "" });
  const handleSidebarNavigation = reactExports.useCallback((key) => {
    const routeMap = {
      chats: "/inbox",
      groups: "/groups",
      friends: "/users",
      notifications: "/notifications",
      settings: "/settings"
    };
    const target = routeMap[key] || "/inbox";
    navigate(target);
    if (target !== "/inbox") {
      pushToast({ type: "info", title: "تم فتح القسم", description: "تم تحويلك إلى القسم المطلوب من شريط المحادثة." });
    }
  }, [navigate, pushToast]);
  const openChatSettings = reactExports.useCallback(() => {
    if (!peer) return;
    navigate(`/chat/${encodeURIComponent(peer)}/settings`);
  }, [navigate, peer]);
  useViewportHeight();
  const threadList = reactExports.useMemo(() => Object.values(threadsMap || {}), [threadsMap]);
  const messages = reactExports.useMemo(() => normalizeMessages(conversationState?.messages || EMPTY_MESSAGES), [conversationState?.messages]);
  const visibleMessages = reactExports.useMemo(
    () => messages.filter((item) => messageMatchesSearch(item, searchQuery)),
    [messages, searchQuery]
  );
  const peerPresence = threadsMap?.[peer]?.presence || {};
  reactExports.useEffect(() => {
    setReactionsByMessage(loadPeerReactions(peer));
  }, [peer]);
  reactExports.useEffect(() => {
    if (!peer) return;
    savePeerReactions(peer, reactionsByMessage);
  }, [peer, reactionsByMessage]);
  reactExports.useEffect(() => {
    let active = true;
    setThreadsLoading(true);
    getChatThreads().then(({ data }) => {
      if (!active) return;
      const threads = Array.isArray(data) ? data : [];
      hydrateThreads(threads, { replace: true });
    }).catch(() => {
    }).finally(() => {
      if (active) setThreadsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [hydrateThreads]);
  const loadMessages = reactExports.useCallback(async () => {
    if (!peer) return;
    setMsgLoading(true);
    try {
      const { data } = await getMessages(peer, 60);
      replaceConversationMessages(peer, data?.items || [], {
        hasMore: Boolean(data?.paging?.has_more),
        oldestMessageId: data?.paging?.next_before_id,
        limit: 250
      });
      await markMessagesSeen(peer);
      markThreadRead(peer);
    } catch {
      pushToast({ type: "error", title: "خطأ", description: "تعذر تحميل الرسائل" });
    } finally {
      setMsgLoading(false);
    }
  }, [markThreadRead, peer, pushToast, replaceConversationMessages]);
  reactExports.useEffect(() => {
    if (!peer) return void 0;
    const prefs = getChatPreferences();
    setIsMutedConversation(prefs.muted.has(peer));
    setIsPinnedConversation(prefs.pinned.has(peer));
    setShowDetailsDrawer(false);
    setActivePeer(peer);
    loadMessages();
    getPresence(peer).then(({ data }) => {
      setPresenceStore(peer, data || {});
    }).catch(() => {
    });
    getBlockStatus(peer).then(({ data }) => {
      setBlockStatus(data || {});
    }).catch(() => {
    });
    return () => setActivePeer(null);
  }, [loadMessages, peer, setActivePeer, setPresenceStore]);
  const scrollToBottom = reactExports.useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);
  const handleMessagesScroll = reactExports.useCallback(() => {
    const node = messagesAreaRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.clientHeight - node.scrollTop;
    const nearBottom = distanceFromBottom <= 120;
    shouldAutoScrollRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);
  reactExports.useLayoutEffect(() => {
    const node = messagesAreaRef.current;
    const latestMessage = visibleMessages[visibleMessages.length - 1];
    if (!node) return;
    const currentHeight = node.scrollHeight;
    const previousHeight = scrollMetricsRef.current.height;
    const previousLastMessageId = scrollMetricsRef.current.lastMessageId;
    const latestMessageId = String(latestMessage?.id || latestMessage?.client_id || "");
    const heightDelta = currentHeight - previousHeight;
    const shouldStickToBottom = previousHeight === 0 || shouldAutoScrollRef.current || latestMessage?.sender === currentUser || Boolean(replyTo);
    if (shouldStickToBottom) {
      window.requestAnimationFrame(() => scrollToBottom(previousHeight === 0 ? "auto" : "smooth"));
    } else if (heightDelta > 0 && previousLastMessageId !== latestMessageId) {
      node.scrollTop += heightDelta;
    }
    scrollMetricsRef.current = { height: currentHeight, lastMessageId: latestMessageId };
  }, [currentUser, replyTo, scrollToBottom, visibleMessages]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return void 0;
    const syncViewportWithConversation = () => {
      if (!shouldAutoScrollRef.current) return;
      window.requestAnimationFrame(() => scrollToBottom("auto"));
    };
    window.visualViewport.addEventListener("resize", syncViewportWithConversation);
    window.visualViewport.addEventListener("scroll", syncViewportWithConversation);
    return () => {
      window.visualViewport.removeEventListener("resize", syncViewportWithConversation);
      window.visualViewport.removeEventListener("scroll", syncViewportWithConversation);
    };
  }, [scrollToBottom]);
  reactExports.useEffect(() => {
    const handleQueuedSent = (event) => {
      const detail = event?.detail || {};
      const serverMessage = detail?.response || {};
      if (!peer) return;
      const peerName = serverMessage?.sender === currentUser ? serverMessage?.receiver : serverMessage?.sender;
      if (peerName && peerName !== peer) return;
      reconcileOptimisticMessage(peer, detail.client_id || detail.queuedId, serverMessage);
    };
    const handleQueuedFailed = (event) => {
      const detail = event?.detail || {};
      applyMessagePatch(peer, [detail.client_id || detail.queuedId], withLifecycle({
        queue_error: detail.error || "فشل دائم في مزامنة الرسالة"
      }, detail.permanent ? MESSAGE_LIFECYCLE.FAILED_PERMANENT : MESSAGE_LIFECYCLE.FAILED));
    };
    window.addEventListener("yamshat:queued-message-sent", handleQueuedSent);
    window.addEventListener("yamshat:queued-message-failed", handleQueuedFailed);
    return () => {
      window.removeEventListener("yamshat:queued-message-sent", handleQueuedSent);
      window.removeEventListener("yamshat:queued-message-failed", handleQueuedFailed);
    };
  }, [applyMessagePatch, peer, reconcileOptimisticMessage, currentUser]);
  const handleSend = async (payload) => {
    const text = payload?.text?.trim() || "";
    const mediaUrl = payload?.media_url || "";
    if (!text && !mediaUrl) return;
    const tempId = `tmp-${Date.now()}`;
    const requestPayload = {
      receiver: peer,
      message: text,
      media_url: mediaUrl,
      media_urls: payload?.media_urls || [],
      type: mediaUrl ? payload.type || "media" : "text",
      reply_to_id: replyTo?.id || null,
      client_id: tempId,
      security_payload: payload?.securityPayload || null,
      disappearing_in_seconds: Number(payload?.disappearing_in_seconds || 0),
      attachments: payload?.attachments || []
    };
    const initialStatus = typeof navigator !== "undefined" && navigator.onLine === false ? MESSAGE_LIFECYCLE.QUEUED : MESSAGE_LIFECYCLE.SYNCING;
    const tempMsg = normalizeChatMessage({
      id: tempId,
      client_id: tempId,
      sender: currentUser,
      receiver: peer,
      content: text,
      message: text,
      media_url: mediaUrl,
      attachments: payload?.attachments || [],
      attachment_name: payload?.attachments?.[0]?.fileName || payload?.attachments?.[0]?.originalName || "",
      type: requestPayload.type,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: initialStatus,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content || replyTo.message } : null
    });
    applyIncomingMessage(tempMsg, currentUser, { peer, skipUnreadIncrement: true, limit: 250 });
    hydrateThreads([
      {
        username: peer,
        last_message: text || "📎 مرفق",
        last_message_type: requestPayload.type,
        last_message_at: tempMsg.created_at
      }
    ]);
    setReplyTo(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      queueAction({
        type: "chat:send_message",
        priority: "high",
        payload: requestPayload,
        client_id: tempId
      });
      pushToast({ type: "info", title: "تمت جدولة الرسالة", description: "الرسالة محفوظة وسيتم إرسالها عند عودة الاتصال." });
      return;
    }
    try {
      const { data } = await sendMessageApi(requestPayload);
      reconcileOptimisticMessage(peer, tempId, data || {});
    } catch (error) {
      const statusCode = Number(error?.response?.status || 0);
      const shouldQueue = !statusCode || statusCode >= 500 || statusCode === 429;
      if (shouldQueue) {
        queueAction({
          type: "chat:send_message",
          priority: "high",
          payload: requestPayload,
          client_id: tempId,
          attempts: 0
        });
        applyMessagePatch(
          peer,
          [tempId],
          withLifecycle({}, MESSAGE_LIFECYCLE.RETRYING, { queuedAt: (/* @__PURE__ */ new Date()).toISOString() })
        );
        pushToast({ type: "warning", title: "تعذر الإرسال الآن", description: "تم نقل الرسالة إلى طابور المزامنة." });
        return;
      }
      applyMessagePatch(
        peer,
        [tempId],
        withLifecycle({}, MESSAGE_LIFECYCLE.FAILED_PERMANENT, { error: error?.response?.data?.detail || "فشل إرسال الرسالة" })
      );
      pushToast({ type: "error", title: "خطأ", description: error?.response?.data?.detail || "فشل إرسال الرسالة" });
    }
  };
  const handleDelete = async (msgId, deleteForEveryone = false) => {
    try {
      await deleteMessageApi(msgId, { delete_for_everyone: deleteForEveryone });
      applyMessagePatch(
        peer,
        [msgId],
        withLifecycle(
          {
            deleted: true,
            deleted_for_everyone: deleteForEveryone,
            content: "",
            message: ""
          },
          MESSAGE_LIFECYCLE.DELETED
        )
      );
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
  const handlePinConversation = () => {
    const nextSet = toggleChatPreference("pinned", peer);
    const next = nextSet.has(peer);
    setIsPinnedConversation(next);
    pushToast({ type: "success", title: next ? "تم تثبيت المحادثة" : "تم إلغاء التثبيت" });
  };
  const handleArchiveConversation = () => {
    toggleChatPreference("archived", peer);
    pushToast({ type: "success", title: "تم أرشفة المحادثة", description: "يمكنك إظهارها من تبويب المؤرشفة في الصفحة الرئيسية." });
  };
  const spawnHeart = () => {
    const id = Date.now();
    setFlyingHearts((prev) => [...prev, id]);
    setTimeout(() => setFlyingHearts((prev) => prev.filter((item) => item !== id)), 1800);
  };
  const handleReact = reactExports.useCallback((message, emoji) => {
    const messageId = String(message?.id || message?.client_id);
    setReactionsByMessage((prev) => {
      const current = prev[messageId] || { counts: {}, myReaction: null };
      const nextCounts = { ...current.counts || {} };
      if (current.myReaction === emoji) {
        nextCounts[emoji] = Math.max(0, Number(nextCounts[emoji] || 0) - 1);
        if (!nextCounts[emoji]) delete nextCounts[emoji];
        return { ...prev, [messageId]: { counts: nextCounts, myReaction: null } };
      }
      if (current.myReaction) {
        nextCounts[current.myReaction] = Math.max(0, Number(nextCounts[current.myReaction] || 0) - 1);
        if (!nextCounts[current.myReaction]) delete nextCounts[current.myReaction];
      }
      nextCounts[emoji] = Number(nextCounts[emoji] || 0) + 1;
      return { ...prev, [messageId]: { counts: nextCounts, myReaction: emoji } };
    });
  }, []);
  const registerMessageNode = reactExports.useCallback((id, node) => {
    if (!id) return;
    if (node) messageNodesRef.current[id] = node;
    else delete messageNodesRef.current[id];
  }, []);
  const jumpToReply = reactExports.useCallback((messageId) => {
    if (!messageId) return;
    const target = messageNodesRef.current[String(messageId)];
    if (!target) {
      pushToast({ type: "info", title: "الرسالة المرجعية غير ظاهرة حالياً" });
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("reply-highlight");
    window.setTimeout(() => target.classList.remove("reply-highlight"), 1600);
  }, [pushToast]);
  const contacts = reactExports.useMemo(() => buildContacts(threadList, peer), [peer, threadList]);
  const peerDetails = reactExports.useMemo(() => getContactDetails(threadList, peer), [peer, threadList]);
  const filteredContacts = reactExports.useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    if (!lowered) return contacts;
    return contacts.filter((contact) => String(contact.username).toLowerCase().includes(lowered) || String(contact.preview).toLowerCase().includes(lowered));
  }, [contacts, searchQuery]);
  const isOnline = Boolean(peerPresence.is_online ?? peerDetails.isOnline);
  const isTyping = Boolean(peerPresence.is_typing);
  const lastSeen = peerPresence.last_seen;
  const mediaMessages = reactExports.useMemo(() => messages.filter((item) => item.media_url), [messages]);
  const fileMessages = reactExports.useMemo(() => messages.filter((item) => item.type === "file" || item.type === "voice"), [messages]);
  const mediaGallery = reactExports.useMemo(() => mediaMessages.map((item, index) => ({
    id: String(item.id || item.client_id || index),
    type: resolveMediaType(item),
    url: item.media_url,
    title: extractFileName(item),
    caption: item.content || item.message || ""
  })), [mediaMessages]);
  const handleOpenMedia = reactExports.useCallback((message) => {
    const id = String(message?.id || message?.client_id || "");
    const nextIndex = Math.max(0, mediaGallery.findIndex((entry) => entry.id === id));
    setMediaViewerState({ open: true, index: nextIndex });
  }, [mediaGallery]);
  const messageResultsCount = searchQuery.trim() ? visibleMessages.length : messages.length;
  const renderableItems = reactExports.useMemo(() => {
    let lastDayKey = "";
    return visibleMessages.flatMap((message, index) => {
      const currentDayKey = formatDayKey(message.created_at);
      const items = [];
      if (currentDayKey !== lastDayKey) {
        items.push({ kind: "day", id: `day-${currentDayKey}-${index}`, label: formatDayLabel(message.created_at) });
        lastDayKey = currentDayKey;
      }
      items.push({ kind: "message", id: String(message.id || message.client_id || index), message, prevMessage: visibleMessages[index - 1], nextMessage: visibleMessages[index + 1] });
      return items;
    });
  }, [visibleMessages]);
  if (!peer) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/inbox", replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(MainLayout, { hideNav: true, lockScroll: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "yam-conversation-screen", dir: "rtl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
          .yam-conversation-screen {
            min-height: 100%;
            height: min(100dvh, var(--yam-vh, 100dvh));
            display: grid;
            grid-template-columns: 310px minmax(0, 1fr) 320px;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%),
              radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 20%),
              #040714;
            color: #fff;
            overflow: hidden;
          }
          .yam-chat-sidebar,
          .yam-side-profile-panel {
            background: linear-gradient(180deg, rgba(7,10,24,0.98), rgba(5,8,18,0.98));
            border-color: rgba(255,255,255,0.05);
            border-style: solid;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }
          .yam-chat-sidebar {
            border-inline-end-width: 1px;
            padding: 20px 16px 18px;
            gap: 18px;
          }
          .yam-side-profile-panel {
            border-inline-start-width: 1px;
            padding: 24px 18px;
            gap: 16px;
            overflow: auto;
          }
          .yam-sidebar-brand {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .yam-brand-mark {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 20px;
            color: white;
            background: linear-gradient(135deg, #8b5cf6, #4f46e5);
            box-shadow: 0 18px 30px rgba(91,33,182,0.35);
          }
          .yam-brand-name {
            letter-spacing: 0.36em;
            font-size: 18px;
            font-weight: 900;
          }
          .yam-primary-nav,
          .yam-contact-list {
            display: grid;
            gap: 10px;
          }
          .yam-nav-item {
            min-height: 54px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px solid transparent;
            background: transparent;
            color: #cbd5e1;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 800;
            text-align: right;
          }
          .yam-nav-item.active {
            color: #fff;
            background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(67,56,202,0.22));
            border-color: rgba(167,139,250,0.24);
          }
          .yam-nav-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.04);
            flex-shrink: 0;
          }
          .yam-sidebar-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-inline: 4px;
            font-weight: 800;
          }
          .yam-icon-action,
          .yam-stage-icon,
          .yam-detail-action,
          .yam-mini-stat,
          .yam-quick-card,
          .yam-list-pill {
            transition: all 180ms ease;
          }
          .yam-icon-action,
          .yam-stage-icon {
            width: 40px;
            height: 40px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: #fff;
          }
          .yam-contact-list {
            overflow: auto;
            min-height: 0;
          }
          .yam-contact-row,
          .yam-self-card {
            padding: 12px;
            border-radius: 22px;
            border: 1px solid transparent;
            background: rgba(255,255,255,0.02);
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
            text-align: right;
          }
          .yam-contact-row.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.22), rgba(79,70,229,0.1));
            border-color: rgba(167,139,250,0.2);
          }
          .yam-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }
          .yam-avatar-wrap.large {
            margin-inline: auto;
          }
          .yam-presence-pin {
            position: absolute;
            right: -2px;
            bottom: -2px;
          }
          .yam-contact-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
            flex: 1;
          }
          .yam-contact-copy strong,
          .yam-contact-copy span,
          .yam-side-profile-copy h2,
          .yam-side-profile-copy p {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-contact-copy span,
          .yam-side-profile-copy p {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-self-card {
            margin-top: auto;
            border-color: rgba(255,255,255,0.05);
          }
          .yam-chat-stage {
            min-width: 0;
            min-height: 0;
            display: grid;
            grid-template-rows: auto auto auto auto minmax(0, 1fr) auto;
            gap: 14px;
            padding: 20px 20px calc(16px + env(safe-area-inset-bottom, 0px));
            height: 100%;
            overflow: hidden;
          }
          .yam-stage-top-search,
          .yam-chat-stage-header,
          .yam-chat-details-drawer,
          .yam-block-banner,
          .yam-search-summary,
          .yam-messages-area,
          .yam-chat-input-wrap,
          .yam-info-card {
            border-radius: 26px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
          }
          .yam-chat-input-wrap {
            flex-shrink: 0;
            position: relative;
            z-index: 20;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
          }
          .yam-stage-top-search {
            min-height: 60px;
            padding: 0 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #94a3b8;
          }
          .yam-stage-top-search input {
            flex: 1;
            min-width: 0;
            border: none;
            outline: none;
            background: transparent;
            color: #fff;
            font-size: 15px;
          }
          .yam-clear-search {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.06);
            color: #fff;
          }
          .yam-chat-stage-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 16px 18px;
            flex-shrink: 0;
            position: relative;
            z-index: 20;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .yam-chat-stage-peer {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }
          .yam-chat-stage-peer-button,
          .yam-mobile-peer-button {
            all: unset;
            display: flex;
            align-items: center;
            gap: inherit;
            min-width: 0;
            cursor: pointer;
            text-align: right;
          }
          .yam-chat-stage-peer-button {
            flex: 1;
          }
          .yam-chat-stage-peer-copy {
            min-width: 0;
            display: grid;
            gap: 6px;
          }
          .yam-chat-stage-peer-copy strong {
            font-size: 20px;
            font-weight: 900;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .yam-chat-stage-peer-copy span {
            color: #94a3b8;
            font-size: 13px;
          }
          .yam-chat-stage-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .yam-chat-details-drawer {
            padding: 16px;
          }
          .yam-details-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 10px;
          }
          .yam-detail-action {
            min-height: 44px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
            color: #fff;
            padding: 0 10px;
          }
          .yam-detail-action.danger,
          .yam-block-banner.blocked {
            background: rgba(239,68,68,0.14);
            border-color: rgba(248,113,113,0.24);
          }
          .yam-block-banner,
          .yam-search-summary {
            min-height: 52px;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #f8fafc;
          }
          .yam-block-banner button {
            min-height: 34px;
            padding: 0 12px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.08);
            color: #fff;
          }
          .yam-messages-area {
            min-height: 0;
            flex: 1;
            overflow-y: auto !important;
            overflow-x: hidden;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            scroll-padding-bottom: 132px;
            scrollbar-gutter: stable both-edges;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.5) rgba(255,255,255,0.04);
            padding: 18px 18px calc(26px + var(--yam-keyboard-offset, 0px));
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
            background:
              radial-gradient(circle at top right, rgba(124,58,237,0.06), transparent 22%),
              radial-gradient(circle at bottom left, rgba(59,130,246,0.05), transparent 22%),
              linear-gradient(180deg, rgba(7,10,24,0.95), rgba(4,7,18,0.98));
            contain: layout style paint;
          }
          .yam-day-divider {
            align-self: center;
            margin: 8px 0 14px;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: #cbd5e1;
            font-size: 12px;
          }
          .yam-message-row {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            margin-bottom: 8px;
            animation: message-slide-up 0.3s ease-out;
            contain: layout style;
          }
          @keyframes message-slide-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .yam-message-row.me {
            justify-content: flex-start;
            flex-direction: row-reverse;
          }
          .yam-message-row.them {
            justify-content: flex-start;
          }
          .yam-message-row.grouped-prev {
            margin-top: -4px;
          }
          .yam-message-row.grouped-next {
            margin-bottom: 2px;
          }
          .yam-message-avatar {
            width: 34px;
            min-width: 34px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            opacity: 0;
          }
          .yam-message-avatar.visible {
            opacity: 1;
          }
          .yam-message-stack {
            display: grid;
            gap: 4px;
            min-width: 0;
            max-width: min(76%, 760px);
          }
          .yam-message-row.me .yam-message-stack {
            justify-items: end;
          }
          .yam-message-row.them .yam-message-stack {
            justify-items: start;
          }
          .yam-bubble {
            position: relative;
            min-width: 118px;
            padding: 13px 15px 10px;
            border-radius: 26px;
            box-shadow: 0 14px 26px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05);
            transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
            border: 1px solid rgba(255,255,255,0.08);
          }
          .bubble-me {
            background: linear-gradient(135deg, rgba(124,58,237,0.96), rgba(79,70,229,0.92));
            border-top-left-radius: 18px;
          }
          .bubble-them {
            background: rgba(255,255,255,0.07);
            border-top-right-radius: 18px;
          }
          .yam-message-row.grouped-prev .bubble-me {
            border-top-left-radius: 26px;
          }
          .yam-message-row.grouped-next .bubble-me {
            border-bottom-left-radius: 14px;
          }
          .yam-message-row.grouped-prev .bubble-them {
            border-top-right-radius: 26px;
          }
          .yam-message-row.grouped-next .bubble-them {
            border-bottom-right-radius: 14px;
          }
          .yam-bubble.search-hit,
          .yam-message-row.reply-highlight .yam-bubble,
          .reply-highlight .yam-bubble {
            border-color: rgba(167,139,250,0.38);
            box-shadow: 0 0 0 3px rgba(167,139,250,0.14), 0 18px 40px rgba(79,70,229,0.18);
          }
          .yam-bubble:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 34px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-bubble-more {
            position: absolute;
            inset-inline-end: 10px;
            top: 10px;
            width: 26px;
            height: 26px;
            border-radius: 999px;
            border: none;
            background: rgba(255,255,255,0.08);
            color: inherit;
            opacity: 0;
            transform: translateY(4px);
            transition: all 160ms ease;
          }
          .yam-bubble.toolbar-open .yam-bubble-more,
          .yam-bubble:hover .yam-bubble-more,
          .yam-bubble:focus-within .yam-bubble-more {
            opacity: 1;
            transform: translateY(0);
          }
          .yam-bubble-toolbar {
            position: absolute;
            inset-inline-end: 10px;
            top: -20px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(7,12,25,0.96);
            box-shadow: 0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
            backdrop-filter: blur(18px);
            z-index: 3;
          }
          .yam-bubble-toolbar button,
          .yam-reaction-chip,
          .yam-reply-preview,
          .yam-file-card {
            transition: all 160ms ease;
          }
          .yam-bubble-toolbar button {
            border: none;
            background: rgba(255,255,255,0.06);
            color: #fff;
            min-width: 34px;
            height: 34px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }
          .yam-bubble-toolbar button:hover {
            background: rgba(255,255,255,0.12);
            transform: translateY(-1px);
          }
          .yam-reply-preview {
            width: 100%;
            border: none;
            margin-bottom: 10px;
            padding: 10px 12px;
            border-radius: 16px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            text-align: right;
            display: grid;
            gap: 4px;
            border-right: 3px solid rgba(196,181,253,0.88);
          }
          .yam-reply-preview span,
          .yam-file-copy small {
            color: #dbe4ff;
            opacity: 0.8;
          }
          .yam-media-button {
            width: 100%;
            border: none;
            padding: 0;
            margin-bottom: 10px;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(255,255,255,0.04);
            position: relative;
            cursor: zoom-in;
          }
          .yam-video-preview-shell::after {
            content: '▶';
            position: absolute;
            inset: 50% auto auto 50%;
            transform: translate(-50%, -50%);
            width: 58px;
            height: 58px;
            border-radius: 999px;
            display: grid;
            place-items: center;
            background: rgba(0,0,0,0.44);
            color: #fff;
            font-size: 22px;
            backdrop-filter: blur(14px);
            box-shadow: 0 18px 34px rgba(0,0,0,0.34);
          }
          .yam-bubble-media {
            width: min(100%, 340px);
            max-height: 320px;
            object-fit: cover;
            border-radius: 18px;
            display: block;
          }
          .yam-bubble-media-overlay {
            position: absolute;
            inset-inline-end: 12px;
            bottom: 12px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(0,0,0,0.48);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            backdrop-filter: blur(10px);
          }
          .yam-voice-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 22px;
            background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-voice-header {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .yam-voice-play {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            border: none;
            background: linear-gradient(135deg, rgba(129,140,248,0.88), rgba(168,85,247,0.86));
            color: #fff;
            font-size: 16px;
            box-shadow: 0 12px 24px rgba(79,70,229,0.24);
          }
          .yam-voice-copy {
            min-width: 0;
            display: grid;
            gap: 2px;
            flex: 1;
          }
          .yam-voice-copy span {
            color: rgba(255,255,255,0.74);
            font-size: 12px;
          }
          .yam-voice-rates {
            display: inline-flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .yam-speed-pill {
            min-height: 28px;
            padding: 0 10px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.06);
            color: #fff;
            font-size: 11px;
            font-weight: 800;
          }
          .yam-speed-pill.active {
            background: rgba(167,139,250,0.22);
            border-color: rgba(196,181,253,0.34);
          }
          .yam-voice-seek {
            border: none;
            padding: 0;
            background: transparent;
            text-align: inherit;
            width: 100%;
            cursor: pointer;
          }
          .yam-file-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 18px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            text-decoration: none;
          }
          .yam-file-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.08);
            flex-shrink: 0;
          }
          .yam-file-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }
          .yam-file-copy strong {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .bubble-text {
            font-size: 15px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .bubble-deleted {
            font-size: 14px;
            color: #cbd5e1;
            font-style: italic;
          }
          .bubble-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            margin-top: 8px;
            color: rgba(255,255,255,0.78);
            font-size: 11px;
          }
          .yam-reaction-summary {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            min-height: 28px;
          }
          .yam-reaction-summary.me {
            justify-content: flex-end;
          }
          .yam-reaction-chip {
            min-height: 32px;
            padding: 0 12px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.07);
            color: #fff;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.05);
          }
          .yam-reaction-chip:hover {
            transform: translateY(-1px);
            background: rgba(255,255,255,0.11);
          }
          .yam-reaction-chip.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.32), rgba(79,70,229,0.26));
            border-color: rgba(167,139,250,0.28);
          }
          .yam-typing-row {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            align-self: flex-start;
            margin: 6px 0 12px;
            color: rgba(255,255,255,0.82);
          }
          .yam-typing-avatar {
            width: 34px;
            display: grid;
            place-items: center;
          }
          .yam-typing-bubble {
            min-height: 42px;
            padding: 0 14px;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 16px 34px rgba(0,0,0,0.18);
          }
          .yam-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(180deg, #c4b5fd, #60a5fa);
            animation: yamTypingPulse 900ms ease-in-out infinite;
          }
          .yam-typing-dot:nth-child(2) { animation-delay: 120ms; }
          .yam-typing-dot:nth-child(3) { animation-delay: 240ms; }
          @keyframes yamTypingPulse {
            0%, 100% { transform: translateY(0); opacity: 0.45; }
            50% { transform: translateY(-4px); opacity: 1; }
          }
          .yam-chat-input-wrap {
            padding: 10px;
            position: sticky;
            bottom: 0;
            z-index: 6;
            background: linear-gradient(180deg, rgba(4,7,18,0.74), rgba(4,7,18,0.97));
            backdrop-filter: blur(12px);
            padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
          }
          .yam-scroll-jump {
            position: sticky;
            bottom: 10px;
            margin-inline-start: auto;
            margin-top: auto;
            align-self: flex-end;
            min-height: 38px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid rgba(167,139,250,0.24);
            background: rgba(15,23,42,0.9);
            color: #fff;
            box-shadow: 0 16px 32px rgba(0,0,0,0.22);
            z-index: 5;
          }
          .yam-scroll-jump:hover {
            transform: translateY(-1px);
          }
          .yam-call-overlay {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            z-index: 40;
            background: rgba(2,6,23,0.48);
            backdrop-filter: blur(10px);
          }
          .yam-empty-state {
            min-height: 180px;
            display: grid;
            place-items: center;
            text-align: center;
            color: #94a3b8;
          }
          .yam-empty-state.rich {
            gap: 8px;
            align-content: center;
          }
          .flying-hearts-layer {
            pointer-events: none;
            position: absolute;
            inset: 0;
            overflow: hidden;
          }
          .flying-heart {
            position: absolute;
            bottom: 20px;
            left: calc(50% + (var(--random, 0) * 1px));
            animation: yam-heart-rise 1.8s ease forwards;
            font-size: 24px;
          }
          @keyframes yam-heart-rise {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            15% { opacity: 1; }
            100% { transform: translateY(-180px) translateX(30px) scale(1.2); opacity: 0; }
          }
          .yam-side-profile-top {
            display: grid;
            gap: 18px;
            justify-items: center;
          }
          .yam-side-profile-copy {
            text-align: center;
          }
          .yam-side-profile-copy h2 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
          }
          .yam-quick-actions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }
          .yam-quick-card {
            min-height: 82px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            color: white;
            display: grid;
            place-items: center;
            gap: 6px;
          }
          .yam-quick-card small {
            color: #cbd5e1;
            font-size: 12px;
          }
          .yam-info-card {
            padding: 18px;
            display: grid;
            gap: 14px;
          }
          .yam-info-title {
            font-size: 18px;
            font-weight: 900;
          }
          .yam-info-row {
            display: grid;
            gap: 6px;
          }
          .yam-info-row span {
            color: #94a3b8;
            font-size: 12px;
          }
          .yam-info-row strong {
            color: #a78bfa;
            font-size: 15px;
            word-break: break-word;
          }
          /* ============ Mobile Header (visible only on mobile) ============ */
          .yam-mobile-topbar {
            display: none;
          }
          @media (max-width: 1280px) {
            .yam-conversation-screen {
              grid-template-columns: 290px minmax(0, 1fr);
            }
            .yam-side-profile-panel {
              display: none;
            }
          }
          @media (max-width: 980px) {
            .yam-conversation-screen {
              grid-template-columns: minmax(0, 1fr);
              background: #040714;
              height: 100dvh;
              max-height: 100dvh;
            }
            .yam-chat-sidebar {
              display: none;
            }
            /* show mobile topbar */
            .yam-mobile-topbar {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              padding-top: calc(10px + env(safe-area-inset-top, 0px));
              background: linear-gradient(180deg, rgba(7,10,24,0.98), rgba(5,8,18,0.96));
              border-bottom: 1px solid rgba(255,255,255,0.06);
              position: sticky;
              top: 0;
              z-index: 20;
            }
            .yam-mobile-back-btn {
              width: 38px;
              height: 38px;
              border-radius: 12px;
              border: none;
              background: transparent;
              color: #a78bfa;
              font-size: 22px;
              display: grid;
              place-items: center;
              cursor: pointer;
              flex-shrink: 0;
            }
            .yam-mobile-peer-button {
              flex: 1;
              min-width: 0;
            }
            .yam-mobile-peer-info {
              display: flex;
              align-items: center;
              gap: 10px;
              flex: 1;
              min-width: 0;
            }
            .yam-mobile-peer-copy {
              min-width: 0;
              display: grid;
              gap: 2px;
            }
            .yam-mobile-peer-copy strong {
              font-size: 15px;
              font-weight: 800;
              color: #fff;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .yam-mobile-peer-copy span {
              font-size: 11px;
              color: #94a3b8;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .yam-mobile-peer-copy span.online {
              color: #4ade80;
            }
            .yam-mobile-actions {
              display: flex;
              align-items: center;
              gap: 4px;
              flex-shrink: 0;
            }
            .yam-mobile-action-btn {
              width: 38px;
              height: 38px;
              border-radius: 12px;
              border: none;
              background: transparent;
              color: #a78bfa;
              font-size: 18px;
              display: grid;
              place-items: center;
              cursor: pointer;
            }
            .yam-mobile-action-btn:hover {
              background: rgba(124,58,237,0.12);
            }
            /* hide desktop header & top search on mobile */
            .yam-stage-top-search,
            .yam-chat-stage-header {
              display: none !important;
            }
            .yam-chat-stage {
              padding: 0;
              gap: 0;
              grid-template-rows: auto auto minmax(0, 1fr) auto;
              height: 100%;
              min-height: 0;
            }
            .yam-chat-details-drawer {
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-top: none;
            }
            .yam-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .yam-block-banner,
            .yam-search-summary {
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-top: none;
            }
            .yam-messages-area {
              border-radius: 0;
              border: none;
              padding: 14px 12px calc(118px + env(safe-area-inset-bottom, 0px) + var(--yam-keyboard-offset, 0px));
              scroll-padding-top: 72px;
              scroll-padding-bottom: 136px;
              background:
                radial-gradient(circle at top right, rgba(124,58,237,0.05), transparent 30%),
                radial-gradient(circle at bottom left, rgba(59,130,246,0.04), transparent 30%),
                #040714;
            }
            .yam-chat-input-wrap {
              position: sticky;
              bottom: 0;
              z-index: 24;
              border-radius: 0;
              border-left: none;
              border-right: none;
              border-bottom: none;
              padding: 8px 8px;
              padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
              background: linear-gradient(180deg, rgba(7,10,24,0.88), rgba(5,8,18,0.98));
              backdrop-filter: blur(16px);
              box-shadow: 0 -14px 32px rgba(0,0,0,0.28);
            }
            .yam-message-stack {
              max-width: 82%;
            }
            .yam-bubble {
              padding: 10px 14px 8px;
              border-radius: 20px;
            }
            .yam-bubble-toolbar {
              inset-inline-end: 8px;
              top: -14px;
              gap: 4px;
              padding: 4px;
            }
          }
          @media (max-width: 480px) {
            .yam-message-stack {
              max-width: 86%;
            }
            .yam-mobile-topbar {
              padding: 8px 10px;
              padding-top: calc(8px + env(safe-area-inset-top, 0px));
            }
          }
        ` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-chat-sidebar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-sidebar-brand", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-brand-mark", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 30, alt: "Yamshat", className: "yam-brand-mark-image" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-brand-name", children: "YAMSHAT" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "yam-primary-nav", children: CHAT_NAV_ITEMS.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: `yam-nav-item ${item.key === "chats" ? "active" : ""}`, onClick: () => handleSidebarNavigation(item.key), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-nav-icon", children: item.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
        ] }, item.key)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-sidebar-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "جهات الاتصال" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-action", onClick: () => navigate("/users"), children: "＋" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-contact-list", children: filteredContacts.map((contact) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: `yam-contact-row ${contact.username === peer ? "active" : ""}`,
            onClick: () => navigate(`/chat/${encodeURIComponent(contact.username)}`),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Avatar,
                {
                  name: contact.username,
                  src: contact.avatar,
                  size: 54,
                  showStatus: true,
                  status: (contact.username === peer ? isOnline : contact.isOnline) ? "online" : "offline"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-contact-copy", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: contact.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: contact.username === peer ? isTyping ? "يكتب الآن..." : peerDetails.preview || contact.preview : contact.preview })
              ] }),
              Number(contact.unreadCount || 0) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-mini-stat", children: contact.unreadCount }) : null
            ]
          },
          contact.username
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-self-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: currentUser || "يوسف محمد", size: 52, showStatus: true, status: "online" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-contact-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: currentUser || "يوسف محمد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "متصل الآن" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-icon-action subtle", onClick: () => navigate("/settings"), children: "⋮" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "yam-chat-stage", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-topbar", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mobile-back-btn", onClick: () => navigate("/inbox"), "aria-label": "رجوع", children: "←" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mobile-peer-button", onClick: openChatSettings, "aria-label": "إعدادات المحادثة", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-peer-info", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerDetails.avatar, size: 40, showStatus: true, status: isOnline ? "online" : "offline" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-peer-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peer }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isOnline ? "online" : "", children: isTyping ? "يكتب الآن..." : formatLastSeen(lastSeen, isOnline) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-mobile-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mobile-action-btn", onClick: () => setCallMode("voice"), "aria-label": "اتصال", children: "📞" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mobile-action-btn", onClick: () => setCallMode("video"), "aria-label": "فيديو", children: "🎥" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-mobile-action-btn", onClick: () => setShowDetailsDrawer((prev) => !prev), "aria-label": "المزيد", children: "⋮" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-stage-top-search", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⌕" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: searchInputRef,
              type: "search",
              placeholder: "بحث داخل الرسائل أو المرفقات...",
              value: searchQuery,
              onChange: (event) => setSearchQuery(event.target.value)
            }
          ),
          searchQuery ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-clear-search", onClick: () => setSearchQuery(""), children: "×" }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "yam-chat-stage-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-chat-stage-peer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-chat-stage-peer-button", onClick: openChatSettings, "aria-label": "إعدادات المحادثة", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-wrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerDetails.avatar, size: 56, ring: true, showStatus: true, status: isOnline ? "online" : "offline" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage-peer-copy", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peer }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isTyping ? "يكتب الآن..." : formatLastSeen(lastSeen, isOnline) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-chat-stage-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", onClick: () => setCallMode("voice"), children: "📞" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", onClick: () => setCallMode("video"), children: "🎥" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", onClick: () => searchInputRef.current?.focus(), children: "⌕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-stage-icon", onClick: () => setShowDetailsDrawer((prev) => !prev), children: "⋮" })
          ] })
        ] }),
        showDetailsDrawer ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-chat-details-drawer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-details-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: handleMuteConversation, children: isMutedConversation ? "إلغاء الكتم" : "كتم المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: handlePinConversation, children: isPinnedConversation ? "إلغاء التثبيت" : "تثبيت المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: spawnHeart, children: "تفاعل سريع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action", onClick: handleArchiveConversation, children: "أرشفة المحادثة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "yam-detail-action danger", onClick: handleBlock, children: blockStatus.blocked_by_me ? "رفع الحظر" : "حظر المستخدم" })
        ] }) }) : null,
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
          "لقد حظرت هذا المستخدم.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: handleBlock, children: "رفع الحظر" })
        ] }) : null,
        !blockStatus.can_chat && blockStatus.blocked_me ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-block-banner blocked", children: "هذا المستخدم حظرك." }) : null,
        searchQuery.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-search-summary", children: [
          "نتائج البحث: ",
          messageResultsCount
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-messages-area", ref: messagesAreaRef, onScroll: handleMessagesScroll, children: [
          threadsLoading && !peerDetails.username ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ تجهيز بيانات المحادثة..." }) : null,
          msgLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "جارٍ تحميل الرسائل..." }) : null,
          !msgLoading && !messages.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-empty-state rich", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "ابدأ المحادثة مع ",
              peer
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تم تحسين الفقاعات، الردود، التفاعلات، ومنطقة الكتابة من نفس الشاشة." })
          ] }) : null,
          !msgLoading && messages.length > 0 && !visibleMessages.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-empty-state", children: "لا توجد رسائل تطابق عبارة البحث." }) : null,
          renderableItems.map((item) => {
            if (item.kind === "day") {
              return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-day-divider", children: item.label }, item.id);
            }
            const msg = item.message;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChatBubble,
              {
                message: msg,
                isMe: msg.sender === currentUser,
                prevMessage: item.prevMessage,
                nextMessage: item.nextMessage,
                onReply: (message) => setReplyTo(message),
                onDelete: handleDelete,
                onReact: handleReact,
                reactionState: reactionsByMessage[String(msg.id || msg.client_id)] || { counts: {}, myReaction: null },
                onJumpToReply: jumpToReply,
                highlightQuery: searchQuery,
                registerMessageNode,
                onOpenMedia: handleOpenMedia
              },
              item.id
            );
          }),
          isTyping ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-typing-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-typing-avatar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerDetails.avatar, size: "sm", showStatus: true, status: "online" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-typing-bubble", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "yam-typing-dot" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("small", { children: [
              peer,
              " بيكتب دلوقتي…"
            ] })
          ] }) : null,
          showJumpToBottom ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "yam-scroll-jump",
              onClick: () => {
                shouldAutoScrollRef.current = true;
                setShowJumpToBottom(false);
                scrollToBottom("smooth");
              },
              children: "أحدث الرسائل ↓"
            }
          ) : null,
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
            disabled: !blockStatus.can_chat,
            compact: true
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "yam-side-profile-panel", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-profile-top", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-avatar-wrap large", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { name: peer, src: peerDetails.avatar, size: 120, ring: true, showStatus: true, status: isOnline ? "online" : "offline" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-side-profile-copy", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: peer }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: formatLastSeen(lastSeen, isOnline) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-quick-actions", children: [
          { key: "call", label: "اتصال", icon: "📞", action: () => setCallMode("voice") },
          { key: "video", label: "فيديو", icon: "🎥", action: () => setCallMode("video") },
          { key: "search", label: "بحث", icon: "⌕", action: () => searchInputRef.current?.focus() },
          { key: "more", label: "المزيد", icon: "⋯", action: () => setShowDetailsDrawer((prev) => !prev) }
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "yam-quick-card", onClick: item.action, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: item.label })
        ] }, item.key)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "yam-info-title", children: "نظرة سريعة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "اسم المستخدم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peerDetails.handle || "غير متوفر" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "البريد" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peerDetails.email || "غير متوفر" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الهاتف" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: peerDetails.phone || "غير متوفر" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الوسائط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: mediaMessages.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "yam-info-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الملفات والصوتيات" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fileMessages.length })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MediaViewerModal,
      {
        items: mediaViewerState.open ? mediaGallery : [],
        initialIndex: mediaViewerState.index,
        onClose: () => setMediaViewerState({ open: false, index: 0 })
      }
    )
  ] });
}
const Chat$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Chat
}, Symbol.toStringTag, { value: "Module" }));
export {
  CHAT_FIXTURE_CONTACTS as C,
  MESSAGE_LIFECYCLE as M,
  CHAT_NAV_ITEMS as a,
  Chat as b,
  Chat$1 as c,
  buildContacts as d,
  buildLifecycleState as e,
  clearChatDraft as f,
  getContactDetails as g,
  getMessageStatusWeight as h,
  isFailureStatus as i,
  normalizeMessageStatus as j,
  pickStrongerStatus as k,
  loadChatDraft as l,
  normalizeContact as n,
  persistChatDraft as p,
  withLifecycle as w
};
