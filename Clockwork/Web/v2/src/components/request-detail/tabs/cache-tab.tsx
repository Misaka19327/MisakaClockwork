import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatTime } from '@/utils/format'
import type { CacheQuery } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { StackTrace } from '../shared/stack-trace'

interface CacheTabProps {
  queries: CacheQuery[]
  className?: string
}

const typeColors: Record<string, string> = {
  read: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  write: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  hit: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  miss: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

function CacheQueryDetail({ query }: { query: CacheQuery }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Key</span>
        <span className="font-mono break-all">{query.key}</span>
        <span className="text-muted-foreground">Type</span>
        <span className={cn('inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold', typeColors[query.type] ?? '')}>
          {query.type}
        </span>
        <span className="text-muted-foreground">Connection</span>
        <span className="font-mono">{query.connection}</span>
        <span className="text-muted-foreground">Duration</span>
        <span className="font-mono">{formatDuration(query.duration)}</span>
        {query.expiration != null && (
          <>
            <span className="text-muted-foreground">Expiration</span>
            <span className="font-mono">{query.expiration}</span>
          </>
        )}
      </div>

      {query.value != null && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Value</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof query.value === 'string' ? query.value : JSON.stringify(query.value, null, 2)}
          </pre>
        </div>
      )}

      {query.trace && query.trace.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Stack Trace</h4>
          <StackTrace trace={query.trace} />
        </div>
      )}
    </div>
  )
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

export function CacheTab({ queries, className }: CacheTabProps) {
  const [expandedQuery, setExpandedQuery] = useState<CacheQuery | null>(null)

  const columns: DataTableColumn<CacheQuery>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortFn: (a, b) => a.type.localeCompare(b.type),
      render: (row) => (
        <span
          className={cn(
            'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
            typeColors[row.type] ?? 'bg-gray-100 text-gray-800',
          )}
        >
          {row.type}
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'key',
      header: 'Key',
      sortable: true,
      sortFn: (a, b) => a.key.localeCompare(b.key),
      render: (row) => <span className="font-mono text-xs">{row.key}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      render: (row) => (
        <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
          {row.value != null
            ? typeof row.value === 'string'
              ? truncate(row.value, 50)
              : JSON.stringify(row.value).slice(0, 50)
            : '-'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      sortFn: (a, b) => a.duration - b.duration,
      render: (row) => (
        <span className="tabular-nums text-xs">{formatDuration(row.duration)}</span>
      ),
      className: 'w-24',
    },
    {
      key: 'connection',
      header: 'Connection',
      sortable: true,
      sortFn: (a, b) => a.connection.localeCompare(b.connection),
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.connection}</span>
      ),
      className: 'w-28',
    },
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="shrink-0 border-b border-border/50 px-4 py-2 text-xs text-muted-foreground">
        {queries.length} cache operation{queries.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={queries}
          emptyMessage="No cache operations"
          onRowClick={(row) => setExpandedQuery(row === expandedQuery ? null : row)}
        />
        {expandedQuery && <CacheQueryDetail query={expandedQuery} />}
      </div>
    </div>
  )
}
