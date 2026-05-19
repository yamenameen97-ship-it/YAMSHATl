import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: "🏠", label: "الرئيسية" },
    { path: "/search", icon: "🔍", label: "بحث" },
    { path: "/reels", icon: "🎬", label: "ريلز" },
    { path: "/chat", icon: "💬", label: "دردشة" },
    { path: "/profile", icon: "👤", label: "ملفي" }
  ];

  return (
    <nav className="bottom-nav glass">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
