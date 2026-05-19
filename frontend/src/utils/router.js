function normalizeHashPath(value = '') {
  const raw = String(value || '').replace(/^#/, '').trim();
  if (!raw) return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function splitPath(value = '') {
  const normalized = normalizeHashPath(value);
  const [pathAndSearch, hash = ''] = normalized.split('#');
  const [pathname = '/', search = ''] = pathAndSearch.split('?');
  return {
    pathname: pathname || '/',
    search: search ? `?${search}` : '',
    hash: hash ? `#${hash}` : '',
  };
}

export function getCurrentAppLocation() {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }

  if (window.location.hash) {
    return splitPath(window.location.hash);
  }

  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  };
}

export function getCurrentAppPathname() {
  return getCurrentAppLocation().pathname;
}

export function buildAppUrl(target = '/') {
  if (typeof window === 'undefined') return String(target || '/');
  const { pathname, search, hash } = splitPath(target);
  return `${window.location.origin}/#${pathname}${search}${hash}`;
}

export function redirectToAppPath(target = '/', { replace = true } = {}) {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = splitPath(target);
  const current = getCurrentAppLocation();
  if (
    current.pathname === pathname
    && current.search === search
    && current.hash === hash
  ) {
    return;
  }
  const nextUrl = buildAppUrl(`${pathname}${search}${hash}`);
  if (replace && typeof window.location.replace === 'function') {
    window.location.replace(nextUrl);
    return;
  }
  window.location.assign(nextUrl);
}
