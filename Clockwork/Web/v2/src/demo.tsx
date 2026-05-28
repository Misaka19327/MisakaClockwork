import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useRequestStore } from '@/stores/request-store'
import { useSettingsStore } from '@/stores/settings-store'
import { SplitView } from '@/components/layout/split-view'
import { RequestList } from '@/components/request-list/request-list'
import { RequestDetail } from '@/components/request-detail/request-detail'
import { SettingsModal } from '@/components/modals/settings-modal'
import { I18nProvider } from '@/i18n'
import type { ClockworkRequest } from '@/types/clockwork'

const NOW = Math.floor(Date.now() / 1000)
const mockRequests: ClockworkRequest[] = [
  {
    id: '1', uuid: 'u1', version: 5, type: 'request', time: NOW - 2,
    method: 'GET', uri: '/api/users', url: 'http://localhost/api/users',
    controller: 'App\\Http\\Controllers\\UserController@index',
    responseStatus: 200, responseDuration: 45.3, memoryUsage: 2097152,
    databaseQueries: [
      { query: 'SELECT * FROM `users` WHERE `active` = ?', bindings: [1], duration: 12.5, connection: 'mysql', time: NOW - 2 },
      { query: 'SELECT COUNT(*) FROM `users`', bindings: [], duration: 3.1, connection: 'mysql', time: NOW - 2 },
    ],
    log: [
      { message: 'User list loaded successfully', level: 200, level_name: 'INFO', time: NOW - 2 },
    ],
  },
  {
    id: '2', uuid: 'u2', version: 5, type: 'request', time: NOW - 5,
    method: 'POST', uri: '/api/orders', url: 'http://localhost/api/orders',
    controller: 'App\\Http\\Controllers\\OrderController@store',
    responseStatus: 201, responseDuration: 1234.5, memoryUsage: 4194304,
    databaseQueries: [
      { query: 'INSERT INTO `orders` (`user_id`, `total`, `updated_at`, `created_at`) VALUES (?, ?, ?, ?)', bindings: [1, 99.99, '2026-05-26 10:00:00', '2026-05-26 10:00:00'], duration: 45.2, connection: 'mysql', time: NOW - 5 },
      { query: 'UPDATE `users` SET `last_order_at` = ? WHERE `id` = ?', bindings: ['2026-05-26 10:00:00', 1], duration: 8.3, connection: 'mysql', time: NOW - 5 },
    ],
    log: [
      { message: 'Order created successfully', level: 200, level_name: 'INFO', time: NOW - 5 },
      { message: 'Payment processing started', level: 200, level_name: 'INFO', time: NOW - 5 },
    ],
  },
  {
    id: '3', uuid: 'u3', version: 5, type: 'request', time: NOW - 10,
    method: 'DELETE', uri: '/api/users/5', url: 'http://localhost/api/users/5',
    controller: 'App\\Http\\Controllers\\UserController@destroy',
    responseStatus: 500, responseDuration: 3450, memoryUsage: 8388608,
    log: [
      { message: 'SQLSTATE[23000]: Integrity constraint violation: Cannot delete or update a parent row', level: 500, level_name: 'ERROR', time: NOW - 10, exception: 'QueryException' },
      { message: 'Rollback transaction', level: 300, level_name: 'WARNING', time: NOW - 10 },
    ],
    databaseQueries: [
      { query: 'DELETE FROM `users` WHERE `id` = ?', bindings: [5], duration: 3200, connection: 'mysql', time: NOW - 10 },
    ],
  },
  {
    id: '4', uuid: 'u4', version: 5, type: 'command', time: NOW - 30,
    commandName: 'migrate:status', commandArguments: { '--path': 'database/migrations' },
    commandExitCode: 0, responseDuration: 123456, memoryUsage: 16777216,
    log: [
      { message: 'Checking migration status...', level: 200, level_name: 'INFO', time: NOW - 30 },
    ],
  },
  {
    id: '5', uuid: 'u5', version: 5, type: 'command', time: NOW - 60,
    commandName: 'queue:work', commandArguments: { '--queue': 'default', '--tries': '3' },
    commandExitCode: 1, responseDuration: 3600234, memoryUsage: 33554432,
    log: [
      { message: 'Queue worker started', level: 200, level_name: 'INFO', time: NOW - 60 },
      { message: 'Processing job ProcessPodcast failed after 3 attempts', level: 500, level_name: 'ERROR', time: NOW - 45, exception: 'RuntimeException' },
    ],
  },
  {
    id: '6', uuid: 'u6', version: 5, type: 'queue-job', time: NOW - 90,
    jobName: 'ProcessPodcast', jobStatus: 'processed',
    responseDuration: 567.8, memoryUsage: 6291456,
    databaseQueries: [
      { query: 'SELECT * FROM `podcasts` WHERE `id` = ? LIMIT 1', bindings: [42], duration: 5.2, connection: 'mysql', time: NOW - 90 },
      { query: 'UPDATE `podcasts` SET `processed_at` = ? WHERE `id` = ?', bindings: ['2026-05-26 09:58:00', 42], duration: 3.8, connection: 'mysql', time: NOW - 90 },
    ],
  },
  {
    id: '7', uuid: 'u7', version: 5, type: 'queue-job', time: NOW - 120,
    jobName: 'SendNotification', jobStatus: 'failed',
    responseDuration: 15000, memoryUsage: 4194304,
    log: [
      { message: 'SMTP connection timed out after 15 seconds', level: 500, level_name: 'ERROR', time: NOW - 120, exception: 'Swift_TransportException' },
    ],
  },
  {
    id: '8', uuid: 'u8', version: 5, type: 'request', time: NOW - 150,
    method: 'PUT', uri: '/api/profile', url: 'http://localhost/api/profile',
    controller: 'App\\Http\\Controllers\\ProfileController@update',
    responseStatus: 302, responseDuration: 89.1, memoryUsage: 2097152,
    databaseQueries: [
      { query: 'UPDATE `users` SET `name` = ?, `email` = ? WHERE `id` = ?', bindings: ['John', 'john@example.com', 1], duration: 12.3, connection: 'mysql', time: NOW - 150 },
    ],
  },
  {
    id: '9', uuid: 'u9', version: 5, type: 'test', time: NOW - 180,
    testName: 'Tests\\Feature\\UserTest::test_can_create_user',
    testStatus: 'passed', responseDuration: 234, memoryUsage: 5242880,
  },
  {
    id: '10', uuid: 'u10', version: 5, type: 'test', time: NOW - 210,
    testName: 'Tests\\Feature\\OrderTest::test_order_validation',
    testStatus: 'failed', responseDuration: 1567, memoryUsage: 6291456,
    log: [
      { message: 'Failed asserting that 422 equals 400', level: 500, level_name: 'ERROR', time: NOW - 210 },
    ],
  },
  {
    id: '11', uuid: 'u11', version: 5, type: 'request', time: NOW - 240,
    method: 'PATCH', uri: '/api/settings', url: 'http://localhost/api/settings',
    controller: 'App\\Http\\Controllers\\SettingController@update',
    responseStatus: 422, responseDuration: 12.5, memoryUsage: 1048576,
    log: [
      { message: 'Validation failed: The theme field is required', level: 300, level_name: 'WARNING', time: NOW - 240 },
    ],
  },
  {
    id: '12', uuid: 'u12', version: 5, type: 'request', time: NOW - 270,
    method: 'GET', uri: '/api/dashboard', url: 'http://localhost/api/dashboard',
    controller: 'App\\Http\\Controllers\\DashboardController@index',
    responseStatus: 200, responseDuration: 456.7, memoryUsage: 3145728,
    databaseQueries: [
      { query: 'SELECT COUNT(*) FROM `orders` WHERE `created_at` >= ?', bindings: ['2026-05-01'], duration: 15.6, connection: 'mysql', time: NOW - 270 },
      { query: 'SELECT SUM(`total`) FROM `orders` WHERE `created_at` >= ?', bindings: ['2026-05-01'], duration: 18.2, connection: 'mysql', time: NOW - 270 },
      { query: 'SELECT * FROM `notifications` WHERE `user_id` = ? AND `read_at` IS NULL ORDER BY `created_at` DESC LIMIT 5', bindings: [1], duration: 6.7, connection: 'mysql', time: NOW - 270 },
    ],
    cacheQueries: [
      { type: 'read', key: 'dashboard:stats:1', value: 'cached', duration: 0.3, connection: 'redis', time: NOW - 270 },
      { type: 'write', key: 'dashboard:stats:1', value: 'serialized_data', duration: 0.5, connection: 'redis', time: NOW - 270 },
    ],
    log: [
      { message: 'Dashboard rendered', level: 200, level_name: 'INFO', time: NOW - 270 },
    ],
  },
]

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useDarkMode()
  return <>{children}</>
}

export default function DemoPage() {
  const selectedId = useRequestStore((s) => s.selectedId)
  const setRequests = useRequestStore((s) => s.setRequests)

  useEffect(() => {
    setRequests(mockRequests)
  }, [setRequests])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutInner expanded={selectedId === null} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function LayoutInner({ expanded }: { expanded: boolean }) {
  const locale = useSettingsStore((s) => s.locale)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <I18nProvider locale={locale}>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
        {/* Top bar */}
        <div className="shrink-0 flex items-center border-b border-border/70 px-4 h-10 bg-sidebar-background/50">
          <span className="text-[13px] font-semibold tracking-tight text-foreground/90">MisakaClockWork</span>
          <span className="ml-2 text-[10px] font-medium text-muted-foreground/60 bg-muted/50 rounded px-1.5 py-0.5">DEMO</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          <SplitView
            leftPanel={<LeftPanel expanded={expanded} />}
            rightPanel={<RightPanel />}
            expanded={expanded}
          />
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </I18nProvider>
  )
}

function LeftPanel({ expanded }: { expanded: boolean }) {
  const requests = useRequestStore((s) => s.requests)
  const selectedId = useRequestStore((s) => s.selectedId)
  const selectRequest = useRequestStore((s) => s.selectRequest)
  const searchFilters = useRequestStore((s) => s.searchFilters)
  const setSearchFilters = useRequestStore((s) => s.setSearchFilters)

  return (
    <RequestList
      requests={requests}
      selectedId={selectedId}
      onSelectRequest={(req) => selectRequest(req.id)}
      onLoadOlder={() => {}}
      isLoading={false}
      hasMore={false}
      filters={searchFilters}
      onFiltersChange={setSearchFilters}
      compact={!expanded}
    />
  )
}

function RightPanel() {
  const selectedId = useRequestStore((s) => s.selectedId)
  const requests = useRequestStore((s) => s.requests)
  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null
  return <RequestDetail request={selectedRequest} />
}
