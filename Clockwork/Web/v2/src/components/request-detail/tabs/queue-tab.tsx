import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { QueueJob } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { KeyValueTable } from '../shared/key-value-table'

interface QueueTabProps {
  jobs: QueueJob[]
  className?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  released: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
}

function QueueJobDetail({ job }: { job: QueueJob }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Name</span>
        <span className="font-mono">{job.name}</span>
        {job.queue && (
          <>
            <span className="text-muted-foreground">Queue</span>
            <span className="font-mono">{job.queue}</span>
          </>
        )}
        {job.connection && (
          <>
            <span className="text-muted-foreground">Connection</span>
            <span className="font-mono">{job.connection}</span>
          </>
        )}
        {job.status && (
          <>
            <span className="text-muted-foreground">Status</span>
            <span className={cn('inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold', statusColors[job.status] ?? '')}>
              {job.status}
            </span>
          </>
        )}
      </div>

      {job.description && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Description</h4>
          <p className="text-xs text-muted-foreground">{job.description}</p>
        </div>
      )}

      {job.data != null && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Data</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof job.data === 'string' ? job.data : JSON.stringify(job.data, null, 2)}
          </pre>
        </div>
      )}

      {job.options && Object.keys(job.options).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Options</h4>
          <div className="rounded border border-border">
            <KeyValueTable data={job.options} />
          </div>
        </div>
      )}
    </div>
  )
}

export function QueueTab({ jobs, className }: QueueTabProps) {
  const [expandedJob, setExpandedJob] = useState<QueueJob | null>(null)

  const columns: DataTableColumn<QueueJob>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (row) => <span className="font-mono text-xs">{row.name}</span>,
    },
    {
      key: 'queue',
      header: 'Queue',
      sortable: true,
      sortFn: (a, b) => (a.queue ?? '').localeCompare(b.queue ?? ''),
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.queue ?? '-'}</span>
      ),
      className: 'w-28',
    },
    {
      key: 'connection',
      header: 'Connection',
      sortable: true,
      sortFn: (a, b) => (a.connection ?? '').localeCompare(b.connection ?? ''),
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.connection ?? '-'}</span>
      ),
      className: 'w-28',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortFn: (a, b) => (a.status ?? '').localeCompare(b.status ?? ''),
      render: (row) =>
        row.status ? (
          <span
            className={cn(
              'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
              statusColors[row.status] ?? '',
            )}
          >
            {row.status}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
      className: 'w-24',
    },
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {jobs.length} queue job{jobs.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={jobs}
          emptyMessage="No queue jobs"
          onRowClick={(row) => setExpandedJob(row === expandedJob ? null : row)}
        />
        {expandedJob && <QueueJobDetail job={expandedJob} />}
      </div>
    </div>
  )
}
