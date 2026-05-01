import React, { useEffect, useState } from "react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/admin/logs")
      .then((res) => res.json())
      .then(setLogs)
      .catch((err) => setError(err.message || "Failed to load logs"));
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <section>
      <h2>Audit Logs</h2>
      <ul>
        {logs.map((entry, index) => (
          <li key={`${entry.timestamp || index}-${entry.action || "log"}`}>
            <strong>{entry.timestamp}</strong> - {entry.actor} - {entry.action} - {entry.target}
          </li>
        ))}
      </ul>
    </section>
  );
}
