export const authStore = {
  saveSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role || 'user');
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
};