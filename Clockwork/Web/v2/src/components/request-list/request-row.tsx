import { cn } from '@/lib/utils'
import { formatDuration, formatMemory, formatDateOnly, formatDateTime, formatTimeOnly, truncate } from '@/utils/format'
import type { ClockworkRequest } from '@/types/clockwork'
import { AlertTriangle } from 'lucide-react'

interface RequestRowProps {
  request: ClockworkRequest
  isSelected: boolean
  onClick: () => void
  compact?: boolean
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

function getTypeBadge(request: ClockworkRequest) {
  if (request.type === 'request') {
    const method = request.method?.toUpperCase() ?? ''
    if (method && methodStyles[method]) {
      return { label: method, style: methodStyles[method] }
    }
    return { label: 'REQ', style: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
  }
  return {
    label: typeBadgeLabels[request.type] ?? request.type.toUpperCase(),
    style: typeBadgeStyles[request.type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
}

function getStatusDisplay(request: ClockworkRequest) {
  if (request.type === 'request') {
    if (request.responseStatus != null) {
      const group = String(Math.floor(request.responseStatus / 100))
      return {
        text: String(request.responseStatus),
        style: statusStyles[group] ?? 'text-muted-foreground',
        hasError: request.responseStatus >= 500,
      }
    }
    return null
  }

  if (request.type === 'command') {
    if (request.commandExitCode != null) {
      return {
        text: String(request.commandExitCode),
        style: request.commandExitCode === 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400',
        hasError: request.commandExitCode !== 0,
      }
    }
    return null
  }

  if (request.type === 'queue-job') {
    if (request.jobStatus) {
      const isFailed = request.jobStatus === 'failed'
      return {
        text: request.jobStatus,
        style: isFailed
          ? 'text-red-600 dark:text-red-400'
          : 'text-emerald-600 dark:text-emerald-400',
        hasError: isFailed,
      }
    }
    return null
  }

  if (request.type === 'test') {
    if (request.testStatus) {
      const isFailed = request.testStatus === 'failed' || request.testStatus === 'error'
      return {
        text: request.testStatus,
        style: isFailed
          ? 'text-red-600 dark:text-red-400'
          : 'text-emerald-600 dark:text-emerald-400',
        hasError: isFailed,
      }
    }
    return null
  }

  return null
}

function getHandlerName(request: ClockworkRequest): string {
  if (request.controller) return truncate(request.controller.split('@')[0].split('\\').pop() ?? request.controller, 30)
  if (request.commandName) return truncate(request.commandName, 30)
  if (request.jobName) return truncate(request.jobName, 30)
  if (request.testName) return truncate(request.testName, 30)
  return request.id
}

function getPath(request: ClockworkRequest): string {
  if (request.type === 'request') {
    return request.uri ?? request.url ?? ''
  }
  if (request.type === 'command') {
    if (request.commandName && request.commandArguments) {
      const args = Object.entries(request.commandArguments)
        .map(([k, v]) => `--${k}=${String(v)}`)
        .join(' ')
      return `${request.commandName} ${args}`
    }
    return request.commandName ?? ''
  }
  if (request.type === 'queue-job') {
    return request.jobDescription ?? request.jobName ?? ''
  }
  if (request.type === 'test') {
    return request.testName ?? ''
  }
  return ''
}

function hasException(request: ClockworkRequest): boolean {
  if (request.responseStatus != null && request.responseStatus >= 500) return true
  if (request.log?.some((l) => l.exception)) return true
  if (request.type === 'command' && request.commandExitCode != null && request.commandExitCode !== 0) return true
  return false
}

export function RequestRow({ request, isSelected, onClick, compact = false, className }: RequestRowProps) {
  const typeBadge = getTypeBadge(request)
  const status = getStatusDisplay(request)
  const handler = getHandlerName(request)
  const path = getPath(request)
  const hasError = hasException(request)
  const isHttpRequest = request.type === 'request'
  const compactTitle = path || handler || request.id

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex min-h-[52px] min-w-0 cursor-pointer items-center gap-2 overflow-hidden border-b border-border/50 px-2 py-2 text-sm transition-colors last:border-0',
          isSelected
            ? 'bg-primary/10 border-l-2 border-l-primary'
            : 'hover:bg-muted/50 border-l-2 border-l-transparent',
          className,
        )}
      >
        <div className="flex w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'shrink-0 rounded px-1 py-0.5 text-[10px] font-bold',
                typeBadge.style,
              )}
            >
              {typeBadge.label}
            </span>

            {status && (
              <span
                className={cn(
                  'shrink-0 text-xs font-semibold tabular-nums',
                  status.style,
                )}
              >
                {status.text}
              </span>
            )}

            {hasError && !status?.hasError && (
              <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
            )}

            <span
              className="min-w-0 truncate text-[10px] text-muted-foreground"
            >
              {handler}
            </span>
          </div>

          <span className="truncate pr-1 text-xs text-foreground">
            {compactTitle}
          </span>
        </div>

        <span
          className="w-[56px] shrink-0 text-[10px] tabular-nums text-muted-foreground text-right leading-tight"
        >
          <span className="block">{formatDateOnly(request.time)}</span>
          <span className="block">{formatTimeOnly(request.time)}</span>
        </span>
      </div>
    )
  }

  // Expanded mode - table row with all columns
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-1.5 text-sm transition-colors last:border-0',
        isSelected
          ? 'bg-primary/10 border-l-2 border-l-primary'
          : 'hover:bg-muted/50 border-l-2 border-l-transparent',
        className,
      )}
    >
      {/* Type */}
      <span
        className={cn(
          'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold w-16 text-center',
          typeBadge.style,
        )}
      >
        {typeBadge.label}
      </span>

      {/* Status */}
      <span className="shrink-0 w-12 text-right">
        {status ? (
          <span className={cn('text-xs font-semibold tabular-nums', status.style)}>
            {status.text}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
        {hasError && !status?.hasError && (
          <AlertTriangle className="inline ml-0.5 h-3 w-3 text-red-500" />
        )}
      </span>

      {/* Duration */}
      <span className="shrink-0 w-20 text-xs tabular-nums text-muted-foreground">
        {request.responseDuration != null ? formatDuration(request.responseDuration) : '-'}
      </span>

      {/* Memory */}
      <span className="shrink-0 w-16 text-xs tabular-nums text-muted-foreground">
        {request.memoryUsage != null ? formatMemory(request.memoryUsage) : '-'}
      </span>

      {/* Time */}
      <span className="shrink-0 w-36 text-xs tabular-nums text-muted-foreground">
        {formatDateTime(request.time)}
      </span>

      {/* Path */}
      <span className="flex-1 truncate text-xs text-foreground/80" title={path}>
        {path || '-'}
      </span>

      {/* Method (HTTP only) */}
      <span className="shrink-0 w-16 text-left">
        {isHttpRequest && request.method ? (
          <span
            className={cn(
              'inline-block rounded px-1.5 py-0.5 text-[10px] font-bold',
              methodStyles[request.method.toUpperCase()] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            )}
          >
            {request.method.toUpperCase()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </span>

      {/* Handler */}
      <span className="shrink-0 w-60 truncate text-xs font-medium text-foreground" title={handler}>
        {handler}
      </span>
    </div>
  )
}
