import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

export default function AdminChat() {
  const [chatLogs] = useState([
    { id: 1, from: 'user_1', to: 'user_2', message: 'محتوى رسالة طبيعي', risk: 'Low' },
    { id: 2, from: 'bot_a', to: 'user_5', message: 'اربح جائزة الآن عبر الرابط...', risk: 'High (Spam)' },
  ]);

  return (
    <div className="admin-chat-page">
      <Card>
        <h2>إدارة المحادثات (AI Abuse Detection)</h2>
        <p className="muted">كشف الإساءة التلقائي وفحص الوسائط المدعوم بالذكاء الاصطناعي.</p>
        
        <div className="ai-status-panel mt-4">
          <div className="status-item">
            <span>فحص النصوص:</span> <span className="active">نشط</span>
          </div>
          <div className="status-item">
            <span>فحص الصور (Media Moderation):</span> <span className="active">نشط</span>
          </div>
        </div>

        <div className="chat-audit-table mt-6">
          <table className="admin-table">
            <thead>
              <tr>
                <th>من</th>
                <th>إلى</th>
                <th>الرسالة</th>
                <th>المخاطر</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {chatLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.from}</td>
                  <td>{log.to}</td>
                  <td className="msg-cell">{log.message}</td>
                  <td><span className={`risk-tag ${log.risk.toLowerCase()}`}>{log.risk}</span></td>
                  <td><Button size="small" variant="danger">حظر</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-chat-page { padding: 20px; }
        .ai-status-panel { display: flex; gap: 20px; background: #f0fdf4; padding: 10px; border-radius: 8px; border: 1px solid #bbf7d0; }
        .status-item .active { color: #166534; font-weight: bold; }
        .risk-tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
        .risk-tag.high { background: #fee2e2; color: #991b1b; }
        .risk-tag.low { background: #dcfce7; color: #166534; }
        .msg-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}} />
    </div>
  );
}
