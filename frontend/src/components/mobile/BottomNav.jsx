import BottomNavUI from '../ui/BottomNav.jsx';

const navItems = [
  { to: '/', icon: '🏠', label: 'الرئيسية', match: (path) => path === '/' },
  { to: '/search', icon: '🔍', label: 'بحث', match: (path) => path.startsWith('/search') },
  { to: '/reels', icon: '🎬', label: 'ريلز', match: (path) => path.startsWith('/reels') },
  { to: '/inbox', icon: '💬', label: 'دردشة', match: (path) => path.startsWith('/inbox') || path.startsWith('/chat') },
  { to: '/profile', icon: '👤', label: 'ملفي', match: (path) => path.startsWith('/profile') },
];

export default function BottomNav() {
  return <BottomNavUI items={navItems} className="bottom-nav" />;
}
