
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";

function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <aside style={{ width: 200, background: "#111", color: "#fff" }}>
        <h3>Admin</h3>
        <Link to="/">Dashboard</Link><br/>
        <Link to="/users">Users</Link>
      </aside>
      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
