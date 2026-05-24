export function showToast(message) {
  alert(message);
}

export default function ToastProvider({ children }) {
  return children;
}