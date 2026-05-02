import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
