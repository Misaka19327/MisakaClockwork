import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { client } from './client'
import { useRequestStore } from '@/stores/request-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

export function useRequestList(filters: SearchFilters) {
  const setRequests = useRequestStore((s) => s.setRequests)
  const prependRequests = useRequestStore((s) => s.prependRequests)
  const requests = useRequestStore((s) => s.requests)
  const pollingEnabled = useSettingsStore((s) => s.pollingEnabled)
  const pollingInterval = useSettingsStore((s) => s.pollingInterval)
  const [initialized, setInitialized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingBusyRef = useRef(false)
  const latestStateRef = useRef<{ requests: ClockworkRequest[]; filters: SearchFilters }>({
    requests: [],
    filters,
  })

  // Stable key derived from filters content — avoids spurious re-runs on new object identity
  const filtersKey = JSON.stringify(filters)
  const intervalMs = useMemo(() => Number(pollingInterval), [pollingInterval])

  useEffect(() => {
    latestStateRef.current = { requests, filters }
  }, [requests, filters])

  // Bootstrap: load latest + one page of older. Re-runs when filters change.
  useEffect(() => {
    let cancelled = false

    // Clear stale data immediately when filters change
    setRequests([])
    setInitialized(false)

    async function bootstrap() {
      try {
        const latest = await client.fetchLatest(filters)
        if (cancelled || !latest) {
          if (!cancelled) setRequests([])
          if (!cancelled) setInitialized(true)
          return
        }

        let previous: ClockworkRequest[] = []
        try {
          previous = await client.fetchPrevious(latest.id, 50, filters)
        } catch {
          // ignore
        }

        if (cancelled) return
        const all = [latest, ...previous]
        setRequests(all)
        setInitialized(true)
      } catch (e) {
        console.error('[Clockwork] Failed to bootstrap request list:', e)
        if (!cancelled) setInitialized(true)
      }
    }

    bootstrap()

    return () => { cancelled = true }
  }, [filtersKey]) // Re-run on filter change

  // Poll for new requests on the configured cadence
  useEffect(() => {
    if (!initialized || !pollingEnabled || !intervalMs) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }

    intervalRef.current = setInterval(async () => {
      const { requests: currentRequests, filters: currentFilters } = latestStateRef.current
      if (currentRequests.length === 0 || pollingBusyRef.current) return
      pollingBusyRef.current = true
      try {
        const newest = currentRequests[0]
        const newReqs = await client.fetchNext(newest.id, 50, currentFilters)
        if (newReqs.length > 0) {
          prependRequests(newReqs)
        }
      } catch {
        // ignore polling errors
      } finally {
        pollingBusyRef.current = false
      }
    }, Math.max(1000, intervalMs))

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      pollingBusyRef.current = false
    }
  }, [initialized, filtersKey, prependRequests, pollingEnabled, intervalMs])

  return { isLoading: !initialized }
}

export function useLoadOlder(
  oldestId: string | null,
  filters: SearchFilters,
) {
  const appendRequests = useRequestStore((s) => s.appendRequests)

  return useCallback(async () => {
    if (!oldestId) return
    try {
      const older = await client.fetchPrevious(oldestId, 50, filters)
      if (older.length > 0) {
        appendRequests(older)
      }
    } catch {
      // ignore
    }
  }, [oldestId, filters, appendRequests])
}

export function useRequestDetail(id: string | null) {
  const queryKey = ['clockwork', 'requests', 'detail', id]

  const requests = useRequestStore((s) => s.requests)
  const cached = id ? requests.find((r) => r.id === id) : null

  const query = useQueryClient().getQueryData<ClockworkRequest>(queryKey)

  return {
    data: cached ?? query ?? null,
    isLoading: !cached && !!id,
  }
}

export function useExtendedRequest(id: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['clockwork', 'requests', 'extended', id]

  const data = queryClient.getQueryData<ClockworkRequest>(queryKey)
  const isLoading = !!id && !data

  useEffect(() => {
    if (!id) return
    client.fetchExtended(id).then((result) => {
      queryClient.setQueryData(queryKey, result)
    }).catch(() => {})
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data: data ?? null, isLoading }
}

export function useEventDetails(uuid: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['clockwork', 'events', 'details', uuid]

  const data = queryClient.getQueryData(queryKey)
  const isLoading = !!uuid && !data

  useEffect(() => {
    if (!uuid) return
    client.fetchEventDetails(uuid).then((result) => {
      queryClient.setQueryData(queryKey, result)
    }).catch(() => {})
  }, [uuid]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data: data ?? null, isLoading }
}
