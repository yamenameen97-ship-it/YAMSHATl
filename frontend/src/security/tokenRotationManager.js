
class TokenRotationManager {
  constructor() {
    this.refreshInProgress = false;
  }

  async rotate(refreshCallback) {
    if (this.refreshInProgress) return;

    this.refreshInProgress = true;

    try {
      const newToken = await refreshCallback();

      localStorage.setItem("access_token", newToken);

      return newToken;
    } finally {
      this.refreshInProgress = false;
    }
  }
}

export const tokenRotationManager =
  new TokenRotationManager();
