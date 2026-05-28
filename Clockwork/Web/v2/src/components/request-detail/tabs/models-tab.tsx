import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/utils/format'
import type { ModelAction } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { KeyValueTable } from '../shared/key-value-table'
import { StackTrace } from '../shared/stack-trace'

interface ModelsTabProps {
  actions: ModelAction[]
  retrieved?: Record<string, number>
  created?: Record<string, number>
  updated?: Record<string, number>
  deleted?: Record<string, number>
  className?: string
}

const actionColors: Record<string, string> = {
  retrieved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  created: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  updated: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  deleted: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

function ModelActionDetail({ action }: { action: ModelAction }) {
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Model</span>
        <span className="font-mono">{action.model}</span>
        <span className="text-muted-foreground">Action</span>
        <span className={cn('inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold', actionColors[action.action] ?? '')}>
          {action.action}
        </span>
        {action.key != null && (
          <>
            <span className="text-muted-foreground">Key</span>
            <span className="font-mono">{String(action.key)}</span>
          </>
        )}
        {action.connection && (
          <>
            <span className="text-muted-foreground">Connection</span>
            <span className="font-mono">{action.connection}</span>
          </>
        )}
      </div>

      {action.attributes && Object.keys(action.attributes).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Attributes</h4>
          <div className="rounded border border-border">
            <KeyValueTable data={action.attributes} />
          </div>
        </div>
      )}

      {action.changes && Object.keys(action.changes).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Changes</h4>
          <div className="rounded border border-border">
            <KeyValueTable data={action.changes} />
          </div>
        </div>
      )}

      {action.trace && action.trace.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Stack Trace</h4>
          <StackTrace trace={action.trace} />
        </div>
      )}
    </div>
  )
}

function CountsTable({
  retrieved,
  created,
  updated,
  deleted,
}: {
  retrieved?: Record<string, number>
  created?: Record<string, number>
  updated?: Record<string, number>
  deleted?: Record<string, number>
}) {
  const allModels = new Set<string>()
  if (retrieved) Object.keys(retrieved).forEach(allModels.add, allModels)
  if (created) Object.keys(created).forEach(allModels.add, allModels)
  if (updated) Object.keys(updated).forEach(allModels.add, allModels)
  if (deleted) Object.keys(deleted).forEach(allModels.add, allModels)

  if (allModels.size === 0) {
    return <div className="px-3 py-6 text-center text-sm text-muted-foreground">No model counts</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="px-3 py-2 font-medium text-muted-foreground">Model</th>
            <th className="px-3 py-2 font-medium text-muted-foreground text-right">Retrieved</th>
            <th className="px-3 py-2 font-medium text-muted-foreground text-right">Created</th>
            <th className="px-3 py-2 font-medium text-muted-foreground text-right">Updated</th>
            <th className="px-3 py-2 font-medium text-muted-foreground text-right">Deleted</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(allModels).sort().map((model) => (
            <tr key={model} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-1.5 font-mono text-xs">{model}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{retrieved?.[model] ?? 0}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{created?.[model] ?? 0}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{updated?.[model] ?? 0}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{deleted?.[model] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ModelsTab({ actions, retrieved, created, updated, deleted, className }: ModelsTabProps) {
  const [subTab, setSubTab] = useState<'actions' | 'counts'>('actions')
  const [expandedAction, setExpandedAction] = useState<ModelAction | null>(null)

  const columns: DataTableColumn<ModelAction>[] = [
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      sortFn: (a, b) => a.action.localeCompare(b.action),
      render: (row) => (
        <span
          className={cn(
            'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
            actionColors[row.action] ?? '',
          )}
        >
          {row.action}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'model',
      header: 'Model',
      sortable: true,
      sortFn: (a, b) => a.model.localeCompare(b.model),
      render: (row) => <span className="font-mono text-xs">{row.model.split('\\').pop() ?? row.model}</span>,
    },
    {
      key: 'key',
      header: 'Key',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.key != null ? String(row.key) : '-'}
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      sortFn: (a, b) => a.time - b.time,
      render: (row) => (
        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {formatTime(row.time)}
        </span>
      ),
      className: 'w-24',
    },
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Sub-tabs */}
      <div className="flex shrink-0 border-b border-border/50">
        <button
          type="button"
          onClick={() => setSubTab('actions')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            subTab === 'actions'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Actions
          {actions.length > 0 && (
            <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] tabular-nums">
              {actions.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSubTab('counts')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            subTab === 'counts'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Counts
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {subTab === 'actions' ? (
          <div>
            <DataTable
              columns={columns}
              data={actions}
              emptyMessage="No model actions recorded"
              onRowClick={(row) => setExpandedAction(row === expandedAction ? null : row)}
            />
            {expandedAction && <ModelActionDetail action={expandedAction} />}
          </div>
        ) : (
          <CountsTable retrieved={retrieved} created={created} updated={updated} deleted={deleted} />
        )}
      </div>
    </div>
  )
}
