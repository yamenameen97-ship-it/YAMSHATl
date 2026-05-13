import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AdminReports() {
  const [reports, setReports] = useState([
    { id: 1, type: 'محتوى غير لائق', target: 'Post #442', reporter: 'user_x', priority: 'high', status: 'pending' },
    { id: 2, type: 'انتحال شخصية', target: 'User @fake_acc', reporter: 'user_y', priority: 'medium', status: 'escalated' },
  ]);

  return (
    <div className="admin-reports-page">
      <Card>
        <h2>نظام البلاغات الذكي (Smart Moderation)</h2>
        <p className="muted">أتمتة التصعيد واتخاذ إجراءات إشرافية ذكية.</p>
        
        <div className="automation-banner mt-4">
          <span>🤖 أتمتة التصعيد (Escalation Automation) مفعلة للبلاغات عالية الأولوية.</span>
        </div>

        <div className="reports-list mt-6">
          {reports.map(report => (
            <div key={report.id} className={`report-item ${report.priority}`}>
              <div className="report-main">
                <strong>{report.type}</strong>
                <p>الهدف: {report.target} | المبلغ: {report.reporter}</p>
              </div>
              <div className="report-actions">
                <span className={`priority-tag ${report.priority}`}>{report.priority}</span>
                <Button size="small" variant="primary">إجراء سريع</Button>
                <Button size="small" variant="secondary">تصعيد</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-reports-page { padding: 20px; }
        .automation-banner { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 8px; color: #1e40af; font-size: 14px; }
        .report-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #f1f5f9; }
        .report-item.high { border-right: 4px solid #ef4444; }
        .priority-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: bold; margin-left: 10px; }
        .priority-tag.high { background: #fee2e2; color: #991b1b; }
        .priority-tag.medium { background: #fef3c7; color: #92400e; }
      `}} />
    </div>
  );
}
