import { b0 as reactExports } from "../index-TztUfWYS.js";
const MOBILE_QUERY = "(max-width: 1023.98px)";
function readMatch() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}
function useIsMobile() {
  const [isMobile, setIsMobile] = reactExports.useState(readMatch);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return void 0;
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (event) => setIsMobile(event.matches);
    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);
  return isMobile;
}
export {
  useIsMobile as u
};
