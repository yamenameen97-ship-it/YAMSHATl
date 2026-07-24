import { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';

export default function AdminChat() {
  const [chatLogs, setChatLogs] = useState([
    { 
      id: 1, 
      from: 'user_1', 
      to: 'user_2', 
      message: 'مرحباً، كيف حالك اليوم؟', 
      risk: 'Low', 
      riskScore: 0.05,
      timestamp: '2024-05-10 14:20',
      type: 'private',
      status: 'safe',
      aiAnalysis: 'محتوى طبيعي وودي'
    },
    { 
      id: 2, 
      from: 'spammer_99', 
      to: 'global_chat', 
      message: 'اربح 1000 دولار الآن عبر هذا الرابط المشبوه: http://scam.link', 
      risk: 'High', 
      riskScore: 0.98,
      timestamp: '2024-05-10 14:22',
      type: 'public',
      status: 'flagged',
      aiAnalysis: 'سبام واحتيال مالي مكتشف'
    },
    { 
      id: 3, 
      from: 'angry_user', 
      to: 'user_45', 
      message: 'أنت شخص سيء جداً وسأقوم بمضايقتك دائماً', 
      risk: 'Medium', 
      riskScore: 0.65,
      timestamp: '2024-05-10 14:25',
      type: 'private',
      status: 'flagged',
      aiAnalysis: 'محتوى عدائي وتحرش محتمل'
    },
    { 
      id: 4, 
      from: 'user_7', 
      to: 'support', 
      message: 'لدي مشكلة في تسجيل الدخول، هل يمكن المساعدة؟', 
      risk: 'Low', 
      riskScore: 0.02,
      timestamp: '2024-05-10 14:30',
      type: 'support',
      status: 'safe',
      aiAnalysis: 'طلب دعم فني مشروع'
    }
  ]);

  const [bannedWords, setBannedWords] = useState(['كلمة1', 'كلمة2', 'رابط_مشبوه', 'شتيمة']);
  const [newWord, setNewWord] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [autoBanEnabled, setAutoBanEnabled] = useState(true);
  const [aiModerationEnabled, setAiModerationEnabled] = useState(true);

  const filteredLogs = useMemo(() => {
    return chatLogs.filter(log => {
      if (filterRisk === 'all') return true;
      return log.risk.toLowerCase() === filterRisk.toLowerCase();
    });
  }, [chatLogs, filterRisk]);

  const handleAddWord = () => {
    if (newWord && !bannedWords.includes(newWord)) {
      setBannedWords([...bannedWords, newWord]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (word) => {
    setBannedWords(bannedWords.filter(w => w !== word));
  };

  const handleAction = (logId, action) => {
    alert(`تم تنفيذ إجراء ${action} على الرسالة رقم ${logId}`);
    if (action === 'delete') {
      setChatLogs(chatLogs.filter(l => l.id !== logId));
    }
  };

  const getRiskColor = (risk) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[risk.toLowerCase()] || '#64748b';
  };

  const chatStats = useMemo(() => ({
    total: chatLogs.length,
    flagged: chatLogs.filter(l => l.status === 'flagged').length,
    autoBanned: 12, // Mock data
    aiDetections: 45 // Mock data
  }), [chatLogs]);

  return (
    <div className="admin-chat-page">
      <Card className="chat-header-card">
        <div className="flex-between">
          <div>
            <h2>إدارة الشات والرقابة الذكية</h2>
            <p className="muted">مراقبة الرسائل المسيئة، فلترة الكلمات، إشراف الذكاء الاصطناعي، والحظر التلقائي.</p>
          </div>
          <div className="header-controls">
            <div className="toggle-item">
              <label>الحظر التلقائي:</label>
              <input 
                type="checkbox" 
                checked={autoBanEnabled} 
                onChange={() => setAutoBanEnabled(!autoBanEnabled)} 
              />
            </div>
            <div className="toggle-item">
              <label>رقابة الذكاء الاصطناعي:</label>
              <input 
                type="checkbox" 
                checked={aiModerationEnabled} 
                onChange={() => setAiModerationEnabled(!aiModerationEnabled)} 
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="chat-stats-grid mt-4">
        <Card className="stat-mini-card">
          <div className="stat-val">{chatStats.total}</div>
          <div className="stat-lab">إجمالي الرسائل المراقبة</div>
        </Card>
        <Card className="stat-mini-card danger">
          <div className="stat-val">{chatStats.flagged}</div>
          <div className="stat-lab">رسائل مشبوهة حالياً</div>
        </Card>
        <Card className="stat-mini-card warning">
          <div className="stat-val">{chatStats.autoBanned}</div>
          <div className="stat-lab">حظر تلقائي (اليوم)</div>
        </Card>
        <Card className="stat-mini-card info">
          <div className="stat-val">{chatStats.aiDetections}</div>
          <div className="stat-lab">اكتشافات الذكاء الاصطناعي (اليوم)</div>
        </Card>
      </div>

      <div className="chat-main-layout mt-4">
        <div className="chat-logs-section">
          <Card>
            <div className="flex-between mb-4">
              <h3>سجل المحادثات المفلتر</h3>
              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="filter-select"
              >
                <option value="all">جميع مستويات المخاطر</option>
                <option value="high">مخاطر عالية</option>
                <option value="medium">مخاطر متوسطة</option>
                <option value="low">مخاطر منخفضة</option>
              </select>
            </div>

            <div className="logs-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المرسل</th>
                    <th>المستقبل</th>
                    <th>الرسالة</th>
                    <th>المخاطر</th>
                    <th>الذكاء الاصطناعي</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className={log.status === 'flagged' ? 'row-flagged' : ''}>
                      <td><strong>@{log.from}</strong></td>
                      <td>@{log.to}</td>
                      <td className="msg-cell" title={log.message}>{log.message}</td>
                      <td>
                        <span className="risk-badge" style={{ background: getRiskColor(log.risk) + '20', color: getRiskColor(log.risk) }}>
                          {log.risk} ({Math.round(log.riskScore * 100)}%)
                        </span>
                      </td>
                      <td className="ai-cell">{log.aiAnalysis}</td>
                      <td>
                        <div className="action-btns">
                          <Button size="small" variant="secondary" onClick={() => setSelectedLog(log)}>تفاصيل</Button>
                          <Button size="small" variant="danger" onClick={() => handleAction(log.id, 'ban')}>حظر</Button>
                          <Button size="small" variant="warning" onClick={() => handleAction(log.id, 'delete')}>حذف</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="chat-settings-section">
          <Card className="banned-words-card">
            <h3>فلترة الكلمات المحظورة</h3>
            <div className="add-word-form mt-3">
              <Input 
                placeholder="أضف كلمة محظورة..." 
                value={newWord} 
                onChange={(e) => setNewWord(e.target.value)}
              />
              <Button variant="primary" onClick={handleAddWord}>إضافة</Button>
            </div>
            <div className="words-tags mt-3">
              {bannedWords.map(word => (
                <span key={word} className="word-tag">
                  {word}
                  <button onClick={() => handleRemoveWord(word)}>&times;</button>
                </span>
              ))}
            </div>
          </Card>

          <Card className="ai-config-card mt-4">
            <h3>إعدادات الرقابة الذكية</h3>
            <div className="config-list mt-3">
              <div className="config-item">
                <span>حساسية الكشف:</span>
                <input type="range" min="0" max="100" defaultValue="75" />
              </div>
              <div className="config-item">
                <span>حظر تلقائي عند مخاطر >:</span>
                <select defaultValue="0.9">
                  <option value="0.8">80%</option>
                  <option value="0.9">90%</option>
                  <option value="0.95">95%</option>
                </select>
              </div>
              <div className="config-item">
                <span>مراقبة الروابط:</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="config-item">
                <span>مراقبة الصور:</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Log Details Modal */}
      <Modal 
        open={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
        title="تفاصيل الرسالة والتحليل الذكي"
      >
        {selectedLog && (
          <div className="log-details">
            <div className="detail-row">
              <label>المرسل:</label>
              <span>@{selectedLog.from}</span>
            </div>
            <div className="detail-row">
              <label>المستقبل:</label>
              <span>@{selectedLog.to}</span>
            </div>
            <div className="detail-row">
              <label>الوقت:</label>
              <span>{selectedLog.timestamp}</span>
            </div>
            <div className="detail-row">
              <label>نوع المحادثة:</label>
              <span>{selectedLog.type}</span>
            </div>
            <div className="detail-message mt-3">
              <label>نص الرسالة:</label>
              <div className="msg-box">{selectedLog.message}</div>
            </div>
            <div className="detail-ai mt-3">
              <label>تحليل الذكاء الاصطناعي:</label>
              <div className="ai-box" style={{ borderLeft: `4px solid ${getRiskColor(selectedLog.risk)}` }}>
                <p><strong>النتيجة:</strong> {selectedLog.aiAnalysis}</p>
                <p><strong>درجة الخطورة:</strong> {Math.round(selectedLog.riskScore * 100)}%</p>
                <p><strong>التصنيف:</strong> {selectedLog.risk}</p>
              </div>
            </div>
            <div className="detail-actions mt-4">
              <Button variant="danger" onClick={() => handleAction(selectedLog.id, 'ban_user')}>حظر المستخدم نهائياً</Button>
              <Button variant="warning" onClick={() => handleAction(selectedLog.id, 'warn_user')}>تحذير المستخدم</Button>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>إغلاق</Button>
            </div>
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-chat-page { padding: 20px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .muted { color: #64748b; font-size: 14px; }
        
        .header-controls { display: flex; gap: 20px; }
        .toggle-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: bold; }
        
        .chat-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-mini-card { padding: 16px; text-align: center; }
        .stat-val { font-size: 24px; font-weight: bold; color: #1e293b; }
        .stat-lab { font-size: 12px; color: #64748b; margin-top: 4px; }
        .stat-mini-card.danger .stat-val { color: #ef4444; }
        .stat-mini-card.warning .stat-val { color: #f59e0b; }
        .stat-mini-card.info .stat-val { color: #3b82f6; }
        
        .chat-main-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        
        .filter-select { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; }
        
        .logs-table-container { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9; }
        .admin-table th { background: #f8fafc; color: #64748b; font-size: 12px; }
        
        .row-flagged { background: #fff1f2; }
        .msg-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
        .ai-cell { font-size: 12px; color: #64748b; font-style: italic; }
        .risk-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        
        .action-btns { display: flex; gap: 4px; }
        
        .add-word-form { display: flex; gap: 8px; }
        .words-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .word-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 16px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
        .word-tag button { border: none; background: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 0; }
        .word-tag button:hover { color: #ef4444; }
        
        .config-list { display: flex; flex-direction: column; gap: 12px; }
        .config-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .config-item input[type="range"] { width: 100px; }
        
        .log-details { padding: 10px 0; }
        .detail-row { display: flex; gap: 12px; margin-bottom: 8px; font-size: 14px; }
        .detail-row label { font-weight: bold; color: #64748b; min-width: 100px; }
        .msg-box, .ai-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; margin-top: 4px; }
        .ai-box { background: #f0f9ff; }
        .detail-actions { display: flex; gap: 10px; justify-content: flex-end; }
      `}} />
    </div>
  );
}
