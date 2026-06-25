import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteScroll } from './useInfiniteScroll'

// Simple paging state machine: scroll to bottom → fetch the next batch → append to `items`
// immediately. Existing rows stay visible while loading (the page renders them ungated); a
// loading indicator shows in the footer. Matches the MisakaDockerMonitor pull-to-load pattern.
export function usePagedList({ fetch, batchSize = 50, rootRef = null, enabled = true }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [isInitial, setIsInitial] = useState(true)

  const pageStateRef = useRef(null)
  const seqRef = useRef(0)
  const fetchRef = useRef(fetch)
  fetchRef.current = fetch

  const run = useCallback(async (mode) => {
    const seq = ++seqRef.current
    setLoading(true)
    setError('')
    try {
      const { items: page, nextPageState, hasMore: more } = await fetchRef.current(pageStateRef.current, batchSize)
      if (seqRef.current !== seq) return // a newer reload/loadMore superseded this one
      pageStateRef.current = nextPageState
      setHasMore(!!more)
      setItems(prev => mode === 'reload' ? page : [...prev, ...page])
      setIsInitial(false)
    } catch (e) {
      if (seqRef.current !== seq) return
      setError(e?.message || String(e))
    } finally {
      if (seqRef.current === seq) setLoading(false)
    }
  }, [batchSize])

  const reload = useCallback(() => {
    pageStateRef.current = null
    setHasMore(true)
    setIsInitial(true)
    setItems([])
    return run('reload')
  }, [run])

  const loadMore = useCallback(() => run('append'), [run])

  const { sentinelRef } = useInfiniteScroll(loadMore, {
    enabled: enabled && hasMore && !loading,
    rootRef,
  })

  useEffect(() => { reload() }, [reload])

  return { items, loading, error, hasMore, reload, loadMore, sentinelRef, isInitial }
}
