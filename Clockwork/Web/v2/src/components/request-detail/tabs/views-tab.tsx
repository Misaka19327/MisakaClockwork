import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import type { ViewData } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { KeyValueTable } from '../shared/key-value-table'

interface ViewsTabProps {
  views: ViewData[]
  className?: string
}

export function ViewsTab({ views, className }: ViewsTabProps) {
  const columns: DataTableColumn<ViewData>[] = [
    {
      key: 'view',
      header: 'View',
      sortable: true,
      sortFn: (a, b) => a.view.localeCompare(b.view),
      render: (row) => <span className="font-mono text-xs">{row.view}</span>,
    },
    {
      key: 'data',
      header: 'Data',
      render: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.data ? Object.keys(row.data).length : 0} keys
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      sortFn: (a, b) => (a.duration ?? 0) - (b.duration ?? 0),
      render: (row) => (
        <span className="tabular-nums text-xs">
          {row.duration != null ? formatDuration(row.duration) : '-'}
        </span>
      ),
      className: 'w-24',
    },
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {views.length} view{views.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={views}
          emptyMessage="No views rendered"
        />
      </div>
    </div>
  )
}
