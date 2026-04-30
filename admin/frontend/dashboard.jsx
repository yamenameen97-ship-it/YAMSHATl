import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/admin/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => setError(err.message || "Failed to load stats"));
  }, []);

  if (error) return <div>{error}</div>;
  if (!stats) return <div>Loading admin stats...</div>;

  return (
    <section>
      <h2>Admin Dashboard</h2>
      <ul>
        <li>Users: {stats.users}</li>
        <li>Messages: {stats.messages}</li>
        <li>Reports: {stats.reports}</li>
        <li>Logs: {stats.logs}</li>
      </ul>
    </section>
  );
}
