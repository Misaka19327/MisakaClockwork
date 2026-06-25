import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteScroll } from './useInfiniteScroll'
import { gsap, motionOk } from '../lib/motion.js'

// Generic paging state machine with a "reveal" append UX: committed rows stay visible and fixed
// while a new batch loads; the batch lands in a `pending` buffer, waits revealDelayMs, then slides
// up to join the list. If the pending region is scrolled out of view at join time, the animation
// is skipped (instant join) so the user's scroll position never jumps. `reload` (initial / filter
// change) commits the first batch immediately so the page's entrance animation still plays.
export function usePagedList({ fetch, batchSize = 50, rootRef = null, enabled = true, revealDelayMs = 1500 }) {
  const [items, setItems] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [isInitial, setIsInitial] = useState(true)

  const pageStateRef = useRef(null)
  const pendingRef = useRef([])        // source of truth — timer/join closures read this
  const seqRef = useRef(0)
  const fetchRef = useRef(fetch)
  const revealTimerRef = useRef(null)
  const revealRegionRef = useRef(null) // pending <tbody> — viewport check + animation target
  fetchRef.current = fetch

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) { clearTimeout(revealTimerRef.current); revealTimerRef.current = null }
  }, [])

  const killRevealTweens = useCallback(() => {
    if (revealRegionRef.current && motionOk()) gsap.killTweensOf(revealRegionRef.current.querySelectorAll('tr'))
  }, [])

  // Move pending into items. Animated (slide up) only when the reveal region is in the scroll
  // viewport; otherwise instant, so an off-screen join never shifts the user's position.
  const join = useCallback(() => {
    revealTimerRef.current = null
    const region = revealRegionRef.current
    const root = rootRef?.current
    const snap = pendingRef.current
    if (!snap.length) return

    let visible = false
    if (region && root) {
      const a = region.getBoundingClientRect()
      const b = root.getBoundingClientRect()
      visible = a.bottom > b.top && a.top < b.bottom
    }

    if (visible && motionOk()) {
      // Keep pending mounted so GSAP can animate the rows — clearing now would unmount the very
      // nodes we tween (a flash). Commit + clear on completion. Committing pendingRef.current
      // (not just `snap`) also folds in any rows from a fetch that was in-flight when join fired
      // and resolves mid-animation, instead of dropping them.
      setJoining(true)
      gsap.fromTo(
        region.querySelectorAll('tr'),
        { y: 40, opacity: 0.55 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', onComplete: () => {
          setItems(prev => [...prev, ...pendingRef.current])
          pendingRef.current = []
          setPending([])
          setJoining(false)
        } }
      )
    } else {
      // Off-screen / reduced-motion: instant commit + clear, no animation.
      pendingRef.current = []
      setPending([])
      setItems(prev => [...prev, ...snap])
    }
  }, [rootRef])

  const scheduleReveal = useCallback(() => {
    clearRevealTimer()
    revealTimerRef.current = setTimeout(join, revealDelayMs)
  }, [clearRevealTimer, join, revealDelayMs])

  const run = useCallback(async (mode) => {
    const seq = ++seqRef.current
    setLoading(true)
    setError('')
    try {
      const { items: page, nextPageState, hasMore: more } = await fetchRef.current(pageStateRef.current, batchSize)
      if (seqRef.current !== seq) return                  // a newer reload/loadMore superseded this one
      pageStateRef.current = nextPageState
      setHasMore(!!more)
      if (mode === 'reload') {
        clearRevealTimer(); killRevealTweens()
        pendingRef.current = []; setPending([]); setJoining(false)
        setItems(page); setIsInitial(false)
      } else {
        pendingRef.current = [...pendingRef.current, ...page]
        setPending(pendingRef.current)
        scheduleReveal()
      }
    } catch (e) {
      if (seqRef.current !== seq) return
      setError(e?.message || String(e))
    } finally {
      if (seqRef.current === seq) setLoading(false)
    }
  }, [batchSize, clearRevealTimer, killRevealTweens, scheduleReveal])

  const reload = useCallback(() => {
    clearRevealTimer(); killRevealTweens()
    pendingRef.current = []; setPending([]); setJoining(false)
    pageStateRef.current = null
    setHasMore(true); setIsInitial(true); setItems([])
    return run('reload')
  }, [clearRevealTimer, killRevealTweens, run])

  const loadMore = useCallback(() => run('append'), [run])

  const { sentinelRef } = useInfiniteScroll(loadMore, {
    // Re-entrant: the next fetch may fire during the reveal wait (pending present), but not while
    // a fetch is in flight or a join animation is running.
    enabled: enabled && hasMore && !loading && !joining,
    rootRef,
  })

  useEffect(() => { reload() }, [reload])
  useEffect(() => () => { clearRevealTimer(); killRevealTweens() }, [clearRevealTimer, killRevealTweens])

  const phase = joining ? 'joining' : loading ? 'loading' : pending.length ? 'awaiting' : 'idle'
  return { items, pending, loading, joining, phase, error, hasMore, reload, loadMore, sentinelRef, revealRegionRef, isInitial }
}
