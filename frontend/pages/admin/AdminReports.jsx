import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import { AdminOverviewSkeleton } from '../../components/feedback/Skeleton.jsx';
import { exportAdminReport, getAdminReportsSummary, updateReportStatus, escalateReport } from '../../api/admin.js';
import { DonutChart } from '../../components/admin/Charts.jsx';
import { useToast } from '../../components/admin/ToastProvider.jsx';

const CATEGORIES = ['Spam', 'Abuse', 'Inappropriate Content', 'Harassment', 'Other'];

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const { pushToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const { data } = await getAdminReportsSummary();
      setSummary(data.summary || {});
      setReports(data.reports || []);
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusUpdate = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
      pushToast({ title: 'Report Updated', description: `Status set to ${status}`, type: 'success' });
      loadData();
    } catch (err) {
      pushToast({ title: 'Update Failed', type: 'error' });
    }
  };

  const handleEscalate = async (reportId) => {
    try {
      await escalateReport(reportId);
      pushToast({ title: 'Report Escalated', description: 'Sent to senior moderation team', type: 'info' });
      loadData();
    } catch (err) {
      pushToast({ title: 'Escalation Failed', type: 'error' });
    }
  };

  return (
    <AdminLayout>
      <section className="dashboard-hero-grid small-gap">
        <Card className="hero-card">
          <h3 className="section-title">Moderation Workflow & Report Center</h3>
          <div className="report-categories-bar">
            {CATEGORIES.map(cat => (
              <span key={cat} className="category-pill">{cat}</span>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-head split">
          <h3 className="section-title">Review Queue (Auto-Moderation Enabled)</h3>
          <Button variant="secondary" onClick={loadData}>Refresh Queue</Button>
        </div>

        {loading ? <AdminOverviewSkeleton /> : (
          <div className="table-shell">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>#{report.id}</td>
                    <td><span className="badge info">{report.category}</span></td>
                    <td>{report.reporter_name}</td>
                    <td>{report.target_type}: {report.target_id}</td>
                    <td><span className={`status-dot ${report.status}`}></span> {report.status}</td>
                    <td>{report.priority === 'high' ? '🔴 High' : '🟡 Normal'}</td>
                    <td>
                      <div className="action-row">
                        <button className="mini-action" onClick={() => { setSelectedReport(report); setEvidenceOpen(true); }}>View Evidence</button>
                        <button className="mini-action" onClick={() => handleStatusUpdate(report.id, 'resolved')}>Resolve</button>
                        <button className="mini-action warning" onClick={() => handleEscalate(report.id)}>Escalate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={evidenceOpen} title="Evidence Viewer" onClose={() => setEvidenceOpen(false)}>
        {selectedReport && (
          <div className="evidence-container">
            <div className="evidence-meta">
              <p><strong>Reason:</strong> {selectedReport.reason}</p>
              <p><strong>Timestamp:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
            </div>
            <div className="evidence-content">
              {selectedReport.evidence_url ? (
                <img src={selectedReport.evidence_url} alt="Evidence" className="evidence-img" />
              ) : (
                <div className="text-evidence">{selectedReport.content_snapshot}</div>
              )}
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setEvidenceOpen(false)}>Close</Button>
              <Button className="danger" onClick={() => handleStatusUpdate(selectedReport.id, 'rejected')}>Reject & Dismiss</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
