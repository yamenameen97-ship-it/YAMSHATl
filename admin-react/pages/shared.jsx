import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

function getAuthToken() {
  try {
    const raw = localStorage.getItem("yamshatAuth");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.token || parsed?.access_token || "").trim();
  } catch {
    return "";
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && !config.headers?.Authorization) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

export function useLiveData(path, { interval = 5000, transform } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get(path);
      const nextData = typeof transform === "function" ? transform(response.data) : response.data;
      setData(nextData);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [path, transform]);

  useEffect(() => {
    fetchData();
    const timer = window.setInterval(fetchData, interval);
    return () => window.clearInterval(timer);
  }, [fetchData, interval]);

  return { data, error, loading, refresh: fetchData, lastUpdated };
}

export function StatCard({ title, value, helper, accent = "blue" }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span>{title}</span>
      <strong>{value ?? 0}</strong>
      <small>{helper}</small>
    </div>
  );
}

export function SectionCard({ title, subtitle, children, actions }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "default" }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function ActionButton({ children, tone = "default", busy = false, ...props }) {
  return (
    <button className={`action-btn tone-${tone}`} disabled={busy || props.disabled} {...props}>
      {busy ? "..." : children}
    </button>
  );
}

export function LoadingState({ label = "جاري التحميل..." }) {
  return <div className="loading-state">{label}</div>;
}

export function ErrorState({ message, retry }) {
  return (
    <div className="error-state">
      <div>{message || "حدث خطأ أثناء جلب البيانات"}</div>
      {retry ? <button className="action-btn" onClick={retry}>إعادة المحاولة</button> : null}
    </div>
  );
}

export function EmptyState({ label = "لا توجد بيانات حالياً" }) {
  return <div className="empty-state">{label}</div>;
}

export function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG");
  } catch {
    return String(value);
  }
}

export function formatRelativeTime(value) {
  if (!value) return "—";
  const date = new Date(value).getTime();
  const diff = Math.max(0, Date.now() - date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export function SimpleLineChart({ data = [], color = "#5b8cff", suffix = "" }) {
  const points = useMemo(() => {
    const values = data.map((item) => Number(item.value || 0));
    const max = Math.max(...values, 1);
    return data.map((item, index) => {
      const x = data.length === 1 ? 100 : (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((Number(item.value || 0) / max) * 88 + 6);
      return `${x},${y}`;
    }).join(" ");
  }, [data]);

  if (!data.length) return <EmptyState label="لا توجد نقاط كافية للرسم" />;

  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
      </svg>
      <div className="chart-footer labels-compact">
        {data.map((item) => (
          <div key={`${item.label}-${item.value}`}>
            <strong>{item.value}{suffix}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressList({ data = [], suffix = "" }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  if (!data.length) return <EmptyState />;
  return (
    <div className="progress-list">
      {data.map((item) => (
        <div key={`${item.label}-${item.value}`} className="progress-row">
          <div className="progress-meta">
            <strong>{item.label}</strong>
            <span>{item.value}{suffix}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(Number(item.value || 0) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
