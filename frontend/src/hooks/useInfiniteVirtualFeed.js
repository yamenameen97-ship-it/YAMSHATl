import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteVirtualFeed Hook
 * Manages an infinite scrolling virtualized feed of items.
 * Fetches data in chunks and efficiently renders only visible items.
 *
 * @param {Function} fetchItems - Async function to fetch items. Should accept (page, limit) and return { items: [], hasMore: boolean }.
 * @param {number} initialLimit - Number of items to fetch initially and per page.
 * @param {HTMLElement} scrollContainer - The DOM element that acts as the scrollable container.
 */
const useInfiniteVirtualFeed = (fetchItems, initialLimit = 10, scrollContainer = window) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef(null);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const { items: newItems, hasMore: newHasMore } = await fetchItems(page, initialLimit);
      setItems((prevItems) => [...prevItems, ...newItems]);
      setHasMore(newHasMore);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Failed to fetch infinite feed items:', error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, page, initialLimit, isLoading, hasMore]);

  useEffect(() => {
    // Initial load
    loadMoreItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!scrollContainer) return;

    const currentObserver = observer.current;
    if (currentObserver) {
      currentObserver.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreItems();
        }
      },
      { root: scrollContainer === window ? null : scrollContainer, threshold: 0.5 }
    );

    // Attach observer to a sentinel element at the bottom of the list
    // For simplicity, we'll assume the last item in the list is the sentinel
    // In a real virtualized list, you'd have a dedicated sentinel div.
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      observer.current.observe(sentinel);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMoreItems, scrollContainer, items.length]);

  return { items, isLoading, hasMore, loadMoreItems };
};

export default useInfiniteVirtualFeed;
