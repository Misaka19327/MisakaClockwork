import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { client } from './client'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

const STALE_TIME = 30_000
const DETAIL_STALE_TIME = 60_000

function filtersKey(filters: SearchFilters): string {
  const parts: string[] = []
  const keys = Object.keys(filters).sort() as (keyof SearchFilters)[]
  for (const key of keys) {
    const values = filters[key]
    if (values && values.length > 0) {
      parts.push(`${key}:${values.join(',')}`)
    }
  }
  return parts.join('|')
}

export function useRequestList(filters: SearchFilters) {
  const queryClient = useQueryClient()

  return useQuery<ClockworkRequest[]>({
    queryKey: ['clockwork', 'requests', 'list', filtersKey(filters)],
    queryFn: async () => {
      const latest = await client.fetchLatest()
      if (!latest) {
        return []
      }

      // Check the cache for existing requests so we can merge
      const cached = queryClient.getQueryData<ClockworkRequest[]>([
        'clockwork',
        'requests',
        'list',
        filtersKey(filters),
      ])

      if (cached && cached.length > 0) {
        // Avoid duplicating the latest request if it's already the first item
        if (cached[0].id === latest.id) {
          return cached
        }
        // Prepend the new request
        return [latest, ...cached]
      }

      // Bootstrap: fetch a page of previous requests from the latest
      let previous: ClockworkRequest[] = []
      try {
        previous = await client.fetchPrevious(latest.id, 50, filters)
      } catch {
        // ignore — return just the latest
      }

      return [latest, ...previous]
    },
    refetchInterval: 1000,
    staleTime: STALE_TIME,
    structuralSharing: (oldData: unknown, newData: unknown) => {
      const old = oldData as ClockworkRequest[] | undefined
      const newer = newData as ClockworkRequest[]
      if (!old) return newer
      // Reuse references for unchanged requests to avoid unnecessary re-renders
      let changed = false
      const merged = newer.map((newReq) => {
        const existing = old.find((o) => o.id === newReq.id)
        if (existing && existing === newReq) return existing
        changed = true
        return newReq
      })
      return changed ? merged : oldData
    },
  })
}

export function useLoadOlder(
  oldestId: string | null,
  filters: SearchFilters,
) {
  const queryClient = useQueryClient()
  const queryKey = ['clockwork', 'requests', 'list', filtersKey(filters)]

  return async function loadOlder(): Promise<void> {
    if (!oldestId) return

    const older = await client.fetchPrevious(oldestId, 50, filters)
    if (older.length === 0) return

    queryClient.setQueryData<ClockworkRequest[]>(queryKey, (current) => {
      if (!current) return older
      // Deduplicate by id
      const existingIds = new Set(current.map((r) => r.id))
      const newItems = older.filter((r) => !existingIds.has(r.id))
      if (newItems.length === 0) return current
      return [...current, ...newItems]
    })
  }
}

export function useRequestDetail(id: string | null) {
  return useQuery<ClockworkRequest>({
    queryKey: ['clockwork', 'requests', 'detail', id],
    queryFn: () => client.fetchRequest(id!),
    enabled: id !== null,
    staleTime: DETAIL_STALE_TIME,
    retry: (failureCount, error) => {
      if ((error as Error).message === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })
}

export function useExtendedRequest(id: string | null) {
  return useQuery<ClockworkRequest>({
    queryKey: ['clockwork', 'requests', 'extended', id],
    queryFn: () => client.fetchExtended(id!),
    enabled: id !== null,
    staleTime: DETAIL_STALE_TIME,
    retry: (failureCount, error) => {
      if ((error as Error).message === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })
}

export function useEventDetails(uuid: string | null) {
  return useQuery({
    queryKey: ['clockwork', 'events', 'details', uuid],
    queryFn: () => client.fetchEventDetails(uuid!),
    enabled: uuid !== null,
    staleTime: DETAIL_STALE_TIME,
    retry: (failureCount, error) => {
      if ((error as Error).message === 'NOT_FOUND') return false
      return failureCount < 2
    },
  })
}
