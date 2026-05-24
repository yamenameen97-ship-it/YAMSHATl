import signalProtocolService from './signalProtocol.js';

class EncryptionService {
  async encrypt(text, context = {}) {
    if (!text) return { enabled: false, plaintext: text, reason: 'empty-message' };
    return signalProtocolService.encryptMessage({
      username: context?.username,
      peer: context?.peer,
      plaintext: text,
    });
  }

  async decrypt(payload, context = {}) {
    if (!payload?.ciphertext) return payload?.plaintext || payload || '';
    return signalProtocolService.decryptMessage({
      username: context?.username,
      peer: context?.peer,
      payload,
    });
  }

  async generateKeyPair(username) {
    const bundle = await signalProtocolService.exportPublicBundle(username);
    return {
      publicKey: bundle?.identityKey || '',
      bundle,
    };
  }

  async getSnapshot(username, peer) {
    return signalProtocolService.getSecuritySnapshot(username, peer);
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;
