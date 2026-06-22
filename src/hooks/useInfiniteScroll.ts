import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useInfiniteScroll
 *
 * Returns a slice of `items` that grows as the user scrolls the sentinel
 * element into view.  Uses IntersectionObserver for performance —
 * no scroll event listeners needed.
 *
 * @param items     Full array of items to paginate through
 * @param pageSize  How many items to add each time the sentinel is visible
 * @returns         { visibleItems, sentinelRef, hasMore }
 */
export function useInfiniteScroll<T>(items: T[], pageSize = 12) {
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset to page 1 whenever the underlying items list changes
  useEffect(() => {
    setPage(1);
  }, [items]);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, page * pageSize);
  const hasMore = visibleItems.length < items.length;

  return { visibleItems, sentinelRef, hasMore };
}
