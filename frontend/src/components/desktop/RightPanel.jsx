export default function RightPanel() {
  return (
    <aside className="right-panel glass">
      <div className="panel-section">
        <h3>اقتراحات لك</h3>
        <div className="suggestions-list">
          {/* سيتم تحميل المستخدمين هنا */}
          <p className="empty-msg">لا يوجد اقتراحات حالياً</p>
        </div>
      </div>
      
      <div className="panel-section">
        <h3>الترند الحالي</h3>
        <div className="trending-list">
          <p className="trending-item">#يم_شات</p>
          <p className="trending-item">#بث_مباشر</p>
          <p className="trending-item">#تقنية</p>
        </div>
      </div>
    </aside>
  );
}
