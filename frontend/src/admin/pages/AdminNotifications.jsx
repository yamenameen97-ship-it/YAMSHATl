import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AdminNotifications() {
  const [stats] = useState({
    sent: 15400,
    delivered: 14820,
    opened: 4200,
    failed: 580
  });

  return (
    <div className="admin-notif-page">
      <Card>
        <h2>تحليلات الإشعارات (Delivery Analytics)</h2>
        <div className="notif-stats-grid mt-4">
          <div className="stat-card">
            <label>تم الإرسال</label>
            <div className="val">{stats.sent.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <label>تم التسليم</label>
            <div className="val success">{stats.delivered.toLocaleString()}</div>
            <div className="percent">{(stats.delivered/stats.sent*100).toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <label>معدل الفتح</label>
            <div className="val info">{stats.opened.toLocaleString()}</div>
            <div className="percent">{(stats.opened/stats.delivered*100).toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <label>فشل التسليم</label>
            <div className="val danger">{stats.failed.toLocaleString()}</div>
          </div>
        </div>

        <div className="delivery-tracking mt-6">
          <h3>تتبع التسليم المباشر (Push Tracking)</h3>
          <div className="tracking-list">
            <div className="tracking-item">
              <span>Yamshat Android App</span>
              <div className="tracking-bar"><div className="fill" style={{ width: '95%' }} /></div>
            </div>
            <div className="tracking-item">
              <span>Yamshat iOS App</span>
              <div className="tracking-bar"><div className="fill" style={{ width: '92%' }} /></div>
            </div>
            <div className="tracking-item">
              <span>Web Push</span>
              <div className="tracking-bar"><div className="fill" style={{ width: '85%' }} /></div>
            </div>
          </div>
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-notif-page { padding: 20px; }
        .notif-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-card label { font-size: 12px; color: #64748b; }
        .stat-card .val { font-size: 20px; font-weight: bold; margin: 5px 0; }
        .stat-card .val.success { color: #10b981; }
        .stat-card .val.info { color: #3b82f6; }
        .stat-card .val.danger { color: #ef4444; }
        .stat-card .percent { font-size: 10px; color: #94a3b8; }
        .tracking-item { margin-top: 15px; }
        .tracking-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 5px; overflow: hidden; }
        .tracking-bar .fill { height: 100%; background: #3b82f6; }
      `}} />
    </div>
  );
}
