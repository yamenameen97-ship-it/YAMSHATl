import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../feedback/EmptyState.jsx';
import ErrorState from '../feedback/ErrorState.jsx';
import { formatDateTime, formatFullNumber, getStatusTone, statusLabel } from './adminShared.js';

export default function AdminSectionTemplate({
  loading = false,
  error = '',
  onRetry,
  title,
  subtitle,
  badge,
  accent,
  stats = [],
  spotlight = [],
  tableTitle,
  tableDescription,
  columns = [],
  rows = [],
  rowKey = 'id',
  emptyIcon = '📂',
  emptyTitle = 'لا توجد بيانات بعد',
  emptyDescription = 'ستظهر البيانات هنا تلقائياً عند توفرها.',
  asideTitle = 'مؤشرات سريعة',
  asideItems = [],
  timelineTitle = 'آخر النشاطات',
  timelineItems = [],
  primaryAction,
  secondaryAction,
}) {
  return (
    <AdminLayout>
      {error ? <div className="alert error">{error}</div> : null}

      <section className="dashboard-hero-grid small-gap admin-section-hero-grid">
        <Card className="hero-card admin-hero-card admin-section-hero">
          <div className="hero-card-topline">
            <span className="badge">{badge || 'Admin Workspace'}</span>
            <span className="live-pill"><span className="status-dot live-dot" />{accent || 'لوحة تشغيل مباشرة'}</span>
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div className="hero-actions-wrap">
            {primaryAction ? (
              primaryAction.to ? <Link className="btn btn-primary" to={primaryAction.to}>{primaryAction.label}</Link> : <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
            ) : null}
            {secondaryAction ? (
              secondaryAction.to ? <Link className="btn btn-secondary" to={secondaryAction.to}>{secondaryAction.label}</Link> : <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
            ) : null}
          </div>
        </Card>

        <Card className="spotlight-card admin-section-spotlight">
          <div className="card-head split">
            <h3 className="section-title">{asideTitle}</h3>
            {onRetry ? <Button variant="secondary" onClick={onRetry}>تحديث</Button> : null}
          </div>
          <div className="status-list compact-grid admin-spotlight-grid">
            {spotlight.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="admin-metric-grid">
        {stats.map((item) => (
          <Card key={item.label} className={`admin-metric-card tone-${item.tone || 'neutral'}`}>
            <div className="admin-metric-icon">{item.icon || '•'}</div>
            <div className="admin-metric-copy">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.note ? <small>{item.note}</small> : null}
            </div>
          </Card>
        ))}
      </section>

      <section className="admin-deep-grid">
        <Card className="admin-rich-table-card">
          <div className="card-head split">
            <div>
              <h3 className="section-title">{tableTitle}</h3>
              <p className="muted no-margin">{tableDescription}</p>
            </div>
            <span className="badge">{formatFullNumber(rows.length)} عنصر</span>
          </div>

          {loading ? <div className="empty-state compact">جارٍ تحميل البيانات...</div> : null}
          {!loading && error && !rows.length ? <ErrorState title="تعذر تحميل البيانات" description={error} onRetry={onRetry} /> : null}
          {!loading && !rows.length && !error ? <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} actionLabel={onRetry ? 'إعادة التحميل' : undefined} onAction={onRetry} /> : null}

          {!loading && rows.length ? (
            <div className="table-shell admin-rich-table-shell">
              <table className="admin-table admin-rich-table">
                <thead>
                  <tr>
                    {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row[rowKey] || `${index}-${row.title || row.name || 'row'}`}>
                      {columns.map((column) => {
                        const rawValue = typeof column.render === 'function' ? column.render(row, index) : row[column.key];
                        return <td key={column.key}>{rawValue}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>

        <div className="admin-side-stack">
          <Card className="admin-mini-list-card">
            <div className="card-head split">
              <h3 className="section-title">بطاقات المتابعة</h3>
              <span className="badge">Live</span>
            </div>
            <div className="queue-grid compact-cards">
              {asideItems.length ? asideItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className={`queue-card compact admin-tone-${item.tone || 'neutral'}`}>
                  <span className="queue-label">{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.description}</p>
                </div>
              )) : <div className="empty-state compact">لا توجد مؤشرات إضافية حالياً.</div>}
            </div>
          </Card>

          <Card className="admin-mini-list-card">
            <div className="card-head split">
              <h3 className="section-title">{timelineTitle}</h3>
              <span className="badge">Feed</span>
            </div>
            <div className="admin-activity-list">
              {timelineItems.length ? timelineItems.map((item, index) => (
                <div key={`${item.id || item.title}-${index}`} className="admin-activity-item">
                  <span className={`admin-activity-dot tone-${getStatusTone(item.level || item.status)}`} />
                  <div>
                    <strong>{item.title || item.label}</strong>
                    <p>{item.description || item.body || 'تم تسجيل نشاط جديد داخل النظام.'}</p>
                    <small>{formatDateTime(item.created_at || item.time)}</small>
                  </div>
                </div>
              )) : <div className="empty-state compact">لا توجد نشاطات حديثة.</div>}
            </div>
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}

export function renderStatus(status) {
  return <span className={`status-pill ${getStatusTone(status)}`}>{statusLabel(status)}</span>;
}
