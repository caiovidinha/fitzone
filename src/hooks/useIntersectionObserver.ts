import { useEffect, useRef } from "react";

/**
 * Calls `onIntersect` when the ref element enters the viewport.
 * Used to trigger next-page loads in infinite scroll lists.
 *
 * @param onIntersect - called once when the sentinel becomes visible
 * @param enabled     - set false to prevent firing (e.g. no more pages)
 */
export function useIntersectionObserver(
  onIntersect: () => void,
  enabled: boolean
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before the end
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return sentinelRef;
}
