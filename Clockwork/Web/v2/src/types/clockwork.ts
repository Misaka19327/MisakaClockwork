export type RequestType = 'request' | 'command' | 'queue-job' | 'test'

export interface DatabaseQuery {
  requestUuid?: string
  query: string
  bindings?: any[]
  duration: number
  result?: any
  resultAvailable?: boolean
  resultUnavailableReason?: string | null
  connection: string
  time: number
  file?: string
  line?: number
  trace?: any[]
  model?: string | null
  tags?: string[]
  shortQuery?: string
  shortModel?: string
  prettifiedQuery?: string
}

export interface CacheQuery {
  requestUuid?: string
  type: string
  key: string
  value?: any
  result?: any
  resultAvailable?: boolean
  resultUnavailableReason?: string | null
  duration: number
  connection: string
  time: number
  file?: string
  line?: number
  trace?: any[]
  expiration?: number | null
}

export interface ModelAction {
  requestUuid?: string
  model: string
  key?: string | null
  action: 'retrieved' | 'created' | 'updated' | 'deleted'
  attributes?: Record<string, any>
  changes?: Record<string, any>
  duration?: number | null
  time: number
  query?: string | null
  connection?: string | null
  trace?: any[]
  file?: string
  line?: number
  tags?: string[]
}

export interface TimelineEvent {
  description: string
  start: number
  end: number
  duration: number
  data?: Record<string, any>
  color?: string | null
}

export interface LogMessage {
  message: string
  context?: Record<string, any>
  level: number
  level_name: string
  time: number
  exception?: string | null
  file?: string
  line?: number
  trace?: any[]
}

export interface EventEntry {
  event: string
  data?: any
  duration?: number
  time: number
  listeners?: string[]
  file?: string
  line?: number
  trace?: any[]
}

export interface RouteEntry {
  method: string
  uri: string
  action: string
  name?: string | null
  middleware?: string[]
  before?: string[]
  after?: string[]
}

export interface NotificationEntry {
  title?: string
  subject?: string
  to?: string | string[]
  from?: string
  type?: string
  data?: any
  time?: number
}

export interface ViewData {
  view: string
  data?: Record<string, any>
  time?: number
  duration?: number
}

export interface HttpRequestEntry {
  requestUuid?: string
  method: string
  url: string
  request?: { headers?: Record<string, string>; body?: any }
  response?: { status?: number; headers?: Record<string, string>; body?: any }
  duration?: number
  time?: number
  result?: any
  resultAvailable?: boolean
  resultUnavailableReason?: string | null
}

export interface QueueJob {
  name: string
  description?: string
  data?: any
  queue?: string
  connection?: string
  time?: number
  duration?: number
  status?: string
  options?: Record<string, any>
}

export interface RedisCommand {
  command: string
  parameters?: any[]
  duration?: number
  time?: number
  connection?: string
  key?: string
  result?: any
  resultAvailable?: boolean
  resultUnavailableReason?: string | null
}

export interface TestAssert {
  name?: string
  file?: string
  line?: number
  pass?: boolean
}

export interface Subrequest {
  url: string
  id: string
  path?: string
}

export interface ClockworkRequest {
  id: string
  uuid: string
  version: number
  type: RequestType
  time: number
  method?: string
  url?: string
  uri?: string
  headers?: Record<string, string | string[]>
  controller?: string
  getData?: Record<string, any>
  postData?: Record<string, any>
  requestData?: Record<string, any>
  sessionData?: Record<string, any>
  authenticatedUser?: { id: string; username: string; email?: string; name?: string } | null
  cookies?: Record<string, string>
  responseTime?: number
  responseStatus?: number
  responseDuration?: number
  memoryUsage?: number
  middleware?: string[]
  databaseQueries?: DatabaseQuery[]
  databaseQueriesCount?: number
  databaseSlowQueries?: number
  databaseSelects?: number
  databaseInserts?: number
  databaseUpdates?: number
  databaseDeletes?: number
  databaseOthers?: number
  databaseDuration?: number
  cacheQueries?: CacheQuery[]
  cacheReads?: number
  cacheHits?: number
  cacheWrites?: number
  cacheDeletes?: number
  cacheTime?: number
  modelsActions?: ModelAction[]
  modelsRetrieved?: Record<string, number>
  modelsCreated?: Record<string, number>
  modelsUpdated?: Record<string, number>
  modelsDeleted?: Record<string, number>
  redisCommands?: RedisCommand[]
  queueJobs?: QueueJob[]
  timelineData?: TimelineEvent[]
  log?: LogMessage[]
  events?: EventEntry[]
  routes?: RouteEntry[]
  notifications?: NotificationEntry[]
  emailsData?: any[]
  viewsData?: ViewData[]
  userData?: any[]
  httpRequests?: HttpRequestEntry[]
  subrequests?: Subrequest[]
  xdebug?: any
  commandName?: string
  commandArguments?: Record<string, any>
  commandArgumentsDefaults?: Record<string, any>
  commandOptions?: Record<string, any>
  commandOptionsDefaults?: Record<string, any>
  commandExitCode?: number
  commandOutput?: string
  jobName?: string
  jobDescription?: string
  jobStatus?: string
  jobPayload?: any
  jobQueue?: string
  jobConnection?: string
  jobOptions?: Record<string, any>
  testName?: string
  testStatus?: string
  testStatusMessage?: string
  testAsserts?: TestAssert[]
  clientMetrics?: Record<string, number>
  webVitals?: Record<string, number>
  parent?: { id: string; uuid?: string; url?: string; path?: string } | null
  updateToken?: string
}

export interface SearchFilters {
  search?: string
  uri?: string[]
  controller?: string[]
  method?: string[]
  status?: string[]
  durationRange?: string
  timeStart?: string
  timeEnd?: string
  type?: string[]
  name?: string[]
  received?: string[]
  time?: string[]
}

export interface EventDetails {
  entrypoint?: any
  parameters?: any
  response?: any
  errors?: any
  externalAccess?: any
  context?: any
  raw?: any
}

export type ThemeMode = 'light' | 'dark' | 'system'
