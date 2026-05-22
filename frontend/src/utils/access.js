const DEFAULT_PRIMARY_ADMIN_EMAIL = 'yamenameen97@gmail.com';
const PLACEHOLDER_ADMIN_EMAILS = new Set(['', 'admin@example.com', 'your-admin@example.com']);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const configuredPrimaryAdminEmail = normalizeEmail(import.meta.env.VITE_PRIMARY_ADMIN_EMAIL || '');

export const PRIMARY_ADMIN_EMAIL = PLACEHOLDER_ADMIN_EMAILS.has(configuredPrimaryAdminEmail)
  ? DEFAULT_PRIMARY_ADMIN_EMAIL
  : configuredPrimaryAdminEmail;

export const isPrimaryAdminEmail = (value) => normalizeEmail(value) === PRIMARY_ADMIN_EMAIL;

export const isPrimaryAdminSession = (session) => {
  if (!session || typeof session !== 'object') return false;
  const email = session.email || session?.profile?.email || '';
  const role = String(session.role || session?.profile?.role || 'user').trim().toLowerCase();
  return isPrimaryAdminEmail(email) && role === 'admin';
};

export const getDefaultPostLoginPath = (session) => (isPrimaryAdminSession(session) ? '/admin/dashboard' : '/');
