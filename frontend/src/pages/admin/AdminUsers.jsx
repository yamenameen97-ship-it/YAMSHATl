import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getAdminUsers, banAdminUser, exportAdminReport } from '../../api/admin.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { pushToast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminUsers();
      setUsers(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleExport = async () => {
    try {
      const { data } = await exportAdminReport('csv');
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      pushToast({ title: 'Export Successful', type: 'success' });
    } catch (err) {
      pushToast({ title: 'Export Failed', type: 'error' });
    }
  };

  return (
    <AdminLayout>
      <section className="admin-users-header">
        <Card>
          <div className="action-row split">
            <h3 className="section-title">User Management & Risk Scoring</h3>
            <div className="button-group">
              <Button onClick={handleExport}>Export Users (CSV)</Button>
              <Button variant="secondary" onClick={loadUsers}>Refresh</Button>
            </div>
          </div>
        </Card>
      </section>

      <Card>
        <div className="table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Device ID</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <strong>{user.username}</strong>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td><code>{user.device_fingerprint || 'N/A'}</code></td>
                  <td>
                    <span className={`risk-badge ${user.risk_score > 70 ? 'high' : 'low'}`}>
                      {user.risk_score || 0}%
                    </span>
                  </td>
                  <td><span className={`status-pill ${user.is_active ? 'active' : 'banned'}`}>{user.is_active ? 'Active' : 'Banned'}</span></td>
                  <td>
                    <div className="action-row">
                      <button className="mini-action" onClick={() => setSelectedUser(user)}>Audit History</button>
                      <button className={`mini-action ${user.is_active ? 'danger' : 'success'}`} onClick={() => banAdminUser(user.id, user.is_active)}>
                        {user.is_active ? 'Ban User' : 'Unban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!selectedUser} title="User Audit & Device Tracking" onClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <div className="audit-container">
            <h4>Device History</h4>
            <ul className="device-list">
              {selectedUser.devices?.map(d => (
                <li key={d.id}>{d.model} - {d.last_ip} ({new Date(d.last_seen).toLocaleDateString()})</li>
              ))}
            </ul>
            <h4>Action History</h4>
            <div className="audit-timeline">
              {selectedUser.audit_logs?.map(log => (
                <div key={log.id} className="audit-item">
                  <strong>{log.action}</strong>
                  <p>{log.details}</p>
                  <small>{new Date(log.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
