import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatTime } from '@/utils/format'
import type { DatabaseQuery } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { SqlHighlighter } from '../shared/sql-highlighter'
import { StackTrace } from '../shared/stack-trace'

interface DatabaseTabProps {
  queries: DatabaseQuery[]
  slowThreshold?: number
  className?: string
}

function QueryDetail({ query, isSlow }: { query: DatabaseQuery; isSlow: boolean }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      {isSlow && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Slow Query
        </div>
      )}

      <SqlHighlighter sql={query.query} maxHeight={300} />

      {query.bindings && query.bindings.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Bindings</h4>
          <div className="flex flex-wrap gap-1">
            {query.bindings.map((binding, i) => (
              <span
                key={i}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {typeof binding === 'string' ? `"${binding}"` : String(binding)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {query.model && (
          <>
            <span className="text-muted-foreground">Model</span>
            <span className="font-mono">{query.model}</span>
          </>
        )}
        <span className="text-muted-foreground">Connection</span>
        <span className="font-mono">{query.connection}</span>
        <span className="text-muted-foreground">Duration</span>
        <span className="font-mono">{formatDuration(query.duration)}</span>
        {query.file && (
          <>
            <span className="text-muted-foreground">File</span>
            <span className="font-mono">
              {query.file}{query.line ? `:${query.line}` : ''}
            </span>
          </>
        )}
      </div>

      {query.trace && query.trace.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Stack Trace</h4>
          <StackTrace trace={query.trace} />
        </div>
      )}
    </div>
  )
}

export function DatabaseTab({ queries, slowThreshold = 100, className }: DatabaseTabProps) {
  const [expandedQuery, setExpandedQuery] = useState<DatabaseQuery | null>(null)
  const [searchText, setSearchText] = useState('')

  const filteredQueries = useMemo(() => {
    if (!searchText.trim()) return queries
    const lower = searchText.toLowerCase()
    return queries.filter(
      (q) =>
        q.query.toLowerCase().includes(lower) ||
        (q.model && q.model.toLowerCase().includes(lower)) ||
        q.connection.toLowerCase().includes(lower),
    )
  }, [queries, searchText])

  const columns: DataTableColumn<DatabaseQuery>[] = [
    {
      key: 'sql',
      header: 'Query',
      render: (row) => (
        <span className="line-clamp-1 font-mono text-xs">{row.shortQuery ?? row.query}</span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      sortFn: (a, b) => a.duration - b.duration,
      render: (row) => (
        <span
          className={cn(
            'tabular-nums',
            row.duration >= slowThreshold && 'font-semibold text-amber-600 dark:text-amber-400',
          )}
        >
          {formatDuration(row.duration)}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'model',
      header: 'Model',
      sortable: true,
      sortFn: (a, b) => (a.model ?? '').localeCompare(b.model ?? ''),
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.shortModel ?? row.model ?? '-'}
        </span>
      ),
      className: 'w-32',
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
      {/* Header with search */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {queries.length} quer{queries.length !== 1 ? 'ies' : 'y'}
          {filteredQueries.length !== queries.length && ` (showing ${filteredQueries.length})`}
        </span>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Filter queries..."
          className="ml-auto w-48 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={filteredQueries}
          emptyMessage="No database queries"
          onRowClick={(row) => setExpandedQuery(row === expandedQuery ? null : row)}
        />
        {expandedQuery && (
          <QueryDetail
            query={expandedQuery}
            isSlow={expandedQuery.duration >= slowThreshold}
          />
        )}
      </div>
    </div>
  )
}
