import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import '../styles/livestream-dashboard.css';

// Professional Theme Colors
const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#EF4444'];

// Sample data for charts
const chartData = [
  { date: 'مايو 12', viewers: 3500 },
  { date: 'مايو 13', viewers: 4200 },
  { date: 'مايو 14', viewers: 3800 },
  { date: 'مايو 15', viewers: 5100 },
  { date: 'مايو 16', viewers: 4900 },
  { date: 'مايو 17', viewers: 5800 },
  { date: 'مايو 18', viewers: 6200 },
];

const pieData = [
  { name: 'بثوث مباشرة', value: 40 },
  { name: 'منشورات', value: 25 },
  { name: 'ريلز', value: 20 },
  { name: 'ستوري', value: 10 },
  { name: 'أخرى', value: 5 },
];

const barData = [
  { name: '19 أبريل', views: 400 },
  { name: '28 أبريل', views: 300 },
  { name: '29 أبريل', views: 500 },
  { name: '4 مايو', views: 450 },
  { name: '9 مايو', views: 600 },
  { name: '14 مايو', views: 550 },
  { name: '18 مايو', views: 700 },
];

export default function LiveStreamDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <div className="livestream-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📡</span>
            <span className="logo-text">LiveStream</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar"></div>
          <div className="user-info">
            <p className="user-name">المدير العام</p>
            <p className="user-status">متصل</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <p className="menu-title">الرئيسية</p>
          <a href="#" className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveMenu('dashboard')}>
            <span className="menu-icon">📊</span>
            <span className="menu-label">لوحة التحكم</span>
          </a>

          <p className="menu-title">إدارة المحتوى</p>
          <a href="#" className="menu-item">
            <span className="menu-icon">📡</span>
            <span className="menu-label">إدارة البثوث</span>
            <span className="badge">LIVE</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📝</span>
            <span className="menu-label">إدارة المنشورات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">💬</span>
            <span className="menu-label">إدارة الشات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📱</span>
            <span className="menu-label">إدارة الستوري</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🎬</span>
            <span className="menu-label">إدارة الريلز</span>
          </a>

          <p className="menu-title">إدارة المستخدمين</p>
          <a href="#" className="menu-item">
            <span className="menu-icon">👥</span>
            <span className="menu-label">المستخدمين</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🛡️</span>
            <span className="menu-label">المشرفين</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🚫</span>
            <span className="menu-label">المحظورين</span>
          </a>

          <p className="menu-title">النظام</p>
          <a href="#" className="menu-item">
            <span className="menu-icon">📈</span>
            <span className="menu-label">التقارير والإحصائيات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">⚙️</span>
            <span className="menu-label">الإعدادات العامة</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="بحث عن مستخدم، بث، منشور..." />
          </div>
          <div className="top-actions">
            <button className="icon-btn">🌙</button>
            <button className="icon-btn has-notification">🔔</button>
            <button className="icon-btn">✉️</button>
            <div className="user-menu">
              <div className="user-avatar-small"></div>
              <span>المدير العام</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-header">
            <h1>لوحة التحكم</h1>
            <p>مرحباً بك، إليك نظرة عامة على المنصة</p>
          </div>

          {/* Stats Grid */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">👥</div>
              <span className="stat-label">إجمالي المستخدمين</span>
              <span className="stat-value">128,560</span>
              <div className="stat-change"><span className="positive">▲ 12.5%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📡</div>
              <span className="stat-label">البثوث المباشرة</span>
              <span className="stat-value">1,245</span>
              <div className="stat-change"><span className="positive">▲ 18.7%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">👁️</div>
              <span className="stat-label">المشاهدات الكلية</span>
              <span className="stat-value">2.45M</span>
              <div className="stat-change"><span className="positive">▲ 15.3%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">💰</div>
              <span className="stat-label">الإيرادات</span>
              <span className="stat-value">$ 45,231.89</span>
              <div className="stat-change"><span className="positive">▲ 21.4%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pink">📝</div>
              <span className="stat-label">المنشورات</span>
              <span className="stat-value">15,890</span>
              <div className="stat-change"><span className="positive">▲ 17.2%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">🎬</div>
              <span className="stat-label">الريلز</span>
              <span className="stat-value">8,456</span>
              <div className="stat-change"><span className="positive">▲ 11.3%</span> <span className="text-muted">من الشهر الماضي</span></div>
            </div>
          </section>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>📈 المشاهدات خلال آخر 7 أيام</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#151a24', border: 'none', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="viewers" stroke="#7C3AED" fillOpacity={1} fill="url(#colorViewers)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>🥧 توزيع المحتوى</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend" style={{ marginTop: '10px' }}>
                {pieData.map((item, index) => (
                  <div key={item.name} className="legend-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span>{item.name}</span>
                    </div>
                    <span>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>🔔 النشاطات الأخيرة</h3>
              <div className="activities-list">
                {[
                  { user: 'PlayerOne', action: 'بث جديد من المستخدم', time: 'منذ 5 دقائق' },
                  { user: 'KhaledGamer', action: 'تم نشر منشور جديد', time: 'منذ 15 دقيقة' },
                  { user: 'ShadowGirl', action: 'تعليق جديد على البث المباشر', time: 'منذ 20 دقيقة' },
                  { user: 'MoxX', action: 'تم نشر ستوري جديد', time: 'منذ 30 دقيقة' },
                ].map((item, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-avatar"></div>
                    <div className="activity-details">
                      <p><strong>{item.user}</strong> {item.action}</p>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className="tables-row">
            <div className="table-card">
              <div className="table-header">
                <h3>📡 إدارة البثوث</h3>
                <button className="add-btn">+ بث مباشر جديد</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>عنوان البث</th>
                    <th>المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>أحمد محمود</td><td>مغامرة جديدة</td><td>1,250</td></tr>
                  <tr><td>خالد محمد</td><td>بطولة العالم</td><td>980</td></tr>
                  <tr><td>ليلى علي</td><td>تحديات البطولة</td><td>620</td></tr>
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>📝 إدارة المنشورات</h3>
                <button className="add-btn">+ منشور جديد</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>المحتوى</th>
                    <th>التفاعلات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>خالد محمد</td><td>لحظات من البث...</td><td>2.5K</td></tr>
                  <tr><td>ليلى علي</td><td>شكراً على الدعم...</td><td>1.8K</td></tr>
                  <tr><td>محمد أحمد</td><td>أخبروني عن رأيكم...</td><td>965</td></tr>
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>💬 إدارة الشات</h3>
              </div>
              <div className="chat-container">
                <table className="data-table chat-list">
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>آخر رسالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>ahmed_king</td><td>شكراً على البث!</td></tr>
                    <tr><td>lina_music</td><td>متى البث القادم؟</td></tr>
                    <tr><td>game_master</td><td>رائع جداً استمر</td></tr>
                  </tbody>
                </table>
                <div className="chat-preview">
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>تفاصيل المحادثة</p>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#334155', margin: '0 auto 10px' }}></div>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>ahmed_king</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>ahmed@example.com</p>
                    <button style={{ marginTop: '15px', width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px' }}>حظر المستخدم</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="bottom-grid">
            <div className="table-card">
              <div className="table-header"><h3>📱 إدارة الستوري</h3></div>
              <table className="data-table">
                <tbody>
                  <tr><td>MoxX</td><td>1.2K مشاهدة</td></tr>
                  <tr><td>ShadowGirl</td><td>980 مشاهدة</td></tr>
                </tbody>
              </table>
            </div>
            <div className="table-card">
              <div className="table-header"><h3>🎬 إدارة الريلز</h3></div>
              <table className="data-table">
                <tbody>
                  <tr><td>ProHunter</td><td>2.5K مشاهدة</td></tr>
                  <tr><td>KhaledGamer</td><td>1.8K مشاهدة</td></tr>
                </tbody>
              </table>
            </div>
            <div className="table-card">
              <div className="table-header"><h3>📊 التقارير والإحصائيات</h3></div>
              <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                <ResponsiveContainer width="50%" height={150}>
                  <BarChart data={barData}>
                    <Bar dataKey="views" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>معدل التفاعل</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>5.23% <span style={{ color: '#10B981', fontSize: '12px' }}>▲ 12.7%</span></p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>إجمالي الإيرادات</p>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>$ 45,231</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
