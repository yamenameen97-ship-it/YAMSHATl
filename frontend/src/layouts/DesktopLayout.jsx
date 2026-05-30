import Sidebar from "../components/desktop/Sidebar";
import RightPanel from "../components/desktop/RightPanel";

export default function DesktopLayout({ children }) {

  return (

    <div className="desktop-layout yamshat-desktop-layout">

      <Sidebar />

      <main className="desktop-feed">
        {children}
      </main>

      <RightPanel />

      <style>{`
        @media (max-width: 1023.98px) {
          .yamshat-desktop-layout {
            grid-template-columns: 1fr;
          }

          .yamshat-desktop-layout > aside,
          .yamshat-desktop-layout > .right-panel {
            display: none !important;
          }
        }
      `}</style>

    </div>

  );

}
