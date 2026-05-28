import logger from '../../utils/logger.js';
import { base64ToBytes, bytesToBase64, bytesToHex, decodeUtf8, encodeUtf8, randomBytes, safeJsonParse } from '../../utils/encoding.js';

const STORAGE_PREFIX = 'yamshat-signal-protocol';
const DEFAULT_DEVICE_ID = 1;
const PREKEY_BATCH_SIZE = 24;
const CURVE = 'P-256';

function storageKey(username) {
  return `${STORAGE_PREFIX}:${String(username || 'guest').trim().toLowerCase()}`;
}

function readState(username) {
  if (typeof window === 'undefined') return null;
  return safeJsonParse(window.localStorage.getItem(storageKey(username)), null);
}

function writeState(username, state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(username), JSON.stringify(state));
}

function currentTimestamp() {
  return Date.now();
}

function randomId() {
  return Math.floor(1000 + Math.random() * 900000);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function numberToBytes(value = 0) {
  const view = new DataView(new ArrayBuffer(4));
  view.setUint32(0, Number(value) >>> 0);
  return new Uint8Array(view.buffer);
}

async function exportPublicKey(key, format = 'raw') {
  return bytesToBase64(new Uint8Array(await crypto.subtle.exportKey(format, key)));
}

async function exportPrivateKey(key) {
  return bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', key)));
}

async function importAgreementPublicKey(value) {
  return crypto.subtle.importKey('raw', base64ToBytes(value), { name: 'ECDH', namedCurve: CURVE }, true, []);
}

async function importAgreementPrivateKey(value) {
  return crypto.subtle.importKey('pkcs8', base64ToBytes(value), { name: 'ECDH', namedCurve: CURVE }, true, ['deriveBits']);
}

async function importSigningPublicKey(value) {
  return crypto.subtle.importKey('raw', base64ToBytes(value), { name: 'ECDSA', namedCurve: CURVE }, true, ['verify']);
}

async function importSigningPrivateKey(value) {
  return crypto.subtle.importKey('pkcs8', base64ToBytes(value), { name: 'ECDSA', namedCurve: CURVE }, true, ['sign']);
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
  return new Uint8Array(await crypto.subtle.digest('SHA-256', merged));
}

async function deriveSecret(privateKey, publicKey) {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  return new Uint8Array(bits);
}

async function hkdf(inputKeyMaterial, label, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey('raw', inputKeyMaterial, 'HKDF', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: saltBytes,
    info: encodeUtf8(label),
  }, keyMaterial, 256);
  return new Uint8Array(derivedBits);
}

async function encryptAesGcm(rawKey, iv, plaintext, additionalData) {
  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, plaintext);
  return new Uint8Array(ciphertext);
}

async function decryptAesGcm(rawKey, iv, ciphertext, additionalData) {
  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData }, key, ciphertext);
  return new Uint8Array(plaintext);
}

function pickOnePreKey(state) {
  return ensureArray(state?.preKeys).find((item) => !item.usedAt) || ensureArray(state?.preKeys)[0] || null;
}

class SignalProtocolService {
  async generateAgreementKeyPair() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, true, ['deriveBits']);
    return {
      publicKey: await exportPublicKey(pair.publicKey),
      privateKey: await exportPrivateKey(pair.privateKey),
    };
  }

  async generateSigningKeyPair() {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: CURVE }, true, ['sign', 'verify']);
    return {
      publicKey: await exportPublicKey(pair.publicKey),
      privateKey: await exportPrivateKey(pair.privateKey),
    };
  }

  async signBytes(privateKeyB64, payloadBytes) {
    const privateKey = await importSigningPrivateKey(privateKeyB64);
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, payloadBytes);
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
      createdAt: currentTimestamp(),
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
        usedAt: null,
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
      signing: await this.generateSigningKeyPair(),
    };
    const signedPreKey = await this.createSignedPreKeyRecord(identity);
    const preKeys = await this.createPreKeys();

    const state = {
      version: 1,
      username,
      deviceId: DEFAULT_DEVICE_ID,
      registrationId: randomId(),
      createdAt: currentTimestamp(),
      protocol: 'signal-style-ratchet',
      identity,
      signedPreKey,
      preKeys,
      peerBundles: {},
      sessions: {},
      serverSupport: Boolean((typeof window !== 'undefined' && window.APP_SIGNAL_SERVER_SUPPORT) || import.meta.env.VITE_SIGNAL_SERVER_SUPPORT === 'true'),
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
        createdAt: state.signedPreKey.createdAt,
      },
      preKeys: ensureArray(state.preKeys)
        .filter((item) => !item.usedAt)
        .slice(0, 10)
        .map(({ id, publicKey, createdAt }) => ({ id, publicKey, createdAt })),
      protocol: state.protocol,
      ratchet: 'hkdf-chain-key',
      createdAt: state.createdAt,
    };
  }

  async registerPeerBundle(username, peer, bundle) {
    if (!username || !peer || !bundle?.identityKey || !bundle?.signedPreKey?.publicKey) return null;
    const state = await this.initializeIdentity(username);
    if (!state) return null;
    const nextState = {
      ...state,
      peerBundles: {
        ...(state.peerBundles || {}),
        [peer]: {
          ...(bundle || {}),
          registeredAt: currentTimestamp(),
        },
      },
    };
    writeState(username, nextState);
    return nextState.peerBundles[peer];
  }

  async generateFingerprint(username, peer) {
    const state = await this.initializeIdentity(username);
    const peerBundle = state?.peerBundles?.[peer];
    if (!peerBundle?.identityKey) return '';
    const digest = await sha256Bytes(base64ToBytes(state.identity.agreement.publicKey), base64ToBytes(peerBundle.identityKey));
    const display = bytesToHex(digest).toUpperCase();
    return display.match(/.{1,5}/g)?.slice(0, 12).join(' ') || display;
  }

  async deriveSessionMaterial(username, peer) {
    const state = await this.initializeIdentity(username);
    const peerBundle = state?.peerBundles?.[peer];
    if (!state || !peerBundle?.identityKey || !peerBundle?.signedPreKey?.publicKey) {
      return { state, session: null, reason: 'missing-peer-bundle' };
    }

    const existing = state.sessions?.[peer];
    if (existing?.chainKey) {
      const fingerprint = await this.generateFingerprint(username, peer);
      return { state, session: existing, fingerprint };
    }

    const localIdentityPrivate = await importAgreementPrivateKey(state.identity.agreement.privateKey);
    const localSignedPreKeyPrivate = await importAgreementPrivateKey(state.signedPreKey.privateKey);
    const remoteIdentityPublic = await importAgreementPublicKey(peerBundle.identityKey);
    const remoteSignedPreKeyPublic = await importAgreementPublicKey(peerBundle.signedPreKey.publicKey);
    const secretA = await deriveSecret(localIdentityPrivate, remoteSignedPreKeyPublic);
    const secretB = await deriveSecret(localSignedPreKeyPrivate, remoteIdentityPublic);
    const secretC = await sha256Bytes(secretA, secretB, encodeUtf8(`${username}:${peer}:double-ratchet`));
    const salt = await sha256Bytes(base64ToBytes(state.identity.agreement.publicKey), base64ToBytes(peerBundle.identityKey));
    const rootKey = await hkdf(secretC, 'yamshat-root-key', salt);
    const chainKey = await hkdf(rootKey, 'yamshat-chain-key', salt);
    const preKey = pickOnePreKey(state);
    const fingerprint = await this.generateFingerprint(username, peer);

    const session = {
      sessionId: `${username}:${peer}:${currentTimestamp()}`,
      protocol: state.protocol,
      status: 'established',
      fingerprint,
      preKeyId: preKey?.id || null,
      rootKey: bytesToBase64(rootKey),
      chainKey: bytesToBase64(chainKey),
      sendingCounter: 0,
      receivingCounter: 0,
      createdAt: currentTimestamp(),
      lastRotateAt: currentTimestamp(),
    };

    const nextState = {
      ...state,
      preKeys: ensureArray(state.preKeys).map((item) => item.id === preKey?.id ? { ...item, usedAt: currentTimestamp() } : item),
      sessions: {
        ...(state.sessions || {}),
        [peer]: session,
      },
    };
    writeState(username, nextState);
    return { state: nextState, session, fingerprint };
  }

  async encryptMessage({ username, peer, plaintext }) {
    if (!plaintext) {
      return { enabled: false, plaintext, reason: 'empty-message' };
    }

    const { state, session, fingerprint, reason } = await this.deriveSessionMaterial(username, peer);
    if (!session) {
      return {
        enabled: false,
        plaintext,
        reason,
        publicBundle: await this.exportPublicBundle(username),
      };
    }

    const nextCounter = Number(session.sendingCounter || 0) + 1;
    const seed = base64ToBytes(session.chainKey);
    const salt = await sha256Bytes(numberToBytes(nextCounter), encodeUtf8(`${username}:${peer}:ratchet`));
    const ratchetKey = await hkdf(seed, 'yamshat-ratchet-key', salt);
    const nextChainKey = await hkdf(ratchetKey, 'yamshat-next-chain', salt);
    const iv = randomBytes(12);
    const additionalData = encodeUtf8(`${username}|${peer}|${nextCounter}`);
    const ciphertext = await encryptAesGcm(ratchetKey, iv, encodeUtf8(plaintext), additionalData);

    const nextState = {
      ...state,
      sessions: {
        ...(state.sessions || {}),
        [peer]: {
          ...session,
          chainKey: bytesToBase64(nextChainKey),
          sendingCounter: nextCounter,
          lastRotateAt: currentTimestamp(),
        },
      },
    };
    writeState(username, nextState);

    return {
      enabled: true,
      algorithm: 'WebCrypto ECDH + HKDF + AES-GCM',
      counter: nextCounter,
      sessionId: session.sessionId,
      fingerprint,
      ciphertext: bytesToBase64(ciphertext),
      nonce: bytesToBase64(iv),
      associatedData: bytesToBase64(additionalData),
      publicBundle: await this.exportPublicBundle(username),
    };
  }

  async decryptMessage({ username, peer, payload }) {
    const { state, session } = await this.deriveSessionMaterial(username, peer);
    if (!session || !payload?.ciphertext) return payload?.plaintext || '';

    const nextCounter = Number(payload?.counter || session.receivingCounter || 0);
    const seed = base64ToBytes(session.chainKey);
    const salt = await sha256Bytes(numberToBytes(nextCounter), encodeUtf8(`${username}:${peer}:ratchet`));
    const ratchetKey = await hkdf(seed, 'yamshat-ratchet-key', salt);
    const nextChainKey = await hkdf(ratchetKey, 'yamshat-next-chain', salt);
    const plaintext = await decryptAesGcm(
      ratchetKey,
      base64ToBytes(payload.nonce),
      base64ToBytes(payload.ciphertext),
      base64ToBytes(payload.associatedData),
    );

    const nextState = {
      ...state,
      sessions: {
        ...(state.sessions || {}),
        [peer]: {
          ...session,
          chainKey: bytesToBase64(nextChainKey),
          receivingCounter: nextCounter,
          lastRotateAt: currentTimestamp(),
        },
      },
    };
    writeState(username, nextState);
    return decodeUtf8(plaintext);
  }

  async getSecuritySnapshot(username, peer) {
    try {
      const state = await this.initializeIdentity(username);
      if (!state) {
        return { enabled: false, status: 'disabled', reason: 'missing-user' };
      }

      const session = state.sessions?.[peer] || null;
      const peerBundle = state.peerBundles?.[peer] || null;
      const fingerprint = peerBundle ? await this.generateFingerprint(username, peer) : '';

      return {
        enabled: true,
        status: session?.status || (peerBundle ? 'bundle-ready' : 'waiting-peer-bundle'),
        protocol: state.protocol,
        registrationId: state.registrationId,
        deviceId: state.deviceId,
        availablePreKeys: ensureArray(state.preKeys).filter((item) => !item.usedAt).length,
        signedPreKeyId: state.signedPreKey?.id || null,
        fingerprint,
        serverSupport: Boolean(state.serverSupport),
        sessionId: session?.sessionId || null,
        lastRotateAt: session?.lastRotateAt || state.signedPreKey?.createdAt || state.createdAt,
      };
    } catch (error) {
      logger.warn('Failed to compute security snapshot', { message: error?.message });
      return { enabled: false, status: 'failed', reason: error?.message || 'security-error' };
    }
  }
}

export const signalProtocolService = new SignalProtocolService();
export default signalProtocolService;
