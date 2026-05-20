import { create } from 'zustand'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

interface RequestStore {
  requests: ClockworkRequest[]
  selectedId: string | null
  oldestId: string | null
  searchFilters: SearchFilters
  preserveLog: boolean
  collapsed: boolean
  showIncomingRequests: boolean

  selectRequest: (id: string | null) => void
  setRequests: (requests: ClockworkRequest[]) => void
  prependRequests: (requests: ClockworkRequest[]) => void
  appendRequests: (requests: ClockworkRequest[]) => void
  clearRequests: () => void
  setSearchFilters: (filters: SearchFilters) => void
  setPreserveLog: (value: boolean) => void
  setCollapsed: (value: boolean) => void
  setShowIncomingRequests: (value: boolean) => void
  getSelectedRequest: () => ClockworkRequest | undefined
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  requests: [],
  selectedId: null,
  oldestId: null,
  searchFilters: {},
  preserveLog: false,
  collapsed: false,
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

  setCollapsed: (value) => set({ collapsed: value }),

  setShowIncomingRequests: (value) => set({ showIncomingRequests: value }),

  getSelectedRequest: () => {
    const { requests, selectedId } = get()
    if (!selectedId) return undefined
    return requests.find((r) => r.id === selectedId)
  },
}))
