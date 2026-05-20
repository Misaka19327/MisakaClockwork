import { cn } from '@/lib/utils'

interface ProfilerTabProps {
  xdebug: any
  className?: string
}

export function ProfilerTab({ xdebug, className }: ProfilerTabProps) {
  if (!xdebug) {
    return (
      <div className={cn('py-12 text-center text-sm text-muted-foreground', className)}>
        No profiler data available
      </div>
    )
  }

  // Xdebug profiler data can come in various formats
  // Display whatever we have
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Xdebug Profiler
      </h3>

      {typeof xdebug === 'string' ? (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/50 p-3 text-xs">
          {xdebug}
        </pre>
      ) : typeof xdebug === 'object' ? (
        <div className="space-y-3">
          {Object.entries(xdebug).map(([key, value]) => (
            <div key={key}>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">{key}</h4>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/50 p-2 text-xs">
                {typeof value === 'string'
                  ? value
                  : JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/50 p-3 text-xs">
          {JSON.stringify(xdebug, null, 2)}
        </pre>
      )}
    </div>
  )
}
