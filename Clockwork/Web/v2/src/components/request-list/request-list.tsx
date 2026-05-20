import { useRef, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { Loader2, ArrowDown } from 'lucide-react'
import { ClockworkClient } from '@/api/client'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'
import { RequestRow } from './request-row'
import { SearchBar } from './search-bar'
import { FilterTags } from './filter-tags'

interface RequestListProps {
  requests: ClockworkRequest[]
  selectedId: string | null
  onSelectRequest: (request: ClockworkRequest) => void
  onLoadOlder: () => void
  isLoading: boolean
  hasMore: boolean
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

export function RequestList({
  requests,
  selectedId,
  onSelectRequest,
  onLoadOlder,
  isLoading,
  hasMore,
  filters,
  onFiltersChange,
  className,
}: RequestListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const previousCountRef = useRef(requests.length)

  const virtualizer = useVirtualizer({
    count: hasMore ? requests.length + 1 : requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  })

  // Auto-scroll to bottom when new requests arrive
  useEffect(() => {
    if (requests.length > previousCountRef.current && parentRef.current) {
      const isNearBottom =
        parentRef.current.scrollHeight - parentRef.current.scrollTop - parentRef.current.clientHeight < 100

      if (isNearBottom) {
        virtualizer.scrollToIndex(requests.length - 1, { align: 'end' })
      }
    }
    previousCountRef.current = requests.length
  }, [requests.length, virtualizer])

  const isLastItem = useCallback(
    (index: number) => index === requests.length,
    [requests.length],
  )

  return (
    <div className={cn('flex h-full flex-col border-r border-border bg-sidebar-background', className)}>
      {/* Header */}
      <div className="shrink-0 space-y-1.5 border-b border-border p-2">
        <SearchBar filters={filters} onFiltersChange={onFiltersChange} />
        <FilterTags filters={filters} onFiltersChange={onFiltersChange} />
      </div>

      {/* Virtual list */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            if (isLastItem(virtualItem.index)) {
              return (
                <div
                  key="load-more"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="flex items-center justify-center py-2"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : hasMore ? (
                    <button
                      type="button"
                      onClick={onLoadOlder}
                      className="flex items-center gap-1.5 rounded px-3 py-1 text-sm text-primary hover:bg-muted"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      Load older requests
                    </button>
                  ) : null}
                </div>
              )
            }

            const request = requests[virtualItem.index]
            return (
              <div
                key={request.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <RequestRow
                  request={request}
                  isSelected={selectedId === request.id}
                  onClick={() => onSelectRequest(request)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer count */}
      <div className="shrink-0 border-t border-border px-3 py-1 text-xs text-muted-foreground">
        {requests.length} request{requests.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
