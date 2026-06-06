import BottomNav from './BottomNav.jsx';
import TopBar from './TopBar.jsx';

export default function NavigationBar({ placement = 'bottom', items = [], className = '', ...props }) {
  if (placement === 'top') {
    return <TopBar navItems={items} className={`ui-navigation-bar ui-navigation-bar--top ${className}`.trim()} {...props} />;
  }

  return <BottomNav items={items} className={`ui-navigation-bar ui-navigation-bar--bottom ${className}`.trim()} {...props} />;
}
