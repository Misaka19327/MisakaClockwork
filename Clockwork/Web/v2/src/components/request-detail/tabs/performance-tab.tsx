import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatMemory } from '@/utils/format'
import { Clock, Cpu, Database, HardDrive, Gauge, Activity } from 'lucide-react'
import type { ClockworkRequest } from '@/types/clockwork'
import { CounterCard } from '../shared/counter-card'
import { TimelineChart } from '../shared/timeline-chart'

interface PerformanceTabProps {
  request: ClockworkRequest
  className?: string
}

export function PerformanceTab({ request, className }: PerformanceTabProps) {
  const webVitals = useMemo(() => {
    const vitals = request.webVitals ?? {}
    return Object.entries(vitals).map(([key, value]) => ({
      key,
      value,
      formatted: typeof value === 'number' ? formatDuration(value) : String(value),
    }))
  }, [request.webVitals])

  const clientMetrics = useMemo(() => {
    const metrics = request.clientMetrics ?? {}
    return Object.entries(metrics).map(([key, value]) => ({
      key,
      value,
      formatted: typeof value === 'number' ? formatDuration(value) : String(value),
    }))
  }, [request.clientMetrics])

  return (
    <div className={cn('space-y-6 p-4', className)}>
      {/* Counter cards */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Performance Overview
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <CounterCard
            label="Duration"
            value={request.responseDuration != null ? formatDuration(request.responseDuration) : 'N/A'}
            icon={<Clock className="h-4 w-4" />}
          />
          <CounterCard
            label="Memory"
            value={request.memoryUsage != null ? formatMemory(request.memoryUsage) : 'N/A'}
            icon={<HardDrive className="h-4 w-4" />}
          />
          <CounterCard
            label="DB Time"
            value={request.databaseDuration != null ? formatDuration(request.databaseDuration) : '0ms'}
            icon={<Database className="h-4 w-4" />}
          />
          <CounterCard
            label="DB Queries"
            value={request.databaseQueriesCount ?? 0}
            icon={<Database className="h-4 w-4" />}
          />
          <CounterCard
            label="Cache Time"
            value={request.cacheTime != null ? formatDuration(request.cacheTime) : '0ms'}
            icon={<Cpu className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Database breakdown */}
      {(request.databaseSelects || request.databaseInserts || request.databaseUpdates || request.databaseDeletes) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Database Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CounterCard label="Selects" value={request.databaseSelects ?? 0} />
            <CounterCard label="Inserts" value={request.databaseInserts ?? 0} />
            <CounterCard label="Updates" value={request.databaseUpdates ?? 0} />
            <CounterCard label="Deletes" value={request.databaseDeletes ?? 0} />
          </div>
          {request.databaseSlowQueries != null && request.databaseSlowQueries > 0 && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              {request.databaseSlowQueries} slow quer{request.databaseSlowQueries !== 1 ? 'ies' : 'y'}
            </div>
          )}
        </div>
      )}

      {/* Cache breakdown */}
      {(request.cacheReads || request.cacheWrites || request.cacheDeletes) && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cache Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CounterCard label="Reads" value={request.cacheReads ?? 0} />
            <CounterCard label="Hits" value={request.cacheHits ?? 0} />
            <CounterCard label="Writes" value={request.cacheWrites ?? 0} />
            <CounterCard label="Deletes" value={request.cacheDeletes ?? 0} />
          </div>
        </div>
      )}

      {/* Web Vitals */}
      {webVitals.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Web Vitals
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {webVitals.map(({ key, formatted }) => (
              <CounterCard
                key={key}
                label={key}
                value={formatted}
                icon={<Gauge className="h-4 w-4" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Client Metrics */}
      {clientMetrics.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Client Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {clientMetrics.map(({ key, formatted }) => (
              <CounterCard
                key={key}
                label={key}
                value={formatted}
                icon={<Activity className="h-4 w-4" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {request.timelineData && request.timelineData.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </h3>
          <TimelineChart events={request.timelineData} />
        </div>
      )}
    </div>
  )
}
