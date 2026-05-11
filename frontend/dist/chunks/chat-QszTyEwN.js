import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { Q as useParams, Z as useNavigate, ot as require_react } from "./vendor-BEGBKm-Y.js";
import { n as require_jsx_runtime } from "./vendor-motion-DouOFhvK.js";
import { i as useQuery } from "./vendor-network-H7MgKIFL.js";
import { C as useToast, E as getCurrentUsername, M as useChatStore, N as logger, S as Button, _ as socketManager, a as markMessagesSeen, b as ListSkeleton, d as DISAPPEARING_MESSAGE_OPTIONS, f as currentMediaProviderLabel, i as getMessages, n as deleteMessageApi, p as resolveMediaUrl, r as getChatThreads, s as sendMessageApi, u as mediaUploadService } from "../index-RNpBu_Fp.js";
import { t as Card } from "./Card-TPneInOP.js";
import { t as EmptyState } from "./EmptyState-Co07m3O6.js";
import { t as MainLayout } from "./MainLayout-DmJHsj7d.js";
//#region src/components/chat/AudioWaveform.jsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `audio-waveform ${compact ? "compact" : ""}`,
		"aria-hidden": "true",
		children: bars.map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { height: `${height}%` } }, `${seed}-${index}`))
	});
}
//#endregion
//#region src/components/chat/VoiceRecorder.jsx
var CODEC_PRIORITY = [
	"audio/webm;codecs=opus",
	"audio/ogg;codecs=opus",
	"audio/webm"
];
function pickSupportedMimeType() {
	if (typeof MediaRecorder === "undefined") return "";
	return CODEC_PRIORITY.find((codec) => MediaRecorder.isTypeSupported?.(codec)) || "";
}
function formatTime$1(seconds = 0) {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${String(secs).padStart(2, "0")}`;
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function VoiceRecorder({ onSend, onCancel, onStateChange }) {
	const [recordingState, setRecordingState] = (0, import_react.useState)("idle");
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [waveSeed, setWaveSeed] = (0, import_react.useState)(`voice-${Date.now()}`);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)("");
	const [previewBlob, setPreviewBlob] = (0, import_react.useState)(null);
	const [playbackSpeed, setPlaybackSpeed] = (0, import_react.useState)(1);
	const mediaRecorderRef = (0, import_react.useRef)(null);
	const mediaStreamRef = (0, import_react.useRef)(null);
	const audioChunksRef = (0, import_react.useRef)([]);
	const durationRef = (0, import_react.useRef)(0);
	const timerRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		onStateChange?.(recordingState);
	}, [onStateChange, recordingState]);
	(0, import_react.useEffect)(() => () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (timerRef.current) window.clearInterval(timerRef.current);
		mediaStreamRef.current?.getTracks()?.forEach((track) => track.stop());
	}, [previewUrl]);
	const mimeType = (0, import_react.useMemo)(() => pickSupportedMimeType(), []);
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
			const stream = await navigator.mediaDevices.getUserMedia({ audio: {
				channelCount: 1,
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			} });
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
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
	};
	const cancelRecording = () => {
		stopTimer();
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			borderRadius: 18,
			background: "rgba(255,255,255,0.04)",
			border: "1px solid rgba(255,255,255,0.08)",
			display: "grid",
			gap: 12
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: { fontWeight: 700 },
					children: "رسالة صوتية"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						fontSize: 12,
						color: "var(--muted)"
					},
					children: [
						recordingState === "idle" ? "Opus codec + waveform + playback controls" : null,
						recordingState === "recording" ? "جارٍ التسجيل..." : null,
						recordingState === "paused" ? "التسجيل متوقف مؤقتًا" : null,
						recordingState === "preview" ? "راجع التسجيل قبل الإرسال" : null
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						fontSize: 14,
						fontWeight: 700,
						color: recordingState === "recording" ? "#ff7b7b" : "var(--text)"
					},
					children: formatTime$1(duration)
				})]
			}),
			recordingState === "recording" || recordingState === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: 8
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioWaveform, { seed: waveSeed }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8,
						flexWrap: "wrap"
					},
					children: [
						recordingState === "recording" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: pauseRecording,
							style: {
								padding: "8px 14px",
								borderRadius: 999,
								border: "none",
								background: "#2e3350",
								color: "#fff"
							},
							children: "إيقاف مؤقت"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: resumeRecording,
							style: {
								padding: "8px 14px",
								borderRadius: 999,
								border: "none",
								background: "#2e3350",
								color: "#fff"
							},
							children: "استكمال"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: stopRecording,
							style: {
								padding: "8px 14px",
								borderRadius: 999,
								border: "none",
								background: "#8b5cf6",
								color: "#fff"
							},
							children: "إنهاء"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: cancelRecording,
							style: {
								padding: "8px 14px",
								borderRadius: 999,
								border: "1px solid rgba(255,255,255,0.12)",
								background: "transparent",
								color: "#fff"
							},
							children: "إلغاء"
						})
					]
				})]
			}) : null,
			recordingState === "idle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					gap: 8,
					flexWrap: "wrap"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: startRecording,
					style: {
						padding: "10px 16px",
						borderRadius: 999,
						border: "none",
						background: "#8b5cf6",
						color: "#fff",
						fontWeight: 700
					},
					children: "ابدأ التسجيل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onCancel?.(),
					style: {
						padding: "10px 16px",
						borderRadius: 999,
						border: "1px solid rgba(255,255,255,0.12)",
						background: "transparent",
						color: "#fff"
					},
					children: "رجوع"
				})]
			}) : null,
			recordingState === "preview" && previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: 10
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioWaveform, { seed: waveSeed }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						ref: audioRef,
						src: previewUrl,
						controls: true,
						preload: "metadata",
						style: { width: "100%" },
						onLoadedMetadata: () => {
							const mediaDuration = clamp(audioRef.current?.duration || durationRef.current || 0, 0, 3600);
							if (mediaDuration) {
								durationRef.current = Math.round(mediaDuration);
								setDuration(Math.round(mediaDuration));
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							alignItems: "center",
							flexWrap: "wrap"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							style: {
								fontSize: 12,
								color: "var(--muted)"
							},
							children: "السرعة"
						}), [
							1,
							1.5,
							2
						].map((speed) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
							children: ["×", speed]
						}, speed))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleSend,
								style: {
									padding: "10px 16px",
									borderRadius: 999,
									border: "none",
									background: "#22c55e",
									color: "#06110a",
									fontWeight: 700
								},
								children: "إرسال"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: startRecording,
								style: {
									padding: "10px 16px",
									borderRadius: 999,
									border: "none",
									background: "#2e3350",
									color: "#fff"
								},
								children: "إعادة تسجيل"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: cancelRecording,
								style: {
									padding: "10px 16px",
									borderRadius: 999,
									border: "1px solid rgba(255,255,255,0.12)",
									background: "transparent",
									color: "#fff"
								},
								children: "إلغاء"
							})
						]
					})
				]
			}) : null
		]
	});
}
//#endregion
//#region src/utils/encoding.js
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
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
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
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
//#endregion
//#region src/services/chat/signalProtocol.js
var STORAGE_PREFIX = "yamshat-signal-protocol";
var DEFAULT_DEVICE_ID = 1;
var PREKEY_BATCH_SIZE = 24;
var CURVE = "P-256";
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
	const view = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(4));
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
	return crypto.subtle.importKey("raw", base64ToBytes(value), {
		name: "ECDH",
		namedCurve: CURVE
	}, true, []);
}
async function importAgreementPrivateKey(value) {
	return crypto.subtle.importKey("pkcs8", base64ToBytes(value), {
		name: "ECDH",
		namedCurve: CURVE
	}, true, ["deriveBits"]);
}
async function importSigningPrivateKey(value) {
	return crypto.subtle.importKey("pkcs8", base64ToBytes(value), {
		name: "ECDSA",
		namedCurve: CURVE
	}, true, ["sign"]);
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
	const bits = await crypto.subtle.deriveBits({
		name: "ECDH",
		public: publicKey
	}, privateKey, 256);
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
	const ciphertext = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv,
		additionalData
	}, key, plaintext);
	return new Uint8Array(ciphertext);
}
async function decryptAesGcm(rawKey, iv, ciphertext, additionalData) {
	const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
	const plaintext = await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv,
		additionalData
	}, key, ciphertext);
	return new Uint8Array(plaintext);
}
function pickOnePreKey(state) {
	return ensureArray(state?.preKeys).find((item) => !item.usedAt) || ensureArray(state?.preKeys)[0] || null;
}
var SignalProtocolService = class {
	async generateAgreementKeyPair() {
		const pair = await crypto.subtle.generateKey({
			name: "ECDH",
			namedCurve: CURVE
		}, true, ["deriveBits"]);
		return {
			publicKey: await exportPublicKey(pair.publicKey),
			privateKey: await exportPrivateKey(pair.privateKey)
		};
	}
	async generateSigningKeyPair() {
		const pair = await crypto.subtle.generateKey({
			name: "ECDSA",
			namedCurve: CURVE
		}, true, ["sign", "verify"]);
		return {
			publicKey: await exportPublicKey(pair.publicKey),
			privateKey: await exportPrivateKey(pair.privateKey)
		};
	}
	async signBytes(privateKeyB64, payloadBytes) {
		const privateKey = await importSigningPrivateKey(privateKeyB64);
		const signature = await crypto.subtle.sign({
			name: "ECDSA",
			hash: "SHA-256"
		}, privateKey, payloadBytes);
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
		if (existing?.identity?.agreement?.publicKey && existing?.identity?.signing?.publicKey && existing?.signedPreKey?.publicKey) return existing;
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
		const nextState = {
			...state,
			preKeys: [...ensureArray(state.preKeys), ...additional]
		};
		writeState(username, nextState);
		return nextState;
	}
	async rotateSignedPreKey(username) {
		const state = await this.initializeIdentity(username);
		if (!state) return null;
		const signedPreKey = await this.createSignedPreKeyRecord(state.identity);
		const nextState = {
			...state,
			signedPreKey,
			signedPreKeyRotatedAt: currentTimestamp()
		};
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
			preKeys: ensureArray(state.preKeys).filter((item) => !item.usedAt).slice(0, 10).map(({ id, publicKey, createdAt }) => ({
				id,
				publicKey,
				createdAt
			})),
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
		const display = bytesToHex(await sha256Bytes(base64ToBytes(state.identity.agreement.publicKey), base64ToBytes(peerBundle.identityKey))).toUpperCase();
		return display.match(/.{1,5}/g)?.slice(0, 12).join(" ") || display;
	}
	async deriveSessionMaterial(username, peer) {
		const state = await this.initializeIdentity(username);
		const peerBundle = state?.peerBundles?.[peer];
		if (!state || !peerBundle?.identityKey || !peerBundle?.signedPreKey?.publicKey) return {
			state,
			session: null,
			reason: "missing-peer-bundle"
		};
		const existing = state.sessions?.[peer];
		if (existing?.chainKey) return {
			state,
			session: existing,
			fingerprint: await this.generateFingerprint(username, peer)
		};
		const localIdentityPrivate = await importAgreementPrivateKey(state.identity.agreement.privateKey);
		const localSignedPreKeyPrivate = await importAgreementPrivateKey(state.signedPreKey.privateKey);
		const remoteIdentityPublic = await importAgreementPublicKey(peerBundle.identityKey);
		const secretC = await sha256Bytes(await deriveSecret(localIdentityPrivate, await importAgreementPublicKey(peerBundle.signedPreKey.publicKey)), await deriveSecret(localSignedPreKeyPrivate, remoteIdentityPublic), encodeUtf8(`${username}:${peer}:double-ratchet`));
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
			preKeys: ensureArray(state.preKeys).map((item) => item.id === preKey?.id ? {
				...item,
				usedAt: currentTimestamp()
			} : item),
			sessions: {
				...state.sessions || {},
				[peer]: session
			}
		};
		writeState(username, nextState);
		return {
			state: nextState,
			session,
			fingerprint
		};
	}
	async encryptMessage({ username, peer, plaintext }) {
		if (!plaintext) return {
			enabled: false,
			plaintext,
			reason: "empty-message"
		};
		const { state, session, fingerprint, reason } = await this.deriveSessionMaterial(username, peer);
		if (!session) return {
			enabled: false,
			plaintext,
			reason,
			publicBundle: await this.exportPublicBundle(username)
		};
		const nextCounter = Number(session.sendingCounter || 0) + 1;
		const seed = base64ToBytes(session.chainKey);
		const salt = await sha256Bytes(numberToBytes(nextCounter), encodeUtf8(`${username}:${peer}:ratchet`));
		const ratchetKey = await hkdf(seed, "yamshat-ratchet-key", salt);
		const nextChainKey = await hkdf(ratchetKey, "yamshat-next-chain", salt);
		const iv = randomBytes(12);
		const additionalData = encodeUtf8(`${username}|${peer}|${nextCounter}`);
		const ciphertext = await encryptAesGcm(ratchetKey, iv, encodeUtf8(plaintext), additionalData);
		writeState(username, {
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
		});
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
		const plaintext = await decryptAesGcm(ratchetKey, base64ToBytes(payload.nonce), base64ToBytes(payload.ciphertext), base64ToBytes(payload.associatedData));
		writeState(username, {
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
		});
		return decodeUtf8(plaintext);
	}
	async getSecuritySnapshot(username, peer) {
		try {
			const state = await this.initializeIdentity(username);
			if (!state) return {
				enabled: false,
				status: "disabled",
				reason: "missing-user"
			};
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
			return {
				enabled: false,
				status: "failed",
				reason: error?.message || "security-error"
			};
		}
	}
};
var signalProtocolService = new SignalProtocolService();
//#endregion
//#region src/components/chat/ChatInput.jsx
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
	const previewUrl = [
		"image",
		"video",
		"audio"
	].includes(kind) ? URL.createObjectURL(file) : "";
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
	return DISAPPEARING_MESSAGE_OPTIONS.find((item) => Number(item.value) === Number(value))?.label || "بدون";
}
function ChatInput({ currentUser, replyTo, onCancelReply, onSend, peer, securitySnapshot }) {
	const [text, setText] = (0, import_react.useState)("");
	const [showVoiceRecorder, setShowVoiceRecorder] = (0, import_react.useState)(false);
	const [attachments, setAttachments] = (0, import_react.useState)([]);
	const [sending, setSending] = (0, import_react.useState)(false);
	const [isRecording, setIsRecording] = (0, import_react.useState)(false);
	const [messageTimer, setMessageTimer] = (0, import_react.useState)(0);
	const typingTimeoutRef = (0, import_react.useRef)(null);
	const isTypingRef = (0, import_react.useRef)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	const attachmentsRef = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		attachmentsRef.current = attachments;
	}, [attachments]);
	(0, import_react.useEffect)(() => () => {
		revokeAttachments(attachmentsRef.current);
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
	}, []);
	(0, import_react.useMemo)(() => attachments.filter((item) => item.status === "queued" || item.status === "uploading").length, [attachments]);
	const stopTyping = () => {
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		if (!isTypingRef.current) return;
		isTypingRef.current = false;
		if (peer) socketManager.emit("chat_typing", {
			receiver: peer,
			is_typing: false
		});
	};
	const emitRecordingState = (value) => {
		setIsRecording(value === "recording" || value === "paused");
		if (peer) socketManager.emit("chat_recording", {
			receiver: peer,
			is_recording: value === "recording" || value === "paused"
		});
	};
	const handleTyping = (nextValue) => {
		setText(nextValue);
		if (!peer) return;
		if (!isTypingRef.current && nextValue.trim()) {
			isTypingRef.current = true;
			socketManager.emit("chat_typing", {
				receiver: peer,
				is_typing: true
			});
		}
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(stopTyping, 1800);
	};
	const updateAttachment = (attachmentId, patch) => {
		setAttachments((prev) => prev.map((item) => item.id === attachmentId ? {
			...item,
			...patch || {}
		} : item));
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
		if (peer) socketManager.emit("chat_recording", {
			receiver: peer,
			is_recording: false
		});
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
				rejected.push({
					file,
					error: error?.message || "ملف غير صالح"
				});
			}
		});
		if (accepted.length) {
			setAttachments((prev) => [...prev, ...accepted]);
			setShowVoiceRecorder(false);
		}
		if (rejected.length) emitToast({
			type: "error",
			title: "بعض الملفات مرفوضة",
			description: rejected.map((item) => `${item.file.name}: ${item.error}`).join(" | ")
		});
	};
	const removeAttachment = (attachmentId) => {
		setAttachments((prev) => {
			const target = prev.find((item) => item.id === attachmentId);
			if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
			return prev.filter((item) => item.id !== attachmentId);
		});
	};
	const uploadAttachment = async (entry) => {
		updateAttachment(entry.id, {
			status: "uploading",
			progress: 0,
			stage: "preparing",
			error: ""
		});
		try {
			const uploadResult = await mediaUploadService.uploadFile(entry.file, { onProgress: (payload) => {
				updateAttachment(entry.id, {
					status: payload?.percent >= 100 ? "uploaded" : "uploading",
					progress: Number(payload?.percent || 0),
					stage: payload?.stage || "uploading"
				});
			} });
			updateAttachment(entry.id, {
				status: "uploaded",
				progress: 100,
				stage: "done",
				uploadResult
			});
			return uploadResult;
		} catch (error) {
			updateAttachment(entry.id, {
				status: "failed",
				error: error?.message || "فشل الرفع",
				stage: "failed"
			});
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
			emitToast({
				type: "warning",
				title: "تعذر تجهيز طبقة التشفير",
				description: error?.message || "سيتم الإرسال بتوافقية مؤقتة."
			});
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
				onProgress: () => {}
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
			emitToast({
				type: "error",
				title: "فشل إرسال التسجيل",
				description: error?.message || "جرّب مرة تانية."
			});
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			padding: 12,
			background: "#111827",
			borderTop: "1px solid rgba(255,255,255,0.08)",
			display: "grid",
			gap: 10
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					gap: 10,
					alignItems: "center",
					flexWrap: "wrap"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						fontSize: 12,
						color: "var(--muted)"
					},
					children: ["🔐 ", securitySnapshot?.enabled ? `${securitySnapshot.protocol || "Signal"} • ${securitySnapshot.status || "ready"}` : "Signal bootstrap pending"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							style: {
								fontSize: 12,
								color: "var(--muted)"
							},
							children: "الرسائل المختفية"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: messageTimer,
							onChange: (event) => setMessageTimer(Number(event.target.value || 0)),
							style: {
								background: "#0f172a",
								color: "#fff",
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: 12,
								padding: "8px 10px"
							},
							children: DISAPPEARING_MESSAGE_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: option.value,
								children: option.label
							}, option.value))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							style: {
								fontSize: 12,
								color: "var(--muted)"
							},
							children: ["⏱ ", timerLabel(messageTimer)]
						})
					]
				})]
			}),
			replyTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					padding: "8px 12px",
					background: "rgba(255,255,255,0.05)",
					borderRadius: 12,
					gap: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						fontSize: 12,
						borderRight: "2px solid var(--primary)",
						paddingRight: 8
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { fontWeight: "bold" },
						children: ["الرد على ", replyTo.sender]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: { opacity: .75 },
						children: replyTo.content || replyTo.message
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCancelReply,
					style: {
						background: "none",
						border: "none",
						color: "white"
					},
					children: "×"
				})]
			}) : null,
			attachments.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gap: 8
				},
				children: attachments.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "grid",
						gap: 8,
						padding: 10,
						borderRadius: 14,
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 10
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 10,
								minWidth: 0
							},
							children: [
								entry.previewUrl && entry.kind === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: entry.previewUrl,
									alt: entry.file.name,
									style: {
										width: 56,
										height: 56,
										borderRadius: 12,
										objectFit: "cover"
									}
								}) : null,
								entry.previewUrl && entry.kind === "video" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
									src: entry.previewUrl,
									style: {
										width: 56,
										height: 56,
										borderRadius: 12,
										objectFit: "cover"
									}
								}) : null,
								entry.kind === "audio" && entry.previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
									src: entry.previewUrl,
									controls: true,
									style: { maxWidth: 220 }
								}) : null,
								!entry.previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										width: 56,
										height: 56,
										borderRadius: 12,
										display: "grid",
										placeItems: "center",
										background: "rgba(139,92,246,0.15)"
									},
									children: "📄"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: { minWidth: 0 },
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontWeight: 600,
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis"
											},
											children: entry.file.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											style: {
												fontSize: 12,
												color: "var(--muted)"
											},
											children: [
												entry.stage,
												" • ",
												entry.progress,
												"%"
											]
										}),
										entry.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontSize: 12,
												color: "#fca5a5"
											},
											children: entry.error
										}) : null
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => removeAttachment(entry.id),
							style: {
								background: "none",
								border: "none",
								color: "#fca5a5"
							},
							children: "حذف"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						style: {
							height: 6,
							borderRadius: 999,
							background: "rgba(255,255,255,0.08)",
							overflow: "hidden"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
							width: `${entry.progress}%`,
							height: "100%",
							background: entry.status === "failed" ? "#ef4444" : "#8b5cf6",
							transition: "width 0.2s ease"
						} })
					})]
				}, entry.id))
			}) : null,
			showVoiceRecorder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceRecorder, {
				onStateChange: emitRecordingState,
				onSend: handleVoiceSend,
				onCancel: () => {
					emitRecordingState("idle");
					setShowVoiceRecorder(false);
				}
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 10
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						style: {
							background: "none",
							border: "none",
							fontSize: 20
						},
						onClick: () => emitToast({
							type: "info",
							title: "الإيموجي",
							description: "استخدم لوحة الإيموجي في جهازك أو لوحة المفاتيح."
						}),
						children: "😊"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						style: { cursor: "pointer" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileInputRef,
							type: "file",
							hidden: true,
							multiple: true,
							onChange: (event) => handleFilesAdded(event.target.files)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: { fontSize: 20 },
							children: "📎"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
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
						style: {
							flex: 1,
							background: "#1f2937",
							border: "1px solid rgba(255,255,255,0.08)",
							padding: "12px 14px",
							borderRadius: 18,
							color: "white",
							outline: "none"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: handleSend,
						loading: sending,
						disabled: sending || !text.trim() && attachments.length === 0,
						children: "إرسال"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/pages/Chat.jsx
function formatTime(value) {
	if (!value) return "";
	try {
		return new Date(value).toLocaleTimeString("ar-EG", {
			hour: "2-digit",
			minute: "2-digit"
		});
	} catch {
		return "";
	}
}
function statusLabel(status) {
	if (status === "seen") return "تمت القراءة";
	if (status === "delivered") return "تم التسليم";
	if (status === "sending") return "جارٍ الإرسال";
	if (status === "failed") return "فشل الإرسال";
	return "تم الإرسال";
}
function expirationLabel(value) {
	if (!value) return "";
	const expiresAt = new Date(value).getTime();
	const diff = Math.max(0, expiresAt - Date.now());
	const seconds = Math.ceil(diff / 1e3);
	if (seconds <= 60) return `${seconds}ث`;
	const minutes = Math.ceil(seconds / 60);
	if (minutes <= 60) return `${minutes}د`;
	const hours = Math.ceil(minutes / 60);
	if (hours <= 24) return `${hours}س`;
	return `${Math.ceil(hours / 24)}ي`;
}
function normalizeMessageText(message) {
	return message?.content || message?.message || message?.text || "";
}
function messageMediaItems(message) {
	const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
	if (attachments.length) return attachments;
	const mediaUrls = Array.isArray(message?.media_urls) ? message.media_urls : [];
	if (mediaUrls.length) return mediaUrls.map((url) => ({
		mediaUrl: resolveMediaUrl(url),
		mediaType: message?.type || "media"
	}));
	if (message?.media_url) return [{
		mediaUrl: resolveMediaUrl(message.media_url),
		mediaType: message?.type || "media"
	}];
	return [];
}
function renderMediaBlock(message) {
	const items = messageMediaItems(message);
	if (!items.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			display: "grid",
			gap: 8,
			marginBottom: normalizeMessageText(message) ? 10 : 0
		},
		children: items.map((item, index) => {
			const mediaUrl = resolveMediaUrl(item.mediaUrl || item.url || item.media_url || "");
			const mediaType = item.mediaType || item.type || message?.type || "media";
			if (!mediaUrl) return null;
			if (mediaType === "voice" || mediaType === "audio" || /\.(ogg|mp3|wav|m4a|webm)$/i.test(mediaUrl)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gap: 8,
					padding: 10,
					borderRadius: 14,
					background: "rgba(255,255,255,0.06)"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioWaveform, { seed: message.waveform_seed || message.waveformSeed || mediaUrl }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
					src: mediaUrl,
					controls: true,
					preload: "metadata",
					style: { width: "100%" }
				})]
			}, `${mediaUrl}-${index}`);
			if (mediaType === "image" || /\.(png|jpg|jpeg|gif|webp|avif)$/i.test(mediaUrl)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: mediaUrl,
				alt: "media",
				style: {
					width: "100%",
					borderRadius: 12,
					maxHeight: 320,
					objectFit: "cover"
				}
			}, `${mediaUrl}-${index}`);
			if (mediaType === "video" || mediaType === "media" || /\.(mp4|webm|mov|m3u8)$/i.test(mediaUrl)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				src: mediaUrl,
				controls: true,
				style: {
					width: "100%",
					borderRadius: 12,
					maxHeight: 360
				}
			}, `${mediaUrl}-${index}`);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: mediaUrl,
				target: "_blank",
				rel: "noreferrer",
				style: {
					color: "#c4b5fd",
					textDecoration: "underline"
				},
				children: "فتح الملف المرفق"
			}, `${mediaUrl}-${index}`);
		})
	});
}
function Chat() {
	const { userId } = useParams();
	const peer = decodeURIComponent(userId || "").trim();
	const currentUser = getCurrentUsername();
	const { pushToast } = useToast();
	const scrollRef = (0, import_react.useRef)(null);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(Boolean(peer));
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [replyTo, setReplyTo] = (0, import_react.useState)(null);
	const [presence, setPresence] = (0, import_react.useState)({
		is_online: false,
		is_typing: false,
		is_recording: false,
		last_seen: null
	});
	const [cursor, setCursor] = (0, import_react.useState)(null);
	const [hasMore, setHasMore] = (0, import_react.useState)(false);
	const [loadingMore, setLoadingMore] = (0, import_react.useState)(false);
	const [securitySnapshot, setSecuritySnapshot] = (0, import_react.useState)(null);
	const setActivePeer = useChatStore((state) => state.setActivePeer);
	const mergeMessages = (0, import_react.useCallback)((incoming, mode = "append") => {
		setMessages((prev) => {
			const source = mode === "prepend" ? [...incoming, ...prev] : [...prev, ...incoming];
			const map = /* @__PURE__ */ new Map();
			source.forEach((item) => {
				const key = String(item.client_id || item.id || `${item.sender}-${item.created_at}`);
				map.set(key, item);
			});
			return Array.from(map.values()).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
		});
	}, []);
	const loadMessages = (0, import_react.useCallback)(async ({ beforeId = null, append = false } = {}) => {
		if (!peer) {
			setMessages([]);
			setLoading(false);
			return;
		}
		if (append) setLoadingMore(true);
		else {
			setLoading(true);
			setError("");
		}
		try {
			const { data } = await getMessages(peer, 30, beforeId || void 0);
			mergeMessages(Array.isArray(data?.items) ? data.items : [], append ? "prepend" : "append");
			setCursor(data?.paging?.next_before_id || null);
			setHasMore(Boolean(data?.paging?.has_more));
			await markMessagesSeen(peer);
		} catch (err) {
			const detail = err?.response?.data?.detail || err?.message || "تعذر تحميل المحادثة";
			setError(detail);
			if (!append) pushToast({
				type: "error",
				title: "فشل تحميل المحادثة",
				description: detail
			});
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	}, [
		mergeMessages,
		peer,
		pushToast
	]);
	(0, import_react.useEffect)(() => {
		setActivePeer(peer || null);
		return () => setActivePeer(null);
	}, [peer, setActivePeer]);
	(0, import_react.useEffect)(() => {
		loadMessages();
	}, [loadMessages]);
	(0, import_react.useEffect)(() => {
		if (!currentUser || !peer) {
			setSecuritySnapshot(null);
			return;
		}
		let cancelled = false;
		const bootstrapSecurity = async () => {
			try {
				const [myBundle, peerBundle] = await Promise.all([signalProtocolService.exportPublicBundle(currentUser), signalProtocolService.exportPublicBundle(peer)]);
				await Promise.all([signalProtocolService.registerPeerBundle(currentUser, peer, peerBundle), signalProtocolService.registerPeerBundle(peer, currentUser, myBundle)]);
				const snapshot = await signalProtocolService.getSecuritySnapshot(currentUser, peer);
				if (!cancelled) setSecuritySnapshot(snapshot);
			} catch (securityError) {
				if (!cancelled) setSecuritySnapshot({
					enabled: false,
					status: "failed",
					reason: securityError?.message || "signal bootstrap failed"
				});
			}
		};
		bootstrapSecurity();
		return () => {
			cancelled = true;
		};
	}, [currentUser, peer]);
	(0, import_react.useEffect)(() => {
		if (!peer || !currentUser) return void 0;
		socketManager.connect();
		socketManager.emit("register_user", { user: currentUser }, { skipSignature: true });
		socketManager.emit("join_chat", { peer });
		socketManager.emit("sync_chat_state", { peer });
		const handleNewMessage = async (message) => {
			if (!([message?.sender, message?.receiver].includes(peer) || [message?.sender, message?.receiver].includes(currentUser))) return;
			mergeMessages([message]);
			if (message?.sender === peer) await markMessagesSeen(peer);
		};
		const handleDelivered = (payload) => {
			if (payload?.viewer !== peer) return;
			setMessages((prev) => prev.map((message) => (payload.message_ids || []).includes(message.id) ? {
				...message,
				status: "delivered"
			} : message));
		};
		const handleSeen = (payload) => {
			if (payload?.viewer === currentUser && payload?.sender === peer) setMessages((prev) => prev.map((message) => (payload.message_ids || []).includes(message.id) ? {
				...message,
				status: "seen"
			} : message));
		};
		const handleTyping = (payload) => {
			if (payload?.sender !== peer) return;
			setPresence((prev) => ({
				...prev,
				is_typing: Boolean(payload?.is_typing)
			}));
		};
		const handleRecording = (payload) => {
			if (payload?.sender !== peer) return;
			setPresence((prev) => ({
				...prev,
				is_recording: Boolean(payload?.is_recording)
			}));
		};
		const handlePresence = (payload) => {
			if (payload?.user !== peer) return;
			setPresence((prev) => ({
				...prev,
				is_online: Boolean(payload?.is_online),
				last_seen: payload?.last_seen || prev.last_seen
			}));
		};
		socketManager.on("new_private_message", handleNewMessage);
		socketManager.on("messages_delivered", handleDelivered);
		socketManager.on("messages_seen", handleSeen);
		socketManager.on("typing_update", handleTyping);
		socketManager.on("recording_update", handleRecording);
		socketManager.on("presence_update", handlePresence);
		return () => {
			socketManager.emit("leave_chat", { peer });
			socketManager.off("new_private_message", handleNewMessage);
			socketManager.off("messages_delivered", handleDelivered);
			socketManager.off("messages_seen", handleSeen);
			socketManager.off("typing_update", handleTyping);
			socketManager.off("recording_update", handleRecording);
			socketManager.off("presence_update", handlePresence);
		};
	}, [
		currentUser,
		mergeMessages,
		peer
	]);
	(0, import_react.useEffect)(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [
		messages,
		presence.is_typing,
		presence.is_recording
	]);
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => {
			const now = Date.now();
			setMessages((prev) => prev.filter((message) => {
				if (!message?.expires_at) return true;
				return new Date(message.expires_at).getTime() > now;
			}));
		}, 1e3);
		return () => window.clearInterval(timer);
	}, []);
	const handleSendMessage = (0, import_react.useCallback)(async (payload) => {
		if (!peer) return;
		const clientId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		const expiresAt = payload?.disappearing_in_seconds ? new Date(Date.now() + Number(payload.disappearing_in_seconds) * 1e3).toISOString() : null;
		mergeMessages([{
			id: clientId,
			client_id: clientId,
			sender: currentUser,
			receiver: peer,
			content: payload?.text || "",
			message: payload?.text || "",
			media_url: payload?.media_url || "",
			media_urls: payload?.media_urls || [],
			attachments: payload?.attachments || [],
			type: payload?.type || (payload?.media_url ? "media" : "text"),
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			status: "sending",
			replyTo: payload?.replyTo || null,
			security_payload: payload?.securityPayload || null,
			e2ee_state: payload?.securityPayload?.enabled ? "signal-ready" : "compat-mode",
			expires_at: expiresAt,
			waveform_seed: payload?.waveform_seed || "",
			audio_duration_seconds: payload?.audio_duration_seconds || null
		}]);
		setSending(true);
		try {
			const { data } = await sendMessageApi({
				receiver: peer,
				message: payload?.text || "",
				media_url: payload?.media_url || "",
				media_urls: payload?.media_urls || [],
				attachments: payload?.attachments || [],
				type: payload?.type || (payload?.media_url ? "media" : "text"),
				client_id: clientId,
				reply_to: payload?.replyTo?.id || null,
				security_payload: payload?.securityPayload || null,
				disappearing_in_seconds: payload?.disappearing_in_seconds || 0,
				expires_at: expiresAt,
				waveform_seed: payload?.waveform_seed || "",
				audio_duration_seconds: payload?.audio_duration_seconds || null
			});
			mergeMessages([{
				...data,
				client_id: clientId,
				status: "sent",
				expires_at: data?.expires_at || expiresAt
			}]);
			setSecuritySnapshot(await signalProtocolService.getSecuritySnapshot(currentUser, peer));
		} catch (err) {
			setMessages((prev) => prev.map((message) => String(message.client_id || message.id) === clientId ? {
				...message,
				status: "failed"
			} : message));
			throw err;
		} finally {
			setSending(false);
		}
	}, [
		currentUser,
		mergeMessages,
		peer
	]);
	const handleDeleteForEveryone = async (message) => {
		if (!message?.id || String(message.id).startsWith("chat-")) return;
		try {
			await deleteMessageApi(message.id);
			setMessages((prev) => prev.map((item) => item.id === message.id ? {
				...item,
				deleted: true,
				content: "تم حذف الرسالة",
				message: "تم حذف الرسالة"
			} : item));
			pushToast({
				type: "success",
				title: "تم حذف الرسالة"
			});
		} catch (err) {
			pushToast({
				type: "error",
				title: "تعذر حذف الرسالة",
				description: err?.response?.data?.detail || err?.message
			});
		}
	};
	const presenceLabel = (0, import_react.useMemo)(() => {
		if (!peer) return "اختر محادثة";
		if (presence.is_recording) return "يسجل رسالة صوتية...";
		if (presence.is_typing) return "يكتب الآن...";
		if (presence.is_online) return "متصل الآن";
		return presence.last_seen ? `آخر ظهور ${new Date(presence.last_seen).toLocaleString("ar-EG")}` : "غير متصل";
	}, [peer, presence]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			height: "calc(100vh - 80px)",
			maxWidth: 920,
			margin: "0 auto",
			padding: 10
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				style: {
					padding: "12px 20px",
					marginBottom: 10,
					display: "grid",
					gap: 10
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 12,
						flexWrap: "wrap"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 12
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								width: 42,
								height: 42,
								borderRadius: "50%",
								background: "var(--primary)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: "bold"
							},
							children: (peer || "؟").slice(0, 1).toUpperCase()
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { fontWeight: "bold" },
							children: peer || "المحادثة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: {
								fontSize: 12,
								color: presence.is_online || presence.is_typing || presence.is_recording ? "#44ff44" : "#a7a7a7"
							},
							children: presenceLabel
						})] })]
					}), hasMore ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => loadMessages({
							beforeId: cursor,
							append: true
						}),
						loading: loadingMore,
						children: "تحميل الأقدم"
					}) : null]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 10,
						flexWrap: "wrap",
						fontSize: 12,
						color: "var(--muted)"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["🔐 ", securitySnapshot?.protocol || "libsignal primitives"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["الحالة: ", securitySnapshot?.status || "initializing"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["PreKeys: ", securitySnapshot?.availablePreKeys ?? "--"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["CDN: ", currentMediaProviderLabel()] }),
						securitySnapshot?.fingerprint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["• البصمة: ", securitySnapshot.fingerprint] }) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					flex: 1,
					overflowY: "auto",
					padding: "10px 0",
					display: "flex",
					flexDirection: "column",
					gap: 12
				},
				children: [
					!peer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						style: { padding: 24 },
						children: "افتح محادثة من صفحة المستخدمين أو صندوق الوارد."
					}) : null,
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						style: { padding: 24 },
						children: "جارٍ تحميل الرسائل..."
					}) : null,
					!loading && error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						style: { padding: 24 },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							style: { marginBottom: 12 },
							children: error
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => loadMessages(),
							children: "إعادة المحاولة"
						})]
					}) : null,
					!loading && !error && messages.map((msg) => {
						const isMine = msg.sender === currentUser;
						const messageText = normalizeMessageText(msg);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								alignSelf: isMine ? "flex-end" : "flex-start",
								maxWidth: "78%"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									background: isMine ? "var(--primary)" : "rgba(255,255,255,0.06)",
									padding: "10px 14px",
									borderRadius: isMine ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
									color: "white"
								},
								children: [
									msg.replyTo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											fontSize: 11,
											opacity: .75,
											marginBottom: 6,
											borderInlineStart: "2px solid rgba(255,255,255,0.35)",
											paddingInlineStart: 8
										},
										children: "رد على رسالة"
									}) : null,
									renderMediaBlock(msg),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										style: {
											fontSize: 15,
											whiteSpace: "pre-wrap"
										},
										children: messageText
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										style: {
											display: "flex",
											justifyContent: "space-between",
											gap: 10,
											marginTop: 6,
											alignItems: "center",
											flexWrap: "wrap"
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												fontSize: 10,
												opacity: .7
											},
											children: formatTime(msg.created_at)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												alignItems: "center",
												gap: 8,
												fontSize: 10
											},
											children: [msg.e2ee_state ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												style: { opacity: .8 },
												children: ["🔐 ", msg.e2ee_state]
											}) : null, msg.expires_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												style: { color: "#fcd34d" },
												children: ["⏳ ", expirationLabel(msg.expires_at)]
											}) : null]
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 8,
									justifyContent: isMine ? "flex-end" : "flex-start",
									marginTop: 4,
									alignItems: "center",
									flexWrap: "wrap"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setReplyTo(msg),
										style: {
											background: "none",
											border: "none",
											color: "#8f8f8f",
											cursor: "pointer",
											fontSize: 12
										},
										children: "رد"
									}),
									isMine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: {
											fontSize: 11,
											color: msg.status === "failed" ? "#ff8a8a" : "#8f8f8f"
										},
										children: statusLabel(msg.status)
									}) : null,
									isMine && !msg.deleted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => handleDeleteForEveryone(msg),
										style: {
											background: "none",
											border: "none",
											color: "#ff8888",
											cursor: "pointer",
											fontSize: 12
										},
										children: "حذف للكل"
									}) : null
								]
							})]
						}, String(msg.client_id || msg.id));
					}),
					presence.is_recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							fontSize: 12,
							color: "#f9a8d4"
						},
						children: [peer, " يسجل رسالة صوتية..."]
					}) : null,
					presence.is_typing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							fontSize: 12,
							color: "#8f8f8f"
						},
						children: [peer, " يكتب الآن..."]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: scrollRef })
				]
			}),
			peer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatInput, {
				currentUser,
				peer,
				replyTo,
				onCancelReply: () => setReplyTo(null),
				onSend: handleSendMessage,
				sending,
				securitySnapshot
			}) : null
		]
	}) });
}
//#endregion
//#region src/pages/Inbox.jsx
function Inbox() {
	const navigate = useNavigate();
	const currentUser = getCurrentUsername();
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [pinnedChats, setPinnedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [archivedChats, setArchivedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [mutedChats, setMutedChats] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const { data: threads = [], isLoading, refetch } = useQuery({
		queryKey: ["chat-threads", currentUser],
		queryFn: async () => {
			const { data } = await getChatThreads();
			return data || [];
		}
	});
	const filteredThreads = (0, import_react.useMemo)(() => {
		return threads.filter((thread) => {
			const isArchived = archivedChats.has(thread.username);
			const isPinned = pinnedChats.has(thread.username);
			const matchesSearch = thread.username.toLowerCase().includes(searchQuery.toLowerCase());
			if (activeTab === "archived") return isArchived && matchesSearch;
			if (activeTab === "pinned") return isPinned && matchesSearch;
			return !isArchived && matchesSearch;
		}).sort((a, b) => {
			const aPinned = pinnedChats.has(a.username);
			const bPinned = pinnedChats.has(b.username);
			if (aPinned && !bPinned) return -1;
			if (!aPinned && bPinned) return 1;
			return new Date(b.last_message_at) - new Date(a.last_message_at);
		});
	}, [
		threads,
		activeTab,
		searchQuery,
		archivedChats,
		pinnedChats
	]);
	const togglePin = (username, e) => {
		e.stopPropagation();
		const next = new Set(pinnedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setPinnedChats(next);
	};
	const toggleArchive = (username, e) => {
		e.stopPropagation();
		const next = new Set(archivedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setArchivedChats(next);
	};
	const toggleMute = (username, e) => {
		e.stopPropagation();
		const next = new Set(mutedChats);
		if (next.has(username)) next.delete(username);
		else next.add(username);
		setMutedChats(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			maxWidth: 600,
			margin: "0 auto",
			padding: "20px 10px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 20
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					style: { margin: 0 },
					children: "الرسائل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						gap: 8
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("all"),
							style: { background: activeTab === "all" ? "var(--primary)" : "" },
							children: "الكل"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("pinned"),
							style: { background: activeTab === "pinned" ? "var(--primary)" : "" },
							children: "📌 المثبتة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: () => setActiveTab("archived"),
							style: { background: activeTab === "archived" ? "var(--primary)" : "" },
							children: "📦 مؤرشف"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: { marginBottom: 20 },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "ابحث في المحادثات...",
					value: searchQuery,
					onChange: (e) => setSearchQuery(e.target.value),
					style: {
						width: "100%",
						background: "rgba(255,255,255,0.05)",
						border: "1px solid #333",
						padding: "12px 16px",
						borderRadius: 12,
						color: "white"
					}
				})
			}),
			isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListSkeleton, {}) : filteredThreads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "لا توجد محادثات",
				description: "ابدأ دردشة جديدة مع أصدقائك الآن."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					display: "grid",
					gap: 10
				},
				children: filteredThreads.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					onClick: () => navigate(`/chat/${thread.username}`),
					style: {
						padding: 16,
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 16,
						border: pinnedChats.has(thread.username) ? "1px solid var(--primary)" : "1px solid transparent",
						background: thread.unread_count > 0 ? "rgba(139, 92, 246, 0.05)" : ""
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: { position: "relative" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								style: {
									width: 50,
									height: 50,
									borderRadius: "50%",
									background: "var(--primary)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontWeight: "bold",
									fontSize: 20
								},
								children: thread.username[0].toUpperCase()
							}), thread.presence?.is_online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
								position: "absolute",
								bottom: 2,
								right: 2,
								width: 12,
								height: 12,
								background: "#44ff44",
								borderRadius: "50%",
								border: "2px solid #111"
							} })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								flex: 1,
								minWidth: 0
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 4
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									style: {
										fontWeight: "bold",
										display: "flex",
										alignItems: "center",
										gap: 6
									},
									children: [
										thread.username,
										mutedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { fontSize: 12 },
											children: "🔇"
										}),
										pinnedChats.has(thread.username) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { fontSize: 12 },
											children: "📌"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: { fontSize: 11 },
									children: new Date(thread.last_message_at).toLocaleTimeString("ar-EG", {
										hour: "2-digit",
										minute: "2-digit"
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "muted",
									style: {
										fontSize: 13,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis"
									},
									children: thread.last_message || "لا توجد رسائل بعد"
								}), thread.unread_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									style: {
										background: "var(--primary)",
										color: "white",
										fontSize: 10,
										padding: "2px 6px",
										borderRadius: 10,
										fontWeight: "bold"
									},
									children: thread.unread_count
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: 4
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => togglePin(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "تثبيت",
									children: pinnedChats.has(thread.username) ? "📍" : "📌"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => toggleMute(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "كتم",
									children: mutedChats.has(thread.username) ? "🔊" : "🔇"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: (e) => toggleArchive(thread.username, e),
									style: {
										background: "none",
										border: "none",
										cursor: "pointer",
										fontSize: 16
									},
									title: "أرشفة",
									children: archivedChats.has(thread.username) ? "📤" : "📦"
								})
							]
						})
					]
				}, thread.username))
			})
		]
	}) });
}
//#endregion
export { Chat, Inbox };
