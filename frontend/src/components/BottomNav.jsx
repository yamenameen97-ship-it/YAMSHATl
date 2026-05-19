import { NavLink } from 'react-router-dom';

const links = [
  ['/', 'الرئيسية'],
  ['/reels', 'الريلز'],
  ['/stories', 'القصص'],
  ['/chat', 'الدردشة'],
  ['/groups', 'المجموعات'],
  ['/live', 'البث'],
  ['/notifications', 'الإشعارات'],
];

export default function BottomNav() {
  return (
    <nav style={{position:'fixed',bottom:0,left:0,right:0,display:'flex',justifyContent:'space-around',padding:'12px',background:'#111',zIndex:1000,borderTop:'1px solid #333'}}>
      {links.map(([to,label]) => (
        <NavLink key={to} to={to} style={({isActive}) => ({color:isActive?'#4da3ff':'#fff',textDecoration:'none',fontSize:'13px'})}>{label}</NavLink>
      ))}
    </nav>
  );
}
