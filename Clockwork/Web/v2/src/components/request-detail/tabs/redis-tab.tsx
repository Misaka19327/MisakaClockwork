import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import type { RedisCommand } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'

interface RedisTabProps {
  commands: RedisCommand[]
  className?: string
}

function RedisCommandDetail({ command }: { command: RedisCommand }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Command</span>
        <span className="font-mono">{command.command}</span>
        {command.connection && (
          <>
            <span className="text-muted-foreground">Connection</span>
            <span className="font-mono">{command.connection}</span>
          </>
        )}
        {command.duration != null && (
          <>
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono">{formatDuration(command.duration)}</span>
          </>
        )}
        {command.key && (
          <>
            <span className="text-muted-foreground">Key</span>
            <span className="font-mono">{command.key}</span>
          </>
        )}
      </div>

      {command.parameters && command.parameters.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Parameters</h4>
          <div className="flex flex-wrap gap-1">
            {command.parameters.map((param, i) => (
              <span
                key={i}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {typeof param === 'string' ? `"${param}"` : String(param)}
              </span>
            ))}
          </div>
        </div>
      )}

      {command.result != null && command.resultAvailable && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Result</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof command.result === 'string' ? command.result : JSON.stringify(command.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function RedisTab({ commands, className }: RedisTabProps) {
  const [expandedCommand, setExpandedCommand] = useState<RedisCommand | null>(null)

  const columns: DataTableColumn<RedisCommand>[] = [
    {
      key: 'command',
      header: 'Command',
      sortable: true,
      sortFn: (a, b) => a.command.localeCompare(b.command),
      render: (row) => (
        <span className="inline-block rounded bg-violet-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
          {row.command}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'parameters',
      header: 'Parameters',
      render: (row) => (
        <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
          {row.parameters
            ? row.parameters.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')
            : '-'}
        </span>
      ),
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
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {commands.length} Redis command{commands.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={commands}
          emptyMessage="No Redis commands"
          onRowClick={(row) => setExpandedCommand(row === expandedCommand ? null : row)}
        />
        {expandedCommand && <RedisCommandDetail command={expandedCommand} />}
      </div>
    </div>
  )
}
