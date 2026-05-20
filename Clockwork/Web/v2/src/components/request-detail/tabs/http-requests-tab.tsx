import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import type { HttpRequestEntry } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { KeyValueTable } from '../shared/key-value-table'
import { StatusBadge } from '../shared/status-badge'
import { MethodBadge } from '../shared/method-badge'

interface HttpRequestTabProps {
  requests: HttpRequestEntry[]
  className?: string
}

function HttpRequestDetail({ request }: { request: HttpRequestEntry }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Method</span>
        <MethodBadge method={request.method} />
        <span className="text-muted-foreground">URL</span>
        <span className="font-mono break-all">{request.url}</span>
        {request.response?.status != null && (
          <>
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={request.response.status} />
          </>
        )}
        {request.duration != null && (
          <>
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono">{formatDuration(request.duration)}</span>
          </>
        )}
      </div>

      {request.request?.headers && Object.keys(request.request.headers).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Request Headers</h4>
          <div className="rounded border border-border">
            <KeyValueTable data={request.request.headers} />
          </div>
        </div>
      )}

      {request.request?.body != null && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Request Body</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof request.request.body === 'string'
              ? request.request.body
              : JSON.stringify(request.request.body, null, 2)}
          </pre>
        </div>
      )}

      {request.response?.headers && Object.keys(request.response.headers).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Response Headers</h4>
          <div className="rounded border border-border">
            <KeyValueTable data={request.response.headers} />
          </div>
        </div>
      )}

      {request.response?.body != null && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Response Body</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof request.response.body === 'string'
              ? request.response.body
              : JSON.stringify(request.response.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function HttpRequestTab({ requests, className }: HttpRequestTabProps) {
  const [expandedRequest, setExpandedRequest] = useState<HttpRequestEntry | null>(null)

  const columns: DataTableColumn<HttpRequestEntry>[] = [
    {
      key: 'method',
      header: 'Method',
      sortable: true,
      sortFn: (a, b) => a.method.localeCompare(b.method),
      render: (row) => <MethodBadge method={row.method} />,
      className: 'w-20',
    },
    {
      key: 'url',
      header: 'URL',
      sortable: true,
      sortFn: (a, b) => a.url.localeCompare(b.url),
      render: (row) => <span className="line-clamp-1 font-mono text-xs">{row.url}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortFn: (a, b) => (a.response?.status ?? 0) - (b.response?.status ?? 0),
      render: (row) =>
        row.response?.status != null ? (
          <StatusBadge status={row.response.status} />
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
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
        {requests.length} HTTP request{requests.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={requests}
          emptyMessage="No outgoing HTTP requests"
          onRowClick={(row) => setExpandedRequest(row === expandedRequest ? null : row)}
        />
        {expandedRequest && <HttpRequestDetail request={expandedRequest} />}
      </div>
    </div>
  )
}
