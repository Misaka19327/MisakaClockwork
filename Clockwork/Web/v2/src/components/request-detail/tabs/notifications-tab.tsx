import { cn } from '@/lib/utils'
import type { NotificationEntry } from '@/types/clockwork'
import { DataTable, type DataTableColumn } from '../shared/data-table'

interface NotificationsTabProps {
  notifications: NotificationEntry[]
  className?: string
}

export function NotificationsTab({ notifications, className }: NotificationsTabProps) {
  const columns: DataTableColumn<NotificationEntry>[] = [
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      sortFn: (a, b) => (a.subject ?? '').localeCompare(b.subject ?? ''),
      render: (row) => (
        <span className="text-xs font-medium">{row.subject ?? row.title ?? '-'}</span>
      ),
    },
    {
      key: 'to',
      header: 'To',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {Array.isArray(row.to) ? row.to.join(', ') : row.to ?? '-'}
        </span>
      ),
    },
    {
      key: 'from',
      header: 'From',
      render: (row) => (
        <span className="text-xs text-muted-foreground">{row.from ?? '-'}</span>
      ),
      className: 'w-36',
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      sortFn: (a, b) => (a.type ?? '').localeCompare(b.type ?? ''),
      render: (row) =>
        row.type ? (
          <span className="inline-block rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
            {row.type}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
      className: 'w-36',
    },
  ]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
      </div>
      <div className="flex-1 overflow-auto">
        <DataTable
          columns={columns}
          data={notifications}
          emptyMessage="No notifications"
        />
      </div>
    </div>
  )
}
