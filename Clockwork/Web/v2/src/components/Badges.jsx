import { useApp } from '../context/AppContext.jsx'
import { statusClass } from '../lib/format.js'
import Icon from './Icon.jsx'

const METHOD_CLASS = { get: 'get', post: 'post', put: 'put', delete: 'delete', patch: 'patch' }
const TYPE_ICON = { request: 'globe', command: 'terminal', 'queue-job': 'queue', test: 'grid' }
const TYPE_LABEL = { request: '请求', command: '命令', 'queue-job': '队列', test: '测试' }
const TYPE_CLASS = { request: 'request', command: 'command', 'queue-job': 'queue', test: 'test' }

// HTTP / status badge. `exit` renders an artisan exit-code style (退出 0).
export function StatusBadge({ status, exit = false, className = 'badge-status' }) {
  const { t } = useApp()
  if (exit) return <span className="p--status exit">{t('退出')} {status}</span>
  if (status === '—' || status == null) return <span className={`${className} s--`}>—</span>
  return <span className={`${className} ${statusClass(status)}`}>{status}</span>
}

export function MethodBadge({ method }) {
  const m = String(method).toLowerCase()
  const cls = METHOD_CLASS[m] || 'cli'
  return <span className={`p--method ${cls}`}>{method}</span>
}

export function TypeBadge({ type, size = 12 }) {
  const { t } = useApp()
  const icon = TYPE_ICON[type]
  const cls = TYPE_CLASS[type] || type
  return (
    <span className={`p--type ${cls}`}>
      {icon && <Icon name={icon} size={size} />}
      <span>{t(TYPE_LABEL[type] || type)}</span>
    </span>
  )
}
