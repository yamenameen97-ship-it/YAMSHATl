import { useEffect, useState } from 'react';

export default function InfiniteFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setPosts(prev => [...prev, ...Array(10).fill({ text: 'Post' })]);
  };

  return (
    <div>
      {posts.map((p, i) => (
        <div key={i} className="p-4 border-b">{p.text}</div>
      ))}
    </div>
  );
}