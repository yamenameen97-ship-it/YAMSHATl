import { memo, useMemo } from 'react';
import { useChatStore, selectUnreadTotal } from '../../store/appStore.js';
import BottomNavUI from '../ui/BottomNav.jsx';

/**
 * BottomNav (mobile)
 * ------------------
 * - navItems stable ref عبر const خارج المكوّن
 * - useChatStore + selector → اشتراك ذرّي يقلّل rerenders
 * - memo: يضمن أن المكوّن لا يُعاد رسمه إلا عند تغيّر unreadTotal
 */

const BASE_NAV_ITEMS = Object.freeze([
  { to: '/', icon: '🏠', label: 'الرئيسية', match: (path) => path === '/' },
  { to: '/search', icon: '🔍', label: 'بحث', match: (path) => path.startsWith('/search') },
  { to: '/reels', icon: '🎬', label: 'ريلز', match: (path) => path.startsWith('/reels') },
  { to: '/inbox', icon: '💬', label: 'دردشة', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat') },
  { to: '/profile', icon: '👤', label: 'ملفي', match: (path) => path.startsWith('/profile') },
]);

function BottomNav() {
  const unreadTotal = useChatStore(selectUnreadTotal);

  const items = useMemo(
    () => BASE_NAV_ITEMS.map((item) => (
      item.to === '/inbox' && unreadTotal > 0
        ? { ...item, badge: unreadTotal > 99 ? '99+' : unreadTotal }
        : item
    )),
    [unreadTotal],
  );

  return <BottomNavUI items={items} className="bottom-nav" />;
}

export default memo(BottomNav);
