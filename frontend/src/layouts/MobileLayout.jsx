import BottomNav from "../components/mobile/BottomNav";

export default function MobileLayout({ children }) {

  return (
    <div className="mobile-layout">

      <main className="mobile-content">
        {children}
      </main>

      <BottomNav />

    </div>
  );

}
