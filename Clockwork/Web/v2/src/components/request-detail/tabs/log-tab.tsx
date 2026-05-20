import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/utils/format'
import type { LogMessage } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { StackTrace } from '../shared/stack-trace'

interface LogTabProps {
  messages: LogMessage[]
  className?: string
}

const levelStyles: Record<string, string> = {
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  ALERT: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  EMERGENCY: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  NOTICE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  DEBUG: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

function LogMessageDetail({ message }: { message: LogMessage }) {
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Level</span>
        <span className={cn('inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold', levelStyles[message.level_name] ?? '')}>
          {message.level_name}
        </span>
        <span className="text-muted-foreground">Time</span>
        <span className="font-mono tabular-nums">{formatTime(message.time)}</span>
        {message.file && (
          <>
            <span className="text-muted-foreground">File</span>
            <span className="font-mono">
              {message.file}{message.line ? `:${message.line}` : ''}
            </span>
          </>
        )}
      </div>

      <div>
        <h4 className="mb-1 text-xs font-medium text-muted-foreground">Message</h4>
        <pre className="whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">{message.message}</pre>
      </div>

      {message.exception && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Exception</h4>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {message.exception}
          </pre>
        </div>
      )}

      {message.trace && message.trace.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Stack Trace</h4>
          <StackTrace trace={message.trace} />
        </div>
      )}

      {message.context && Object.keys(message.context).length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Context</h4>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {JSON.stringify(message.context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function LogTab({ messages, className }: LogTabProps) {
  const [expandedMessage, setExpandedMessage] = useState<LogMessage | null>(null)

  const columns: DataTableColumn<LogMessage>[] = [
    {
      key: 'level',
      header: 'Level',
      sortable: true,
      sortFn: (a, b) => a.level - b.level,
      render: (row) => (
        <span
          className={cn(
            'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
            levelStyles[row.level_name] ?? 'bg-gray-100 text-gray-800',
          )}
        >
          {row.level_name}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <span className="line-clamp-2 font-mono text-xs">{row.message}</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      sortFn: (a, b) => a.time - b.time,
      render: (row) => (
        <span className="font-mono tabular-nums text-muted-foreground">
          {formatTime(row.time)}
        </span>
      ),
      className: 'w-24',
    },
  ]

  return (
    <div className={cn('divide-y divide-border', className)}>
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {messages.length} log message{messages.length !== 1 ? 's' : ''}
      </div>
      <DataTable
        columns={columns}
        data={messages}
        emptyMessage="No log messages"
        onRowClick={(row) => setExpandedMessage(row === expandedMessage ? null : row)}
      />
      {expandedMessage && <LogMessageDetail message={expandedMessage} />}
    </div>
  )
}
