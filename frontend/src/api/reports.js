/**
 * خدمة استدعاءات API لنظام البلاغات.
 * تُستخدم من قبل ReportModal و AdminReportsPanel وأي مكان آخر.
 */
import axios from 'axios';
import { API_BASE } from './config.js';

function authHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchReportReasons() {
  const { data } = await axios.get(`${API_BASE}/api/reports/reasons`);
  return data;
}

export async function submitReport({ targetType, targetId, reason, details, context }) {
  const { data } = await axios.post(
    `${API_BASE}/api/reports`,
    {
      target_type: targetType,
      target_id: String(targetId),
      reason,
      details: details || null,
      context: context || {},
    },
    { headers: authHeaders() },
  );
  return data;
}

export async function fetchMyReports(page = 1, pageSize = 20) {
  const { data } = await axios.get(
    `${API_BASE}/api/reports/my?page=${page}&page_size=${pageSize}`,
    { headers: authHeaders() },
  );
  return data;
}

/* ====== Admin ====== */
export async function adminListReports(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'all') params.set(k, v);
  });
  const { data } = await axios.get(
    `${API_BASE}/api/reports/admin?${params.toString()}`,
    { headers: authHeaders() },
  );
  return data;
}

export async function adminFetchReportStats() {
  const { data } = await axios.get(
    `${API_BASE}/api/reports/admin/stats`,
    { headers: authHeaders() },
  );
  return data;
}

export async function adminGetReport(reportId) {
  const { data } = await axios.get(
    `${API_BASE}/api/reports/admin/${reportId}`,
    { headers: authHeaders() },
  );
  return data;
}

export async function adminUpdateReport(reportId, payload) {
  const { data } = await axios.patch(
    `${API_BASE}/api/reports/admin/${reportId}`,
    payload,
    { headers: authHeaders() },
  );
  return data;
}

export async function adminActionReport(reportId, action, notes, durationHours) {
  const { data } = await axios.post(
    `${API_BASE}/api/reports/admin/${reportId}/action`,
    { action, notes: notes || null, duration_hours: durationHours || null },
    { headers: authHeaders() },
  );
  return data;
}

export async function adminBulkAction(ids, action, notes) {
  const { data } = await axios.post(
    `${API_BASE}/api/reports/admin/bulk`,
    { ids, action, notes: notes || null },
    { headers: authHeaders() },
  );
  return data;
}
