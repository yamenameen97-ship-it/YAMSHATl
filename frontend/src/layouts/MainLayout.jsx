import { useEffect, useState } from "react";
import MobileLayout from "./MobileLayout";
import DesktopLayout from "./DesktopLayout";

export default function MainLayout({ children }) {

  const [mobile, setMobile] = useState(
    window.innerWidth < 1024
  );

  useEffect(() => {

    const handleResize = () => {
      setMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);

  }, []);

  return mobile
    ? <MobileLayout>{children}</MobileLayout>
    : <DesktopLayout>{children}</DesktopLayout>;
}
