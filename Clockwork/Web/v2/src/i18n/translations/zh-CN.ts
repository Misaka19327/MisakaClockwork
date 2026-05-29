const zhCN = {
  // Types
  'type.request': '请求',
  'type.command': '命令',
  'type.queue-job': '队列',
  'type.test': '测试',

  // List columns
  'column.type': '类型',
  'column.status': '状态码',
  'column.duration': '耗时',
  'column.memory': '内存',
  'column.time': '时间',
  'column.path': '路径',
  'column.method': '方法',
  'column.handler': '处理器',

  // Filters
  'filter.search': '搜索路径、名称...',
  'filter.searchHint': '支持模糊搜索路径、处理器和名称',
  'filter.polling': '轮询',
  'filter.pollingOn': '已开启',
  'filter.pollingOff': '已关闭',
  'filter.active': '已选',
  'filter.clear': '清空',
  'filter.uri': '路径',
  'filter.controller': '处理器',
  'filter.name': '名称',
  'filter.type': '类型',
  'filter.status': '状态码',
  'filter.duration': '耗时',
  'filter.time': '时间',
  'filter.method': '方法',
  'filter.all': '全部',

  // Filter duration options
  'filter.duration.all': '全部耗时',
  'filter.timeStart': '开始时间',
  'filter.timeEnd': '结束时间',
  'filter.duration.fast': '< 100ms',
  'filter.duration.normal': '100ms - 1s',
  'filter.duration.slow': '> 1s',

  // Filter status options
  'filter.status.all': '全部状态',
  'filter.status.2xx': '2xx 成功',
  'filter.status.3xx': '3xx 重定向',
  'filter.status.4xx': '4xx 客户端错误',
  'filter.status.5xx': '5xx 服务端错误',

  // Detail panel
  'detail.close': '关闭',
  'detail.selectToView': '选择一个事件以查看详情',

  // Tabs
  'tab.request': '请求',
  'tab.performance': '性能',
  'tab.log': '日志',
  'tab.models': '模型',
  'tab.database': '数据库',
  'tab.cache': '缓存',
  'tab.redis': 'Redis',
  'tab.queue': '队列',
  'tab.events': '事件',
  'tab.views': '视图',
  'tab.notifications': '通知',
  'tab.httpRequests': 'HTTP 请求',
  'tab.profiler': '性能分析',
  'tab.command': '命令',
  'tab.job': '任务',
  'tab.test': '测试',

  // Footer
  'footer.requests': '{count} 个事件',
  'footer.loading': '加载中...',
  'footer.loadOlder': '加载更多',

  // Settings
  'settings.title': '设置',
  'settings.language': '语言',
  'settings.theme': '主题',
  'settings.appearance': '外观',
  'settings.editor': '编辑器',
  'settings.polling': '轮询',
  'settings.localPathMapping': '本地路径映射',
  'settings.localPathMappingDesc': '将远程路径映射到本地路径以打开文件链接',
  'settings.metadataPath': '元数据路径',
  'settings.metadataPathDesc': 'Clockwork 元数据存储目录路径',
  'settings.save': '保存',
  'settings.cancel': '取消',
  'settings.systemFollow': '(跟随系统设置)',
  'settings.lang.zhCN': '简体中文',
  'settings.lang.enUS': 'English',

  // Status
  'status.success': '成功',
  'status.failed': '失败',
  'status.error': '异常',

  // Badge labels (for collapsed filter)
  'badge.type': '类型',
  'badge.status': '状态码',
  'badge.duration': '耗时',
  'badge.method': '方法',
  'badge.search': '搜索',
  'badge.timeStart': '开始时间',
  'badge.timeEnd': '结束时间',
  'badge.uri': '路径',
  'badge.controller': '处理器',
  'badge.name': '名称',
} as const

export default zhCN
export type TranslationKey = keyof typeof zhCN
