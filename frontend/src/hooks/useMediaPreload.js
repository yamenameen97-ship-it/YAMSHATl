import { useEffect, useState } from 'react';

/**
 * useMediaPreload Hook
 * Preloads media assets (images, videos) to improve perceived performance.
 *
 * @param {Array<string>} urls - An array of URLs to media assets to preload.
 * @param {string} type - The type of media to preload (‘image’ or ‘video’).
 */
const useMediaPreload = (urls, type = 'image') => {
  const [preloaded, setPreloaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!urls || urls.length === 0) {
      setPreloaded(true);
      return;
    }

    setPreloaded(false);
    setProgress(0);
    setErrors([]);

    let loadedCount = 0;
    const newErrors = [];

    const handleLoad = () => {
      loadedCount++;
      setProgress(Math.round((loadedCount / urls.length) * 100));
      if (loadedCount === urls.length) {
        setPreloaded(true);
      }
    };

    const handleError = (url) => {
      loadedCount++;
      newErrors.push(url);
      setErrors([...newErrors]);
      setProgress(Math.round((loadedCount / urls.length) * 100));
      if (loadedCount === urls.length) {
        setPreloaded(true);
      }
    };

    urls.forEach((url) => {
      if (type === 'image') {
        const img = new Image();
        img.src = url;
        img.onload = handleLoad;
        img.onerror = () => handleError(url);
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto';
        video.onloadeddata = handleLoad;
        video.onerror = () => handleError(url);
        video.load();
      }
    });

    return () => {
      // Cleanup if necessary, though browsers handle most of this.
    };
  }, [urls, type]);

  return { preloaded, progress, errors };
};

export default useMediaPreload;
