
export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-white ${className}`}
      {...props}
    />
  );
}
