export default function SessionCard({ session }) {
  return (
    <div className="session-card">
      <h3>{session?.device}</h3>
      <p>{session?.ip}</p>
      <p>{session?.lastActivity}</p>
      <button>Logout</button>
    </div>
  );
}