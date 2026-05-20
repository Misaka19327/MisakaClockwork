export function formatDuration(ms: number): string {
  if (ms < 1) return `${Math.round(ms * 1000)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatStatus(status?: number): string {
  if (!status) return ''
  return String(status)
}

export function statusColor(status?: number): 'success' | 'warning' | 'error' | 'default' {
  if (!status) return 'default'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'default'
  if (status >= 400 && status < 500) return 'warning'
  return 'error'
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '…'
}
