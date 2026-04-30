import React, { useEffect, useState } from "react";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/admin/reports")
      .then((res) => res.json())
      .then(setReports)
      .catch((err) => setError(err.message || "Failed to load reports"));
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <section>
      <h2>Reports</h2>
      <ul>
        {reports.map((item) => (
          <li key={item.id || `${item.target_type}-${item.target_value}`}>
            <strong>{item.target_type}</strong> - {item.target_value} - {item.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
