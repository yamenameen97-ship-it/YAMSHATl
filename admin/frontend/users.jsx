import React, { useState } from "react";

export default function Users() {
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function banUser() {
    setMessage("");
    const response = await fetch("/admin/ban_user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, reason }),
    });
    const data = await response.json();
    setMessage(data.message || `${data.username || username} banned successfully`);
  }

  return (
    <section>
      <h2>Users</h2>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason" />
      <button onClick={banUser}>Ban user</button>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
