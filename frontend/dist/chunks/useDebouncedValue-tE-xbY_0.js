import { a_ as reactExports } from "../index-2I4hYPnI.js";
function useDebouncedValue(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
export {
  useDebouncedValue as u
};
