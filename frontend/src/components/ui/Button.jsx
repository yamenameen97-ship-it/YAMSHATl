
export default function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}) {

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white border border-white/10',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      className={`px-4 py-2 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
