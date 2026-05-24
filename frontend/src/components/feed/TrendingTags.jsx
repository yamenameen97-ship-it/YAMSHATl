export default function TrendingTags() {
  const tags = ['#news', '#gaming', '#music'];

  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map(tag => (
        <span key={tag} className="px-3 py-1 border rounded-full">
          {tag}
        </span>
      ))}
    </div>
  );
}