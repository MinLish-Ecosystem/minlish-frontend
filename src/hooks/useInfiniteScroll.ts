import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useInfiniteScroll
 *
 * Returns a slice of `items` that grows as the user scrolls the sentinel
 * element into view. Uses IntersectionObserver for performance —
 * no scroll event listeners needed.
 *
 * @param items      Full array of items to paginate through
 * @param pageSize   How many items to add each time the sentinel is visible
 * @param resetDeps  React dependency array which triggers resetting pagination to page 1
 * @returns          { visibleItems, sentinelRef, hasMore }
 */
export function useInfiniteScroll<T>(
  items: T[],
  pageSize = 12,
  resetDeps: React.DependencyList = [items]
) {
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset to page 1 when filter/query dependencies change
  useEffect(() => {
    setPage(1);
  }, resetDeps);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    }
  }, [loadMore]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const visibleItems = items.slice(0, page * pageSize);
  const hasMore = visibleItems.length < items.length;

  return { visibleItems, sentinelRef, hasMore };
}

