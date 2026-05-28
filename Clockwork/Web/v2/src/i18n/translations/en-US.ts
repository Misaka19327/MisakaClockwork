import type { TranslationKey } from './zh-CN'

const enUS: Record<TranslationKey, string> = {
  // Types
  'type.request': 'Request',
  'type.command': 'Command',
  'type.queue-job': 'Queue',
  'type.test': 'Test',

  // List columns
  'column.type': 'Type',
  'column.status': 'Status',
  'column.duration': 'Duration',
  'column.memory': 'Memory',
  'column.time': 'Time',
  'column.path': 'Path',
  'column.method': 'Method',
  'column.handler': 'Handler',

  // Filters
  'filter.search': 'Search path, name, logs...',
  'filter.type': 'Type',
  'filter.status': 'Status',
  'filter.duration': 'Duration',
  'filter.time': 'Time',
  'filter.method': 'Method',
  'filter.all': 'All',

  // Filter duration options
  'filter.duration.all': 'All durations',
  'filter.timeStart': 'Start',
  'filter.timeEnd': 'End',
  'filter.duration.fast': '< 100ms',
  'filter.duration.normal': '100ms - 1s',
  'filter.duration.slow': '> 1s',

  // Filter status options
  'filter.status.all': 'All statuses',
  'filter.status.2xx': '2xx Success',
  'filter.status.3xx': '3xx Redirect',
  'filter.status.4xx': '4xx Client Error',
  'filter.status.5xx': '5xx Server Error',

  // Detail panel
  'detail.close': 'Close',
  'detail.selectToView': 'Select an event to view details',

  // Tabs
  'tab.request': 'Request',
  'tab.performance': 'Performance',
  'tab.log': 'Log',
  'tab.models': 'Models',
  'tab.database': 'Database',
  'tab.cache': 'Cache',
  'tab.redis': 'Redis',
  'tab.queue': 'Queue',
  'tab.events': 'Events',
  'tab.views': 'Views',
  'tab.notifications': 'Notifications',
  'tab.httpRequests': 'HTTP Requests',
  'tab.profiler': 'Profiler',
  'tab.command': 'Command',
  'tab.job': 'Job',
  'tab.test': 'Test',

  // Footer
  'footer.requests': '{count} events',
  'footer.loading': 'Loading...',
  'footer.loadOlder': 'Load older',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.appearance': 'Appearance',
  'settings.editor': 'Editor',
  'settings.localPathMapping': 'Local Path Mapping',
  'settings.localPathMappingDesc': 'Map remote paths to local paths for file links',
  'settings.metadataPath': 'Metadata Path',
  'settings.metadataPathDesc': 'Path to Clockwork metadata storage directory',
  'settings.save': 'Save',
  'settings.cancel': 'Cancel',
  'settings.systemFollow': '(follows OS setting)',
  'settings.lang.zhCN': '简体中文',
  'settings.lang.enUS': 'English',

  // Status
  'status.success': 'Success',
  'status.failed': 'Failed',
  'status.error': 'Error',

  // Badge labels
  'badge.type': 'Type',
  'badge.status': 'Status',
  'badge.duration': 'Duration',
  'badge.method': 'Method',
  'badge.search': 'Search',
  'badge.timeStart': 'Start',
  'badge.timeEnd': 'End',
}

export default enUS
