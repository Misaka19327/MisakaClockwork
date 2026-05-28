import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatTime } from '@/utils/format'
import type { EventEntry } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'
import { StackTrace } from '../shared/stack-trace'

interface EventsTabProps {
  events: EventEntry[]
  className?: string
}

function EventDetail({ event }: { event: EventEntry }) {
  return (
    <div className="space-y-3 border-t border-border p-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Event</span>
        <span className="font-mono">{event.event}</span>
        {event.duration != null && (
          <>
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono">{formatDuration(event.duration)}</span>
          </>
        )}
        {event.file && (
          <>
            <span className="text-muted-foreground">File</span>
            <span className="font-mono">
              {event.file}{event.line ? `:${event.line}` : ''}
            </span>
          </>
        )}
      </div>

      {event.data != null && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Data</h4>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">
            {typeof event.data === 'string' ? event.data : JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
      )}

      {event.listeners && event.listeners.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Listeners</h4>
          <div className="space-y-0.5">
            {event.listeners.map((listener, i) => (
              <div key={i} className="font-mono text-xs text-muted-foreground">
                {typeof listener === 'string' ? listener : JSON.stringify(listener)}
              </div>
            ))}
          </div>
        </div>
      )}

      {event.trace && event.trace.length > 0 && (
        <div>
          <h4 className="mb-1 text-xs font-medium text-muted-foreground">Stack Trace</h4>
          <StackTrace trace={event.trace} />
        </div>
      )}
    </div>
  )
}

export function EventsTab({ events, className }: EventsTabProps) {
  const [expandedEvent, setExpandedEvent] = useState<EventEntry | null>(null)

  const columns: DataTableColumn<EventEntry>[] = [
    {
      key: 'event',
      header: 'Event',
      sortable: true,
      sortFn: (a, b) => a.event.localeCompare(b.event),
      render: (row) => <span className="font-mono text-xs">{row.event}</span>,
    },
    {
      key: 'listeners',
      header: 'Listeners',
      render: (row) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.listeners?.length ?? 0}
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
      <div className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {events.length} event{events.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={events}
          emptyMessage="No events"
          onRowClick={(row) => setExpandedEvent(row === expandedEvent ? null : row)}
        />
        {expandedEvent && <EventDetail event={expandedEvent} />}
      </div>
    </div>
  )
}
