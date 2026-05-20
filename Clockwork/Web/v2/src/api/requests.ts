import { useEffect, useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { client } from './client'
import { useRequestStore } from '@/stores/request-store'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

export function useRequestList(filters: SearchFilters) {
  const setRequests = useRequestStore((s) => s.setRequests)
  const prependRequests = useRequestStore((s) => s.prependRequests)
  const requests = useRequestStore((s) => s.requests)
  const searchFilters = useRequestStore((s) => s.searchFilters)
  const [initialized, setInitialized] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Bootstrap: load latest + one page of older
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const latest = await client.fetchLatest()
        if (cancelled || !latest) {
          if (!cancelled) setRequests([])
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
      }
    }

    bootstrap()

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new requests every 1 second
  useEffect(() => {
    if (!initialized) return

    intervalRef.current = setInterval(async () => {
      if (requests.length === 0) return
      try {
        const newest = requests[0]
        const newReqs = await client.fetchNext(newest.id, 50, searchFilters)
        if (newReqs.length > 0) {
          prependRequests(newReqs)
        }
      } catch {
        // ignore polling errors
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [initialized, requests.length, searchFilters, prependRequests])

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
