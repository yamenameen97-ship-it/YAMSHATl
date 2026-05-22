import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: "🏠", label: "الرئيسية" },
    { path: "/stories", icon: "📱", label: "القصص" },
    { path: "/reels", icon: "🎬", label: "الريلز" },
    { path: "/groups", icon: "👥", label: "المجموعات" },
    { path: "/live", icon: "🔴", label: "بث مباشر" },
    { path: "/chat", icon: "💬", label: "الرسائل" },
    { path: "/notifications", icon: "🔔", label: "التنبيهات" },
    { path: "/profile", icon: "👤", label: "الملف الشخصي" },
    { path: "/settings", icon: "⚙️", label: "الإعدادات" }
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <h2>Yamshat</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
