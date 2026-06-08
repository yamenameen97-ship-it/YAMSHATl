import { useEffect, useState } from 'react';

export default function useBackendStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    fetch(
      import.meta.env.VITE_API_URL || 'http://localhost:8000'
    )
      .then(() => setOnline(true))
      .catch(() => setOnline(false));
  }, []);

  return {
    backendOnline: online,
  };
}