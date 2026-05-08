export const PRIMARY_ADMIN_EMAIL = String(import.meta.env.VITE_PRIMARY_ADMIN_EMAIL || 'yamenameen97@gmail.com')
  .trim()
  .toLowerCase();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const isPrimaryAdminEmail = (value) => normalizeEmail(value) === PRIMARY_ADMIN_EMAIL;

export const isPrimaryAdminSession = (session) => {
  if (!session || typeof session !== 'object') return false;
  const email = session.email || session?.profile?.email || '';
  const role = String(session.role || session?.profile?.role || 'user').trim().toLowerCase();
  return isPrimaryAdminEmail(email) && role === 'admin';
};

export const getDefaultPostLoginPath = (session) => (isPrimaryAdminSession(session) ? '/admin/dashboard' : '/');
