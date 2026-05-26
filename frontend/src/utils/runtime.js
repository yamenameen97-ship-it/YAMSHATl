export function isNativeShell() {
  try {
    return localStorage.getItem('yamshatNativeShell') === '1';
  } catch {
    return false;
  }
}
