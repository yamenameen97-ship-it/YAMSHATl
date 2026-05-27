
export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
}
