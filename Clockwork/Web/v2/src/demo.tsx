import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration, formatMemory, formatDateTime, formatDateOnly, formatTimeOnly, truncate } from '@/utils/format'
import { useTranslation } from '@/i18n'
import { I18nProvider } from '@/i18n'
import { useSettingsStore } from '@/stores/settings-store'
import { AlertTriangle, X, Search, Loader2, ArrowDown, Settings } from 'lucide-react'
import { SettingsModal } from '@/components/modals/settings-modal'
import type { ClockworkRequest } from '@/types/clockwork'

// ── Mock data ──
const NOW = Math.floor(Date.now() / 1000)
const mockRequests: ClockworkRequest[] = [
  {
    id: '1', uuid: 'u1', version: 5, type: 'request', time: NOW - 2,
    method: 'GET', uri: '/api/users', url: 'http://localhost/api/users',
    controller: 'App\\Http\\Controllers\\UserController@index',
    responseStatus: 200, responseDuration: 45.3, memoryUsage: 2097152,
  },
  {
    id: '2', uuid: 'u2', version: 5, type: 'request', time: NOW - 5,
    method: 'POST', uri: '/api/orders', url: 'http://localhost/api/orders',
    controller: 'App\\Http\\Controllers\\OrderController@store',
    responseStatus: 201, responseDuration: 1234.5, memoryUsage: 4194304,
  },
  {
    id: '3', uuid: 'u3', version: 5, type: 'request', time: NOW - 10,
    method: 'DELETE', uri: '/api/users/5', url: 'http://localhost/api/users/5',
    controller: 'App\\Http\\Controllers\\UserController@destroy',
    responseStatus: 500, responseDuration: 3450, memoryUsage: 8388608,
    log: [{ message: 'SQLSTATE[23000]: Integrity constraint violation', level: 500, level_name: 'ERROR', time: NOW - 10, exception: 'QueryException' }],
  },
  {
    id: '4', uuid: 'u4', version: 5, type: 'command', time: NOW - 30,
    commandName: 'migrate:status', commandArguments: { '--path': 'database/migrations' },
    commandExitCode: 0, responseDuration: 123456, memoryUsage: 16777216,
  },
  {
    id: '5', uuid: 'u5', version: 5, type: 'command', time: NOW - 60,
    commandName: 'queue:work', commandArguments: { '--queue': 'default', '--tries': '3' },
    commandExitCode: 1, responseDuration: 3600234, memoryUsage: 33554432,
  },
  {
    id: '6', uuid: 'u6', version: 5, type: 'queue-job', time: NOW - 90,
    jobName: 'ProcessPodcast', jobStatus: 'processed',
    responseDuration: 567.8, memoryUsage: 6291456,
  },
  {
    id: '7', uuid: 'u7', version: 5, type: 'queue-job', time: NOW - 120,
    jobName: 'SendNotification', jobStatus: 'failed',
    responseDuration: 15000, memoryUsage: 4194304,
  },
  {
    id: '8', uuid: 'u8', version: 5, type: 'request', time: NOW - 150,
    method: 'PUT', uri: '/api/profile', url: 'http://localhost/api/profile',
    controller: 'App\\Http\\Controllers\\ProfileController@update',
    responseStatus: 302, responseDuration: 89.1, memoryUsage: 2097152,
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
  },
  {
    id: '11', uuid: 'u11', version: 5, type: 'request', time: NOW - 240,
    method: 'PATCH', uri: '/api/settings', url: 'http://localhost/api/settings',
    controller: 'App\\Http\\Controllers\\SettingController@update',
    responseStatus: 422, responseDuration: 12.5, memoryUsage: 1048576,
  },
  {
    id: '12', uuid: 'u12', version: 5, type: 'request', time: NOW - 270,
    method: 'GET', uri: '/api/dashboard', url: 'http://localhost/api/dashboard',
    controller: 'App\\Http\\Controllers\\DashboardController@index',
    responseStatus: 200, responseDuration: 456.7, memoryUsage: 3145728,
  },
]

// ── Shared styles ──
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
const typeBadgeLabels: Record<string, string> = { command: 'CMD', 'queue-job': 'QUEUE', test: 'TEST' }

// ── Helpers ──
function getTypeBadge(req: ClockworkRequest) {
  if (req.type === 'request') {
    const m = req.method?.toUpperCase() ?? ''
    if (m && methodStyles[m]) return { label: m, style: methodStyles[m] }
    return { label: 'REQ', style: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
  }
  return { label: typeBadgeLabels[req.type] ?? req.type.toUpperCase(), style: typeBadgeStyles[req.type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
}

function getStatusDisplay(req: ClockworkRequest) {
  if (req.type === 'request' && req.responseStatus != null) {
    const g = String(Math.floor(req.responseStatus / 100))
    return { text: String(req.responseStatus), style: statusStyles[g] ?? 'text-muted-foreground', hasError: req.responseStatus >= 500 }
  }
  if (req.type === 'command' && req.commandExitCode != null) {
    return { text: String(req.commandExitCode), style: req.commandExitCode === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', hasError: req.commandExitCode !== 0 }
  }
  if (req.type === 'queue-job' && req.jobStatus) {
    const fail = req.jobStatus === 'failed'
    return { text: req.jobStatus, style: fail ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', hasError: fail }
  }
  if (req.type === 'test' && req.testStatus) {
    const fail = req.testStatus === 'failed' || req.testStatus === 'error'
    return { text: req.testStatus, style: fail ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', hasError: fail }
  }
  return null
}

function getHandlerName(req: ClockworkRequest) {
  if (req.controller) return truncate(req.controller.split('@')[0].split('\\').pop() ?? req.controller, 30)
  if (req.commandName) return truncate(req.commandName, 30)
  if (req.jobName) return truncate(req.jobName, 30)
  if (req.testName) return truncate(req.testName, 30)
  return req.id
}

function getPath(req: ClockworkRequest) {
  if (req.type === 'request') return req.uri ?? req.url ?? ''
  if (req.type === 'command') {
    if (req.commandName && req.commandArguments) {
      const args = Object.entries(req.commandArguments).map(([k, v]) => `--${k}=${String(v)}`).join(' ')
      return `${req.commandName} ${args}`
    }
    return req.commandName ?? ''
  }
  if (req.type === 'queue-job') return req.jobDescription ?? req.jobName ?? ''
  if (req.type === 'test') return req.testName ?? ''
  return ''
}

function hasException(req: ClockworkRequest) {
  if (req.responseStatus != null && req.responseStatus >= 500) return true
  if (req.log?.some((l) => l.exception)) return true
  if (req.type === 'command' && req.commandExitCode != null && req.commandExitCode !== 0) return true
  return false
}

// ── Row component ──
function DemoRow({ req, isSelected, onClick, compact }: { req: ClockworkRequest; isSelected: boolean; onClick: () => void; compact: boolean }) {
  const badge = getTypeBadge(req)
  const status = getStatusDisplay(req)
  const handler = getHandlerName(req)
  const path = getPath(req)
  const hasErr = hasException(req)
  const isHttp = req.type === 'request'

  if (compact) {
    return (
      <div onClick={onClick} className={cn('flex cursor-pointer items-center gap-2 border-b border-border/50 px-2 py-1.5 text-sm transition-colors', isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50 border-l-2 border-l-transparent')}>
        <span className={cn('shrink-0 rounded px-1 py-0.5 text-[10px] font-bold', badge.style)}>{badge.label}</span>
        {status && <span className={cn('shrink-0 text-xs font-semibold tabular-nums', status.style)}>{status.text}</span>}
        {hasErr && !status?.hasError && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
        <span className="flex-1 truncate text-foreground text-xs">{handler}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground text-right leading-tight">
          <span className="block">{formatDateOnly(req.time)}</span>
          <span className="block">{formatTimeOnly(req.time)}</span>
        </span>
      </div>
    )
  }

  return (
    <div onClick={onClick} className={cn('flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-1.5 text-sm transition-colors', isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50 border-l-2 border-l-transparent')}>
      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold w-16 text-center', badge.style)}>{badge.label}</span>
      <span className="shrink-0 w-12 text-right">
        {status ? <span className={cn('text-xs font-semibold tabular-nums', status.style)}>{status.text}</span> : <span className="text-xs text-muted-foreground">-</span>}
        {hasErr && !status?.hasError && <AlertTriangle className="inline ml-0.5 h-3 w-3 text-red-500" />}
      </span>
      <span className="shrink-0 w-20 text-xs tabular-nums text-muted-foreground">{req.responseDuration != null ? formatDuration(req.responseDuration) : '-'}</span>
      <span className="shrink-0 w-16 text-xs tabular-nums text-muted-foreground">{req.memoryUsage != null ? formatMemory(req.memoryUsage) : '-'}</span>
      <span className="shrink-0 w-36 text-xs tabular-nums text-muted-foreground">{formatDateTime(req.time)}</span>
      <span className="flex-1 truncate text-xs text-foreground/80" title={path}>{path || '-'}</span>
      <span className="shrink-0 w-16 text-left">
        {isHttp && req.method ? <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-bold', methodStyles[req.method.toUpperCase()] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300')}>{req.method.toUpperCase()}</span> : <span className="text-xs text-muted-foreground">-</span>}
      </span>
      <span className="shrink-0 w-60 truncate text-xs font-medium text-foreground" title={handler}>{handler}</span>
    </div>
  )
}

// ── Filter bar ──
function DemoFilterBar({ search, onSearchChange, typeFilter, onTypeChange, statusFilter, onStatusChange, durationFilter, onDurationChange, methodFilter, onMethodChange, timeStart, onTimeStartChange, timeEnd, onTimeEndChange, onClear, hasAny }: {
  search: string; onSearchChange: (v: string) => void;
  typeFilter: string; onTypeChange: (v: string) => void;
  statusFilter: string; onStatusChange: (v: string) => void;
  durationFilter: string; onDurationChange: (v: string) => void;
  methodFilter: string; onMethodChange: (v: string) => void;
  timeStart: string; onTimeStartChange: (v: string) => void;
  timeEnd: string; onTimeEndChange: (v: string) => void;
  onClear: () => void; hasAny: boolean;
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1.5 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={t('filter.search')} className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
      </div>
      <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none cursor-pointer">
        <option value="">{t('filter.type')}</option>
        <option value="request">{t('type.request')}</option>
        <option value="command">{t('type.command')}</option>
        <option value="queue-job">{t('type.queue-job')}</option>
        <option value="test">{t('type.test')}</option>
      </select>
      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none cursor-pointer">
        <option value="">{t('filter.status')}</option>
        <option value="2">{t('filter.status.2xx')}</option>
        <option value="3">{t('filter.status.3xx')}</option>
        <option value="4">{t('filter.status.4xx')}</option>
        <option value="5">{t('filter.status.5xx')}</option>
      </select>
      <select value={durationFilter} onChange={(e) => onDurationChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none cursor-pointer">
        <option value="">{t('filter.duration')}</option>
        <option value="fast">{t('filter.duration.fast')}</option>
        <option value="normal">{t('filter.duration.normal')}</option>
        <option value="slow">{t('filter.duration.slow')}</option>
      </select>
      <select value={methodFilter} onChange={(e) => onMethodChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none cursor-pointer">
        <option value="">{t('filter.method')}</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
      <input type="datetime-local" value={timeStart} onChange={(e) => onTimeStartChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring cursor-pointer" title={t('filter.timeStart')} />
      <span className="text-xs text-muted-foreground">~</span>
      <input type="datetime-local" value={timeEnd} onChange={(e) => onTimeEndChange(e.target.value)} className="shrink-0 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring cursor-pointer" title={t('filter.timeEnd')} />
      {hasAny && (
        <button type="button" onClick={onClear} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ── Detail panel ──
function DemoDetail({ req, onClose }: { req: ClockworkRequest; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        <span className="flex-1 truncate font-mono text-sm text-foreground">{req.uri ?? req.url ?? req.commandName ?? req.jobName ?? req.testName}</span>
        {req.responseStatus != null && <span className={cn('text-xs font-semibold tabular-nums', statusStyles[String(Math.floor(req.responseStatus / 100))] ?? '')}>{req.responseStatus}</span>}
        {req.responseDuration != null && <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(req.responseDuration)}</span>}
        {req.memoryUsage != null && <span className="text-xs tabular-nums text-muted-foreground">{formatMemory(req.memoryUsage)}</span>}
        <button type="button" onClick={onClose} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{req.id}</span></div>
          <div><span className="text-muted-foreground">UUID:</span> <span className="font-mono text-xs">{req.uuid}</span></div>
          <div><span className="text-muted-foreground">Type:</span> {req.type}</div>
          <div><span className="text-muted-foreground">Time:</span> {formatDateTime(req.time)}</div>
          {req.controller && <div className="col-span-2"><span className="text-muted-foreground">Controller:</span> {req.controller}</div>}
          {req.commandName && <div className="col-span-2"><span className="text-muted-foreground">Command:</span> {req.commandName}</div>}
          {req.uri && <div className="col-span-2"><span className="text-muted-foreground">URI:</span> {req.uri}</div>}
          {req.responseDuration != null && <div><span className="text-muted-foreground">Duration:</span> {formatDuration(req.responseDuration)}</div>}
          {req.memoryUsage != null && <div><span className="text-muted-foreground">Memory:</span> {formatMemory(req.memoryUsage)}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Badge tags (compact mode) ──
function DemoFilterBadges({ search, typeFilter, statusFilter, durationFilter, methodFilter }: {
  search: string; typeFilter: string; statusFilter: string; durationFilter: string; methodFilter: string;
}) {
  const { t } = useTranslation()
  const badges: { key: string; value: string }[] = []
  if (search) badges.push({ key: 'search', value: search })
  if (typeFilter) badges.push({ key: 'type', value: typeFilter })
  if (statusFilter) badges.push({ key: 'status', value: statusFilter })
  if (durationFilter) badges.push({ key: 'duration', value: durationFilter })
  if (methodFilter) badges.push({ key: 'method', value: methodFilter })
  if (badges.length === 0) return null

  const colors: Record<string, string> = {
    type: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    status: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    duration: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    method: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    search: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  }

  return (
    <div className="flex flex-wrap gap-1 overflow-hidden max-h-6">
      {badges.map(({ key, value }) => (
        <span key={key} className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', colors[key] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300')}>
          <span className="opacity-60">{key}：</span>{value}
        </span>
      ))}
    </div>
  )
}

// ── Main demo ──
export default function DemoPage() {
  const locale = useSettingsStore((s) => s.locale)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <I18nProvider locale={locale}>
      <DemoInner onSettingsOpen={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </I18nProvider>
  )
}

function DemoInner({ onSettingsOpen }: { onSettingsOpen: () => void }) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [durationFilter, setDurationFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  const defaultRange = (() => {
    const now = new Date()
    const ago = new Date(now.getTime() - 3600000)
    const p = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    return { start: p(ago), end: p(now) }
  })()
  const [timeStart, setTimeStart] = useState(defaultRange.start)
  const [timeEnd, setTimeEnd] = useState(defaultRange.end)

  const [leftWidth, setLeftWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(false)

  const expanded = selectedId === null

  // Filter logic
  const filtered = mockRequests.filter((req) => {
    if (typeFilter && req.type !== typeFilter) return false
    if (statusFilter) {
      if (req.type === 'request') {
        if (req.responseStatus == null || String(Math.floor(req.responseStatus / 100)) !== statusFilter) return false
      } else {
        return false
      }
    }
    if (durationFilter && req.responseDuration != null) {
      if (durationFilter === 'fast' && req.responseDuration >= 100) return false
      if (durationFilter === 'normal' && (req.responseDuration < 100 || req.responseDuration >= 1000)) return false
      if (durationFilter === 'slow' && req.responseDuration < 1000) return false
    }
    if (methodFilter && (req.method?.toUpperCase() !== methodFilter)) return false
    if (timeStart || timeEnd) {
      const reqDate = new Date(req.time * 1000)
      if (timeStart && reqDate < new Date(timeStart)) return false
      if (timeEnd && reqDate > new Date(timeEnd)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const haystack = [req.uri, req.url, req.controller, req.commandName, req.jobName, req.testName, req.log?.map((l) => l.message).join(' ')].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const selectedReq = mockRequests.find((r) => r.id === selectedId) ?? null
  const hasAnyFilter = search || typeFilter || statusFilter || durationFilter || methodFilter || timeStart !== defaultRange.start || timeEnd !== defaultRange.end

  const clearFilters = () => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setDurationFilter(''); setMethodFilter(''); setTimeStart(defaultRange.start); setTimeEnd(defaultRange.end) }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (expanded) return
    e.preventDefault()
    setIsDragging(true)
    const handleMove = (ev: MouseEvent) => {
      const w = Math.min(500, Math.max(280, ev.clientX))
      setLeftWidth(w)
    }
    const handleUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <div className="shrink-0 flex items-center border-b border-border px-4 h-9">
        <span className="text-sm font-semibold tracking-tight">MisakaClockWork</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSettingsOpen}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}
        <div
          className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out flex flex-col border-r border-border bg-sidebar-background"
          style={{ width: expanded ? '100%' : leftWidth }}
        >
          {/* Header */}
          <div className="shrink-0 border-b border-border p-2 space-y-1.5">
            {!expanded ? (
              <DemoFilterBadges search={search} typeFilter={typeFilter} statusFilter={statusFilter} durationFilter={durationFilter} methodFilter={methodFilter} />
            ) : (
              <DemoFilterBar
                search={search} onSearchChange={setSearch}
                typeFilter={typeFilter} onTypeChange={setTypeFilter}
                statusFilter={statusFilter} onStatusChange={setStatusFilter}
                durationFilter={durationFilter} onDurationChange={setDurationFilter}
                methodFilter={methodFilter} onMethodChange={setMethodFilter}
                timeStart={timeStart} onTimeStartChange={setTimeStart}
                timeEnd={timeEnd} onTimeEndChange={setTimeEnd}
                onClear={clearFilters} hasAny={!!hasAnyFilter}
              />
            )}
          </div>

          {/* Column headers */}
          {expanded && (
            <div className="shrink-0 flex items-center gap-3 border-b border-border px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              <span className="w-16 text-center">{t('column.type')}</span>
              <span className="w-12 text-right">{t('column.status')}</span>
              <span className="w-20">{t('column.duration')}</span>
              <span className="w-16">{t('column.memory')}</span>
              <span className="w-36">{t('column.time')}</span>
              <span className="flex-1">{t('column.path')}</span>
              <span className="w-16">{t('column.method')}</span>
              <span className="w-60">{t('column.handler')}</span>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-auto">
            {filtered.map((req) => (
              <DemoRow key={req.id} req={req} isSelected={selectedId === req.id} onClick={() => setSelectedId(req.id)} compact={!expanded} />
            ))}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">No matching events</div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-3 py-1 text-xs text-muted-foreground">
            {t('footer.requests', { count: filtered.length }).replace('{count}', String(filtered.length))}
          </div>
        </div>

        {/* Divider */}
        {!expanded && (
          <div
            className="shrink-0 w-[1px] bg-border cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors relative"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}

        {/* Right panel */}
        {!expanded && (
          <div className="flex-1 overflow-hidden">
            {selectedReq ? (
              <DemoDetail req={selectedReq} onClose={() => setSelectedId(null)} />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p className="text-sm">{t('detail.selectToView')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
