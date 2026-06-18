import { memo, useMemo } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import NavigationBar from '../ui/NavigationBar.jsx';

function MobileDock() {
  const isOnline = useAppStore((state) => state.isOnline);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const items = useMemo(
    () => [
      { to: '/', label: 'الرئيسية', icon: '⌂', match: (path) => path === '/' },
      { to: '/search', label: 'بحث', icon: '⌕', match: (path) => path.startsWith('/search') },
      {
        to: '/inbox',
        label: 'الدردشة',
        icon: '✉',
        badge: unreadInboxCount > 0 ? unreadInboxCount : null,
        match: (path) => path.startsWith('/inbox') || path.startsWith('/chat'),
      },
      { to: '/profile', label: 'حسابي', icon: '◌', match: (path) => path.startsWith('/profile') },
    ],
    [isOnline, unreadInboxCount],
  );

  return <NavigationBar placement="bottom" items={items} className="mobile-dock mobile-dock-professional" />;
}

export default memo(MobileDock);
