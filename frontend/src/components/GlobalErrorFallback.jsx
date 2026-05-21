
export default function GlobalErrorFallback() {
  return (
    <div style={{
      padding: "20px",
      textAlign: "center"
    }}>
      <h2>حدث خطأ غير متوقع</h2>
      <p>يرجى إعادة تحميل الصفحة</p>
      <button onClick={() => window.location.reload()}>
        إعادة التحميل
      </button>
    </div>
  );
}
