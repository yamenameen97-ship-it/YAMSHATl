import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import MainLayout from '../components/layout/MainLayout.jsx';
import '../styles/livestream-dashboard.css';

// Sample data for charts
const chartData = [
  { date: '12 مايو', viewers: 3500 },
  { date: '13 مايو', viewers: 4200 },
  { date: '14 مايو', viewers: 3800 },
  { date: '15 مايو', viewers: 5100 },
  { date: '16 مايو', viewers: 4900 },
  { date: '17 مايو', viewers: 5800 },
  { date: '18 مايو', viewers: 6200 },
];

const pieData = [
  { name: 'بدون مشاركة', value: 40 },
  { name: 'منشورات', value: 25 },
  { name: 'روابط', value: 20 },
  { name: 'صور', value: 10 },
  { name: 'أخرى', value: 5 },
];

const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EF4444'];

// Streams data
const streamsData = [
  { id: 1, name: 'PlayerOne', user: 'أحمد محمود', viewers: 1250, time: '10:30 PM', status: 'live' },
  { id: 2, name: 'KhaleelGamer', user: 'خالد محمد', viewers: 630, time: '10:25 PM', status: 'live' },
  { id: 3, name: 'ShadowGirl', user: 'ليلى علي', viewers: 620, time: '10:20 PM', status: 'offline' },
  { id: 4, name: 'MaxX', user: 'محمد أحمد', viewers: 420, time: '10:15 PM', status: 'offline' },
  { id: 5, name: 'ProHunter', user: 'أحمد علي', viewers: 320, time: '10:10 PM', status: 'offline' },
];

// Projects data
const projectsData = [
  { id: 1, name: 'PlayerOne', user: 'أحمد محمود', views: '2.5K', time: '10:30 PM' },
  { id: 2, name: 'KhaleelGamer', user: 'خالد محمد', views: '1.8K', time: '10:25 PM' },
  { id: 3, name: 'ShadowGirl', user: 'ليلى علي', views: '1.5K', time: '10:20 PM' },
  { id: 4, name: 'MaxX', user: 'محمد أحمد', views: '1.2K', time: '10:15 PM' },
  { id: 5, name: 'PlayerOne', user: 'أحمد علي', views: '980', time: '10:10 PM' },
];

// Chat data
const chatData = [
  { id: 1, name: 'PlayerOne', user: 'أحمد محمود', message: 'مرحبا بالجميع', time: '10:30 PM' },
  { id: 2, name: 'KhaleelGamer', user: 'خالد محمد', message: 'كيف حالكم', time: '10:25 PM' },
  { id: 3, name: 'ShadowGirl', user: 'ليلى علي', message: 'تمام التمام', time: '10:20 PM' },
  { id: 4, name: 'MaxX', user: 'محمد أحمد', message: 'رائع جداً', time: '10:15 PM' },
  { id: 5, name: 'ProHunter', user: 'أحمد علي', message: 'شكراً لكم', time: '10:10 PM' },
];

export default function LiveStreamDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="livestream-dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">📡</div>
            <span className="logo-text">LiveStream</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar"></div>
          <div className="user-info">
            <p className="user-name">مدير الحسابات</p>
            <p className="user-status">نشط</p>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="sidebar-menu">
          <p className="menu-title">القائمة الرئيسية</p>
          <a href="#" className="menu-item active">
            <span className="menu-icon">📊</span>
            <span className="menu-label">لوحة التحكم</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📡</span>
            <span className="menu-label">إدارة البثوث</span>
            <span className="badge">LIVE</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📁</span>
            <span className="menu-label">إدارة المشروعات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">💬</span>
            <span className="menu-label">إدارة الشات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🛍️</span>
            <span className="menu-label">إدارة المتجر</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🔗</span>
            <span className="menu-label">إدارة الرابط</span>
          </a>
        </nav>

        {/* Content Management */}
        <nav className="sidebar-menu">
          <p className="menu-title">إدارة المحتوى</p>
          <a href="#" className="menu-item">
            <span className="menu-icon">👤</span>
            <span className="menu-label">مدير البث</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">👥</span>
            <span className="menu-label">المتابعون</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">👥</span>
            <span className="menu-label">المتابعين</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">👥</span>
            <span className="menu-label">المجموعات</span>
          </a>
        </nav>

        {/* Tools */}
        <nav className="sidebar-menu">
          <p className="menu-title">الأدوات</p>
          <a href="#" className="menu-item">
            <span className="menu-icon">📈</span>
            <span className="menu-label">التقارير والإحصائيات</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🔔</span>
            <span className="menu-label">الإشعارات العامة</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">❓</span>
            <span className="menu-label">الدعم والاستشارة</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📋</span>
            <span className="menu-label">سجل المشروعات</span>
          </a>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn">تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="search-bar">
            <input type="text" placeholder="ابحث عن مستخدم أو مشروع..." />
            <span className="search-icon">🔍</span>
          </div>
          <div className="top-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">✉️</button>
            <button className="icon-btn">⚙️</button>
            <div className="user-menu">
              <div className="user-avatar-small"></div>
              <span>المدير العام</span>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="page-header">
          <h1>لوحة التحكم</h1>
          <p>مرحباً بك في لوحة تحكم LiveStream</p>
        </div>

        {/* Scrollable Content */}
        <div className="dashboard-content">
          {/* Statistics Cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">👥</div>
              <div className="stat-label">Q4</div>
              <div className="stat-value">128,560</div>
              <div className="stat-change">
                <span className="positive">+12.5%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">📡</div>
              <div className="stat-label">البثوث المباشرة</div>
              <div className="stat-value">1,245</div>
              <div className="stat-change">
                <span className="positive">+18.7%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">👁️</div>
              <div className="stat-label">المشاهدات الكلية</div>
              <div className="stat-value">2.45M</div>
              <div className="stat-change">
                <span className="positive">+15.3%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">💰</div>
              <div className="stat-label">الإيرادات</div>
              <div className="stat-value">$45,231.89</div>
              <div className="stat-change">
                <span className="positive">+21.4%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pink">📦</div>
              <div className="stat-label">المشروعات</div>
              <div className="stat-value">15,890</div>
              <div className="stat-change">
                <span className="positive">+17.2%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">📁</div>
              <div className="stat-label">الأرشيف</div>
              <div className="stat-value">8,456</div>
              <div className="stat-change">
                <span className="positive">+11.3%</span>
                <span className="change-label">من الشهر الماضي</span>
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            {/* Line Chart */}
            <div className="chart-card">
              <h3>📈 المشاهدات خلال آخر 7 أيام</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="viewers" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="chart-card">
              <h3>🥧 توزيع المحتوى</h3>
              <div className="pie-container">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span>{item.name}</span>
                      <span className="legend-value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tables Section */}
          <section className="tables-section">
            {/* Streams Table */}
            <div className="table-card">
              <div className="table-header">
                <h3>📡 إدارة البثوث</h3>
                <button className="add-btn">+ إضافة</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الحالة</th>
                    <th>المستخدم</th>
                    <th>المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  {streamsData.map((stream) => (
                    <tr key={stream.id}>
                      <td>
                        <div className={`status-dot ${stream.status}`}></div>
                      </td>
                      <td>{stream.user}</td>
                      <td className="views">{stream.viewers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Projects Table */}
            <div className="table-card">
              <div className="table-header">
                <h3>📦 إدارة المشروعات</h3>
                <button className="add-btn">+ إضافة</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المشروع</th>
                    <th>المستخدم</th>
                    <th>المشاهدات</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsData.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.user}</td>
                      <td className="views green">{project.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chat Table */}
            <div className="table-card">
              <div className="table-header">
                <h3>💬 إدارة الشات</h3>
                <button className="add-btn">+ إضافة</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>الرسالة</th>
                  </tr>
                </thead>
                <tbody>
                  {chatData.map((chat) => (
                    <tr key={chat.id}>
                      <td>{chat.user}</td>
                      <td className="message">{chat.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Additional Sections */}
          <section className="additional-section">
            <div className="store-card">
              <h3>🛍️ إدارة المتجر</h3>
              <div className="product-grid">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="product-item">
                    <div className="product-image">📷</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h3>📊 الإحصائيات المتقدمة</h3>
              <div className="analytics-list">
                <div className="analytics-item">
                  <span>إجمالي المشاهدات</span>
                  <span className="value">2.45M</span>
                </div>
                <div className="analytics-item">
                  <span>متوسط المشاهدات</span>
                  <span className="value">15:42</span>
                </div>
                <div className="analytics-item">
                  <span>معدل التفاعل</span>
                  <span className="value">5.23%</span>
                </div>
                <div className="analytics-item">
                  <span>الإيرادات</span>
                  <span className="value">$45,231.89</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
