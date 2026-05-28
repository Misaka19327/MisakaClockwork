import { useRef, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { Loader2, ArrowDown } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'
import { RequestRow } from './request-row'
import { FilterBar } from './filter-bar'
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
  compact?: boolean
  expanded?: boolean
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
  compact = false,
  expanded = false,
  className,
}: RequestListProps) {
  const { t } = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)
  const previousCountRef = useRef(requests.length)

  const rowHeight = compact ? 40 : 36

  const virtualizer = useVirtualizer({
    count: hasMore ? requests.length + 1 : requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  })

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
    <div className={cn('flex h-full w-full min-w-0 flex-col bg-sidebar-background', !expanded && 'border-r border-border', className)}>
      {/* Header: Filter area */}
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-border p-2">
        {!compact ? (
          <FilterBar filters={filters} onFiltersChange={onFiltersChange} />
        ) : (
          <FilterTags filters={filters} compact />
        )}
      </div>

      {/* Column headers (expanded mode only) */}
      {!compact && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="w-16 text-center">{t('column.type')}</span>
          <span className="w-12 text-right">{t('column.status')}</span>
          <span className="w-20">{t('column.duration')}</span>
          <span className="w-16">{t('column.memory')}</span>
          <span className="w-36">{t('column.time')}</span>
          <span className="flex-1">{t('column.path')}</span>
          <span className="w-16">{t('column.method')}</span>
          <span className="w-60">{t('column.handler')}</span>
        </div>
      )}

      {/* Virtual list */}
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
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
                      {t('footer.loading')}
                    </div>
                  ) : hasMore ? (
                    <button
                      type="button"
                      onClick={onLoadOlder}
                      className="flex items-center gap-1.5 rounded px-3 py-1 text-sm text-primary hover:bg-muted"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      {t('footer.loadOlder')}
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
                  compact={compact}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer count */}
      <div className="shrink-0 border-t border-border px-3 py-1 text-xs text-muted-foreground">
        {t('footer.requests', { count: requests.length }).replace('{count}', String(requests.length))}
      </div>
    </div>
  )
}
