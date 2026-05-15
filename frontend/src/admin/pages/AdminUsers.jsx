import { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionModal, setActionModal] = useState(null);
  const [actionData, setActionData] = useState({});
  const [users, setUsers] = useState([
    { 
      id: 1, 
      name: 'أحمد علي', 
      email: 'ahmed@example.com', 
      role: 'user',
      riskScore: 12, 
      status: 'active', 
      joined: '2024-01-01', 
      fingerprint: 'dev_992x',
      ip: '192.168.1.1',
      deviceId: 'device_001',
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: [],
      bannedDevices: [],
      activityLog: [
        { time: '2024-05-10 14:20', action: 'تسجيل دخول', details: 'من الرياض' },
        { time: '2024-05-09 18:30', action: 'تحديث الملف الشخصي', details: 'تغيير الصورة' }
      ]
    },
    { 
      id: 2, 
      name: 'سارة محمد', 
      email: 'sara@example.com', 
      role: 'moderator',
      riskScore: 85, 
      status: 'flagged', 
      joined: '2024-02-15', 
      fingerprint: 'dev_881a',
      ip: '192.168.1.2',
      deviceId: 'device_002',
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: ['10.0.0.5'],
      bannedDevices: [],
      activityLog: [
        { time: '2024-05-10 10:05', action: 'محاولة دخول فاشلة', details: 'من فرنسا' }
      ]
    },
    { 
      id: 3, 
      name: 'خالد حسن', 
      email: 'khaled@example.com', 
      role: 'support',
      riskScore: 5, 
      status: 'active', 
      joined: '2024-03-10', 
      fingerprint: 'dev_772b',
      ip: '192.168.1.3',
      deviceId: 'device_003',
      isFrozen: false,
      frozenUntil: null,
      bannedIPs: [],
      bannedDevices: [],
      activityLog: []
    },
    { 
      id: 4, 
      name: 'محمد الحسن', 
      email: 'spam@example.com', 
      role: 'user',
      riskScore: 95, 
      status: 'banned', 
      joined: '2024-04-01', 
      fingerprint: 'dev_553c',
      ip: '192.168.1.4',
      deviceId: 'device_004',
      isFrozen: true,
      frozenUntil: '2024-05-25',
      bannedIPs: ['192.168.1.4', '10.0.0.1'],
      bannedDevices: ['device_004', 'device_005'],
      activityLog: [
        { time: '2024-05-08 12:00', action: 'تحذير تلقائي', details: 'سبام متكرر' }
      ]
    }
  ]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.includes(searchTerm) || u.email.includes(searchTerm);
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const handleFreezeUser = (userId, duration) => {
    const frozenUntil = new Date();
    frozenUntil.setDate(frozenUntil.getDate() + duration);
    
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            isFrozen: true, 
            frozenUntil: frozenUntil.toISOString().split('T')[0],
            status: 'frozen',
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'تجميد مؤقت',
              details: `لمدة ${duration} أيام`
            }]
          }
        : u
    ));
    setActionModal(null);
  };

  const handleBanIP = (userId, ip) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            bannedIPs: [...new Set([...u.bannedIPs, ip])],
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'حظر IP',
              details: ip
            }]
          }
        : u
    ));
    setActionModal(null);
  };

  const handleBanDevice = (userId, deviceId) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            bannedDevices: [...new Set([...u.bannedDevices, deviceId])],
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'حظر جهاز',
              details: deviceId
            }]
          }
        : u
    ));
    setActionModal(null);
  };

  const handleBanUser = (userId) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            status: 'banned',
            isFrozen: true,
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'حظر نهائي',
              details: 'تم حظر المستخدم بشكل نهائي'
            }]
          }
        : u
    ));
    setActionModal(null);
  };

  const handleUnfreeze = (userId) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            isFrozen: false,
            frozenUntil: null,
            status: 'active',
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'إلغاء التجميد',
              details: 'تم إلغاء التجميد المؤقت'
            }]
          }
        : u
    ));
  };

  const handleChangeRole = (userId, newRole) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            role: newRole,
            activityLog: [...u.activityLog, {
              time: new Date().toLocaleString('ar-EG'),
              action: 'تغيير الصلاحية',
              details: `من ${u.role} إلى ${newRole}`
            }]
          }
        : u
    ));
    setActionModal(null);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Email,Role,RiskScore,Status,Joined,IP,Device,Frozen\n"
      + users.map(u => `${u.id},${u.name},${u.email},${u.role},${u.riskScore},${u.status},${u.joined},${u.ip},${u.deviceId},${u.isFrozen}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "yamshat_users_audit.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getRoleLabel = (role) => {
    const roles = {
      'super_admin': 'مسؤول عام',
      'moderator': 'مشرف',
      'support': 'دعم فني',
      'user': 'مستخدم عادي'
    };
    return roles[role] || role;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'frozen': '#f59e0b',
      'flagged': '#ef4444',
      'banned': '#7c2d12'
    };
    return colors[status] || '#64748b';
  };

  return (
    <div className="admin-users-page">
      <Card className="users-header-card">
        <div className="flex-between">
          <div>
            <h2>إدارة المستخدمين والصلاحيات</h2>
            <p className="muted">نظام صلاحيات متدرج، مراقبة سلوك المستخدمين، وأدوات حظر متقدمة.</p>
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
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الصلاحيات</option>
            <option value="super_admin">مسؤول عام</option>
            <option value="moderator">مشرف</option>
            <option value="support">دعم فني</option>
            <option value="user">مستخدم عادي</option>
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="frozen">مجمد</option>
            <option value="flagged">مراقب</option>
            <option value="banned">محظور</option>
          </select>
        </div>
      </Card>

      <Card className="users-stats-card mt-4">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">إجمالي المستخدمين</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
            <div className="stat-label">مستخدمون نشطون</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{users.filter(u => u.isFrozen).length}</div>
            <div className="stat-label">مستخدمون مجمدون</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{users.filter(u => u.status === 'banned').length}</div>
            <div className="stat-label">مستخدمون محظورون</div>
          </div>
        </div>
      </Card>

      <Card className="users-table-card mt-4">
        <table className="admin-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الصلاحية</th>
              <th>تاريخ الانضمام</th>
              <th>درجة المخاطر</th>
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
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td>{user.joined}</td>
                <td>
                  <div className={`risk-badge ${user.riskScore > 70 ? 'high' : user.riskScore > 30 ? 'medium' : 'low'}`}>
                    {user.riskScore}%
                  </div>
                </td>
                <td>
                  <span className="status-pill" style={{ background: getStatusColor(user.status) + '20', color: getStatusColor(user.status) }}>
                    {user.status === 'active' ? 'نشط' : user.status === 'frozen' ? 'مجمد' : user.status === 'flagged' ? 'مراقب' : 'محظور'}
                  </span>
                </td>
                <td>
                  <Button size="small" variant="secondary" onClick={() => setSelectedUser(user)}>تدقيق</Button>
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
              <label>عنوان IP</label>
              <code>{selectedUser?.ip}</code>
            </div>
            <div className="summary-item">
              <label>معرف الجهاز</label>
              <code>{selectedUser?.deviceId}</code>
            </div>
            <div className="summary-item">
              <label>الصلاحية الحالية</label>
              <span className={`role-badge role-${selectedUser?.role}`}>
                {getRoleLabel(selectedUser?.role)}
              </span>
            </div>
          </div>

          {selectedUser?.bannedIPs.length > 0 && (
            <div className="banned-list mt-4">
              <h4>عناوين IP المحظورة</h4>
              <div className="banned-items">
                {selectedUser.bannedIPs.map((ip, i) => (
                  <span key={i} className="banned-item">{ip}</span>
                ))}
              </div>
            </div>
          )}

          {selectedUser?.bannedDevices.length > 0 && (
            <div className="banned-list mt-4">
              <h4>الأجهزة المحظورة</h4>
              <div className="banned-items">
                {selectedUser.bannedDevices.map((device, i) => (
                  <span key={i} className="banned-item">{device}</span>
                ))}
              </div>
            </div>
          )}

          <h4 className="mt-6 mb-4">سجل النشاط</h4>
          <div className="timeline">
            {selectedUser?.activityLog.map((log, i) => (
              <div key={i} className={`timeline-item ${log.action.includes('تحذير') || log.action.includes('فاشلة') ? 'warning' : ''}`}>
                <div className="time">{log.time}</div>
                <div className="event">{log.action}: {log.details}</div>
              </div>
            ))}
          </div>
          
          <div className="audit-actions mt-6">
            <div className="action-group">
              <h4>إجراءات الصلاحيات</h4>
              <div className="button-group">
                <Button 
                  size="small" 
                  variant="secondary" 
                  onClick={() => setActionModal('change_role')}
                >
                  تغيير الصلاحية
                </Button>
              </div>
            </div>

            <div className="action-group mt-4">
              <h4>إجراءات الحظر والتجميد</h4>
              <div className="button-group">
                {!selectedUser?.isFrozen ? (
                  <Button 
                    size="small" 
                    variant="warning" 
                    onClick={() => setActionModal('freeze')}
                  >
                    تجميد مؤقت
                  </Button>
                ) : (
                  <Button 
                    size="small" 
                    variant="primary" 
                    onClick={() => handleUnfreeze(selectedUser.id)}
                  >
                    إلغاء التجميد
                  </Button>
                )}
                <Button 
                  size="small" 
                  variant="secondary" 
                  onClick={() => setActionModal('ban_ip')}
                >
                  حظر IP
                </Button>
                <Button 
                  size="small" 
                  variant="secondary" 
                  onClick={() => setActionModal('ban_device')}
                >
                  حظر جهاز
                </Button>
                <Button 
                  size="small" 
                  variant="danger" 
                  onClick={() => setActionModal('ban_user')}
                >
                  حظر نهائي
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Action Modals */}
      <Modal 
        open={actionModal === 'freeze'} 
        onClose={() => setActionModal(null)} 
        title="تجميد المستخدم مؤقتاً"
        size="small"
      >
        <div className="action-form">
          <p>اختر مدة التجميد:</p>
          <div className="duration-buttons">
            <Button onClick={() => handleFreezeUser(selectedUser.id, 1)}>يوم واحد</Button>
            <Button onClick={() => handleFreezeUser(selectedUser.id, 7)}>أسبوع</Button>
            <Button onClick={() => handleFreezeUser(selectedUser.id, 30)}>شهر</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={actionModal === 'ban_ip'} 
        onClose={() => setActionModal(null)} 
        title="حظر عنوان IP"
        size="small"
      >
        <div className="action-form">
          <p>هل تريد حظر عنوان IP: <code>{selectedUser?.ip}</code>؟</p>
          <div className="button-group mt-4">
            <Button variant="danger" onClick={() => handleBanIP(selectedUser.id, selectedUser.ip)}>تأكيد الحظر</Button>
            <Button variant="secondary" onClick={() => setActionModal(null)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={actionModal === 'ban_device'} 
        onClose={() => setActionModal(null)} 
        title="حظر الجهاز"
        size="small"
      >
        <div className="action-form">
          <p>هل تريد حظر الجهاز: <code>{selectedUser?.deviceId}</code>؟</p>
          <div className="button-group mt-4">
            <Button variant="danger" onClick={() => handleBanDevice(selectedUser.id, selectedUser.deviceId)}>تأكيد الحظر</Button>
            <Button variant="secondary" onClick={() => setActionModal(null)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={actionModal === 'ban_user'} 
        onClose={() => setActionModal(null)} 
        title="حظر المستخدم نهائياً"
        size="small"
      >
        <div className="action-form">
          <p className="warning-text">⚠️ هذا الإجراء سيحظر المستخدم بشكل نهائي ولا يمكن التراجع عنه بسهولة.</p>
          <p>هل أنت متأكد من حظر <strong>{selectedUser?.name}</strong>؟</p>
          <div className="button-group mt-4">
            <Button variant="danger" onClick={() => handleBanUser(selectedUser.id)}>تأكيد الحظر النهائي</Button>
            <Button variant="secondary" onClick={() => setActionModal(null)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={actionModal === 'change_role'} 
        onClose={() => setActionModal(null)} 
        title="تغيير الصلاحية"
        size="small"
      >
        <div className="action-form">
          <p>اختر الصلاحية الجديدة:</p>
          <div className="role-buttons">
            <Button onClick={() => handleChangeRole(selectedUser.id, 'user')}>مستخدم عادي</Button>
            <Button onClick={() => handleChangeRole(selectedUser.id, 'support')}>دعم فني</Button>
            <Button onClick={() => handleChangeRole(selectedUser.id, 'moderator')}>مشرف</Button>
            <Button onClick={() => handleChangeRole(selectedUser.id, 'super_admin')}>مسؤول عام</Button>
          </div>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-users-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .filters-row { display: flex; gap: 12px; margin-top: 16px; }
        .search-input { flex: 1; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
        
        .users-stats-card { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
        .stat-item { text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; }
        .stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 8px; }
        
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: right; padding: 15px; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 13px; }
        .admin-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
        
        .user-cell { display: flex; gap: 12px; align-items: center; }
        .avatar-sm { width: 32px; height: 32px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
        
        .role-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .role-super_admin { background: #7c3aed; color: white; }
        .role-moderator { background: #3b82f6; color: white; }
        .role-support { background: #10b981; color: white; }
        .role-user { background: #f3f4f6; color: #374151; }
        
        .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .risk-badge.low { background: #dcfce7; color: #166534; }
        .risk-badge.medium { background: #fef3c7; color: #92400e; }
        .risk-badge.high { background: #fee2e2; color: #991b1b; }
        
        .status-pill { padding: 4px 10px; border-radius: 6px; font-size: 11px; text-transform: uppercase; font-weight: bold; }
        
        .audit-content { padding: 20px 0; }
        .audit-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
        .summary-item label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: bold; }
        .summary-item code { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .banned-list { padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #ef4444; }
        .banned-list h4 { margin: 0 0 8px 0; color: #991b1b; }
        .banned-items { display: flex; flex-wrap: wrap; gap: 8px; }
        .banned-item { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        .timeline { border-right: 2px solid #e2e8f0; padding-right: 20px; }
        .timeline-item { position: relative; margin-bottom: 20px; }
        .timeline-item::before { content: ''; position: absolute; right: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; border: 2px solid white; }
        .timeline-item.warning::before { background: #f59e0b; }
        .timeline-item .time { font-size: 11px; color: #94a3b8; }
        .timeline-item .event { margin-top: 4px; font-size: 14px; }
        
        .audit-actions { border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .action-group { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .action-group h4 { margin: 0 0 12px 0; font-size: 13px; }
        .button-group { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .action-form { padding: 16px 0; }
        .action-form p { margin: 0 0 12px 0; }
        .duration-buttons { display: flex; gap: 8px; }
        .role-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .warning-text { color: #991b1b; font-weight: bold; }
        
        .text-xs { font-size: 12px; }
      `}} />
    </div>
  );
}
