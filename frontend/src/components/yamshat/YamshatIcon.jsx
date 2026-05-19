const iconStyles = {
  width: '1em',
  height: '1em',
  display: 'block',
};

function Path({ d, ...props }) {
  return <path d={d} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export default function YamshatIcon({ name, size = 20, filled = false }) {
  const props = {
    viewBox: '0 0 24 24',
    style: { ...iconStyles, width: size, height: size },
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return <svg {...props}><Path d="M4 10.5 12 4l8 6.5" /><Path d="M6.5 9.8V20h11V9.8" /><Path d="M9.5 20v-5.5h5V20" /></svg>;
    case 'discover':
      return <svg {...props}><Path d="M13.6 10.4 17 7l-3.4 3.4" /><Path d="m8.4 15.6 7.2-7.2-2.4 6-6 2.4Z" /><Path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" /></svg>;
    case 'users':
      return <svg {...props}><Path d="M8 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><Path d="M16.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><Path d="M3.5 19c1.1-2.4 3-3.6 5.7-3.6S13.8 16.6 15 19" /><Path d="M14.4 17.8c.7-1.3 1.8-2 3.4-2 1.3 0 2.3.5 3.2 1.7" /></svg>;
    case 'bell':
      return <svg {...props}><Path d="M6.5 16.5h11l-1.2-1.7V10a4.3 4.3 0 0 0-8.6 0v4.8L6.5 16.5Z" /><Path d="M10 18.5a2 2 0 0 0 4 0" /></svg>;
    case 'message':
      return <svg {...props}><Path d="M5 6.5h14v9H9l-4 3v-3H5z" /></svg>;
    case 'bookmark':
      return <svg {...props}><Path d="M7 4.5h10V20l-5-3-5 3V4.5Z" /></svg>;
    case 'live':
      return <svg {...props}><circle cx="12" cy="12" r="3.2" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" /><Path d="M5.5 8.5a7.5 7.5 0 0 0 0 7" /><Path d="M18.5 8.5a7.5 7.5 0 0 1 0 7" /></svg>;
    case 'groups':
      return <svg {...props}><Path d="M5 7h14" /><Path d="M5 12h10" /><Path d="M5 17h7" /><Path d="M18 12v5" /><Path d="M15.5 14.5h5" /></svg>;
    case 'clips':
      return <svg {...props}><Path d="M7 5.5h8.5A3.5 3.5 0 0 1 19 9v6.5A3.5 3.5 0 0 1 15.5 19H9A3.5 3.5 0 0 1 5.5 15.5V7" /><Path d="M9 3v7" /><Path d="M12.5 3v4" /></svg>;
    case 'forum':
      return <svg {...props}><Path d="M5 6.5h14v8H9l-4 3v-3H5z" /><Path d="M9 10h6" /></svg>;
    case 'menu':
      return <svg {...props}><Path d="M4.5 7h15" /><Path d="M4.5 12h15" /><Path d="M4.5 17h15" /></svg>;
    case 'plus':
      return <svg {...props}><Path d="M12 5v14" /><Path d="M5 12h14" /></svg>;
    case 'search':
      return <svg {...props}><Path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" /><Path d="m20 20-4-4" /></svg>;
    case 'moon':
      return <svg {...props}><Path d="M16.5 4.8A7.7 7.7 0 1 0 19 18.5 8.5 8.5 0 0 1 16.5 4.8Z" /></svg>;
    case 'more':
      return <svg {...props}><circle cx="6" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="18" cy="12" r="1.3" fill="currentColor" /></svg>;
    case 'heart':
      return <svg {...props}><Path d="M12 19s-6.5-3.8-8-7.5C2.7 8.8 4.4 6 7.2 6c1.8 0 3 1 3.8 2 0.8-1 2-2 3.8-2 2.8 0 4.5 2.8 3.2 5.5C18.5 15.2 12 19 12 19Z" /></svg>;
    case 'comment':
      return <svg {...props}><Path d="M5 6.5h14v9H9l-4 3v-3H5z" /></svg>;
    case 'repeat':
      return <svg {...props}><Path d="M7 7h9l-2.5-2.5" /><Path d="M17 17H8l2.5 2.5" /><Path d="M17 7v4" /><Path d="M7 17v-4" /></svg>;
    case 'play':
      return <svg {...props}><path d="M9 7.5v9l7-4.5-7-4.5Z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
    case 'profile':
      return <svg {...props}><Path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><Path d="M5 19c1.4-2.7 3.7-4 7-4s5.6 1.3 7 4" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.9" /></svg>;
  }
}
