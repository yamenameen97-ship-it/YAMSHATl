import Sidebar from "../components/desktop/Sidebar";
import RightPanel from "../components/desktop/RightPanel";

export default function DesktopLayout({ children }) {

  return (

    <div className="desktop-layout">

      <Sidebar />

      <main className="desktop-feed">
        {children}
      </main>

      <RightPanel />

    </div>

  );

}
