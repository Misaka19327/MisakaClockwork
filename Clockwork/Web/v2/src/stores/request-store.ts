import { create } from 'zustand'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getDefaultTimeRange(): { timeStart: string; timeEnd: string } {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  return {
    timeStart: toLocalDatetimeInput(oneHourAgo),
    timeEnd: toLocalDatetimeInput(now),
  }
}

interface RequestStore {
  requests: ClockworkRequest[]
  selectedId: string | null
  oldestId: string | null
  searchFilters: SearchFilters
  preserveLog: boolean
  showIncomingRequests: boolean

  selectRequest: (id: string | null) => void
  setRequests: (requests: ClockworkRequest[]) => void
  prependRequests: (requests: ClockworkRequest[]) => void
  appendRequests: (requests: ClockworkRequest[]) => void
  clearRequests: () => void
  setSearchFilters: (filters: SearchFilters) => void
  setPreserveLog: (value: boolean) => void
  setShowIncomingRequests: (value: boolean) => void
  getSelectedRequest: () => ClockworkRequest | undefined
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  requests: [],
  selectedId: null,
  oldestId: null,
  searchFilters: getDefaultTimeRange(),
  preserveLog: false,
  showIncomingRequests: true,

  selectRequest: (id) => set({ selectedId: id }),

  setRequests: (requests) => {
    const oldestId =
      requests.length > 0 ? requests[requests.length - 1].id : null
    set({ requests, oldestId })
  },

  prependRequests: (newRequests) => {
    if (newRequests.length === 0) return
    const { requests } = get()
    const updated = [...newRequests, ...requests]
    const oldestId = updated.length > 0 ? updated[updated.length - 1].id : null
    set({ requests: updated, oldestId })
  },

  appendRequests: (olderRequests) => {
    if (olderRequests.length === 0) return
    const { requests } = get()
    const updated = [...requests, ...olderRequests]
    const oldestId = updated[updated.length - 1].id
    set({ requests: updated, oldestId })
  },

  clearRequests: () =>
    set({ requests: [], selectedId: null, oldestId: null }),

  setSearchFilters: (filters) => set({ searchFilters: filters }),

  setPreserveLog: (value) => set({ preserveLog: value }),

  setShowIncomingRequests: (value) => set({ showIncomingRequests: value }),

  getSelectedRequest: () => {
    const { requests, selectedId } = get()
    if (!selectedId) return undefined
    return requests.find((r) => r.id === selectedId)
  },
}))
