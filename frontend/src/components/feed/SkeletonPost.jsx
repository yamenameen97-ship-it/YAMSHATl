export default function SkeletonPost() {
  return (
    <div className="animate-pulse p-4 border rounded-xl mb-4">
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
      <div className="h-32 bg-gray-300 rounded"></div>
    </div>
  );
}