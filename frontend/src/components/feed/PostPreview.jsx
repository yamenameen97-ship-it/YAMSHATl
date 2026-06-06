export default function PostPreview({ post }) {
  return (
    <div className="border rounded-xl p-4">
      <h3>Preview</h3>
      <p>{post?.text}</p>
    </div>
  );
}