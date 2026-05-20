import { cn } from '@/lib/utils'
import { formatDuration, formatTime, truncate } from '@/utils/format'
import type { ClockworkRequest } from '@/types/clockwork'

interface RequestRowProps {
  request: ClockworkRequest
  isSelected: boolean
  onClick: () => void
  className?: string
}

const methodStyles: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const statusStyles: Record<string, string> = {
  '2': 'text-emerald-600 dark:text-emerald-400',
  '3': 'text-blue-600 dark:text-blue-400',
  '4': 'text-amber-600 dark:text-amber-400',
  '5': 'text-red-600 dark:text-red-400',
}

const typeBadgeStyles: Record<string, string> = {
  command: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'queue-job': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  test: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
}

const typeBadgeLabels: Record<string, string> = {
  command: 'CMD',
  'queue-job': 'QUEUE',
  test: 'TEST',
}

export function RequestRow({ request, isSelected, onClick, className }: RequestRowProps) {
  const isHttpRequest = request.type === 'request'
  const method = request.method?.toUpperCase() ?? ''

  const displayLabel = (() => {
    if (request.controller) return truncate(request.controller.split('@')[0].split('\\').pop() ?? request.controller, 30)
    if (request.uri) return truncate(request.uri, 40)
    if (request.commandName) return truncate(request.commandName, 30)
    if (request.jobName) return truncate(request.jobName, 30)
    if (request.testName) return truncate(request.testName, 30)
    return request.id
  })()

  const statusGroup = request.responseStatus
    ? String(Math.floor(request.responseStatus / 100))
    : ''

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-2 border-b border-border/50 px-3 py-1.5 text-sm transition-colors last:border-0',
        isSelected
          ? 'bg-primary/10 border-l-2 border-l-primary'
          : 'hover:bg-muted/50 border-l-2 border-l-transparent',
        className,
      )}
    >
      {/* Type badge for non-HTTP requests */}
      {request.type !== 'request' && (
        <span
          className={cn(
            'shrink-0 rounded px-1 py-0.5 text-[10px] font-bold',
            typeBadgeStyles[request.type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          )}
        >
          {typeBadgeLabels[request.type] ?? request.type.toUpperCase()}
        </span>
      )}

      {/* Method badge */}
      {method && isHttpRequest && (
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
            methodStyles[method] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          )}
        >
          {method}
        </span>
      )}

      {/* Label */}
      <span className="flex-1 truncate text-foreground">{displayLabel}</span>

      {/* Status */}
      {request.responseStatus != null && (
        <span
          className={cn(
            'shrink-0 text-xs font-semibold tabular-nums',
            statusStyles[statusGroup] ?? 'text-muted-foreground',
          )}
        >
          {request.responseStatus}
        </span>
      )}

      {/* Duration */}
      {request.responseDuration != null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatDuration(request.responseDuration)}
        </span>
      )}

      {/* Time */}
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatTime(request.time)}
      </span>
    </div>
  )
}
