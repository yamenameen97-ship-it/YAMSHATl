import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

/**
 * AnalyticsDashboard Component - v89.34 ADMIN_ANALYTICS_INTERACTIVE_CHARTS_AND_EXPORT
 *
 * لوحة تحليلات شاملة تعرض:
 * - الإحصائيات الرئيسية
 * - رسوم بيانية تفاعلية متقدمة (Line, Area, Bar, Pie, Radar) عبر Recharts
 * - عدد المستخدمين النشطين فوري (Real-time)
 * - معدل التفاعل والاحتفاظ
 * - مراقبة السيرفر واستهلاك API
 * - إحصائيات البث المباشر
 * - تصدير البيانات الشاملة إلى PDF و CSV بدون أي مكتبات إضافية
 */

// ============================================================
// Export Helpers (بدون أي node_modules إضافية)
// ============================================================

/**
 * تحويل بيانات إلى CSV وتنزيلها
 * يدعم UTF-8 BOM لعرض العربية بشكل صحيح في Excel
 */
function exportToCSV(filename, sections) {
  const lines = [];
  sections.forEach((section) => {
    lines.push(`# ${section.title}`);
    if (section.rows && section.rows.length > 0) {
      const headers = Object.keys(section.rows[0]);
      lines.push(headers.map(csvEscape).join(','));
      section.rows.forEach((row) => {
        lines.push(headers.map((h) => csvEscape(row[h])).join(','));
      });
    }
    lines.push('');
  });

  // UTF-8 BOM لضمان دعم العربية في Excel
  const bom = '\uFEFF';
  const csvContent = bom + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * تصدير PDF باستخدام نافذة الطباعة الأصلية للمتصفح
 * لا يحتاج أي مكتبة خارجية - يستخدم window.print() ➜ حفظ كـ PDF
 */
function exportToPDF(title, sections) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('⚠️ الرجاء السماح بالنوافذ المنبثقة لتصدير PDF');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleString('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  let html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Tahoma", "Arial", sans-serif;
          direction: rtl;
          color: #1e293b;
          line-height: 1.6;
          padding: 20px;
        }
        h1 {
          color: #3b82f6;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 6px;
        }
        .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
        h2 {
          color: #1e293b;
          background: #f1f5f9;
          padding: 8px 12px;
          border-right: 4px solid #3b82f6;
          margin-top: 28px;
          font-size: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          text-align: right;
          font-size: 13px;
        }
        th { background: #3b82f6; color: white; font-weight: bold; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">تاريخ التصدير: ${dateStr}</div>
  `;

  sections.forEach((section) => {
    html += `<h2>${section.title}</h2>`;
    if (section.rows && section.rows.length > 0) {
      const headers = Object.keys(section.rows[0]);
      html += '<table><thead><tr>';
      headers.forEach((h) => (html += `<th>${escapeHtml(h)}</th>`));
      html += '</tr></thead><tbody>';
      section.rows.forEach((row) => {
        html += '<tr>';
        headers.forEach((h) => (html += `<td>${escapeHtml(row[h] ?? '')}</td>`));
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
  });

  html += `
      <div class="footer">تم إنشاء هذا التقرير تلقائياً بواسطة نظام YAMSHAT للإدارة</div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Chart Palette
// ============================================================
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
};
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [realtimeUsers, setRealtimeUsers] = useState(3421);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [serverMetrics, setServerMetrics] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    apiLatency: 125,
    errorRate: 0.8,
    uptime: 99.97,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeUsers((prev) => prev + Math.floor(Math.random() * 10 - 3));
      setServerMetrics((prev) => ({
        cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(30, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        diskUsage: Math.max(10, Math.min(80, prev.diskUsage + (Math.random() - 0.5) * 2)),
        apiLatency: Math.max(80, Math.min(300, prev.apiLatency + (Math.random() - 0.5) * 20)),
        errorRate: Math.max(0.1, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.3)),
        uptime: Math.min(99.99, prev.uptime + (Math.random() - 0.5) * 0.01),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // إغلاق قائمة التصدير عند النقر خارجها
  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // بيانات تعتمد على المدى الزمني - في الإنتاج ستأتي من API
  const analyticsData = useMemo(() => {
    const rangeMultiplier = { '7d': 1, '30d': 4.2, '90d': 12.8, '1y': 52 }[timeRange] || 1;
    const daysLabels = {
      '7d': ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
      '30d': Array.from({ length: 30 }, (_, i) => `${i + 1}`),
      '90d': Array.from({ length: 12 }, (_, i) => `أسبوع ${i + 1}`),
      '1y': ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    }[timeRange];

    const userGrowth = daysLabels.map((label, i) => ({
      day: label,
      users: Math.floor(2000 + Math.sin(i * 0.7) * 500 + i * 120 + Math.random() * 200),
      newUsers: Math.floor(150 + Math.random() * 100),
      returning: Math.floor(1500 + Math.random() * 400),
    }));

    const hourlyActive = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      active: Math.floor(100 + Math.sin((i - 6) * 0.5) * 200 + Math.random() * 80),
    }));

    return {
      totalUsers: Math.floor(15234 * rangeMultiplier),
      activeUsers: realtimeUsers,
      newUsers: Math.floor(234 * rangeMultiplier),
      totalPosts: Math.floor(45678 * rangeMultiplier),
      totalComments: Math.floor(123456 * rangeMultiplier),
      totalLikes: Math.floor(456789 * rangeMultiplier),
      averageSessionDuration: 18.5,
      engagementRate: 42.3,
      retentionRate: 78.5,
      userGrowth,
      hourlyActive,
      contentBreakdown: [
        { name: 'المنشورات', value: 45678, color: PIE_COLORS[0] },
        { name: 'التعليقات', value: 123456, color: PIE_COLORS[1] },
        { name: 'الإعجابات', value: 456789, color: PIE_COLORS[2] },
        { name: 'المشاركات', value: 78901, color: PIE_COLORS[3] },
        { name: 'الريلز', value: 34567, color: PIE_COLORS[4] },
      ],
      engagementRadar: [
        { metric: 'التفاعل', value: 82, fullMark: 100 },
        { metric: 'الاحتفاظ', value: 78, fullMark: 100 },
        { metric: 'الفتح', value: 65, fullMark: 100 },
        { metric: 'النقر', value: 55, fullMark: 100 },
        { metric: 'المشاركة', value: 71, fullMark: 100 },
        { metric: 'الرضا', value: 88, fullMark: 100 },
      ],
    };
  }, [timeRange, realtimeUsers]);

  const metrics = [
    { id: 'users', label: 'المستخدمون', value: analyticsData.totalUsers, icon: '👥', change: '+12%' },
    { id: 'active', label: 'نشطون الآن', value: analyticsData.activeUsers, icon: '🟢', change: 'فوري' },
    { id: 'posts', label: 'المنشورات', value: analyticsData.totalPosts, icon: '📝', change: '+8%' },
    { id: 'engagement', label: 'معدل التفاعل', value: `${analyticsData.engagementRate}%`, icon: '📈', change: '+2.5%' },
    { id: 'retention', label: 'معدل الاحتفاظ', value: `${analyticsData.retentionRate}%`, icon: '📊', change: '+1.2%' },
  ];

  const getServerHealthColor = (value, thresholds) => {
    if (value <= thresholds.good) return '#10b981';
    if (value <= thresholds.warning) return '#f59e0b';
    return '#ef4444';
  };

  // ============================================================
  // Export Handlers
  // ============================================================
  const buildExportSections = useCallback(() => {
    const rangeLabel = { '7d': 'أسبوع', '30d': 'شهر', '90d': '3 أشهر', '1y': 'سنة' }[timeRange];
    return [
      {
        title: `الملخص التنفيذي (المدى: ${rangeLabel})`,
        rows: [
          { 'المؤشر': 'إجمالي المستخدمين', 'القيمة': analyticsData.totalUsers.toLocaleString('ar-EG') },
          { 'المؤشر': 'المستخدمون النشطون الآن', 'القيمة': analyticsData.activeUsers.toLocaleString('ar-EG') },
          { 'المؤشر': 'المستخدمون الجدد', 'القيمة': analyticsData.newUsers.toLocaleString('ar-EG') },
          { 'المؤشر': 'إجمالي المنشورات', 'القيمة': analyticsData.totalPosts.toLocaleString('ar-EG') },
          { 'المؤشر': 'إجمالي التعليقات', 'القيمة': analyticsData.totalComments.toLocaleString('ar-EG') },
          { 'المؤشر': 'إجمالي الإعجابات', 'القيمة': analyticsData.totalLikes.toLocaleString('ar-EG') },
          { 'المؤشر': 'متوسط مدة الجلسة (دقيقة)', 'القيمة': analyticsData.averageSessionDuration },
          { 'المؤشر': 'معدل التفاعل (%)', 'القيمة': analyticsData.engagementRate },
          { 'المؤشر': 'معدل الاحتفاظ (%)', 'القيمة': analyticsData.retentionRate },
        ],
      },
      {
        title: 'نمو المستخدمين حسب الفترة',
        rows: analyticsData.userGrowth.map((r) => ({
          'الفترة': r.day,
          'إجمالي المستخدمين': r.users,
          'مستخدمون جدد': r.newUsers,
          'مستخدمون عائدون': r.returning,
        })),
      },
      {
        title: 'المستخدمون النشطون (كل ساعة)',
        rows: analyticsData.hourlyActive.map((r) => ({
          'الساعة': r.hour,
          'المستخدمون النشطون': r.active,
        })),
      },
      {
        title: 'توزيع أنواع المحتوى',
        rows: analyticsData.contentBreakdown.map((r) => ({
          'النوع': r.name,
          'العدد': r.value.toLocaleString('ar-EG'),
        })),
      },
      {
        title: 'حالة السيرفر والأداء',
        rows: [
          { 'المؤشر': 'استخدام CPU', 'القيمة': `${serverMetrics.cpuUsage.toFixed(1)}%` },
          { 'المؤشر': 'استخدام الذاكرة', 'القيمة': `${serverMetrics.memoryUsage.toFixed(1)}%` },
          { 'المؤشر': 'استخدام القرص', 'القيمة': `${serverMetrics.diskUsage.toFixed(1)}%` },
          { 'المؤشر': 'زمن الاستجابة', 'القيمة': `${serverMetrics.apiLatency.toFixed(0)} ms` },
          { 'المؤشر': 'معدل الخطأ', 'القيمة': `${serverMetrics.errorRate.toFixed(2)}%` },
          { 'المؤشر': 'وقت التشغيل', 'القيمة': `${serverMetrics.uptime.toFixed(2)}%` },
        ],
      },
    ];
  }, [analyticsData, serverMetrics, timeRange]);

  const handleExportCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const stamp = new Date().toISOString().slice(0, 10);
      exportToCSV(`YAMSHAT_Analytics_${timeRange}_${stamp}.csv`, buildExportSections());
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('❌ فشل تصدير CSV: ' + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  }, [buildExportSections, timeRange]);

  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      exportToPDF('تقرير YAMSHAT التحليلي الشامل', buildExportSections());
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('❌ فشل تصدير PDF: ' + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  }, [buildExportSections]);

  return (
    <div style={{ padding: '20px', display: 'grid', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📊 لوحة التحليلات الشاملة</h1>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['7d', '30d', '90d', '1y'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'secondary'}
              onClick={() => setTimeRange(range)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {range === '7d' ? 'أسبوع' : range === '30d' ? 'شهر' : range === '90d' ? '3 أشهر' : 'سنة'}
            </Button>
          ))}

          {/* زر تصدير البيانات */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <Button
              variant="primary"
              disabled={isExporting}
              onClick={() => setShowExportMenu((v) => !v)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
              }}
            >
              {isExporting ? '⏳ جاري التصدير...' : '📥 تصدير البيانات ▾'}
            </Button>

            {showExportMenu && !isExporting && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  insetInlineStart: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '200px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleExportPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'inherit',
                    color: '#1e293b',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>تصدير PDF</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>تقرير شامل قابل للطباعة</div>
                  </div>
                </button>
                <button
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'inherit',
                    color: '#1e293b',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: '18px' }}>📊</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>تصدير CSV</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>بيانات خام لـ Excel</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.id}
            style={{
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedMetric === metric.id ? '2px solid var(--primary)' : '1px solid var(--line)',
              background: selectedMetric === metric.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-card)',
            }}
            onClick={() => setSelectedMetric(metric.id)}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{metric.icon}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{metric.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
              {typeof metric.value === 'number' ? metric.value.toLocaleString('ar-EG') : metric.value}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>{metric.change}</div>
          </Card>
        ))}
      </div>

      {/* الرسوم البيانية التفاعلية المتقدمة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {/* User Growth - Area Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            📈 نمو المستخدمين بشكل زمني
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analyticsData.userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: 'white' }}
                labelStyle={{ color: 'white', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="users"
                name="إجمالي المستخدمين"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#gradTotal)"
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                name="مستخدمون جدد"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                fill="url(#gradNew)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly Active Users - Line Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            ⏰ المستخدمون النشطون خلال اليوم (كل ساعة)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analyticsData.hourlyActive} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: 'white' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="active"
                name="المستخدمون النشطون"
                stroke={CHART_COLORS.purple}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.purple, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Content Breakdown - Pie Chart */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            🎯 توزيع أنواع المحتوى
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analyticsData.contentBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                paddingAngle={2}
                label={(entry) => entry.name}
              >
                {analyticsData.contentBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: 'white' }}
                formatter={(value) => value.toLocaleString('ar-EG')}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Engagement Radar */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
            🎯 خريطة التفاعل الشاملة
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={analyticsData.engagementRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="الأداء"
                dataKey="value"
                stroke={CHART_COLORS.danger}
                fill={CHART_COLORS.danger}
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ background: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: 'white' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Comparison Bar Chart - New/Returning */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>
          👥 مستخدمون جدد مقابل عائدون
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analyticsData.userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: 'white' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="newUsers" name="مستخدمون جدد" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} />
            <Bar dataKey="returning" name="مستخدمون عائدون" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Engagement Chart */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>💬 معدلات التفاعل والاحتفاظ</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { label: 'معدل التفاعل', value: 42.3, color: '#3b82f6' },
            { label: 'معدل الاحتفاظ', value: 78.5, color: '#10b981' },
            { label: 'معدل الفتح', value: 65.2, color: '#f59e0b' },
            { label: 'معدل النقر', value: 34.8, color: '#ef4444' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 'bold' }}>{item.value}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${item.value}%`, height: '100%', background: item.color, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Server Health Monitoring */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>🖥️ مراقبة السيرفر والأداء</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'استخدام CPU', value: serverMetrics.cpuUsage, unit: '%', thresholds: { good: 50, warning: 75 } },
            { label: 'استخدام الذاكرة', value: serverMetrics.memoryUsage, unit: '%', thresholds: { good: 60, warning: 80 } },
            { label: 'استخدام القرص', value: serverMetrics.diskUsage, unit: '%', thresholds: { good: 50, warning: 70 } },
            { label: 'زمن الاستجابة', value: serverMetrics.apiLatency, unit: 'ms', thresholds: { good: 150, warning: 250 } },
            { label: 'معدل الخطأ', value: serverMetrics.errorRate, unit: '%', thresholds: { good: 1, warning: 3 } },
            { label: 'وقت التشغيل', value: serverMetrics.uptime, unit: '%', thresholds: { good: 99.5, warning: 99 } },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                padding: '16px',
                background: 'var(--bg-soft)',
                borderRadius: '8px',
                borderInlineStart: `3px solid ${getServerHealthColor(metric.value, metric.thresholds)}`,
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{metric.label}</div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: getServerHealthColor(metric.value, metric.thresholds),
                  marginBottom: '8px',
                }}
              >
                {metric.value.toFixed(1)}
                {metric.unit}
              </div>
              <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(metric.value, 100)}%`,
                    height: '100%',
                    background: getServerHealthColor(metric.value, metric.thresholds),
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* API Usage Stats */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>📡 استهلاك API والطلبات</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          {[
            { label: 'إجمالي الطلبات', value: '2.5M', icon: '📊' },
            { label: 'الطلبات الناجحة', value: '2.48M', icon: '✅' },
            { label: 'الطلبات الفاشلة', value: '20K', icon: '❌' },
            { label: 'متوسط الاستجابة', value: '125ms', icon: '⚡' },
            { label: 'الحد الأقصى', value: '450ms', icon: '📈' },
            { label: 'معدل النجاح', value: '99.2%', icon: '🎯' },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Streams Stats */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>🔴 إحصائيات البث المباشر</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {[
            { title: 'بث 1', viewers: 234, duration: '45 دقيقة', bitrate: '2.5 Mbps', health: 'ممتاز' },
            { title: 'بث 2', viewers: 156, duration: '23 دقيقة', bitrate: '1.8 Mbps', health: 'جيد' },
            { title: 'بث 3', viewers: 89, duration: '12 دقيقة', bitrate: '1.2 Mbps', health: 'جيد' },
          ].map((stream, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-soft)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#dc2626' }}>
                🔴 {stream.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                👁️ {stream.viewers.toLocaleString('ar-EG')} مشاهد
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>⏱️ {stream.duration}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>📡 {stream.bitrate}</div>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>✓ {stream.health}</div>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        div:hover {
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}
