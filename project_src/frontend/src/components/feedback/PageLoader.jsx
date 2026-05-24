export default function PageLoader({ label = 'جارٍ التحميل...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-spinner" />
      <div className="page-loader-copy">
        <strong>{label}</strong>
        <span>بنجهز لك الواجهة بشكل أسرع وأكثر سلاسة.</span>
      </div>
    </div>
  );
}
