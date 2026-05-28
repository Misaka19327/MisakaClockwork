import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatMemory } from '@/utils/format'
import type { ClockworkRequest } from '@/types/clockwork'
import { Copy, X } from 'lucide-react'
import { useRequestStore } from '@/stores/request-store'
import { MethodBadge } from './shared/method-badge'
import { StatusBadge } from './shared/status-badge'
import { TabBar, type TabDef } from './tab-bar'
import { PerformanceTab } from './tabs/performance-tab'
import { RequestTab } from './tabs/request-tab'
import { LogTab } from './tabs/log-tab'
import { ModelsTab } from './tabs/models-tab'
import { DatabaseTab } from './tabs/database-tab'
import { CacheTab } from './tabs/cache-tab'
import { RedisTab } from './tabs/redis-tab'
import { QueueTab } from './tabs/queue-tab'
import { EventsTab } from './tabs/events-tab'
import { ViewsTab } from './tabs/views-tab'
import { NotificationsTab } from './tabs/notifications-tab'
import { HttpRequestTab } from './tabs/http-requests-tab'
import { ProfilerTab } from './tabs/profiler-tab'

interface RequestDetailProps {
  request: ClockworkRequest | null
  className?: string
}

export function RequestDetail({ request, className }: RequestDetailProps) {
  const [activeTab, setActiveTab] = useState('request')
  const selectRequest = useRequestStore((s) => s.selectRequest)

  const tabs = useMemo(() => {
    if (!request) return []

    const result: TabDef[] = []

    result.push({ id: 'request', label: getRequestTabLabel(request.type) })

    if (hasPerformanceData(request)) {
      result.push({ id: 'performance', label: 'Performance' })
    }

    if (request.log && request.log.length > 0) {
      result.push({ id: 'log', label: 'Log', badge: request.log.length })
    }

    if (request.modelsActions && request.modelsActions.length > 0) {
      result.push({ id: 'models', label: 'Models', badge: request.modelsActions.length })
    }

    if (request.databaseQueries && request.databaseQueries.length > 0) {
      result.push({
        id: 'database',
        label: 'Database',
        badge: request.databaseQueries.length,
      })
    }

    if (request.cacheQueries && request.cacheQueries.length > 0) {
      result.push({ id: 'cache', label: 'Cache', badge: request.cacheQueries.length })
    }

    if (request.redisCommands && request.redisCommands.length > 0) {
      result.push({ id: 'redis', label: 'Redis', badge: request.redisCommands.length })
    }

    if (request.queueJobs && request.queueJobs.length > 0) {
      result.push({ id: 'queue', label: 'Queue', badge: request.queueJobs.length })
    }

    if (request.events && request.events.length > 0) {
      result.push({ id: 'events', label: 'Events', badge: request.events.length })
    }

    if (request.viewsData && request.viewsData.length > 0) {
      result.push({ id: 'views', label: 'Views', badge: request.viewsData.length })
    }

    if (request.notifications && request.notifications.length > 0) {
      result.push({ id: 'notifications', label: 'Notifications', badge: request.notifications.length })
    }

    if (request.httpRequests && request.httpRequests.length > 0) {
      result.push({ id: 'http-requests', label: 'HTTP Requests', badge: request.httpRequests.length })
    }

    if (request.xdebug) {
      result.push({ id: 'profiler', label: 'Profiler' })
    }

    return result
  }, [request])

  // Reset tab if it's no longer valid
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  if (!request) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center bg-background text-muted-foreground/60',
          className,
        )}
      >
        <div className="text-center space-y-1">
          <p className="text-sm">Select a request to view details</p>
          <p className="text-xs text-muted-foreground/40">Click on any item in the list</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-4 py-3">
        <MethodBadge method={request.method} />
        <span className="flex-1 truncate font-mono text-sm text-foreground">
          {request.uri ?? request.url ?? request.commandName ?? request.jobName ?? request.testName ?? request.id}
        </span>
        {request.responseStatus != null && <StatusBadge status={request.responseStatus} />}
        {request.responseDuration != null && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDuration(request.responseDuration)}
          </span>
        )}
        {request.memoryUsage != null && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatMemory(request.memoryUsage)}
          </span>
        )}
        <button
          type="button"
          onClick={() => selectRequest(null)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* UUID row */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-4 py-1.5">
        <span className="text-[11px] text-muted-foreground/60 font-medium">UUID</span>
        <code className="text-[11px] font-mono text-foreground/60 select-all">{request.uuid}</code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(request.uuid)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Copy UUID"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>

      {/* Tab bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'request' && <RequestTab request={request} />}
        {activeTab === 'performance' && <PerformanceTab request={request} />}
        {activeTab === 'log' && request.log && <LogTab messages={request.log} />}
        {activeTab === 'models' && request.modelsActions && (
          <ModelsTab
            actions={request.modelsActions}
            retrieved={request.modelsRetrieved}
            created={request.modelsCreated}
            updated={request.modelsUpdated}
            deleted={request.modelsDeleted}
          />
        )}
        {activeTab === 'database' && request.databaseQueries && (
          <DatabaseTab queries={request.databaseQueries} />
        )}
        {activeTab === 'cache' && request.cacheQueries && (
          <CacheTab queries={request.cacheQueries} />
        )}
        {activeTab === 'redis' && request.redisCommands && (
          <RedisTab commands={request.redisCommands} />
        )}
        {activeTab === 'queue' && request.queueJobs && (
          <QueueTab jobs={request.queueJobs} />
        )}
        {activeTab === 'events' && request.events && (
          <EventsTab events={request.events} />
        )}
        {activeTab === 'views' && request.viewsData && (
          <ViewsTab views={request.viewsData} />
        )}
        {activeTab === 'notifications' && request.notifications && (
          <NotificationsTab notifications={request.notifications} />
        )}
        {activeTab === 'http-requests' && request.httpRequests && (
          <HttpRequestTab requests={request.httpRequests} />
        )}
        {activeTab === 'profiler' && <ProfilerTab xdebug={request.xdebug} />}
      </div>
    </div>
  )
}

function getRequestTabLabel(type: string): string {
  switch (type) {
    case 'command':
      return 'Command'
    case 'queue-job':
      return 'Job'
    case 'test':
      return 'Test'
    default:
      return 'Request'
  }
}

function hasPerformanceData(request: ClockworkRequest): boolean {
  return (
    request.responseDuration != null ||
    request.memoryUsage != null ||
    request.databaseDuration != null ||
    (request.timelineData != null && request.timelineData.length > 0) ||
    (request.webVitals != null && Object.keys(request.webVitals).length > 0) ||
    (request.clientMetrics != null && Object.keys(request.clientMetrics).length > 0) ||
    request.databaseQueriesCount != null
  )
}
