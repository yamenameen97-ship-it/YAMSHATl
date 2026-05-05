export default function PageLoader({ label = 'جارٍ التحميل...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <div>{label}</div>
    </div>
  );
}
