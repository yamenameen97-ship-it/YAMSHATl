
import { useEffect, useState } from "react";
import axios from "axios";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("/api/admin_users", { withCredentials: true })
      .then(res => setUsers(res.data));
  }, []);

  return (
    <div>
      <h2>Users</h2>
      {users.map(u => (
        <div key={u.id}>{u.username}</div>
      ))}
    </div>
  );
}
