import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([
    { id: 1, name: 'أحمد علي', email: 'ahmed@example.com', riskScore: 12, status: 'active', joined: '2024-01-01', fingerprint: 'dev_992x' },
    { id: 2, name: 'سارة محمد', email: 'sara@example.com', riskScore: 85, status: 'flagged', joined: '2024-02-15', fingerprint: 'dev_881a' },
    { id: 3, name: 'خالد حسن', email: 'khaled@example.com', riskScore: 5, status: 'active', joined: '2024-03-10', fingerprint: 'dev_772b' },
  ]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.includes(searchTerm) || u.email.includes(searchTerm));
  }, [users, searchTerm]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Email,RiskScore,Status,Joined\n"
      + users.map(u => `${u.id},${u.name},${u.email},${u.riskScore},${u.status},${u.joined}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "yamshat_users_audit.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="admin-users-page">
      <Card className="users-header-card">
        <div className="flex-between">
          <div>
            <h2>إدارة المستخدمين والتدقيق</h2>
            <p className="muted">مراقبة سلوك المستخدمين، تصدير البيانات، وتحليل المخاطر.</p>
          </div>
          <Button onClick={handleExport} variant="secondary">تصدير المستخدمين (CSV)</Button>
        </div>
        
        <div className="filters-row mt-4">
          <Input 
            placeholder="البحث بالاسم أو البريد..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </Card>

      <Card className="users-table-card mt-4">
        <table className="admin-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>تاريخ الانضمام</th>
              <th>درجة المخاطر (Risk Score)</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar-sm">{(user.name[0]).toUpperCase()}</div>
                    <div>
                      <strong>{user.name}</strong>
                      <div className="text-xs muted">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.joined}</td>
                <td>
                  <div className={`risk-badge ${user.riskScore > 70 ? 'high' : user.riskScore > 30 ? 'medium' : 'low'}`}>
                    {user.riskScore}%
                  </div>
                </td>
                <td><span className={`status-pill ${user.status}`}>{user.status}</span></td>
                <td>
                  <Button size="small" variant="secondary" onClick={() => setSelectedUser(user)}>تدقيق (Audit)</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Audit Timeline Modal */}
      <Modal 
        open={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={`سجل التدقيق: ${selectedUser?.name}`}
        size="large"
      >
        <div className="audit-content">
          <div className="audit-summary">
            <div className="summary-item">
              <label>بصمة الجهاز</label>
              <code>{selectedUser?.fingerprint}</code>
            </div>
            <div className="summary-item">
              <label>آخر موقع جغرافي</label>
              <span>الرياض، السعودية</span>
            </div>
          </div>

          <h4 className="mt-6 mb-4">التسلسل الزمني للنشاط (Audit Timeline)</h4>
          <div className="timeline">
            <div className="timeline-item">
              <div className="time">2024-05-10 14:20</div>
              <div className="event">تغيير البريد الإلكتروني من <code>old@mail.com</code></div>
            </div>
            <div className="timeline-item warning">
              <div className="time">2024-05-10 10:05</div>
              <div className="event">محاولة دخول فاشلة من IP غير معروف (فرنسا)</div>
            </div>
            <div className="timeline-item">
              <div className="time">2024-05-09 18:30</div>
              <div className="event">تسجيل دخول ناجح (بصمة جهاز مطابقة)</div>
            </div>
          </div>
          
          <div className="audit-actions mt-6">
            <Button variant="danger">حظر المستخدم</Button>
            <Button variant="secondary" className="mr-2">تصفير درجة المخاطر</Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-users-page { padding: 20px; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: right; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 13px; }
        .admin-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
        .user-cell { display: flex; gap: 12px; align-items: center; }
        .avatar-sm { width: 32px; height: 32px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
        .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .risk-badge.low { background: #dcfce7; color: #166534; }
        .risk-badge.medium { background: #fef3c7; color: #92400e; }
        .risk-badge.high { background: #fee2e2; color: #991b1b; }
        .status-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; }
        .status-pill.active { background: #e0f2fe; color: #0369a1; }
        .status-pill.flagged { background: #ffedd5; color: #9a3412; }
        .audit-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        .summary-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .timeline { border-right: 2px solid #e2e8f0; padding-right: 20px; }
        .timeline-item { position: relative; margin-bottom: 20px; }
        .timeline-item::before { content: ''; position: absolute; right: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; border: 2px solid white; }
        .timeline-item.warning::before { background: #f59e0b; }
        .timeline-item .time { font-size: 11px; color: #94a3b8; }
        .timeline-item .event { margin-top: 4px; font-size: 14px; }
        .mr-2 { margin-right: 0.5rem; }
      `}} />
    </div>
  );
}
