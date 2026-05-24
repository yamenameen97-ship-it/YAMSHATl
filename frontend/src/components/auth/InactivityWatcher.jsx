import { useEffect } from 'react';

export default function InactivityWatcher() {
  useEffect(() => {
    let timeout = setTimeout(() => {
      console.log('Auto logout triggered');
    }, 30 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}