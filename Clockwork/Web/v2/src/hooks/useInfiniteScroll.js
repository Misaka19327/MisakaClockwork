import { useEffect, useRef } from 'react'

// Triggers onLoadMore when the sentinel enters the scroll viewport. Thin by design: the owning
// page/hook owns all paging state; this only turns "scrolled near the bottom" into a callback.
export function useInfiniteScroll(onLoadMore, { enabled = true, rootRef = null, rootMargin = '200px' } = {}) {
  const sentinelRef = useRef(null)
  // Keep the latest onLoadMore without re-creating the observer on every render.
  const cbRef = useRef(onLoadMore)
  cbRef.current = onLoadMore

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && enabled) cbRef.current?.()
      }
    }, { root: rootRef?.current ?? null, rootMargin, threshold: 0 })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, rootRef, rootMargin])

  return { sentinelRef }
}
