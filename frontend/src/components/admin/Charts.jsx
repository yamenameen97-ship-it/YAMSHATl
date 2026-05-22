function buildPoints(data, width, height) {
  if (!data.length) return '';
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((Number(item.value) || 0) / max) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

export function LineChart({ data = [] }) {
  const width = 320;
  const height = 140;
  const points = buildPoints(data, width, height);
  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height + 16}`} className="chart-svg">
        <polyline fill="none" stroke="url(#lineGradient)" strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="chart-label-row">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
  return (
    <div className="bar-chart">
      {data.map((item) => (
        <div key={item.label} className="bar-item">
          <div className="bar-track">
            <div className="bar-value" style={{ height: `${Math.max(((Number(item.value) || 0) / max) * 100, 8)}%` }} />
          </div>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
  let start = 0;
  const palette = ['#8b5cf6', '#06b6d4', '#f97316', '#22c55e', '#ec4899'];
  const segments = data
    .map((item, index) => {
      const value = Number(item.value) || 0;
      const end = start + (value / total) * 360;
      const color = palette[index % palette.length];
      const segment = `${color} ${start}deg ${end}deg`;
      start = end;
      return segment;
    })
    .join(', ');

  return (
    <div className="donut-wrap">
      <div className="donut-chart" style={{ background: `conic-gradient(${segments || '#8b5cf6 0 360deg'})` }}>
        <div className="donut-hole">
          <strong>{total}</strong>
          <span>إجمالي</span>
        </div>
      </div>
      <div className="legend-list">
        {data.map((item, index) => (
          <div key={item.label} className="legend-item">
            <span className="legend-dot" style={{ background: palette[index % palette.length] }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
