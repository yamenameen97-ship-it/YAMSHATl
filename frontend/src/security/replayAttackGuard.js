
class ReplayAttackGuard {
  constructor() {
    this.usedNonces = new Set();
  }

  validateNonce(nonce) {
    if (this.usedNonces.has(nonce)) {
      return false;
    }

    this.usedNonces.add(nonce);

    setTimeout(() => {
      this.usedNonces.delete(nonce);
    }, 60000);

    return true;
  }
}

export const replayAttackGuard =
  new ReplayAttackGuard();
